# 第2部 River Reviewとは何か

## この部で答える問い

> **River Reviewは、AI支援開発の中で何を担当し、何を担当しないのか。**

ここからRiver Reviewを具体的なOSSとして見ます。ただし機能カタログではなく、責務境界から理解します。

## 章の流れ

1. River Reviewが解く問題とNon-goal
2. diffだけでなくSDLC Artifactをレビューする理由
3. Skills / Gates / Riverbedの役割
4. Plugin / Deterministic / Headlessという実行surface

~~~text
What problem?
   ↓
What artifacts?
   ↓
What responsibilities?
   ↓
Where does it run?
~~~

## 読み終えたとき

River Reviewを「AIコードレビューSaaS」ではなく、**チーム所有のReview Judgmentを実行する監査レイヤー**として位置づけられる状態を目指します。

第3部では、そのReview Judgment自体を設計要素へ分解します。
