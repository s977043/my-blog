---
title: "レビューの仕組み自体を改善し続ける"
---

River Reviewを導入しただけでは、レビュー判断は資産になりません。

運用し、失敗を観測し、判断基準へ戻すことで初めて改善ループになります。

## 観測するもの

まず、Finding数だけをKPIにしません。

観測したいのは、たとえば次です。

| 観測 | 問い |
| --- | --- |
| Useful Finding | 実際の修正や判断につながったか |
| False Positive | 不要な指摘は何だったか |
| Missed Issue | 人間が後から見つけた問題は何か |
| Review Coverage | 予定したレビューが完遂したか |
| Suppression | 例外判断が増えすぎていないか |
| Human Escalation | どの種類で人へ戻ったか |
| Review Cost | latency / token / waitingは許容か |
| Recurrence | 同じ失敗が再発したか |

## 観測から資産化する

Feedbackをログに残すだけでは、次のレビューは変わりません。

そこで分類します。

~~~text
Useful repeated Finding
  → Skill / Rule

False positive
  → Guard / Negative Fixture / Suppression

Missed issue
  → Positive Fixture / New Criterion

Repeated human judgment
  → Promotion candidate

Accepted risk
  → Memory with expiry / resurface
~~~

この変換がReview Judgment as Codeの運用です。

## 「AIを改善する」より「判断系を改善する」

たとえばfalse positiveが多いとき、モデルを高性能なものへ替えるだけが選択肢ではありません。

原因は、

- Skill Scopeが広い
- Contextが不足
- Contextが多すぎる
- Evidence Contractが曖昧
- Heuristicに置くべき判断をAgenticへ置いている
- Project Ruleが不足
- Suppressionが必要

かもしれません。

つまり改善対象は **モデル + ハーネス + 判断配置** です。

## Review Evolution Cycle

改善を一周させると、概念的には次の形になります。

~~~text
Observe
  ↓
Classify
  ↓
Reproduce
  ↓
Change Judgment Asset
  ↓
Evaluate
  ↓
Deploy Gradually
  ↓
Observe Again
~~~

このloopにHuman Judgmentを残します。

特に、

- Skillをblockingへ昇格する
- Human-owned領域を減らす
- Suppression scopeを広げる
- Deterministic ruleへpromotionする

といった変更は、レビューシステムのAuthorityを変えるため慎重に判断します。

## 成熟すると、人間レビューが「なくなる」のではない

成熟した状態を、

> 人間レビューが0件になる

とは定義しません。

むしろ、

- 再現可能な判断はsystemへ移った
- 不明なものはQuestionとして返る
- 高リスクはHumanへ確実にEscalateされる
- 過去判断はMemoryで再利用される
- レビュー自体のCoverageとQualityを測れる

という状態を目指します。

人間は、より少ない回数で、より重要な判断へ集中します。

## この章で持ち帰ること

River Reviewの導入完了は、CIにworkflowを追加した瞬間ではありません。

**チームのレビュー判断が、観測・再利用・評価・改善できるloopになったとき**です。

本書で紹介した機能は、そのloopを作る部品です。

本編はここで終わります。最後の「おわりに」では、個別機能から離れて、Review Judgment as Codeとして何を持ち帰るかをもう一度短く整理します。

### Sources

- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
- [Evaluation Fixture Format](https://github.com/s977043/river-review/blob/main/pages/reference/evaluation-fixture-format.md)
- [Riverbed Memory](https://github.com/s977043/river-review/blob/main/pages/explanation/riverbed-memory.md)
