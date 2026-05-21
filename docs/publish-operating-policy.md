# Publish Operating Policy

公開作業の自律実行範囲・著者ゲート・停止条件を定義する。Codex 助言（2026-05-20 セッション）を起点に、`docs/content-channel-strategy.md`（媒体役割の正本）の運用補助として位置づける。

## Status: canonical（操作ポリシーの正本）

- 自律エージェント（Claude Code / Codex）が公開関連作業を進める際は、本ドキュメントの境界を遵守する
- 著者の明示的な承認なしに「著者ゲート」を越えない
- 規約・媒体役割の定義そのものは [`content-channel-strategy.md`](./content-channel-strategy.md) を参照（二重定義しない）

## 自律実行範囲（agent が承認なしで実行可能）

| 範囲 | 例 |
| --- | --- |
| 記事下書き作成 | `articles/*.md` / `Qiita/public/*.md`（`published:false` / `ignorePublish:true` 維持） |
| 品質レビュー生成 | `reviews/zenn/*.md` / `reviews/qiita/*.md` |
| 既存ドラフトへのレビュー指摘反映（採用/保留/却下の選別を含む） | 本文編集 + 反映状況サマリ |
| publish-queue / 戦略ドキュメントの更新 | `docs/publish-queue.md` / `docs/content-channel-strategy.md` 等 |
| WXR 生成（note インポート用ファイル） | `articles_note/build/*.xml`（gitignored） |
| メトリクス取得・分析 | GA4 / 各媒体 API |
| PR 作成・CI 通過後のマージ（**ただし以下の停止条件に該当しない場合のみ**） | `docs/` 系・`reviews/` 系・`ignorePublish:true` 維持の Qiita 系・`published:false` 維持の Zenn 系 |

## 著者ゲート（agent 単独では実行しない・停止条件）

以下のいずれかに該当する操作は、**著者の明示的な承認**を得るまで実行しない。

| 境界 | 該当操作 |
| --- | --- |
| **publish フラグ変更** | `published: false → true`（Zenn） / `private: true → false`（Qiita） / `ignorePublish: true → false`（Qiita） |
| **外部公開** | `npm run publish:qiita -- <slug>` の実行 |
| **release/zenn 反映** | main → release/zenn の sync PR マージ（Zenn 本番 deploy 発火） |
| **note 手動作業** | note.com 側での目次・タグ設定／公開判断／WXR インポート実行 |
| **既存公開記事の本文書き換え** | Zenn / Qiita / note で `published:true` 相当の記事の本文修正（誤字訂正レベル除く） |
| **大規模削除** | 複数記事の同時削除・ディレクトリ削除 |

**判定原則**: 不可逆な外向き操作・公開影響が出る操作は全て著者ゲート。リバーシブルな内部整備（下書き作成・レビュー・ドキュメント更新）は自律可。

## Rate-limit 遵守

公開フローでは、自律実行範囲内であっても以下の制約に従う。

| 項目 | 制約 |
| --- | --- |
| Zenn release/zenn rate-limit | 24h / 5本（公式仕様）。本リポジトリでは安全マージンとして **24h / 3本** を運用上限とする |
| Zenn PR あたりの記事数 | 1 PR で release/zenn にマージする記事は最大 3本 |
| Zenn PR 間隔 | 24時間以上あけてマージ |
| 既存 update と新規 publish | 別 PR に分割（update が rate-limit に巻き込まれて公開済記事が古いままになる事故を防ぐ） |

詳細は [`AGENTS.md`](../AGENTS.md) の「Zenn 公開フロー」と [memory `feedback-zenn-publish-rate-pacing`] を参照。

## 自律実行時のチェックリスト

agent が公開関連作業を進める際は、以下を満たすことを明示的に確認する。

1. **作業前**: `gh auth status` で active account が `s977043` であること
2. **作業前**: `gh pr list --state open` で並列セッションの重複 PR がないこと
3. **作業前**: branch-impacting 操作の直前に `git branch --show-current` で意図ブランチであること
4. **編集中**: `published:` / `private:` / `ignorePublish:` フラグの変更が含まれていないこと（含まれていたら停止）
5. **PR 作成前**: `npm run check` が PASS すること
6. **PR 作成前**: 変更ファイルが `docs/` `reviews/` `Qiita/public/*.md`（draft）`articles/*.md`（draft）に限定されていること
7. **マージ前**: `gh pr view <n> --json mergeStateStatus` で `CLEAN` であること
8. **マージ前**: CI（Content checks + Dependency review）が全て pass であること
9. **release/zenn マージ後（必須）**: Web 反映確認。以下のいずれかで記事一覧に出現することを確認:
   - Zenn 公開 API: `curl -s 'https://zenn.dev/api/articles?username=minewo&count=100' | jq '.articles[] | select(.slug=="<slug>")'`
   - 公開プロフィール: https://zenn.dev/minewo （公開記事の一覧表示）
   - Zenn 管理画面の deploy log（rate-limit hit メッセージの有無）
   - 出現しない場合は **rate-limit hit を疑う**（参照: `AGENT_LEARNINGS.md` 2026-05-22 エントリ）
10. **Qiita publish 後（必須）**: Web 反映確認。`https://qiita.com/s977043/items/<id>` で 200 応答することを確認

## メトリクス再計測サイクル

- **頻度**: 月次または publish-queue の主要締切消化後
- **記録先**: `docs/channel-metrics/YYYY-MM-DD.md` を新規作成（既存ファイルは上書きしない＝履歴保持）
- **更新箇所**: `docs/content-channel-strategy.md` の「Data-driven channel weighting」セクションから最新スナップショットへ参照リンク差し替え
- **判断観点**:
  - DESIGN.md キラーコンテンツの PV シェア推移
  - Qiita ストック数推移（LGTM は無視）
  - note の long-tail スキ蓄積
  - Zenn 集客 2タイプ（SEO 主導 / 内バズ）の比率変化

## 関連ドキュメント

- [`content-channel-strategy.md`](./content-channel-strategy.md) — 媒体役割の正本
- [`publish-queue.md`](./publish-queue.md) — 締切付き公開キュー
- [`channel-metrics/2026-05-21.md`](./channel-metrics/2026-05-21.md) — 直近の実測スナップショット
- [`../AGENTS.md`](../AGENTS.md) — Zenn 公開フロー（release/zenn 経由）と Git 運用規約
- [`../CLAUDE.md`](../CLAUDE.md) — Claude Code 固有のツールガイド
