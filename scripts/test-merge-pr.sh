#!/usr/bin/env bash
# scripts/test-merge-pr.sh
# merge-pr.sh の fixture ベース self-test。
#
# 実行: bash scripts/test-merge-pr.sh  /  npm run test:merge-pr
# 期待: 全ケース PASS で exit 0
#
# ■ 実 API を叩かない作り（hermetic）
#   - GitHub には一切アクセスしない。`gh` は PATH ではなく MERGE_PR_GH で注入する
#     偽 gh スクリプト（fake-gh）に差し替える。fake-gh は
#       * PR state をファイルで持ち（OPEN → MERGED）
#       * `pr merge` でベアリポジトリのリモートブランチを削除し
#       * 本物の gh と同様に `git branch -D` を試みて、worktree が掴んでいると
#         "cannot delete branch ... used by worktree at" で exit 1 する
#     という形で「今回直したい実挙動」を忠実に再現する（case0 で再現性を検証）。
#   - gh アカウント検証と staleness 検査も GH_ENSURE_CMD / STALENESS_CMD で
#     スタブに差し替える（実スクリプトはネットワーク・gh に依存するため）。
#   - git 操作はすべて mktemp 配下のローカル bare remote + clone で完結する。

set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/merge-pr.sh"
[ -f "$SCRIPT" ] || { echo "merge-pr.sh が見つかりません: $SCRIPT" >&2; exit 1; }

ROOT=$(mktemp -d)
trap 'rm -rf "$ROOT"' EXIT
FAILURES=0
CASE_NO=0

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; shift; [ $# -gt 0 ] && echo "$*" | sed 's/^/  | /'; FAILURES=$((FAILURES + 1)); }

assert_exit() { # name want got out
  if [ "$3" = "$2" ]; then pass "$1 (exit=$3)"; else fail "$1 — 期待 exit=$2 / 実際 exit=$3" "$4"; fi
}
assert_contains() { # name needle out
  if printf '%s' "$3" | grep -q -- "$2"; then pass "$1"; else fail "$1 — 出力に '$2' が無い" "$3"; fi
}
assert_true() { # name condition-result(0/1) message
  if [ "$2" -eq 0 ]; then pass "$1"; else fail "$1 — $3"; fi
}

# --- 偽 gh -----------------------------------------------------------------
FAKE_GH="$ROOT/fake-gh"
cat > "$FAKE_GH" <<'EOF'
#!/usr/bin/env bash
# 偽 gh。GH_FIXTURE_REPO / GH_FIXTURE_REMOTE / GH_FIXTURE_STATE / GH_FIXTURE_BRANCH /
# GH_FIXTURE_LOG を使い、実 API を叩かずに gh pr view / gh pr merge を模す。
set -uo pipefail
echo "$*" >> "$GH_FIXTURE_LOG"
STATE=$(cat "$GH_FIXTURE_STATE")
BRANCH="$GH_FIXTURE_BRANCH"
sub="${1:-}"; act="${2:-}"
if [ "$sub" = "pr" ] && [ "$act" = "view" ]; then
  if printf '%s' "$*" | grep -q "headRefName"; then
    printf '%s\t%s\t%s\n' "$STATE" "$BRANCH" "fixture PR title"
  else
    printf '%s\n' "$STATE"
  fi
  exit 0
fi
if [ "$sub" = "pr" ] && [ "$act" = "merge" ]; then
  if [ "$STATE" != "OPEN" ]; then
    echo "GraphQL: Pull request is not open" >&2; exit 1
  fi
  echo "MERGED" > "$GH_FIXTURE_STATE"
  git -C "$GH_FIXTURE_REMOTE" branch -D "$BRANCH" >/dev/null 2>&1 || true
  echo "✓ Squashed and merged pull request"
  # 本物の gh と同じくローカルブランチ削除まで面倒を見る
  if ! err=$(git -C "$GH_FIXTURE_REPO" branch -D "$BRANCH" 2>&1); then
    echo "failed to delete local branch $BRANCH: $err" >&2
    exit 1
  fi
  exit 0
fi
echo "fake-gh: 未対応の呼び出し: $*" >&2
exit 64
EOF
chmod +x "$FAKE_GH"

STUB_OK="$ROOT/stub-ok"; printf '#!/usr/bin/env bash\nexit 0\n' > "$STUB_OK"; chmod +x "$STUB_OK"
STUB_FAIL="$ROOT/stub-fail"; printf '#!/usr/bin/env bash\necho "stub: FAIL" >&2\nexit 1\n' > "$STUB_FAIL"; chmod +x "$STUB_FAIL"

# --- fixture ---------------------------------------------------------------
BRANCH="feature/x"

new_fixture() { # $1=name  → FX_REPO / FX_WT / FX_STATE / FX_LOG / FX_REMOTE
  local d="$ROOT/$1"
  FX_REMOTE="$d/remote.git"; FX_REPO="$d/repo"; FX_WT="$d/wt"
  FX_STATE="$d/state"; FX_LOG="$d/gh.log"
  mkdir -p "$d"
  git init -q --bare -b main "$FX_REMOTE"
  git init -q -b main "$d/seed"
  git -C "$d/seed" config user.email t@example.com
  git -C "$d/seed" config user.name fixture
  git -C "$d/seed" config commit.gpgsign false
  echo base > "$d/seed/README.md"
  git -C "$d/seed" add -A && git -C "$d/seed" commit -qm base
  git -C "$d/seed" push -q "$FX_REMOTE" main
  git clone -q "$FX_REMOTE" "$FX_REPO"
  git -C "$FX_REPO" config user.email t@example.com
  git -C "$FX_REPO" config user.name fixture
  git -C "$FX_REPO" config commit.gpgsign false
  echo OPEN > "$FX_STATE"; : > "$FX_LOG"
}

add_worktree() { # 対象ブランチを掴む worktree を作る
  git -C "$FX_REPO" worktree add -q "$FX_WT" -b "$BRANCH" main
  echo work > "$FX_WT/feature.md"
  git -C "$FX_WT" add -A && git -C "$FX_WT" commit -qm "feature commit"
}
add_branch_only() { git -C "$FX_REPO" branch "$BRANCH" main; }

run_merge() { # 残りは merge-pr.sh へのフラグ
  set +e
  OUT=$(cd "$FX_REPO" && \
    MERGE_PR_GH="$FAKE_GH" \
    GH_FIXTURE_REPO="$FX_REPO" GH_FIXTURE_REMOTE="$FX_REMOTE" \
    GH_FIXTURE_STATE="$FX_STATE" GH_FIXTURE_BRANCH="$BRANCH" GH_FIXTURE_LOG="$FX_LOG" \
    GH_ENSURE_CMD="${ENSURE_CMD:-$STUB_OK}" STALENESS_CMD="${STALE_CMD:-$STUB_OK}" \
    bash "$SCRIPT" 123 "$@" </dev/null 2>&1)
  STATUS=$?
  set -e
}

branch_exists() { git -C "$FX_REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; }
merge_called() { grep -q "pr merge" "$FX_LOG"; }

# ---------------------------------------------------------------------------
# case0: fixture の忠実性 — 素の gh 相当を worktree 保持中に叩くと本番と同じ失敗をする
# ---------------------------------------------------------------------------
new_fixture case0; add_worktree
set +e
OUT=$(MERGE_PR_GH= GH_FIXTURE_REPO="$FX_REPO" GH_FIXTURE_REMOTE="$FX_REMOTE" \
  GH_FIXTURE_STATE="$FX_STATE" GH_FIXTURE_BRANCH="$BRANCH" GH_FIXTURE_LOG="$FX_LOG" \
  "$FAKE_GH" pr merge 123 --squash --delete-branch 2>&1)
STATUS=$?
set -e
assert_exit "case0 fixture再現: 素の gh pr merge は失敗する" 1 "$STATUS" "$OUT"
assert_contains "case0 エラーメッセージが本番同等" "used by worktree at" "$OUT"

# ---------------------------------------------------------------------------
# case1: 本命 — worktree が掴んだ clean ブランチをマージし、後片付けまで完了する
# ---------------------------------------------------------------------------
new_fixture case1; add_worktree
run_merge --yes
assert_exit "case1 マージ成功" 0 "$STATUS" "$OUT"
assert_true "case1 ローカルブランチが削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"
assert_true "case1 worktree ディレクトリは残っている" "$([ -d "$FX_WT" ] && echo 0 || echo 1)" "worktree が消えた"
assert_true "case1 worktree は detached HEAD" \
  "$([ -z "$(git -C "$FX_WT" branch --show-current)" ] && echo 0 || echo 1)" "detach されていない"
assert_true "case1 worktree のファイルが保持されている" \
  "$([ -f "$FX_WT/feature.md" ] && echo 0 || echo 1)" "feature.md が消えた"

# ---------------------------------------------------------------------------
# case2: 未コミット変更 → 既定では中止し、マージも実行しない（作業を失わせない）
# ---------------------------------------------------------------------------
new_fixture case2; add_worktree
echo "書きかけの原稿" > "$FX_WT/feature.md"
echo "追跡外メモ" > "$FX_WT/untracked.md"
run_merge --yes
assert_exit "case2 未コミット変更があると中止" 1 "$STATUS" "$OUT"
assert_contains "case2 退避方法を案内" "stash push -u" "$OUT"
assert_true "case2 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"
assert_true "case2 未コミット変更が保持されている" \
  "$(grep -q "書きかけの原稿" "$FX_WT/feature.md" && [ -f "$FX_WT/untracked.md" ] && echo 0 || echo 1)" "変更が失われた"
assert_true "case2 ブランチは残っている" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"

# ---------------------------------------------------------------------------
# case3: --allow-dirty-worktree → detach のみ。ファイルは削除しない
# ---------------------------------------------------------------------------
new_fixture case3; add_worktree
echo "書きかけの原稿" > "$FX_WT/feature.md"
run_merge --yes --allow-dirty-worktree --remove-worktree
assert_exit "case3 dirty でも続行できる" 0 "$STATUS" "$OUT"
assert_contains "case3 --remove-worktree は無視される" "--remove-worktree は無視" "$OUT"
assert_true "case3 未コミット変更が保持されている" \
  "$(grep -q "書きかけの原稿" "$FX_WT/feature.md" && echo 0 || echo 1)" "変更が失われた"
assert_true "case3 ブランチは削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"

# ---------------------------------------------------------------------------
# case4: worktree 無し（通常の PR）でも動く
# ---------------------------------------------------------------------------
new_fixture case4; add_branch_only
run_merge --yes
assert_exit "case4 worktree 無しでマージ成功" 0 "$STATUS" "$OUT"
assert_true "case4 ローカルブランチが削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"

# ---------------------------------------------------------------------------
# case5: PR が OPEN でない（並列セッションの先行マージ）→ 中止
# ---------------------------------------------------------------------------
new_fixture case5; add_worktree
echo MERGED > "$FX_STATE"
run_merge --yes
assert_exit "case5 非 OPEN は中止" 1 "$STATUS" "$OUT"
assert_contains "case5 state を報告" "OPEN ではありません" "$OUT"
assert_true "case5 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"
assert_true "case5 worktree は detach されていない" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" "detach された"

# ---------------------------------------------------------------------------
# case6: staleness FAIL → 既定は中止、--allow-stale で続行
# ---------------------------------------------------------------------------
new_fixture case6; add_worktree
STALE_CMD="$STUB_FAIL" run_merge --yes
assert_exit "case6 staleness FAIL は中止" 1 "$STATUS" "$OUT"
assert_true "case6 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"

new_fixture case6b; add_worktree
STALE_CMD="$STUB_FAIL" run_merge --yes --allow-stale
assert_exit "case6b --allow-stale で続行" 0 "$STATUS" "$OUT"

# ---------------------------------------------------------------------------
# case7: gh アカウント検証が失敗したら何もしない（403 を踏みに行かない）
# ---------------------------------------------------------------------------
new_fixture case7; add_worktree
ENSURE_CMD="$STUB_FAIL" run_merge --yes
assert_exit "case7 アカウント検証失敗で中止" 1 "$STATUS" "$OUT"
assert_true "case7 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"

# ---------------------------------------------------------------------------
# case8: 人間ゲート — 非 TTY で --yes 無しなら実行しない
# ---------------------------------------------------------------------------
new_fixture case8; add_worktree
run_merge
assert_exit "case8 承認なしでは実行しない" 1 "$STATUS" "$OUT"
assert_contains "case8 人間ゲートの説明" "承認" "$OUT"
assert_true "case8 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"

# ---------------------------------------------------------------------------
# case9: --dry-run は何も変更しない
# ---------------------------------------------------------------------------
new_fixture case9; add_worktree
run_merge --dry-run
assert_exit "case9 dry-run は exit 0" 0 "$STATUS" "$OUT"
assert_true "case9 gh pr merge を呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"
assert_true "case9 ブランチは残る" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"
assert_true "case9 worktree は detach されていない" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" "detach された"

# ---------------------------------------------------------------------------
# case10: --remove-worktree（clean）→ ディレクトリごと削除
# ---------------------------------------------------------------------------
new_fixture case10; add_worktree
run_merge --yes --remove-worktree
assert_exit "case10 remove-worktree 成功" 0 "$STATUS" "$OUT"
assert_true "case10 worktree ディレクトリが削除された" \
  "$([ ! -d "$FX_WT" ] && echo 0 || echo 1)" "ディレクトリが残っている"

# ---------------------------------------------------------------------------
# case11: 引数バリデーション
# ---------------------------------------------------------------------------
new_fixture case11
set +e
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" 2>&1); STATUS=$?
assert_exit "case11 引数なしは usage エラー" 2 "$STATUS" "$OUT"
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" abc 2>&1); STATUS=$?
assert_exit "case11 非数値 PR はエラー" 2 "$STATUS" "$OUT"
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" --help 2>&1); STATUS=$?
set -e
assert_exit "case11 --help は exit 0" 0 "$STATUS" "$OUT"
assert_contains "case11 --help に人間ゲートの記載" "人間ゲート" "$OUT"

# ---------------------------------------------------------------------------
echo
if [ "$FAILURES" -eq 0 ]; then
  echo "[test-merge-pr] all cases passed"
  exit 0
fi
echo "[test-merge-pr] $FAILURES case(s) failed" >&2
exit 1
