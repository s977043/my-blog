# 最小構成で1タスクを最後まで回す

最後に、ここまでの概念を1つのタスクで一周させます。

この章の目的は、PlanGateの全commandを覚えることではありません。

> **Plan → Evidence → Approval → Execution → Verification → Judgment**

という判断境界を、一度体験することです。

Planの詳細な書き方は既存の plangate-guide に譲ります。

## まず公式Phase 0で動作確認する

PlanGateを初めて導入したprojectなら、現行staged adoption guideはPhase 0から始めます。

~~~text
bin/plangate init TASK-XXXX
↓
小さな変更を完了
↓
bin/plangate doctor
~~~

ultra-lightなのでPlanやC-3は必須ではありません。

最初からGovernance全体を試すより、

> **このprojectでPlanGateを使うこと自体が成立するか。**

を確認します。

plugin-onlyならCLIなしのLevel 0からでも構いません。

この段階が通ったあと、Bookで扱ってきた判断境界を最小構成で一周します。

## ここからは「本書の演習」であり、公式Phase名ではない

このあと行う最小Governance Loopは、PlanGate公式の新しいPhaseを定義するものではありません。

公式Phase 0はultra-lightです。

一方、このBookでは中心概念を一周するために、Plan / Review / Approval / Verificationまで意図的に使います。

そのため、この演習は現行staged adoptionの感覚ではPhase 1〜2の要素をまたぎます。

目的はPhase番号を再定義することではなく、

> **判断境界を一度、小さなtaskで体験すること。**

です。

## 題材は「小さく、外から確認できるもの」にする

最初のGovernance Loopに向くタスクは、

- scopeが狭い
- 戻しやすい
- Acceptance Criteriaを書ける
- 結果をtestや画面から確認できる
- schema / security / destructive変更を含まない

ものです。

前章まで使ってきた架空例を続けます。

> **注文一覧APIにstatus絞り込みを追加する。**

今回は、

- DB schema変更なし
- status定義変更なし
- public APIの追加parameterのみ
- rollbackしやすい

という前提にします。

## Step 1 — Requirementを判断可能な形にする

最初に必要なのは長い仕様書ではありません。

最低限、

~~~text
Why
注文一覧から特定statusだけ取得したい

In Scope
- GET /orders の status query parameter
- valid / invalid status
- pagination併用

Out of Scope
- DB schema変更
- status定義変更
- UI変更

Acceptance
- valid statusで対象だけ返る
- invalid statusは400
- paginationと併用できる
~~~

を用意します。

重要なのは実装方法よりBoundaryです。

## Step 2 — UnknownをEvidenceへ変える

Planを書く前後で、判断を変えうるUnknownを確認します。

たとえば、

- 既存status enumはどこにあるか
- query parameter validationの既存patternはあるか
- pagination testはどこにあるか
- DB schema変更なしで実装できるか

です。

~~~text
Unknown
DB schema変更が必要か

Verification
existing schema / model / query実装を確認

Evidence
既存status fieldでfilter可能
~~~

とできれば、Out of Scopeの「schema変更なし」を支える材料になります。

確認した結果、migrationが必要ならここでPlanを変えます。

実装中まで持ち越しません。

## Step 3 — PlanをReviewする

Planは、

- Scope
- Acceptance
- Risks
- Unknownの解消状況
- Verification方法

を見てReviewします。

Self Reviewだけでも構いません。

独立Reviewが必要なのは、riskやblind spotのコストが上がったときです。

最初の1タスクからAgentを増やすことは目的ではありません。

ここでReviewがPASSしても、まだExecution Authorityを渡したとは扱いません。

## Step 4 — Approvalを別の判断として置く

ここで、

> **このPlanなら実装へ進めてよいか。**

を判断します。

最小構成なら、人間がPlanを読み、

- APPROVE
- CONDITIONAL
- REJECT

のどれかを明示するだけでも、Reviewとの違いを体験できます。

CLI / C-3を導入しているなら、現行PlanGateのapproval artifactへbindできます。

重要なのはcommandそのものではなく、

~~~text
Review
= 問題を探した

Approval
= このPlanへExecution Authorityを渡した
~~~

を分けることです。

## Step 5 — Approved Boundaryの内側だけExecutionする

実装中は、第4部のPolicyを使います。

### Continue

- 承認scope内
- risk不変
- Plan前提が有効

ならAIが進めます。

### Stop

- 未承認
- forbidden boundary
- deterministic Guard違反

なら止まります。

### Escalate

- schema変更が必要になった
- Acceptanceを変えたい
- 新しいsecurity riskが出た

ならRe-plan / Approvalへ戻ります。

このルールがあると、細かな実装判断はAIへ任せつつ、承認の意味が変わるところだけ人間へ戻せます。

## Step 6 — Fresh Evidenceを取る

実装後は、AIの「完了しました」では閉じません。

Acceptanceに対応するVerificationを実行します。

~~~text
AC-1 valid status
→ PASS

AC-2 invalid status
→ PASS

AC-3 pagination併用
→ PASS
~~~

さらに必要なlint / unit testなどを実行します。

Review repairを入れたなら、Evidenceを更新します。

古いHEADに対するgreenをそのまま使わないことが重要です。

## Step 7 — Handoffは必要な分だけ残す

一人・短時間で終わるなら、重いhandoffは不要かもしれません。

しかしsessionを跨ぐ、Reviewerへ渡す、PR後もDeliveryを続けるなら、

- current state
- completed work
- unresolved item
- next action
- Evidence refs
- current commit / PR identity

を残します。

「何を考えたか」ではなく、

> **次の主体が現在状態から再開できるか。**

で十分です。

## Step 8 — 最後のJudgmentを分ける

VerificationがPASSしても、

~~~text
PASS
≠
merge
~~~

です。

最後に、

- scopeは守られたか
- Acceptanceは満たされたか
- unresolved riskは許容できるか
- 今この変更を入れるか

を判断します。

PlanGateのDeliveryまで自動化しているなら、AIはMERGE_READYまで持っていけます。

それでも、

~~~text
MERGE_READY
≠
MERGED
~~~

です。

最終Authorityは別のBoundaryとして扱います。

## 1周したら、何が重かったかを見る

この1タスクのあとに、機能を追加する前に振り返ります。

### Planが重かった

taskが小さすぎるかもしれません。light / ultra-lightへ下げます。

### Approval待ちが長かった

Approval対象を狭くできないか。低リスク領域を明示委譲できないかを見ます。

### 同じscope逸脱が起きた

Hook / deterministic checkの候補です。

### session切替で迷った

Handoff / Current Stateを強くします。

### ReviewerがBuilderと同じ前提を繰り返した

Fresh Context / Review Packageを検討します。

### CI repairで人間が引き取った

Delivery loopをMERGE_READYまで伸ばす候補です。

### Guardが本当に効いているか不安

Eval / positive-negative controlを導入します。

つまり、

> **次に何を導入するかは、最初の1周で観測したfailureから決める。**

ということです。

## 「何も追加しない」も成功である

1タスク回してみて、

- Planだけで十分だった
- 手動Approvalで困らなかった
- Hookはいらなかった
- Multi-agentも不要だった

なら、その状態で止めて構いません。

PlanGateの導入度を上げることは目的ではありません。

> **必要なBoundaryが、必要な強さで存在すること。**

が目的です。

## 最初の1周では「追加しないもの」も決める

最小構成を守るため、最初の1タスクでは原則として次を先回り導入しません。

- multi-agent orchestration
- full strict Hook set
- Metrics dashboard
- Harness Eval / Ratchet
- PR後の完全自動Delivery loop

もちろん、既に必要性が分かっているprojectでは例外です。

ただ、まだfailureを観測していないなら、まずBoundary / Evidence / Approval / Verificationの一周から始めます。

**導入しないものを明示することも、Scope管理です。**

## 明日やるなら、この7項目だけ

このBookを読み終えて、明日1つ試すなら次だけで十分です。

- [ ] 小さく、戻しやすいタスクを1つ選ぶ
- [ ] In Scope / Out of Scope / Acceptanceを書く
- [ ] 判断を変えそうなUnknownを1つ実測する
- [ ] PlanのReviewとApprovalを別の行為にする
- [ ] 実装中のContinue / Stop / Escalate条件を決める
- [ ] 現在HEADへFresh Verificationを実行する
- [ ] 終了後、「次に何を足す必要があったか」を1つだけ振り返る

これで十分です。

## 最小Governance Loop

このBook全体を最小形へ圧縮すると、次の7段階になります。

~~~text
1. Boundary
   何を任せてよいか決める

2. Evidence
   判断を変える前提を確認する

3. Approval
   Execution Authorityを渡す

4. Execute
   Boundary内は自律的に進める

5. Verify
   現在の成果物へFresh Evidenceを取る

6. Escalate
   承認の意味が変われば戻る

7. Judge
   最終Authorityを別に置く
~~~

ここまで一度体験すれば、HookやAgentの数を知らなくても、PlanGateの中心思想は使えます。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/staged-adoption-guide.md
- https://github.com/s977043/PlanGate/blob/main/docs/plugin-only-adoption.md
- https://github.com/s977043/PlanGate/blob/main/docs/plangate.md

## この章で持ち帰ること

最初のゴールは、PlanGateを完全導入することではありません。

> **1つの小さな仕事で、判断境界を一周し、どこに次の摩擦があるか観測する。**

ことです。

そこから必要なものだけ追加します。

これで本文の7部・18章を一周しました。

付録では用語と典型的な失敗を短く参照できる形に整理します。