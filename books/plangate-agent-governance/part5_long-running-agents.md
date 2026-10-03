# 第5部 長時間・複数Agentへ拡張する

単一Agent・短時間の作業なら、会話履歴だけでも何とか進められることがあります。

しかし、

- セッションが長くなる
- model / runtime / workerを切り替える
- BuilderからReviewerへ渡す
- 複数Agentで役割分担する
- PR作成後もCI / review repairを続ける

ようになると、「同じ会話を持ち越す」だけでは状態管理が不安定になります。

この部では、スケールさせるときに必要な3つの境界を扱います。

1. **Context Boundary** — 次の主体へ何を渡すか
2. **Review Boundary** — 独立Reviewerへ何を渡さないか
3. **Delivery Boundary** — AIの責務をどこまで伸ばすか

ポイントは、Agentを増やすことではありません。

> **主体が変わっても、現在の状態・判断根拠・責任境界が崩れないようにすること。**

です。
