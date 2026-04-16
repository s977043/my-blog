---
name: note-article-review
description: note.com記事（articles_note/<state>/<slug>.md、<state>は new/drafts/published）のレビュー成果物を生成・反映するワークフロー。記事タイプ判定、3ペルソナ観点、JTFスタイル準拠、スマホ可読性、note内発見性を重視する。
---

# note-article-review

note.com記事のレビュー → 指摘反映 のライフサイクルを扱うスキル。Zenn向けの `article-review-apply` スキルに対応する note版。

## トリガー
- `/review-note-article <state>/<slug>` コマンド経由（レビュー生成）
- または `note-article-reviewer` エージェントから参照

## 前提条件
- 対象記事: `articles_note/<state>/<slug>.md`（`<state>` は `new` / `drafts` / `published`）
- 出力先: `reviews/note/<state>/<slug>.md`
- main ブランチが最新 (`git pull origin main`)
- git identity がリポジトリ規約どおり (`mine_take <s977043@users.noreply.github.com>`)

## ディレクトリ構成
```
articles_note/
├── new/        # 未投稿の新規原稿
├── drafts/     # noteに下書きとして存在する記事
└── published/  # noteで公開済みの記事

reviews/
├── zenn/       # Zenn記事のレビュー
├── note/
│   ├── new/
│   ├── drafts/
│   └── published/
└── qiita/      # Qiita記事のレビュー（将来用）
```

## note と Zenn の差分（スキル設計上の重要ポイント）
| 項目 | Zenn | note |
|------|------|------|
| Front Matter | 必須 (`published`, `title`, `topics`, `type`, `emoji`) | なし（本文冒頭） |
| 配置規約 | `articles/<slug>.md` | `articles_note/<state>/<slug>.md` |
| コードブロック | 中心的要素 | 補助的要素 |
| 検索流入 | Google中心 | Google + note内検索/おすすめ/マガジン |
| 画像・埋め込み | Zenn CLI対応 | note埋め込みカード前提 |
| 表現規約 | Markdown中心 | JTFスタイル準拠を意識 |
| 読者端末 | PC比率高め | スマホ比率高め |
| 記事タイプ | 技術ガイド中心 | オピニオン/体験/解説が混在 |
| 公開判定 | `published: true` フラグ | ディレクトリ (`published/`) |

## 状態別の扱い
- **`new/`**: 本文反映・編集が自由。通常PR
- **`drafts/`**: note上に下書きとして存在。反映はnote側との整合確認が必要
- **`published/`**: note で公開済み。反映PR時は **⚠️ 公開済み記事** バナー必須

## 手順（レビュー生成フェーズ）

### 1. ブランチ作成
```bash
git checkout main
git pull origin main
git checkout -b docs/review-note-<slug>
```

### 2. 出力先ディレクトリ準備
```bash
mkdir -p reviews/note/<state>
```

### 3. 記事タイプ判定
`articles_note/<state>/<slug>.md` を読み、以下のいずれかに分類:
- **オピニオン記事**: 主張・意見・問題提起が中心
- **体験/振り返り記事**: 実体験・時系列の出来事が中心
- **解説/ハウツー記事**: 手順・仕組み・技術解説が中心
- **混合**: 複数タイプを併せ持つ

判定結果を想定読者ペルソナに反映する。

### 4. 3ペルソナでレビュー生成
`note-article-reviewer` エージェントのフォーマット準拠:
- a) noteディレクター視点
- b) note編集者視点
- c) 想定読者視点（記事タイプに応じて動的ロール）

### 5. JTFスタイル個別チェック（必須指摘項目）
- ダッシュ（—、――、——、―）の混入 → 括弧/句点への置換提案
- 三点リーダー記号の統一
- 英数字の半角統一
- 全角カッコ使用
- 敬体/常体の混在

### 6. note特有チェック
- タイトルフック（30文字前後でのインパクト）
- リード（冒頭3段落）が検索意図と一致しているか
- 段落が全角100文字・3〜5行以内か
- 2スペース改行の使い方が意図的か
- ハッシュタグ候補が記事意図と一致するか
- マガジン適合性

### 7. コミット
```bash
git add reviews/note/<state>/<slug>.md
git commit -m "docs(reviews): add 3-persona note review for <state>/<slug>

Generate review with persona mapping and JTF-style checks:
- State: <state>
- Type: <記事タイプ>
- Findings: <件数>件

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

### 8. push & PR作成
```bash
git push -u origin docs/review-note-<slug>
gh pr create --title "docs(reviews): add note review for <state>/<slug>" --body "(レビュー要約)"
```

## 手順（反映フェーズ）

### 9. 分類
`review-applier` エージェントの分類基準に沿って採用/保留/却下に仕分け。note特有の追加基準:
- **採用追加**: JTFスタイル違反、明白な表記揺れ
- **保留追加**: タイトル/リードの変更、ハッシュタグ提案、マガジン移動（運用判断）
- **却下追加**: Zenn基準の指摘（front matter、コードブロック言語指定など）がnote記事に誤って付いた場合

### 10. 採用分の反映
- 対象は `articles_note/<state>/<slug>.md`
- 最小差分で Edit
- JTFスタイル違反は一括で置換

### 11. 検証
- Markdown見出し階層が保たれているか
- 記事全体のリズム（段落長・改行）が崩れていないか
- 編集後に再度 JTFスタイルに沿っているか
- 記事タイプに応じた中核語の一貫性

### 12. コミット & PR
```bash
git add articles_note/<state>/<slug>.md
git commit -m "docs(articles_note): apply review feedback to <state>/<slug>

Apply <N> accepted findings from reviews/note/<state>/<slug>.md.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

gh pr create --title "docs(articles_note): apply note review feedback to <state>/<slug>" --body "$(採否一覧テンプレート)"
```

**`published/` 記事の場合**、PR本文冒頭に必ず以下を含める:
```
> ⚠️ **公開済み記事** (`articles_note/published/`)
> 本PRは既にnote.com上で公開されている記事への修正提案を含みます。
> note はインポートで既存記事を上書き更新できないため、マージ後はnote管理画面で手動反映が必要です。
```

## ガードレール
- [ ] 記事本文以外のファイル（reviews/ 配下）を勝手に変更しない
- [ ] レビュー生成フェーズでは `articles_note/**/*.md` を変更しない
- [ ] `published/` 配下の記事に反映PRを作る場合は ⚠️ バナー必須
- [ ] JTFスタイル違反（特にダッシュ）の指摘を意図的に却下する場合は理由を明記
- [ ] 自動マージ禁止
- [ ] 採否一覧が空の場合はPRを作らず報告で終える

## エラー回復
- Edit が conflict した場合: 該当指摘は保留に降格し、PR本文に理由記載
- URL 検証失敗時: 技術指摘は保留に降格
- JTFスタイル置換が意図を破壊しそうな場合: 保留に降格し、著者判断を仰ぐ

## 成果物
- レビューフェーズ: `reviews/note/<state>/<slug>.md`（PR: `docs/review-note-<slug>`）
- 反映フェーズ: `articles_note/<state>/<slug>.md` への差分（PR: `chore/apply-review-note-<slug>`）
- 採否一覧を含むPR本文

## 参考
- `.claude/agents/note-article-reviewer.md` (エージェント定義)
- `.claude/agents/article-reviewer.md` (Zenn版、対応関係の確認用)
- `.claude/skills/article-review-apply/SKILL.md` (Zenn版、反映フェーズ設計の参考)
- `reviews/note/new/ai_agent_operations_opinion_note.md` (new/ の既存レビューフォーマット)
- `reviews/note/published/n3aae6b5467b9.md` (published/ の既存レビューフォーマット)
