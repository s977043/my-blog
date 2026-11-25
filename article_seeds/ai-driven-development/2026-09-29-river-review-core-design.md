---
seed_id: seed-20260929-river-review-core-design
title: "River Reviewのコア設計：AIレビューではなく、チームの判断を再現しやすい形で残す"
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
  - articles/river-review-core-design.md
  - Qiita/public/river-review-advent-skill.md
article_type_candidates:
  - analysis
  - insight
---

# River Reviewのコア設計：AIレビューではなく、チームの判断を再現しやすい形で残す

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

## Draft Article Plan: zenn/river-review-core-design

- approved_at:
- channel: zenn
- slug: river-review-core-design
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
2. River Reviewの中心はReview Judgment as Code。モデルではなくチーム側に判断基準を残す。同梱Skillを1つ例に、何を見るか・何をEvidenceとするか・どの条件では指摘しないか・fixtureでの回帰確認を示す。「判断のインフラ」（Engineering Judgment Infrastructure）は長期の方向として、ここでだけ触れる
3. ConversationではなくArtifactとEvidenceを境界にする
4. Context Engineeringは「全部読む」ではなく判断に必要な情報を選ぶ。Budget / Progressive Disclosure / Review Teamの分離を説明する
5. 生成と検証を分ける。Reviewer → Deterministic Verifier → Review Coverage
6. 判断をMemoryへ残し、人間にはOrganizer / Decision Surfaceで必要な判断を投影する
7. Context LifecycleはCoreへ抱え込まない。HostがSession / Retry / Stopを持ち、River ReviewはReview Judgmentを返す。まとめでは中心主張を再掲する

## 追記ログ

### 2026-10-01

- PR #731 のレビューを受け、Draft Article Plan を `2026-09-29-fresh-context-restart.md` から本 Seed へ移した。Evidence Boundary の Observed にあったリポジトリの文書・実装の確認事項は Verified へ移し、Observed には reader_problem に沿った著者の観測だけを残した（Plan の内容は変えていない）

### 2026-10-02

- レビュー #744 の high 指摘を受け、著者の指示で言い回しを現行の語彙へ変更（意味は維持）。title・今の仮説・central_claim・Outline 7 から、現在の River Review を「判断のインフラ」と呼ぶ表現を外し、Review Judgment as Code を中心とする言い方へそろえた。「判断のインフラ」は River Review の concept.md が長期の方向（Engineering Judgment Infrastructure）とする語なので、将来の方向としてだけ使う
- 同レビューの Article Plan 指摘に合わせ、Verified の2点を実装に合わせて直した（ranking は pathProximity のみ計算し他の3つは設定上の重み、ADR-012 の Status は Proposed）
- レビュー #744 ループ2の指摘を受け、公開前のうちに slug を `river-review-judgment-infrastructure` から `river-review-core-design` へ変更した（記事・本 Seed・レビュー成果物のファイル名、seed_id、promoted_to、Plan の見出しと slug）。「判断のインフラ」への言及は結びから §1 へ移したため、Outline 2 と 7 を合わせて直した

## Draft Article Plan: qiita/river-review-advent-skill

- channel: qiita
- slug: river-review-advent-skill
- article_type: 実務ガイド
- reader_problem: AI 生成コードのレビューを AI に頼んでいるが、毎回違う観点・根拠で指摘され、判断基準が実行されたのか、正しいケースを誤検知しないのかを確認できない開発者・テックリード。
- central_claim: AI のレビュー結果を信用することより、チームのレビュー基準を再利用可能にし、検出すべきケースと指摘すべきでないケースで検証できるようにすることが重要である。
- out_of_scope: CodeRabbit と River Review の性能・優劣比較、CodeRabbit の未確認の利用実績・提携、レビューの回数だけでの品質保証、見落としゼロ・誤検知ゼロ・工数削減の一般化、全レビューゲートの強制・自動承認・自動マージ、未実施の実験、会社/非公開リポジトリの観測、全機能の網羅。
- claim_boundary: required
- claim_boundary_reason: OSS の Skill / fixture / 評価の実装範囲、実行例、レビュー完了と承認の区別を扱うため。
- lifecycle: DRAFTED（初稿・観点別レビュー3ループ実施。独立レビュー・実行検証・著者承認は残件）
- provisional_title: AIのコードレビューを信用するのではなく、検証する ― 自作OSS River Reviewでレビュー基準をテストする
- publication_target: AIが書いたコードのレビュー、どうしてる？ by CodeRabbit Advent Calendar 2026、シリーズ4、2026-12-15（JST）。参加登録済み（2026-11-25、管理Issue #1067 の確認記録）。 https://qiita.com/advent-calendar/2026/coderabbit
- tracking: https://github.com/s977043/my-blog/issues/1067

既存 Seed の Review Judgment as Code の根拠を再利用するが、Zenn のアーキテクチャ解説や Book の網羅的な構成ではなく、読者が1つのレビュー観点を確かめる入口に絞る。既存 Plan と metadata を変更しない。note review-count-not-safety の体験・主張・非公開作業記録は本記事へ転用しない。

### Evidence Boundary

- Observed: 個人 OSS River Review の公開 README は Review Judgment as Code を掲げ、確認時の main は最新リリースとして v1.139.5 を案内している。著者の未確認の体験は補完しない。
- Verified: 2026-11-25、https://github.com/s977043/river-review/blob/main/README.md と https://river-review.the3396.com/explanation/what-is-river-review/ の正本 pages/explanation/what-is-river-review.md を確認。チームが所有する versioned Skill、Artifact/Evidence を入力とするレビュー、Skills / Gates / Riverbed の役割、findings / verdict は判断材料で最終承認は人間または caller の責務。
- Verified: README は Claude Code plugin の marketplace add / install / reload / review-local を案内。対話エージェントを利用する経路とヘッドレス LLM 利用経路で専用 API キーの要否が異なる。npm パッケージ公開済みと書かない。
- Verified: https://github.com/s977043/river-review/blob/main/pages/guides/starter-cookbook.md は、まず同梱 Skill / repo-owned rules を利用し、繰り返す不足観点のみ custom Skill へ昇格する段階導入、applyTo / phase、fixture と golden output、false-positive 条件、回帰 Eval を示す。最初から custom Skill の作成を強制しない。
- Verified: https://github.com/s977043/river-review/blob/main/pages/guides/representative-skills.md は logging-observability（midstream）を例に、silent catch を検出する fixture、期待 finding（golden）、適切なログや再送出・意図された無視などで指摘を抑制する条件を示す。これは文書で確認した期待動作であり、このセッションで実行した結果ではない。実際の Skill / fixture / golden / 実行スクリプトは固定 revision で照合する。
- Verified: Review Coverage は complete / partial / not_executed を区別する experimental contract。確認した what-is-river-review.md では observe-only と説明しているため、既定で Gate の block が自動保証されるとは書かない。公開直前に実装・opt-in の状態を再照合する。NO_ISSUES と NO_REVIEW、未完遂、最終承認を区別。
- Verified: CodeRabbit カレンダーは AI 駆動開発のコードレビューに関する記事を募集。賞品選出の条件に CodeRabbit タグがあるが、製品の使用は明示的な必須条件でない。記事の主題は River Review であり、スポンサー製品の比較や関与を装わない。賞品応募は目的外、タグは記事との関連性と最新募集ルールを確認して決める。
- Hypothesis: 確認対象と指摘抑制対象を固定した小さな例でレビュー基準を確かめると、チームが AI レビューを評価する入口を作れる。品質の向上・モデル横断の再現性は未計測。モデルの出力と決定論的な検査の結果を混同しない。

### Outline

1. AI のレビューで指摘ゼロだったとき、本当に必要な観点を確認したといえるのか。
2. 先に結論: レビューする AI を増やす前に、判断基準・根拠・実行結果を確かめられるようにする。River Review の Review Judgment as Code を紹介。
3. 1つの観点だけで理解する。logging-observability の「例外握りつぶし」fixture と適切に処理する対照ケースを固定し、必要な指摘・出してはいけない指摘の違いを示す。
4. River Review の公開 Skill / fixture / golden / Eval の構成と検証方法。実行したコマンド・固定版・期待値・実測結果を明記し、再現手順を簡潔に示す。Skill 定義の検証と LLM レビュー品質の評価は別。
5. Claude Code で試す導線: 既存 plugin / review-local を紹介し、必要なら既存 logging/testing 等の観点を選択。custom Skill は実運用で繰り返し不足する場合に限定する。
6. 判定の境界: findings がない、レビュー未実行、partial、完了は別。Gate の現在の実装範囲と人間/Caller の承認責務。単一ケースの通過を製品全体の精度・安全保証としない。
7. まとめ: 次のレビューで1観点の根拠と対照ケースを残す。GitHub / Starter Cookbook / フィードバック導線。

### Execution / Review

- [x] 参加登録確認済み（#1067、2026-11-25 12:35 JST、記事URL未登録）。
- [ ] 公開 release / commit を固定し、logging-observability の実ファイル（Skill、fixture、golden、対応 validator/eval）と現行ガイドを照合する。
- [ ] 隔離環境で検出対象・非検出対象・対象外の各ケースを実行する。決定論的チェックと LLM 依存ケースは分け、実行環境・結果・未実施部分を記録。対象外ケースや利用コマンドは実装確認後に決定。必要なら個別に小さな合成ケースを用意する。未実行なら記事の表現を縮小し著者へ報告。
- [ ] 12/5 までに Qiita/public/river-review-advent-skill.md に初稿（ignorePublish: true）、既存手順で promoted_to / Article Graph を同期。
- [ ] 技術・主張境界・根拠・反例・読者UX・OSS導線・既存記事との差別化・公開安全性をレビューし、独立レビューは取得した結果だけを記録。重大指摘を解消し CI 確認。
- [ ] 12/14 までに著者承認・限定共有・予約確認（別承認）。12/15 公開確認。認知・試用の観測は #1067 に接続。

### 2026-11-25 執筆・レビュー記録

- 初稿: `Qiita/public/river-review-advent-skill.md`（ignorePublish: true / private: true）。
- 3ループ（レビュー→対応→再レビュー→再対応）を同一モデルの観点別レビューで実施。記録: `reviews/qiita/river-review-advent-skill.md`。
- 完全取得した隔離環境で npm ci / npm run eval:fixtures、plugin実行と対象外ケースを検証し証拠保存。独立レビュー・CI最新head・著者承認は残件。
- Seed の既存別媒体 Plan と status は維持。マージ・公開操作は行わない。
