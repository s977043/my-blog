# articles_note/new/agent-harness-engineering-note.md の記事レビュー

> 対象: note向けオピニオン記事「失敗をモデルのせいにしない。AI駆動開発を『Model + Harness』で考える」
>
> 位置づけ: 公開済み記事「AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning」（n5070e13232ce）の続編。前記事のProduct Learning Loopを、Agent System自身のLearning Loopへ展開する記事としてレビューした。
>
> 検証日: 2026-08-29

## タイトル最終判断

旧タイトル「最近、AIエージェント開発を『Model + Harness』で考えるようになった」から、

> **失敗をモデルのせいにしない。AI駆動開発を「Model + Harness」で考える**

へ変更した。

タイトルは、読者が経験する「失敗」から入り、本文の中心主張である「Model単体ではなくHarnessを含むSystemとして見る」へ接続する構造になった。

また「AIエージェント開発」ではなく「AI駆動開発」を採用し、Agentそのものを開発する読者だけでなく、Coding Agentを使ってSoftware Developmentを進める実務者まで対象範囲を本文と揃えた。

**判定: 採用。**

## 🚩 レビュー方針

本記事はHarness Engineeringの紹介そのものではなく、筆者がこれまで個別に扱ってきたPlanGate / River Review / Skills / Memory / Eval / Retrospectiveを、Harnessという上位概念で捉え直したオピニオン記事である。

そのため、通常のnote 3ペルソナレビューに加え、次を重点確認した。

- AWS / Anthropic / OpenAIの一次情報と筆者独自の整理が混ざっていないか
- 「HarnessのほうがModelより重要」という過剰な二項対立になっていないか
- 前記事のTime to Learningとの接続が、単なる内部リンクではなく論理的な続編になっているか
- PlanGate / River Reviewの紹介が自作ツール宣伝に寄りすぎていないか
- noteのWXRインポートで崩れやすいMarkdown Tableを使っていないか
- 英語の専門語が説明なしで連続し、読者が意味を推測しないと読めない箇所がないか
- H2が論点の羅列ではなく、読者が追うストーリーになっているか

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
- [x] H2を13本から6本へ整理し、「失敗 → 改善 → 個別適用 → 原則 → 次」の読者導線に統合した
- [x] Observability / Evaluation / Artifact / Checkpoint / Ablationなど主要な専門語は初出または8層で日本語の意味を添えている
- [x] 独立した用語集は追加せず、本文の文脈の中で意味が分かるようにした
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

### F11: Multi-Agent節にRiver Reviewの固有名詞が残る

**重要度: low / 対応済み**

外部再レビューで、Multi-Agent節の

> これは、自分がRiver Reviewで考えてきた方向ともかなり近いです。

が、固有名詞を後段まで遅らせる方針とまだ一致していないと指摘された。

本文を、

> これは、実装と判定を分ける方向ともかなり近いです。

へ変更し、River Reviewの初出を後段の具体例へ遅らせた。

**判定: 解消。**

---

### F12: H2の並列と未説明の英語用語が読者負荷を上げる

**重要度: high / 対応済み**

外部レビューで、記事の内容不足ではなく、H2が13個横並びになっていることで、読者が各テーマを同じ重要度で処理させられている点が指摘された。

また、Observability / Evaluation / Artifact / Checkpoint / Ablationなど、英語だけでは意味を推測しないと読み進めにくい箇所が残っていた。

#### 対応

独立した用語集は追加せず、記事全体を次の5段階へ再構成した。

1. 失敗の見方を変える
2. 改善ループの入口は観測と評価
3. Harnessで見ると、境界・状態・「できないこと」が変わる
4. Software Engineeringの原則に戻す
5. 自分の整理と次に考えたいもの

H2は参考を含めて13本から6本へ削減した。

主要な専門語は初出で日本語の意味を添え、8層は辞書ではなく、ここまで読んだ内容を再整理する写像として使う構成に変更した。

終盤のHarness Control Planeも英語のfield一覧と重複Loopを削り、次テーマとして短くした。記事の最後はProduct Learning LoopとHarness Improvement Loopの統合に戻した。

**判定: 解消。**


---

### F13: 用語説明の括弧が重複する

**重要度: medium / 対応済み**

構成整理後の外部再レビューで、Observability、Evaluation、Context、Artifact、Checkpoint、Contractなどの主要語について、初出・本文・8層で同じ意味説明が繰り返され、スマホでは説明の密度が本論より先に目に入る点が指摘された。

#### 対応

「初出で一度だけ意味を添える → 2回目以降は用語だけ → 8層では層名の横に短い説明だけ」というルールへ統一した。

主要6語について、括弧による意味説明はそれぞれ1回だけになっていることを確認した。

**判定: 解消。**

---

### F14: 最終タイトルと本文の用語整合

**重要度: low / 対応済み**

最終外部レビューで、次の2点がnitとして残った。

- Checkpointの直前にも同じ意味の説明があり重複していた
- タイトルは「AI駆動開発」だが、冒頭結論だけ「AIエージェント開発」になっていた

本文を次のように修正した。

- Checkpointの説明は初出の括弧説明だけに整理
- 冒頭結論の「AIエージェント開発」を「AI駆動開発」へ統一

**判定: 解消。**

---

### F15: 冒頭と結論で筆者自身の経験を前に出す

**重要度: medium / 対応済み**

noteディレクター、編集者、AI駆動開発の実務読者、初見読者、技術的に懐疑的な読者、シリーズ継続読者の複数視点で再確認した。

現行稿は内容・構成・一次情報は十分だった一方、冒頭が前記事の説明から始まるため、タイトルの「失敗をモデルのせいにしない」と筆者自身の経験がつながるまでに少し距離があった。

#### 対応

冒頭を次の流れへ変更した。

1. 短い自己紹介
2. Coding Agentを使ったAI駆動開発を試している現在地
3. 「Agentが失敗したとき、最初にModelの名前を見なくなった」という見方の変化
4. 失敗例を3つだけ提示
5. 改善していたのはModelの外側の仕組みだったという気づき
6. Harness Engineering / Agent = Model + Harness
7. 前記事のProduct Learning Loopとの接続
8. 今回の記事の問い

本文の「失敗を『モデルのせい』で終わらせない」と重複しないよう、冒頭の失敗例は詳細分類まで展開していない。

終盤では、PlanGate / River Review / Skills / Memory / Eval / Retrospectiveを以前は別々の仕組みとして見ていたが、今はHarnessとして一つのSystemで見るようになった、という筆者の現在地へ戻した。

結論は「どのModelを使うか」だけでなく「Modelの能力をどんなHarnessで仕事として成立させるか」まで含めてAI駆動開発を考える、という個人の見解で閉じる。

次記事のSpecification / Test / Domain Designへの接続は短く残した。

**判定: 解消。**

---

### F16: 冒頭のHarness定義で用語が再び密集する

**重要度: low / 対応済み**

外部再レビューで、冒頭をExperience起点へ改善した一方、その直後にContext / Tools / Memory / Runtime / Security / Observability / Evaluationを括弧説明付きで一気に並べるため、自己紹介からの勢いが落ちる点が指摘された。

冒頭は、

> ContextやTool、実行環境、観測、評価まで含めたSystemとして扱う

まで圧縮し、各要素の具体的な意味は本文側で回収する構成に変更した。

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
2. **note公開時の目次はON推奨**
   - H2は6本まで整理済みだが、長文なので途中から戻る導線としては有効。公開ブロッカーではない。
3. **タグ候補**
   - #AI
   - #生成AI
   - #AIエージェント
   - #AI駆動開発
   - #開発生産性

---

## 総合判定

**公開可能。must / highの未解決指摘なし。**

特に重要な補正は次の5点。

1. HarnessとModelを対立させず、end-to-end systemとして扱う
2. AWS / Anthropicの一次情報と筆者独自の8層モデルを明確に分ける
3. 前記事のTime to Learningを、Agent System自身のLearning Loopへ発展させる
4. Harness EngineeringをSoftware Engineeringの既存原則の再適用として一般化する
5. 論点を5段階の読者導線へ畳み、専門語を本文内で説明する

この5点によって、一般的な「Harness Engineeringとは何か」という解説記事ではなく、**筆者が最近考えていることを既存の実践と一次情報で整理したnote記事**として成立している。

PRマージ後は `articles_note/new/agent-harness-engineering-note.md` をcanonicalとしてWXR生成し、noteへ新規下書きとしてインポートする運用が適切。
