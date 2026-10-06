---
name: zenn-book-writing
description: Zenn Bookの新規企画、構成設計、章責務分解、本文ドラフト、横断レビュー、公開前QAに使う。単発のZenn記事には使わず tech-blog-writing を使う。Bookを「記事の寄せ集め」ではなくReader JourneyとEvidence Boundaryを持つ長編成果物として設計する。
---

# zenn-book-writing

Zenn Bookを、章数の多い記事ではなく**Reader Journeyを持つ長編知識成果物**として設計・執筆・レビューするためのSkill。

## トリガー

- Zenn Bookを新しく作りたい
- 複数記事・複数章を1冊へ再構成したい
- Bookの章立て、Reader Journey、Central Claimを設計したい
- Book全体をレビューして重複や主張境界を改善したい
- Bookの公開前QAをしたい

単発記事なら `.claude/skills/tech-blog-writing/SKILL.md` を使う。

## 正本

最初に読む。

1. `AGENTS.md` — 公開・Git・媒体共通規約
2. `templates/zenn-book/README.md` — Book templateの利用方法
3. `templates/zenn-book/BOOK_PLAN.md` — Book Contract / Reader Journey / Chapter Contract
4. `scripts/check-zenn-book-structure.js` — deterministicなBook構造check
5. 必要に応じて `.claude/skills/tech-blog-writing/references/editorial-principles.md`

Book固有の詳細は次を読む。

- `references/book-contract.md`
- `references/review-loop.md`
- `references/publish-gate.md`

## Progressive Disclosure

- `SKILL.md`: trigger / source of truth / lifecycle / guardrails
- `references/book-contract.md`: Reader / Claim / Scope / Evidence / Source Baseline / chapter responsibility
- `references/review-loop.md`: 構成・Part本文・横断レビューの3-loop
- `references/publish-gate.md`: CI / source drift / Zenn preview / publish boundary

全部を最初からコンテキストへ載せない。現在のphaseに必要なreferenceだけ読む。

## Lifecycle

~~~text
IDEA
  ↓
BOOK_CONTRACT
  ↓
STRUCTURED
  ↓
DRAFTING
  ↓
BOOK_REVIEW
  ↓
PUBLISH_READY
  ↓
Human publish decision
~~~

このstate名は本Skill内の作業整理用。repositoryの正式Lifecycle stateを増やすものではない。

### IDEA → BOOK_CONTRACT

本文を書き始める前に最低限を固定する。

- Reader Problem
- Reader Transformation
- Central Claim
- Scope / Non-goals
- Existing Content Boundary
- Evidence Boundary
- Source Baseline（変動する主題の場合）

### BOOK_CONTRACT → STRUCTURED

- Reader Journeyを決める
- Part / chapterを「読者の問い」で並べる
- Chapter Responsibility Mapを作る
- 同じ責務を複数章へ持たせない
- 既存記事・既存BookのHowを無駄に再演しない

章数・Part数は固定しない。

### STRUCTURED → DRAFTING

Part単位で本文を作る。

標準Chapter Contract:

1. Reader Problem
2. Concrete Failure / Scenario
3. Concept
4. Implementation / Practice
5. Trade-off / Limitation
6. Takeaway
7. Bridge

これは責務contractであり、見出しテンプレートではない。

### DRAFTING → BOOK_REVIEW

Partごと、または大きなまとまりごとに `references/review-loop.md` を使う。

### BOOK_REVIEW → PUBLISH_READY

`references/publish-gate.md` と `docs/books/<slug>/PUBLISH_CHECKLIST.md` を使う。

## 新規Bookの初期化

新規Bookなら、可能ならtemplate generatorを使う。

~~~bash
npm run new:zenn-book -- <slug> \
  --title "Book title" \
  --summary "Book summary" \
  --topics "AI,開発手法"
~~~

生成後も `published: false` を維持する。

公開する章と `config.yaml` は `books/<slug>/`、`BOOK_PLAN.md` などの内部編集用ファイルは `docs/books/<slug>/` に置く。Zennは `config.yaml` の `chapters` に無い `.md` を「デプロイがスキップされました」と通知し続けるため、内部編集用ファイルを `books/<slug>/` に置かない。

generatorを使えない環境では `templates/zenn-book/` を参照して同等構成を作る。

## 既存Bookを改善する場合

最初に現在のBookを壊さず読む。

1. `config.yaml`
2. `docs/books/<slug>/BOOK_PLAN.md` があれば読む
3. introduction / part divider / afterword
4. 対象Part
5. source / QA artifact

「改善」の依頼では、勝手に別Bookへ再構成しない。

## レビュー観点

最低でも次の4視点を分離する。

- **Reader**: 初見で問いが連続するか
- **Editorial / IA**: 章責務・重複・順序
- **Technical / Source**: current source / evidence / claim boundary
- **Skeptical practitioner**: 抽象論・自己宣伝・過剰一般化になっていないか

必要なら5つ目としてVisual / Render Riskを追加する。

## Evidence / Claim Boundary

- 著者の一次経験を捏造しない
- repositoryや公式docsで確認できる事実はcurrent sourceを確認する
- current mainとlatest releaseを同一視しない
- 仮想walkthroughはObserved factと混同しない
- 「存在する」と「実際に効く」を同義にしない
- source driftがある主題は `docs/books/<slug>/SOURCE_MAP.md` を使う

## Book固有の編集原則

### Central Claimを1つにする

章ごとに面白い話を追加しても、Book全体の中心主張が増殖しないようにする。

### Progressive Disclosureを使う

前半で概念、後半で運用・例外・高度機能へ進む。後半章の説明を前半で全部先取りしない。

### Part dividerをnavigationにする

Part dividerはタイトルだけにしない。

- この部の問い
- 章の順序
- 読了後に何が分かるか

を短く示す。

### 長章はTOC密度もレビューする

本文量だけでなく、H2数、横長table、diagram幅、章内navigationを見る。

### Book固有の公開面を確認する

- `npm run check:zenn-book-browser -- --book <slug>` で任意Bookのrenderを検証できる
- mobileは全章、desktopは代表章を検証し、book slugごとに証跡を残す
- `release/zenn` 宛PRでは変更されたpublished:true BookがCIで自動抽出・browser検証される
- coverはgeneratorで自動生成せず、公開デザイン決定後に追加してPreviewする
- Bookから既存Zenn記事へリンクするときは、repositoryファイル相対パスではなく公開サイトで解決するURLを確認する
- 記事向け内部リンク規約をBookへ機械適用しない

## ガードレール

- Book作成を理由に `published: true` へ切り替えない
- userの当該PRへの明示指示なしにmergeしない
- publish操作を自動で行わない
- 既存公開Bookの意味を別Book作成のついでに変更しない
- source未確認のcurrent仕様を断定しない
- Book固有の運用知見を `AGENTS.md` へ重複コピーしない
- templateを `books/` 配下に置かない
- 構造check PASSだけでpublish-readyとしない

## 完了報告

最低限、次を返す。

- 対象Book / branch / PR
- Reader / Central Claimの状態
- どこまでdraft済みか
- review loopの結果
- source / CI / previewの状態
- remaining blocker
- `published` 状態
