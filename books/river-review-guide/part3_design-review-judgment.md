# 第3部 レビュー判断を設計する

## この部で答える問い

> **レビュー判断を再利用可能な仕組みにするには、何を分離して設計すればよいのか。**

River Reviewの中核を5つの問いへ分けます。

| 用語 | まずはこう読む |
| --- | --- |
| Skill | **何を判断するか**。レビュー職務と判断基準 |
| Artifact | **何を材料にするか**。Plan / Diff / Testsなどの入力 |
| Evidence | **何を根拠にするか**。Findingを再確認できる材料 |
| Judgment Placement | **どこで判断するか**。機械・ルール・AI・人間の配置 |
| Human Judgment | **誰が責任を持つか**。受入・例外・不可逆な判断 |

英語ラベルを先に覚える必要はありません。まず「何を / 何から / 何を根拠に / どこで / 誰が」の5つに分けると理解しやすくなります。

この5つを分離すると、「AIレビューを信頼できるか」という曖昧な問いを、設計できる問題へ変えられます。

## 共通の例

説明用の仮想例として、次の変更を使います。

> User Profile APIへ optional な locale フィールドを追加し、UI表示とテストも更新する。

単純に見える変更ですが、API contract、既存consumer、locale定義、テスト、Human Judgmentの境界まで含みます。

## 読み終えたとき

1つのレビュー要求を、**Skill / Artifact / Evidence / Placement / Human Responsibility**へ分解して設計できる状態を目指します。

第4部では、この設計を実際のPlan / Diff / Testsへ適用します。
