# 全部入れない — Level 1から段階導入する

> Draft. Governanceは機能数ではなく、いま必要な境界から始める。

## Level 1: Plan Approval

最初は「実装前にPlanを見て承認する」だけでよい。

## Level 2: + Handoff

## Level 3: + Hooks / Validate

## Level 4: + Metrics / Outcome Review

## Level 5: + Eval / Timeline

## レベルを上げるトリガー

- 同じ失敗が繰り返される
- 手作業の確認がボトルネックになる
- 複数Agent / 長時間実行へ広がる
- 「守れているつもり」を検証したくなる

## PlanGateを使わない方がよいケース

- 短時間で捨てるprototype
- Notebook等の探索
- inline completion中心の低レイテンシ用途
- Human approvalを意図的に持たない完全自律系
- Governance costが変更リスクを上回る小さな作業

## Takeaway

導入の成功条件はLevel 5へ到達することではなく、必要な境界だけが機能していること。
