# 観点を分けて並列レビューする

AIエージェントを使うと、「複数Agentにレビューさせれば品質が上がる」と考えたくなります。

River ReviewのReview Teamで重要なのは、Agent数ではありません。

> **レビュー観点の責務を分けること。**

## Reviewer Role

現在のRiver Reviewには、たとえば次のReviewer Roleがあります。

- bug-hunter
- security-scanner
- test-gap
- dependency-reviewer
- frontend-reviewer
- ci-cd-reviewer

それぞれ見る失敗モードが違います。

1人の万能レビュアーへ「バグもsecurityもtestsもdependencyも全部見て」と依頼するより、責務を分けることで観点を明確にできます。

## auto selection

すべてのRoleを毎回実行する必要もありません。

変更ファイルやreviewSignalsから必要なRoleを選択できます。

たとえば認証変更ならsecurity-scanner、UI変更ならfrontend-reviewer、deployment changeならci-cd-reviewerを追加する、といった形です。

ここでも重要なのは **必要なものだけ動かす** ことです。

## Review Teamは完全独立Agent群ではない

現在のReview Teamは、1つのorchestrator内で観点別Roleを並列実行し、Findingをまとめる構造です。

~~~text
Orchestrator
  ├─ Role A
  ├─ Role B
  └─ Role C
       ↓
Findings merge
~~~

「複数Agentが独立に最終判断する仕組み」とは違います。

最終的なContinue / Stop / Human Escalationはcaller側に残ります。

## 多様性と独立性は同じではない

別Roleを使っても、同じContext・同じModel・同じPrompt構造を共有していれば、完全に独立した検証とは言えません。

Review Teamが提供するのはまず**観点の分離**です。

さらに強い独立性が必要なら、

- separate context
- separate model
- separate evidence package
- separate authority

まで設計する必要があります。

本書では「Agentを増やすこと」を目的にしません。

## Finding mergeも判断の一部

複数Roleが同じ問題を見つけることがあります。

そのまま人へ3件見せると、重要度が水増しされます。

重複排除・Evidence統合・severity整合を行い、Human Decision Surfaceへ過剰なノイズを出さないことが必要です。

## この章で持ち帰ること

Review Teamの価値は並列数ではなく、**レビュー責務を明示的に分解できること**です。

ここまでで、レビュー自体のReliabilityを扱いました。

次の第6部では、過去判断と評価結果を使ってReview Judgmentを改善する仕組みへ進みます。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [Artifact Input Contract: reviewSignals](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
