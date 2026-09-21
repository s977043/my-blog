---
name: talk-slide-design
description: Talk Brief・Story Architecture・Visual ContractからMarp互換の登壇スライドを作る。1 slide = 1 attention target、視覚階層、Progressive Disclosure、投影可読性、Speaker Notesとの責務分離を重視する。
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

# talk-slide-design

`brief.md`、`story.md`、`design.md`、`talks/DESIGN.md` から `deck.md` を作るためのSkill。

Design Contractを生成中に勝手に再設計しない。
変更が必要なら `design.md` のexceptionまたはreview findingとして扱う。

## 1 slide = 1 attention target

各スライドには「主張」と「今見てほしいもの」を分けて記録する。

```markdown
<!--
message: AIを使い切ることより、価値が流れることを優先する
attention: Human Reviewへ集中するQueue
layout: progressive-diagram
time: 1:00
evidence:
-->
```

- `message`: このスライドで理解してほしい意味
- `attention`: その瞬間に聴衆が見るPrimary
- `layout`: Slide Family / visual role
- `time`: 予定説明時間
- `evidence`: 必要な場合の根拠

複数の補助要素は許容するが、Primary attentionを複数にしない。

## Visual Hierarchy

優先順位:

1. attention target
2. messageを補強するsecondary information
3. 出典や補足

全部を同じ強さで表示しない。

章名だけのタイトルより、そのページで理解してほしい意味を示す見出しを優先する。

## スライドは原稿ではない

避ける:

- 長い本文段落
- 記事をそのまま箇条書きへ変換
- 図の箱の中に説明文を詰め込む
- Speaker Notesと同じ文章を表示する
- 収まらないためのfont縮小

優先する:

- 短い見出し
- Key phrase
- Big number
- Contrast
- Diagram
- Concrete example
- One question

## Slide Families

`design.md` で選択した型をStoryの役割に応じて使う。

- Hook
- Question
- Big Statement
- Big Number
- Evidence
- Example
- Quote
- Before / After
- Comparison
- Progressive Diagram
- Architecture / Model
- Code Focus
- Screenshot / Demo
- Transition
- Takeaway
- Closing

表現を散らすためだけに型を変えない。

## Progressive Disclosure

複雑な図は同じ骨格を維持し、attention targetを順番に増やす。

```text
State A
↓
State A + B
↓
State A + B + C
↓
完成モデル
```

同じ図を複数ページに分けることを重複とは判定しない。

各ページで:

- 何が追加されたか
- 今どこを見るか
- Speakerが何を説明するか

を一致させる。

## Figures

- 図がPrimaryかSecondaryかを決める
- Primaryなら版面を十分使う
- 箱の中は短い名前・ラベル中心
- 実在する境界だけを境界として描く
- 矢印は説明上の都合で嘘をつかない
- 要素が多すぎる場合は分割する

`minFigureFontPt` はsourceだけでは保証できないため、Render Verificationで実物を確認する。

## Code Slide

- 全ファイルを貼らない
- 差分・重要行だけ
- attention targetは原則1か所
- `design.md` のmaxCodeLinesを超えない
- 口頭で説明できない行を載せない
- 小さい文字へ縮小して解決しない

## Bullet Density

箇条書きは列挙のためではなく、attention targetを補助するために使う。

`design.md` のmaxBulletsを超える場合は:

1. 削る
2. groupingする
3. splitする

の順に検討する。

## Evidence

外部事実・数値・引用には参照先を `references.md` またはスライド内の短い出典へ保持する。

可読性のために根拠を消さない。
詳細URLをSpeaker Notes / referencesへ逃がすことはできる。

## Speaker Notesとの責務分離

Deck:
- attention target
- visual evidence
- key phrase
- minimum necessary context

Speaker Notes:
- explanation
- background
- transition
- visual description
- cautions
- examples
- do_not_say

## Render前提

Markdown上で綺麗に見えても完成とはしない。

Deck生成時点では:

```text
Render Verification = UNVERIFIED
Rehearsal Verification = UNVERIFIED
```

を前提にする。

## 完了条件

- [ ] 全slideにmessage / attention / layout / columns / time
- [ ] 1 slide = 1 attention target
- [ ] story.mdと一致
- [ ] design.mdに違反していない
- [ ] core_thesisが変わっていない
- [ ] 説明文を詰め込んでいない
- [ ] Progressive Disclosureがattentionの順番になっている
- [ ] 視認性を文字縮小で解決していない
- [ ] 重要な出典が保持されている
- [ ] Speaker Notesへ逃がす情報が分離されている
