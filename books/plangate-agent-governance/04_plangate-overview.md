# PlanGateの全体像

> Draft. 詳細へ入る前に、PlanGate全体の地図と「やらないこと」を渡す。

## PlanGateが解こうとしている問題

AIがコードを書けることと、その変更を実行してよいことは別です。PlanGateは、実装能力そのものより、実行前後の判断境界を扱います。

## 全体フロー

```text
Requirement
  ↓
Plan
  ↓
Review
  ↓
Approval
  ↓
Execution
  ↓
Verification
  ↓
PR
  ↓
Human Judgment
```

## C-3とC-4

- C-3: Planを実行してよいか
- C-4: PRを最終的に受け入れてよいか

## PlanGateがやらないこと

- Scrumやリファインメントそのものを置き換えない
- 完全自律Agentを最終目標にしない
- すべてのタスクへ最大構成のGateを強制しない
- 「AIレビューが通った」ことをHuman Judgmentの代替にしない
- 短時間のthrowaway prototypeまで重いworkflowへ載せない

## この本で見る範囲

本書はPlanの書式を細かく解説する本ではなく、Planを含むArtifactが、Gate / Verification / Handoff / Deliveryの中でどう使われるかを扱います。

## 以降の章の読み方
