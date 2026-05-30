# Zenn Book「PlanGate 実践ガイド」公開前チェックリスト

> 関連 issue: [#325](https://github.com/s977043/my-blog/issues/325) / 公開キュー: `docs/publish-queue.md` #7（締切 2026-06-30）
> 対象: `books/plangate-guide/`（`published: false`）
> 最終更新: 2026-05-31
> 注: 本書は Claude Code が全8章を執筆。図解・読者導線は ChatGPT 作業（PR #331）。本ドキュメントは**本文に触れず**公開判断を固めるための準備メモ。

## 1. 公開ゲート（すべて ✅ で `published: true`）

`published: true` は単なるフラグ変更でなく**公開意思決定**。以下を全通過してから切り替える。

- [x] **PR #331（図解・読者導線）マージ済み** — 下記レビュー指摘3点が解消されていること
  - [x] enforcement-architecture.svg の矢印が `Hooks → Audit log → Verify/C-4/CI` の向き（本文 04_exec と一致）
  - [x] adoption-roadmap.svg の「partial strict」を実態用語へ修正（`default`/`strict`/`bypass` ＋ Phase 0→3。中間は「段階的に strict 化」）
  - [x] STYLE.md の図方針が SVG 採用と整合（「図は SVG（`images/plangate-guide/`）。mermaid も可」へ更新）
- [x] **cover 画像**を配置（§2 の要件を満たす）
- [ ] **通し校正**完了（§3 の観点）
- [ ] `npm run check`（`list:books` 含む）exit 0
- [ ] **Zenn preview** で全8章＋図＋表紙の表示崩れがないことを目視（`npm run preview`）
- [ ] 公開キュー #7 の時期判断（締切 2026-06-30、前倒し可）
- [x] 事実の最終確認: 検証バージョン **v8.10.0**、Hook は **EH-1〜EH-9 + EHS-1〜EHS-3（12/12）/ EH-10 は RFC Draft**、タグライン「No approval, no code.」

> ⚠️ Zenn の publish rate-limit（24h/本数）は**単発記事用で Book は別枠**。ただし `release/zenn` 経由の運用と重なる日は避け、記事 publish と同日マージにしない。

## 2. cover 画像 要件定義（実制作は #331 の視覚方針確定後）

> Codex 助言: 本文図とトーンを揃えてから制作。先行制作は視覚方針の二重化を招く。現段階は**要件のみ**確定。

- **配置 / 形式**: `books/plangate-guide/cover.jpg`（既存 `flame-portrait-essay/cover.jpg` に倣う。Zenn 公式推奨アスペクト比 **1:1.6**＝横 500px × 縦 800px、または 横 1000px × 縦 1600px、JPG/PNG）
- **トーン**: PR #331 の SVG 図（core-loop / enforcement-architecture / adoption-roadmap）と同系の配色・線。Plan=青系 / Exec=緑系の本文 mermaid 配色を踏襲
- **要素**:
  - タイトル「AI にコードを書かせる前にやること」を主役に（サブ「PlanGate 実践ガイド」）
  - 2 本柱（Plan の精度 / Exec の強制力）を想起させるモチーフ（ゲート・承認・止める）
  - 「No approval, no code.」を入れるか検討（入れる場合は誤記注意）
- **避ける**: プレースホルダ画像（<10KB は弾く）、本文図の使い回し、文字過多
- **制作主体**: #331 と同じ視覚担当（ChatGPT）に揃えるのが一貫性の観点で安全。Claude 側で作るなら方針合意後

## 3. 通し校正の観点（#331 マージ後に一括実施）

本文は章ごとに執筆したため、通し読みで以下を確認する（STYLE.md 準拠）。

- [ ] **トーン統一**: 敬体で統一。一人称・コードブロック注釈ルールが全章一致
- [ ] **用語ゆれ**: C-3/C-4/L-0/V-1〜V-4、EH-1〜EH-9+EHS-1〜EHS-3、Level 1〜5、C-3 の状態を表す値 `APPROVED`/`CONDITIONAL`/`REJECTED`（`c3_status` の enum）
- [ ] **章間リンク**: 各章末 CTA が機能、章間の「前章からの接続」1段落が成立
- [ ] **重複**: 概念の初出章が固定され、後続章は再説明でなくリンク送り
- [x] **⚠️ Book→記事リンクは Zenn フル URL を使う（相対パス禁止）**: Zenn Book から Zenn 記事へのリンクに相対パス（`../../articles/*.md`）を使うと、**公開サイトで 404** になる。GitHub プレビューでは解決するため見落としやすい。公開記事は `https://zenn.dev/minewo/articles/<slug>` のフル URL に置き換える
  - [x] `04_exec.md`（Next.js TDD 記事）と `a2_design-evolution.md`（設計変遷記事）は Zenn フル URL 化済み
- [x] **図と本文の整合**: SVG 図の用語・矢印が本文の記述と一致（#331 指摘の解消確認）
- [ ] **MVP 完結性**: 00+01+03+04+付録A だけ読んでも主張が閉じ、かつ「Verify/Scale は後続」の予防線がある

## 4. 公開後タスク（参考・別 issue 連携）

- [ ] 稼ぎ頭 entry-point 記事（`ai-legible-repository-design` / `plangate-v86-hook-enforcement`）の `## Related links` に Book 導線を追加（自家中毒回避のため canonical は記事側）
- [ ] note（思想）→ Zenn Book（体系）→ GitHub（OSS）の正本リレー導線（issue #231 と連携）
- [ ] 公開キュー #7 を Done へ移動、公開日と URL を記録
