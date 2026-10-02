---
seed_id: seed-20260929-river-review-judgment-infrastructure
title: "River Reviewのコア設計：AIレビューではなく、チームの判断を再現可能に残す"
date: 2026-09-29
status: draft
topics:
  - ai-driven-development
  - river-review
  - code-review
  - context-management
source: mixed
source_url: https://github.com/s977043/river-review
source_ref: "https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions"
evidence_status: verified
promoted_to:
  - articles/river-review-judgment-infrastructure.md
article_type_candidates:
  - analysis
  - insight
---

# River Reviewのコア設計：AIレビューではなく、チームの判断を再現可能に残す

## 観測事実

- River Reviewの現行リポジトリでは、Review Judgment as Code、Skill Registry、Artifact Input、Context Budget / Ranking、観点別Reviewer、Deterministic Verifier、Review Coverage、Riverbed Memory、リスク階層型の人間監督が別責務として文書化・実装されている（https://github.com/s977043/river-review）
- TOKIUMの記事（2026-09-29）は、Codexの111セッション / 8,096リクエストの実測から、巨大なcached contextを多数turnで再読込することが消費を押し上げると分析している（https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions）

## 自分の解釈

1回のレビューに何を入れるか（Context Selection）と、セッションをいつ切り何を次へ渡すか（Context Lifecycle）は別の責務で、後者はRiver Review Coreではなく呼び出し側のAgent Hostに残すほうが責務を保ちやすい。

## 違和感 / Reader Problem

レビューの機能を足していくと、個別機能は説明できても、何をコアに残し何をAgent Hostへ出すかが分かりにくくなる。River Reviewを初めて知る読者も、機能一覧だけでは設計意図をつかみにくい。

## 今の仮説

River Reviewのコアは、Review Judgment as Codeを中心に、チームのReview JudgmentをArtifact・Evidence・Verification・Memory・Human Judgmentへ分離し、再現可能な形で保持するものとして説明できる。

## 既存知識との接続

- River Review README / concept / architecture
- 既存記事 `articles/river-review-judgment-placement.md`（Judgment Placement 4層）

## 記事化の角度

- Experience:
- Tutorial:
- Analysis: River Reviewの責務境界を機能一覧ではなく判断の流れで整理する
- Insight: Context SelectionとContext Lifecycleを分け、後者をAgent Hostへ返す
- Evidence: River Reviewの公開リポジトリの文書と実装

## 次に試すこと

- [ ] 公開時に `articles/river-review-judgment-placement.md` から本記事へ張り返す

## Draft Article Plan: zenn/river-review-judgment-infrastructure

- approved_at:
- channel: zenn
- slug: river-review-judgment-infrastructure
- article_type: design / architecture
- reader_problem: AI支援開発でレビューのSkill・Reviewer・Verifier・Coverage・Memoryなどを増やしていくと、個別機能は説明できても「何をコア責務として残し、何をAgent Hostへ出すべきか」が分かりにくくなる。River Reviewを初めて知る読者も、機能一覧だけでは設計意図をつかみにくい
- central_claim: River ReviewのコアはAIにレビューさせることではなく、Review Judgment as Codeを中心に、チームのReview JudgmentをArtifact・Evidence・Verification・Memory・Human Judgmentへ分離し、再現可能な形で保持することにある
- out_of_scope: River Reviewの導入手順・CLIリファレンス、Judgment Placement 4層の詳細（既存記事で扱う）、Finding CriticやReview Resolutionの全仕様、PlanGateのContext Lifecycle実装詳細、70%などの機械的なセッション閾値、Claude Code/Codexの利用上限やAPI料金の再計算、River Reviewの効果を他ツールと比較する定量評価

### Evidence Boundary

- Observed:
  - River Reviewにレビューの機能を足していくうちに、個別機能は説明できても、何をコアに残し何をAgent Hostへ出すかの説明が難しくなったという著者の実践上の観測
- Verified:
  - River Reviewの現行リポジトリでは、Review Judgment as Codeを中核に、Skill Registry、Artifact Input、Context Budget / Ranking、観点別Reviewer、Deterministic Verifier、Review Coverage、Riverbed Memory、リスク階層型の人間監督が別責務として実装・文書化されている（https://github.com/s977043/river-review）
  - Review Teamは完全自律な独立Agent群ではなく、1つのorchestrator内で観点別ロールを並列実行しfindingsをマージする構成。反復・停止・GO/NO-GOはcaller / Human側の責務として残している
  - Human Attention Architecture（ADR-012、Statusは Proposed）では、Organizerを新しいJudgeにせず、既存状態からHuman Decision Surfaceを作るdeterministic projectionとして保つ設計を提案している。実装済みなのは表示専用のDecision Surfaceで、Organizerは未実装
  - TOKIUM「Claude Code / Codexで『私のlimit、減りすぎ…？』と思ったときに見る記事」（2026-09-29）は、Codexの111セッション / 8,096リクエストの実測から、巨大なcached contextを多数turnで再読込することが消費を押し上げると分析している。記事ではContext 70%を運用目安として提示しつつ、70%自体に技術的閾値があるとはしていない（https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions）
  - River Review README / concept / architecture: Review Judgment as Code、artifact-driven input、callerとの責務分担（https://github.com/s977043/river-review/blob/main/README.md, https://github.com/s977043/river-review/blob/main/pages/explanation/concept.md, https://github.com/s977043/river-review/blob/main/pages/explanation/river-architecture.md）
  - Context Budgetは tiny / medium / large と explicit budgetを持つ。rankingで実装が計算する信号は pathProximity のみで、symbolUsage / siblingTest / commitRecency は設定上の重みにとどまる（https://github.com/s977043/river-review/blob/main/pages/reference/config-schema.md, https://github.com/s977043/river-review/blob/main/src/lib/repo-context.mjs）
  - Review Coverageは complete / partial / not_executed を持つ。Experimentalで、既定ではGate判定を変えず（Gate連携はopt-in）、反復の収束判定ではCoverageが不完全な実行を収束とみなさない（https://github.com/s977043/river-review/blob/main/docs/development/review-coverage-contract.md）
  - Riverbed Memoryは review / decision / pattern / wontfix / suppression 等を永続化できる（https://github.com/s977043/river-review/blob/main/pages/reference/riverbed-storage.md）
- Hypothesis:
  - 長時間AI開発では、1回のレビューに何を入れるかというContext Selectionだけでなく、sessionをいつ切り、何をcheckpointとして次へ渡すかというContext Lifecycleが必要になる
  - ただしSession rotation / compact / retry / timeoutはRiver Review Coreへ取り込まずAgent HostのExecution Policyに残し、River Reviewは次sessionへ渡すReview Artifact / Judgment / Evidenceを提供する境界の方が責務を保ちやすい

### Outline

1. 長時間セッションの記事を読んで、Contextの「量」よりLifecycleの境界が気になった
2. River Reviewの中心はReview Judgment as Code。モデルではなくチーム側に判断基準を残す
3. ConversationではなくArtifactとEvidenceを境界にする
4. Context Engineeringは「全部読む」ではなく判断に必要な情報を選ぶ。Budget / Progressive Disclosure / Review Teamの分離を説明する
5. 生成と検証を分ける。Reviewer → Deterministic Verifier → Review Coverage
6. 判断をMemoryへ残し、人間にはOrganizer / Decision Surfaceで必要な判断を投影する
7. Context LifecycleはCoreへ抱え込まない。HostがSession / Retry / Stopを持ち、River ReviewはReview Judgmentを返す。まとめでは中心主張を再掲し、「判断のインフラ」（Engineering Judgment Infrastructure）は将来の方向としてだけ触れる

## 追記ログ

### 2026-10-01

- PR #731 のレビューを受け、Draft Article Plan を `2026-09-29-fresh-context-restart.md` から本 Seed へ移した。Evidence Boundary の Observed にあったリポジトリの文書・実装の確認事項は Verified へ移し、Observed には reader_problem に沿った著者の観測だけを残した（Plan の内容は変えていない）

### 2026-10-02

- レビュー #744 の high 指摘を受け、著者の指示で言い回しを現行の語彙へ変更（意味は維持）。title・今の仮説・central_claim・Outline 7 から、現在の River Review を「判断のインフラ」と呼ぶ表現を外し、Review Judgment as Code を中心とする言い方へそろえた。「判断のインフラ」は River Review の concept.md が長期の方向（Engineering Judgment Infrastructure）とする語なので、将来の方向としてだけ使う
- 同レビューの Article Plan 指摘に合わせ、Verified の2点を実装に合わせて直した（ranking は pathProximity のみ計算し他の3つは設定上の重み、ADR-012 の Status は Proposed）
