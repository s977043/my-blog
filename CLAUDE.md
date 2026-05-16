# CLAUDE.md

Claude Code 向けのツールガイド。規約（何が正しいか）は `@AGENTS.md` に集約してあるので先にそちらを読む。

本ファイルは Claude Code 固有の情報（利用可能な Skill / Agent / Command、作業チェックリスト、permissions）に絞る。

## 読む順序

1. `@AGENTS.md` — 全エージェント共通の**規約**（配置/表現/Git運用/禁止事項）
2. `@AGENT_LEARNINGS.md` — 過去の失敗・成功パターン（同じ落とし穴を踏まない）
3. 本ファイル — Claude Code で使えるツールの索引

## Slash Commands（`.claude/commands/`）

| コマンド | 用途 | 対象 |
|---------|------|------|
| `/review-article <slug>` | Zenn記事の3ペルソナレビューを生成 | `articles/<slug>.md` |
| `/apply-review <slug>` | Zennレビューを本文に選別反映（PR作成） | `articles/<slug>.md` |
| `/article-pipeline <slug>` | Zennレビュー生成→反映を2PR分割で実行 | Zenn記事 |
| `/review-note-article <state>/<slug>` | note記事の3ペルソナレビューを生成 | `articles_note/<state>/<slug>.md` |
| `/apply-review-note <state>/<slug>` | noteレビューを本文に選別反映（PR作成） | `articles_note/<state>/<slug>.md` |
| `/article-pipeline-note <state>/<slug>` | noteレビュー生成→反映を2PR分割で実行 | note記事 |

## Subagents（`.claude/agents/`）

| エージェント | 役割 |
|-----------|------|
| `article-reviewer` | Zenn記事の3ペルソナレビュー生成 |
| `note-article-reviewer` | note記事の3ペルソナレビュー生成（JTFスタイル準拠） |
| `review-applier` | レビュー指摘の採用/保留/却下分類と本文反映 |
| `note-export-importer` | note公式WXRエクスポートの取り込み/WXR生成 |

## Skills（`.claude/skills/`）

| スキル | トリガー |
|-------|---------|
| `article-review-apply` | Zennレビューの反映ワークフロー全般 |
| `note-article-review` | noteレビューの生成→反映ライフサイクル |
| `note-export-import` | note公式エクスポートZIPの取り込み/WXR生成 |

## 運用スクリプト（Bash）

### Zenn / Qiita （npm）

```bash
npm run preview            # Zenn プレビュー
npm run preview:qiita      # Qiita プレビュー
npm run check              # Zenn + Qiita 構造チェック + note参照lint
npm run new:qiita -- <slug>
npm run pull:qiita
npm run publish:qiita -- <slug>
```

### note （Python）

```bash
# 公式エクスポート取り込み
python3 .claude/skills/note-export-import/scripts/wxr_to_md.py <zip> --out articles_note

# 新規記事 → インポート用WXR
python3 .claude/skills/note-export-import/scripts/md_to_wxr.py articles_note/new/<slug>.md

# 生成WXRの構造検証（note公式エクスポート形式との差分チェック。必須）
python3 .claude/skills/note-export-import/scripts/verify_wxr.py articles_note/build/import-*.xml
```

依存: `pip install --break-system-packages markdownify markdown`（`verify_wxr.py` は標準ライブラリのみ）

## 作業開始時のチェックリスト

1. 並列セッション衝突を回避するため `gh pr list --state open` で重複 PR がないか確認
2. **DRAFT PR の存在確認** — `gh pr list --state open --search "is:draft"` で未完了の Codex / 並列セッション PR を把握（旧 PR の影響範囲を見落とさない）
3. **`gh auth status` で active account を確認** — `git push` / `gh pr create` / `gh pr merge` の **直前すべて** で s977043 になっている必要あり（kominem-unilabo のままだと push は credential helper 設定次第で通るが PR 操作は `must be a collaborator` で失敗 → 切替 → 再実行の手戻り）。**特に `gh auth setup-git` を実行した直後は active account が切り替わる副作用がある** ため、その後の PR 操作前に必ず再確認
4. 対象ファイルがどのプラットフォームか確認（`@AGENTS.md` の配置規約表）
5. `articles_note/published/` を触る場合は ⚠️ 規約を確認（`@AGENTS.md` 禁止事項）
6. note 記事に画像を追加する場合: SVG → PNG 変換 → `articles_note/assets/` 配置 → **`file` でサイズ・寸法を確認**（プレースホルダ画像 <10KB を弾く） → main に先にマージ → WXR 生成の順序を守る。**WXR 生成は必ず `--base-url https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets` を付ける**（未指定で画像参照が残ると `md_to_wxr.py` が exit 1 で失敗、意図的にローカル参照を残すなら `--allow-local-images`）
7. **Zenn 公開系の作業を進める前に**、`@AGENTS.md` の「Zenn 公開フロー（release/zenn ブランチ経由）」を確認。`articles/*.md` の `published: true` 切替や本文修正は **`release/zenn` ブランチへの merge をもって公開**となる。`main` への push は Zenn deploy をトリガーしない（rate-limit 対策）。1 PR 最大 3 本 / 24 時間あけてマージ / 既存 update と新規 publish は別 PR、を厳守。**release/zenn 系 PR を作る前に `npm run check:zenn-pace` で過去 24h の publish 切替件数を確認**（5 件以上で FAIL exit、3 件以上で WARN）
8. **`git switch -c <new>` 直後に `git branch --show-current` で意図ブランチと一致するか確認** — Round 5 並列セッション干渉対策（PR #203 で観測、`memory/project_parallel_session_metrics.md` 参照）。不一致なら commit を作らず停止
9. 既存 Skill / Agent / Command で対応できないか確認（上記表）
10. `@AGENT_LEARNINGS.md` で類似タスクの落とし穴を確認

## 並列実行の指針

独立したレビュー・分析タスクは並列エージェント実行で高速化できる。

- `run_in_background: true` で並列起動（10並列程度まで動作確認済み）
- 各エージェントの**出力先パスを重複しないよう**明示的に指定
- 出力先ディレクトリは事前に `mkdir -p`（並列 mkdir レースを回避）
- `TaskCreate` で各ジョブを事前登録すると進捗管理が容易

### 並列セッション耐性

同一ワーキングツリーで複数の Claude Code セッションが走ると、ブランチが自作業外で切り替わる事例がある（本プロジェクトでは復旧コスト最大 10 分程度が観測）。対策:

- **branch-impacting 操作の前に毎回 `git branch --show-current` で現在地確認**
  - 対象: `git add` / `git commit` / `git push` / `git reset` / `git switch` / `gh pr create` 直前
- commit 前に `git status --short` も併用（未意図のファイルが staging に混入していないか確認）
- ブランチが期待と異なる場合は `git stash push -u -m "<sentinel>"` で退避 → `git switch main` → `git pull --ff-only` で復旧
- `reflog` を併用して誤配置 commit の救出が可能（`git cherry-pick <sha>` で目的ブランチに移動）
- 詳細事例: `@AGENT_LEARNINGS.md` の「並列セッションによるブランチ干渉」エントリ

#### `M AGENTS.md`（claude-mem 自動注入ブロック）は WIP ではない

`git status` に常駐する `M AGENTS.md` は、多くの場合 claude-mem プラグインが末尾へ自動追記する `<claude-mem-context>...</claude-mem-context>` ブロックである（毎セッション再生成される transient な記憶コンテキスト）。**ユーザー WIP や並列セッションの変更ではない**。

- **絶対に commit しない**（リポジトリを記憶ログで汚染する）
- ブランチ切替の度に `git stash push AGENTS.md` → `pop` を繰り返すのは非効率。**`git diff AGENTS.md` で `<claude-mem-context>` ブロックのみと確認できたら `git checkout -- AGENTS.md` で破棄**してから切替える（再生成されるので情報損失なし）
- ただし破棄前に必ず `git diff AGENTS.md` を見る。規約本文（`<claude-mem-context>` より上）に実変更が混在していたら、その部分だけは別途扱う
- commit 時は `git add -A` を使わず**対象ファイルを明示**して staging（AGENTS.md を巻き込まない）

#### `gh pr create` 直前チェックリスト

push 直後に並列セッションが別ブランチへ切り替えると、`gh pr create` が「must first push the current branch to a remote」で失敗する。以下 3 行を直前に走らせると、ブランチ名ズレ / upstream 未同期 / head 不一致を検知できる。

```bash
git branch --show-current                             # 期待ブランチか
git rev-parse HEAD                                    # ローカル head
git rev-parse "@{u}" 2>/dev/null || echo "NO_UPSTREAM" # 上流 head（未 track なら NO_UPSTREAM）
```

失敗時の復旧パターン:

| 症状 | 対処 |
|---|---|
| 現在ブランチが意図と違う | `gh pr create --head <intended-branch> ...`（切替不要で PR 作成） |
| upstream 未 track | `git push -u origin <branch>` してから `gh pr create` |
| head が origin より進んでいる | そのまま `--head` で PR 作成可（origin が新しい分は自動取込） |

**原則**: 並列セッション干渉を検知したら **ブランチ切替ではなく `--head` フラグで指名する** ほうが副作用が少ない。

#### `gh pr merge` 直前チェックリスト

並列セッションが先にマージを完了させていたり、ブランチが main に対して stale でリグレッションを含んでいる事例がある。マージ前に以下 2 点を確認する。

```bash
gh pr view <n> --json state,mergeStateStatus --jq .   # state=OPEN か
git fetch origin main <branch>
git diff origin/main..origin/<branch> --stat          # tree-to-tree 差分（想定範囲内か）
```

- `state != OPEN` の場合は何もしない（並列セッションが先行マージ済み）
- tree-to-tree diff が PR 本文の想定範囲を超える場合は stale の疑い。ブランチで `git merge origin/main --no-ff` して追従してから再確認
- 詳細事例: `@AGENT_LEARNINGS.md` の「Stale PR は `git diff main..branch` で事前にリグレッション検出する」エントリ

## 新規 Agent / Skill / Command 作成時の注意

作成直後はハーネスが未リロードで `Agent type not found` エラーが出る。

- **回避策A**: ユーザーに再起動依頼してから使う
- **回避策B**: `general-purpose` エージェントに仕様書の Read を指示してインライン委譲（即時実行したい時）
- 詳細: `@AGENT_LEARNINGS.md` の該当エントリ

## Permissions 指針

`.claude/settings.local.json` で個別制御。

- **自動許可してよい**: `Read` / `Glob` / `Grep` / 記事ディレクトリへの `Write` / `npm run preview|check`
- **確認を挟む**: `git push`, `gh pr create`, `gh pr merge`, 大規模削除
- **禁止**: `@AGENTS.md` 禁止事項 を参照

## Co-Authored-By

規約は `@AGENTS.md` の「Commit Attribution」を参照。**利用中のモデル名で `Co-Authored-By` を付与**すること（現行: `Claude Sonnet 4.6 <noreply@anthropic.com>`）。モデル切替時はハードコードを残さず実モデル名に更新する。

## 学びの追記

本セッションで非自明な落とし穴や成功パターンを発見したら `@AGENT_LEARNINGS.md` に追記する。更新基準とテンプレートは同ファイル冒頭を参照。

## セッション終了時のチェックリスト

セッションを終える前に以下を確認する。stash や未マージブランチが残ると、次回作業者（自分含む）が混乱する。

1. `git stash list` — 退避物がある場合、内容と所有者（自分 or 並列セッション）を確認。自分のものなら処遇判断（drop / 退避ブランチ保存）
2. `git branch -vv | grep -v '^\* main'` — local stale ブランチを `git branch -d` で削除（merge 済確認後）
3. `gh pr list --state open` — open PR が想定通りか確認、放置していないか
4. **Zenn 公開系作業をした場合**: `npm run check:zenn-pace` で過去 24h の publish 切替件数を確認、rate-limit hit 兆候があれば次セッションへ申し送り
