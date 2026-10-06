---
title: "自律性と判断権限を分ける — Autonomy != Authority"
---

AIエージェントが、

- Planに沿って実装し
- 範囲を守り
- テストを回し
- Review指摘を修正し
- PRを更新する

ところまで自律的に進められるなら、人間は不要になるのでしょうか。

PlanGateでは、ここを二つに分けます。

```text
Autonomy != Authority
```

日本語では、

- **Autonomy**: どこまで自律的に作業を進められるか
- **Authority**: どの決定を行う権限を持つか

です。

## 自律性は高くできる

承認されたPlanの内側では、AIへかなり任せられます。

たとえば、

- 実装
- テスト実行
- lint修正
- Acceptance Verification
- Review指摘への修復
- PR更新
- CI結果の収集

などです。

ここで毎回人間へ「次に進んでよいですか」と聞いていたら、自律化の効果は小さくなります。

第3部で境界を先に決めたのは、その間を任せるためでした。

## 自律化の価値は「人間の待ち時間を減らす」ことにある

Autonomyを高くする一番の価値は、AIが派手に動くことではありません。

人間の判断待ちでフローが止まる箇所を減らせることです。

Plan、Scope、Verification Policyが明確なら、

```text
実装
→ test
→ lint
→ repair
→ 再test
→ PR更新
```

をAgent側で継続できます。

人間が細かなstepごとに許可を出す必要はありません。

これは、作業者を100%稼働させるというリソース効率ではなく、**価値がPR-readyへ流れるフロー効率**を上げる方向です。

## 判断権限は別に設計する

一方で、

- 範囲を広げる
- high-riskな設計変更を採用する
- セキュリティ上の残リスクを受容する
- protected policyを変更する
- 最終的にmergeする

といった決定は、実装能力とは別のAuthorityです。

AIが技術的にできることと、AIに決定権を持たせることを分けます。

```text
Can do
    ≠
May decide
```

ということです。

## Risk-based Autonomy

すべてをHuman-ownedに固定すると、自律性は上がりません。

逆に、すべてをAIへ渡すと、重要な境界の責任が曖昧になります。

そこでリスクに応じて変えます。

概念的には、

| 領域 | Autonomy | Authority |
| --- | --- | --- |
| 承認範囲内の局所実装 | 高くできる | 既存Plan内 |
| テスト / lint / 修復 | 高くできる | Verification Policy内 |
| 範囲変更 | 停止 | 再Approvalが必要 |
| high-risk / critical判断 | 準備はAI | Human-owned |
| Hardening / policy変更 | 提案・patch準備まで | Human-owned |
| PR convergence | AIへ広く委譲可能 | mergeは別 |
| merge | 実行しない | Human-owned |

ここでの目的は、「AIか人間か」を固定することではありません。

**どのdecision classを誰が持つかを明示すること**です。

## MERGE_READYは、この分離を表す状態

PlanGateのai-loop V2では、AIのDelivery責務を `MERGE_READY` まで伸ばしています。

これは、

> PRを作った

で終わるのではなく、

- CIを確認する
- Review feedbackへ対応する
- conflictや修復を収束させる
- 必要なEvidenceを揃える

ところまでAI側で進める考え方です。

ただし、

```text
MERGE_READY
    ≠
MERGED
```

です。

現行taxonomyでは、`MERGE_READY` はDelivery Runの正常なTerminal Outcomeです。

C-4 / mergeはそのRunの外にあり、Human-ownedとされています。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/taxonomy.md
- https://github.com/s977043/PlanGate/blob/main/docs/ai/core-contract.md

## 「Human-owned」はHumanが全部作業する意味ではない

ここも誤解しやすいところです。

Human-ownedな領域でも、AIはかなり準備できます。

たとえばHardening Override対象なら、

- 調査
- 変更案
- patch
- dry-run
- Evidence
- 適用手順

までAIが用意し、最終applyだけHuman-ownedにできます。

つまり、

```text
Human-owned
= 人間が全部手作業する

ではなく

Human-owned
= 最終的なAuthorityを人間に残す
```

です。

この分離があると、人間の作業量を増やさずに責任境界を残せます。

理想は、

```text
AI
→ 調査・実装・検証・repair・Evidence準備

Human
→ 残リスクとbusiness contextを見てdecision
```

へ近づけることです。

## Authorityを渡すなら条件を明示する

逆に、一部のApproval AuthorityをAIへ委譲する場合もあります。

現行PlanGateには、対象となる実行向けのC-3'や、条件付きのAutonomous APPROVEがあります。

このとき大切なのは、

> AIが賢そうだから任せる

ではなく、

- 対象Mode
- 範囲
- risk
- protected resource
- escalation条件
- 判定不能時のfallback

をPolicyとして持つことです。

Authorityの委譲も、明示的なBoundaryの中で行います。

## Continue / Stop / EscalateをPolicyにする

AutonomyとAuthorityを実運用へ落とすなら、Agentに「いい感じに判断して」ではなく、少なくとも次の3分類を持たせます。

| 判定 | 典型条件 | 次の行動 |
| --- | --- | --- |
| Continue | 承認範囲内、必要Evidenceあり、risk不変 | AIが継続 |
| Stop | Iron Law / mechanical guard違反 | 即停止、迂回しない |
| Escalate | Scope / Acceptance / Risk / Architecture / Authorityの意味が変わる | Re-plan / Human Judgment |

たとえば、

- lint FAILで原因が明確、Plan内修復可能 → **Continue**
- C-3未承認なのにproduction code編集 → **Stop**
- スキーマ変更が新たに必要 → **Escalate**
- Review修復後にテスト未実行 → **Continueではなく再Verification**
- protected policy変更が必要 → **Escalate**

です。

このPolicyがあると、人間は「毎回判断する人」ではなく、**Escalateされた意味的変更を判断する人**になれます。

## 最終判断を残す理由

最終判断に人間を残すのは、人間がAIより常に正しいからではありません。

最終判断には、

- business priority
- release timing
- residual risk
- accountability
- customer impact

のような、テストだけでは決まらない情報が入ります。

したがって、AIの実装能力が上がっても、Authority設計は別問題として残ります。

## この章で持ち帰ること

AI駆動開発で目指したいのは、

> 人間が細かく監視すること

でも、

> AIへ全部の決定権を渡すこと

でもありません。

> **境界の内側はできるだけ自律化し、境界を越えるAuthorityだけを意図的に残す。**

これがAutonomyとAuthorityを分ける意味です。

これで第4部の流れがつながりました。

第3部で「何を承認したか」を固定し、第4部で「承認後にどう進み、どこで止まり、どこで戻すか」を固定しました。

```text
Hook / Enforcement
→ 越えてはいけない境界を検査する

Fresh Evidence
→ 現在の成果物が条件を満たしたか確認する

Autonomy / Authority
→ どこまで任せ、どの決定権を残すか決める
```

次の第5部では、この構造を長時間セッションや複数Agentへ広げます。
