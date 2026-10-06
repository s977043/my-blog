# River Review Zenn Book — Reader QA

> 内部編集用。Zennのchaptersには含めない。
>
> Review date: 2026-10-04

## Scope

01〜33章、Part 1〜7、付録A〜C、おわりにを通読し、次を確認した。

- 章間のhandoff
- 用語の一貫性
- 初見で意味が飛ぶ参照
- 重複説明
- 結論の弱い章
- mobileで横幅を使いやすいdecision table
- verification dateの一貫性

## Findings and actions

### 1. 11章のforward reference

11章に「Context EngineeringとIdentityの話につながる」とあったが、本BookにIdentity章は存在しない。

**対応:** IdentityをReview Coverageへ変更。実際のReader Journeyと一致させた。

### 2. verification date drift

はじめに・付録Cは2026-10-04再確認済みだが、20 / 22 / 24章には2026-10-03表記が残っていた。

**対応:** 「2026年10月4日に再確認したverification snapshot」へ統一。

### 3. mobile decision tables

29章と32章は3列のdecision tableに文章量が多く、mobileで横スクロールが増えやすかった。

**対応:** 29章のSkill選定4軸、32章のAutomatic / Ask / Escalate / Human ApprovalとField / Hill / Cliffを縦方向の判断ブロックへ変更。

短い比較目的の2列表や、13 / 21 / 付録Cの簡潔な3列表は維持した。

## Reader Journey result

~~~text
Why
  ↓
What River Review is
  ↓
Design judgment
  ↓
Practice
  ↓
Review reliability
  ↓
Learning / improvement
  ↓
Adoption
  ↓
Afterword
~~~

各Part末から次Partへのhandoffを確認済み。

本編最終章33は「運用としての改善loop」を閉じ、99_afterwordは「Review Judgment as Codeとして何を持ち帰るか」に役割を分けている。

## Final reader assessment

### PASS

- 同じ概念の説明が前半=原則、後半=運用へ分離されている
- Skill / Artifact / Evidence / Judgment Placement / Human Judgmentの学習順が自然
- locale walkthroughが第3〜4部の具体例として機能している
- Reliability → Improvement → Adoptionの後半が機能カタログではなく運用設計としてつながる
- 「AIにレビューさせる」より「判断をどこへ置くか」という主張が全体で一貫している

### Remaining visual-only checks

Reader QAでは次を判定しない。

- Zenn renderer上での実ピクセル表示
- mobile viewportでの表・code block・text diagramの見た目
- font / line-wrap / horizontal scrollの実挙動

これらはpreview visual reviewの責務として残す。


## Browser visual review

GitHub Actions上でZenn Previewを起動し、Playwright Core + Chromeで実レンダリングを確認した。

### Automated browser evidence

- Zenn Preview APIから45章すべてのrendered `bodyHtml` を取得
- Zenn Preview stylesheet + `.znc` で本文を再描画
- mobile: 390×844 / 45章すべて
- desktop: 1440×1000 / 代表7章
- content overflow: 0
- broken images: 0
- uncontained table / pre / code / svg: 0
- 日本語font: `fonts-noto-cjk` を導入して再確認

### Human screenshot review

代表章として、00 / 06 / 13 / 21 / 29 / 32 / 付録Cをmobile / desktopで目視した。

確認結果:

- 13章のCliff / Hill / Field 3列表は390pxでも判読可能
- 21章のReviewer / Verifier表は390pxでも横切れなし
- 29 / 32章のdecision table縦化はmobileで有効
- code blockは本文領域内に収まる
- 見出し・本文・Sourcesのspacingにblockingな崩れなし
- desktop本文幅・余白にblockingな崩れなし

### Actual Book top

Zenn CLI公式route `/books/river-review-guide` をdesktopで実表示した。

- title: PASS
- summary: PASS
- topics 5件: PASS
- included chapters: 45 / 45
- excluded internal Markdown: 7（Zenn deploy対象外として別表示）

ただし、BookHeaderにcover validation warningを確認した。

> 本のカバー画像（cover.pngもしくはcover.jpg）を `/books/river-review-guide` に配置してください

したがって本文visualはPASSだが、Release Readyではない。


## Cover visual review

2026-10-04、最終Book coverをZenn Previewのactual Book topで確認した。

- asset: `books/river-review-guide/cover.png`
- source size: 500×700
- browser natural size: 500×700
- Zenn BookHeader validation error: 0
- cover missing warning: 解消
- River Review brand color / river motif: 既存social previewと整合
- 日本語title: clippingなし
- Bookトップ上の縮小表示: 主titleを識別可能

初稿では日本語title 1行目が右端でclipしたため不採用。3行構成へ変更したv2を採用した。
