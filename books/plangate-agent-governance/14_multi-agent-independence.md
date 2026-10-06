---
title: "独立レビューを本当に独立させる"
---

AIエージェントを増やせば、レビュー品質は上がるでしょうか。

Planner、Builder、Reviewerを3体用意する。

モデルも変える。

一見すると、かなり独立したチェックに見えます。

しかし、3体すべてに同じ長い会話履歴を渡していたらどうでしょうか。

> **Agentが別でも、前提が同じなら独立性は弱い。**

ここが複数Agent設計で重要な点です。

## 「別Agent」と「独立Reviewer」は同じではない

独立性には複数の要素があります。

たとえば、

- roleが違う
- モデルが違う
- promptが違う
- contextが違う
- evidence sourceが違う
- previous reasoningを見ていない

などです。

モデルを変えることは、その一つにすぎません。

```text
same context
+ same assumptions
+ same evidence selection
+ different model
```

でも、同じ盲点を共有することはあります。

## Reviewerへ渡すものを絞る

PlanGateのContext Lifecycleでは、independent reviewerが始まるとき、standard以上ではcheckpoint後にfresh contextから始める方針があります。

Reviewerが読むのは、

- canonical Plan
- review package
- diff
- テスト / verification Evidence
- 必要なプロジェクトrules

です。

一方、

- Builderの生のチャット
- hidden reasoning
- superseded alternatives
- 「なぜ自分の実装が正しいと思うか」という長い弁明

は、レビューContextとして機械的に持ち越しません。

目的は情報を減らすことそのものではありません。

> **Reviewerが自分で観測できる材料から判断を始められるようにすること。**

です。

## Review Packageを契約にする

独立Reviewerへ渡す情報を、その場の会話で決めない方が安定します。

最小のReview Packageは、たとえば次のようにできます。

### 渡す

- タスクintent / Requirement
- approved PlanとScope
- Acceptance Criteria
- 対象diff / commit identity
- Verification Evidence
- relevantプロジェクトrules
- 既知のrisk / 未解決の項目

### 原則として渡さない

- Builderの生の会話ログ
- hidden reasoning
- supersededな設計案の長い履歴
- Builder自身の「問題ない」という結論
- 期待するreview verdict

重要な設計理由が必要なら、会話ではなくdecision-log / ADR / Planへ反映して渡します。

```text
Builderの説明
→ Reviewerへの説得材料

ではなく

Artifact + Diff + Evidence
→ Reviewerの観測材料
```

にします。

この契約があると、モデルを変えるかどうかに依存せず、review inputの独立性を管理できます。

## ReviewerはBuilderと違う問いを持つ

役割分離も必要です。

Builderの問いは、

> どうすればこのPlanを実装できるか。

です。

Reviewerの問いは、

> このdiffはPlanとAcceptanceを満たし、見落としている重大な問題がないか。

です。

Verifierならさらに違います。

> 定義済みの条件をEvidenceでPASS / FAILできるか。

となります。

```text
Builder
→ 作る

Verifier
→ 条件を満たしたか確かめる

Reviewer
→ 定義外の問題も探す

Human
→ 残るtrade-offとAuthorityを判断する
```

Agent数ではなく、**問いと責務を分けること**が先です。

## C-2でも「何を見るか」を分けている

PlanGateのReview Principlesでは、C-2のPlan Reviewを二つのlaneへ分けています。

### 設計妥当性lane

読む:

- Plan
- todo
- test-cases
- PBI

主眼:

- planの論理
- Acceptance coverage
- 範囲整合

### Codebase整合lane

読む:

- existing pattern
- relevant codebase

主眼:

- 既存実装と矛盾していないか
- 追加すべきAC候補がないか

この分け方の狙いは、全Agentが同じものを全部読むことではありません。

**別の情報源・別の問いを持たせること**です。

Sources:
- https://github.com/s977043/PlanGate/blob/main/.claude/rules/review-principles.md

## Modelを変えるだけでは足りない

別モデルを使うことには価値があります。

同じモデルfamily特有の癖や推論傾向から離れられる可能性があります。

ただし、

> Model diversity = Review independence

とは言えません。

独立性を高めたいなら、少なくとも次を見ます。

| 軸 | 問い |
| --- | --- |
| Role | BuilderとReviewerの目的は違うか |
| Context | raw implementation reasoningを共有していないか |
| Evidence | Reviewer自身がdiff / testsを確認できるか |
| Authority | Reviewerが自己承認していないか |
| Failure handling | unavailable / inconclusiveを「問題なし」にしていないか |

これらが揃わず、モデル名だけ違っても、独立レビューの形だけが残ります。

## Review対象のIdentityもbindする

Reviewerが独立していても、古いdiffを見ていたら意味がありません。

Review Artifactには少なくとも、

- 対象Plan
- 対象commit / diff
- 使用したEvidence
- review結果

の対応関係が必要です。

修復後にHEADが変わったなら、以前のreviewがどこまで有効かを再判断します。

```text
reviewed commit A
        ↓
repair
        ↓
commit B

Aへのreview
≠
自動的にBへのreview
```

Fresh Contextだけでなく、**Review targetのIdentity**も独立性の一部です。

## 「指摘ゼロ」を成功条件にしない

Review Principlesでは、adversarial reviewの収束条件を「指摘ゼロ」にしていません。

high-risk / criticalなどでは複数roundを要求し、2round目以降は、

- 前回修正が本当に効いたか
- 修正が新しい穴を作っていないか
- fail-closed化が正常系を壊していないか

を疑います。

そして収束は、

> **新しい回避クラス / failure classが出なくなったか**

で見ます。

これも独立性の一部です。

同じ視点で「もう一回レビュー」するのではなく、前回の修正そのものを疑う視点へ変えます。

## Reviewer unavailableを「問題なし」にしない

外部ReviewerがquotaやCLI不在で実行できないこともあります。

このとき、

```text
review result = 0 findings
```

と、

```text
review unavailable
```

は全く違います。

PlanGateのReview Principlesでも、unavailableは理由、代替観点、未充足riskを残す設計です。

「レビューできなかった」をgreenへ変換しないことが重要です。

## 複数Agentを使わない方がよいケース

責務分離が重要でも、毎回Planner / Builder / Verifier / Reviewerを別Agentにする必要はありません。

たとえば、

- typoや小さなconfig変更
- deterministicテストで十分な修正
- contextが小さくhandoff costの方が高い
- Reviewer追加による新しい観点がほぼない

なら、単一Agent + deterministic verificationで十分な場合があります。

逆に、

- セキュリティboundary
- irreversible action
- architecture変更
- long-running修復loop
- Builderのassumptionを独立して疑いたい

なら、Contextを切った別Reviewerの価値が上がります。

> **Agent topologyはタスクriskとcoordination complexityから決める。**

という位置づけです。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/README.md

## Fresh Contextにもコストがある

もちろん、毎回新しいセッションを立ち上げ、Artifactを読み直すにはコストがあります。

そのため現行Context Lifecycleでは、ultra-light / lightへmandatory ceremonyを増やしていません。

Independent reviewの強さもriskに応じて変えます。

> **独立性は最大化するものではなく、誤判断コストに見合う強さで設計する。**

という考え方です。

## 独立性をチェックする5問

独立Reviewを設計するときは、次の5問で確認できます。

1. **Role** — Builderと別の問いを持っているか
2. **Context** — Builderのraw reasoningをそのまま継承していないか
3. **Evidence** — Reviewer自身がdiff / テスト / sourceへ辿れるか
4. **Authority** — ReviewerのPASSが最終Authorityへ自動変換されていないか
5. **Failure** — unavailable / inconclusiveをgreenとして扱っていないか

すべてを別モデルにすることより、この5つを分離する方が先です。

## この章で持ち帰ること

独立レビューに必要なのは、「別のAIを呼ぶこと」だけではありません。

> **Role、Context、Evidence、Authorityを分け、ReviewerがBuilderの推論ではなく現在のArtifactから判断できるようにする。**

これがReview Boundaryです。

次章では、Reviewが終わったあとも残るCIや修復を含め、AIのDelivery責務をどこまで伸ばすかを扱います。
