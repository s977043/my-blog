---
seed_id: seed-20260924-note-hub-plangate-river-skills
title: "計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口"
date: 2026-09-24
status: seed
topics:
  - plangate
  - river-review
  - agent-skills
  - ai-driven-development
  - hub-article
source: external
source_url: https://github.com/s977043/PlanGate
source_ref: https://github.com/s977043/river-review / https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
evidence_status: verified
promoted_to:
article_type_candidates:
  - insight
  - analysis
---

# 計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口

note 個人名義のハブ記事（既存記事への入口）の構成案。本文はまだ書かない。

## 観測事実

一次情報は個人リポジトリの公開 README と Anthropic 公式ドキュメントに限る（2026-09-24 取得）。

PlanGate（https://github.com/s977043/PlanGate ）

- README の副題は「承認なし、コードなし」。人間が承認した計画・タスク・受入テストが揃うまで、AI にプロダクションコードを書かせないゲート型ワークフローと説明されている
- 一般的なエージェントフレームワークが自律性を重視するのに対し、承認境界・監査可能性・スクラム親和性を重視すると明記している
- 導入は Level 1（plan 承認だけ）から Level 5（eval / timeline）までの段階制で、Level 1 から始めることを推奨している
- 「やらないこと」として、自律エージェントを目指さない、全機能を最初から強制しない、を挙げている

River Review（https://github.com/s977043/river-review ）

- 「Review Judgment as Code」。レビュー基準を versioned / repo-owned な skill として扱う OSS フレームワークと説明されている
- 入力は diff だけでなく plan / tests / JUnit / 既存レビュー結果を含む
- コアモデルは「Skills define judgment / Gates execute judgment / Riverbed remembers judgment」の3文
- 「River Review = レビューする / PlanGate = 止める・通す」という役割分担を README 自身が明記している。GO / NO-GO の判断は呼び出し側と人間の責務で、自動承認・自動マージは行わない

Agent Skills（https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview ）

- Skill は指示・メタデータ・任意のリソース（スクリプト、テンプレート）をまとめたもので、関連するときに Claude が自動で使う
- progressive disclosure：メタデータは起動時に常に読み込まれ、SKILL.md 本体は発動時に、追加リソースは必要時に段階的に読み込まれる

## 自分の解釈

3つは同じ層の道具ではない。PlanGate は「いつ止めるか」、River Review は「何を基準に見るか」、Agent Skills は「その手順や基準をエージェントへどう渡すか」を担う、と整理できる。River Review が判断基準を skill として持つ点で、Agent Skills は両者を運ぶ器の位置にある。

この整理は README の記述からの筆者解釈であり、各 README が3者の関係をこの形で定義しているわけではない。本文でも事実と解釈を分けて書く。

## 違和感 / Reader Problem

- 既存記事がツール単位・バージョン単位に分かれていて、note から来た読者が「どれから読めばよいか」を判断できない
- 名前が3つ並ぶと「全部入れないといけない重い仕組み」に見える。実際は PlanGate 自体が Level 1 からの段階導入を勧めている
- note の読者はマネジメント視点の人が多く、Zenn の実装詳細記事へいきなり飛ばすと離脱しやすいと考えられる（未検証の仮説）

## 今の仮説

- 「止める・見る・渡す」の3動詞で役割を分けると、ツール名を知らない読者でも位置づけを掴める
- ハブ記事は新しい主張を足すより、既存記事への道順を示すことに徹したほうが価値が出る

## 既存知識との接続

リンク候補（articles/ は Zenn、articles_note/published/ は note。すべて公開済みを frontmatter / 出典行で確認）。

PlanGate

- note：[AIにコードを書かせる前に、人間が承認する場所を作る](https://note.com/mine_unilabo/n/n02992266d622)
- note：[AIコーディングの暴走を「仕組み」で止める（PlanGateという開発フロー）](https://note.com/mine_unilabo/n/n3aae6b5467b9)
- note：[AI駆動開発はアジャイルにフィットするのか](https://note.com/mine_unilabo/n/n92b270e91110)
- Zenn：`plangate-ai-coding-workflow`（アジャイルでAI駆動開発をどう回すか）
- Zenn：`plangate-v86-hook-enforcement`（PlanGate v8.6.0 の Metrics v1 と Governance）

River Review

- Zenn：`river-review-judgment-placement`（AIコードレビューを4層に分ける）
- Zenn：`river-review-plugin-migration`（Claude Code / Codex の Plugin にした話）
- Zenn：`river-reviewer-v033-improvement-loop`（v0.30 から v0.33 の改善）

Agent Skills

- note：[「プロンプトを磨けば勝てる」をやめた：AIレビューを運用に乗せる“Agent Skills”設計](https://note.com/mine_unilabo/n/nd21c3f1df22e)
- Zenn：`zenn-river-reviewer-architecture`（Agent Skills と自由度の設計）
- Zenn：`ai-generated-skill-md-reality-check`（AIに書かせた SKILL.md の実態）

横断

- Zenn：`ai-dev-guardrail-plangate-river-reviewer`（2層ガード設計：実装前後を守る）
- note：[失敗をモデルのせいにしない。AI駆動開発を「Model + Harness」で考える](https://note.com/mine_unilabo/n/nd6a5d83d1488)

Zenn 記事の URL はクロスポスト時のリンク方針（AGENTS.md §記事内クロスプラットフォーム参照）に従って本文化の段階で確定する。

## 記事化の角度

- Experience：【著者確認】3つを使い始めた順番ときっかけ（PlanGate が先か、River Review が先か）
- Tutorial：扱わない（手順は Zenn 側の役割）
- Analysis：README の「やること / やらないこと」と役割分担の記述を並べ、3者の境界を表にする
- Insight：「止める・見る・渡す」で分けると、導入を1つずつ選べる
- Evidence：各 README と公式ドキュメントの記述のみ。効果の数値は出さない

### 構成案（Plan Approval 前のドラフト）

想定読者：AI コーディングをチームに入れたいが、個別記事の量に迷っている EM / テックリード。
想定分量：3,000〜4,000字。note 個人名義。

1. 導入：この記事は入口であること
   - 【著者確認】ハブ記事を書こうと思った動機（読者からの質問、自分の整理の必要など）
   - 3つを全部読む必要はない、目的別に1本選べばよい、と先に言う
2. 3つの役割を1枚で見る
   - 表：道具 / 担うこと（止める・見る・渡す） / 人間に残す判断 / 最初の1歩
   - 図候補：計画 → 実装 → レビューの流れに PlanGate と River Review を置き、Agent Skills を両者の下に敷く図（PNG 化前提）
   - README 由来の事実と筆者の整理を段落で分ける
3. PlanGate：計画の承認で止める
   - 「承認なし、コードなし」と Level 1 から始める段階導入
   - 【著者確認】自分のチームで最初に止めた場面の一次経験
   - 次に読む：note 2本、Zenn 1本
4. River Review：レビュー判断をチームの資産にする
   - Skills / Gates / Riverbed の3文と、自動マージしない境界
   - 【著者確認】レビュー判断を skill 化しようと思った具体的なきっかけ
   - 次に読む：Zenn 2本
5. Agent Skills：手順と基準をエージェントへ渡す器
   - 公式ドキュメントの progressive disclosure の説明（公式事実として引用）
   - 【著者確認】SKILL.md を書いてうまくいかなかった経験を、どの程度ハブで触れるか
   - 次に読む：note 1本、Zenn 2本
6. どこから読むか（目的別の道順）
   - 「AI に勝手に書かせたくない」→ PlanGate
   - 「レビューが属人化している」→ River Review
   - 「プロンプトが毎回ぶれる」→ Agent Skills
7. おわりに
   - 【著者確認】今後この入口記事に追加していく予定の記事（更新方針）

タイトル候補

- 計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口
- AIコーディングをチームに乗せる3つの道具：どこから読むかの地図

## 次に試すこと

- [ ] 【著者確認】プレースホルダを埋める
- [ ] Plan Approval（Human）を経て `## Approved Article Plan: note/<slug>` を追記する
- [ ] 本文化の直前に各 README を再取得し、Level 構成や役割分担の記述が変わっていないか確認する

## 追記ログ

### 2026-09-24

- 構成案を作成。一次情報は PlanGate / river-review の README と Agent Skills 公式ドキュメント
