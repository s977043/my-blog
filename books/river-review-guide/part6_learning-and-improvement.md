# 第6部 レビュー判断を学習・改善する

レビュー基準は、一度Skillへ書いたら完成ではありません。

運用すると必ず、

- 有用だったFinding
- false positive
- missed issue
- WontFix
- accepted risk
- 設計判断
- 評価結果

が蓄積します。

この部では、それらを単なるログで終わらせず、**次のReview Judgmentを変える材料**として扱います。

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

中心にあるのは「モデルを学習させること」ではありません。

**チームの判断基準を、観測と評価から改善すること**です。
