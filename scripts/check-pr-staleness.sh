#!/usr/bin/env bash
# scripts/check-pr-staleness.sh
# stale PR（base が古い並列セッション製 PR）による「巻き戻しマージ」を機械検知する。
#
# 背景: 2026-06-09〜10 に base が古い PR #404/#405 を squash 済み main へ再マージし、
# 記事の磨き込みが巻き戻るインシデントが発生（AGENT_LEARNINGS 2026-06-10）。
# `gh pr` 上の diff は「head の base に対する差分」なので、base が現 main からズレていると
# 実害（巻き戻し）を隠す。本スクリプトは merge を実際にシミュレートして検知する。
#
# 使い方:
#   bash scripts/check-pr-staleness.sh <PR番号 | ブランチ名>
#   npm run check:pr-staleness -- <PR番号 | ブランチ名>
#
# 判定ロジック:
#   1. PR 番号なら `gh pr view` で head branch と state を取得（state != OPEN なら何もしない）
#   2. `git fetch origin main <branch>` 後、merge-base を計算
#   3. behind（merge-base から origin/main までのコミット数）と、
#      「PR が触るファイル ∩ main 側が merge-base 以降に触ったファイル」の重なりを報告
#   4. 巻き戻し検知（本命）: `git merge-tree --write-tree` でマージ結果ツリーを合成し、
#      `git diff origin/main <merged-tree>` で「マージによって main から消える行」を抽出。
#      巻き戻し候補行は 2 種類に分けて扱う:
#        (a) merge-base 以降に main へ入った行 — 消えたら無条件で巻き戻し候補
#        (b) merge-base 以前（直近 MAIN_LOOKBACK commits 内）に main へ入った行 —
#            PR のベースに既に存在するため「PR が意図的に削除・改稿した行」も含まれる。
#            これ単独では巻き戻しと断定できない（2026-07-19 #456/#459 等の誤検知源）。
#            そこで「マージ結果が、main が直近削除した古い行を復活させている」
#            （= resurrection。古い作業コピーによる上書きの痕跡）場合に限り (b) を数える。
#      一致 = マージすると main の新しい内容が過去へ戻る = 巻き戻し。
#      ※ base が古くても git の 3-way merge が main 側変更を保持するケースは CLEAN と判定する
#        （実際に巻き戻らないため）。逆に「PR 自体が古い本文を丸ごと commit している」#404 型は
#        merge-base が新しくても、(b) + resurrection の組で検知できる。
#
# 終了コード:
#   0 = CLEAN、または WARN（判定困難・軽微な兆候。誤検知で運用を止めない）
#   1 = STALE 疑い（巻き戻し行を閾値以上検出）
#   2 = 使い方エラー
#
# 環境変数:
#   BASE_BRANCH            比較先ブランチ（デフォルト: main）
#   REMOTE                 リモート名（デフォルト: origin）。fixture テスト等では NO_FETCH=1 と併用
#   NO_FETCH               "1" で fetch を省略しローカル ref のみで判定（テスト用）
#   BEHIND_WARN            behind コミット数の WARN 閾値（デフォルト: 10）
#   ROLLBACK_FAIL_MATCHES  巻き戻し一致行数の FAIL 閾値（デフォルト: 2。1 行は WARN 止まり）
#   MIN_LINE_LEN           一致判定に使う行の最小文字数（デフォルト: 4。短い定型行のノイズ除去）
#   MAIN_LOOKBACK          「main の直近追加行」を集める遡りコミット数（デフォルト: 30）
#   RESURRECT_MIN          lookback 由来の一致を巻き戻しに数えるのに必要な「復活行」数（デフォルト: 1）

set -euo pipefail

# sort/comm の行比較をバイト単位に固定する。UTF-8 ロケールの collation では日本語行同士が
# 「等しい」と誤判定され、comm -12 が無関係な行を一致扱いする（2026-07-19 誤検知の一因）。
# 副作用: normalize の MIN_LINE_LEN はバイト長判定になる（CJK は 1 文字 3 バイト。短行ノイズ
# 除去という目的に対しては安全側）。
export LC_ALL=C

BASE_BRANCH="${BASE_BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
NO_FETCH="${NO_FETCH:-0}"
BEHIND_WARN="${BEHIND_WARN:-10}"
ROLLBACK_FAIL_MATCHES="${ROLLBACK_FAIL_MATCHES:-2}"
MIN_LINE_LEN="${MIN_LINE_LEN:-4}"
MAIN_LOOKBACK="${MAIN_LOOKBACK:-30}"
RESURRECT_MIN="${RESURRECT_MIN:-1}"

TAG="[check-pr-staleness]"

usage() {
  echo "usage: $0 <PR番号 | ブランチ名>" >&2
  exit 2
}

warn_exit() {
  echo "$TAG ⚠️ WARN: $1" >&2
  echo "$TAG 手動確認: git diff ${BASE_REF:-origin/$BASE_BRANCH}...${HEAD_REF:-<branch>} --stat" >&2
  exit 0
}

[ $# -ge 1 ] || usage
TARGET="$1"

# --- 1. PR 番号 → head branch 解決 ---------------------------------------
BRANCH="$TARGET"
if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    warn_exit "gh CLI が無く PR #$TARGET を解決できません。ブランチ名で再実行してください"
  fi
  PR_JSON=$(gh pr view "$TARGET" --json headRefName,state,baseRefName 2>/dev/null) \
    || warn_exit "gh pr view #$TARGET に失敗（存在しない/権限/ネットワーク）。ブランチ名で再実行してください"
  command -v jq >/dev/null 2>&1 \
    || warn_exit "jq が無く PR JSON を解析できません。ブランチ名で再実行してください"
  STATE=$(jq -r '.state // empty' <<<"$PR_JSON")
  BRANCH=$(jq -r '.headRefName // empty' <<<"$PR_JSON")
  PR_BASE=$(jq -r '.baseRefName // empty' <<<"$PR_JSON")
  if [ "$STATE" != "OPEN" ]; then
    echo "$TAG PR #$TARGET は state=${STATE}（OPEN ではない）。何もしません（並列セッションが処理済みの可能性）"
    exit 0
  fi
  if [ -n "$PR_BASE" ] && [ "$PR_BASE" != "$BASE_BRANCH" ]; then
    echo "$TAG note: PR の base は '$PR_BASE'（BASE_BRANCH=$BASE_BRANCH と異なる）。BASE_BRANCH=$PR_BASE で再実行を推奨"
  fi
  echo "$TAG PR #$TARGET → head branch: $BRANCH"
fi

# --- 2. fetch と ref 解決 --------------------------------------------------
if [ "$NO_FETCH" != "1" ]; then
  git fetch -q "$REMOTE" "$BASE_BRANCH" "$BRANCH" 2>/dev/null \
    || echo "$TAG ⚠️ fetch に失敗。ローカル ref で判定を続行（結果が古い可能性）" >&2
fi

resolve_ref() { # $1=remote候補 $2=local候補
  if git rev-parse --verify -q "$1" >/dev/null; then echo "$1"
  elif git rev-parse --verify -q "$2" >/dev/null; then echo "$2"
  else echo ""; fi
}
BASE_REF=$(resolve_ref "$REMOTE/$BASE_BRANCH" "$BASE_BRANCH")
HEAD_REF=$(resolve_ref "$REMOTE/$BRANCH" "$BRANCH")
[ -n "$BASE_REF" ] || warn_exit "base ref を解決できません（$REMOTE/$BASE_BRANCH / $BASE_BRANCH とも不在）"
[ -n "$HEAD_REF" ] || warn_exit "head ref を解決できません（branch '$BRANCH' が見つからない）"

MB=$(git merge-base "$BASE_REF" "$HEAD_REF") \
  || warn_exit "merge-base を計算できません（履歴が独立している可能性）"

# --- 3. behind とファイル重なり -------------------------------------------
BEHIND=$(git rev-list --count "$MB..$BASE_REF")
AHEAD=$(git rev-list --count "$MB..$HEAD_REF")
PR_FILES=$(git diff --name-only "$MB" "$HEAD_REF")
MAIN_FILES=$(git diff --name-only "$MB" "$BASE_REF")
OVERLAP_FILES=$(comm -12 <(echo "$PR_FILES" | sort) <(echo "$MAIN_FILES" | sort) | sed '/^$/d')
OVERLAP_COUNT=$(echo "$OVERLAP_FILES" | sed '/^$/d' | wc -l | tr -d ' ')

echo "$TAG branch=$BRANCH base=$BASE_REF"
echo "$TAG merge-base からの遅れ: behind=$BEHIND commits（PR 側 ahead=${AHEAD}）"
echo "$TAG PR が触るファイル: $(echo "$PR_FILES" | sed '/^$/d' | wc -l | tr -d ' ') 件 / main 側と重なるファイル: $OVERLAP_COUNT 件"
if [ "$OVERLAP_COUNT" -gt 0 ]; then
  echo "$OVERLAP_FILES" | sed "s/^/$TAG   overlap: /"
fi

VERDICT="CLEAN"

if [ "$BEHIND" -ge "$BEHIND_WARN" ]; then
  echo "$TAG ⚠️ base が $BEHIND commits 遅れています（閾値 ${BEHIND_WARN}）" >&2
  VERDICT="WARN"
fi

# PR がファイルを触っていなければ巻き戻しは起こり得ない
if [ -z "$(echo "$PR_FILES" | sed '/^$/d')" ]; then
  echo "$TAG 判定: CLEAN（PR に差分ファイルなし）"
  exit 0
fi

# --- 4. 巻き戻し検知（merge シミュレーション） -----------------------------
if ! git merge-tree --write-tree "$BASE_REF" "$BASE_REF" >/dev/null 2>&1; then
  warn_exit "git merge-tree --write-tree が使えません（git >= 2.38 が必要）。手動で 3点diff を確認してください"
fi

set +e
MERGE_OUT=$(git merge-tree --write-tree "$BASE_REF" "$HEAD_REF" 2>/dev/null)
MERGE_STATUS=$?
set -e

if [ "$MERGE_STATUS" -eq 1 ]; then
  echo "$TAG ⚠️ マージシミュレーションが conflict（GitHub 上でもそのままではマージ不可）" >&2
  echo "$TAG 判定: WARN（conflict 解消時に main 側の変更を必ず採用すること。behind=${BEHIND}）"
  exit 0
elif [ "$MERGE_STATUS" -ne 0 ]; then
  warn_exit "git merge-tree が異常終了（status=$MERGE_STATUS、conflict 以外のエラー）。手動で 3点diff を確認してください"
fi
MERGED_TREE=$(printf '%s\n' "$MERGE_OUT" | head -1)

# 正規化: 先頭/末尾空白を除去し、空行と MIN_LINE_LEN 未満の短行をノイズとして落とす
normalize() {
  sed -e 's/^[+-]//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
    | awk -v n="$MIN_LINE_LEN" 'length($0) >= n'
}

PR_FILES_ARR=()
while IFS= read -r f; do [ -n "$f" ] && PR_FILES_ARR+=("$f"); done <<<"$PR_FILES"

# マージ後に main から消える行（PR が触るファイルに限定）
REMOVED=$(git diff "$BASE_REF" "$MERGED_TREE" -- "${PR_FILES_ARR[@]}" | grep '^-' | grep -v '^---' | normalize || true)

# main が「直近」追加した行を 2 系統で収集する:
#   (a) MAIN_ADDED_MB: merge-base 以降に main へ入った行。マージ結果から消えたら無条件で巻き戻し候補
#   (b) MAIN_ADDED_LB: 直近 MAIN_LOOKBACK commits で main へ入った行（merge-base 以前を含む）。
#       PR のベースに既に存在する行を含むため、「PR が意図的に削除・改稿した行」と区別が付かない。
#       #404 型（古い作業コピーによる上書き）はマージ結果に「main が直近削除した古い行」が
#       復活する（resurrection）のが特徴なので、復活行が RESURRECT_MIN 以上ある場合のみ (b) を数える。
LB_BASE=$(git rev-parse -q --verify "$BASE_REF~$MAIN_LOOKBACK" 2>/dev/null || git rev-list --max-parents=0 "$BASE_REF" | tail -1)
MAIN_ADDED_MB=$(git diff "$MB" "$BASE_REF" -- "${PR_FILES_ARR[@]}" | grep '^+' | grep -v '^+++' | normalize | sort -u || true)
MAIN_ADDED_LB=$(git diff "$LB_BASE" "$BASE_REF" -- "${PR_FILES_ARR[@]}" | grep '^+' | grep -v '^+++' | normalize | sort -u || true)
MAIN_REMOVED_LB=$(git diff "$LB_BASE" "$BASE_REF" -- "${PR_FILES_ARR[@]}" | grep '^-' | grep -v '^---' | normalize | sort -u || true)
MERGE_ADDED=$(git diff "$BASE_REF" "$MERGED_TREE" -- "${PR_FILES_ARR[@]}" | grep '^+' | grep -v '^+++' | normalize | sort -u || true)

# resurrection: マージ結果が追加する行のうち、main が lookback 内で削除した行と一致するもの
RESURRECTED=0
if [ -n "$MERGE_ADDED" ] && [ -n "$MAIN_REMOVED_LB" ]; then
  RESURRECTED=$(comm -12 <(printf '%s\n' "$MERGE_ADDED") <(printf '%s\n' "$MAIN_REMOVED_LB") | wc -l | tr -d ' ')
fi

if [ "$RESURRECTED" -ge "$RESURRECT_MIN" ]; then
  MAIN_ADDED=$(printf '%s\n%s\n' "$MAIN_ADDED_MB" "$MAIN_ADDED_LB" | sed '/^$/d' | sort -u)
  MODE_NOTE="mb以降 + lookback（復活行 ${RESURRECTED} 行を検出 → #404 型の疑い）"
else
  MAIN_ADDED="$MAIN_ADDED_MB"
  MODE_NOTE="mb以降のみ（復活行なし → PR ベース既存行の削除・改稿は意図的とみなす）"
fi

MATCHES=0
if [ -n "$REMOVED" ] && [ -n "$MAIN_ADDED" ]; then
  MATCHES=$(comm -12 <(printf '%s\n' "$REMOVED" | sort -u) <(printf '%s\n' "$MAIN_ADDED") | wc -l | tr -d ' ')
fi
MAIN_ADDED_COUNT=$(printf '%s\n' "$MAIN_ADDED" | sed '/^$/d' | wc -l | tr -d ' ')

echo "$TAG 巻き戻し判定: マージで main から消える行のうち、main が直近追加した行と一致 = ${MATCHES} 行（候補 ${MAIN_ADDED_COUNT} 行中、判定範囲: ${MODE_NOTE}）"

if [ "$MATCHES" -ge "$ROLLBACK_FAIL_MATCHES" ]; then
  echo "$TAG 🚨 判定: STALE 疑い — このままマージすると main の直近変更が巻き戻ります" >&2
  echo "$TAG 一致行の例（最大5行）:" >&2
  comm -12 <(printf '%s\n' "$REMOVED" | sort -u) <(printf '%s\n' "$MAIN_ADDED") | head -5 | sed "s/^/$TAG   - /" >&2
  echo "$TAG 対処: PR ブランチを origin/$BASE_BRANCH に rebase / main 側変更を取り込んでから再判定（AGENT_LEARNINGS 2026-06-10 参照）" >&2
  exit 1
elif [ "$MATCHES" -ge 1 ]; then
  echo "$TAG ⚠️ 判定: WARN（一致 ${MATCHES} 行。閾値 $ROLLBACK_FAIL_MATCHES 未満だが目視確認を推奨）" >&2
  exit 0
fi

if [ "$VERDICT" = "WARN" ]; then
  echo "$TAG 判定: WARN（behind 大 + 同一ファイル変更あり。巻き戻し行は検出せず）"
else
  echo "$TAG 判定: CLEAN（巻き戻しリスクを検出せず）"
fi
exit 0
