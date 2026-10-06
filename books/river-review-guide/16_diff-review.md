---
title: "DiffをPlanと一緒にレビューする"
---

Diff Reviewで重要なのは、差分単体のコード品質だけではありません。

Planがあるなら、

> **実装がPlanで約束した意図・Scope・Verificationを保っているか**

もレビューできます。

## locale追加のDiff

Planでは、

~~~text
Out of scope:
既存consumerの挙動変更
~~~

としていました。

しかしDiffを見ると、serializer共通処理を変更して全consumerのresponse shape生成経路まで触っていたとします。

コード単体として正しくても、Planとの整合では別の問いが生まれます。

- Scopeが広がっていないか
- 既存consumerの出力まで変わらないか
- Planを更新して再判断すべきではないか

これがPlan-Diff reviewです。

## 局所Findingと意図の逸脱を分ける

Diff Reviewでは複数の種類のFindingが混ざります。

### 局所的な問題

- null handling不足
- 例外処理
- unsafe API
- test漏れ

### 複数Artifactをまたぐ問題

- Planで対象外だったファイルを変更
- 設計で決めた責務境界を越えた
- Acceptance Criteriaと実装が一致しない

後者はdiffだけでは判断できません。

Artifactをまたぐ意味理解が必要なので、Agentic Reviewの領域になりやすいです。

## 「変更された行」と「以前からある問題」を分ける

レビューでは、周辺コードの既存問題まで見つかることがあります。

River ReviewのVerifierには、Findingのfile / lineとparsed diffを使って、対象が実際に追加行かpre-existingかを判断する仕組みがあります。

今回の変更で生まれた問題と、以前から存在していた問題では、扱いが違います。

既存問題を指摘してはいけないわけではありません。

ただし「このPRが壊した」と誤認しないために、Scopeを区別します。

## Re-planの入口

Diff ReviewでPlanからの意味的逸脱が見つかったとき、選択肢は「コードをPlanへ戻す」だけではありません。

実装中に新しい事実が分かり、Planを変えるべきケースもあります。

~~~text
Diff reveals new fact
   ↓
Plan no longer valid
   ↓
Re-plan / re-judge
~~~

Planを絶対視するのではなく、**承認した意味が変わったら判断境界へ戻る**ことが大切です。

## この章で持ち帰ること

Diff Reviewはコード品質だけでなく、**実装が約束した意図を維持しているか**を確認する場です。

次章では、実装が正しく見えてもテストが十分とは限らない問題を扱います。

### Sources

- [Verifier implementation](https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs)
- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
