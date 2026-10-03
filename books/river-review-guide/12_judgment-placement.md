# 判断を4つの層へ配置する

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

完全な証明ではないが、明示ルールで高精度に兆候を拾えるものです。

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
- このAPI変更が既存consumerへ与える意味的影響

単純なregexでは扱いづらい領域です。

## Human Judgment

責任・価値・不可逆性を伴う判断です。

例:

- security boundary
- personal data
- payment
- irreversible migration
- 事業上の受入判断

ここは「モデル精度が高いから」という理由で自動化しません。

## Promotion: 同じ判断をより再現可能な層へ移す

Judgment Placementは固定分類ではありません。

同じHuman / Agentic Judgmentが何度も発生し、条件を明文化できるようになったら、より再現可能な層へ移せます。

~~~text
Repeated judgment
  ↓
Can condition be explicit?
  ├─ no → keep semantic / human
  └─ yes
       ↓
Can it be deterministic?
  ├─ yes → test / schema / checker
  └─ no  → heuristic
~~~

この移動をRiver Reviewではpromotionとして扱います。

## 目的は「安くすること」ではない

Deterministicへ移す目的をコスト削減だけにすると危険です。

同等以上の安全性・説明可能性・保守性を保てる場合にだけ移します。

無理にrule化してfalse positiveを増やすなら、Agentic Reviewへ残した方が良い場合もあります。

## この章で持ち帰ること

「AIに任せる / 人が見る」の二択ではありません。

**判断の性質に応じて、最も再現可能で責任境界が明確な層へ置く**ことが重要です。

次章では、この4層の最後にあるHuman Judgmentをもう少し詳しく見ます。

### Sources

- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
- [Skill schema](https://github.com/s977043/river-review/blob/main/pages/reference/skill-schema.md)
