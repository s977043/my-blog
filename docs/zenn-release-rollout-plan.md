# Zenn Release Rollout Plan — 2026-05-07 rate-limit 解消後の運用計画

> **本ドキュメントは 2026-05-07 17:00 GMT+9 に全面改訂しました。** 旧版（同日 PR #200）の「Phase 1〜3 で段階的に release/zenn に流す」計画は、release/zenn 上に既に 7 記事すべて `published: true` で乗っていることが事後確認で判明したため成立しません。

## 1. 背景

2026-05-06〜07 にかけて、Codex によるレビュー反映を集中的に実施した結果、24 時間以内に Zenn publish 系 PR を 5 本連続マージ → **7 記事すべてが Zenn rate-limit でデプロイされず**、既公開記事 `plangate-v86-hook-enforcement` の更新まで巻き添えで未反映状態になった。

実観測の結論:

| 試行 | 結果 |
|---|---|
| 追加 commit の push（5 件、12 時間以上経過） | キュー解放されず、同じ 7 記事リストが残留 |
| Zenn ダッシュボード「手動デプロイ」 | キュー解放されず |
| デプロイ対象ブランチ切替（main → release/zenn） | **キューはアカウント単位で維持されており解放されず** |

→ リポジトリ側からの操作では rate-limit キュー解放は不可能。**Zenn 側の自然解放を待つ**方針に確定（Inquiry 申請は本セッションでは見送り）。

詳細仕様: `memory/reference_zenn_rate_limit_spec.md` / `AGENT_LEARNINGS.md` 2026-05-07 エントリ

## 2. 現状の確定事項（重要）

| 項目 | 状態 |
|---|---|
| Zenn デプロイ対象ブランチ | `release/zenn`（2026-05-07 切替済） |
| `release/zenn` HEAD | `57272be`（cover.jpg 復旧時点） |
| `main` HEAD | 最新（PR #199 ポリシー文書 / PR #200 旧計画書 / 本 PR の改訂版込み） |
| **release/zenn 上の rate-limit 7 記事の状態** | **すべて `published: true`**（派生時点で main から引き継ぎ済） |
| main と release/zenn の差分 | docs / AGENTS.md / CLAUDE.md のポリシー文書のみ（記事は同状態） |
| 構造的対策 | PR #199 で AGENTS.md / CLAUDE.md にポリシー正本化済 |

⚠️ **段階公開は構造上不可能**: release/zenn には既に 7 記事すべてが published 状態で存在しているため、「Phase 1 で plangate-v86 だけを流す」「Phase 2 で 3 本」という段階分離はできません。すべて同じキューに乗っており、Zenn 側で順次解放される（推測：24h あたり 5 本まで）のを待つしかありません。

## 3. 解放検知方法

### 24 時間ごとに確認

Zenn ダッシュボードのデプロイログで **「お知らせ」セクションの 7 記事リスト**を確認:

| 観測 | 判定 |
|---|---|
| 7 記事すべて残留 | 未解放、待機継続 |
| 一部減少（例: 5 記事に減) | 部分解放（Zenn が 24h あたり 5 本まで処理した可能性） |
| 「お知らせ」自体が出なくなる | 完全解放 |

### 部分解放のサイン

24h あたり 5 本上限の場合、解放後に Zenn が処理する順序は不明。次のいずれかが起きる:

- 古いキュー順（最初に hit した順）から 5 本 deploy → 残り 2 本がまた次のウィンドウへ
- 新しい順 / アルファベット順 / その他基準で 5 本 → 残り 2 本

部分解放を検知したら **release/zenn には何も push しない**で、次の 24h ウィンドウを待つ。push すると新しい hit 対象が追加される可能性。

### 軽微な探り push（最終手段）

48h 経過しても変化がない場合、release/zenn に **記事以外** の軽微な commit（README やコメントの 1 行修正）を push して deploy 試行を発生させ、現在のキュー状態を確認する。**記事ファイルは触らない**こと。

## 4. 解放後にできること

### 完全解放後（7 記事すべて deploy 成功）

- 各記事の URL をブラウザで目視確認
- `plangate-v86-hook-enforcement` のタイトル / TL;DR が最新内容（v8.6.0 の Metrics v1 と Governance）であること
- 新規 6 記事が Zenn 検索に出ること

### release/zenn を main に追従させる（オプション）

完全解放後、release/zenn に main の docs / AGENTS.md / CLAUDE.md 更新を取り込みたい場合:

```bash
git switch release/zenn
git pull --ff-only
git merge main --no-ff -m "merge: sync docs and policy from main"
git push origin release/zenn
```

注意: この merge にはドキュメント更新のみ含まれ、記事ファイルには変更が入らない（既に release/zenn 側でも main 側でも同じ状態）。Zenn deploy 通知は出るが「お知らせ」セクションは空のはず。

## 5. 今後の Zenn 公開フロー（解放後の通常運用）

### 新規記事公開

```bash
# main で執筆・レビュー反映（Zenn deploy 発火しない）
git switch main
git switch -c docs/new-article-foo
# ... 編集 ...
git push origin docs/new-article-foo
gh pr create --base main ...

# main マージ後、release/zenn に流す（Zenn deploy 発火）
git switch release/zenn
git pull --ff-only
git switch -c release/zenn-publish-foo
git checkout main -- articles/foo.md  # 該当ファイルだけ取り込み
npm run check
git add articles/foo.md
git commit -m "release(zenn): publish foo"
git push -u origin release/zenn-publish-foo
gh pr create --base release/zenn --head release/zenn-publish-foo ...
```

### 既存公開記事の更新

新規 publish と **同じ PR にしない**。単独で release/zenn に流す。

### ペース制約

- 1 PR で release/zenn に merge する記事数 **最大 3 本**
- release/zenn への merge は **24h あけて** 実施
- 既存 update PR と新規 publish PR は **別日**

## 6. リスクと中断条件

### 中断条件

各 release/zenn merge 後、Zenn ダッシュボードで以下を確認し、該当する場合は **次の merge を中断**:

- マージ後 24h 以内に **deploy 反映が確認できない** → rate-limit 再 hit の疑い
- 「お知らせ」セクションに **新しい slug が追加された** → ペース超過
- 既存公開記事の表示崩れ・404 → 別問題、要調査

中断時の対処:

1. release/zenn への追加 commit を停止（被害拡大防止）
2. 24-48h 待機して再確認
3. 解消しない場合は Inquiry 申請を再検討

### リスク

| リスク | 影響度 | 緩和策 |
|---|---|---|
| 自然解放のタイミングが不透明 | 高 | 24h ごとに観察、長期化したら Inquiry 申請 |
| 解放後の Phase 2 / Phase 3 で再 rate-limit hit | 中 | 24h 厳守、3 本/PR 上限厳守 |
| release/zenn と main の docs 差分が放置される | 低 | 解放後に merge で同期（記事には影響なし） |

## 7. 完了条件

- 7 記事すべて Zenn 上で公開反映を確認
- 各 URL がブラウザで正常表示
- `plangate-v86-hook-enforcement` のタイトル / TL;DR が最新内容（v8.6.0 の Metrics v1 と Governance）であること

## 8. 関連ドキュメント

- `AGENTS.md` §「Zenn 公開フロー（release/zenn ブランチ経由）」
- `CLAUDE.md` §「作業開始時のチェックリスト」項目 7
- `AGENT_LEARNINGS.md` 2026-05-07 「Zenn rate-limit はアカウント単位...」「Zenn ダッシュボード設定切替後は既存ブランチを派生元の状態と整合させる」
- `memory/feedback_zenn_publish_rate_pacing.md` — 24h あたり 3 本までの運用ルール
- `memory/reference_zenn_rate_limit_spec.md` — Zenn rate-limit 仕様、キュー残留挙動、緩和申請手順
- 関連 PR: #193, #194, #195, #196, #197, #198, #199, #200

## 9. 改訂履歴

- 2026-05-07 17:00 GMT+9: PR #200 の旧版（誤った Phase 1〜3 計画）を全面改訂。release/zenn には既に 7 記事すべてが published で乗っている事実を確認したため、段階公開戦略を「待機 + 解放後確認」に変更
- 2026-05-07 04:00 GMT+9: PR #200 で初版作成
