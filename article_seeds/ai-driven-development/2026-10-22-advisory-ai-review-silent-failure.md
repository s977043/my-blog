---
seed_id: seed-20261022-advisory-ai-review-silent-failure
title: "CI が green のまま、AI レビューが約 2 か月止まっていた"
date: 2026-10-22
status: seed
topics:
  - ai-review
  - ci
  - github-actions
source: experience
source_url: https://github.com/s977043/river-review/issues/2410
source_ref: s977043/river-review 6d378d9b
evidence_status: observed
promoted_to:
article_type_candidates:
  - experience
---

# CI が green のまま、AI レビューが約 2 か月止まっていた

## 観測事実

- GitHub Models は 2026-07-30 に退役した（https://github.blog/changelog/2026-07-30-github-models-is-now-retired/ 、事前告知 https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/ ）
- s977043/river-review の `.github/workflows/river-review.yml` は LLM レビューの接続先を GitHub Models にしていた（#1526、`febb88f2`）。同 workflow は `gate: false # advisory only — never fail the job`
- 退役前の success run では `LLM: used (openai/gpt-4o-mini)` が出ていた（最後は run 30549148396、2026-07-30 13:54Z）
- 退役後は 410 `github_models_retirement_brownout`（最初は run 30583883594、2026-07-30 21:33Z。最後は 08-10）。修正直前の 09-23 は `Unexpected token 'O', "OK\r\n" is not valid JSON`
- 退役から修正までの success run で LLM レビューが成功したものは 0 件（success run は全数確認。failure・cancelled のログは未確認）。job は success、最終結果は findings=[]・auto-approve
- 2026-09-23 に issue #2410 で発覚（Actions artifact の debug `llmUsed:false` で特定）。PR #2414（`6d378d9b`）で接続先を OpenAI の既定エンドポイントへ戻した
- 修正後もリポジトリに `OPENAI_API_KEY` が無く、10-21 時点の success run はすべて「API key not set」等で LLM 未実行。静かな失敗が明示的な未実行に変わった

## 自分の解釈

advisory なゲートは「失敗してもジョブを落とさない」設計だが、LLM が失敗したときの出力が「指摘なし」と同じ見た目になると、止まっていることに気づけない。

## 違和感 / Reader Problem

AI レビューを CI に advisory で組み込んだ開発者は、green と「指摘なし」を見て、レビューが実際に走ったかを確かめていない。

## 今の仮説

advisory のままでよいが、「実行されなかった」を「指摘なし」と別の状態として出せば気づける。

## 記事化の角度

- Experience: 退役から発覚までの経緯と、ログに残っていたもの
- Tutorial: LLM 実行の成否を出力に分けて出す（llmUsed を見える場所へ）

## Draft Article Plan: qiita/advisory-ai-review-silent-failure

- approved_at:
- channel: qiita
- slug: advisory-ai-review-silent-failure
- article_type: experience
- reader_problem: AI レビューを advisory（ジョブを落とさない）で CI に組み込んだ開発者は、green と「指摘なし」を見て、レビューが実際に実行されたかを確かめていない
- central_claim: advisory なゲートでは、AI レビューの「実行失敗」と「指摘なし」を区別して出す。区別しないと、接続先の退役のような外部要因で止まっても CI は green のまま気づけない。
- out_of_scope: river-review 側の AI レビュー復旧（`OPENAI_API_KEY` の設定。my-blog では扱わない）、修正で復旧したという記述、全 run（failure・cancelled を含む）での「0 件」の断言、GitHub Models の代替サービス比較、River Review の設計全般、my-blog の運用、会社で観測した事例

### Evidence Boundary

- Observed:
  - 範囲: s977043/river-review の workflow 履歴・Actions run ログ・issue #2410・PR #2414
  - success run の `- LLM:` 行（2026-07-20〜10-21 の 215 件を全数走査）。退役後〜修正前の success run で LLM 成功 0 件
  - 修正後も LLM 未実行（10-21 時点）
- Verified:
  - GitHub Models の退役日 2026-07-30 と 07-16・07-23 の brownout（上記 changelog。2026-10-22 の初稿前に 2 本の本文で照合済み。brownout 日は 07-01 の告知にのみ記載）
- Hypothesis:
  - 実行失敗を別の状態として出せば早く気づけた（本事例からの推論）
- Unverified:
  - failure 228 件・cancelled・action_required のログ、LLM 行が無い success run 47 件の理由、エラーコードが 08-10 まで brownout を名乗っていた理由、PR #2415（LLM 失敗と指摘なしの区別）の中身とマージ状況

### 変更履歴

- 2026-10-22: 元の案「AI レビュー CI の通過が 0 件」は事実と合わない（CI は success）ため、著者判断で主張を言い換えて記録
