# Hookで「お願い」を「制約」に変える

> Draft. Prompt上のルールとmechanical enforcementの違いを扱う。

## 「承認前に実装しないで」の限界

## Hook Enforcement

## Scope Guard

## Approval Guard

## Destructive Operation Guard

## Guard自体も壊れる

## Bypassと監査

## Primary Evidence

- PlanGate #1277: linked worktree配下ではHardening Override判定が外れ、規範上は禁止でも技術層では止められない経路が残っていた
- PlanGate #1326: 破壊的git操作の検出を文字列で近似した結果、実行されない文字列や別コマンドの `--force` までblockした
- 「Hookがある」ではなく、positive / negative controlで実際の境界を検証する必要がある

Evidence type: **Observed + Verified**

Sources:
- https://github.com/s977043/PlanGate/issues/1277
- https://github.com/s977043/PlanGate/issues/1326
