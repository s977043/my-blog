---
title: "Skillにもテストが必要になる"
---

Review Judgment as Codeの「as Code」は、判断基準をGitへ置くことだけではありません。

変更したSkillが本当に良くなったかを検証できる必要があります。

## Fixtureで入力と期待を固定する

River Reviewはfixtures-based evalをサポートしています。

概念的には、

~~~text
Representative Diff
   +
Skill
   ↓
Review Output
   ↓
Expected Conditions
~~~

を比較します。

評価caseには、たとえば次を持てます。

- diffFile
- planSkills
- mustInclude
- expectNoFindings
- minFindings
- maxFindings

自然言語出力を完全一致させるのではなく、**守りたいbehaviorを期待条件として固定する**発想です。

## Positiveだけでは足りない

Skill評価で危険なのは、問題を見つけるfixtureだけを増やすことです。

たとえばhallucinated-reference Skillなら、次の両方が必要です。

- **Positive** — 存在しないhelperを新規参照したらFindingを出す
- **Negative** — 同じdiff内でhelperを定義しているならFindingを出さない

Review Skillには、

> 見つける能力

だけでなく、

> **黙る能力**

も必要だからです。

## Planner自体も評価対象になる

River ReviewではSkillの出力だけでなく、どのSkillを選んだかも評価できます。

Planner evaluationでは、

- exactMatch
- top1Match
- coverage
- MRR

などで、期待したSkill順とPlanner出力を比較できます。

これは「良いSkillがあるのに選ばれない」という別のfailure modeを扱うためです。

## 評価値を絶対品質と考えない

Fixtureが通ったから、本番で必ず良いレビューになるわけではありません。

既知fixtureへ最適化しすぎる可能性があります。

そのため、評価結果は、

- regression guard
- baseline comparison
- candidate比較

として使い、実運用Feedbackと合わせて判断します。

## Skillの変更をコード変更と同じように扱う

理想的な流れは次です。

~~~text
Observed miss / false positive
   ↓
Reproduce with fixture
   ↓
Update Skill
   ↓
Run eval
   ↓
Review change
   ↓
Adopt
~~~

「Promptを修正して良さそう」で終わらせません。

## この章で持ち帰ること

Review Judgmentを資産として持つなら、その資産にも**回帰テスト**が必要です。

次章では、FeedbackからSkill・Heuristic・Deterministic Ruleへ判断を昇格させる改善ループを見ます。

### Sources

- [Evaluation Fixture Format](https://github.com/s977043/river-review/blob/main/pages/reference/evaluation-fixture-format.md)
- [Planner Evaluation](https://github.com/s977043/river-review/blob/main/pages/guides/planner-evaluation.md)
