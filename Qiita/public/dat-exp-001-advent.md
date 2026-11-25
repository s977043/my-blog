---
title: "マルチエージェントは本当に必要なのか？ 自作OSS「DAT」で18回比較実験して分かったこと"
tags:
  - AIエージェント
  - AI駆動開発
  - Codex
  - OSS
  - マルチエージェント
private: true
updated_at: null
id: null
organization_url_name: null
slide: false
ignorePublish: true
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

AI コーディングで、実装するエージェントとは別に検証するエージェントを用意すれば、品質は上がるのでしょうか。

私が開発している OSS [Dynamic Agent Topology（DAT）](https://github.com/s977043/dynamic-agent-topology) では、この問いを比較実験で扱っています。最初の実験で単独エージェントと独立 Verifier を加えた構成を比較し、18件の受理済み Run を記録しました。

結論から言うと、**今回の3種類のタスクでは、独立 Verifier を追加しても測定した品質指標に改善はなく、平均トークン使用量は約2.21倍になりました。** 事前に定めた条件に従って、単独構成を維持すると判断しました。

これはマルチエージェント一般の優劣を示すベンチマークではありません。なぜそう判断したのか、自分の開発環境で何を比較すればよいのかを紹介します。

## DAT は構成を比較するための仕様と実験基盤

DAT の原則は、タスクを確実に解ける最も単純な構成から始め、複雑化する理由を根拠で説明できるようにすることです。

今回の実験（EXP-001）では、次の2条件だけを扱います。

| 構成 | 役割 |
| --- | --- |
| T0 | Single Agent |
| T1 | Worker → Verifier |

T0 にもテストと受入条件の確認はあります。T1 の違いは、独立した検証役を追加することです。検証をなくす実験ではありません。

## 18件の比較実験

[実験仕様](https://github.com/s977043/dynamic-agent-topology/blob/616a56d/experiments/EXP-001-t0-vs-t1/README.md) に定めた条件で、3種類の小規模シナリオに対して2条件を各3回実行した記録が残っています。実験仕様の固定版には途中経過も残っているため、完了状態は同じコミットの最終判断記録を参照します。

- Runtime: Codex
- Model: GPT-6.1 Sol
- Effort: high
- シナリオ: 名前の正規化、境界値の clamp、安全な除算
- 同じシナリオ・反復を一組とする比較ブロック（9組）

実験プロトコルは Run ごとに新しいセッション・作業環境を用意し、条件の順序を入れ替えて比較する設計です。プロンプト、役割、シナリオ、評価の意味を途中結果に合わせて変えないよう凍結しました。ただし一部の実行環境と Verifier の初期文脈には差が残っています。

## 結果：成功率は同じ、トークン使用量は約2.21倍

[最終判断記録](https://github.com/s977043/dynamic-agent-topology/blob/616a56d/experiments/EXP-001-t0-vs-t1/DECISION.md) の数値を示します。

| 指標 | T0 | T1 |
| --- | ---: | ---: |
| 受理済み Run | 9 | 9 |
| タスク成功 | 9/9 | 9/9 |
| 回帰検出 | 0/9 | 0/9 |
| 人間の介入（平均回数） | 0 | 0 |
| 重大な境界違反 | 0 | 0 |
| 平均総トークン | 68,022 | 150,081 |
| 平均所要時間（概算秒） | 44.54 | 55.78 |

T1 の平均総トークンは T0 の約2.206倍です。総トークンは入力と出力の合計で、キャッシュ済み入力を含みます。T1 は Worker と Verifier の合計です。金額が2.21倍になったわけではありません。介入回数は、人の注意負荷や判断に費やした時間を表すものでもありません。

所要時間は測定区間や精度が揃っていない部分があるため、厳密な速度比較として扱いません。

## なぜ T0 を維持したのか

実験では結果を見る前に採用基準を決めました。

| T1 の採用基準 | 結果 |
| --- | --- |
| 成功率が T0 を下回らない | 通過 |
| 回帰または人間介入の少なくとも一方が改善 | 不通過 |
| トークン増加が50%以内、または品質改善で正当化できる | 不通過 |
| 重大な境界違反がない | 通過 |

環境の差がある1ブロック（2 Run）を除いた感度分析では、各8 Run がすべて成功し、回帰・人間介入はともにゼロでした。平均総トークンは T0 65,642.125、T1 145,717、比は2.220です。採用基準の判定は変わりません。

したがって、この条件では追加の協調コストを正当化できず、T0 を維持しました。

ただし、T0 がすべて成功し、回帰・介入もゼロであるため、今回のタスクでは品質改善を検出できる余地が小さくなっています。より難しいタスクで Verifier が価値を持つ可能性は未検証です。Verifier の fork 設定や初期文脈のばらつきもトークン数に影響し得るため、観測差のすべてを役割追加だけの因果効果とは扱いません。18件は受理済み Run の数であり、試行総数でも18種類の独立したタスクでもありません。

## 公開済みのデータを再集計する

実験結果は Run ごとの `evaluation.yaml` と判断記録に残しています。固定したコミットを取得し、公式の集計手順で数字を確認できます。

```bash
git clone https://github.com/s977043/dynamic-agent-topology.git
cd dynamic-agent-topology
git checkout 616a56d
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ci.txt

python -B scripts/validate_experiment_freeze.py
python -B scripts/validate_pilot.py \
  --pilot experiments/EXP-001-t0-vs-t1/pilot/pilot.yaml \
  --matrix experiments/EXP-001-t0-vs-t1/pilot/run-matrix.yaml \
  --require-complete

R=experiments/EXP-001-t0-vs-t1/runs/pilot-codex
python -B scripts/summarize_experiment.py "$R"/EXP-001-*/evaluation.yaml
```

上記は実験の再実行ではなく、凍結条件と記録の完全性の検査、および保存された評価記録の集計です。判断記録には公式スクリプトを実行した記録があります。今回の記事制作環境では公式スクリプトそのものは再実行していません。記事作成時にも18件の `evaluation.yaml` を取得して別途再集計し、掲載値との一致を確認しました。

## 自分の環境で比較を始めるには

いきなり3人、5人の構成を作らなくても、まずは直近の1種類のタスクを選べます。

1. T0 と、追加する役割を一つに絞った構成を決める。
2. 同じ入力・モデル・受入条件で複数回実行する。
3. 成功、回帰、介入回数、トークン、所要時間を記録する。
4. 追加コストを正当化する改善があったか判断する。

DAT の現行 Skill は `dat-select` で構成を提案し、`dat-observe` で実行の記録・集計を補助します。ランタイム設定を自動変更するものではありません。日常の観測記録だけから構成の優劣を判断せず、比較実験の記録と分けて扱います。

## まとめ

AI エージェントを増やすこと自体が成果なのではありません。タスクを解ける最も単純な構成を選び、増やすなら、その追加コストを正当化できる根拠を確かめることです。

今回の結果は限定的ですが、少なくともこの実験では「検証役がいるから、標準構成に採用する」とは判断しませんでした。

- [DAT の GitHub / Quick Start](https://github.com/s977043/dynamic-agent-topology)
- [EXP-001 の最終判断記録（固定コミット）](https://github.com/s977043/dynamic-agent-topology/blob/616a56d/experiments/EXP-001-t0-vs-t1/DECISION.md)

別の条件で比較した結果や、評価したいタスクの提案も歓迎します。
