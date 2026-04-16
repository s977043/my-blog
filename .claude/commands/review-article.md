---
description: 指定した記事を3ペルソナでレビューし、reviews/zenn/<slug>.md を生成してPRを作成する
argument-hint: <article-slug> (articles/ 配下のファイル名 .md 抜き)
---

# /review-article

指定した記事を3ペルソナ視点でレビューし、`reviews/zenn/<slug>.md` を生成してPRを作成する。

## 引数
- `$1` = 記事の slug (例: `plangate-ai-coding-workflow`)

## 手順

1. 引数検証
   ```bash
   test -f articles/$1.md || { echo "記事が存在しません: articles/$1.md"; exit 1; }
   ```

2. main 同期 & ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b docs/review-$1
   ```

3. `article-reviewer` エージェントを起動し、以下を委譲:
   - `articles/$1.md` を読み、3ペルソナでレビュー
   - `reviews/zenn/$1.md` を生成（既存があれば上書き）
   - フォーマットは `.claude/agents/article-reviewer.md` 準拠

4. コミット
   ```bash
   git add reviews/zenn/$1.md
   git commit -m "docs(reviews): add 3-persona review for $1"
   ```

5. push & PR作成
   ```bash
   git push -u origin docs/review-$1
   gh pr create --title "docs(reviews): add review for $1" --body "3ペルソナでレビューを生成しました。\n\nTarget: articles/$1.md\nOutput: reviews/zenn/$1.md\n\nRef: Issue #11"
   ```

6. 結果報告（PR URL、指摘件数）

## ガードレール
- 既存 `reviews/zenn/$1.md` を上書きする場合は差分を提示して確認
- 記事本文 (`articles/$1.md`) は変更しない
- 自動マージ禁止
