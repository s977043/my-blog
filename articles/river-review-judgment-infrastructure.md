---
title: "River Reviewのコア設計：AIレビューではなく「判断のインフラ」を作る"
emoji: "🧭"
type: "tech"
topics: ["ai", "aiagent", "codereview", "claudecode", "codex"]
published: false
---

AIエージェントを使った開発を続けていると、問題はだんだん「コードを書けるか」ではなくなってきます。

コード生成は速くなりました。一方で難しくなるのは、その結果を**どう判断するか**です。

- その実装で本当に良いのか
- 計画から逸脱していないか
- 必要なテストが実行されたか
- AIの指摘を信頼してよいのか
- 複数のレビュー結果をどう整理するか
- 過去の判断を次のレビューへどう引き継ぐか

筆者が開発しているOSS [River Review](https://github.com/s977043/river-review) では、この問題を「AIにもっと上手にレビューさせる」だけでは解こうとしていません。

中心に置いているのは **Review Judgment as Code** です。

> チームが「何を確認し、何をEvidenceとして、どのように判断するか」を、モデルの中ではなくリポジトリ側の資産として持つ。

この記事では、現在のRiver Reviewを機能一覧ではなく、**判断・Evidence・Context・Verification・Memory・Human Judgmentの責務境界**として整理します。

:::message
対象は、AIコードレビューを単発のプロンプトではなく、チーム開発の仕組みとして運用したい人です。

River Reviewの導入手順ではなく、なぜ現在の構造になっているのかを扱います。Judgment Placementの4層分類そのものは、既存記事「[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)」に分けています。
:::

## TL;DR

River Reviewのコアを圧縮すると、次の4点です。

1. **Judgmentをモデルに閉じ込めない**。レビュー基準をversioned / repo-ownedなSkillとして持つ
2. **ConversationではなくArtifactとEvidenceを境界にする**。別Agent・CI・別sessionでも再利用できる形にする
3. **生成と検証を分ける**。ReviewerのFindingをDeterministic VerifierとReview Coverageで検証する
4. **Runtimeを抱え込まない**。River ReviewはReview Judgmentを返し、Session / Retry / StopはcallerやAgent Hostに残す

最近、長時間AIセッションのトークン消費を実測した記事を読み、3つ目とは別に「Context Lifecycle」も重要だと考えるようになりました。

ただし、そのLifecycleまでRiver Review Coreへ入れるつもりはありません。

むしろ、**どこまでをReview Judgmentの責務にして、どこからをAgent Runtimeへ返すか**が重要だと考えています。

## きっかけは「長いSessionほどContextを読み直す」という実測だった

TOKIUMの花房さんの記事「[Claude Code / Codexで『私のlimit、減りすぎ…？』と思ったときに見る記事](https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions)」では、Codexの実ログ111セッション・8,096リクエストを集計しています。

そこで示されていたのは、Prompt Cacheが高い割合でヒットしていても、Contextが大きくなれば1リクエストで再送する量そのものが増える、ということでした。

記事では、長時間セッションへの対策として次のような運用を挙げています。

- Context使用率を見ながら早めにsessionを切り替える
- テストやログ解析のような大きな出力をsubagent側へ隔離する
- 長時間空いた巨大sessionをそのままresumeしない

特に気になったのが2つ目でした。

Subagentは、並列処理のためだけではありません。

**大量のContextをMain Agentへ入れないための境界にもなる。**

この考え方をRiver Reviewへ当てはめると、単にContext Budgetを小さくするだけでは足りません。

```text
何を読むか
    ↓
どの責務に読ませるか
    ↓
何をEvidenceとして残すか
    ↓
次の判断へ何を渡すか
```

Contextの「量」の問題から、Contextの「Lifecycleと責務境界」の問題へ広がります。

## 1. Review Judgment as Code：判断基準をモデルから切り離す

River Reviewの出発点はここです。

PRのdiffをLLMへ渡して、

```text
バグを探してください
```

と依頼するだけなら、かなり簡単に作れます。

問題は、そのレビュー品質をチームとしてどう維持するかです。

モデルが変わるたびに結果が変わる。Promptを少し変えると指摘が変わる。ある人のClaude Codeでは効いている知識が、CIやCodexには渡らない。

そこでRiver Reviewでは、レビュー判断を **Skill** としてリポジトリ側へ出します。

Skillには、たとえば次のような内容を持たせます。

- 何を見るのか
- どのphaseや変更に適用するのか
- 何をEvidenceとするのか
- 何をFindingとして返すのか
- どの条件では指摘しないのか

security、migration、dependency、accessibility、plan conformanceなどの判断基準を、モデル固有のPromptではなくチーム所有の資産として扱います。

さらにfixtureやgolden outputを持たせることで、考え方としては次に近づきます。

```text
Prompt
```

ではなく、

```text
Judgment
  +
Regression Test
```

です。

モデルは入れ替わってもよい。

**何を重要だと考えるかは、チーム側に残す。**

これがReview Judgment as Codeです。

## 2. ConversationではなくArtifactを境界にする

次に重要なのが、何をレビュー対象の正本にするかです。

長時間のAI開発では、会話履歴の中に多くの情報が入ります。

- 要件
- 計画
- 実装理由
- diff
- テスト結果
- レビュー結果
- 修正理由

すべてをConversationに置いたままにすると、そのsessionには便利です。

ただ、別sessionやCI、別Agentから再利用しにくくなります。

River Reviewでは、入力と出力をArtifactとして扱います。

代表的には次のようなものです。

```text
requirements
plan
diff
tests
JUnit
existing review
        ↓
River Review
        ↓
Review Artifact
```

ここで重要なのは、**チャットを正本にしない**ことです。

Artifactになっていれば、

- 同じ入力で再実行できる
- CIから利用できる
- Claude CodeとCodexで共有できる
- Humanが後から確認できる
- 次のsessionへ渡せる

という性質を持ちます。

River Reviewを特定のCoding Agent専用にしたくない理由もここにあります。

Hostが変わっても、ArtifactとReview Judgmentの契約は残せます。

## 3. Context Engineering：「全部読む」ではなく「判断に必要なものを読む」

Artifact化すると、次の問題が出ます。

**全部のArtifactを毎回LLMへ入れるのか。**

これはやりません。

River ReviewにはContext Budgetがあります。

現在の設定では、Review Modeとして次のpresetを持っています。

| Mode | maxTokens |
| --- | ---: |
| tiny | 1,024 |
| medium | 4,000 |
| large | 16,000 |

明示的なbudgetを指定することもできます。

さらにrepo-wide contextでは、候補を次のような信号でrankingします。

- `pathProximity`
- `symbolUsage`
- `siblingTest`
- `commitRecency`

考え方は単純です。

> **全部読むのではなく、その判断に必要なEvidenceへ近いContextを選ぶ。**

SkillについてもProgressive Disclosureを使います。

最初からすべてのSkill本文やReferenceをpromptへ入れるのではなく、まずmetadataから対象を絞り、選ばれたSkillの詳細だけをロードします。

```text
Intent / Change
      ↓
Skill metadata
      ↓
Selected Skill
      ↓
Required Context
      ↓
Evidence
```

これはtoken削減だけの話ではありません。

無関係な情報を大量に入れると、重要なEvidenceが相対的に埋もれます。

つまりContext Budgetは、

**Cost Budgetであると同時にAttention Budgetでもある**

と考えています。

### Review Teamも「Agentを増やすこと」が目的ではない

River Reviewには、bug-hunter / security-scanner / test-gap / dependency-reviewerなど、観点別のreviewer roleがあります。

ただし、現在のReview Teamは完全自律な独立Agent群ではありません。

1つのorchestratorがroleを並列実行し、そのfindingsをmergeする構造です。

```text
Review Orchestrator
   ├─ bug-hunter
   ├─ security-scanner
   ├─ test-gap
   ├─ dependency-reviewer
   └─ ...
          ↓
      findings[]
```

ここでの目的は「Agentをたくさん動かすこと」ではなく、**レビュー観点と入力Contextの責務を分けること**です。

長時間のAI開発Runtimeまで広げるなら、テストの巨大ログをMain Agentへ戻さず、専用の実行単位で解析し、結果・Evidence・Riskだけを次へ渡す設計が考えられます。

ただし、それはRiver Review自身がgeneral-purpose multi-agent runtimeになる、という意味ではありません。

## 4. 生成と検証を分ける

AIレビューでは、Findingを出すことと、そのFindingが正しいことは別です。

LLMは問題候補を見つけられます。

一方で、

- diffに存在しない箇所を指摘する
- Evidenceが不足している
- 既存コードの問題を今回の変更として扱う
- 実際にはguardされている条件を見落とす

こともあります。

River Reviewでは、ReviewerとVerifierを分けています。

```text
Reviewer
   ↓
Candidate Finding
   ↓
Deterministic Verifier
   ↓
Verified / Rejected
```

現在のVerifierは、別のLLM Agentではありません。

Evidenceやscope、schemaなど、機械的に確認できる部分を**決定論的に検証するレイヤー**です。

ここで狙っているのは、

```text
Probabilistic generation
        ↓
Deterministic verification
```

という分離です。

意味判断まで全部決定論にすることはできません。

ただし、機械で確かめられる条件まで毎回LLMへ判断させる必要もありません。

### 「Findingが0件」と「レビューできた」は違う

もう1つ分けているのがReview Coverageです。

たとえばSecurity Reviewerがtimeoutして、

```json
{
  "findings": []
}
```

になったとします。

これは、

```text
security issue = none
```

ではありません。

```text
security review = not completed
```

かもしれません。

そこでReview Coverageでは、aggregate statusを次の3つに分けています。

```text
complete
partial
not_executed
```

「問題が無かった」と「確認できなかった」を同じ値にしないためです。

なお、現段階のReview Coverageは **observe-only** です。

JSON Artifactやsaved runへ記録しますが、Coverageそのものが既存Gateの挙動を変更する段階ではありません。

ここは、実装済みだからといって役割を大きく書かないようにしています。

## 5. MemoryはTranscriptではなくJudgmentを残す

レビューを繰り返すと、今度は別の問題が出ます。

**同じ指摘を毎回する。**

たとえば、

- この設計判断はADRで決めている
- この依存は受け入れ済み
- このFindingはWontFixと判断した
- このpatternは過去にも確認している

という状況です。

River ReviewのRiverbed Memoryは、こうしたレビュー判断を将来のReviewへ再利用するための層です。

現在のstorage contractでは、たとえば次のtypeを扱います。

```text
adr
review
wontfix
pattern
decision
eval_result
suppression
resurface
```

ここで残したいのは、過去のConversation全部ではありません。

次の判断を変える情報です。

```text
Decision
Constraint
Evidence
Accepted Risk
Suppression
Pattern
```

長時間sessionの議論とつなげると、この違いはかなり重要です。

```text
Transcript Memory
```

と、

```text
Judgment Memory
```

は別物です。

会話の全文を持ち続けなくても、判断に必要な状態がArtifactとMemoryへ残っていれば、sessionそのものは使い捨てにしやすくなります。

## 6. 人間には「全部」ではなく「判断が必要な面」を見せる

AI側のreviewerやverificationを増やすと、人間が読む情報も増えていきます。

そこで次に問題になるのがHuman Attentionです。

River Reviewでは、Human Attention Architectureとして次の分離を検討・実装しています。

```text
machine-side complexity
        ↓
review / validation
        ↓
human-facing projection
        ↓
human decision
```

ここで重要なのは、

> Humanに見せる量を減らすために、Findingそのものを隠さない。

ということです。

考え方は、

```text
Visibility = complete
Attention = selective
```

です。

Human-facing outputは、概念的には次の3層へ分けます。

```text
L1 Decision Surface
   今、人間が判断するもの

L2 Resolution Summary
   finding / status / evidence / verification / coverage

L3 Full Review Artifact
   machine-readableな完全な状態
```

そしてOrganizerは、新しいJudgeにはしません。

既にあるFinding、Coverage、Verificationなどから、Humanが見るべき表示カテゴリを**deterministicに投影する**役割に留めます。

```text
Canonical Review State
        ↓
Organizer
        ↓
Human Decision Surface
```

Organizer自身がseverityを再評価したり、Findingのtruthを再判定したり、GO / NO-GOを所有したりしない。

これはかなり重要な境界です。

AIの出力が増えたからといって、その上に「さらに賢いAI Judge」を必須レイヤーとして積めばよいとは考えていません。

## 7. Context LifecycleはRiver Review Coreへ入れない

ここで最初の長時間sessionの話へ戻ります。

現在のRiver Reviewは、

> 1回のReviewで、何をContextへ入れるか

についてはかなり制御できるようになりました。

しかし、

> 1つのAI開発sessionを、いつ終了するか

は別の責務です。

長時間のAgent実行では、

```text
Task
 ↓
Implementation
 ↓
Test
 ↓
Review
 ↓
Fix
 ↓
Review
 ↓
Test
 ↓
...
```

と続きます。

ここでは、

```text
Observe
 ↓
Checkpoint
 ↓
Compact / Rotate
 ↓
Resume from Artifact
```

のようなContext Lifecycleが必要になると考えています。

ただし、River Review Coreへ、

```yaml
soft_context_limit: 70%
rotate_after_review: true
```

のようなsession policyを入れるつもりはありません。

70%という運用値はHostやModelの仕様で変わります。

Session rotation、compact、retry、timeout、stopは、Claude CodeやCodex、独自Agentなどの**Agent Host / Caller側のExecution Policy**です。

River Reviewが提供するのは、その前後で必要になる判断材料です。

```text
Agent Host / Caller
├─ Session
├─ Context Lifecycle
├─ Retry
├─ Timeout
├─ Iterate / Stop
└─ Execution
          ↓
River Review
├─ Review Judgment
├─ Context Selection
├─ Findings
├─ Verification
├─ Coverage
├─ Evidence
└─ Memory
```

現在のRiver Reviewのドキュメントでも、反復・停止・エスカレーションはcallerの責務としています。

River Reviewはループそのものを所有せず、判断材料を返す。

この境界を維持したまま、次のsessionが必要な判断を復元できるArtifactやMemoryを強くしていく方が、設計として扱いやすいと考えています。

## River Reviewのコアを1枚にすると

現在の構造をかなり圧縮すると、次のようになります。

```text
Engineering Artifacts
        │
        ▼
┌────────────────────────┐
│ Context Selection      │
│ Budget / Disclosure    │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Skills / Reviewers     │
│ Generate Findings      │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Deterministic Verifier │
│ Review Coverage        │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Organizer / Projection │
│ Human Decision Surface │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Human Judgment         │
└────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ Riverbed Memory        │
│ Feedback / Evolution   │
└────────────────────────┘
        │
        └───────────────→ Next Review
```

そして、この外側にAgent Hostがあります。

```text
Agent Host
├─ Session
├─ Context Lifecycle
├─ Execution
├─ Retry
└─ Stop
```

この分離が、今のRiver Reviewのコア設計です。

## AI開発で重要なのは「賢いAgent」だけではない

AI開発の話では、

- どのモデルが一番賢いか
- どのAgentが一番コードを書けるか
- 何個のAgentを並列で動かすか

に注目しがちです。

もちろんModel性能は重要です。

ただ、長時間AI開発を運用するほど、それだけでは足りなくなります。

必要になるのは、

```text
Context
Evidence
Judgment
Verification
Memory
Responsibility
```

の設計です。

Agentが賢くなるほど、

> Agentへ何を頼むか

だけではなく、

> Agentの判断を、どこに置き、どう検証し、どう残し、誰が最終責任を持つか

が重要になります。

River Reviewを作り始めた頃は、「AIレビューをもっと良くしたい」という問題から始まりました。

現在、より近い表現はこれです。

> **AIと一緒に開発するときの「判断のインフラ」を作る。**

モデルは変わります。

Agentも変わります。

Hostも変わります。

その中でも、

- 何を重要と考えるか
- 何をEvidenceとするか
- どこまで確認できたか
- 何を記憶するか
- どこでHumanへ返すか

は、チーム自身が所有できるようにしたい。

River Reviewのコアは、そのためのReview Judgment Layerです。

## 参考

- [River Review（GitHub）](https://github.com/s977043/river-review)
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Reviewのアーキテクチャ](https://github.com/s977043/river-review/blob/main/pages/explanation/river-architecture.md)
- [Review Coverage Contract](https://github.com/s977043/river-review/blob/main/docs/development/review-coverage-contract.md)
- [Riverbed Storage](https://github.com/s977043/river-review/blob/main/pages/reference/riverbed-storage.md)
- [ADR-012: Human Attention Architecture](https://github.com/s977043/river-review/blob/main/docs/adr/012-human-attention-architecture.md)
- [Claude Code / Codexで「私のlimit、減りすぎ…？」と思ったときに見る記事](https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions)

## 関連記事

- [AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)
