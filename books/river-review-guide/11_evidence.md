---
title: "それっぽい指摘と、確認できる指摘を分ける"
---

AIレビューの厄介な点は、間違った指摘でも文章として自然に見えることです。

そこでRiver Reviewでは、Findingだけでなく **Evidence** を重視します。

> Findingは主張。Evidenceは、その主張を確認するための材料。

## 例: 「API互換性が壊れています」

locale追加のレビューで、AIが次のように言ったとします。

> 既存consumerがlocaleを処理できず壊れます。

これだけでは、まだ判断できません。

確認したいのは、

- どのconsumerか
- どの行・contractを根拠にしたか
- unknown fieldを本当にrejectするのか
- 既存テストで何が確認されているか

です。

Evidenceがあれば、Findingを再確認できます。

Evidenceの有無やfile referenceのように機械で確かめられる条件は、LLMの自己申告に任せずVerifierが検査します。その契約の一覧は第21章で扱います。

## Evidenceが無いときは断定を弱める

良いレビューは、不明なものを無理にFindingへしません。

hallucinated-reference Skillでも、code searchで定義が見つからなくても、codegenや動的生成の可能性を排除できない場合はQuestionへ落とします。

Evidenceの量によって、Findingにするか、Questionにするかを分けます。

~~~text
Evidence enough
   → Finding

Evidence insufficient
   → Question / Human Handoff
~~~

「分からない」を正しく表現できる方が、もっともらしい誤断定より安全です。

## Evidenceは多ければ良いわけではない

ログやファイルを大量に貼ればEvidenceが強くなるわけでもありません。

必要なのは、

- 主張と直接つながる
- 後から再確認できる
- 対象revisionと一致している
- 過剰なContextに埋もれない

Evidenceです。

この話は、後のContext EngineeringとReview Coverageの話につながります。

## この章で持ち帰ること

AIレビューでは「何を指摘したか」だけでなく、**何を根拠にそう言ったか**を分離します。

そして、機械で確認できるEvidence条件は、できるだけ機械へ移します。

次章では、そもそも各判断をどの評価層へ置くかを整理します。

### Sources

- [Verifier implementation](https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs)
- [Review Artifact](https://github.com/s977043/river-review/blob/main/pages/reference/review-artifact.md)
- [hallucinated-reference Skill](https://github.com/s977043/river-review/blob/main/skills/midstream/hallucinated-reference/SKILL.md)
