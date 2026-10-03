# 第6部 レビュー判断を学習・改善する

## この部で答える問い

> **レビューの誤検知・見逃し・過去判断を、次のレビュー改善へどう戻すのか。**

運用すると、有用だったFinding、false positive、missed issue、WontFix、accepted risk、設計判断、評価結果が蓄積します。

それらを単なるログで終わらせません。

~~~text
Review
  ↓
Decision / Feedback
  ↓
Memory / Fixture
  ↓
Evaluation
  ↓
Judgment Update
  ↓
Next Review
~~~

扱うのはRiverbed Memory、Suppression / Resurface、Skill Evaluation、Judgment Promotion、generate → review → reviseの収束です。

## 読み終えたとき

レビュー品質の改善を「Promptを書き直す」だけに閉じず、**Memory / Fixture / Evaluation / Placementを使った改善loop**として設計できる状態を目指します。

第7部では、この仕組みをチームへ無理なく導入する順序を扱います。
