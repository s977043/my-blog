# 公開残件実行計画（2026-10-15 JST）

対象は [公開キュー](./publish-queue.md)、Issue [#670](https://github.com/s977043/my-blog/issues/670)、直近の公開関連PR。公開操作の契約は [Publish Operating Policy](./publish-operating-policy.md) に従う。今回のユーザー指示は、この対応で作るPRのレビュー・CI成功後のマージを含む。

## 実行計画と完了条件

| 順序 | 作業 | 状態・完了条件 |
| --- | --- | --- |
| 1 | 最新main・Open Issue/PR・本番Zennを確認 | 完了。main `8b849eb34c36e63fa6b3c7a8acd33d1719272511`、Open Issue #670のみ、Open PRなし（作業開始時点） |
| 2 | キューの古い未完了記録を修正 | #9をdoneに訂正。2026-08-28の停止理由は解消済みなのでQueueから除去。#833/#842の本番反映も確認 |
| 3 | 最新note原稿のWXR・直接編集用本文を準備 | WXR2本のstructure-only PASS。ローカルPacketに本文・HTML・ハッシュ・チェックリストを保存 |
| 4 | Googleドキュメント・note下書きへPRONI差分を反映 | 未完了。接続Driveのファイル名検索では社内レビュー用Docを特定できず。note認証済みブラウザはこの環境に提供されていない |
| 5 | 社内承認とnote公開 | 未完了。レビュー2名・広報確認・カバー・目次・本文表示・公開URLの証拠を確認する |
| 6 | Canary公式export比較・公開 | 未完了。参照ZIPが環境・接続Drive検索に無い。公開URLもIssue/Seedに未記録 |
| 7 | Canary公開後のSeed → Graph → Metrics → Learning | 6の公開URL確認後に実行。実測がない段階でMetricsや学習を作らない |
| 8 | 3ループのレビュー、PR、CI、マージ、再確認 | 本文末のレビュー記録とPRに結果を残す |

上記の未完了は実行能力・入力・承認の不足であり、完了扱いにはしない。DocのURLが確定すれば既存Docを読み、#839/#843の反映漏れだけを編集する。既存レビューやコメントを保持し、無関係なDocを編集しない。

## PRONIの再開手順

- 編集の正本: `articles_note/new/PRONI-plangate-team-rollout.md`
- #839: 過去の出来事の時制6文と「実行が意図より先に進んだ」の初出説明。
- #843: 末尾「【PR】エンジニアの積極採用を実施中です」見出し、本文2段落、求人リンク。
- Googleドキュメントとnote下書き `nf85851cf7f48` でこの差分を照合する。反映済みかは未確認。
- **既存下書きにはWXRを再インポートしない**。インポートは常に新規下書きなので、既存記事は直接編集する。
- 社内レビュー2名の指摘が反映されたことと、2名の最終承認は別。承認記録を確認し、広報確認・デザイン室カバーを通す。
- 目次ON、リンク、図・コードの実表示、投稿アカウントを確認して公開する。
- 9月版WXRは使わない。今回のWXRも社内承認後に本文が変われば再生成する。生成器の著者欄は `mine_unilabo` なので、会社公式への新規取り込みに使う場合は投稿アカウントとの対応も確認する。
- 公開URL確認後にキューをDoneへ移す。

## Canaryの再開手順

Issue #670本文を正本とする。note公開APIの取得した個人プロフィール記事一覧に対象タイトルは現れず、Seedの `promoted_to` はローカル記事pathのみ。これは公開URL未確認の証拠であり、非公開を断定する根拠にはしない。

```bash
python3 .claude/skills/note-export-import/scripts/verify_wxr.py \
  articles_note/build/import-content-closed-loop-note.xml \
  --reference /path/to/official-note-export.xml
```

完全比較PASS → note取り込み → 目視 → 人間による公開 → Issue #670へcanonical公開URL記録。対象WXRは1ファイルを明示する。

公開URL取得後:

1. Seed `promoted_to` に公開URLを追加（元のpathを維持）。
2. `npm run build:article-graph` と `npm run check:article-graph`。
3. `node scripts/fetch-channel-metrics.mjs --channel note` で `seed_ids` に `seed-20260923-content-closed-loop` が接続されることを確認し、snapshotを保存。
4. 実測を根拠にLearning Proposalを1件作り、Human Accept/Rejectを記録する。採用された場合のみ次のSeed/Strategyへ反映。

## 今回生成した成果物

WXRは `articles_note/build/`（gitignored）。構造検証PASSは公式exportとの完全比較・note表示確認・公開承認の代替ではない。生成器はブロックUUIDを毎回生成するため、本文不変でもWXRのSHA-256は変わる。以前のPacketのSHAと今回のSHAを混用しない。

| 原稿 | article blob SHA | 今回のWXR SHA-256 | bytes |
| --- | --- | --- | --- |
| PRONI-plangate-team-rollout | `de7f21697546cca8f1c49f60d69c61c6f5554f96` | `6a42cfd61c5425fe41c5e1f71d45257666df7f6992bff43e6fba2d23cbb5a74b` | 49704 |
| content-closed-loop-note | `db70b8e97b82bfc0be8b2f632cc4aff7707865fb` | `f7dc211469286c303f4e40b7ebaa872a5609ff54b554a288270b17cf594f81b7` | 32189 |

どちらも1記事、ローカル画像参照0。CanaryはH2が9、コードブロックが9。PRONIはH2が10、採用告知の追記あり。Packetのmanifestに元commit・article blob・各ファイルSHAを記録する。

## 3ループレビュー記録

レビュー担当は実行エージェント。独立した第三者レビューとしては扱わない。各ループは変更前の検討・レビューと変更後のレビューを分けて実施する。

### Loop 1: 公開状態と残件

- 検討: Issue/PRだけでなく本番ページとキューを照合する。
- レビュー: #9は公開済み、#833/#842も反映済み。Queueには2026-08-28時点の解消済み停止理由と重複する公開ペース数値が残る。
- 対応: done記録・張り返し記録を訂正し、解消済み停止理由を除去。公開ペースは正本参照へ統一。
- 再レビュー: 4記事のHTTP 200、judgment-placementのtopology/coreリンクを確認。Queue drift PASS。未完了のnoteをdoneへ変更していない。

### Loop 2: 最新原稿と外部反映

- 検討: #839/#843入り原稿からWXRを生成し、Doc/noteへの反映方法を確認する。
- レビュー: Python依存不足を検出してインストール。Doc/公式exportは接続検索で見つからず。既存noteをWXRで上書きできないため直接編集が必要。
- 対応: WXR2本を生成・構造検証。本文・HTML・PRONI追記箇所・ハッシュ付きPacketを準備し、再開手順を具体化。
- 再レビュー: XMLをparse、HTML要素を検査。採用告知あり、ローカル画像0、各1記事。Canary blobは既存生成時と一致。UUIDによるWXR SHA変化を明記。

### Loop 3: 引継ぎとマージ品質

- 検討: 完了条件・実行証拠・停止地点を再確認し、PRの変更範囲とCIを検証する。
- レビュー: 社内レビュー反映を最終承認と混同しない。公開URL未確認を非公開と断定しない。未公開時のMetrics/Learningは作らない。既存Book Plan2本に参照元が無い警告を確認。
- 対応: 本計画に未完了工程・再開条件・検証限界を明記。READMEからBook Planへリンクして発見可能にする。
- 再レビュー: `git diff --check`、`npm run check`、Packetハッシュ確認、記事本文・公開フラグ・生成Graphへの変更が無いことを確認する。ローカル検証は31 checks PASS、孤立ドキュメント警告も解消。PRのCI成功・競合なしを確認してからsquash mergeする。
