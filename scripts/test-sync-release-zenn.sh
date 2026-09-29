#!/usr/bin/env bash
# scripts/test-sync-release-zenn.sh
# sync-release-zenn.sh の fixture ベース self-test。
# 一時 git リポジトリで「main と履歴がつながらない（squash で積んだ）release/zenn」を再現し、
# 同期後のツリーが「main ＋ published トグル」になるかを検証する。
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

article() { # $1=published 値 $2=本文
  printf -- '---\ntitle: "sample"\ntype: "tech"\npublished: %s\n---\n\n%s' "$1" "$2"
}

commit_all() { git -C "$WORK" add -A; git -C "$WORK" commit -q -m "$1"; }

squash_sync() { # release/zenn に main のツリーを親なしで写す（main と履歴をつなげない）
  git -C "$WORK" switch -q release/zenn
  git -C "$WORK" rm -rq --cached .
  git -C "$WORK" clean -fdq
  git -C "$WORK" checkout main -- .
  commit_all "squash sync"
}

run_sync() {
  git -C "$WORK" push -q -f origin main release/zenn
  git -C "$WORK" switch -q main
  set +e
  SYNC_OUT=$(cd "$WORK" && bash "$SCRIPT" "chore(release/zenn): test sync" 2>&1)
  SYNC_RC=$?
  set -e
}

exists() { git -C "$WORK" cat-file -e "HEAD:$1" 2>/dev/null; }
absent() { ! exists "$1"; }
same_as_main() { [ "$(git -C "$WORK" show "HEAD:$1")" = "$(git -C "$WORK" show "origin/main:$1")" ]; }
published_is() { git -C "$WORK" show "HEAD:$1" | grep -x "published: $2" >/dev/null; }
body_has() { git -C "$WORK" show "HEAD:$1" | grep -F "$2" >/dev/null; }
out_has() { echo "$SYNC_OUT" | grep -F "$1" >/dev/null; }
rc_is() { [ "$SYNC_RC" = "$1" ]; }
only_toggle_diff() { # main との差分が articles/a.md の published 行 1 行だけか
  local d
  d=$(git -C "$WORK" diff --no-renames origin/main HEAD --numstat)
  [ "$d" = "$(printf '1\t1\tarticles/a.md')" ]
}

build_history() { # 共通の前史: 古い merge-base → squash で積まれた release/zenn → release 側だけの公開トグル
  write README.md "base"
  write articles_note/published/p.md "$(printf 'River Reviewer の紹介\n\n段落2\n段落3\n段落4\n別の段落')"
  commit_all "base (merge-base)"
  git -C "$WORK" branch release/zenn

  write articles/a.md "$(article false '本文 v1')"
  write articles_note/new/old-name.md "note 原稿"
  write reviews/note/new/old-name.md "レビュー"
  commit_all "main: 記事と note 原稿を追加"
  squash_sync

  sed -i.bak 's/^published: false$/published: true/' "$WORK/articles/a.md" && rm "$WORK/articles/a.md.bak"
  commit_all "release: a を公開"
  git -C "$WORK" switch -q main
}

# ---------------------------------------------------------------------------
# Case 1: main 側の削除・リネームが release/zenn に残らず、published トグルは残る
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case1"
build_history
git -C "$WORK" mv articles_note/new/old-name.md articles_note/new/PRONI-old-name.md
git -C "$WORK" rm -q reviews/note/new/old-name.md
write articles/a.md "$(article false '本文 v2')"
commit_all "main: リネーム・削除・本文更新"
run_sync

check "case1: exit 0" rc_is 0
check "case1: リネーム前の旧名が消える" absent articles_note/new/old-name.md
check "case1: リネーム後の新名がある" exists articles_note/new/PRONI-old-name.md
check "case1: main で削除したレビューが消える" absent reviews/note/new/old-name.md
check "case1: release の published: true が残る" published_is articles/a.md true
check "case1: 記事本文は main の最新" body_has articles/a.md "本文 v2"
check "case1: main との差分は published 行だけ" only_toggle_diff
check "case1: 削除したファイルをログに出す" out_has "  - articles_note/new/old-name.md"
check "case1: 不変条件の検査が OK を出す" out_has "main との差分は published トグルのみ"

# ---------------------------------------------------------------------------
# Case 2: release 側だけが変えた（main が触っていない）hunk は main 版に戻る
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case2"
build_history
git -C "$WORK" switch -q release/zenn
write articles_note/published/p.md "$(printf 'River Review の紹介\n\n段落2\n段落3\n段落4\n別の段落')"
commit_all "release: 独自編集"
git -C "$WORK" switch -q main
write articles_note/published/p.md "$(printf 'River Reviewer の紹介\n\n段落2\n段落3\n段落4\n別の段落（main で更新）')"
commit_all "main: 別の段落だけ更新"
run_sync

check "case2: exit 0" rc_is 0
check "case2: release 独自の hunk が main 版に戻る" same_as_main articles_note/published/p.md
check "case2: 戻したファイルをログに出す" out_has "  - articles_note/published/p.md"
check "case2: main との差分は published 行だけ" only_toggle_diff

# ---------------------------------------------------------------------------
# Case 3: main に無い Zenn 記事が release/zenn にある → 消さずに exit 3 で止まる
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case3"
build_history
git -C "$WORK" switch -q release/zenn
write articles/release-only.md "$(article true 'release にだけある記事')"
write books/release-only/config.yaml "published: true"
commit_all "release: main に無い記事と Book"
git -C "$WORK" switch -q main
git -C "$WORK" rm -q reviews/note/new/old-name.md
commit_all "main: レビュー削除"
run_sync

check "case3: exit 3 で止まる" rc_is 3
check "case3: STOP を出す" out_has "STOP"
check "case3: 対象の記事を一覧に出す" out_has "  - articles/release-only.md"
check "case3: 対象の Book を一覧に出す" out_has "  - books/release-only/config.yaml"
check "case3: 記事を消さない" exists articles/release-only.md
check "case3: Book を消さない" exists books/release-only/config.yaml
check "case3: articles/ と books/ 以外の削除は済ませる" absent reviews/note/new/old-name.md

# ---------------------------------------------------------------------------
# Case 4: main で published: true にした記事は main のまま（release 側の false に戻さない）
# ---------------------------------------------------------------------------
setup "$TMPDIR_ROOT/case4"
build_history
write articles/b.md "$(article true '新規公開')"
commit_all "main: b を公開"
run_sync

check "case4: exit 0" rc_is 0
check "case4: main で公開した記事は published: true" published_is articles/b.md true
check "case4: main との差分は published 行だけ" only_toggle_diff

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "ALL PASS"
else
  echo "$FAILURES 件 FAIL" >&2
  exit 1
fi
