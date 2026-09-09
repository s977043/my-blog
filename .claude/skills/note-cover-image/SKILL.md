---
name: note-cover-image
description: note記事の表紙・ヒーロー画像（記事の見出し画像）を、記事本文からCover Contractを抽出して設計・レビュー・作成する。note公式サイズ、内容整合、文字可読性、SNS縮小表示、シリーズ統一感を確認し、必要なら画像生成または決定的な文字合成まで行う。
---

# note-cover-image

note記事の**表紙画像 / ヒーロー画像 / 見出し画像**を、記事内容とnoteの表示特性に合わせて確認・作成するスキル。

ユーザーが「noteの表紙」「ヒーロー画像」「サムネイル」と呼んだ場合、特に指定がなければ **記事の見出し画像** と解釈する。クリエイターページやマガジンのヘッダー画像とは分けて扱う。

## このスキルの責務

- 記事本文から、画像で絶対に伝えるべき文脈と主張を抽出する
- 既存画像が記事内容を正しく表しているかレビューする
- note向けの構図・文字量・視認性を設計する
- 画像生成が可能な環境では、画像を作成・修正する
- 画像生成後に、文字・意味・サイズを再検証する
- `articles_note/assets/<slug>-cover.png` を標準保存先として提案する

本文中の図をレビューする `article-visual-review` とは責務を分ける。本スキルは**記事の入口としての表紙画像**を担当する。

## 最初に読むもの

1. 対象記事 `articles_note/<state>/<slug>.md`
2. `references/note-official-guidelines.md`
3. 必要なら同シリーズ・直近記事の表紙画像

Webアクセス可能なら、`references/note-official-guidelines.md` に記載したnote公式URLを再確認し、仕様変更があれば公式情報を優先する。

## note記事見出し画像の基準

現行の公式推奨を基準にする。

- 基本サイズ: **1280 × 670 px**
- 比率: 約 **1.91:1**
- 容量: **10MB以下**
- PC / モバイル / SNSで見え方が変わるため、重要情報を端へ寄せすぎない
- 内容と関連する画像にする
- 細部を増やしすぎず、大きな構図・シルエット・色面を優先する

SNS表示を意識した公式記事では「2:1」も目安として案内されているが、**記事見出し画像のファイル作成は1280 × 670 pxを正本**とする。

## Repository default visual direction

このリポジトリのnote向け技術記事では、特に指定がなければ次をデフォルトにする。

- 白または明るい背景
- シンプルで構造的
- 人物は原則使わない。人物が記事の意味に必要な場合だけ使う
- 小さな説明文字を大量に置かない
- 1つの主見出し + 1つの視覚メタファーを基本にする
- 色は2〜3系統に絞る
- 技術記事でも「ダッシュボードのスクリーンショット風」にしすぎない
- 表紙だけで本文の全内容を説明しようとしない

## Cover Contract

画像を作る前に、記事全体を読み、次を抽出する。

```yaml
article: articles_note/new/example.md
contextQualifier: AI駆動開発
coreMessage: DiscoveryとDeliveryでは先に定義するものが違う
primaryTerms:
  - Discovery
  - Delivery
mustCommunicate:
  - SDDをAI駆動開発の文脈で考え直した話である
mustNotImply:
  - DiscoveryからDeliveryへの一方向Phase Gate
  - AI一般論だけの記事
coverText:
  label: AI駆動開発
  headline: SDDを考え直す
  subheadline: DiscoveryとDeliveryでは先に定義するものが違う
visualMetaphor: 2つの領域を往復する構造
```

### contextQualifier

**省くと記事の意味が変わる文脈**を1つだけ抽出する。

例:

- AI駆動開発
- Engineering Management
- Product Discovery
- River Review

今回のように「AI駆動開発でのSDD」が主題なのに、画像からAIの文脈が消える場合は `NEEDS_CHANGES`。

### mustNotImply

本文と逆の意味を画像が作らないよう、禁止する誤読を明示する。

例:

- 本文が往復を説明しているのに、一方向矢印だけで工程移管に見せない
- 仮説を扱う記事なのに、確定仕様として見せない
- チームの実践を公式ルールのように見せない

## 作成フロー

### 1. 記事からCover Contractを抽出

タイトルだけで作らない。導入・中心主張・結論まで読む。

優先順位:

1. 何の記事か
2. 誰に向けた記事か
3. 読後に残したい一番の主張
4. 省略すると誤解される文脈
5. 図にすると誤読を生む関係

### 2. 表紙の文字を圧縮

記事タイトル全文をそのまま画像へ入れる必要はない。

基本:

- ラベル: 1つ。例 `AI駆動開発`
- 主見出し: 1行を理想、最大2行
- 補足: 必要なときだけ1〜2行
- 小さな本文説明・箇条書きは置かない

**記事タイトルと画像の文字が完全重複し、情報が増えていない場合は短くする。**

### 3. 2案まで構図を考える

無制限に案を増やさない。

技術記事で使いやすい型:

- **Concept contrast**: 2概念の違いを左右で見せる
- **Single metaphor**: 1つの大きな図形・象徴で主張を見せる
- **Flow / Loop**: 循環・往復・状態遷移が記事の中心の場合だけ使う

本文が「往復」を主張している場合、左右比較でも中央を双方向矢印や循環でつなぐ。

### 4. 画像を作成

画像生成ツールが利用できる場合は直接生成してよい。

ただし、日本語文字を含む場合は次を優先する。

1. 背景・アイコン・抽象図形を**文字なし**で生成
2. 日本語文字をSVG / HTML / Canvasなどの決定的なレイヤーで合成
3. 1280 × 670 px PNGへ書き出す

画像生成モデルに日本語文字まで描かせた場合は、**全ての文字を目視で1文字ずつ確認**する。誤字・欠字・文字化けが1つでもあれば完成扱いにしない。

生成環境に画像生成機能がない場合は、次のどちらかを行う。

- SVG / HTMLでシンプルな技術表紙を作り、Chrome headless等でPNG化する
- Cover Contractと完成用プロンプトを出力し、画像生成可能な環境へ引き継ぐ

### 5. サイズを機械確認

作成後は必ず実行する。

```bash
python3 .claude/skills/note-cover-image/scripts/check_note_cover.py articles_note/assets/<slug>-cover.png --strict
```

`--strict` では1280 × 670 pxを要求する。

高解像度版などを確認するだけなら `--strict` を外し、比率と容量を確認する。

### 6. 視覚レビュー

画像本体を表示して確認する。OCRだけで判断しない。

確認項目:

- 3秒で「何の記事か」が分かるか
- `contextQualifier` が見えるか
- 主見出しが縮小しても読めるか
- 記事の中心主張と画像の関係が一致するか
- `mustNotImply` に違反していないか
- 文字が端に寄りすぎていないか
- アイコンが細かすぎないか
- 背景と文字のコントラストが十分か
- 日本語・英語の綴りが正しいか
- 画像内の英語率が本文方針より過剰でないか

### 7. 保存

標準:

```text
articles_note/assets/<slug>-cover.png
```

表紙画像はnote管理画面で別途設定するため、**ユーザーが明示しない限り本文Markdownへ挿入しない**。

WXRへ本文画像として含める必要もない。

## 既存画像をレビューするとき

次の順で判定する。

1. 技術条件: サイズ / 比率 / 容量 / 形式
2. Content fit: 記事の内容と一致するか
3. Context fit: 文脈の限定語が抜けていないか
4. Semantic fit: 図が本文と逆の意味を作っていないか
5. Typography: 文字量 / 誤字 / 可読性
6. Thumbnail fit: 小さく表示しても主見出しが分かるか
7. Series fit: 既存シリーズと極端に違わないか

判定:

- `READY`: そのまま使用可能
- `NEEDS_CHANGES`: 修正すれば使用可能
- `REGENERATE`: コンセプトから作り直した方がよい
- `UNVERIFIED`: 画像本体や最新公式仕様を確認できない

## 出力フォーマット

```markdown
## Cover Contract
- contextQualifier: ...
- coreMessage: ...
- mustCommunicate: ...
- mustNotImply: ...

## Design
- label: ...
- headline: ...
- subheadline: ...
- visual: ...
- output: 1280x670 PNG

## Review
- technical: PASS / WARN / FAIL
- content: PASS / FAIL
- semantics: PASS / FAIL
- typography: PASS / FAIL
- thumbnail: PASS / FAIL

Verdict: READY / NEEDS_CHANGES / REGENERATE / UNVERIFIED
```

## 他スキルとの使い分け

### `article-visual-review`

本文内の図を確認する。表紙・OGPは原則対象外。

### `note-finalize`

記事本文の公開前最終ゲート。表紙画像が存在する場合は、本スキルの結果を最終確認材料として利用できる。

### `note-export-import`

本文画像のWXR import互換性を担当する。表紙画像そのものはnote管理画面で設定するため、本文画像とは別扱い。

## 禁止事項

- 記事を読まずタイトルだけで表紙を作る
- 全文タイトルを小さく詰め込む
- 意味のない人物写真・装飾を足す
- AI記事だからという理由だけでロボットや脳の絵を機械的に使う
- 本文で往復を説明しているのに一方向フローへ変える
- 画像生成モデルの日本語文字を未確認で採用する
- サイズ未確認で「note向け」と断定する
- 表紙画像を勝手に本文へ挿入する
- 画像本体を見られないのに `READY` とする

## 完了条件

- [ ] 記事本文全体を読んだ
- [ ] Cover Contractを抽出した
- [ ] contextQualifierを確認した
- [ ] 文字量を圧縮した
- [ ] 記事と画像の意味が一致している
- [ ] 1280 × 670 px / 10MB以下を確認した
- [ ] 画像を実際に表示して確認した
- [ ] 日本語・英語の文字を目視確認した
- [ ] 小さなサムネイルでも主見出しが読める
- [ ] 本文Markdownを不要に変更していない
- [ ] 最終判定を返した
