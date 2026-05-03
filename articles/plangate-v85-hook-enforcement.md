---
title: "AIコーディングを「比較で改善」できる土台にする：PlanGate v8.6.0のMetrics v1とGovernance"
emoji: "🚦"
type: "tech"
topics: ["ai", "claudecode", "githubactions", "oss", "automation"]
published: true
---

AIコーディングエージェントを使うと、実装の初速は大きく上がります。

一方で、速くなった分だけ次のような問題も目立ちます。

- 計画が曖昧なままコード変更に進む
- 関連しそうな改善をAIが勝手に広げる
- テスト観点が後付けになる
- PRの差分が大きくなり、レビューが重くなる
- セッションが変わると判断の根拠が失われる

PlanGate は、この問題に対して「AIをもっと賢くする」のではなく、**人間が承認するまで進めないゲート**を置くアプローチです。

> 承認なし、コードなし。

v8.5.0 で Hook enforcement 10/10 が完成し、「実行時に止める」仕組みは出揃いました。続く v8.6.0 では、その上に **Metrics v1 / Issue governance / Baseline** が乗りました。

ひとことで言うと、**「止めた回数を集計して比較できる harness」** に進化しています。

この記事では v8.6.0 で追加された 4 本柱（baseline・governance・privacy・Metrics v1）を、実際にどう使うかという視点で整理します。

:::message
この記事で得られること

- Hook enforcement だけでは足りなかった「観測」と「比較」の論点
- Metrics v1 が記録する 11 events と、`plangate metrics` の使い方
- Issue governance の「推測禁止条項」と Roadmap PBI テンプレート
- Baseline を取って後続改善を比較で判断する流れ
- v8.6.0 を導入する順序と、最初に読むファイル
:::

## TL;DR

PlanGate は AI コーディングエージェントを安全に使うための軽量ガバナンスハーネスです。

- v8.5.0 までで **Hook enforcement 10/10**（承認前実装、計画改変、scope 外編集、merge 承認漏れなどを実行時に検査）が揃った
- v8.6.0 では **Harness Improvement Roadmap Phase 0/1** として、改善前 baseline → governance → privacy → Metrics v1 を順に整備
- 11 events の JSON Schema と CLI（`plangate metrics --collect/--report`）で、TASK 単位の運用イベントを後から集計できる
- 改善前 baseline と Issue governance により、以後の harness 改善（Eval expansion / Model Profile v2 / Keep Rate / Dynamic Context）を **感覚ではなく比較で判断** できる
- Tests は 24 → **32 PASS**（CLI 側）、Hook 側は 42 PASS を維持

「AIに速く書かせる」だけでなく、「AIがどこで止まり、どれくらい止まっているか」をチームで観測したい場合に向いています。

## この記事の対象読者

- Claude Code / Codex CLI などのAIコーディングエージェントを実務で使っている人
- AIが作るPRの差分が大きくなり、レビューに困っている人
- Hook で止めるところまでは入れたが、「効いているか」を数字で見られていない人
- スクラムやPBIベースの開発で、AI運用の改善を retrospective で回したい人

## v8.5.0 と v8.6.0 の役割分担

PlanGate の進化は「止める」と「観測する」を分けて理解すると整理しやすいです。

| バージョン | 主役 | 何が揃ったか |
| --- | --- | --- |
| v8.4.0 | Hook 基盤 | default warning / strict block / bypass の 3 mode 設計 |
| v8.5.0 | Hook enforcement 完成 | 10/10 hooks 実装、tests 21→42 PASS |
| **v8.6.0** | **観測と比較** | **Metrics v1 / Issue governance / Privacy / Baseline** |

v8.5.0 までは「危ない条件をどれだけ止められるか」が課題でした。v8.6.0 からは「**どこで何回止まったかを記録して、harness 自体を改善できるか**」がテーマです。

## v8.6.0 で追加された 4 本柱

EPIC #193 [Harness Improvement Roadmap](https://github.com/s977043/plangate/issues/193) の v8.6.0 milestone P0 として、4 つの PBI が**この順序で**実装されました。

| # | PBI | ドキュメント | 役割 |
| --- | --- | --- | --- |
| 1 | #194 Baseline alignment | `docs/ai/eval-baselines/2026-05-04-baseline.{md,json}` | 改善前の状態を固定 |
| 2 | #201 Issue/Label/Milestone Governance | `docs/ai/issue-governance.md` | 推測禁止条項と Roadmap PBI テンプレ |
| 3 | #202 Metrics Privacy | `docs/ai/metrics-privacy.md` | 保存可能 12 / 禁止 9 カテゴリ |
| 4 | #195 Metrics v1 | `schemas/plangate-event.schema.json` ほか | 11 events と CLI 集計 |

順序が大事です。governance（何を Issue として残すか）と privacy（何を記録してよいか）を先に決めてから Metrics v1 を実装することで、schema 設計時に privacy §3/§4 が先行参照され、**「Forbidden カテゴリは schema 上に存在させない」設計を強制**できます。

## Metrics v1：11 events で運用を記録する

Metrics v1 のスキーマ（`schemas/plangate-event.schema.json`）が記録する events は次の 11 種類です。

| Event | 何を記録するか |
| --- | --- |
| `task_initialized` | TASK ディレクトリ作成、PBI 番号、mode |
| `plan_generated` | plan.md / todo.md / test-cases.md 揃ったか |
| `c3_decided` | C-3 承認結果（APPROVED / CONDITIONAL / REJECTED） |
| `exec_started` | exec フェーズ開始 |
| `hook_violation` | どの hook が、どの条件で発火したか |
| `v1_completed` | V-1 検証完了、AC PASS/FAIL/WARN 件数 |
| `fix_loop_incremented` | 修正ループの回数 |
| `external_review_completed` | V-3 外部レビュー結果 |
| `pr_created` | PR 番号と差分サマリ |
| `c4_decided` | C-4 マージ承認 |
| `handoff_completed` | handoff の必須要素チェック |

各 event は **conditional required**（c3 / c4 / v1 / hook / fix_loop それぞれに必須フィールドあり）として定義されており、形式違反は schema 検証で弾かれます。

### CLI で集計する

スキーマと並んで、`scripts/metrics_collector.py` / `scripts/metrics_reporter.py` が用意されています。`bin/plangate metrics` 経由で呼び出します。

```bash
# TASK ディレクトリから 6 events を自動導出して NDJSON に追記
bin/plangate metrics --collect TASK-0061

# events.ndjson から TASK 単位のサマリを表示
bin/plangate metrics --report TASK-0061

# 全 TASK 横断で集計（hook violation / C-3 / V-1 / C-4 / fix_loop_max / mode）
bin/plangate metrics --aggregate

# JSON 出力（dashboard / 後続ツール連携向け）
bin/plangate metrics --aggregate --json
```

`--collect` は dry-run モード（`--dry-run`）も持っているので、最初は NDJSON に書かずに events 抽出結果だけ確認できます。

### Privacy はスキーマで強制する

events.ndjson は `docs/working/_metrics/events.ndjson` に出力されますが、**`.gitignore` で除外されており public repo に commit されません**。これは `docs/ai/metrics-privacy.md` §8 の要件です。

`metrics-privacy.md` は次のように 12/9 カテゴリで線引きしています。

- **保存可能 12 カテゴリ**: TASK ID、event 種別、timestamp、mode、AC count、hook 名、C-3/C-4 decision、V-1 result、fix loop count、PR 番号、差分行数集計、handoff 必須要素チェック結果
- **禁止 9 カテゴリ**: file path（フルパス）、stack trace、command output、provider metadata、API key、ユーザー名、commit message 全文、コード本文、private prompt 内容

設計時にこの線引きが入っているので、Metrics v1 を on にしただけで漏れる、という事故が起きにくい構造になっています。

## Issue governance：「推測禁止条項」とは

`docs/ai/issue-governance.md` で正本化された Issue 運用ルールの目玉が、§4 **推測禁止条項**です。

> Roadmap PBI を Issue 化するとき、Why / What / AC / Non-goals / Labels / Milestone を**推測で埋めてはならない**。明示されていない要素は「未確定」として残し、確定後に更新する。

これは v8.5.0 → v8.6.0 期間で発覚した「11 PBI が誤って v7.x milestone に紐付いていた」という事故への再発防止策です。AI に Issue Form を埋めさせると、それっぽい milestone を**もっともらしく推測してくれてしまう**ため、ルールとして禁止しました。

支える仕組みは 2 つです。

1. `.github/ISSUE_TEMPLATE/plangate-roadmap-task.yml` — Roadmap PBI 用 Issue Form。Why / What / AC / Non-goals / Labels / Milestone を**必須入力として強制**
2. `docs/ai/issue-governance.md` の Label taxonomy — kind / area / priority / status の **4 軸**で分類、milestone mapping は別ドキュメントで明示

「AI が代わりに書ける部分」と「人間が確定するまで埋めてはいけない部分」を分離するのが要点です。

## Baseline：改善前を固定する

`docs/ai/eval-baselines/2026-05-04-baseline.{md,json}` には、v8.5.0 直後時点の baseline が記録されています。

- 代表 5 TASK（TASK-0050 / 0054 / 0055 / 0056 / 0057）を選定
- 既存の 8 観点 eval（scope / approval / AC coverage / verification / stop / tool overuse / format / latency-cost）を全件適用
- 機械可読な JSON snapshot を併置し、後続改善との diff が取れる形に

これがあることで、たとえば v8.7.0 候補の **#196 Eval expansion** や **#197 Model Profile v2** を入れたときに、「観点ごとに何点改善したか」を baseline JSON との diff で示せます。

逆に言うと、baseline がないままでは harness 改善を入れても「なんとなく良くなった気がする」で終わります。v8.6.0 はこの「気がする」を消しに行ったリリースです。

## Hook enforcement の役割は変わらない

v8.6.0 でも、v8.5.0 で完成した Hook enforcement 10/10 はそのまま土台として動きます。Metrics v1 はこれらの hook 発火を `hook_violation` event として記録するレイヤーであり、**hook を置き換えるものではありません**。

念のため、現行 10 hooks の役割をまとめておきます。

| Hook | 目的 |
| --- | --- |
| EH-1 | `plan.md` なしの production code 編集を検知 |
| EH-2 | C-3 承認なしの実装をブロック |
| EH-3 | 承認後の `plan.md` 改変を `plan_hash` で検知 |
| EH-4 | `test-cases.md` なしの V-1 実行を検知 |
| EH-5 | 検証 evidence なしの PR 作成を検知 |
| EH-6 | `forbidden_files` による scope 外編集を検知 |
| EH-7 | C-3 / C-4 承認なしのマージを検知 |
| EHS-1 | standard 以上で V-3 外部レビューを必須化 |
| EHS-2 | handoff の必須要素を検査 |
| EHS-3 | fix loop の上限超過を検知 |

テストスイート構成も同じです。

```bash
sh tests/run-tests.sh        # CLI / eval / schema / metrics
sh tests/hooks/run-tests.sh  # hook enforcement
```

v8.6.0 時点では、**CLI 側 32 PASS（v8.5.0 の 24 から +8）、Hook 側 42 PASS**。+8 はすべて Metrics v1 用の `tests/extras/ta-09-metrics.sh`（schema validation / 各 event 検出 / aggregate report / JSON 出力）から来ています。

## v8.6.0 を試す順序

PlanGate を新規導入する場合と、すでに v8.5.0 を運用している場合で順序が変わります。

### 新規導入の場合

```bash
# 1. 1 タスクで plan → approve → exec を試す
/working-context TASK-0001
/ai-dev-workflow TASK-0001 plan
# 人間が plan.md を読み APPROVE
/ai-dev-workflow TASK-0001 exec
```

ここまで触ってから Hook と Metrics に進むのが現実的です。最初から Metrics v1 を on にしても、observe する対象（TASK 履歴）が無いと意味がありません。

### v8.5.0 から上げる場合

1. **Privacy を読む**: `docs/ai/metrics-privacy.md` の保存可能 12 / 禁止 9 を、自分のチームの公開ポリシーと突き合わせる
2. **Baseline を取る**: 既存 TASK から代表 3〜5 件を選び、`docs/ai/eval-baselines/` に snapshot を作る
3. **Metrics を dry-run で回す**: `bin/plangate metrics --collect <TASK> --dry-run` で events 抽出が想定通りか確認
4. **Issue governance を適用**: 既存の Roadmap Issue を `plangate-roadmap-task.yml` テンプレートに合わせて整理。milestone は推測で埋めない
5. **NDJSON 蓄積を開始**: dry-run を外し、`bin/plangate metrics --aggregate` で週次に集計

特に 1 と 2 を飛ばすと、「Metrics は取れているが何と比較すればいいか分からない」状態に陥ります。

## 次の EPIC：v8.7.0 / v8.8.0 / v8.9.0

CHANGELOG にある通り、v8.6.0 milestone P0 完走を受けて、次のロードマップが見えています。

- **v8.7.0 (P1)**: #196 Eval comparison for harness changes、#197 Model Profile v2、#203 Tool Error Taxonomy、#204 PlanGateBench Fixture Suite
- **v8.8.0 (P1/P2)**: #198 Keep Rate v1（Code / Plan / Acceptance / Handoff）、#199 Dynamic Context Engine v1
- **v8.9.0 (P2)**: #200 Reporting & Retrospective（sprint retrospective 統合）

これらはすべて、v8.6.0 で固定した baseline と Metrics v1 イベントログの上で「比較可能」な形で評価される予定です。

## まとめ

AIコーディングエージェントの課題は、「コードを書けるか」から「どう安全に進めるか」へ、そして「**改善できているか観測できるか**」へと移っています。

- v8.5.0 までで「止める」が出揃った（Hook enforcement 10/10）
- v8.6.0 で「観測する・比較する」が出揃った（Metrics v1 / governance / baseline / privacy）
- 次の v8.7.0 以降は、この土台の上で harness 自体の改善を**比較で判断**していくフェーズに入る

PlanGate v8.6.0 は、AI 運用を retrospective に乗せるための土台が揃ったリリースです。Hook で止めた経験があるチームほど、「止めた回数の集計」と「baseline との比較」の効きが体感できると思います。

まず 1 タスクから試すなら、新規導入の流れと同じです。Metrics v1 まで使いたい場合は、`docs/ai/metrics-privacy.md` を最初に読んでから `--dry-run` で 1 周してみてください。

## 参考リンク

- [PlanGate GitHub Repository](https://github.com/s977043/PlanGate)
- [CHANGELOG（v8.6.0）](https://github.com/s977043/PlanGate/blob/main/CHANGELOG.md)
- [Harness Improvement Roadmap (EPIC #193)](https://github.com/s977043/plangate/issues/193)
- [Issue governance](https://github.com/s977043/PlanGate/blob/main/docs/ai/issue-governance.md)
- [Metrics privacy](https://github.com/s977043/PlanGate/blob/main/docs/ai/metrics-privacy.md)
- [Metrics 運用 guide](https://github.com/s977043/PlanGate/blob/main/docs/ai/metrics.md)
- [Hook enforcement](https://github.com/s977043/PlanGate/blob/main/docs/ai/hook-enforcement.md)
