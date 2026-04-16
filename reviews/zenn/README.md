# reviews/zenn/ — Zenn 記事のレビュー成果物

`articles/<slug>.md` に対する 3 ペルソナレビューをここに蓄積する。

## 配置規約

```text
reviews/zenn/<slug>.md
```

`<slug>` は対象記事のファイル名から `.md` を除いたもの（`articles/<slug>.md` と 1 対 1 対応）。

## 生成と反映

| 動作 | コマンド | 成果物 |
|------|---------|-------|
| レビュー生成 | `/review-article <slug>` | `reviews/zenn/<slug>.md`（新規または上書き） |
| 本文反映 | `/apply-review <slug>` | `articles/<slug>.md` への採用分 Edit + PR |
| 連続実行（2 PR 分割） | `/article-pipeline <slug>` | 生成 → （ユーザー確認）→ 反映 |

## 3 ペルソナ観点（概要）

- **a) Web ディレクター視点**: 構成・読みやすさ・対象読者整合・SEO
- **b) Web 編集者視点**: 誤字脱字・表記統一・文章明確性・重複
- **c) Web エンジニア読者視点**: 技術的正確性・コード検証・実装可能性

詳細な観点・出力フォーマットは `.claude/agents/article-reviewer.md` 参照。

## 運用ルール

- レビューは生成後**不変**（採否判断・本文反映は別 PR で行う）
- 記事本文 (`articles/*.md`) の更新はこのディレクトリを**変更しない**
- `published: true` の記事に対する反映 PR には ⚠️ バナーを付ける（規約は `@AGENTS.md`）

## 参考

- `../README.md` — reviews/ 全体の入口
- `.claude/agents/article-reviewer.md`
- `.claude/agents/review-applier.md`
- `.claude/skills/article-review-apply/SKILL.md`
