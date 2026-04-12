# my-blog

Zenn と Qiita の記事をこのリポジトリで管理します。

## Zenn

- 記事: `articles/*.md`
- 本: `books/*`
- プレビュー: `npm run preview`
- チェック: `npm run check`

参考: [Zenn CLI guide](https://zenn.dev/zenn/articles/zenn-cli-guide)

## Qiita

- 記事: `public/*.md`
- プレビュー: `npm run preview:qiita`
- 新規作成: `npm run new:qiita -- article-base-name`
- Qiita から取得: `npm run pull:qiita`
- 1記事を投稿・更新: `npm run publish:qiita -- article-base-name`
- 全記事を投稿・更新: `npm run publish:qiita:all`

Qiita CLI は `public` ディレクトリ配下の Markdown を記事として扱います。
公開前の下書きは Front Matter の `ignorePublish: true` を維持してください。

## Qiita イベントメモ

`public/ai-dev-team-2025-retrospective.md` は、Qiita 公式イベント「2025年、生成AIを使ってみてどうだった？」向けに検討を始めたドラフトです。

2026-04-13 時点で募集期間 `2026-01-19` から `2026-02-27` は終了しているため、いま投稿してもキャンペーン選考対象にはなりません。通常記事として公開する場合は、`ignorePublish: false` に変更する前に、キャンペーンタグを付けない方針で内容とタグを確認してください。

参考:

- [AI x Dev x Team](https://qiita.com/official-campaigns/ai-dev-team)
- [2025年、生成AIを使ってみてどうだった？](https://qiita.com/official-events/df853677df3984f82556)
- [Qiita CLI](https://github.com/increments/qiita-cli)
