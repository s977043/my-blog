---
title: "クイックスタート — 10分で「承認なし実装」が止まる体験"
---

> 検証バージョン: **PlanGate v8.10.0**（2026-05）。最新の手順は[公式 README](https://github.com/s977043/PlanGate/blob/main/README.md)を参照。

はじめにで述べた本書の主張 ―― 「計画を承認し、それを実行時に守らせる」 ―― は、説明より一度体験するのが早いです。この章では、**承認（C-3）を取らずに実装へ進もうとすると PlanGate が止める**ところまでを 10 分で再現します。

この章のゴールは、PlanGate を完全に理解することではありません。**承認前に実装へ進もうとした瞬間に、Hook が割り込む**ことを確認することです。詳しい設計は第 3 章と第 4 章で扱います。

## 前提環境

PlanGate は POSIX shell + git + python3 があれば最小構成で動きます。AI ツールは挙動がバージョンで変わるため、固定して記録しておきます。

| 要件 | 最小 | 備考 |
|------|------|------|
| OS | macOS / Linux | Windows は WSL 推奨 |
| 必須 | git / POSIX sh / python3 | CLI と Hook の基盤 |
| 推奨 | Claude Code | 計画生成・実装の主導線 |
| 任意 | gh CLI / Codex | PR 操作・代替実装エージェント |

## インストール

```bash
git clone https://github.com/s977043/PlanGate.git
cd PlanGate
# 環境チェック（不足を診断、--fix で Hook を配線）
bin/plangate doctor
```

`bin/plangate` は単一の CLI エントリポイントです。主要なサブコマンドは次の通り（`bin/plangate help` 相当）。

```text
init <TASK>      タスクフォルダとテンプレートを作成
plan <TASK>      plan.md / todo.md / test-cases.md を生成
gate <TASK>      C-1/C-2/C-3 ゲートの準備状況を確認
exec <TASK>      実装エージェントを起動（C-3 承認後）
verify <TASK>    V-1（検証）+ settings lock + V-3 + metrics
status <TASK>    現在のフェーズと次アクションを表示
doctor           環境チェック / Hook 配線
```

## 10 分チュートリアル — 1 タスクを流す

公式 README の 10 分チュートリアルに沿って、最小の 1 サイクルを回します。`/working-context` や `/ai-dev-workflow` は **Claude Code のスラッシュコマンド**（シェルのコマンドではない）で、Claude Code のセッション内で実行します。

```text
# 1. 作業コンテキストを作る（Claude Code 内）
/working-context TASK-0001

# 2. PBI INPUT PACKAGE を書く（人間の作業）
#    docs/working/TASK-0001/pbi-input.md に Why / What / 受入基準 / 制約 を記入

# 3. 計画を生成する（plan.md / todo.md / test-cases.md が同時に出る）
/ai-dev-workflow TASK-0001 plan

# 4. C-3 ゲート — plan.md を読んで人間が判定
#    APPROVED / CONDITIONAL / REJECTED のいずれか

# 5. 実行する
/ai-dev-workflow TASK-0001 exec

# 6. C-4 ゲート — GitHub で PR をレビュー
```

## ここが本番 —「承認なし実装」が止まる瞬間

チュートリアルの流れを、わざと**ステップ 4（C-3 承認）を飛ばして**ステップ 5 の実装に進んでみてください。`approvals/c3.json` が APPROVED になっていない状態で exec しようとすると、Hook（EH-2）が割り込みます。

```text
[Hook EH-2 WARNING] approvals/c3.json not found or c3_status != APPROVED
  approvals/c3.json の c3_status が APPROVED でない。exec 前に C-3 ゲートで承認を取ってください
```

同様に、`plan.md` を作らずに production code を編集しようとすれば EH-1 が警告します。

```text
[Hook EH-1 WARNING] plan.md not found: docs/working/TASK-0001/plan.md (Hook EH-1)
  Hint: production code を編集する前に TASK-0001/plan.md を作成してください。
  Set PLANGATE_HOOK_STRICT=1 to enforce, or PLANGATE_BYPASS_HOOK=1 to silence.
```

この「**承認していないコードは書かせない**」が機械的に効く瞬間こそ、PlanGate の核です。`No approval, no code.` が標語でなく、実際に動く制約として現れます。

> 💡 初期状態（default モード）では上記は **warning**（作業は止まらない）です。`PLANGATE_HOOK_STRICT=1` を設定すると、違反は実際にブロック（exit 1）されます。まずは warning で「どこで引っかかるか」を観察し、慣れたら strict に上げてください（詳細は第 4 章）。

## うまく動かないときは

| 症状 | 最初に見る場所 |
|------|----------------|
| Hook が発火しない | `bin/plangate doctor --fix` で Hook 配線を確認 |
| 何が起きたか追いたい | 監査ログの `VIOLATION` / `BYPASS` を確認 |
| ゲートが邪魔で進めない | 付録Aの `PLANGATE_BYPASS_HOOK=1` を確認 |
| Windows で動きが違う | WSL 上での実行に揃える |

## 次の一歩

承認なし実装が止まる体験ができたら、それが本書の主張の出発点です。「なぜこの制約が必要か」は次章（Why）で、「精度の高い計画の作り方」は第 3 章（Plan）で深掘りします。

> 🔗 体験できたら → [PlanGate のリポジトリ](https://github.com/s977043/PlanGate)を開いて、自分のプロジェクトへの導入を検討してみてください（star で更新を追えます）
