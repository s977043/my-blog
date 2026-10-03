# AIの責務をPR作成で終わらせず、MERGE_READYまで伸ばす

実装が終わり、テストも通り、PRを作った。

ここでAIの仕事は終わりでしょうか。

実運用では、PR作成後にも仕事が残ります。

- CIが落ちる
- Reviewerから指摘が来る
- repairしたら別のtestが落ちる
- branchが進んでconflictする
- Evidenceが古くなる

「PRを作りました」でAgentが止まると、ここから人間がDelivery作業を引き取ることになります。

PlanGateのai-loopでは、AI側の責務をさらに先へ伸ばそうとしています。

## PR作成とDelivery完了を分ける

PRを作ったことは重要なmilestoneです。

しかし、

~~~text
PR_CREATED
    ≠
MERGE_READY
~~~

です。

PR作成後にCI / review / repairを収束させる工程を、Deliveryの一部として扱います。

現在のmain / v8.23.0候補では、ai-loop V2の最初のvertical sliceとしてowner-backed Delivery runtimeが導入されています。

Changelog上ではまだv8.23.0はTBDなので、本章ではこの設計を「現在mainにある進行中のV2実装」として扱います。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/changelog.md

## 1つのDelivery loopで見る

前の章まで使ってきた「注文一覧APIにstatus絞り込みを追加する」例で考えます。

PRを作ったあとにCIで1件失敗し、Reviewerから1件major指摘が来たとします。

~~~text
PR_CREATED
  ↓
checksを取得
  ↓
test FAILをEvidence化
  ↓
root causeを調査
  ↓
Plan内repair
  ↓
Fresh Verification
  ↓
PR更新
  ↓
Review findingを取得
  ↓
Plan内repair
  ↓
Fresh Verification
  ↓
checks / findings / stateを再照合
  ↓
MERGE_READY
~~~

途中で、

> status filterには実はschema migrationが必要

と分かったなら、repairを続けずRe-plan / Escalateへ戻ります。

つまりDelivery loopは、

> **何が何でもgreenになるまで直し続けるloop**

ではありません。

第4部の Continue / Stop / Escalate Policyを、PR作成後にも適用するloopです。

## PR_CONVERGINGという途中状態

ai-loop V2 taxonomyでは、PR作成後の収束を `PR_CONVERGING` というLifecycle Stateで表します。

この中には、

- checks待ち
- checks failure
- review repair
- conflict解消
- merge-ready candidate

などの内部状態を含められます。

大事なのは、

> **PRが存在することと、Delivery契約を満たしたことを別にする。**

ことです。

## CI failureは「人間へ返す理由」ではない

CIが落ちたとき、すぐ人間へhandoffする必要はありません。

たとえば、

- lint failure
- test failure
- generated artifact drift
- type error

など、root causeを調べて承認済みPlan内でrepairできるなら、前章のContinue Policyに従ってAIが修正できます。

~~~text
CI FAIL
  ↓
failureをEvidence化
  ↓
root cause
  ↓
Planはまだ有効？
  ├─ Yes → repair → re-verify
  └─ No  → Re-plan / Escalate
~~~

これにより、人間の仕事を「CIの赤を直す人」から外せます。

## Review repairも同じloopへ入れる

Reviewerから指摘が来た場合も、

1. findingを取得
2. severity / classを確認
3. Plan内repairか判断
4. 修正
5. Fresh Verification
6. 再review / reconcile

と進められます。

ここでも大切なのは、修正後に以前のEvidenceを使い回さないことです。

repairは成果物を変えるので、必要なVerificationを更新します。

## Reconcileは「全部green」を見るだけではない

複数のsignalがあると、状態の食い違いが起きます。

たとえば、

- GitHub checksはgreen
- local Evidenceはstale
- review findingは未解決
- RunStateはrepair中のまま

かもしれません。

この状態で「CIがgreenだから成功」とすると、別の正本が取り残されます。

V2では、Lifecycle State、Terminal Outcome、Stop Reason、Policy Verdictを分離し、異なる意味を一つのstatusへ詰め込まない設計になっています。

この分離は、長時間Deliveryで特に重要です。

## MERGE_READYはAI側の正常終端

現行V2 taxonomyでは、`MERGE_READY` はDelivery RunのTerminal Outcomeです。

意味は、

> Delivery契約を満たし、C-4 / mergeをHumanへ渡せる状態。

です。

ここで重要なのが、

~~~text
MERGE_READY
    ≠
MERGED
~~~

という境界です。

AIは、

- 実装
- Verification
- PR作成
- CI収束
- Review repair
- Evidence準備

まで進められます。

しかしC-4 / mergeはそのDelivery Runの外に置かれ、Human-ownedです。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/taxonomy.md
- https://github.com/s977043/PlanGate/blob/main/docs/ai/core-contract.md

## owner-backedという考え方

現在mainのV2 Delivery runtimeでは、RunEvent / RunEvidence / RunStateなどのownershipを分離する方向で実装されています。

ここで重要なのは、名前そのものではありません。

> **誰がそのstateを書き、誰がEvidenceを作り、誰がdecisionを導出するかを分ける。**

ことです。

長時間loopでは、一つの巨大なAgentが「今の状態も、自分の成功判定も、最終結果も全部決める」と、自己申告へ戻ってしまいます。

State、Evidence、Decisionのownerを分けることで、長時間実行でも判断根拠を追いやすくします。

## Deliveryを伸ばしてもAuthorityは伸ばしすぎない

AIの責務をMERGE_READYまで伸ばすことは、AIのAuthorityをmergeまで伸ばすことではありません。

これは第12章の原則そのものです。

~~~text
Autonomy
PR作成後のrepairまで広げる

Authority
C-4 / mergeはHuman-ownedのまま
~~~

つまり、

> **AIの作業責務は伸ばす。最終判断権限は必要な境界に残す。**

という設計です。

## 長時間loopにはStop条件も必要

Deliveryを自律化すると、永遠にrepairを続ける危険があります。

ai-loop V2 taxonomyでは、

- NO_PROGRESS
- REPEATED_FAILURE
- OSCILLATION
- BUDGET_EXHAUSTED
- POLICY_DENIED
- VERIFIER_UNAVAILABLE

などをStop Reasonとして分離しています。

「まだ頑張れそうだから続ける」ではなく、loopを止める条件をstateとは別に持ちます。

これも長時間自律化に必要な境界です。

## 用語より「収束条件」を先に決める

V2にはRunStateやtaxonomyがありますが、読者が最初に必要なのは全enumではありません。

自分のDelivery automationで最低限決めたいのは、

- 何を取得すれば現状が分かるか
- 何なら自動repairしてよいか
- repair後に何を再検証するか
- どの状態ならMERGE_READYと言えるか
- 何が起きたらEscalate / Blockするか

です。

state machineは、その条件が増えてから導入しても構いません。

## この章で持ち帰ること

AIエージェントの責務は、コード生成やPR作成で終える必要はありません。

> **CI / Review / Repairまで自律化し、HumanにはMERGE_READYな成果物とEvidenceを渡す。**

その一方で、

> **MERGE_READYとMERGEDを分け、C-4 / merge Authorityは別に保つ。**

これがDelivery Boundaryです。

これで第5部の3つがつながりました。

~~~text
Context Boundary
→ 次の主体へ現在状態を渡す

Review Boundary
→ Builderの推論を持ち込まず独立評価する

Delivery Boundary
→ AIの責務をMERGE_READYまで伸ばす
~~~

次の第6部では、こうして作ったHarness自身が本当に機能しているかをEvalし、False Greenをどう潰すかを扱います。
