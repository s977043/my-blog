---
description: reviews/note/<state>/<slug>.md の指摘を articles_note/<state>/<slug>.md に選別反映してPRを作成する
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、drafts/n17c899de2a4e、new/ai_agent_operations_opinion_note）
---

# /apply-review-note

指定した note 記事のレビュー指摘を、採用/保留/却下の分類付きで本文に反映する。Zenn 版 `/apply-review` の note 対応版。

## 引数
- `$1` = `<state>/<slug>` 形式（`<state>` は `new` / `drafts` / `published`）

## 手順

1. 引数検証
   ```bash
   test -f reviews/note/$1.md || { echo "レビューが存在しません: reviews/note/$1.md"; exit 1; }
   test -f articles_note/$1.md || { echo "記事が存在しません: articles_note/$1.md"; exit 1; }
   STATE=$(dirname $1)
   SLUG=$(basename $1)
   ```

2. main 同期 & ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b chore/apply-review-note-$SLUG
   ```

3. `review-applier` エージェントを起動（note向け挙動を指定）
   - 入力: `reviews/note/$1.md`, `articles_note/$1.md`
   - スキル `.claude/skills/note-article-review/SKILL.md` の反映フェーズ（手順 9〜12）に準拠
   - 採用/保留/却下を分類し、採用分のみ Edit
   - JTFスタイル違反（ダッシュ等）は一括置換で採用
   - Zenn固有観点の誤混入指摘は却下
   - PR本文用の採否一覧 Markdown を返す

4. 採用件数が0の場合
   - PRは作らず、結果を報告して終了
   - 保留/却下の一覧はこの会話に表示

5. 採用件数が1以上の場合
   - PR作成まで自動進行（マージはしない）
   - ブランチ: `chore/apply-review-note-$SLUG`
   - PR本文にエージェント生成の採否一覧を含める
   - **`$STATE` が `published` の場合、PR本文冒頭に ⚠️ バナー必須**:
     ```
     > ⚠️ **公開済み記事** (`articles_note/published/`)
     > 本PRは既にnote.com上で公開されている記事への修正提案を含みます。
     > note はインポートで既存記事を上書き更新できないため、マージ後はnote管理画面で手動反映が必要です。
     ```

6. 結果報告
   - PR URL
   - 採用/保留/却下件数
   - `$STATE` ごとの追加注意（published の場合は手動反映必要、drafts は note 側との整合確認、new は自由反映）

## ガードレール
- 記事本文 (`articles_note/**/*.md`) 以外のファイルを変更しない
- レビュー成果物 (`reviews/note/**/*.md`) は変更しない
- `published/` 配下を触る場合は ⚠️ バナー必須
- 自動マージ禁止
- 全指摘が却下の場合はPR不要、却下ログのみ報告
