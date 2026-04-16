## 概要

<!-- 何を変えたか、公開前に見てほしい点を書いてください。 -->

## 変更種別

- [ ] Zenn 記事 (`articles/`)
- [ ] Zenn 本 (`books/`)
- [ ] Qiita 記事 (`Qiita/public/`)
- [ ] note 記事 (`articles_note/`)
- [ ] レビュー成果物 (`reviews/`)
- [ ] 画像
- [ ] `.claude/` 設定（Skill / Agent / Command）
- [ ] GitHub / CI 設定
- [ ] その他

## 確認（共通）

- [ ] `npm ci` が成功する
- [ ] `npm run check` が成功する
- [ ] 画像パスと代替テキストを確認した
- [ ] 誤字、リンク、コードブロックを確認した

## 確認（Zenn を変更した場合）

- [ ] Front Matter の `published` と `topics` を確認した

## 確認（Qiita を変更した場合）

- [ ] Front Matter の `private` / `ignorePublish` の組み合わせを意図どおりに設定した
- [ ] `tags` と既存 `id` を破壊していない

## 確認（note を変更した場合）

- [ ] JTF スタイル（ダッシュ `—` 非使用、三点リーダー `……`、全角カッコ）に準拠している
- [ ] `articles_note/published/` を変更する場合は冒頭に ⚠️ バナー（マージ後に note 管理画面で手動反映が必要な旨）を付与した
- [ ] note 仕様上、インポートでは既存記事を上書きできない点を理解した上での反映である

## 補足

<!-- レビュー観点、未確認事項、スクリーンショットなど。 -->
