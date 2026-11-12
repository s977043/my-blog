---
seed_id: seed-20261106-dat-observation-gaps
title: "DATの運用記録を約2週間で109件貯めて分かった、記録の取り方の失敗"
date: 2026-11-06
status: seed
topics:
  - AIエージェント
  - 計測
  - DAT
source: mixed
source_url: https://github.com/s977043/dynamic-agent-topology/blob/main/docs/OBSERVATION_MEASUREMENT.md
source_ref: s977043/dynamic-agent-topology@bac834dcf590ba33f2bec5b758a064e1c848f15f
evidence_status: observed
promoted_to:
  - articles/dat-observation-gaps.md
article_type_candidates:
  - experience
  - analysis
---

# DATの運用記録を約2週間で109件貯めて分かった、記録の取り方の失敗

主題と中心の主張は著者の決定。効果の主張はしない。

## 集計の条件

- 実行日: 2026-11-06（JST）。対象は記録ファイル名の日付で2026-10-22〜2026-11-05（15日間）。3件はファイル名に日付がなく `endedAt` で補った。
- 計測の取り決めは期間を `endedAt` で判定するが、`endedAt` が `unknown` の記録が57件あるため、この集計はファイル名の日付で区切った。公開前に、この区切りを本文で明示する。
- 対象は個人所有の8リポジトリ（公開: river-review、plangate / private: 6）。全109件が導入済みDAT 0.3.0のvalidatorを通過した。
- 2026-10-23より前は5件、以後は104件。取り決めは「10-23をまたいで件数を合計・比較しない」と定めるので、109件は「貯まった記録の総数」とだけ読み、前後の比較には使わない。
- 集計スクリプトはリポジトリ外にあり、観測YAMLの本文は転記しない。

## 観測事実

### 値の取得状況（109件）

設計 §5.3 により、`unknown` は未取得、`[]` と `0` は明示値（レビューなし等）。任意項目は「未記録」と数える。

| 項目 | unknown | `[]` | 項目なし |
| --- | --- | --- | --- |
| `wallClockMs` | 84（77.1%） | - | - |
| `model` | 67（61.5%） | - | - |
| `endedAt` | 57（52.3%） | - | - |
| `startedAt` | 47（43.1%） | - | - |
| `agentInvocations` | 22（20.2%） | - | - |
| `rework.count` | 4 | - | - |
| `reviews` | 1 | 38 | - |
| `humanInterventions` | 1 | 18 | - |
| `artifacts` | - | 5 | - |
| `outcomeReason`（任意） | - | - | 35 |

### 時間

- `startedAt` と `endedAt` の両方が分かる記録は40件。`wallClockMs` が数値の記録は25件で、残る15件は差を計算すれば埋められた。
- `wallClockMs` の `unknown` はファイル名の日付で10-22が0/5、10-23〜10-27が29/39、10-28〜11-05が55/65。
- リポジトリ別の `wallClockMs` の `unknown` は river-review 15/25、plangate 11/14、privateの6リポジトリは3/8〜9/9。
- 手順の版の差: `endedAt` に記録時刻を入れる規則は、DATリポジトリのadapterと個人用 `/dat` Skillにあり、導入済み0.3.0のadapterにはない。後者の時刻取得は「未確認の機能」と書かれ、DATは自動取得を実装しない方針（設計 §9）。

### 判断の根拠

- `outcomeReason` なしは35件。ただし設計上は「中断・失敗の理由」の項目で、仕様上の不足と言えるのは `interrupted` の4/16件だけ。`completed` の31/93件は不足と扱わない。
- リポジトリ別の `outcomeReason` なしは river-review 0/25、plangate 6/14、privateの6リポジトリは0/8〜20/21。同じ仕様でも書き方が揃っていない。
- `interruptionKind`、`rework.triggers`、`taskDifficulty`、`usage` はいずれも0/109件。**これは書き漏れではない。** 4項目は2026-10-24のDAT #250でスキーマに入ったが、導入済み0.3.0のスキーマにはなく、`additionalProperties: false` のため書いても保存を拒否される。
- 手戻りのある59件の記録に、きっかけを残す場所はなかった（0.3.0の `rework` は `count` のみ）。
- `reviews[].decision` は同義の表記が3通り（`request-changes` 85、`changes-requested` 2、`request_changes` 2）。`request_changes` は現行の正規化表にない。

## 記録と実PRの抜き取り照合

公開2リポジトリから5件を選び、2026-11-06に `gh pr view -R` で確認した。

| PR | 実在 | 記録時点の状態と実際 | 時刻 | 記録と内容の一致 |
| --- | --- | --- | --- | --- |
| [river-review#2734](https://github.com/s977043/river-review/pull/2734) | あり | merged / 一致 | merge時刻は記録の開始より後。終了は `unknown` | 個別の内容は記録になく未確認 |
| [river-review#2790](https://github.com/s977043/river-review/pull/2790) | あり | merged / 一致 | 同上 | 個別の内容は記録になく未確認 |
| [river-review#2862](https://github.com/s977043/river-review/pull/2862) | あり | merged / 一致 | 記録の開始と終了の間 | 関連Issue番号が一致 |
| [plangate#1574](https://github.com/s977043/plangate/pull/1574) | あり | merged / 一致 | merge時刻は記録の開始より後。終了は `unknown` | 理由の記載がなく未確認 |
| [plangate#1621](https://github.com/s977043/plangate/pull/1621) | あり | 2件の記録で open→merged / 実際は merged | 両記録とも時刻 `unknown` で前後は未確認 | 個別の内容は記録になく未確認 |

実在と状態は5/5で矛盾なし。内容の一致まで確かめられたのは1/5で、残りは記録の粒度では確かめられない。

参考として、公開2リポジトリの番号付きrefは延べ83件で、現在の状態との一致は75件。差の8件はすべて記録が `open` で現在は `MERGED`。記録時点の状態なら矛盾しないが、記録時点の状態は全件を確かめていない。

private 6リポジトリのPRは照合に使わない（タイトルや番号を公開リポジトリに出さないため）。`pr-1` のような仮名refはadapterの規定どおりで、延べ319件中48件ある（番号10未満も含む機械的な判定。実PRとの対応は未確認）。

## Draft Article Plan: zenn/dat-observation-gaps

- channel: zenn
- slug: dat-observation-gaps
- article_type: experience
- reader_problem: AIエージェントの運用記録を残し始めた、または始めようとしている開発者が、後から集計できない記録を貯めてしまう失敗を、始める前に避けたい。
- central_claim: 記録は自動化せずに続けると、時間と判断の根拠が抜ける。
- claim_boundary: required
- out_of_scope: 下記「書かない範囲」のとおり

### Evidence Boundary

- Observed: 著者の個人8リポジトリの記録109件を、執筆エージェントが読んだ件数（上記）。記録者は作業者自身である可能性が高いが、記録からは特定できない。
- Verified: [スキーマ](https://github.com/s977043/dynamic-agent-topology/blob/main/schemas/run-observation.schema.json)、[設計](https://github.com/s977043/dynamic-agent-topology/blob/main/docs/RUN_OBSERVATION_DESIGN.md)、[計測の取り決め](https://github.com/s977043/dynamic-agent-topology/blob/main/docs/OBSERVATION_MEASUREMENT.md)、[#250の変更](https://github.com/s977043/dynamic-agent-topology/commit/0dc907df)、導入済み0.3.0のスキーマとの差、PR抜き取り照合5件。
- Hypothesis: 欠損の原因が手作業であること。自動化した場合との比較はなく、因果は未検証。「時間」は手順と件数から説明しやすいが、「判断の根拠」は、抜けの一部が書き漏れではなく導入版に項目がなかったことによる。本文では両者を分けて書く。

### 書かない範囲

守る線:

- 品質・速度・コストの改善
- 単純な構成で足りた割合
- T0〜T3の優劣
- 成功率
- 構成変更の頻度
- 人の介入の経時変化
- 件数を作業量と言い切ること
- 個人の記録以外への一般化（同じ失敗が他の環境でも起きるとは言わない）
- `taskDifficulty` などの0/109件を書き漏れとして書くこと
- 観測YAMLの本文、private リポジトリの名前とPR、会社リポジトリの観測、my-blogの運用

文章上よければ触れてよい:

- DATの概要（構成の名前の紹介まで）
- 記録項目の後からの追加と、導入版の更新漏れ
- 自動取得の案（未実施の案として）
- 値の表記の揺れ
- 公開リポジトリのPRへのリンク（読者が得をするときだけ）

### 解釈の注意点

- 2026-10-23前後で記録単位が違う（ウェーブ単位と区切り単位）。
- 区切り記録で件数が増える。件数は作業量ではない。
- `interrupted` は失敗ではない（Human判断待ちの区切りを含む）。
- `[]` は欠損ではない。ただし `humanInterventions: []` が本当に介入なしだったかは確かめていない。
- 作業者自身が記録している可能性が高く、値は自己申告として読む。

### Outline

1. 109件を集計して値が取れなかった項目
2. 時間が抜ける: 77%の `unknown` と、計算すれば埋まった15件
3. 判断の根拠が抜ける: 書いていないものと、書く場所がなかったもの
4. 記録を始める前に決めること（未検証の案として）

## 次に試すこと

- [ ] 著者確認: 「判断の根拠」の主張を、導入版に項目がなかった事実を踏まえてこのまま置くか。
- [ ] 著者確認: 記録の取り方で困った体験は記録にないので、本文に書く前に確かめる。
- [ ] 公開前に記録を再集計し、対象期間と実行日を更新する。あわせて、`wallClockMs` が数値の25件が両時刻の分かる40件の内数か、仮名refの分母319件の範囲、取り決め §4 の除外の有無を確かめる。

Lifecycle: DRAFTED。初稿は `articles/dat-observation-gaps.md`（`published: false`）。
