---
seed_id: seed-20260923-publish-contract
title: "自動投稿より先に、公開前の契約とfail-closedを固定する"
date: 2026-09-23
status: seed
topics:
  - media-operating-system
  - publishing
  - validation
  - fail-closed
  - content-operations
source: external
source_url: https://note.com/like_tulip76/n/n4f2381b89827
source_ref:
evidence_status: verified
promoted_to:
article_type_candidates:
  - analysis
  - tutorial
  - insight
---

# 自動投稿より先に、公開前の契約とfail-closedを固定する

## 観測事実

2026-09-20 公開の note 記事では、自動投稿の最小構成として次が説明されている。

- Markdownを公開処理の1ソースとして扱う
- 公開前にタイトル重複、タグ数、本文量、カテゴリとトーンを確認する
- 廃止済みの枠を使わない
- 同じタイトル構造の連投は停止する
- 取得スクリプトが失敗した場合、数値を捏造せず失敗を明記する

記事は、自動投稿の再現性をツール選定ではなく「手順の具体度」の問題として整理している。

出典:
- https://note.com/like_tulip76/n/n4f2381b89827

`evidence_status: verified` は、上記の制約が元記事に記載されていることを確認した、という意味。記事内で述べられる効果を独立に測定した意味ではない。

## 自分の解釈

最も参考になるのはPlaywrightやlaunchdではなく、公開前に機械判定できる契約を置いている点。

特に、

> データ取得に失敗したら数値を作らない

というルールは、記事生成だけでなくAIエージェント全般に重要。

```text
Prepare
  ↓
Validate
  ↓
Publish
```

ではなく、

```text
Prepare
  ↓
Validate
  ├─ PASS → Publish Proposal
  └─ FAIL → Stop / UNVERIFIED
```

とする方が安全。

現在の基盤には `note-finalize`、publish readiness、Domain / Fact review が既にあるため、新しいGateを追加するのではなく、既存Gateの入力契約を明確にする方がよい。

## 違和感 / Reader Problem

自動投稿は「投稿ボタンを自動で押せるか」に注目されやすい。

しかし実運用で壊れやすいのは、その前段。

- 古いルールのまま生成する
- 同じテーマ・タイトルを繰り返す
- データ取得失敗を0や推定値で埋める
- SSoTと公開用コピーがずれる
- Validation failure後も公開へ進む

公開処理を自動化するほど、入力契約と停止条件が重要になる。

## 今の仮説

記事公開フローでは、Human Gateの前までを次のように構成する。

```text
Seed / Draft
  ↓
Deterministic checks
  ↓
Domain / Fact review
  ↓
Final Gate
  ├─ READY
  ├─ NEEDS_CHANGES
  └─ UNVERIFIED
        ↓
     Human Gate
```

特にデータ取得失敗は `UNVERIFIED` として保持し、推測値で穴埋めしない。

自動化の目的は「止まらないこと」ではなく、「誤った状態で先へ進まないこと」。

## 既存知識との接続

- Design by Contract
- Fail Closed
- Single Source of Truth
- Deterministic Validation
- Observability
- Error Budget / Guardrail

## 記事化の角度

- Analysis: 自動投稿の本体はブラウザ操作ではなく公開契約
- Tutorial: MarkdownからPublish Proposalまでのfail-closed pipeline
- Insight: AIエージェントは失敗時に賢く補完するより、正しく止まる方が重要
- Evidence: Validation failure率・Human correction率を計測できた後に定量化する

元記事固有の「タグ5個」「1500字前後」をそのまま自分たちの公開ルールには採用しない。媒体・記事タイプごとの既存契約を正とする。

## 次に試すこと

- [ ] 現在のpublish前 deterministic checkを一覧化する
- [ ] 取得失敗時に推測値へfallbackする経路がないか確認する
- [ ] `UNVERIFIED` がPublish Proposalを越えないことをテストする
- [ ] SSoTと派生ファイルのdrift checkを整理する

## 追記ログ

### 2026-09-23

- Article Lifecycle explicit provenanceのBatch 2として登録
- 元記事固有の文字数・タグ数ルールは採用せず、契約・停止条件の考え方だけを抽出
