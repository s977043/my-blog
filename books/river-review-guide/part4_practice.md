# 第4部 River Reviewで実際にレビューする

この部では、同じ変更を複数のArtifactとして追います。

説明用の仮想例は次です。

> User Profile APIへ optional な locale フィールドを追加し、UI表示とテストも更新する。

この変更を、

~~~text
Plan
  ↓
Diff
  ↓
Tests
  ↓
Review Result
  ↓
Repository Context
~~~

と追います。

新しいツールを章ごとに増やすのではなく、**同じ変更をどのArtifact・Evidenceから判断するか**を変えていきます。

実際のプロジェクトではファイル名やコマンドが異なります。本部の目的はRiver ReviewのCLIを暗記することではなく、レビュー対象を切り替える考え方をつかむことです。
