---
title: "同じ指摘を何度もしない"
---

AIレビューを継続運用すると、品質を落とす大きな要因の1つが**同じ指摘の繰り返し**です。

たとえばチームが、

> このコードは例外だが、理由があり今回は対応しない

と判断したのに、次のPRでまた同じFindingが出るとします。

これが続くと、レビュアーはAIレビューを読まなくなります。

## Suppressionは「無視リスト」ではない

単純なignore listなら、Finding fingerprintを永久に消せば終わります。

しかし、それでは危険です。

状況が変わっても指摘されなくなるからです。

良いSuppressionには少なくとも次が必要です。

- **Reason** — なぜ今回は抑制するのか
- **Scope** — どのfile / pattern / phaseに適用するか
- **Source** — どの判断から生まれたか
- **Expiry / Resurface condition** — 何が変われば再確認するか

## 例: locale fallbackの意図的例外

仮にlegacy consumerだけはlocale未対応で、半年後の廃止までfallbackを残すとします。

~~~text
Finding:
legacy consumerだけlocale fallbackが異なる

Decision:
migration期間中はaccepted

Scope:
legacy consumer pathのみ

Expires:
migration deadline
~~~

この状態をMemoryへ残せば、毎回同じ議論を繰り返さずに済みます。

ただしdeadlineを過ぎたら再度Findingとして浮上すべきです。

これがResurfaceの考え方です。

## 高リスクFindingを安易に抑制しない

Suppressionはレビューを静かにする強い機能です。

そのため、

- security
- payment
- personal data
- irreversible migration

のようなCliff領域では、単純なauto suppressionを避けるべきです。

「過去に一度WontFixだったから」という理由だけで、現在の変更まで自動的に通すべきではありません。

MemoryはAuthorityではありません。

## false positiveからSkill改善へ

同じfalse positiveが繰り返されるなら、Suppressionだけで終えるよりSkill側を改善できる可能性があります。

~~~text
Repeated false positive
  ↓
Can guard be generalized?
  ├─ yes → Skill guard + fixture
  └─ no  → project-specific suppression
~~~

これがReview Judgment as Codeの改善ループです。

プロジェクト固有の例外はMemoryへ、一般化できる誤検出はSkillへ戻します。

## この章で持ち帰ること

Suppressionの目的はレビューを黙らせることではありません。

**既に判断済みの例外を再利用しつつ、条件が変わったら再び表面化させること**です。

次章では、Skillそのものをfixtureで評価します。

### Sources

- [Riverbed Storage](https://github.com/s977043/river-review/blob/main/pages/reference/riverbed-storage.md)
- [Repo-wide Review: suppression memory](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
