#!/usr/bin/env bash
# scripts/test-cleanup-pr-worktree.sh
# cleanup-pr-worktree.sh の fixture ベース self-test。
#
# 実行: bash scripts/test-cleanup-pr-worktree.sh  /  npm run test:cleanup-pr
# 期待: 全ケース PASS で exit 0
#
# ■ 実 API を叩かない作り（hermetic）
#   - GitHub には一切アクセスしない。`gh` は PATH ではなく CLEANUP_PR_GH で注入する
#     偽 gh スクリプト（fake-gh）に差し替える。fake-gh が扱うのは `gh pr view`
#     （read-only）だけで、`gh pr merge` は本スクリプトが実行しないため模していない
#     （呼ばれたら exit 64 で落ちるので「マージしていない」ことの検査も兼ねる）。
#   - gh アカウント検証と staleness 検査も GH_ENSURE_CMD / STALENESS_CMD で
#     スタブに差し替える（実スクリプトはネットワーク・gh に依存するため）。
#   - git 操作はすべて mktemp 配下のローカル bare remote + clone で完結する。

set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/cleanup-pr-worktree.sh"
[ -f "$SCRIPT" ] || { echo "cleanup-pr-worktree.sh が見つかりません: $SCRIPT" >&2; exit 1; }

ROOT=$(mktemp -d)
trap 'rm -rf "$ROOT"' EXIT
FAILURES=0

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

# --- 偽 gh（pr view のみ対応。pr merge が呼ばれたら異常） -------------------
FAKE_GH="$ROOT/fake-gh"
cat > "$FAKE_GH" <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
echo "$*" >> "$GH_FIXTURE_LOG"
STATE=$(cat "$GH_FIXTURE_STATE")
BRANCH="$GH_FIXTURE_BRANCH"
if [ "${1:-}" = "pr" ] && [ "${2:-}" = "view" ]; then
  if printf '%s' "$*" | grep -q "headRefName"; then
    printf '%s\t%s\t%s\n' "$STATE" "$BRANCH" "fixture PR title"
  else
    printf '%s\n' "$STATE"
  fi
  exit 0
fi
echo "fake-gh: 未対応の呼び出し（このスクリプトはマージしないはず）: $*" >&2
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
  printf '.env\nnode_modules/\n' > "$d/seed/.gitignore"
  echo base > "$d/seed/README.md"
  git -C "$d/seed" add -A && git -C "$d/seed" commit -qm base
  git -C "$d/seed" push -q "$FX_REMOTE" main
  git clone -q "$FX_REMOTE" "$FX_REPO"
  git -C "$FX_REPO" config user.email t@example.com
  git -C "$FX_REPO" config user.name fixture
  git -C "$FX_REPO" config commit.gpgsign false
  # 既定は「PR は既にマージ済み」= 後片付けモードの通常前提
  echo MERGED > "$FX_STATE"; : > "$FX_LOG"
}

add_worktree() { # 対象ブランチを掴む worktree を作る
  git -C "$FX_REPO" worktree add -q "$FX_WT" -b "$BRANCH" main
  echo work > "$FX_WT/feature.md"
  git -C "$FX_WT" add -A && git -C "$FX_WT" commit -qm "feature commit"
}
add_branch_only() { git -C "$FX_REPO" branch "$BRANCH" main; }
checkout_branch_in_repo() { # 実行元 checkout 自身が対象ブランチ（medium-1 の状況）
  git -C "$FX_REPO" switch -q -c "$BRANCH"
  echo work > "$FX_REPO/feature.md"
  git -C "$FX_REPO" add -A && git -C "$FX_REPO" commit -qm "feature commit"
}

run_cleanup() { # 残りは cleanup-pr-worktree.sh へのフラグ
  set +e
  OUT=$(cd "$FX_REPO" && \
    CLEANUP_PR_GH="$FAKE_GH" \
    GH_FIXTURE_STATE="$FX_STATE" GH_FIXTURE_BRANCH="$BRANCH" GH_FIXTURE_LOG="$FX_LOG" \
    GH_ENSURE_CMD="${ENSURE_CMD:-$STUB_OK}" STALENESS_CMD="${STALE_CMD:-$STUB_OK}" \
    bash "$SCRIPT" 123 "$@" </dev/null 2>&1)
  STATUS=$?
  set -e
}

branch_exists() { git -C "$FX_REPO" show-ref --verify --quiet "refs/heads/$BRANCH"; }
merge_called() { grep -q "pr merge" "$FX_LOG"; }

# ---------------------------------------------------------------------------
# case0: 責務の境界 — このスクリプトは gh pr merge を絶対に呼ばない
# ---------------------------------------------------------------------------
new_fixture case0; add_worktree
run_cleanup
assert_exit "case0 後片付けは成功する" 0 "$STATUS" "$OUT"
assert_true "case0 gh pr merge を一度も呼んでいない" "$(merge_called && echo 1 || echo 0)" "merge が呼ばれた"
assert_true "case0 fake-gh の呼び出しは pr view のみ" \
  "$(! grep -vq "pr view" "$FX_LOG" && echo 0 || echo 1)" "pr view 以外が呼ばれた: $(cat "$FX_LOG")"
assert_contains "case0 --help でもマージしないことを明示" "このコマンドはマージしない" \
  "$(bash "$SCRIPT" --help)"

# ---------------------------------------------------------------------------
# case1: 本命 — worktree が掴んだ clean ブランチをマージ後に後片付けする
# ---------------------------------------------------------------------------
new_fixture case1; add_worktree
run_cleanup
assert_exit "case1 後片付け成功" 0 "$STATUS" "$OUT"
assert_true "case1 ローカルブランチが削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"
assert_true "case1 worktree ディレクトリは残っている" "$([ -d "$FX_WT" ] && echo 0 || echo 1)" "worktree が消えた"
assert_true "case1 worktree は detached HEAD" \
  "$([ -z "$(git -C "$FX_WT" branch --show-current)" ] && echo 0 || echo 1)" "detach されていない"
assert_true "case1 worktree のファイルが保持されている" \
  "$([ -f "$FX_WT/feature.md" ] && echo 0 || echo 1)" "feature.md が消えた"

# ---------------------------------------------------------------------------
# case2: PR がまだ OPEN → 後片付けモードは中止し、マージ手順を案内する
# ---------------------------------------------------------------------------
new_fixture case2; add_worktree
echo OPEN > "$FX_STATE"
run_cleanup
assert_exit "case2 OPEN のままなら中止" 1 "$STATUS" "$OUT"
assert_contains "case2 人間が打つマージコマンドを案内" "pr merge 123 --squash --delete-branch" "$OUT"
assert_true "case2 ブランチは残っている" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"
assert_true "case2 worktree は detach されていない" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" "detach された"

# ---------------------------------------------------------------------------
# case3: --pre-merge → OPEN な PR の worktree を detach するだけ
# ---------------------------------------------------------------------------
new_fixture case3; add_worktree
echo OPEN > "$FX_STATE"
run_cleanup --pre-merge
assert_exit "case3 pre-merge は成功" 0 "$STATUS" "$OUT"
assert_true "case3 worktree が detach された" \
  "$([ -z "$(git -C "$FX_WT" branch --show-current)" ] && echo 0 || echo 1)" "detach されていない"
assert_true "case3 ブランチは残っている（削除しない）" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"
assert_contains "case3 次に打つコマンドを案内" "pr merge 123 --squash --delete-branch" "$OUT"

# --- --pre-merge は MERGED 済みでは使わせない
new_fixture case3b; add_worktree
run_cleanup --pre-merge
assert_exit "case3b pre-merge は OPEN 以外で中止" 1 "$STATUS" "$OUT"

# ---------------------------------------------------------------------------
# case4: 未コミット変更 → 既定では中止（作業を失わせない）
# ---------------------------------------------------------------------------
new_fixture case4; add_worktree
echo "書きかけの原稿" > "$FX_WT/feature.md"
echo "追跡外メモ" > "$FX_WT/untracked.md"
run_cleanup
assert_exit "case4 未コミット変更があると中止" 1 "$STATUS" "$OUT"
assert_contains "case4 退避方法を案内" "stash push -u" "$OUT"
assert_true "case4 未コミット変更が保持されている" \
  "$(grep -q "書きかけの原稿" "$FX_WT/feature.md" && [ -f "$FX_WT/untracked.md" ] && echo 0 || echo 1)" "変更が失われた"
assert_true "case4 ブランチは残っている" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"

# ---------------------------------------------------------------------------
# case5: --allow-dirty-worktree → detach のみ。ファイルは削除しない
# ---------------------------------------------------------------------------
new_fixture case5; add_worktree
echo "書きかけの原稿" > "$FX_WT/feature.md"
run_cleanup --allow-dirty-worktree --remove-worktree
assert_exit "case5 dirty でも続行できる" 0 "$STATUS" "$OUT"
assert_contains "case5 --remove-worktree は無視される" "--remove-worktree は無視" "$OUT"
assert_true "case5 未コミット変更が保持されている" \
  "$(grep -q "書きかけの原稿" "$FX_WT/feature.md" && echo 0 || echo 1)" "変更が失われた"
assert_true "case5 ブランチは削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"

# ---------------------------------------------------------------------------
# case6: worktree 無し（通常の PR）でも動く
# ---------------------------------------------------------------------------
new_fixture case6; add_branch_only
run_cleanup
assert_exit "case6 worktree 無しで後片付け成功" 0 "$STATUS" "$OUT"
assert_true "case6 ローカルブランチが削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"

# ---------------------------------------------------------------------------
# case7: staleness FAIL → --pre-merge では中止、--allow-stale で続行
# ---------------------------------------------------------------------------
new_fixture case7; add_worktree; echo OPEN > "$FX_STATE"
STALE_CMD="$STUB_FAIL" run_cleanup --pre-merge
assert_exit "case7 staleness FAIL は中止" 1 "$STATUS" "$OUT"
assert_true "case7 worktree は detach されていない" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" "detach された"

new_fixture case7b; add_worktree; echo OPEN > "$FX_STATE"
STALE_CMD="$STUB_FAIL" run_cleanup --pre-merge --allow-stale
assert_exit "case7b --allow-stale で続行" 0 "$STATUS" "$OUT"

# ---------------------------------------------------------------------------
# case8: gh アカウント検証が失敗したら何もしない
# ---------------------------------------------------------------------------
new_fixture case8; add_worktree
ENSURE_CMD="$STUB_FAIL" run_cleanup
assert_exit "case8 アカウント検証失敗で中止" 1 "$STATUS" "$OUT"
assert_true "case8 ブランチは残っている" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"

# ---------------------------------------------------------------------------
# case9: --dry-run は何も変更しない
# ---------------------------------------------------------------------------
new_fixture case9; add_worktree
run_cleanup --dry-run
assert_exit "case9 dry-run は exit 0" 0 "$STATUS" "$OUT"
assert_true "case9 ブランチは残る" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"
assert_true "case9 worktree は detach されていない" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" "detach された"

# ---------------------------------------------------------------------------
# case10: --remove-worktree（clean）→ ディレクトリごと削除
# ---------------------------------------------------------------------------
new_fixture case10; add_worktree
run_cleanup --remove-worktree
assert_exit "case10 remove-worktree 成功" 0 "$STATUS" "$OUT"
assert_true "case10 worktree ディレクトリが削除された" \
  "$([ ! -d "$FX_WT" ] && echo 0 || echo 1)" "ディレクトリが残っている"

# ---------------------------------------------------------------------------
# case11 (high-1 回帰): gitignore 対象ファイル（.env / node_modules/）がある worktree を
#   --remove-worktree で無言削除しない。
#   `git status --porcelain` は ignored を列挙しないため、修正前は clean と判定され
#   ディレクトリごと消えて .env が復旧不能に失われていた。
# ---------------------------------------------------------------------------
new_fixture case11; add_worktree
echo "SECRET=xyz" > "$FX_WT/.env"
mkdir -p "$FX_WT/node_modules" && echo "x" > "$FX_WT/node_modules/a.js"
assert_true "case11 前提: status --porcelain では clean に見える" \
  "$([ -z "$(git -C "$FX_WT" status --porcelain)" ] && echo 0 || echo 1)" "porcelain が空でない"
run_cleanup --remove-worktree
assert_exit "case11 exit 0（後片付け自体は完了する）" 0 "$STATUS" "$OUT"
assert_true "case11 .env が削除されていない" \
  "$(grep -q "SECRET=xyz" "$FX_WT/.env" 2>/dev/null && echo 0 || echo 1)" ".env が消失した"
assert_true "case11 node_modules/ が削除されていない" \
  "$([ -f "$FX_WT/node_modules/a.js" ] && echo 0 || echo 1)" "node_modules が消失した"
assert_contains "case11 削除を中止した理由を報告" "gitignore 対象ファイル" "$OUT"
assert_true "case11 ブランチ削除は完了している" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"

# --- --force-remove-worktree なら明示的に削除できる
new_fixture case11b; add_worktree
echo "SECRET=xyz" > "$FX_WT/.env"
run_cleanup --force-remove-worktree
assert_exit "case11b force なら削除する" 0 "$STATUS" "$OUT"
assert_true "case11b worktree ディレクトリが削除された" \
  "$([ ! -d "$FX_WT" ] && echo 0 || echo 1)" "ディレクトリが残っている"

# ---------------------------------------------------------------------------
# case12 (medium-1 回帰): 実行元 checkout 自体が対象ブランチだった場合、
#   detached HEAD のまま放置しない（CLAUDE.md の現在地確認運用と噛み合わせる）。
# ---------------------------------------------------------------------------
new_fixture case12; checkout_branch_in_repo
run_cleanup
assert_exit "case12 後片付け成功" 0 "$STATUS" "$OUT"
assert_true "case12 ローカルブランチが削除された" "$(branch_exists && echo 1 || echo 0)" "branch が残っている"
CUR=$(git -C "$FX_REPO" branch --show-current)
assert_true "case12 detached HEAD で放置されていない" \
  "$([ -n "$CUR" ] && echo 0 || echo 1)" "detached HEAD のまま（現在地不明）"
assert_true "case12 既定ブランチ(main)へ戻っている" \
  "$([ "$CUR" = "main" ] && echo 0 || echo 1)" "現在ブランチ=$CUR"

# ---------------------------------------------------------------------------
# case13 (medium-2 回帰): 中断（SIGINT）でも detached HEAD を残さない。
#   detach 後・ブランチ削除前にシグナルを受けたら trap で元のブランチへ戻す。
#   遅延点は fetch --prune。ext:: リモートヘルパで origin を意図的に遅くする。
#   シグナルは SIGTERM を使う: `&` で起動した非対話バックグラウンドジョブは
#   SIGINT が SIG_IGN で入るため trap できない（シェルの仕様）。実運用の Ctrl-C は
#   SIGINT だが、スクリプト側は `trap on_signal INT TERM` で両方を同じ経路で扱う。
# ---------------------------------------------------------------------------
new_fixture case13; add_worktree
# ext:: プロトコルは既定で無効なので明示的に許可する（fixture 内のローカル利用のみ）
SLOW_UPLOAD_PACK="$ROOT/slow-upload-pack"
cat > "$SLOW_UPLOAD_PACK" <<'EOF'
#!/usr/bin/env bash
# SIGTERM を送り込む猶予を作るためだけの遅延。中断は detach の 0.5-0.7 秒後に
# 送るので 4 秒あれば十分（長くすると self-test 全体が無駄に遅くなる）。
sleep 4
exec git upload-pack "$@"
EOF
chmod +x "$SLOW_UPLOAD_PACK"
git -C "$FX_REPO" config protocol.ext.allow always
git -C "$FX_REPO" remote set-url origin "ext::$SLOW_UPLOAD_PACK $FX_REMOTE"
set +e
# exec でサブシェル自身をスクリプトに置き換える（kill -INT が本体に届くようにする）
( cd "$FX_REPO" && exec env \
  CLEANUP_PR_GH="$FAKE_GH" \
  GH_FIXTURE_STATE="$FX_STATE" GH_FIXTURE_BRANCH="$BRANCH" GH_FIXTURE_LOG="$FX_LOG" \
  GH_ENSURE_CMD="$STUB_OK" STALENESS_CMD="$STUB_OK" \
  bash "$SCRIPT" 123 </dev/null >"$ROOT/case13.out" 2>&1 ) &
CASE13_PID=$!
# detach 完了 → fetch 到達を待ってから割り込む
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  grep -q "detach します" "$ROOT/case13.out" 2>/dev/null && break
  sleep 0.2
done
sleep 0.5
kill -TERM "$CASE13_PID" 2>/dev/null
wait "$CASE13_PID" || true
set -e
C13_OUT=$(cat "$ROOT/case13.out")
assert_true "case13 detach まで到達している" \
  "$(printf '%s' "$C13_OUT" | grep -q "detach します" && echo 0 || echo 1)" "detach に到達しなかった: $C13_OUT"
assert_contains "case13 中断を報告する" "中断シグナル" "$C13_OUT"
assert_true "case13 worktree が元のブランチへ復帰している" \
  "$([ "$(git -C "$FX_WT" branch --show-current)" = "$BRANCH" ] && echo 0 || echo 1)" \
  "detached のまま（現在: '$(git -C "$FX_WT" branch --show-current)'）"
assert_true "case13 ブランチは削除されていない" "$(branch_exists && echo 0 || echo 1)" "branch が消えた"

# ---------------------------------------------------------------------------
# case14: 引数バリデーション
# ---------------------------------------------------------------------------
new_fixture case14
set +e
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" 2>&1); STATUS=$?
assert_exit "case14 引数なしは usage エラー" 2 "$STATUS" "$OUT"
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" abc 2>&1); STATUS=$?
assert_exit "case14 非数値 PR はエラー" 2 "$STATUS" "$OUT"
OUT=$(cd "$FX_REPO" && bash "$SCRIPT" --help 2>&1); STATUS=$?
set -e
assert_exit "case14 --help は exit 0" 0 "$STATUS" "$OUT"
assert_contains "case14 --help に手動マージ手順の記載" "gh pr merge" "$OUT"

# ---------------------------------------------------------------------------
# case15 (low-2 回帰): 空白を含むパスに置かれても壊れない
# ---------------------------------------------------------------------------
SPACED_DIR="$ROOT/dir with space"
mkdir -p "$SPACED_DIR"
cp "$SCRIPT" "$SPACED_DIR/cleanup-pr-worktree.sh"
printf '#!/usr/bin/env bash\nexit 0\n' > "$SPACED_DIR/check-gh-account.sh"
printf '#!/usr/bin/env bash\nexit 0\n' > "$SPACED_DIR/check-pr-staleness.sh"
chmod +x "$SPACED_DIR"/*.sh
new_fixture case15; add_worktree
set +e
OUT=$(cd "$FX_REPO" && CLEANUP_PR_GH="$FAKE_GH" \
  GH_FIXTURE_STATE="$FX_STATE" GH_FIXTURE_BRANCH="$BRANCH" GH_FIXTURE_LOG="$FX_LOG" \
  bash "$SPACED_DIR/cleanup-pr-worktree.sh" 123 </dev/null 2>&1); STATUS=$?
set -e
assert_exit "case15 空白入りパスでも既定コマンドを実行できる" 0 "$STATUS" "$OUT"

# ---------------------------------------------------------------------------
echo
if [ "$FAILURES" -eq 0 ]; then
  echo "[test-cleanup-pr-worktree] all cases passed"
  exit 0
fi
echo "[test-cleanup-pr-worktree] $FAILURES case(s) failed" >&2
exit 1
