# docs/archive — 凍結資産

ここにあるものは **凍結（frozen）** 状態。0→1（記事を継続公開できている）段階に達していないのに先行して作り込んだプロセス／自動化。Codex メタリスク検討 + Gemini 検証（2026-05-17）で「実アウトプットゼロに対し過剰」と判定され、認知ノイズを断つために隔離した。

## なぜ凍結したか

- 直近数ラウンドでプロセス資産が10件超に増えた一方、新規公開はゼロ（典型的 Yak Shaving）
- 真のボトルネックはプロセス不足でなく「書いて出す実行・継続」
- 未使用ドキュメント/コードを live に残すと「偽の真実」になり将来の自分を混乱させる（Gemini 指摘）

## 凍結対象

| ファイル | 元の場所 | 解凍条件 |
|---|---|---|
| `multichannel-rollout-template.md` | docs/ | 新規テーマを多媒体展開する具体予定が出たとき |
| `review-gate-tiers.md` | docs/ | レビュー対象記事が増え、強度分岐が実運用で要るとき |
| `post-publish-review-cycle.md` | docs/ | 公開記事が出て計測対象データが実在するとき |
| `weekly-publish-schedule.md` | docs/ | 下記スケジューラ解凍と同時 |
| `weekly-publish.mjs` | scripts/ | 同上 |
| `weekly-publish.yml.frozen` | .github/workflows/ | 解凍時に拡張子 `.frozen` を外し `.github/workflows/` へ戻す |
| `weekly-publish-notify.yml.frozen` | .github/workflows/ | 同上 |

> `.frozen` 拡張子のワークフローは GitHub Actions に認識されない＝cron 停止。これが「週次自動化の凍結」の実体。

## 完了資産（役割を終えた記録）

上の「凍結」とは別枠。**先行して作り込みすぎたもの**ではなく、**予定した仕事を最後までやり切って役割を終えたもの**をここに置く。参照されないのが正常なので、`check:orphan-docs` の対象外である archive が置き場になる。

| ファイル | 元の場所 | 役割を終えた根拠 | 再利用する条件 |
|---|---|---|---|
| `zenn-book-plangate-guide-plan.md` | docs/ | 企画書。対象の Zenn Book は 2026-06-01 公開済み（`docs/publish-queue.md` Done #7 / `books/plangate-guide/`） | 次の Zenn Book の企画を起こすとき、章立て・ファネル設計の型として読む |
| `zenn-book-plangate-publish-readiness.md` | docs/ | 同 Book の公開前チェックリスト。公開意思決定は完了済み | 次の Zenn Book を公開するとき、cover 要件・通し校正観点を写して使う |
| `zenn-book-plangate-style.md` | docs/ | 同 Book 専用の執筆スタイルシート（検証バージョン v8.10.0 に固定） | 次の Zenn Book の執筆規約を書くとき、雛形として写す |
| `share-drafts/2026-05-27.md` | docs/share-drafts/ | 2026-05-27〜05-30 の投下スケジュールに紐づく単発の SNS ドラフト。以降 `docs/share-drafts/` に新しい日付は追加されておらず、運用は継続していない | SNS シェア運用を再開するとき、A型／B型／C型の書き分けの実例として読む |

> 凍結資産と違い、こちらは **読むこと自体は禁止しない**（凍結の意味を壊さないため、上の凍結表とは表を分けている）。ただし live の `docs/` へ戻すのは「再利用する条件」を満たしたときだけにする。

## 解凍ライン（これを満たすまで触らない）

**「手動で記事を3本公開し、かつ週次継続の意思が残っている」** とき初めて週次自動化系を解凍する。
それ以前にここを編集・参照しない（参照すると凍結の意味がなくなる）。

## 撤退（削除）ライン

次の30日で1本も公開されない、または3記事中2本以上が「装置なしの手動」で出たなら、週次公開系一式はこの archive ごと **削除候補**（凍結の先は復活でなく廃棄）。

## live に残したもの（凍結しない）

- `docs/content-channel-strategy.md` — 媒体役割の正本（思考の軸）
- `docs/publish-queue.md` — 公開順＋デッドラインの手動リスト
- `docs/rollout-ai-implementation-boundary-series.md` — 次に出す記事の公開手順
- 各記事内「公開当日チェックリスト」
- `scripts/check-note-tables.js`（軽量・肥大リスク低）/ `AGENT_LEARNINGS.md`
