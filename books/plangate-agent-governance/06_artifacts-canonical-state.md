# 会話を正本にせず、役割ごとのArtifactへ状態を残す

AIエージェントと長く作業していると、会話には大量の情報が溜まります。

- 最初に考えた案
- 途中で捨てた案
- tool output
- 一時的な仮説
- 修正前の判断
- 最新の決定
- いま何をしているか

人間同士の会話なら「さっきの話はもう古い」と感覚的に扱えることもあります。

AIエージェントの実行状態をそこへ依存させると、何が現在の決定なのか分かりにくくなります。

PlanGate v8.23のContext Lifecycleでは、長時間セッションの状態を**会話履歴そのものではなく、canonical artifactsとevidenceの参照で引き渡す**方針を明示しています。

## 会話履歴は便利だが、正本には向かない

会話履歴には、その場の思考過程が豊富にあります。

しかし、実行状態の正本として見ると問題があります。

### 古い判断が残る

最初はA案を採用し、途中でB案へ変えたとしても、会話にはA案も残ります。

### 必要な情報とノイズが混ざる

最新のPlanを知りたいだけなのに、調査ログや失敗した試行まで読み直す必要が出ます。

### 別Agentへそのまま渡しにくい

Builderの長い会話をReviewerへそのまま渡すと、独立レビューなのにBuilderの推論へ引っ張られる可能性があります。

### セッションやRuntimeへ依存する

会話履歴が唯一の状態だと、model / runtime / workerを切り替えたときの再開条件が不安定になります。

そこでPlanGateは、重要な状態を会話から外へ出します。

## 「正本」は1ファイルではない

ここで注意したいのは、「全部を一つのcanonical.mdへ集める」という話ではないことです。

PlanGateでは関心ごとに既存の正本があります。

現行Context Lifecycleの整理では、たとえば次のようになっています。

| 知りたいこと | 主な正本・所有先 |
| --- | --- |
| 最終的な実行Plan | canonicalな `plan.md` |
| 現在のタスク位置 | `INDEX.md` + `current-state.md` |
| 重要な判断理由 | decision-log / ADR |
| 検証・レビュー結果 | evidence / report / Review Artifactへの参照 |
| session / tool handoff | local-exec-handoff |
| workerへの作業パッケージ | context-packager / dispatch |
| crash-consistent runtime state | RunState |

このBookで「Artifactを正本にする」と言うときは、**役割ごとに所有者を決め、同じ意味の正本を増やさない**という意味です。

## Plan / todo / test-casesは何を分けているのか

PlanGateの初期からあるArtifactにも役割があります。

### plan

何を、なぜ、どの設計で進めるか。

Approvalの対象になります。

### todo

Planを実行可能な仕事へ分けたもの。

現在位置や依存関係を扱いやすくします。

### test-cases

Acceptance Criteriaを、実装後に確認できる条件へ落としたもの。

Verificationの入力になります。

この3つを分けることで、

```text
何を作るか
≠
どう進めるか
≠
何をもって満たしたと確認するか
```

を混ぜずに扱えます。

## current-stateとhandoffは「次の主体」が読むためにある

長時間実行では、「今まで何を考えたか」より、「次に何をすればよいか」が重要になります。

PlanGateのContext Lifecycleでは、checkpoint時に、

- 現在のphase
- 完了済み / 実行中の仕事
- blocker
- next action
- Planからの逸脱

などを現在状態へ反映します。

そしてownerやsessionが変わるときは、既存のhandoff surfaceを使います。

つまり、Handoffは会話の要約ではなく、

> **次の主体が現在の正本から安全に再開するためのインターフェース**

として扱います。

## Fresh Contextは「全部忘れる」ことではない

v8.23では、model / runtime / workerの変更、独立reviewerの開始、worker handoffなどで、standard以上ではcheckpoint後にfresh contextから再開する方針があります。

ここでいうfresh contextは、状態を捨てることではありません。

```text
conversation / tool history
        ↓
canonical stateをcheckpoint
        ↓
必要なArtifactとEvidenceを再読込
        ↓
fresh session / fresh reviewer
```

です。

古い会話をそのまま持ち越す代わりに、**現在有効な状態を再構成して渡す**という考え方です。

この設計は、第5部のContext / Handoffでさらに詳しく扱います。

## 正本を増やしすぎると逆に壊れる

Artifactを増やせば安全になるわけではありません。

同じ情報を、

- plan.md
- checkpoint.json
- context.md
- status.md
- 別DB

へ重複して書けば、どれが最新か分からなくなります。

実際、Context Lifecycleの公開文書でも、新しいcheckpoint schemaやContext Manifest、RunStateを追加しないことを明示しています。

既存の所有者を再利用し、必要な情報は参照でつなぎます。

これは重要な設計原則です。

> **状態を外へ出す。ただし、同じ意味の正本を増やさない。**

## 会話に残してよいもの、正本へ出すもの

すべての会話を保存する必要はありません。

PlanGateのContext Lifecycleでは、raw chat transcriptやhidden reasoningを実行状態として保存しない方針を明示しています。

残すべきなのは、

- materialな事実
- 最終的な決定
- failure
- blocker
- current state
- evidenceへの安定した参照

です。

探索途中の雑談や捨てた推論まで、次のAgentへ機械的に引き継ぐ必要はありません。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/context-lifecycle.md

## この章で持ち帰ること

長時間動くAIエージェントにとって、会話履歴は便利な作業メモですが、安定した正本ではありません。

PlanGateでは、

> **重要な状態を役割ごとのArtifactへ出し、Evidenceを参照でつなぎ、次の主体は現在の正本から再開する。**

という方向へ進んでいます。

これで第2部の地図が揃いました。

- 第4章: 次へ進める条件をWorkflowとして持つ
- 第5章: Workflow / Skill / Agent / Gate / Artifact / Hookへ責務を分ける
- 第6章: 状態を会話から外へ出し、正本の所有者を分ける

次の第3部では、実装前にそのArtifactをどう作り、推測をEvidenceへ変え、Approval Boundaryへつなぐかを見ていきます。
