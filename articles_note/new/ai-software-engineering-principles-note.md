# AI駆動開発でSDDを考え直した。DiscoveryとDeliveryでは「先に定義するもの」が違った

> 区分: 個人

こんにちは、みねです。

AIに実装を任せるとき、自分は「何を満たせば完了なのか」を先に定義するようにしてきました。

PBIを用意し、リファインメントで理解を揃え、プランニングで対応内容を決める。そのうえで、仕様や完了条件を外に出し、設計と実行計画を作ってAgentへ渡す。

このやり方は、Deliveryではかなりうまく機能しています。

ところが、新しい価値を探るDiscovery側のPoCで、同じ型を使おうとすると噛み合わないことがありました。

最初は、

> DiscoveryではSDDが合わないのではないか

と考えました。

でも、今は少し違う捉え方をしています。

**SDDがDiscoveryに合わなかったのではなく、Delivery用に作ったSpecの型を、そのままDiscoveryへ当てていた。**

自分たちの開発では、DiscoveryとDeliveryを二つのサイクルとして回しています。

~~~text
Discovery                         Delivery

何を作る価値があるか             価値があると判断したものを
何を学ぶ必要があるか             どう正しく届けるか
        ↓                               ↓
仮説・実験・Evidence              PBI・Spec・実装・検証
~~~

この二つでは、同じ「先に定義する」でも、定義すべきものが違いました。

**Deliveryでは「何を満たせば完了か」をSpecifyする。**

**Discoveryでは「何を学べれば次を判断できるか」をSpecifyする。**

この記事では、探索的なPoCで感じた違和感から、SDDの使い方をどう考え直したかを書きます。

---

## SDDは「howの前にwhatを定義する」

今回考え直すうえで、GitHub Spec KitのSDDの説明が参考になりました。

GitHub Spec Kitでは、Spec-Driven Developmentを、**実装方法であるhowより先に、実現したいwhatを仕様として定義するIntent-drivenな開発**として説明しています。

実際、Spec Kitの基本Flowも、

~~~text
Specify
  ↓
Plan
  ↓
Tasks
  ↓
Implementation
~~~

となっていて、`/speckit.specify` では技術スタックではなく、まず「何を作るのか」「なぜ作るのか」に集中します。

自分もSDDを、**分かっているIntentを実装前に外へ出し、Agentが実行できる形へ変える方法**として捉えてきました。

ここで今回引っかかったのが、whatという言葉です。

Deliveryでは、「何を作るか」はある程度分かっています。

一方、Product Discoveryでは、**そのwhat自体に価値があるのかをまだ確かめている**ことがあります。

つまり、問題はSpecを書くタイミングだけではありませんでした。

**DiscoveryとDeliveryでは、Specifyする対象そのものが違う。**

この理解が、自分の中ではかなり大きな変化でした。

なお、GitHub Spec KitにもCreative Explorationという開発フェーズがあります。ただし、そこで扱われているのは複数の実装、技術スタック、Architecture、UX PatternなどのSolution探索が中心です。

この記事でいうDiscoveryは、**そもそもその価値を提供すべきかを確かめるProduct Discovery**を指しています。

---

## Deliveryでは「完了条件」をSpecifyする

自分たちのDelivery Flowでは、PBI単位でAI駆動開発を回しています。

~~~text
PBI
  ↓
リファインメント
  ↓
プランニング
  ↓
Spec・完了条件
  ↓
設計・実行計画
  ↓
AIによる実装
  ↓
検証
~~~

PBIは、Product Backlog Itemの略です。ここでは「今回実現したい変更や要求を、開発チームが扱える単位にしたもの」くらいの意味で使っています。

このFlowでは、PBIをそのままAgentへ渡しません。

なぜ作るのか。何を実現するのか。何ができれば完了なのか。何を変えないのか。何を検証するのか。

そうした条件を先に外へ出してから実装へ進みます。

この運用を仕組みにしたものの一つがPlanGateです。

### DONEは「何を満たせば完了か」

自分たちのFlowでは、PBIごとにDONEを置きます。

ここでいうDONEは、**何が満たされれば、この変更を完了と判断できるかという完了条件**です。

例えば、

> 管理者がユーザーを一時停止できるようにする

というPBIなら、

~~~text
目的:
管理者がユーザーを一時停止できる

DONE:
- 管理者だけが停止できる
- 停止されたユーザーはログインできない

変更しないこと:
- 認証方式そのものは変更しない
~~~

のように定義できます。

この状態なら、Agentに対して、

- 何を実現するか
- 何を変えないか
- どこまで進めればよいか
- 何をもって正しいと判断するか

を渡せます。

Deliveryでは、このSDDの型がかなりよく機能しました。

---

## Discoveryに同じSpecを当てると、価値仮説が完了条件になった

違和感が出たのは、既存プロダクトに新しい価値や体験を追加する探索的なPoCでした。

このPoCは、何も根拠がない状態から始めたわけではありません。

事前にユーザーインタビューなどを行い、

> こういう価値があれば、ユーザーにとって意味があるのではないか

という仮説は持っていました。

ただし、どんな形でその価値を届けるか、その体験自体に本当に価値があるかは、まだ検証が必要な状態でした。

ここでDeliveryと同じようにPBIを作り、DONEを置こうとしました。

例えば、構造だけを単純化すると、

~~~text
DONE:
- 新しい体験を利用できるようにする
~~~

とは書けます。

Softwareとしては、この条件を満たせます。

でも、PoCで本当に確かめたかったのは、

> **その体験に、ユーザーにとって価値があるのか**

でした。

つまり、

~~~text
実装として決められること:
- 新しい体験を利用できるようにする

まだ確かめる必要があること:
- その体験自体に価値があるか
- この提供方法が適切か
~~~

が混ざっていました。

前者は完了条件です。

後者は価値仮説です。

ここを区別せずにDeliveryのSpecへ入れると、

**「価値があるかもしれない」が「これを作るべき」に変わってしまう。**

そしてAgentは、その区別をしてくれません。

こちらが価値仮説を要件として渡せば、その仮説も忠実に実装します。

結果として、

**間違った仮説を、高い品質で、速く実装する**

ことが起こり得ます。

これはSDDの欠点ではありません。

**Specifyする対象を間違えていた**ことが問題でした。

---

## Discoveryでは「学習条件」をSpecifyする

ここまで考えて、自分の結論は、

> DiscoveryではSDDを使わない

ではなくなりました。

むしろ、**Discovery用のSDDが必要だった**と考えています。

ここでいう「Discovery用のSDD」は、GitHub Spec Kitの公式用語ではありません。自分たちの運用を考えるための呼び方です。

Deliveryで先に定義するのが完了条件なら、Discoveryで先に定義したいのは、

- どんなProblemを見ているのか
- どんなValue Hypothesisを持っているのか
- 何を確かめたいのか
- 何が観測できれば次を判断できるのか
- どんなEvidenceを得たいのか
- どの条件なら仮説を見直すのか
- 今回は何を固定しないのか

です。

例えば、実際の案件内容は伏せたうえで、今ならPoCのSpecを次のように考えます。

~~~text
Problem:
既存の利用体験だけでは、まだ満たせていない課題がある

Value Hypothesis:
既存フローに新しい体験を加えることで、
ユーザーに追加の価値を届けられる

Learning Conditions:
- 対象ユーザーが、実際の利用文脈の中でその体験を使うか確認できる
- 使われなかった場合、価値そのものの問題か、
  提供方法の問題かを切り分ける材料を得る

Evidence:
- 次の試作を続けるか
- 仮説を見直すか
を判断できる観測結果を残す

今回まだ固定しないこと:
- 本実装としての最終仕様
- この提供方法を継続すること
~~~

Discoveryだから何も決めないわけではありません。

**決める対象が違う。**

~~~text
Delivery
何を満たせば実装完了かをSpecifyする

Discovery
何を学べれば次を判断できるかをSpecifyする
~~~

この違いです。

### 仮説だと分かったら、DONEを捨てるのではなく書き換える

ここも今回の学びでした。

DONEを書いていて、そこに価値仮説が混ざっていると気づいたからといって、実装をすべて止める必要はありません。

価値仮説の部分を完了条件から外して、**学習条件へ書き換える。**

そして、その学習に必要な最小限の試作だけをAgentへ渡す。

~~~text
価値仮説
  ↓
Learning Conditions
  ↓
最小限のExperiment
  ↓
Evidence
  ↓
Decision
~~~

価値が確認できたら、その後でDelivery側のPBIとして完了条件を定義すればよい。

こう考えると、DiscoveryとDeliveryは別々の世界ではなく、自然につながります。

---

## DiscoveryとDeliveryで、Agentへ渡すContractを変える

前回、「[失敗をモデルのせいにしない。AI駆動開発を『Model + Harness』で考える](https://note.com/mine_unilabo/n/nd6a5d83d1488)」という記事を書きました。

そこで、Agentを正しく動かすためのHarnessの土台として、目的、完了条件、制約、停止条件などを含むContractを考えました。

今回の経験で、その続きを一つ理解できた気がします。

**Contractは必要。でも、DiscoveryとDeliveryでContractの中身を同じにしてはいけない。**

自分の中では、今こう整理しています。

~~~text
Discovery Contract
- Problem
- Value Hypothesis
- Learning Conditions
- Evidence
- 見直す条件
- 今回固定しないもの

            ↓ Evidence / Decision

Delivery Contract
- Intent
- Completion Criteria
- Constraints
- Verification
- Stop Conditions
~~~

HarnessがAgentに「どう動くか」を支えるものだとしたら、SDDはそのAgentへ**何を先に渡すか**を考えるものとして見えてきました。

そして、その「何を」は一種類ではありません。

Discoveryでは、学習すべきことを渡す。

Deliveryでは、実現すべきことを渡す。

---

## SDDがAI駆動開発に合わないのではなかった

今回、最初に感じていた違和感は、

> PoCではSDDが噛み合わない

でした。

今は、こう考えています。

**SDDがAI駆動開発に合わないのではない。DiscoveryなのかDeliveryなのかを見極めず、同じSpecの型を使っていた。**

Product Developmentでは、DiscoveryとDeliveryがいつもきれいに分かれるわけではありません。

Deliveryしながら新しいことが分かることもありますし、Discoveryでも実装は必要です。

だから分類そのものが目的ではありません。

重要なのは、**いま減らそうとしている不確実性が何か**を見ることです。

自分自身、これからAgentへPBIやSpecを渡す前に、まず次の2つを確認したいと思っています。

- **いま必要なのは、価値を確かめることか。それとも、価値があると判断したものを届けることか**
- **このSpecで先に定義すべきなのは、完了条件か。それとも学習条件か**

Deliveryなら、完了条件をSpecifyする。

Discoveryなら、学習条件をSpecifyする。

SDDを使うか使わないかではなく、**何をSpecifyするのかを変える。**

今回のPoCから得た、一番大きな学びです。

---

## 参考

- GitHub Spec Kit「What is Spec-Driven Development?」
  - SDDを、howより先にwhatを定義するIntent-drivenな開発として整理する際の参考
  - https://github.com/github/spec-kit/blob/main/docs/concepts/sdd.md
- GitHub Spec Kit README
  - `/speckit.specify` でwhat / whyを定義し、Plan / Tasks / Implementationへ進むFlowの参考
  - https://github.com/github/spec-kit
- 前回の記事「失敗をモデルのせいにしない。AI駆動開発を『Model + Harness』で考える」
  - https://note.com/mine_unilabo/n/nd6a5d83d1488
