---
title: "PlanGateの補完版: そのまま使えるテンプレートと運用手順"
emoji: "🚧"
type: "tech"
topics: ["ai", "claudecode", "開発プロセス", "スクラム", "tdd", "AI駆動開発"]
published: false
---

> この記事は [note の本編](https://note.com/mine_unilabo/n/n3aae6b5467b9) の補完版です。
> note 側では背景と考え方を説明し、この記事では Zenn で再利用しやすいテンプレートと手順だけをまとめます。

## この記事で扱うもの

- `PBI INPUT PACKAGE` の最小テンプレート
- `plan.md / todo.md / test-cases.md / status.md` のひな形
- 3コマンド運用の使い方
- レビュー時に見るチェックリスト

note 本編を読んだあとに「結局、何をどの順で置けばいいのか」を確認するためのメモだと思ってください。

## 最小構成

まずはディレクトリをこう置くと扱いやすいです。

```text
docs/working/TASK-XXXX/
├── pbi-input.md
├── plan.md
├── todo.md
├── test-cases.md
├── review-self.md
├── review-external.md
└── status.md
```

この構成のポイントは、会話ログではなくファイルを正本にすることです。  
セッションが切れても、ファイルが残っていれば再開できます。

## PBI INPUT PACKAGE

AIにいきなり実装させず、まず人間が入力を揃えます。  
Zenn向けには、まずこの最小版で十分です。

```markdown
# PBI INPUT PACKAGE

## Context / Why
なぜこの変更が必要かを書く

## Scope
### In scope
- ここに含める

### Out of scope
- ここには含めない

## Acceptance Criteria
- 完了条件を箇条書きで書く

## Notes from Refinement
- リファインメントで決まったことを書く

## Estimation Evidence
- 見積もりの根拠を書く
```

このファイルで固定したいのは次の3点です。

- なぜやるか
- 何をやるか、何をやらないか
- どうなったら終わりか

## plan / todo / test-cases

`plan` フェーズでは、実装前にこの3点を揃えます。

```markdown
# plan.md
- 変更の目的
- 実施ステップ
- 依存関係
- リスク

# todo.md
- [ ] 1. 仕様確認
- [ ] 2. 実装
- [ ] 3. テスト
- [ ] 4. レビュー

# test-cases.md
- Case 1: 正常系
- Case 2: 異常系
- Case 3: 境界値
```

重要なのは、計画だけでは終わらせず、テストケースまで先に書くことです。  
ここを後回しにすると、実装しやすさに引っ張られます。

## レビュー用テンプレート

セルフレビューと外部レビューは、同じ観点を別々の視点で見るために置いています。

```markdown
# review-self.md
- スコープ外の変更はないか
- 受入基準を満たしているか
- テストは十分か
- 後戻りしやすい設計か

# review-external.md
- 観点が重複していないか
- 手順が曖昧でないか
- 追加で壊れそうな箇所はないか
```

人間が見るのは `review-self.md` ではなく、`plan.md` と `review-external.md` を通した後です。

## status.md

セッション切れ対策は、仕組みとして最小で十分です。

```markdown
# status.md
- phase: plan
- done:
  - PBI作成
- next:
  - 受入基準の確認
- blockers:
  - なし
```

ここで大事なのは、会話の記憶ではなくファイルに状態を残すことです。

## 3コマンド運用

実際の操作はこの3つに絞ると運用しやすいです。

```bash
# 1. 作業コンテキスト作成
/working-context TASK-XXXX

# 2. Plan + ToDo + Test Cases生成
/ai-dev-workflow TASK-XXXX plan

# 3. 承認後に実行
/ai-dev-workflow TASK-XXXX exec
```

Zenn では、ここを長く説明するより「いつ、何を、どのファイルに書くか」を見せたほうが伝わります。

## レビューのチェックリスト

公開リポジトリのテンプレートを引用する場合も、全文よりこのくらいの粒度が扱いやすいです。

- スコープ外の変更が混ざっていないか
- 受入基準がテストケースに落ちているか
- 例外処理が曖昧になっていないか
- 後から分割しやすいか
- セッションが切れても再開できるか

## 使い分け

この記事の位置づけは、note の補足資料です。  
note に思想と背景を書き、Zenn には再利用できるテンプレートと手順を書きます。

その分け方にしておくと、同じテーマでも役割がぶつかりません。

## 参考

- [note の本編](https://note.com/mine_unilabo/n/n3aae6b5467b9)
- [PlanGate GitHub](https://github.com/s977043/plangate)
