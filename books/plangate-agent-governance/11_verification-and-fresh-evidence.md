# 「完了しました」ではなくFresh Evidenceで判定する

> Draft. AIの完了宣言ではなく、現在の成果物に対する最新の検証証拠を要求する。

## NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

## VerificationはReviewとは違う

ここでは「改善余地があるか」ではなく、定義済みの条件を満たしているかを確かめる。

## L-0

## V-1 Acceptance Verification

## V-2 Optimization

## V-3 Independent Review

## V-4 Release Check

## Evidenceが古くなる瞬間

- コードが変わった
- dependency / generated artifactが変わった
- 別branch / worktreeへ移った
- repair後に再検証していない

## Primary Evidence

- PlanGateのIron Law: `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`
- verificationは「一度通った」ことではなく、現在の成果物に対するfreshな証拠で判定する
- stale artifact verificationをsuccessとして扱わない設計はai-loop V2のDecision coreにも引き継がれている

Evidence type: **Verified**

Sources:
- https://github.com/s977043/PlanGate
- https://github.com/s977043/PlanGate/pull/1402
