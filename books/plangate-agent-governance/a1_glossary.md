---
title: "付録A1: 用語クイックリファレンス"
---

本文で使った用語を、読み返すための最小限の形でまとめます。

PlanGateは更新が続いているため、**正確な個別仕様はPlanGate本体のGlossary / Core Contractを正本**としてください。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/pages/reference/glossary.md
- https://github.com/s977043/PlanGate/blob/main/docs/ai/core-contract.md

## この付録の読み方

用語には2種類あります。

| 種別 | 意味 |
| --- | --- |
| **Official** | 現行PlanGateの公開ドキュメントで定義されている用語・略号 |
| **Book model** | 本書で複数概念を整理するために置いた説明モデル |

たとえばC-X / V-X / WF-X / Mode / Hardening Override / MERGE_READYはOfficialです。

一方、Continue / Stop / Escalate、False Greenの4分類、Cheapest Useful VerificationはBook modelです。

**Book modelをPlanGate公式仕様や業界標準用語として引用しない**ようにしてください。

## まず覚える7つ — Book core concepts

### Artifact — 成果物

会話の外に残る状態・判断材料です。

例:

- Plan
- todo
- test-cases
- approval
- review
- 現在の状態
- handoff
- PR

Artifactが存在すること自体は、その中の主張が正しい証拠ではありません。

### Evidence — 証拠

あるClaimを確認する材料です。

例:

- テスト結果
- lint result
- repository search
- runtime output
- review result
- commit / diff identity

本書では、Artifactを「器」、Evidenceを「その主張を支える材料」と分けました。

### Verification — 検証

定義済みの条件を満たしたか確認する仕事です。

```text
Acceptance Criteria
↓
test / check
↓
PASS / FAIL
```

### Review — レビュー

事前に完全には条件化できなかった問題も探す仕事です。

Verificationと同じではありません。

### Judgment — 判断

EvidenceとReview結果を見て、次へ進むか決める行為です。

```text
Verification != Review != Judgment
```

### Autonomy — 自律性

AIがどこまで人間の逐次確認なしに仕事を進められるか。

### Authority — 判断権限

誰がそのdecisionを行ってよいか。

```text
Autonomy != Authority
```

AIへ実装や修復を広く任せても、最終Authorityまで同じ範囲へ渡す必要はありません。

## C-X — Approval / Control Boundary [Official]

C-Xは主に承認・判断境界です。

| 略号 | 主な意味 |
| --- | --- |
| C-1 | Self Review。Planを作った側が構造的な抜けを確認 |
| C-2 | External / Independent Review。別視点でPlanを確認 |
| C-3 | Human Plan Approval。Executionへ渡すHuman-owned Authority boundary |
| C-3' | ai-loopの限定AI裁定経路。対象となる実行だけ委譲 |
| C-4 | PR Approval。最終受入はHuman-owned |

個別条件は変わりうるため、本書では番号より「ReviewとApprovalを分ける」ことを重視しています。

## V-X — Verification Phase [Official]

| 略号 | 現行の主な役割 |
| --- | --- |
| V-1 | Acceptance Verification |
| V-2 | high-risk / critical向け最適化 |
| V-3 | standard以上の外部モデルReview |
| V-4 | critical向けrelease前check |

すべてのModeで全部実行するわけではありません。

## WF-X — Workflow Phase [Official]

| 略号 | 名称 |
| --- | --- |
| WF-01 | Brainstorm |
| WF-02 | Requirement Expansion |
| WF-03 | Solution Design |
| WF-04 | Build & Refine |
| WF-05 | Verify & Handoff |

本書では番号そのものより、Requirement → Plan → Execution → Verification → Handoff という責務の流れを使っています。

## EH-X — Enforcement Hook [Official]

EH-XはPlanGateのHook識別子です。

例:
- EH-1: plan存在
- EH-2: C-3 approval
- EH-3: plan hash
- EH-6: forbidden files
- EH-9: delegation commit boundary

Hook番号や構成は更新されうるため、現行仕様は本体Glossaryを参照してください。

```text
Gate
= 次へ進める条件

Hook
= 条件を実行時に検査する手段の一つ
```

## Mode — タスクごとの運用強度 [Official]

現行PlanGateは5段階です。

| Mode | ざっくりした位置づけ |
| --- | --- |
| ultra-light | typo / 小さな設定変更など |
| light | 小規模修正 |
| standard | 小機能・複数ファイル |
| high-risk | 複数layer・高リスク |
| critical | architecture・横断変更など |

Modeは**タスクのリスクの軸**です。

## Level / Phase — 段階導入 [Official]

現行ドキュメントには、READMEのLevel 1〜5、staged-adoption-guideのPhase 0〜3、plugin-only-adoptionのLevel 0が併存しています。

本書では、

```text
Level 1〜5
= 採用する機能範囲の見取り図

Phase 0〜3
= 導入・習熟のロードマップ

Mode
= 今回のtaskをどの強度で扱うか
```

として読み分けます。

Phase 3まで導入していても、軽いタスクは軽いModeで扱います。

## Hardening Override [Official]

AIが自分の統制機構を直接変更して自己承認しないための、Human-ownedな保護対象群です。

settings、rules、agents / commands、Hook scripts、bin/plangate、CI workflow、AGENTS.md、CLAUDE.mdなどが対象になります。

対象pathの正確な一覧はmode classification / Hook実装を正本としてください。

## C-3' / Autonomous APPROVE [Official]

条件を限定して、AIがC-3の承認を裁定する経路です。

Hardening Override、policy変更、重大な不一致、判定不能などはHumanへ戻します。C-4はHuman-ownedのままです。

## Governance Harness [Official]

PlanGateが自身を「AIコーディングエージェントのためのガバナンス優先ワークフローハーネス」と位置づけるときの呼び方です。

業界標準のカテゴリへの準拠を主張する言葉ではありません。

## ai-loop V2 [Official]

PlanGateのai-loopの次の版です。Delivery runtime、HarnessManifest、Evaluation Trust Boundary、Ratchet Traceabilityなどを含みます。

本書では、v8.23系のmainにある未リリース差分として扱います。

## RunState [Official]

ai-loopの実行中の状態を表すruntime stateです。v8.23時点の実装詳細で、最初から名前を覚える必要はありません。

Context Lifecycle側では、RunStateを新たに追加せず、既存の所有者を参照でつなぎます。

## Intent Context Package [Official]

仕事の意味（`context_ref`）と、その時点の成果物のスナップショット（`snapshot_ref`）を分けて引き渡す仕組みです。

## PR_CONVERGING [Official]

PR作成後に、checks待ち、checks失敗、review修復、conflict解消などを収束させている途中のLifecycle Stateです。

## Execution Authority [Book model]

承認したPlanの範囲で実装へ進めてよいという権限です。

Reviewを通過しただけでは渡さず、Approvalで渡します。

## Fresh Evidence

現在判断している成果物に対する、直近の検証証拠です。

```text
commit A
→ test PASS
→ repairしてcommit B
```

なら、AのPASSだけでBの完了を主張しません。

## Fresh Context

会話を全部捨てることではありません。

```text
current stateをArtifactへcheckpoint
↓
必要なArtifact / Evidenceを読み直す
↓
新しいsession / reviewerを開始
```

する考え方です。

## Identity Binding

EvidenceやReviewが「何に対するものか」を結びつけることです。

例:
- plan_hash
- context_ref
- snapshot_ref
- commit SHA
- PR head
- review target

本書では、長時間・複数Agentで特に重要な横断原則として扱いました。

## Continue / Stop / Escalate [Book model]

本書でExecution中の判断を整理するために使う3分類です。

| 判定 | 意味 |
| --- | --- |
| Continue | 承認範囲内で自律継続 |
| Stop | 決定論的な不変条件違反 |
| Escalate | Scope / Risk / Authority等の意味が変わる |

これはPlanGate公式の単一taxonomy名ではなく、本書で複数のruntime判断を整理するためのモデルです。

## MERGE_READY [Official]

ai-loop DeliveryにおけるAI側の正常終端です。

```text
MERGE_READY != MERGED
```

AIはCI / review修復 / Evidence準備まで進めても、merge Authorityは別に扱います。

## Human-owned / AI-owned / CI-owned / Workflow-owned [Official]

現行PlanGateには責務4分類があります。

| 責務 | 主な役割 |
| --- | --- |
| AI-owned | 実装・検証・PR準備など |
| Human-owned | 重要な承認・merge・保護設定の適用など |
| CI-owned | drift / contract検査など |
| Workflow-owned | handoff / DoD / タスクの状態など |

重要なのは、人間が全部作業することではなく、**最終Authorityの所在を明示すること**です。

## False Green [Book model]

本書で使った整理です。

検査がgreenでも、本当に判断したいClaimを測れていない状態を指します。

本書ではProxy Green / Coverage Green / Classifier Green / Observer Greenの4パターンに分けました。

PlanGate公式Glossaryの用語ではありません。

## Cheapest Useful Verification [Book model]

本書内で使った実践ラベルです。

> 次の意思決定を変えうるUnknownについて、十分なEvidenceを最小コストで取りに行く。

PlanGate公式phase名や業界標準用語ではありません。
