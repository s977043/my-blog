#!/usr/bin/env bash
# scripts/clean-merged-branches.sh
# PR がマージ済みのローカルブランチを洗い出し、削除する（既定は dry-run）。
#
# ■ なぜ必要か
#   このリポジトリは squash マージのみ。squash では元のコミットが main の祖先にならないため、
#   マージ済みでも `git branch -d`・`git merge-base --is-ancestor`・`git diff main...<branch>` は
#   「未マージ」と判定する（AGENT_LEARNINGS 2026-09-24）。判定の正は PR の状態なので、
#   `gh pr list --state all --head <branch>` が MERGED のものだけを対象にする。
#
# ■ cleanup-pr-worktree.sh との関係
#   cleanup-pr-worktree.sh は PR 番号を指定して 1 本ずつ後片付けする（マージ直後用）。
#   本スクリプトは、後片付けされずに残ったブランチをまとめて洗い出す（セッション終了時用）。
#
# 使い方:
#   npm run clean:merged-branches          # dry-run: 候補と SHA を表示するだけ
#   npm run clean:merged-branches -- --apply   # 候補を git branch -D で削除
#
# 対象外:
#   - main / release/zenn / 現在のブランチ
#   - worktree で使用中のブランチ（先に worktree を外す）
#   - PR が無い・OPEN・CLOSED（未マージ）のブランチ
#
# 環境変数:
#   CLEAN_BRANCHES_GH  gh の代わりに使うコマンド（テスト用の差し替え）
#
# 終了コード: 0 = 正常（候補 0 件も含む） / 1 = 引数不正 / 2 = git リポジトリ外

set -u

APPLY=0
case "${1:-}" in
  "") ;;
  --apply) APPLY=1 ;;
  --dry-run) ;;
  *) echo "usage: $0 [--dry-run|--apply]" >&2; exit 1 ;;
esac

GH="${CLEAN_BRANCHES_GH:-gh}"
git rev-parse --git-dir >/dev/null 2>&1 || { echo "[clean-merged-branches] git リポジトリ外です" >&2; exit 2; }

CURRENT=$(git branch --show-current)
IN_WORKTREE=$(git worktree list --porcelain | sed -n 's#^branch refs/heads/##p')

found=0
while IFS= read -r b; do
  [ -n "$b" ] || continue
  case "$b" in main|release/zenn) continue ;; esac
  [ "$b" = "$CURRENT" ] && continue
  if printf '%s\n' "$IN_WORKTREE" | grep -qxF "$b"; then
    echo "skip   ${b}（worktree で使用中）"
    continue
  fi
  state=$("$GH" pr list --state all --head "$b" --json number,state --jq '.[0] | "\(.number) \(.state)"' 2>/dev/null)
  case "$state" in
    *" MERGED") ;;
    *) continue ;;
  esac
  sha=$(git rev-parse --short "$b")
  found=$((found + 1))
  if [ "$APPLY" = "1" ]; then
    git branch -D "$b" >/dev/null && echo "delete ${b}（PR #${state%% *}、復元: git branch $b ${sha}）"
  else
    echo "候補   ${b}（PR #${state%% *} MERGED、${sha}）"
  fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads/)

if [ "$found" -eq 0 ]; then
  echo "[clean-merged-branches] マージ済みのローカルブランチはありません"
elif [ "$APPLY" = "0" ]; then
  echo "[clean-merged-branches] dry-run: ${found} 件。削除するには --apply を付けて再実行"
fi
