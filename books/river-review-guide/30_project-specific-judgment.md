---
title: "プロジェクト固有の判断を持ち込む"
---

汎用的なAIモデルは、あなたのチームがなぜその設計を選んだかまでは知りません。

たとえば、

- shared logicは特定directoryへ置く
- date libraryは1つに統一する
- public API変更ではcontract test必須
- payment領域は人間承認必須
- legacy moduleには新規dependencyを足さない

といった判断です。

これらは一般的な「良いコード」ではなく、**そのrepositoryでの良い判断**です。

## .river/rules.md

River Reviewでは、project固有ルールを `.river/rules.md` へ置けます。

たとえば、

~~~markdown
## Architecture
- UIからdatabase layerを直接参照しない

## Testing
- public API変更はintegration test必須

## Forbidden
- new dependency in legacy module
~~~

のように、チームの判断基準をMarkdownで持てます。

Plugin経路では、このproject ruleが重要なContextになります。

## RuleとSkillをどう分けるか

すべてをSkillにする必要はありません。

### Rule向き

- repository全体へ適用する短い方針
- Architecture convention
- 禁止pattern
- 使用library方針
- Testing Requirement

### Skill向き

- 独立した責務を持つレビュー職務
- 適用条件がある
- Evidenceの取り方を定義したい
- false positive guardが必要
- fixture / evalで品質管理したい

Ruleで始め、繰り返し重要な判断になったらSkillへ昇格することもできます。

## repo-ownedの意味

Project Ruleの価値は、AIに長いContextを与えることだけではありません。

Gitで管理されるため、

- 誰が変更したか
- なぜ変更したか
- いつから適用するか
- どのPRで議論したか

を追えます。

判断基準自体がteam assetになります。

## 秘密情報を書かない

Project RuleはLLM Contextへ入る可能性があります。

そのため、

- token
- account id
- private endpoint
- credential
- personal data

のような秘密情報は置きません。

「判断基準」と「機密データ」は分けます。

## Private Skill

チーム固有の複雑な観点はprivate Skillとして持つ選択もあります。

ここでも目的はRiver Reviewへ依存を増やすことではなく、

> **自分たちが何を重要と考えるかを、自分たちが所有する**

ことです。

## この章で持ち帰ること

AIモデルへチームの暗黙知を覚えさせるのではなく、**Project Rule / Skillとしてrepository側へ明示する**と、モデルが変わっても判断基準を残せます。

次章では、個人のPlugin利用からCIへどの順で広げるかを扱います。

### Sources

- [Repo-wide Review Guide](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
