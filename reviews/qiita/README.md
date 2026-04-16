# reviews/qiita/ — Qiita 記事のレビュー成果物（未整備）

Qiita 記事に対するレビュー成果物の**将来用置き場**。現時点では専用の生成・反映ワークフローは未整備。

## 配置規約（将来用）

```text
reviews/qiita/<article-base-name>.md
```

`<article-base-name>` は `Qiita/public/<article-base-name>.md` と 1 対 1 対応する想定（Qiita CLI の slug / article-id と合わせる）。

## 現状

- 対応する Slash Command（`/review-qiita-article` 等）・Agent・Skill は**未実装**
- このディレクトリ自体は、配置規約を実ディレクトリで表明するためだけに存在（`.gitkeep` としての本 README）

## 暫定運用（必要になった場合）

Zenn 向けツールを以下の対応で流用できる:

| Zenn 用 | 読み替え先（Qiita） |
|---------|------------------|
| `articles/<slug>.md` | `Qiita/public/<slug>.md` |
| `reviews/zenn/<slug>.md` | `reviews/qiita/<slug>.md` |
| `.claude/agents/article-reviewer.md` | 出力パスと「Web エンジニア読者視点」の Qiita 文化差分（ハンズオン寄り・個人体験寄りの評価）を加味して運用 |

正式なコマンド化が必要になったら、Zenn 用コマンド（`/review-article` `/apply-review` `/article-pipeline`）を Qiita 向けに複製して `.claude/commands/` に配置する。

## 参考

- `../README.md` — reviews/ 全体の入口
- `Qiita/README.md` — Qiita 側の運用
- `@AGENTS.md` — プラットフォーム別の配置規約
