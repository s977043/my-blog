---
title: "Findingが0件でも、レビュー完了とは限らない"
---

AIレビューで最も分かりにくい失敗の1つが、**何も指摘されなかったように見える失敗**です。

たとえばsecurity reviewerが2つのdiff chunkを担当したとします。

~~~text
security-scanner
  chunk A → completed / 0 findings
  chunk B → timeout
~~~

最終的なFinding一覧だけを見ると、0件に見える可能性があります。

しかし事実は、

> 問題が無かった

ではなく、

> 一部をレビューできなかった

です。

## Review Coverageが解決する問い

River ReviewではIssue #2212から、Review Coverageをfirst-classな契約として扱う設計が進みました。

現在の最小単位は、

~~~text
reviewer role × diff chunk
~~~

です。

各Review Unitに対し、completed / failed / timed_out といった状態を持たせます。

全体では次の状態を導出します。

| status | 意味 |
| --- | --- |
| complete | required unitがすべて完了 |
| partial | required unitの一部だけ完了 |
| not_executed | required unitが1つも完了していない |

Finding件数はCoverage判定に使いません。

0 findingsでもcompleteになれますし、0 findingsのままpartialにもなれます。

## なぜこの契約が必要になったのか

Issue #2212で整理された具体Gapは、reviewer role単位の集約だけではpartial executionを十分表現できなかったことでした。

たとえば、

~~~text
role: security-scanner
chunk A → success
chunk B → timeout

aggregated role status → fulfilled
~~~

のような状態です。

1つ成功していればrole全体がfulfilledに見えても、実際にはreview対象の一部が未実行です。

この差をCallerが判断できるようにするのがReview Coverageです。

## CoverageはFinding Qualityとは別

Review Coverageがcompleteでも、Findingが正しいとは限りません。

逆にFinding Qualityが高くても、一部Review Unitが未実行ならCoverageはpartialです。

River Reviewのcontractでは次を分離します。

- Skill routing coverage
- Review execution coverage
- Context coverage
- Finding quality
- Reviewer independence

「coverage」という言葉で全部をまとめません。

## 現在はExperimental

2026年10月6日に再確認したverification snapshotでは、Review Coverageは **Experimental** です。

LLMを実際に呼んだ実行では、機械が読める実行結果として出力されます。dry-runやoffline、key未設定のように意図的に飛ばした実行では出力されません。また、安定した契約（Stable Contract）ではありません。

Coverageの使われ方は2つに分かれます。保存した複数回の実行結果を比べる収束判定では既定で使われ、Coverage不足を理由にGateを止めるのは明示的に有効化（opt-in）した場合だけです。収束判定での扱いは第28章で詳しく見ます。

大事なのは、

> **0 findings と review complete を別の事実にする**

という設計原則です。

## この章で持ち帰ること

AIレビューでは、Findingの内容だけでなく、**予定したレビュー仕事が実際に完了したか**を追跡する必要があります。

次章では、完了したReview Unitが出したFindingについて、機械で確認できる部分をVerifierへ分離します。

### Sources

- [Review Coverage Contract](https://github.com/s977043/river-review/blob/main/docs/development/review-coverage-contract.md)
- [Stable Interfaces](https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md)
- [Issue #2212](https://github.com/s977043/river-review/issues/2212)
