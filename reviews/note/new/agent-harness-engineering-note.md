# articles_note/new/agent-harness-engineering-note.md の記事レビュー

> 対象: note向けオピニオン記事「最近、AIエージェント開発を『Model + Harness』で考えるようになった」
>
> 位置づけ: 公開済み記事「AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning」（n5070e13232ce）の続編。前記事のProduct Learning Loopを、Agent System自身のLearning Loopへ展開する記事としてレビューした。
>
> 検証日: 2026-08-29

## 🚩 レビュー方針

本記事はHarness Engineeringの紹介そのものではなく、筆者がこれまで個別に扱ってきたPlanGate / River Review / Skills / Memory / Eval / Retrospectiveを、Harnessという上位概念で捉え直したオピニオン記事である。

そのため、通常のnote 3ペルソナレビューに加え、次を重点確認した。

- AWS / Anthropic / OpenAIの一次情報と筆者独自の整理が混ざっていないか
- 「HarnessのほうがModelより重要」という過剰な二項対立になっていないか
- 前記事のTime to Learningとの接続が、単なる内部リンクではなく論理的な続編になっているか
- PlanGate / River Reviewの紹介が自作ツール宣伝に寄りすぎていないか
- noteのWXRインポートで崩れやすいMarkdown Tableを使っていないか

---

## チェック結果

| 観点 | 想定ペルソナ | 主な確認項目 | 判定 |
| --- | --- | --- | --- |
| noteディレクター | AI開発記事を読むエンジニア / Tech Lead / EM | タイトル、リード、前記事との接続、独自性 | ✅ |
| note編集者 | スマホで長文を読む一般読者 | 段落、見出し、重複、JTFスタイル、図表 | ✅ |
| 想定読者 | Coding Agentを実務利用するエンジニア | 実務へ落とせるか、抽象論だけで終わらないか | ✅ |
| 事実検証 | 技術記事としての信頼性 | AWS / Anthropic / OpenAIの主張、日付、数値 | ✅ |

### 共通チェック

- [x] 冒頭で前記事の問いと今回の問いが接続されている
- [x] 早い段階で「Agent = Model + Harness」が厳密な性能式ではないと限定している
- [x] 「Harness > Model」とは主張していない
- [x] AWS公式のHarness説明と筆者独自の8層分類を明確に分けている
- [x] Markdown Tableを本文に使っていない
- [x] 横幅の大きいASCII図を避け、スマホで縦に読める構成にしている
- [x] JTFスタイルで禁止されている長音ダッシュ記号を本文に使っていない
- [x] 固有ツール名の初出を遅らせ、読者にも起こるFailure / Evaluation / Securityの問題を先に説明している
- [x] 最後に「Harness Control Plane」という筆者独自の次の仮説まで進んでいる
- [x] Harness EngineeringをSoftware Engineeringの既存原則の再適用として明示し、記事全体の一般化ができている

---

## 一次情報の照合結果

| 検証項目 | 記事の扱い | 確認結果 | 判定 |
| --- | --- | --- | --- |
| Mike ChambersのAI Engineer World's Fair講演 | 2026-07-02、Harness Engineering講演 | AWSイベントページおよびWorld's Fairページで日付・講演名・登壇者を確認 | 一致 |
| AWS Developers Podcast Episode 220 | 2026-08-26、modelを除いた残りがHarness | Episodeページに同趣旨を明記。tools / skills / memory / context / observability / evaluations / agentic loopを列挙 | 一致 |
| Terminal-Bench 2.0のInfrastructure差 | 最多・最少リソース構成で成功率6 percentage points差 | Anthropic 2026-02-05記事で6 percentage points、p < 0.01を確認 | 一致 |
| Evalがない場合のreactive loop | Productionで失敗を直し別の失敗を作る | Anthropic 2026-01-09記事の導入と一致 | 一致 |
| Planner / Generator / Evaluator | Anthropicのlong-running app開発で3-Agent構成 | 2026-03-24記事で確認 | 一致 |
| structured artifactsによるsession間handoff | Context継続を外部Artifactで行う | 同記事で明記 | 一致 |
| Harness componentはModel能力へのAssumptionをencode | Harnessを定期的に簡素化すべき根拠 | Anthropic 2026-03-24記事で明記 | 一致 |
| Claude Code Red Team 24/25 | ~/.aws/credentialsを読み外部POST | Anthropic 2026-05-25記事で25回中24回のexfiltrationを確認 | 一致 |
| deterministic boundary | Model layerだけでなくEnvironment boundaryを優先 | Anthropic containment記事のSummaryと一致 | 一致 |
| Single Agent first | 必要になるまでMulti-Agent化しない | OpenAI practical guideで「maximize a single agent’s capabilities first」を確認 | 一致 |

### 参照した一次情報

- AWS Developers Podcast Episode 220
  - https://developers.podcast.go-aws.com/web/episodes/220/index.html
- AWS at AI Engineering 2026
  - https://aws.amazon.com/events/ai-engineer-world-fair-2026/
- AI Engineer World's Fair 2026
  - https://aie-wf.sentry.dev/talks/aiewf-365-harness-engineering-building-the-production-cage
- Anthropic「Demystifying evals for AI agents」
  - https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Anthropic「Quantifying infrastructure noise in agentic coding evals」
  - https://www.anthropic.com/engineering/infrastructure-noise
- Anthropic「Harness design for long-running application development」
  - https://www.anthropic.com/engineering/harness-design-long-running-apps
- Anthropic「How we contain Claude across products」
  - https://www.anthropic.com/engineering/how-we-contain-claude
- OpenAI「A practical guide to building agents」
  - https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/

---

## 指摘と採否

### F1: 「Harness > Model」と誤読される危険

**重要度: high / 対応済み**

#### 問題

元の構想には「モデルではなくHarness」「巨大モデルよりHarness改善の余地が大きい」という強い表現があり、そのまま記事化すると、Model Capabilityの重要性を過小評価しているように読める。

Terminal-Benchの実験が示しているのも「HarnessがModelより重要」ではなく、「Agentic EvalではInfrastructureも結果を大きく動かすため、System条件を揃えずModel差だけを解釈できない」ということ。

#### 対応

本文冒頭で次を明記した。

> もちろん、これは厳密な性能式ではありません。

さらに、

> Model性能だけを独立した変数として扱うのでは足りなくなった

> Agentic SystemではModel Benchmarkに加えてend-to-end system testが必要になった

と限定した。

**判定: 解消。**

---

### F2: AWSのHarness定義と筆者の8層モデルが混ざる危険

**重要度: high / 対応済み**

#### 問題

ContractからEvaluationまでの8層は記事の独自性が高い一方、直前にAWSのHarness定義を紹介しているため、そのままだとAWS公式分類のように読まれる可能性がある。

#### 対応

8層の前に、

> これはAWSやAnthropicの公式分類ではありません。自分が実装と改善箇所を考えやすくするための整理です。

と明示した。

**判定: 解消。**

---

### F3: 前記事との関連が「リンクを貼っただけ」になる危険

**重要度: medium / 対応済み**

#### 問題

今回の記事は単独でも成立するが、前記事のTime to Learningとの論理的な連続性が本記事の独自価値。AWSのHarness解説から始めると、その価値が消えて一般的な技術解説になる。

#### 対応

冒頭を前記事のProduct Learning Loopから始め、本文中盤で、

```text
Product側: Build → Evidence → Product Decision
Agent側: Agent Run → Trace / Eval → Harness Decision
```

という対応を置いた。

終盤でも、

> ProductのLearning Loopの内側に、HarnessのLearning Loopがある

と再統合している。

**判定: 続編として成立。**

---

### F4: 「Agent自身がMemoryを持つ必要はない」の断定

**重要度: medium / 対応済み**

#### 問題

元案の「Agent ≠ Memory owner」は考え方として面白いが、AgentCoreなど特定Architectureの設計判断を一般原則として断定したように読める。

#### 対応

記事ではArchitecture ownershipの断定をやめ、Anthropicで実証されている、

> structured artifactsを使ってsession間でContextをhandoffする

という具体的なPatternへ寄せた。

結論も、

> Modelがすべてを覚え続けることではなく、次のSessionが必要な状態を正しく復元できること

とした。

**判定: 技術的に安全な表現へ改善済み。**

---

### F5: Multi-Agent万能論への誤読

**重要度: medium / 対応済み**

#### 問題

Generator / Evaluator分離を強く推すと、すべてのTaskをMulti-Agent化すべきという読み方ができる。

#### 対応

OpenAIのSingle Agent firstを先に置き、Multi-Agentの価値をContext / Responsibility / Tool / Verificationの境界分離として説明した。

また、AnthropicのHarness簡素化実験も後段で紹介し、Evaluator自体がTaskやModelによっては不要なOverheadになり得るという方向へ接続した。

**判定: 解消。**

---

### F6: note本文でMarkdown Tableを使うとインポート時に崩れる

**重要度: high / 対応済み**

#### 問題

元構想にはFailure taxonomyや既存仕組みとの対応表が複数あった。過去のnote運用ではMarkdown TableがWXRインポート時に平坦化され、公開前修正になった実績がある。

#### 対応

本文からMarkdown Tableを全廃し、箇条書きと縦方向のtext diagramだけにした。

**判定: 解消。**

---

### F7: 8層のContract位置表現が番号と食い違う

**重要度: medium / 対応済み**

「一番下に置いたContract」という表現は、番号上は1番目であるため誤読を招く。

本文を「土台に置いたContract」へ修正した。

**判定: 解消。**

---

### F8: 8層モデルと既存仕組みの写像で用語が揺れる

**重要度: high / 対応済み**

本文の8層に存在しないVerification / Evolutionを対応先として使っていたため、独自分類の整合性が崩れていた。

対応先を次の層名に統一した。

- Context & Tools
- Orchestration
- Trust & Security
- Evaluation
- State & Memory
- Observability

Retrospective / Weekly Improvementは特定の1層へ押し込まず、ObservabilityとEvaluationのEvidenceをHarness Changeへ戻す改善ループとして整理した。

**判定: 解消。**

---

### F9: Learning Loopの図が中盤で重複する

**重要度: medium / 対応済み**

冒頭のProduct Loop、中盤のProduct / Agentの小図、終盤の統合図で同じ関係を繰り返していた。

中盤の2つの小図を文章へ圧縮し、

- 冒頭: Product Learning Loop
- 中盤: Production FailureからHarness Changeへの改善ループ
- 終盤: Product / Harnessの統合図

という役割分担にした。

**判定: 解消。**

---

### F10: 固有ツール名の初出が読者課題より早い

**重要度: low / 対応済み**

Harnessに気づいた経緯の段階ではPlanGate / River Reviewという固有名詞を一般語へ置き換え、後半の8層への写像で初めて固有名詞を出す構成へ変更した。

**判定: 解消。**

---

## 良い点

### 1. AWSの紹介記事で終わらず、自分の思考の変化が主役になっている

「Harness Engineeringという概念を知った」ではなく、「個別に作っていた仕組みがHarnessという概念で一つにつながった」という体験を中心にしている。noteの媒体役割である一次体験・思想に合っている。

### 2. 前記事からの発展が明確

前記事は「何を速くするか」をTime to Learningで整理し、今回は「そのLearning Loopを支えるAgent Systemをどう改善するか」へ進む。シリーズとして新しい問いを追加できており、内容の重複が少ない。

### 3. Evidenceが2記事をつなぐ共通概念になっている

ProductではBuildをEvidenceへ変え、Agent SystemではRunをTrace / Evalへ変える。この対応は、今回の記事で最も独自性がある部分。

### 4. Harnessを増やすだけでなく、削る話まで入っている

Harness Engineeringを新しい複雑性の正当化にせず、AblationとSimplifyまで入れている。シニアエンジニア読者への反論耐性が高い。

### 5. Software Engineeringとの連続性が記事の芯として明確になった

責務分離、Contract、Observability、Regression Test、Least Privilege、State ManagementをAgent Engineeringへ適用し直す、という整理を追加したことで、Harness EngineeringがAI固有の流行語ではなくSoftware Engineeringの延長として読めるようになった。

特に、

> AIによってSoftware Engineeringが不要になるのではなく、むしろCoding以外のSoftware Engineering原則が前面に出てきている。

という主張は、前記事の「Codingが速くなるほどShapingの価値が上がる」と対になっており、シリーズ全体の一貫性を強めている。

### 6. Harness Control Planeが次の記事への仮説になる

既存知識のまとめで終わらず、versioning / trace / failure taxonomy / eval / ablationを統合する次の設計テーマを提示している。筆者の現在地が伝わる。

---

## 公開前の任意改善

公開ブロッカーではない。

1. **図版を1枚入れるなら、2つのLearning Loopを選ぶ**
   - Product Learning LoopとHarness Improvement Loopの関係が記事の独自主張なので、ヒーロー画像以外に図を1枚だけ入れるならここが最も効果的。
   - 本文内のLearning Loop図は役割ごとに整理済みで、追加の図を増やす必要はない。
2. **note公開時は目次をONにする**
   - H2が多い長文記事なので、スマホで途中から戻りやすくする。
3. **タグ候補**
   - #AI
   - #生成AI
   - #AIエージェント
   - #AI駆動開発
   - #開発生産性

---

## 総合判定

**公開可能。must / highの未解決指摘なし。**

特に重要な補正は次の4点。

1. HarnessとModelを対立させず、end-to-end systemとして扱う
2. AWS / Anthropicの一次情報と筆者独自の8層モデルを明確に分ける
3. 前記事のTime to Learningを、Agent System自身のLearning Loopへ発展させる
4. Harness EngineeringをSoftware Engineeringの既存原則の再適用として一般化する

この4点によって、一般的な「Harness Engineeringとは何か」という解説記事ではなく、**筆者が最近考えていることを既存の実践と一次情報で整理したnote記事**として成立している。

PRマージ後は `articles_note/new/agent-harness-engineering-note.md` をcanonicalとしてWXR生成し、noteへ新規下書きとしてインポートする運用が適切。
