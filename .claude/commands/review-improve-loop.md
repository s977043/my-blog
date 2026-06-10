---
description: 指定記事を3ペルソナレビュー→改善で最大Nループ磨く（記事の主張・強調は不変）
argument-hint: <article-slug> [loops]
---

# /review-improve-loop

指定した Zenn 記事を「3ペルソナレビュー → 改善」で**最大 N ループ**反復改善する。
**記事の主張（結論・筆者の立場）と読者への強調点は変えず**、事実精度・構成・読みやすさ・出典・SEO のみを磨く。

## 引数

- `$1` = 記事の slug（`articles/<slug>.md`）。`articles/<slug>.md` 形式でも可
- `$2` = ループ数（省略時 `3`、範囲 `1..5`）

## 手順

1. **Workflow ツール**で定義済みワークフロー `article-review-improve-loop` を実行する。

   ```
   Workflow({ name: "article-review-improve-loop", args: { article: "$1", loops: <$2 or 3> } })
   ```

   - 実体: `.claude/workflows/article-review-improve-loop.js`
   - フェーズ: `Extract`（主張・強調の抽出）→ `LoopN-Review`/`LoopN-Improve`（最大 N 周）→ `Record`（`reviews/zenn/$1.md` に記録）

   > **既知の落とし穴（2026-06-10 実証）**: Workflow ツールが `args` を注入せず `args.article（…）が必要です` で即失敗することがある（`name` 経由・`scriptPath` 経由とも観測）。その場合は、Workflow が**永続化したスクリプトコピー**の先頭 `RAW` フォールバック値に対象 slug を直書きし、`Workflow({ scriptPath: "<永続化パス>" })` で再実行する。永続化パスは初回 Workflow 呼び出しの戻り値に出る。詳細は `@AGENT_LEARNINGS.md` 2026-06-10 エントリ。

2. ワークフローはバックグラウンド実行。完了通知が来たら結果（`loopsRun` / 各ループの反映件数 / `claimPreservedAll`）を要約して報告する。

3. **git 操作はワークフロー内で行わない**（Edit と reviews 保存のみ）。commit / PR 化はユーザー判断。

4. **reviews 成果物（`reviews/zenn/<slug>.md`）は記事の公開/改善 PR に同梱しない**。レビューは「ある時点のスナップショット」で、その後の改善で必ず陳腐化する（記事PRに混ぜると bot に「記事と乖離」と指摘され手戻りになる。AGENT_LEARNINGS 2026-06-07）。記録する場合は**別 PR / 別ライフサイクル**にする。

## 不変条件（ワークフローが厳守）

- 主張の反転・両論併記化・希釈を禁止。強調点の削除・トーンダウンを禁止。
- Front Matter の `published` 値を変えない。
- 改善対象は事実精度・出典明示・構成・読みやすさ・SEO のみ。

## 収束制御

- 2 周目以降に must/high の指摘が無くなれば早期終了（無駄な改変を防ぐ）。
- 改善後の最終確認が必要なら `loops` を 1 増やして再実行する。

## 関連

- `/review-article <slug>` — 単発の3ペルソナレビュー生成（PR 化あり）
- `/article-pipeline <slug>` — レビュー生成→反映を 2PR に分割
- 本コマンドは「レビューと改善を同一ループ内で反復」する点が上記と異なる（中間 PR を作らず working tree 上で磨く）
