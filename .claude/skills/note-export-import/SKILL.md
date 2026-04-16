---
name: note-export-import
description: note.com の公式エクスポート(WXR ZIP)取り込み・インポート用WXR生成・articles_note/ の再編成を扱うワークフロー。ZIPの日時別アーカイブ、published/drafts/assets 再生成、新規MD→単一記事WXR変換、note仕様上の制約(インポートは常に新規下書き、タグ・目次・価格は失われる)を統括する。
---

# note-export-import

note.com 記事のローカル管理 (`articles_note/`) の**エクスポート取り込み** と **インポート用WXR生成** を扱うスキル。

## トリガー
- ユーザーが「note公式エクスポートを取り込みたい／反映したい」と依頼したとき
- ユーザーが「新規記事をnoteにインポートしたい／下書きにしたい」と依頼したとき
- `note-export-importer` エージェントから参照
- `articles_note/export/` 配下の新しいZIPを取り込む必要があるとき

## 前提ディレクトリ構成

```
articles_note/
├── README.md
├── assets/                          画像(実体)、Markdownから ../assets/... で参照
├── export/
│   └── YYYY-MM-DD/*.zip             公式エクスポートZIP原本(日時別バックアップ)
├── published/                       note公開中 (.md)
├── drafts/                          note下書き (.md)
├── new/                             未投稿の新規原稿 (.md)
└── build/                           インポート用WXR出力 (.gitignore推奨)
```

## note仕様上の重要な制約（必ず意識する）
- **インポートは常に新規下書きを作成する。既存記事を上書きする機能はない**
  - GUID/URL一致でも更新されない
  - 既存記事の更新は「note上で直接編集」が基本。差し替えコピペで実現
- インポート対応形式: **WXR (.xml)** または **MT (.txt)**
- 上限: **1回 20MB / 1,000記事**
- 取り込み可否:
  - ○ タイトル / 本文 / `<img src="https://...">` の画像（noteに再保存される）
  - × 目次 / ハッシュタグ / 価格 / 試し読みライン / 一部の埋め込み・装飾
- 成功/失敗は 3日以内にメール通知
- インポート後の記事はすべて「下書き」として追加される

## ワークフロー

### A. エクスポート取り込み（バックアップ更新）

1. ZIPパスを特定（例: `articles_note/export/2026-04-16/xxx.zip` または `~/Downloads/...zip`）
2. 展開先ディレクトリを一時作成 → ZIPを解凍
3. ZIPを `articles_note/export/YYYY-MM-DD/` に**リネームせずに**配置（まだの場合）
4. WXR (`note-*.xml`) + `assets/` を取得
5. `scripts/wxr_to_md.py` で `published/` `drafts/` を再生成
6. `assets/` は最新エクスポート内容で上書き（ルートの `articles_note/assets/`）
7. 差分をレビューしてコミット

### B. 新規記事インポート（下書き作成）

1. `new/<slug>.md` を用意（著者が執筆）
2. `scripts/md_to_wxr.py new/<slug>.md` で `build/<slug>.xml` を生成
3. note管理画面: プロフィール → 自分の記事 → インポート → WXR選択
4. `build/<slug>.xml` をアップロード → インポート開始
5. 3日以内にメール通知 → 下書きが作成される
6. noteエディタで画像差し替え・最終調整 → 公開
7. 公開後は次回バックアップ取り込みで `published/` に反映される

### C. 既存記事更新（上書き不可の回避）

- **推奨: A方式** — `published/<slug>.md` を参照しつつ note上で直接編集
- B方式 — B手順で新下書きを作り、note上で既存記事の本文に上書きコピペ
- C方式（**非推奨**） — 旧記事削除 + 新規インポート。URL/スキ/コメントが失われる

## 画像の扱い

- **ローカル画像** (`../assets/foo.png`) は note にインポートされない
- 自動取り込みは `<img src="https://...">` (JPEG/PNG/GIF) のみ
- 対応:
  - a) 画像をGitHub Raw等でhttps配信 → WXR生成時に絶対URLへ書き換え
  - b) インポート後 note エディタで手動貼り直し（実用的）

## スクリプト

- `scripts/wxr_to_md.py` — WXR + assets → `published/ drafts/ assets/` を再生成
- `scripts/md_to_wxr.py` — `new/<slug>.md` → 単一記事WXR を `build/<slug>.xml` に出力

いずれも `pip install --break-system-packages markdownify markdown` が必要。

## 区分メタの扱い（任意）

各MDのヘッダーに区分タグを入れる運用も可能:
- `> 区分: 公式ブログ` / `> 区分: 個人`
- 自動判定ヒント:
  - **個人**: 「個人の活動による」「会社の公式見解では」等の免責あり
  - **公式寄り**: 上記免責なし かつ「ユニラボ」「PRONI」「アイミツ」等の社名言及あり

## エージェント連携

- `note-export-importer` — A/B/C ワークフローを対話的に実行

## 関連リンク
- [エクスポート機能について](https://www.help-note.com/hc/ja/articles/15597380918425)
- [インポート機能について](https://www.help-note.com/hc/ja/articles/15597154287641)
- [インポート機能の仕様](https://www.help-note.com/hc/ja/articles/16143759138329)
