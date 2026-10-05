---
title: "人間は何を判断するべきか"
---

AIレビューを増やすと、「人間レビューをどこまで減らせるか」という話になりがちです。

River ReviewのHuman Judgment Focusは、少し違う方向を取ります。

> **減らしたいのはHuman Judgmentではなく、人間でなくても再現可能な判断に人間の注意を使うこと。**

この章では、人間の注意をどこへ配分するかという原則を扱います。実際のHandoff policyやAuthority設計は第32章で扱います。

## 人間の注意力を再配置する

すべてのPRを同じ深さで人間が読む運用は、AIで変更量が増えるほど重くなります。

一方、人間レビューを単純に外すと、責任を伴う判断までAIへ委譲してしまいます。

そこで、リスクに応じて監督の厚さを変えます。

## Cliff / Hill / Field

River Reviewのdocsでは、リスクを3階層で説明しています。

| 階層 | 例 | 人間監督 |
| --- | --- | --- |
| Cliff | auth / payment / personal data / irreversible migration | 人間承認必須 |
| Hill | Plan-Diff整合 / API contract / migration policy | 観測と意味確認 |
| Field | lint / docs / naming / 単純refactor | 自律収束＋事後監査 |

locale追加の例でも、単なる表示ラベル変更ならField寄りです。

しかし、localeが法的同意文言や個人データ処理に影響するなら、同じ「locale変更」でもCliff寄りになります。

つまりRiskは、ファイル拡張子や行数だけでは決まりません。

## 人間が見る量ではなく、見る密度を上げる

Human Judgment Focusの狙いは、人間をレビュー工程から追い出すことではありません。

低リスクで再現可能な判断を機械やSkillへ移し、人間が見るべき変更に注意を集めます。

そうすると人間は、

- 事業妥当性
- 設計責任
- security boundary
- 不可逆性
- 例外受入

といった判断へ集中できます。

## Human Judgmentを「失敗時のfallback」にしない

人間へ返すことを、自動化失敗と考えないことも重要です。

Human Judgmentは、最初から責任を置くべき評価層の1つです。

「AIが分からなかったら人へ」だけでなく、

> この種類の判断は、Evidenceが揃っていても人が責任を持つ

と決める領域があります。

実際にVerdictとAuthorityをどう分け、Automatic / Ask / Escalate / Human Approval Requiredへ落とすかは、第32章で運用設計として扱います。

## この章で持ち帰ること

AI時代のHuman-in-the-loopは「全部人が確認する」ことではありません。

**責任が必要な判断を先に明示し、そこへ人間の注意を集中させる設計**です。

次の第4部では、この考えを実際のPlan / Diff / Testレビューへ落とします。

### Sources

- [Human Judgment Focus](https://github.com/s977043/river-review/blob/main/pages/explanation/human-judgment-focus.md)
- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
