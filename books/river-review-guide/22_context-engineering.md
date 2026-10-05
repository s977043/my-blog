---
title: "Contextを増やせばレビューは良くなるのか"
---

repo-wide reviewではdiff外のContextを追加しました。

しかし、

> **More Context ≠ More Useful Context**

です。

関連の薄い情報を増やすと、tokenだけでなくAttentionも消費します。

## Context Budget

River ReviewではContext量に上限を持たせ、review modeや明示budgetで制御できます。

目的は単なる費用削減ではありません。

**判断に必要な情報を、高シグナルな状態で残すこと**です。

## Progressive Disclosure

Skill側でも、必要な情報を段階的に開く考えを使います。

| Stage | 主に扱うもの |
| --- | --- |
| 1. Metadata | id / description / category / applyTo / inputContext |
| 2. Instruction | 選択されたSkill本文 |
| 3. Reference Context | Project Rule / Memory / Reference |

~~~text
All Skills
   ↓ metadata filter
Candidate Skills
   ↓ select
Skill Instructions
   ↓ execute
Required References
~~~

### 現在の実装状態

2026年10月4日に再確認したverification snapshotでは、全Stageが完全分離済みではありません。

- 全Skillロードの既存経路がある
- metadata summaryはproto実装
- metadata専用loaderは追加予定
- Stage 2 / 3の明示分離は設計済み

そのため、本書ではProgressive Disclosureを完成済み機能としては扱いません。

## Context CoverageとReview Coverage

この2つは別です。

~~~text
Context Coverage
  = reviewerへ必要な材料を渡せたか

Review Coverage
  = reviewer work自体を完遂できたか
~~~

Contextがbudgetでskipされた場合と、Review Unitがtimeoutした場合を区別できます。

## この章で持ち帰ること

Context Engineeringは情報を最大化する仕事ではなく、**必要な情報を選び、不要な情報を入れない仕事**です。

次章では、ContextだけでなくReviewerの責務そのものを分けます。

### Sources

- [Progressive Disclosure](https://github.com/s977043/river-review/blob/main/pages/explanation/progressive-disclosure.md)
- [Repo-wide Review Guide](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
