#!/usr/bin/env bash
# scripts/test-check-pr-staleness.sh
# check-pr-staleness.sh の fixture ベース self-test。
# 一時 git リポジトリで「main が進んだ後の stale ブランチ」を再現して判定を検証する。
#
# 実行: bash scripts/test-check-pr-staleness.sh
# 期待: 全ケース PASS で exit 0

set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-pr-staleness.sh"
[ -f "$SCRIPT" ] || { echo "check-pr-staleness.sh が見つかりません: $SCRIPT" >&2; exit 1; }

TMPDIR_ROOT=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ROOT"' EXIT
FAILURES=0

run_check() { # $1=repo $2=branch → CHECK_STATUS / CHECK_OUT に格納
  set +e
  CHECK_OUT=$(cd "$1" && NO_FETCH=1 BASE_BRANCH=main bash "$SCRIPT" "$2" 2>&1)
  CHECK_STATUS=$?
  set -e
}

assert() { # $1=ケース名 $2=期待exit $3=実exit $4=出力に含むべき文字列 $5=出力
  local name="$1" want="$2" got="$3" needle="$4" out="$5"
  if [ "$got" = "$want" ] && echo "$out" | grep -q "$needle"; then
    echo "PASS: $name (exit=$got, '$needle' を検出)"
  else
    echo "FAIL: $name — 期待 exit=$want & 出力に '$needle' / 実際 exit=$got"
    echo "$out" | sed 's/^/  | /'
    FAILURES=$((FAILURES + 1))
  fi
}

new_repo() { # $1=path
  git init -q -b main "$1"
  git -C "$1" config user.email "test@example.com"
  git -C "$1" config user.name "fixture"
  git -C "$1" config commit.gpgsign false
}

article_v1() {
  cat <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
古い表現の段落その1。
古い表現の段落その2。

## まとめ
初版のまとめ文。
EOF
}

# ---------------------------------------------------------------------------
# Case 1: CLEAN — stale ブランチだが main と別ファイルを触っている
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case1"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
git -C "$R" switch -qc feature-other
echo "新規の別ファイル記事" >"$R/other.md"
git -C "$R" add other.md && git -C "$R" commit -qm "add other.md"
git -C "$R" switch -q main
echo "main 側の磨き込み行を追加しました。" >>"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "polish article on main"
run_check "$R" feature-other
assert "case1 clean (別ファイル)" 0 "$CHECK_STATUS" "CLEAN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 2: STALE（#404 型）— main が磨き込み済みの記事に対し、PR ブランチが
#   「古い本文を丸ごと commit」している。マージは clean に通るが、
#   main の磨き込み行がマージ結果から消える = 巻き戻し。
#   （squash 済み main の後に、古い作業コピーから記事を書き戻した並列セッション PR を再現）
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case2"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
# main: 磨き込み（squash 済み想定の改稿 = 直近コミットで行を追加）
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。
レビュー反映で追加した補足の段落です。

## まとめ
改訂版のまとめ文（レビュー反映済み）。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "polish article (review applied)"
# PR ブランチ: 磨き込み後 main から分岐したが、古い作業コピー（v1）+ 図で本文を上書き commit
git -C "$R" switch -qc stale-rollback
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
古い表現の段落その1。
古い表現の段落その2。

## 図解
（stale セッションが追加した図）

## まとめ
初版のまとめ文。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "add diagram (overwrites with old content)"
git -C "$R" switch -q main
run_check "$R" stale-rollback
assert "case2 stale (#404型 巻き戻し検知)" 1 "$CHECK_STATUS" "STALE" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 2b: CLEAN — base は古いが、ブランチ側は独立セクションの挿入のみで
#   3-way merge が main の磨き込みを保持する（実際に巻き戻らない → 誤検知しない）
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case2b"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
git -C "$R" switch -qc stale-insert
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
古い表現の段落その1。
古い表現の段落その2。

## 図解
（stale ブランチが追加した図）

## まとめ
初版のまとめ文。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "insert diagram section (based on v1)"
git -C "$R" switch -q main
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。

## まとめ
初版のまとめ文。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "polish paragraphs on main"
run_check "$R" stale-insert
# 3-way merge が磨き込みを保持するなら CLEAN、hunk が接触して conflict なら WARN(exit 0) を許容
if echo "$CHECK_OUT" | grep -q "conflict"; then
  assert "case2b clean/warn (stale base だが非巻き戻し)" 0 "$CHECK_STATUS" "conflict" "$CHECK_OUT"
else
  assert "case2b clean/warn (stale base だが非巻き戻し)" 0 "$CHECK_STATUS" "CLEAN" "$CHECK_OUT"
fi

# ---------------------------------------------------------------------------
# Case 3: CLEAN — 同一ファイルでも別領域の編集なら auto-merge で main の磨き込みは残る
#   （3点diff 目視だと「同一ファイル変更」でヒヤッとするが、巻き戻しではない = 誤検知防止）
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case3"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
git -C "$R" switch -qc add-section
printf '\n## 追記セクション\nブランチ側で足した独立セクション。\n' >>"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "append section at bottom"
git -C "$R" switch -q main
# 先頭側だけを磨き込み（末尾追記とは hunk が重ならない）
sed -i '' 's/これは検証用の本文です。/これは検証用の本文です（main 磨き込み済み）。/' "$R/article.md" 2>/dev/null \
  || sed -i 's/これは検証用の本文です。/これは検証用の本文です（main 磨き込み済み）。/' "$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "polish intro on main"
run_check "$R" add-section
assert "case3 clean (同一ファイル別領域)" 0 "$CHECK_STATUS" "CLEAN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 4: WARN — 同一行を両側が書換えて conflict（判定困難は WARN 止まり / exit 0）
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case4"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
git -C "$R" switch -qc conflict-branch
sed -i '' 's/初版のまとめ文。/ブランチ版のまとめ文。/' "$R/article.md" 2>/dev/null \
  || sed -i 's/初版のまとめ文。/ブランチ版のまとめ文。/' "$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "branch edits summary"
git -C "$R" switch -q main
sed -i '' 's/初版のまとめ文。/main 版のまとめ文。/' "$R/article.md" 2>/dev/null \
  || sed -i 's/初版のまとめ文。/main 版のまとめ文。/' "$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "main edits summary"
run_check "$R" conflict-branch
assert "case4 warn (conflict)" 0 "$CHECK_STATUS" "conflict" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 5: 存在しないブランチ → 判定困難は WARN 止まり（exit 0）
# ---------------------------------------------------------------------------
run_check "$R" no-such-branch
assert "case5 warn (不明ブランチ)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 6: WARN/exit 0（誤検知回帰 / 2026-07-19 #456 型）— PR が「merge-base 以前に
#   main へ入った行」（= PR ベースに既存のテーブル）を意図的に削除するだけのケース。
#   旧実装は lookback の和集合により削除対象行を「巻き戻し」と誤検知し exit 1 でブロックしていた。
#   マージ結果は古い行を復活させない（resurrection なし）ので巻き戻し断定はしないが、
#   「意図的削除」と「append-only main への古い作業コピー上書き（case9）」は行集合レベルで
#   機械判別できないため、exit 0 の WARN（目視確認促し）に落とすのが正。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case6"; new_repo "$R"
article_v1 >"$R/guide.md"
git -C "$R" add guide.md && git -C "$R" commit -qm "v1"
cat >>"$R/guide.md" <<'EOF'

## 旧テーブル
| コマンド | 用途 |
|---------|------|
| /review-article | Zenn記事の3ペルソナレビューを生成する |
| /apply-review | Zennレビューを本文に選別反映してPRを作る |
EOF
git -C "$R" add guide.md && git -C "$R" commit -qm "add command table"
# PR: merge-base（テーブル追加後の main）から分岐し、テーブルを意図的に削除
git -C "$R" switch -qc remove-table
article_v1 >"$R/guide.md"
git -C "$R" add guide.md && git -C "$R" commit -qm "remove obsolete command table"
git -C "$R" switch -q main
run_check "$R" remove-table
assert "case6 warn/exit0 (PR による main 既存行の意図的削除)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 7: STALE（検出力維持回帰 / #404 型・behind>0 変種）— main が磨き込み後、
#   さらに別ファイルの commit で先行（behind=1）。PR は磨き込み後の main から分岐したのに
#   古い作業コピー（v1 相当）で本文を丸ごと上書き commit している。
#   マージで「merge-base 以降 + lookback 内に main へ入った磨き込み行」が消え、
#   かつ main が削除済みの古い行が復活する（resurrection）ため STALE が正。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case7"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。
レビュー反映で追加した補足の段落です。

## まとめ
改訂版のまとめ文（レビュー反映済み）。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "polish article (review applied)"
# PR ブランチ: 磨き込み後 main から分岐、古い作業コピーで上書き
git -C "$R" switch -qc stale-rollback-behind
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
古い表現の段落その1。
古い表現の段落その2。

## 図解
（stale セッションが追加した図）

## まとめ
初版のまとめ文。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "add diagram (overwrites with old content)"
# main はさらに別ファイルで先行（behind=1。behind>0 でも検知が維持されることを確認）
git -C "$R" switch -q main
echo "無関係な別ファイルの更新" >"$R/unrelated.md"
git -C "$R" add unrelated.md && git -C "$R" commit -qm "advance main with unrelated file"
run_check "$R" stale-rollback-behind
assert "case7 stale (#404型 behind>0 でも巻き戻し検知)" 1 "$CHECK_STATUS" "STALE" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 8: WARN/exit 0（誤検知回帰 / #459 型）— PR が main 既存行（merge-base 以前に入った行）を
#   意図的に「改稿」する（削除 + 新表現の追加）ケース。新表現は main が過去に削除した行
#   ではないので resurrection にならず巻き戻し断定（exit 1）はしないが、lookback 内の
#   main 追加行が消えるため WARN（exit 0・目視確認促し）に落とすのが正。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case8"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。

## まとめ
改訂版のまとめ文（レビュー反映済み）。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "polish article on main"
# PR: 磨き込み後の main から分岐し、さらに新しい表現へ意図的に改稿
git -C "$R" switch -qc reword-forward
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
さらに推敲した最新表現の段落その1です。
さらに推敲した最新表現の段落その2です。

## まとめ
最終版のまとめ文（追加推敲済み）。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "reword paragraphs forward (intentional)"
git -C "$R" switch -q main
run_check "$R" reword-forward
assert "case8 warn/exit0 (PR による main 既存行の意図的改稿)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 9: WARN/exit 0（サイレントパス封じ回帰 / #404 変種・append-only）— main が
#   純追記（削除ゼロ）でコミットした後、PR が追記前の古い作業コピーで丸ごと上書き。
#   「main が削除した行の復活」が構造的に発生しないため resurrection では検知できないが、
#   マージで lookback 内の main 追加行（追記段落）が消える。無警告 CLEAN にせず
#   WARN（exit 0・目視確認促し）を出すのが正。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case9"; new_repo "$R"
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
初版の段落その1。
初版の段落その2。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
# main: 純追記（削除なし）
cat >>"$R/article.md" <<'EOF'

## レビュー反映追記
レビュー反映で追加した補足の段落その1です。
レビュー反映で追加した補足の段落その2です。
レビュー反映で追加した重要な注意事項です。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "append review notes (pure addition)"
# PR: 追記後の main から分岐（behind=0）したが、追記前の古い作業コピー + 図で丸ごと上書き
git -C "$R" switch -qc stale-append-rollback
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
初版の段落その1。
初版の段落その2。

## 図解
（stale セッションが追加した図）
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "add diagram (old working copy overwrite)"
git -C "$R" switch -q main
run_check "$R" stale-append-rollback
assert "case9 warn/exit0 (#404変種 append-only 巻き戻しをサイレント CLEAN にしない)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

echo "---"
if [ "$FAILURES" -eq 0 ]; then
  echo "self-test: 全ケース PASS"
  exit 0
else
  echo "self-test: $FAILURES 件 FAIL"
  exit 1
fi
