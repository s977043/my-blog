---
title: "River Reviewのコア設計：AIレビューではなく、チームの判断を再現可能に残す"
emoji: "🗂️"
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

この記事では、現在のRiver Reviewを機能一覧ではなく、**判断・Evidence・文脈の選び方・検証・記憶・人の判断の責務境界**として整理します。

:::message
対象は、AIコードレビューを単発のプロンプトではなく、チーム開発の仕組みとして運用したい人です。

River Reviewは、Claude Code / Codexのプラグインや、GitHub Actionsから使うレビューのOSSです。この記事では導入手順ではなく、なぜ現在の構造になっているのかを扱います。Judgment Placementの4層分類そのものは、既存記事「[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)」に分けています。
:::

## TL;DR

River Reviewのコアを圧縮すると、次の6点です。

1. **Judgmentをモデルに閉じ込めない**。レビュー基準を、リポジトリ側でバージョン管理するSkillとして持つ
2. **会話ではなくArtifactとEvidenceを境界にする**。別のエージェントやCI、別のセッションでも再利用できる形にする
3. **生成と検証を分ける**。レビュアーの指摘を、決定論的な検証とReview Coverageで確かめる
4. **会話の全文ではなく判断を記憶する**。Riverbed Memoryに、次の判断を変える情報（決定・受け入れたリスク・抑制）だけを残す
5. **人にはすべてを見せたうえで、判断が要る面に注意を集める**。Findingを隠さず、表示で注意を絞る
6. **実行の制御を抱え込まない**。River ReviewはReview Judgmentを返し、セッション・再試行・停止は呼び出し側に残す

## きっかけは「長いSessionほどContextを読み直す」という実測だった

TOKIUMのhanafusayさんの記事「[Claude Code / Codexで『私のlimit、減りすぎ…？』と思ったときに見る記事](https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions)」では、Codexの実ログ111セッション・8,096リクエストを集計しています。

そこで示されていたのは、Prompt Cacheが高い割合でヒットしていても、Contextが大きくなれば1リクエストで再送する量そのものが増える、ということでした。

記事では長時間セッションへの対策がいくつか紹介されています。特に気になったのは、テストやログ解析のような大きな出力をsubagent側へ隔離する、という運用でした。

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

River Reviewの出発点は、レビューの判断基準をモデルやプロンプトの中ではなく、リポジトリ側の資産として持つことです。

モデルやプロンプトを変えるたびに指摘が変わる。ある人の手元で効いている知識が、CIや別のエージェントには渡らない。これを避けるために、何を見るか、何をEvidenceとするか、どの条件では指摘しないかを **Skill** としてチームが所有し、fixtureで回帰を確かめられるようにしています。

モデルは入れ替わってもよい。

**何を重要だと考えるかは、チーム側に残す。**

これがReview Judgment as Codeです。

判断基準の中身や、判断を決定論的なチェックからAIレビュー、人の判断まで4層に置き分ける考え方は「[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)」で詳しく書きました。この記事では、この判断基準を中心に置いたとき、その周りの責務をどう分けているかを扱います。

## 2. 会話ではなくArtifactを境界にする

次に重要なのが、何をレビュー対象の正本にするかです。

長時間のAI開発では、会話履歴の中に多くの情報が入ります。

- 要件
- 計画
- 実装理由
- diff
- テスト結果
- レビュー結果
- 修正理由

すべてを会話に置いたままにすると、そのセッションの中では便利です。

ただ、別のセッションやCI、別のエージェントからは再利用しにくくなります。

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
- 人が後から確認できる
- 次のセッションへ渡せる

という性質を持ちます。

River Reviewを特定のコーディングエージェント専用にしたくない理由もここにあります。

実行環境が変わっても、ArtifactとReview Judgmentの契約は残せます。

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

さらに、リポジトリ全体から文脈を集めるときは、候補を並べ替える仕組み（ranking）を設定で有効にできます。既定では無効です。

現在の実装で実際に計算している信号は、変更ファイルどうしのパスの近さ（`pathProximity`）だけです。設定上は `symbolUsage`・`siblingTest`・`commitRecency` の重みも指定できますが、現在の実装はこれらの信号を計算しておらず、並び替えには効きません。

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

長時間のAI開発全体まで広げるなら、テストの巨大なログをメインのエージェントへ戻さず、専用の実行単位で解析し、結果とEvidenceとリスクだけを次へ渡す設計が考えられます。

ただし、それはRiver Review自身が汎用のマルチエージェント実行基盤になる、という意味ではありません。

## 4. 生成と検証を分ける

AIレビューでは、指摘を出すことと、その指摘が正しいことは別です。

River Reviewでは、レビュアーが出した指摘の候補を、別のLLMではなく決定論的なVerifierに通し、根拠の参照先が差分に実在するか、重大度に根拠があるか、修正案があるかのように、機械で確かめられる条件を検証しています。意味判断まで決定論にはできませんが、機械で確かめられる条件まで毎回モデルに判断させる必要もありません。

この考え方は前掲のJudgment Placementの記事でも扱ったので、ここではもう1つの分離であるReview Coverageを中心に書きます。

### 「Findingが0件」と「レビューできた」は違う

たとえばSecurity Reviewerがtimeoutして、

```json
{
  "findings": []
}
```

になったとします。これは `security issue = none` ではなく、`security review = not completed` かもしれません。

そこでReview Coverageでは、aggregate statusを `complete` / `partial` / `not_executed` の3つに分けています。「問題が無かった」と「確認できなかった」を同じ値にしないためです。

なお、Review Coverageは現時点ではExperimental（実験的）な扱いです。既定ではGateの判定を変えず、JSONの成果物や保存された実行記録に状態を残します。

一方、レビューを繰り返すループの収束判定では、Coverageが不完全（`partial` / `not_executed`）な実行を「収束した」とはみなしません。タイムアウトで指摘が0件になった実行を根拠に、ループを止めてしまわないためです。

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

ここで残したいのは、過去の会話の全部ではありません。

次の判断を変える情報です。

```text
Decision
Constraint
Evidence
Accepted Risk
Suppression
Pattern
```

長時間セッションの議論とつなげると、この違いはかなり重要です。会話の全文を残す `Transcript Memory` と、判断を残す `Judgment Memory` は別物です。

会話の全文を持ち続けなくても、判断に必要な状態がArtifactとMemoryへ残っていれば、セッションそのものは使い捨てにしやすくなります。

## 6. 人間には「全部」ではなく「判断が必要な面」を見せる

AI側のreviewerやverificationを増やすと、人間が読む情報も増えていきます。

そこで次に問題になるのがHuman Attentionです。

River Reviewでは、人の注意をどこに向けてもらうかを、次のような分離として設計しています。現時点で実装しているのは、既存の判断結果を変えずに表示だけを行うDecision Surfaceです。

```text
machine-side complexity
        ↓
review / validation
        ↓
human-facing projection
        ↓
human decision
```

ここで重要なのは、**Humanに見せる量を減らすために、Findingそのものを隠さない**ことです。すべてを見られる状態は保ったまま（`Visibility = complete`）、注意を向けてもらう面だけを絞ります（`Attention = selective`）。

人に見せる出力は、概念的には次の3層へ分けます。

```text
L1 Decision Surface
   今、人間が判断するもの

L2 Resolution Summary
   finding / status / evidence / verification / coverage

L3 Full Review Artifact
   machine-readableな完全な状態
```

設計上、この3層を組み立てるOrganizerは、新しいJudgeにはしません。

既にあるFinding、Coverage、Verificationなどから、人が見るべき表示カテゴリを**決定論的に投影する**役割に留めます。

```text
Canonical Review State
        ↓
Organizer
        ↓
Human Decision Surface
```

Organizer自身が重大度を評価し直したり、指摘の真偽を判定し直したり、GO / NO-GOの判断を持ったりはしない。

これはかなり重要な境界です。

なお、Organizerの組み込みは設計上の後続段階で、現時点ではまだ実装していません。今あるのは、その手前の表示専用のDecision Surfaceです。

AIの出力が増えたからといって、その上に「さらに賢いAI Judge」を必須レイヤーとして積めばよいとは考えていません。

## 7. Context LifecycleはRiver Review Coreへ入れない

ここで最初の長時間セッションの話へ戻ります。

現在のRiver Reviewは、

> 1回のReviewで、何をContextへ入れるか

についてはかなり制御できるようになりました。

しかし、

> 1つのAI開発セッションを、いつ終了するか

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

いつセッションを切るべきかという判断基準そのものは、この記事の範囲外です。

ただし、River Review Coreへ、

```yaml
soft_context_limit: 70%
rotate_after_review: true
```

のようなセッション方針を入れるつもりはありません。

ここで例に挙げた70%は、冒頭で触れたTOKIUMの記事がセッションを切り替える運用上の目安として挙げている値で、技術的な閾値ではありません。適した値も、実行環境やモデルによって変わります。

セッションの切り替え、圧縮、再試行、タイムアウト、停止は、Claude CodeやCodex、独自のエージェントなど、**呼び出し側（Agent Host）の実行方針**です。

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

この境界を維持したまま、次のセッションが必要な判断を復元できるArtifactやMemoryを強くしていく方が、設計として扱いやすいと考えています。

## River Reviewのコアを1枚にすると

現在の構造をかなり圧縮すると、次のようになります。人向けの出力は、現時点では表示専用のDecision Surfaceです（§6のOrganizerは設計段階なので、図には入れていません）。

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
│ Human Decision Surface │
│ (display only)         │
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
│ Judgment History       │
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

## AIレビューから、チームが所有する判断へ

River Reviewを作り始めた頃は、「AIレビューをもっと良くしたい」という問題から始まりました。今は、AIにレビューさせること自体より、チームの判断を責務ごとに分け、再現できる形で残すことのほうが中心にあると考えています。

モデルも、Agentも、Hostも変わります。その中でも、

- 何を重要と考えるか
- 何をEvidenceとするか
- どこまで確認できたか
- 何を記憶するか
- どこで人の判断へ返すか

は、チーム自身が所有できるようにしたい。

River Reviewのコアは、そのためのReview Judgment as Codeです。判断をArtifact・Evidence・Verification・Memory・Human Judgmentへ分けておくことで、モデルやHostが変わっても同じ判断を再現できるようにしています。

なお、River Reviewのドキュメントは、「判断のインフラ」（Engineering Judgment Infrastructure）を長期の方向と位置づけ、現在の機能の説明には使わないとしています。この記事で扱ったのは、その手前にある現在のコア設計です。

## 参考

- [River Review（GitHub）](https://github.com/s977043/river-review)
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Reviewのアーキテクチャ](https://github.com/s977043/river-review/blob/main/pages/explanation/river-architecture.md)
- [設定スキーマ（Context Budget / ranking）](https://github.com/s977043/river-review/blob/main/pages/reference/config-schema.md)
- [Review Coverage Contract](https://github.com/s977043/river-review/blob/main/docs/development/review-coverage-contract.md)
- [Loop Convergence Contract](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
- [Riverbed Storage](https://github.com/s977043/river-review/blob/main/pages/reference/riverbed-storage.md)
- [ADR-012: Human Attention Architecture](https://github.com/s977043/river-review/blob/main/docs/adr/012-human-attention-architecture.md)
- [Claude Code / Codexで「私のlimit、減りすぎ…？」と思ったときに見る記事](https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions)

## 関連記事

- [AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)
