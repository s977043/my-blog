# my-blog

Zenn と Qiita の記事をこのリポジトリで管理します。

## Zenn

- 記事: `articles/*.md`
- 本: `books/*`
- プレビュー: `npm run preview`
- チェック: `npm run check`

参考: [Zenn CLI guide](https://zenn.dev/zenn/articles/zenn-cli-guide)

## Qiita

### 初期セットアップ

- `npm install` で CLI を導入
- `npx qiita login` でアクセストークンを発行・認証（認証情報は `~/.config/qiita-cli/` に保存、リポジトリには含めない）

### よく使うコマンド

- 記事: `Qiita/public/*.md`
- プレビュー: `npm run preview:qiita`
- 新規作成: `npm run new:qiita -- article-base-name`
- Qiita から取得: `npm run pull:qiita`
- 1記事を投稿・更新: `npm run publish:qiita -- article-base-name`
- 全記事を投稿・更新: `npm run publish:qiita:all`

Qiita CLI は `<root>/public/` を強制するため、本リポジトリでは全スクリプトで `--root Qiita` を指定しています。

### 下書き・公開の状態

Front Matter で次の2軸を使い分けます。

- ローカルのみの下書き（Qiita に送らない）: `ignorePublish: true`
- Qiita 上の限定共有（URL を知る人だけ閲覧可）: `private: true` + `ignorePublish: false`
- 一般公開: `private: false` + `ignorePublish: false`

## Qiita イベントメモ

次の3本は、Qiita 公式イベント「2025年、生成AIを使ってみてどうだった？」向けに着手したもので、現在は限定共有記事として投稿済みです。

- `Qiita/public/ai-dev-team-2025-retrospective.md`
- `Qiita/public/ai-dev-team-reviewable-ai-changes.md`
- `Qiita/public/ai-dev-team-test-first-agent-workflow.md`

募集期間 `2026-01-19` から `2026-02-27` は終了済みでキャンペーン選考対象外のため、一般公開へ切り替える場合はキャンペーンタグ（`FindyTeamPlus_AI_2025` 等）を付けない方針で内容とタグを確認し、`private: false` にしてから再投稿してください。

## Zenn / Qiita の書き分け

- Zenn: 実装手順、テンプレート、コマンド、設定例を中心にした技術ガイド
- Qiita: 体験談、チームでの気づき、失敗と運用改善の前後を中心にした振り返り
- 共通: 短い段落、実務で困ったことから入る構成、落ち着いた説明口調、AIを万能視しない温度感

参考:

- [AI x Dev x Team](https://qiita.com/official-campaigns/ai-dev-team)
- [2025年、生成AIを使ってみてどうだった？](https://qiita.com/official-events/df853677df3984f82556)
- [Qiita CLI](https://github.com/increments/qiita-cli)
