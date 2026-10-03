# Book Plan

## Positioning

既存の `books/plangate-guide/` は残す。

- 既存 Book: **AI にコードを書かせる前に、計画で判断を終えておくための実践ガイド**
- 新 Book: **AI エージェントへ仕事を任せるために、判断境界・証拠・状態・権限をどう設計するか**

既存 Book を新版へ置換しない。読者課題が異なる別 Book として育てる。

## Central Claim

> AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をつくる。

PlanGate はそのために、Plan / Review / Approval / Execution / Verification / Handoff / Human Judgment を成果物とゲートとして明示する。

## Reader

主読者:

- Claude Code / Codex / Cursor などを日常的に使うエンジニア
- AIコーディングを個人利用からチーム開発へ広げたい Tech Lead / EM
- 自律性を上げたいが、品質・責任・監査可能性を失いたくない人

前提:

- AIコーディングの基本操作は知っている
- PlanGate は知らなくても読める
- Scrum / TDD / SDD の専門知識は必須にしない

## Reader Transformation

Before:

- AI が賢ければ任せられると考える
- Review / Verification / Approval を同じものとして扱う
- 会話履歴を状態の正本にする
- 「完了しました」をそのまま受け取る
- 自律性を上げるほど人間の関与を消す方向に考える

After:

- Agent ではなく Artifact / Evidence / Boundary を設計対象として見る
- Verification / Review / Judgment を分離する
- Canonical Artifact と Fresh Context で状態を受け渡す
- Fresh Evidence で完了を判定する
- Autonomy と Authority を分け、人間の判断点を意図的に残す

## Narrative

```text
AIが速くなった
  ↓
判断がボトルネックになった
  ↓
AgentではなくArtifact/Evidenceを信頼する
  ↓
正しく作れたかと、作ってよいかは別
  ↓
PlanGate = Judgment Boundary を持つ Governance Harness
  ↓
Plan / Gate / Execution / Verification / Handoff
  ↓
Context と複数Agentへ拡張
  ↓
Delivery / Eval / False Green
  ↓
段階導入して自分の開発へ持ち込む
```

## Evidence Boundary

### 主な一次情報

- `s977043/PlanGate` の README / docs / issue / release / 実装
- PlanGate 自身で再現・計測した failure / fix
- 必要に応じて公式ドキュメント（OpenAI / Anthropic / GitHub など）

### 書き分け

- **Observed**: PlanGate の実運用で実際に起きたこと
- **Verified**: コード、テスト、Issue、公式文書で確認できること
- **Interpretation**: 著者がそこから導いた設計上の解釈

効果を一般化しない。PlanGate の設計判断と、業界一般の原則を混同しない。

## Chapter Contract

各章は原則として次を持つ。

1. Reader Problem
2. Concrete Failure / Scenario
3. Concept
4. PlanGate での具体化
5. Trade-off / Limitation
6. Takeaway
7. 次章への接続

抽象論だけで終えない。最低1つは公開一次情報または再現可能な具体例を置く。

## Part I — なぜ判断境界が必要か

### 01 判断がボトルネックになった

Goal:
AI の高速化により「書けるか」ではなく「任せてよいか」が問題になることを示す。

Primary example:
規模 M と見積もられた作業が実測 1,697 ファイルだった事例。

Takeaway:
実装前判断の失敗は、コード品質だけでは防げない。

### 02 AgentではなくArtifactを信頼する

Goal:
Agent の自己申告ではなく外部から確認可能な成果物を判断材料にする。

Key model:
`Agent -> Artifact -> Evidence -> Judgment`

### 03 Verification / Review / Judgmentを分ける

Goal:
「動いた」「問題がない」「採用してよい」を別責務として理解する。

Key model:
`Verification != Review != Judgment`

## Part II — PlanGateの全体像

### 04 PlanGateの全体フロー

Goal:
詳細へ入る前に全体の地図を渡す。

Flow:
Requirement -> Plan -> Review -> Approval -> Execution -> Verification -> PR -> Human Judgment

### 05 Governance Harnessとして考える

Goal:
Plugin / Framework / Workflow のどれか一語へ押し込まず、PlanGate の設計対象を説明する。

Define:
Workflow / Skill / Agent / Gate / Artifact / Hook の責務境界。

### 06 Artifactを正本にする

Goal:
会話ではなく成果物を state の canonical source にする理由を説明する。

Artifacts:
pbi-input / plan / todo / test-cases / status / handoff / evidence。

## Part III — 実装前に品質を作る

### 07 RequirementからPlanを作る

Goal:
Why / Scope / Acceptance Criteria / Non-goals / Unknowns を実装前に固定する。

### 08 推測よりEvidenceを取りに行く

Goal:
未確認の前提を、検索・コード・テスト・ログなどの Cheapest Useful Verification で解消する。

Primary examples:
件数実測、存在しないファイル/関数を前提にしたPlan。

### 09 Approval Boundaryを置く

Goal:
Plan が存在することと、実行許可があることを分ける。

Focus:
C-1 / C-2 / C-3 と APPROVE / CONDITIONAL / REJECT。

## Part IV — 承認後を安全に自律化する

### 10 Hookでお願いを制約へ変える

Goal:
Prompt rule と mechanical enforcement の違いを示す。

Primary examples:
approval guard / scope guard / destructive operation guard。

### 11 Fresh Evidenceで完了を判定する

Goal:
「完了しました」を完了条件にしない。

Focus:
L-0 / V-1〜V-4 / fresh verification evidence。

### 12 AutonomyとAuthorityを分ける

Goal:
AIが自律実行できる範囲と、最終決定権を分ける。

Key model:
`Autonomy != Authority`

Boundary:
MERGE_READY は AI、MERGED は Human。

## Part V — 長時間・複数Agentへ拡張する

### 13 Contextを会話からArtifactへ移す

Goal:
Long session / model switch / worker switch でも判断基準を再現できる状態を作る。

Focus:
Intent Context Package / checkpoint / fresh context。

### 14 独立レビューを本当に独立させる

Goal:
Reviewer が Builder と同じ会話文脈を引きずる問題を扱う。

Focus:
Planner / Builder / Verifier / Reviewer / Human の責務分離。

### 15 DeliveryをMERGE_READYまで収束させる

Goal:
PR 作成後の CI / review repair を含め、AI の責務終点を定義する。

Boundary:
NO MERGE BY AI。

## Part VI — Harness自体を改善する

### 16 EvalとFalse Green

Goal:
「テストが緑 = 守れている」を疑う。

Primary examples:
- linked worktree で approval boundary が外れた
- 文字列判定による誤検知
- plugin registration の false green
- 誤起動で危険な gh/git が spawn された経路

Focus:
観測 -> 再現 -> 修正 -> regression guard。

## Part VII — 導入する

### 17 Level 1から段階導入する

Goal:
全部入りを要求しない。

Levels:
1 plan approval
2 + handoff
3 + hooks/validate
4 + metrics/outcome review
5 + eval/timeline

### 18 1タスクを最後まで回す

Goal:
読者が最小構成で実際に試せるところまで落とす。

Use:
小さな standard 未満のタスクを題材に、入力 -> plan -> approval -> execution -> verification -> handoff を通す。

## Appendices

### A1 用語集

C-X / V-X / WF-X / EH-X / Mode / Hardening Override / MERGE_READY。

### A2 よくある失敗

導入時の誤解、Hook未配線、重すぎるMode、self-reviewの過信、前提崩壊後の継続、scope外修正など。

## Existing Book Reuse Map

| Existing chapter | Reuse in new Book |
| --- | --- |
| 01_decide-before-code | 01 / 08 |
| 02_three-lenses | 07 導入の背景 |
| 03_why-scope-acceptance | 07 |
| 04_design-size-testing | 07 / 08 |
| 05_measure-assumptions | 08 |
| 06_boundaries-and-stops | 09 / 10 |
| 07_verification-first | 11 |
| 08_plan-review | 09 |
| 09_start-your-plan | 18 |
| 10_plugin-cycle | 17 / 18 |
| a1_pitfalls | A2 |

既存本文をコピーして終わらせない。新しい中心主張に必要な部分だけ再構成する。

## Definition of Done for Book Structure

- [ ] 既存 Book と reader problem が重複していない
- [ ] 第4章までに PlanGate 全体像が見える
- [ ] 各部に最低1つ PlanGate の公開一次事例がある
- [ ] Verification / Review / Judgment の責務が混ざっていない
- [ ] Autonomy / Authority の境界が明記されている
- [ ] Context / Handoff / MERGE_READY が後付け付録ではなく本編に入っている
- [ ] Level 1 から始められる
- [ ] PlanGate を使わない方がよいケースも本文か付録で明記する
