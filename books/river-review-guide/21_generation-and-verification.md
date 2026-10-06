---
title: "生成と検証を分ける"
---

ReviewerがFindingを出したことと、そのFindingが契約上妥当であることは別です。

River Reviewでは、**意味判断を生成する責務**と**機械的に確かめられる条件を検証する責務**を分けます。

## ReviewerとVerifier

| | Reviewer | Verifier |
| --- | --- | --- |
| 主な役割 | 文脈を読んで意味判断する | 機械確認できる契約を検査する |
| 例 | Plan-Diff整合、Test Adequacy、設計上のRisk | Evidence有無、phase整合、severity上限、diff参照 |
| LLM | Agentic Reviewでは使う | 現行実装はrule-based |
| 出力の意味 | Finding候補 | Findingの契約検証 |

現行Verifierは、たとえば次を確認します。

- Evidenceがあるか
- Finding phaseとSkill phaseが整合するか
- severityがSkill宣言を超えていないか
- Fix / Suggestionがactionableか
- Evidenceのfile referenceがdiffに存在するか

加えて、Findingの行が今回の追加行か既存行かを機械で判定し、メタデータとして付けます。この判定は却下には使いません。

## なぜLLMへ全部再確認させないのか

「file pathがdiffに存在するか」のような条件は、文字列とparsed diffで確認できます。

これをLLMへ戻すと、再現性とコストの面で不利です。

Judgment Placementの原則どおり、**証明可能な条件はDeterministicへ置きます**。

## Verifier PASSは意味的な正しさではない

~~~text
Verifier PASS
  = contract checks passed

Semantic correctness
  = still a judgment problem
~~~

file・line・Evidenceが正しくても、「その設計が本当に問題か」は別です。

VerifierはAgentic Reviewの代替ではなく、その前後に置く契約検査です。

## Verification Failure

契約を満たさないFindingは、そのまま人へ見せるのではなく、rejected / suppressed / diagnosticsなどへ回せます。

これにより、参照先が存在しない、severityが宣言を超える、といった機械的ノイズを減らせます。

## この章で持ち帰ること

**意味判断はAgentic、証明可能な契約はDeterministic。**

次章では、Agentic Reviewへ渡すContextそのものをどう絞るかを扱います。

### Sources

- [Verifier implementation](https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs)
- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
