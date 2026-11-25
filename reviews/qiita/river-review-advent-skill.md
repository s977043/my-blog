# Qiita記事レビュー: river-review-advent-skill

対象: `Qiita/public/river-review-advent-skill.md` / 本文 blob `1936e7e4c0f33dda235e0a34c787388dbf57d68f`
レビュー日: 2026-11-25 / GPT-6.2（同一モデルの観点別レビュー。独立レビューではない）
Plan: article_seeds/ai-driven-development/2026-09-29-river-review-core-design.md (qiita/river-review-advent-skill)

## 判定

DRAFTED / NEEDS_VERIFICATION。主張と構成を維持し6回のレビュー・修正を反映。公開承認ではない。

## 3ループのレビューと対応

| ループ | レビュー → 対応 | 再レビュー → 再対応 |
| --- | --- | --- |
| 1 | 固定版 Skill、fixture、golden と検出器の対象差を確認。NO_REVIEW と NO_ISSUES、コメントだけの catch と return 系の期待を区別。 | 実際の評価スクリプトで --phase がフィルタではなく上書きであることを確認し削除。dryRun・planSkills、APIキー前提を明示。 |
| 2 | fixture/golden/実測を混同しないように用語、適用範囲、評価を分割。 | 標準ケースの return/return null/ログあり対照表と実行結果の読み方を追加。 |
| 3 | 安全なログ例、カレンダー、固定版ショーケース、実行状態/承認の比較表を追加。CodeRabbitの利用・比較を主張しない。 | LLM評価とdry-run、review-localと個別Skill実行保証を区別。 |

## 根拠・実行した確認

- v1.139.5 の README.md、pages/guides/starter-cookbook.md、pages/guides/representative-skills.md、pages/explanation/what-is-river-review.md を照合。
- skills/midstream/logging-observability/{SKILL.md,fixtures/01-silent-catch.diff,fixtures/02-proper-error-handling.diff,golden/01-silent-catch-happy.md,golden/02-proper-error-handling.md} の固定版を確認。01 は指摘を期待、02 は NO_ISSUES。Skill の対象外条件は NO_REVIEW。
- package.json/package-lock.json、scripts/evaluate-review-fixtures.mjs、src/lib/review-fixtures-eval.mjs、src/lib/heuristic-review.mjs、tests/fixtures/review-eval/cases.json で経路とケースを照合。--phase は上書き、dryRun:true、includeFallback:false。
- 期待出力・仕様の静的照合。実際の fixture eval / LLM レビューは未実行。

## 共通確認

- 参加枠: https://qiita.com/advent-calendar/2026/coderabbit、2026-12-15。管理Issue #1067 で登録確認済み、記事URL紐付け・公開は未実施。登録済みタイトルに一致。
- Qiita公式ガイドライン https://help.qiita.com/ja/articles/qiita-article-guideline / https://help.qiita.com/ja/articles/qiita-community-guideline を参照。タグ5件、フェンス閉じ、private:true / ignorePublish:true を確認。
- Graph: 基準 6c1513f6 の生成済み JSON/Markdown・edge を既存生成ロジックの出力形式で再構成し完全一致後、今回の promotion 1件を派生生成。完全 checkout での公式 npm 実行は未実施。3PRの共通派生ファイルは順次取り込み時に最新 main で再生成・検証する。

## 残件

- 完全取得した隔離環境で npm ci / npm run eval:fixtures、plugin実行と対象外ケースを検証し証拠保存。独立レビュー・CI最新head・著者承認は残件。
- 公式 npm run check の実行・最終レビュー・公開承認・予約・公開確認は残件。マージ・公開しない。
