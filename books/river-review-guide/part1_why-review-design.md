# 第1部 なぜAI時代にレビューの設計が必要なのか

## この部で答える問い

> **コード生成が速くなったとき、なぜレビュー判断の設計が新しいボトルネックになるのか。**

River Reviewの機能説明へ入る前に、問題設定を揃えます。

## 章の流れ

1. 生成速度と判断速度の非対称
2. バグ発見だけではないレビューの価値
3. AIレビューの判断基準を誰が所有するか
4. Review Judgment as Code

~~~text
Generate faster
   ↓
Judgment bottleneck
   ↓
Who owns review criteria?
   ↓
Review Judgment as Code
~~~

## 読み終えたとき

「AIレビューを使うかどうか」ではなく、**レビュー判断をチームが所有し、再利用・評価できる形にする必要がある**と説明できる状態を目指します。

次の第2部では、その考えをRiver Reviewがどの責務境界で実装しているかを見ます。
