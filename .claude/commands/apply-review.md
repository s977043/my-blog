---
description: reviews/zenn/<slug>.md の指摘を articles/<slug>.md に選別反映してPRを作成する
argument-hint: <article-slug> (reviews/zenn/ 配下のファイル名 .md 抜き)
---

# /apply-review

指定した記事のレビュー指摘を、採用/保留/却下の分類付きで本文に反映する。

## 引数
- `$1` = 記事の slug (例: `plangate-ai-coding-workflow`)

## 手順

1. 引数検証
   ```bash
   test -f reviews/zenn/$1.md || { echo "レビューが存在しません: reviews/zenn/$1.md"; exit 1; }
   test -f articles/$1.md || { echo "記事が存在しません: articles/$1.md"; exit 1; }
   ```

2. main 同期 + ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b chore/apply-review-$1
   ```

3. `review-applier` エージェントを起動
   - 入力: `reviews/zenn/$1.md`, `articles/$1.md`
   - スキル `.claude/skills/article-review-apply/SKILL.md` を遵守
   - 採用/保留/却下を分類し、採用分のみ Edit
   - PR本文用の採否一覧 Markdown を返す

4. 採用件数が0の場合
   - PRは作らず、結果を報告して終了
   - 保留/却下の一覧はこの会話に表示

5. 採用件数が1以上の場合
   - PR作成まで自動進行（マージはしない）
   - ブランチ: `chore/apply-review-$1`（手順2で作成済み）
   - PR本文にエージェント生成の採否一覧を含める
   - `published: true` の記事には ⚠️ バナーをPR冒頭に付与

6. 結果報告
   - PR URL
   - 採用/保留/却下件数
   - 次アクション提案（保留項目のユーザー判断を依頼）

## ガードレール
- 記事本文以外のファイルを変更しない
- Front Matter の `published` を勝手に変更しない
- 自動マージ禁止
- 全指摘が却下の場合はPR不要、却下ログのみ報告
