---
title: "はじめに"
---

この本は、PlanGateの機能一覧を説明するための本ではありません。

中心に置く問いは一つです。

> AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をどう作るか。

既存の『AI にコードを書かせる前にやること — PlanGate 実践ガイド』が、良いPlanを作る方法を中心に扱うのに対し、本書ではPlanの前後まで含めた開発環境全体を扱います。

Artifact、Evidence、Approval Boundary、Verification、Human Judgment、Context、Handoff。これらをどう組み合わせると、AIへ任せる範囲を広げても判断と責任を失わずに済むのかを、PlanGateの実例から考えます。

## この本で扱うこと

- なぜ実装速度より判断がボトルネックになるのか
- Verification / Review / Judgmentをなぜ分けるのか
- Planを「参考資料」ではなく実行許可の前提にする方法
- 計画を中心に置き、機械判定できる境界だけをHookなどの実行時検査へ移す方法
- 完了宣言ではなくFresh Evidenceで判断する方法
- 会話ではなくArtifactへContextを移す方法
- 複数Agent、長時間実行、PR後のDeliveryへどう広げるか
- Harness自体のFalse Greenをどう検出し改善するか
- Level / Phase / Modeを混同せず、必要な範囲から段階導入する方法

## 対象読者と前提知識

本書は、AIコーディングエージェントをチーム開発に乗せる仕組みを設計する人に向けて書いています。テックリードやEM、開発フローを整える立場のエンジニアを想定しています。

前提として、Claude CodeやCodexのようなAIコーディングエージェントを一度は使ったことがあると読みやすくなります。PlanGateを使ったことがなくても読めます。

姉妹作の『AI にコードを書かせる前にやること — PlanGate 実践ガイド』を先に読む必要はありません。良いPlanの書き方を知りたくなったら、そちらを参照してください。用語は付録Aの用語集で引けます。

## 読み終えたときの状態

個々のプロンプトを工夫するだけでなく、AIが間違えても壊れにくく、進行状況を証拠で確認でき、必要な場所で人間が判断できる開発環境を設計する観点を持ち帰ることを目指します。


## 情報の基準日

PlanGateの具体仕様は、**2026年10月3日時点のcurrent main**を再確認して記述しています。

release状態はGitHub Releasesを優先し、同日時点のLatest releaseは **v8.22.0** です。一方、mainのREADMEにはv8.23.0をLatestとする記述があり、生成済みChangelogページではv8.23.0がTBDのまま残っています。

そのため本書では、v8.23系のContext / ai-loop V2機能を「current mainで確認できる実装」として扱い、release済みとは断定しません。

姉妹作はv8.22.0時点の公開情報を基準にしています。本書はそれより新しいmainを基準にしているため、細部の記述が異なることがあります。

また、段階導入についてもREADMEのLevel 1〜5とstaged-adoption-guideのPhase 0〜3が併存しているため、用途を分けて説明します。

Source:
- https://github.com/s977043/PlanGate/releases/latest
- https://github.com/s977043/PlanGate/blob/main/docs/changelog.md
