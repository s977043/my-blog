# PlanGateは「Plugin」よりGovernance Harnessとして見る

PlanGateはClaude CodeやCodexから使えます。

そのため、最初に触れたときは「AIコーディング用Plugin」と理解するのが自然です。

実際、配布や導入の入口としてPluginは重要です。

ただ、PlanGateが設計している対象を理解するには、Pluginという言葉だけでは足りません。

PlanGate自身は現在、**AIコーディングエージェントのためのガバナンス優先ワークフローハーネス**と位置づけています。

この章では「Governance Harness」という言葉を、抽象的なラベルではなく、何を組み合わせているのかに分解します。

## Pluginは「届け方」であって、全体の責務ではない

Pluginとしてできるのは、SkillやAgent、Commandなどを利用環境へ届けることです。

しかしPlanGateでは、それだけで安全な実行境界が完成するわけではありません。

たとえばHookは別途配線が必要な場合があります。Planや承認Artifactも必要です。Verificationの結果も残す必要があります。

つまり、

```text
Pluginを入れた
    ≠
Governanceが成立した
```

です。

これは後半で扱うFalse Greenの問題にもつながります。

## Harnessはモデルの外側を設計する

PlanGateのphilosophyでは、Harness Engineeringを「モデルへ直接『慎重にやって』と頼るのではなく、実行環境、承認境界、検証、ログ、再実行条件を整える考え方」と説明しています。

PlanGateは、その考え方をPBI単位の開発ワークフローへ落としたものです。

重要なのは、モデル自身を改造するのではなく、**モデルの外側にある仕事の進め方を設計する**ことです。

```text
Model
  │
  ├─ 何を見るか
  ├─ どの順番で働くか
  ├─ どこまで実行できるか
  ├─ 何を証拠として残すか
  └─ どこで止まり、誰に判断を渡すか
```

PlanGateでは、これを複数の構成要素へ分けています。

## Workflow — 仕事の順序を持つ

Workflowは、「次に何をするか」を定義します。

現行PlanGateでは、Brainstorm、Requirement Expansion、Solution Design、Build & Refine、Verify & HandoffというWF-01〜WF-05の流れがあります。

ここで重要なのは番号ではなく、

> Requirementを考える仕事と、実装する仕事と、検証する仕事を一つの曖昧なAgentへ押し込まない

ことです。

Workflowがあることで、現在地と次の遷移条件を外に出せます。

## Skill — 再利用する能力と判断手順を持つ

Skillは、特定の仕事をどう進めるかという再利用可能な能力です。

たとえば、Contextをまとめる、Reviewする、Handoffする、といった仕事には、それぞれ繰り返し使う手順や判断基準があります。

それらを会話のたびに即興で説明するのではなく、Skillとして持つことで再利用します。

ただしSkillは、最終的なAuthorityそのものではありません。

「この手順でレビューできる」と「この変更を承認してよい」は別です。

## Agent — 役割を持って実行する

Agentは、Planner、Implementer、Reviewerなど、役割を持つ実行者です。

ここで重要なのは、

```text
Model ≠ Role
```

ということです。

同じモデルでもPlannerとして動く場合とReviewerとして動く場合では、見るべき入力、許される操作、期待する出力が違います。

役割を分けることで、「誰が何をしたか」を追いやすくなります。

## Gate — 次へ進める条件を持つ

Gateは、PlanGateの名前にもなっている中心要素です。

Gateが見るのは、単に「前の作業が終わったか」ではありません。

- 必要なArtifactがあるか
- Reviewが終わっているか
- Approvalが成立しているか
- 重要な不一致が残っていないか

など、**次へ進める条件**です。

ここで止められるからこそ、その後のExecutionをより自律的に任せられます。

## Artifact — 状態と判断材料を外に残す

Plan、todo、test-cases、approval、review、status、handoffなどは、仕事の状態や判断材料を会話の外へ出します。

Artifactがあることで、

- セッションを跨ぐ
- 別Agentへ渡す
- Reviewし直す
- 後から何を根拠に進んだか確認する

ことができます。

ただし、すべてを一つの巨大なArtifactへ集約するわけではありません。

何の正本なのかによって、所有するArtifactを分けます。これは次章で扱います。

## Hook — お願いを機械的な制約へ近づける

Promptで、

> 承認されるまでコードを書かないでください

と指示することはできます。

しかし、それは規範です。

Hookは、その規範を実行時の検査へ近づけます。

たとえば、

- Planが存在するか
- C-3承認があるか
- 承認後にPlanが変わっていないか
- scope外の変更ではないか

などを実行時に検査します。

ただし、Hookが存在するだけで正しく守れているとは限りません。linked worktreeで境界が外れた事例や、文字列近似で安全なコマンドまでblockした事例もありました。

そのためHook自体も、後半では検証対象になります。

## Governance Harnessとして見ると何が変わるか

PlanGateをPluginとしてだけ見ると、問いはこうなります。

> どうインストールするか。

Governance Harnessとして見ると、問いが変わります。

> どのArtifactを正本にするか。  
> どこにGateを置くか。  
> どこまでAgentへ実行させるか。  
> 何をHookで強制するか。  
> どのEvidenceを見て、誰が判断するか。

この問いの方が、モデルやツールが変わっても残ります。

## 一般論とPlanGateの設計を混ぜない

ここで説明したWorkflow / Skill / Agent / Gate / Artifact / Hookという分け方は、PlanGateを理解するための整理です。

AIエージェント開発全体で唯一の正しい分類だと主張するものではありません。

Harness Engineeringという広い考え方を、PlanGateが自分のPBI単位ワークフローへどう落としているか。その具体化として読んでください。

Sources:
- https://github.com/s977043/PlanGate
- https://github.com/s977043/PlanGate/blob/main/docs/pages/explanation/product/philosophy.md
- https://github.com/s977043/PlanGate/blob/main/docs/pages/reference/glossary.md

## この章で持ち帰ること

PlanGateはPluginとして配布されますが、設計対象はPluginより広いです。

> **Workflowで順序を作り、SkillとAgentへ責務を分け、Artifactへ状態を出し、Gateで遷移を判断し、必要な境界をHookで強制する。**

この組み合わせを、PlanGateではGovernance Harnessとして扱います。

次章では、その中でも長時間実行や複数Agentで重要になる、**「会話ではなく何を正本にするか」**を詳しく見ます。
