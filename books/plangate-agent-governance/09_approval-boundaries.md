# Approval Boundaryを置く

> Draft. Planがあることと、実行してよいことを分離する。

## Review済みとApprovedは違う

## C-1 Self Review

## C-2 Independent Review

## C-3 Human Judgment

## APPROVE / CONDITIONAL / REJECT

## 承認後にPlanが変わったらどうするか

## Primary Evidence

- PlanGate README / docs: C-1 Self Review、C-2 External Review、C-3 Human Judgmentを別責務として定義
- Plan承認後の変更はplan hashなどで検出し、「承認済みの何を実行しているか」を追跡する
- Hardening Overrideやhigh-risk / criticalはHuman-ownedの境界を残す

Evidence type: **Verified**

Source:
- https://github.com/s977043/PlanGate
- https://github.com/s977043/PlanGate/blob/main/docs/plangate.md
