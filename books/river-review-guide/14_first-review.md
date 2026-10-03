# 最初のRiver Reviewを実行する

最初に理解したいのはコマンドではなく、レビューの入出力です。

~~~text
Engineering Artifacts
        ↓
River Review
        ↓
Finding / Evidence / Verdict
        ↓
Human / Caller Decision
~~~

Claude Code / CodexのPluginから始める場合も、GitHub Actionsから実行する場合も、この責務境界は変わりません。

## 最初はPluginが分かりやすい

対話的に試すなら、Plugin経路ではRiver ReviewのSkillを既存のAIエージェントに追加できます。

この場合、River Review専用の別モデルを覚える必要はありません。

「現在の変更をRiver Reviewの観点でレビューして」と依頼し、どのSkillが選ばれ、どんなEvidence付きFindingが返るかを見るところから始められます。

## 最初に確認する3点

### 1. 何を入力にしたか

diffだけなのか、planやtestsも渡したのか。

入力が違えば、レビューできることも変わります。

### 2. どの観点が動いたか

security、test-gap、plan conformanceなど、どのSkill / Reviewer Roleが選ばれたかを確認します。

### 3. 何が「判断済み」で、何が「材料」か

FindingやVerdictが出ても、それは自動mergeの許可ではありません。

~~~text
Review result
  → judgment material

Human / caller policy
  → action authority
~~~

この2つを最初から分けておくと、後でCIへ広げたときも責務が崩れにくくなります。

## locale追加の例

最初の実行では、まだplanを渡さずdiffだけを見るとします。

この時点でレビューできるのは、

- 追加コードの明白な問題
- 既知pattern
- test変更の有無
- 周辺Contextを取得できる場合のcross-file不整合

などです。

一方、「この変更は承認されたPlan通りか」は判断できません。

Planを渡していないからです。

この「分からない理由が入力契約から説明できる」ことが重要です。

## この章で持ち帰ること

First Runの成功条件は、Findingがたくさん出ることではありません。

**何を入力し、何を判断し、何を判断していないかを説明できること**です。

次章ではplanを追加し、実装前レビューへ進みます。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [Agent Workflow Guide](https://github.com/s977043/river-review/blob/main/pages/guides/agent-workflow.md)
