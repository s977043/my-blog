---
title: "付録A2: よくある失敗と戻り方"
---

PlanGateを使うときに起きやすい誤解を、症状と戻り方でまとめます。

## 症状から探す

| 困っていること | 見る項目 |
| --- | --- |
| Plan / Approvalが重い・曖昧 | 1〜6 |
| Hook / Verificationが信用できない | 7〜10 |
| セッション / review / multi-agentが崩れる | 11〜13 |
| PR後のDeliveryが人間へ戻る | 14〜15 |
| Harnessのgreenを信用できない | 16〜17 |
| Governanceが増え続ける | 18 |

順番に読む必要はありません。起きているfailure classから該当箇所へ戻るための付録です。

## 1. 何でも重いPlanにする

**症状**: 小さなtypo修正でも詳細Plan、複数Review、厳格なGateを要求する。

**なぜ危険か**: Governance costが変更riskを上回り、迂回や形骸化を誘発します。

**戻り方**:
- PhaseとModeを分ける
- ultra-light / lightを使う
- そのタスクで本当に必要なBoundaryだけ残す

> Gateが多いほど良いわけではない。

## 2. Planを書いたのでApproval済みだと思う

**症状**: plan.mdがあるので、そのまま実装開始する。

**なぜ危険か**: Planは判断対象であり、Execution Authorityそのものではありません。

**戻り方**: Plan → Review → Approval → Execution を分けます。

## 3. Self ReviewをApprovalと誤解する

**症状**: Planを書いたAIが自己ReviewでPASSし、そのまま実装する。

**なぜ危険か**: 問題探索とAuthority判断が同じ主体・同じ行為になります。

**戻り方**:

```text
C-1 / C-2
= Review

C-3
= Approval Boundary
```

低リスク自動承認を使う場合も、誰にどの条件でAuthorityを委譲したかをPolicyにします。

## 4. Unknownをきれいな文章で隠す

**症状**: 確認していない件数・file・API・既存実装を断定文としてPlanへ書く。

**なぜ危険か**: ReviewerもVerified factとして読みやすくなります。

**戻り方**:
- Unknown / Assumptionとして明示
- 判断を変えるならEvidenceを取りに行く
- 安く測れるものは測る

## 5. 前提が崩れてもそのまま進める

**症状**: 承認時はスキーマ変更なしだったが、実装中にmigrationが必要と分かっても続行する。

**なぜ危険か**: Approvalした対象の意味が変わっています。

**戻り方**: Scope / Acceptance / Risk / Architecture / Authority / Evidenceのどれかが意味的に変わるならEscalateします。

> Approvalへ戻るのは、承認した意味が変わるとき。

## 6. Scope外を「ついでに」直す

**症状**: AIが関連問題を見つけ、善意でrefactorや別bug修正まで行う。

**なぜ危険か**: 良い改善でも、今回のExecution Authorityの外かもしれません。

**戻り方**:
- Out of ScopeをPlanへ書く
- 別タスク / PBI候補として残す
- 今回必要ならRe-plan / Re-approvalする

## 7. Hookを入れただけで有効だと思う

**症状**: Guard scriptがrepositoryにあるので、境界は守られていると判断する。

**なぜ危険か**: matcher、runtime登録、tool経路、worktree pathなどで抜ける可能性があります。

**戻り方**:
- runtime activationを確認
- positive control
- negative control
- 実際のtool経路

まで試します。

```text
exists != registered != fired != influenced decision
```

## 8. Guardを強くすれば安全だと思う

**症状**: 少しでも怪しいコマンドを全部blockする。

**なぜ危険か**: false positiveが増え、Agentや人間がGuardを迂回し始めます。

**戻り方**:

```text
dangerous → block
safe      → allow
```

の両方をテストします。

## 9. 古いEvidenceで完了判定する

**症状**: テストPASS後に修復し、そのまま以前のPASSを完了Evidenceとして使う。

**なぜ危険か**: Evidence対象と現在HEADがずれています。

**戻り方**:
- 修復後に必要なVerificationを再実行
- commit / PR headとEvidenceをbind
- stale Evidenceをgreenとして扱わない

## 10. ReviewとVerificationを一つにする

**症状**: 「AI Reviewerが問題なしと言ったのでテスト不要」または「テストPASSなので設計Review不要」とする。

**なぜ危険か**: 確認している問いが違います。

**戻り方**:

```text
Verification
= 決めた条件を満たしたか

Review
= 条件外の問題もないか

Judgment
= 次へ進めるか
```

を分けます。

## 11. 会話履歴を正本にする

**症状**: 「前のセッションで説明した」「上で決めた」が唯一の状態になる。

**なぜ危険か**: 古い判断、捨てた案、最新stateが混ざります。

**戻り方**:
- Plan
- Current State
- Evidence
- Handoff

へ重要な状態を出します。

## 12. 別Agentを呼べば独立Reviewになると思う

**症状**: 別モデルへBuilderの会話を丸ごと渡して「独立レビュー」とする。

**なぜ危険か**: Agentは別でもassumptionとcontextを共有しています。

**戻り方**: Reviewerへはapproved Plan / diff / Acceptance / Evidence / relevant rulesを渡し、raw implementation reasoningを原則引き継ぎません。

## 13. Multi-agentを増やしすぎる

**症状**: 小さなタスクでもPlanner / Builder / Verifier / Reviewer / Orchestratorを全部別Agentにする。

**なぜ危険か**: handoff、state sync、重複探索の調整コストが増えます。

**戻り方**:

> responsibility separation benefit > 調整コスト

のときだけAgentを増やします。まずownershipを分け、その後Agent topologyを決めます。

## 14. PRを作ったらDelivery完了だと思う

**症状**: PR作成後のCI失敗、review修復、conflictを人間が引き取る。

**なぜ危険か**: AIの自律性がcodingで止まり、Deliveryの待ち時間が人間へ戻ります。

**戻り方**: 必要ならAI責務を PR_CREATED → CI / review修復 → re-verification → MERGE_READY まで伸ばします。

## 15. AIにmergeまで任せる

**症状**: MERGE_READYとMERGEDを同じものとして扱う。

**なぜ危険か**: Delivery Autonomyと最終Authorityが混ざります。

**戻り方**:

```text
MERGE_READY
= AI側のDelivery終点

MERGED
= 別Authority
```

現行PlanGateではC-4 / mergeはHuman-ownedです。

## 16. GreenならHarnessが正しいと思う

**症状**: doctor / テスト / CIがgreenなのでGuardやpluginは正しく機能していると結論する。

**なぜ危険か**: 測っているProxyと、本当に知りたいClaimが違うかもしれません。

**戻り方**: Claim / Target Identity / Oracle / Controls / Coverage / Promotion Boundaryを確認します。

## 17. FailureごとにSkill / Agent / Hookを増やす

**症状**: 事故のたびに新componentを追加する。

**なぜ危険か**: Harness自体が複雑になり、routing / activation / ownership / Evalの面積が増えます。

**戻り方**:
1. configuration correction
2. deterministic invariant
3. existing Verifier improvement
4. reuse / merge / deprecate
5. create last

## 18. Phaseを上げ続けることを成功にする

**症状**: Phase 3、strict、multi-agent、Metrics導入を「成熟」とみなし、戻せなくなる。

**なぜ危険か**: Governance debtが増えます。

**戻り方**: Keep / Strengthen / Simplify / Remove で定期的に見直します。

## 最後の確認

問題が起きたとき、まず新しい機能を足すのではなく、次を確認します。

1. どのBoundaryが曖昧だったか
2. どのClaimにEvidenceがなかったか
3. Continue / Stop / Escalateのどれを誤ったか
4. Authorityは適切な主体にあったか
5. 既存の仕組みを直せば済まないか

この5問で、多くの問題を「AIが悪かった」から設計問題へ戻せます。
