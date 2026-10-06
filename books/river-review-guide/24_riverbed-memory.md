---
title: "会話ではなく、判断を記憶する"
---

レビューを繰り返すと、同じ議論が何度も発生します。

「このsilent catchは意図的です」
「この依存は今回は受け入れています」
「このpatternはADRで決めています」

毎回会話履歴を全部読み直すのではなく、次の判断に必要な情報だけ残したい。

Riverbed Memoryは、そのための層です。

## Transcript MemoryではなくJudgment Memory

本書ではRiverbedを **Judgment Memory** として捉えます。

保存したいのは、過去の会話全文ではありません。

たとえば、

- ADR
- 過去レビュー
- WontFix
- Pattern
- Decision
- Eval Result
- Suppression
- Resurface

といった、次のレビュー判断を変える情報です。

~~~text
Conversation history
  = what was said

Judgment Memory
  = what should change future judgment
~~~

## Riverbed Memory v1は実装済み

2026年10月6日に再確認したverification snapshotでは、Riverbed Memory v1の実装を確認できます。

リポジトリ内では、概念的に次の形で保存されます。

~~~text
.river/
  memory/
    index.json
~~~

各entryはschemaに従い、id / type / content / metadata / statusなどを持ちます。

レビュー時にはphaseや関連fileで絞り込み、必要なMemoryだけをContextへ入れます。

### 実装済みとStableは別

ここは状態表記で注意が必要です。

Riverbed Memory v1のruntime実装は存在しますが、Stable InterfacesではRiverbed Memory全体と、Entry / Indexなど関連するschemaが **Experimental** と分類されています。予告なく変更・削除される可能性があります。

したがって、

~~~text
Implemented
  ≠
Stable public contract
~~~

です。

利用時には、version更新でschemaやsurfaceが変わり得る前提を持ちます。

## MemoryにもLifecycleがある

過去判断は永久に正しいとは限りません。

現行実装ではentry statusとして、

- active
- superseded
- archived

を扱えます。

たとえば、

~~~text
decision-v1
  ↓ superseded by
decision-v2
~~~

のように、新しい判断で古い判断を置き換えられます。

`expiresAt` を持つentryなら、期限を過ぎたものをarchiveする経路もあります。

Memoryを増やすだけでは、古い判断がContextを汚染します。

**保存と同じくらい、置換・失効が必要**です。

## stateless fallback

Memory fileが無い場合、River Reviewは空のMemoryとして扱えます。

つまりRiverbedを導入しないとレビュー自体が動かない設計ではありません。

~~~text
Memory available
  → use relevant judgment

Memory unavailable
  → stateless review
~~~

## 外部DBはまだv2

Postgres / Redis / vector storeのような外部Memory backendは、現行docsではv2の将来計画です。

current v1と混同してはいけません。

## この章で持ち帰ること

長期運用で残したいのは会話の全文ではなく、**次の判断を変える状態**です。

そしてMemoryは追加するだけでなく、supersede / expireできる必要があります。

次章では、特にレビューのノイズを減らすSuppressionとResurfaceを扱います。

### Sources

- [Riverbed Memory](https://github.com/s977043/river-review/blob/main/pages/explanation/riverbed-memory.md)
- [Riverbed Storage](https://github.com/s977043/river-review/blob/main/pages/reference/riverbed-storage.md)
- [Stable Interfaces](https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md)
- [PR #474](https://github.com/s977043/river-review/pull/474)
