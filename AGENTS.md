# AGENTS.md

このリポジトリの**規約**（全エージェント・全開発者共通の正）。Claude Code や OpenAI Codex など AIエージェントはまずこのファイルを読む。

人間の開発者にも同じ情報が有用なので、`README.md` と重複しない範囲で「判断の根拠となるルール」に絞って記述する。

- **規約（本ファイル）** — 何が正しいか
- **コンテンツ方針**: `docs/content-channel-strategy.md` — note / Zenn / Qiita / Growth Lab / GitHub を横断した記事運用方針
- **ツール使い方**: `CLAUDE.md` — Claude Code固有のSkill/Agent/Commandインデックスと操作
- **経験則**: `AGENT_LEARNINGS.md` — 過去の失敗・成功パターン（追記型ログ）

## リポジトリ概要

Zenn / Qiita / note の3プラットフォームで公開する記事を単一リポジトリで並行管理するモノレポ。

詳細は `README.md` と各ディレクトリの `README.md`:
- `articles/README.md` — Zenn
- `Qiita/README.md` — Qiita
- `articles_note/README.md` — note（WXRインポート/エクスポート運用を含む）

記事作成・更新・レビュー・導線設計を行う場合は、媒体別の配置規約だけでなく `docs/content-channel-strategy.md` も参照し、媒体横断のポジショニングと役割分担に沿って判断する。

## コンテンツ方針

記事作成・更新・レビューでは、以下を共通方針とする。詳細は `docs/content-channel-strategy.md` を正とする。

- 共通ポジショニング: `AIコーディングをチーム開発に乗せる運用設計`
- note: 背景・思想・マネジメント視点
- Zenn: 技術深掘り・実装詳細
- Qiita: 検索入口・短い実務Tips
- Growth Lab: 正本・検証ログ・長期SEO
- GitHub: OSSのソースオブトゥルース

同じ本文を複数媒体へ転載せず、同じテーマを読者意図と媒体役割に合わせて書き分ける。

## プラットフォーム別の配置規約

| プラットフォーム | 記事本体 | 画像 | レビュー成果物 |
|--------------|---------|------|--------------|
| Zenn | `articles/<slug>.md` | `images/<slug>/*.png` | `reviews/zenn/<slug>.md` |
| Qiita | `Qiita/public/<slug>.md` | 記事内マークダウン | `reviews/qiita/<slug>.md` |
| note | `articles_note/<state>/<slug>.md` | `articles_note/assets/*.png` | `reviews/note/<state>/<slug>.md` |

`<state>` = `new` / `drafts` / `published`（note固有）

`reviews/` のディレクトリ構造はプラットフォームごとに非対称。note のみ `reviews/note/<state>/` と state 階層を持つ（`published` への反映 PR は ⚠️ バナーが必須で、state 判定がレビュー成果物の取り扱いを分岐させるため）。Zenn/Qiita はフラット配置（`reviews/zenn/<slug>.md`、`reviews/qiita/<slug>.md`）。

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

### 記事内クロスプラットフォーム参照（note ↔ Zenn ↔ Qiita）

他プラットフォームの自分の投稿を参照する場合は、**本文中の主張の根拠/導入として持ち出さず、末尾の参考/関連リンク集に留める**。

- ✅ OK: `## 参考` / `## 関連記事` / 末尾リンク集などの、記事末尾のリンクセクション配下
- ❌ NG: 本文中の「姉妹記事」「本編」「設計思想ベース」等の言及、`:::message` や導入段落内のリンク

Zenn 記事の場合、`note.com/mine_unilabo` へのリンクは `npm run check:note-ref` で lint 検知される（末尾リンク集以外に出現すると警告）。

### note 固有（JTFスタイル準拠）

- ダッシュ（`—` `――` `──` `―`）は使用しない → 全角括弧 `（）` や句点で置換
- 三点リーダーは `……`（2つ並べる）
- カッコは全角 `（）「」『』`
- 敬体／常体の混在は章単位のみ許容
- note インポート用の画像は **公開HTTPS URL必須**。`../assets/...` のままでは取り込まれない（本文には残るが note 上で非表示）
- **SVG は note インポート非対応**。必ず PNG に変換してから `articles_note/assets/` に配置する（変換は Chrome headless を使用。macOS では cairosvg は日本語フォント非対応）
- note 用に新規画像を追加した場合、**先に GitHub `main` へ公開**してから WXR を生成する
- WXR生成時の `--base-url` は `https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets` を使う
- PR branch の raw URL は一時確認用。**note 本番取り込みには使わない**
- note記事の作成・レビュー時は `articles_note/checklists/note-article-quality-checklist.md` を参照し、テーマ設計 / サムネ・タイトル設計 / 本文構成 / 読者体験を確認する
- 短時間レビューでは同チェックリストの「必須確認」を優先し、全項目を機械的に満たすことを目的にしない

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
- **バンドル PR の粒度判断**: 複数ファイル / 記事を 1 PR にまとめる場合、理由を PR 本文 Summary 直下に明記する
  - 例: 公開切替の一括 PR、同一品質ゲート通過分の束ね、レビュアー負荷最適化
  - 個別改訂が必要になった場合は個別 PR で対応する前提も明記
  - 理由不在のバンドル PR は、将来の読者・エージェントが粒度判断を追跡できなくなる

## Zenn 公開フロー（release/zenn ブランチ経由）

Zenn は **`release/zenn` ブランチ** をデプロイ対象とする運用に変更（rate-limit 対策）。`main` への push は Zenn deploy をトリガーしない。

```
main                      ← 通常運用（記事執筆、レビュー反映、修正、note/Qiita 編集すべて）
  └─ release/zenn         ← Zenn deploy 対象。このブランチへの push のみ deploy 発火
       ← cherry-pick / merge       ← 公開準備が整った記事だけ意図的に流す
```

### 公開ルール

- **1 PR で `release/zenn` にマージする記事数は最大 3 本**まで（24h/5本 rate-limit に対する安全マージン）
- **`release/zenn` への merge は 24 時間あけて** 実施（連続バッチを避ける）
- **既存公開記事の update は単独 PR で `release/zenn` に流す**（新規 publish と分離。update が rate-limit に巻き込まれて公開済記事が古いままになる事故を防ぐ）
- main → release/zenn の merge は **squash 推奨**（記事単位での切り戻しを容易に）
- 緊急時の escape: `release/zenn` への直接 push（事後で main に必ず取り込む）

### 公開フロー例

```
[新規記事公開]
1. PR1: docs/foo → main（記事執筆・レビュー反映、Zenn deploy 発火しない）
2. PR2: release/zenn-publish-YYYY-MM-DD → release/zenn（公開対象記事だけを cherry-pick or filtered merge）

[既存公開記事の update]
1. PR1: docs/fix-typo → main（修正反映、Zenn deploy 発火しない）
2. PR2: release/zenn-update-<slug> → release/zenn（単独 PR で update を流す。新規 publish と同 PR にしない）
```

### rate-limit hit 時の対処

- リポジトリ側に追加 commit を **作らない**（被害拡大を防ぐ）
- [Zenn お問い合わせフォーム](https://zenn.dev/inquiry) で緩和申請（公式が「移行・特殊用途では緩和可」と明言している正規ルート）
- 詳細仕様と緩和申請文案テンプレ: `memory/reference_zenn_rate_limit_spec.md`

## Commit Attribution

AIエージェントによるコミットは、利用中モデルの名前で `Co-Authored-By` を付与する。モデルが切り替わった場合は実際に使用したモデル名を反映すること（ハードコードを古いまま残さない）。

```
Co-Authored-By: <Model name and byline> <noreply@anthropic.com>
```

例: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

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
- **コンテンツ方針**: `docs/content-channel-strategy.md`
- **Claude Code ツール**: `CLAUDE.md`
- **経験則ログ**: `AGENT_LEARNINGS.md`
- **運用スクリプト**: `.claude/skills/note-export-import/scripts/*.py`
- **note記事品質チェックリスト**: `articles_note/checklists/note-article-quality-checklist.md`
- **Skill / Agent / Command定義**: `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `.claude/commands/*.md`
