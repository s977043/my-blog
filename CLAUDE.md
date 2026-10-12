# CLAUDE.md

Claude Code 向けのツールガイド。規約（何が正しいか）は `@AGENTS.md` に集約してあるので先にそちらを読む。

本ファイルは Claude Code 固有の情報（利用可能な Skill / Agent / Command、作業チェックリスト、permissions）に絞る。AGENTS.md と同じことは書かない（本ファイルは AGENTS.md を import するので、重複は毎セッション 2 回読むことになる）。

## 読む順序

1. @AGENTS.md — 全エージェント共通の**規約**（配置/表現/Git運用/禁止事項）。この行の import で毎セッション自動で読み込まれる。バッククォートで囲むと import されないので囲まない
2. `@AGENT_LEARNINGS.md` — 過去の失敗・成功パターン（同じ落とし穴を踏まない）
3. 本ファイル — Claude Code で使えるツールの索引

## Slash Commands / Subagents / Skills / Workflows

各ツールの一覧と説明文はハーネスが毎セッション自動で読み込む（`.claude/commands/` / `.claude/agents/` / `.claude/skills/` / `.claude/workflows/`）。個別の用途は各定義ファイルの frontmatter description を正とする。**本ファイルに件数は書かない**（増減の度に陳腐化する）。

**サブエージェントへ作業を委託するときは、[`docs/worker-discipline-template.md`](docs/worker-discipline-template.md) を読ませること。** worktree セットアップ（`npm ci` が要る）、触ってはいけないファイル、formatter churn の commit 後チェック、完了報告の形式、報告の作法をまとめてある。委託プロンプトへ「このファイルを読んでから着手すること」の1行を入れれば足りる。

`.claude/workflows/` は Workflow ツールから `Workflow({ name: "<file名から .js を除いたもの>", args: {...} })` で起動する多フェーズスクリプト。commands / skills と違い**ハーネスの一覧には出ない**ので、note 記事の最終化に関わるものだけここに索引を置く。

### note 記事の最終化まわり

**使い分け**: `note-finalize` は公開直前の**最終判定**で、記事を一切編集しない（review-only）。`note-thesis-review-loop` はその判定が NEEDS_CHANGES だったときに回す**改善ラウンド**で、記事本文を編集する。順序は finalize →（NEEDS_CHANGES なら）loop → finalize 再実行。

- `/finalize-note-article <articles_note/<state>/<slug>.md>` … 下記 `note-finalize` Workflow の入口
- `Workflow({ name: "note-finalize", args: { article } })` … Domain / 言語密度 / 図 / 編集の独立 Gate を通し **`READY` / `NEEDS_CHANGES` / `UNVERIFIED`** を返す。記事は編集しない。`drafts/` は読み取り専用ミラー扱い
- `Workflow({ name: "note-thesis-review-loop", args: { article, loops } })` … 主題・中心主張を固定したままレビュー→改善→再レビューを N ループ。**`args.loops` は 3（既定）か 5 のみ**。`5` のときだけ Loop4（専門領域の事実境界）と Loop5（言語密度・note 表記規約・図）が付く。**記事本文が変わる**
- Gate の観点定義スキル: `article-domain-review` / `article-humanizer-ja` / `article-visual-review`（`.claude/skills/` 配下）
- 補助 lint: `npm run check:article-language-density -- articles_note/<state>/<slug>.md`（**対象記事を必ず指定する**。引数なしだと `articles_note/new|published` 全体を走る）
- 所要時間・トークン量の実測と Gate の既知の弱点: [`docs/note-finalize-operation-log.md`](docs/note-finalize-operation-log.md)

### 公開系コマンド

Zenn は `/publish-zenn <slug>`、Qiita は `/publish-qiita <slug>`。**公開・マージの実行は全コマンドで人間ゲート（自動マージ・自動公開の禁止）**。手動運用する場合も `scripts/sync-release-zenn.sh` / `npm run publish:qiita` / `check:qiita-drift` / `check:qiita-publish-hygiene` は従来どおり使える。

## 運用スクリプト（Bash）

### Zenn / Qiita （npm）

```bash
npm run preview            # Zenn プレビュー
npm run preview:qiita      # Qiita プレビュー
npm run check              # 記事・登壇資料を含むリポジトリ全体の集約チェック
npm run new:qiita -- <slug>
npm run pull:qiita
npm run publish:qiita -- <slug>   # Qiita公開はこのproject標準scriptで叩く（生 npx qiita publish は安全機構でブロックされやすい）。実行前に必ず npm run check
```

> Qiita 公開準備: `ignorePublish:false` 化・`updated_at` 更新・公開当日HTMLコメント削除を `npm run check`（`check:qiita-publish-hygiene` 含む）で検証してから `publish:qiita`。詳細は `@AGENT_LEARNINGS.md` 2026-05-18 エントリ群。

> **Qiita drift 検知**: `npm run check:qiita-drift` はローカル `Qiita/public/*.md` と Qiita リモート本文の差分を検知する。Qiita API のレート制限（無認証 60req/h）のため `npm run check` に**含めていない**。Qiita 作業の前・複数記事を触った後に単独実行する（取得失敗時は skip し誤検知しない）。

### note （Python）

公式エクスポート取り込み・WXR 生成・`verify_wxr.py` による構造検証（**必須**）のコマンドは `note-export-import` スキル（`.claude/skills/note-export-import/SKILL.md`）と `articles_note/README.md` §よく使うコマンド を正とする。

> **生成物の整理**: WXR を生成したら `npm run clean:note-build` で `articles_note/build/` を記事ごと最新1本に整理する。note のインポートはファイル選択式で、**旧版を選ぶと古い本文の下書きがサーバ側に作られ、復旧に手動削除が必要**になる。build/ は `.gitignore` 済みで再生成可能なため削除は非破壊。確認だけなら `npm run clean:note-build:dry`。削除 / 保持の判定規則（予約名 `new` / `drafts` / `published` / `bundle` / `batch` は旧版も残す等）は `scripts/clean-note-build.js` 冒頭のコメントが正本

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

## 作業開始時のチェックリスト

1. 並列セッション衝突を回避するため `gh pr list --state open` で重複 PR がないか確認
2. **DRAFT PR の存在確認** — `gh pr list --state open --search "is:draft"` で未完了の Codex / 並列セッション PR を把握
3. **active account の確認** — `git push` / `gh pr create` / `gh pr merge` の **直前すべて** で `s977043` になっている必要がある（他アカウントのままだと PR 操作が `must be a collaborator` で失敗する）。**`gh auth setup-git` の直後は active account が切り替わる副作用がある**ので再確認する。push/PR 操作の直前に **`npm run gh:ensure`**（= `check-gh-account.sh --fix`）を走らせると想定外アカウント時に自動で s977043 へ切り替わる
   - **PreToolUse hook で自動ガード済み**: `.claude/settings.json` の PreToolUse hook（`scripts/hooks/claude-gh-account-guard.sh`）が `git push` / `gh pr create|merge|edit` / `gh api ...merge` の直前に `check-gh-account.sh --fix` を自動実行し、切替不能時のみブロックする（fail-open 設計）
   - ⚠️ **my-blog では `gh-account-guard` / `growth-core:gh-account-guard` スキルを使わない**。これらは Growth-Teams-Agent 用で期待アカウントが **kominem-unilabo**（このリポジトリの正である s977043 と逆）。起動すると「kominem-unilabo への反転」を逆に強制しうる。アカウント検証は `npm run gh:ensure` を使う
   - **逆向きにも注意**: 上記 hook は操作先の owner（`gh -R` / `git -C` / `cd` 先の origin）が s977043 以外なら補正しない（#689）。owner を判定できないコマンドでは s977043 へ戻すので、別アカウントの repo（例: unilabo）へ push / PR するときは `gh auth switch` を **push と同じ Bash コマンド内**で行い、最後に s977043 へ戻す（AGENT_LEARNINGS 2026-09-24）
4. 対象ファイルがどのプラットフォームか確認（AGENTS.md の配置規約表）
5. `articles_note/published/` を触る場合は ⚠️ 規約を確認（AGENTS.md 禁止事項）
6. note 記事に画像を追加する場合は AGENTS.md §note 固有の順序（SVG → PNG 変換 → `articles_note/assets/` 配置 → main に先にマージ → `--base-url` 付きで WXR 生成）に従う。配置後に **`file` でサイズ・寸法を確認**してプレースホルダ画像（<10KB）を弾く。`--base-url` 未指定で画像参照が残ると `md_to_wxr.py` は exit 1 で失敗する（意図的にローカル参照を残すなら `--allow-local-images`）
   - **記事に図を入れる場合は `diagram-design` スキルで作る**（全媒体共通。2026-10-08 ユーザー決定）。初回に出る style guide の確認には「(e) keep default」で答える。出力は PNG にして各媒体の画像置き場へ置き、置いた後は `article-visual-review` で確認する。スキルがセッションの一覧に無いときは再起動を依頼する
7. **Zenn 公開系の作業を進める前に** AGENTS.md の「Zenn 公開フロー（release/zenn ブランチ経由）」を確認する。**release/zenn 系 PR を作る前に `npm run check:zenn-pace` を実行し、その出力で可否を判断する**（rate-limit 数値の正本は `docs/publish-operating-policy.md` §Rate-limit 遵守。閾値はここに書き写さない）。release/zenn への sync PR は `scripts/sync-release-zenn.sh "<commit message>"` で一括実行できる（`articles_note/drafts/` の rename/rename 競合を main 採用で自動解決）
   - **公開キュー (`docs/publish-queue.md`) と実態の乖離チェック**: queue から記事を公開準備に着手する前に、対象ファイルの `id:` と `curl -s -o /dev/null -w "%{http_code}" "https://qiita.com/s977043/items/<id>"` で web 状態を確認する。**id が null でなく web 200 なら公開済み**なので queue を Done へ移すだけで終わる（2026-05-27 に二重公開準備で10分以上ロス）
8. **`git switch -c <new>` 直後に `git branch --show-current` で意図ブランチと一致するか確認** — 並列セッション干渉対策。不一致なら commit を作らず停止
9. 既存 Skill / Agent / Command で対応できないか確認
10. `@AGENT_LEARNINGS.md` で類似タスクの落とし穴を確認

## 並列実行の指針

独立したレビュー・分析タスクは並列エージェント実行で高速化できる。

- `run_in_background: true` で並列起動（10並列程度まで動作確認済み）
- 各エージェントの**出力先パスを重複しないよう**明示的に指定し、出力先ディレクトリは事前に `mkdir -p`（並列 mkdir レースを回避）
- `TaskCreate` で各ジョブを事前登録すると進捗管理が容易

### サブエージェント報告の受理基準

報告に「すべて」「一度も」「全件」等の**全称命題**が含まれる場合、サンプリング照合では受理しない。**全数を確認してから受理する**（2026-08-19: 9 件中 3 件だけ照合して「すべて創作」を受理し、ユーザーへ誤った断言をした）。

**公開を止める・遅らせる・公開条件を変える事実主張**は、サブエージェント由来でも、ユーザーに伝える前に一次情報（タグ・ファイル・API）で確かめ、carry-over / memory の記述と突合する。食い違ったら一次情報を採る（2026-10-11: 裏取りせず伝え、ユーザーに誤った前提で公開延期を判断させた）。

検証手段による分業も意識する。同系統モデルを増やしても同じ手段しか取らなければ同じ穴が残るため、**論理・構成／数値の再実行／仕様の公式ドキュメント突合**を分けて依頼する（`@AGENT_LEARNINGS.md` 2026-08-20 エントリ）。

### 反復駆動・多視点検証は既存コマンドを使う

- 長時間タスクを「続き」の繰り返し入力で駆動する状況は `/loop` で置き換える
- セルフレビュー＋Codex/Gemini/ChatGPT 等の多視点検証は、生プロンプトで依頼せず `/multi-review` を使う（L1→L2→L3 フォールバック込み）

### 並列セッション耐性

同一ワーキングツリーで複数の Claude Code セッションが走ると、ブランチが自作業外で切り替わる事例がある。対策:

- **branch-impacting 操作（`git add` / `git commit` / `git push` / `git reset` / `git switch` / `gh pr create`）の前に毎回 `git branch --show-current` で現在地確認**
- commit 前に `git status --short` も併用（未意図のファイルが staging に混入していないか確認）
- ブランチが期待と異なる場合は `git stash push -u -m "<sentinel>"` で退避 → `git switch main` → `git pull --ff-only` で復旧
- 誤配置 commit は `reflog` で探し、`git cherry-pick <sha>` で目的ブランチに移動して救出できる
- 詳細事例: `@AGENT_LEARNINGS.md` の「並列セッションによるブランチ干渉」エントリ

#### `M AGENTS.md`（claude-mem 自動注入ブロック）は WIP ではない

`git status` に常駐する `M AGENTS.md` は、多くの場合 claude-mem プラグインが末尾へ自動追記する `<claude-mem-context>...</claude-mem-context>` ブロックである（毎セッション再生成される transient な記憶コンテキスト）。**ユーザー WIP や並列セッションの変更ではない**。

- **絶対に commit しない**（リポジトリを記憶ログで汚染する）
- **`git diff AGENTS.md` で `<claude-mem-context>` ブロックのみと確認できたら `git checkout -- AGENTS.md` で破棄**してから切替える（再生成されるので情報損失なし。stash → pop を繰り返さない）
- ただし破棄前に必ず `git diff AGENTS.md` を見る。規約本文（`<claude-mem-context>` より上）に実変更が混在していたら、その部分だけは別途扱う
- commit 時は `git add -A` を使わず**対象ファイルを明示**して staging（AGENTS.md を巻き込まない）

#### `gh pr create` 直前チェックリスト

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

#### `gh pr merge` 直前チェックリスト

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

## 新規 Agent / Skill / Command 作成時の注意

作成直後はハーネスが未リロードで `Agent type not found` エラーが出る。ユーザーに再起動を依頼してから使うか、即時実行したいときは `general-purpose` エージェントに仕様書の Read を指示してインライン委譲する（`@AGENT_LEARNINGS.md` の該当エントリ）。

## Permissions 指針

`.claude/settings.local.json` で個別制御。

- **自動許可してよい**: `Read` / `Glob` / `Grep` / 記事ディレクトリへの `Write` / `npm run preview|check`
- **確認を挟む**: `git push`, `gh pr create`, `gh pr merge`, 大規模削除
- **禁止**: AGENTS.md 禁止事項 を参照

## Co-Authored-By

AGENTS.md の「Commit Attribution」に従い、**そのコミットを生成した実モデル名**で付与する。特定バージョンをこのファイルにハードコードしない。

## 学びの追記

本セッションで非自明な落とし穴や成功パターンを発見したら `@AGENT_LEARNINGS.md` に追記する。更新基準とテンプレートは同ファイル冒頭を参照。

## セッション終了時のチェックリスト

stash や未マージブランチが残ると、次回作業者（自分含む）が混乱する。

1. `git stash list` — 退避物がある場合、内容と所有者（自分 or 並列セッション）を確認。自分のものなら処遇判断（drop / 退避ブランチ保存）
2. `git branch -vv | grep -v '^\* main'` — local stale ブランチを削除する。このリポジトリは squash マージなので、マージ済みでも `git branch -d`・`--is-ancestor`・3点 diff は「未マージ」と判定する。**`npm run clean:merged-branches` で PR が MERGED のブランチを洗い出し、`-- --apply` で削除**（SHA を表示するので復元可。AGENT_LEARNINGS 2026-09-24）
3. `gh pr list --state open` — open PR が想定通りか確認、放置していないか
4. **Zenn 公開系作業をした場合**: `npm run check:zenn-pace` で過去 24h の publish 切替件数を確認、rate-limit hit 兆候があれば次セッションへ申し送り
