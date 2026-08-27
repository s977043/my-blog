---
description: note.com記事を3ペルソナでレビューし、reviews/note/<state>/<slug>.md を生成してPRを作成する
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、drafts/n17c899de2a4e、new/ai_agent_operations_opinion_note）
---

# /review-note-article

指定した note.com 記事を3ペルソナ視点でレビューし、`reviews/note/<state>/<slug>.md` を生成してPRを作成する。レビュー生成では記事本文を変更しない。

## 引数

- `$1` = `<state>/<slug>` 形式（`new` / `drafts` / `published`）

## 手順

### 1. 引数検証 & 重複PR確認

```bash
test -f articles_note/$1.md || { echo "記事が存在しません: articles_note/$1.md"; exit 1; }
STATE=$(dirname $1)
SLUG=$(basename $1)
case "$STATE" in new|drafts|published) ;; *) echo "state は new|drafts|published のいずれか: $STATE"; exit 1;; esac

gh pr list --state open --head "docs/review-note-$SLUG" --json number,title,headRefName
```

同じレビュー用ブランチをheadに持つopen PRがあれば作成せず報告して終了。

### 2. main同期 & ブランチ作成

```bash
git checkout main && git pull origin main
git checkout -b docs/review-note-$SLUG
git branch --show-current
```

期待ブランチ `docs/review-note-$SLUG` と不一致なら **commitを作らず停止**する。

### 3. 出力先準備

```bash
mkdir -p reviews/note/$STATE
```

### 4. `note-article-reviewer` に委譲

- `articles_note/$1.md` を読み、記事タイプを判定する
- `articles_note/guides/note-structure-best-practices.md` を必ず読む
- `articles_note/checklists/note-article-quality-checklist.md` を参照する
- 価値の先出し、見出し、具体性、実際に存在する気づき/限界、読後価値、スマホ可読性を記事タイプに応じて確認する
- 3ペルソナ（noteディレクター / note編集者 / 想定読者）でレビューする
- `reviews/note/$1.md` を生成する
- JTFスタイル違反は同種を統合する
- 固定テンプレートとして構成を強制しない
- 問題がなければ指摘0件を許容する

状態の意味もレビュー成果物へ反映する。

- `new`: 編集正本
- `drafts`: 読み取り専用ミラー。レビューのみで、後続の本文反映は禁止
- `published`: 公開済み。後続の本文修正はnote管理画面への手動反映が必要

### 5. コミット

```bash
git add reviews/note/$1.md
git commit -m "docs(reviews): add 3-persona note review for $1"
```

### 6. push & PR作成

```bash
test "$(gh api user --jq .login)" = "s977043" || gh auth switch --hostname github.com --user s977043
test "$(gh api user --jq .login)" = "s977043" || { echo "GitHub active account を s977043 に切り替えられませんでした"; exit 1; }

git push -u origin docs/review-note-$SLUG

STATE_NOTICE=""
if [ "$STATE" = "published" ]; then
  STATE_NOTICE=$'\n\n> ⚠️ **公開済み記事のレビュー**\n> 本PRはレビュー成果物のみを追加します。将来本文へ反映する場合、note管理画面での手動反映が必要です。'
elif [ "$STATE" = "drafts" ]; then
  STATE_NOTICE=$'\n\n> ℹ️ **drafts は読み取り専用ミラー**\n> レビューは可能ですが、`articles_note/drafts/` の本文には反映しません。対応する `new/` 正本またはnote管理画面で修正します。'
fi

gh pr create \
  --title "docs(reviews): add note review for $1" \
  --body "$(printf 'note.com記事の3ペルソナレビューを生成しました。\n\nTarget: articles_note/%s.md\nOutput: reviews/note/%s.md\nState: %s\n\nnote構成ガイド・記事タイプ・JTFスタイル・note内発見性・スマホ可読性を重点観点としてレビューしています。%s' "$1" "$1" "$STATE" "$STATE_NOTICE")"
```

### 7. 結果報告

- PR URL
- 記事タイプ判定
- 指摘件数
- state
- `drafts` は反映禁止、`published` は手動反映が必要という追加注意

## ガードレール

- 既存 `reviews/note/$1.md` を上書きする場合は差分を提示して確認
- 記事本文 (`articles_note/$1.md`) は変更しない
- `drafts/` をレビューした後に本文反映を自動続行しない
- 自動マージ禁止
- GitHub active accountは `gh api user` で確認する
- 構成ガイドを固定テンプレートとして強制しない