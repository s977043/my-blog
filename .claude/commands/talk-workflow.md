---
description: テーマ・メモ・調査結果・Issue・既存記事から、記事を必須にせずTalk Brief→Story→Visual Contract→Marp Deck→Speaker Notes→複数視点レビュー→Render/Rehearsal Gateまで進める
argument-hint: <slug> [source-path]
---

# /talk-workflow

登壇資料を独立した成果物として作る正本コマンド。

## 引数

- `$1`: slug（必須）
- `$2`: source path（任意）

source pathが無い場合は、現在の会話で与えられたテーマ・要件・メモを入力にする。

例:

```text
/talk-workflow ai-review-flow
/talk-workflow ai-review-flow docs/research.md
/talk-workflow ai-review-flow articles/ai-review.md
```

## 重要な原則

- 記事作成を前提にしない
- 記事をsourceにしても逐語的にスライド化しない
- `talks/$1/brief.md` を内容のSSoT（Talk Contract）にする
- `talks/DESIGN.md` を共通Visual Design Systemにする
- `talks/$1/design.md` を登壇固有のVisual Contractにする
- **1 slide = 1 attention target**
- 主張・事実・著者体験を勝手に作らない
- Source VerificationとRendered Artifact Verificationを混同しない
- 実リハーサル前に時間成立を断定しない
- 不明点だけを理由に全工程を止めない。provisional / unverifiedを使う
- 自動commit / push / PR / mergeは行わない

## Phase 0: Preflight

1. `AGENTS.md` を読む
2. `talks/README.md` と `talks/DESIGN.md` を読む
3. source pathが指定されていれば実在確認
4. 同一slugの既存成果物があれば上書き前に内容を読む
5. 会社・顧客の非公開情報を個人登壇へ持ち込まない

## Phase 1: Plan

`.claude/skills/talk-planning/SKILL.md` に従う。

`talks/_templates/brief.md` から:

```text
talks/$1/brief.md
```

を作り、Talk Contractを固定する。

## Phase 2: Story

`.claude/skills/talk-story/SKILL.md` に従う。

```text
talks/$1/story.md
```

を作る。

必ず時間予算、Progressive Disclosure候補、Cut Listを含める。

## Phase 3: Visual Contract

`.claude/skills/talk-design/SKILL.md` に従う。

`talks/_templates/design.md` から:

```text
talks/$1/design.md
```

を作る。

ここで次をDeck生成より前に固定する。

- Visual Intent
- Audience Environment
- Attention Strategy
- Key Figures
- Slide Families
- Machine Constraints
- Talk-specific Exceptions
- Focus / Flow / Hierarchy / Legibility / Truthfulness / Speakability

## Phase 4: Deck

`.claude/skills/talk-slide-design/SKILL.md` に従う。

`brief.md` / `story.md` / `design.md` と `talks/DESIGN.md` を入力に、`talks/_templates/deck.md` をベースに:

```text
talks/$1/deck.md
```

をMarp互換Markdownとして作る。

各スライドに次の内部metadataを置く。

```markdown
<!--
message:
attention:
layout:
time:
evidence:
-->
```

`message` は意味上の主張、`attention` はその瞬間に見てほしい対象。

## Phase 5: Speaker Notes

`talks/_templates/speaker-notes.md` をベースに:

```text
talks/$1/speaker-notes.md
```

を作る。

各スライドについて:

- target_time
- say
- transition
- describe_visual
- do_not_say

を記録する。

## Phase 6: References

外部事実・数値・引用がある場合のみ:

```text
talks/$1/references.md
```

を作る。

公式事実と著者解釈を混同しない。

## Phase 7: Multi-perspective Review

`.claude/skills/talk-review/SKILL.md` を使う。

6 personas:

- Audience
- Speaker
- Editor
- Presentation Designer
- Technical
- Accessibility

6 quality axes:

- Focus
- Flow
- Hierarchy
- Legibility
- Truthfulness
- Speakability

必要な範囲で既存Skillの観点を再利用する。

- `.claude/skills/article-domain-review/SKILL.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/skills/article-visual-review/SKILL.md` のsemantic consistency / redundancy

結果を:

```text
talks/$1/review.md
```

へ保存する。

## Phase 8: Improve

reviewのfindingを次の順で処理する。

1. must
2. high
3. medium
4. low

ただし以下は自動変更しない。

- core_thesis
- verified fact
- 著者体験
- 数値
- 引用
- 公開可否

これらに触れる場合はfindingを残す。

Story / Design / Deck / Notesを変更したら、古いreview結果を再利用せずPhase 7をfresh実行する。

Source Reviewのimprovement loopは最大3回。
3回でmust/highが解消しなければ `NEEDS_CHANGES` で終了する。

## Phase 9: Deterministic Source Check

Final Gate前に必ず実行する。

```bash
npm run check:talk -- $1
```

最低限、次を確認する。

- required artifacts
- Talk Contract
- Visual Contract
- Contract Snapshot drift
- Takeaways 1〜3件
- slide message / attention / layout / columns / time
- bullet / code density
- slide ↔ Speaker Notes対応
- planned time
- READYとprovisional / unverifiedの矛盾
- Render / Rehearsal statusの整合

## Phase 10: Render Verification

レンダリング可能ならPDFまたは画像へ出力し、実物を確認する。

- 文字切れ
- overflow
- 余白
- contrast
- 図中文字
- SVG / image fit
- 欠落要素
- 視線誘導
- スライド間のリズム

レンダリング環境が無ければ:

```text
render_verification: UNVERIFIED
```

とする。

Source CheckがPASSでもRender PASSとはみなさない。

## Phase 11: Rehearsal Verification

実際に話せる環境では通しまたは主要セクションを声に出して確認する。

- measured time
- transition
- slideと説明の同期
- Cut List
- 説明が詰まる箇所
- visualを見るタイミング

実施できない場合:

```text
rehearsal_verification: UNVERIFIED
```

とする。

metadataの予定時間だけで実登壇時間を確定しない。

## Phase 12: Finalize

最後に1つの結果を返す。

```text
Talk Final Gate

Talk Contract: PASS / FAIL
Visual Contract: PASS / FAIL
Story: PASS / FAIL
Source Verification: PASS / FAIL
Timing Plan: PASS / FAIL / UNVERIFIED
Audience Review: PASS / FAIL
Speaker Review: PASS / FAIL
Editor Review: PASS / FAIL
Presentation Design Review: PASS / FAIL / UNVERIFIED
Technical Review: PASS / FAIL / UNVERIFIED
Accessibility Review: PASS / FAIL / UNVERIFIED
Render Verification: PASS / FAIL / UNVERIFIED
Rehearsal Verification: PASS / FAIL / UNVERIFIED

Verdict: READY / NEEDS_CHANGES / UNVERIFIED
```

## Verdict

### READY

- must / high = 0
- Talk Contract driftなし
- Visual Contract違反なし
- important claims verified
- timing plan成立
- required Render Verification = PASS
- required Rehearsal Verification = PASS

### NEEDS_CHANGES

- must / highが残る
- contract drift
- 時間超過
- source / renderで明確な不具合

### UNVERIFIED

- 重要事実が未確認
- durationがprovisional
- 必須Renderが未実施
- 必須Rehearsalが未実施

## 完了成果物

最低限:

```text
talks/$1/
├── brief.md
├── story.md
├── design.md
├── deck.md
├── speaker-notes.md
└── review.md
```

外部根拠がある場合:

```text
└── references.md
```
