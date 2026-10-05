---
name: talk-design
description: Talk BriefとStory Architectureを、共通Talk Design Systemに従う登壇固有のVisual Contractへ変換する。Deck生成前にattention target、視覚階層、図、Progressive Disclosure、アクセシビリティ、機械検査制約を固定する。
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# talk-design

`brief.md` と `story.md` を読み、`talks/DESIGN.md` を共通ルールとして `talks/<slug>/design.md` を作る。

このSkillはDeckそのものを作らない。
目的は **Visual ContractをDeck生成より前に固定すること**。

## Inputs

必ず読む。

1. `talks/<slug>/brief.md`
2. `talks/<slug>/story.md`
3. `talks/DESIGN.md`
4. `talks/_templates/design.md`

## Invariants

次を変更しない。

- audience
- duration_minutes
- core_thesis
- verified evidence
- constraints

見栄えのために主張を変えない。

## 1 slide = 1 attention target

「1枚に要素が1つ」ではない。

1枚に複数の補助要素があってもよいが、聴衆がその瞬間に見るPrimaryは1つにする。

例:

```text
message:
AIを使い切ることより、価値の流れを見る

attention target:
Human Reviewへ集中するQueue
```

## Visual Narrative

Storyの変化を視覚変化へ対応付ける。

例:

```text
resource utilization
    ↓
parallel agents
    ↓
review queue
    ↓
human bottleneck
    ↓
value flow
```

単に章ごとに違うレイアウトを割り当てない。
認識変化と視覚変化を対応させる。

## Slide Families

Story上の役割から必要な型を選ぶ。

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

見た目のバリエーションを増やすためだけに型を変えない。

## Figures

図を使う場合、先に以下を決める。

- 図がPrimaryかSecondaryか
- 何を見てほしいか
- 完成図を何段階に分けるか
- 正確性を保つために残す境界・矢印・ラベル
- 口頭へ逃がす説明

図に説明文を詰めてはいけない。

## Progressive Disclosure

`story.md` の候補をもとに、必要ならKey Figuresへbuild stepsを書く。

各stepは「要素が増えた」ではなく「attention targetが変わった」状態にする。

## Audience Environment

会場条件が分からない場合は `unknown` として進める。
推測で会場サイズや投影条件を作らない。

環境不明の場合はLegibilityを安全側に倒す。

## Machine Constraints

`talks/DESIGN.md` の推奨値から開始する。

値を緩和する場合:

1. Talk固有の理由がある
2. `Talk-specific Exceptions` に記録する
3. 内容を収めるためだけの緩和はしない

`minFigureFontPt` はSourceだけでは保証できない。
Render Verificationの観点として保持する。

## Quality Axes

design.mdのValidation Intentで、次をどう成立させるか短く書く。

- Focus
- Flow
- Hierarchy
- Legibility
- Truthfulness
- Speakability

## 完了条件

- [ ] Contract Snapshotがbrief.mdと一致
- [ ] Baseが`talks/DESIGN.md`
- [ ] Visual Intentが一文で説明できる
- [ ] attention strategyがある
- [ ] 必要なKey Figuresが定義されている
- [ ] Progressive Disclosure方針がある
- [ ] Slide FamiliesがStory上の役割と対応
- [ ] Machine Constraintsが有効なJSON
- [ ] 共通Design Systemからの例外が明示
- [ ] 6 Quality Axesを確認済み
- [ ] Deckをまだ生成していない
