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
