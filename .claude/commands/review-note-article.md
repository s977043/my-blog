---
description: note.com記事を3ペルソナでレビューし、reviews/note/<state>/<slug>.md を生成してPRを作成する
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、drafts/n17c899de2a4e、new/ai_agent_operations_opinion_note）
---

# /review-note-article

指定した note.com 記事を3ペルソナ視点でレビューし、`reviews/note/<state>/<slug>.md` を生成してPRを作成する。

## 引数
- `$1` = `<state>/<slug>` 形式（`<state>` は `new` / `drafts` / `published`）
  - 例: `published/n3aae6b5467b9`
  - 例: `drafts/n17c899de2a4e`
  - 例: `new/ai_agent_operations_opinion_note`

## 手順

1. 引数検証 & 重複 PR 確認
   ```bash
   test -f articles_note/$1.md || { echo "記事が存在しません: articles_note/$1.md"; exit 1; }
   STATE=$(dirname $1)   # new | drafts | published
   SLUG=$(basename $1)
   case "$STATE" in new|drafts|published) ;; *) echo "state は new|drafts|published のいずれか: $STATE"; exit 1;; esac
   # 並列セッション衝突回避: 対象 slug の既存 open PR があれば停止して報告
   gh pr list --state open --search "review-note-$SLUG in:title" --json number,title
   ```
   既存 PR があれば作成せず報告して終了。

2. main 同期 & ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b docs/review-note-$SLUG
   git branch --show-current   # 期待ブランチ docs/review-note-$SLUG と一致するか確認
   ```
   不一致なら **commit を作らず停止**（並列セッション干渉。memory/ はリポジトリ外の個人領域）。

3. 出力先ディレクトリ準備
   ```bash
   mkdir -p reviews/note/$STATE
   ```

4. `note-article-reviewer` エージェントを起動し、以下を委譲:
   - `articles_note/$1.md` を読み、記事タイプを判定
   - `articles_note/checklists/note-article-quality-checklist.md` を参照し、まず「必須確認」を見たうえで、テーマ設計・サムネ/タイトル設計・本文構成・読者体験を確認
   - 3ペルソナ（noteディレクター/note編集者/想定読者）でレビュー
   - `reviews/note/$1.md` を生成（既存があれば差分提示後に上書き）
   - フォーマットは `.claude/agents/note-article-reviewer.md` 準拠
   - JTFスタイル違反（ダッシュ等）は個別指摘として必ず含める
   - **`published/` の記事をレビューする場合**、PR本文に ⚠️ バナー（将来の本文反映時の注意喚起）を含める

5. コミット
   ```bash
   git add reviews/note/$1.md
   git commit -m "docs(reviews): add 3-persona note review for $1"
   ```

6. push & PR作成
   ```bash
   # push/PR 直前に active account を確認（s977043 でなければ switch）
   gh auth status | grep -q "Active account: true" && gh auth status | grep "s977043" || gh auth switch --user s977043
   git push -u origin docs/review-note-$SLUG
   gh pr create --title "docs(reviews): add note review for $1" --body "note.com記事の3ペルソナレビューを生成しました。

   Target: articles_note/$1.md
   Output: reviews/note/$1.md
   State: $STATE

   記事タイプ判定・JTFスタイル・note内発見性・スマホ可読性を重点観点としてレビューしています。"
   ```

7. 結果報告（PR URL、記事タイプ判定、指摘件数、state）

## ガードレール
- 既存 `reviews/note/$1.md` を上書きする場合は差分を提示して確認
- 記事本文 (`articles_note/$1.md`) は変更しない
- 自動マージ禁止
- 記事タイプ判定結果を結果報告に明記
- `published/` 配下の記事レビューは、将来の本文反映時に ⚠️ バナーが必要となることをPR本文に明記
