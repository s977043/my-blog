# はじめに

この本は、PlanGateの機能一覧を説明するための本ではありません。

中心に置く問いは一つです。

> AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をどう作るか。

既存の『AI にコードを書かせる前にやること — PlanGate 実践ガイド』が、良いPlanを作る方法を中心に扱うのに対し、本書ではPlanの前後まで含めた開発環境全体を扱います。

Artifact、Evidence、Approval Boundary、Verification、Human Judgment、Context、Handoff。これらをどう組み合わせると、AIへ任せる範囲を広げても判断と責任を失わずに済むのかを、PlanGateの実例から考えます。

## この本で扱うこと

- なぜ実装速度より判断がボトルネックになるのか
- Verification / Review / Judgmentをなぜ分けるのか
- Planを「参考資料」ではなく実行許可の前提にする方法
- Prompt上のお願いのうち、機械判定できる境界をHook / CLIの実行時検査へ移す方法
- 完了宣言ではなくFresh Evidenceで判断する方法
- 会話ではなくArtifactへContextを移す方法
- 複数Agent、長時間実行、PR後のDeliveryへどう広げるか
- Harness自体のFalse Greenをどう検出し改善するか
- plugin-only Level 0 / Phase 0から段階導入する方法

## 読み終えたときの状態

個々のプロンプトを工夫するだけでなく、AIが間違えても壊れにくく、進行状況を証拠で確認でき、必要な場所で人間が判断できる開発環境を設計する観点を持ち帰ることを目指します。
