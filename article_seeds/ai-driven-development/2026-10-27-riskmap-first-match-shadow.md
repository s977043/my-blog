---
seed_id: seed-20261027-riskmap-first-match-shadow
title: "先に一致したルールが、後ろの厳しいルールを隠す：river-review の risk-map の first-match を診断する"
date: 2026-10-27
status: seed
topics:
  - code-review
  - ai-review
  - glob
  - river-review
source: experience
source_url: https://github.com/s977043/river-review/pull/2784
source_ref: s977043/river-review 8db74959
evidence_status: observed
promoted_to:
article_type_candidates:
  - deep-dive
---

# 先に一致したルールが、後ろの厳しいルールを隠す：river-review の risk-map の first-match を診断する

## 観測事実

- s977043/river-review の `src/lib/risk-map.mjs` の `evaluateRisk` は、変更ファイルごとに `rules` を上から見て、最初に一致したルールの `action` を採る（first-match。`minimatch(file, pattern, { dot: true })` で判定）
- Issue #2781（OPEN）の Slice A が、`src/** -> comment_only` が先で `src/auth/** -> require_human_review` が後の場合、認証パスの厳しいルールが隠れることを挙げている
- PR #2784（MERGED、merge `8db74959`）が `diagnoseShadowedRiskRules(riskMap, filePaths)` を追加した
  - 実際の変更ファイルについて、最初に一致したルールより `action` の優先度が高い後続ルールを findings として返す。優先度は `comment_only` 0 < `escalate` 1 < `require_human_review` 2
  - glob 同士の包含を仮定で調べるのではなく、実際に一致したパスだけを報告する（関数の JSDoc）
  - first-match の評価・ルーティング・承認は変えない。出力に `authorizesApproval: false` と `evidenceTrust: 'unverified-input'` を持つ
  - risk map が無い・変更ファイルが空のときは `status: 'unknown'`、不正な入力は `RiskMapError` を投げる（空の findings を「問題なし」に見せない）
- PR #2780（MERGED）は別件で、Risk Map 未設定時に小さな認証・決済系の変更を Router が `team` 以上へ引き上げる。first-match は変更しない

## 2026-10-27 の再現（筆者のワーカーが実行）

river-review の main を shallow clone（HEAD `56dadfe2`）し、`npm ci --ignore-scripts` 後に次を実行。

- 入力: rules = `[{src/**, comment_only}, {src/auth/**, require_human_review}]`、files = `['src/auth/login.ts', 'src/app.ts']`
- `evaluateRisk`: 2 ファイルとも `comment_only`、`aggregateAction: comment_only`、`humanReviewFiles: []`
- `diagnoseShadowedRiskRules`: findings 1 件（`src/auth/login.ts`、selectedRuleIndex 0 `src/**` comment_only、shadowedRuleIndex 1 `src/auth/**` require_human_review）
- `node --test tests/risk-map.test.mjs`: tests 24 / pass 24 / fail 0（うち名前が `shadow diagnostic:` で始まるテストは 8 件。`grep -c` で計数）
- `src/` 内で `diagnoseShadowedRiskRules` を呼んでいるのは定義ファイルのみ（grep）。Router や Gate にはまだ組み込まれていない

## 自分の解釈

first-match は「書いた順に読める」利点がある一方、広いルールを先に書くと、後ろに足した厳しいルールが黙って効かなくなる。順序の誤りは設定の見た目からは分からず、AI レビューのリスク分類が甘くなる形で表に出る。

## 違和感 / Reader Problem

AI レビューや CI に「パスごとのリスク規則」を書いているチームは、規則を足した時点で効いていると思いがちで、先に書いた広い規則に隠れていないかを確かめていない。

## 今の仮説

- 順序を直すより先に、「実際の変更ファイルで、隠れた厳しい規則があるか」を診断として出すと、既存の挙動を変えずに気づける
- 診断結果を承認の根拠にしない（空でも安全の証明ではない）ことが、診断を入れるときの要点になる

## 記事化の角度

- 深掘り: first-match の落とし穴 → 再現 → 診断の設計（実パスのみ・優先度比較・unknown と例外・承認権限を持たない）→ 他の規則ファイル（CODEOWNERS の後勝ち）との対比

## Draft Article Plan: zenn/riskmap-first-match-shadow

- approved_at:
- channel: zenn
- slug: riskmap-first-match-shadow
- article_type: deep-dive
- reader_problem: AI レビューや CI でパスごとのリスク規則を順序付きで書いている開発者は、広い規則を先に書くと後ろの厳しい規則が first-match で隠れ、認証まわりの変更が軽いレビューで通ることに気づいていない
- central_claim（案・著者確認待ち）: 順序付き first-match のリスク規則は、広い規則の後ろに置いた厳しい規則を黙って無効にする。規則の順序を正しく書く努力に頼るより、実際の変更ファイルに対して「隠れた厳しい規則」を読み取り専用で診断し、その結果を承認の根拠にしない形で出すほうが、既存の挙動を壊さずに分類の甘さを見つけられる。
- out_of_scope: 下記「書かない範囲」の守る線
- recommended_channel_reason: Zenn は技術深掘りの役割。関数の設計判断（実パスのみ・優先度・unknown・承認権限なし）を再現コード付きで説明する内容のため

### Why / What

- Why: 上記 reader_problem
- What: central_claim（案）。主張は著者が決める

### Evidence Boundary

- Observed:
  - s977043/river-review PR #2784 の本文・差分（`src/lib/risk-map.mjs`、`tests/risk-map.test.mjs`）
  - Issue #2781 の Slice A の記述、PR #2780 の本文
  - 2026-10-27 の再現結果（本 Seed「2026-10-27 の再現」節。evaluateRisk は comment_only、診断は findings 1 件、テスト 24/24 pass）
- Verified（市場調査。オーガナイザーの調査を URL として残す。本文で使う前に再確認する）:
  - CODEOWNERS は後勝ちで規則が隠れる問題が知られる: https://docs.rs/crate/codeowner/0.1.0 （`shadowed()`）
  - 日本語の上位記事は規則の書き方の説明で止まる: https://zenn.dev/kimuchan/articles/9152895c1761a9 、 https://qiita.com/FumiyaShibusawa/items/c7a3ff4d0793ca2d281f
- Hypothesis:
  - 「厳しい規則が隠れていないかを診断する」記事と「AI レビューのリスク分類が甘くなる」切り口は日本語圏で見当たらない（調査の範囲での不在。網羅の証明ではない）
- Unverified:
  - 実運用の risk map で、この shadowing が実際に起きた事例（Issue #2781 の例は説明用の構成）
  - 診断を Router / CLI / レポートへ出す統合（Issue #2781 Slice D、未着手）
  - CODEOWNERS の後勝ちの公式仕様（GitHub Docs での確認は未実施）

### 書かない範囲

守る線（触れない）:

- my-blog の運用（記事作成の仕組み・スクリプト・レビューワークフロー）
- 会社リポジトリ由来の事例・数値（匿名化しても書かない）
- GitHub アカウントの併用や gh アカウントの話題
- Issue #2781 の Slice B〜D（5 軸リスク・hard floor・ペア比較）を実装済みのように書くこと
- 診断の結果が空なら安全、と読める書き方

文章上よければ触れてよい:

- PR #2780 のセンシティブパス昇格（first-match を変えない別の対策として 1〜2 文）
- CODEOWNERS の後勝ちとの対比（逆向きの順序規則でも同じ型の問題が起きる、の範囲）
- 順序を入れ替えるだけの直し方と、その限界

### 既存記事との重なり

公開済みの River Review 系 Zenn 記事（`river-review-core-design` / `river-review-judgment-placement` / `river-review-plugin-migration` / `river-reviewer-v033-improvement-loop` / `ai-dev-guardrail-plangate-river-reviewer` / `zenn-river-reviewer-architecture`）は設計思想・判断の置き場所・配布形態・リリース経緯・ガード全体像を扱い、本文に risk map や first-match の記述は無い（`grep -i "risk.map\|first-match"` で 0 件）。本記事は 1 つの評価関数の落とし穴と診断に絞るため主題は重ならない。

記事間リンク候補（同一プラットフォーム。双方向で対にする）:

- `/articles/river-review-judgment-placement`: 判断をどの層に置くか → 診断を承認に使わない設計の文脈
- `/articles/river-review-core-design`: チームの判断を残す設計の全体像
- `/articles/ai-dev-guardrail-plangate-river-reviewer`: 実装後ガードの全体像の中での位置づけ

### 未解決事項

- central_claim の確定（著者判断）。特に「順序を正しく書く努力に頼るより」の比較を残すか
- 実運用での発生事例を入れるか（入れるなら個人リポジトリの一次情報が要る）
- Slice D の統合が公開前に進んだ場合、記事の時点をどこに置くか
- CODEOWNERS の対比を本文に入れる場合、GitHub Docs で後勝ちの仕様を確認する
