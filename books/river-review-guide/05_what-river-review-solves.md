---
title: "River Reviewは何を解決するのか"
---

ここまで、AI支援開発で「判断」がボトルネックになること、そしてレビュー基準をチーム側へ残す考えを見てきました。

ここからRiver Reviewという具体的なOSSへ入ります。

River Reviewを短く説明すると、

> **チームのレビュー判断を、複数の開発Artifactへ実行するReview Judgment Platform**

です。

現在のREADMEでは、より具体的に **team-owned audit layer** と位置づけています。

## diff reviewerより広い

典型的なAIコードレビューはPR diffを入力にします。

River ReviewもDiff Reviewを行えますが、レビュー対象はそれだけではありません。

~~~text
Before execution
├─ Requirement
├─ Design
└─ Plan

After execution
├─ Diff
├─ Tests / JUnit / Coverage
├─ Existing Review
└─ Report
~~~

なぜ実装前も見るのでしょうか。

実装後にコードを丁寧に読んでも、要件の曖昧さ、PlanのScope、Verification不足、人承認が必要な変更の自律実行といった問題は後から取り戻しにくいからです。

River Reviewは、レビューをPR完成後の1地点ではなく、開発の流れへ配置します。

## River Reviewが担う責務

現在のコアモデルは次の3つです。

~~~text
Skills define judgment.
Gates execute judgment.
Riverbed remembers judgment.
~~~

さらにEvaluationが判断品質を検査します。

River Reviewの価値はLLMそのものではありません。**判断基準・Artifact契約・Memory・Evaluationをつなぐこと**にあります。

## River Reviewがやらないこと

責務境界も重要です。

River Reviewは、

- 汎用AIコードレビューSaaSを置き換えない
- 静的解析・linter・type checkerを置き換えない
- 実装エージェントを置き換えない
- コードを自動修正しない
- 人間レビュアーを完全代替しない
- 自動承認・自動mergeをしない

というNon-goalを明示しています。

River Reviewは「全部を引き受けるオーケストレーター」ではなく、**レビュー判断の実行とEvidence提供に責務を絞る**設計です。

## PlanGateとはどう違うか

PlanGateとの組み合わせは主要な統合例ですが、River Review自体はPlanGateに依存しません。

~~~text
River Review
  = review / evidence / verdict material

Caller / PlanGate / Human
  = continue / stop / approve / merge
~~~

River Reviewがレビューし、呼び出し側がどう進むか決める。

この境界があるため、Claude Code、Codex、GitHub Actions、独自workflowなど複数のcallerへ組み込めます。

## この章で持ち帰ること

River Reviewを「AIにPRをレビューさせるツール」とだけ見ると、SkillやMemory、Judgment Placementの意味がつながりません。

**チームが所有する判断を、開発Artifactへ実行し、Evidenceとして返す監査レイヤー**と見ると全体像がつながります。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [Review Scope](https://github.com/s977043/river-review/blob/main/pages/explanation/review-scope.md)
