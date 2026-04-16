# my-blog

Zenn・Qiita・noteの記事をこの1つのリポジトリで並行管理するモノレポ。
レビュー生成と反映は`.claude/`のSkill / Agent / Slash Commandでワークフロー化してある。

## リポジトリ構成

```text
my-blog/
├── articles/               Zenn 記事本体 (.md)          → articles/README.md
├── Qiita/                  Qiita 記事本体 (public/*.md) → Qiita/README.md
├── articles_note/          note 記事のローカル管理       → articles_note/README.md
├── books/                  Zenn の本 (chapters を含む)
├── images/                 Zenn 記事用画像（<slug>/ ごと）
├── reviews/
│   ├── zenn/               Zenn 記事のレビュー成果物
│   ├── qiita/              Qiita 記事のレビュー成果物
│   └── note/               note 記事のレビュー成果物（published/drafts/new に分割）
├── .claude/                Claude Code の Skill / Agent / Slash Command / 設定
├── package.json            Zenn CLI / Qiita CLI のスクリプト集約
├── qiita.config.json       Qiita CLI 設定（--root Qiita 前提）
└── README.md               このファイル
```

各プラットフォームの詳細な運用は、それぞれの配下READMEを参照する。

- [`articles/README.md`](./articles/README.md) — Zenn記事の構成・slug規約・Front Matter
- [`Qiita/README.md`](./Qiita/README.md) — Qiita記事の構成・`public/.remote/`の役割
- [`articles_note/README.md`](./articles_note/README.md) — noteエクスポートとインポートの運用フロー

## Zenn

- 記事: `articles/*.md`
- 本: `books/<slug>/`
- 画像: `images/<slug>/*.png`
- プレビュー: `npm run preview`
- 記事一覧: `npm run list:articles`
- 本一覧: `npm run list:books`

ZennはGitHub連携で公開されるため、`main`へのpushがそのまま反映になる。

参考: [Zenn CLI guide](https://zenn.dev/zenn/articles/zenn-cli-guide)

## Qiita

### 初期セットアップ

- `npm install`でCLIを導入
- `npx qiita login`でアクセストークンを発行・認証（認証情報は`~/.config/qiita-cli/`に保存、リポジトリには含めない）

### よく使うコマンド

- 記事: `Qiita/public/*.md`
- プレビュー: `npm run preview:qiita`
- 新規作成: `npm run new:qiita -- article-base-name`
- Qiitaから取得: `npm run pull:qiita`
- 1記事を投稿・更新: `npm run publish:qiita -- article-base-name`
- 全記事を投稿・更新: `npm run publish:qiita:all`

Qiita CLIは`<root>/public/`を強制するため、本リポジトリでは全スクリプトで`--root Qiita`を指定している。

### 下書き・公開の状態

Front Matterで次の2軸を使い分ける。

- ローカルのみの下書き（Qiitaに送らない）: `ignorePublish: true`
- Qiita上の限定共有（URLを知る人だけ閲覧可）: `private: true` + `ignorePublish: false`
- 一般公開: `private: false` + `ignorePublish: false`

### Qiitaイベントメモ

次の3本は、Qiita公式イベント「2025年、生成AIを使ってみてどうだった？」向けに着手したもので、現在は限定共有記事として投稿済み。

- `Qiita/public/ai-dev-team-2025-retrospective.md`
- `Qiita/public/ai-dev-team-reviewable-ai-changes.md`
- `Qiita/public/ai-dev-team-test-first-agent-workflow.md`

募集期間`2026-01-19`〜`2026-02-27`は終了済みでキャンペーン選考対象外のため、一般公開へ切り替える場合はキャンペーンタグ（`FindyTeamPlus_AI_2025`等）を付けない方針で内容とタグを確認し、`private: false`にしてから再投稿する。

## note

- 記事: `articles_note/published/` `articles_note/drafts/` `articles_note/new/`
- 画像: `articles_note/assets/`
- エクスポート原本: `articles_note/export/YYYY-MM-DD/*.zip`

noteのインポートは**常に新規下書き作成**で、既存記事の上書きはできない。運用の詳細とスクリプト（`.claude/skills/note-export-import/scripts/`）は[`articles_note/README.md`](./articles_note/README.md)を参照。

## 記事レビューのワークフロー

各媒体の記事に対して、3ペルソナレビューを走らせて`reviews/<platform>/<slug>.md`に蓄積し、採否を判断したうえで本文に反映する。

Slash Command:

- `/review-article <slug>` — Zenn記事をレビュー → `reviews/zenn/<slug>.md`
- `/review-note-article <slug>` — note記事をレビュー → `reviews/note/<slug>.md`
- `/apply-review <slug>` — `reviews/zenn/<slug>.md`の指摘を`articles/<slug>.md`に選別反映
- `/article-pipeline <slug>` — レビュー生成→反映を連続実行（2PR運用）

関連Agent: `.claude/agents/article-reviewer.md` `.claude/agents/note-article-reviewer.md` `.claude/agents/review-applier.md`

## Zenn / Qiita / noteの書き分け

- **Zenn** — 実装手順、テンプレート、コマンド、設定例を中心にした技術ガイド
- **Qiita** — 体験談、チームでの気づき、失敗と運用改善の前後を中心にした振り返り
- **note** — より個人寄りの視点・所感・長めのエッセイ
- 共通 — 短い段落、実務で困ったことから入る構成、落ち着いた説明口調、AIを万能視しない温度感

## 参考

- [Zenn CLI guide](https://zenn.dev/zenn/articles/zenn-cli-guide)
- [Qiita CLI](https://github.com/increments/qiita-cli)
- [AI x Dev x Team](https://qiita.com/official-campaigns/ai-dev-team)
- [2025年、生成AIを使ってみてどうだった？](https://qiita.com/official-events/df853677df3984f82556)
