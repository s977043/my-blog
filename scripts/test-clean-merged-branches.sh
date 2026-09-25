#!/usr/bin/env bash
# scripts/test-clean-merged-branches.sh
# clean-merged-branches.sh の fixture ベース self-test。
#
# 実行: bash scripts/test-clean-merged-branches.sh  /  npm run test:clean-merged-branches
# GitHub には触れない。gh は CLEAN_BRANCHES_GH で偽スクリプトに差し替え、
# ブランチ名ごとに PR の状態を返す。git 操作は mktemp 配下のローカル repo で完結する。

set -u

SCRIPT="$(cd "$(dirname "$0")" && pwd)/clean-merged-branches.sh"
ROOT=$(mktemp -d)
trap 'rm -rf "$ROOT"' EXIT
PASS=0
FAIL=0

check() {
  if [ "$2" = "0" ]; then echo "PASS: $1"; PASS=$((PASS + 1)); else echo "FAIL: $1"; FAIL=$((FAIL + 1)); fi
}

# 偽 gh: --head <branch> に応じて PR の状態を返す
FAKE_GH="$ROOT/fake-gh"
cat > "$FAKE_GH" <<'EOF'
#!/usr/bin/env bash
head=""
while [ $# -gt 0 ]; do [ "$1" = "--head" ] && head="$2"; shift; done
case "$head" in
  squashed) echo "11 MERGED" ;;
  open-pr)  echo "12 OPEN" ;;
  closed)   echo "13 CLOSED" ;;
  in-wt)    echo "14 MERGED" ;;
  *)        echo "null null" ;;
esac
EOF
chmod +x "$FAKE_GH"

REPO="$ROOT/repo"
git init -q -b main "$REPO"
git -C "$REPO" -c user.name=t -c user.email=t@example.com commit -q --allow-empty -m init
for b in squashed open-pr closed no-pr in-wt release/zenn; do git -C "$REPO" branch "$b"; done
git -C "$REPO" worktree add -q "$ROOT/wt" in-wt

run() { (cd "$REPO" && CLEAN_BRANCHES_GH="$FAKE_GH" bash "$SCRIPT" "$@"); }

# dry-run: MERGED の squashed だけが候補。何も消さない
OUT=$(run)
echo "$OUT" | grep -q "候補   squashed（PR #11 MERGED"; check "dry-run は MERGED のブランチを候補に出す" $?
! echo "$OUT" | grep -qE "候補   (open-pr|closed|no-pr|release/zenn|main)"; check "OPEN・CLOSED・PR 無し・保護ブランチは候補にしない" $?
echo "$OUT" | grep -q "skip   in-wt（worktree で使用中）"; check "worktree で使用中のブランチは skip する" $?
git -C "$REPO" rev-parse -q --verify squashed >/dev/null; check "dry-run では削除しない" $?

# --apply: squashed だけが消え、復元コマンドが出る
OUT=$(run --apply)
echo "$OUT" | grep -q "delete squashed（PR #11、復元: git branch squashed "; check "--apply は復元コマンド付きで削除する" $?
! git -C "$REPO" rev-parse -q --verify squashed >/dev/null; check "--apply で MERGED のブランチが消える" $?
for b in open-pr closed no-pr in-wt release/zenn; do
  git -C "$REPO" rev-parse -q --verify "$b" >/dev/null; check "--apply でも $b は残る" $?
done

# 候補 0 件
OUT=$(run)
echo "$OUT" | grep -q "マージ済みのローカルブランチはありません"; check "候補 0 件を明示する" $?

# 引数不正
run --bogus >/dev/null 2>&1; [ $? -eq 1 ]; check "不正な引数は exit 1" $?

echo ""
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
