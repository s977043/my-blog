# Planを「実装手順」ではなく、判断の入力にする

前章までで、PlanGateは「次へ進める条件」を設計する仕組みだと整理しました。

その最初の大きな境界が、実装前です。

ここで必要なのは、AIに細かい作業手順をすべて書かせることではありません。

> **何を実装してよいのか、何を実装してはいけないのか、何を満たせば成功なのかを、判断できる形にすること。**

そのためにPlanを使います。

## この章では「良いPlanの書き方」は扱わない

既存の `plangate-guide` では、

- Why
- In Scope / Out of Scope
- Acceptance Criteria
- 設計案比較
- タスク分解
- test-cases
- Plan Review

など、Planそのものの作り方を詳しく扱っています。

この新しいBookでは、そこを繰り返しません。

ここで見るのは、

> **PlanがGovernanceの中で何を固定し、後段のGateやVerificationへ何を渡すのか**

です。

## Requirementから、判断できる状態へ変える

要求は、そのままでは実行許可の入力にならないことがあります。

たとえば、前章から使っている架空のタスクを続けます。

> 注文一覧APIにstatus絞り込みを追加したい。

これだけでも実装は始められます。

しかし、実行前に判断したいことは残っています。

- 既存のquery parameterへ追加するのか
- DB schema変更は必要か
- statusの不正値はどう扱うか
- paginationと組み合わせた挙動はどうするか
- 認可条件へ影響するか
- 今回はどこまでを対象にするか

Planは、こうした未確定要素を「実装可能な説明」へ変えるだけではなく、**承認可能な境界**へ変えます。

たとえば、

~~~text
Goal
statusで注文一覧を絞り込める

In Scope
- GET /orders の status query parameter
- 正常値 / 不正値
- pagination併用

Out of Scope
- DB schema変更
- status定義の追加
- 管理画面UI変更

Acceptance
- valid statusで期待した注文だけ返る
- invalid statusは400
- paginationと併用できる
~~~

まで決まれば、「この範囲なら進めてよいか」を判断できます。

## Scopeは「やること」より「勝手に広げないこと」を決める

AIエージェントは、実装中に追加の問題を見つけます。

たとえば、

> status filterをきれいに実装するなら、status定義も整理した方がよい。

という提案が出るかもしれません。

それ自体は良い提案です。

しかし、良い提案であることと、今回実装してよいことは別です。

Out of Scopeに「status定義の変更なし」と書いてあれば、追加変更は自動的に「善意の改善」ではなく、**scope変更として判断へ戻す対象**になります。

PlanGateでScopeを重視する理由はここです。

## Acceptance Criteriaは「完成イメージ」ではなく検証の入力

Acceptance Criteriaも、読みやすい要望を書くためだけのものではありません。

後段のVerificationが、

> 何を確認すれば、このPlanで決めた仕事を満たしたと言えるか

を判断する入力です。

~~~text
Requirement
「statusで絞り込みたい」
        ↓
Acceptance Criteria
「valid statusで対象だけ返る」
「invalid statusは400」
「paginationと併用できる」
        ↓
test-cases
        ↓
Verification
~~~

このつながりがあると、実装後に都合のよいテストだけを選んで「完了」と言いにくくなります。

## UnknownsとAssumptionsを隠さない

Planをきれいに見せようとすると、未確認のことまで断定したくなります。

しかしGovernance上は逆です。

分からないことは、分からないまま見える方がよい。

~~~text
Unknown
既存APIがstatus enumをどこで定義しているか未確認

Assumption
DB schema変更なしで対応可能と仮定
~~~

と残せば、次に必要なのは「もっと考えること」ではなく「確認すること」だと分かります。

ここが次章のEvidenceにつながります。

## todoとtest-casesをPlanから分ける理由

PlanGateでは、Planと同時にtodoやtest-casesを作ります。

これは文書を増やすためではありません。

役割が違うからです。

~~~text
Plan
= 何を、どの境界で進めるか

todo
= そのPlanをどの順序で実行するか

test-cases
= 何を確認すれば満たしたと言えるか
~~~

この3つを一つに混ぜると、「設計を変えた」のか「実行順を変えただけ」なのか「検証条件を変えた」のかが曖昧になります。

## PlanはApprovalの入力になる

ここがこの章の中心です。

~~~text
Planが存在する
       ↓
Reviewされる
       ↓
必要な修正が入る
       ↓
Approvalの対象になる
       ↓
初めてExecutionへ進める
~~~

Planは「参考情報」ではなく、**実行許可の対象**になります。

そのため、承認後にPlanの意味が変われば、Approvalの意味も変わります。

たとえば承認時は「DB schema変更なし」だったのに、その後Planへmigration追加が入ったなら、それは同じPlanではありません。

実装者が同じでも、AIモデルが同じでも、**承認した対象が変わった**ということです。

PlanGateがplan hashなどで承認対象との整合を確認するのは、この境界を扱うためです。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/plangate.md
- https://github.com/s977043/PlanGate/blob/main/docs/c3-approval-command.md

## この章で持ち帰ること

Planの役割は、AIへ丁寧な実装手順を渡すことだけではありません。

> **後段のReview / Approval / Verificationが、何を対象に判断するかを固定する。**

これがGovernanceにおけるPlanの役割です。

ただし、Planの中に未確認の推測が残ったままでは、きれいな境界を作っても判断材料が弱いままです。

次章では、UnknownやAssumptionをどうEvidenceへ変えるかを見ます。
