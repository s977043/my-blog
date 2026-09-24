---
title: "AIレビューの指摘ゼロを信じる前に。実行カバレッジの設計"
summary: "AIコードレビューで指摘がなかったとき、レビューが完了したのか、実行状況の記録がないのかは別問題です。River ReviewのReview Coverageを例に、指摘数と実行完了を分けて記録する考え方と、現在の適用範囲を紹介します。"
tags:
  - AI
  - コードレビュー
  - OSS
status: published
source_articles:
  - articles/river-review-judgment-placement.md
  - articles/river-reviewer-v033-improvement-loop.md
project_sources:
  - https://github.com/s977043/river-review/blob/main/schemas/review-coverage.schema.json
  - https://github.com/s977043/river-review/blob/main/src/lib/review-coverage.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs
  - https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md
  - https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md
izanami_url: https://izanami.dev/post/6cb177a5-cb4b-42e0-bded-5b74e0bb6e6b
published_at: 2026-09-24
---

AIコードレビューで指摘が0件だったとき、安心してよいでしょうか。

レビュー対象に問題がなかったのか、レビュアーが最後まで実行されたのか、あるいは実行状況を記録できていないのか。**指摘数だけでは、この違いを判断できません。**

この記事では、AIレビュー結果の「指摘数」と「実行カバレッジ」を分ける方法を、River ReviewのReview Coverageを例に説明します。

## 指摘数と実行完了は別の情報

レビュー結果に指摘がない状態には、少なくとも次の可能性があります。

1. 予定していたレビューが完了し、指摘が見つからなかった
2. 一部のレビューが失敗またはタイムアウトした
3. 実行カバレッジの情報自体が記録されていない

1と2を同じ「指摘0件」として扱うと、レビューが完了していない結果を、問題がなかった結果と取り違えるおそれがあります。3も、レビュー失敗と決めつけられません。**観測情報がないことは、未完了を観測したこととは違います。**

そこで、結果を少なくとも次の2軸で記録します。

| 軸 | 例 |
| --- | --- |
| Finding | 指摘数、指摘内容 |
| Execution Coverage | 予定したレビュー単位が完了したか |

## River ReviewのReview Coverage

River Reviewでは、レビュー実行単位ごとの状態を構造化して残します。現行スキーマでは、レビュー単位にレビュアーの役割、対象の差分チャンク、実行状態、検出した指摘数を記録します。実行状態には `completed`、`failed`、`timed_out` があり、集約したカバレッジ状態は `complete`、`partial`、`not_executed` です。

この設計では、指摘数と実行状態を独立して読めます。たとえば `findingsCount: 0` だけを見て「レビューが正常完了した」と判断せず、該当するレビュー単位の状態と集約カバレッジを一緒に確認します。

もう一つ大切なのが、カバレッジ情報が存在しない場合の扱いです。River Reviewのコードでは、欠落または不正な情報を `unknown` として扱います。これは、以前の実行結果にカバレッジ記録がない場合も、実行が不完全だったと誤判定しないためです。

## 実際に踏んだ穴

Review Coverageは、もともと「起きうる穴」をふさぐ設計として入れました。提案した時点では、部分的な失敗が「指摘0件」に紛れる事故を実際に観測していたわけではありません。

その後、自分のリポジトリでこの穴を踏みました。River Review自身でプルリクエストをレビューしたところ、結果は「承認・指摘0件」でした。しかし、利用していたモデル提供元はすでにサービスを終了しており、LLMは一度も有効な応答を返していませんでした。

気づいたきっかけは、別の理由でジョブが失敗し、GitHub Actionsの実行結果を確認したことです。LLMの呼び出しが失敗しているのに結論が「承認」になっている点に違和感を持ち、実行時のデバッグ出力をたどって原因を特定しました。振り返ると、同じ状態で「指摘0件」と判定されたプルリクエストは、ほかにもあったと考えています。

この経験から、複数レビュアーの経路だけでなく、単一レビュアーの経路でもLLM呼び出しの失敗を「未実行」として記録するようにしました。指摘数だけを見ていたら、この失敗は結果の中に埋もれたままでした。

## どこまで自動で止められるか

Review Coverageは実験的な機能です。既定ではGateと判定（`decision`）を変えません。ただし、実行結果を比較する `river runs diff` の収束シグナルは既定でもカバレッジを参照し、LLM呼び出しに失敗した実行は「収束」と判定されなくなります。

カバレッジGateを有効にするには、`RIVER_GATE_COVERAGE=1` と `--gate` を指定します。利用者向けの入口であるGitHub Actionでは、`gate: true` を指定し、stepの `env` に `RIVER_GATE_COVERAGE=1` を設定します。

```yaml
- uses: s977043/river-review/runners/github-action@v1.124.1
  with:
    gate: true
  env:
    RIVER_GATE_COVERAGE: "1"
```

複数レビュアーのカバレッジが必要な場合だけ、`reviewers` 入力を追加します。単一レビュアーでも、LLM呼び出しを実際に試行した実行ではカバレッジが記録されます。

有効な場合、`partial` または `not_executed` は独立したNO-GO条件として扱われます。

この適用範囲には注意が必要です。現行の公開インターフェース文書では、カバレッジGateが効くのは `--gate` を付けた `river run` 経路（Actionの `gate: true` を含む）です。`review exec` では、実行エンジンが `reviewCoverage` を返さない限り、このGateは動作しません。また、dry-runやAPIキー未設定のように意図的に実行しなかった場合はカバレッジ自体が記録されません。対応範囲は利用する実行経路の公開インターフェースで確認してください。

そのため、導入時には「カバレッジが取れるか」「どの実行経路が対応しているか」「Gateを有効にしたか」を分けて確認します。**実験的な契約を、すべての実行経路で既に保証された機能として扱わない**ことが重要です。

## レビュー結果を信頼するための確認項目

AIレビューを開発フローに組み込むときは、指摘内容だけでなく、次も確認できるようにします。

- 予定したレビュー単位は何か
- 各単位は完了、失敗、タイムアウトのどれだったか
- それらを集約したカバレッジは何か
- カバレッジ記録がない場合、未完了と区別されているか
- Gateを使う場合、実際の実行経路が対応しているか

こうした状態を残しておくと、「指摘がなかった」結果を過大に解釈せずに済みます。AIのレビュー内容に加えて、レビュー自体がどこまで実行されたかも確認できます。

## River Review

River Reviewは、差分だけでなく、レビューの実行状況や関連する開発アーティファクトも扱うオープンソースのレビュー基盤です。Review Coverageのスキーマと現在の適用範囲は、[River ReviewのGitHubリポジトリ](https://github.com/s977043/river-review)で確認できます。

## 参考・関連リンク

- [Review Coverage schema](https://github.com/s977043/river-review/blob/main/schemas/review-coverage.schema.json)
- [Review CoverageとGateの現行インターフェース](https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md)
- [GateとReview Coverageの適用条件](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
- [AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](https://zenn.dev/minewo/articles/river-review-judgment-placement)
- [River Review v0.30→v0.33：Improvement Loop と applyTo Scoping 整備の半月](https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop)
