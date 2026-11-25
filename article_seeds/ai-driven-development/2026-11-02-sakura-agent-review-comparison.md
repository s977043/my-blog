---
seed_id: seed-20261102-sakura-agent-review-comparison
title: "Zennfes Autumn 2026: さくらのAI Engineで単独レビューとVerifier付きレビューを比較する"
date: 2026-11-02
status: seed
topics:
  - ai
  - agent
  - evaluation
source: mixed
source_url: https://www.sakura.ad.jp/corporate/information/announcements/2026/11/02/1968226190/
source_ref: https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/DECISION.md
evidence_status: verified
promoted_to:
  - articles/sakura-ai-engine-agent-review-comparison.md
article_type_candidates:
  - evidence
  - tutorial
---

# AIコードレビューにVerifierを足す価値を、別のモデルと条件で検証する

## 観測事実

- Zennfes Autumn 2026 は 2026-11-02〜12-16 開催。さくらのAI Engineの「OpenAI・Anthropic互換APIが無料！3,000リクエストで何するチャレンジ」が募集テーマであり、「徹底検証賞」がある。出典: https://www.sakura.ad.jp/corporate/information/announcements/2026/11/02/1968226190/
- さくらのAI Engine は OpenAI互換の Chat Completions API を提供し、基盤モデル無償プランでは当該APIを月3,000リクエストまで利用可能。無償枠超過後に自動的に有料プランへ移行しない。出典: https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html / https://ai.sakura.ad.jp/sakura-ai/ai-engine/
- 個人OSS Dynamic Agent Topology の EXP-001 は Codex / GPT-6.1 Sol / high effortで、3 Scenario × T0/T1 × 3 repetition = 18 Run のPilotを実施済み。その条件において両条件のタスク成功率は1.0、T1の平均トークン使用量はT0の2.206倍。結論は限定されたPilotに対する Keep T0。一般化不可。出典: https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/DECISION.md

## 自分の解釈

Agentを分業させる設計は目的ではなくコストに見合う品質改善を示すべき、という問いを検証可能な形で扱う。既存Pilotはコーディングランタイム上の実装タスクであり、今回のAPIを使うテキストレビュー実験の品質数値とは比較・合算しない。

## 違和感 / Reader Problem

「AIレビューを2人にすれば安心」と考えやすいが、重複した見落とし、誤検出、所要時間や人間の確認負荷まで測定しないと導入判断できない。

## 今の仮説

同一モデル・同一入力・固定評価セットで、単独レビューとReviewer→Verifierの差を測れば、Verifierの限界効用とコストの境界を一部観測できる。ただし品質改善が出るかは未観測。

## 既存知識との接続

- https://github.com/s977043/dynamic-agent-topology
- https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/README.md

## 記事化の角度

- Experience: 既存DAT Pilotの設計意図と限界
- Tutorial: さくらのAI Engineへの安全な接続手順
- Analysis: T0/T1のレビュー品質・誤検出・遅延・リクエスト・トークン数の比較
- Evidence: テスト条件、生成物、再現コマンド、評価のGround Truth

## 次に試すこと

- [ ] さくらのAI Engineのアカウント作成・基盤モデル無償プラン選択・トークン発行（認証情報はリポジトリへ置かない）
- [ ] 同一モデルのAPI疎通確認と応答フォーマット記録
- [ ] 公開可能な合成レビューケースを固定し、期待検出事項を別管理する
- [ ] T0/T1を各ケース3回以上、順序を入れ替えて実行
- [ ] コード実行で機械判定可能なGround Truthと、独立レビューの範囲を分ける
- [ ] 判定結果と生ログ（秘密情報・非公開コードを除く）を公開可能な形で保存
- [ ] 記事の未実施表記を実測・限界・結論へ置き換えてから公開可否を判断する
- [ ] Zennの公開後、コンテスト応募UIでエントリーを完了する

## Draft Article Plan: zenn/sakura-ai-engine-agent-review-comparison

- reader_problem: 単独AgentとReviewer/Verifier分業のどちらが有効か、品質とコストのトレードオフを実証して判断したいエンジニア。
- central_claim: Agentの追加は品質向上を前提とせず、同条件の実測で増分価値を判断する必要がある。
- out_of_scope: あらゆるタスクでのマルチAgent優劣、異なるモデルの優劣、実運用のSLA、未計測の費用対効果の断定。

### Evidence Boundary

- Observed: 個人OSS DATのEXP-001 Pilotの既存観測（18 Run、条件限定、Keep T0）。 https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/DECISION.md
- Verified: Zennfesの開催・テーマ・募集期間・賞、およびさくらのAI EngineのAPI仕様・無償枠を公式告知とマニュアルで照合した。 https://www.sakura.ad.jp/corporate/information/announcements/2026/11/02/1968226190/ ; https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html
- Hypothesis: 今回のレビュー実験でVerifierが見落としを減らせるか、コストを正当化できるか。**未実施。**

## Draft Article Plan: qiita/dat-exp-001-advent

- channel: qiita
- slug: dat-exp-001-advent
- article_type: 比較検討
- reader_problem: Claude Code や Codex で AI コーディングを実践し、独立した検証役を増やすべきか、追加コストと品質の両面で判断したい開発者。
- central_claim: AI エージェント構成の複雑化は、追加コストを正当化する増分価値の根拠を得てから採用する。
- out_of_scope: 全タスク・全モデルでの Single Agent 優位、Verifier やレビュー自体の不要論、トークン数からの料金推計、品質同等性の統計的証明、自動ルーティングや自動構成変更の実装済み主張、未実施のさくらの AI Engine 実験、非公開リポジトリの観測記録、著者の未確認の体験・感情。
- claim_boundary: required
- claim_boundary_reason: 公開 OSS の実装範囲、実験件数、実測値、条件付き採否判断を扱うため。
- lifecycle: PLANNED（企画段階。初稿・公開承認は未実施）
- provisional_title: マルチエージェントは本当に必要なのか？ 自作OSS「DAT」で18回比較実験して分かったこと
- publication_target: Qiita 個人開発・OSS・運用のリアル Advent Calendar 2026、シリーズ2、2026-12-19（JST）。参加登録は未完了。 https://qiita.com/advent-calendar/2026/oss

この Plan は既存 Seed に記録済みの DAT EXP-001 を独立した Qiita 記事として扱う。既存の Zenn 向け Plan は変更しない。Qiita は構成の採否判断と読者が自分の環境で比較を始める手順に絞る。別実験である Zennfes 企画、公開済み Zenn 記事 dat-observation-gaps（運用記録109件）の転載・合算はしない。

### Evidence Boundary

- Observed: 個人 OSS DAT の EXP-001 Pilot。Codex / GPT-6.1 Sol / high effort、3 scenario × 2 condition × 3 repetitions、18 accepted runs。T0（Single Agent）と T1（Worker → Verifier）の9 Runずつで、成功9/9、回帰0/9、人間介入0、平均総トークン68,022 / 150,080.67、平均 wall clock 44,540.11 / 55,777.78 ms。T1/T0 の平均総トークン比2.206。一次情報は https://github.com/s977043/dynamic-agent-topology/blob/616a56d/experiments/EXP-001-t0-vs-t1/DECISION.md と同 revision の RunEvaluation。結論は限定条件の Keep T0。
- Verified: 2026-11-25、上記 revision の18件の evaluation.yaml を GitHub から取得し、runId、condition、runtime、model、effort と一致することを確認。inputTokens + outputTokens、wallClockMs、taskSuccess、regressionDetected、humanInterventions を再集計し、判断記録の18件版および環境差のある1 blockを除いた16件版の値と一致。16件版の T0/T1 は各8 Run、成功8/8、回帰0/8、人間介入0、平均総トークン65,642.125 / 145,717、平均 wall clock 40,625 / 56,375 ms、トークン比2.220。この確認は保存された評価記録の再集計であり、実験の再実行、全 Evidence/Trace の独立再評価、凍結 validator の再実行ではない。
- Verified: 採否基準は事前定義。成功率非劣化と重大な境界違反なしは通過したが、回帰または介入の改善、トークン増加上限50%以内または品質改善による正当化は不通過。判断記録の ACCEPT は既存の独立レビュー結果であり、本企画の独立レビュー結果ではない。
- Verified: DAT README の現行設計では P0/T0 を第一級の基準とし、T1/T2/T3 は比較候補。dat-select は構成を提案し、dat-observe は記録・集計する Skill。自動実行・自動ルーティング機能として紹介しない。 https://github.com/s977043/dynamic-agent-topology
- Verified: カレンダーは OSS・生成AI・比較検証を歓迎。2026-11-25 の確認ではシリーズ2の12月19日が空き。枠は変動し、登録完了を意味しない。 https://qiita.com/advent-calendar/2026/oss
- Limitations: タスクは小規模3種類で、全件成功・回帰なし・介入なしのため品質改善を捉えにくい床・天井効果がある。1 blockの実行環境差、Verifier 初期文脈・fork 設定のばらつき、wall clock の測定精度差、失敗 attempt の除外、人間介入回数と注意負荷の差を明記する。token は cached input を含むため課金額ではない。実行回数は accepted run 18件（9 paired blocks）であり、試行総数・独立した18種類のタスクではない。
- Hypothesis: より難しいタスク、独立検証が品質に寄与するタスクでは T1 の追加コストを正当化できる可能性がある。今回の結果からは未検証。別のモデル・ランタイムへの一般化はしない。

### Outline

1. 実装を一つのエージェントに任せるか、Verifier を追加するかという読者の問い。
2. 先に結果を示す: 18 Run の限定的な Pilot で Keep T0 と判断した（品質指標・トークン・測定時間の比較表）。
3. DAT の設計原則と T0/T1 の違い（責務の図は必要な場合のみ）。DAT は構成を評価する仕様と実験基盤であり、実行ランタイムそのものではない。
4. 比較の仕方: 同じ条件、paired blocks、fresh workspace、順序の交替、事前の採否基準、実験条件の凍結。結果の再集計手順は公開前に固定 revision で実行確認する。
5. なぜ T0 を維持したか: 追加コストを正当化する改善が観測されず、採否基準を満たさなかった。環境差を除く感度分析と適用限界。
6. 読者の次の一歩: 直近の1種類のタスクを選び、T0 と独立検証ありの構成を同条件で比較し、成功・回帰・介入・トークン・所要時間・検証根拠を記録して採否を決める。現行 DAT Skill を任意の補助として案内し、自動実行を約束しない。
7. まとめ: 増やすことではなく、増やす理由を検証する。OSS と実験記録への参照。

### Execution / Review

- [ ] カレンダーの対象枠を再確認し、著者の Qiita アカウントで参加登録する（URL は登録時空欄可）。
- [ ] 固定 revision で公式の集計・completeness validation の手順を実行し、結果と制約を記録する。今回の再集計と区別する。
- [ ] 現行 DAT Quick Start と Skill の操作手順、Qiita のガイドラインを執筆時に再確認する。未実行のコマンドは実行済みと書かない。
- [ ] Qiita/public/dat-exp-001-advent.md に初稿を追加し、ignorePublish: true を維持する。promoted_to と派生 Article Graph は既存手順で同期する。
- [ ] 主張境界、技術・数値、読者 UX、編集・重複、公開安全性の各観点でレビューし、可能なら独立エージェントのレビューを取得する。
- [ ] npm run check、対象記事の Plan/公開制約を検証。レビュー記録と PR を整備する。
- [ ] 著者承認後にのみ、マージ、Qiita 限定共有・予約設定・公開を別操作で進める。参加枠確保と公開は別の状態として管理する。
