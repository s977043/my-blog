---
description: Zenn記事1本の公開3点セット（flip PR → sync PR → queue Done PR）を人間ゲート付きで一括進行する
argument-hint: <article-slug>（articles/ 配下のファイル名 .md 抜き。新規publish/既存updateは自動判定）
---

# /publish-zenn

Zenn 記事 1 本の公開に必要な定型 PR 群を、テンプレ本文付きで順に作成する。直近 30 日で 3 完全サイクル（#372-374 / #383-385 / #413-415、update は 2PR ペア #418-423）を毎回手作業で回していた運用のコマンド化。

**大原則（AGENTS.md / `docs/publish-operating-policy.md` 準拠）**:

- **自動マージ禁止**。flip PR / sync PR のマージは不可逆な著者ゲート。本コマンドは PR 作成まで行い、マージは毎回ユーザーに依頼して**停止**する
- rate-limit 数値の正本は `docs/publish-operating-policy.md` §Rate-limit 遵守（実効 ~24h/1本。WARN=1 / FAIL=2）
- **release/zenn への merge は前回公開から 24 時間以上あける**
- **既存 update と新規 publish は別 PR・別 deploy**（同一 sync PR に混ぜない）

## 引数

- `$1` = 記事 slug（例: `river-review-plugin-migration`）。`articles/$1.md` が存在しなければエラー終了

## モード自動判定

```bash
grep -m1 '^published:' articles/$1.md                    # main 側の現状
git fetch origin release/zenn
git show origin/release/zenn:articles/$1.md 2>/dev/null | grep -m1 '^published:'   # release/zenn 側の現状
```

| main 側            | release/zenn 側                  | モード                                                                            |
| ------------------ | -------------------------------- | --------------------------------------------------------------------------------- |
| `published: false` | ファイル無し or `false`          | **新規 publish**（フェーズ1 で flip PR を作る）                                   |
| `published: true`  | `true`（本文が main と差分あり） | **既存 update**（フェーズ1 スキップ。本文修正は既に main へマージ済みであること） |
| `published: true`  | `true`（本文差分なし）           | 何もすることがない。報告して終了                                                  |
| `published: true`  | ファイル無し or `false`          | flip 済みだが sync 未実施（**フェーズ2 から再開**）                               |

update モードで本文修正がまだ main に入っていない場合は、先に通常フロー（`/apply-review` 等 → main マージ）を完了させてから本コマンドを再実行する。

## フェーズ0: 事前ゲート（すべて機械実行。1つでも該当したら停止）

```bash
npm run gh:ensure                 # active account を s977043 へ（push/PR 直前にも再実行）
git branch --show-current         # 並列セッション干渉チェック
git status --short
npm run check                     # 集約チェック。exit 0 必須
npm run check:zenn-pace           # 過去24hのpublish切替。2件以上=FAIL→中止、1件=WARN→前回公開から24h経過をユーザーに確認
npm run check:publish-readiness -- $1   # must未解決レビューの検知。blocked なら中止
gh pr list --state open --json number,title,headRefName   # 同一 slug / release/zenn 宛の重複 open PR がないか
```

- `check:publish-readiness` は **PR #447 マージ後に有効**（main 未マージの間は script/npm script が存在しないので skip し、その旨をユーザーに報告する）
- `check:zenn-pace` が FAIL（過去 24h に 2 件以上の publish 切替）なら **ここで中止**。24h 経過後に再実行
- 重複 open PR（同 slug の flip / sync）があれば作成せず報告して終了（並列セッション衝突回避）
- update モードのとき: 過去 24h 以内に**新規 publish** の deploy があった場合も 24h あける（update と新規は別 deploy に分離する規約のため）

## フェーズ1: published flip PR（新規 publish モードのみ）

1. ブランチ作成と flip

   ```bash
   git switch main && git pull --ff-only
   git switch -c chore/publish-$1
   git branch --show-current        # 期待: chore/publish-$1。不一致なら commit せず停止
   ```

   `articles/$1.md` の frontmatter を `published: false → true` に変更（**この 1 行のみ。本文は触らない**）。

2. commit / push（対象ファイルを明示 staging。`git add -A` 禁止）

   ```bash
   git add articles/$1.md
   git commit -m "chore(zenn): $1 を published:true へ（main 段）"
   npm run gh:ensure && git push -u origin chore/publish-$1
   ```

3. PR 作成（base: main）。本文テンプレ（#383 実績ベース）に実測値を埋め込む:

   ```markdown
   ## 概要

   <記事タイトル> の公開。**main 段**。本 PR マージでは Zenn deploy は発火しない（deploy は release/zenn への merge のみ）。

   ## 差分

   `articles/<slug>.md`: `published: false → true`（1行）

   ## 公開フロー（2段・本PRは1段目）

   1. **本 PR**: main へ published:true 化 → 承認・マージ
   2. **次段**: `scripts/sync-release-zenn.sh` で release/zenn sync PR → 承認・マージ → Zenn deploy 発火

   ## rate-limit

   過去24h `published:false→true` 切替 <N>件（`check:zenn-pace` の実行結果を転記）

   ## 公開予定 URL

   https://zenn.dev/minewo/articles/<slug>

   ## レビュー収束

   <レビューラウンドと反映状況。reviews/zenn/<slug>.md や関連 PR 番号を要約>

   ## 検証

   - `npm run check` exit 0、単一フラグ差分のみ
   ```

### 人間ゲート①: flip PR のマージ

**ここで停止し、ユーザーに flip PR のマージを依頼する。** 自動マージ禁止（published フラグ変更は著者ゲート）。マージ確認前にフェーズ2 へ進まない。

## フェーズ2: release/zenn sync PR（flip PR マージ確認後）

1. マージ確認

   ```bash
   gh pr view chore/publish-$1 --json state,mergedAt   # ブランチ名指定で PR 番号の特定を省略。state=MERGED を確認
   git switch main && git pull --ff-only
   ```

2. sync ブランチ作成（既存スクリプトに委譲。conflict は main 採用で自動解決される）

   ```bash
   scripts/sync-release-zenn.sh "chore(release/zenn): publish $1（公開段）"
   ```

   スクリプト末尾の**公開影響プレビュー**（このsyncが新規に持ち込む publish 数）を確認。**対象 slug 以外の flip が混入していたら push せず停止**して報告（別記事の公開を巻き込まない）。update モードの場合は新規 publish が 0 件であることを確認。

3. push / PR 作成（base: **release/zenn**）

   ```bash
   npm run gh:ensure
   git push -u origin HEAD                          # 現在のブランチ（sync スクリプトが作成した release/zenn-sync-*）をそのまま push
   gh pr create --base release/zenn --title "chore(release/zenn): publish $1（公開段）" ...
   ```

   本文テンプレ（#384 実績ベース）:

   ```markdown
   ## 概要

   <記事タイトル> の release/zenn 反映 PR（公開段）。**マージで Zenn deploy が発火**します。

   ## Zenn 公開影響（articles/ 差分）

   | 種別                               | ファイル             | 変更                                    |
   | ---------------------------------- | -------------------- | --------------------------------------- |
   | **新規 publish**（or 既存 update） | `articles/<slug>.md` | <新規追加（published: true）/ 本文更新> |

   articles/ の差分は上記のみ（`git diff origin/release/zenn...HEAD -- articles/ books/ --stat` の結果を転記）。

   ## その他の同期差分（Zenn deploy 影響なし）

   <reviews/ docs/ scripts/ 等の同期内容。Zenn は articles/・books/ のみ deploy 対象>

   ## rate-limit

   - 過去24h `published:false→true` 切替: <N>件
   - release/zenn 側から見た新規 publish deploy: 本記事<N>件目（公開影響プレビューの結果を転記）

   ## マージ後

   1. Zenn 反映確認（https://zenn.dev/minewo/articles/<slug> HTTP 200 / og:title）
   2. `docs/publish-queue.md` への Done 記録（別 PR・フェーズ3）

   ⚠️ 本 PR マージで Zenn 本番反映（著者ゲート）。
   ```

### 人間ゲート②: sync PR のマージ

**ここで停止し、ユーザーに sync PR のマージを依頼する。** マージ = Zenn 本番 deploy 発火（不可逆）。

## フェーズ3: publish-queue Done 記録 PR（sync マージ・公開反映確認後）

**別 PR とする（flip PR への同梱はしない）。** 理由:

1. Done 行には**公開日・live URL・HTTP 200 反映確認**を記録する規約であり、これらは sync マージ後にしか確定しない。flip PR（1段目）の時点では公開されておらず、rate-limit hit で公開が遅延・失敗した場合に虚偽記録になる
2. `/post-merge-verify` 手順 6 に「Queue 行を Done へ移すなら別 PR で（マージ済 PR と束ねない）」と明文化済み
3. 直近 3 サイクルすべて（#374 / #385 / #415）が実際に別 PR 運用で安定している

手順:

1. 公開反映を先に確認（フェーズ4 の live URL 確認を先行実施）
2. main から `docs/queue-done-$1` ブランチを作成し、`docs/publish-queue.md` の該当 Queue 行を Done セクションへ移動（queue 外の記事なら Done へ新規追記）。公開日・URL・経緯（flip PR# / sync PR# / 反映確認済み）を記録
3. `git add docs/publish-queue.md` → commit → `npm run gh:ensure` → push → `gh pr create`（base: main、本文は #385 実績ベース: 経緯の PR チェーンと `npm run check` 結果）
4. この PR は docs 系（自律実行範囲）だが、リポジトリ規約により**マージはユーザー承認後**

update モード（queue に載っていない誤字修正等）では、Done 記録が不要ならフェーズ3 を skip してよい（ユーザーに要否を確認）。

## フェーズ4: 事後検証

`/post-merge-verify $1` 相当を案内・実行する:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://zenn.dev/minewo/articles/$1"    # 200 期待
curl -s "https://zenn.dev/minewo/articles/$1" | grep -oE 'property="og:title" content="[^"]*"' | head -1
curl -s 'https://zenn.dev/api/articles?username=minewo&count=100' | jq '.articles[] | select(.slug=="'$1'")'
npm run check:zenn-pace
git fetch origin main release/zenn && git diff origin/release/zenn..origin/main --stat -- articles/ books/
```

記事が API / live URL に出現しない場合は **rate-limit hit を疑う**（`AGENT_LEARNINGS.md` 2026-05-22。リポジトリに追加 commit を作らず、[Zenn お問い合わせ](https://zenn.dev/inquiry) で緩和申請）。

## 途中失敗・中断からの再開

再実行時はまず現状を機械判定し、該当フェーズから再開する:

| 状態（確認コマンド）                                                         | 再開位置                                                                                                          |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| flip PR が open（`gh pr list --head chore/publish-$1`）               | 人間ゲート①で待機（マージ依頼を再掲）                                                                             |
| flip PR MERGED / sync PR 未作成（release/zenn 側 `published: false` のまま） | フェーズ2 から                                                                                                    |
| sync PR が open                                                              | 人間ゲート②で待機                                                                                                 |
| sync PR MERGED / live URL 200 / queue 未記録                                 | フェーズ3 から                                                                                                    |
| sync PR MERGED だが live URL が 404 / API 不在                               | rate-limit hit 対応（フェーズ4 の注記）。24h 後に release/zenn へ空 commit で再 deploy した前例あり（2026-05-25） |

## ガードレール（再掲）

- 自動マージ禁止（flip / sync / queue すべて）
- flip PR の差分は `published:` 1 行のみ。本文修正を混ぜない
- release/zenn 側で本文を直接編集しない（main 単方向。AGENTS.md §Zenn 公開フロー）
- 24h 以内に 2 本目の publish deploy を作らない。update と新規 publish は別 PR・別日
- push / PR 操作の直前に毎回 `npm run gh:ensure`

## 関連

- `AGENTS.md` §「Zenn 公開フロー（release/zenn ブランチ経由）」
- `docs/publish-operating-policy.md` — rate-limit 数値・著者ゲートの正本
- `scripts/sync-release-zenn.sh` / `scripts/check-zenn-publish-pace.js`
- `.claude/commands/post-merge-verify.md`
