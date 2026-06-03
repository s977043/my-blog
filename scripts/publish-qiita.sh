#!/usr/bin/env bash
# Qiita publish wrapper — publish 直前に pre-sync 巻き戻りガードを走らせてから
# qiita-cli の publish を実行する。
#
# 使い方（package.json 経由が標準）:
#   npm run publish:qiita -- <slug> [--force]
#
# バイパス（ガードを skip。誤検知時のみ）:
#   SKIP_REMOTE_CACHE_CHECK=1 npm run publish:qiita -- <slug>

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${SKIP_REMOTE_CACHE_CHECK:-}" != "1" ]; then
  node "$REPO_ROOT/scripts/check-qiita-remote-cache.js"
fi

exec npx qiita publish --root Qiita "$@"
