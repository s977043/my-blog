---
description: 指定記事を3ペルソナレビュー→改善→Humanizeレビューで最大Nループ磨く（記事の主張・強調は不変）
argument-hint: <article-slug> [loops]
---

# /review-improve-loop

指定した Zenn 記事を「3ペルソナレビュー → 改善」で**最大 N ループ**反復改善し、最後にreview-onlyのHumanizeレビューと最終Verifyを実行する。
**記事の主張（結論・筆者の立場）と読者への強調点は変えず**、事実精度・構成・読みやすさ・出典・SEO・文体を磨く。

## 引数

- `$1` = 記事の slug（`articles/<slug>.md`）。`articles/<slug>.md` 形式でも可
- `$2` = ループ数（省略時 `3`、範囲 `1..5`）

## 手順

1. **Workflow ツール**で定義済みワークフロー `article-review-improve-loop` を実行する。

   ```
   Workflow({ name: "article-review-improve-loop", args: { article: "$1", loops: <$2 or 3> } })
   ```

   - 実体: `.claude/workflows/article-review-improve-loop.js`
   - フェーズ: `Extract` → `LoopN-Review` / `LoopN-Improve` → `Humanize` → `Verify` → `Record`
   - `Humanize` は全改善後に1回だけ実行するreview-onlyフェーズ。記事は変更せず、`low / medium / high` の指摘を構造化して記録する
   - `Verify` はHumanize後に必ず実行する

   > **既知の落とし穴（2026-06-10 実証）**: Workflow ツールが `args` を注入せず `args.article（…）が必要です` で即失敗することがある（`name` 経由・`scriptPath` 経由とも観測）。その場合は、Workflow が**永続化したスクリプトコピー**の先頭 `RAW` フォールバック値に対象 slug を直書きし、`Workflow({ scriptPath: "<永続化パス>" })` で再実行する。永続化パスは初回 Workflow 呼び出しの戻り値に出る。詳細は `@AGENT_LEARNINGS.md` 2026-06-10 エントリ。

2. ワークフロー完了後、次を要約して報告する。

   - `loopsRun`
   - 各ループの反映件数
   - `claimPreservedAll`
   - `humanizePassed`
   - `humanizeFindings` / `humanizeHighRisk`
   - `finalVerified` / `finalBlocked`

3. **git 操作はワークフロー内で行わない**（記事改善とreviews保存のみ）。commit / PR 化はユーザー判断。

4. **reviews 成果物（`reviews/zenn/<slug>.md`）は記事の公開/改善 PR に同梱しない**。レビューは「ある時点のスナップショット」で、その後の改善で必ず陳腐化する。記録する場合は**別 PR / 別ライフサイクル**にする。

## 不変条件

- 主張の反転・両論併記化・希釈を禁止。強調点の削除・トーンダウンを禁止
- Front Matter の `published` 値を変えない
- Humanizeでは記事本文を変更しない
- コード、URL、引用、数値、日付、バージョン、公式用語、筆者の経験を保護する
- 存在しない体験談・具体例・数値・固有名詞を生成しない

## 収束制御

- 2周目以降にmust/highの指摘が無くなれば早期終了する
- 収束した場合もHumanizeと最終Verifyは実行する
- HumanizeまたはVerifyが失敗した場合は `post-humanize-UNVERIFIED` として記録する
- Phase 1ではHumanize指摘だけを理由に本文を自動修正・公開ブロックしない

## 関連

- `/humanize-review <article-path>` — 記事を変更しないHumanize単独レビュー
- `/review-article <slug>` — 単発の3ペルソナレビュー生成（PR 化あり）
- `/article-pipeline <slug>` — レビュー生成→反映を 2PR に分割
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `docs/article-humanizer-rollout.md`
