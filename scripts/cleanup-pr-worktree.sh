#!/usr/bin/env bash
# scripts/cleanup-pr-worktree.sh
# PR マージに伴う **ローカルの worktree / ブランチ後片付け** 専用コマンド。
#
# ■ このスクリプトはマージしない（設計上の中核）
#   `gh pr merge` は実行しない。AGENTS.md の「自動マージ禁止・著者レビューを必ず通す」
#   は、`gh pr merge` を人（またはエージェント）が明示的に打つという摩擦に依存しており、
#   その摩擦をスクリプトの `--yes` 1 語に置き換えてしまうと承認ゲートが実質無効になる
#   （Claude Code の Bash は常に非 TTY なので「非 TTY 拒否」は --yes 強制装置にしかならず、
#   PreToolUse ガードの `gh pr merge` 文字列マッチもすり抜ける）。
#   よってマージは従来どおり `gh pr merge <n> --squash --delete-branch` を直接打つ。
#
# ■ このスクリプトが解決する問題
#   `gh pr merge <n> --squash --delete-branch` は、そのブランチを git worktree が
#   使っていると必ず次で失敗する（PR のマージとリモートブランチ削除は成功する）。
#     failed to delete local branch <branch>: ... cannot delete branch '<branch>'
#     used by worktree at '<path>'
#   毎回 `git worktree remove` → `git branch -D` → `git fetch --prune` を手で打っていた。
#
# 使い方:
#   # 1) マージ前（任意・推奨）: 対象ブランチを掴んでいる worktree を detach する
#   npm run cleanup:pr -- <PR番号> --pre-merge
#   # 2) マージ（人間／エージェントが直接打つ。承認ゲートはここに掛かる）
#   gh pr merge <PR番号> --squash --delete-branch
#   # 3) マージ後: ローカルブランチ・worktree・remote-tracking を後片付けする
#   npm run cleanup:pr -- <PR番号> [--remove-worktree]
#
#   --pre-merge を省いても 3) だけで後片付けは完結する（3) が必要なら自分で detach する）。
#
# 終了コード:
#   0 = 完了（または --dry-run で問題なし）
#   1 = 前提チェックで中止（PR state 不一致 / staleness FAIL / 未コミット変更 など）
#   2 = 使い方エラー
#   3 = 後片付けの一部に失敗（手動対応が必要）
#
# 環境変数（主にテスト用のフック。通常は指定しない）:
#   CLEANUP_PR_GH    gh コマンド（デフォルト: gh）
#   GH_ENSURE_CMD    アカウント検証コマンド（デフォルト: bash scripts/check-gh-account.sh --fix）
#   STALENESS_CMD    staleness 検査コマンド（デフォルト: bash scripts/check-pr-staleness.sh）

set -euo pipefail

TAG="[cleanup-pr]"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GH_BIN="${CLEANUP_PR_GH:-gh}"
# low-2: パスに空白があっても壊れないよう配列で保持する（既定値は必ず配列リテラル）。
if [ -n "${GH_ENSURE_CMD:-}" ]; then read -r -a ENSURE_ARGV <<< "$GH_ENSURE_CMD"
else ENSURE_ARGV=(bash "$SCRIPT_DIR/check-gh-account.sh" --fix); fi
if [ -n "${STALENESS_CMD:-}" ]; then read -r -a STALE_ARGV <<< "$STALENESS_CMD"
else STALE_ARGV=(bash "$SCRIPT_DIR/check-pr-staleness.sh"); fi

info() { echo "$TAG $*"; }
warn() { echo "$TAG ⚠️  $*" >&2; }
die()  { echo "$TAG ❌ $*" >&2; exit "${2:-1}"; }

usage() {
  cat <<'EOF'
usage: npm run cleanup:pr -- <PR番号> [オプション]

PR マージに伴うローカルの worktree / ブランチ後片付けを行う。
**このコマンドはマージしない。** マージは人間（またはエージェント）が
`gh pr merge <n> --squash --delete-branch` を直接打つ（承認ゲートはそこに掛かる）。

モード:
  （既定）マージ後モード: PR が MERGED であることを確認し、
          worktree の detach → ローカルブランチ削除 → fetch --prune を行う。
  --pre-merge  マージ前モード: PR が OPEN かつ staleness OK であることを確認し、
          対象ブランチを掴んでいる worktree を detach するだけで終わる。
          （detach しておくと gh pr merge --delete-branch が素直に成功する）

オプション:
      --pre-merge           マージ前モード（detach のみ。何も削除しない）
      --dry-run             実行計画だけ出して何も変更しない
      --allow-stale         staleness 検査が FAIL でも続行する（--pre-merge 時のみ意味を持つ）
      --allow-dirty-worktree
                            worktree に未コミット変更があっても続行する。
                            その場合も detach のみで、ディレクトリは削除しない。
      --remove-worktree     後片付けで worktree ディレクトリごと削除する
                            （未コミット変更 / gitignore 対象ファイルがある場合は削除しない）
      --force-remove-worktree
                            gitignore 対象ファイル（.env, node_modules/ など）があっても
                            worktree ディレクトリを削除する。復旧不能なので明示指定時のみ。
  -h, --help                このヘルプ

典型的な流れ:
  npm run cleanup:pr -- 610 --pre-merge
  gh pr merge 610 --squash --delete-branch    # ← 人間ゲートはここ
  npm run cleanup:pr -- 610 --remove-worktree
EOF
}

# ---------------------------------------------------------------------------
# 引数
# ---------------------------------------------------------------------------
PR=""
PRE_MERGE=0
DRY_RUN=0
ALLOW_STALE=0
ALLOW_DIRTY=0
REMOVE_WT=0
FORCE_REMOVE_WT=0

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --pre-merge) PRE_MERGE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --allow-stale) ALLOW_STALE=1 ;;
    --allow-dirty-worktree) ALLOW_DIRTY=1 ;;
    --remove-worktree) REMOVE_WT=1 ;;
    --force-remove-worktree) REMOVE_WT=1; FORCE_REMOVE_WT=1 ;;
    --self-test) exec bash "$SCRIPT_DIR/test-cleanup-pr-worktree.sh" ;;
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
# 1. gh アカウント検証（gh pr view は read-only だが 404 を踏まないよう揃える）
# ---------------------------------------------------------------------------
info "gh アカウント検証: ${ENSURE_ARGV[*]}"
if ! "${ENSURE_ARGV[@]}"; then
  die "gh の active account を期待値に揃えられませんでした。手動で gh auth switch してください"
fi

# ---------------------------------------------------------------------------
# 2. PR state / head branch を取得（read-only）
# ---------------------------------------------------------------------------
PR_INFO=$($GH_BIN pr view "$PR" --json state,headRefName,title \
  --jq '.state + "\t" + .headRefName + "\t" + .title') \
  || die "gh pr view #$PR に失敗しました"

PR_STATE=$(printf '%s' "$PR_INFO" | cut -f1)
BRANCH=$(printf '%s' "$PR_INFO" | cut -f2)
PR_TITLE=$(printf '%s' "$PR_INFO" | cut -f3)

info "PR #$PR [$PR_STATE] $PR_TITLE"
info "head branch: $BRANCH"
[ -n "$BRANCH" ] || die "head branch を特定できませんでした"

if [ "$PRE_MERGE" -eq 1 ]; then
  [ "$PR_STATE" = "OPEN" ] || die "PR #$PR は OPEN ではありません（state=${PR_STATE}）。--pre-merge は不要です"
else
  if [ "$PR_STATE" = "OPEN" ]; then
    die "PR #$PR はまだ OPEN です。後片付けはマージ後に行ってください。
  マージ（人間ゲート）: gh pr merge $PR --squash --delete-branch
  マージ前に worktree を外したい場合: npm run cleanup:pr -- $PR --pre-merge"
  fi
  [ "$PR_STATE" = "MERGED" ] || warn "PR #$PR は MERGED ではありません（state=${PR_STATE}）。CLOSED の後片付けとして続行します"
fi

# ---------------------------------------------------------------------------
# 3. staleness 検査（マージ前モードのみ。マージ後に測っても意味がない）
# ---------------------------------------------------------------------------
if [ "$PRE_MERGE" -eq 1 ]; then
  info "staleness 検査: ${STALE_ARGV[*]} $PR"
  set +e
  "${STALE_ARGV[@]}" "$PR"
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
fi

# ---------------------------------------------------------------------------
# 4. 対象ブランチを掴んでいる worktree を検出
# ---------------------------------------------------------------------------
WT_PATH=""
cur_path=""
while IFS= read -r line; do
  case "$line" in
    worktree\ *) cur_path="${line#worktree }" ;;
    branch\ refs/heads/*)
      if [ "${line#branch refs/heads/}" = "$BRANCH" ]; then WT_PATH="$cur_path"; fi ;;
  esac
done < <(git worktree list --porcelain)

CURRENT_TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null || true)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
if [ "$CURRENT_BRANCH" = "$BRANCH" ] && [ -z "$WT_PATH" ]; then
  WT_PATH="$CURRENT_TOPLEVEL"
fi

WT_DIRTY=0
WT_IGNORED=""
if [ -n "$WT_PATH" ]; then
  info "worktree が $BRANCH を使用中: $WT_PATH"
  if [ -n "$(git -C "$WT_PATH" status --porcelain 2>/dev/null)" ]; then
    WT_DIRTY=1
  fi
  # high-1: `git status --porcelain` は ignored を列挙しない。
  # .env や node_modules/ を置いた worktree でも clean 判定になり、
  # `git worktree remove` がディレクトリごと消す（復旧不能）。
  # ディレクトリ削除の判断には --ignored=matching で ignored も見る。
  WT_IGNORED=$(git -C "$WT_PATH" status --porcelain --ignored=matching 2>/dev/null \
    | grep '^!! ' || true)
else
  info "対象ブランチを使用中の worktree はありません"
fi

# --- 未コミット変更の扱い ---------------------------------------------------
# `git worktree remove --force` はユーザーの作業を無言で捨てるため使わない。
# 未コミット変更を見つけたら既定で中止し、退避方法を提示する。
if [ "$WT_DIRTY" -eq 1 ]; then
  if [ "$ALLOW_DIRTY" -eq 0 ]; then
    git -C "$WT_PATH" status --short >&2
    die "worktree に未コミット変更があります: $WT_PATH
  作業を失わないため中止しました。次のいずれかを実施してください:
    - 変更を commit する
    - git -C '$WT_PATH' stash push -u -m 'cleanup-pr退避'
    - 変更を残したまま続行する（detach のみ・ディレクトリは削除しない）:
        npm run cleanup:pr -- $PR --allow-dirty-worktree"
  fi
  warn "未コミット変更がありますが --allow-dirty-worktree のため続行します（ファイルは削除しません）"
  if [ "$REMOVE_WT" -eq 1 ]; then
    warn "未コミット変更があるため --remove-worktree は無視します（detach のみ）"
    REMOVE_WT=0; FORCE_REMOVE_WT=0
  fi
fi

# --- gitignore 対象ファイルの扱い（high-1）---------------------------------
if [ "$REMOVE_WT" -eq 1 ] && [ -n "$WT_IGNORED" ]; then
  if [ "$FORCE_REMOVE_WT" -eq 0 ]; then
    printf '%s\n' "$WT_IGNORED" >&2
    warn "gitignore 対象ファイルがあるため --remove-worktree を中止します（detach のみ）: $WT_PATH
  .env などは git に無いので消すと復旧できません。次のいずれかを:
    - 必要なファイルを退避してから再実行する
    - 消えてよいと確認できたら --force-remove-worktree を付ける"
    REMOVE_WT=0
  else
    warn "gitignore 対象ファイルがありますが --force-remove-worktree のため削除します: $WT_PATH"
  fi
fi

# ---------------------------------------------------------------------------
# 5. 実行計画
# ---------------------------------------------------------------------------
if [ "$PRE_MERGE" -eq 1 ]; then
  cat <<EOF
$TAG ---- 実行計画（マージ前モード / マージはしない）----
$TAG   1) $([ -n "$WT_PATH" ] && echo "worktree を detach: $WT_PATH" || echo "worktree 操作なし")
$TAG   次にあなたが打つコマンド: $GH_BIN pr merge $PR --squash --delete-branch
EOF
else
  cat <<EOF
$TAG ---- 実行計画（マージ後モード）----
$TAG   1) $([ -n "$WT_PATH" ] && echo "worktree を detach: $WT_PATH" || echo "worktree 操作なし")
$TAG   2) git fetch --prune origin
$TAG   3) ローカルブランチ削除: git branch -D $BRANCH
$TAG   4) $([ "$REMOVE_WT" -eq 1 ] && echo "worktree 削除: $WT_PATH" || echo "worktree ディレクトリは残す")
EOF
fi

if [ "$DRY_RUN" -eq 1 ]; then
  info "--dry-run のためここで終了します（何も変更していません）"
  exit 0
fi

# ---------------------------------------------------------------------------
# 6. detach（ファイルは変更しない）
#    medium-2: 中断（SIGINT/SIGTERM）や想定外の異常終了でも detached を残さないよう
#    trap で復旧する。
# ---------------------------------------------------------------------------
DETACHED=0
CLEANUP_DONE=0
# 復帰は「ブランチがまだ存在する（＝後片付けが完了していない）」ときだけ行う。
# 削除済みなら戻る先が無いので no-op になり、正常終了時は何もしない。
restore_worktree() {
  if [ "$DETACHED" -eq 1 ] && [ "$CLEANUP_DONE" -eq 0 ] && [ -n "$WT_PATH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      warn "worktree を $BRANCH へ復帰させます: $WT_PATH"
      git -C "$WT_PATH" switch "$BRANCH" >/dev/null 2>&1 || \
        warn "復帰に失敗しました。手動で: git -C '$WT_PATH' switch $BRANCH"
    fi
  fi
}
on_signal() { warn "中断シグナルを受け取りました。復旧します"; restore_worktree; exit 130; }
trap on_signal INT TERM
trap restore_worktree EXIT

if [ -n "$WT_PATH" ]; then
  info "worktree を detach します（ファイルは変更しません）: $WT_PATH"
  git -C "$WT_PATH" switch --detach >/dev/null 2>&1 \
    || die "worktree の detach に失敗しました: $WT_PATH"
  DETACHED=1
fi

if [ "$PRE_MERGE" -eq 1 ]; then
  CLEANUP_DONE=1   # detach は意図した最終状態なので EXIT trap で戻さない
  info "✅ detach 完了。次はあなたが直接マージしてください:"
  info "    $GH_BIN pr merge $PR --squash --delete-branch"
  info "    その後: npm run cleanup:pr -- $PR$([ "$REMOVE_WT" -eq 1 ] && echo ' --remove-worktree')"
  exit 0
fi

# ---------------------------------------------------------------------------
# 7. 後片付け（マージ後モード）
#    squash マージなのでローカルブランチは git 的には未マージ扱い（-d は失敗する）。
#    PR state を MERGED と確認済みなので -D で削除する。
# ---------------------------------------------------------------------------
CLEANUP_FAILED=0

# remote-tracking ref の掃除を先に行う（リモート実体は squash マージ時に削除済み）。
# ここで中断されてもローカルブランチはまだ生きているので、EXIT/INT trap の
# restore_worktree が worktree を元のブランチへ戻せる（medium-2）。
git fetch --prune origin >/dev/null 2>&1 || warn "git fetch --prune origin に失敗（無視して続行）"

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

if [ "$REMOVE_WT" -eq 1 ] && [ -n "$WT_PATH" ] && [ "$WT_PATH" != "$CURRENT_TOPLEVEL" ]; then
  if git worktree remove "$WT_PATH" >/dev/null 2>&1; then
    info "worktree を削除: $WT_PATH"
    WT_PATH=""
  else
    warn "worktree の削除に失敗（--force は使いません）: $WT_PATH"
    CLEANUP_FAILED=1
  fi
elif [ "$REMOVE_WT" -eq 1 ] && [ "$WT_PATH" = "$CURRENT_TOPLEVEL" ]; then
  warn "いま自分がいる worktree なので削除しません: $WT_PATH"
fi

git worktree prune >/dev/null 2>&1 || true

# --- medium-1: 実行元の checkout を detached HEAD のまま放置しない ----------
# 元のブランチは削除済みなので戻れない。実行元（自分がいる checkout）が対象ブランチ
# だった場合は既定ブランチへ移動し、「現在地が分かる」状態にする
# （CLAUDE.md の並列セッション運用は `git branch --show-current` による現在地確認が前提）。
# 別ディレクトリの worktree は detached のまま残す（そこは作業場所として温存する）。
if [ "$DETACHED" -eq 1 ] && [ -n "$WT_PATH" ] && [ "$WT_PATH" = "$CURRENT_TOPLEVEL" ]; then
  DEFAULT_BRANCH=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || true)
  [ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH=main
  if [ -z "$(git -C "$WT_PATH" branch --show-current 2>/dev/null)" ]; then
    if git -C "$WT_PATH" switch "$DEFAULT_BRANCH" >/dev/null 2>&1; then
      info "実行元を $DEFAULT_BRANCH へ戻しました（detached HEAD を残さない）: $WT_PATH"
    else
      warn "detached HEAD のままです（$DEFAULT_BRANCH が他の worktree で使用中かもしれません）。
  手動で: git -C '$WT_PATH' switch <branch>"
    fi
  fi
elif [ "$DETACHED" -eq 1 ] && [ -n "$WT_PATH" ]; then
  info "worktree は detached HEAD のまま残しています: $WT_PATH"
fi

if [ "$CLEANUP_FAILED" -eq 1 ]; then
  die "後片付けが未完了です。上記 WARN を手動で解消してください" 3
fi

info "✅ 完了: PR #$PR のローカル後片付けを終えました"
