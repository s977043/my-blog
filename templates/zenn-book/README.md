# {{BOOK_TITLE}}

このディレクトリは `npm run new:zenn-book` で生成したZenn Bookの作業領域です。

## 最初にやること

1. `BOOK_PLAN.md` の Reader Problem / Central Claim / Scope / Evidence Boundary を埋める
2. `config.yaml` の章順をReader Journeyに合わせて更新する
3. 章を増やす場合は、1章1責務になるようにファイルを追加する
4. 本文執筆前に構成レビューを行う
5. `published: false` のままPRへ出す

## 推奨フロー

~~~text
Book Contract
  ↓
Reader Journey
  ↓
Chapter Responsibility Map
  ↓
Structure Review
  ↓
Draft by Part
  ↓
Cross-book / Claim / Source Review
  ↓
Publish Checklist
  ↓
Human publish decision
~~~

## 生成前の確認

~~~bash
npm run new:zenn-book -- sample-book \
  --title "Sample Book" \
  --summary "Summary" \
  --topics "AI,開発" \
  --dry-run
~~~

`--dry-run` は作成予定ファイルだけを表示し、書き込みを行わない。

## 検証

構造チェック:

~~~bash
node scripts/check-zenn-book-structure.js books/{{BOOK_SLUG}}
~~~

Book全体:

~~~bash
npm run check:zenn-books
~~~

repository全体:

~~~bash
npm run check
~~~

公開前は `PUBLISH_CHECKLIST.md` を使う。

## 重要

- `BOOK_PLAN.md`, `SOURCE_MAP.md`, `EDITORIAL_QA.md`, `PUBLISH_CHECKLIST.md` は内部編集用。必要なものだけ残してよい
- 内部編集用ファイルを `config.yaml` の `chapters` に追加しない
- 公開判断までは `published: false` を維持する
- merge / publishは人間の明示判断を必要とする
