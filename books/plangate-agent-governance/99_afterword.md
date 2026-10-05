---
title: "おわりに — AIを信頼するのではなく、任せられる環境を作る"
---

この本の出発点は、AIの性能評価ではありませんでした。

> **AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をどう作るか。**

という問いでした。

AIがさらに賢くなれば、コードを書く速度はもっと上がるかもしれません。

長いタスクも、複数ファイルの変更も、PR後のrepairも、今より広く任せられるようになるでしょう。

それでも残る問いがあります。

- 何を任せてよいのか
- 何を根拠に進めるのか
- 何を確認すれば完了なのか
- 前提が変わったらどこで止まるのか
- 誰が最後に決めるのか

これはモデル能力だけでは決まりません。開発環境側の設計です。

## この本で分けてきたもの

本文では、似て見えるものを何度も分けました。

~~~text
Artifact != Evidence
Verification != Review != Judgment
Autonomy != Authority
PR_CREATED != MERGE_READY
MERGE_READY != MERGED
~~~

そして、会話の中に埋め込まれていた状態や判断を、Plan / Approval / Evidence / Handoff / Review Package / Gate / Policyとして外へ出しました。

これらを増やすこと自体が目的ではありません。

**AIの自己申告だけに依存せず、次の主体が現在状態を確認できること。**

そのための手段です。

## 人間を増やすためのGovernanceではない

判断境界を置くというと、人間の承認作業を増やす話に見えます。

本書で目指したのは逆です。

~~~text
境界の内側
→ AIへできるだけ任せる

境界を越える
→ Stop / Escalateする

重要なdecision
→ Authorityを明示する
~~~

こうすることで、人間が細かなstepへ張り付く必要を減らします。

人間に残したいのは、AIができる単純作業ではなく、residual risk / business context / priority / accountabilityを含むJudgmentです。

## Harness自身も信頼しすぎない

Hookがある。CIがgreen。doctorがOK。

それだけで「守れている」とは扱いませんでした。

Harnessもsoftwareなので、Detect → Reproduce → Fix → Regression → Independent Eval → Promotion → Production Observation の対象になります。

AIを囲う仕組みそのものも検証する。

ここまでやって初めて、「AIを信じる」ことから少し離れられます。

## 最後に

AI駆動開発が「AIにコードを書かせること」だけなら、モデルが進化するほど方法論は古くなるかもしれません。

しかし、仕事を任せるという観点に立つと、問題は少し違って見えます。

> **何を任せるか。  
> 何を証拠にするか。  
> どこで止めるか。  
> 誰が決めるか。**

この4つを設計できれば、モデルやAgentが変わっても、開発の判断境界は残せます。

PlanGateは、その一つの実装です。

この本で扱ったBoundary / Evidence / Authorityの分け方も、唯一の正解ではありません。

既存CI、既存の承認flow、別のAgent frameworkで同じ責務を満たせるなら、それを使えばよい。

重要なのはPlanGateを採用することではなく、**自分の開発環境で誰が何を根拠に次へ進むのかを説明できること**です。

この本から持ち帰ってほしいのはPlanGateの略号ではありません。

> **AIを信頼できるかを悩む前に、信頼しなくても任せられる環境を設計する。**

という視点です。
