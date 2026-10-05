---
title: "AIレビューを、もう一度レビューする"
---

ここまで、実装Artifactをレビューしてきました。

次に扱うのは、**レビュー結果そのもの**です。

> **AIレビューの出力も、最終回答ではなくReview Artifactとして扱う。**

River ReviewのWチェックは、この考えを実行します。

## review-self と review-external

Artifact Input Contractでは、既存レビューを2種類で受け取れます。

| Artifact | 意味 |
| --- | --- |
| review-self | 実装者自身のセルフレビュー |
| review-external | 外部AI / 人間レビュアーの結果 |

locale追加の例なら、実装エージェントのセルフレビュー、別AIのレビュー、人間レビューを次のレビュー材料にできます。

## Wチェックで確認すること

複数レビューを集める目的は多数決ではありません。

| 処理 | 目的 |
| --- | --- |
| Deduplicate | 同じ場所・Evidenceを指すFindingを統合する |
| Hallucination guard | Evidenceのpathやcode snippetを実際のdiffと照合する |
| Synthesis | 確認済みFindingをVerdict materialへ整理する |

たとえば「存在しない関数が未定義」というレビューコメントがあっても、その関数自体がdiffに存在しなければ指摘を再検証できます。

Verdictが得られても、それは最終merge権限ではありません。

## 入力不足も状態として残す

review-selfかreview-externalの片方だけでも処理できる場合があります。

ただし、両方揃った場合と同品質とはみなしません。

~~~text
Execution succeeded
   ≠
All intended evidence was available
~~~

この「処理は動いたが、予定した材料は揃っていない」という区別が、後のReview Coverageにつながります。

## 独立性はレビュー数では決まらない

同じPrompt・同じContext・同じModelで3回レビューしても、強い独立検証にはなりません。

重要なのは、

- 観点を分ける
- Evidenceを再確認する
- 不確実なFindingを残す
- 必要ならHuman Judgmentへ返す

ことです。

## この章で持ち帰ること

AIレビューの出力も、**再検証できるArtifact**として扱います。

次章では、そのReview Artifactを評価するためにdiff外のContextが必要な場合を扱います。

### Sources

- [Wチェックガイド](https://github.com/s977043/river-review/blob/main/pages/guides/w-check.md)
- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
