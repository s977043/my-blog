---
seed_id: seed-20260930-openspec-plangate-living-spec
title: "OpenSpecとPlanGateを比較して見えた、PlanGateに足りなかった「現在仕様」"
date: 2026-09-30
status: draft
topics:
  - ai駆動開発
  - openspec
  - plangate
  - sdd
source: mixed
source_url: https://openspec.dev/docs/schemas/spec-driven
source_ref: https://github.com/s977043/PlanGate/tree/4995ad626825492914c6152c92f65849584dff60
evidence_status: verified
promoted_to:
  - articles/openspec-plangate-living-spec.md
article_type_candidates:
  - analysis
  - insight
---

# OpenSpecとPlanGateを比較して見えた、PlanGateに足りなかった「現在仕様」

## 観測事実

- 2026-09-30時点のOpenSpec公式 spec-driven schemaでは、proposal.md / capabilityごとのdelta spec.md / design.md / tasks.md を主なartifactとして扱う。
- OpenSpecはarchive時にdelta specをmain specsへ反映し、openspec/specs/ を system as built のsource of truthとして扱う。
- OpenSpecには人間がplanを確認するReview stepと /opsx:verify がある。「レビューや検証がない」とは扱わない。
- 2026-09-30確認時のPlanGate mainは commit 4995ad626825492914c6152c92f65849584dff60。
- PlanGateのplan phaseはPBI INPUTから plan.md / todo.md / test-cases.md を生成する。
- PlanGateのC-3'契約ではPlan Packageを pbi-input.md / plan.md / todo.md / test-cases.md / review-self.md / review-external.md の6要素として束縛する。
- PlanGateには approvals/c3.json、plan/package hash、verification evidence、RunEvidenceなど、変更実行の判断と証跡を扱うartifact/contractがある。

## 自分の解釈

ファイル名だけを見るとOpenSpecとPlanGateはかなり重なるが、正本として残そうとしている対象が違う。

- OpenSpec: 現在のシステムが何をするものか、そして何を変更するか
- PlanGate: 今回の変更をどの計画・レビュー・承認・証跡で安全に実行したか

この記事では前者を System State、後者を Change Execution と呼ぶ。

OpenSpec公式が Living Spec という固有用語を中心概念として定義しているとは扱わない。記事本文では、archive後も更新され続けるmain specsの責務を Current Spec（現在仕様）と呼ぶ。

## 違和感 / Reader Problem

OpenSpecをPlanGateへ取り込みたいと考えたとき、artifact名が似ているため「OpenSpec一式を追加すればよい」と見えた。

しかし、そのまま追加すると proposal と pbi-input、design と design / plan、tasks と todo が二重化し、SSoTが増える。

必要なのはツール一式の導入ではなく、PlanGateに本当に欠けている責務を見つけることではないか。

## 今の仮説

PlanGateに追加する価値が高いのはOpenSpec一式ではなく、次の2つの考え方である。

1. 現在のシステムの期待動作をcapability単位で保持するmain spec
2. 1変更で変える部分だけを記述し、変更確定後にmain specへ反映するdelta spec

これをPlanGateの既存のPBI / Plan / Review / Approval / Evidenceと重ねず別責務として接続できれば、Current What / Changed What / Why / How / Judgment / Proof を分離できる。

## 既存知識との接続

### OpenSpec

- spec-driven schema: https://openspec.dev/docs/schemas/spec-driven
- Quickstart: https://openspec.dev/docs/quickstart
- 公式サイト: https://openspec.dev/

### PlanGate

- 対象commit: https://github.com/s977043/PlanGate/tree/4995ad626825492914c6152c92f65849584dff60
- plan contract: https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/plan.md
- review contract: https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/review.md
- verify contract: https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/verify.md
- C-3' Plan Package: https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/workflows/ai-loop/c3-prime-contract.md

## 記事化の角度

- Experience: 自分で開発・運用しているPlanGateへOpenSpecを取り込むべきか比較した過程
- Analysis: artifactとライフサイクルを責務で比較する
- Insight: System StateとChange Executionは別の正本として扱う
- Evidence: OpenSpec公式ドキュメントとPlanGate現行mainを照合する

## 次に試すこと

- [ ] 1 capabilityだけを対象にmain spec + delta specのPoCを行う
- [ ] deltaをLiving Specへ反映するタイミングをC-4 / merge境界と整合させる
- [ ] AC / test-cases / testsとの重複とdriftを検証する
- [ ] 使えると判断できたらPlanGate側の正式なGap Analysisへ進める

## Approved Article Plan: zenn/openspec-plangate-living-spec

- approved_at: 2026-09-30
- channel: zenn
- slug: openspec-plangate-living-spec
- article_type: analysis / architecture
- reader_problem: OpenSpecのようなSpec-driven workflowとPlanGateのようなAI開発ワークフローの違いが分からず、両方を導入すべきか判断しづらい
- central_claim: OpenSpecとPlanGateはartifactが似ていても責務が異なる。OpenSpecはSystem State、PlanGateはChange Executionを主に扱う。PlanGateへ取り込むならOpenSpec一式ではなく、main spec / delta specを独立した責務として小さく導入する価値が高い
- out_of_scope: OpenSpecの導入チュートリアル、OpenSpecとPlanGateの優劣評価、Living Spec統合の完成実装、OpenSpec互換実装

### Evidence Boundary

- Observed:
  - 著者が開発しているPlanGateの現行mainを確認し、plan / review / verify / approval / evidenceの契約を比較した
  - OpenSpec公式ドキュメントを確認し、spec-driven artifactとarchive後のmain specs更新を比較した
- Verified:
  - OpenSpecの4 artifactと依存関係
  - OpenSpec archiveでdelta specがmain specsへ反映されること
  - OpenSpecにReview stepとverifyが存在すること
  - PlanGate plan phaseの3出力
  - PlanGate C-3' Plan Package 6要素
  - PlanGateのreview / approval / verification evidence契約
- Hypothesis:
  - PlanGateへmain spec / delta specを追加すると、変更履歴から現在仕様を復元するコストを減らせる
  - C-4 / merge後にdeltaをmain specへ反映すれば、PlanGateのChange ExecutionとCurrent System Stateを二重化せず接続できる

### Outline

1. TL;DR: 似ているが残しているものが違う
2. なぜOpenSpecをPlanGateと比較したのか
3. artifact対応表
4. proposal / design / tasksはかなり重なる
5. 最大のGapはmain spec / delta spec
6. PlanGate側の差分はReview / Approval / Evidence
7. System StateとChange Executionで整理する
8. Current What / Changed What / Why / How / Judgment / Proofへ分ける
9. OpenSpec一式ではなくmain spec / delta specだけをPoCする
10. 次に検証すること

### 著者の判断（2026-09-30）

- Zenn向けに技術設計・比較・検証を主役にする
- OpenSpecとPlanGateの優劣記事にはしない
- Living Specを記事の中心用語にはせず、OpenSpecのmain specsが担う責務を Current Spec（現在仕様）として説明する
- OpenSpecにReview / Verifyが無いとは書かず、PlanGateとの違いは明示的なgovernance artifactとprovenanceの厚さとして表現する
- 現行PlanGateではPlan Package 6要素を正とし、以前の4要素整理は記事へ持ち込まない

### 変更履歴

- 2026-09-30: Zenn向けArticle Planを作成し、著者の「進めたい」をPlan Approvalとして記録
- 2026-09-30: 初稿レビュー・ループ1。OpenSpecのReviewを設計品質レビューと誤読させる表現を修正し、design/specsの省略条件、OpenSpec archiveとGit mergeが別関心事であることを追記
- 2026-09-30: 初稿レビュー・ループ2。PlanGateのGapを「仕様書がない」ではなく「capability単位のCurrent System Specへ直接対応する標準artifactがない」へ限定。Delta SpecのADDED / MODIFIED / REMOVEDを追加
- 2026-09-30: 初稿レビュー・ループ3。OpenSpec一式が不要という一般化を避け、「現在のPlanGateでは重複が大きい」に限定。System State / Change Executionの2軸で読者自身が判断できる表を追加
- 2026-09-30: 追加レビュー・ループ2。Living SpecがOpenSpec公式用語に見える曖昧さを避け、タイトルと本文の中心語を Current Spec（現在仕様）へ変更
