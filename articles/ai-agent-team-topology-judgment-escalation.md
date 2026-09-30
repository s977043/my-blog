---
title: "AIエージェントのチーム設計は「誰に任せるか」より「どこで判断するか」だった"
emoji: "🧭"
type: "idea"
topics: ["ai", "claudecode", "codex", "aiagent", "architecture"]
published: false
---

:::message
CodexやClaude Codeで複数のAgent・Modelを使い始めた人向けの記事です。

この記事では「どのモデルが最強か」ではなく、モデルが入れ替わっても残るAI開発チームの責務境界を考えます。Provider別のModel/Effortは2026-10-01時点のBinding例であり、固定の推奨構成ではありません。
:::

## TL;DR

複数Agentを使うようになって、最初は「Sonnetは実装、Opusは難しい判断」「SolはWorker、AstraはReviewer」のようにモデル名で役割を分けていました。

ただ、モデル性能が更新されるたびに、この組織図も書き換えることになります。

そこで今は、AIエージェントのチーム設計を次のように捉えています。

```text
Role != Model
Effort != Autonomy
Verification != Review
Reviewer != Judge
Context is a boundary
```

そして中心に置くのは、Agentの数ではなく **Escalation** です。

> 安いモデルへ仕事を落とすのではない。判断を必要な場所だけ上位レイヤーへ上げる。

この記事で扱う構造を一文にすると、こうなります。

> **Work flows downward. Evidence flows upward. Judgment escalates upward.**

## モデルごとに役割を決めると、設計がすぐ古くなる

最近、CodexとClaude Codeの両方でAgent構成を見直していました。

最初に考えやすいのは、モデルごとの役割分担です。

```text
Sonnet -> 普段の実装
Opus   -> 難しい判断

Sol    -> Worker
Astra  -> Reviewer
```

これは分かりやすいです。実際、現在のモデル特性とも大きく外れていません。

OpenAIはGPT-6.1 Solを「Near-Astra performance for complex work at a lower cost」と位置づけ、`low / medium / high / xhigh / max` のreasoning effortを提供しています。GPT-6.1 SolはMulti-agentにも対応しています。

AnthropicもSonnet 5.5をwell-scopedな日常タスクに強いモデル、Opus 5.5をcomplex / open-endedでsustained judgmentが必要な仕事に強いモデルとして説明しています。

ただ、ここで違和感が出ました。

**モデルが更新されるたびに、チーム設計まで変更する必要があるのか。**

今日Opusへ渡している仕事を、次のSonnetが十分に処理できるかもしれない。今日Astraへ渡している仕事を、次のSolが処理できるかもしれない。

モデルは入れ替わります。

一方で、Planner、Builder、Reviewerのような責務はそれほど頻繁には変わりません。

ここから、最初の分離が生まれました。

## モデルはRoleではなくRuntimeだった

最初に固定したのは、単純なルールです。

```text
Role != Model
```

`Reviewer = Astra` のように定義すると、モデル更新がそのまま組織変更になります。

そうではなく、先に論理的なRoleを定義します。

```yaml
role: reviewer
responsibility:
  - implementation_review
  - design_review
  - risk_detection
  - evidence_evaluation
```

その後でProvider Profileを介してRuntimeへBindingします。

```text
Logical Topology
      ↓
Provider Profile
      ↓
Runtime Model / Effort / Permission
```

この構造なら、Sonnet 5.5が次世代Sonnetへ変わっても、GPT-6.1 Solが次のSolへ変わっても、チーム設計そのものは残せます。

ただ、実際に開発フローへ当てはめると、`Role != Model` だけでは足りませんでした。

## 「通った」と「良い」は違う

以前は、かなり大きな単位でこう考えていました。

```text
Builder
  ↓
Reviewer
```

でもReviewerの中身を分解すると、性質の違う仕事が混ざっています。

- テストが成功したか確認する
- acceptance criteriaを満たしているか確認する
- regressionの可能性を探す
- 設計上の問題を指摘する
- trade-offを判断する

これらを一つのReviewerへ押し込むと、Evidenceを作る処理とJudgmentを行う処理が混ざります。

そこでVerificationを二段に分けました。

```text
Builder
   │
   ▼
V0 Deterministic Verification
   │
   ├─ test
   ├─ lint
   ├─ typecheck
   ├─ build
   └─ E2E
   │
   ▼
V1 Evidence Verification
   │
   ├─ acceptance criteria照合
   ├─ failure mode確認
   ├─ regression確認
   └─ evidence package生成
   │
   ▼
Reviewer
```

それぞれが答える問いは違います。

| Layer | 問うこと |
| --- | --- |
| V0 | コマンドは成功したか |
| V1 | 要件を満たした証拠になっているか |
| Review | 実装・設計は妥当か |
| Judge | 不確実な状況で、どの選択をするか |
| Human | 本当にこの変更を受け入れるか |

一行で書くと、こうです。

```text
test passed
!= requirement satisfied
!= good design
!= safe to merge
```

これは、自分がRiver Reviewで考えてきた **EvidenceとJudgmentを分ける** という設計と同じでした。

## ReviewerとJudgeも分ける

次に分けたのがReviewerとJudgeです。

自分の中では、役割をこう整理しています。

```text
Reviewer: find problems
Judge:    make difficult decisions
```

例えばDB migrationをレビューしているとします。

Reviewerは、次のようなFindingを出します。

```text
Finding:
DB migration introduces backward-compatibility risk.

Evidence:
Old application instances may still write schema v1.
```

ここまでは「問題を見つけ、Evidenceを示す」仕事です。

しかし、その先には別の問いがあります。

- expand / contract migrationにするか
- maintenance windowを取るか
- feature flagで分離するか

ここにはtrade-offがあります。

そこで、判断が必要なケースだけJudgeへ上げます。

```text
Reviewer
   │
   ▼
Is judgment needed?
   │
 no├────────yes
   │          │
   ▼          ▼
 fix        Judge
```

この分離をすると、高性能モデルをすべてのレビューに投入する必要がなくなります。

高価な能力を「粗探し」に使うのではなく、**曖昧さやtrade-offが残った判断点へ集中させる** ことができます。

## 高性能モデルを「難しい仕事」に使う、ではなかった

ここで、自分のモデルルーティングの考え方が変わりました。

最初はこう考えていました。

```text
Easy task -> cheap model
Hard task -> expensive model
```

でも、これでは粒度が粗すぎます。

難しい実装でも、調査、実装、テスト、レビューのすべてを最上位モデルで処理する必要があるとは限りません。

今は次のように考えています。

```text
Execution stays low.
Reasoning escalates when needed.
Judgment escalates only when needed.
Responsibility ultimately escalates to Human.
```

つまり、

> **安いモデルへ仕事を落とすのではない。判断を必要な場所だけ上位レイヤーへ上げる。**

この違いが、今回一番大きかった発見です。

## Agent Team Topologyの中心はEscalationになる

なお、`Agent Team Topologies` という名称・整理自体には既存の取り組みがあります。この記事では新しい固有名詞を発明したいわけではなく、自分のAI駆動開発環境で必要になった **実行時の責務境界** を便宜上Agent Team Topologyとして整理しています。

ここまで分離すると、チーム全体は次のようになります。

```text
                         HUMAN
                           │
                      Goal / Intent
                           │
                           ▼
                Coordinator / Router
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      Investigation                  Planning
                                         │
                                     Plan Gate
                                         │
                                         ▼
                                      Builder
                                         │
                                         ▼
                               Verification Layer
                                         │
                                         ▼
                                      Reviewer
                                         │
                              ambiguity / high risk
                                         │
                                         ▼
                                       Judge
                                         │
                                         ▼
                                  HUMAN JUDGMENT
                                         │
                                         ▼
                                    MERGE READY
```

ここで重要なのは、箱の数ではありません。

自分がTopologyとして管理したいのは、次の8軸です。

| 軸 | 定義 |
| --- | --- |
| Role | 誰が何に責任を持つか |
| Model | どの能力レイヤーを使うか |
| Effort | どれだけ推論・検証資源を使うか |
| Context | 何を知ってよいか |
| Permission | read / write / execute / external |
| Autonomy | propose / execute / verify / judge |
| Evidence | 判断に必要な証拠 |
| Escalation | どの条件で上位レイヤーへ送るか |

以前はModel / Effort / Role / Autonomy / Judgmentを中心に見ていました。

今はそこから一段進めて、**Context、Permission、Evidence、Escalationまで含めて責務境界を定義する** 方が、実行システムとして説明しやすいと考えています。

## Contextは情報量ではなく境界として扱う

Multi-agentでありがちな発想は「できるだけ多くのContextを渡す」です。

しかしReviewerまでBuilderの会話をそのまま引き継ぐと、Builderが置いた仮説や思い込みまで引き継ぎます。

そこでContextも分けます。

```text
Coordinator
    │ broad context
    ▼
Planner
    │ requirements + constraints
    ▼
Builder
    │ bounded implementation context
    ▼
Verifier
    │ requirement + diff + test results
    ▼
Reviewer
    │ fresh review packet
    ▼
Judge
      minimum decision packet
```

特に意識しているのは次の2つです。

```text
Reviewer != Builder conversation continuation
Judge    != Reviewer conversation continuation
```

OpenAIのMulti-agentドキュメントでも、subagentごとにbounded taskと独立したcontextを持つことが利点として説明されています。

ただし、Topology側へProvider固有の設定値は持ち込みません。

```yaml
context_policy: isolated
```

までを論理契約にして、CodexやClaude Code側のAdapterが具体的な設定へ変換します。

## Escalation Policyを先に定義する

Topologyの中心に置くのは、Agent一覧ではなくEscalation条件です。

例えば次のようにします。

```yaml
escalation:
  effort:
    medium_to_high:
      - complexity_high
      - verification_failed
      - root_cause_unknown

  model:
    standard_to_judge:
      - architecture_boundary_change
      - conflicting_requirements
      - security_sensitive
      - irreversible_change
      - migration
      - large_blast_radius
      - reviewer_disagreement

  human:
    required:
      - irreversible_external_effect
      - production_destructive_operation
      - security_exception
      - unresolved_tradeoff
      - business_intent_required
```

このルールなら、「難しそうだからOpus」「重要そうだからAstra」という曖昧なルーティングから離れられます。

先に決めるのは、

**どんな状態になったら、判断レイヤーを上げるのか。**

です。

## Provider固有のモデル名はProfileへ追い出す

Topology本体にはSonnetやSolを書きません。

現在のモデルを使うなら、例えば次のようにBindingできます。

:::message
以下は2026-10-01時点のモデル特性を踏まえた自分の設計例です。OpenAI / Anthropicの公式推奨Role表ではありません。
:::

### Codex Profile

| Logical Role | Runtime | Effort | Permission |
| --- | --- | --- | --- |
| Coordinator | GPT-6.1 Sol | High | orchestration |
| Investigator | GPT-6.1 Sol | Medium → High | read-only |
| Planner | GPT-6.1 Sol | High | read-only |
| Builder | GPT-6.1 Sol | Medium → High | write |
| Evidence Verifier | GPT-6.1 Sol | High | preferably read-only |
| Reviewer | GPT-6.1 Sol | High | read-only |
| Judge | GPT-6 Astra | High → Xhigh | read-only |

GPT-6.1 Solの標準価格は100万tokenあたり入力$2、出力$10、GPT-6 Astraは入力$10、出力$50です。執筆時点の標準単価では5倍差があります。

そのため、現在の価格構造では「Solで仕事とEvidenceを作り、必要なJudgmentだけAstraへ上げる」という構成にはコスト面でも意味があります。

ただし、ここで重要なのは価格差そのものではありません。

価格や性能が変わったらProfileを差し替えればよく、Topologyは変えないことです。

Codexの設定リファレンスにも、custom roleとsubagentのdefault model / reasoning effortを指定する設定があります。

通常経路はこうします。

```text
Sol Coordinator
      ↓
Sol Investigator
      ↓
Sol Planner
      ↓
Sol Builder
      ↓
Verification
      ↓
Sol Reviewer
      ↓
Merge
```

高リスク時だけ、

```text
Sol Reviewer
      ↓
Astra Judge
      ↓
Human
```

へ上げます。

### Claude Code Profile

Claude側でもTopologyは変えません。

| Logical Role | Runtime | Effort | Permission |
| --- | --- | --- | --- |
| Coordinator / Router | Sonnet 5.5 | Medium | orchestration |
| Investigator | Sonnet 5.5 | High | read |
| Planner | Sonnet 5.5 | Medium | read |
| Architect | Opus 5.5 | High | read |
| Builder | Sonnet 5.5 | Medium → High | write |
| Evidence Verifier | Sonnet 5.5 | Medium / High | read |
| Reviewer | Sonnet 5.5 | High | read |
| Judge | Opus 5.5 | High | read |

AnthropicはSonnet 5.5をwell-scopedな日常タスク、Opus 5.5をcomplex / open-endedで継続的なjudgmentが必要な仕事に強いモデルと説明しています。

それを現在のProfileへ当てはめるなら、通常経路はSonnet中心にして、次のような条件でOpusへ上げます。

```text
architecture boundary
security
migration
irreversible change
large blast radius
unresolved ambiguity
       ↓
Opus Judge
       ↓
Human
```

ここでも、Opusを常設の「偉いReviewer」にすることが目的ではありません。

**Judgmentが必要な場所へ能力を配置する** のが目的です。

## 設定したTopologyと、実際に動いたRuntimeも分ける

もう一つ、運用上分けたいものがあります。

設定したつもりのTopologyと、実際に実行されたRuntimeです。

そこで、別軸としてRuntime Receiptを残します。

```yaml
desired:
  role: reviewer
  model: gpt-6-astra
  effort: high

actual:
  role: reviewer
  model: gpt-6-astra
  effort: high

status: MATCH
```

Agent環境が複雑になるほど、「Highで実行したつもり」「別モデルへEscalateしたつもり」という設定と実行結果のズレが起き得ます。

Topology Contractは設計の正。

Runtime Receiptは実行事実。

この2つも混ぜない方がよいと考えています。

## 論理Roleの数だけAgentを作らない

ここまで読むと、

```text
Router
Investigator
Planner
Builder
Verifier
Reviewer
Judge
```

と7体のAgentを常設するように見えるかもしれません。

でも、これは **論理的な責務境界** です。

実際に生成するRuntime Agent数とは分けます。

v1なら、例えばこれで十分です。

| Runtime Agent | Logical Role |
| --- | --- |
| planner | Router + Planner |
| investigator | Investigation + Research |
| builder | Builder |
| reviewer | Evidence Verifier + Reviewer |
| judge | Architect + Judge |

そして、CI / E2E / test / lint / typecheck / buildはAgentではありません。

HumanもAgentではありません。

```text
5 Runtime Agents
+ Verification Infrastructure
+ Human
```

Agentを増やすこと自体を目的にしないことも、v1では重要だと思っています。

## River Reviewを作ってきて、ここにつながった

このTopologyを考えていて、自分の中で一番つながったのがRiver Reviewでした。

River Reviewでは、Reviewを単一のAIの意見として扱わず、Deterministic / Heuristic / Agentic Review / Human Judgmentという評価層に分け、Finding / Evidence / Verdictを扱っています。

自分がそこで考えていたのは、単に「レビューを増やす」ことではありませんでした。

**Evidenceを作る場所と、Judgmentを置く場所を分けること。**

この考え方をAgent Team全体へ広げると、今回のTopologyになります。

```text
GOAL
 │
 ▼
ROUTE
 │
 ▼
INVESTIGATE
 │
 ▼
PLAN
 │
 ▼
PLAN REVIEW
 │
 ▼
HUMAN PLAN GATE
 │
 ▼
BUILD
 │
 ▼
V0 DETERMINISTIC VERIFY
 │
 ▼
V1 EVIDENCE VERIFY
 │
 ▼
SELF REVIEW
 │
 ▼
INDEPENDENT REVIEW
 │
 ├──────────────┐
 │              │
 │       uncertainty / risk
 │              │
 │              ▼
 │             JUDGE
 │              │
 └───────┬──────┘
         ▼
   HUMAN JUDGMENT
         │
         ▼
     MERGE READY
```

River Reviewで分けてきた、

```text
Goal
Context
Evidence
Review Judgment
Human Judgment
```

という境界を、AIチーム全体の組織設計まで広げたもの、と考えると自分の中ではかなり整理できました。

## 5つの原則にまとめる

現時点では、Agent Team Topologyのコアを次の5原則にまとめています。

| 原則 | 意味 |
| --- | --- |
| Role != Model | モデル更新で組織設計を壊さない |
| Effort != Autonomy | 深く考えさせても権限を広げない |
| Verification != Review | EvidenceとJudgmentを分離する |
| Context is a boundary | 独立性のため意図的に情報を切る |
| Judgment escalates upward | 高い能力を判断点へ集中させる |

そして、運用全体を一文で表すなら、

> **Work flows downward. Evidence flows upward. Judgment escalates upward.**

です。

仕事は下へ流す。

証拠は上へ戻す。

判断だけを上へEscalateする。

## モデルではなく、境界を残す

今日の最適なモデル配置は、おそらく長くは持ちません。

今Opusが必要な仕事を、次のSonnetが処理できるかもしれない。今Astraまで上げている判断を、次のSolが十分に処理できるかもしれない。

だから、モデル名そのものを設計の中心には置かない。

残したいのは、

- 誰が何に責任を持つのか
- どのContextを渡すのか
- 何をEvidenceとして残すのか
- どの条件でJudgmentを上げるのか
- どこからHumanの責任になるのか

という境界です。

**AIエージェントのチーム設計で残すべきなのは、モデル名ではなく、仕事・Evidence・Judgmentの境界なのだと思います。**

まだこれは、自分のAI駆動開発環境から組み立てた設計仮説です。

次はTopologyを定義するだけでなく、Runtime ReceiptとEscalationの実測を取り、どこで手戻りやHuman待ちが発生するかまで見ていきたいと考えています。

## 参考

- [GPT-6.1 Sol Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-6.1-sol)
- [GPT-6 Astra Model | OpenAI API](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [OpenAI API Changelog](https://developers.openai.com/api/docs/changelog)
- [Multi-agent | OpenAI API](https://developers.openai.com/api/docs/guides/responses-multi-agent)
- [Configuration Reference | OpenAI](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Introducing Claude Sonnet 5.5 | Anthropic](https://www.anthropic.com/claude-sonnet-5-5)
- [Introducing Claude Opus 5.5 | Anthropic](https://www.anthropic.com/claude-opus-5-5)
- [Agent Team Topologies](https://eirwin.github.io/agent-team-topologies/)
- [River Review: Judgment Placement](https://river-review.the3396.com/explanation/judgment-placement/)
- [River Review: Human Judgment Focus](https://river-review.the3396.com/explanation/human-judgment-focus/)
