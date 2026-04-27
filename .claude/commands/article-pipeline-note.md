---
description: 指定した note 記事に対してレビュー生成→反映を連続実行する（2PRに分割）
argument-hint: <state>/<slug> （例: published/n3aae6b5467b9、new/ai_agent_operations_opinion_note）
---

# /article-pipeline-note

指定した note 記事のレビュー生成と反映を連続実行する。Zenn 版 `/article-pipeline` の note 対応版。生成と反映で**2つの別PR**に分割し、レビュー側をマージしてから反映側を進めることで監査性を確保する。

## 引数
- `$1` = `<state>/<slug>` 形式（`<state>` は `new` / `drafts` / `published`）

## 手順

1. `/review-note-article $1` を実行
   - `reviews/note/$1.md` を生成
   - PR A (`docs/review-note-<slug>`) を作成
   - `$STATE` が `published` の場合、PR 本文に将来の反映時の ⚠️ バナーが必要である旨を明記

2. ユーザー確認待ち
   - PR A のレビューとマージはユーザーが判断
   - **このステップで自動続行しない**
   - メッセージ: "PR A をマージ後、`/apply-review-note $1` を実行してください。または `--auto-apply` フラグで連続実行可能（非推奨）"

3. (オプション) `--auto-apply` 指定時のみ、PR A マージ後に `/apply-review-note $1` を続行
   - デフォルトは手動ゲート
   - `published/` 配下は `--auto-apply` 指定時も追加確認を挟む

## なぜ分割するか
- レビュー成果物と本文修正は独立の意思決定
- レビュー内容の誤りがあれば反映前に修正できる
- PR単位で変更責任が追える
- `published/` は note 側の手動反映が必要で、機械的に進めるべきでない

## ガードレール
- 既定は手動ゲート（2PR分割、両方ユーザー承認）
- `--auto-apply` はユーザーのメッセージに含まれる場合のみ有効（正式な CLI フラグではなく、Claude がユーザー意図を読む運用）
- レビュー成果物のマージ前に本文を触らない
- `published/` 記事は自動マージ・自動反映を絶対に行わない
