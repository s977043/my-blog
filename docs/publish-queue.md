# Publish Queue（手動公開・デッドラインリスト）

> 週次自動化スケジューラは凍結中（[`archive/README.md`](./archive/README.md)）。これは**人が手動で公開する順番＋締切**のリスト。Codex/Gemini 検証：リストだけでは停滞する→**デッドライン必須・不完全でも締切で公開**（相互リンク完成や2本同時を待たない）。

## 公開ルール（凍結期間中）

- 1 件ずつ手動公開。締切が来たら**内容が完璧でなくても publish する**（完璧主義の停滞回避＝Gemini 指摘）
- 手順は各記事内「公開当日チェックリスト」に従う（ignorePublish→false / updated_at / コメント削除 / `npm run check` / `npm run publish:qiita`）
- 公開したら下の Done へ移動し、公開日を記録
- Zenn は `published_at` を締切日 18:00 JST に設定 → release/zenn へ反映（rate-limit 24h/3本厳守）

## Queue（締切順）

| # | 締切 | platform | path | レビュー | 状態 |
|---|---|---|---|---|---|
| 1 | **2026-05-22（金）18:00 JST** | qiita | `Qiita/public/claude-code-scope-creep-countermeasure.md` | Full（済 PR#246） | 未公開（ignorePublish:true）|
| 2 | **2026-05-29（金）18:00 JST** | qiita | `Qiita/public/ai-coding-preflight-checklist.md` | Full（済 PR#247） | 未公開（ignorePublish:true）|

- #1 公開後、その実 Qiita URL を控え #2 公開時に「関連記事」へ差し込む（相互リンク確定は #2 公開時で可・#1 を遅らせない）
- 補充は手動。次テーマが決まったら行を追加（Rolling/テンプレは凍結中のため使わない）

## Done

（公開済みを「YYYY-MM-DD platform basename URL」で記録）
