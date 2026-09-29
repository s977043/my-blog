#!/usr/bin/env bash
# scripts/sync-release-zenn.sh
# main → release/zenn sync を 1 コマンドで実行する。
# 既知の競合パターン（articles_note/drafts/ の rename/rename, modify/delete, add/add）を main 採用で自動解決する。
# merge 後、ツリーを「main ＋ published トグル」に揃える（main に無いファイルは削除。
# ただし articles/ と books/ は削除せず一覧を出して exit 3 で止める）。
#
# 使い方:
#   scripts/sync-release-zenn.sh "<commit message>"
#
# 例:
#   scripts/sync-release-zenn.sh "chore(release/zenn): sync from main — publish article-X"
#
# 前提:
#   - 現在ブランチが release/zenn ではないこと（誤って origin/release/zenn を更新しないため）
#   - gh active account が s977043 であること（pre-push hook で検証）

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 \"<commit message>\"" >&2
  exit 2
fi

COMMIT_MSG="$1"
BRANCH_NAME="release/zenn-sync-$(date +%Y-%m-%d-%H%M)"

git fetch origin release/zenn main

git switch -c "$BRANCH_NAME" origin/release/zenn

# -X theirs で多くの conflict を main 採用、残りは下のループで処理
set +e
git merge -X theirs origin/main -m "$COMMIT_MSG"
MERGE_RC=$?
set -e

# Unmerged paths を一括処理: main にあれば main 版採用、無ければ削除
UNMERGED=$(git diff --name-only --diff-filter=U)
if [ -n "$UNMERGED" ]; then
  echo "[sync] resolving $(echo "$UNMERGED" | wc -l) unmerged files (main side wins)"
  while IFS= read -r f; do
    if git ls-tree origin/main "$f" 2>/dev/null | grep -q .; then
      git checkout --theirs -- "$f"
      git add "$f"
    else
      git rm -f "$f" >/dev/null
    fi
  done <<< "$UNMERGED"
  git commit -m "$COMMIT_MSG"
fi

# 最終確認
if [ -n "$(git diff --name-only --diff-filter=U)" ]; then
  echo "[sync] FAIL: 解決できなかった conflict が残っています。手動で解決してください" >&2
  git status --short >&2
  exit 1
fi

# ── main 単方向の復元 ──
# release/zenn は squash の積み重ねで main と履歴がつながらず、merge-base が古い。
# 3-way merge は「base に無く release 側で追加 → main 側で削除（リネーム）」を release 側の追加として残し、
# 「base から release 側だけが変えた hunk」も release 側の内容で残す。-X theirs は競合 hunk にしか効かない。
# そこで merge 後のツリーを main に揃え直し、許可された published トグルだけを戻す。
MAIN_REF=origin/main
RELEASE_BASE=$(git rev-parse origin/release/zenn)

is_toggleable() { # published トグルを持てるのは Zenn 記事と Book の config だけ
  case "$1" in
    articles/*.md | books/*/config.yaml) return 0 ;;
    *) return 1 ;;
  esac
}

toggled_main() { # $1=path: main 版の最初の published: false を true にした内容
  git show "$MAIN_REF:$1" | awk '!done && /^published:[[:space:]]*false[[:space:]]*$/ { print "published: true"; done = 1; next } { print }'
}

keeps_publish_toggle() { # $1=path: sync 前の release/zenn が true、main が false のときだけ真
  is_toggleable "$1" || return 1
  git cat-file -e "$RELEASE_BASE:$1" 2>/dev/null || return 1
  git show "$RELEASE_BASE:$1" | grep -E '^published:[[:space:]]*true[[:space:]]*$' >/dev/null || return 1
  git show "$MAIN_REF:$1" | grep -E '^published:[[:space:]]*false[[:space:]]*$' >/dev/null
}

DELETED=()
RESTORED=()
TOGGLED=()
GATED=()
while IFS= read -r -d '' status && IFS= read -r -d '' f; do
  if [ "$status" = "A" ]; then
    case "$f" in
      articles/* | books/*) GATED+=("$f") ;;
      *) git rm -q -- "$f"; DELETED+=("$f") ;;
    esac
    continue
  fi
  git checkout "$MAIN_REF" -- "$f"
  RESTORED+=("$f")
done < <(git diff --no-renames --name-status -z "$MAIN_REF" HEAD)

# merge が main 版で上書きした場合も含め、sync 前の release/zenn にあった公開トグルを戻す
while IFS= read -r -d '' f; do
  if keeps_publish_toggle "$f"; then
    toggled_main "$f" > "$f"
    git add -- "$f"
    TOGGLED+=("$f")
  fi
done < <(git diff --no-renames --name-only -z "$MAIN_REF" "$RELEASE_BASE" -- articles books)

if [ "${#DELETED[@]}" -gt 0 ]; then
  echo "[sync] main に無い ${#DELETED[@]} 件を削除:"
  printf '  - %s\n' "${DELETED[@]}"
fi
if [ "${#RESTORED[@]}" -gt 0 ]; then
  echo "[sync] main と内容がずれていた ${#RESTORED[@]} 件を main 版に戻した:"
  printf '  - %s\n' "${RESTORED[@]}"
fi
if [ "${#TOGGLED[@]}" -gt 0 ]; then
  echo "[sync] release/zenn の published: true を維持した ${#TOGGLED[@]} 件:"
  printf '  - %s\n' "${TOGGLED[@]}"
fi
if [ -n "$(git diff --cached --name-only)" ]; then
  git commit -q -m "$COMMIT_MSG" -m "main に無いファイルの削除と、main からずれた内容の復元"
fi

if [ "${#GATED[@]}" -gt 0 ]; then
  echo "" >&2
  echo "[sync] STOP: main に無い Zenn 記事 / Book のファイルが ${#GATED[@]} 件 release/zenn に残っています。" >&2
  echo "[sync] 消すと Zenn の公開記事の削除になりうるため、自動では消しません:" >&2
  printf '  - %s\n' "${GATED[@]}" >&2
  echo "[sync] 消してよいと確認できたら、$BRANCH_NAME で git rm して commit してから push してください" >&2
  exit 3
fi

# 不変条件の検査: main との差分が published トグルだけか
VIOLATIONS=()
while IFS= read -r -d '' status && IFS= read -r -d '' f; do
  if [ "$status" = "M" ] && keeps_publish_toggle "$f" && [ "$(git show "HEAD:$f")" = "$(toggled_main "$f")" ]; then
    continue
  fi
  VIOLATIONS+=("$status $f")
done < <(git diff --no-renames --name-status -z "$MAIN_REF" HEAD)
if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  echo "[sync] WARN: main との差分に published トグル以外が残っています:" >&2
  printf '  - %s\n' "${VIOLATIONS[@]}" >&2
else
  echo "[sync] main との差分は published トグルのみ"
fi

echo ""
echo "[sync] OK: $BRANCH_NAME に main を反映済み"

# 公開影響プレビュー（ドライラン）: この sync が release/zenn に新規に持ち込む publish 数を
# diff モード（#393 で導入）で表示する。不可逆な公開の前に「何記事が公開されるか」を機械的に確認。
# 非ブロッキング（STRICT 未指定＝表示のみ）。2 件以上なら WARN(FAIL相当) が出る。
echo ""
echo "[sync] ── 公開影響プレビュー（このsyncで新規公開される記事）──"
if [ -f scripts/check-zenn-publish-pace.js ]; then
  BASE_REF=origin/release/zenn node scripts/check-zenn-publish-pace.js || true
fi
echo "[sync] ─────────────────────────────────────────────"

echo ""
echo "[sync] 次の手順:"
echo "  git push -u origin $BRANCH_NAME"
echo "  gh pr create --base release/zenn --title '$COMMIT_MSG'"
