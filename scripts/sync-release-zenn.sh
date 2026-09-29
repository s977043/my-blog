#!/usr/bin/env bash
# scripts/sync-release-zenn.sh
# main → release/zenn sync を 1 コマンドで実行する。
# 既知の競合パターン（articles_note/drafts/ の rename/rename, modify/delete, add/add）を main 採用で自動解決する。
# merge 後、ツリーを「main ＋ published トグル」に揃える（main に無いファイルは削除）。
# 止まるときは何も commit せず sync ブランチを捨てる:
#   exit 1: merge が競合以外で失敗 / exit 3: main に無い articles/ books/ images/ がある
#   exit 4: sync 前より published: true の記事・Book が減る
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
BRANCH_NAME="release/zenn-sync-$(date +%Y-%m-%d-%H%M%S)"

cd "$(git rev-parse --show-toplevel)"
ORIG_BRANCH=$(git branch --show-current)

git fetch origin release/zenn main

git switch -c "$BRANCH_NAME" origin/release/zenn

MAIN_REF=origin/main
RELEASE_BASE=$(git rev-parse origin/release/zenn)

bail() { # $1=exit code: 何も commit せずに sync ブランチを捨てて元のブランチへ戻る
  git merge --abort 2>/dev/null || git reset -q --hard "$RELEASE_BASE"
  if [ -n "$ORIG_BRANCH" ]; then
    git switch -q "$ORIG_BRANCH"
    git branch -q -D "$BRANCH_NAME"
  fi
  exit "$1"
}

# -X theirs で多くの conflict を main 採用、残りは下のループで処理。
# 後段の検査で止まるときに何も commit しないよう、merge は commit せずに進める。
set +e
git merge --no-ff --no-commit -X theirs "$MAIN_REF"
MERGE_RC=$?
set -e

# Unmerged paths を一括処理: main にあれば main 版採用、無ければ削除
UNMERGED=$(git diff --name-only --diff-filter=U)
if [ "$MERGE_RC" -ne 0 ] && [ -z "$UNMERGED" ]; then
  echo "[sync] FAIL: merge が競合以外の理由で失敗しました（上のメッセージを確認してください）" >&2
  bail 1
fi
if [ -n "$UNMERGED" ]; then
  echo "[sync] resolving $(echo "$UNMERGED" | wc -l) unmerged files (main side wins)"
  while IFS= read -r f; do
    if git ls-tree "$MAIN_REF" "$f" 2>/dev/null | grep -q .; then
      git checkout --theirs -- "$f"
      git add "$f"
    else
      git rm -f "$f" >/dev/null
    fi
  done <<< "$UNMERGED"
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

is_toggleable() { # published トグルを持てるのは Zenn 記事と Book の config だけ
  case "$1" in
    articles/*.md | books/*/config.yaml) return 0 ;;
    *) return 1 ;;
  esac
}

# published の判定と書き換えは front matter（Book の config.yaml はファイル全体）だけを対象にする。
# 本文のコードブロックにある published: 行は拾わない。値の引用符・行末コメント・大文字小文字の揺れも受け付ける。
FM_AWK='
BEGIN {
  infm = yaml; state = "none"
  val = "[\"" q "]?([Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee])[\"" q "]?"
  line_re = "^published:[ \t]*" val "[ \t]*(#.*)?$"
  true_re = "^published:[ \t]*[\"" q "]?[Tt][Rr][Uu][Ee]"
}
NR == 1 && !yaml && /^---[ \t]*$/ { infm = 1; if (mode == "set") print; next }
!yaml && infm && /^---[ \t]*$/ { infm = 0 }
infm && state == "none" && $0 ~ line_re {
  state = ($0 ~ true_re) ? "true" : "false"
  if (mode == "set" && state == "false") { print "published: true"; next }
}
mode == "set" { print }
END { if (mode == "get") print state }
'

fm_awk() { # $1=get|set $2=path（stdin に内容）
  local yaml=0
  case "$2" in *.yaml) yaml=1 ;; esac
  awk -v mode="$1" -v yaml="$yaml" -v q="'" "$FM_AWK"
}

pub_state() { # $1=rev（空なら index） $2=path → true / false / none
  { git show "$1:$2" 2>/dev/null || true; } | fm_awk get "$2"
}

toggled_main() { # $1=path: main 版の front matter の published: false を true にした内容
  git show "$MAIN_REF:$1" | fm_awk set "$1"
}

keeps_publish_toggle() { # $1=path: sync 前の release/zenn が true、main が false のときだけ真
  is_toggleable "$1" || return 1
  [ "$(pub_state "$RELEASE_BASE" "$1")" = "true" ] || return 1
  [ "$(pub_state "$MAIN_REF" "$1")" = "false" ]
}

main_was_published() { # $1=path: main の過去のどこかで published: true だったか
  local r
  for r in $(git rev-list "$MAIN_REF" -- "$1"); do
    [ "$(pub_state "$r" "$1")" = "true" ] && return 0
  done
  return 1
}

published_list() { # $1=rev（空なら index）: published: true の記事・Book を 1 行ずつ
  local f
  if [ -n "$1" ]; then git ls-tree -r --name-only "$1" -- articles books; else git ls-files -- articles books; fi |
    while IFS= read -r f; do
      is_toggleable "$f" || continue
      [ "$(pub_state "$1" "$f")" = "true" ] && echo "$f"
    done
  return 0
}

DELETE=()
RESTORE=()
GATED=()
while IFS= read -r -d '' status && IFS= read -r -d '' f; do
  if [ "$status" = "A" ]; then
    case "$f" in
      articles/* | books/* | images/*) GATED+=("$f") ;;
      *) DELETE+=("$f") ;;
    esac
  else
    RESTORE+=("$f")
  fi
done < <(git diff --cached --no-renames --name-status -z "$MAIN_REF")

if [ "${#GATED[@]}" -gt 0 ]; then
  echo "" >&2
  echo "[sync] STOP: main に無い Zenn 記事 / Book / 画像が ${#GATED[@]} 件 release/zenn に残っています。" >&2
  echo "[sync] 消すと Zenn の公開記事や画像の削除になりうるため、自動では消しません（何も commit していません）:" >&2
  printf '  - %s\n' "${GATED[@]}" >&2
  echo "[sync] 消す場合: origin/release/zenn からブランチを切って上の一覧を git rm し、release/zenn 宛の PR をマージしてから再実行する" >&2
  echo "[sync] 残す場合: main からブランチを切って git checkout origin/release/zenn -- <上の一覧> で main へ還流し、main 宛の PR をマージしてから再実行する" >&2
  bail 3
fi

for f in ${DELETE[@]+"${DELETE[@]}"}; do git rm -q -- "$f"; done
for f in ${RESTORE[@]+"${RESTORE[@]}"}; do git checkout "$MAIN_REF" -- "$f"; done

# merge が main 版で上書きした場合も含め、sync 前の release/zenn にあった公開トグルを戻す
TOGGLED=()
REVERTED_ON_MAIN=()
while IFS= read -r -d '' f; do
  if keeps_publish_toggle "$f"; then
    toggled_main "$f" > "$f"
    git add -- "$f"
    TOGGLED+=("$f")
    if main_was_published "$f"; then REVERTED_ON_MAIN+=("$f"); fi
  fi
done < <(git diff --no-renames --name-only -z "$MAIN_REF" "$RELEASE_BASE" -- articles books)

if [ "${#DELETE[@]}" -gt 0 ]; then
  echo "[sync] main に無い ${#DELETE[@]} 件を削除:"
  printf '  - %s\n' "${DELETE[@]}"
fi
if [ "${#RESTORE[@]}" -gt 0 ]; then
  echo "[sync] main と内容がずれていた ${#RESTORE[@]} 件を main 版に戻した:"
  printf '  - %s\n' "${RESTORE[@]}"
fi
if [ "${#TOGGLED[@]}" -gt 0 ]; then
  echo "[sync] release/zenn の published: true を維持した ${#TOGGLED[@]} 件:"
  printf '  - %s\n' "${TOGGLED[@]}"
fi
if [ "${#REVERTED_ON_MAIN[@]}" -gt 0 ]; then
  echo "[sync] WARN: 次の記事は main で published: false に戻されていますが、sync では release/zenn の true を維持しました。" >&2
  echo "[sync] 非公開にするには release/zenn 側で別途 published: false にしてください:" >&2
  printf '  - %s\n' "${REVERTED_ON_MAIN[@]}" >&2
fi

# 安全網: sync 前の release/zenn と比べて published: true の記事・Book が減るなら止める
PUB_BEFORE=$(published_list "$RELEASE_BASE" | sort)
PUB_AFTER=$(published_list "" | sort)
PUB_LOST=$(comm -23 <(echo "$PUB_BEFORE") <(echo "$PUB_AFTER") | sed '/^$/d')
PUB_GAINED=$(comm -13 <(echo "$PUB_BEFORE") <(echo "$PUB_AFTER") | sed '/^$/d')
echo "[sync] published: true の記事・Book: sync 前 $(echo "$PUB_BEFORE" | sed '/^$/d' | wc -l | tr -d ' ') 件 → sync 後 $(echo "$PUB_AFTER" | sed '/^$/d' | wc -l | tr -d ' ') 件"
if [ -n "$PUB_GAINED" ]; then
  echo "[sync] この sync で published: true になる記事・Book（新規公開の確認用）:"
  echo "$PUB_GAINED" | sed 's/^/  - /'
fi
if [ -n "$PUB_LOST" ]; then
  echo "" >&2
  echo "[sync] STOP: この sync で published: true でなくなる記事・Book があります（何も commit していません）:" >&2
  echo "$PUB_LOST" | sed 's/^/  - /' >&2
  echo "[sync] front matter の published 行の書き方と、main 側での削除・変更を確認してください" >&2
  bail 4
fi

if git rev-parse -q --verify MERGE_HEAD >/dev/null || [ -n "$(git diff --cached --name-only)" ]; then
  git commit -q -m "$COMMIT_MSG"
else
  echo "[sync] release/zenn は main ＋ published トグルと一致しています（commit なし）"
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
