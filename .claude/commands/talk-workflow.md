---
description: テーマ・メモ・調査結果・Issue・既存記事から、記事を必須にせずTalk Brief→Story→Marp Deck→Speaker Notes→4視点レビューまで生成する
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
- `talks/$1/brief.md` をSSoTにする
- 主張・事実・著者体験を勝手に作らない
- 不明点だけを理由に全工程を止めない。provisional / unverifiedを使う
- 自動commit / push / PR / mergeは行わない

## Phase 0: Preflight

1. `AGENTS.md` を読む
2. `talks/README.md` を読む
3. source pathが指定されていれば実在確認
4. 同一slugの既存成果物があれば上書き前に内容を読む
5. 会社・顧客の非公開情報を個人登壇へ持ち込まない

## Phase 1: Plan

`.claude/skills/talk-planning/SKILL.md` に従う。

`talks/_templates/brief.md` から:

```text
talks/$1/brief.md
```

を作る。

ここでTalk Contractを固定する。

## Phase 2: Story

`.claude/skills/talk-story/SKILL.md` に従う。

```text
talks/$1/story.md
```

を作る。

必ず時間予算とCut Listを含める。

## Phase 3: Deck

`.claude/skills/talk-slide-design/SKILL.md` に従う。

`talks/_templates/deck.md` をベースに:

```text
talks/$1/deck.md
```

をMarp互換Markdownとして作る。

各スライドに可能な限り次の内部コメントを置く。

```markdown
<!--
message:
time:
evidence:
-->
```

## Phase 4: Speaker Notes

`talks/_templates/speaker-notes.md` をベースに:

```text
talks/$1/speaker-notes.md
```

を作る。

各スライドについて:

- target_time
- say
- transition
- do_not_say

を必要な範囲で記録する。

## Phase 5: References

外部事実・数値・引用がある場合のみ:

```text
talks/$1/references.md
```

を作る。

公式事実と著者解釈を混同しない。

## Phase 6: Review

`.claude/skills/talk-review/SKILL.md` を使う。

さらにレビュー内で以下の既存Skillの観点を必要な範囲で再利用する。

- `.claude/skills/article-domain-review/SKILL.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/skills/article-visual-review/SKILL.md` のsemantic consistency / redundancy

結果を:

```text
talks/$1/review.md
```

へ保存する。

## Phase 7: Improve

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

Deck / Notesを変更したら、古いreview結果を再利用せずPhase 6をfresh実行する。

最大3 improvement loops。
3回でmust/highが解消しなければ無限ループせず `NEEDS_CHANGES` で終了する。

## Phase 8: Finalize

最後に1つの結果を返す。

```text
Talk Final Gate

Talk Contract: <summary>
Story: PASS / FAIL
Timing: PASS / FAIL / UNVERIFIED
Audience Review: PASS / FAIL
Speaker Review: PASS / FAIL
Editor Review: PASS / FAIL
Technical Review: PASS / FAIL / UNVERIFIED
Render Verification: PASS / UNVERIFIED

Verdict: READY / NEEDS_CHANGES / UNVERIFIED
```

## Deterministic Check

Final Gateの前に必ず実行する。

```bash
npm run check:talk -- $1
```

required files、Talk Briefの必須項目、各slideのmessage/time、時間予算、review verdictを機械検査する。

## Render Verification

初回実装ではMarp CLIやPDF検査を必須にしない。

PDF / 画像レンダリングを実行できる環境では次を追加確認する。

- 文字切れ
- オーバーフロー
- 余白
- コントラスト
- 図中文字の視認性

実行できない場合は `Render Verification: UNVERIFIED` とし、内容レビューのREADYと混同しない。

将来、`minorun365/minorun-marp-skill` の検査ツールを必要なものだけ導入する余地を残す。

## 完了成果物

最低限:

```text
talks/$1/
├── brief.md
├── story.md
├── deck.md
├── speaker-notes.md
└── review.md
```

外部根拠がある場合:

```text
└── references.md
```
