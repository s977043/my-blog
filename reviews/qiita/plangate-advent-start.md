# Qiita記事レビュー: plangate-advent-start

対象: `Qiita/public/plangate-advent-start.md` / 本文 blob `d52a9dca1b93b73687b56cf44c4674c86933b046`
レビュー日: 2026-11-25 / GPT-6.2（同一モデルの観点別レビュー。独立レビューではない）
Plan: article_seeds/note-hub-plangate-river-skills/2026-09-24-note-hub-plangate-river-skills.md (qiita/plangate-advent-start)

## 判定

DRAFTED / NEEDS_VERIFICATION。主張と構成を維持し6回のレビュー・修正を反映。公開承認ではない。

## 3ループのレビューと対応

| ループ | レビュー → 対応 | 再レビュー → 再対応 |
| --- | --- | --- |
| 1 技術・根拠 | 固定版と main の導入手順差、計画順、合成例と実運用を区別。PBI 入力を plan の前に | local scope、承認記録、git diff 基準を明示 |
| 2 実践・読者UX | AC/確認表、文字列定数テスト、git status と git diff HEAD を追加 | 最小4ファイルと変更前コミットを補足 |
| 3 公開・境界 | カレンダーリンク、依存定義なしの前提、隔離環境と本番導入の境界を追記 | UI/通信未実施、承認待ち契約の固定版リンクを明示 |

## 根拠・実行した確認

- PlanGate v8.24.0: README.md、docs/ai/contracts/plan.md、approve-wait.md、.claude/rules/mode-classification.md、docs/staged-adoption-guide.md、plugin/plangate/commands/ai-dev-workflow.md、working-context.md。main の plugin README（v8.24.0 表記、11/25確認）との差を区別した。
- 隔離した合成 Git repo / Node.js v22.16.0: 変更前3/3 PASS、テストのみ新期待値で2 PASS/1 FAIL（exit 1）、定数変更後3/3 PASS。git status --short と git diff HEAD --name-only は src/label.mjs, test/label.test.mjs のみ。git diff HEAD --exit-code -- src/save.mjs test/save.test.mjs exit 0。
- 上記は合成例の検証。実際のUI、HTTP、Claude Code/PlanGate/plugin/hook 実行ではない。
- Qiita公式ガイドライン https://help.qiita.com/ja/articles/qiita-article-guideline / https://help.qiita.com/ja/articles/qiita-community-guideline を確認。タグ5件、フェンス閉じ、private:true / ignorePublish:true、登録済みタイトル・カレンダーとの一致を確認。
- Graph: 基準 6c1513f6 の生成済み JSON/Markdown・edge を既存生成ロジックの出力形式で再構成し完全一致後、今回の promotion 1件を派生生成。完全 checkout での公式 npm 実行は未実施。3PRの共通派生ファイルは順次取り込み時に最新 main で再生成・検証する。

## 残件

- 隔離環境で Claude Code/plugin 導入、plan生成、承認待ち、必要なhook検証。公式 npm run check / CI最新head・独立レビュー・著者承認・予約・公開は未確認。マージ・公開しない。
