---
title: "付録C River Reviewの現在地とロードマップ"
---

River Reviewは継続的に変化しています。本書では状態を混同しないよう、次の区分で扱います。

| 区分 | 意味 | 例 |
| --- | --- | --- |
| Implemented | current mainでruntime実装を確認できる | Riverbed Memory v1、Artifact contract、Review Team |
| Experimental | 実装・schema・surfaceはあるがStable Contractではない / observe-only等 | Review Coverage、Riverbedの一部外部schema |
| Planned | 設計・roadmap上の予定 | Riverbed external datastore v2、Progressive Disclosureの未実装slice |
| Direction | 長期の概念的方向 | Engineering Judgment Infrastructure |

## 本稿のverification snapshot

2026年10月4日に次を再照合しました。

- River Review main: `60f55e75d6eaead1956c6945afc53f57acd64dd9`
- Latest Release: `v1.124.5`（2026年9月25日）
- Review Coverage: Experimental
- Riverbed Memory v1: runtime実装済み
- Riverbed external datastore v2: Planned
- Progressive Disclosure: Stage 1 protoあり、metadata専用loader / Stage 2・3完全分離は未完了
- verify gate: Planned / 未実装
- 自動承認・自動merge: Non-goal

## ImplementedとStableを分ける

このBookでは「コードが存在すること」と「外部利用者向けに安定した契約であること」を別に扱います。

たとえばRiverbed Memory v1は実装済みですが、関連schemaの一部はStable Interfaces上でExperimentalです。

またReview Coverageはruntimeから出力される経路がありますが、contract自体はExperimentalで、Gate integrationもopt-inです。

## 改訂時に見る場所

River Reviewのmainは動きます。

本書を改訂するときは最低限、次を再確認します。

1. README
2. `pages/reference/stable-interfaces.md`
3. 各chapterが参照するpublic docs
4. schema / runtime implementation
5. Latest Releaseとrelease notes
6. 本稿snapshot以降の関連Issue / PR

この付録にversion依存の詳細を寄せることで、本編は責務境界と設計原則を中心に保ちます。
