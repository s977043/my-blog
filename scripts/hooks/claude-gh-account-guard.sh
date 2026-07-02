#!/usr/bin/env bash
# scripts/hooks/claude-gh-account-guard.sh
# Claude Code PreToolUse hook（matcher: Bash）。
# `gh auth setup-git` 後に gh active account が kominem-unilabo へ反転し、
# git push / gh pr create / gh pr merge が 403 で失敗する事故（AGENT_LEARNINGS
# 2026-04-30, 05-21, 06-11）を、書き込み系 gh/git 操作の直前に自動検知・自動切替で防ぐ。
#
# 挙動:
# - stdin の hook JSON から tool_input.command を抽出
# - 書き込み系コマンド（git push / gh pr create|merge|edit / gh api ...merge...）に
#   マッチした場合のみ scripts/check-gh-account.sh --fix を実行
# - 検証 OK（または自動切替成功）→ exit 0 で通す
# - 切替不能 → exit 2 + stderr でブロック（Claude に理由が返る）
# - ガード自体の前提が崩れている場合（jq 無し / JSON 不正 / check スクリプト不在 /
#   リポジトリ外）は exit 0 で素通り = fail-open。ガードのバグで全 Bash が
#   止まる事故を避けるため、ブロックは「検証が実行でき、かつ失敗した」時のみ。

set -u

# ---- fail-open ガード群 -------------------------------------------------

# jq が無い環境では解析できないので素通り
command -v jq >/dev/null 2>&1 || exit 0

# 手動実行・デバッグ時に stdin が TTY だと cat が入力待ちでハングするため素通り
[ -t 0 ] && exit 0

INPUT=$(cat 2>/dev/null) || exit 0
[ -n "$INPUT" ] || exit 0

# JSON 不正・command 欠落は素通り
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null) || exit 0
[ -n "$CMD" ] || exit 0

# ---- 対象コマンド判定 ---------------------------------------------------
# 書き込み系のみ対象。gh pr list/view/checks 等の読み取り系は対象外。
is_target() {
  local c="$1"
  # git push（--no-verify 付き・`git -C <dir> push`・`git -c a="b c" push` のような
  # スペース/クォート入りオプション形式も含む。pre-push hook のバイパス経路もカバーする）
  # オプションを厳密にパースせず広めにマッチし、push ではない `git stash push` のみ除外
  # （過剰マッチは check が走るだけで無害。すり抜け=undermatch の方が実害がある）
  if printf '%s' "$c" | grep -qE '(^|[;&|[:space:]])git([[:space:]][^;&|]*)?[[:space:]]push([[:space:]]|$)' \
     && ! printf '%s' "$c" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+stash[[:space:]]+push([[:space:]]|$)'; then
    return 0
  fi
  # gh pr create / merge / edit
  if printf '%s' "$c" | grep -qE '(^|[;&|[:space:]])gh[[:space:]]+pr[[:space:]]+(create|merge|edit)([[:space:]]|$)'; then
    return 0
  fi
  # gh api で merge を含むもの（REST/GraphQL 経由のマージ）
  if printf '%s' "$c" | grep -qE '(^|[;&|[:space:]])gh[[:space:]]+api([[:space:]]|$)' \
     && printf '%s' "$c" | grep -qi 'merge'; then
    return 0
  fi
  return 1
}

is_target "$CMD" || exit 0

# ---- 検証スクリプトの解決 -----------------------------------------------
# テスト用に GH_GUARD_CHECK_SCRIPT で差し替え可能。
# 通常は CLAUDE_PROJECT_DIR、無ければ本スクリプト位置から repo root を推定。
if [ -n "${GH_GUARD_CHECK_SCRIPT:-}" ]; then
  CHECK="$GH_GUARD_CHECK_SCRIPT"
else
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    ROOT="$CLAUDE_PROJECT_DIR"
  else
    ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
  fi
  CHECK="$ROOT/scripts/check-gh-account.sh"
fi

# リポジトリ外 / check スクリプト不在は素通り（fail-open）
[ -f "$CHECK" ] || exit 0

# ---- 検証実行 -------------------------------------------------------------
if bash "$CHECK" --fix >&2; then
  exit 0
fi

cat >&2 <<'EOM'
[claude-gh-account-guard] ブロック: gh active account が期待アカウント s977043 でなく、自動切替（check-gh-account.sh --fix）にも失敗しました。
このまま実行すると push 403 / "must be a collaborator" 失敗が発生します。
復旧: gh auth switch -u s977043 を手動実行後、再試行してください。
EOM
exit 2
