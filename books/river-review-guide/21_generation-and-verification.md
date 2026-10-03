# 生成と検証を分ける

ReviewerがFindingを出したからといって、そのFindingをそのまま採用する必要はありません。

River Reviewでは、

> **Findingを生成する責務**  
> と  
> **機械的に確かめられる条件を検証する責務**

を分けています。

## Reviewerが得意なこと

Agentic Reviewerは、複数Artifactや意味をまたぐ判断に向いています。

- PlanとDiffの意図が合うか
- API変更が責務境界として妥当か
- テストがRiskに対して十分か
- 既存設計との意味的な不整合があるか

これらは文脈理解が必要です。

## Verifierが得意なこと

一方、River ReviewのVerifierはLLMを使わずrule-basedに確認します。

現行実装では、たとえば次を見ます。

- FindingにEvidenceがあるか
- Finding phaseとSkill phaseが整合するか
- Finding severityがSkill宣言のseverityを超えていないか
- Fix / Suggestionがactionableな長さを持つか
- Evidenceが参照するfileがdiffに存在するか
- Finding lineが実際の追加行か、pre-existingか

ここは「意味判断」ではありません。

## なぜLLMへ全部再確認させないのか

同じLLMに、

> このFindingは本当に正しいですか？

と聞けば、再び自然言語の判断が返ります。

しかし「Evidenceに書かれたfile pathがdiffに存在するか」は、文字列とparsed diffで確認できます。

機械で証明できるものをLLMへ戻すと、

- 再現性が下がる
- コストが増える
- 同じ種類のハルシネーションが再発する

可能性があります。

Judgment Placementの原則どおり、決定論的に確認できる部分は下層へ移します。

## Verifierも万能ではない

VerifierがPASSしたから、Findingの意味内容まで正しいわけではありません。

たとえば、

- fileは実在する
- lineもdiff内
- Evidence labelもある
- Fixも書いてある

としても、「設計として問題か」は別です。

~~~text
Verifier PASS
  = contract checks passed

Semantic correctness
  = still review / judgment problem
~~~

この境界を守ることが重要です。

## Verification Failureをどう扱うか

FindingがVerifierの条件を満たさない場合、そのFindingをそのまま人へ見せるのではなく、rejected / suppressed / diagnosticsへ回せます。

こうすると、人間が読むFindingの中へ「参照先が存在しない」「severityが勝手に引き上がった」といった機械的ノイズが混ざりにくくなります。

## この章で持ち帰ること

生成と検証を分離すると、LLMにしかできない判断へLLMを集中できます。

**意味判断はAgentic、証明可能な契約はDeterministic。**

次章では、Agentic Reviewへ渡すContext自体をどう絞るかを扱います。

### Sources

- [Verifier implementation](https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs)
- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
