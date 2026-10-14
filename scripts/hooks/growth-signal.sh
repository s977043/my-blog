#!/usr/bin/env bash
# scripts/hooks/growth-signal.sh
# 自己成長ループのシグナルを記録する共通ヘルパー（実体は scripts/growth-signals.js）。
# 記録のために呼び出し元（ガード / Claude Code hook）を失敗させないよう、常に exit 0（fail-open）。
#
# 使い方:
#   growth-signal.sh append <kind> <source> <detail> [session_id]   # ガードのブロック時など
#   growth-signal.sh hook-session-start                              # SessionStart hook（stdin に hook JSON）
#   growth-signal.sh hook-session-end                                # SessionEnd hook（stdin に hook JSON）
# 保存先: ${GROWTH_SIGNALS_DIR:-$HOME/.claude/state/my-blog-growth}/signals.jsonl

JS="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)/growth-signals.js"
command -v node >/dev/null 2>&1 || exit 0
[ -f "$JS" ] || exit 0

case "${1:-}" in
  append)
    [ $# -ge 3 ] || exit 0
    node "$JS" append "$2" "$3" "${4:-}" "${5:-}" </dev/null >/dev/null 2>&1
    ;;
  hook-session-start)
    node "$JS" hook-session-start 2>/dev/null
    ;;
  hook-session-end)
    node "$JS" hook-session-end >/dev/null 2>&1
    ;;
esac
exit 0
