# Contextを増やせばレビューは良くなるのか

repo-wide reviewでは、diff以外のContextを増やせるようになりました。

ここで次の誘惑が出ます。

> だったら、全部読ませた方が精度が上がるのでは？

River Reviewでは、その方向を取りません。

## Contextには2つのコストがある

1つ目は分かりやすいtoken costです。

しかしもう1つ重要なのが、**Attention Budget**です。

関連の薄いSkill本文や大量の周辺ファイルを入れると、本当に重要なEvidenceが相対的に埋もれます。

~~~text
More Context
   ≠
More Useful Context
~~~

## Context Budget

River ReviewではContext量に上限を持たせます。

review modeや明示budgetによって、どれくらいのContextを入れるかを制御できます。

目的は単なる費用削減ではありません。

> **判断に必要な情報を、高シグナルな状態で残すこと**

です。

## Progressive Disclosure

Skill自体にも同じ考えを使います。

公開docsでは、概念的に3段階で説明されています。

### Stage 1: Metadata

まずid / description / category / applyTo / inputContextなど、選択に必要な情報だけを見ます。

### Stage 2: Instruction

選択されたSkillの本文だけを読みます。

### Stage 3: Reference Context

実行時に必要なProject Rule / Memory / Referenceを追加します。

~~~text
All Skills
   ↓ metadata filter
Candidate Skills
   ↓ select
Skill Instructions
   ↓ execute
Required References
~~~

## 実装済みと設計中を分ける

Progressive Disclosureは考え方として完成していても、current main上の各Stageがすべて完全分離されているとは限りません。

2026年10月3日時点のdocsでは、

- 全Skillロードの既存経路
- metadata summaryのproto実装
- metadata専用loaderは追加予定
- Stage 2/3の明示分離は設計済み

という状態差があります。

そのため本書ではProgressive Disclosureを「現在すべて完成した機能」とは書きません。

## Context CoverageとReview Coverageは違う

repo-wide Contextの一部がbudgetでskipされた場合、それはContext Coverageの問題です。

一方、Review Unit自体がtimeoutした場合はReview Coverageです。

~~~text
Context Coverage
  = reviewerへ何を渡せたか

Review Coverage
  = reviewer workが完遂したか
~~~

この2つを分けることで、「レビューは完了したがContext不足だった」と「レビューそのものが未完了」を区別できます。

## この章で持ち帰ること

Context Engineeringは、情報を最大化する仕事ではありません。

**判断に必要な情報を選び、不要な情報を入れない仕事**です。

次章では、ContextだけでなくReviewerの責務自体を複数観点へ分けます。

### Sources

- [Progressive Disclosure](https://github.com/s977043/river-review/blob/main/pages/explanation/progressive-disclosure.md)
- [Repo-wide Review Guide](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
