---
title: "PlanGate v3 から v8.6 までの設計変遷：AI コーディング統制ハーネスはどう育ったか"
emoji: "🗺️"
type: "tech"
topics: ["ai", "claudecode", "oss", "automation", "harness"]
published: true
---

**PlanGate は v3 から v8.6 までの 1 か月で、「AI に作業させる仕組み」から「AI を止め、観測し、再現可能にする統制ハーネス」へ育ちました。**

PlanGate は AI コーディングエージェントを「承認してから動かす」ためのハーネスです。

v3.0.0（2026-04-09）で AI 駆動開発ワークフローの基盤を出してから、v8.6.0（2026-05-04）で Metrics v1 と Governance が揃うまで、約 1 か月で 24 リリースを刻んできました。

各バージョンは個別の CHANGELOG を読めば追えますが、「**なぜその順序で機能が積み上がったのか**」は時系列を俯瞰しないと見えません。

この記事は、その 1 か月の変遷を **4 つの設計軸** で整理し直す振り返りです。次の v8.7 以降に向けた地図として使えるよう、各軸の到達点と未解決の論点もあわせて書きました。

:::message
この記事で得られること

- PlanGate v3 〜 v8.6 の進化を 4 軸（ゲート / モード / 実行層 / 契約）で読む視点
- 各軸での「最初に置いた仕様」と「現在の到達点」のギャップ
- バージョン別年表（v3 から v8.6 まで 24 リリース）
- v8.7 以降の Roadmap が依存している前提条件
:::

## TL;DR

PlanGate の進化は、独立した機能追加の連続ではなく、**4 つの設計軸** が並行して育ってきた結果として整理できます。

| 軸 | v3 時点の状態 | v8.6 時点の到達点 |
|---|---|---|
| **止める**（ゲート設計） | 計画承認後に進むゲート型モデル | C-3 三値 + V-1〜V-4 + Hook 10/10 + Metrics |
| **選ぶ**（モード分類） | 「ライト / フル」の 2 分類 | 5 モード × GatePolicy × Workflow DSL |
| **動かす**（実行層） | Plan / ToDo / Test Cases の手書き運用 | Workflow YAML + CLI + Provider RFC + Orchestrator |
| **証明する**（契約と検証） | Markdown ベースの規約 | Artifact schema 7 種を起点に、model / eval / event schema と CI 検証へ拡張 |

v8.6 時点では、モード選択、GatePolicy、Workflow DSL、CLI、Provider RFC、JSON Schema、eval runner、Metrics v1 が揃い、PlanGate は **「実行前に契約し、実行中に止め、実行後に観測する」** 構造になりました。

「止めるための仕組み」と「止めたことを観測する仕組み」が、別々に育って v8.6 で合流したのが、この 1 か月の本質です。

## この記事の対象読者

- AI コーディングエージェントの運用設計を、自プロジェクトに取り入れようと検討中の人
- PlanGate を v8 系から触り始めて、過去の設計判断の経緯を知りたい人
- 「ゲート型ワークフロー」「ハーネスエンジニアリング」の設計トレードオフに興味がある人
- 自分のチームの開発統制を、感覚ではなくドキュメントとスキーマで運用したい人

## 軸 1: 止める — ゲート設計の進化

PlanGate の中核は「**承認なし、コードなし**」という Iron Law です。この一行を成立させるための仕組みが、4 段階で育ってきました。

### v3.0.0（2026-04-09）— ゲート型モデルの導入

- PBI から Plan / ToDo / Test Cases を生成する基本フローを定義
- 計画承認後に Agent 実行へ進む **ゲート型モデル** を初めて導入
- この時点では「承認 → 実行」の前後関係を Markdown 規約として定義した段階で、ゲート判定値の機械化はこれから

### v4.0.0（2026-04-09）— C-3 三値化と V-1〜V-4 の輪郭

- ゲート判定を **APPROVE / CONDITIONAL / REJECT** の三値（C-3）として整理
- V-1〜V-4 の検証段階（実装後検証）を導入
- 「止めるか進めるか」の二択から、「条件付きで進める」が運用上の前提になった

### v5.0.0 〜 v7.x — ハーネスエンジニアリングへの拡張

- v5.0.0 で L-0 リンター自動修正ループを設計し、検証段階の足場を整備
- v6.0.0 で Context Engineering と 18 エージェント体制、タスク規模別モード分類の方向性を整理
- v7.0.0 で Workflow / Skill / Agent の 3 層に再構築（後述「軸 3」）
- v7.4.0 で **Artifact JSON Schema 7 種** と `c3.json` gate enforcement spec を投入し、ゲートが機械可読になった

ここまでで「ゲートの仕様」は固まりましたが、**実際にエージェントを止める強制力** はまだ規約レベルでした。

### v8.4.0 〜 v8.5.0（2026-05-01）— Hook enforcement で実行時に止める

たとえば C-3 承認が通っていない状態で `bin/plangate exec` を起動しようとすると、EH-2 hook が即座にブロックします。「実装に進む前に必ず承認が通っている」という不変条件が、規約ではなく実行時に守られるようになったのがこのフェーズです。

- v8.4.0 で **3 mode hook 設計**（default warning / strict block / bypass escape）を導入し、3 つの hook（EH-2: C-3 承認なし実装の検知 / EHS-2: handoff 必須要素チェック / EHS-3: fix loop 上限）を実装
- v8.5.0 で残り 7 hook を完走し、**10/10 hooks 実装完了**
  - PreToolUse 系：plan.md なし production code 編集を block、c3.json plan_hash と現 plan.md を突合、forbidden_files glob で scope 外編集を block
  - CLI 系：V-1 前の test-cases.md 不在を warn / block、PR 作成前の verification evidence 不在を block、merge 承認漏れの検知、V-3 review の mode 連携必須化

これで「ゲートが規約上存在するが、実装が違反していた」という従来の抜け穴が、Claude Code / Codex の実行レイヤーで塞がりました。

### v8.6.0（2026-05-04）— 止めた回数を観測する Metrics v1

- 11 events の JSON Schema（task_initialized / plan_generated / c3_decided / exec_started / hook_violation / v1_completed / fix_loop_incremented / external_review_completed / pr_created / c4_decided / handoff_completed）を定義
- `plangate metrics --collect / --report` で TASK ディレクトリから自動導出
- v8.5.0 までの「止める」と、v8.6.0 で乗った「観測する」が合流

これにより、たとえば「forbidden_files の hook violation が特定 PBI で多い」「C-3 が CONDITIONAL になりやすい mode がある」といった傾向を週次に振り返り、次スプリントの allowed_files 設計やモード再分類の判断材料にできます。**観測対象が定量化されたことで、ハーネス改善の議論が感想ベースから件数ベースに変わりました。**

ゲート設計の到達点は「**止めるべきところで止め、止めた回数を後から比較できる状態**」です。

## 軸 2: 選ぶ — リスク別モードの精緻化

PlanGate のモード分類は、タスクの規模・リスクに応じてゲートの厳しさを変える仕組みです。当初の 2 分類から、機械可読な GatePolicy まで段階的に育ってきました。

### v6.0.0 — タスク規模別モード分類の方向性

- ライト / フルの 2 分類を起点に、`ultra-light / light / standard / high-risk / critical` の 5 段階へ向かう方向性を整理
- この時点では適用ゲートとの対応はドキュメント表レベルで、docs 側の「ライト / フル」表記が完全に 5 モード表に置き換わるのは v8.2.0

### v7.2.0（2026-04-26）— GatePolicy と skill-policy-router

- Intent + Mode → GatePolicy（requiredSkills / requiresEvidence / requiresFailingTestFirst / requiresWorktree）を機械可読化
- design-gate / review-gate / completion-gate / worktree-policy をルール化し、mode から自動適用
- `full` → `high-risk` のリネーム完了（v7.3.0 で命名統一）

### v8.0.0（2026-04-27）— Workflow DSL でモードを完全機械化

- `workflows/` 配下に 5 モード分の YAML（ultra-light / light / standard / high-risk / critical）
- 各フェーズの完了条件・入出力・担当エージェントを機械可読に定義
- `tests/run-tests.sh` で CLI テスト 4 件、CI 統合（後の v8.5 で 42 テストまで拡大）

### v8.1.0（2026-04-27）— validate --mode でゲート要件を動的決定

- `bin/plangate validate --mode <mode>` が `workflows/<mode>.yaml` を読み込み、`gate_enforcement.c3.required_artifacts` から artifact リストを動的決定
- v7.4 で書いた仕様（`c3.json`）を、v8.0 の DSL と接続して **モードごとに artifact 必須リストが自動切り替わる** 状態に到達

到達点は「**モードを宣言するだけで、要件・ゲート・テストの厳しさが連動して切り替わる**」です。

## 軸 3: 動かす — CLI・Provider・Orchestrator

「誰が・何を・どの順で実行するか」の整理が、3 ステップで進みました。

### v7.0.0（2026-04-20）— Workflow / Skill / Agent の 3 層分離

- `docs/plangate-v7-hybrid.md` で 3 層アーキテクチャを正本化
- WF-01〜WF-05 の Workflow 定義
- v7 用 Skill / Agent の責務を分離

### v7.5.x（2026-04-27）— `bin/plangate` CLI の登場

- v7.5.1 で CLI v0.1.0 を投入：`init / doctor / status / validate / abort / timeline / resume`
- v7.5.2 で macOS 環境向け python3 修正
- 「ドキュメントに書いた手順」を「コマンド一発」に置き換える基盤が揃った

### v8.0.0 〜 v8.1.0 — Provider RFC から外部エージェント実行へ

- v8.0.0 で `docs/rfc/provider-gemini-cli.md`（外部レビュー役割）と `docs/rfc/provider-opencode.md`（実装エージェント役割）を策定
- v8.1.0 で `bin/plangate review`（Gemini CLI 呼び出し）と `bin/plangate exec`（OpenCode 起動、C-3 未通過なら block）を実装
- 「Claude Code 専用」だった構造が「Provider 差し替え可能」に拡張

### v8.2.0（2026-04-28）— Parent-Child PBI Orchestrator Mode

- `docs/orchestrator-mode.md` で親 PBI → 子 PBI 分解 / 統合の Workflow を正本化
- `docs/schemas/child-pbi.yaml` で子 PBI YAML スキーマを定義
- 後の v8.3.0 で実運用ケース第一号として PBI-116 を 4 phase で完走

実行層の到達点は「**単一エージェントの直列実行から、複数エージェント・複数 Provider の並列・統合実行**」までスコープが広がった状態です。

## 軸 4: 証明する — 契約・Schema・Metrics

「規約として書く」から「スキーマで検証する」への移行が、3 ステップで進みました。

### v7.4.0（2026-04-26）— Artifact JSON Schema 7 種

- `schemas/` に pbi-input / plan / todo / test-cases / review-self / review-external / handoff の 7 スキーマ
- `docs/working/templates/` に frontmatter（task_id / artifact_type / schema_version / status）を追加
- `c3.json` の gate enforcement spec を初めて定義

### v8.3.0（2026-04-30）— Outcome-first contract と Prompt Assembly

- `docs/ai/core-contract.md` で Iron Law 7 項目を **outcome-first 形式** で正本化（GPT-5.5 以降のモデル特性に対応）
- `docs/ai/model-profiles.yaml` と `schemas/model-profile.schema.json` で実行モデル別 4 profile（gpt-5_5 / gpt-5_5_pro / gpt-5_mini / legacy_or_unknown）
- `docs/ai/prompt-assembly.md` で 4 層 Prompt Assembly（base_contract / phase_contract / risk_mode_contract / model_adapter）
- Structured Outputs で review-result / acceptance-result / mode-classification / handoff-summary の 4 schema を追加
- Eval framework を 8 観点に整理し、4 観点を release blocker に指定

### v8.4.0（2026-05-01）— Schema validate CI と eval runner

- `scripts/validate-schemas.py` + `bin/plangate validate-schemas` + `.github/workflows/schema-validate.yml` で **JSON artifact の schema 機械検証**
- `bin/plangate eval` + `scripts/eval-runner.py` + `schemas/eval-result.schema.json` で **8 観点機械評価 CLI**
- baseline 比較・release blocker 違反検知が CI に統合

### v8.6.0（2026-05-04）— Metrics v1 とプライバシー contract

- `docs/ai/metrics-privacy.md` で保存可能 12 カテゴリ / 禁止 9 カテゴリを正本化（schema 設計時に §4 Forbidden が schema 上に存在しない設計を強制）
- `schemas/plangate-event.schema.json` で 11 events を JSON Schema 化
- v8.5.0 までで「契約に違反したら止める」、v8.6.0 で「契約に沿った行動を記録する」が揃った

到達点は「**契約は Markdown だけでなく JSON Schema として存在し、CI とランタイム hook の両方で検証される**」状態です。

## バージョン年表

> この年表は辞書的に参照するためのものです。設計意図は前半の 4 軸で説明しています。

4 軸の変遷を時系列で俯瞰すると、こうなります。

| Version | Date | 主な追加 |
|---|---|---|
| v3.0.0 | 2026-04-09 | AI 駆動開発ワークフロー基盤、ゲート型モデル |
| v4.0.0 | 2026-04-09 | C-3 三値ゲート、V-1〜V-4 検証段階 |
| v5.0.0 | 2026-04-09 | L-0 リンター自動修正ループ、ハーネスエンジニアリング統合 |
| v6.0.0 | 2026-04-09 | Context Engineering、18 エージェント、5 段階モード |
| v7.0.0 | 2026-04-20 | Workflow / Skill / Agent の 3 層再構築 |
| v7.1.0 | 2026-04-23 | README 刷新、GitHub Pages、Codex CLI 共用スキル |
| v7.2.0 | 2026-04-26 | Phase 1〜3（軽量スキル / 強制ゲート / エージェント統制） |
| v7.3.x | 2026-04-26〜27 | OSS governance、setup-team、命名統一 |
| v7.4.0 | 2026-04-26 | JSON Schema 7 種、c3.json gate enforcement spec |
| v7.5.x | 2026-04-27 | bin/plangate CLI v0.1.0 |
| v8.0.x | 2026-04-27 | Workflow DSL、Provider RFC、CLI テストスイート |
| v8.1.0 | 2026-04-27 | validate --mode、review、exec |
| v8.2.0 | 2026-04-28 | Parent-Child PBI Orchestrator Mode 仕様 |
| v8.3.0 | 2026-04-30 | Outcome-first / Model Profile / Prompt Assembly / Eval 基盤 |
| v8.4.0 | 2026-05-01 | Eval runner、Schema validate CI、Hook 3 mode 設計 |
| v8.5.0 | 2026-05-01 | Hook enforcement 10/10 完成 |
| v8.6.0 | 2026-05-04 | Metrics v1、Issue Governance、Baseline |

## 4 軸を支えた「普及・運用導線」

4 軸とは別に、PlanGate を OSS として外に出し、チームで使えるようにするためのリリースが挟まっています。

- **v7.1.0（2026-04-23）** — README 刷新、GitHub Pages 公開、`docs/philosophy.md` 分離、MIT LICENSE 追加、Codex CLI / Claude Code 共用スキルを `.agents/skills/` に整備。「使ってもらう導線」と「思想ドキュメント」をここで分離した。
- **v7.3.x（2026-04-26〜27）** — `docs/oss-governance.md` で Required approvals / Scorecard / Actions allowlist を確定、英語版 README と `examples/` のサンプル整備、`setup-team` skill 追加、`full → high-risk` の命名完全統一。OSS とチーム運用の足場が揃ったのがこの段階。

これらは 4 軸の機能追加とは別の系統ですが、後続の v8 系を「他人が再現できる harness」にするうえで効いています。

## v8.7 以降の 3 つのテーマ

v8.6.0 完了時点で次に控える Roadmap は数多くありますが、本稿の 4 軸との接続で見ると 3 つのテーマに圧縮できます。

1. **比較駆動の改善** — Eval comparison（#196）、Keep Rate v1（#198）、Reporting & Retrospective（#200）。v8.4 の eval runner と v8.6 の baseline / Metrics events を前提にした「数字で改善する」系。
2. **Provider と Model の拡張** — Model Profile v2（#197）、Dynamic Context Engine v1（#199）。v8.3 の 4 profile と Prompt Assembly 4 層を実行時に組み立て直す系。
3. **エラー分類とベンチ整備** — Tool Error Taxonomy（#203）、PlanGateBench Fixture Suite（#204）。v8.4 の Schema validate CI を起点に、回復ポリシーと回帰検知を機械化する系。

つまり v3 〜 v8.6 までの設計変遷は、ここまでで「**改善前 baseline と比較できるハーネス**」を作り終えたフェーズと言えます。次は「比較で改善する」フェーズに入ります。

## この変遷を自プロジェクトに持ち込むなら

PlanGate の 1 か月を、ゼロから自プロジェクトに移植するなら、次の順序が無理が少ないと思います。

1. **承認ゲートを置く** — まず Plan / ToDo / Test Cases を生成し、承認後にしか Agent が動けないという運用ルールを Markdown で書く（v3〜v4 相当）
2. **モードを分ける** — タスクの規模・リスクに応じてゲートの厳しさを変える分類を入れる（v6〜v7.2 相当）
3. **成果物を schema 化する** — Markdown 規約を JSON Schema に落とし、CI で検証する（v7.4〜v8.4 相当）
4. **hook と metrics は最後に足す** — 規約と schema が安定してから、ランタイム hook で強制し、events を集計する（v8.5〜v8.6 相当）

逆順にしてしまうと、観測対象（events）が定義しきれないまま hook を組むことになり、後で全部書き直しになります。

## まとめ

PlanGate v3 〜 v8.6 を 4 軸で読み直すと、機能追加の順序にも内的な必然性が見えてきます。

- 止める（ゲート設計）：ゲート型モデル → C-3 三値 + V-1〜V-4 → Hook 10/10 → Metrics
- 選ぶ（モード分類）：2 分類 → 5 段階の方向性 → GatePolicy → Workflow DSL → validate --mode
- 動かす（実行層）：3 層分離 → CLI → Provider RFC → Orchestrator
- 証明する（契約と検証）：Markdown 規約 → Artifact schema 7 種 → CI 統合 → Outcome-first → event schema

「止める」「観測する」「比較する」が、それぞれ独立に育って合流するまでに 1 か月かかりました。同じことを自プロジェクトでゼロから設計するなら、この順序を参考に分解できると思います。

## 持ち帰る設計原則

PlanGate の変遷から得られる教訓は、**AI コーディングの統制は最初から巨大な基盤として作る必要はない**、ということです。

- まず **Markdown の契約** で止める（v3〜v4 相当）
- 次に **モード** で分ける（v6〜v7.2 相当）
- **CLI** で実行経路を固定する（v7.5〜v8.1 相当）
- **Schema** で機械検証する（v7.4〜v8.4 相当）
- 最後に **Metrics** で観測する（v8.5〜v8.6 相当）

この順序なら、個人開発でもチーム開発でも段階的に導入できます。逆順で「先に Metrics や Hook から作ろう」とすると、観測対象や強制対象が定まらないまま実装に着手することになり、後で全部書き直しになります。

統制ハーネスの設計は、機能の総量ではなく、入れる順序が品質を決めます。

## 参考リンク

- [PlanGate リポジトリ](https://github.com/s977043/plangate)
- [PlanGate CHANGELOG.md](https://github.com/s977043/plangate/blob/main/CHANGELOG.md)
- [v8.6.0 の Metrics v1 と Governance を扱った記事](https://zenn.dev/minewo/articles/plangate-v86-hook-enforcement)
