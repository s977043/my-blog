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
