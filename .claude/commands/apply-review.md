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
   git branch --show-current   # Round 5 対策: 期待ブランチ chore/apply-review-$1 と一致するか確認
   ```
   不一致なら **commit を作らず停止**（並列セッション干渉、`memory/project_parallel_session_metrics.md` Round 5 参照）。

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
- `gh` active account = **s977043** を確認してから push / PR 作成（kominem-unilabo だと `must be a collaborator` エラー）

## Zenn 公開フロー上の位置づけ（2026-05-07 以降）

本コマンドが作る PR は **`main` ブランチへのマージ**で完結する。Zenn deploy は発火しない（PR #199 で `release/zenn` ブランチ運用に切替済）。

`published: true` 記事の修正反映 PR が main にマージされた後、**Zenn 上に反映するには別途 `release/zenn` ブランチへの merge が必要**。連続実行時は rate-limit (24h/5本) に注意し、release/zenn への merge は 24h あけて 1 PR 最大 3 本までに分散すること。

詳細:
- `AGENTS.md` §「Zenn 公開フロー（release/zenn ブランチ経由）」
- `docs/zenn-release-rollout-plan.md`
- `memory/feedback_zenn_publish_rate_pacing.md`
- `memory/reference_zenn_rate_limit_spec.md`
