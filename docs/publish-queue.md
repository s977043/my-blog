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
| 4 | **2026-06-09（火）18:00 JST** | qiita | `Qiita/public/design-md-guide-and-adoption-log.md` | Full（済 PR#285、予防反映済） | 未公開（ignorePublish:true）|
| 5 | **2026-06-16（火）18:00 JST** | qiita | `Qiita/public/penpot-react-design-system-contract.md` | Full（済 PR#286、予防反映済） | 未公開（ignorePublish:true）|
| 6 | **2026-06-23（火）18:00 JST** | qiita | `Qiita/public/open-design-design-quality.md` | Full（済 PR#286、予防反映済） | 未公開（ignorePublish:true）／**Zenn 公開（2026-05-26週）後に cross-post note 有効化必須**|
- #7 (zenn-book) は **2026-06-01 公開完了**（下記 Done 参照）。本文・図・cover・5系統＋ultracode レビュー完了後、release/zenn PR #350 マージで go-live
- #2 公開時、本文「関連記事」の scope-creep 参照に下記 Done の実 Qiita URL を差し込む（相互リンク確定）
- #3〜#6 はデザイン三部作 Qiita 化＋PlanGate Qiita 化。Codex 助言に基づく段階公開（PlanGate → DESIGN.md → penpot-react → open-design）。1週ペース・初動の反応とタイトル調整余地を確保
- #6（open-design）は Zenn 原典が 2026-05-26 週公開予定のため、Zenn 公開後の cross-post `:::note info` 有効化を**公開作業の前段**に組み込む（コメントアウト退避済み、手順は記事内 HTML コメントに記載）
- #8 (open-design) は memory `project_open_design_article_scheduled` で記録済みの予定日。release/zenn rate-limit（24h/5本・1PR3本・24h間隔）を遵守
- 補充は手動。次テーマが決まったら行を追加（Rolling/テンプレは凍結中のため使わない）

## Done

- 2026-06-01 zenn-book plangate-guide「AI にコードを書かせる前にやること — PlanGate 実践ガイド」 https://zenn.dev/minewo/books/plangate-guide （全9章/無料、PR #350 で release/zenn マージ→公開。5系統×複数ラウンド＋ultracode レビュー収束、cover 500×700。issue #325）
- 2026-05-18 qiita claude-code-scope-creep-countermeasure https://qiita.com/s977043/items/a25ec91ea411f39bf340
- 2026-05-21 zenn ai-agile-value-increases https://zenn.dev/minewo/articles/ai-agile-value-increases （PR #289 main / PR #290 release/zenn、予定6/6から前倒し公開）
- 2026-05-22 zenn river-reviewer-v033-improvement-loop https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop — 当初 5/22 rate-limit hit でデプロイ拒否、2026-05-25 に release/zenn 空 commit（4ded8e6）で再デプロイ→公開反映確認済
- 2026-05-25 zenn open-design-design-quality https://zenn.dev/minewo/articles/open-design-design-quality （PR #305 main / PR #306 release/zenn、予定5/26から前倒し公開）
- 2026-05-19 qiita ai-coding-preflight-checklist https://qiita.com/s977043/items/b8dacca4ce2d9079454a （queue 上に残存していた古い #2 を実態に合わせて Done へ移動）
- 2026-05-27 qiita plangate-ai-coding-workflow https://qiita.com/s977043/items/6041bbc2659412341d54 （PR #314 経由で公開、予定6/2から前倒し）
- 2026-05-28 qiita multi-ai-discussion-roadmap-rewrite https://qiita.com/s977043/items/4e89a93c2ebfb928e2b1 （PR #319 経由で公開、予定6/30から前倒し、note原典 n5fe2e97b9600 cross-post）
