# 週次公開スケジュール運用

毎週1記事を Qiita / Zenn に公開する運用。**前日通知 → 承認 → 公開**のゲート付き。Rolling roadmap と連動。

- 由来: ユーザー要望（毎週公開のスケジュール化, 2026-05-17）
- 関連: [`content-channel-strategy.md`](./content-channel-strategy.md)（Rolling roadmap）/ [`post-publish-review-cycle.md`](./post-publish-review-cycle.md) / [`review-gate-tiers.md`](./review-gate-tiers.md)

## 確定仕様

| 項目 | 値 |
|---|---|
| 対象媒体 | Qiita / Zenn（note は手動インポート必須のため対象外） |
| 公開日時 | 毎週 **金曜 18:00 JST**（= 金 09:00 UTC） |
| 通知 | **前日 木曜 18:00 JST**（= 木 09:00 UTC）に承認 Issue を自動起票 |
| 承認 | GitHub Environment `production-publish` の required reviewer 承認（人が承認するまで公開ジョブは走らない） |
| 記事選定 | **Rolling roadmap 連動**。次に出す記事は [`publish-queue.md`](./publish-queue.md) の先頭から（キューは月次振り返りで Rolling roadmap から補充） |
| 自動度 | 前日通知 → 人が承認 → 翌日公開（完全自動公開はしない＝取り消し困難な外部アクションの安全弁） |

## 週次フロー

```
木 09:00 UTC  notify ジョブ
  └─ publish-queue.md 先頭エントリを読む
  └─ 承認 Issue 起票（媒体/記事/レビュークラス/Goal-DoD/rate-limit 状況を記載）
        ↓ 人間が内容確認・必要なら記事修正
  └─ 承認: Issue を閉じる前に Environment 承認待ちジョブを approve（または publish を中止＝queueをskip操作）
金 09:00 UTC  publish ジョブ（Environment 承認ゲート通過後のみ実行）
  └─ rate-limit 事前チェック（npm run check:zenn-pace。FAIL なら中止）
  └─ Qiita: ignorePublish→false / updated_at更新 / 公開当日HTMLコメント削除 / qiita publish
  └─ Zenn: published_at を金18:00に設定 / release/zenn へ反映（24h/3本ルール厳守）
  └─ publish-queue.md の先頭を done セクションへ移動（キュー前進）
  └─ 公開後レビュー予定（T+30/T+180）を post-publish-review-cycle に沿って起票
```

## Rate-limit との関係

- 1 週 1 記事のため Zenn 24h/5本・1PR3本ルールには通常抵触しない
- ただし手動公開と重なる週は `npm run check:zenn-pace` が WARN/FAIL を返しうる。publish ジョブは事前チェックで FAIL なら**公開せずキューを翌週送り**にする
- Qiita はネイティブ予約なし。本運用の cron が実質の予約機構

## 必要なユーザー側セットアップ（1回のみ・Claude では実行不可）

1. **Secret `QIITA_TOKEN`** をリポジトリに追加（Qiita CLI 認証。Qiita > 設定 > アプリケーション > 個人用アクセストークン）
2. **GitHub Environment `production-publish`** を作成し **Required reviewers** に自分を設定（承認ゲート）
3. 初回サイクルは `workflow_dispatch` の `dry_run: true` で**ドライラン**し、想定どおり通知/差分が出ることを確認してから本番運用へ

## キュー運用

- [`publish-queue.md`](./publish-queue.md) の `## Queue` 先頭が「次に公開する1本」
- 月次振り返り（post-publish-review-cycle）で Rolling roadmap から翌月分を補充
- 各エントリは媒体・basename・レビュークラス・Goal-DoD を明記（review-gate-tiers の DoD を満たすこと）
- 公開済みは `## Done` へ移動（履歴）

## 中止・スキップ

- 承認 Issue で承認しない（Environment approve しない）→ その週は公開されずキュー据え置き
- 特定週を飛ばす: `publish-queue.md` 先頭に `- [SKIP] <理由>` を置く（publish ジョブは SKIP を消化して次回へ）
