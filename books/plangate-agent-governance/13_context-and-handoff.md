---
title: "Contextを会話からArtifactへ移す"
---

長時間AIエージェントを使っていると、会話履歴は便利です。

「さっきの調査結果」
「前に却下した案」
「このエラーの原因」
「次にやること」

が、そのまま残っているからです。

ただし、会話が長くなるほど別の問題が出ます。

> **今も有効な情報と、もう捨てた情報が同じ履歴に残る。**

長時間実行やAgent切替では、この問題を放置できません。

## 長い会話は「記憶」にはなるが「正本」にはなりにくい

会話には、作業途中の情報が大量に含まれます。

- supersededな設計案
- 一時的な仮説
- tool output
- repair前の状態
- すでに解消したblocker
- Builder自身の推論

これを次のAgentへ丸ごと渡すと、

~~~text
必要な現在状態
+
古い判断
+
大量の探索ログ
+
作成者のバイアス
~~~

を同時に引き継ぐことになります。

PlanGateのContext Lifecycleでは、これを避けるために、

> **conversation / tool historyではなく、canonical artifactとevidenceをcheckpointして次のcontextを始める**

という方針を置いています。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/context-lifecycle.md

## Fresh Contextは「記憶を捨てる」ことではない

Fresh Contextという言葉だけを見ると、セッションをリセットして全部忘れるように見えます。

実際は逆です。

残すべき状態を先にArtifactへ出します。

~~~text
conversation / tool history
        ↓
materialな決定をcanonical stateへ反映
        ↓
progress / blocker / next actionを更新
        ↓
Evidenceを安定した場所へ保存
        ↓
fresh session
        ↓
必要なArtifactだけ再読込
~~~

つまり、

> **履歴を持ち越すのではなく、現在有効な状態を再構成して渡す。**

という設計です。

## 何をcheckpointするか

現行Context Lifecycleでは、主に次を既存の正本へ戻します。

- final executable Plan
- current phase / completed work / current work
- blocker
- next action
- plan deviation
- materialなdecision
- test / review Evidenceへの参照

大事なのは、新しい巨大なcheckpoint fileを発明しないことです。

PlanGateは既存の所有先を再利用します。

~~~text
Plan
→ canonical plan

Current State
→ INDEX / current-state

Decision
→ decision-log / ADR

Evidence
→ evidence / report / review artifact

Handoff
→ existing handoff surface
~~~

## Contextは3つの問いに圧縮できる

実装名をいったん忘れると、長時間実行で必要なのは次の3つです。

| 問い | 何を見るか |
| --- | --- |
| 何が固定された契約か | Requirement / approved Plan / Acceptance / Approval |
| 今どこにいるか | Current State / blocker / next action / current Evidence |
| 次の主体へ何を渡すか | Handoff / Review Package / stable refs |

Dynamic Context Engine、Intent Context Package、Context Lifecycleは、この3つの問いを別の角度から支える仕組みです。

最初から各schema名を覚える必要はありません。

## Intent Context Packageは「意味」と「スナップショット」を分ける

current mainでは、Intent Context Package v1が導入されています。

2026年10月3日時点では、GitHub ReleasesのLatestはv8.22.0です。一方、mainのREADMEはv8.23.0をLatestと表示し、生成済みChangelogページはv8.23.0をTBDのまま残しています。本書ではrelease状態を断定せず、ここで扱うv8.23系のContext機能を **current main上の未リリース差分** として扱います。

ここではContext identityを二つに分けています。

- `context_ref` — 意味上のContext identity
- `snapshot_ref` — その時点のexact artifact identity

なぜ分けるのでしょうか。

たとえば同じ要件・同じintentでも、取得時刻や補助情報が更新されればexact snapshotは変わります。

しかし、それだけで「別の仕事」になったわけではありません。

~~~text
context_ref
= この仕事が何を意味しているか

snapshot_ref
= その意味を、どの具体スナップショットで見たか
~~~

と分けることで、semantic identityとaudit identityを混ぜないようにします。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/context-engine.md

## Contextには固定するものと動的に取るものがある

Dynamic Context Engineでも、Contextを二種類に分けています。

### Contract Context

- PBI
- approved Plan
- test-cases
- C-3 approval

承認境界に関わるため、勝手に動的更新しません。

### Dynamic Context

- git status
- diff
- recent files
- test failure
- repository structure
- related history

現在の作業に応じて必要な分だけ取得します。

全部を毎回Promptへ詰め込むのではなく、

> **契約として固定するContextと、作業のために取得するContextを分ける。**

という考え方です。

## いつFresh Contextへ切り替えるか

現行Context Lifecycleでは、standard以上で次のような場面をMUST triggerにしています。

- worker / agent / model / runtimeの変更
- independent reviewerの開始
- implementer → reviewerのhandoff
- worker間handoff
- 外部待ちやusage limitによる意図的中断

一方、ultra-light / lightでは必須にしていません。

Context management自体がceremonyになるからです。

ここでも、長時間・複数主体になったときだけ強くする設計です。

## Identityを引き継ぐ

Handoffで状態を渡すとき、「最新Planです」「テスト済みです」だけでは足りません。

どの対象なのかを特定できる必要があります。

たとえば、

~~~text
Task
→ task id / context_ref

Plan
→ plan_hash

Context snapshot
→ snapshot_ref

Implementation
→ commit SHA / PR head

Evidence
→ どのcommitに対する実行結果か
~~~

です。

これにより次のAgentが、

> このEvidenceは今のHEADに対するものか。  
> このApprovalは今のPlanに対するものか。

を確認できます。

Contextを渡すというより、**状態とIdentityの組を渡す**と考える方が正確です。

## Handoffは「会話の要約」ではなく再開API

Handoffで大事なのは、過去をきれいに要約することではありません。

次の主体が、

- 今どこにいるか
- 何が確定しているか
- 何が未解決か
- 次に何をするか
- 何をEvidenceとして読めばよいか

を再構成できることです。

その意味でHandoffは、

> **次のAgentが現在状態から再開するためのAPI**

と考えられます。

## raw conversationを渡さない理由

特にReviewerへhandoffするとき、raw implementation conversationを渡さないことが重要です。

Builderが、

> この設計で問題ないはずです。  
> ここは安全です。

と何度も説明した履歴をReviewerがそのまま読むと、その前提を共有してしまいます。

Context Lifecycleでは、independent review時に、

- review package
- diff
- Evidence

を使い、implementerのconversational reasoningを引き継がない方針を明記しています。

これは次章の「独立レビュー」へつながります。

## 実装名より「再開できるか」で判断する

Context設計が機能しているかは、ファイル数で判断しません。

次のAgentが前の会話を読まなくても、

1. 承認された仕事を特定できる
2. 現在地を特定できる
3. 未解決事項を特定できる
4. Evidenceへ辿れる
5. 次のactionを開始できる

なら、Handoffとして機能しています。

逆にContext Manifestやhandoff fileが存在しても、これらが分からなければ再開可能とは言えません。

## この章で持ち帰ること

長時間実行で必要なのは、会話を保存し続けることではありません。

> **現在有効なstate / decision / evidenceをArtifactへcheckpointし、次の主体はそこからfreshに再構成する。**

これがContext Boundaryです。

次章では、このfresh-contextをReviewerの独立性へどう使うかを見ます。
