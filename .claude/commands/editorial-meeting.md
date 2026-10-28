---
description: 媒体をまたいだ次の公開順と時期を、公開キュー・直近公開日・原稿在庫から review-only で提案する（編集会議）
---

# /editorial-meeting

編集部の「編集長・編成」にあたる判断材料をまとめる。note / Zenn / Qiita / izanami の次の公開候補と時期を表で出し、判断はユーザーに渡す。

## 境界

- **review-only**。記事・`docs/publish-queue.md`・Seed を編集しない。公開・マージ・PR 作成をしない
- 公開間隔の数値は `docs/publish-operating-policy.md` §媒体をまたいだ公開間隔 と §Rate-limit 遵守 が正本。本コマンドに書き写さない
- 会社公式（`PRONI-` 接頭辞）は企画をユーザーが決めるため、候補と時期の提示に留める
- 1 本の公開準備に進むときは `/publish-zenn` `/publish-qiita` `/finalize-note-article` へ引き継ぐ

## 手順

1. **公開キュー**: `docs/publish-queue.md` を読み、待機中・Done の記事を把握する

2. **直近公開日**
   - note 個人:
     ```bash
     curl -s "https://note.com/api/v2/creators/mine_unilabo/contents?kind=note&page=1"
     ```
     各記事の `publishAt` を見て、その最大値を直近公開日とする（先頭は固定表示の記事のことがあるため、先頭を最新とみなさない）。**`publishAt` が下書き作成日を指す場合がある**ため、管理画面や公開 URL で公開日を確かめられないものは「推定」と書く
   - Zenn:
     ```bash
     curl -s 'https://zenn.dev/api/articles?username=minewo&order=latest'
     ```
     先頭記事の `published_at` を直近公開日とする（API は `docs/publish-operating-policy.md` の Web 反映確認と同じもの）。過去 24h の新規 publish 件数は `BASE_REF=origin/release/zenn npm run check:zenn-pace` で見る（直近公開日は出さない）
   - Qiita: `Qiita/public/*.md` の front matter（`ignorePublish: false` かつ `id` あり）の `id` から Qiita API（`https://qiita.com/api/v2/items/<id>`）の `created_at` を取る。`updated_at` は更新日で公開日ではない。API で取れないものは「推定」と書く

3. **原稿在庫**
   - note: `articles_note/new/`（`PRONI-` は会社公式として別に数える）
   - Zenn: `articles/*.md` のうち `published: false`
   - Qiita: `Qiita/public/*.md` のうち `ignorePublish: true`
   - izanami: `articles_izanami/`
   - 企画段階: `article_seeds/`

4. **判断**
   - 公開間隔: ポリシー文書の目安に照らし、各媒体の次の公開可能時期を出す
   - 題材規約: `AGENTS.md` §題材と媒体の対応・§題材の出どころ に当たる在庫は候補から外し、理由を書く
   - 同テーマの近接: 直近公開記事とテーマが近い候補は間隔を空ける

## 出力

1. **媒体ごとの次の公開候補と時期**

   | 媒体 | 直近公開日 | 次の候補（パス） | 推奨時期 | 根拠・懸念 |
   | --- | --- | --- | --- | --- |

2. **間に入れる短い記事**: note の間に入れる Zenn / Qiita 候補
3. **在庫が薄い媒体へのネタ補充**: `theme-discovery` スキルで探す方向を示す（起票はしない）
4. **ユーザーに決めてほしいこと**: 会社公式の企画、時期の衝突など
