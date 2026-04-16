# articles/ — Zenn 記事のローカル管理

Zenn (`@mine_take`) の記事を Zenn CLI (`zenn-cli`) で管理する作業ディレクトリ。
Zenn CLI は `articles/` 配下の Markdown を記事として認識する（サブディレクトリは不可、1記事=1ファイル）。

## ディレクトリ構成

```
articles/
├── README.md                 このファイル
├── .keep                     空ディレクトリ保持用（削除しない）
└── <slug>.md                 記事本体。ファイル名がそのまま Zenn URL の slug になる
```

画像は本ディレクトリではなく、リポジトリルートの `images/<slug>/*.png` に配置する（Zenn の推奨構成に合わせてある）。

## ファイル名（slug）の規約

- 半角英小文字 + 数字 + ハイフン、12〜50文字を推奨（Zenn の制約）
- 一度公開した slug は**変更しない**（URL が変わり既存被リンクが切れる）
- テーマが近い記事はプレフィックスを揃えて並びを作る（例: `ai-dev-*`, `zenn-*`）

## Front Matter による状態管理

```yaml
---
title: "記事タイトル"
emoji: "🧭"               # 1文字絵文字
type: "tech"              # tech | idea
topics: ["ai", "zenn"]    # 5個まで
published: false          # true にすると公開
---
```

| 状態 | `published` | 挙動 |
| ---- | ----------- | ---- |
| ローカル下書き | `false` | ローカルプレビューのみ |
| 一般公開 | `true` | `git push` で Zenn に反映 |

Zenn は GitHub 連携方式のため、`publish` 用のコマンドは不要。`main` への push で自動デプロイされる。

## よく使うコマンド

リポジトリルートから実行する。

```bash
npm run preview          # http://localhost:8000 でプレビュー（Zenn CLI）
npm run list:articles    # 認識されている記事一覧
npm run check            # articles / books / Qiita CLI のまとめ確認
```

新規記事は任意のエディタで `articles/<slug>.md` を作成する（`zenn new:article` を使うなら別途 Zenn CLI のコマンドを利用）。

## レビュー成果物との対応

各記事は `reviews/<slug>.md` にレビュー指摘を蓄積する運用になっている。

- レビュー生成: `/review-article <slug>`
- レビュー反映: `/apply-review <slug>`
- 一括実行: `/article-pipeline <slug>`

詳細は `.claude/skills/review-article/` および `.claude/skills/apply-review/` を参照。

## 書き分け方針（Qiita との対比）

- **Zenn** (本ディレクトリ): 実装手順、テンプレート、コマンド、設定例を中心にした技術ガイド
- **Qiita** (`Qiita/public/`): 体験談、チームでの気づき、失敗と運用改善の前後を中心にした振り返り

## 参考

- [Zenn CLI guide](https://zenn.dev/zenn/articles/zenn-cli-guide)
- [Zenn の記事・本の公開方法（GitHub 連携）](https://zenn.dev/zenn/articles/connect-to-github)
- ルート README: [../README.md](../README.md)
