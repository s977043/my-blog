---
seed_id: seed-20261015-swe-journey-requirements
title: "SWE-Journeyを読んで、専門家が行う要求分析をAIが補えないかと考えた"
date: 2026-10-15
status: draft
topics:
  - ai-driven-development
  - requirements-analysis
  - swe-journey
  - human-ai-interaction
source: mixed
source_url: https://arxiv.org/abs/2610.11559
source_ref: https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/north-star.md
evidence_status: verified
promoted_to:
  - articles_note/new/swe-journey-requirement-analysis.md
article_type_candidates:
  - insight
  - analysis
---

# SWE-Journeyを読んで、専門家が行う要求分析をAIが補えないかと考えた

## 観測事実（外部一次情報）

- [SWE-Journey（arXiv:2610.11559、2026-10-08）](https://arxiv.org/abs/2610.11559) は、長期間・複数ターンにわたるコーディング支援を評価する研究。30課題・594サブタスク、13モデル、実利用記録に基づく4種類の模擬ユーザーペルソナを扱う。
- 13モデル平均の最終 F2P（要求された機能に関する Fail-to-Pass テスト通過率）は、Software Architect 78.50%、Non-coder 23.00%。差は55.50 **パーセントポイント**。
- ペルソナは知識レベルのほか、要求の具体性、関わり方、目標の安定性、検証習慣など複数次元で異なる。専門性**だけ**の因果効果を測ったものではない。
- ユーザーは実人間ではなくシミュレーター。研究環境のテスト通過率を、企業での開発成功率・実ユーザーの能力差に読み替えない。
- 研究が強調する能力は Asking Right / Finding Right / Fixing Right。質問回数を増やすだけで改善すると立証した介入実験ではない。
- 発見の入口は [AIDBの2026-10-12の紹介](https://ai-data-base.com/archives/tanshin/tanshin-2109492310874677489) と [元のX投稿](https://x.com/ai_database/status/2109492310874677489)。

## 筆者の着眼・解釈（一次経験と研究結果を区別）

- 著者がこの研究を読んで興味を持ったのは「専門知識がなければ使えない」という方向ではなく、「専門家が自然に行う要求確認・調査・検証の一部をAIが補えるのではないか」という問い。
- [PlanGateの公開設計](https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/north-star.md) では、Human-owned の判断と、AIによる調査・Evidence・承認境界の分離を検討している。これは**研究が実証したワークフローではなく、筆者の実践・設計に接続した考察**。
- 「アップロード不具合」は問題理解を説明するための**仮想例**。実際に特定の不具合が発生し、解決したという一次体験ではない。

## 違和感 / Reader Problem

専門知識がなくてもソフトウェアを作りやすくなると期待されるAIなのに、研究環境では専門家タイプのユーザーとの対話で成果が大きく良くなる。実務者は、どうすれば依頼の上手さに過度に依存しない開発の進め方を作れるのか。

## 今の仮説

**曖昧な要求をAIが自律的に調査・整理し、必要な人間判断のみ質問し、テスト証拠と判断を分けて評価する仕組みで、要求の曖昧さに由来する成果の差を縮められる可能性がある。**

現時点では未検証。質問頻度・手戻り・成功率に関する改善を実測したとは書かない。

## 既存知識との接続

- 研究内の Asking / Finding / Fixing と、要求分析・変更対象の同定・検証の分離。
- PlanGateの設計に接続するが、特定のプロダクト導入効果を一般化しない。
- モデルを固定し、要求明確化の有無を変えた比較が次の検証候補。専門性そのものの因果効果を調べるにはペルソナ特性を個別に制御する必要がある。

## 記事化の角度

- Insight: 研究の数字よりも、読後に著者の中で生まれた問いを中心にする。
- Analysis: どんな評価条件で差が生まれたかを必要最小限で説明する。
- Experience: 公開可能な個人OSSの設計上の考え方を語る。未提示の成功・失敗談は作らない。

## 次に試すこと

- [ ] 同一モデル・課題で、曖昧な依頼そのまま / AIが要求を調査・確認 / 明確な要求の3条件を比較する。
- [ ] 最終 F2P・回帰テスト・人間の確認回数・トークンと所要時間を記録する。
- [ ] 著者が実際に経験した要求確認の例を、追加する場合に限り本人の提供情報で記載する。
- [ ] note公開後に公開URLを `promoted_to` に追記する。

## Approved Article Plan: note/swe-journey-requirement-analysis

- channel: note（個人）。技術解説よりも発見・問い・考察を優先。
- reader_problem: AI駆動開発を実践するテックリード・EM・PdMが、同じモデルでも要求の伝わり方によって成果がぶれる理由と改善の方向を考えたい。
- central_claim: 専門家との対話でAIの成果が高いなら、専門家が行う要求の確認・調査・検証の一部をAIの仕組みに組み込み、依頼者への過度な依存を減らせないか。
### Evidence Boundary

- Observed: 著者がSWE-Journeyを読んで上記の問いを持ち、noteの切り口として承認した会話上の判断。公開済みPlanGateの設計を著者自身の思考の接続先として扱う。
- Verified: arXiv:2610.11559 の実験設定と13モデル平均の数値、論文で整理された3能力。PlanGate公開設計の Human authority / Evidence boundary。研究の検証結果と製品・仕組みの効果を混同しない。
- Hypothesis: AI主体の要求明確化でユーザー条件による結果の差を縮められるのではないか。著者自身の検証実績はまだない。
- out_of_scope: モデルの順位・特定モデルの勝敗、論文の網羅的要約、架空の実体験、専門性だけが55.5ポイント差の原因という断定、PlanGateの実装詳細や効果の実証、非エンジニア全般の能力評価、実運用での成功率への一般化。
- plan_approval: 2026-10-15、ユーザーが「SWE-Journeyを読んで気が付いた」から始める修正案を「良いね」と評価し、note記事化とPR作成を明示した。
- claim_boundary: required（研究の数値、PlanGateの現在地、効果未検証の区別）。
- status: 著者による公開承認前。PRの作成は公開・マージの承認を意味しない。
