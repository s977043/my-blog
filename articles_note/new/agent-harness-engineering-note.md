# 最近、AIエージェント開発を「Model + Harness」で考えるようになった

> 区分: 個人

先日、「[AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning](https://note.com/mine_unilabo/n/n5070e13232ce)」という記事を書きました。

そこで考えていたのは、AIによってBuildが高速化するほど、開発のボトルネックはコードを書くことから、その前後にあるShaping、Verification、Learningへ移っていくのではないか、ということでした。

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

先に結論を書くと、今はAIエージェント開発を次のように考えています。

```text
Agent = Model + Harness
```

もちろん、これは厳密な性能式ではありません。

言いたいのは、Agentの性能や失敗をModel単体で説明するのではなく、Context、Tools、Memory、Runtime、Security、Observability、Evaluationまで含めたend-to-end systemとして扱う、ということです。

そして、前の記事で考えたProductのLearning Loopと同じように、**Agent System自身にもLearning Loopが必要なのではないか**と考えるようになりました。

---

## 自分が個別に作っていたものに、Harnessという名前が付いた

きっかけになったのは、AWSのMike ChambersによるAI Engineer World's Fair 2026の講演と、その後のAWS Developers Podcastでした。

7月2日の講演「Harness Engineering: Building the Production Cage for Powerful Domain Agents」では、session isolation、context management、memory、sandboxed execution、observabilityなどを、Agentを本番で安定して動かすためのHarnessの問題として扱っています。

8月26日のAWS Developers Podcastでは、さらに分かりやすい説明がされています。

**ModelをAgentから取り除いたとき、残るものがHarness。**

Podcastでは、その中にtools、skills、memory、context、observability、evaluations、agentic loopなどが含まれると整理されています。

この説明を聞いたとき、自分が最近個別に作っていたものが一つにつながりました。

- Planを先に作り、何をもって完了とするかを決める
- 実装前に承認の境界を置く
- SkillsやRepository KnowledgeをContextとして渡す
- 実装するAgentとレビューする役割を分ける
- 実行結果をArtifactとして残す
- 失敗を振り返り、次のルールやEvalへ戻す

これまでは、計画と承認、独立したレビュー、Skills、Memory、Eval、Retrospectiveを、それぞれ別の仕組みとして考えていました。

でもHarnessという見方をすると、かなり自然に一つのSystemとして整理できます。

**自分が作っていたのは、個別のAI機能というより、Agentが仕事をするための環境だった。**

この認識が、最近の自分にとってかなり大きな変化でした。

---

## Agentの失敗を「モデルのせい」で終わらせない

Coding Agentを使っていると、失敗したときにModelの名前で話してしまいがちです。

「Claudeが途中で止まった」

「GPTがToolをうまく使わなかった」

もちろん、推論能力そのものが原因のこともあります。

ただ、長時間動くAgentでは、失敗の原因はもっと広い場所にあります。

例えば、途中で仕事を終えたなら、最初に確認したいのはModelだけではありません。

- Completion Criteriaは明確だったか
- Stop Conditionは適切だったか
- 現在地を確認できるArtifactがあったか
- Contextが長くなりすぎていなかったか
- CheckpointやResumeの仕組みがあったか

Toolを間違えたなら、Tool schemaやdescription、routing、Contextを疑う。

Validationを飛ばしたなら、WorkflowやGateを疑う。

同じ処理を繰り返すなら、LoopやStop Conditionを疑う。

危険な操作をしそうになったなら、PermissionやSandboxを疑う。

何が起きたのか分からないなら、Observabilityを疑う。

修正したあと本当に良くなったのか分からないなら、Evalを疑う。

こうやってFailureを分解すると、

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

---

## Agentic Evalは、ModelのテストではなくSystemのテストに近い

この感覚を強くしたのが、Anthropicが2026年2月に公開したAgentic Coding Evalの実験です。

Terminal-Bench 2.0で、同じAgentic Coding EvalでもCPUやRAMなどのInfrastructure Configurationによって、最もリソースの多い構成と少ない構成の間で成功率が6 percentage points変わったと報告しています。

Agentic Codingでは、Modelはコードを書くだけではありません。

ファイルを読み、プログラムを実行し、テストし、依存関係を入れ、失敗を見てまた試します。

つまりRuntimeは単なる箱ではなく、問題を解くSystemの一部になります。

例えば、ベンチマーク上で、

```text
Model A = 74%
Model B = 77%
```

だったとしても、その3ポイントだけを見てAgent System全体の優劣を決めるのは危険です。

Runtime条件だけで、それ以上動く可能性があるからです。

この話を、自分は「Model Benchmarkが意味を失った」とは捉えていません。

むしろ、**Agentic SystemではModel Benchmarkに加えてend-to-end system testが必要になった**と考えています。

---

## ObservabilityとEvalが、Harnessを改善する入口になる

Harness Engineeringを考えると、結局ここが本丸だと思っています。

**ObservabilityとEvaluationです。**

失敗したときに何が起きたのか分からなければ、改善できません。

また、修正した結果が本当に良くなったのか測れなければ、その変更を残すべきか判断できません。

AnthropicもAgent Evalについて、EvalがないとProductionで問題を見つけて修正し、その修正が別のFailureを生むreactive loopに入りやすいと説明しています。

自分が作りたいのは、その逆です。

```text
Production
  ↓
Trace
  ↓
Failure Classification
  ↓
Eval Case
  ↓
Harness Change
  ↓
Regression Eval
  ↓
Deploy
```

Productionで一度起きた失敗を、単なる障害や「AIだから仕方ない」で終わらせない。

Failureを分類し、再現できるEval Caseへ変える。

そのうえでHarnessを変更し、Regression Evalを通す。

ここで、前回の記事で書いたTime to Learningとつながります。

Product側では、BuildをEvidenceへ変え、Product Decisionにつなげる。

Agent System側では、Agent RunをTrace / Evalへ変え、Harness Decisionにつなげる。

両方に共通しているのは、**変更をEvidenceへ変換し、次の意思決定へつなげること**です。

前回はProductのLearning Loopを考えました。

今回は、そのLoopを支えるAgent System自身のLearning Loopを考えている、と整理すると、自分の中ではかなりしっくりきます。

---

## Multi-Agentは、Agentを増やすことより境界を作るために使いたい

Harnessを考えると、Multi-Agentの見方も少し変わりました。

以前はAgentを増やせば、単純に知能が増えるようなイメージを持っていました。

でも実際に重要なのは、

- Contextを分ける
- Responsibilityを分ける
- Toolを分ける
- Domainを分ける
- Independent Verificationを作る
- 並列化できる仕事だけを分ける

ことだと感じています。

OpenAIのAgent設計ガイドでも、まずSingle Agentの能力を最大化し、複雑なInstructionsやTool Selectionが問題になったときにMulti-Agentへ分割することが推奨されています。

つまり、

```text
Multi-Agent = Better
```

ではありません。

**分けるべき境界があるからAgentを分ける。**

自分が特に有効だと思っているのが、MakerとCheckerの分離です。

```text
Maker
  ↓
Checker
```

同じAgentに、実装して、レビューして、修正して、最後に自分で正しいと承認させるより、作る役割と判定する役割を分ける。

Anthropicも2026年3月のlong-running application developmentの実験で、Planner、Generator、Evaluatorの3-Agent構成を使っています。

特に興味深いのは、Generator自身を批判的にするより、Evaluatorを独立して厳しく調整するほうが扱いやすかったという点です。

これは、自分がRiver Reviewで考えてきた方向ともかなり近いです。

Agentを増やすことが目的ではなく、**判断を独立させるために役割を分ける**。

この考え方は、今後さらに重要になると思っています。

---

## Memoryは「モデルが覚えること」ではなく、状態を復元できることと考える

Memoryについても同じです。

長時間タスクの継続性を、すべてContext Windowの中に押し込む必要はありません。

Anthropicのlong-running harnessでは、structured artifactsを使ってsession間でContextをhandoffしています。

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

これは普通のSoftware Engineeringで、Process MemoryよりPersistent Stateを信頼するのとかなり似ています。

AgentのMemoryも、「頭の中に覚えているもの」より「外に出されたState」として考えるほうが設計しやすいと感じています。

---

## SecurityはPromptではなく、できない境界を作る

Production Harnessを考えるとき、Securityも外せません。

Agentに、

```text
秘密情報を外部へ送らないでください
危険な操作をしないでください
```

とInstructionを書くことはできます。

ただし、それはSecurity Boundaryではありません。

Anthropicが2026年5月に公開した内部Red Teamの例では、悪意あるPromptに`~/.aws/credentials`を読み、encodeし、外部endpointへPOSTする指示を混ぜたところ、25回中24回で情報送信まで完了しました。

Anthropicがそこで強調しているのは、Model Layerだけでは防げないケースがあることです。

必要になるのは、

- Filesystem Boundary
- Network Egress Control
- Sandbox
- Permission
- Scoped Credential

のようなEnvironment側の制約です。

Anthropicはこれを、probabilisticな防御をすり抜けた最後に効くdeterministic boundaryとして説明しています。

AIに「やってはいけない」とお願いするのではなく、**そもそもできない境界を作る。**

これも完全にHarness Engineeringの問題だと考えています。

---

## Harness Engineeringを考えるほど、Software Engineeringに戻っていく

ここまで考えていて、もう一つ強く感じていることがあります。

Harness Engineeringは、まったく新しいAI固有のEngineeringというより、**Software Engineeringで積み上げてきた原則を、Agentという新しい実行主体に適用し直す話に近い**のではないか、ということです。

例えば、ここまで出てきた考え方を並べると、かなり見慣れたものになります。

- **責務分離**: MakerとChecker、PlannerとExecutorを分ける
- **Contract**: Goal、Definition of Done、Constraints、Stop Conditionを明確にする
- **Observability**: Trace、Tool Call、Failure Logから何が起きたかを説明できるようにする
- **Regression Test**: Production FailureをEval Caseへ変え、Harness変更後に再発しないか確認する
- **Least Privilege**: Agentに必要以上のPermissionやNetwork Accessを与えない
- **State Management**: Context Windowだけに依存せず、ArtifactやCheckpointとして状態を外へ出す

こうして見ると、AI Agentだから突然まったく別のEngineeringが必要になったわけではありません。

実行主体が人間や通常のProgramからAgentへ広がったことで、**これまでSoftware Engineeringで使ってきた原則を、どこに適用するかが変わった**と考えるほうが自分にはしっくりきます。

例えば、以前ならRegression TestはApplication Codeの変更に対して書いていました。

Agent Systemでは、Prompt、Skill、Tool Schema、Routing、Permission、Harnessそのものの変更に対してもRegressionを考える必要があります。

以前ならLeast PrivilegeはUserやService Accountに対して設計していました。

Agent Systemでは、AgentがどのFileを読めるか、どのCommandを実行できるか、どのNetworkへ出られるかまで含めて設計する必要があります。

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

---

## Harnessは増やせばよいわけではない

ここは自分自身への注意でもあります。

Harnessが重要だと分かると、つい機能を増やしたくなります。

Planner、Router、Task Queue、Memory、Subagent、Reviewer、Checkpoint、Workflow。

でも、複雑なHarnessが常に良いわけではありません。

Anthropicは2026年3月の記事で、Harnessの各Componentは「Modelが単独ではできないこと」に関するAssumptionをcode化している、と説明しています。

そしてModelが進化すると、そのAssumptionは古くなります。

以前は複雑なPlannerが必要だった仕事を、次のModelは単体で処理できるかもしれません。

以前は毎Sprint必要だったEvaluatorが、簡単なTaskでは単なるCostになるかもしれません。

実際にAnthropicの実験でも、Harnessを一つずつ外しながら、どのComponentが本当にload-bearingなのかを確認しています。

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

自分も今後は、PlanGate ON / OFF、River Review ON / OFF、Skill ON / OFF、Memory ON / OFFのようなAblationをもっとやりたいと思っています。

**この仕組みは、本当に今のModelにも必要なのか。**

Harnessを作る側が、定期的に問い直すべき質問だと思います。

---

## 今はHarnessを8つの層で考えている

こうしたことを整理していく中で、今のところ自分はHarnessを8つの層に分けて考えています。

これはAWSやAnthropicの公式分類ではありません。自分が実装と改善箇所を考えやすくするための整理です。

1. **Contract**: Goal、Definition of Done、Constraints、Stop Condition
2. **Context & Tools**: Instructions、Skills、MCP、Retrieval、Repository Knowledge
3. **State & Memory**: Artifacts、Checkpoint、Durable Memory
4. **Orchestration**: Agent Loop、Subagent、Routing
5. **Runtime & Recovery**: Sandbox Runtime、Retry、Resume、Timeout
6. **Trust & Security**: Permission、Identity、Approval、Filesystem / Network Boundary
7. **Observability**: Trace、Cost、Latency、Tool Calls、Failure Log
8. **Evaluation**: Regression、Judge、Score、Ablation

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

今は、**Self-improving Agent Harnessの構成要素として見るほうが近い**と感じています。

---

## 次に作りたいのは、新しいAgentよりHarness Control Plane

この考え方まで来ると、次にやりたいことも少し変わってきます。

新しいAgentをもう一つ追加するより先に、今あるAgent Systemがなぜ成功し、なぜ失敗したのかを説明できるようにしたい。

最低限、1回のRunについて、

```text
task_id
model_version
prompt_version
skill_version
harness_version
context_size
tools_called
duration
tokens
cost
result
failure_type
eval_version
```

くらいは追えるようにする。

そして、

```text
Run
  ↓
Trace
  ↓
Failure
  ↓
Classification
  ↓
Eval Case
  ↓
Harness Change
  ↓
Regression
  ↓
Measure
```

を回す。

これを今は、仮に**Harness Control Plane**と考えています。

Agentを管理するための管理画面、という意味だけではありません。

**Harnessの変更と、その結果を追跡し、改善を継続するための仕組み**です。

Modelを変えたから良くなったのか。

Promptを変えたから良くなったのか。

Skillを追加したから良くなったのか。

Reviewerを分離したから良くなったのか。

それとも、複雑さを増やしただけなのか。

そこまで説明できるようになれば、Agent開発はかなりSoftware Engineeringらしくなると思っています。

---

## ProductのLearning Loopの内側に、HarnessのLearning Loopがある

前の記事では、AI時代に短くすべきものをTime to CodeではなくTime to Learningとして考えました。

今回のHarness Engineeringは、その続きにあります。

自分の中では、今こう整理しています。

```text
Product Learning Loop

Problem
  ↓
Shape
  ↓
Build
  ↓
Evidence
  ↓
Decision

そのBuild / Verifyを支える

Harness Improvement Loop

Agent Run
  ↓
Trace
  ↓
Failure / Eval
  ↓
Harness Change
  ↓
Regression
```

Productについても、Agent Systemについても、重要なのは変更そのものではありません。

**変更をEvidenceへ変換して、次の意思決定につなげること。**

良いModelを探すことは、これからも重要です。

でも、Agentの能力が上がるほど、その能力をどんなContextで使い、どんなToolを渡し、どこまで許可し、どう観測し、どう評価し、失敗からどう学ぶかの重要性も上がっていくはずです。

だから今は、

```text
より良いModelを探す
```

だけではなく、

```text
失敗を観測する
  ↓
原因を分類する
  ↓
Harnessを改善する
  ↓
Evalする
  ↓
不要になった仕組みは削る
```

というEngineeringに興味があります。

新しいAgentを増やすより先に、今あるAgent Systemを説明できるようにする。

そして、この先でもう一つ考えたいことがあります。

HarnessがAgentをどう動かすかを支えるものだとしたら、**そのAgentに「何が正しいか」を何で渡すのか**。

最近はそこに、仕様駆動開発、TDD、DDDといったSoftware Engineeringの考え方が改めて効いてくるのではないかと感じています。

仕様でIntentとContractを定め、Testで期待するBehaviorを実行可能な形にし、Domain ModelとBounded Contextで意味と責務の境界を作る。

AIがコードを書くほど、こうしたCoding以外のEngineeringがむしろ重要になる。

次は、このあたりをもう少し整理してみたいと思っています。

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
