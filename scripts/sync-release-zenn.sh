#!/usr/bin/env bash
# scripts/sync-release-zenn.sh
# main → release/zenn sync を 1 コマンドで実行する。
# 既知の競合パターン（articles_note/drafts/ の rename/rename, modify/delete, add/add）を main 採用で自動解決する。
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

echo ""
echo "[sync] OK: $BRANCH_NAME に main を反映済み"

# 公開影響プレビュー（ドライラン）: この sync が release/zenn に新規に持ち込む publish 数を
# diff モード（#393 で導入）で表示する。不可逆な公開の前に「何記事が公開されるか」を機械的に確認。
# 非ブロッキング（STRICT 未指定＝表示のみ）。2 件以上なら WARN(FAIL相当) が出る。
echo ""
echo "[sync] ── 公開影響プレビュー（このsyncで新規公開される記事）──"
BASE_REF=origin/release/zenn node scripts/check-zenn-publish-pace.js || true
echo "[sync] ─────────────────────────────────────────────"

echo ""
echo "[sync] 次の手順:"
echo "  git push -u origin $BRANCH_NAME"
echo "  gh pr create --base release/zenn --title '$COMMIT_MSG'"
