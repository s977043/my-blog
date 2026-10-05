---
title: "会話ではなくArtifactを境界にする"
---

AIエージェントとの長いセッションでは、要件・設計・Plan・実装理由・テスト結果・レビュー結果が会話へ蓄積します。

そのセッションの中だけなら便利です。

しかし、別のAgent、CI、翌日のセッション、別のモデルへ引き継ぐとき、会話履歴は扱いづらくなります。

River Reviewは、会話を正本にせず **Artifactを外部入力として扱う** 方向を取ります。

## Artifact Input Contract

現行のArtifact Input Contractには、たとえば次が定義されています。

| Artifact | 役割 |
| --- | --- |
| pbi-input | 背景・要求 |
| plan | 実装計画・設計判断 |
| design | 設計文書 |
| test-cases | テスト設計 |
| review-self | セルフレビュー |
| review-external | 外部AI / 人間レビュー |
| diff | 実装差分 |
| junit | テスト実行結果 |
| coverage | カバレッジ |
| lint / typecheck | 機械検査結果 |

重要なのは、これらがPlanGate内部形式ではなく、**River Reviewへ渡す外部契約**になっていることです。

## 例: locale追加をArtifactへ分ける

先ほどの変更なら、

~~~text
plan
  - locale field追加
  - 既存consumer互換を維持
  - fallbackは従来値

diff
  - API schema変更
  - serializer変更
  - UI変更

tests
  - localeあり
  - localeなし
  - unknown locale
~~~

のように分けられます。

会話の中で「さっき決めた通り」と参照するより、後から見ても判断材料が残ります。

## Artifactの欠損も契約にする

Artifact Input Contractでは、多くの入力はoptionalです。

これは「無くても問題ない」という意味ではありません。

欠損時に、

- その観点をskipする
- degraded modeで動く
- 必須Flowなら未束縛として扱う

といった挙動を明示するためです。

たとえばtestsが無いのにtest-gap reviewを「実施済み」と扱うのは危険です。

入力が無いこと自体を状態として扱う必要があります。

## Review Artifactは出力側の正本になる

River Reviewは結果もReview Artifactとして構造化します。

そこにはphase、status、decision、実行したSkill、Finding、Context、debug情報などを保持できます。

これにより、

~~~text
Input Artifact
    ↓
Review
    ↓
Review Artifact
    ↓
Memory / CI / Eval / Human
~~~

という流れを作れます。

## この章で持ち帰ること

会話は作業に便利ですが、**再利用・監査・引き継ぎの境界にはArtifactの方が向いている**場面があります。

次章では、Artifactに書いてあることのうち、何を判断根拠として扱うかをEvidenceとして分けます。

### Sources

- [Artifact Input Contract](https://github.com/s977043/river-review/blob/main/pages/reference/artifact-input-contract.md)
- [Review Artifact](https://github.com/s977043/river-review/blob/main/pages/reference/review-artifact.md)
