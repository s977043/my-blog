# reviews/note/ — note 記事のレビュー成果物

`articles_note/<state>/<slug>.md` に対する 3 ペルソナレビューをここに蓄積する。**状態（`new` / `drafts` / `published`）別にサブディレクトリを切る**のが note 固有の規約。

## 配置規約

```text
reviews/note/
├── new/<slug>.md          未投稿原稿のレビュー
├── drafts/<slug>.md       note 下書きのレビュー
└── published/<slug>.md    note 公開済み記事のレビュー
```

`<state>` と `<slug>` は `articles_note/<state>/<slug>.md` と 1 対 1 対応する。

## 生成と反映

| 動作 | コマンド | 成果物 |
|------|---------|-------|
| レビュー生成 | `/review-note-article <state>/<slug>` | `reviews/note/<state>/<slug>.md` |
| 本文反映 | `/apply-review-note <state>/<slug>` | `articles_note/<state>/<slug>.md` への採用分 Edit + PR |
| 連続実行（2 PR 分割） | `/article-pipeline-note <state>/<slug>` | 生成 → （ユーザー確認）→ 反映 |

## 3 ペルソナ観点（概要）

- **a) note ディレクター視点**: タイトルフック・リード・章構成・note 内発見性（タグ/ハッシュタグ/マガジン）
- **b) note 編集者視点**: 誤字脱字・**JTF スタイル準拠**・段落リズム・スマホ可読性
- **c) 想定読者視点**: 記事タイプ（オピニオン／体験／解説）に応じて動的に設定

JTF スタイル主要チェック: ダッシュ（`—` `――` `——` `―`）非使用、三点リーダー `……`、全角カッコ（`（）「」『』`）、敬体／常体の混在回避。

詳細な観点・出力フォーマットは `.claude/agents/note-article-reviewer.md` 参照。

## 運用ルール

- レビューは生成後**不変**（採否判断・本文反映は別 PR で行う）
- **`published/` 配下のレビュー**を本文に反映する PR には ⚠️ バナー必須:
  > note はインポートで既存記事を上書き更新できないため、マージ後は note 管理画面で手動反映が必要
- 記事本文 (`articles_note/**/*.md`) の更新はこのディレクトリを**変更しない**

## 参考

- `../README.md` — reviews/ 全体の入口
- `.claude/agents/note-article-reviewer.md`
- `.claude/agents/review-applier.md`
- `.claude/skills/note-article-review/SKILL.md`
- `articles_note/README.md` — note 側のディレクトリ構成と仕様制約
