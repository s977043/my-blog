---
title: "AIレビューにVerifierを増やす価値はあるか？さくらのAI Engineで比較する"
emoji: "🔬"
type: "tech"
topics: ["ai", "agent", "llm", "sakura", "benchmark"]
published: false
---

:::message
**記事準備中（2026-11-02）**。本稿は実験プロトコルと既存Pilotの根拠を整理した下書きです。**さくらのAI EngineでのAPI実行・品質計測は未実施**です。実測結果と再現用成果物を追加するまで公開・コンテスト応募はしません。
:::

AIコードレビューで見落としが怖いとき、レビューAgentをもう1人増やせば安心できるでしょうか。

Agentを増やせば確認する目は増えます。しかし、同じ見落としを繰り返すかもしれないし、確認のためのトークンと待ち時間だけが増えるかもしれません。知りたいのは「分業できるか」ではなく、**Verifierを1つ増やしたことで、品質がどれほど改善し、その改善に見合う負担なのか**です。

この記事では、さくらのAI EngineのOpenAI互換APIと無料枠を使い、同一モデル・同一課題で**単独レビュー（T0）と、Reviewer→Verifier（T1）**を比較する計画と実装方法を整理します。想定読者は、LLMによるコードレビューをCIや開発フローに組み込みたいエンジニアです。

## 先に分かっていること／まだ分からないこと

個人OSS [Dynamic Agent Topology（DAT）](https://github.com/s977043/dynamic-agent-topology)では、これまでにCodex上で単一Agent（T0）とWorker＋Verifier（T1）を比較しました。

[EXP-001の公開判断記録](https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/DECISION.md)によると、3シナリオ×2条件×3反復、18 RunのPilotで次の値を観測しています。

| 指標 | T0 | T1 |
| --- | ---: | ---: |
| タスク成功率 | 100% | 100% |
| 平均総トークン数 | 68,022 | 150,081 |
| 平均経過時間 | 約44.5秒 | 約55.8秒 |
| Human intervention（平均回数） | 0 | 0 |

この限定条件ではT1のトークン数が約2.21倍で、成功率の改善は観測できませんでした。採用判断は **Keep T0** です。

ただし、これはCodex / GPT-6.1 Sol / high effortによる**実装タスクの小規模Pilot**です。一般的なAgent構成の優劣も、さくらのAI Engineの性能も示していません。今回の実験は**別のレビュー課題・別のモデル・別の実行方式**として新しく評価します。既存の数値と直接比較しません。

## なぜ、さくらのAI Engineで試すのか

さくらのAI EngineはOpenAI互換のChat Completions APIを提供しており、通常モデルの例として `gpt-oss-120b` が利用できます。基盤モデル無償プランのChat Completionsには月3,000リクエストの無料枠があります。無償プランが自動的に従量課金プランに切り替わることはありません。

この条件は、比較実験で大切な「**同じモデル・同じAPI・同じ評価セット**」を揃えやすい点で魅力です。3,000リクエストを使い切ることより、再現可能な判定を残すことを優先します。

公式資料：

- [さくらのAI Engine 利用手順](https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html)
- [提供モデルと料金](https://ai.sakura.ad.jp/sakura-ai/ai-engine/)
- [Zennfes Autumn 2026 の募集内容](https://www.sakura.ad.jp/corporate/information/announcements/2026/11/02/1968226190/)

## 比較する構成

### T0：単独レビュー

```text
コード差分＋レビュー指示
  └─ Reviewer（LLM 1回）
       └─ 指摘事項をJSON化
```

### T1：Reviewer → Verifier

```text
コード差分＋レビュー指示
  ├─ Reviewer（LLM 1回）
  │    └─ 一次指摘
  └─ Verifier（LLM 1回）
       ├─ 元の差分
       ├─ 一次指摘
       └─ 追加・修正・却下した指摘
```

T1は同じモデルで2回APIを呼びます。**Verifierには正解ラベルを渡さず、元の差分を見直せるようにします**。T0とT1で指示の表現、入力の可視範囲、出力形式を可能な限り揃え、モデルの違いを混ぜません。

比較対象は「2回呼べば必ずよくなる」という主張ではありません。単独で2回呼ぶ案や異なるプロンプトの比較は、結果次第で別実験に分けます。

## API接続の最小例

公式マニュアルのエンドポイントと認証形式を使います。以下は**公式仕様に基づく接続例であり、筆者による実行確認は未完了**です。

まず、さくらのAI Engineで基盤モデル無償プランを選択し、アカウントトークンを発行します。本人確認やクレジットカード登録が必要です。

```bash
# ご自身のシェルで設定。トークンを記事・GitHub・ログに貼り付けない。
read -rs SAKURA_AI_TOKEN
export SAKURA_AI_TOKEN
printf '\n'

curl --fail-with-body --silent --show-error \
  'https://api.ai.sakura.ad.jp/v1/chat/completions' \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer ${SAKURA_AI_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-oss-120b",
    "messages": [
      {"role": "system", "content": "コードレビューの指示に簡潔に回答してください。"},
      {"role": "user", "content": "1 + 1 はいくつですか？"}
    ],
    "temperature": 0,
    "max_tokens": 256,
    "stream": false
  }'
```

`temperature: 0`にしても完全な決定性は保証されません。実測では同一ケースの反復を行い、出力JSONの破損、タイムアウト、レート制限も失敗として記録します。

## テストケースとGround Truth

恣意的に「良いレビュー」を選ばないため、正解を事前固定した合成コード差分を用います。例えば境界値の欠陥、例外処理での情報漏洩、回帰を含む変更、欠陥のない変更を混ぜます。

- ケースは少なくとも12件。欠陥ありと欠陥なしの両方を含める
- 各ケース×各条件を3回ずつ実行し、提示順序を入れ替える
- 正解ラベルはモデル入力へ渡さない
- テスト・静的解析で確認可能な事実と、独立した人間の判断を区別する
- 実験開始前にケース、Prompt、判定手順を固定する

12ケース×3反復の場合、T0は36リクエスト、T1は72リクエスト、合計**108リクエスト**です。リトライや疎通確認は別に計上します。1回の実験で3,000回を消費する必要はありません。

## 何をもってVerifierの価値とするか

**品質**は欠陥検出の再現率（Recall）、適合率（Precision）、誤検出件数で見ます。既知の欠陥だけでなく、欠陥のないコードを誤って指摘しないことも重視します。正解がないケースの扱いや、Precisionが定義できない条件は集計時に明示します。

**コスト**はAPIリクエスト数だけでなく、応答時間、入力・出力トークン、JSONパース失敗・再試行数を記録します。モデル実行時間と検証担当者の確認時間は混同しません。

判断は次の順です。

1. T1で重要な見落としが減るか。
2. 増えた誤検出や人間の確認負荷で効果が相殺されないか。
3. 改善をトークン数と待ち時間の増加が正当化できるか。

単純にT1の指摘数が多いことは成功としません。

## 実験結果

**未実施。** 公開前に次の実測を追記します。

| 項目 | T0 | T1 |
| --- | --- | --- |
| モデル、実行日時、ケース数 | 未計測 | 未計測 |
| Recall / Precision | 未計測 | 未計測 |
| 誤検出 / 見落とし | 未計測 | 未計測 |
| 平均・p95応答時間 | 未計測 | 未計測 |
| 入出力トークン / リクエスト数 | 未計測 | 未計測 |
| 失敗、リトライ、手動確認 | 未計測 | 未計測 |

この表は結果を作るためのものではなく、**実行前の報告契約**です。得られなかった指標は0とせず「欠測」と書きます。実行結果が既存DAT Pilotと反対でも、そのまま報告します。

## おわりに

Verifierを増やすかどうかは、Agent設計の好みではなく、**どの欠陥をどれだけ減らし、そのために何を増やすのか**という判断です。

同じタスク、同じモデル、同じ正解で比較して初めて、分業の価値を説明できます。今回の実測で品質改善がなければ、それも実用上重要な結果です。品質改善があれば、どの条件で追加コストが正当化されたかを限定して述べます。

## 参考資料

- [Dynamic Agent Topology](https://github.com/s977043/dynamic-agent-topology)
- [DAT EXP-001 判断記録](https://github.com/s977043/dynamic-agent-topology/blob/main/experiments/EXP-001-t0-vs-t1/DECISION.md)
- [さくらのAI Engine 利用手順](https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html)
