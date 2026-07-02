---
description: Qiita 記事の公開パイプラインを一括実行する（事前ゲート→hygiene→人間承認→publish→事後検証→PR）
argument-hint: <slug>（Qiita/public/<slug>.md）
---

# /publish-qiita

Qiita 公開の定型サイクル（hygiene 準備 → `npm run check` → `publish:qiita` → 検証 → queue 更新 PR）を束ねるコマンド。実績: PR #400 / #425 / #443 で同型サイクルを3回実施。

**大原則**:

- 公開は**不可逆**。publish 実行前に必ず人間の承認を得る（人間ゲート①で停止）
- 公開は必ず `npm run publish:qiita -- <slug>` で叩く。**生 `npx qiita publish` は禁止**（wrapper `scripts/publish-qiita.sh` が pre-sync 巻き戻りガード `check:qiita-remote-cache` を内蔵しており、素の CLI はこの安全機構を素通りする）
- `Qiita/public/.remote/` は qiita-cli 専用キャッシュ。**絶対に手編集・commit しない**

## フェーズ0: 事前ゲート

### 0-1. 二重公開チェック（最重要）

queue や記事の見た目を信じず、**id と web 実態**で公開済みか確認する（AGENT_LEARNINGS 2026-05-27: queue と実態の乖離で10分ロスした実績への対策）。

```bash
grep "^id:\|^ignorePublish:" Qiita/public/<slug>.md
# id を frontmatter から自動抽出して web 状態を確認（null/空なら未公開扱い）
id=$(sed -n "s/^id: *//p" Qiita/public/<slug>.md | tr -d "'\"")
if [ -n "$id" ] && [ "$id" != "null" ]; then
  curl -s -o /dev/null -w "%{http_code}\n" "https://qiita.com/s977043/items/$id"
else
  echo "unpublished"
fi
```

- **id が null でなく HTTP 200 → 既に公開済み**。以降のフェーズはすべて skip し、`docs/publish-queue.md` の該当行を Done へ移動する PR だけ作って終了（フェーズ3へ直行、hygiene 変更なし）
- id が null、または 404 → 未公開。次へ進む

### 0-2. drift チェック

```bash
npm run check:qiita-drift
```

ローカル `Qiita/public/*.md` と Qiita リモート本文の乖離を検知する。Qiita API は無認証 60req/h のレート制限があるため、**レート制限時・取得失敗時は当該記事 skip で続行してよい**（誤検知しない設計）。drift が検出された場合は原因（未 publish の過去コミット等）を確認してから進む。

### 0-3. hygiene 準備

`Qiita/public/<slug>.md` に公開ハイジーンを適用する:

1. `ignorePublish: false` 化（`private: false` も確認）
2. `updated_at` を更新
3. 公開当日 HTML コメント（内部運用メモ）を削除
4. frontmatter `title` に半角 `: ` / `#` / `[` 等が含まれる場合はシングルクオートで囲む（未クオートだと publish が全滅する。AGENT_LEARNINGS 2026-05-19）
5. cross-post 記事なら原典リンク（`:::note info` 等）の有効化を確認

```bash
npm run check   # check:qiita-publish-hygiene 含む。PASS するまで進まない
```

## 人間ゲート①: 公開承認（ここで必ず停止）

hygiene 準備の diff（`git diff Qiita/public/<slug>.md`）をユーザーに提示し、**公開実行の承認を明示的に得る**。公開は不可逆のため、承認が得られるまでフェーズ1へ進んではならない。

提示内容:

- hygiene diff の要約（削除した HTML コメント / frontmatter 変更）
- 公開予定タイトル・slug
- `npm run check` PASS の確認結果

## フェーズ1: 公開実行（承認後のみ）

```bash
npm run publish:qiita -- <slug>
```

- wrapper が publish 直前に `check:qiita-remote-cache` を自動実行する。ガードに引っかかったら publish は中断される（誤検知が確実な場合のみ `SKIP_REMOTE_CACHE_CHECK=1` でバイパス）
- 成功すると qiita-cli が `id` / `updated_at` を記事 frontmatter に書き戻す（この変更はフェーズ3の PR に含める）

## フェーズ2: 事後検証

```bash
# 公開 URL の 200 確認（id は publish 後の frontmatter から自動取得）
id=$(sed -n "s/^id: *//p" Qiita/public/<slug>.md | tr -d "'\"")
curl -s -o /dev/null -w "%{http_code}\n" "https://qiita.com/s977043/items/$id"

# drift ゼロ確認
npm run check:qiita-drift
```

- web は CDN キャッシュで反映が遅延し得る。200 にならない場合は `Qiita/public/.remote/<id>.md` の title でサーバ実体を確認（読むのは可、編集は禁止）
- drift が残る場合はフェーズ1が不完全。「失敗時の復旧」を参照

## フェーズ3: PR 作成

hygiene 変更 + `id`/`updated_at` 書き戻し + `docs/publish-queue.md` の Done 移動を**1つの PR**にまとめる（PR #425 / #443 の実態に合わせる）。

1. `docs/publish-queue.md`: 該当行を Queue から Done へ移動し、公開日・公開 URL・id・経緯を記録
2. ブランチ作成 → **対象ファイルのみ明示 staging**（`git add -A` 禁止。AGENTS.md / `.remote/` を巻き込まない）
   - `Qiita/public/<slug>.md`
   - `docs/publish-queue.md`
3. push 前に `npm run gh:ensure`（active account を s977043 へ）
4. `gh pr create`（base: main）。本文に 公開 URL（HTTP 200 確認済みの旨）/ 実施した hygiene / `npm run check` 結果 を記載
5. マージはユーザー確認のうえ `gh pr merge --squash --delete-branch`（番号省略で現在ブランチの PR を対象にできる）

## 失敗時の復旧

### publish でローカル本文が巻き戻った（pre-sync 巻き戻り）

`.remote/` キャッシュと作業ファイルが一致していると、publish 冒頭の全記事 pull がサーバ旧内容で作業ファイルを上書きする（AGENT_LEARNINGS 2026-06-03）。復旧手順:

```bash
git checkout HEAD -- Qiita/public/<slug>.md        # 正しい本文を復元
# .remote/<id>.md がサーバ旧内容（= working と相違）であることを確認してから
npm run publish:qiita -- <slug> --force
```

`--force` は `isOlderThanRemote` 検証（失敗 publish でサーバ `updated_at` が進んだ後に必要）を skip する。復旧後はフェーズ2の検証をやり直す。

### title 未クオートで publish 全滅

frontmatter `title` の `: ` をシングルクオートで囲んで再実行（0-3 の 4 を参照）。

### 二重公開してしまった（slug↔id 乖離）

ローカル dedup 後も **Qiita 上の重複記事をユーザーが削除するまで `qiita pull` / `npm run pull:qiita` を実行しない**（pull が削除済みファイルを蘇生させる）。Qiita 側削除は不可逆でユーザー専任、エージェントは申し送りまで（AGENT_LEARNINGS 2026-05-18）。

## 関連

- `scripts/publish-qiita.sh` — publish wrapper（`check:qiita-remote-cache` 内蔵）
- `docs/publish-queue.md` — 公開キュー（実態確認は 0-1 を必ず通す）
- `/post-merge-verify <pr#またはslug>` — PR マージ後の事後検証
- `AGENT_LEARNINGS.md` §B Qiita publish / drift / 重複公開
