---
title: "観点を分けて並列レビューする"
---

Review Teamの目的は、Agent数を増やすことではありません。

> **レビュー観点の責務を分けること。**

## Reviewer Role

現在のRiver Reviewには、観点ごとのRoleがあります。bug-hunter、security-scanner、test-gap、dependency-reviewer、frontend-reviewer、ci-cd-reviewerなどです。

変更内容に応じて必要なRoleを選ぶことで、1人の万能レビュアーへすべてを詰め込むより責務を明確にできます。

reviewSignalsや変更ファイルを使って、必要なRoleだけを選択する考え方です。

## 観点分離と独立検証は違う

現在のReview Teamは、1つのorchestrator内で観点別Roleを並列実行し、Findingを統合します。

~~~text
Orchestrator
  ├─ bug-hunter
  ├─ security-scanner
  └─ test-gap
       ↓
Findings merge
~~~

これは「完全に独立した複数Agentが最終判断する仕組み」とは違います。

同じContext・Model・Prompt構造を共有していれば、Roleを分けても、同じ条件で3回レビューしても、強い独立検証にはなりません。独立性はレビュー数では決まらず、重要なのは、

- 観点を分ける
- Evidenceを再確認する
- 不確実なFindingを残す
- 必要ならHuman Judgmentへ返す

ことです。

さらに独立性が必要なら、Context / Model / Evidence package / Authorityまで分離する必要があります。

## 統合時のノイズも管理する

複数Roleが同じ問題を見つけることがあります。

そのまま件数を足すのではなく、

- 重複Findingを統合する
- Evidenceをまとめる
- severityの不整合を確認する

ことで、人間へ判断を提示する場面に過剰なノイズを出さないようにします。

最終的なContinue / Stop / Human EscalationのAuthorityはCaller側に残ります。

## この章で持ち帰ること

Review Teamの価値は並列数ではなく、**レビュー責務を明示的に分解できること**です。

これで第5部のReliability設計が揃いました。次の第6部では、過去判断と評価結果を使ってReview Judgmentを改善します。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [Artifact Input Contract: reviewSignals](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
