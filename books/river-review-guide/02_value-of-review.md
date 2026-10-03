# レビューの価値は、バグ発見だけではない

コードレビューはバグやセキュリティ問題を探すためだけのものではありません。River Reviewでは、より広く次のように捉えます。

> **成果物へ異なる視点・根拠・リスク・代替案を持ち込み、意思決定の質を上げること。**

## Findingはゴールではない

AIレビューツールではFinding一覧が出ます。しかし、人が本当に知りたいのはFindingの数ではありません。

majorが1件出ても、

- 本当に現在のdiffに存在する問題なのか
- どのEvidenceからそう判断したのか
- 既存の設計判断と矛盾しているのか
- 今回はAccepted Riskとして受け入れてよいのか
- 人間の責任判断が必要なのか

によって次の行動は変わります。

River ReviewではFindingをEvidence、Review Artifact、過去判断、Coverageと接続します。

## レビューは違う視点を足す

実装者は強いContextを持っていますが、そのContextがあるから見えにくいものもあります。

目的を知っているので説明不足に気づかない、自分が追加したAPIなので別利用側の互換性を見落とす、テストを書いた本人なので試していない失敗を見落とす、といったことです。

Review Teamがbug-hunter / security-scanner / test-gap / dependency-reviewerなどに観点を分けるのも、**別の責務・別の失敗モードから見る**ためです。

## ReviewとApprovalは分ける

River Reviewが返すのはFinding / Evidence / Verdictという**判断材料**です。

~~~text
Review
  ↓
Finding / Evidence / Verdict
  ↓
Caller / Human
  ↓
Continue / Revise / Escalate / Approve
~~~

River Review自身は自動承認・自動mergeを行いません。

ReviewとAuthorityを分けることで、AIへ任せる範囲と、人が責任を持つ範囲を別々に設計できます。

## この章で持ち帰ること

レビューの価値はFindingを増やすことではありません。**次の意思決定に必要な材料を増やすこと**です。

### Sources

- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [Human Judgment Focus](https://github.com/s977043/river-review/blob/main/pages/explanation/human-judgment-focus.md)
