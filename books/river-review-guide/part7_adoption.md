---
title: "第7部 自分のチームへ導入する"
---

## この部で答える問い

> **どこから始めれば、レビュー自動化を過剰導入せずに価値を確認できるのか。**

Skills、Review Team、Memory、Coverage、Evalを最初から全部入れる必要はありません。

むしろ、価値が確認できる最小の判断から始めます。

~~~text
One useful judgment
      ↓
Plugin / local review
      ↓
Team-owned Skill / Rule
      ↓
Comment-only CI
      ↓
Selective Gate
      ↓
Continuous Evaluation
~~~

この部では、1 Skillから始める方法、project固有判断、PluginからCIへの段階導入、Human Review境界、継続改善を扱います。

## 読み終えたとき

自分のチームで、

- 最初に自動化する判断
- project側へ残すRule / Skill
- CIへ上げる条件
- Human Approvalを残す領域
- 改善を測るFeedback

を決められる状態を目指します。

Book全体のゴールは「River Reviewを全部使うこと」ではありません。**レビュー判断をチームが所有し、検証・改善できる運用を始めること**です。
