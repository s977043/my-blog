---
seed_id: seed-20261001-agent-execution-policy-evidence
title: "AIエージェントは「よく考える」より「証拠を取りに行く」で設計する"
date: 2026-10-01
status: published
topics:
  - ai-driven-development
  - agent-execution-policy
  - empirical-process
  - claude-code
  - codex
source: mixed
source_url: https://developers.openai.com/api/docs/guides/latest-model
source_ref: article_seeds/ai-driven-development/2026-09-26-agent-team-topology-audit.md
evidence_status: verified
promoted_to:
  - https://x.com/mine_take/status/2105518834686026114
article_type_candidates:
  - experience
  - analysis
  - insight
---

# AIエージェントは「よく考える」より「証拠を取りに行く」で設計する

## 観測事実

AIエージェントへ難しい仕事を任せるとき、「よく考えて」「慎重に検討して」と指示を足したくなる。

実運用では、分からないことに対して推論を続けさせるより、次のような確認へ切り替えた方が早く前進できる場面がある。

- コードを読む
- grep / search する
- 公式ドキュメントを確認する
- テストを1本実行する
- APIレスポンスやログを確認する
- 小さなPoCを書く
- 別エージェントにレビューさせる

この観測から、「長く考える」より「次の意思決定に必要な証拠を最小コストで取りに行く」ことを実行原則として扱えるのではないかと考えた。

2026-10-01 に Claude Code / Codex の最新世代でもこの考え方が成立するかを確認した。

### 外部確認

OpenAIの最新モデル向けガイダンスでは、過剰な指示を積み上げるより leaner prompts を使い、変更内容に応じて verification の量を調整する方向が示されている。

- OpenAI: https://developers.openai.com/api/docs/guides/latest-model
- OpenAI Agent evals: https://developers.openai.com/api/docs/guides/agent-evals

OpenAIのAgent evalsでは、最終回答だけでなく model call / tool call / handoff など実行traceを評価対象として扱う。

Anthropic側でも、agentは複数ターンでtoolを使い、中間結果を受けて行動を適応させるシステムとして扱われている。

- Anthropic, Writing tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic, Demystifying evals for AI agents: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

ここから確認できるのは、「最新モデルが自動的に経験主義になる」ということではない。

tool use、long-horizon execution、self-verification などの能力が上がった結果、経験主義的な実行Policyを細かな逐次手順なしで実装しやすくなっている、と見る方が妥当。

## 自分の解釈

AI向けには、アジャイル / Lean の Small Experiment をそのまま持ち込むより、次の概念に置き換える方が扱いやすい。

> **Cheapest Useful Verification**
>
> 次の意思決定に必要な証拠を、最小コストで取りに行く。

概念モデルは次の形。

```text
Goal
↓
Inspect
↓
Unknown
↓
Hypothesis
↓
Verify
↓
Evidence
↓
Judge
↓
Adapt
```

ただし、最新モデルへこの順番を毎回逐語的に命令する必要はない。

人間が設計すべきなのは、手順よりも次の境界。

- Goal
- Constraints
- Acceptance Criteria
- Evidence Policy
- Risk Boundary
- Done Condition

「How」はモデルへ任せ、不確実性に遭遇したときの判断原則をPolicyとして与える。

## 違和感 / Reader Problem

AIエージェントの改善が、いまだに「もっとよく考えさせるプロンプトを書く」という方向へ寄りやすい。

しかし、モデル能力が上がるほど、細かな手順を増やすことが必ずしも品質向上につながらない。

Claude Code / Codexを使い込む読者にとって、本当に設計したいのは次ではないか。

- いつ推測をやめるか
- いつ外部確認へ切り替えるか
- 何を証拠とみなすか
- 何をもってDoneとするか
- どの判断を人間へ戻すか

## 今の仮説

AIエージェントの実行原則として、次を中心に置く。

> **Do not spend reasoning on uncertainty that can be cheaply resolved by evidence.**

日本語では、

> **考えれば分かることは考える。確認すれば分かることは確認する。**

最新モデル向けのPolicyは、例えばこの程度まで小さくできる。

```text
Goal
Acceptance Criteria

Execution Principles:
- Prefer evidence over speculation when facts can be cheaply verified.
- Use the cheapest verification sufficient for the next decision.
- Adapt when new evidence contradicts the current hypothesis.
- Do not repeat a failed approach without new evidence.
- Verify externally observable results before declaring completion.
- Escalate high-risk or irreversible judgments.

Done:
Acceptance Criteria are satisfied with observable evidence.
```

「5分悩んだら調べる」のような時間ベースではなく、観測可能な条件で verification へ切り替える方が再現しやすい。

例:

- 必要な事実が不足している
- 複数仮説を識別できない
- 同じ失敗を繰り返している
- 結果を外部から確認可能
- 判断が高リスクまたは不可逆

## 既存知識との接続

### Agile / Lean

```text
Transparency
↓
Inspection
↓
Adaptation
```

または、

```text
Hypothesis
↓
Experiment / Verification
↓
Evidence
↓
Adapt
```

AI Agentを「不確実な状況からどう前進するか」という観点で設計すると、経験主義と似た構造になる。

「アジャイルをAIへ適用した」というより、AI Agentも不確実性の中で自律的に動かそうとすると経験主義と同型へ近づく、という見方をしたい。

### Agent Team Topology

個体のAgent Execution Policyを複数エージェントへ広げると、次へ接続できる。

```text
Planner
↓
Builder
↓
Verifier
↓
Reviewer
↓
Human Judgment
```

ここでは次を分離する。

- Verification: 動いたか、事実か
- Review: 問題や改善余地はないか
- Judgment: 採用してよいか

**Verification ≠ Review ≠ Judgment**

既存の Agent Team Topology / PlanGate / River Review / E2E中心のVerification と接続可能。

## 記事化の角度

- Experience: 「もっと考えろ」では解けなかった実例から入る
- Tutorial: 実際にCLAUDE.md / AGENTS.mdへ置ける最小Policy例
- Analysis: 最新Claude Code / Codexでもこの原則が成立する理由
- Insight: モデルが賢くなるほど、手順ではなく実行原則を設計する
- Evidence: OpenAI / Anthropic公式情報と実運用を分離して提示

X向けでは、中心主張を次の2段に絞る。

1. **AIに「よく考えろ」と言うより、「証拠を取りに行け」と設計する**
2. **モデルが賢くなるほど、細かな手順ではなくExecution Policyを設計する**

## 次に試すこと

- [ ] 実運用から「推論を続けるより、コード検索 / テスト / ログ確認で解決した」一次体験を1件選ぶ
- [ ] Claude CodeとCodexへ同じ最小Policyを与え、過剰な逐次手順あり / なしで比較する
- [ ] Done判定にObservable Evidenceを要求したときの差を確認する
- [ ] X公開前に、具体例を1つ差し込み抽象度を1段下げる

## 追記ログ

### 2026-10-02

- 2026-10-01 13:43 JST に X の記事として公開済み（「AIに『よく考えろ』と言うより、『証拠を取りに行け』と設計する」、投稿 https://x.com/mine_take/status/2105518834686026114 ）。status を published にし、promoted_to に投稿 URL を記録した
- 作業を止めた元セッションの PR #743 を引き継ぎ、Draft Article Plan を契約の書式（`- key: 値` と `### Evidence Boundary` 配下の `- Observed:` / `- Verified:`）へ直した。内容は変えていない
- 元の PR にあった「公開前に一次体験を1件追加する」は、追加しないまま公開された

### 2026-10-01

- アジャイルの経験主義をAIエージェントの実行原則として再解釈
- Claude Code / Codexの最新世代でも成立するか公式情報を確認
- 「最新モデルが経験主義になる」ではなく「経験主義的Policyを少ない指示で実装しやすくなる」へ表現を修正
- 編集部エージェントチームで「主張・構成」「技術的正確性」「Xでの読了率 / 伝わり方」の3視点を3ループ
- ペルソナレビューでは、EM / Tech Lead、AI利用初級者、Scrum経験者、AI Agent上級者の4視点で確認
- 次の改善点を「概念追加」ではなく「一次体験を1つ追加」に絞った

## Draft Article Plan: x/agent-execution-policy-evidence

- reader_problem: Claude Code / Codexをある程度使い込み、「どうプロンプトを書くか」から「どうエージェントを設計するか」へ関心が移り始めたエンジニア / Tech Lead / EMが、AIの不確実性への対処を「もっと考えさせる」以外の再現可能な設計として整理できていない。
- central_claim: モデルが賢くなるほど、細かな思考手順ではなく、不確実性を証拠で解消するAgent Execution Policyを設計することが重要になる。
- out_of_scope: Claude CodeとCodexの優劣比較、特定モデルのベンチマーク順位、「このPolicyだけで必ず品質が上がる」という一般化、Chain-of-Thoughtの内部挙動の推測、Scrumそのものの解説

### Evidence Boundary

- Observed:
  - AIへ追加推論を要求するより、コード検索・テスト・ログ確認など外部から確認可能な手段へ切り替えた方が前進しやすい場面がある
  - Agent Team Topology / PlanGate / River Review / E2E Verificationを検討する中で、Verification / Review / Judgmentの責務分離が重要になった
- Verified:
  - OpenAI最新モデル向けガイダンスの leaner prompts / verification の考え方
  - OpenAI Agent evalsのtrace単位評価
  - Anthropicのagent tool use / evaluation / improvementに関する公式Engineering記事
