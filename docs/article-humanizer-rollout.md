# Article Humanizer rollout

Issue #458 の導入方針と、Phase 1 の実装範囲を記録する。

## 目的

技術的な正確性、記事の主張、筆者固有のトーンを維持したまま、AI特有の定型表現・単調な文体・予定調和の構成を公開前に検出する。

この機能はAI生成判定器ではない。文章を口語化したり、人間らしさを演出するために誤字・感情・体験を追加したりしない。

## 調査結果

参考実装:

- `makotofalcon/humanizer-ja`
- 参照commit: `4cc01cdd5aff4102888e9396c3ba16da99828f78`
- version: `1.0.0`
- license: MIT

参考実装は、AI文章の違和感を次の3層で整理している。

1. 記号・書式
2. 語彙・文体
3. 思考構造

この分類は採用する。一方、以下は `my-blog` の技術記事運用に合わないため採用しない。

- 元記事にない「人間の温度」「雑味」「感情」を注入する
- 一人称や体験談を積極的に追加する
- 全文を自動的に書き換える
- 技術用語を一般語へ置き換える

ローカルSkillでは、保護領域とリスク分類を追加し、review-onlyへ変更した。

## Phase 1 のスコープ

### 実装する

- プロジェクトローカルSkill `article-humanizer-ja`
- 単独実行コマンド `/humanize-review <article-path>`
- 3層・20件以上の技術記事向けパターン
- 保護領域
- `low / medium / high` のリスク分類
- 構造化出力
- `article-review-improve-loop` の `Humanize` フェーズ
- Humanize後の最終Verify
- review成果物へのHumanize結果記録
- AIを使わない静的チェックとself-test

### 実装しない

- Humanize指摘の自動反映
- `low` 指摘の自動修正
- Humanize指摘による公開ブロック
- CI上でのLLM実行
- 筆者の経験・具体例の自動生成

## ワークフロー

```text
Extract
  ↓
LoopN-Review
  ↓
LoopN-Improve
  ↓
Humanize（review-only、1回）
  ↓
Verify（必須）
  ↓
Record
```

Humanizeは各改善ループ内では実行しない。事実・構造が固まった後に一度だけ評価し、最後に既存の3ペルソナレビューで現記事を確認する。

## 失敗時の扱い

- Humanize失敗: 記事は変更しない。`post-humanize-UNVERIFIED` として記録する
- Verify失敗: 公開可否を未検証として記録する
- Humanizeに`high`指摘: Phase 1では自動ブロックしない。著者入力が必要な課題として記録する
- Humanize成功かつVerify成功: `post-humanize-verified`

`publish-readiness` の `blocked` は既存どおり最終レビューの `must` で決める。Humanizeは評価期間中の補助ゲートであり、単独で公開を止めない。

## 保護領域

- Front Matter
- code block / inline code
- コマンド、ログ、エラー
- URL、リンク、画像
- 引用、出典、脚注
- 数値、日付、金額、割合、バージョン
- 製品名、API名、識別子、ファイル名
- 公式用語、タグライン、フェーズ名
- 主張、結論、強調点
- 筆者の実体験

## 検証コマンド

```bash
npm run check:article-humanizer
npm run test:article-humanizer
```

両方ともLLMやネットワークを使わない。

`check:article-humanizer` は次を確認する。

- Skillが`Edit` / `Write` / Bashを許可していない
- パターンIDが20件以上で重複していない
- 保護領域の必須項目が存在する
- upstream commitとMIT表記が固定されている
- 単独コマンドがローカルSkillを参照している
- WorkflowのHumanizeがVerifyより前にある
- Humanizeの構造化スキーマとreview-only制約が存在する

## 評価計画

自動修正へ進む前に、記事タイプが異なる未公開記事を最低3本評価する。

1. 技術解説
2. オピニオン
3. 体験・振り返り

評価結果はSkill内の評価フォーマットで記録する。

## 次フェーズへの条件

次を満たした場合だけ、別Issue / PRで `risk: low` の自動修正を検討する。

- 3記事で主張・事実・保護領域の破壊がない
- 読みやすさが悪化した記事がない
- 誤検知したパターンを調整済み
- 修正前後の差分を機械的に検証できる
- Humanize後のVerifyを維持できる
