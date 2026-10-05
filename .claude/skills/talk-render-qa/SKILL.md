---
name: talk-render-qa
description: Marpで書き出したPDF/SVGを対象に、余白・要素間隔・図中文字・SVG fit・再利用差分を実測し、機械検査と人間の原寸確認を分離してRender Verificationを判定する。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# talk-render-qa

`deck.md` のソース品質ではなく、**実際に書き出された成果物**を確認するためのSkill。

Markdownが正しくても、Marp/PDFでは clipping、overflow、font fallback、SVG崩れ、余白不足が起こる。
Source VerificationのPASSをRender Verificationへ昇格させない。

## Upstream

次の公開Skillから、実測ベースの検査思想を参考にしている。

- https://github.com/minorun365/minorun-marp-skill
- Apache-2.0

上流の黒地テーマや作者固有の演出ルールは、このリポジトリの必須ルールにしない。
採用するのは、再現可能な検査方法と「検査できないものをPASSにしない」境界。

## 入力

最低限:

- `talks/<slug>/deck.md`
- `talks/<slug>/design.md`
- render済みPDFまたは画像
- SVGがある場合はその実体
- `talks/<slug>/review.md`

既存スライドを再利用した場合は、可能ならコピー元Deckも読む。

## 1. Render artifactを固定する

検査対象のファイル名・生成日時・生成コマンドを記録する。

例:

```bash
marp --no-stdin talks/<slug>/deck.md --pdf --allow-local-files
```

テーマはVisual Contractに従う。
`minorun-dark.css` を暗黙の標準にはしない。

## 2. 機械検査

利用可能な検査ツールを探索し、存在するものだけを実行する。
上流 `minorun-marp-skill/tools` をローカルで導入している場合は、互換する検査を優先する。

代表例:

```bash
python3 tools/check-dark-margins.py deck.pdf
python3 tools/check-dark-gaps.py deck.pdf
python3 tools/check-figure-text.py deck.pdf
node tools/check-svg-box-fit.mjs images/*.svg
python3 tools/check-reuse-diff.py new.md old.md
```

注意:

- dark系checkは黒背景/互換テーマのときだけ使う
- ツールが無い場合は「未実施」でありPASSではない
- 1つでもFAILなら先に全件列挙してから修正する
- 修正後は同じ検査を全ページへ再実行する

## 3. Generic checks

テーマに依存せず最低限確認する。

- clipping / overflow
- slide edgeとの余白
- visualと本文の間隔
- figure内の最小文字サイズ
- SVGの文字とboxのfit
- font fallback
- missing image / missing SVG
- 不自然な改行
- code blockの可読性
- contrast
- slide count

`design.md` の `minFigureFontPt` など、Talk-specificなMachine Constraintsを優先する。

## 4. 原寸Visual Review

contact sheetだけで「崩れなし」と判定しない。

最低限:

1. 全ページを一覧してリズムと欠落を確認
2. 各ページを十分な解像度で確認
3. 図形の重なり、矢印、吹き出し、境界は必要に応じて拡大
4. 修正した観点は全ページへ横展開して再確認

一覧確認しかできていない場合は、reviewへその範囲を明記し `UNVERIFIED` を維持する。

## 5. Headline / AI-uniformity sweep

全見出しを一覧し、内容より「型の反復」を確認する。

- 同じ語尾・接続詞・コロン形式が3枚以上連続していないか
- 全ページが同じ長さ・同じ文体へ均一化していないか
- 同じカード/3列/同形レイアウトの反復でストーリーが平板になっていないか

多様性そのものを目的にしない。
Story上の役割が同じなら同じ表現でもよい。

## 6. Reuse verification

既存デッキから流用した場合:

- 見出しだけでなく図・スクリーンショットも対応しているか
- 古い事実やバージョンを持ち込んでいないか
- 前後の文脈を切って意味を変えていないか
- 同じ図の複数版がある場合は、採用元を記録できるか

「似たスライドをAIで再生成」より、権利・文脈に問題がなければ実物の再利用を優先する。

## 7. review.mdへの記録

このSkillが変更してよい成果物は原則 `talks/<slug>/review.md` の `## Render Verification` だけとする。Deck / Story / Design / Speaker Notesは変更しない。

`## Render Verification` に最低限記録する。

- status
- artifact
- checked_at
- method
- tool_results
- visual_review_scope
- issues

判定:

### PASS

- 必須の機械検査がPASS
- 必要な原寸Visual Reviewを実施
- 重大なclipping / readability / missing elementなし
- Visual Contract違反なし

### FAIL

- 明確なrender defectあり
- 実寸で読めない
- 重要visualが欠落
- Visual Contract違反あり

### UNVERIFIED

- artifact未生成
- 必須ツール未実行
- 一覧画像だけで原寸を未確認
- 実環境のfont / contrast / projector条件を確認できない

## 完了条件

- [ ] 検査対象artifactを固定
- [ ] 実行したtoolと結果を記録
- [ ] 全ページを確認
- [ ] 必要箇所を原寸/拡大確認
- [ ] 修正観点を全ページへ再適用
- [ ] PASS / FAIL / UNVERIFIEDを根拠付きで記録
