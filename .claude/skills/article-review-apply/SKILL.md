---
name: article-review-apply
description: Zenn記事のレビュー成果物を記事本文に反映するワークフロー。採用/保留/却下の自己分類、公開済み記事の注意喚起、PRベースの変更管理を行う。
---

# article-review-apply

記事レビュー → 指摘反映 のライフサイクルを扱うスキル。

## トリガー
- `/apply-review <slug>` コマンド経由
- または `review-applier` エージェントから参照

## 前提条件
- `reviews/zenn/<slug>.md` が既に存在すること
- `articles/<slug>.md` が存在すること
- main ブランチが最新 (`git pull origin main`)
- git identity がリポジトリ規約どおり (`mine_take <s977043@users.noreply.github.com>`)

## 手順

### 1. ブランチ作成
```bash
git checkout main
git pull origin main
git checkout -b chore/apply-review-<slug>
```

### 2. 入力読み込み
- `reviews/zenn/<slug>.md` をRead
- `articles/<slug>.md` をRead
- 記事の `published` フラグを確認

### 3. 指摘の分類
`review-applier` の分類基準に沿って各指摘を採用/保留/却下に仕分け。判定理由を1行で記録。

#### Zenn 記法活用指摘の採否判断

`article-reviewer` の「Zenn 記法活用観点」（観点 9〜11）から出た指摘は、**文面生成の有無**で採否を分ける:

| 指摘種別 | 判断 | 理由 |
|---|---|---|
| `:::details` で畳み込み（10 行超コマンド例 / PR テンプレート） | **採用** | 既存文を括るだけ、文意変更なし |
| 箇条書き → table 変換（3 項目以上の並列情報） | **採用** | 情報の並べ替え、文意変更なし |
| 既存段落を `:::message` で囲う（文面追加なし） | **採用** | ブロック装飾のみ |
| 固有 SHA / 内部 ID を一般表現に置換 | **採用** | 一般化、再現性維持 |
| 「想定読者 / 前提」の `:::message` を新規作成 | **保留** | 新規文面が必要、著者判断 |
| コアメッセージや中間まとめを新規作成 | **保留** | 要約の切り方が判断依存 |
| 各セクションの目的要約 1 文を追加 | **保留** | 文面生成を伴う |
| 「最小導入」など新規章の追加 | **保留** | 構成変更、著者判断 |

**例外**: 保留区分でも、ChatGPT / 外部レビューの指示書に**採用する文面が具体的に記載されている場合**は採用可（PR 本文で出典を明記）。

### 4. 採用分の反映
- 最小差分で Edit を適用
- 周辺テキストの書き換えは禁止
- 複数指摘が同一箇所なら統合
- **Zenn 記法置き換え**（`:::details` / table 化）は **文面の追加削除なし**を厳守（括り直しのみ）

### 5. 検証
- Zenn Front Matter が壊れていないか (`published`, `title`, `topics`, `type`, `emoji`)
- Markdown構文崩れがないか (`grep -n '^#' articles/<slug>.md` で見出し確認)
- 可能なら `npx zenn preview` を起動してOK（ローカル環境次第）

### 6. コミット
```bash
git add articles/<slug>.md
git commit -m "docs(articles): apply review feedback to <slug>

Apply <N> accepted findings from reviews/zenn/<slug>.md:
- <簡潔なサマリ>

Pending (<M> items) and rejected (<K> items) are captured in the PR body.

Co-Authored-By: <利用中モデル名> <noreply@anthropic.com>"
```

### 7. push & PR作成
```bash
git push -u origin chore/apply-review-<slug>
gh pr create --title "docs(articles): apply review feedback to <slug>" --body "$(採否一覧テンプレート)"
```

PR本文は `review-applier` エージェントの採否テンプレートを使用。

### 8. 事後処理
- ユーザーのレビュー/マージを待つ（**自動マージ禁止**）
- 保留・却下項目でユーザー判断後に採用へ変わった場合は追加コミット

## ガードレール
- [ ] 記事本文以外のファイルを触らない（reviews/zenn/ は不変）
- [ ] Front Matter の `published` フラグを勝手に変更しない
- [ ] `published: true` の場合、PR本文に ⚠️ バナー必須
- [ ] 採否一覧が空の場合はPRを作らず報告で終える
- [ ] 指摘が全て却下の場合も同様（却下ログのみコメント or Issueで記録）

## エラー回復
- Edit が conflict した場合: 該当指摘は保留に降格し、PR本文に理由記載
- URL 検証失敗時: 技術指摘は保留に降格
- Zenn Front Matter 破損検知時: Edit を巻き戻して該当指摘は保留

## 成果物
- 1つのPR（`chore/apply-review-<slug>`）
- 記事本文の差分
- 採否一覧を含むPR本文

## 参考
- `.claude/agents/review-applier.md` (エージェント定義)
- `reviews/zenn/ai-driven-tdd-nextjs.md` (レビュー成果物フォーマット)
- Issue #11 (レビュー観点)
