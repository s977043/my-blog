---
title: "Skills・Gates・Riverbedの3つの役割"
---

River Reviewのコアモデルは、判断を1つの巨大な仕組みへ押し込まず、**定義・実行・記憶**へ分けます。

~~~text
Skills define judgment.
Gates execute judgment.
Riverbed remembers judgment.
~~~

この章では3つの責務だけをつかみます。詳細なschemaやlifecycleは後の章で扱います。

## Skills define judgment

Skillは「どんなレビュー判断を行うか」を持ちます。

migration safety、dependency policy、accessibility、plan conformance、hallucinated reference、test gapなど、観点ごとに責務を分けます。

ここで重要なのは、Skillを単なるPrompt断片として扱わないことです。対象・必要Context・Evidence・false positive guard・Human Handoffまで含めて、小さなレビュー職務として設計できます。

Skillの具体的な設計は第9章で扱います。

## Gates execute judgment

判断基準があっても、いつ実行するかが曖昧なら運用できません。

Gateは、適切なArtifactやフェーズでSkillを実行する境界です。

たとえばPlan段階とDiff段階では、同じSkillでも見られるEvidenceが違います。Gateは「何を判断するか」ではなく、**いつ判断するか**を担います。

現在のRiver Reviewではplan / exec側のゲートを扱い、verify gateには計画中の領域があります。本書でも将来構想を現在機能のようには書きません。

## Riverbed remembers judgment

レビューを繰り返すと、過去の判断を再利用したくなります。

- この設計判断はADRで決めている
- このRiskは今回は受け入れた
- このFindingはWontFixにした

Riverbedは、こうした**次のレビューを変える判断状態**を記憶する層です。

ここでは「記憶する役割」だけ押さえてください。entry type、status、supersede / expire、Suppressionは第24〜25章で詳しく扱います。

## 3つを分ける理由

もし全部を1つのPromptへ入れると、判断基準・実行タイミング・過去判断が混ざります。

責務を分けると、それぞれを独立に改善できます。

~~~text
Skill       = what to judge
Gate        = when to judge
Riverbed    = what to remember
~~~

さらに、その判断品質をfixture / evalで検査するのがEvaluationです。

## この章で持ち帰ること

River Reviewのコアを覚えるなら、まずこの3行で十分です。

> **Skills define judgment.**  
> **Gates execute judgment.**  
> **Riverbed remembers judgment.**

次章では「どこで起動し、誰が実際に判断を実行するのか」に進みます。

### Sources
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Review Concept](https://github.com/s977043/river-review/blob/main/pages/explanation/concept.md)
