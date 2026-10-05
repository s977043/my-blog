---
title: "Skillをレビュー職務として設計する"
---

River ReviewのSkillは、単なるPrompt断片ではありません。

公開されているSkill schemaでは、id / name / description / categoryに加えて、適用対象、必要Context、severity、出力種別、evaluationType、dependenciesなどを宣言できます。

つまりSkillは、

> **何を見るか、いつ見るか、何が必要か、どの重さで扱うかを持つレビュー職務**

です。

## 例: locale追加をレビューする

User Profile APIへ locale フィールドを追加するとします。

この変更に対し「コード品質を見て」では範囲が広すぎます。

たとえば責務を分けると、

- API compatibilityを確認するSkill
- locale consistencyを確認するSkill
- test gapを確認するSkill

のように分けられます。

それぞれ必要なContextも違います。

API compatibilityならdiffと既存contract、locale consistencyなら周辺locale定義、test gapならtestsが必要です。

## 良いSkillは「何を見ないか」も説明できる

Skillを小さくする理由は、Promptを短くするためだけではありません。

境界があると、

- false positive guardを書ける
- 必要なEvidenceを指定できる
- どのArtifactが無ければskipするか決められる
- Human Handoff条件を定義できる
- fixtureを作りやすい

という利点があります。

たとえばAPI compatibility SkillがUIデザインまで評価し始めると、責務が曖昧になります。

一方で「public API contractの互換性だけを見る」と決めれば、期待するFindingもテストしやすくなります。

## evaluationTypeで判断層も宣言できる

現行schemaでは、Skillに evaluationType を持たせられます。

- deterministic
- heuristic
- agentic

の3種類です。

たとえばschema validationはdeterministic、既知のtemporary pattern検出はheuristic、PlanとDiffの意味的整合はagentic、といった配置ができます。

ここでも大事なのは、LLMを使うかどうかをSkill名から暗黙に決めないことです。

## dependenciesは「実行条件」の一部

Skillはcode search、test runner、coverage reportなどの依存を宣言できます。

必要なtoolが無ければ、無理に推測してFindingを作るのではなく、skipやQuestionへ落とす方が安全です。

Skillの品質は、賢そうな文章ではなく、

- 責務が狭い
- 必要Contextが明示されている
- Evidenceの取り方が分かる
- 実行不能時の挙動が決まっている

ことで高まります。

## この章で持ち帰ること

Skillは「AIに渡す指示」ではなく、**責任範囲を持つレビュー職務**です。

次章では、そのSkillが何を入力として受け取るのか、Artifactの境界を見ます。

### Sources

- [Skill schema](https://github.com/s977043/river-review/blob/main/pages/reference/skill-schema.md)
- [Skills](https://github.com/s977043/river-review/blob/main/pages/explanation/skills.md)
