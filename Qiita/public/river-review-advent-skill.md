---
title: "AIのコードレビューを信用するのではなく、検証する ― 自作OSS River Reviewでレビュー基準をテストする"
tags:
  - AI駆動開発
  - コードレビュー
  - ClaudeCode
  - OSS
  - テスト
private: true
updated_at: null
id: null
organization_url_name: null
slide: false
ignorePublish: true
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

AI にコードレビューを頼んだ結果、指摘がゼロだったとします。必要な観点を確認して問題がなかったのか、それとも、そもそもその観点を確認しなかったのか。この違いをどう判断していますか。

私が開発している OSS [River Review](https://github.com/s977043/river-review) では、レビュー基準をリポジトリに残す設計を採っています。レビューの指摘だけでなく、**どの基準で何を確認するのか、その基準はどのケースで機能すべきなのか**を扱います。

今回は例外処理のレビュー観点を一つだけ取り上げます。River Review v1.139.5 の公開 Skill と fixture を参照し、レビュー基準を検証する考え方を紹介します。

## レビュー基準を資産にする

River Review の中心は Review Judgment as Code です。チームの判断基準をバージョン管理できる Skill にして、レビュー対象や実行する観点と結びつけます。

たとえば「例外を握りつぶしていないか」を確認する場合、単に「例外処理をレビューして」と依頼するだけではなく、次を決めます。

| 項目 | 確認する内容 |
| --- | --- |
| 適用範囲 | アプリケーションコードの関連差分 |
| 検出対象 | 障害原因の追跡や適切な処理を失う例外処理 |
| 非検出対象 | 適切に処理・伝播される例外 |
| 対象外 | 可観測性に関係しない変更 |
| 根拠 | 指摘箇所と理由、修正案 |

レビューに関係しない差分で毎回同じ観点を実行する必要はありません。何を指摘しないかも、レビュー基準の一部です。

## 例外の握りつぶしを確認する Skill

公開リポジトリに `logging-observability` という Skill があります。ログやエラーハンドリングなどを対象にするレビュー観点です。

検出対象とする入力のイメージを示します（以下の2例は説明用に短くしたコードであり、実際の Skill fixture 全文ではありません）。

```typescript
try {
  await save();
} catch (error) {
  // ignore
}
```

例外が発生したとき、呼び出し側へ伝わらず、原因を調べる手掛かりも残りません。これは指摘する候補です。

一方、既存のログ方針に従い、必要な情報を安全に記録して上位へ例外を伝えるコードは対照ケースにできます。

```typescript
try {
  await save();
} catch (error) {
  logger.error("Save failed");
  throw error;
}
```

実際には例外の型、ログに含める情報、上位レイヤーの責務も確認します。ログ出力や再送出を追加することが、すべての例外に対する正解ではありません。

River Review の公開 Skill では、テストで意図的に無視する場合や文脈を伴って再送出する場合などを誤検知しないための条件を定義しています。

## 検出するケースと検出しないケースを固定する

v1.139.5 の Skill ディレクトリには、次の入力と期待出力が存在します。

| 入力（fixture） | 期待出力（golden） |
| --- | --- |
| `01-silent-catch.diff` | 例外の握りつぶしを指摘（検出ケース） |
| `02-proper-error-handling.diff` | `NO_ISSUES`（誤検知を防ぐ対照ケース） |

この表は公開されている期待出力であり、今回あらためて LLM を実行した結果ではありません。Skill の指示には、関連する差分や入力がなければ `NO_REVIEW` とする条件もあります。`NO_ISSUES`（対象を確認して指摘なしという期待）とは区別します。

[Skill と fixture / golden の実体](https://github.com/s977043/river-review/tree/v1.139.5/skills/midstream/logging-observability) を読めば、どの入力に対してどの判断を期待しているか確認できます。

- fixture はレビュー対象となる入力です。
- golden は期待する判断を記録した例です。
- 実際の出力が期待と合うかは、対象の実行経路で確認します。

## 機械的な検査の評価は別のケースで行う

次に、決定論的な検査の回帰を確認する入口があります。リポジトリには `npm run eval:fixtures` という評価コマンドがあり、標準ケース定義には、ログなしの `return` / `return null` を含む例外処理と、ログを出す非検出ケースが収録されています。

```bash
git clone --branch v1.139.5 --depth 1 https://github.com/s977043/river-review.git
cd river-review
npm ci
npm run eval:fixtures
```

Node.js 22 系が前提です。これは固定版の package.json と lockfile、評価スクリプトで確認した手順で、ここでの実行結果は未取得です。評価スクリプトは各ケースの `planSkills` を指定し、`dryRun: true`、`includeFallback: false` でレビューを呼び、指摘数や必須の出力要素などを照合します。CLI の `--phase` はケースを絞り込むフィルタではなく評価に渡すフェーズの上書きなので、この例では指定しません。

このコマンドが先ほどの Skill 配下の golden をそのまま一括採点するわけではありません。固定版の [ケース定義](https://github.com/s977043/river-review/blob/v1.139.5/tests/fixtures/review-eval/cases.json) には次の観測点があります。

| 標準評価の例 | 期待する結果 |
| --- | --- |
| `catch` 内でログなしの `return;` | 指摘あり、根拠・重大度などの必須要素を確認 |
| `catch` 内でログなしの `return null;` | 指摘あり |
| ログのある `catch`（対照ケース） | 指摘0件 |

例示したコメントだけの `catch` とは別の入力です。コメントだけのケースまで機械的に検出できるとは、この情報からは言えません。評価結果が期待と異なった場合は、指摘の内容だけでなくケースの入力と選択された観点を確認します。

## まず既存のレビューを試す

Claude Code では公開 README に従って、検証用プロジェクトで次を試せます。

```text
/plugin marketplace add s977043/river-review
/plugin install river-review@river-review-marketplace
/reload-plugins
/river-review:review-local
```

Marketplace から取得される版は実行時の配布状態によります。ここで参照した fixture の固定版とは別に、導入版を確認してください。この経路では Claude Code 自身のモデルを利用するため、River Review 専用の LLM API キーは不要です（Claude Code 自体の利用条件は別です）。GitHub Actions などでヘッドレス LLM を利用する経路とは前提が異なります。

最初から独自 Skill を作る必要はありません。既存のレビュー観点で不足する判断が繰り返し出たときに、まずプロジェクトのルールとして残し、入力・期待出力・誤検知条件を評価したくなったものを Skill に昇格させます。

## 指摘ゼロは完了の証拠ではない

River Review の Review Coverage は、レビューの実行状況を `complete`、`partial`、`not_executed` に区別する実験的な契約です。v1.139.5 の説明では観測用であり、既定のゲート判定を自動的に変更するものではありません。

- 指摘がなかったこと。
- 必要なレビューが実行されたこと。
- 人や呼び出し側が変更を承認したこと。

この3つは別です。期待出力に合った一つのケースがあっても、製品全体の見落としや誤検知がゼロになったとは言えません。逆に、対照ケースで指摘がなかったからといって、そのレビューが未実行だったかどうかは指摘数だけでは判定できません。

## まとめ

次のレビューで、繰り返し確認している観点を一つ選んでください。そして「指摘してほしい例」と「指摘してほしくない例」を残してみてください。

レビューの判断基準を後から確かめ、改善できる形にすることが、River Review で実現したいことです。

- [River Review の GitHub](https://github.com/s977043/river-review)
- [Starter Cookbook](https://river-review.the3396.com/guides/starter-cookbook/)
- [代表スキルのショーケース](https://github.com/s977043/river-review/blob/v1.139.5/pages/guides/representative-skills.md)

試して不足した観点があれば、改善提案を歓迎します。
