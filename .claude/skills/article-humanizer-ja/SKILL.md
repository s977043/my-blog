---
name: article-humanizer-ja
description: 日本語の技術記事を対象に、AI特有の定型表現・単調な文体・予定調和の構成を検出するreview-onlyスキル。主張・事実・筆者の経験・コード・URLなどを保護し、修正案をlow/medium/highで返す。
allowed-tools:
  - Read
  - Grep
  - Glob
---

# article-humanizer-ja

日本語の技術記事を公開する前に、AI生成文で目立ちやすい表現パターンを検出する。
このスキルは **review-only** であり、記事本文を編集しない。

## 目的

- 技術的な正確性と筆者の主張を維持する
- 読み返したときの単調さ、定型感、文章疲労を具体的に指摘する
- 「AIっぽい」という印象論ではなく、場所・理由・最小修正案を示す
- 存在しない経験や具体例を生成せず、著者入力が必要な箇所を分離する

## 対象

- Zenn: `articles/*.md`
- note: `articles_note/new/*.md`、`articles_note/published/*.md`
- Qiita: `Qiita/public/*.md`

`articles_note/drafts/` はミラーなので編集対象にしない。レビューのみ行う場合も、正本との関係を明記する。

## 必ず読む資料

1. リポジトリ直下の `AGENTS.md`
2. 必要に応じて媒体固有のスタイルシート・チェックリスト

## 実行手順

1. 対象記事を読み、主張・強調点・文体・章構造を要約する
2. 保護領域を特定し、指摘対象から除外する
3. 下記のパターンを走査する
4. 問題箇所ごとに、場所・短い抜粋・理由・最小修正案を記録する
5. 修正リスクを `low` / `medium` / `high` に分類する
6. 記事本文を変更せず、構造化された結果のみ返す
7. 最後に、指摘が主張・事実・経験を変えないことを自己検証する

## リスク分類

| risk | 対象 | 扱い |
|---|---|---|
| `low` | 接続詞の削除、重複表現の圧縮、長文の分割など | 将来の自動修正候補 |
| `medium` | 文順、見出し、段落構成、結論の再配置など | 提案のみ。著者確認が必要 |
| `high` | 主張、事実、数値、経験、技術仕様、出典に触れる変更 | 自動修正禁止 |

保護領域に触れる可能性がある指摘は、内容にかかわらず `high` にする。

## 出力スキーマ

```json
{
  "findings": [
    {
      "id": "H-001",
      "pattern": "S01-repeated-connectors",
      "layer": "style",
      "location": "## 導入方法 の第2〜4段落",
      "excerpt": "さらに、... また、... 加えて、...",
      "reason": "3段落連続で接続詞から始まり、文章のリズムが均一になっている",
      "suggestion": "2段落目以降の接続詞を削除し、因果関係が必要な箇所だけ明示する",
      "risk": "low",
      "touchesProtectedContent": false,
      "requiresAuthorInput": false
    }
  ],
  "passed": true,
  "summary": "highリスクの指摘はなく、低リスクの文体改善候補が2件ある"
}
```

## 判定ルール

- `passed: true`: `high` の指摘がなく、保護領域を変更する提案もない
- `passed: false`: `high` の指摘、出典不足、経験・具体例の追加が必要な箇所がある
- 指摘ゼロの場合も `findings: []` を返し、無理に問題を作らない

## 禁止事項

- `Edit` / `Write` / Bash / git 操作を行わない
- 記事を「人間らしくする」ために誤字、曖昧さ、感情、余談を追加しない
- 筆者が書いていない経験・失敗談・会話・数値・固有名詞を生成しない
- 技術用語を無理に一般語へ置き換えない
- 敬体・常体、一人称、媒体固有の表記を勝手に変えない
- コード、URL、引用、Front Matter、出典を修正案の対象にしない
- 「AIっぽい」「機械的」という理由だけで指摘しない
- 全文の書き換えを提案しない。最小差分を優先する

## 具体性が不足している場合

存在しない具体例を補完しない。次のように、著者入力が必要な指摘として返す。

```json
{
  "pattern": "T04-missing-concrete-evidence",
  "risk": "high",
  "requiresAuthorInput": true,
  "suggestion": "実測値、失敗例、PR、ログ、判断理由のうち、実在するものを追加できるか著者が確認する"
}
```

## 完了条件

- 記事本文に差分がない
- 全指摘に具体的な場所と理由がある
- 主張・事実・経験の変更を提案していない
- 保護領域への指摘は `high` として分離されている
- 指摘がない場合は、そのまま合格として終了している

---

## 詳細ルールの読み分け

このSkillは入口と不変条件だけを保持し、詳細ルールは必要なときだけ読む。

- Humanizeレビューを実行するとき:
  1. `references/protected-content.md`
  2. `references/style-patterns.md`
- Skill自体を評価・変更するとき:
  - `references/evaluation-guide.md`
- upstream由来・ライセンスを確認するとき:
  - `references/upstream-license.md`

レビュー実行時は protected content と style patterns を必ず読む。評価ガイドとライセンス情報は通常レビューのコンテキストへ常時載せない。

## Progressive Disclosure の境界

- `SKILL.md`: What / When / workflow / risk / output contract / stop conditions
- `references/protected-content.md`: 変更してはいけない意味・事実・形式
- `references/style-patterns.md`: F / S / T パターンと Terminology Contract
- `references/evaluation-guide.md`: A/B評価・導入判定
- `references/upstream-license.md`: upstream provenance とライセンス

詳細ルールを別ファイルへ移しても、review-only・保護領域・最小差分・著者未提示の事実を生成しない、という契約は変えない。
