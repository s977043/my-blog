# Greenを疑う — EvalとFalse Green

> Draft. Harness自体の「守れているつもり」を、実挙動と対照実験で疑う。

## Greenでも守れていなかった

## False Greenの4クラス

- 設定やファイルが存在するだけで「動作している」と判定する
- path / worktreeなど入力空間の一部だけを検証する
- 文字列近似で実際のcommand semanticsを見ない
- 検査手段そのものが副作用を持つ

## linked worktreeで外れたApproval Boundary

## 文字列判定が生んだFalse Positive / False Negative

## 誤起動で副作用が出た検査

## Positive ControlとNegative Control

「危険な操作を止める」テストだけでなく、「安全な操作を通す」対照も持つ。

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
