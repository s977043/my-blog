# 推測でPlanを埋めず、Evidenceを取りに行く

> Draft. 「よく考える」より、安く確認できる事実は確認するという実行原則を扱う。

## きれいなPlanと正しいPlanは違う

## Cheapest Useful Verification

次の意思決定に必要な証拠を、十分な範囲で最小コストで取りに行く。

## 件数は数える

## コードは読む

## テスト・ログ・APIで確認する

## Evidenceにもコストがある

何でも最大限に調査するのではなく、次の判断を変えうるUnknownへ絞る。

## 前提が崩れたらPlanへ戻る

## Primary Evidence

- PlanGate #351: 見積もり採用前に実数を取る必要性
- 「全部 / 全件 / 残りN件」のような主張は、grep / wc / カウントスクリプトなどで実測する
- 前提が崩れたら、推論で埋めずPlanとModeを見直す

Evidence type: **Observed + Verified**

Source: https://github.com/s977043/PlanGate/issues/351
