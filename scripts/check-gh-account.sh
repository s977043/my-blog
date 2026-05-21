#!/usr/bin/env bash
# scripts/check-gh-account.sh
# gh CLI の active account が s977043 であることを検査する。
# pre-push hook 等から呼ばれて、誤アカウント（例: kominem-unilabo）での操作を未然に防ぐ。
#
# 想定の発火タイミング:
# - git push 直前
# - gh pr create / gh pr merge 直前（手動チェック用にも使える）
#
# 終了コード:
#   0 = s977043 が active
#   1 = 別アカウントが active、または gh 未認証
#
# 環境変数:
#   ALLOW_ACCOUNT  検査対象アカウント名（デフォルト: s977043）
#   STRICT         "1" にすると stderr 警告のみで終了コード 0 を返す（CIで誤検知を避けたい場合）

set -euo pipefail

EXPECTED="${ALLOW_ACCOUNT:-s977043}"
STRICT="${STRICT:-0}"

if ! command -v gh >/dev/null 2>&1; then
  echo "[check-gh-account] gh CLI が見つからない（インストール推奨）" >&2
  exit 0  # gh 未インストールでは検査不能、ブロックしない
fi

# `gh auth status` の出力から Active account: true 直前の Logged in 行を抽出
# 出力例:
#   ✓ Logged in to github.com account s977043 (keyring)
#     - Active account: true
#
# 戦略: 全行を読んで "Logged in ... account NAME" を直前の候補として保持し、
# "Active account: true" に出会ったらその候補を確定する。
ACTIVE=$(gh auth status 2>&1 | awk '
  match($0, /Logged in to github.com account [^ ]+/) {
    s=substr($0, RSTART, RLENGTH)
    n=split(s, a, " ")
    candidate=a[n]
  }
  /Active account: true/ && candidate != "" { print candidate; exit }
') || true

if [ -z "${ACTIVE:-}" ]; then
  echo "[check-gh-account] gh active account を判定できません。`gh auth status` を手動確認してください" >&2
  [ "$STRICT" = "1" ] && exit 0 || exit 1
fi

if [ "$ACTIVE" = "$EXPECTED" ]; then
  exit 0
fi

cat >&2 <<EOM
[check-gh-account] ⚠️ active gh account が想定と違います
  期待: $EXPECTED
  実際: $ACTIVE

復旧コマンド:
  gh auth switch -u $EXPECTED

このまま続行すると push 403 / PR create "must be a collaborator" 失敗が発生する可能性があります。
EOM

[ "$STRICT" = "1" ] && exit 0 || exit 1
