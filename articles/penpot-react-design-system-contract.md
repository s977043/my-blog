---
title: "PenpotとReactを同じ契約で運用するデザインシステムの作り方"
emoji: "🎛️"
type: "tech"
topics: ["designsystem", "penpot", "ai", "frontend", "ai駆動開発"]
published: true
---

:::message
この記事は、Growth Lab の `docs/design-system/operation-guide.md` をもとに、Penpot と React 実装を同じ契約で運用するための考え方を Zenn 向けに整理したものです。

想定読者は、デザインツールと React 実装のズレを減らしたいフロントエンドエンジニア、または AI に UI 実装を任せる前提でデザインシステムを整えたい人です。
:::

デザインシステムを作るとき、見た目のライブラリと実装が別々に育つことがあります。

Penpot にはコンポーネントがある。
React にもコンポーネントがある。
CSS にはトークンがある。
でも、どれが正本なのかが曖昧なままだと、AI に UI 実装を頼むたびに判断が揺れます。

Growth Lab では、この問題を「Penpot と React を同期する」ではなく、**同じ契約に従わせる**問題として扱いました。

この記事では、「同期する」だけでは足りない理由を先に置き、そのうえで運用を次の4点に絞って説明します。

- token JSON を正本にする
- 外部のUI語彙を内部語彙へ正規化する
- component map で Penpot と React の対応を持つ
- 変更単位ごとに検証順を固定する

## TL;DR

- デザインシステムの正本は、ツール上の見た目ではなく `tokens/*.json` と `component-map.json` に置く
- Penpot の部品名と React の component API を、同じ語彙体系で管理する
- AI へのデザイン指示は「おしゃれに」ではなく、目的・対象ユーザー・優先順位・禁止事項で渡す
- token / component / template / derived asset の変更ごとに、確認するファイルとコマンドを決めておく
- 破壊的変更では、token JSON から build までの確認順を固定する

## 1. 正本を Penpot ではなく契約ファイルに置く

まず重要なのは、Penpot の画面そのものを唯一の正本にしないことです。

Growth Lab の運用では、一次情報を次の2種類に寄せています。

- `docs/design-system/tokens/*.json`
- `docs/design-system/component-map.json`

`tokens/*.json` は、色・余白・タイポグラフィ・半径などの基礎値を持ちます。
`component-map.json` は、React component、Penpot 上の部品、variant、token、export の対応を持ちます。

つまり、Penpot はデザイン作業の場ですが、契約の正本はファイルとして管理します。

```text
docs/design-system/
├── tokens/
│   ├── primitive.json
│   ├── semantic.json
│   └── component.json
├── component-map.json
└── operation-guide.md
```

この形にしておくと、AI エージェントにも人間にも同じ説明ができます。

「この色を使って」ではなく、「semantic token にある `background` / `surface` / `accent` の役割に従って」と言える。
「それっぽいカードを作って」ではなく、「`Display / Card / Article` の variant と slot の範囲で作って」と言える。

自然言語の好みではなく、ファイルで確認できる契約に寄せるのがポイントです。ここでいう契約とは、色や余白の値だけでなく、「どの部品を、どの名前で、どの variant として扱うか」まで含む運用ルールです。

## 2. 同期コマンドは、正本を壊さない役割にする

Penpot と実装をつなぐ場合、同期コマンドにすべてを任せたくなります。
しかし、同期が正本を上書きする設計にすると、どちらが正しいか分からなくなります。

Growth Lab では、同期と検証を次のように分けています。

```bash
pnpm penpot:sync
pnpm penpot:verify
pnpm penpot:push
```

役割は次の通りです。

| コマンド | 役割 |
| --- | --- |
| `pnpm penpot:sync` | Penpot 由来の互換 JSON を更新する |
| `pnpm penpot:verify` | token JSON、`globals.css`、`component-map.json`、派生物の整合を検証する |
| `pnpm penpot:push` | W3C token（Design Tokens Community Group 形式の token）を Penpot へ取り込む運用を実行する |

ここで大事なのは、`docs/design-system/tokens/*.json` を SSoT（Single Source of Truth、唯一の正本）として扱い、sync で勝手に上書きしないことです。

同期コマンドは便利ですが、設計判断の正本にすると危険です。
正本は人間がレビューできる JSON と map に置き、コマンドは差分検出と運用補助に寄せます。

## 3. 外部UI語彙を内部語彙に正規化する

AI にデザインを頼むと、外部のUI語彙がそのまま入ってきます。

- Header
- Drawer
- Tabs
- Card Grid
- Hero
- CTA

これらをそのまま実装名にすると、既存のコンポーネント体系とズレます。
そこで、外部語彙はまず内部語彙に変換します。

たとえば Growth Lab では、Penpot のコンポーネント階層を次の形にしています。

```text
Category / ComponentName / Variant / State
```

例としては、次のような分類です。

| カテゴリ | 例 |
| --- | --- |
| `Navigation` | `Header`, `Footer`, `Breadcrumb`, `TableOfContents` |
| `Action` | `Button` |
| `Display` | `Card`, `Badge`, `TagList`, `ArticleHeader` |
| `Content` | `Typography`, `CodeBlock`, `Callout` |
| `Section` | `RelatedPosts`, `CTA` |
| `Layout` | `ArticleLayout` |
| `Template` | `Home`, `Category` |

これにより、AI が「カードグリッドっぽく」と出してきても、実装側では `Display / Card / Article` と `Section / RelatedPosts` の組み合わせとして扱えます。

外部の言葉は発想の入力に使う。
内部の言葉は実装とレビューの契約に使う。

この分離があると、デザインの自由度を残しながら、React 側の部品が増えすぎるのを防げます。AI が提案した見た目を採用する場合でも、最後は内部語彙に戻してから実装する、というレビュー基準を置けます。

## 4. AIへのデザイン指示は、見た目ではなく制約で渡す

AI に UI を作らせるとき、「いい感じに」「モダンに」「リッチに」だけでは再現性がありません。

Growth Lab のデザイン指示では、最低限次の項目を埋めます。

- 目的
- 対象ユーザー
- デザインスタイル
- 優先順位
- レイアウト
- デザイン上の制約
- 禁止事項
- 出力形式

たとえば、次のように渡します。

```text
【目的】
- 記事一覧から目的の記事へ迷わず到達できるようにする

【対象ユーザー】
- AIコーディングや開発運用の記事を探しているエンジニア

【優先順位】
1. 可読性
2. 回遊しやすさ
3. 信頼感
4. ブランドらしさ

【禁止事項】
- カード UI を必要以上に増やさない
- 既存 token にない色を直接追加しない
- Header / Drawer / Tabs などの外部語彙をそのまま実装名にしない
```

ここで渡しているのは、完成形のピクセル指定ではありません。
判断基準です。

AI が出した案をそのまま採用するのではなく、`ui-pattern-grammar.md` や `component-map.json` に沿って内部語彙へ変換する前提にします。これにより、AI の出力は「実装案」ではなく「契約に照らして採否を判断する素材」として扱えます。

## 5. 変更単位ごとに確認順を固定する

デザインシステムで怖いのは、変更の影響範囲が見えにくいことです。

token を変えたつもりが記事詳細の可読性を壊す。
component variant を足したつもりが Penpot 側の map とズレる。
OG 画像だけを変えたつもりがブランドカラーの契約から外れる。

そのため、変更単位ごとに手順を分けます。

### Token を追加・変更する

1. `primitive.json` / `semantic.json` / `component.json` のいずれかを更新する
2. `globals.css` と必要な component 実装を追従させる
3. `design-tokens.md` に契約上重要な値を反映する
4. `pnpm penpot:verify` を実行する

### Component variant を追加・変更する

1. React component の variant union を更新する
2. `component-map.json` の `variants` / `tokens` / `export` を更新する
3. `/design-system` 上の preview で状態を確認する
4. `pnpm penpot:verify` と `pnpm run check:all` を実行する

### Template を更新する

1. `templates` / `layout` 側では token と primitive を優先する
2. ローカルな spacing / width / decoration を増やす前に token 化を検討する
3. Home / Category / Article の hierarchy が揃っているか確認する
4. 記事タイプによる出し分けを変える場合は、関連 docs と `component-map.json` を同時に更新する

### 派生物を更新する

1. OG / icon / manifest / Remotion では `brand.ts` を参照する
2. 色や gradient をハードコードしない
3. `pnpm penpot:verify` で derived asset contract の検証を通す

変更単位を分けると、レビューで見るべきものが明確になります。
AI に修正を頼む場合も、「今回は Token 変更なのでこの順で確認して」と指示できます。

## 6. 大きな変更では、確認順を最後まで落とす

影響範囲が広い変更では、確認順を固定します。

:::details 破壊的変更時の確認順

```text
1. token JSON
2. globals.css
3. React component API
4. component-map.json
5. /design-system
6. Home / Category / Article
7. derived asset
8. pnpm penpot:verify
9. pnpm run check:all
10. pnpm build
```

:::

この順序は、デザインシステムを「見た目の確認」だけで終わらせないためのものです。

先に token と component API を確認する。
次に map と preview を確認する。
最後に派生物、検証コマンド、build を通す。

順番を決めておくと、AI も人間も「今どの契約を確認しているのか」を共有できます。

## 実践Tips

小さく始めるなら、最初から巨大なデザインシステムを作らなくて構いません。

まずは次の3つだけで十分です。

1. `tokens/*.json` を正本にする
2. `component-map.json` で Penpot と React の対応を持つ
3. `pnpm penpot:verify` のような整合チェックを用意する

そのうえで、AI に渡すデザイン指示をテンプレート化します。

```text
目的:
対象ユーザー:
優先順位:
使ってよい内部コンポーネント:
禁止事項:
検証コマンド:
```

この程度でも、「雰囲気で UI を増やす」状態からは抜け出せます。

## まとめ

Penpot と React を同じ契約で運用するには、同期そのものよりも、正本の置き場所を決めることが重要です。

- token JSON を正本にする
- component map で Penpot と React の対応を持つ
- 外部UI語彙を内部語彙へ正規化する
- AI への指示は目的・制約・禁止事項で渡す
- 変更単位ごとに確認順を固定する

デザインシステムは、きれいな部品集だけではなく、判断を揃えるための契約です。
AI と人間が同じ契約を見て作業できるようにすると、UI 実装の揺れはかなり減らせます。

同期コマンドを増やす前に、まず「どのファイルを見れば正しいと言えるのか」を決める。
そこから始めると、Penpot と React のズレは運用で追える問題になります。

## シリーズの他の記事

本記事は三部作の入口です。契約をどう持つかを扱いました。残り2記事で、その契約に乗せる入口ドキュメントとツール選定の論拠を整理しています。

- (2/3) 入口ドキュメントの整え方: [DESIGN.md 導入ガイド: AI実装のための入口・契約・検証をどう整えるか](https://zenn.dev/minewo/articles/design-md-guide-and-adoption-log)
- (3/3) ツール選定（Open Design）の論拠: [Open Designでデザイン品質を上げる：Penpot契約運用とDESIGN.mdの続編](https://zenn.dev/minewo/articles/open-design-design-quality)

## PenpotとReactを同じ契約で運用するFAQ

### Q. Penpotではなく Figma を使っていても、この運用は流用できますか？
A. できます。本記事の本質は「同期する」ではなく「契約ファイル（token JSON と component-map）を正本にする」ことです。Figmaでも Tokens Studio などを使って同じW3C token形式を入出力できるため、`pnpm penpot:verify` 相当の整合チェックを自前で組めば同じ設計が成立します。

### Q. token JSON を正本にすると、デザイナーが直接Penpot上で値を変えた場合に追従できないのでは？
A. その通りで、Penpot側の自由な変更は意図的に「正本にしない」設計です。Penpotでの調整は実験・提案として扱い、採用が決まったら token JSON に手で反映してから `pnpm penpot:push` で戻します。一方向（JSON→Penpot）に固定することで、どちらが正かで迷う場面を消しています。

### Q. component-map.json は手書きで維持するのですか？自動生成できませんか？
A. Growth Lab では手書き + verify による検証の組み合わせで運用しています。自動生成は Penpot 側のコンポーネント命名規約が厳密に守られている前提が必要で、現実には variant や token 参照の対応まで自動推論しきれません。手書きを正本にし、verifyで「実装側の variant / token 名と整合しているか」だけを機械的に止めるのが現実的です。

### Q. 外部UI語彙の正規化ルールは、誰がいつ作るのが現実的ですか？
A. AIに最初のUI依頼を投げた直後、出てきた語彙を見て初版を作るのが効率的です。ゼロから網羅しようとせず、`Header`、`Drawer`、`Tabs` など実際に AI が持ち込んだ語彙だけを内部語彙に紐付けます。語彙が出るたびに追記する運用にすれば、半年で実用的な対応表が積み上がります。

### Q. 「破壊的変更時の確認順10ステップ」は重すぎないですか？省略してよい場面は？
A. 破壊的変更でなければ、変更単位別の4ステップ手順だけで十分です。10ステップ版は token と component API の両方を同時に変える場合や、derived asset（OG画像、manifest等）まで影響する場合に限定して使います。判断基準は「複数の正本ファイルを同時に変更するか」です。

## 参考

- [Growth Lab](https://the3396.com/articles)
- Growth Lab `docs/design-system/operation-guide.md`
- Growth Lab `docs/design-system/ui-pattern-grammar.md`
- Growth Lab `docs/design-system/component-architecture.md`
