---
seed_id: seed-20260923-agent-role-boundaries
title: "AIエージェントを増やす前に、役割と委譲境界を分ける"
date: 2026-09-23
status: seed
topics:
  - media-operating-system
  - ai-agent
  - orchestration
  - role-boundary
  - delegation
source: external
source_url: https://note.com/like_tulip76/n/nddcd2081167b
source_ref:
evidence_status: verified
promoted_to:
article_type_candidates:
  - analysis
  - insight
---

# AIエージェントを増やす前に、役割と委譲境界を分ける

## 観測事実

2026-08-01 公開の note 記事では、公開範囲で次の3役が説明されている。

- OpenClaw: 指示を受け取り、適切なエージェントへ振り分ける司令塔
- Hermes 1: 市場調査・情報収集
- Hermes 2: 記事執筆・整形

著者は、メインPCと旧PC 2台をLAN内で接続し、調査と制作を別役割へ分けた構成として紹介している。

出典:
- https://note.com/like_tulip76/n/nddcd2081167b

`evidence_status: verified` は、上記の役割構成が公開範囲の記事本文に記載されていることを確認した、という意味。著者が述べる作業時間短縮率や費用対効果を独立に再現・検証した意味ではない。有料範囲の構築手順も本Seedの根拠には含めない。

## 自分の解釈

参考になるのは「3台に増やす」ことではなく、司令塔・調査・制作の責務を分けている点。

AIエージェントを複数使うとき、モデル数や並列数を増やすだけでは、同じ仕事を重複して行ったり、判断責任が曖昧になりやすい。

先に決めるべきなのは台数ではなく、次の境界ではないか。

```text
Orchestrate
  ↓
Research
  ↓
Create
  ↓
Review / Decide
```

現在の記事作成基盤では、Writing / Review / Final Gateがすでに分かれている。新しいエージェント群を作るより、「どのArtifactを誰が読み、どこまで変更できるか」を契約として明示する方が重要。

## 違和感 / Reader Problem

AIエージェント導入では「複数エージェントにすれば強くなる」と考えやすい。

しかし役割が曖昧なまま増やすと、次が起こりうる。

- 調査と執筆で同じ事実確認を重複する
- Writerが判断すべきでない公開判断まで行う
- Reviewerが修正まで抱えて独立性を失う
- Orchestratorが全責務を吸収して巨大化する

必要なのはAgent数ではなく、責務境界と委譲契約ではないか。

## 今の仮説

Media Operating Systemでは、役割はエージェント名ではなく責務で定義する。

```text
Signal Collector
  ↓
Seed / Research
  ↓
Writer
  ↓
Independent Review
  ↓
Review Organizer
  ↓
Human Gate
```

同じモデルが複数責務を担当してもよいが、責務と成果物は混ぜない。

特に公開判断とSkill / Strategy変更はHuman Gateを維持する。

## 既存知識との接続

- Separation of Concerns
- Single Responsibility
- Principal / Agent
- Orchestration vs Execution
- Independent Review
- Least Privilege

## 記事化の角度

- Analysis: 複数AIエージェントで重要なのは台数ではなく責務境界
- Insight: エージェント組織を人間の組織図ではなくArtifact flowで設計する
- Evidence: 同一タスクの重複作業率やHuman interventionを計測できた後に定量化する

## 次に試すこと

- [ ] 現在の記事Workflowの各責務をArtifact単位で一覧化する
- [ ] 同一責務を複数Agentが重複していないか確認する
- [ ] Review Organizerの入力・出力・変更権限を明文化する

## 追記ログ

### 2026-09-23

- Article Lifecycle explicit provenanceのBatch 2として登録
- 有料範囲は根拠にせず、公開範囲で確認できる役割分離だけを採用
