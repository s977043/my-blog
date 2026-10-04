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

Browser preview（初回はCIと同じ一時依存を入れ、`npm run preview` を別terminalで起動）:

~~~bash
npm install --no-save --package-lock=false --ignore-scripts playwright-core@1.63.0
CHROME_PATH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
ZENN_PREVIEW_URL="http://127.0.0.1:8000" \
npm run check:zenn-book-browser -- --book {{BOOK_SLUG}}
~~~

- mobile 390pxでは全章を検査する
- desktopは章全体から最大7章を均等抽出して検査・screenshot保存する
- 証跡は `artifacts/zenn-book-browser/{{BOOK_SLUG}}/` に保存する

repository全体:

~~~bash
npm run check
~~~

公開前は `PUBLISH_CHECKLIST.md` を使う。

### Cover

generatorはcover imageを自動生成しない。Bookの公開デザインを決めた段階で `cover.png` または `cover.jpg` を追加し、Zenn Previewで検証する。

### BookからZenn記事へのリンク

Book chapterから `articles/*.md` のrepository相対パスを直接リンクしない。公開サイトで解決するZenn URLを使い、Previewまたは公開URLで確認する。記事同士の内部リンク規約とは別の境界として扱う。

## 重要

- `BOOK_PLAN.md`, `SOURCE_MAP.md`, `EDITORIAL_QA.md`, `PUBLISH_CHECKLIST.md` は内部編集用。必要なものだけ残してよい
- 内部編集用ファイルを `config.yaml` の `chapters` に追加しない
- 公開判断までは `published: false` を維持する
- merge / publishは人間の明示判断を必要とする
