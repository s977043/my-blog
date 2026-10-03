# Pluginから始め、必要ならCIへ広げる

River Reviewには複数の導入経路があります。

どれが「正式」かを決めるより、何をしたいかで選びます。

| Mode | 向いている用途 |
| --- | --- |
| Plugin | 対話的レビュー、AIエージェント開発 |
| CLI / river run | PR前セルフレビュー、headless実行 |
| GitHub Actions | PR時の継続レビュー |
| Skill adoption only | 既存社内workflowへ観点だけ移植 |

## PluginとCIでは設定の読み方も違う

導入でありがちな失敗が、

> 設定ファイルを置いたのに効かない

です。

Plugin経路では、AIエージェントがSkillを直接適用し、project ruleは .river/rules.md を使います。

一方CLI / Action runnerではrepository configを読みます。

導入経路ごとの責務を理解せず、全部同じ設定だと思わないことが重要です。

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

最初はFindingを観測するだけ。

有用性とノイズが分かってから、criticalなど限定された条件をGateへ昇格します。

## なぜcomment-onlyから始めるのか

Gateを早く強くすると、次のどちらかになります。

### False Positiveが多い

開発者が解除作業に追われ、レビュー機構そのものを嫌う。

### ルールを緩くする

止まりすぎるため、結局ほとんど何も検出しない設定になる。

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

**低摩擦な場所で価値を確認し、Evidenceがある観点だけ共有Gateへ昇格する**のが安全です。

次章では、Gate化しても残すべきHuman Review境界を決めます。

### Sources

- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
