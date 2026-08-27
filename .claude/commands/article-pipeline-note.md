---
description: 指定した note 記事に対してレビュー生成→必要なら反映を実行する。new/published は2PR、drafts はレビューのみ
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、drafts/n17c899de2a4e、new/ai_agent_operations_opinion_note）
---

# /article-pipeline-note

指定した note 記事のレビュー生成と反映を扱う。Zenn版 `/article-pipeline` の note 対応版。

- `new/` / `published/`: レビューPRと反映PRを分ける
- `drafts/`: 読み取り専用ミラーなので**レビューPRのみ**。本文反映へ進まない

## 引数

- `$1` = `<state>/<slug>` 形式（`new` / `drafts` / `published`）

## 手順

### 1. stateを確認する

`$1` から `STATE` を判定する。

- `new`: レビュー → Human Gate → 反映候補
- `published`: レビュー → Human Gate → 反映候補。ただしnote側への手動反映が必要
- `drafts`: レビューのみ。**反映は常に禁止**

### 2. `/review-note-article $1` を実行

- `reviews/note/$1.md` を生成
- PR A (`docs/review-note-<slug>`) を作成
- `published` の場合、将来の反映時に ⚠️ 公開済み記事バナーとnote管理画面への手動反映が必要であることを明記

### 3. `drafts` なら終了

レビューPRを作成した時点でパイプラインを終了する。

```text
articles_note/drafts/ はnoteエクスポートから再生成される読み取り専用ミラーです。
レビューは完了しましたが、本文反映は行いません。
対応する articles_note/new/ の編集正本があればそちらを対象にし、なければnote管理画面で修正してください。
```

**`--auto-apply` が指定されていても `drafts` では無視し、反映しない。**

### 4. `new` / `published` はHuman Gate

PR A のレビューとマージはユーザーが判断する。デフォルトでは自動続行しない。

案内:

```text
PR A をマージ後、/apply-review-note <state>/<slug> を実行してください。
--auto-apply は明示指定時のみ利用できます。
```

### 5. `--auto-apply` 指定時

`new` / `published` のみ、PR Aがマージされたことを確認してから `/apply-review-note $1` を続行できる。

- `published` は `--auto-apply` 指定時も、公開済み記事の修正であることを追加確認する
- マージは自動化しない
- note側への反映は自動化しない

## なぜ分割するか

- レビュー成果物と本文修正は独立した意思決定
- レビュー内容の誤りを反映前に止められる
- PR単位で変更責任が追える
- `published` はnote側の手動反映が必要
- `drafts` は再生成ミラーなので、ローカル修正を資産として扱えない

## ガードレール

- 既定は手動ゲート
- **`drafts/` はレビューのみ。`--auto-apply` を含め、本文反映へ進まない**
- `--auto-apply` はユーザーが明示した場合のみ有効
- レビュー成果物のマージ前に本文を触らない
- `published` は自動マージ・note側自動反映をしない
- 状態管理の正本は `articles_note/README.md` と `.claude/skills/note-article-review/SKILL.md`