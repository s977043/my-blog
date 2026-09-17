---
title: "Webメディアを4つのリポジトリに分けた。分けたかったのはコードではなく「変更理由」だった"
date: 2026-09-11
status: seed
topics:
  - media-operating-system
  - architecture
  - separation-of-concerns
  - ai-agent
  - growth
source: experience
promoted_to:
---

# Webメディアを4つのリポジトリに分けた。分けたかったのはコードではなく「変更理由」だった

Webメディアを作り、その先の収益化まで仕組みにしようとした。

記事を書く。  
Webサイトで届ける。  
アクセスを計測する。  
SNSや広告で広げる。

一つひとつを見ると、それほど複雑ではない。

ところが、これらを継続的な運用としてつなげ始めると、境界が急速に曖昧になっていった。

記事を改善するためにアクセスデータを見る。

流入を増やすためにSNSで再配信する。

その施策を評価するために計測を追加する。

CVを改善するためにWebサイトの導線を変える。

全部が「メディアを成長させる」という同じ目的につながっている。

だから、一つのリポジトリに全部置くこともできる。

むしろ初期段階では、その方が簡単に見える。

しかし設計を進める中で、一つの違和感が出てきた。

**これらは同じ目的を持っているが、同じ理由では変更されない。**

そこで現在は、仕組みを4つの境界に分けている。

| Boundary | 扱うもの | 主な問い |
| --- | --- | --- |
| Content | 記事・動画などのコンテンツ | 何を作るか |
| Media | Webメディア本体 | どう届けるか |
| Intelligence | 計測・分析 | 何が起きたか |
| Growth | SNS・広告・改善施策 | 次に何をするか |

Webメディアを4つに分けたかったわけではない。

**「何を作るか」「どう届けるか」「何が起きたか」「次に何をするか」という、異なる変更理由を分離したかった。**

現時点では、これをArchitecture Hypothesisとして扱っている。

## 最初は単なるリポジトリ整理だった

最初に考えていたのは、もっと単純な分類だった。

記事を作る場所。

Webサイトを作る場所。

データを分析する場所。

SNSや広告を運用する場所。

つまり、作業の種類ごとの整理だ。

しかし具体的な変更を当てはめていくと、別の見方ができることに気づいた。

たとえば、記事の主張やタイトルを変更する。

これはContentの変更だ。

一方で、記事ページの表示速度を改善する。

これはMediaの変更で、記事そのものを変更する理由にはならない。

「どの記事からCVしたのか」を知りたいなら、Intelligenceを変更する。

その分析結果から「この記事をもう一度SNSで届けよう」と判断したなら、Growthが変わる。

同じWebメディアを扱っていても、それぞれを動かす理由は違っている。

ここから、

**機能ではなく、Reason to Changeで境界を考えた方がよいのではないか**

という仮説を持つようになった。

## Content — 何を作るか

Contentでは、ユーザーへ届ける中身を扱う。

記事、動画、タイトル、構成、説明、編集方針などだ。

ここで中心になる問いは、

**何を伝えるのか。何を作るのか。**

記事の主張を変えるためにWebアプリケーションの実装を知る必要はないし、広告配信ロジックを変更する必要もない。

AI Agentに作業を任せる場合も、主な評価対象はコンテンツの正確性や有用性、読みやすさになる。

## Media — どう届けるか

Mediaは、そのコンテンツをユーザーへ届ける仕組みを扱う。

UI、UX、SEO、表示速度、配信、回遊導線、CMSとの接続などだ。

中心になる問いは、

**コンテンツをどう届けるのか。**

ContentとMediaは近い。

しかし、

「記事の内容を改善したい」

と、

「記事を高速に表示したい」

では変更理由が違う。

そのため、現在は別の境界として扱っている。

## Intelligence — 何が起きたか

Intelligenceでは、ユーザーの行動や施策の結果を観測する。

アクセス、検索流入、CV、回遊、流入元などを収集・分析する。

中心になる問いは、

**実際に何が起きたのか。**

ここで重視しているのが、ObservationとDecisionを分けることだ。

たとえば、

「検索流入が20%減った」

という観測と、

「SNS投稿を増やそう」

という判断は同じではない。

Intelligenceでは、できるだけ事実と分析を扱う。

次の行動を決めることとは分離しておきたい。

## Growth — 次に何をするか

Growthでは、観測結果から次の行動を考え、実行する。

SNS投稿、広告、コンテンツの再配信、実験、改善施策などだ。

中心になる問いは、

**次に何をするのか。**

全体としては、次のようなループになる。

```text
Content
   ↓
Media
   ↓
Audience
   ↓
Intelligence
   ↓
Growth
   └──────→ Content / Media
```

4つの境界は、それぞれ独立したシステムを作りたいから存在しているわけではない。

**一つのGrowth Loopを、異なる変更理由で分けている。**

## なぜIntelligenceとGrowthを分けたのか

4つの中で、最後まで迷ったのがIntelligenceとGrowthだった。

この2つをまとめれば、3つの境界で済む。

実装や運用だけを考えれば、その方が単純かもしれない。

それでも現時点では分けている。

理由は、

**ObservationとDecision / Actionを分離したいからだ。**

これはAI Agentを使う場合に特に重要になる。

たとえば分析Agentには、分析に必要なデータソースを読む権限を持たせたい。

しかし、そのAgentが分析結果を根拠に、そのまま広告費を変更したり、外部へ投稿したりする必要はない。

概念的には、

```text
Intelligence
Read only required data
↓
Observe / Analyze / Recommend

Growth
Write only approved targets
↓
Decide / Execute
```

という違いを作れる。

Observation側には分析に必要な範囲のRead権限。

Action側には、実行対象を限定したWrite権限。

どちらにも必要最小限の権限だけを与える。

Repository BoundaryがそのままSecurity Boundaryになるわけではないが、責務が分かれている方がLeast Privilegeを設計しやすい。

コード整理だけではなく、

**「誰が何を読み、何を変更できるか」まで含めた境界**

として意味を持つのではないかと考えている。

## では、もっと細かく分ければよいのか

逆に、SNSと広告を別々にすることもできる。

Content、Media、Intelligence、SNS、Adsの5つにする、といった構成だ。

将来、SNS運用と広告運用が十分に大きくなれば、その方が自然かもしれない。

しかし今は分けない。

理由は、現時点ではどちらも、

**観測結果から次のGrowth Actionを実行する**

という同じ変更理由の中にあるからだ。

境界を増やせば独立性は高くなる。

一方で、Contract、認証、CI/CD、Issue管理、横断変更などのCoordination Costも増える。

**分割できることと、分割すべきことは違う。**

現時点で4つにしているのは、「4が美しいから」ではない。

これ以上まとめると違う変更理由が混ざり、これ以上分けると運用コストの方が大きくなると考えたからだ。

## ソフトウェア設計の考え方とも接続できる

この構造を考えた後で振り返ると、既存のソフトウェア設計の考え方と似ている部分がある。

Separation of ConcernsやSingle Responsibility Principleには、異なる理由で変更されるものを分離するという考え方がある。

DDDのBounded Contextも、異なるモデルや言語を境界で分ける。

Team Topologiesにも、チームが独立して価値を届けられる境界をどう作るかという視点がある。

今回の設計と親和性は高い。

ただし、これらと同じものだとは考えていない。

**Repository BoundaryとBounded Contextは同義ではない。**

リポジトリはあくまで実装上の境界の一つにすぎない。

今回もDDDやTeam Topologiesから4リポジトリを導出したわけではない。

実際の運用を考える中で、

「ここは変更される理由が違う」

と分けていった結果、既存の設計原則とも接続できそうだと気づいた。

だから現時点では、

**既存理論によって正解が保証された設計**

ではなく、

**既存理論とも矛盾しにくい、これから検証する設計仮説**

として扱っている。

## リポジトリを分けるだけでは、境界にはならない

ここも重要だと思っている。

GitHub上でリポジトリを4つ作れば責務分離が完成するわけではない。

むしろ、分けた後の方が難しい。

ContentからMediaへ何を渡すのか。

MediaはIntelligenceへ何を観測可能にするのか。

IntelligenceはGrowthへ何を提供するのか。

GrowthはContentやMediaへ、どこまで変更を要求・実行できるのか。

境界を成立させるには、

```text
Boundary
+
Contract
+
Permission
+
Observability
```

まで考える必要がある。

たとえば、毎回Content側の内部実装をGrowth側が直接読まなければ施策を作れないなら、リポジトリだけ分かれていても実質的には密結合だ。

逆に、安定したContractを介してやり取りできるなら、内部を独立して変更しやすくなる。

AI Agentを入れるほど、この差は大きくなると考えている。

## 検証したい仮説は、一つではない

ここまで書いておいて、この4境界が正しいとはまだ言えない。

2026年9月11日時点では、採用したばかりのArchitecture Decisionだ。

ただし、運用で検証したい仮説を整理すると、少なくとも二つある。

### Boundary Hypothesis

一つ目は、Content / Media / Intelligence / Growthという4つの境界が、実際のReason to Changeと合っているか。

ここで見たいのは、境界ごとに独立して変更できること、境界をまたぐ調整コストが許容範囲に収まること、Agentの権限を責務に合わせて制限できることだ。

### Shared Core Hypothesis

二つ目は、IntelligenceやGrowthの一部を複数媒体で共有できるか。

これはBoundary Hypothesisとは別の仮説だ。

2媒体目でIntelligenceやGrowthの実装を共有できなかったとしても、同じ4境界がそれぞれの媒体で機能するなら、Boundary Hypothesisまで失敗したことにはならない。

逆に、Shared Coreを再利用できても、変更のたびに複数境界を巻き込んだり、権限分離が崩れたりするなら、境界設計が成功したとは言いにくい。

**境界の妥当性と、実装の再利用性を同じ判定にしない。**

ここは分けて観測する。

## 何を測るか

検証指標も、二つの仮説とフローへの影響を分けて見る。

| 観点 | 指標 | 見たいこと |
| --- | --- | --- |
| Boundary | Unexpected Cross-repo Change Rate | 本来は独立しているはずなのに、複数境界の同時変更が必要になった頻度 |
| Boundary | Coordination Cost per Change | 境界をまたぐ変更で必要になった調整・レビュー・待ち時間 |
| Boundary | Contract Breaking Change Rate | 境界間Contractの破壊的変更がどれくらい発生したか |
| Boundary | Permission Isolation | Agentや自動化のRead / Write権限を責務ごとに限定できているか |
| Shared Core | Core Reuse Rate | 2媒体目で共通実装をどこまで再利用できたか |
| Shared Core | Media-specific Override Rate | 共通化した部分に媒体固有の例外がどれくらい必要になったか |
| Flow | Time to Publish | コンテンツ作成から公開までの時間 |
| Flow | Time to Experiment | 仮説を持ってから施策を実行し、観測可能になるまでの時間 |
| Flow | New Media Lead Time | 新しい媒体を立ち上げ、最初の検証を開始できるまでの時間 |

単純なCross-repo Change Rateだけでは判断しない。

たとえば計測イベントの仕様を変えるとき、MediaとIntelligenceを同時に変更することは自然に起こり得る。

問題にしたいのは、**本来独立しているはずの変更まで、予期せず別の境界を巻き込むこと**だ。

Contractも、変更回数だけでは判断しない。

立ち上げ直後のDiscoveryでは、Contractが頻繁に変わること自体は不自然ではない。

見るべきなのは、破壊的変更によってどれだけ調整が発生したか、そして運用を続ける中でContractが安定する方向へ収束しているかだと思っている。

さらに、Architectureが綺麗でも、公開や実験のLead Timeが悪化していれば目的を達成していない。

```text
Architecture
    ↓
Flow
    ↓
Business Outcome
```

というつながりまで見たい。

現時点では収益などのBusiness Outcomeへ直接因果を置くには早いので、まずはTime to PublishやTime to Experimentのような、Architectureから近いフロー指標を観測する。

数字そのものより、

**どんな事実が出たら、どの仮説を疑うのか**

をあらかじめ分けて持っておきたい。

## 2媒体目では、二つの仮説を分けて検証する

2媒体目は、このArchitectureを検証する重要な機会になる。

ただし、検証したいことは「共通コードをどれだけ使えたか」だけではない。

たとえば2媒体目が、

```text
Medium A                        Medium B
├ Content A                     ├ Content B
├ Media A                       ├ Media B
├ Intelligence A                ├ Intelligence B
└ Growth A                      └ Growth B
```

のように媒体ごとの実装を持ったとしても、4つの境界が同じReason to Changeで機能し、独立変更しやすければBoundary Hypothesisには意味がある。

一方で、次のように一部を共有できる可能性もある。

```text
Medium A
Content A ─┐
           ├→ Shared Intelligence / Growth
Medium B   │
Content B ─┘
```

これが無理なく成立すれば、Shared Core Hypothesisにも一定の根拠が得られる。

逆に、Shared Coreを作るために媒体固有の例外が大量に増えるなら、共通化しない方がよいかもしれない。

だから2媒体目では、

1. 同じ境界構造を再現できるか
2. 運用フローを再現できるか
3. 実装のどこまでを安全に共有できるか

を別々に見る。

**「同じ設計を再現できること」と「同じコードを再利用できること」は同じではない。**

## Media Operating Systemを作っているのかもしれない

最初に作ろうとしていたのは、一つのWebメディアだった。

しかし設計を進めるうちに、

```text
Create
  ↓
Deliver
  ↓
Observe
  ↓
Decide / Act
  ↓
Create / Deliver ...
```

という循環そのものを作っているように見えてきた。

Contentを作る。

Mediaで届ける。

Intelligenceで観測する。

Growthで次の行動を決める。

またContentやMediaへ戻す。

もしこれを複数のメディアで再現できるなら、作っているものは個別のWebメディアだけではない。

**Webメディアを作り、届け、計測し、改善し続けるためのMedia Operating System**

と呼べるかもしれない。

ただし、ここでいう再利用は共通コードだけを意味しない。

- 境界の切り方を再利用できる
- Contractの考え方を再利用できる
- Agentの権限モデルを再利用できる
- 計測から施策へ戻す運用フローを再利用できる
- その上で、共通化に意味がある実装だけをShared Coreとして再利用できる

この順番で考えたい。

コードを共有できなくても、設計や運用モデルを再現できる可能性はある。

逆に共通コードだけ増えても、媒体を増やすたびに調整コストが膨らむならOperating Systemとは呼びにくい。

名前を付けたことで完成した気にならず、2媒体目以降でどのレイヤーまで再現できたかを検証する。

## 「4」が本質ではない

今回の判断で、一番残しておきたいのは4という数字ではない。

**Boundary by Reason to Change**

という考え方だ。

同じ理由で変わるものは近くに置く。

違う理由で変わるものは分ける。

分けたことでCoordination Costが増えすぎるなら、また戻す。

そして、設計が正しかったかを感覚だけではなく、実際の変更履歴や運用データで確認する。

現時点では、

```text
Content
Media
Intelligence
Growth
```

という4つの境界から始める。

これが正解だったかは、まだ分からない。

予期しないCross-repo変更を追う。

Contractの破壊的変更と調整コストを見る。

AI Agentの権限分離が本当に効くか確かめる。

公開や実験のLead Timeがどう変わるかを見る。

そして2媒体目では、境界の再現性とShared Coreの再利用性を別々に検証する。

結果が悪ければ、境界も共通化の範囲も変える。

だからこの記事も、完成したArchitectureの説明としてではなく、

**Architecture Decisionを実運用で検証していく記録**

として残しておきたい。

## 次に試したいこと

- [ ] Unexpected Cross-repo Change Rateを1か月分記録する
- [ ] Cross-repo変更ごとの調整・レビュー・待ち時間を記録する
- [ ] 境界間Contractの破壊的変更と、その変更コストを追う
- [ ] AgentごとのRead / Write権限が境界と一致しているか確認する
- [ ] Time to Publish / Time to Experimentを観測し、分割前後の変化を見る
- [ ] 2媒体目で同じ境界構造・運用フローを再現できるか検証する
- [ ] 2媒体目でIntelligence / GrowthのどこまでをShared Core化できるか別途検証する
- [ ] Shared Coreに媒体固有の例外がどれだけ発生するか記録する

## 追記ログ

### 2026-09-11

- Content / Media / Intelligence / Growthの4境界を採用
- 「4リポジトリがベストプラクティス」という主張ではなく、Reason to Changeによる境界設計の仮説として記録
- 成功判定をCross-repo Change Rate / Contract Stability / Permission Isolation / Core Reuse Rate / Reproducibilityで検証する方針にした
- 2媒体目での再利用性を重要な検証ポイントとした

### 2026-09-17

- 別視点レビューを受け、Boundary HypothesisとShared Core Hypothesisを分離
- 単純なCross-repo Change Rateではなく、Unexpected Cross-repo Change RateとCoordination Costを重視する方針へ変更
- Contractの変更回数ではなく、破壊的変更・変更コスト・時間経過による収束を見る方針へ変更
- Architecture内部の指標だけでなく、Time to Publish / Time to Experiment / New Media Lead Timeを観測対象へ追加
- 2媒体目では「境界構造の再現」「運用フローの再現」「Shared Coreの再利用」を別々に判定する方針へ変更
