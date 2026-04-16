# articles_note/ — note.com 記事のローカル管理

note.com (`@mine_unilabo`) の記事を、公式エクスポートを正としてローカルに保管・編集するための作業ディレクトリ。

## ディレクトリ構成

```
articles_note/
├── README.md                        このファイル
├── assets/                          画像（実体）。Markdownから ../assets/... で参照
├── export/
│   └── YYYY-MM-DD/
│       └── *.zip                    公式エクスポートZIP原本（日時別バックアップ）
├── published/                       note公開中記事 (.md) — 参照・編集用コピー
├── drafts/                          note下書き記事 (.md) — 参照・編集用コピー
└── new/                             未投稿の新規原稿 (.md)
```

- **`export/YYYY-MM-DD/`** — noteから落とした公式WXRのZIPを**そのまま**保管。履歴として残す
- **`assets/`** — 最新エクスポートに含まれる画像を展開した実体
- **`published/` / `drafts/`** — ZIPから展開・Markdown化した編集用ビュー。`wp:status` で振り分け
- **`new/`** — これから書く記事の原稿置き場。noteには未投稿

## note仕様上の重要な制約

- **インポートは常に新規下書きを作成する**。既存記事を上書きする機能はない（GUID/URL一致でも更新不可）
- インポートは WXR (`.xml`) または MT (`.txt`) 形式。1回 20MB / 1,000記事 まで
- インポート取り込み可否:
  - 取り込まれる: タイトル / 本文 / `<img src="https://...">` の画像（noteに再保存される）
  - 取り込まれない: 目次 / ハッシュタグ / 価格 / 試し読みライン / 一部の埋め込み・装飾
- インポート結果は 3日以内にメール通知。全記事「下書き」として追加

## 運用フロー

### ① バックアップ（定期）

1. note管理画面: プロフィール → 「自分の記事」 → 右上「エクスポート」 → 「エクスポートを開始」
2. メールでZIPのダウンロードリンクを受信（最大3日）
3. ZIPを `export/YYYY-MM-DD/` に配置（リネームせず原本のまま）
4. 最新ZIPを展開して `assets/` と `published/` `drafts/` を再生成（手順は後述）

### ② 新規記事の作成・投稿

1. `new/<slug>.md` に執筆
2. 記事で使う画像が `articles_note/assets/` にある場合は、**先に GitHub `main` に公開**
3. `.claude/skills/note-export-import/scripts/md_to_wxr.py` で単一記事WXRを `articles_note/build/<slug>.xml` に変換
   - 画像を note に自動取り込みさせる場合は `--base-url https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets` を付ける
4. noteインポート → 下書きとして作成される
5. noteエディタで確認・画像差し替え → 公開
6. 公開後は次回バックアップ時に `published/` に反映される

### ③ 既存記事の更新

noteインポートでは**上書き更新できない**ため、以下のどれか:

- **A. note上で直接編集（推奨）** — `published/<slug>.md` を参照しながらnoteエディタで編集
- **B. 新下書き作成 → 差し替え** — インポートで新下書きを作って、note上で既存本文に上書きコピペ
- **C. 削除 → 新規インポート** — URL変化・スキ・コメント喪失するため**非推奨**

## スキル・エージェント・スクリプト

- **スキル**: `.claude/skills/note-export-import/SKILL.md` — ワークフロー全体の正本
- **エージェント**: `.claude/agents/note-export-importer.md` — 取り込み/WXR生成を代行
- **スクリプト**:
  - `scripts/wxr_to_md.py` — ZIP/WXR → `published/ drafts/ assets/` 再生成（日時アーカイブも実施）
  - `scripts/md_to_wxr.py` — `new/<slug>.md` → インポート用WXR生成

依存: `pip install --break-system-packages markdownify markdown`

### よく使うコマンド

```bash
# エクスポート取り込み
python3 .claude/skills/note-export-import/scripts/wxr_to_md.py <zip> --out articles_note

# 新規記事をインポート用WXRに変換
python3 .claude/skills/note-export-import/scripts/md_to_wxr.py articles_note/new/<slug>.md

# 画像をGitHub公開URLに書き換えてWXR生成
python3 .claude/skills/note-export-import/scripts/md_to_wxr.py \
  articles_note/new/<slug>.md \
  --base-url https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets
```

## 画像公開ルール

- `articles_note/assets/` の画像を note インポートで使う場合、本文の `../assets/...` は**ローカル編集用**
- note 取り込み時は `md_to_wxr.py --base-url ...` で **GitHub Raw の絶対URL** に変換する
- 変換先は **`main` ブランチ固定**。PR branch の raw URL は merge 後に消えるため使わない
- 画像追加後にまだ GitHub `main` へ出ていない場合は、先に PR を作成・merge して公開してから WXR を作る

## 記事分類のヒント

個人活動か公式ブログ寄りかは、以下で機械判定できる:

- **個人**: 本文に「個人の活動による」「会社の公式見解では」「公式見解とは異なる」の免責あり
- **公式寄り**: 上記免責なし、かつ「ユニラボ」「PRONI」「アイミツ」等の社名言及あり

## 現状のスナップショット（2026-04-16時点）

- `export/2026-04-16/` に公式ZIP保管
- `published/` 22記事 / `drafts/` 10記事 / `new/` 1記事
- `assets/` 画像90枚
