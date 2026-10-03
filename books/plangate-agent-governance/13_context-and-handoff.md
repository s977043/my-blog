# Contextを会話からArtifactへ移す

> Draft. 長時間セッションやモデル切替でも同じ状態から再開するための設計を扱う。

## 長い会話が便利に見える理由

## 会話依存の失敗

## Intent Context Package

## Checkpoint

## Fresh Context

## Handoffは次のAgentへのAPI

## Primary Evidence

- PlanGate PR #1396: semanticな `context_ref` とexact artifactを示す `snapshot_ref` を分離したIntent Context Package v1
- PlanGate PR #1411: model / runtime / workerの切替、独立レビュー、worker handoffなどでcheckpoint後にfresh contextを開始する方針
- raw conversation historyを正本として受け渡すのではなく、canonical stateとevidence refsを再構成する

Evidence type: **Verified**

Sources:
- https://github.com/s977043/PlanGate/pull/1396
- https://github.com/s977043/PlanGate/pull/1411
