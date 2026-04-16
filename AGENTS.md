# AGENTS.md

このリポジトリの**規約**（全エージェント・全開発者共通の正）。Claude Code や OpenAI Codex など AIエージェントはまずこのファイルを読む。

人間の開発者にも同じ情報が有用なので、`README.md` と重複しない範囲で「判断の根拠となるルール」に絞って記述する。

- **規約（本ファイル）** — 何が正しいか
- **ツール使い方**: `CLAUDE.md` — Claude Code固有のSkill/Agent/Commandインデックスと操作
- **経験則**: `AGENT_LEARNINGS.md` — 過去の失敗・成功パターン（追記型ログ）

## リポジトリ概要

Zenn / Qiita / note の3プラットフォームで公開する記事を単一リポジトリで並行管理するモノレポ。

詳細は `README.md` と各ディレクトリの `README.md`:
- `articles/README.md` — Zenn
- `Qiita/README.md` — Qiita
- `articles_note/README.md` — note（WXRインポート/エクスポート運用を含む）

## プラットフォーム別の配置規約

| プラットフォーム | 記事本体 | 画像 | レビュー成果物 |
|--------------|---------|------|--------------|
| Zenn | `articles/<slug>.md` | `images/<slug>/*.png` | `reviews/zenn/<slug>.md` |
| Qiita | `Qiita/public/<slug>.md` | 記事内マークダウン | `reviews/qiita/<slug>.md` |
| note | `articles_note/<state>/<slug>.md` | `articles_note/assets/*.png` | `reviews/note/<state>/<slug>.md` |

`<state>` = `new` / `drafts` / `published`（note固有）

## 記事の状態（note固有）

| state | 意味 | 編集の自由度 |
|-------|------|-----------|
| `new/` | 未投稿の新規原稿 | 自由に編集・反映可 |
| `drafts/` | note上の下書きとして存在 | 反映時はnote側との整合確認が必要 |
| `published/` | noteで公開済み | **反映PRに ⚠️ バナー必須**。noteはインポートで既存記事を上書き更新**できない**ため、マージ後はnote管理画面で手動反映 |

## 表現規約

### 全プラットフォーム共通

- コミットメッセージ: Conventional Commits（例: `docs(articles): apply review feedback to <slug>`）
- Markdown のコードブロックには言語指定
- 相対リンクは記事内で完結させる

### note 固有（JTFスタイル準拠）

- ダッシュ（`—` `――` `──` `―`）は使用しない → 全角括弧 `（）` や句点で置換
- 三点リーダーは `……`（2つ並べる）
- カッコは全角 `（）「」『』`
- 敬体／常体の混在は章単位のみ許容

### Zenn 固有

- Front Matter 必須（`published`, `title`, `topics`, `type`, `emoji`）
- `published: true` の記事編集は慎重に

### Qiita 固有

- Front Matter 必須（`title`, `tags`, `private`, `updated_at`, `id`, `organization_url_name`, `slide`, `ignorePublish`）
- 下書き中は `ignorePublish: true` を維持

## Package Manager

- Zenn / Qiita: **npm**（主要コマンドは `CLAUDE.md` を参照）
- note 運用スクリプト: **Python 3**
  - 依存: `pip install --break-system-packages markdownify markdown`
  - 配置: `.claude/skills/note-export-import/scripts/*.py`

## Git 運用

- 主ブランチ: `main`
- Git identity: `mine_take <s977043@users.noreply.github.com>`
- ブランチ命名:
  - `docs/review-<slug>` — レビュー生成
  - `chore/apply-review-<slug>` — レビュー反映
  - `feat/<topic>` — 新機能
  - `docs/<topic>` — ドキュメント変更
- PR作成: `gh pr create` + HEREDOC body。マージは **squash only**（リポジトリ設定）
- `articles_note/export/` は `.gitignore` 除外（大容量WXR ZIP）

## Commit Attribution

AIエージェントによるコミットは、利用中モデルの名前で `Co-Authored-By` を付与する。モデルが切り替わった場合は実際に使用したモデル名を反映すること（ハードコードを古いまま残さない）。

```
Co-Authored-By: <Model name and byline> <noreply@anthropic.com>
```

例: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

## 禁止事項

- **自動マージ禁止**。著者レビューを必ず通す
- `git push --force` to `main` は禁止
- `published: true` / `articles_note/published/` 記事の勝手な変更禁止（⚠️ バナー付きPRで著者承認を得る）
- `articles_note/export/` を git 管理下に入れない
- `.claude/` 配下の既存規約をユーザー確認なしに変更しない
- 大容量バイナリ（画像以外）をコミットしない
- `ignorePublish: true` → `false` の自動切替禁止（Qiita）

## 参考ファイル

- **規約の正**: `README.md`, `articles/README.md`, `Qiita/README.md`, `articles_note/README.md`
- **Claude Code ツール**: `CLAUDE.md`
- **経験則ログ**: `AGENT_LEARNINGS.md`
- **運用スクリプト**: `.claude/skills/note-export-import/scripts/*.py`
- **Skill / Agent / Command定義**: `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `.claude/commands/*.md`
