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
| 2 | **2026-05-29（金）18:00 JST** | qiita | `Qiita/public/ai-coding-preflight-checklist.md` | Full（済 PR#247） | 未公開（ignorePublish:true）|
| 3 | **2026-06-02（火）18:00 JST** | qiita | `Qiita/public/plangate-ai-coding-workflow.md` | Full（済 PR#283、4指摘反映済） | 未公開（ignorePublish:true）|
| 4 | **2026-06-09（火）18:00 JST** | qiita | `Qiita/public/design-md-guide-and-adoption-log.md` | Full（済 PR#285、予防反映済） | 未公開（ignorePublish:true）|
| 5 | **2026-06-16（火）18:00 JST** | qiita | `Qiita/public/penpot-react-design-system-contract.md` | Full（済 PR#286、予防反映済） | 未公開（ignorePublish:true）|
| 6 | **2026-06-23（火）18:00 JST** | qiita | `Qiita/public/open-design-design-quality.md` | Full（済 PR#286、予防反映済） | 未公開（ignorePublish:true）／**Zenn 公開（2026-05-26週）後に cross-post note 有効化必須**|
| 8 | **2026-05-26（火）18:00 JST** | zenn | `articles/open-design-design-quality.md` | Full（PR #281/#282/#284 反映済、画像追加済） | 未公開（published:false）／**続編公開時に前作・ガイドへ相互リンク追加、Qiita 版 cross-post note も同時有効化**|
- #2 公開時、本文「関連記事」の scope-creep 参照に下記 Done の実 Qiita URL を差し込む（相互リンク確定）
- #3〜#6 はデザイン三部作 Qiita 化＋PlanGate Qiita 化。Codex 助言に基づく段階公開（PlanGate → DESIGN.md → penpot-react → open-design）。1週ペース・初動の反応とタイトル調整余地を確保
- #6（open-design）は Zenn 原典が 2026-05-26 週公開予定のため、Zenn 公開後の cross-post `:::note info` 有効化を**公開作業の前段**に組み込む（コメントアウト退避済み、手順は記事内 HTML コメントに記載）
- #8 (open-design) は memory `project_open_design_article_scheduled` で記録済みの予定日。release/zenn rate-limit（24h/5本・1PR3本・24h間隔）を遵守
- 補充は手動。次テーマが決まったら行を追加（Rolling/テンプレは凍結中のため使わない）

## Done

- 2026-05-18 qiita claude-code-scope-creep-countermeasure https://qiita.com/s977043/items/a25ec91ea411f39bf340
- 2026-05-21 zenn ai-agile-value-increases https://zenn.dev/minewo/articles/ai-agile-value-increases （PR #289 main / PR #290 release/zenn、予定6/6から前倒し公開）
- 2026-05-22 zenn river-reviewer-v033-improvement-loop https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop （PR #295 main / PR #296 release/zenn、予定5/23から1日前倒し公開・著者明示指示）
