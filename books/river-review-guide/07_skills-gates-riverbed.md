# Skills・Gates・Riverbedの3つの役割

River Reviewのコアモデルは、判断を1つの巨大な仕組みへ押し込まず、**定義・実行・記憶**へ分けます。

~~~text
Skills define judgment.
Gates execute judgment.
Riverbed remembers judgment.
~~~

## Skills define judgment

Skillは「どんなレビュー判断を行うか」を持ちます。

migration safety、dependency policy、accessibility、plan conformance、hallucinated reference、test gapなど、観点ごとに責務を分けます。

Skillには適用phase、対象ファイル、必要Context、severity、Evidenceの取り方、false positive guard、Human Handoffなどを持たせられます。

つまりSkillは「レビュー手順」だけではなく、**小さなレビュー職務**です。

## Gates execute judgment

判断基準があっても、いつ実行するかが曖昧なら運用できません。

Gateは、適切なArtifactやフェーズでSkillを実行する境界です。

現在のRiver Reviewではplan / exec側のゲートを扱い、verify gateは計画中の領域があります。

本書でも将来構想を現在機能のようには書きません。

## Riverbed remembers judgment

レビューを繰り返すと、「同じことを毎回指摘する」問題が出ます。

- この設計判断はADRで決めている
- このRiskは今回は受け入れた
- このFindingはWontFixにした
- このpatternは以前も確認した

Riverbed Memoryは、こうした過去判断をoperating memoryとして残します。

Transcriptを全部保存するのではなく、**次回の判断を変える情報**を構造化して残すことが中心です。

## 3つを分ける理由

もし全部を1つのPromptへ入れると、判断基準・実行タイミング・過去判断が混ざります。

責務を分けると、それぞれを独立に改善できます。

~~~text
Skill       = what to judge
Gate        = when to judge
Riverbed    = what to remember
~~~

さらにRiver Reviewでは、SkillやPlannerの品質をfixture / evalで確認します。

## この章で持ち帰ること

River Reviewのコアを覚えるなら、まずこの3行で十分です。

> **Skills define judgment.**  
> **Gates execute judgment.**  
> **Riverbed remembers judgment.**

次章では、この判断を誰が実際に実行するのかを見ます。

### Sources
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Review Concept](https://github.com/s977043/river-review/blob/main/pages/explanation/concept.md)
- [Riverbed Memory](https://github.com/s977043/river-review/blob/main/pages/explanation/riverbed-memory.md)
