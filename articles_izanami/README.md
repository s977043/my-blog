# izanami Articles

izanami 向けに新規執筆する記事の唯一のローカル原稿を管理する。

媒体としての役割・掲載境界・重複回避・評価方針は [`docs/content-channel-strategy.md` の izanami channel policy](../docs/content-channel-strategy.md#izanami-channel-policy) を正とする。この README はディレクトリの使い方と企画候補だけを扱う。

## 原稿の扱い

- 既存記事は題材と一次情報を再確認する入口として使う。izanami 原稿は新規に書き、元記事の本文を複製して微修正する運用はしない。
- プロジェクトの実装・仕様に関する事実は、それぞれの公開リポジトリ、公開ドキュメント、または公開アプリで確認する。既存記事だけを現在の仕様の根拠にしない。
- Markdown ファイル1つを izanami 記事1本の正本とし、公開後も同じファイルを更新する。公開済み原稿のミラーは作らない。
- Front Matter に `title`、`summary`、`tags`、`status`（`idea` / `draft` / `published`）、`source_articles`、`project_sources`、`izanami_url`、`published_at` を記録する。URLや公開日が未確定なら空欄にする。
- Front Matter はリポジトリ内の管理情報であり、izanami の本文には含めない。投稿時は記事本文だけを使う。
- `published` への変更と izanami への投稿は著者確認後に行う。自動投稿は行わない。

## 初期企画候補

既存記事を起点に候補を整理した段階。記事化前に、izanami 向けの読者課題と公開リポジトリ上の根拠を個別に確認する。

| プロダクト | 既存記事の候補 | 一次情報の候補 | izanami 向けの切り口候補 | 状態 | 次の確認 |
| --- | --- | --- | --- | --- | --- |
| PlanGate | [`articles/plangate-ai-coding-workflow.md`](../articles/plangate-ai-coding-workflow.md)、[`articles/plangate-v86-hook-enforcement.md`](../articles/plangate-v86-hook-enforcement.md) | [`s977043/PlanGate`](https://github.com/s977043/PlanGate) の現行README・実装 | AI に実装を任せる前に、何を人が承認すべきか。実装前ゲートの導入判断と最小構成 | `idea` | 読者課題と現行READMEの対応 |
| River Review | [`articles/river-reviewer-v033-improvement-loop.md`](../articles/river-reviewer-v033-improvement-loop.md)、[`articles/river-review-judgment-placement.md`](../articles/river-review-judgment-placement.md) | [`s977043/river-review`](https://github.com/s977043/river-review) の現行README・実装 | AI レビューで指摘を増やしすぎないために、レビュー対象と判断位置をどう設計するか | `draft` | [`ai-review-coverage.md`](./ai-review-coverage.md) のレビュー |
| Growth Lab | [`articles/penpot-react-design-system-contract.md`](../articles/penpot-react-design-system-contract.md)、[`articles/design-md-guide-and-adoption-log.md`](../articles/design-md-guide-and-adoption-log.md) | [`s977043/growth-lab`](https://github.com/s977043/growth-lab) の公開README・関連ドキュメント | Growth Lab の公開リポジトリで確認できる、プロダクト理解・根拠・実行・結果をつなぐ設計 | `idea` | 一次情報の対応箇所 |
| クラゲ水槽（interactive-ocean） | [`articles_note/published/n27a5594f65a4.md`](../articles_note/published/n27a5594f65a4.md) | [`3396-cc/interactive-ocean`](https://github.com/3396-cc/interactive-ocean) の公開README・実装、[公開アプリ](https://ocean.the3396.com/jellyfish) | 眺める体験をブラウザ上で作るとき、見た目と動きをどう実装へ落としたか | `idea` | 公開リポジトリの根拠 |
| 英単語帳アプリ（PocketEitan） | なし（元記事のない新規企画） | [`s977043/PocketEitan`](https://github.com/s977043/PocketEitan) の公開README・実装 | 学習上の具体的な課題と、それに対するアプリの設計・実装 | `idea` | 公開リポジトリの根拠 |

状態列は Front Matter の `status` と同じ語彙を使う。`source_articles` は題材を選ぶ根拠で、元記事のない新規企画では空にする。`project_sources` は実装や仕様を確認した根拠を記録する。候補記事や角度は、内容の重複・情報鮮度・掲載可否を確認してから原稿へ昇格する。

## 初回試行案

**River Review の Review Coverage** を初回試行として準備中。草稿は [`ai-review-coverage.md`](./ai-review-coverage.md)。既存の判断配置・改善ループ記事で扱ったレビュー運用の実体験を起点に、「指摘が0件」と「必要なレビューが完了した」を別に確認する読者課題へ焦点を移した。既存記事の本文は使わず、現在の公開リポジトリの仕様を確認して新規構成している。

- 既存記事: [`articles/river-review-judgment-placement.md`](../articles/river-review-judgment-placement.md)、[`articles/river-reviewer-v033-improvement-loop.md`](../articles/river-reviewer-v033-improvement-loop.md)
- 一次情報: [`Review Coverage schema`](https://github.com/s977043/river-review/blob/main/schemas/review-coverage.schema.json)、[現行インターフェース状態](https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md)、[Gateの適用条件](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
- 読者課題: AIレビューで指摘が出なかったとき、レビューが完了したのか、実行単位が失敗・タイムアウトしたのかを区別したい
- 観測: 公開後約30日で取得できる閲覧・反応・プロジェクト遷移を記録し、自然な第三者リンクは確認できた場合に別途記録する。izanamiからのリンクは紹介導線として扱い、検索評価への寄与は `rel="nofollow"` の例が確認されたため前提にしない。公開する記事・プロダクトページの実際のリンク属性も記録する

これは初回記事の草稿であり、公開承認ではない。本文・仕様・izanami投稿形式をレビューし、投稿は著者確認後に行う。
