#!/usr/bin/env bash
# scripts/merge-pr.sh
# PR の squash マージと「ローカル後片付け」までを 1 コマンドで完了させる。
#
# 解決する問題:
#   `gh pr merge <n> --squash --delete-branch` は、そのブランチを git worktree が
#   使っていると必ず次で失敗する（PR 自体のマージとリモートブランチ削除は成功する）。
#     failed to delete local branch <branch>: ... cannot delete branch '<branch>'
#     used by worktree at '<path>'
#   毎回 `git worktree remove --force` → `git branch -D` を手で打つ必要があった。
#
# ■ 人間ゲートについて（重要）
#   このリポジトリで PR マージは人間の承認を要する操作であり、本スクリプトは
#   **承認を代替しない**。デフォルトでは対話 TTY で y/N の確認プロンプトを出し、
#   非 TTY では実行を拒否する。`--yes` は「呼び出し側（人間）が既にレビュー・承認
#   済みであること」を宣言するフラグであり、その責任は呼び出し側にある。
#   自動化・エージェントから `--yes` を無条件に付けてはならない。
#
# 使い方:
#   npm run merge:pr -- <PR番号> [オプション]
#   bash scripts/merge-pr.sh <PR番号> [オプション]
#
# 終了コード:
#   0 = マージ + 後片付け完了（または --dry-run で問題なし）
#   1 = 前提チェックで中止（PR が OPEN でない / staleness FAIL / 未コミット変更 など）
#   2 = 使い方エラー
#   3 = マージ後の後片付けに失敗（マージ自体は成功している。手動対応が必要）
#
# 環境変数（主にテスト用のフック。通常は指定しない）:
#   MERGE_PR_GH      gh コマンド（デフォルト: gh）
#   GH_ENSURE_CMD    アカウント検証コマンド（デフォルト: bash scripts/check-gh-account.sh --fix）
#   STALENESS_CMD    staleness 検査コマンド（デフォルト: bash scripts/check-pr-staleness.sh）

set -euo pipefail

TAG="[merge-pr]"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GH_BIN="${MERGE_PR_GH:-gh}"
GH_ENSURE_CMD="${GH_ENSURE_CMD:-bash $SCRIPT_DIR/check-gh-account.sh --fix}"
STALENESS_CMD="${STALENESS_CMD:-bash $SCRIPT_DIR/check-pr-staleness.sh}"

info() { echo "$TAG $*"; }
warn() { echo "$TAG ⚠️  $*" >&2; }
die()  { echo "$TAG ❌ $*" >&2; exit "${2:-1}"; }

usage() {
  cat <<'EOF'
usage: npm run merge:pr -- <PR番号> [オプション]

PR を squash マージし、worktree が掴んでいるローカルブランチまで後片付けする。

人間ゲート: マージは人間の承認が必要な操作。デフォルトは対話確認プロンプトを出し、
非 TTY では拒否する。--yes は「呼び出し側が既に承認済み」であることの宣言であり、
承認の代替ではない（責任は呼び出し側にある）。

オプション:
  -y, --yes                 確認プロンプトを省略（承認済みであることを呼び出し側が保証）
      --dry-run             実行計画だけ出して何も変更しない
      --allow-stale         staleness 検査が FAIL でも続行する（要理由の自覚）
      --allow-dirty-worktree
                            worktree に未コミット変更があっても続行する。
                            その場合も worktree ディレクトリは削除せず detach のみ行い、
                            作業中のファイルはディスク上にそのまま残す。
      --remove-worktree     後片付けで worktree ディレクトリごと削除する
                            （未コミット変更がある場合は削除しない。--force は使わない）
  -h, --help                このヘルプ

後片付けの流れ:
  1. gh アカウント検証（check-gh-account.sh --fix）
  2. PR state が OPEN か確認
  3. staleness 検査（check-pr-staleness.sh）
  4. 対象ブランチを掴んでいる worktree を **マージ前に** detach（--detach）
  5. gh pr merge --squash --delete-branch
  6. ローカルブランチ削除 + remote-tracking の prune（必要なら worktree 削除）
EOF
}

# ---------------------------------------------------------------------------
# 引数
# ---------------------------------------------------------------------------
PR=""
ASSUME_YES=0
DRY_RUN=0
ALLOW_STALE=0
ALLOW_DIRTY=0
REMOVE_WT=0

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -y|--yes) ASSUME_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --allow-stale) ALLOW_STALE=1 ;;
    --allow-dirty-worktree) ALLOW_DIRTY=1 ;;
    --remove-worktree) REMOVE_WT=1 ;;
    --self-test) exec bash "$SCRIPT_DIR/test-merge-pr.sh" ;;
    -*) usage >&2; die "不明なオプション: $1" 2 ;;
    *)
      [ -n "$PR" ] && { usage >&2; die "PR番号は1つだけ指定してください" 2; }
      PR="$1" ;;
  esac
  shift
done

[ -n "$PR" ] || { usage >&2; exit 2; }
case "$PR" in
  ''|*[!0-9]*) die "PR番号は数字で指定してください（受け取った値: ${PR}）" 2 ;;
esac

# ---------------------------------------------------------------------------
# 1. gh アカウント検証
#    AGENT_LEARNINGS 2026-06-11: `gh auth setup-git` 後に active account が反転し
#    push/PR/merge のたび 403 になる実績がある。マージは「途中で失敗すると状態が
#    分かりにくい」操作なので、叩く前に必ず --fix 付きで揃えておく。
# ---------------------------------------------------------------------------
info "gh アカウント検証: $GH_ENSURE_CMD"
if ! $GH_ENSURE_CMD; then
  die "gh の active account を期待値に揃えられませんでした。手動で gh auth switch してください"
fi

# ---------------------------------------------------------------------------
# 2. PR state 確認（AGENT_LEARNINGS 2026-04-20: 並列セッションの先行マージ対策）
# ---------------------------------------------------------------------------
PR_INFO=$($GH_BIN pr view "$PR" --json state,headRefName,title \
  --jq '.state + "\t" + .headRefName + "\t" + .title') \
  || die "gh pr view #$PR に失敗しました"

PR_STATE=$(printf '%s' "$PR_INFO" | cut -f1)
BRANCH=$(printf '%s' "$PR_INFO" | cut -f2)
PR_TITLE=$(printf '%s' "$PR_INFO" | cut -f3)

info "PR #$PR [$PR_STATE] $PR_TITLE"
info "head branch: $BRANCH"

if [ "$PR_STATE" != "OPEN" ]; then
  die "PR #$PR は OPEN ではありません（state=${PR_STATE}）。並列セッションが先にマージした可能性があります"
fi
[ -n "$BRANCH" ] || die "head branch を特定できませんでした"

# ---------------------------------------------------------------------------
# 3. staleness 検査
#    2026-06-10 の #404/#405 インシデント（base が古い PR のマージで記事が巻き戻る）
#    はマージ後に気づいても復旧が高コスト。FAIL(exit 1) は既定で中止し、
#    続行の判断は人間に委ねる（--allow-stale）。判定困難は WARN(exit 0) で通す。
# ---------------------------------------------------------------------------
info "staleness 検査: $STALENESS_CMD $PR"
set +e
$STALENESS_CMD "$PR"
STALE_STATUS=$?
set -e
if [ "$STALE_STATUS" -ne 0 ]; then
  if [ "$ALLOW_STALE" -eq 1 ]; then
    warn "staleness 検査が exit=$STALE_STATUS ですが --allow-stale のため続行します"
  else
    die "staleness 検査が exit=$STALE_STATUS で失敗しました。巻き戻しの疑いがあります。
  確認: git diff origin/main...origin/$BRANCH --stat
  意図的に続行する場合のみ --allow-stale を付けてください"
  fi
fi

# ---------------------------------------------------------------------------
# 4. 対象ブランチを掴んでいる worktree を検出
# ---------------------------------------------------------------------------
WT_PATH=""
while IFS= read -r line; do
  case "$line" in
    worktree\ *) cur_path="${line#worktree }" ;;
    branch\ refs/heads/*)
      if [ "${line#branch refs/heads/}" = "$BRANCH" ]; then WT_PATH="$cur_path"; fi ;;
  esac
done < <(git worktree list --porcelain)

# 「今いる場所」が対象ブランチだった場合は自分で自分の足元を消すことになるので止める。
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
if [ "$CURRENT_BRANCH" = "$BRANCH" ] && [ -z "$WT_PATH" ]; then
  WT_PATH=$(git rev-parse --show-toplevel)
fi

WT_DIRTY=0
if [ -n "$WT_PATH" ]; then
  info "worktree が $BRANCH を使用中: $WT_PATH"
  if [ -n "$(git -C "$WT_PATH" status --porcelain 2>/dev/null)" ]; then
    WT_DIRTY=1
  fi
else
  info "対象ブランチを使用中の worktree はありません"
fi

# --- 未コミット変更の扱い（設計判断） ------------------------------------
# `git worktree remove --force` はユーザーの作業を無言で捨てるため既定では使わない。
# 未コミット変更を見つけたら **既定で中止** し、退避方法を提示する。
# 続行する場合（--allow-dirty-worktree）も、行うのは detach だけで、
# ディレクトリ削除は行わない。detach はワーキングツリーの中身を書き換えないため、
# 未コミットの変更はディスク上にそのまま残る（失われない）。
if [ "$WT_DIRTY" -eq 1 ]; then
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    git -C "$WT_PATH" status --short >&2
    die "worktree に未コミット変更があります: $WT_PATH
  作業を失わないため中止しました。次のいずれかを実施してください:
    - 変更を commit する
    - git -C '$WT_PATH' stash push -u -m 'merge-pr退避'
    - 変更を残したまま続行する（detach のみ・ディレクトリは削除しない）:
        npm run merge:pr -- $PR --allow-dirty-worktree"
  fi
  warn "未コミット変更がありますが --allow-dirty-worktree のため続行します（ファイルは削除しません）"
  if [ "$REMOVE_WT" -eq 1 ]; then
    warn "未コミット変更があるため --remove-worktree は無視します（detach のみ）"
    REMOVE_WT=0
  fi
fi

# ---------------------------------------------------------------------------
# 5. 実行計画 / 人間ゲート
# ---------------------------------------------------------------------------
cat <<EOF
$TAG ---- 実行計画 ----
$TAG   1) $([ -n "$WT_PATH" ] && echo "worktree を detach: $WT_PATH" || echo "worktree 操作なし")
$TAG   2) $GH_BIN pr merge $PR --squash --delete-branch
$TAG   3) ローカルブランチ削除: git branch -D $BRANCH
$TAG   4) git fetch --prune origin
$TAG   5) $([ "$REMOVE_WT" -eq 1 ] && echo "worktree 削除: $WT_PATH" || echo "worktree ディレクトリは残す")
EOF

if [ "$DRY_RUN" -eq 1 ]; then
  info "--dry-run のためここで終了します（何も変更していません）"
  exit 0
fi

if [ "$ASSUME_YES" -eq 0 ]; then
  if [ ! -t 0 ]; then
    die "確認プロンプトを出せません（非 TTY）。人間の承認を得たうえで --yes を付けて再実行してください"
  fi
  printf '%s PR #%s をマージします。よろしいですか? [y/N] ' "$TAG" "$PR"
  read -r reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) die "中止しました（承認なし）" 1 ;;
  esac
fi

# ---------------------------------------------------------------------------
# 6. worktree の detach は **マージ前** に行う（設計判断）
#
#   マージ後に外す案:
#     gh pr merge がローカルブランチ削除で失敗して非ゼロ終了するため、
#     「マージは成功・コマンドは失敗」という判別しにくい状態を毎回踏む。
#     さらにスクリプトが exit code を見て分岐するので、真の失敗（403 等）と
#     区別するために毎回 PR state の再問い合わせが要る。
#   マージ前に外す案（採用）:
#     ブランチが誰にも掴まれていない状態でマージするので gh pr merge が
#     素直に成功し、--delete-branch がそのまま効く。
#     マージが失敗しても副作用は「worktree が detached HEAD になった」だけで、
#     下の restore_worktree で元のブランチに戻せる（ファイルは触らない）。
# ---------------------------------------------------------------------------
DETACHED=0
restore_worktree() {
  if [ "$DETACHED" -eq 1 ] && [ -n "$WT_PATH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      warn "worktree を $BRANCH へ復帰させます: $WT_PATH"
      git -C "$WT_PATH" switch "$BRANCH" >/dev/null 2>&1 || \
        warn "復帰に失敗しました。手動で: git -C '$WT_PATH' switch $BRANCH"
    fi
  fi
}

if [ -n "$WT_PATH" ]; then
  info "worktree を detach します（ファイルは変更しません）: $WT_PATH"
  git -C "$WT_PATH" switch --detach >/dev/null 2>&1 \
    || die "worktree の detach に失敗しました: $WT_PATH"
  DETACHED=1
fi

# ---------------------------------------------------------------------------
# 7. マージ
# ---------------------------------------------------------------------------
info "マージ実行: $GH_BIN pr merge $PR --squash --delete-branch"
set +e
$GH_BIN pr merge "$PR" --squash --delete-branch
MERGE_STATUS=$?
set -e

if [ "$MERGE_STATUS" -ne 0 ]; then
  # マージ自体は通っているのにローカル削除だけで落ちるケースがあるため state を再確認する
  POST_STATE=$($GH_BIN pr view "$PR" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
  if [ "$POST_STATE" != "MERGED" ]; then
    restore_worktree
    die "gh pr merge が失敗しました（exit=${MERGE_STATUS}, state=${POST_STATE}）。マージされていません"
  fi
  warn "gh pr merge は exit=$MERGE_STATUS でしたが PR は MERGED です。後片付けを続行します"
fi

info "PR #$PR は MERGED。後片付けに進みます"

# ---------------------------------------------------------------------------
# 8. 後片付け
#    squash マージなのでローカルブランチは git 的には未マージ扱い（-d は失敗する）。
#    PR が MERGED であることを確認済みなので -D で削除する。
# ---------------------------------------------------------------------------
CLEANUP_FAILED=0
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  if git branch -D "$BRANCH" >/dev/null 2>&1; then
    info "ローカルブランチ削除: $BRANCH"
  else
    warn "ローカルブランチ削除に失敗: $BRANCH"
    CLEANUP_FAILED=1
  fi
else
  info "ローカルブランチは既にありません: $BRANCH"
fi

# remote-tracking ref の掃除（AGENT_LEARNINGS: リモート実体は squash 時に自動削除済み）
git fetch --prune origin >/dev/null 2>&1 || warn "git fetch --prune origin に失敗（無視して続行）"

if [ "$REMOVE_WT" -eq 1 ] && [ -n "$WT_PATH" ]; then
  if git worktree remove "$WT_PATH" >/dev/null 2>&1; then
    info "worktree を削除: $WT_PATH"
  else
    warn "worktree の削除に失敗（--force は使いません）: $WT_PATH"
    CLEANUP_FAILED=1
  fi
elif [ -n "$WT_PATH" ]; then
  info "worktree は detached HEAD のまま残しています: $WT_PATH"
fi

git worktree prune >/dev/null 2>&1 || true

if [ "$CLEANUP_FAILED" -eq 1 ]; then
  die "マージは成功しましたが後片付けが未完了です。上記 WARN を手動で解消してください" 3
fi

info "✅ 完了: PR #$PR をマージし、ローカルの後片付けまで終えました"
