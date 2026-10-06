---
title: "Generate → Review → Reviseをどう収束させるか"
---

AIエージェントに修正まで任せると、次のループができます。

~~~text
Generate
   ↓
Review
   ↓
Revise
   └────→ Review
~~~

ここで新しい問題が出ます。

> **いつ止めるのか。**

## River ReviewはReview Stageを担当する

River Reviewはloop全体のorchestratorではありません。

返すのはFinding、decision、Review Coverage、suggestedLoopSignal、run diff、oscillation情報などの**判定材料**です。

反復・停止・エスカレーションを実行するのはCallerです。

## Layer 1: 単一runからのsignal

現行のLoop Convergence Contractでは、単一runから次のようなsignalを導出できます。

| Signal | 意味 |
| --- | --- |
| NO_SIGNAL | 次動作を特定できない |
| REVISE_REQUIRED | blocking Findingがある |
| CONVERGED | blocking Findingがなく収束候補 |
| ESCALATE_HUMAN | 人間判断が必要 |

ただし、これは**提案signal**です。

外部のポリシーや実行Authorityを置き換えません。

## Layer 2: 保存runで収束Evidenceを検証する

saved runを比較すると、単一runだけでは分からない情報を使えます。

特に現在のcontractでは、最新runのReview Coverageが `partial` / `not_executed` の場合、`CONVERGED` を `NO_SIGNAL` へ降格します。

さらに、LLMを一度も実行していないsaved runは `llmNotExecuted: true` として扱われ、同じく収束Evidenceとして弱められます。

~~~text
0 blocking findings
  +
complete semantic review
  → convergence evidence

0 blocking findings
  +
partial review / LLM not executed
  → not enough evidence to stop
~~~

Coverageの使われ方は2つに分かれます。このqualificationは、保存した複数回の実行結果を比べる収束判定（saved-run diff）では既定で使われます。一方、Coverage不足やLLM未実行を理由にReview ArtifactのGate自体を止めるのは、明示的に有効化（opt-in）した場合だけです。Loop signalとGateは、同じsurfaceではありません。

## 振動も止める理由になる

自動修正loopでは、

~~~text
Aを直す
  ↓
Bが壊れる
  ↓
Bを直す
  ↓
Aが戻る
~~~

という振動が起こることがあります。

run historyを比較し、Findingが消えて再出現するpatternを検出できれば、無限修正よりHuman Escalationを選べます。

ただし、不完全なrunでFindingが一時的に消えただけなら、本当の振動とは限りません。現行contractではCoverageもこの判定に使います。

## Layer 3: Callerが持つ停止ポリシー

River Reviewが意図的に所有しない停止条件があります。

- max iterations
- cost budget
- deadline
- team policy
- mandatory HITL label

これらはCallerが持つ外部のポリシーです。

特に、不完全なreviewが続く環境では `CONVERGED` に到達しない可能性があります。そのためCallerは **STOP_MAX_ITERATIONSのような上限側の停止条件を必ず併用**する必要があります。

~~~text
River Review
  = review evidence + loop signals

Caller
  = execution policy + authority
~~~

## この章で持ち帰ること

自己修正loopを安全にするには、「何回まで」だけでなく、**どのEvidenceなら収束とみなせるか**を設計します。

River ReviewはReview StageのEvidenceを返しますが、最終的なLoop AuthorityはCaller側に残します。

次の第7部では、この仕組みをチームへどう段階導入するかを扱います。

### Sources

- [Loop Convergence Contract](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
- [Review Coverage Contract](https://github.com/s977043/river-review/blob/main/docs/development/review-coverage-contract.md)
- [Generate Review Revise Loop](https://github.com/s977043/river-review/blob/main/docs/ai/generate-review-revise-loop.md)
