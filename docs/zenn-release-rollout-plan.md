# Zenn Release Rollout Plan — 2026-05-07 rate-limit 解消後の段階公開計画

## 1. 背景

2026-05-06〜07 にかけて、Codex によるレビュー反映を集中的に実施した結果、24 時間以内に Zenn publish 系 PR を 5 本連続マージ → **7 記事すべてが Zenn rate-limit でデプロイされず**、既公開記事の更新（`plangate-v86-hook-enforcement`）まで巻き添えで未反映状態になった。

実観測の結論:

| 試行 | 結果 |
|---|---|
| 追加 commit の push（5 件、12 時間以上経過） | キュー解放されず、同じ 7 記事リストが残留 |
| Zenn ダッシュボード「手動デプロイ」 | キュー解放されず |
| デプロイ対象ブランチ切替（main → release/zenn） | **キューはアカウント単位で維持されており解放されず** |

→ リポジトリ側からの操作では rate-limit キュー解放は不可能。**Zenn 側の自然解放を待つ**方針に確定（Inquiry 申請は本セッションでは実施しない判断）。

詳細仕様: `memory/reference_zenn_rate_limit_spec.md`

## 2. 現状の確定事項

| 項目 | 状態 |
|---|---|
| Zenn デプロイ対象ブランチ | `release/zenn`（2026-05-07 切替済） |
| `release/zenn` HEAD | `57272be`（cover.jpg 復旧時点） |
| `main` HEAD | 最新（PR #199 ポリシー文書込み） |
| rate-limit 該当 7 記事の `published: true` 切替 | main にあり、release/zenn にはまだ無し（Phase 1 以降で流す） |
| 構造的対策 | PR #199 で AGENTS.md / CLAUDE.md にポリシー正本化済 |

## 3. 解放検知方法

### 24 時間ごとに確認

Zenn ダッシュボードのデプロイログで **「お知らせ」セクションの 7 記事リスト**を確認:

- 7 記事すべて残留 → 未解放、待機継続
- 一部減少 → 部分解放（Phase 1 から段階的に進められる）
- 「お知らせ」自体が出なくなる → 完全解放（Phase 1 着手可）

### 軽微な探り push

週 1 程度で `release/zenn` に軽微な commit（例: README 更新）を push し、deploy ログで rate-limit 表示が消えたか確認する。push 自体が再 trigger になる可能性があるため、**ペースは慎重に**（24h 以上あけて 1 回まで）。

## 4. 段階公開計画（解放確認後に着手）

### Phase 1: 既存公開記事の最優先 update

| 項目 | 内容 |
|---|---|
| 対象 | `articles/plangate-v86-hook-enforcement.md`（更新内容: PR #194 hook count fix + PR #197 Codex review fixes） |
| 流す PR ブランチ | `release/zenn-update-plangate-v86` |
| マージ先 | `release/zenn` |
| 理由 | 既存公開記事の更新は最優先。読者から見ると古い情報が表示されている影響が大きい |
| 実行コマンド | 下記 §5 参照 |

### Phase 2: 新規公開 3 本（Phase 1 から 24h あけて）

| 項目 | 内容 |
|---|---|
| 対象 | `ai-legible-repository-design` / `codex-developer-instructions` / `plangate-design-evolution-v3-to-v8` |
| 流す PR ブランチ | `release/zenn-publish-batch1` |
| マージ先 | `release/zenn` |
| 選定理由 | Codex review で READY または Medium 反映済の 3 本を優先 |

### Phase 3: 残り新規 3 本（Phase 2 から 24h あけて）

| 項目 | 内容 |
|---|---|
| 対象 | `ai-article-quality-gate-workflow` / `ai-driven-dev-metrics` / `seo-sns-article-design-ai-workflow` |
| 流す PR ブランチ | `release/zenn-publish-batch2` |
| マージ先 | `release/zenn` |

## 5. 実行コマンド（参考）

各 Phase で実行する典型コマンド。

### Phase 1（plangate-v86 update のみ）

```bash
# release/zenn から派生
git switch release/zenn
git pull --ff-only
git switch -c release/zenn-update-plangate-v86

# main の該当ファイルを取り込む
git checkout main -- articles/plangate-v86-hook-enforcement.md

# 整合性検証
npm run check

# commit
git add articles/plangate-v86-hook-enforcement.md
git commit -m "release(zenn): apply plangate-v86 update (PR #194 + #197 fixes)"

# push & PR（base は release/zenn）
git push -u origin release/zenn-update-plangate-v86
gh pr create --base release/zenn --head release/zenn-update-plangate-v86 \
  --title "release(zenn): plangate-v86 hook count + Codex review fixes" \
  --body "Phase 1: 既存公開記事 plangate-v86-hook-enforcement の最優先 update。"
```

### Phase 2（新規 3 本、Phase 1 から 24h 後）

```bash
git switch release/zenn
git pull --ff-only
git switch -c release/zenn-publish-batch1

git checkout main -- \
  articles/ai-legible-repository-design.md \
  articles/codex-developer-instructions.md \
  articles/plangate-design-evolution-v3-to-v8.md

npm run check
git add articles/
git commit -m "release(zenn): publish batch1 (3 articles)"
git push -u origin release/zenn-publish-batch1
gh pr create --base release/zenn --head release/zenn-publish-batch1 \
  --title "release(zenn): publish 3 articles (Phase 2)" \
  --body "Phase 2: ai-legible-repository-design / codex-developer-instructions / plangate-design-evolution-v3-to-v8"
```

### Phase 3（残り 3 本、Phase 2 から 24h 後）

```bash
git switch release/zenn
git pull --ff-only
git switch -c release/zenn-publish-batch2

git checkout main -- \
  articles/ai-article-quality-gate-workflow.md \
  articles/ai-driven-dev-metrics.md \
  articles/seo-sns-article-design-ai-workflow.md

npm run check
git add articles/
git commit -m "release(zenn): publish batch2 (3 articles)"
git push -u origin release/zenn-publish-batch2
gh pr create --base release/zenn --head release/zenn-publish-batch2 \
  --title "release(zenn): publish 3 articles (Phase 3)" \
  --body "Phase 3: ai-article-quality-gate-workflow / ai-driven-dev-metrics / seo-sns-article-design-ai-workflow"
```

## 6. リスクと中断条件

### 中断条件

各 Phase 後、Zenn ダッシュボードで以下を確認し、該当する場合は **次の Phase を中断**:

- マージ後 24h 以内に **deploy 反映が確認できない** → rate-limit 再 hit の疑い
- 「お知らせ」セクションに **新しい slug が追加された** → ペース超過
- 既存公開記事の表示崩れ・404 → 別問題、要調査

中断時の対処:

1. release/zenn への追加 commit を停止（被害拡大防止）
2. 24-48h 待機して再確認
3. 解消しない場合は Inquiry 申請の再検討

### リスク

| リスク | 影響度 | 緩和策 |
|---|---|---|
| Phase 2 / Phase 3 で再び rate-limit hit | 高 | 24h 厳守、3 本/PR 上限厳守 |
| Phase 間の 24h 待機中に main で急ぎの記事修正 | 中 | main で作業 → release/zenn には次の Phase で取り込み（ブランチ分離が機能） |
| 既存公開 25 記事への影響 | 低 | release/zenn 切替直後に変動なしを確認済（実観測） |

## 7. 完了条件

- 7 記事すべて Zenn 上で公開反映を確認
- 各 URL がブラウザで正常表示
- `plangate-v86-hook-enforcement` のタイトル / TL;DR が最新内容（v8.6.0 の Metrics v1 と Governance）であること

## 8. 関連ドキュメント

- `AGENTS.md` §「Zenn 公開フロー（release/zenn ブランチ経由）」
- `CLAUDE.md` §「作業開始時のチェックリスト」項目 7
- `memory/feedback_zenn_publish_rate_pacing.md` — 24h あたり 3 本までの運用ルール
- `memory/reference_zenn_rate_limit_spec.md` — Zenn rate-limit 仕様、キュー残留挙動、緩和申請手順
- 関連 PR: #193, #194, #195, #196, #197, #198, #199
