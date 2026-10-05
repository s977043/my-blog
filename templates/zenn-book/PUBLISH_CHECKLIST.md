# {{BOOK_TITLE}} — Publish Checklist

> Internal editorial artifact. Zenn chaptersには含めない。
> 未実行の確認へチェックを付けない。

## 1. Content / structure

- [ ] `config.yaml` のchapter fileがすべて存在する
- [ ] duplicate chapterがない
- [ ] Reader Journeyが成立している
- [ ] Chapter Responsibility Mapと本文が一致している
- [ ] 既存記事・既存Bookとの責務重複がない

## 2. Claim / source verification

Verification date:

- [ ] current source / current mainを再確認
- [ ] latest releaseを再確認
- [ ] releaseとcurrent mainの差を確認
- [ ] 主要章が一次情報または再現可能なEvidenceへtraceできる
- [ ] `SOURCE_MAP.md` のreverse impactを確認

## 3. Editorial review

- [ ] 全公開章でH1が1つ
- [ ] code fence不整合がない
- [ ] 未執筆placeholderがない
- [ ] 用語ゆれ・略号初出を確認
- [ ] 長章・table・diagramのrender riskを確認
- [ ] `EDITORIAL_QA.md` を更新

## 4. Repository checks

~~~bash
node scripts/check-zenn-book-structure.js books/{{BOOK_SLUG}}
npm run check:zenn-books
npm run list:books
npm run check
~~~

- [ ] 対象Book structure check PASS
- [ ] `npm run check:zenn-books` PASS
- [ ] `npm run list:books` で認識
- [ ] `npm run check` PASS
- [ ] internal link / title / markdown hygieneにblocking failureなし
- [ ] Bookから既存Zenn記事へリンクする場合、公開サイトで解決するURLになっている（repositoryファイル相対パスを使っていない）

## 5. Zenn preview

~~~bash
npm install --no-save --package-lock=false --ignore-scripts playwright-core@1.63.0
npm run preview
# 別terminal:
CHROME_PATH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
ZENN_PREVIEW_URL="http://127.0.0.1:8000" \
npm run check:zenn-book-browser -- --book {{BOOK_SLUG}}
~~~

- [ ] Browser checker PASS
- [ ] `artifacts/zenn-book-browser/{{BOOK_SLUG}}/report.json` とscreenshotを確認
- [ ] `release/zenn` PRではCIの `changed-zenn-book-browser-evidence` artifactも確認
- [ ] Book topのtitle / summary / topicsを確認
- [ ] cover imageを追加する場合は `cover.png` / `cover.jpg` を配置し、preview warningがない
- [ ] chapter順を確認
- [ ] mobile幅でtable / code block / diagramを確認
- [ ] external source linkをspot check
- [ ] navigationを通し確認

## 6. Publish decision

- [ ] `published: false` の変更前にpreview結果を確認
- [ ] 公開対象branch / rate-limit policyを確認
- [ ] Humanがpublishを明示判断

## Release boundary

このチェックリストにblocking未完了項目がある状態は、本文ドラフト完成であって公開準備完了ではない。
