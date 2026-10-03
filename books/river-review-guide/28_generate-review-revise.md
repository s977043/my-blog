# generate → review → reviseをどう収束させるか

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

返すのは、

- Finding
- decision
- reviewCoverage
- suggestedLoopSignal
- run diff
- oscillation情報

などの判断材料です。

反復・停止・エスカレーションを実行するのはcallerです。

## suggestedLoopSignal

現行のLoop Convergence Contractでは、単一runから次のようなsignalを導出できます。

| Signal | 意味 |
| --- | --- |
| NO_SIGNAL | 次動作を特定できない |
| REVISE_REQUIRED | blocking Findingがある |
| CONVERGED | blocking Findingがなく収束候補 |
| ESCALATE_HUMAN | 人間判断が必要 |

signalの導出自体は決定論的です。

## CONVERGEDだけで止めないケース

Review Coverageがpartial / not_executedなら、blocking Findingが0件でも「レビュー完遂後の0件」とは言えません。

そのためsaved run比較では、不完全CoverageのCONVERGEDをそのまま停止根拠にしない設計があります。

ここで第5部の話がつながります。

~~~text
0 findings
  +
complete review
  → convergence evidence

0 findings
  +
partial review
  → insufficient evidence
~~~

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

## Layer 3はcallerが持つ

River Reviewが意図的に出さない停止条件もあります。

たとえば、

- max iterations
- cost budget
- deadline
- team policy
- mandatory HITL label

です。

これらは外部Policyなのでcallerが持ちます。

~~~text
River Review
  = review evidence + loop signals

Caller
  = execution policy + authority
~~~

この境界を崩さないことが重要です。

## この章で持ち帰ること

自己修正loopを安全にするには、「何回まで」だけでなく、**どのEvidenceなら収束とみなせるか**を設計します。

River Reviewはその材料を返しますが、最終的なLoop Authorityはcaller側に残します。

次の第7部では、この仕組みをチームへどう段階導入するかを扱います。

### Sources

- [Loop Convergence Contract](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
- [Generate Review Revise Loop](https://github.com/s977043/river-review/blob/main/docs/ai/generate-review-revise-loop.md)
