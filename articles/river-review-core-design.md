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

River Reviewは、Claude Code / Codexのプラグインや、GitHub Actionsから使うレビューのOSSです。この記事では導入手順ではなく、なぜ現在の構造になっているのかを扱います。
:::

## TL;DR

River Reviewのコアを圧縮すると、次の6点です。

1. **Judgmentをモデルに閉じ込めない**。レビュー基準を、リポジトリ側でバージョン管理するSkillとして持つ
2. **会話ではなくArtifactとEvidenceを境界にする**。別のエージェントやCI、別のセッションでも再利用できる形にする
3. **生成と検証を分ける**。レビュアーの指摘を、決定論的な検証とReview Coverageで確かめる
4. **会話の全文ではなく判断を記憶する**。Riverbed Memoryに、次の判断を変える情報（決定・受け入れたリスク・抑制）を残す
5. **人にはすべてを見せたうえで、判断が要る面に注意を集める**。Findingを隠さず、表示で注意を絞る
6. **実行の制御を抱え込まない**。River ReviewはReview Judgmentを返し、セッション・再試行・停止は呼び出し側に残す

## きっかけは「長いセッションほど文脈を読み直す」という実測だった

TOKIUMのhanafusayさんの記事「[Claude Code / Codexで『私のlimit、減りすぎ…？』と思ったときに見る記事](https://zenn.dev/tokium_dev/articles/ai-agent-usage-limit-long-sessions)」は、Codexの実ログ111セッション・8,096リクエストを集計しています。そこで示されていたのは、Prompt Cacheが高い割合でヒットしていても、文脈が大きくなれば1リクエストで再送する量そのものが増える、ということでした。

特に気になったのは、対策の1つとして紹介されていた、テストやログ解析のような大きな出力をサブエージェント側へ隔離する運用でした。サブエージェントは並列処理のためだけでなく、大量の文脈をメインのエージェントへ入れないための境界にもなります。

River Reviewに当てはめると、Context Budgetを小さくするだけでは足りません。何を読むか、どの責務に読ませるか、何を根拠として残し、次の判断へ何を渡すか。文脈の「量」の問題が、文脈をいつ区切って何を引き継ぐかという「責務境界」の問題へ広がります。

ただし、この記事の中心は判断基準の置き方です。文脈の話は、その周りにある責務の1つとして扱います。

## 1. Review Judgment as Code：判断基準をモデルから切り離す

River Reviewの出発点は、レビューの判断基準をモデルやプロンプトの中ではなく、リポジトリ側の資産として持つことです。

判断基準がモデルやプロンプトの中にあると、モデルを変えるたびに指摘が変わり、ある人の手元で効いている知識もCIや別のエージェントには渡りません。そこで、何を見るか、何をEvidenceとするか、どの条件では指摘しないかを **Skill** としてチームが所有し、fixtureで回帰を確かめられるようにしています。

例として、River Reviewのリポジトリにある、AI生成コード向けのSkill `hallucinated-reference` を見ます。生成されたコードに紛れ込む、存在しない関数やメソッドの呼び出しを見つけるものです。

- **何を見るか**: 差分で新しく追加されたimportや、関数・メソッドの呼び出し
- **何をEvidenceとするか**: 差分の該当行と、リポジトリを検索して定義が見つかった位置（または見つからなかった事実）
- **どの条件では指摘しないか**: 同じ差分の中で定義も追加されている参照。定義が見つからなくても、コード生成などで作られる可能性を消せないときは、指摘ではなく質問として返す
- **回帰をどう確かめるか**: 「存在しないヘルパーを呼んでいる」fixtureと、「同じ変更の中で定義している」誤検知の例を、Skillと一緒に置いている

見る対象・根拠・指摘しない条件は1つのファイルに書かれ、このSkillはRiver Reviewのリポジトリで、fixtureと一緒にバージョン管理されています。

チームが自分の基準を足すときも、Skillやプロジェクト固有のレビュールール（`.river/rules.md`）を自分のリポジトリに置き、コードと一緒に管理できます。モデルは入れ替わっても構いません。**何を重要だと考えるかは、チーム側に残す。**

これがReview Judgment as Codeで、River Reviewのドキュメントも中核の考え方としています。「判断のインフラ」（Engineering Judgment Infrastructure）という語は、同じドキュメントでは現在の機能ではなく長期の方向を指すものとされています。

判断基準の中身や、判断を決定論的なチェックからAIレビュー、人の判断まで4層に置き分ける考え方は「[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement)」で詳しく書きました。この記事では、この判断基準を中心に置いたとき、その周りの責務をどう分けているかを扱います。

## 2. 会話ではなくArtifactを境界にする

次は、何をレビュー対象の正本にするかです。

長時間のAI開発では、会話履歴に要件・計画・実装理由・diff・テスト結果・レビュー結果・修正理由が入っていきます。すべてを会話に置いたままにすると、そのセッションの中では便利ですが、別のセッションやCI、別のエージェントからは再利用しにくくなります。

River Reviewでは、入力と出力をArtifactとして扱います。代表的には次のようなものです。

```text
plan
diff
tests
JUnit
既存レビューコメント
        ↓
River Review
        ↓
Review Artifact
```

チャットを正本にせず、Artifactにしておけば、

- 同じ入力で再実行できる
- CIから利用できる
- Claude CodeとCodexで共有できる
- 人が後から確認できる
- 次のセッションへ渡せる

という性質を持ちます。

River Reviewを特定のコーディングエージェント専用にしたくない理由もここにあります。実行環境が変わっても、ArtifactとReview Judgmentの契約は残せます。

## 3. Context Engineering：「全部読む」ではなく「判断に必要なものを読む」

Artifact化すると、全部のArtifactを毎回LLMへ入れるのか、という問題が出ます。これはやりません。

River ReviewにはContext Budgetがあります。

現在の設定では、レビューのモードごとに次の上限を持っています。

| Mode | maxTokens |
| --- | ---: |
| tiny | 1,024 |
| medium | 4,000 |
| large | 16,000 |

明示的なbudgetを指定することもできます。

さらに、リポジトリ全体から文脈を集めるときは、候補を並べ替える仕組み（ranking）を設定で有効にできます。既定では無効です。

現在の実装で実際に計算している信号は、変更ファイルどうしのパスの近さ（`pathProximity`）だけです。設定上は `symbolUsage`・`siblingTest`・`commitRecency` の重みも指定できますが、現在の実装はこれらの信号を計算しておらず、並び替えには効きません。

考え方は単純です。

> **全部読むのではなく、その判断に必要なEvidenceへ近い文脈を選ぶ。**

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

これはtoken削減だけの話ではありません。無関係な情報を大量に入れると、重要なEvidenceが相対的に埋もれます。つまりContext Budgetは、コストの予算であると同時に、注意の予算でもあると考えています。

### Review Teamも「エージェントを増やすこと」が目的ではない

River Reviewには、bug-hunter / security-scanner / test-gap / dependency-reviewerなど、観点別のレビュー役割があります。

ただし、現在のReview Teamは完全自律な独立エージェント群ではありません。1つのorchestratorが役割を並列実行し、そのfindingsをmergeする構造です。

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

目的は「エージェントをたくさん動かすこと」ではなく、**レビュー観点と、入力する文脈の責務を分けること**です。

## 4. 生成と検証を分ける

AIレビューでは、指摘を出すことと、その指摘が正しいことは別です。

River Reviewでは、レビュアーが出した指摘の候補を、別のLLMではなく決定論的なVerifierに通します。確かめるのは、根拠の参照先が差分に実在するか、Skillが宣言した重大度を超えていないか、修正案があるか、のように機械で確かめられる条件です。意味判断まで決定論にはできませんが、機械で確かめられる条件まで毎回モデルに判断させる必要もありません。

この考え方は前掲のJudgment Placementの記事でも扱ったので、ここではもう1つの分離であるReview Coverageを中心に書きます。

### 「Findingが0件」と「レビューできた」は違う

たとえばSecurity Reviewerがtimeoutして、

```json
{
  "findings": []
}
```

になったとします。これは `security issue = none` ではなく、`security review = not completed` かもしれません。

そこでReview Coverageでは、全体の状態を `complete` / `partial` / `not_executed` の3つに分けています。「問題が無かった」と「確認できなかった」を同じ値にしないためです。

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

River ReviewのRiverbed Memoryは、こうしたレビュー判断を将来のレビューへ再利用するための層です。

現在の保存形式では、たとえば次のtypeを扱います。

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

ここで残したいのは、過去の会話の全部ではなく、次の判断を変える情報です。typeではなく、残したい情報の分類として並べると、次のようになります。

```text
Decision
Constraint
Evidence
Accepted Risk
Suppression
Pattern
```

長時間セッションの議論とつなげると、会話の全文を残す `Transcript Memory` と、判断を残す `Judgment Memory` は別物です。会話の全文を持ち続けなくても、判断に必要な状態がArtifactとMemoryへ残っていれば、セッションそのものは使い捨てにしやすくなります。

## 6. 人には「全部」ではなく「判断が必要な面」を見せる

AI側のレビュー役割や検証を増やすと、人が読む情報も増えていきます。次に問題になるのは、人の注意をどこに向けてもらうかです。

River Reviewでは、これを次のような分離として設計しています。

```text
machine-side complexity
        ↓
review / validation
        ↓
human-facing projection
        ↓
human decision
```

前提として、人に見せる量を減らすために、Findingそのものを隠すことはしません。すべてを見られる状態は保ったまま、注意を向けてもらう面だけを絞ります。

人に見せる出力は、概念的には次の3層へ分けます。

```text
L1 Decision Surface
   今、人が判断するもの

L2 Resolution Summary
   finding / status / evidence / verification / coverage

L3 Full Review Artifact
   machine-readableな完全な状態
```

この3層を組み立てる部品（設計上の名前はOrganizer）は、新しい判定役にはしません。既にあるFinding、Coverage、検証の結果から、人が見るべき表示の区分を**決定論的に投影する**役割に留めます。重大度を評価し直したり、指摘の真偽を判定し直したり、GO / NO-GOを決めたりはしません。

```text
Canonical Review State
        ↓
Organizer
        ↓
Human Decision Surface
```

ただし、Organizerは設計段階で、まだ実装していません。今あるのは、既存の判断結果を変えずに表示だけを行う判断面（Decision Surface）です。

AIの出力が増えたからといって、その上に「さらに賢いAIの判定役」を必須の層として積めばよいとは考えていません。

## 7. Context LifecycleはRiver Reviewのコアへ入れない

現在のRiver Reviewは、1回のレビューで何を文脈へ入れるかを、Context Budget、ranking、Skillの段階的な読み込みで制御できるようになりました。しかし、1つの開発セッションをいつ終えるかは別の責務です。

長時間のエージェント実行では、実装・テスト・レビュー・修正が何周も続き、途中で区切りを記録し、文脈を圧縮するかセッションを切り替えて、Artifactから再開することになります。こうしたContext Lifecycleは必要だと考えていますが、River Reviewのコアへ次のようなセッション方針を入れるつもりはありません。

```yaml
soft_context_limit: 70%
rotate_after_review: true
```

例の70%は、冒頭のTOKIUMの記事が運用上の目安として挙げている値で、技術的な閾値ではありません。いつセッションを切るべきかという判断基準そのものも、この記事の範囲外です。

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

River Reviewのドキュメントでも、反復・停止・エスカレーションは呼び出し側の責務としています。ループそのものは所有せず、判断材料を返す。この境界を保ったまま、次のセッションが必要な判断を復元できるArtifactやMemoryを強くしていくほうが、設計として扱いやすいと考えています。

## River Reviewのコアを1枚にすると

現在の構造をかなり圧縮すると、次のようになります。人向けの出力は、現時点では表示専用のDecision Surfaceです（§6のOrganizerは設計段階なので、図には入れていません）。

また、記憶への登録は、抑制の追加や評価結果の保存のような明示的な操作で行います。

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

この外側に、セッションや再試行、停止を持つ呼び出し側（§7）があります。この分離が、今のRiver Reviewのコア設計です。

## AIレビューから、チームが所有する判断へ

River Reviewを作り始めた頃は、「AIレビューをもっと良くしたい」という問題から始まりました。今は、AIにレビューさせること自体より、チームの判断を責務ごとに分け、再現できる形で残すことのほうが中心にあると考えています。

モデルも、エージェントも、呼び出し側も変わります。その中でも、

- 何を重要と考えるか
- 何をEvidenceとするか
- どこまで確認できたか
- 何を記憶するか
- どこで人の判断へ返すか

は、チーム自身が所有できるようにしたい。

River Reviewのコアは、そのためのReview Judgment as Codeです。判断をArtifact・Evidence・Verification・Memory・Human Judgmentへ分けておくことで、モデルや呼び出し側が変わっても、同じ基準・同じEvidenceで判断を再現しやすくしています。

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
