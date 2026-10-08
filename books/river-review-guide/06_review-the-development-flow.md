---
title: "コードではなく、開発の流れをレビューする"
---

コードレビューをPR diffの確認だけに限定すると、実装前の問題はレビューできません。

River Reviewでは、SDLC上の複数Artifactを対象にします。

## 5つのレビュー対象

公開docsでは、導入向けに大きく5つへ整理されています。

| レビュー | タイミング | 主に確認すること |
| --- | --- | --- |
| Requirements Review | 実行前 | 目的、成功条件、Scope、不明点 |
| Design Review | 実行前 | 既存設計との整合、責務分離、過剰実装 |
| Plan Review | 実行前 | 作業分割、影響範囲、Risk、Verification |
| Diff Review | 実行後 | Plan・設計との整合、品質、テスト差分 |
| Report Review | 実行後 | Evidence、検証結果、未解決事項 |

ポイントは、**同じ判断基準を複数Artifactへまたいで使えること**です。

ただし、この5つは公開docsの概念上の整理です。snapshot時点のcurrent mainで専用のレビューモードとしてImplementedなのは、Plan Review（plan gate）とDiff Review（exec gate）です。Requirements / Design / Report Reviewは、要件や設計文書、レビュー結果をArtifactとして渡し、対応するSkillで見る形になります。

## 実装後だけでは遅い判断がある

たとえばPlanに次のように書かれていたとします。

~~~text
Goal:
既存APIに optional field を追加する

Out of scope:
既存consumerの挙動変更
~~~

Diff Reviewだけなら、新しく追加されたコード自体は問題なく見えるかもしれません。

しかしPlan Reviewで、

- optional field追加時の後方互換性は確認したか
- consumer側でunknown fieldを拒否しないか
- serialization contractをどう検証するか

という問いを出せれば、実装前にRiskを下げられます。

レビュー対象を前へ広げることは、レビュー工程を増やすためではありません。**後から直すコストが高い判断を、より早いArtifactで確認するため**です。

## Upstream / Midstream / Downstream

River ReviewではレビューSkillをSDLCのフェーズへ配置します。

~~~text
Upstream
  Requirement / Design / Plan
        ↓
Midstream
  Diff / Code / Tests
        ↓
Downstream
  Report / Release / Operations Artifact
~~~

Skillが「どのフェーズで、どのArtifactを入力にするか」を宣言することで、同じReview Judgmentの仕組みを使います。

## すべてのArtifactを必須にしない

Artifact-drivenだからといって、すべてのチームにPlanやDesign文書を要求するわけではありません。

Artifact Input Contractでは多くの入力がoptionalです。

Planが無いチームならdiffから始められます。テストが無いなら、そのContextを必要とするSkillをskipまたはdegradeできます。

重要なのは形式を揃えることより、**判断に必要な材料が何かを明示し、無い場合の挙動も契約にすること**です。

## この章で持ち帰ること

River Reviewはレビュー対象をコードだけに限定しません。

要件・設計・計画・差分・テスト・レポートを、**判断のためのArtifact**として扱います。

### Sources

- [Review Scope](https://github.com/s977043/river-review/blob/main/pages/explanation/review-scope.md)
- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
