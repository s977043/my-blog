# AIレビューを、もう一度レビューする

ここまで、実装Artifactをレビューしてきました。

次は一段視点を上げます。

> **レビュー結果そのものも、Artifactとしてレビューする。**

River ReviewのWチェックは、このための仕組みです。

## review-self と review-external

Artifact Input Contractでは、既存レビュー結果を次の2種類で受け取れます。

| Artifact | 意味 |
| --- | --- |
| review-self | 実装者自身のセルフレビュー |
| review-external | 外部AI / 人間レビュアーの結果 |

どちらもMarkdownとして渡せます。

たとえばlocale追加について、

- 実装エージェントのセルフレビュー
- Codexのレビュー
- 人間のレビュー

があれば、それらをWチェックの入力にできます。

## なぜレビュー結果まで疑うのか

AIレビューもハルシネーションします。

たとえば、

> src/profile/locale.ts の validateLocale が未定義です

という指摘があっても、実際のdiffにその関数が存在しないかもしれません。

レビューコメントが存在することと、指摘対象が存在することは別です。

Wチェックでは、複数レビューの統合処理で次のような処理を行います。

### Deduplicate

同じ場所・同じEvidenceを指すFindingを統合します。

3人が同じ問題を指摘しても、3件の別問題として数えません。

### Hallucination guard

FindingのEvidenceが参照するpathやcode snippetを実際のdiffと照合します。

実在しないコードを根拠にした指摘はdismiss対象にできます。

### Synthesis

確認済みFindingをまとめ、merge-ready / human-review / blockのようなVerdict materialへ整理します。

ただし、このVerdictが最終merge権限ではありません。

## degraded modeを明示する

review-selfかreview-externalのどちらかが無くてもWチェックは動作できます。

しかし両方揃っている場合と同じ情報量ではありません。

この状態を「動いたから同品質」とみなさず、degraded modeとして扱う考え方が重要です。

これは次章以降のReview Coverageにもつながります。

~~~text
Execution succeeded
   ≠
All intended evidence was available
~~~

## レビューを増やせば正しくなるわけではない

Wチェックは「AIを3体使えば正しい」という多数決ではありません。

必要なのは、

- レビュー間の重複を減らす
- Evidenceを再確認する
- 独立した観点の差を残す
- 不確実なFindingを人へ返す

ことです。

同じPromptと同じContextを3回渡しても、独立性は高くありません。

レビュー数ではなく、**責務とEvidenceの分離**が重要です。

## この章で持ち帰ること

AIレビューの出力を最終回答として扱わず、**レビュー結果も検証対象Artifactへ戻す**ことができます。

次章では、diffだけではEvidenceが不足する場合に、リポジトリ全体からContextを追加する方法を見ます。

### Sources

- [Wチェックガイド](https://github.com/s977043/river-review/blob/main/pages/guides/w-check.md)
- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
