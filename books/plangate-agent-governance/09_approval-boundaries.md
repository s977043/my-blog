# Review済みと「実行してよい」を分ける — Approval Boundary

Planを作り、Evidenceを集め、Reviewで問題を減らしました。

ここで、すぐ実装へ進んでよいでしょうか。

PlanGateでは、ここを分けます。

~~~text
Review済み
    ≠
Approved
~~~

Reviewは問題を探す仕事です。

Approvalは、**そのPlanを実行対象として扱ってよいかを決める仕事**です。

この境界がApproval Boundaryです。

## ReviewでPASSしても、Authorityは自動的に移らない

たとえば、注文一覧APIのPlanについて、

- Self Review: 問題なし
- Independent Review: 重大な問題なし
- test-cases: 十分
- Scope: 明確

だったとします。

それでも、

> 今回のリリースへ入れるか  
> このscopeを実行してよいか  
> 残るリスクを受け入れるか

という判断は残ります。

Review結果は、そのJudgmentの材料です。

Review Agentが「PASS」と言ったから、そのAgentに実行権限まで自動的に渡るわけではありません。

## C-1 / C-2 / C-3は役割が違う

PlanGateでは、Planの実装前に複数の確認点を持ちます。

### C-1 — Self Review

Planを作った側が、構造的な抜けを確認します。

たとえばScope、Acceptance Criteria、Risks、test-casesなどです。

これは「自分で書いたから正しい」とするのではなく、明示したチェック項目で一度崩す工程です。

### C-2 — Independent / External Review

Modeや運用に応じて、別のReviewerや外部モデルからPlanを見ます。

目的は、同じ文脈・同じ作成者だけでは気づきにくい問題を探すことです。

すべての軽いタスクで最大構成のC-2が必要なわけではありません。

### C-3 — Approval Boundary

ここで初めて、

> このPlanをExecutionへ渡してよいか

を判断します。

重要なのは、「必ず人間がクリックすること」ではありません。

> **どの条件なら誰にApproval Authorityを渡せるかが、先に定義されていること。**

です。

## Riskに応じてApproval Authorityを変える

現行PlanGateでは、人間承認を残すケースと、限定的に自律承認できるケースを分けています。

概念的には次のようになります。

| 状況 | Authority |
| --- | --- |
| ultra-light / lightの低リスク作業 | 軽いGateや自動化余地あり |
| 明示的に自律実行を委任された一部standard | 条件を満たせばAutonomous APPROVEの余地あり |
| high-risk / critical | Human C-3 |
| Hardening Override | Human C-3 |
| schema / destructive / security関連 | Human C-3 |
| ai-loopのeligible run | C-3'の限定経路あり |
| PRの最終受入 | C-4 Human-owned |

詳細条件は今後変わりうるため、このBookでは個別ルールより原則を重視します。

> **リスクが上がるほど、Authorityを自動化側からHuman-owned boundaryへ戻す。**

## APPROVE / CONDITIONAL / REJECT

PlanGateのC-3では、判断を三値で扱います。

### APPROVE

このPlanでExecutionへ進める。

### CONDITIONAL

Planの骨格は使えるが、条件や修正が必要。

現行のC-3 approval commandでは、条件付き承認時にconditionsを記録します。

### REJECT

前提や設計を見直し、Plan生成側へ戻る。

三値にする理由は、「OK / NG」だけでは扱いづらい現実的な判断を残すためです。

ただし、CONDITIONALを「何となくOK」として使うと境界が弱くなります。

何を満たせば進めるのかを条件として残すことが重要です。

## 承認対象はPlanそのもの

Approval Boundaryを機能させるには、

> 何を承認したのか

が分からなければなりません。

PlanGateのC-3 approval artifactには、承認対象の `plan_hash` を記録します。

これは、「承認というイベントがあった」だけでなく、

> **この内容のPlanを承認した**

という紐づきを持つためです。

~~~text
Plan v1
  ↓
Approval(plan_hash = v1)
  ↓
Planがv2へ変更
  ↓
Approval対象と不一致
~~~

となれば、同じ承認をそのまま使うべきではありません。

承認後のPlan変更を検出するHookも、この境界を守るためにあります。

## 「承認した後に分かったこと」は止まる理由になる

実装を始めた後に、新しい事実が見つかることがあります。

たとえば、

> schema変更なしで実装できると承認したが、実際にはmigrationが必要だった。

このとき、AIが「目的は同じなので続けます」と判断すると、Approval Boundaryは意味を失います。

~~~text
新しいEvidence
      ↓
承認時の前提を壊す
      ↓
Scope / Risk / Planが変わる
      ↓
Executionを止める
      ↓
Review / Approvalへ戻る
~~~

ここで止まれることが重要です。

## Human Presenceも「絶対防御」とは書かない

現行PlanGateの `plangate approve` は、人間の承認判断をJSON手書きにせず、対話TTY・環境・親process・nonce challengeなどでhuman presenceをbest-effortに確認し、approval artifactを生成します。

重要なのは、PlanGate自身がこれを**絶対的なsecurity boundaryとは主張していない**ことです。

疑似TTYなどを使う高度な自動化への限界も公開文書に明記されています。

このBookでも、

> Approval Boundaryがある = 技術的に突破不能

とは扱いません。

ここで設計しているのは、Authorityとprovenanceを曖昧にしないための境界です。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/plangate.md
- https://github.com/s977043/PlanGate/blob/main/docs/c3-approval-command.md
- https://github.com/s977043/PlanGate/blob/main/docs/pages/reference/glossary.md

## この章で持ち帰ること

Approval Boundaryの核心は、

> **Reviewが終わったことと、Execution Authorityを渡したことを分ける。**

ことです。

そのために、

- Planを判断対象にする
- ReviewとApprovalを分ける
- Approval対象をPlanへbindする
- 前提やscopeが変われば止まる
- Riskに応じてAuthorityを変える

という構造を作ります。

これで第3部の流れがつながりました。

~~~text
Requirement
  ↓
Planで境界を作る
  ↓
UnknownをEvidenceで確認する
  ↓
Reviewする
  ↓
Approval Boundaryを通す
  ↓
Execution
~~~

次の第4部では、承認された後のExecutionをどう安全に自律化するかを扱います。
