# AIがコードを書くほど、仕様・テスト・ドメイン設計が重要になる

> 区分: 個人

こんにちは、みねです。

AI Coding Agentを使うようになって、実装にかかる時間はかなり短くなりました。

以前なら数時間かけていた変更が、数十分で終わることもあります。

でも、速くなったことで別のところで止まることが増えました。

**「そもそも、何をもって正しいとするのか」です。**

Agentはコードを書けます。

でも、何を作るべきか、どこまで変えてよいか、どうなればDONEなのかまでは、自動では決まりません。

最近、自分はこの問題を考える中で、仕様駆動開発（SDD）、TDD、DDD、Harnessといった、一見別々に見えるSoftware Engineeringの考え方が一つにつながって見えるようになりました。

**実装が速くなるほど、「何を正しいとするか」を定義するEngineeringの価値が上がる。**

今はそう考えています。

前回は、Agentの失敗をModel単体ではなくSystemとして扱う[Harness Engineeringの記事](https://note.com/mine_unilabo/n/nd6a5d83d1488)を書きました。

今回は、そのさらに手前にある「正しさをどう設計するか」を考えてみます。

---

## 実装が速くなるほど、「正しさ」で止まるようになった

AI Coding Agentへ、

~~~text
ユーザー管理を改善して
~~~

と渡せば、何らかの実装案は返ってきます。

でも、この一文だけでは、

- 誰の問題を解くのか
- 何を改善と呼ぶのか
- 既存仕様をどこまで変えてよいのか
- 何を変えてはいけないのか
- 何をもって完了とするのか
- どんな条件なら一度止まるのか

が分かりません。

人間同士なら、実装中の会話で補えるかもしれません。

しかしAgentへ長時間の自律実行を任せるほど、この曖昧さはそのままExecution Riskになります。

実装能力が高いほど、間違った方向にも速く進めるからです。

そこで自分は、Promptを詳しくするより先に、**実装前に「何を正しいとするか」を外へ出す**ことを重視するようになりました。

---

## PlanGateで先に置いていたのは「DONE」だった

自分が使っているPlanGateでは、Why / WhatやPBIから、そのままAgentへ実装を依頼しません。

PlanGateは、実装前に設計と実行計画を確認し、承認した範囲でAgentを動かすための仕組みです。

大きく見ると、Flowは次のようになります。

~~~text
Why / What
  ↓
PBI
  ↓
Acceptance Criteria / DONE
  ↓
Design
  ↓
Execution Plan
  ↓
Implementation
  ↓
Verification
~~~

ここで重要なのは、**実装より前にDONEを置く**ことです。

例えば架空のPBIとして「管理者がユーザーを一時停止できる」を考えるなら、実装に入る前に、

- 管理者だけが停止できる
- 停止されたユーザーはログインできない
- 認証方式そのものは変更しない
- 既存の権限モデルの再設計が必要なら、いったん止めて設計へ戻る

といった条件を外へ出しておく。

こうするとAgentへ渡すものは、単なる「やってほしいこと」ではなくなります。

**何を達成するか、何を変えないか、何ができれば終わりか、どこで止まるかを含むExecution Contract**になります。

PlanGateには、SDD、TDD、DDDの考え方をそれぞれ取り入れてきました。

- Why / WhatやPBIを、いきなり実装Taskへ変えずに設計へ落とす
- 設計をArtifactとして残し、Execution Planへ変換する
- 実装前にAcceptance Criteria / DONEを置く
- Domainの意味や境界を意識して、変更範囲を決める

もちろん、PlanGateがSDD、TDD、DDDそのものだと言いたいわけではありません。

振り返ると、**実装の前にIntent、Boundary、DONEを外部化するために、これらの考え方を使っていた**ということです。

---

## それでも、SDDがうまく機能しないケースが出てきた

ここまでなら、「ではSpecを詳しくして、設計とDONEを先に固めればよい」と見えるかもしれません。

自分も、PlanGateを使い始めた頃は、実装前にWhy / What、PBI、DONE、Design、Execution Planを外部化するほど、Agentの実行は安定すると考えていました。

実際、それが効くケースは多くあります。

一方で、使い続ける中で、**SDD的なFlowがうまく機能しないケース**も見えるようになりました。

こうしたケースを見ると、AI駆動開発で「SDDがうまくフィットしない」という議論が出てくる理由の一つも、ここにあるのではないかと思っています。

少なくとも、自分がPlanGateを使う中で感じた違和感は、Specの作り方そのものより、**まだKnowledgeが足りない段階でExecution Contractを作ろうとすること**にありました。

原因の一つはシンプルです。

**Specを書く時点では、まだ何が正しいか分かっていないことがある。**

WhyやWhatそのものが仮説で、Domainの理解も揺れている。

その状態で詳細なSpecを作ると、AssumptionをRequirementとして固定してしまいます。

さらに今はAgentが、そのRequirementを高速に実装できます。

その結果、

**間違った仮説を、高い品質で、速く実装する**

ことすら起こり得ます。

これはSDDが間違っているという話ではありません。

問題は、**DiscoveryとDeliveryでSpecの役割を同じにしてしまうこと**だと考えています。

---

## SpecはKnowledgeの代わりにはならない

Specを書くことで、曖昧さや不足しているKnowledgeに気づくことはあります。

でも、まだ得ていないProductやDomainのKnowledgeを、文書を詳しくするだけで埋められるわけではありません。

今の自分は、Specを「最初に完成させる文書」ではなく、**十分に得られたKnowledgeをExecution Contractへ変えるArtifact**として見る方がしっくりきます。

まだ分からないことが多い段階では、詳細なRequirementへ変換するより、

- 何を知りたいのか
- 何を仮説として置いているのか
- どんなEvidenceが得られれば前へ進めるのか
- どの条件なら仮説を捨てるのか
- 何がまだUnknownなのか

を残す方が重要です。

この段階では、ShapingやExperimentによってKnowledgeを増やす。

何を作るかが見えてきたら、

- Goal
- Scope
- Non-goals
- Constraints
- Acceptance Criteria
- Definition of Done
- Stop Condition

を明確にして、Design、Execution Plan、Implementationへ進む。

つまり、

**不確実なものを、Agentが精密に実装できるからといって、早く固定しない。**

ここが、AI駆動開発へSDDを取り入れるときに、今の自分がかなり重要だと感じているところです。

---

## AgentがTestも書くなら、PASS条件は先に外へ出す

仕様を決めても、それだけでは十分ではありません。

次に必要になるのが、

**その仕様を満たしていることを、どう確認するか**

です。

ここでTDDの考え方が効いてきます。

TDDは単に「実装前にTestを書くルール」ではなく、TestによってDesignとFeedback Loopを駆動する方法です。

AI駆動開発で特に面白いのは、**実装するAgentがTestも書ける**ことです。

Agentが、

~~~text
実装しました
テストも追加しました
すべて通りました
~~~

と言うこと自体は珍しくありません。

ただし、実装したAgentが、自分の実装に合わせてTestを作り、自分でPASSと報告するだけでは、期待したBehaviorを満たした独立した証拠としては弱い。

だから自分は、

**AgentにTestを書かせてもいい。ただし、何をPASSとするかまで実装後にAgentへ決めさせない。**

ことが重要だと考えています。

PlanGateで先にAcceptance Criteria / DONEを置く意味もここにあります。

TestやEvalは、そのDONEを実行可能な判定基準へ変える。

そして実装結果を、先に置いた基準に対してVerificationする。

TDDそのものとAgent Evalは同じではありません。

Unit TestやIntegration Testは比較的deterministicなApplication Behaviorを検証します。

一方、Agent EvalではToolの選び方、複数Stepの判断、Task Completionなど、より広いBehaviorを見る必要があります。

それでも共通するのは、**期待するBehaviorを実装の外へ出し、Regressionを検知できるようにする**ことです。

自分がRiver Reviewで、作る役割と確認する役割を分けようとしてきたのも同じ問題意識です。

River ReviewはTDDそのものではありませんが、MakerとCheckerを分け、自己評価だけで完了させないための仕組みとしてつながっています。

---

## SDD / TDD / DDD / Harnessは「正しさ」の違う層を扱う

ここまで考えると、自分の中ではSDD、TDD、DDD、Harnessは競合する方法論ではなくなりました。

それぞれ、違う種類の「正しさ」を扱っています。

### DDD

**このProblem Domainを、どんなConceptとBoundaryで捉えるか。**

Agentへ大量のContextを渡す前に、どの意味の世界で仕事をしているのかを揃える。

例えば同じ「Account」でも、認証、請求、CRMでは意味が違います。

Contextの量を増やすより、意味の境界を明確にする方が効くことがあります。

### SDD / Specification

**今回のChangeで、何を実現し、何を実現しないか。**

理解が進んだKnowledgeを、Agentが実行できるIntent / Contractへ変える。

### TDD / Test / Eval

**正しく実現できたことを、どう確認するか。**

期待するBehaviorをExecutableなCriteriaへ変え、自己申告だけに依存しない。

### Harness

**そのContractとBoundaryの中で、Agentをどう実行するか。**

Context、Tool、Permission、Checkpoint、Observability、Evaluationなどを使って、AgentのExecutionを制御する。

自分は今、この関係を次のように見ています。

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

AI時代に突然、新しいSoftware Engineeringが生まれたというより、Software Engineeringが扱ってきた原則を、Agentという新しい実行主体へ適用し直している感覚があります。

---

## 全部を厚くするのではなく、Uncertaintyで変える

仕様駆動開発、TDD、DDD、Harnessが重要だからといって、すべてのTaskへフルセットを適用する必要はありません。

単純な文言修正に、詳細なDomain Modelingは必要ありません。

小さなSpikeに、完全なSpecificationを作る必要もありません。

重要なのは、**TaskのRiskとUncertaintyに応じてEngineeringの厚みを変えること**だと考えています。

- **Uncertaintyが高い**  
  Domain Understanding、Shaping、Hypothesis / Experimentを厚くする。Specは薄く保ち、AssumptionやUnknownを残す。

- **Scopeが大きい**  
  SpecificationとContractを厚くする。

- **Regression Riskが高い**  
  TestとEvalを厚くする。

- **Domain Complexityが高い**  
  DDDのStrategic Designを厚くする。

- **Agentの自律実行時間や権限が大きい**  
  Harness、Checkpoint、Observability、Permissionを厚くする。

最初から全部を固定するのではなく、必要な場所に必要な構造を置く。

PlanGateの運用を通じて、自分もこの考え方へ変わってきました。

---

## Promptの前後を設計する仕事が増えている

以前は、Agentに渡すPromptをどう改善するかを考える時間が多くありました。

今は、その前後を見る時間の方が増えています。

実装の前では、

- Why / Whatを確認する
- Domainを理解する
- PBIを定義する
- DONEを外へ出す
- DesignとExecution Planを作る

実装の後ろでは、

- Test / Evalで確認する
- Traceを観測する
- FailureをEvidenceへ変える
- 次のSpecやHarnessへ戻す

その間をAgentとHarnessでつなぐ。

AIによってCodingが不要になるとは思っていません。

ただ、Codingが高速化するほど、

~~~text
何を作るか
何を意味するか
何を正しいとするか
どう検証するか
どこまで任せるか
~~~

を設計する仕事の重要性は相対的に上がっていく。

だから今は、

**AI時代だから新しいSoftware Engineeringが必要**

というより、

**AI時代だからSoftware Engineeringが扱う範囲をCodingの外へ広げ直す必要がある**

と考えています。

SDDは、理解が進んだKnowledgeをExecution Contractへ変える。

TDD / Test / Evalは、残したいBehaviorをExecutableなFeedbackへ変える。

DDDは、Domainの意味と責務のBoundaryを扱う。

Harnessは、それらを守りながらAgentを実行する。

ただし、まだ分からないことは、先に固定しない。

自分は今、この組み合わせがAI駆動開発を考えるうえで重要になると思っています。

次は、この考えを実際のWorkflowへ落とし、DiscoveryとDeliveryの境界をどう設計するかまで考えてみたいです。

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
