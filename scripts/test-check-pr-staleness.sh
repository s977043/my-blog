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
  # echo | grep -q は pipefail 下で grep の早期終了が SIGPIPE(141) になり、一致しても偽になる
  if [ "$got" = "$want" ] && grep -q -- "$needle" <<<"$out"; then
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

# ---------------------------------------------------------------------------
# Case 12: exit 0（誤検知回帰 / #910 型）— main がエントリを削除した JSON に、PR が同じキー構成の
#   別エントリを追加し、件数行を更新するだけ。追加されるキー行は base に同一行が残っているので
#   復活行ではない。STALE（exit 1）にしないのが正。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case12"; new_repo "$R"
graph_entry() { printf '  {\n    "id": "%s",\n    "status": "seed",\n    "legacy": false,\n    "topics": [\n    ]\n  },\n' "$1"; }
{ echo "["; graph_entry alpha-seed; graph_entry beta-seed; echo "]"; } >"$R/graph.json"
printf '# Graph\n' >"$R/graph.md"
git -C "$R" add graph.json graph.md && git -C "$R" commit -qm "v1"
{ echo "["; graph_entry alpha-seed; echo "]"; } >"$R/graph.json"
git -C "$R" add graph.json && git -C "$R" commit -qm "withdraw beta seed"
printf '# Graph\n\n- Seeds: 1\n- Explicit: 1\n' >"$R/graph.md"
git -C "$R" add graph.md && git -C "$R" commit -qm "add counters"
git -C "$R" switch -qc add-gamma
{ echo "["; graph_entry alpha-seed; graph_entry gamma-seed; echo "]"; } >"$R/graph.json"
printf '# Graph\n\n- Seeds: 2\n- Explicit: 2\n' >"$R/graph.md"
git -C "$R" add graph.json graph.md && git -C "$R" commit -qm "add gamma seed"
git -C "$R" switch -q main
run_check "$R" add-gamma
assert "case12 exit0 (#910型 構造行の重複を復活行に数えない)" 0 "$CHECK_STATUS" "復活行なし" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 13: STALE（検出力維持回帰）— main が記事から削除した古い行が「別ファイル」には残っていても、
#   その記事で復活させる #404 型は検知する（同一行の残存はファイル単位で判定する）。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case13"; new_repo "$R"
article_v1 >"$R/article.md"
article_v1 >"$R/archive.md"
git -C "$R" add article.md archive.md && git -C "$R" commit -qm "v1"
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。

## まとめ
改訂版のまとめ文（レビュー反映済み）。
EOF
git -C "$R" add article.md && git -C "$R" commit -qm "polish article"
git -C "$R" switch -qc stale-crossfile
article_v1 >"$R/article.md"
echo "PR 側の追記" >>"$R/archive.md"
git -C "$R" add article.md archive.md && git -C "$R" commit -qm "overwrite with old copy"
git -C "$R" switch -q main
run_check "$R" stale-crossfile
assert "case13 stale (別ファイルに同一行が残っても #404型を検知)" 1 "$CHECK_STATUS" "STALE" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 14: WARN（検出力維持回帰）— frontmatter の `published: true` を初版の false へ戻す巻き戻し。
#   同じ `published: false` 行が本文のコードブロックに残るため強い復活行は 0 だが、
#   弱い復活があるので lookback 一致 1 行でも CLEAN にしない。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case14"; new_repo "$R"
fm_doc() { printf -- '---\npublished: %s\n---\n本文の説明です。\n\n```yaml\npublished: false\n```\n' "$1"; }
fm_doc false >"$R/e.md"
git -C "$R" add e.md && git -C "$R" commit -qm "v1"
fm_doc true >"$R/e.md"
git -C "$R" add e.md && git -C "$R" commit -qm "publish"
git -C "$R" switch -qc revert-published
fm_doc false >"$R/e.md"
git -C "$R" add e.md && git -C "$R" commit -qm "old working copy"
git -C "$R" switch -q main
run_check "$R" revert-published
assert "case14 warn (公開フラグの巻き戻しを CLEAN にしない)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 15: WARN 以上（検出力維持回帰）— 戻される古い行が同じファイルの別の場所にも残る #404 型。
#   強い復活にならないため STALE ではなく WARN（exit 0）止まり。既知の後退として固定する。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case15"; new_repo "$R"
dup_doc() { printf '# 記事\n\n## はじめに\n%s\n%s\n\n## 付録: 改訂前の文\n古い表現の段落その1。\n古い表現の段落その2。\n' "$1" "$2"; }
dup_doc "古い表現の段落その1。" "古い表現の段落その2。" >"$R/a.md"
git -C "$R" add a.md && git -C "$R" commit -qm "v1"
dup_doc "磨き込み後の段落その1です。" "磨き込み後の段落その2です。" >"$R/a.md"
git -C "$R" add a.md && git -C "$R" commit -qm "polish"
git -C "$R" switch -qc stale-dup
dup_doc "古い表現の段落その1。" "古い表現の段落その2。" >"$R/a.md"
git -C "$R" add a.md && git -C "$R" commit -qm "old working copy"
git -C "$R" switch -q main
run_check "$R" stale-dup
assert "case15 warn (古い行が同じファイルに残る巻き戻しを CLEAN にしない)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 16: WARN/exit 0（誤検知回帰 / #915 型）— PR ベースに既にある直近コード（lookback 内に main へ
#   入った関数）を PR が書き換え、新しいコードが main の直近コミットで消えた定型行を 1 行だけ偶然含む。
#   復活 1 行に対して消える lookback 行が多いので STALE にせず、lookback 一致の WARN に落とす。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case16"; new_repo "$R"
printf 'function scan(lines) {\n  for (const line of lines) {\n    const m = line.match(RE);\n    if (!m) continue;\n    out.push(m[1]);\n  }\n}\n' >"$R/index.js"
git -C "$R" add index.js && git -C "$R" commit -qm "v1"
printf 'function scan(lines, file) {\n  for (const line of lines) {\n    const h = line.match(HEADING_RE);\n    if (!h) continue;\n    const parts = [line, h[1], line.slice(h[0].length)];\n    missing.push({ date: parts[1], file });\n    console.warn(`  ${file}: ${parts[1]}`);\n  }\n}\n' >"$R/index.js"
git -C "$R" add index.js && git -C "$R" commit -qm "rewrite scan (recent)"
git -C "$R" switch -qc rewrite-recent
printf 'function scan(lines, counts) {\n  for (const line of lines) {\n    const m = line.match(DATE_RE);\n    if (!m) continue;\n    counts.set(m[1], (counts.get(m[1]) || 0) + 1);\n  }\n  return counts;\n}\n' >"$R/index.js"
git -C "$R" add index.js && git -C "$R" commit -qm "count per date (intentional rewrite)"
git -C "$R" switch -q main
echo "unrelated" >"$R/other.md"
git -C "$R" add other.md && git -C "$R" commit -qm "advance main"
run_check "$R" rewrite-recent
assert "case16 warn/exit0 (#915型 定型行 1 行の一致で STALE にしない)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 17: WARN/exit 0（誤検知回帰 / #911 型）— PR ベースに既にある直近エントリを、本文を変えずに
#   別ファイルへ移す。消える行は lookback 一致になるが、復活は無いので STALE にしない。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case17"; new_repo "$R"
printf '# Learnings\n\n### 2026-07-01 — 古いエントリ\n古いエントリの本文です。\n' >"$R/L.md"
printf '# Archive\n' >"$R/archive.md"
git -C "$R" add L.md archive.md && git -C "$R" commit -qm "v1"
printf '# Learnings\n\n### 2026-07-01 — 古いエントリ\n古いエントリの本文です。\n\n### 2026-07-02 — 直近エントリ\n直近エントリの本文その1です。\n直近エントリの本文その2です。\n' >"$R/L.md"
git -C "$R" add L.md && git -C "$R" commit -qm "add entry"
git -C "$R" switch -qc move-to-archive
printf '# Learnings\n\n- 2026-07-01 — 古いエントリ\n- 2026-07-02 — 直近エントリ\n' >"$R/L.md"
printf '# Archive\n\n### 2026-07-01 — 古いエントリ\n古いエントリの本文です。\n\n### 2026-07-02 — 直近エントリ\n直近エントリの本文その1です。\n直近エントリの本文その2です。\n' >"$R/archive.md"
git -C "$R" add L.md archive.md && git -C "$R" commit -qm "move bodies to archive"
git -C "$R" switch -q main
run_check "$R" move-to-archive
assert "case17 warn/exit0 (#911型 本文不変の移動を STALE にしない)" 0 "$CHECK_STATUS" "WARN" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 18: STALE（検出力維持回帰）— 段落 1 つだけを古い版に戻す部分的な巻き戻し。
#   戻る古い行と消える新しい行が同程度なので、比率条件を満たし STALE のまま。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case18"; new_repo "$R"
article_v1 >"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "v1"
sed -e 's/古い表現の段落その1。/磨き込み後の段落その1です。/' -e 's/古い表現の段落その2。/磨き込み後の段落その2です。/' \
  -e 's/初版のまとめ文。/改訂版のまとめ文です。/' "$R/article.md" >"$R/tmp" && mv "$R/tmp" "$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "polish"
git -C "$R" switch -qc partial-revert
sed -e 's/磨き込み後の段落その1です。/古い表現の段落その1。/' -e 's/磨き込み後の段落その2です。/古い表現の段落その2。/' \
  "$R/article.md" >"$R/tmp" && mv "$R/tmp" "$R/article.md"
printf '\n## 追記\nPR で追加した新しい段落その1です。\nPR で追加した新しい段落その2です。\n' >>"$R/article.md"
git -C "$R" add article.md && git -C "$R" commit -qm "old paragraph + new section"
git -C "$R" switch -q main
run_check "$R" partial-revert
assert "case18 stale (段落 1 つの部分的な巻き戻しを検知)" 1 "$CHECK_STATUS" "STALE" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 19: STALE（検出力維持回帰）— 比率はファイル単位で見る。別ファイルで大量の直近行を
#   意図的に書き換えていても、巻き戻したファイルの復活行は打ち消されない。
# ---------------------------------------------------------------------------
R="$TMPDIR_ROOT/case19"; new_repo "$R"
article_v1 >"$R/article.md"
printf 'const a = 1;\n' >"$R/code.js"
git -C "$R" add article.md code.js && git -C "$R" commit -qm "v1"
cat >"$R/article.md" <<'EOF'
# サンプル記事

## はじめに
これは検証用の本文です。
磨き込み後の表現の段落その1です。
磨き込み後の表現の段落その2です。

## まとめ
改訂版のまとめ文（レビュー反映済み）。
EOF
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do echo "const recent$i = compute($i);"; done >"$R/code.js"
git -C "$R" add article.md code.js && git -C "$R" commit -qm "polish + recent code"
git -C "$R" switch -qc mixed
article_v1 >"$R/article.md"
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do echo "const rewritten$i = other($i);"; done >"$R/code.js"
git -C "$R" add article.md code.js && git -C "$R" commit -qm "old article copy + rewrite code"
git -C "$R" switch -q main
run_check "$R" mixed
assert "case19 stale (別ファイルの大量書き換えで比率が薄まらない)" 1 "$CHECK_STATUS" "STALE" "$CHECK_OUT"

# ---------------------------------------------------------------------------
# Case 10/11: 外部 I/O が返らなくても NET_TIMEOUT で打ち切って判定を返す
#   （2026-10-01 #732: gh / fetch のどちらかで止まり、30 分の上限まで返らなかった）
# ---------------------------------------------------------------------------
assert_fast() { # $1=ケース名 $2=経過秒 $3=上限秒
  if [ "$2" -le "$3" ]; then
    echo "PASS: $1 (${2}s ≤ ${3}s)"
  else
    echo "FAIL: $1 — ${2}s かかった（上限 ${3}s）"
    FAILURES=$((FAILURES + 1))
  fi
}

FAKEBIN="$TMPDIR_ROOT/fakebin"; mkdir -p "$FAKEBIN"
printf '#!/bin/sh\nsleep 60\n' >"$FAKEBIN/gh"; chmod +x "$FAKEBIN/gh"
R="$TMPDIR_ROOT/case1"
START=$SECONDS
set +e
CHECK_OUT=$(cd "$R" && PATH="$FAKEBIN:$PATH" NET_TIMEOUT=2 NO_FETCH=1 BASE_BRANCH=main bash "$SCRIPT" 123 2>&1)
CHECK_STATUS=$?
set -e
assert "case10 warn (gh pr view が返らない)" 0 "$CHECK_STATUS" "打ち切り" "$CHECK_OUT"
assert_fast "case10 gh を NET_TIMEOUT で打ち切る" $((SECONDS - START)) 10

git -C "$R" config protocol.ext.allow always
git -C "$R" remote add slow "ext::sh -c sleep% 60"
START=$SECONDS
set +e
CHECK_OUT=$(cd "$R" && NET_TIMEOUT=2 REMOTE=slow BASE_BRANCH=main bash "$SCRIPT" feature-other 2>&1)
CHECK_STATUS=$?
set -e
assert "case11 clean (fetch が返らなくてもローカル ref で判定)" 0 "$CHECK_STATUS" "CLEAN" "$CHECK_OUT"
assert_fast "case11 fetch を NET_TIMEOUT で打ち切る" $((SECONDS - START)) 10

echo "---"
if [ "$FAILURES" -eq 0 ]; then
  echo "self-test: 全ケース PASS"
  exit 0
else
  echo "self-test: $FAILURES 件 FAIL"
  exit 1
fi
