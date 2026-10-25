# PR 操作とセッション運用（Claude Code）

`CLAUDE.md` から移した手順の正本。**PR を作る・マージする前、初回セットアップ時、セッション終了時に読む**。規約（何が正しいか）は `AGENTS.md` を正とする。

## 初回セットアップ（リポジトリ毎に1回）

```bash
git config core.hooksPath scripts/hooks
```

これで以下の Git hook が有効になる:

- `scripts/hooks/pre-push` — `gh` の active account が `s977043` でない状態の `git push` をブロック。バイパス: `git push --no-verify`
- `scripts/hooks/pre-commit` — **main 直 commit**（バイパス: `ALLOW_MAIN_COMMIT=1 git commit ...`）/ **`Qiita/public/.remote/` の混入**（commit 禁止）/ **AGENTS.md の `<claude-mem-context>` ブロック混入** をブロックし、**0-insertion リネーム取りこぼし**（`git mv` + 内容編集の同一 commit）を WARN。全チェックのバイパス: `git commit --no-verify`

### 公開前ガード（自動実行）

- `npm run publish:qiita` は wrapper（`scripts/publish-qiita.sh`）経由で、publish 直前に **`check:qiita-remote-cache`** を走らせ、`.remote/` キャッシュ手編集による pre-sync 巻き戻り（AGENT_LEARNINGS 2026-06-03）を検知して publish を止める。誤検知時のバイパス: `SKIP_REMOTE_CACHE_CHECK=1 npm run publish:qiita -- <slug>`
- `npm run check` に **`check:internal-links`**（Zenn 記事間リンク `/articles/<slug>` と画像 `/images/...` の実在検証）を統合済み

## 並列セッション耐性

同一ワーキングツリーで複数の Claude Code セッションが走ると、ブランチが自作業外で切り替わる事例がある。対策:

- **branch-impacting 操作（`git add` / `git commit` / `git push` / `git reset` / `git switch` / `gh pr create`）の前に毎回 `git branch --show-current` で現在地確認**
- commit 前に `git status --short` も併用（未意図のファイルが staging に混入していないか確認）
- ブランチが期待と異なる場合は `git stash push -u -m "<sentinel>"` で退避 → `git switch main` → `git pull --ff-only` で復旧
- 誤配置 commit は `reflog` で探し、`git cherry-pick <sha>` で目的ブランチに移動して救出できる
- 詳細事例: `@AGENT_LEARNINGS.md` の「並列セッションによるブランチ干渉」エントリ

### `M AGENTS.md`（claude-mem 自動注入ブロック）は WIP ではない

`git status` に常駐する `M AGENTS.md` は、多くの場合 claude-mem プラグインが末尾へ自動追記する `<claude-mem-context>...</claude-mem-context>` ブロックである（毎セッション再生成される transient な記憶コンテキスト）。**ユーザー WIP や並列セッションの変更ではない**。

- **絶対に commit しない**（リポジトリを記憶ログで汚染する）
- **`git diff AGENTS.md` で `<claude-mem-context>` ブロックのみと確認できたら `git checkout -- AGENTS.md` で破棄**してから切替える（再生成されるので情報損失なし。stash → pop を繰り返さない）
- ただし破棄前に必ず `git diff AGENTS.md` を見る。規約本文（`<claude-mem-context>` より上）に実変更が混在していたら、その部分だけは別途扱う
- commit 時は `git add -A` を使わず**対象ファイルを明示**して staging（AGENTS.md を巻き込まない）

### `gh pr create` 直前チェックリスト

push 直後に並列セッションが別ブランチへ切り替えると、`gh pr create` が「must first push the current branch to a remote」で失敗する。直前に次の 3 行でブランチ名ズレ / upstream 未同期 / head 不一致を検知する。

```bash
git branch --show-current                             # 期待ブランチか
git rev-parse HEAD                                    # ローカル head
git rev-parse "@{u}" 2>/dev/null || echo "NO_UPSTREAM" # 上流 head（未 track なら NO_UPSTREAM）
```

| 症状 | 対処 |
|---|---|
| 現在ブランチが意図と違う | `gh pr create --head <intended-branch> ...`（切替不要で PR 作成） |
| upstream 未 track | `git push -u origin <branch>` してから `gh pr create` |
| head が origin より進んでいる | そのまま `--head` で PR 作成可 |

**原則**: 並列セッション干渉を検知したら **ブランチ切替ではなく `--head` フラグで指名する** ほうが副作用が少ない。

### `gh pr merge` 直前チェックリスト

並列セッションが先にマージを完了させていたり、ブランチが main に対して stale でリグレッションを含んでいる事例がある。**まず staleness チェッカーを実行する**（state 確認・fetch・merge シミュレーションによる巻き戻し検知を一括実行。exit 1 = STALE 疑いでマージ中止）。

```bash
npm run check:pr-staleness -- <PR番号またはブランチ名>
```

判定困難時（conflict / merge-tree 未対応等）は WARN 止まりなので、従来の手動 3 点確認へフォールバックする:

```bash
gh pr view <n> --json state,mergeStateStatus --jq .   # state=OPEN か
git fetch origin main <branch>
git diff origin/main...origin/<branch> --stat         # 3点比較。現 main に対して実際に入る差分（想定範囲内か）
```

- `state != OPEN` の場合は何もしない（並列セッションが先行マージ済み）
- 3点 diff（`...`）が PR 本文の想定範囲を超える場合は stale の疑い。**`gh pr` 上の diff は head の base に対する差分なので、base が現 main からズレていると実害（巻き戻し）を隠す**（2026-06-10: #404 が squash 済み記事を巻き戻した。同型の #405 は 3点 diff で気づいてマージ前に close）
- **マージは常に `gh pr merge <n> --squash --delete-branch`**。このリポジトリは merge commit 禁止で、`--merge` は `GraphQL: Merge commits are not allowed` で失敗する
- 詳細事例: `@AGENT_LEARNINGS.md` の「Stale PR は `git diff main..branch` で事前にリグレッション検出する」「並列セッションが squash 済み記事を別 base で再マージ」エントリ

## セッション終了時のチェックリスト

stash や未マージブランチが残ると、次回作業者（自分含む）が混乱する。

1. `git stash list` — 退避物がある場合、内容と所有者（自分 or 並列セッション）を確認。自分のものなら処遇判断（drop / 退避ブランチ保存）
2. `git branch -vv | grep -v '^\* main'` — local stale ブランチを削除する。このリポジトリは squash マージなので、マージ済みでも `git branch -d`・`--is-ancestor`・3点 diff は「未マージ」と判定する。**`npm run clean:merged-branches` で PR が MERGED のブランチを洗い出し、`-- --apply` で削除**（SHA を表示するので復元可。AGENT_LEARNINGS 2026-09-24）
3. `gh pr list --state open` — open PR が想定通りか確認、放置していないか
4. **Zenn 公開系作業をした場合**: `npm run check:zenn-pace` で過去 24h の publish 切替件数を確認、rate-limit hit 兆候があれば次セッションへ申し送り
