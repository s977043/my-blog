---
seed_id: seed-20261025-codex-skill-budget-overflow
title: "Codex でプラグインのスキルが出てこない原因は、スキル一覧の予算超過"
date: 2026-10-25
status: seed
topics:
  - codex
  - agent-skills
  - plugin
source: experience
source_url: https://github.com/s977043/river-review/pull/2782
source_ref: s977043/river-review 653cc7ca
evidence_status: observed
promoted_to:
article_type_candidates:
  - tips
---

# Codex でプラグインのスキルが出てこない原因は、スキル一覧の予算超過

## 観測事実

- s977043/river-review の Issue #2778 で、Codex に導入・有効化済みの River Review の配布スキルが `codex debug prompt-input` に出なかった
- PR #2782（merge `653cc7ca`）の調査結果: manifest（ネストした `skills` パス）は正しく読まれており、原因はスキル一覧の予算超過による切り捨て
  - 実環境・既定の予算: 配布スキル 12 個中 0 個
  - 隔離した `CODEX_HOME`（River Review のみ）: 12 個
  - 実環境で `codex -c skills.max_context_tokens=200000 debug prompt-input test`: 12 個
- 同 PR で `pages/guides/troubleshooting.md`（ja/en）のプラグイン節に確認方法と対処を追記した（codex-cli 0.160.1 で確認、と記載）

## 自分の解釈

「導入したのにスキルが出ない」は配布定義の不備を疑いがちだが、ほかのプラグインのスキルと合わせた一覧の大きさで決まることがある。

## 違和感 / Reader Problem

Codex にプラグインを入れたのにスキルが使えない開発者は、manifest や導入手順を疑って時間を使い、スキル一覧の予算を確かめていない。

## 今の仮説

`codex debug prompt-input` で一覧を見る → 隔離した `CODEX_HOME` で比べる → 予算を変えて比べる、の 3 段で切り分けられる。

## 記事化の角度

- Tips: 症状・切り分け 3 段・対処（使っていないプラグインを外す / `skills.max_context_tokens` を上げる）

## Draft Article Plan: qiita/codex-skill-budget-overflow

- approved_at:
- channel: qiita
- slug: codex-skill-budget-overflow
- article_type: tips
- reader_problem: Codex にプラグインを導入・有効化したのにスキルが出てこない開発者は、manifest や導入手順を疑い、スキル一覧の予算超過を確かめていない
- central_claim: Codex でスキルが出ないときは、スキル一覧の予算超過を疑い、`codex debug prompt-input` と隔離した `CODEX_HOME` で切り分け、プラグインを減らすか `skills.max_context_tokens` を上げて対処する。
- out_of_scope: my-blog の運用、会社リポジトリの事例、Claude Code 側のスキル予算（比べる場合は別の一次情報が要る）、River Review の設計全般、200000 を推奨値として書くこと
- recommended_channel_reason: 短い実務 Tips で、エラー症状からの検索入口になる

### Evidence Boundary

- Observed:
  - 範囲: s977043/river-review の Issue #2778・PR #2782・`pages/guides/troubleshooting.md` のプラグイン節（項目 5）
  - 既定の予算で 12 個中 0 個、隔離 `CODEX_HOME` で 12 個、`skills.max_context_tokens=200000` で 12 個（PR #2782 本文の値。codex-cli 0.160.1）
  - 2026-10-25 再実測（codex-cli 0.160.1、同じ実環境）: `codex debug prompt-input test` の出力に現れる River Review の配布スキル（12 個）の数は、既定の予算で 0、`skills.max_context_tokens=10000` で 12、`=200000` で 12。数え方は `river-review:<name>` の異なり（コマンド由来の `source-command-*` 4 件は除外）
- Verified（2026-10-25 に WebFetch で確認。両 URL は learn.chatgpt.com へ 308 リダイレクト）:
  - https://developers.openai.com/codex/config-reference （→ https://learn.chatgpt.com/docs/config-file/config-reference ）: `skills.max_context_tokens` はスキル一覧の予算。既定はモデルのコンテキストウィンドウの 2%、明示した値の上限は 10,000 トークン
  - https://developers.openai.com/codex/skills （→ https://learn.chatgpt.com/docs/build-skills ）: 予算を超えると、まず説明文を短くし、スキルが多いと最初の一覧から一部を省いて警告を出す。予算がかかるのは最初の一覧だけで、選んだスキルは SKILL.md の全文を読む。ウィンドウサイズ不明時は 8,000 文字
- Hypothesis:
  - 名前順で後ろにあるスキルから落ちる（troubleshooting.md の記述。公式ドキュメントでは未確認）
- Unverified:
  - 上限 10,000 を超える値（200000）を指定したときの実際の扱い（切り詰められるのか、エラーか）
  - 省かれたときに出る警告の文言と、実測時に警告が出ていたか

### 未解決事項

- （解消 2026-10-25）実測で使った 200000 は公式の上限 10,000 を超えていた。10,000 で再実測し、12 個すべて出ることを確認した。本文では 10,000 以内の値を使う
