---
title: "AIレビューの判断基準は誰のものか"
---

AIレビューを使い始めるとモデル性能が気になります。しかしチーム運用では、別の問いが重要になります。

> **そのレビュー基準は、誰が所有しているのか。**

## モデルの中だけにある判断基準

「セキュリティも見て」「テストも確認して」と依頼すればレビューはできます。

ただし判断基準がモデルやサービス側に閉じていると、何を必ず確認するか、何を確認しないか、severityをどう決めるか、Evidenceは何を要求するか、いつ人へエスカレーションするかをチームが説明しにくくなります。

モデルを替えるとレビューの傾向も変わります。

## River Reviewはrepo-ownedに寄せる

River Reviewはレビュー基準を **versioned / repo-owned なSkill** として扱います。

~~~text
Repository
├─ Skill
├─ Project Rules
├─ Fixtures
├─ Evaluation
└─ Memory
~~~

LLMや外部AIエージェントは使い続けます。変えるのは**判断基準の所有権**です。

## repo-ownedにすると何が変わるか

- **レビューできる** — Skill自体をPRでレビューできる
- **履歴が残る** — なぜ観点が追加されたか追跡できる
- **評価できる** — fixtureやgolden outputで変更前後を比較できる
- **Providerを替えやすい** — 実行モデルが変わってもチーム側の基準を残せる

これはすべてを決定論的ルールへ変えることではありません。意味理解が必要な判断は残ります。

重要なのは、何を判断するか、どのContextを見るか、何をEvidenceとするか、どこで人へ返すかをチーム側で明示できることです。

## この章で持ち帰ること

AIレビューをチーム運用にするなら、モデル性能だけでなく**判断基準の所有権**を設計する必要があります。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
