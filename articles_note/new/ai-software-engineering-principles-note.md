# AIがコードを書くほど、仕様・テスト・ドメイン設計が重要になる

> 区分: 個人

前回、AIエージェント開発を「Model + Harness」で考える、という記事を書きました。

そこで整理したのは、Agentの失敗をModel単体の問題にせず、Context、Tools、Runtime、Security、Observability、Evaluationまで含めたSystemとして扱う、という考え方です。

その記事を書きながら、もう一つ強く感じたことがありました。

Harness Engineeringについて考えるほど、AI固有の新しい技術だけを学んでいる感覚が薄くなっていく。

むしろ、

- 責務分離
- Contract
- Observability
- Regression Test
- Least Privilege
- State Management

といったSoftware Engineeringの原則を、Agentという新しい実行主体へ適用し直している感覚が強くなっています。

そして最近は、その延長で、

**仕様駆動開発、TDD、DDDの考え方も、AI駆動開発で改めて重要になるのではないか**

と考えています。

AIがコードを書いてくれるなら、こうした方法論は古くなるのではないか。

最初は自分もそう考える部分がありました。

でも今は、むしろ逆です。

**実装が速くなるほど、「何を正しいとするか」を定義するEngineeringの価値が上がる。**

今回は、この感覚を整理してみます。

---

## 実装が速くなっても、「正しさ」は自動では決まらない

AI Coding Agentを使うと、Buildはかなり速くなります。

以前なら数時間かけていた実装を、数十分で終えられることもあります。

でも、コードが速く書けることと、正しいものが作れることは同じではありません。

Agentは、与えられたIntentやContextをもとに実装します。

そのため、入口が曖昧なら、実装能力が高いほど間違った方向へ速く進むことがあります。

例えば、

~~~text
ユーザー管理を改善して
~~~

だけでは、

- 誰の問題を解くのか
- 何を改善と呼ぶのか
- 既存仕様をどこまで変えてよいのか
- Security上の制約は何か
- 何をもって完了とするのか

が分かりません。

人間同士なら、会話の中で補完できるかもしれません。

しかしAgentへ長時間の自律実行を任せるほど、この曖昧さはExecution Riskになります。

だから、AI駆動開発ではPrompt Engineeringだけでなく、

**Specification Engineeringが必要になる。**

今はそう考えています。

---

## 仕様駆動開発は、AgentとのExecution Contractになる

最近のAI開発では、Spec-Driven Developmentという言葉をよく見るようになりました。

GitHubのSpec Kitでは、Spec-Driven DevelopmentをIntent-drivenな開発として整理し、

~~~text
Spec
  ↓
Plan
  ↓
Tasks
  ↓
Implement
~~~

という流れを提供しています。

GitHubは、Specificationを単なる実装前の補助文書ではなく、AI Coding Agentへ構造化されたContextを渡す中心的なArtifactとして扱っています。

Kiroも、Specを先に作ることでScopeやConstraints、Edge Caseを明確にし、曖昧さを実装前に減らす考え方を取っています。

ここで自分が重要だと思っているのは、Specのフォーマットそのものではありません。

**「実装する前に、何を正しいとするかを外部化する」ことです。**

例えばAgentに渡すSpecificationなら、最低限、

- Goal
- Problem
- Scope
- Non-goals
- Constraints
- Acceptance Criteria
- Definition of Done
- Stop Condition

くらいは明確にしておきたい。

自分はこれを、単なるRequirement Documentというより、

**AgentとのExecution Contract**

として考えています。

Agentに「何を作るか」をお願いするのではなく、

~~~text
何を達成するか
何を変えてよいか
何を変えてはいけないか
何をもって完了とするか
どこで止まるか
~~~

を合意する。

AI Agentの自律性が上がるほど、このContractの重要性も上がるはずです。

---

## TDDは、Agentの「できました」を信じなくてよくする

仕様を決めても、それだけでは十分ではありません。

次に必要になるのが、

**その仕様を満たしていることを、どう確認するか**

です。

ここでTDDの考え方が効いてきます。

Martin FowlerはTDDを、

1. 次に追加したいFunctionalityに対するTestを書く
2. Testが通るまでCodeを書く
3. Refactorする

という繰り返しとして説明しています。

よく知られているRed、Green、Refactorです。

TDDは単なる「実装前にTestを書くルール」ではなく、TestによってDesignとFeedback Loopを駆動する方法です。

AI駆動開発で自分が特に重要だと感じているのは、

**期待するBehaviorを、実装とは別の実行可能な判定基準にする**

という部分です。

Agentが、

~~~text
実装しました
テストも通りました
問題ありません
~~~

と言っても、それだけではVerificationになりません。

実装した主体と、正しいと判定する主体が同じだからです。

そこで、

~~~text
Specification
  ↓
Test / Eval
  ↓
Implementation
  ↓
Regression
~~~

という構造を作る。

実装がAIで高速化するほど、TestやEvalは「あとで確認するもの」ではなく、

**Agentの仕事を制御するContractの一部**

になっていくと感じています。

---

## TestとEvalは同じではないが、役割は近づいている

ここは少し分けて考えたいところです。

TDDのTestと、AI Agentに対するEvalは同じものではありません。

Unit TestやIntegration Testは、決められたInputに対するSystem Behaviorを比較的deterministicに検証できます。

一方、Agent Evalでは、

- Toolの選び方
- 複数Stepの判断
- Intermediate State
- Output Quality
- Safety
- Task Completion

など、より広いBehaviorを見る必要があります。

AnthropicもAgent Evalについて、EvalがないとProductionでFailureを見つけて修正し、その修正が別のFailureを生むreactive loopに入りやすいと説明しています。

だから自分は、

~~~text
Application Behavior
  ↓
Test

Agent Behavior
  ↓
Eval
~~~

と完全に分離するより、

**どちらも「期待するBehaviorを外部化してRegressionを検知する仕組み」**

として見るほうが、AI駆動開発では理解しやすいと感じています。

もちろん、TestですべてのAgent Behaviorを評価できるわけではありません。

逆に、Evalで通常のSoftware Testを置き換えるべきでもありません。

重要なのは、

**実装したAgent自身の自己評価だけに依存しないこと**

です。

---

## DDDは、Agentへ渡すContextの「量」ではなく「意味」を整理する

もう一つ、最近改めて重要だと思っているのがDDDです。

AI Agentには大量のContextを渡せます。

Repository全体を読ませる。

大量のDocumentを検索させる。

Long Context Windowへ情報を入れる。

でも、

**Contextが多いことと、Contextが正しく構造化されていることは別です。**

そこでDDDの考え方が効いてきます。

特に、

- Ubiquitous Language
- Bounded Context

です。

MicrosoftのDDD解説でも、Ubiquitous LanguageはDomain ExpertとDeveloperが共有するVocabularyであり、Bounded Contextは特定のDomain Modelが有効な境界として説明されています。

これをAgent Engineeringへ持ち込むと、かなり面白い。

例えば「Account」という言葉が、

- 契約管理
- 認証
- 請求
- CRM

で違う意味を持っていたとします。

人間のTeamでも混乱します。

Agentならなおさらです。

巨大なContextを渡して、

~~~text
Accountを修正して
~~~

と指示するより、

~~~text
Billing ContextにおけるAccount
~~~

と意味の境界を明確にしたほうが、Agentが参照すべきModel、Code、Ruleを絞れます。

つまりDDDは、AIに対して、

**何を知っているかではなく、どの意味の世界で仕事をしているかを定義する**

方法として使えるのではないか、と考えています。

---

## Bounded Contextは、Agentを分ける前に考えたい

これはMulti-Agentとも関係します。

AI駆動開発では、Agentを増やしたくなります。

Frontend Agent。

Backend Agent。

Test Agent。

Review Agent。

でも、先にAgentを分けると、役割分担がTool都合になりやすい。

DDD的に考えるなら、順番は逆です。

~~~text
Domainを理解する
  ↓
Bounded Contextを見つける
  ↓
Responsibilityを分ける
  ↓
Context / Tool / Permissionを分ける
  ↓
必要ならAgentを分ける
~~~

Agentを増やすことが目的ではありません。

**意味と責務の境界があるから、Agentを分ける。**

この考え方は、自分がHarness Engineeringで考えているMulti-Agentの設計ともかなり相性がよいです。

---

## 仕様駆動、TDD、DDDはそれぞれ違う問いを持っている

3つを同時に考えると、役割が重複しているようにも見えます。

でも、自分の中では少し違う問いを担当しています。

### DDD

~~~text
このProblem Domainを
どんなConceptとBoundaryで捉えるか
~~~

### Specification

~~~text
今回のChangeで
何を実現し、何を実現しないか
~~~

### TDD / Test / Eval

~~~text
正しく実現できたことを
どう確認するか
~~~

そしてHarnessは、

~~~text
そのContractとBoundaryの中で
Agentをどう安全に実行するか
~~~

を担う。

自分は今、この4つを次のように見ています。

~~~text
DDD
  ↓
Meaning / Boundary

Specification
  ↓
Intent / Contract

Test / Eval
  ↓
Executable Criteria

Harness
  ↓
Execution / Control
~~~

これは、かなりSoftware Engineeringらしい構造です。

---

## AI駆動開発のLoopをこう考えたい

これまで考えてきたことを一つのFlowにすると、今はこうなります。

~~~text
Problem
  ↓
Domain Understanding
  ↓
Shaping
  ↓
Specification
  ↓
Test / Eval Design
  ↓
Agent Build
  ↓
Verification
  ↓
Evidence
  ↓
Learning / Decision
~~~

以前の記事で考えた、

~~~text
Problem
  ↓
Shape
  ↓
Build
  ↓
Evidence
  ↓
Decision
~~~

というProduct Learning Loopの中を、少し細かくした形です。

BuildをAIへ任せるなら、その前後にある、

- Domain Understanding
- Specification
- Verification

をより明示的にする。

そして、それをHarnessで実行可能なWorkflowへ変える。

AI駆動開発とは、単にCoding Agentを導入することではなく、

**このFeedback Loop全体を設計し直すこと**

なのではないかと思っています。

---

## すべての開発でフルセットを使う必要はない

ここは重要です。

仕様駆動開発、TDD、DDDが重要だからといって、すべてのTaskに重いProcessを入れる必要はありません。

単純な文言修正に、Domain Modeling Workshopは必要ありません。

明らかなCRUD追加に、複雑なAggregate設計が必要とは限りません。

小さなSpikeに、完全なSpecificationを作る必要もありません。

Software Engineeringの方法論は、使うこと自体が目的になると逆効果です。

AI駆動開発でも同じだと思います。

自分なら、次のように考えます。

### 不確実性が高い

Domain UnderstandingとShapingを厚くする。

### Scopeが大きい

SpecificationとContractを厚くする。

### Regression Riskが高い

TestとEvalを厚くする。

### Domain Complexityが高い

DDDのStrategic Designを厚くする。

### Agentの自律実行時間が長い

Harness、Checkpoint、Observability、Permissionを厚くする。

つまり、

**TaskのRiskとUncertaintyに応じてEngineeringを増減する。**

最初から全部入れるのではなく、必要な場所に必要な構造を置く。

これもHarnessを増やしすぎないという考え方と同じです。

---

## 明日から変えるなら、Promptの前を変えたい

では、この考え方を実際のAI駆動開発へどう取り込むか。

大げさなTransformationを始める必要はないと思っています。

まず変えたいのは、Agentへ最初のPromptを送る前です。

### 1. ProblemとDomainを言葉にする

何が問題なのか。

誰のどんなBehaviorを変えたいのか。

この変更はどのDomain / Contextに属するのか。

### 2. SpecをArtifactとして残す

Conversationだけに閉じず、

~~~text
Goal
Scope
Constraints
Acceptance Criteria
DoD
~~~

を外へ出す。

### 3. Acceptance CriteriaをTest / Evalへ落とす

「できたと思う」ではなく、

~~~text
どうなればPASSか
~~~

をExecutableにできるところからする。

### 4. AgentのExecutionを観測する

何を読み、何を変更し、どこで失敗したかをTraceとして残す。

### 5. Failureを次のSpec / Test / Evalへ戻す

一度起きた失敗を、その場のPrompt修正で終わらせない。

次のRunでも検知できる状態にする。

このLoopを回すだけでも、AI駆動開発はかなりSoftware Engineeringらしくなると思います。

---

## AIがコードを書くほど、EngineeringはCodingの外へ広がっていく

AIによってCodingが不要になるとは思っていません。

ただ、Codingが占める割合は確実に変わっています。

そしてCodingが高速化するほど、

~~~text
何を作るか
何を意味するか
何を正しいとするか
どう検証するか
どこまで任せるか
~~~

を決める仕事の重要性が相対的に上がっていく。

だから今は、

**AI時代だから新しいSoftware Engineeringが必要**

というより、

**AI時代だからSoftware Engineeringが扱う範囲を広げ直す必要がある**

と考えています。

仕様駆動開発は、AgentとのContractを作る。

TDDは、期待するBehaviorをExecutableにする。

DDDは、意味と責務のBoundaryを作る。

Harnessは、それらを守りながらAgentを実行する。

この組み合わせは、今後のAI駆動開発を考えるうえでかなり重要になるのではないかと思っています。

次は、この考えをもう一段実装側へ寄せて、

~~~text
Domain
  ↓
Spec
  ↓
Test / Eval
  ↓
Agent
  ↓
Evidence
~~~

を、実際の開発Workflowとしてどう設計するかを考えてみたいです。

---

## 参考

- GitHub Spec Kit「What is Spec-Driven Development?」
  - https://github.com/github/spec-kit/blob/main/docs/concepts/sdd.md
- GitHub Spec Kit Documentation
  - https://github.github.com/spec-kit/
- Kiro「Specs just got faster (and smarter)」
  - https://kiro.dev/blog/faster-smarter-specs/
- Martin Fowler「Test Driven Development」
  - https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Microsoft Learn「Use Domain Analysis to Model Microservices」
  - https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis
- Anthropic「Demystifying evals for AI agents」
  - https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
