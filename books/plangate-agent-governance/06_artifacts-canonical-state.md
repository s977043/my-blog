---
title: "会話を正本にせず、役割ごとのArtifactへ状態を残す"
---

AIエージェントと長く作業していると、会話には大量の情報が溜まります。

- 最初に考えた案
- 途中で捨てた案
- tool output
- 一時的な仮説
- 修正前の判断
- 最新の決定
- いま何をしているか

この会話をそのまま「現在の状態」として扱うと、何が有効な決定なのか分かりにくくなります。

current mainのContext Lifecycleでは、長時間セッションの状態を**会話履歴そのものではなく、現在有効なArtifactとEvidenceの参照で引き渡す**方針を明示しています。

## 会話履歴は便利だが、正本には向かない

会話は探索には向いています。

案を出し、比較し、失敗し、やり直す。その過程を残せます。

しかし、実行状態の正本として見ると問題があります。

### 古い判断が残る

A案からB案へ変えても、会話には両方残ります。

### 必要な情報とノイズが混ざる

最新のPlanを知りたいだけなのに、調査ログや失敗した試行まで読み直すことになります。

### 次のAgentを前の推論へ引っ張る

Builderの会話をReviewerへそのまま渡すと、「独立レビュー」でもBuilderの説明に引っ張られます。

### セッションへ依存する

会話が唯一の状態だと、model / runtime / workerを変えたときの再開条件が曖昧になります。

そこで重要な状態を会話の外へ出します。

## まず4種類に分けて考える

初見では、ファイル名を覚える必要はありません。

まず次の4つで十分です。

| 状態 | 答えたい問い |
| --- | --- |
| Plan | 何を、どの範囲で実行するのか |
| Current State | 今どこまで進み、次は何をするのか |
| Evidence | その主張や完了を何で確認したのか |
| Handoff | 次の主体は何を読めば再開できるのか |

この4種類を会話の外へ出すと、セッションが切れても仕事の状態を復元しやすくなります。

## 「正本」は1ファイルではない

ここでいう正本は、巨大な `canonical.md` を一つ作る意味ではありません。

関心ごとに「ここを見れば現在の答えが分かる」という所有先を決めます。

たとえば、

```text
何を実行する？
→ Plan

今どこ？
→ Current State

本当に確認した？
→ Evidence

次の担当は何を見る？
→ Handoff
```

という形です。

同じ意味の情報を複数箇所へコピーしないことの方が重要です。

## Plan / todo / test-casesにも別の役割がある

PlanGateでは、実装前のArtifactも分けています。

### Plan

何を、なぜ、どの設計で進めるか。

Approvalの対象になります。

### todo

Planを、実行可能な仕事へ分けます。

### test-cases

Acceptance Criteriaを、実装後に確認できる条件へ落とします。

つまり、

```text
何を作るか
≠
どう進めるか
≠
何をもって満たしたと確認するか
```

です。

細かな書き方は既存のPlanGate実践ガイドへ譲ります。本書で重要なのは、それぞれが後段のGateやVerificationで違う役割を持つことです。

## Handoffは「会話の要約」ではなく再開インターフェース

長時間実行では、「今まで何を考えたか」より、「次に何をすればよいか」が重要になります。

Handoffで渡したいのは、会話の全文ではありません。

- 現在のphase
- 完了済みの仕事
- 現在の仕事
- blocker
- next action
- Planからの逸脱
- 必要なEvidenceへの参照

など、次の主体が再開するために必要な情報です。

その意味でHandoffは、

> **次の主体が現在の正本から安全に再開するためのインターフェース**

と考えられます。

## 先ほどのタスクで、会話が切れても再開できるか

注文一覧APIの例で、実装の途中にセッションが切れたとします。

会話だけに状態があると、次のAgentは長い履歴から、

- schema変更はしないと決めた
- pagination併用を確認する必要がある
- 実装は途中まで終わっている
- 不正値ケースがまだ未検証

といった現在地を復元しなければなりません。

状態がArtifactへ出ていれば、見る場所を絞れます。

```text
Plan
→ schema変更なし、scopeはここまで

Current State
→ 実装済み / 未検証の項目

Evidence
→ すでに通ったテスト結果

Handoff
→ 次に不正値とpagination併用を確認する
```

この違いが、Artifactを「記録」ではなく**再開可能な状態**として扱う理由です。

## Fresh Contextは「全部忘れる」ことではない

現行PlanGateでは、model / runtime / workerの変更、独立Reviewerの開始、worker handoffなどで、standard以上ではcheckpoint後にfresh contextから再開する方針があります。

ここでいうfresh contextは、状態を捨てることではありません。

```text
conversation / tool history
        ↓
現在有効な状態をcheckpoint
        ↓
必要なArtifactとEvidenceを再読込
        ↓
fresh session / fresh reviewer
```

です。

古い会話を持ち越す代わりに、**現在有効な状態を再構成して渡す**という考え方です。

具体的な実装では、現行PlanGateは次のように既存の所有先を再利用しています。

- executable Plan: canonicalな `plan.md`
- current position: `INDEX.md` + `current-state.md`
- rationale: decision-log / ADR
- evidence: report / Review Artifact等への参照
- session/tool handoff: local-exec-handoff
- worker package: context-packager / dispatch
- runtime state: RunState

ここはv8.23時点の実装詳細です。読者が最初から名前を覚える必要はありません。

## 正本を増やしすぎると逆に壊れる

Artifactを増やせば安全になるわけではありません。

同じ情報を、

- plan.md
- checkpoint.json
- context.md
- status.md
- 別DB

へ重複して書けば、どれが最新か分からなくなります。

Context Lifecycleの公開文書でも、新しいcheckpoint schemaやContext Manifest、RunStateを追加しないことを明示しています。

既存の所有者を再利用し、必要な情報は参照でつなぎます。

> **状態を外へ出す。ただし、同じ意味の正本を増やさない。**

これが重要です。

## Artifactにもコストがある

状態を外へ出すほど、更新する手間も増えます。

そのため、すべてのタスクで同じ量のArtifactを必須にするのは逆効果です。

PlanGate自身もModeや段階導入を持ち、軽い作業へ最大構成を強制しません。

正本化の目的は文書を増やすことではなく、

> **次の判断や再開に必要な状態だけを、会話の外へ安定して残すこと**

です。

## 会話に残してよいもの、正本へ出すもの

すべての会話を保存する必要はありません。

現行Context Lifecycleでは、raw chat transcriptやhidden reasoningを実行状態として保存しない方針です。

残すべきなのは、

- materialな事実
- 最終的な決定
- failure
- blocker
- current state
- Evidenceへの安定した参照

です。

探索途中の雑談や捨てた推論まで、次のAgentへ機械的に引き継ぐ必要はありません。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/context-lifecycle.md

## この章で持ち帰ること

長時間動くAIエージェントにとって、会話履歴は便利な作業メモですが、安定した正本ではありません。

最初は次の4つだけ押さえれば十分です。

```text
Plan
Current State
Evidence
Handoff
```

> **重要な状態を役割ごとのArtifactへ出し、同じ意味の正本を増やさず、次の主体は現在の状態から再開する。**

これで第2部の地図が揃いました。

次の第3部では、実装前にそのArtifactをどう作り、推測をEvidenceへ変え、Approval Boundaryへつなぐかを見ていきます。
