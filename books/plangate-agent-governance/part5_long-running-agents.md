---
title: "第5部 長時間・複数Agentへ拡張する"
---

単一Agent・短時間の作業なら、会話履歴だけでも何とか進められることがあります。

しかし、

- セッションが長くなる
- モデル / runtime / ワーカーを切り替える
- BuilderからReviewerへ渡す
- 複数Agentで役割分担する
- PR作成後もCI / review修復を続ける

ようになると、「同じ会話を持ち越す」だけでは状態管理が不安定になります。

この部では、スケールさせるときに必要な3つの境界を扱います。

1. **Context Boundary** — 次の主体へ何を渡すか
2. **Review Boundary** — 独立Reviewerへ何を渡さないか
3. **Delivery Boundary** — AIの責務をどこまで伸ばすか

ポイントは、Agentを増やすことではありません。

> **主体が変わっても、現在の状態・判断根拠・責任境界が崩れないようにすること。**

です。


## Agentを増やす前に、責務を増やす理由があるかを見る

複数Agentは、それ自体が品質向上ではありません。

Agentを増やすと、

- handoff
- context packaging
- state synchronization
- conflict resolution
- duplicate exploration

のコストも増えます。

PlanGateのai-loop V2でも、Graphはcoordination complexityが必要な場所にだけ導入する考え方です。

この部では「複数Agentを使うべき」とは置きません。

> **責務を分離する価値が、調整コストを上回るときだけAgentを増やす。**

を前提にします。

## 横断原則 — Identityをbindする

主体が増えるほど、「何を見ているか」の同一性が重要になります。

最低限、次を曖昧にしません。

| 対象 | Identityの例 |
| --- | --- |
| Task / Intent | タスクid / context_ref |
| Approved Plan | plan_hash |
| Exact Context | snapshot_ref |
| Implementation | commit SHA / PR head |
| Verification | 対象commit + コマンド + timestamp |
| Review | 対象diff / commit + review artifact |

Handoff、Review、Deliveryのどこでも、

> **どの対象に対する判断かをbindする。**

これを横断原則として扱います。
