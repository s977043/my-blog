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

echo "---"
if [ "$FAILURES" -eq 0 ]; then
  echo "self-test: 全ケース PASS"
  exit 0
else
  echo "self-test: $FAILURES 件 FAIL"
  exit 1
fi
