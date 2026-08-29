# 失敗をモデルのせいにしない。AI駆動開発を「Model + Harness」で考える

> 区分: 個人

先日、「[AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning](https://note.com/mine_unilabo/n/n5070e13232ce)」という記事を書きました。

そこで考えていたのは、AIによってBuildが高速化するほど、開発のボトルネックはコードを書くことから、その前後にあるShaping（何を作るかを絞ること）、Verification（正しさを確かめること）、Learning（得られた根拠から次の判断へ進むこと）へ移っていくのではないか、ということでした。

前の記事では、開発を次のようなループとして捉えました。

```text
Problem
  ↓
Hypothesis
  ↓
Shape
  ↓
Build / Experiment
  ↓
Evidence
  ↓
Decision
```

最近は、この続きを考えています。

Buildだけでなく、調査、計画、実装、レビュー、検証までCoding Agentへ任せられる範囲が広がったとき、そのAgentをどうすれば安定して動かせるのか。

失敗したとき、何を改善すればよいのか。

より良いModelへ交換すれば、それで解決するのか。

今の自分の答えは少し違います。

**Modelだけを見るのではなく、Agentを動かしているSystem全体を見る必要がある。**

そのSystemを考えるうえで、最近かなりしっくりきている言葉があります。

**Harness Engineering**です。

先に結論を書くと、今はAI駆動開発を次のように考えています。

```text
Agent = Model + Harness
```

もちろん、これは厳密な性能式ではありません。

言いたいのは、Agentの性能や失敗をModel単体で説明するのではなく、Context（与える文脈）、Tools（使える道具）、Memory（状態の保持）、Runtime（実行環境）、Security（権限制御）、Observability（何が起きたかを観測できること）、Evaluation（結果を評価すること）まで、実行の最初から最後まで含むSystemとして扱う、ということです。

そして、前の記事で考えたProductのLearning Loop（学習ループ）と同じように、**Agent System自身にも、失敗を次の改善へ戻すLearning Loopが必要なのではないか**と考えるようになりました。

---

## 失敗の見方を変える

### Harnessという名前が付いた

きっかけになったのは、AWSのMike ChambersによるAI Engineer World's Fair 2026の講演と、その後のAWS Developers Podcastでした。

7月2日の講演「Harness Engineering: Building the Production Cage for Powerful Domain Agents」では、実行単位の分離、Context管理、Memory、隔離された環境での実行、Observabilityなどを、Agentを本番で安定して動かすためのHarnessの問題として扱っています。

8月26日のAWS Developers Podcastでは、さらに分かりやすい説明がされています。

**ModelをAgentから取り除いたとき、残るものがHarness。**

Podcastでは、その中にTools、Skills（再利用する手順や知識）、Memory、Context、Observability、Evaluation、Agentic Loop（Agentが判断と実行を繰り返す流れ）などが含まれると整理されています。

ここでいうHarnessは、Agentの推論そのものではなく、**何を渡し、何を使わせ、どんな状態を残し、どう実行・観測・評価するかを担う外側の仕組み**だと捉えると分かりやすいです。

この説明を聞いたとき、自分が最近個別に作っていたものが一つにつながりました。

- Planを先に作り、何をもって完了とするかを決める
- 実装前に承認の境界を置く
- SkillsやRepository Knowledge（Repository固有の知識）をContextとして渡す
- 実装するAgentとレビューする役割を分ける
- 実行結果をArtifact（実行結果を外に残す成果物）として残す
- 失敗を振り返り、次のルールやEvalへ戻す

これまでは、計画と承認、独立したレビュー、再利用する手順や知識、状態の保持、評価、振り返りを、それぞれ別の仕組みとして考えていました。

でもHarnessという見方をすると、かなり自然に一つのSystemとして整理できます。

**自分が作っていたのは、個別のAI機能というより、Agentが仕事をするための環境だった。**

この認識が、最近の自分にとってかなり大きな変化でした。

### 失敗を「モデルのせい」で終わらせない

Coding Agentを使っていると、失敗したときにModelの名前で話してしまいがちです。

「Claudeが途中で止まった」

「GPTがToolをうまく使わなかった」

もちろん、推論能力そのものが原因のこともあります。

ただ、長時間動くAgentでは、失敗の原因はもっと広い場所にあります。

例えば、途中で仕事を終えたなら、最初に確認したいのはModelだけではありません。

- 完了条件（Completion Criteria）は明確だったか
- 停止条件（Stop Condition）は適切だったか
- 現在地を確認できるArtifactがあったか
- Contextが長くなりすぎていなかったか
- Checkpoint（途中から再開するための再開点）やResumeの仕組みがあったか

Toolを間違えたなら、Toolの入力形式や説明、どのToolを選ぶかというRouting、Contextを疑う。

検証を飛ばしたなら、作業手順（Workflow）や承認・停止の境界（Gate）を疑う。

同じ処理を繰り返すなら、繰り返し処理の設計やStop Conditionを疑う。

危険な操作をしそうになったなら、権限（Permission）や隔離された実行環境（Sandbox）を疑う。

何が起きたのか分からないなら、実行を観測できる仕組みを疑う。

修正したあと本当に良くなったのか分からないなら、同じ基準で結果を比べる評価（Eval）を疑う。

こうやって失敗（Failure）を分解すると、

```text
Modelがダメだった
```

という会話から、

```text
HarnessのどこでFailureが起きたのか
```

というEngineeringの会話へ変わります。

Modelの比較が不要になるわけではありません。

**Model性能だけを独立した変数として扱うのでは足りなくなった**、という理解のほうが近いです。

### ModelではなくSystemをテストする

この感覚を強くしたのが、Anthropicが2026年2月に公開したAgentic Coding Evalの実験です。ここでいうAgentic Evalは、Modelへの一問一答ではなく、**AgentがToolや実行環境を使いながら一連の仕事を完了できるかを見る評価**です。

Terminal-Bench 2.0で、同じAgentic Coding EvalでもCPUやRAMなどの実行環境の構成によって、最もリソースの多い構成と少ない構成の間で成功率が6ポイント変わったと報告しています。

Agentic Codingでは、Modelはコードを書くだけではありません。

ファイルを読み、プログラムを実行し、テストし、依存関係を入れ、失敗を見てまた試します。

つまりRuntime（Agentが実際にコマンドやプログラムを動かす実行環境）は、単なる箱ではなく、問題を解くSystemの一部になります。

例えば、ベンチマーク上で、

```text
Model A = 74%
Model B = 77%
```

だったとしても、その3ポイントだけを見てAgent System全体の優劣を決めるのは危険です。

Runtime条件だけで、それ以上動く可能性があるからです。

この話を、自分は「Model Benchmarkが意味を失った」とは捉えていません。

むしろ、**Agentic SystemではModel単体のBenchmarkに加えて、Agentの実行全体を見るSystem Testが必要になった**と考えています。

---

## 改善ループの入口は、観測と評価

Harness Engineeringを考えると、結局ここが本丸だと思っています。

**ObservabilityとEvaluationです。**

失敗したときに何が起きたのかを説明するのがObservabilityで、変更したあと本当に良くなったかを判断するのがEvaluationです。

失敗したときに何が起きたのか分からなければ、改善できません。

また、修正した結果が本当に良くなったのか測れなければ、その変更を残すべきか判断できません。

AnthropicもAgent Evalについて、評価がないと本番で問題を見つけてその場で修正し、その変更が別の失敗を生む場当たり的なループに入りやすいと説明しています。

自分が作りたいのは、その逆です。

```text
本番実行（Production）
  ↓
実行記録（Trace）
  ↓
失敗の分類
  ↓
再現できる評価ケース（Eval Case）
  ↓
Harnessの変更
  ↓
回帰評価（Regression Eval）
  ↓
反映（Deploy）
```

本番で一度起きた失敗を、単なる障害や「AIだから仕方ない」で終わらせない。

失敗を分類し、再現できる評価ケースへ変える。

そのうえでHarnessを変更し、同じ失敗が再発しないか回帰評価を通す。

ここで、前回の記事で書いたTime to Learningとつながります。

Product側では、Build（実装・実験）をEvidence（次の判断に使える根拠）へ変え、Product Decisionにつなげる。

Agent System側では、Agent Run（1回の実行）をTrace / Evalへ変え、Harnessをどう直すかというDecisionにつなげる。

両方に共通しているのは、**変更をEvidenceへ変換し、次の意思決定へつなげること**です。

前回はProductのLearning Loopを考えました。

今回は、そのLoopを支えるAgent System自身のLearning Loopを考えている、と整理すると、自分の中ではかなりしっくりきます。

---

## Harnessで見ると、境界・状態・「できないこと」が変わる

### 境界を作る: Multi-Agent

Harnessを考えると、複数のAgentで仕事を分担するMulti-Agentの見方も少し変わりました。

以前はAgentを増やせば、単純に知能が増えるようなイメージを持っていました。

でも実際に重要なのは、

- Contextを分ける
- 責務（Responsibility）を分ける
- 使えるToolを分ける
- 扱うDomainを分ける
- 実装とは独立した検証を作る
- 並列化できる仕事だけを分ける

ことだと感じています。

OpenAIのAgent設計ガイドでも、まず一つのAgentでできることを最大化し、指示が複雑になりすぎたり、使うToolの選択が難しくなったりしたときにMulti-Agentへ分割することが推奨されています。

つまり、

```text
Multi-Agent = Better
```

ではありません。

**分けるべき境界があるからAgentを分ける。**

自分が特に有効だと思っているのが、作る役割（Maker）と判定する役割（Checker）の分離です。

```text
Maker
  ↓
Checker
```

同じAgentに、実装して、レビューして、修正して、最後に自分で正しいと承認させるより、作る役割と判定する役割を分ける。

Anthropicも2026年3月の長時間にわたるApplication開発の実験で、計画するPlanner、実装するGenerator、評価するEvaluatorの3-Agent構成を使っています。

特に興味深いのは、Generator自身を批判的にするより、Evaluatorを独立して厳しく調整するほうが扱いやすかったという点です。

これは、実装と判定を分ける方向ともかなり近いです。

Agentを増やすことが目的ではなく、**判断を独立させるために役割を分ける**。

この考え方は、今後さらに重要になると思っています。

### 状態を外に残す: Memory

Memory（状態を次の実行へ引き継ぐ仕組み）についても同じです。

長時間タスクの継続性を、すべてContext Window（Modelが一度に参照できる情報の範囲）の中に押し込む必要はありません。

Anthropicの長時間実行向けHarnessでは、構造化したArtifactを使ってSession間で必要なContextを引き継いでいます。

例えば、

```text
Session 1
  ↓
Artifact / Checkpoint
  ↓
Session 2
  ↓
Artifact / Checkpoint
  ↓
Session 3
```

という形です。

ここで重要なのは、Modelがすべてを覚え続けることではありません。

**次のSessionが、必要な状態を正しく復元できること。**

これは普通のSoftware Engineeringで、実行中だけの一時的な記憶より、外に永続化した状態を信頼するのとかなり似ています。

AgentのMemoryも、「頭の中に覚えているもの」より、ArtifactやCheckpointとして外に残された状態として考えるほうが設計しやすいと感じています。

### 「できないこと」を作る: Security

Production Harnessを考えるとき、Securityも外せません。

Agentに、

```text
秘密情報を外部へ送らないでください
危険な操作をしないでください
```

とInstructionを書くことはできます。

ただし、それはSecurity Boundary（技術的に越えられない安全上の境界）ではありません。

Anthropicが2026年5月に公開した内部Red Teamの例では、悪意あるPromptに`~/.aws/credentials`を読み、内容を変換して外部へ送信する指示を混ぜたところ、25回中24回で情報送信まで完了しました。

Anthropicがそこで強調しているのは、Model側の制御だけでは防げないケースがあることです。

必要になるのは、

- 読み書きできる範囲を制限するFilesystem Boundary
- 外部通信先を制限するNetwork Egress Control
- 隔離された実行環境であるSandbox
- 実行できる操作を絞るPermission
- 用途と権限を限定したCredential

のようなEnvironment側の制約です。

Anthropicはこれを、Modelの判断に依存する確率的な防御をすり抜けたあとにも効く、決定的な境界として説明しています。

AIに「やってはいけない」とお願いするのではなく、**そもそもできない境界を作る。**

これも完全にHarness Engineeringの問題だと考えています。

---

## Harness Engineeringは、Software Engineeringの原則に戻っていく

ここまで考えていて、もう一つ強く感じていることがあります。

Harness Engineeringは、まったく新しいAI固有のEngineeringというより、**Software Engineeringで積み上げてきた原則を、Agentという新しい実行主体に適用し直す話に近い**のではないか、ということです。

例えば、ここまで出てきた考え方を並べると、かなり見慣れたものになります。

- **責務分離**: 作る役割と判定する役割、計画する役割と実行する役割を分ける
- **Contract（実行契約）**: 目的、完了条件、制約、停止条件を明確にする
- **Observability**: 実行記録やTool呼び出し、失敗Logから何が起きたかを説明できるようにする
- **Regression Test（回帰テスト）**: 一度起きた失敗を評価ケースへ変え、Harness変更後に再発しないか確認する
- **Least Privilege（最小権限）**: Agentに必要以上の操作権限やNetwork Accessを与えない
- **State Management（状態管理）**: Context Windowだけに依存せず、ArtifactやCheckpointとして状態を外へ出す

こうして見ると、AI Agentだから突然まったく別のEngineeringが必要になったわけではありません。

実行主体が人間や通常のProgramからAgentへ広がったことで、**これまでSoftware Engineeringで使ってきた原則を、どこに適用するかが変わった**と考えるほうが自分にはしっくりきます。

例えば、以前ならRegression TestはApplication Codeの変更に対して書いていました。

Agent Systemでは、Prompt、Skill、Toolの入力形式や振り分け、権限、Harnessそのものの変更に対しても回帰テストを考える必要があります。

以前ならLeast Privilegeは、UserやService Accountといった実行主体に対して設計していました。

Agent Systemでは、AgentがどのFileを読めるか、どのCommandを実行できるか、どのNetworkへ接続できるかまで含めて設計する必要があります。

以前ならState ManagementはApplicationの状態をどう永続化するかという問題でした。

Agent Systemでは、長時間Taskの途中経過や判断理由を、次のSessionがどう復元するかという問題にもなります。

こう考えると、自分がHarness Engineeringに惹かれている理由も少し分かります。

**AIによってSoftware Engineeringが不要になるのではなく、むしろCoding以外のSoftware Engineering原則が前面に出てきている。**

前の記事では、Codingが速くなるほどShapingの価値が上がると考えました。

今回考えているのは、そのSystem版です。

```text
Codingが安くなる
  ↓
Shapingの価値が上がる

Agentが強くなる
  ↓
Harness / System Designの価値が上がる
```

この2つは、同じ方向を向いているように感じています。

そして、これらを最初から全部揃える必要はありません。

自分自身も、失敗した場所、再発した場所、説明できなかった場所から一つずつHarnessへ追加しています。

重要なのはHarnessを豪華にすることではなく、**Systemとして説明でき、失敗から改善できる状態にすること**だと思っています。

### 足すだけでなく、削る

ここは自分自身への注意でもあります。

Harnessが重要だと分かると、つい機能を増やしたくなります。

Planner（計画役）、Router（仕事の振り分け）、Task Queue（待ち行列）、Memory、Subagent（下位Agent）、Reviewer（レビュー役）、Checkpoint、Workflow。

でも、複雑なHarnessが常に良いわけではありません。

Anthropicは2026年3月の記事で、Harnessの各構成要素は「Modelが単独ではできないこと」に関する前提をCodeとして固定している、と説明しています。

そしてModelが進化すると、そのAssumptionは古くなります。

以前は複雑なPlannerが必要だった仕事を、次のModelは単体で処理できるかもしれません。

以前は毎回必要だった評価用のAgentも、簡単なTaskでは単なるCostになるかもしれません。

実際にAnthropicの実験でも、Harnessの構成要素を一つずつ外しながら、どの要素が本当に結果へ効いているのかを確認しています。

なので、Harnessには追加のループだけでなく、削るループも必要です。

```text
Add
  ↓
Measure
  ↓
Validate
  ↓
Simplify
```

自分も今後は、PlanGate ON / OFF、River Review ON / OFF、Skill ON / OFF、Memory ON / OFFのようなAblation（構成要素を一つずつ外して影響を確かめる切り分け実験）をもっとやりたいと思っています。

**この仕組みは、本当に今のModelにも必要なのか。**

Harnessを作る側が、定期的に問い直すべき質問だと思います。

---

## 自分の整理と、次に考えたいもの

### Harnessを8つの層で見る

こうしたことを整理していく中で、今のところ自分はHarnessを8つの層に分けて考えています。

これはAWSやAnthropicの公式分類ではありません。自分が実装と改善箇所を考えやすくするための整理です。

1. **Contract**: 目的、完了条件、制約、停止条件
2. **Context & Tools**: 指示、Skills、MCP、検索、Repository固有の知識
3. **State & Memory**: 成果物、再開点、永続化した状態
4. **Orchestration**: 実行の組み立て。Agent Loop、Subagent、仕事の振り分け
5. **Runtime & Recovery**: 実行環境と復旧。隔離実行、再試行、再開、時間切れ
6. **Trust & Security**: 信頼と安全性。権限、実行主体の識別、承認、Filesystem / Networkの境界
7. **Observability**: 観測可能性。実行記録、コスト、遅延、Tool呼び出し、失敗Log
8. **Evaluation**: 評価。回帰評価、判定役、評価値、Ablation

中でも最近重要だと思っているのが、土台に置いたContractです。

Agentに「何をするか」だけを渡すのではなく、

- 何をもって完了とするか
- 何をしてはいけないか
- いつ停止するか
- 何を検証するか
- いつHumanへ返すか

まで決める。

自律的に動く時間が長くなるほど、入口のPromptより、こうしたExecution Contractのほうが効いてくる場面が増えると感じています。

そして、この8層でこれまでの取り組みを見ると、かなり整理しやすくなります。

PlanやPBI、DoDはContract。

SkillsやRulesはContext & Tools。

PlanGateやAgent LoopはOrchestrationとTrust & Security。

River ReviewはEvaluation。

ArtifactsやCheckpointはState & Memory。

Execution LogはObservability。

RetrospectiveやWeekly Improvementは、ObservabilityとEvaluationから得たEvidenceを次のHarness Changeへ戻す改善ループ。

以前は別々の機能として見ていました。

今は、**失敗から学びながら改善し続けるAgent Harnessの構成要素として見るほうが近い**と感じています。

### 次に作りたいのはHarness Control Plane

この考え方まで来ると、新しいAgentを増やすより先に、今あるAgent Systemがなぜ成功し、なぜ失敗したのかを説明できるようにしたくなります。

そのために、Model、Prompt、Skill、Harness、EvaluationのVersion、使ったTool、Cost、結果、失敗の種類を、1回の実行ごとに追えるようにする。

この仕組みを、今は仮に**Harness Control Plane**と呼んでいます。Harnessの変更履歴と実行結果をまとめて追い、改善判断を支える管理の仕組み、という意味です。

これは次に実装してみたいテーマです。

### 2つのLearning Loopを重ねて考える

前の記事では、AI時代に短くすべきものをTime to CodeではなくTime to Learningとして考えました。

今回のHarness Engineeringは、その続きにあります。

自分の中では、今こう整理しています。

```text
Product Learning Loop（Product側の学習）

Problem（課題）
  ↓
Shape（作るものを絞る）
  ↓
Build（実装・実験）
  ↓
Evidence（判断に使える根拠）
  ↓
Decision（次の判断）

そのBuild / Verifyを支える

Harness Improvement Loop（Harness側の改善）

Agent Run（1回の実行）
  ↓
Trace（実行記録）
  ↓
Failure / Eval（失敗の分類・評価）
  ↓
Harness Change（Harnessの変更）
  ↓
Regression（回帰評価）
```

Productについても、Agent Systemについても、重要なのは変更そのものではありません。

**変更をEvidenceへ変換して、次の意思決定につなげること。**

良いModelを探すことは、これからも重要です。

でも、Agentの能力が上がるほど、その能力をどんなContextで使い、どんなToolを渡し、どこまで許可し、どう観測し、どう評価し、失敗からどう学ぶかの重要性も上がっていくはずです。

だから今は、より良いModelを探すだけではなく、**失敗を観測し、原因を分類し、Harnessを改善し、評価して、不要になった仕組みは削る**というEngineeringに興味があります。

新しいAgentを増やすより先に、今あるAgent Systemを説明できるようにする。

そして、この先でもう一つ考えたいことがあります。

HarnessがAgentをどう動かすかを支えるものだとしたら、次に考えたいのは、**そのAgentに「何が正しいか」をどう渡すのか**です。

仕様で意図と完了条件を定め、Testで期待する振る舞いを実行可能な形にし、Domainの言葉や責務の境界を整理する。

AIがコードを書くほど、こうしたCoding以外のEngineeringがむしろ重要になる。このテーマは次の記事で掘り下げたいと思っています。

---

## 参考

- AWS Developers Podcast「Harness engineering: are you controlling your AI agents?」
  - https://developers.podcast.go-aws.com/web/episodes/220/index.html
- AI Engineer World's Fair 2026「Harness Engineering: Building the Production Cage for Powerful Domain Agents」
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
- 前回の記事「AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning」
  - https://note.com/mine_unilabo/n/n5070e13232ce
