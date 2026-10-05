---
title: "実装前にPlanをレビューする"
---

Plan Reviewの目的は、完成した計画書を採点することではありません。

> **実装へ進む前に、後工程で判断を変えうる曖昧さや抜けを見つけること。**

## locale追加のPlan

たとえば次のPlanがあるとします。

~~~text
Goal:
User Profile APIへ optional locale を追加する

Scope:
- API schema
- serializer
- profile UI
- tests

Out of scope:
- 既存consumerの挙動変更

Verification:
- localeあり / なしのAPI test
- UI fallback test
~~~

一見、十分そうです。

しかしReviewでは次を確認できます。

- unknown localeはどう扱うのか
- 既存consumerが追加fieldを無視できることをどう確認するのか
- localeの正本はどこか
- UI fallbackはどの値か
- migrationやdata backfillは不要なのか

## Plan Reviewは「実装方法」を細かく決めるためではない

Planを詳細化しすぎると、実装者の選択肢を不必要に狭めます。

見るべきなのは、

- Goal
- Scope
- Constraints
- Risk
- Acceptance
- Verification
- Human Handoff

です。

つまり実装の全行を先に決めるのではなく、**判断境界を実装前に置く**ことが重要です。

## UnknownをFindingと同じにしない

Plan Reviewでは、不明点が見つかることがあります。

たとえば「既存consumerがunknown fieldを無視するか不明」なら、これは即座にバグとは限りません。

~~~text
Unknown
  ↓
Research / Evidence
  ↓
Plan update
~~~

と進めます。

分からないことを無理に問題断定せず、調査対象へ変える方が有用です。

## PlanGateが無くても使える

River ReviewのArtifact Input ContractはPlanGate固有ではありません。

MarkdownのPlanをArtifactとして渡せればレビューできます。

PlanGateは、River Reviewのレビュー結果を使って進行可否を制御する統合例です。

~~~text
River Review
  = plan review

PlanGate / caller
  = proceed or stop
~~~

責務を混ぜないことが重要です。

## この章で持ち帰ること

Plan Reviewは「良い文書を書く」ためではなく、**実装へ移る前に判断条件とVerificationを揃える**ために使います。

次章では、そのPlanと実際のDiffが一致しているかを見ます。

### Sources

- [Review Scope](https://github.com/s977043/river-review/blob/main/pages/explanation/review-scope.md)
- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
