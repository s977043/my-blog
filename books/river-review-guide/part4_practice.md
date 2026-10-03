# 第4部 River Reviewで実際にレビューする

この部では、同じ変更を複数のArtifactとして追います。

例として「既存APIへ任意フィールドを追加し、その利用箇所とテストを更新する変更」を想定します。これは説明用の仮想例です。

```text
Plan
  ↓
Diff
  ↓
Tests
  ↓
Review Result
  ↓
Repository Context
```

各章で新しいツールを増やすのではなく、**同じ変更をどのArtifact・Evidenceから判断するか**を変えていきます。
