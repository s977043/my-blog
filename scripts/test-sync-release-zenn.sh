#!/usr/bin/env bash
# scripts/test-sync-release-zenn.sh
# sync-release-zenn.sh の fixture ベース self-test。
# 一時 git リポジトリで「main と履歴がつながらない（squash で積んだ）release/zenn」を再現し、
# 同期後のツリーが「main ＋ published トグル」になるか、公開状態が意図せず変わらないかを検証する。
#
# 実行: bash scripts/test-sync-release-zenn.sh
# 期待: 全ケース PASS で exit 0

set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/sync-release-zenn.sh"
[ -f "$SCRIPT" ] || { echo "sync-release-zenn.sh が見つかりません: $SCRIPT" >&2; exit 1; }

TMPDIR_ROOT=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ROOT"' EXIT
FAILURES=0

pass() { echo "PASS: $1"; }
fail() {
  echo "FAIL: $1"
  [ -n "${2:-}" ] && echo "$2" | sed 's/^/  | /'
  FAILURES=$((FAILURES + 1))
}

check() { # $1=ケース名, 残り=評価するコマンド
  local name="$1"; shift
  if "$@"; then pass "$name"; else fail "$name" "$SYNC_OUT"; fi
}

setup() { # $1=path → origin(bare) と作業 clone を作る。作業 clone のパスを WORK に入れる
  git init -q --bare "$1/origin.git"
  git init -q -b main "$1/work"
  WORK="$1/work"
  git -C "$WORK" config user.email "test@example.com"
  git -C "$WORK" config user.name "fixture"
  git -C "$WORK" config commit.gpgsign false
  git -C "$WORK" remote add origin "$1/origin.git"
}

write() { # $1=path(WORK 相対) $2=内容
  mkdir -p "$(dirname "$WORK/$1")"
  printf '%s\n' "$2" > "$WORK/$1"
}

article() { # $1=published 行 $2=本文（front matter の 4 行目が published 行）
  printf -- '---\ntitle: "sample"\ntype: "tech"\n%s\n---\n\n%s' "$1" "$2"
}

commit_all() { git -C "$WORK" add -A; git -C "$WORK" commit -q -m "$1"; }

squash_sync() { # release/zenn に main のツリーを親なしで写す（main と履歴をつなげない）
  git -C "$WORK" switch -q release/zenn
  git -C "$WORK" rm -rq --cached .
  git -C "$WORK" clean -fdq
  git -C "$WORK" checkout main -- .
  commit_all "squash sync"
}

on_release() { git -C "$WORK" switch -q release/zenn; }
on_main() { git -C "$WORK" switch -q main; }

run_sync() { # $1=実行するブランチ（既定 main） $2=WORK 内の実行ディレクトリ（既定 .）
  git -C "$WORK" push -q -f origin main release/zenn
  git -C "$WORK" switch -q "${1:-main}"
  set +e
  SYNC_OUT=$(cd "$WORK/${2:-.}" && bash "$SCRIPT" "chore(release/zenn): test sync" 2>&1)
  SYNC_RC=$?
  set -e
}

exists() { git -C "$WORK" cat-file -e "HEAD:$1" 2>/dev/null; }
absent() { ! exists "$1"; }
same_as_main() { [ "$(git -C "$WORK" show "HEAD:$1")" = "$(git -C "$WORK" show "origin/main:$1")" ]; }
fm_published_is() { [ "$(git -C "$WORK" show "HEAD:$1" | sed -n 4p)" = "published: $2" ]; }
body_has() { git -C "$WORK" show "HEAD:$1" | grep -F "$2" >/dev/null; }
out_has() { echo "$SYNC_OUT" | grep -F "$1" >/dev/null; }
out_match() { echo "$SYNC_OUT" | grep -E "$1" >/dev/null; }
rc_is() { [ "$SYNC_RC" = "$1" ]; }
on_branch() { [ "$(git -C "$WORK" branch --show-current)" = "$1" ]; }
no_sync_branch() { [ -z "$(git -C "$WORK" branch --list 'release/zenn-sync-*')" ]; }
only_published_lines_differ() { # main との差分の変更行がすべて published 行か（差分なしも可）
  ! git -C "$WORK" diff -U0 --no-renames origin/main HEAD | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' | grep -vE '^[+-]published:' >/dev/null
}

build_history() { # 共通の前史: 古い merge-base → squash で積まれた release/zenn → release 側だけの公開トグル
  write README.md "base"
  write articles_note/published/p.md "$(printf 'River Reviewer の紹介\n\n段落2\n段落3\n段落4\n別の段落')"
  commit_all "base (merge-base)"
  git -C "$WORK" branch release/zenn

  write articles/a.md "$(article 'published: false' '本文 v1')"
  write articles_note/new/old-name.md "note 原稿"
  write reviews/note/new/old-name.md "レビュー"
  commit_all "main: 記事と note 原稿を追加"
  squash_sync

  write articles/a.md "$(article 'published: true' '本文 v1')"
  commit_all "release: a を公開"
  on_main
}

# ---------------------------------------------------------------------------
# Case 1: main 側の削除・リネームが release/zenn に残らず、published トグルは残る
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case1"
build_history
git -C "$WORK" mv articles_note/new/old-name.md articles_note/new/PRONI-old-name.md
git -C "$WORK" rm -q reviews/note/new/old-name.md
write articles/a.md "$(article 'published: false' '本文 v2')"
commit_all "main: リネーム・削除・本文更新"
run_sync

check "case1: exit 0" rc_is 0
check "case1: リネーム前の旧名が消える" absent articles_note/new/old-name.md
check "case1: リネーム後の新名がある" exists articles_note/new/PRONI-old-name.md
check "case1: main で削除したレビューが消える" absent reviews/note/new/old-name.md
check "case1: release の published: true が残る" fm_published_is articles/a.md true
check "case1: 記事本文は main の最新" body_has articles/a.md "本文 v2"
check "case1: main との差分は published 行だけ" only_published_lines_differ
check "case1: 削除したファイルをログに出す" out_has "  - articles_note/new/old-name.md"
check "case1: 公開数を前後で表示する" out_has "sync 前 1 件 → sync 後 1 件"
check "case1: 不変条件の検査が OK を出す" out_has "main との差分は published トグルのみ"
check "case1: ブランチ名に秒まで入る" out_match "release/zenn-sync-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}"

# ---------------------------------------------------------------------------
# Case 2: release 側だけが変えた hunk は main 版に戻る（サブディレクトリから実行しても動く）
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case2"
build_history
on_release
write articles_note/published/p.md "$(printf 'River Review の紹介\n\n段落2\n段落3\n段落4\n別の段落')"
commit_all "release: 独自編集"
on_main
write articles_note/published/p.md "$(printf 'River Reviewer の紹介\n\n段落2\n段落3\n段落4\n別の段落（main で更新）')"
commit_all "main: 別の段落だけ更新"
run_sync main articles_note

check "case2: exit 0" rc_is 0
check "case2: release 独自の hunk が main 版に戻る" same_as_main articles_note/published/p.md
check "case2: 戻したファイルをログに出す" out_has "  - articles_note/published/p.md"
check "case2: main との差分は published 行だけ" only_published_lines_differ

# ---------------------------------------------------------------------------
# Case 3: main に無い記事・画像が release/zenn にある → 何も commit せずに exit 3 で止まる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case3"
build_history
write .github/workflows/x.yml "on: push"
commit_all "main: workflow 追加"
squash_sync
write articles/r.md "$(article 'published: true' 'release にだけある記事 ![](/images/r/a.png)')"
write images/r/a.png "png"
write books/release-only/config.yaml "published: true"
commit_all "release: main に無い記事・画像・Book"
on_main
git -C "$WORK" rm -q .github/workflows/x.yml
commit_all "main: workflow 削除"
run_sync

check "case3: exit 3 で止まる" rc_is 3
check "case3: 記事を一覧に出す" out_has "  - articles/r.md"
check "case3: 記事の画像を一覧に出す" out_has "  - images/r/a.png"
check "case3: Book を一覧に出す" out_has "  - books/release-only/config.yaml"
check "case3: ゲートで止まるときは .github の削除も実行しない" eval '! out_has "  - .github/workflows/x.yml"'
check "case3: 消す場合の手順を出す" out_has "消す場合"
check "case3: 残す場合の手順を出す" out_has "残す場合"
check "case3: sync ブランチを残さない（何も commit しない）" no_sync_branch
check "case3: 元のブランチへ戻る" on_branch main
check "case3: origin/release/zenn は変わらない" eval '[ "$(git -C "$WORK" rev-parse origin/release/zenn)" = "$(git -C "$WORK" rev-parse release/zenn)" ]'

# ---------------------------------------------------------------------------
# Case 4: main で published: true にした記事は main のまま
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case4"
build_history
write articles/b.md "$(article 'published: true' '新規公開')"
commit_all "main: b を公開"
run_sync

check "case4: exit 0" rc_is 0
check "case4: main で公開した記事は published: true" fm_published_is articles/b.md true
check "case4: 新規公開の一覧に出す" out_has "  - articles/b.md"
check "case4: main との差分は published 行だけ" only_published_lines_differ

# ---------------------------------------------------------------------------
# Case 5: 本文のコードブロック内の published: true を拾わない
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case5"
build_history
CODE=$(printf '設定例:\n\n```yaml\npublished: true\n```')
write articles/c.md "$(article 'published: false' "$CODE")"
commit_all "main: c（下書き）を追加"
squash_sync
on_main
write articles/c.md "$(article 'published: false' "$CODE
追記")"
commit_all "main: c の本文を更新"
run_sync

check "case5: exit 0" rc_is 0
check "case5: front matter は false のまま" fm_published_is articles/c.md false
check "case5: 記事は main と一致" same_as_main articles/c.md

# ---------------------------------------------------------------------------
# Case 6: published 行の書き方の揺れ（行末コメント・引用符・スペースなし）でも true を維持する
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case6"
build_history
write articles/d.md "$(article 'published: false # 下書き' 'd')"
write articles/e.md "$(article 'published: false' 'e')"
write articles/g.md "$(article 'published:false' 'g')"
commit_all "main: d / e / g（下書き）を追加"
squash_sync
write articles/d.md "$(article 'published: true # 公開' 'd')"
write articles/e.md "$(article 'published: "true"' 'e')"
write articles/g.md "$(article 'published:true' 'g')"
commit_all "release: d / e / g を公開"
on_main
write README.md "base v2"
commit_all "main: 無関係な更新"
run_sync

check "case6: exit 0" rc_is 0
check "case6: 行末コメント付きの true を維持" fm_published_is articles/d.md true
check "case6: 引用符付きの true を維持" fm_published_is articles/e.md true
check "case6: スペースなしの true を維持" fm_published_is articles/g.md true
check "case6: 公開数が前後で一致" out_has "sync 前 3 件 → sync 後 3 件"

# ---------------------------------------------------------------------------
# Case 7: 安全網 — main 側で published 行が消えて公開数が減るなら、何も commit せずに止まる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case7"
build_history
write articles/a.md "$(printf -- '---\ntitle: "sample"\ntype: "tech"\n---\n\n本文 v1')"
commit_all "main: a の published 行を削除"
run_sync

check "case7: exit 4 で止まる" rc_is 4
check "case7: 公開でなくなる記事を一覧に出す" out_has "  - articles/a.md"
check "case7: sync ブランチを残さない" no_sync_branch

# ---------------------------------------------------------------------------
# Case 8: main で過去に true だった記事を false に戻しても release の true は維持し、WARN を出す
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case8"
build_history
write articles/f.md "$(article 'published: true' 'f')"
commit_all "main: f を公開"
squash_sync
on_main
write articles/f.md "$(article 'published: false' 'f')"
commit_all "main: f を下書きに戻す"
run_sync

check "case8: exit 0" rc_is 0
check "case8: release の true を維持" fm_published_is articles/f.md true
check "case8: 非公開にする手順の WARN を出す" out_has "release/zenn 側で別途 published: false"
check "case8: WARN に対象記事を出す" out_has "  - articles/f.md"

# ---------------------------------------------------------------------------
# Case 9: merge が競合以外で失敗したら merge を中断して止まる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case9"
build_history
write new.txt "main の新規ファイル"
commit_all "main: new.txt 追加"
git -C "$WORK" push -q -f origin main release/zenn
git -C "$WORK" switch -q -c side release/zenn
write new.txt "未追跡のファイル"
run_sync side

check "case9: exit 1 で止まる" rc_is 1
check "case9: 競合以外の失敗を報告する" out_has "競合以外の理由で失敗"
check "case9: sync ブランチを残さない" no_sync_branch
check "case9: 元のブランチへ戻る" on_branch side

# ---------------------------------------------------------------------------
# Case 10: BOM 付き・CRLF 改行の記事でも release の true を維持し、改行コードと BOM を保つ
# ---------------------------------------------------------------------------
crlf_article() { # $1=published 値 $2=本文 → BOM + CRLF の記事を $3 に書く
  mkdir -p "$(dirname "$WORK/$3")"
  printf '\357\273\277---\r\ntitle: "sample"\r\npublished: %s\r\n---\r\n\r\n%s\r\n' "$1" "$2" > "$WORK/$3"
}
setup "$TMPDIR_ROOT/case10"
build_history
crlf_article false 'crlf v1' articles/w.md
commit_all "main: w（下書き・BOM + CRLF）を追加"
squash_sync
crlf_article true 'crlf v1' articles/w.md
commit_all "release: w を公開"
on_main
crlf_article false 'crlf v2' articles/w.md
commit_all "main: w の本文を更新"
run_sync

check "case10: exit 0" rc_is 0
check "case10: main 版の published 行だけ true にした内容（BOM・CRLF を保つ）" eval '[ "$(git -C "$WORK" show HEAD:articles/w.md | od -An -c)" = "$(git -C "$WORK" show origin/main:articles/w.md | sed "s/published: false/published: true/" | od -An -c)" ]'
check "case10: 公開数が前後で一致" out_has "sync 前 1 件 → sync 後 1 件"

# ---------------------------------------------------------------------------
# Case 11: 非 ASCII のファイル名で競合（modify/delete）しても解決できる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case11"
write "articles_note/new/日本語.md" "v1"
build_history
on_release
write "articles_note/new/日本語.md" "release で編集"
commit_all "release: 日本語.md を編集"
on_main
git -C "$WORK" rm -q "articles_note/new/日本語.md"
commit_all "main: 日本語.md を削除"
run_sync

check "case11: exit 0" rc_is 0
check "case11: main で削除した非 ASCII 名のファイルが消える" absent "articles_note/new/日本語.md"
check "case11: main との差分は published 行だけ" only_published_lines_differ

# ---------------------------------------------------------------------------
# Case 12: 作業ツリーに未コミットの変更があれば何もせずに止まる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case12"
build_history
git -C "$WORK" push -q -f origin main release/zenn
write README.md "未コミットの変更"
set +e
SYNC_OUT=$(cd "$WORK" && bash "$SCRIPT" "chore(release/zenn): test sync" 2>&1)
SYNC_RC=$?
set -e

check "case12: exit 2 で止まる" rc_is 2
check "case12: 未コミットの変更を残す" eval '[ "$(cat "$WORK/README.md")" = "未コミットの変更" ]'
check "case12: sync ブランチを作らない" no_sync_branch

# ---------------------------------------------------------------------------
# Case 13: detached HEAD から実行して止まったら、元のコミットへ戻り sync ブランチを消す
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case13"
build_history
on_release
write images/r/a.png "png"
commit_all "release: main に無い画像"
on_main
git -C "$WORK" push -q -f origin main release/zenn
DETACHED_AT=$(git -C "$WORK" rev-parse main)
git -C "$WORK" switch -q --detach main
set +e
SYNC_OUT=$(cd "$WORK" && bash "$SCRIPT" "chore(release/zenn): test sync" 2>&1)
SYNC_RC=$?
set -e

check "case13: exit 3 で止まる" rc_is 3
check "case13: sync ブランチを残さない" no_sync_branch
check "case13: 元のコミットに detached で戻る" eval '[ -z "$(git -C "$WORK" branch --show-current)" ] && [ "$(git -C "$WORK" rev-parse HEAD)" = "$DETACHED_AT" ]'

# ---------------------------------------------------------------------------
# Case 14: 想定外のエラー（commit の失敗）でも merge 途中で残らず元のブランチへ戻る
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case14"
build_history
write README.md "base v2"
commit_all "main: 更新"
mkdir -p "$TMPDIR_ROOT/case14/hooks"
printf '#!/bin/sh\nexit 1\n' > "$TMPDIR_ROOT/case14/hooks/pre-commit"
chmod +x "$TMPDIR_ROOT/case14/hooks/pre-commit"
git -C "$WORK" config core.hooksPath "$TMPDIR_ROOT/case14/hooks"
run_sync

check "case14: exit 1 で止まる" rc_is 1
check "case14: 想定外のエラーを報告する" out_has "想定外のエラー"
check "case14: merge 途中の状態を残さない" eval '! git -C "$WORK" rev-parse -q --verify MERGE_HEAD >/dev/null'
check "case14: sync ブランチを残さない" no_sync_branch
check "case14: 元のブランチへ戻る" on_branch main

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL PASS"
else
  echo "$FAILURES 件 FAIL" >&2
  exit 1
fi
