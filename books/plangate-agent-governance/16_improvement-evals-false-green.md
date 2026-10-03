# EvalとFalse Green

> Draft. Harness自体の「守れているつもり」を疑い、再現可能な評価へ落とす。

## Greenでも守れていなかった

## linked worktreeで外れたApproval Boundary

## 文字列判定が生んだFalse Positive / False Negative

## 誤起動で危険なコマンドがspawnされた経路

## Detect -> Reproduce -> Fix -> Regression Guard

## Evalを改善ループへつなぐ

## Primary Evidence

- #1085: Codex pluginが1件もロードされていないのにdoctorが `registered: YES` を返していた
- #1277: linked worktreeでApproval Boundaryの技術的強制が外れていた
- #1326: 文字列近似で非破壊コマンドをblockしていた
- #1169: read-only検査のつもりで `sh` 起動すると副作用が発生した
- #1173: 配布allowlistのテストが実体を照合せず、新規ファイルの配布漏れを検出できなかった

Evidence type: **Observed + Verified**

Sources:
- https://github.com/s977043/PlanGate/issues/1085
- https://github.com/s977043/PlanGate/issues/1277
- https://github.com/s977043/PlanGate/issues/1326
- https://github.com/s977043/PlanGate/issues/1169
- https://github.com/s977043/PlanGate/issues/1173
