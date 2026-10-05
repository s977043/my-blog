---
title: "判断を4つの層へ配置する"
---

River Reviewはレビューを「AIに見てもらう工程」として一括りにしません。

判断の性質に応じて、4つの層へ配置します。

~~~text
Can it be proven?
  ↓ yes
Deterministic

Can explicit rules detect it?
  ↓ yes
Heuristic

Does it need semantic context?
  ↓ yes
Agentic Review

Does it require responsibility?
  ↓ yes
Human Judgment
~~~

この考え方を **Judgment Placement** と呼びます。

## Deterministic

機械的に証明・検査できるものです。

例:

- type check
- test result
- schema validation
- dependency boundary test

locale追加でschema compatibility testを書けるなら、まずここへ置けます。

## Heuristic

完全な証明ではないものの、明示ルールで高精度に兆候を拾えるものです。

例:

- temporary code
- suspicious pattern
- known smell

「TODOに撤去条件が無い」のようなパターンが該当します。

## Agentic Review

意味や複数Artifactの文脈が必要な判断です。

例:

- PlanとDiffの意図が一致しているか
- locale追加が既存設計の責務と合うか
- API変更が既存consumerへ与える意味的影響

単純なregexでは扱いづらい領域です。

## Human Judgment

責任・価値・不可逆性を伴う判断です。

例:

- security boundary
- personal data
- payment
- irreversible migration
- 事業上の受入判断

ここは「モデル精度が高いから」という理由だけで自動化しません。

## Placementは固定ではない

同じ判断を運用しているうちに、条件が明確になり、より再現可能な層へ移せることがあります。

ただし、この章では「どこへ置くか」の原則までに留めます。

実際にfalse positive / missed issue / repeated human judgmentから判断を別の層へ移す **Judgment Promotion** は、第27章の改善ループで扱います。

## 目的はコスト削減だけではない

Deterministicへ移せば安くなることはあります。

しかし、配置の第一目的は**安全性・再現性・説明可能性・責任境界を明確にすること**です。

無理にrule化して誤判定を増やすなら、Agentic ReviewやHuman Judgmentへ残した方がよい場合もあります。

## この章で持ち帰ること

「AIに任せる / 人が見る」の二択ではありません。

**判断の性質に応じて、最も再現可能で責任境界が明確な層へ置く**ことが重要です。

次章では4層の最後にあるHuman Judgmentの設計原則を見ます。

### Sources

- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
- [Skill schema](https://github.com/s977043/river-review/blob/main/pages/reference/skill-schema.md)
