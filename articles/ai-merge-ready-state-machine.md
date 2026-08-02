---
title: "AIにマージさせない状態機械 — PRをMERGE_READYまで運ぶ設計と、境界をコードで保証する3原則"
emoji: "🔀"
type: "tech"
topics: ["ai駆動開発", "claudecode", "codex", "設計", "githubactions"]
published: false
---

<!--
WIP: 本ファイルは「構成スカフォールド」です（本文は後続で執筆）。
各セクションの箇条書きは、記事に入れる裏取り済みの具体（PlanGate delivery.py /
delivery-state-machine.md / ta-56 テストで確認済み）のメモです。
中心主張・構成が確定したら散文化 → /review-improve-loop で磨き込みます。
-->

:::message
**この記事で得られること**

- AIエージェントにPR運用を任せるとき、「収束」と「マージ」の境界をどこに引くかの設計
- その境界を規約でなく「MERGED状態を持たない状態機械 + fail-closed + 冪等」で構造的に保証する方法
- 製品固有を離れても転用できる3つの設計原則
:::

## 1. 導入：自動化の「逆問題」

- 「AIにマージまでやらせた」系との対比。本記事は逆向き — **マージ可能な状態への収束は自動化し、マージ自体は人間に残す**
- 題材は個人OSS PlanGate の Delivery 層（v8.18）。既存記事（〜v8.6）が扱わなかった「実行時の最終境界」
- 中心主張: 境界を規約（自然言語ルール）でなく**コードの構造**で保証する

## 2. MERGED状態を持たない状態機械

- Delivery層は PR を `PR_CREATED → MERGE_READY` へ運ぶ決定論的状態機械（`delivery.py`）
- サブステート: `WAITING_FOR_CHECKS` / `CHECKS_FAILED` / `REVIEW_REPAIR` / `CONFLICT` / `MERGE_READY_CANDIDATE`、正常終端は **`MERGE_READY` 只一つ**
- **`MERGED` への遷移が存在しない**。「NO MERGE BY AI」を規約でなく状態設計で表現
- 具体: **テスト ta-56 が `delivery.py` のソースを走査し、merge経路・ネットワーク/プロセス実行トークンが0件であることを検証**（AC-12）。＝「できないこと」をテストで固定

## 3. MERGE_READYの意味論 —「載せてよい」≠「mergeしてよい」

- `MERGE_READY` =「機械ゲートを全通過し**人間の最終判断に載せてよい**」状態。「mergeしてよい」ではない
- 実マージ（C-4）は Human-owned 固定
- disposition（レビュー指摘の採用/不採用）の**内容の真正性**はC-4の責務。機械は「記録が存在すること」までを保証

## 4. fail-closed ：不確実性は成功に倒さない

- `PRIORITY_ORDER` で **検証不能な入力が上位で先に評価**される: `ancestry_fail` / `unknown_check_conclusion` / `taxonomy_unverifiable` / required check空 → いずれも `HUMAN_ESCALATED`
- 「検証不能は常に最優先でエスカレーション」＝成功側にもlivelock側にも倒さない設計判断
- 具体: **head SHA束縛**で古いheadのAPPROVEDを不採用（stale check排除）。required check集合が空なら`required_checks_empty`でfail-closed

## 5. 実行境界のallowlistと、その正直な限界

- 実行境界は**許可サブコマンドのallowlist方式**。禁止（`gh pr merge`/`approve`/force-push/branch削除）は補集合として自動成立、spawn ledgerで違反0件を実証
- **正直な限界**: このin-process allowlistは**Executor経路しか守れず、別Bashから直接叩く `gh pr merge` は塞げない**（実装が明記）→ 最終防衛はC-4の人間 + branch protection
- 「守れる経路/守れない経路」を明示する脅威モデルとしての誠実さ（弱さでなく信頼性）

## 6. 純判定器 + 冪等な intent→receipt→reconcile

- `delivery.py` はネットワーク・外部プロセスを一切呼ばない純判定器（importに存在しない）。判定は snapshot + record のみに依存、timestampは注入
- 外部作用は **intent→実行→receipt→reconcile** の2段記録で「一度だけ実行」に収束。前後どちらの中断でも再実行可能（冪等）
- `entry_id` / stable `action_id` による重複append抑止

## 7. 転用できる3原則（まとめ）

1. **「許可」より「不可能」を状態・遷移・テストで表現する** — MERGED状態を持たない + ソース走査テスト
2. **不確実性は成功でなくエスカレーションへ倒す** — fail-closedを優先順位の上位に置く
3. **外部作用はintent→receipt→reconcileで再実行可能にする** — 中断に強い冪等系
- これらは製品固有の実装を離れても、AIにPR運用を任せる任意の環境へ転用できる

## 関連記事（棲み分け）

- [アジャイルでAI駆動開発をどう回すか: PlanGateの考え方とテンプレート](https://zenn.dev/minewo/articles/plangate-ai-coding-workflow)（入門）
- [PlanGate v3 から v8.6 までの設計変遷](https://zenn.dev/minewo/articles/plangate-design-evolution-v3-to-v8)（〜v8.6の変遷。本記事はその後のDelivery層）
- [AIコーディングを「比較で改善」できる土台にする：PlanGate v8.6.0のMetrics v1とGovernance](https://zenn.dev/minewo/articles/plangate-v86-hook-enforcement)
