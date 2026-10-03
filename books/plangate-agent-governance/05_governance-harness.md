# PlanGateは「Plugin」よりGovernance Harnessとして見る

PlanGateはClaude CodeやCodexから使えます。

そのため、最初に触れたときは「AIコーディング用Plugin」と理解するのが自然です。

実際、配布や導入の入口としてPluginは重要です。

ただ、PlanGateが設計している対象を理解するには、Pluginという言葉だけでは足りません。

PlanGate自身は現在、**AIコーディングエージェントのためのガバナンス優先ワークフローハーネス**と位置づけています。これはPlanGateが自分の設計対象を説明するために使っている位置づけであり、「Governance Harness」という業界標準カテゴリへの準拠を主張するものではありません。

この章では、「Governance Harness」という言葉を3つの層へ分けて見ます。

```text
1. 仕事の流れを作る
2. 状態と証拠を外に残す
3. 次へ進める境界を制御する
```

## Pluginは「届け方」であって、全体の責務ではない

Pluginとしてできるのは、SkillやAgent、Commandなどを利用環境へ届けることです。

しかしPlanGateでは、それだけで安全な実行境界が完成するわけではありません。

Planや承認Artifactが必要です。Verificationの結果も必要です。Hookを使う場合は、その配線自体も必要になります。

つまり、

```text
Pluginを入れた
    ≠
Governanceが成立した
```

です。

この違いは、後半で扱うFalse Greenにもつながります。

## 1. 仕事の流れを作る — Workflow / Skill / Agent

最初の層は、「誰が、どの順番で、何をするか」です。

### Workflow — 仕事の順序

Workflowは、次に何をするかを定義します。

現行PlanGateでは、要求を広げ、設計し、実装し、検証して引き継ぐ流れをWF-01〜WF-05として持っています。

重要なのは番号ではありません。

> 要求を考える仕事、実装する仕事、検証する仕事を、一つの曖昧な処理にまとめない。

ことです。

### Skill — 再利用する手順

Skillは、特定の仕事をどう進めるかという再利用可能な手順や判断基準です。

Contextをまとめる、Reviewする、Handoffする、といった仕事を毎回ゼロから説明せず、繰り返し使える形にします。

ただしSkillはAuthorityそのものではありません。

「この手順でレビューできる」と「この変更を承認してよい」は別です。

### Agent — 役割を持つ実行者

Agentは、Planner、Implementer、Reviewerなど、役割を持って仕事を実行します。

ここで大切なのは、モデル名と役割を同一視しないことです。

同じモデルでも、PlannerとReviewerでは入力、許される操作、期待する出力が違います。

```text
Workflow = 仕事の順番
Skill    = 再利用する手順
Agent    = その役割を実行する主体
```

です。

## 2. 状態と証拠を外に残す — Artifact

次の層は、「今どこにいて、何を根拠に進んでいるか」です。

Plan、todo、test-cases、approval、review、current state、handoff、evidenceなどを、会話の外に残します。

これにより、

- セッションを跨ぐ
- 別Agentへ渡す
- Reviewし直す
- 後から何を根拠に進んだか確認する

ことができます。

Artifactは、Workflowを実際の状態へ結びつける層です。

```text
Workflowだけ
→ 「次はReview」のような理想的な順序

Artifactがある
→ 「このPlanをReview済み」「このEvidenceまで取得済み」
```

という違いがあります。

何を正本にするかは次章で扱います。

## 3. 次へ進める境界を制御する — Gate / Hook

最後の層は、「条件を満たしていなければどうするか」です。

### Gate — 次へ進める条件

Gateは、

- 必要なArtifactがあるか
- Reviewが終わっているか
- Approvalが成立しているか
- 重大な不一致が残っていないか

などを見て、次の工程へ進めるかを判断します。

Gateがあることで、

```text
今は実装できる
```

と、

```text
今は実装してよい
```

を分けられます。

### Hook — ルールを実行時検査へ近づける

Promptで、

> 承認されるまでコードを書かないでください

と指示することはできます。

ただし、それは規範です。

Hookは、その規範を実行時の検査へ近づけます。

たとえばPlanの存在、承認状態、承認後のPlan変更、scope外変更などを検査できます。

ただし、Hookがあるだけで安全とは限りません。

linked worktreeで境界が外れた事例や、安全なcommandを誤ってblockした事例もありました。だからHook自身も、後半では検証対象になります。

```text
Gate = 進める条件
Hook = 条件を機械的に確かめる手段の一つ
```

であり、同じものではありません。

## 3つの層で見る

ここまでをまとめると、PlanGateは次のように見られます。

| 層 | 問い | 主な構成要素 |
| --- | --- | --- |
| 仕事 | 誰が、何を、どの順番で行うか | Workflow / Skill / Agent |
| 状態 | 今どこにいて、何を根拠に進むか | Artifact / Evidence |
| 制御 | 次へ進める条件は何か | Gate / Hook |

この3つが分かれているから、モデルやツールが変わっても設計を残せます。

## 先ほどのタスクを3層で見る

前章の「注文一覧APIにstatus絞り込みを追加する」という架空例を、この3層で見ると次のようになります。

| 層 | このタスクで起きること |
| --- | --- |
| 仕事 | Plannerが範囲を整理し、Implementerが実装し、Reviewerが確認する |
| 状態 | Planに「schema変更なし」、test-casesに正常系・不正値・pagination併用を残す |
| 制御 | schema変更が必要になったらGateで止まり、scope変更の判断へ戻す |

Plugin、Agent、Hookをたくさん入れることが本質なのではありません。

**仕事・状態・制御の3つが、そのタスクに必要な強さでつながっていること**が重要です。

## Governance Harnessとして見ると問いが変わる

PlanGateをPluginとしてだけ見ると、問いはこうなります。

> どうインストールするか。

Governance Harnessとして見ると、問いが変わります。

> どの仕事を分けるか。  
> どの状態を成果物として残すか。  
> どの条件で次へ進めるか。  
> 何を機械的に強制するか。  
> 誰に最終判断を残すか。

この問いの方が、PlanGateの設計対象に近いです。

## 一般論とPlanGateの設計を混ぜない

ここで説明した3層やWorkflow / Skill / Agent / Gate / Artifact / Hookという分け方は、PlanGateを理解するための整理です。

AIエージェント開発全体で唯一の正しい分類だと主張するものではありません。

Harness Engineeringという広い考え方を、PlanGateがPBI単位の開発ワークフローへどう具体化しているか。その一例として読んでください。

Sources:
- https://github.com/s977043/PlanGate
- https://github.com/s977043/PlanGate/blob/main/docs/pages/explanation/product/philosophy.md
- https://github.com/s977043/PlanGate/blob/main/docs/pages/reference/glossary.md

## この章で持ち帰ること

PlanGateはPluginとして配布されますが、設計対象はPluginより広いです。

> **仕事の流れを作り、状態と証拠を外に残し、次へ進める境界を制御する。**

Workflow / Skill / Agent / Artifact / Gate / Hookは、そのための役割分担です。

次章では、「状態を外に残す」の中身をもう一段詳しく見ます。
