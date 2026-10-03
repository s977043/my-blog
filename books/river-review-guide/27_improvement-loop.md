# レビュー判断を改善するループ

改善の起点は「モデルをもっと賢くする」だけではありません。

```text
Finding / Feedback
      ↓
Failure Analysis
      ↓
Judgment Update
      ↓
Fixture / Eval
      ↓
Promotion or Revert
      ↓
Next Review
```

同じHuman / Agentic Judgmentが繰り返されるなら、HeuristicやDeterministicな層へpromotionできないかを検討します。

逆に、評価で改善を確認できない変更は採用しません。判断の自動化範囲は、EvidenceとEvaluationがあるところから広げます。
