---
title: "Review済みと「実行してよい」を分ける — Approval Boundary"
---

Planを作り、Evidenceを集め、Reviewで問題を減らしました。

ここで、すぐ実装へ進んでよいでしょうか。

PlanGateでは、ここを分けます。

```text
Review済み
    ≠
Approved
```

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
> この範囲を実行してよいか  
> 残るリスクを受け入れるか

という判断は残ります。

Review結果は、そのJudgmentの材料です。

Review Agentが「PASS」と言ったから、そのAgentに実行権限まで自動的に渡るわけではありません。

## PlanGateでの分担

PlanGateでは、実装前に次の3つを分けています。

| 段階 | 主な問い |
| --- | --- |
| C-1 Self Review | 構造的な抜けや自己矛盾はないか |
| C-2 Independent / External Review | 別視点から重大な問題はないか |
| C-3 Approval Boundary | このPlanをExecutionへ渡してよいか |

C-1とC-2はReviewです。

C-3はAuthorityを扱います。

ここでの核心は、

> Reviewを通過したことと、Execution Authorityを渡したことを同一視しない。

ことです。

## Authority Policyはリスクで変える

現行PlanGateでは、すべてのタスクを同じC-3運用にはしていません。

低リスクや明示的な自律委任では、自動化の余地を持たせます。一方、high-risk / critical、Hardening Override、スキーマ / destructive / セキュリティ関連などでは、人間側へAuthorityを戻します。ai-loopには対象となる実行向けのC-3'もありますが、C-4はHuman-ownedです。

個別条件は将来変わりうるため、本書では次の原則を中心にします。

```text
低リスク
→ Authorityを限定的に委譲できる

リスクが上がる
→ Independent Reviewを厚くする
→ Human-owned boundaryへ戻す

最終受入
→ Human-owned
```

重要なのは、「必ず人間がクリックする」ことではありません。

**誰が、どの条件なら、どこまで決めてよいかを先にPolicyとして持つこと**です。

## APPROVE / CONDITIONAL / REJECT

PlanGateのC-3では、判断を三値で扱います。

### APPROVE

このPlanでExecutionへ進める。

### CONDITIONAL

Planの骨格は使えるが、条件や修正が必要。

現行のC-3 approvalコマンドでは、条件付き承認時にconditionsを記録します。

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

> この内容のPlanを承認した

という紐づきを持つためです。

```text
Plan v1
  ↓
Approval(plan_hash = v1)
  ↓
Planがv2へ変更
  ↓
Approval対象と不一致
```

となれば、同じ承認をそのまま使うべきではありません。

承認後のPlan変更を検出するHookも、この境界を守るためにあります。

## 「承認した後に分かったこと」は止まる理由になる

実装を始めた後に、新しい事実が見つかることがあります。

たとえば、

> スキーマ変更なしで実装できると承認したが、実際にはmigrationが必要だった。

このとき、AIが「目的は同じなので続けます」と判断すると、Approval Boundaryは意味を失います。

```text
新しいEvidence
      ↓
承認時の前提を壊す
      ↓
Scope / Risk / Planが変わる
      ↓
Executionを止める
      ↓
Review / Approvalへ戻る
```

ここで止まれることが重要です。

## 何が変わったらReview / Approvalへ戻るか

実運用で重要なのは、Planの文字が1文字でも変わったら必ず止める、という単純なルールではありません。

読者が自分の環境へ持ち帰るなら、次のような **re-plan trigger** を決めておくと使いやすくなります。

| 変化 | 再判断の目安 |
| --- | --- |
| Scope | In / Outの境界を越える |
| Acceptance | 成功条件そのものが変わる |
| Risk | セキュリティ / destructive / migrationなど新しい高リスクが出る |
| Architecture | 承認時になかった責務・依存・スキーマ変更が必要になる |
| Authority | Human-owned領域やprotected resourceへ触れる |
| Evidence | 承認時の重要Assumptionが否定される |

逆に、

- 承認範囲内の変数名調整
- 実装順序の入れ替え
- 同じAcceptance Criteriaを満たす局所的な実装選択

まで毎回Approvalへ戻すと、Gateが単なる待ち行列になります。

> Approvalへ戻るのは、承認した意味が変わるとき。

という基準にすると、止める場所と任せる場所を分けやすくなります。

## Human Presenceも「絶対防御」とは書かない

PlanGateには、人間の承認を記録として残す仕組みがあります。承認の記録をAIが手で書けないようにし、その場に人間がいるかを、できる範囲で確かめてから記録を作ります。

重要なのは、PlanGate自身がこれを**絶対的なセキュリティの境界とは主張していない**ことです。

疑似TTYなどを使う高度な自動化への限界も公開文書に明記されています。

本書でも、

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
- 前提や範囲が変われば止まる
- Riskに応じてAuthorityを変える

という構造を作ります。

これで第3部の流れがつながりました。

```text
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
```

次の第4部では、承認された後のExecutionをどう安全に自律化するかを扱います。
