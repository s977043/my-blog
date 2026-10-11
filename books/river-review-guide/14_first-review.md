---
title: "最初のRiver Reviewを実行する"
---

コマンドを打つ前に、レビューの入出力を押さえておきます。

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

## Claude CodeにPluginを入れる

River Review v1.126.0時点のREADMEでは、Claude Codeへの導入は次の3ステップです。

~~~text
/plugin marketplace add s977043/river-review
/plugin install river-review@river-review-marketplace
/reload-plugins
~~~

1行目で配布元（marketplace）を追加し、2行目でPluginを入れ、3行目で再起動せずに有効化します。Codexでも同じ配布元から導入できます。

手順はバージョンによって変わることがあります。試す前に、READMEの「river-review プラグインの導入」を確認してください。

Pluginへ移行した経緯と、Claude CodeとCodexで手順をそろえた設計は、[テンプレコピーをやめた — River Review を Claude Code / Codex の Plugin にした話](/articles/river-review-plugin-migration) で書いています。

## 1つ実行してみる

導入できたら、作業中の変更に対して次のコマンドを実行します。

~~~text
/river-review:review-local
~~~

working treeの差分をレビューし、修正案を返すPluginのコマンドです。前節のように自然文で依頼しても構いません。

返ってくるレビューは、River Reviewの出力形式の要約・指摘・修正案に沿います。locale追加の変更なら、たとえば次のような形になります。

~~~text
Summary:
  User Profile APIにoptionalなlocaleを追加する変更。
  未対応のlocale値を受け取ったときの扱いが未定義。

Finding (major / test-gap):
  src/profile/update.ts:42
  未対応のlocaleを渡した場合の分岐にテストがない。
  Evidence:
    - update.tsにfallback分岐が追加されている
    - 追加されたテストは正常値の "ja" / "en" だけを確認している

Suggestion:
  未対応localeでfallbackすることを確認するテストを1件追加する。
~~~

これは本書で用意した**例（簡略化）**で、実際の出力ではありません。文面や項目の並びは、選ばれたSkillや実行環境によって変わります。ここで見てほしいのは、指摘（Finding）と、それを再確認できる根拠（Evidence）が対になっていることです。

## 最初に確認する3点

### 1. 何を入力にしたか

diffだけなのか、`plan` や `tests` も渡したのか。

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

最初の実行では、まだPlanを渡さずdiffだけを見るとします。

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

次章ではPlanを追加し、実装前レビューへ進みます。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [Agent Workflow Guide](https://github.com/s977043/river-review/blob/main/pages/guides/agent-workflow.md)
