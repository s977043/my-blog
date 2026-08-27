<!-- publish-readiness: blocked=false mustHigh=0 verified=false articleHash=6a3cad2002bb4dfba4035cd30f5d927f26e45c3b loops=3 reviewedAt=2026-08-26T17:32:22Z -->

# レビュー成果物: river-review-judgment-placement

- 対象記事: `articles/river-review-judgment-placement.md`
- 改善ループ数: **3**
- レビュー状態: **manual-3-loop / Humanize・Record 未実行**
- 総合判定: **内容面は収束（must / high / medium = 0）**
- `verified`: **false** — 正規 `/review-improve-loop` の Humanize / Record フェーズを実行したとは扱わない
- 対象記事 blob hash: `6a3cad2002bb4dfba4035cd30f5d927f26e45c3b`

> この成果物は PR #526 で実施した「レビュー → 改善 → 再レビュー」3ループを永続化するものです。`verified=true` は記録していません。Zenn の `published:false → true` は `docs/publish-operating-policy.md` の著者ゲートであり、本レビュー成果物の存在だけでは公開承認を意味しません。

## 1. Loop 1 — 構成 / 読者価値

commit: `63084d598c2094623224ee47180e31e6b1263886`

主な反映:

- タイトルを「AIコードレビュー」を先に出す構成へ変更
- 冒頭で対象読者、得られること、検証対象、扱わない範囲を明示
- 4層へ日本語の役割説明を追加
- Judgment Placement と Human Judgment Focus（崖 / 丘 / 原っぱ）が別軸であることを追加
- River Review の検証対象 commit を `56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9` に固定
- Deterministic Command の Trust Boundary と feature gate を明記
- 実装済み / 設計原則 / 拡張中を状態表で分離

判定: **must / high / medium の未解決なし**。

## 2. Loop 2 — 主張の精度 / 時間耐性

commit: `5439193ef03915a63322ea7a60476b7ad8b91131`

主な反映:

- 「LLMを使う理由はほとんどない」という一般化をやめ、River Review 内の Source of Truth 責務として説明
- `最新実装例` を `検証対象commitの実装例` に変更
- Provider に関する一般化を、判断基準を Provider 側へ置く構成に限定

判定: **must / high / medium の未解決なし**。

## 3. Loop 3 — 適用限界 / 最小導入

commit: `f4d51379eda47482b98f99bd511eb4c31494b84c`

主な反映:

- `Promotionを見送る条件` を独立セクション化
  - 条件を安定して明文化できない
  - rule 化で意味や重要な例外を失う
  - 安全性 / 説明可能性 / 保守性が下がる
  - Human Judgment が必要
- 「Deterministicへ寄せるほど成熟」という誤解を明示的に否定
- 終盤を `最小導入：レビュー観点を1つ分類してみる` へ変更

判定: **must / high / medium の未解決なし、内容面は収束**。

## 4. 技術的事実検証

一次ソースとして River Review の次を照合した。

- `pages/explanation/judgment-placement.md`
  - Deterministic / Heuristic / Agentic Review / Human Judgment の4層
  - promotion
  - Human Judgment Focus との2軸
- `pages/reference/skill-schema.md`
  - `evaluationType: deterministic | heuristic | agentic`
  - `deterministicGate`
- `.claude/rules/review-core.md`
  - Static Analysis と AI Review の責務分離
  - false-positive を canary test へ戻す方針
- `src/lib/deterministic-gate.mjs`
  - deterministic `strict_block`
  - Gate 未宣言 deterministic Skill は advisory
- `src/lib/deterministic-command-orchestrator.mjs`
  - host-trusted allowlist / exact argv / sandbox / safe-default
  - review pipeline の feature gate
- `src/lib/finding-critic.mjs`
  - Evidence-Grounded Adversarial Review Phase 1a deterministic skeleton

検証対象 River Review commit: `56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9`。

## 5. Zenn記事としての判定

| 観点 | 判定 | コメント |
| --- | --- | --- |
| Zennカテゴリー | OK | 自作OSSの実装・設計判断が中心のため `type: tech` で妥当 |
| 構成タイプ | OK | 設計 / アーキテクチャ記事 |
| Webディレクター | OK | 読者課題 → 4層 → 実装 → 限界 → 最小導入まで論理を追える |
| Web編集者 | OK | 過剰な一般化と時間依存表現を抑制済み |
| Webエンジニア | OK | Skill Schema / Gate / Trust Boundary / critic 実装へ降りている |
| 技術的事実検証 | OK | 検証対象 commit と一次ソースを固定して照合済み |

## 6. 残る境界

### 内容面

- `must`: **0**
- `high`: **0**
- `medium`: **0**
- `blocked`: **false**

### ワークフロー面

- `verified=false` のまま。正規 `/review-improve-loop` の Humanize / Record 実行済みとは扱わない
- `published: false` を維持
- `published: false → true` は著者の明示承認が必要
- release/zenn sync PR の merge は Zenn deploy を発火するため、別の著者ゲート

## 7. 結論

記事内容は3ループで収束しており、PR #526 は required checks 通過後に main へ squash merge 済み。

公開工程へ進む場合は、`/publish-zenn river-review-judgment-placement` の事前ゲートを実行し、**著者が publish フラグ変更を明示承認した後に flip PR を作成 / マージ**する。その後、release/zenn sync PR を作成し、Zenn deploy 発火前に再度著者ゲートを置く。
