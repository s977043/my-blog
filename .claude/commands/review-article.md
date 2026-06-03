---
description: 指定した記事を3ペルソナでレビューし、reviews/zenn/<slug>.md を生成してPRを作成する
argument-hint: <article-slug> (articles/ 配下のファイル名 .md 抜き)
---

# /review-article

指定した記事を3ペルソナ視点でレビューし、`reviews/zenn/<slug>.md` を生成してPRを作成する。

## 引数
- `$1` = 記事の slug (例: `plangate-ai-coding-workflow`)

## 手順

1. 引数検証 & 重複 PR 確認
   ```bash
   test -f articles/$1.md || { echo "記事が存在しません: articles/$1.md"; exit 1; }
   # 並列セッション衝突回避: 対象 slug の既存 open PR があれば停止して報告
   gh pr list --state open --search "review-$1 in:title" --json number,title
   ```
   既存 PR があれば作成せず報告して終了。

2. main 同期 & ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b docs/review-$1
   git branch --show-current   # 期待ブランチ docs/review-$1 と一致するか確認
   ```
   不一致なら **commit を作らず停止**（並列セッション干渉、`memory/project_parallel_session_metrics.md` Round 5 参照。memory/ はリポジトリ外の個人領域）。

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
   # push/PR 直前に active account を確認（s977043 でなければ switch）
   gh auth status | grep -q "Active account: true" && gh auth status | grep "s977043" || gh auth switch --user s977043
   git push -u origin docs/review-$1
   gh pr create --title "docs(reviews): add review for $1" --body "$(printf '3ペルソナでレビューを生成しました。\n\nTarget: articles/%s.md\nOutput: reviews/zenn/%s.md\n\nRef: Issue #11' "$1" "$1")"
   ```

6. 結果報告（PR URL、指摘件数）

## ガードレール
- 既存 `reviews/zenn/$1.md` を上書きする場合は差分を提示して確認
- 記事本文 (`articles/$1.md`) は変更しない
- 自動マージ禁止
