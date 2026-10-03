# Review Judgment as Code

River Reviewの中心概念が **Review Judgment as Code** です。

一言で言えば、

> **チームが「何を確認し、何をEvidenceとして、どの条件で指摘し、どこから人へ返すか」を、再利用・評価・改善できる形で管理する。**

という考え方です。

「レビューPromptをGitへ置く」と似ていますが、それだけではありません。

## 判断には複数の要素がある

レビュー基準を実行可能な資産にするには、少なくとも次の要素が必要です。

~~~text
Review Judgment
├─ Responsibility
├─ Scope
├─ Required Context
├─ Evidence
├─ Severity
├─ False-positive guards
├─ Human Handoff
└─ Evaluation
~~~

River Reviewでは、これらを主にSkillへ持たせます。

## 実例: hallucinated-reference

River Reviewには、AI生成コード向けの **hallucinated-reference** Skillがあります。

目的は、差分で新しく追加されたimportや関数・メソッド呼び出しが本当に存在するかを確認することです。

単に「存在しないAPIがないか見て」と書いているわけではありません。

### 何を見るか

新しく追加されたimport / require、関数・メソッド呼び出し、ライブラリAPI参照を対象にします。

### 何をEvidenceとするか

差分の該当行に加え、code searchの結果を根拠として要求します。

「存在しない気がする」ではFindingにしません。

### 何を指摘しないか

false positive guardも定義されています。

- 同じdiff内で新しく定義されたsymbolは指摘しない
- 静的検索で確認できない動的生成は断定せずQuestionへ落とす
- 標準ライブラリや既知の公開APIを無闇に疑わない
- CIで確実に検出できる未解決参照はseverityを下げられる

### どこから人へ返すか

動的メタプログラミングやcode generationで静的確認できない場合、Human Handoffの対象になります。

つまりSkillはPromptだけではなく、

~~~text
Responsibility
+ Evidence Contract
+ Guard
+ Escalation
+ Evaluation
~~~

を持つレビュー職務です。

## 「as Code」は評価できることまで含む

River ReviewではSkillにfixtureやgolden outputを持たせ、代表ケースで回帰を確認できます。

~~~text
Skill change
   ↓
Fixture
   ↓
Expected behavior
   ↓
Evaluation
   ↓
Adopt / Revise / Revert
~~~

Promptは書き換えられます。

Review Judgment as Codeでは、**書き換えた結果が良くなったか**まで管理対象にします。

## 判断基準を固定する思想ではない

version管理すると「レビュー基準を固定化する仕組み」に見えるかもしれません。

実際は逆です。変更履歴と評価方法があるから、基準を改善しやすくなります。

- 誤検知が多ければguardを足す
- 見逃しがあればpositive fixtureを足す
- 繰り返すHuman Judgmentが機械判定できるなら、より決定論的な層へ移す
- 使われないSkillは整理する

## この章で持ち帰ること

Review Judgment as Codeは、レビューをコード化することではなく、**レビュー判断を所有・検証・改善可能にすること**です。

### Sources

- [River Review Concept](https://github.com/s977043/river-review/blob/main/pages/explanation/concept.md)
- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [hallucinated-reference Skill](https://github.com/s977043/river-review/blob/main/skills/midstream/hallucinated-reference/SKILL.md)
