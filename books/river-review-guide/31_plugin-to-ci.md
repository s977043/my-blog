---
title: "Pluginから始め、必要ならCIへ広げる"
---

River Reviewには複数の導入経路があります。

入口はPluginにします。チームで共有する契約にしたくなったら、GitHub Actionsへ広げます。

| Mode | 向いている用途 |
| --- | --- |
| Plugin | 対話的レビュー、AIエージェント開発 |
| GitHub Actions | PR時の継続レビュー |
| Skill adoption only | 既存社内workflowへ観点だけ移植 |

## PluginとCIでは設定の読み方も違う

導入でありがちな失敗が、

> 設定ファイルを置いたのに効かない

です。

プロジェクト固有のレビューポリシー（`.river/rules.md`）は、PluginでもGitHub Actionsでも読まれます。

一方、モデル・レビュー言語・厳格度・除外パターンといったrunnerの動作設定は、repository rootの `.river-review.json` などで指定します。

ポリシーと実行設定を別ファイルで持つ点を押さえ、置いたファイルがどちらの役割なのかを確認することが重要です。

## 最初からblockingにしない

CIへ入れると、「問題があればmergeを止めたい」と考えます。

しかし、導入初期はfalse positive率も分かりません。

Adopter Playbookでは、段階的なrolloutを推奨しています。

~~~text
comment-only
    ↓
warn / fail-if-required
    ↓
blocking gate
~~~

最初はFindingを観測するだけにします。

有用性とノイズが分かってから、criticalなど限定された条件をGateへ昇格します。

## Gateを強くする条件を先に決める

blockingへ進む前に、少なくとも次を確認します。

| 観点 | 確認すること |
| --- | --- |
| Signal quality | Useful FindingとFalse Positiveを区別できる |
| Coverage | 必要なreviewが未実行のまま「問題なし」にならない |
| Ownership | 誰がSkill / Ruleを保守するか決まっている |
| Escape hatch | 誤判定時のoverride / rollback手順がある |
| Human boundary | blockingにしてはいけないHuman Judgment領域を分離している |

固定の「false positive 5%以下」のような万能値は置きません。

チームの変更頻度・Risk・レビューコストをbaselineにして、**comment-only時の観測結果より明らかに運用可能だと判断できてから**強くします。

## rollback条件も持つ

Gateを強くした後でも、次の状態なら一段戻します。

- 同じ誤検知によるoverrideが繰り返される
- 担当者不在でSkillが保守されない
- Review Coverage不足が頻発する
- 実装速度より待ち時間の増加が大きい
- Human-ownedな判断を誤って自動blockしている

~~~text
blocking
   ↓ quality degrades
warn / comment-only
   ↓ improve
blocking again
~~~

Gateの強さは不可逆な成熟度ではありません。

## なぜcomment-onlyから始めるのか

Gateを早く強くすると、false positiveで解除作業に追われるか、止まりすぎるためルールを弱くして形骸化しやすくなります。

先にobserveすることで、

- どのSkillが有用か
- どのseverityが妥当か
- どのpathを除外するか
- Human Handoffが必要な割合

を見てからGate化できます。

## PR前とPR後を分ける

運用上は、PRを作る前にPlugin / local reviewで自己修正し、PR後にCIでteam policyを確認する二段構えも有効です。

~~~text
Local / Plugin
  = fast feedback

CI / GitHub
  = shared contract
~~~

同じ役割を二重に持つのではなく、feedback speedとshared enforcementを分けます。

## この章で持ち帰ること

River Reviewは「CIへ入れてblockingにして完成」ではありません。

**低摩擦な場所で価値を確認し、Evidenceがある観点だけ共有Gateへ昇格し、必要なら戻せるようにする**のが安全です。

次章では、Gate化しても残すべきHuman Review境界を決めます。

### Sources

- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
