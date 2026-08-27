---
description: reviews/zenn/<slug>.md の指摘を articles/<slug>.md に選別反映してPRを作成する
argument-hint: <article-slug> (reviews/zenn/ 配下のファイル名 .md 抜き)
---

# /apply-review

指定した記事のレビュー指摘を、採用 / 保留 / 却下の分類付きで本文に反映する。

## 引数

- `$1` = 記事の slug (例: `plangate-ai-coding-workflow`)

## 手順

### 1. 引数検証

```bash
test -f reviews/zenn/$1.md || { echo "レビューが存在しません: reviews/zenn/$1.md"; exit 1; }
test -f articles/$1.md || { echo "記事が存在しません: articles/$1.md"; exit 1; }
```

### 2. 重複PR確認

```bash
# 並列セッション衝突回避: 同じ反映ブランチを head に持つ open PR があれば停止
OPEN=$(gh pr list --state open --head "chore/apply-review-$1" --json number,title,headRefName)
```

既存PRがあれば作成せず報告して終了。

### 3. main同期 + ブランチ作成

```bash
git checkout main && git pull origin main
git checkout -b chore/apply-review-$1
git branch --show-current
```

期待ブランチ `chore/apply-review-$1` と不一致なら **Edit / commitせず停止**する。

### 4. `review-applier` を起動

- 入力: `reviews/zenn/$1.md`, `articles/$1.md`
- `.claude/skills/article-review-apply/SKILL.md` を遵守
- `docs/article-guides/zenn-structure-best-practices.md` と `article-reviewer` の現行契約を前提にする
- 採用 / 保留 / 却下を分類し、採用分だけ最小差分でEdit
- PR本文用の採否一覧を返す

### 5. 採用件数で分岐

#### 0件

- PRは作らない
- 保留 / 却下の一覧を報告して終了

#### 1件以上

push / PR前に実際のGitHub active loginを確認する。

```bash
test "$(gh api user --jq .login)" = "s977043" || gh auth switch --hostname github.com --user s977043
test "$(gh api user --jq .login)" = "s977043" || { echo "GitHub active account を s977043 に切り替えられませんでした"; exit 1; }
```

その後 `chore/apply-review-$1` をpushしてPRを作る。**マージはしない**。

PR本文にはエージェント生成の採否一覧を含め、`published: true` の記事には冒頭に ⚠️ 公開済み記事バナーを付ける。

### 6. 結果報告

- PR URL
- 採用 / 保留 / 却下件数
- 保留項目で著者判断が必要なもの

## ガードレール

- 記事本文以外のファイルを変更しない
- `reviews/zenn/**` は記録として変更しない
- Front Matter の `published` を勝手に変更しない
- 自動マージ禁止
- 採用0件ならPRを作らない
- URL検証失敗をリンク切れと断定しない
- GitHub active accountは `gh api user` で実値を確認する

## Zenn 公開フロー上の位置づけ（2026-05-07 以降）

本コマンドが作るPRは **`main` ブランチへのマージ**で完結する。Zenn deploy は発火しない（PR #199 で `release/zenn` ブランチ運用に切替済）。

`published: true` 記事の修正反映PRがmainにマージされた後、Zenn上に反映するには別途 `release/zenn` ブランチへのmergeが必要。連続実行時は `npm run check:zenn-pace` と既存の公開ペーシングルールに従う。

詳細:

- `AGENTS.md` §「Zenn 公開フロー（release/zenn ブランチ経由）」
- `docs/zenn-release-rollout-plan.md`
- `memory/feedback_zenn_publish_rate_pacing.md`
- `memory/reference_zenn_rate_limit_spec.md`