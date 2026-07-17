---
description: 日本語の記事を変更せず、AI特有の定型表現・単調な文体・予定調和の構成をreview-onlyで検出する
argument-hint: <article-path>
---

# /humanize-review

指定した記事を `article-humanizer-ja` Skillでレビューする。**記事本文は変更しない。**

## 引数

- `$1` = リポジトリルートからのMarkdownパス
  - Zenn: `articles/<slug>.md`
  - note: `articles_note/new/<slug>.md` または `articles_note/published/<slug>.md`
  - Qiita: `Qiita/public/<slug>.md`

## 手順

1. `AGENTS.md` を読む
2. `.claude/skills/article-humanizer-ja/SKILL.md` を読む
3. `$1` が許可された記事パスで、実在するMarkdownファイルか確認する
4. 記事の主張・強調点・文体・章構造を抽出する
5. 保護領域を除外して、3層のパターンを走査する
6. Skillの出力スキーマで結果を返す
7. 記事本文・レビュー成果物・設定ファイルを変更していないことを確認する

## 必須ルール

- `Read` / `Grep` / `Glob` 以外を使わない
- `Edit` / `Write` / Bash / git 操作を行わない
- 指摘ゼロを許容し、問題を捏造しない
- 具体性不足は、実在しない例を補わず `requiresAuthorInput: true` で返す
- コード、URL、引用、数値、日付、バージョン、公式用語を変更対象にしない
- `articles_note/drafts/` は正本ではないことを結果に明記する

## 出力

JSONコードブロックで次を返す。

- `findings`
- `passed`
- `summary`

その後に、`low / medium / high` の件数と、著者確認が必要な項目だけを短く要約する。
