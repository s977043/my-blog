---
title: 'River Reviewer v0.30→v0.33：Improvement Loop と applyTo Scoping 整備の半月'
emoji: '🌊'
type: 'tech'
topics: ['ai', 'codereview', 'AgentSkills', 'AI駆動開発', 'oss']
published: true
---

> 本記事は River Reviewer v0.30.0〜v0.33.0 の作業ログ（2026-05-08 時点）を再構成したものです。

## TL;DR

- v0.30.0〜v0.33.0 の半月で、River Reviewer は「レビューを実行するだけのエージェント」から「レビュー結果を検証してフィードバックを仕組み（テストケース / 抑制ルール / リファレンス）に還元するループ（Improvement Loop OS、以下「改善ループ」と呼ぶ "レビュー → 検証 → 仕組み化" の運用基盤）」へ再定義された。
- Epic #743 (P1+P2) で、エントリスキル `river-reviewer` の責務（入力分類 / 専門スキル選定 / 検証 / フィードバック分類 / ループ引き継ぎ）が明文化された。
- `applyTo` の scoping ルール（`docs/development/skill-applyto-scoping.md`）が新設され、planner false-positive routing（誤ルーティング）を誘発していた広すぎる glob を 2 バッチ計 13 skill で整理した。
- planner-dataset eval（routing 用の評価セット、`coverage=1.0 / top1Match=1.0` / 23 cases）は全期間を通して green を保ったまま、ルーティング回帰の検出力を上げる方向にしか動かしていない。

## 何が変わったか（high-level）

期間: 2026-04-30 (v0.29.0) 〜 2026-05-06 (v0.33.0)、計 4 リリース。

| Release | 主要変更 |
| ------- | -------- |
| v0.30.0 | `rr-upstream-context-budget-tuning-001` skill 追加 (#736) |
| v0.31.0 | **Epic #743 P1**: `river-reviewer` を improvement-loop orchestrator として再定義 + 3 references (VERIFICATION / FEEDBACK / IMPROVEMENT_LOOP) (#744 #745) |
| v0.32.0 | **Epic #743 P2**: routing/planner eval cases (#746) + feedback-to-fixture conversion workflow (#747) + suppression-feedback fixtures (#739) + eval-driven-skill-design skill (#737) |
| v0.33.0 | `applyTo` scoping rules + 13 skills 整理（Epic #762 / 実装 PR #766 #767） |

並行で `dependabot` 4 本 / `docusaurus` バージョン整列 / 翻訳 `#733` `#734` / `code_search` dependency 追加 (#738 PR-2) も完了している。

## Epic #743: improvement-loop orchestrator

### Before / After

**Before**: `skills/agent-skills/river-reviewer/SKILL.md` は「キーワードに応じて専門スキルへ振り分けるルーター」だった。誤検知や見落としは ad hoc な prompt 修正で消え、リポジトリには痕跡が残らない。

**After**: 同じ SKILL.md がエントリスキルの責務を以下 6 つに展開し、それぞれを reference に深掘りしている。

1. **Classify input intent** — ユーザー意図 / phase / artifact / risk から target カテゴリを決める
2. **Select specialist skills** — routing 表と優先度ルール
3. **Create review execution plan** — input 優先度に従って artifact を集める
4. **Verify findings** — `references/VERIFICATION.md` の self-check 6 項目
5. **Classify feedback** — `references/FEEDBACK.md` の 7-type taxonomy
6. **Hand off learnings** — `references/IMPROVEMENT_LOOP.md` の 9-step loop

### 3 つの reference の役割

| File | 役割 |
| ---- | ---- |
| `VERIFICATION.md` | finding 出力前の self-check（evidence が diff に紐づくか、impact が具体的か、severity と confidence が calibrated か など 6 項目）と reject 条件 |
| `FEEDBACK.md` | フィードバックを 7 type に分類: `accepted` / `false_positive` / `missed_issue` / `not_actionable` / `duplicate` / `accepted_risk` / `unclear`。それぞれを fixture / suppression / reference / routing のどこへ降ろすかも 1 対 1 で対応 |
| `IMPROVEMENT_LOOP.md` | 9 ステップのループ。Route → Review → Verify → Classify → Patch One Thing → Add Fixture → Run Eval → Record Learning → Promote Rule |

それに加えて、P2 で `FEEDBACK_TO_FIXTURE.md` が補完として入り、フィードバックタイプごとに「主 destination / 副 destination / 必須 eval コマンド / rationale 必須か」を 1 つの表にまとめた。`missed_issue` のとき root cause を **routing miss / missing context / weak instructions** の 3 種に分けて切り分ける手順も明文化されている。

### 何が嬉しいのか

- **prompt 修正だけで終わらせない** — 1 件のフィードバックは必ず fixture / reference / suppression / routing 更新へ降りる
- **HIGH_SEVERITY guard の意味が伝わる** — `major` / `critical` 指摘を `accepted_risk` 以外で抑止しても guard で再表示される、という挙動が docs と eval プロンプトで一貫
- **planner-dataset で routing が回帰検知できる** — 「architecture intent」「pre-mortem intent」「multi-skill (security + observability)」の 3 ケースを #746 で追加し、`coverage` と `top1Match` で守れるようになった

## eval-driven 改善ループ

### `npm run eval:fixtures` / `npm run planner:eval:dataset` をどこで使うか

`FEEDBACK_TO_FIXTURE.md` の変換表から抜粋。

| feedback type    | 主 destination                                                | 必須 eval コマンド                                                             |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `accepted`       | （変更なし）                                                  | `npm run eval:fixtures`                                                        |
| `false_positive` | guard fixture（`<NN>-guard.md` / `*-should-not-detect`）      | `npm run eval:fixtures` + `npm run eval:repo-context`                          |
| `missed_issue`   | happy-path fixture（`<NN>-happy.md` / `*-should-detect`）     | `npm run eval:fixtures` + `npm run eval:repo-context` + `npm run planner:eval:dataset` |
| `not_actionable` | reference の fix template / example 追記                      | `npm run skills:validate`                                                      |
| `duplicate`      | routing 更新（owner skill 明確化）または skill 内 dedupe ロジック | `npm run planner:eval:dataset` + `npm run skills:validate`                     |
| `accepted_risk`  | suppression entry（rationale 必須）                           | `npm run skills:validate`                                                      |
| `unclear`        | skill SKILL.md / reference の wording 改善                    | `npm run skills:validate`                                                      |

ローカルで eval が exit 0 になることを確認してから push する運用に揃えた。CI 通過のみに頼らない、というのが地味に効いている。

### 新スキル `rr-upstream-eval-driven-skill-design-001` (#737)

新規 `skills/**/SKILL.md` が PR に含まれているとき、`fixtures/` の **happy-path × guard ペア** と `eval/` 配線（`promptfoo.yaml` か `cases.json`）が揃っているかを確認する upstream skill。揃っていれば silent、欠けていれば minor 指摘を出して `npm run eval:fixtures` / `npm run eval:repo-context` への配線を案内する。Pre-execution Gate が新規 SKILL.md 追加にだけ反応するので、既存スキルの編集 PR では起動しない。

## applyTo scoping ルール（#762）

### 何が問題だったか

- `applyTo: ['**/*.ts', '**/*.tsx']` のような **bare extension glob** を持つ skill は、`tests/` 配下の test ファイルや `*.config.ts` といった「本来そのスキルの守備範囲ではない」ファイルにも fire していた。
- これは planner の false-positive routing として表面化する: prompt のトークンは消費されるが、出力は domain mismatch でノイズになりがち。

### 新ルール（`docs/development/skill-applyto-scoping.md`）

`applyTo` が "over-broad" となる 3 ケースを定義:

1. パターンが unconstrained (`'**/*'`) で、かつ skill が meta / process / sample ではない
2. パターンが拡張子のみで bound されているが、skill の review domain は stream-specific (upstream / midstream / downstream のいずれか)
3. 典型的なプロジェクトレイアウトに対して、skill の domain 外のファイルにマッチする（midstream code-quality skill が `tests/**` にマッチする等）

phase 別の推奨 applyTo を:

- **upstream**: `docs/architecture/**/*.md`, `docs/**/*architecture*.md`, `docs/**/*design*.md`, `**/*.adr` など
- **midstream**: `src/**/*.{ts,tsx}`, `app/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`, `packages/**/*.{ts,tsx}` (各拡張子で)
- **downstream**: `tests/**/*.{ts,tsx,js,jsx}`, `__tests__/**/*.{ts,tsx,js,jsx}`, `**/*.test.{ts,tsx,js,jsx}`, `**/*.spec.{ts,tsx,js,jsx}`

### 適用結果（13 skill）

Epic #762 の配下で、実装は 2 つの PR に分けて行った。

- **Batch 1** (#766, midstream 8 skill) — `**/*.ts` / `**/*.tsx` を `src|app|lib|packages` の dir-bounded に置き換え
- **Batch 2** (#767, upstream 5 skill) — `**/*.md` / `**/*.{yaml,yml,json}` を `docs|pages|specs|design|architecture` の dir-bounded に置き換え

planner-dataset eval は **23 cases / coverage=1.0 / top1Match=1.0** を全期間で維持。

audit 当初の「50 over-broad」推定値は実測 13 件と乖離していた。`excludedTags`（`sample` / `hello` / `policy` / `process` / `routing`）に該当するスキルは planner で除外されていて影響なし、というのが実測でわかった主な理由。

## 学び

- **仕組みに降ろす vs prompt に降ろす** — 1 件のフィードバックを fixture / suppression / reference / routing のどれかに必ず変換する規律が回ると、prompt 修正が再発しない
- **計画の数字は実測で検証する** — audit の "50 over-broad" 推定値は、`excludedTags` を考慮すると実際は 13 件だった。計画を数字で握る前に、実装側で測定する方が早い
- **planner-eval を guard にする** — `coverage=1.0 / top1Match=1.0` を merge ゲートにすると、scoping を narrowed しても routing 回帰を機械的に止められる
- **release-please は chore 系コミットを版上げ対象から外す** — docs / chore PR の連続マージで version が動かないのは仕様。今期は feat 系が並んだので 4 リリースに着地した

## 関連リンク

- [river-reviewer](https://github.com/s977043/river-reviewer) — リポジトリ
- [Epic #743](https://github.com/s977043/river-reviewer/issues/743) — Skill Improvement Loop
- [`docs/development/skill-applyto-scoping.md`](https://github.com/s977043/river-reviewer/blob/main/docs/development/skill-applyto-scoping.md) — applyTo scoping ルール
- [`skills/agent-skills/river-reviewer/references/IMPROVEMENT_LOOP.md`](https://github.com/s977043/river-reviewer/blob/main/skills/agent-skills/river-reviewer/references/IMPROVEMENT_LOOP.md) — 9-step loop
- [`skills/agent-skills/river-reviewer/references/FEEDBACK_TO_FIXTURE.md`](https://github.com/s977043/river-reviewer/blob/main/skills/agent-skills/river-reviewer/references/FEEDBACK_TO_FIXTURE.md) — feedback type → 変更先の対応表

