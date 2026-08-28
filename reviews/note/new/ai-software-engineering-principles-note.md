# articles_note/new/ai-software-engineering-principles-note.md の記事レビュー

> 対象: note向けオピニオン記事「AIがコードを書くほど、仕様・テスト・ドメイン設計が重要になる」
>
> 位置づけ: Harness Engineeringの記事を受けて、AI駆動開発へSoftware Engineeringの原則をどう適用し直すかを、仕様駆動開発 / TDD / DDDの3つから整理する続編。
>
> 検証日: 2026-08-29

## レビュー方針

この記事の価値は、仕様駆動開発、TDD、DDDを個別に解説することではない。

AIが実装を高速化するほど「何を正しいとするか」を外部化するEngineeringが重要になる、という筆者の現在地を示すことにある。

重点確認した点:

- 仕様駆動開発 / TDD / DDDを万能論として扱っていないか
- 不確実性が高い段階でSpecやTestやDomain Modelを早く固定する危険を扱えているか
- 現在の実践と、これから試したい仮説を混同していないか
- TDDとAgent Evalを同一視していないか
- DDDの概念をAgent分割へ安易に直結させていないか
- 前回のHarness記事との接続が論理的か
- 次の記事へ自然に展開できるか
- note向けに読みやすい構造か

---

## ペルソナレビュー

### 1. Coding Agentを日常利用するシニアエンジニア

**判定: 強く刺さる**

もっとも共感されやすい主張は、

> 実装が速くなるほど、「何を正しいとするか」を定義するEngineeringの価値が上がる。

という部分。

Prompt Techniqueの話に寄らず、Spec / Test / Domain / Harnessへ論点を広げているため、Coding Agentを使い込んだ読者が「最近感じていたことに名前が付いた」と感じやすい。

特に、

- Spec = Intent / Contract
- Test / Eval = Executable Criteria
- DDD = Meaning / Boundary
- Harness = Execution / Control

という4分割は保存性が高い。

### 2. Tech Lead / Staff Engineer

**判定: 本記事の最重要ペルソナ**

Software Engineeringの既存原則がAgent Engineeringへ戻ってくる、という前回記事の主張を、具体的な開発方法論へ接続できている。

特に評価されやすい点:

- Specを文書ではなくExecution Contractとして扱う
- TDDを「テストを先に書く形式」だけでなくFeedback Loopとして扱う
- DDDのBounded ContextをAgent分割より先に考える
- Task Risk / Uncertaintyに応じてProcessを増減する

DDDを「すでに実践済み」とせず、今後取り込みたい仮説として明記した補正も重要。

### 3. EM / AI駆動開発推進担当

**判定: 実務導入の入口として有効**

チームへ導入するときに、

- どのTaskでSpecを厚くするか
- どの変更でRegression Test / Evalを厚くするか
- どのDomainでDDDを使うか
- どのAgentにどこまで権限を与えるか

という運用設計へ展開しやすい。

次の記事で具体的なWorkflowを示すと、組織導入の解像度が一段上がる。

### 4. PdM / Product Engineer

**判定: 前半とLoop設計が特に刺さる**

Problem → Domain Understanding → Shaping → Specificationという流れは、Product Discoveryとの接続がよい。

一方でTDD / Eval / Harnessは技術密度が上がるため、主対象ではなく副読者として想定するのが適切。

---

## 事実・概念確認

### Spec-Driven Development

GitHub Spec Kitは、現在のDocumentationでSpec-Driven DevelopmentをIntent-drivenな開発として扱い、Spec → Plan → Tasks → Implementの流れを提供している。

記事では、歴史的な仕様中心開発全般と混同しないよう、「GitHub Spec KitやKiroのような現在の流れ」を念頭に置くと限定した。

**判定: 適切。**

### TDD

Martin Fowlerの整理に沿ってRed / Green / Refactorを説明している。

また、TDDを単なるTest-first ruleにせず、DesignとFeedback Loopを駆動する方法として扱っている。

Agent EvalとTDDを同一視せず、

> TestとEvalは同じではない

と明示している。

**判定: 適切。**

### DDD

Microsoft LearnのDDD解説に沿って、Ubiquitous LanguageとBounded Contextを「共有Vocabulary」と「Domain Modelが適用されるBoundary」として扱っている。

AgentのContext整理やMulti-Agent境界への適用は筆者の仮説として書かれており、DDDの公式な用途として断定していない。

**判定: 適切。**

### Agent Eval

AnthropicのEval記事に沿って、Eval不在時にはProductionでFailureを見つけて修正し、その変更が別のFailureを生むreactive loopへ入りやすいという論点を使用している。

**判定: 適切。**

---

## 指摘と対応

### F1: 3つの方法論を「全部導入すべき」と読まれる危険

**重要度: high / 対応済み**

「すべての開発でフルセットを使う必要はない」というSectionを置き、Risk / Uncertaintyに応じてEngineeringを増減する方針を明記した。

### F2: DDDを現在すでに実践しているように読まれる危険

**重要度: high / 対応済み**

DDD Section冒頭で、

> これから自分のAI駆動開発へ、より意識的に取り込みたい

> 実践済みの答えというより、今後試したい仮説

と現在地を明示した。

### F3: TDDとRiver Reviewを混同する危険

**重要度: medium / 対応済み**

River Reviewについて、

> これはTDDそのものではありません。

と明示し、共通項を「実装とは独立した判定基準」とMaker / Checkerの分離に限定した。

### F4: TestとEvalを同一概念として扱う危険

**重要度: high / 対応済み**

Application Behaviorに対するTestと、Agent Behaviorに対するEvalの違いを説明したうえで、共通する役割をRegression検知として整理している。

### F5: 一般論だけで筆者の体験が薄くなる危険

**重要度: medium / 対応済み**

- 自分の開発でBuild時間の割合が変わった実感
- PlanGateとExecution Contractの接続
- River Reviewと独立Verificationの接続
- DDDはこれから試したいという現在地

を追加した。

### F6: 不確実性が高い初期にもSDD / TDD / DDDを固定的に適用すると読まれる危険

**重要度: high / 対応済み**

最新の検討を受けて、本文を次のように補正した。

- SpecはKnowledgeを発見するものではなく、ある程度得られたKnowledgeをExecution Contractへ変えるものと整理
- Product Hypothesisが未検証の段階では、Testで誤ったBehaviorを固定し得ることを明記
- TDDは残したいBehaviorをExecutableなFeedbackへ変える方法として位置づけ
- DDDは探索として早期から使える一方、Entity / Aggregateなど構造の固定は早すぎると危険と整理
- 不確実性が高い場合はDomain Understanding / Shaping / Hypothesis / Experimentを優先し、Specを薄く保つ方針を追記

**判定: 解消。**

---

## 良い点

### 1. 前回記事から自然に一段進んでいる

Harness記事:

~~~text
Agentをどう動かすか
~~~

今回:

~~~text
Agentに何を正しいと渡すか
~~~

となっており、同じ話の繰り返しではない。

### 2. 「古典回帰」ではなく「適用対象の拡張」になっている

単に「TDDやDDDが再評価される」と言うのではなく、

> Software Engineeringが扱う範囲を広げ直す

と整理しているのがよい。

### 3. 3つの方法論の役割分担が明確

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

が記事の中心図として機能している。

### 4. 不確実性と方法論の使い分けまで踏み込めた

SDD / TDD / DDDを「全部入れるべき」とせず、Knowledgeの成熟度によって役割が変わることを本文へ反映した。

特に、

> Specを「Knowledgeを発見するもの」ではなく、ある程度得られたKnowledgeをAgentが実行できるContractへ変えるもの

という整理は、AI駆動開発でのSDD万能論を避けるうえで重要。

### 5. 次の記事への導線が強い

最後に、

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

を提示しているため、次回を具体的なAI駆動開発Workflow設計へ自然につなげられる。

---

## 次の記事候補

今回の記事を思想編とすると、次は実装編にできる。

仮タイトル:

**AI駆動開発のWorkflowを、Domain → Spec → Test → Agent → Evidenceで設計する**

扱う内容:

1. Problem / Domainの入力
2. Spec ArtifactのSchema
3. Acceptance CriteriaからTest / Evalを生成
4. Plan / ImplementationをAgentへ渡す
5. Maker / Checkerを分離
6. Trace / FailureをEvidence化
7. Spec / Test / HarnessへFeedbackする

この形なら、これまでの記事群を一つのOperating Modelへまとめられる。

---

## 公開前の任意改善

1. 図版を入れるなら「DDD / Spec / Test-Eval / Harnessの4層」を優先する
2. 公開時に前回Harness記事のnote URLを追加する
3. DDDを実運用へ取り込んだ後、具体例を別記事で補足する

---

## 総合判定

**公開可能レベル。must / highの未解決なし。**

今回の記事の核は、

> AIがコードを書くほど、「何を正しいとするか」をSoftware Engineeringとして設計する必要がある

という主張。

仕様駆動開発、TDD、DDDを並べただけの記事ではなく、Harness Engineeringまで含めてAI駆動開発のSystem Designへ統合できている。

次の記事でDomain → Spec → Test / Eval → Agent → Evidenceを具体的なWorkflowへ落とすことで、シリーズ全体を実践可能な形へ進められる。
