---
title: "テストが通ったことと、必要なことを試したことを分ける"
---

テスト結果がgreenでも、必要なリスクを試していなければ十分とは言えません。

ここでは次の2つを分けます。

- **Execution result** — 実行したテストが成功したか
- **Test adequacy** — 仕様・リスク・失敗パスに対してテスト設計が十分か

## locale追加のテスト

Planでは、

- localeあり
- localeなし
- UI fallback

を確認するとしました。

実装後、JUnitがすべてgreenだったとします。

それでもTest Reviewでは次を問えます。

- unknown localeは試したか
- 既存consumerの互換性を試したか
- locale設定の正本と不一致になるケースはあるか
- serializer変更の影響範囲を十分カバーしているか

「実行したテストが成功した」というEvidenceだけでは、**必要なテストを選んだ**ことまでは証明しません。

## テスト結果もArtifactとして扱う

River ReviewのArtifact Input Contractでは、test-cases、JUnit、coverageなどを別Artifactとして扱えます。

この分離には意味があります。

~~~text
Test Design
   ≠
Test Execution Result
   ≠
Coverage
~~~

それぞれ答える問いが違います。

- test-cases: 何を試すつもりか
- JUnit: 実行結果はどうだったか
- coverage: どこまで通ったか

## Test Gapは意味判断になることがある

単純な「新しい関数なのにテストファイルが無い」はheuristicで拾えるかもしれません。

しかし、

> locale追加のRiskに対して、unknown locale testが必要か

は仕様とPlanを読む必要があります。

こうしたTest AdequacyはAgentic Reviewへ置く価値があります。

## Greenを完了と同義にしない

AIエージェントは「tests passed」と報告すると仕事が終わったように見えます。

しかしRiver Reviewで重視するのは、

> 何を証明したgreenなのか。

です。

後のReview Coverageでも同じ構造が出てきます。

「0 findings」と「review complete」を分けるのと同じように、「tests green」と「risk covered」を分けます。

## この章で持ち帰ること

テストレビューでは、結果だけではなく**テスト選択の妥当性**を確認します。

次章では、さらに一段進めて、レビュー結果そのものをレビュー対象Artifactにします。

### Sources

- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
- [Review Scope](https://github.com/s977043/river-review/blob/main/pages/explanation/review-scope.md)
