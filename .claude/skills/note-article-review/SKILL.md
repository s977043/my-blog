---
name: note-article-review
description: note.com記事（articles_note/<state>/<slug>.md、<state>は new/drafts/published）のレビュー成果物を生成し、編集可能な状態では指摘を反映するワークフロー。drafts は読み取り専用ミラーのためレビューのみ行う。
---

# note-article-review

note.com記事のレビュー → 指摘反映 のライフサイクルを扱うスキル。Zenn向けの `article-review-apply` スキルに対応する note版。

## トリガー

- `/review-note-article <state>/<slug>` コマンド経由（レビュー生成）
- `note-article-reviewer` エージェントから参照
- 本スキルを直接利用する場合

## 正本と前提条件

- 対象記事: `articles_note/<state>/<slug>.md`（`<state>` は `new` / `drafts` / `published`）
- 出力先: `reviews/note/<state>/<slug>.md`
- **構成判断の正本**: `articles_note/guides/note-structure-best-practices.md`
- 品質チェック: `articles_note/checklists/note-article-quality-checklist.md`
- レビュー生成: `.claude/agents/note-article-reviewer.md`
- レビュー反映: `.claude/agents/note-review-applier.md`
- note状態管理の正本: `articles_note/README.md`
- 媒体役割: `docs/content-channel-strategy.md`
- main ブランチが最新 (`git pull origin main`)
- git identity がリポジトリ規約どおり (`mine_take <s977043@users.noreply.github.com>`)

構成ガイドを固定テンプレートとして機械適用しない。記事タイプ・読者・目的を優先する。

## ディレクトリ構成

```text
articles_note/
├── guides/     # 構成判断の正本
├── checklists/ # 品質確認
├── new/        # 未投稿。編集の正
├── drafts/     # note上の下書きミラー。読み取り専用
└── published/  # note公開済み記事。修正はnote側へ手動反映

reviews/note/
├── new/
├── drafts/
└── published/
```

## note と Zenn の前提差分

| 項目 | Zenn | note |
|---|---|---|
| Front Matter | 必須 (`published`, `title`, `topics`, `type`, `emoji`) | なし（本文冒頭） |
| 配置 | `articles/<slug>.md` | `articles_note/<state>/<slug>.md` |
| コード | 中心になり得る | 補助的要素 |
| 構成の主眼 | 再現性・技術判断 | 一次体験・背景・読者体験 |
| 表現 | Markdown / Zenn記法 | JTFスタイル・スマホ可読性 |
| 公開判定 | `published: true` | ディレクトリ (`published/`) |
| 公開済み修正 | release/zennへ反映 | note管理画面で手動反映 |

## 状態別の扱い

- **`new/`**: 未投稿。本文反映・編集が自由
- **`drafts/`**: noteエクスポートから再生成される**読み取り専用ミラー**。レビュー生成は可、**指摘反映は不可**
- **`published/`**: note公開済み。ローカルで修正提案を作る場合は ⚠️ 公開済み記事 バナー必須。マージ後はnote管理画面へ手動反映する

`drafts/` に対応する `new/` の編集正本が存在する場合は、反映対象をその `new/` へ切り替えて明示的にレビューし直す。対応する `new/` がない場合はnote管理画面で修正し、次回バックアップで同期する。

## レビュー生成フェーズ

### 1. ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b docs/review-note-<slug>
```

### 2. 出力先準備

```bash
mkdir -p reviews/note/<state>
```

### 3. 記事タイプ判定

`articles_note/<state>/<slug>.md` を読み、主タイプを判定する。

- オピニオン / 考察
- 体験 / 振り返り
- 解説 / ハウツー
- 混合

### 4. 3ペルソナレビュー

`note-article-reviewer` に委譲する。エージェント自身が次を読むため、同じ構成ルールをここで重複定義しない。

- `articles_note/guides/note-structure-best-practices.md`
- `articles_note/checklists/note-article-quality-checklist.md`

レビュー観点:

- noteディレクター
- note編集者
- 記事タイプに応じた想定読者
- 事実・リンク・数値の確認

問題が少ない記事に件数合わせの指摘を作らない。指摘0件でも総合評価と未検証事項を残す。

### 5. コミット & PR

```bash
git add reviews/note/<state>/<slug>.md
git commit -m "docs(reviews): add 3-persona note review for <state>/<slug>"
git push -u origin docs/review-note-<slug>
gh pr create --title "docs(reviews): add note review for <state>/<slug>" --body "(レビュー要約)"
```

`drafts/` もレビュー成果物の生成までは可能。記事本文は変更しない。

## 反映フェーズ

### 6. state gate

反映前に `<state>` を確認する。

- `new` → 続行
- `published` → 続行。ただし公開済みバナー + note管理画面への手動反映が必須
- **`drafts` → ここで停止。`note-review-applier` に記事編集をさせず、commit / push / 反映PRを作らない**

### 7. 採否分類

`new/` / `published/` のみ、**`note-review-applier`** を使用する。Zenn版 `review-applier` は使わない。

- 採用: 誤字脱字、明白な表記揺れ、JTFスタイル、壊れたリンクなど客観修正
- 保留: タイトル/リード、構成変更、追記、トーンなど著者判断が必要なもの
- 却下: 事実誤認、コンテキスト違い、Zenn固有観点の誤混入

### 8. 採用分の反映

- 対象: `articles_note/new/<slug>.md` または `articles_note/published/<slug>.md`
- 最小差分でEdit
- `reviews/note/**` は記録として変更しない
- **`articles_note/drafts/**` はEditしない**

### 9. 検証

- Markdown見出し階層
- 段落・改行のリズム
- JTFスタイル
- 記事タイプに応じた中心主張の一貫性
- `published/` の場合、note管理画面での手動反映が必要とPRに明記したか

### 10. コミット & PR

```bash
git add articles_note/<state>/<slug>.md
git commit -m "docs(articles_note): apply review feedback to <state>/<slug>"
gh pr create --title "docs(articles_note): apply note review feedback to <state>/<slug>" --body "$(採否一覧テンプレート)"
```

この手順は `new/` / `published/` のみ。`drafts/` では実行しない。

`published/` 記事の場合、PR本文冒頭に必ず次を含める。

```markdown
> ⚠️ **公開済み記事** (`articles_note/published/`)
> 本PRは既にnote.com上で公開されている記事への修正提案を含みます。
> note はインポートで既存記事を上書き更新できないため、マージ後はnote管理画面で手動反映が必要です。
```

## ガードレール

- [ ] レビュー生成では `articles_note/**/*.md` を変更しない
- [ ] **`articles_note/drafts/**` はレビューのみ。反映時にEdit / commit / PRしない**
- [ ] 反映時は `note-review-applier` を使い、Zenn固有記法を混入させない
- [ ] `published/` の反映PRには ⚠️ バナー必須
- [ ] 自動マージ禁止
- [ ] URL検証失敗をリンク切れと断定しない
- [ ] 構成ガイドを固定テンプレートとして強制しない

## エラー回復

- `drafts/` を反映対象に渡された: 本文を変更せず停止し、`new/` 正本またはnote管理画面での修正を案内
- Edit conflict: 該当指摘を保留にして理由を記録
- URL検証失敗: 未検証として扱う
- JTF修正が文意を変えそう: 自動反映せず保留
- ブランチ不一致: commitせず停止

## 成果物

- レビュー: `reviews/note/<state>/<slug>.md`
- 反映: `new/` / `published/` のみ記事差分 + 採否一覧を含むPR
- `drafts/`: レビュー成果物のみ。本文反映成果物は作らない

## 参考

- `articles_note/README.md`
- `articles_note/guides/note-structure-best-practices.md`
- `articles_note/checklists/note-article-quality-checklist.md`
- `.claude/agents/note-article-reviewer.md`
- `.claude/agents/note-review-applier.md`
- `.claude/agents/article-reviewer.md`（Zenn版との比較用）