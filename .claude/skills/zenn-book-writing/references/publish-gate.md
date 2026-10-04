# Publish Gate

> Entrypoint: `.claude/skills/zenn-book-writing/SKILL.md`

Draft完成とPublish Readyを分ける。

## Gate 1 — Structure

- config chapterと実ファイルが一致
- duplicateがない
- H1が各1つ
- fenceが閉じる
- unresolved placeholderがない

~~~bash
node scripts/check-zenn-book-structure.js books/<slug>
~~~

## Gate 2 — Source freshness

currentな主題なら、公開直前に再確認する。

- current main
- latest release
- official docs
- source drift
- chapter impact

`SOURCE_MAP.md` があればreverse impactを使う。

## Gate 3 — Editorial

- Central Claim維持
- Reader Journey
- de-dup
- terminology
- claim boundary
- concrete evidence
- trade-off / non-goal

## Gate 4 — Repository

~~~bash
npm run check:zenn-books
npm run list:books
npm run check
~~~

実行していないcheckをPASS扱いにしない。

## Gate 5 — Preview

`npm run preview` と汎用browser checkerを使う。

~~~bash
CHROME_PATH="$(command -v google-chrome || command -v chromium || command -v chromium-browser)" \
ZENN_PREVIEW_URL="http://127.0.0.1:8000" \
npm run check:zenn-book-browser -- --book <slug>
~~~

browser checkerはmobile 390pxで全章、desktopで最大7章を均等抽出して検査し、`artifacts/zenn-book-browser/<slug>/` へreport / screenshotを残す。

少なくとも次を確認する。

- Book top
- chapter order
- mobile table
- code block / text diagram
- Part divider
- external link spot check
- Book → Zenn article linkが公開URLで解決すること
- cover image / cover warning
- navigation

browser verificationが実行できない場合は `UNVERIFIED` とし、静的QAで代替したことを明示する。

## Gate 6 — Publish Authority

- `published: false` はHuman publish decisionまで維持
- Zennのrelease branch / publish pace policyを確認
- mergeとpublishを同じAuthorityにしない
- userの過去の「進めて」を別PRのmerge承認へ持ち越さない

## Verdict

- **READY**: blocking Gateがすべて確認済み
- **NEEDS_CHANGES**: 修正可能なblocking issueあり
- **UNVERIFIED**: 必要なpreview/source/CIをこの環境で確認できない

Static QA PASSだけでREADYにしない。
