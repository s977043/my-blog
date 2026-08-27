---
description: reviews/note/<state>/<slug>.md の指摘を note の編集可能な原稿へ選別反映してPRを作成する。drafts は読み取り専用のため反映しない
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、new/ai_agent_operations_opinion_note）
---

# /apply-review-note

指定した note 記事のレビュー指摘を、採用 / 保留 / 却下の分類付きで本文へ反映する。Zenn版 `/apply-review` の note 対応版。

## 引数

- `$1` = `<state>/<slug>` 形式
- 反映可能な `<state>` は `new` / `published`
- `drafts` はレビュー生成対象にはできるが、**読み取り専用ミラーなので本コマンドでは反映しない**

## 手順

### 1. 引数・state検証

```bash
test -f reviews/note/$1.md || { echo "レビューが存在しません: reviews/note/$1.md"; exit 1; }
test -f articles_note/$1.md || { echo "記事が存在しません: articles_note/$1.md"; exit 1; }
STATE=$(dirname $1)
SLUG=$(basename $1)
case "$STATE" in new|drafts|published) ;; *) echo "state は new|drafts|published のいずれか: $STATE"; exit 1;; esac

if [ "$STATE" = "drafts" ]; then
  echo "articles_note/drafts/ はエクスポート再生成される読み取り専用ミラーです。本文には反映しません。"
  echo "対応する articles_note/new/ の編集正本があればそちらを対象にし、なければ note 管理画面で修正してください。"
  exit 0
fi
```

`drafts` はこの時点で正常終了し、ブランチ作成・Edit・commit・push・PR作成を行わない。

### 2. 重複PR確認

```bash
# 並列セッション衝突回避: 同じ反映ブランチを head に持つ open PR があれば停止
OPEN=$(gh pr list --state open --head "chore/apply-review-note-$SLUG" --json number,title,headRefName)
```

既存PRがあれば作成せず報告して終了。

### 3. main同期 & ブランチ作成

```bash
git checkout main && git pull origin main
git checkout -b chore/apply-review-note-$SLUG
git branch --show-current
```

期待ブランチ `chore/apply-review-note-$SLUG` と不一致なら **Edit / commitせず停止**する。

### 4. 直近反映履歴の確認

```bash
git log -p --since='48 hours ago' -- "articles_note/$1.md" | head -80
git log --oneline --since='48 hours ago' -- "articles_note/$1.md"
```

直近変更でレビュー指摘が既に解消されていないか確認する。

### 5. `note-review-applier` を起動

note専用 `.claude/agents/note-review-applier.md` を使う。Zenn版 `review-applier` は使わない。

入力:

- `reviews/note/$1.md`
- `articles_note/$1.md`

`.claude/skills/note-article-review/SKILL.md` の**反映フェーズ**と `articles_note/README.md` の状態管理に従う。

- 採用 / 保留 / 却下を分類する
- 採用分だけ最小差分で Edit
- JTFスタイル違反は文意を変えない範囲で採用候補
- Zenn固有観点（Front Matter、`:::message`、`:::details`）の誤混入は却下
- PR本文用の採否一覧を返す

ハーネス未リロードで `note-review-applier` が見つからない場合は、`general-purpose` エージェントに `.claude/agents/note-review-applier.md` をReadさせ、同じ制約でインライン委譲する。

### 6. 採用件数で分岐

#### 0件

- 記事変更・PR作成を行わない
- 保留 / 却下の一覧を報告する

#### 1件以上

push / PR前に実際のGitHub active loginを確認する。

```bash
test "$(gh api user --jq .login)" = "s977043" || gh auth switch --hostname github.com --user s977043
test "$(gh api user --jq .login)" = "s977043" || { echo "GitHub active account を s977043 に切り替えられませんでした"; exit 1; }
```

その後、`chore/apply-review-note-$SLUG` をpushしPRを作る。**マージはしない**。

`published` の場合、PR本文冒頭に必ず次を含める。

```markdown
> ⚠️ **公開済み記事** (`articles_note/published/`)
> 本PRは既にnote.com上で公開されている記事への修正提案を含みます。
> note はインポートで既存記事を上書き更新できないため、マージ後はnote管理画面で手動反映が必要です。
```

### 7. 結果報告

- PR URL（作成した場合）
- 採用 / 保留 / 却下件数
- `published` の場合はnote管理画面への手動反映が必要なこと

## ガードレール

- **`articles_note/drafts/**` は絶対に変更しない**
- 記事本文以外のファイルを変更しない
- レビュー成果物 (`reviews/note/**/*.md`) は変更しない
- `published/` の反映PRには ⚠️ バナー必須
- 自動マージ禁止
- 全指摘が採用0件ならPRを作らない
- URL検証失敗をリンク切れと断定しない
- GitHub active accountは `gh api user` で実値を確認する