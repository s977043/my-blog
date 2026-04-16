# reviews/ — 記事レビュー成果物

各プラットフォームの記事に対する 3 ペルソナレビューの**成果物置き場**。採否分類や本文反映は別ブランチの PR で行うため、ここは記録として不変に保つ。

## ディレクトリ構成

```text
reviews/
├── zenn/                     Zenn 記事のレビュー
├── qiita/                    Qiita 記事のレビュー（未整備。方針は本 README 参照）
└── note/
    ├── new/                  未投稿 note 原稿のレビュー
    ├── drafts/               note 下書きのレビュー
    └── published/            note 公開済み記事のレビュー
```

対象記事との対応関係:

| プラットフォーム | 記事本体 | レビュー成果物 |
|--------------|---------|--------------|
| Zenn | `articles/<slug>.md` | `reviews/zenn/<slug>.md` |
| Qiita | `Qiita/public/<slug>.md` | `reviews/qiita/<slug>.md`（未整備） |
| note | `articles_note/<state>/<slug>.md` | `reviews/note/<state>/<slug>.md` |

## 生成・反映の入口

Slash Command 経由で生成・反映する（Claude Code）。

| コマンド | 役割 | 生成先 |
|---------|------|-------|
| `/review-article <slug>` | Zenn 記事をレビュー | `reviews/zenn/<slug>.md` |
| `/apply-review <slug>` | Zenn レビューを本文に反映 | `articles/<slug>.md` 更新 |
| `/article-pipeline <slug>` | Zenn レビュー生成 → 反映（2 PR 分割） | 上記 2 件を順次 |
| `/review-note-article <state>/<slug>` | note 記事をレビュー | `reviews/note/<state>/<slug>.md` |
| `/apply-review-note <state>/<slug>` | note レビューを本文に反映 | `articles_note/<state>/<slug>.md` 更新 |
| `/article-pipeline-note <state>/<slug>` | note レビュー生成 → 反映 | 上記 2 件を順次 |

規約・フォーマット詳細は `@AGENTS.md` と各プラットフォームの README を参照。

## 運用ルール（重要）

- **レビュー成果物は不変**。採否判断や反映は本文側の PR で行う
- **記事本文を触るフェーズでは `reviews/` 配下を編集しない**
- `reviews/note/published/` のレビューを本文反映する場合は、対応 PR に ⚠️ バナー必須（note は上書きインポート不可）
- 自動マージ禁止（`@AGENTS.md` の禁止事項を参照）

## 参考

- `@AGENTS.md` — プラットフォーム別の配置規約
- `.claude/agents/article-reviewer.md` — Zenn 版レビュアの出力仕様
- `.claude/agents/note-article-reviewer.md` — note 版レビュアの出力仕様
- `.claude/agents/review-applier.md` — 採用/保留/却下の分類基準
