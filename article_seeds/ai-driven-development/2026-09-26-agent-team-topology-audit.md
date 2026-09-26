---
seed_id: seed-20260926-agent-team-topology-audit
title: "AIにどこまで任せるか、ではなく「どの境界で自律させるか」を考えたい"
date: 2026-09-26
status: draft
topics:
  - ai-driven-development
  - agent-teams
  - team-topologies
  - bounded-agency
  - governance
source: experience
source_url: https://teamtopologies.com/ai-success
source_ref: https://eirwin.github.io/agent-team-topologies/
evidence_status: observed
promoted_to:
article_type_candidates:
  - experience
  - insight
  - analysis
---

# AIにどこまで任せるか、ではなく「どの境界で自律させるか」を考えたい

## 観測事実

AI駆動開発を進める中で、最近かなり強く感じていることがあります。

AIに全部任せればうまくいく、というより、これまでソフトウェア開発やアジャイル開発で学んできた知識やフレームワークをAIにも持ち込んだ方が、仕事全体が安定して進みます。

例えば、

- 責務を曖昧にしない
- 一度に抱える認知負荷を増やしすぎない
- 仕事の流れを止める箇所を探す
- 誰と誰が、どの目的で相互作用するのかを明確にする
- レビューと意思決定の境界を分ける
- 自律性を与える範囲と、人間が判断する範囲を明示する

といった考え方です。

AI Agentごとのプロンプトを細かく調整することよりも、Agentたちが仕事をする「システム」そのものを設計したときの方が、うまくいく場面が増えてきました。

## 自分の解釈

ここから、人間の役割も少し変わってきているのではないかと考えています。

AIへ逐一作業指示を出す人というより、アジャイルコーチやシステムコーチのように、

**「このチームなら、どんな構造と相互作用にすると価値が流れやすいか」**

を考え、AI Agent Teamそのものへ働きかける役割です。

AIに仕事を任せるだけではなく、AIが働くチームとシステムを設計する。

この見方をすると、過去に学んできたソフトウェア設計、アジャイル、スクラム、組織設計の知識が、AI時代にもう一度つながり始めます。

## 違和感 / Reader Problem

Multi-Agentの議論では、どうしても「Agentを何体使うか」「Planner / Coder / Reviewerをどう配置するか」といったAgent構成へ目が向きます。

Claude Codeの設定を見ても、

- agents/
- CLAUDE.md
- skills/
- hooks/
- model
- effort
- advisor
- permissions

のように、個別の設定項目として扱いたくなります。

しかし、実際の挙動を決めているのは個々の設定ではありません。

誰が考えるのか。
誰が実行するのか。
どのモデルを使うのか。
どの深さで考えるのか。
どのContextを渡すのか。
誰がレビューするのか。
どのタイミングで別モデルにchallengeさせるのか。
そして、最後に誰が判断するのか。

これらが組み合わさって、初めて一つのAI開発システムになります。

個別設定を一つずつ改善するだけでは、全体として良い構造になっているか分からない。

ここに今の違和感があります。

## 既存知識との接続

この問題を考えていて、最初に思い出したのがTeam Topologiesでした。

Team Topologiesでは、チームを単なる組織図ではなく、価値を速く流すための構造として捉えます。

代表的な4つのTeam Typeは、

- Stream-aligned Team
- Enabling Team
- Complicated Subsystem Team
- Platform Team

そして、チーム間の3つのInteraction Modeは、

- Collaboration
- X-as-a-Service
- Facilitating

です。

この考え方をAI Agent Teamにも持ち込めるのではないか、と考えました。

ただ、調べてみると「Agent Team Topologies」という名称自体はすでに存在していました。

Eric Irwin氏のcommunity projectでは、Claude CodeのAgent Teamsを対象に、

- Parallel Explorers
- Review Board
- Competing Hypotheses
- Feature Pod
- Risky Refactor
- Orchestrator-Only
- Quality-Gated
- Task Queue

という8つのTopology Patternが整理されています。

さらに重要なのは、これらを固定テンプレートではなくprimitiveとして扱い、nesting / pipeline / overlayで合成できるようにしていることです。

例えばFeature PodのReviewerがReview Boardを起動する、といった構成も取れます。

これはかなり納得感があります。

一方、Team Topologies公式も2026年にAgentic AIとの接続を明確に打ち出しています。

公式は、AIにも明確なboundary、stable interface、end-to-endのscope、そして「bounded agency」が必要だと説明しています。

さらに、人間向けに考えてきたcognitive loadの制御をAIにも応用し、AIへ与えるscopeやcontextを絞ることの重要性を述べています。

そして特に印象に残ったのが、

**AIによって実作業が変化しても、value flowに対するstewardship boundaryは人間チームに残る**

という考え方です。

これは、自分がAI駆動開発で感じていたこととかなり近いものでした。

## 今の仮説

ここまで調べた結果、「Agent Team Topologies」という新しい名前を付けること自体には独自性がありません。

既に良いTeam Shapeが整理されています。

その上で、自分が実務で必要だと感じているのは、**Team Shapeの次のレイヤー**です。

仮に、これを **Agent Execution Topology** と呼んでみます。

Agent Execution Topologyは、

```text
Topology Pattern
        ×
Execution Configuration
        ×
Review Architecture
        ×
Governance
```

を、一つの実行システムとして捉える考え方です。

例えばFeature Podを使っているとしても、

```text
frontend agent
  model: main model
  effort: medium
  context: UI + API contract

backend agent
  model: main model
  effort: medium
  context: domain + API contract

reviewer
  model: independent model
  permission: read-only
  context: diff + acceptance criteria

routing
  planning: high effort
  implementation: medium effort
  disagreement: advisor

governance
  reviewer cannot edit
  main agent integrates
  human owns final decision
```

まで見ないと、そのチームが実際にどう動くのかは分かりません。

同じFeature Podでも、model、context、routing、review、permissionが違えば、全く別のシステムになります。

## Agent Team Topology Audit

さらに、この実行構造を定期的に監査する仕組みが必要なのではないかと考えています。

仮に **Agent Team Topology Audit** と呼びます。

監査する対象は、例えば次のようになります。

### Nodes

誰が存在するのか。

- Main
- Planner
- Worker
- Explorer
- Researcher
- Reviewer
- Advisor

### Edges

誰から誰へ仕事や情報が流れるのか。

- delegation
- collaboration
- review
- challenge
- integration

### Routing

どんな条件で経路が変わるのか。

- planningはhigh effort
- implementationはmedium
- disagreement時だけadvisor
- risky changeだけ別Reviewer

### Context

各Agentは何を知る必要があるのか。

逆に、何を渡さない方がよいのか。

### Governance

どこまで自律してよいのか。

- edit可能範囲
- permission
- approval gate
- final decision owner
- irreversible actionの扱い

### Cost

高性能モデルや複数Agentを、どこで使う価値があるのか。

常に最大構成にするのではなく、意思決定境界や高リスク領域へ集中させる。

こうして見ると、

agents / effort / advisor / CLAUDE.md / skills / hooks / permissions

は別々の設定ではありません。

すべて合わせて一つのTopologyです。

## 「どこまで任せるか」から「どの境界で自律させるか」へ

今のところ、一番大事だと感じているのはこの違いです。

**AIにどこまで任せるか。**

ではなく、

**どの責任境界の中で、AIの自律性を最大化するか。**

無制限に自律させることが目的ではありません。

境界を狭くすればよい、という話でもありません。

価値の流れに合わせて責任境界を決め、その中ではできるだけ自律できるようにする。

```text
Value Flow
    ↓
Responsibility Boundary
    ↓
Agent Boundary
    ↓
Context Boundary
    ↓
Interaction
```

という順番で設計する方が自然ではないかと考えています。

これは、巨大なContextと多くの責務を一つのAgentへ集める「God Agent」とは逆の方向です。

Agentを増やすことでもない。

**責務、Context、Interaction、Review、Governanceを含めて、AIチーム全体を設計する。**

## Team Topologiesの4 Types × 3 Modesはどう使えるか

ここで最初の問いへ戻ります。

Team Topologiesの4 Team Types × 3 Interaction Modesを、そのままAI向けの固定分類に置き換える必要はないと思っています。

むしろ設計時の問いとして使う方が強いのではないか。

例えば、

- このAgentはvalue flowに沿ってEnd-to-Endで成果を出す役割なのか
- 他Agentの能力獲得を助けるEnabling的な役割なのか
- 高度な専門判断だけを切り出すべきなのか
- 共通能力としてself-service化すべきなのか
- Agent同士は本当にCollaborationが必要なのか
- APIやToolのようなX-as-a-Serviceで十分なのか
- 一時的なFacilitatingで済むのではないか

と問い直す。

すると「Agentを何体作るか」ではなく、

**価値を速く流すために、どんな責務と相互作用を置くべきか**

からAgent Teamを考えられます。

## 次に試すこと

これはまだ仮説です。

まず自分のAI駆動開発環境を、

- Topology Pattern
- Nodes / Edges
- Model / effort
- Routing
- Context
- Review Architecture
- Governance
- Cost

の観点で可視化してみます。

そのうえで、

- God Agent化している箇所はないか
- Contextを持たせすぎていないか
- Reviewが同一Agent内で閉じていないか
- 高性能Modelを常時使っていないか
- 人間のdecision boundaryが曖昧になっていないか
- Agent間のInteractionが過剰になっていないか

を監査してみたい。

AIに仕事を任せる方法ではなく、**AIが働くチームそのものをどう設計し、どう改善するか。**

ソフトウェア開発やアジャイルで長く考えてきた「チームとシステムの設計」が、AI駆動開発でもう一度重要になっている気がしています。

この仮説は、実践しながら検証していきます。

---

## 参考

- Team Topologies, "AI Success": https://teamtopologies.com/ai-success
- Agent Team Topologies: https://eirwin.github.io/agent-team-topologies/
- Eric Irwin, "Borrowing from Team Topologies to Make Sense of Claude Agent Teams": https://ericirwin.io/posts/borrowing-from-team-topologies-for-claude-agent-teams/

## 追記ログ

### 2026-09-26

- AI駆動開発の実践から、Agentを個別設定ではなく実行Topologyとして見る仮説を記録
- 既存のAgent Team Topologiesと競合しないよう、Team ShapeとExecution / Review / Governanceを分離
- 「Agent Execution Topology」を設計対象、「Agent Team Topology Audit」を監査手法として暫定定義
- X記事として反応を確認し、その後に長文記事・正式なフレーム定義へ進める方針
