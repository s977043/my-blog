# Qiita/ — Qiita記事のローカル管理

Qiita (`@mine_take`) の記事をQiita CLI (`@qiita/qiita-cli`) で管理する作業ディレクトリ。
CLI仕様により、記事Markdownは`Qiita/public/`配下にのみ置ける。

## ディレクトリ構成

```text
Qiita/
├── README.md                  このファイル
└── public/                    Qiita 記事本体 (.md) — CLI が認識する唯一の場所
    ├── <article-id>.md        既存記事（Qiita 上の記事 ID をファイル名に使用）
    ├── <slug>.md              新規作成記事（new:qiita で生成した任意スラッグ）
    └── .remote/               pull:qiita で取得した Qiita 側の最新コピー（差分確認用）
        └── <article-id>.md
```

- **`public/*.md`** — ローカルの正。編集対象はここ。`publish:qiita`でQiitaに反映される
- **`public/.remote/*.md`** — Qiita側の最新スナップショット。`public/*.md`と差分比較するための参照用（手動編集しない）
- Qiita CLIは`--root Qiita`指定時に`Qiita/public/`を固定で参照するため、サブディレクトリで分類することはできない

## Front Matterによる状態管理

| 状態 | `private` | `ignorePublish` | 挙動 |
| ---- | --------- | --------------- | ---- |
| ローカル下書き（送らない） | 任意 | `true` | `publish:qiita`の対象外 |
| Qiita上の限定共有 | `true` | `false` | URLを知る人のみ閲覧可 |
| 一般公開 | `false` | `false` | 通常記事として公開 |

## よく使うコマンド

リポジトリルートから実行する。全コマンドが内部で`--root Qiita`を付与済み。

```bash
npm run preview:qiita                      # http://localhost:8888 でプレビュー
npm run new:qiita -- <article-base-name>   # 新規記事の雛形を public/ に作成
npm run pull:qiita                         # Qiita から最新を .remote/ に取得
npm run publish:qiita -- <article-base-name>  # 1記事を投稿・更新
npm run publish:qiita:all                  # 全記事を投稿・更新
npm run check:qiita                        # CLI バージョン確認
```

初回のみ`npx qiita login`でアクセストークン認証が必要（認証情報は`~/.config/qiita-cli/`に保存、リポジトリには含めない）。

## 書き分け方針（Zennとの対比）

- **Qiita**: 体験談、チームでの気づき、失敗と運用改善の前後を中心にした振り返り
- **Zenn** (`articles/`): 実装手順、テンプレート、コマンド、設定例を中心にした技術ガイド

## 参考

- [Qiita CLI](https://github.com/increments/qiita-cli)
- ルートREADME: [../README.md](../README.md)
