#!/usr/bin/env bash
# scripts/hooks/claude-gh-account-guard.test.sh
# claude-gh-account-guard.sh のセルフテスト。
# GH_GUARD_CHECK_SCRIPT でスタブ検証スクリプトに差し替え、実際の gh には触れない。
# 実行: bash scripts/hooks/claude-gh-account-guard.test.sh

set -u

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GUARD="$HERE/claude-gh-account-guard.sh"
TMPDIR_T="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_T"' EXIT

PASS=0
FAIL=0

# スタブ: 呼ばれたことをマーカーファイルに記録し、STUB_EXIT で終了
STUB_OK="$TMPDIR_T/stub_ok.sh"
STUB_NG="$TMPDIR_T/stub_ng.sh"
MARKER="$TMPDIR_T/called"
cat > "$STUB_OK" <<EOF
#!/usr/bin/env bash
touch "$MARKER"
exit 0
EOF
cat > "$STUB_NG" <<EOF
#!/usr/bin/env bash
touch "$MARKER"
exit 1
EOF
chmod +x "$STUB_OK" "$STUB_NG"

json_for() {
  jq -n --arg cmd "$1" '{tool_name:"Bash", tool_input:{command:$cmd}}'
}

# assert <desc> <expected_exit> <expect_check_called(1|0)> <check_script> <command>
assert() {
  local desc="$1" want_exit="$2" want_called="$3" stub="$4" cmd="$5"
  rm -f "$MARKER"
  json_for "$cmd" | GH_GUARD_CHECK_SCRIPT="$stub" bash "$GUARD" >/dev/null 2>&1
  local got=$?
  local called=0
  [ -f "$MARKER" ] && called=1
  if [ "$got" = "$want_exit" ] && [ "$called" = "$want_called" ]; then
    echo "PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $desc (exit: want=$want_exit got=$got / check-called: want=$want_called got=$called)"
    FAIL=$((FAIL + 1))
  fi
}

# --- 対象コマンド: 検証が走る -------------------------------------------
assert "git push は検証対象（OK なら exit 0）"            0 1 "$STUB_OK" "git push origin main"
assert "git push --no-verify も検証対象"                  0 1 "$STUB_OK" "git push --no-verify origin feat/x"
assert "git -C <dir> push も検証対象"                     0 1 "$STUB_OK" "git -C /repo push -u origin feat/x"
assert "gh pr create は検証対象"                          0 1 "$STUB_OK" "gh pr create --base main --title t"
assert "gh pr merge は検証対象"                           0 1 "$STUB_OK" "gh pr merge 123 --squash --delete-branch"
assert "gh pr edit は検証対象"                            0 1 "$STUB_OK" "gh pr edit 123 --body x"
assert "gh api + merge は検証対象"                        0 1 "$STUB_OK" "gh api repos/o/r/pulls/1/merge -X PUT"
assert "複合コマンド中の git push も検証対象"             0 1 "$STUB_OK" "npm run check && git push -u origin feat/x"
assert "スペース入りオプションの git push も検証対象"     0 1 "$STUB_OK" 'git -c user.name="My Name" push origin main'
assert "git subtree push も検証対象"                      0 1 "$STUB_OK" "git subtree push --prefix=dist origin gh-pages"

# --- 対象コマンドで検証失敗: exit 2 でブロック ---------------------------
assert "検証失敗（切替不能）なら exit 2"                  2 1 "$STUB_NG" "git push origin main"
assert "gh pr merge も検証失敗なら exit 2"                2 1 "$STUB_NG" "gh pr merge 42 --squash"

# --- 非対象コマンド: 検証は走らず exit 0 ----------------------------------
assert "gh pr list は素通り"                              0 0 "$STUB_NG" "gh pr list --state open"
assert "gh pr view は素通り"                              0 0 "$STUB_NG" "gh pr view 123 --json state"
assert "gh pr checks は素通り"                            0 0 "$STUB_NG" "gh pr checks 123"
assert "git status は素通り"                              0 0 "$STUB_NG" "git status --short"
assert "merge を含む gh api 以外（git merge）は素通り"    0 0 "$STUB_NG" "git merge origin/main"
assert "gh api の読み取り（merge 無し）は素通り"          0 0 "$STUB_NG" "gh api repos/o/r/pulls/1"
assert "push を含む別コマンド（git stash push）は素通り"  0 0 "$STUB_NG" "git stash push -u -m sentinel"
assert "クォート内文字列（echo 'git push ...'）は素通り"  0 0 "$STUB_NG" "echo 'git push origin main'"

# --- fail-open 系 ----------------------------------------------------------
rm -f "$MARKER"
printf 'not-json' | GH_GUARD_CHECK_SCRIPT="$STUB_NG" bash "$GUARD" >/dev/null 2>&1
if [ $? -eq 0 ] && [ ! -f "$MARKER" ]; then
  echo "PASS: 不正 JSON は fail-open で exit 0"
  PASS=$((PASS + 1))
else
  echo "FAIL: 不正 JSON は fail-open で exit 0"
  FAIL=$((FAIL + 1))
fi

rm -f "$MARKER"
json_for "git push origin main" | GH_GUARD_CHECK_SCRIPT="$TMPDIR_T/no-such-script.sh" bash "$GUARD" >/dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "PASS: check スクリプト不在は fail-open で exit 0"
  PASS=$((PASS + 1))
else
  echo "FAIL: check スクリプト不在は fail-open で exit 0"
  FAIL=$((FAIL + 1))
fi

rm -f "$MARKER"
printf '' | GH_GUARD_CHECK_SCRIPT="$STUB_NG" bash "$GUARD" >/dev/null 2>&1
if [ $? -eq 0 ] && [ ! -f "$MARKER" ]; then
  echo "PASS: 空 stdin は fail-open で exit 0"
  PASS=$((PASS + 1))
else
  echo "FAIL: 空 stdin は fail-open で exit 0"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
