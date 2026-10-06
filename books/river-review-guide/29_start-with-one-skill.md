---
title: "まず1つのSkillから始める"
---

最初の導入対象は、「レビュー全部」ではありません。

> **チームで繰り返し発生し、判断条件をある程度説明できる観点を1つ選ぶ。**

これが最も小さな始め方です。

## 最初のSkillに向くもの

たとえば、

- migration safety
- dependency policy
- test gap
- TypeScript null safety
- securityの既知pattern
- project固有の禁止API

などです。

共通しているのは、

1. 繰り返し出る
2. 見逃したときのコストがある
3. 正しい / 誤検知の例を作れる
4. Scopeを狭く説明できる

ことです。

## 候補を4軸で比較する

複数候補がある場合は、次の4軸で比較すると選びやすくなります。

- **Recurrence** — 同じ観点を何度も人が見ているか。繰り返し発生するものほど候補にしやすくなります。
- **Impact** — 見逃した場合の損失はあるか。無視できない一方、導入実験そのものは安全にできる観点から始めると扱いやすくなります。
- **Testability** — 正例・誤検知例をfixtureにできるか。期待behaviorを説明できる観点が向いています。
- **Scope** — 適用範囲を狭く切れるか。file / phase / patternを限定できるほど改善しやすくなります。

4軸すべてが高い必要はありません。

ただし **ScopeとTestabilityが曖昧なものを最初に選ぶと、良し悪しを評価できなくなる**ため注意します。

## 最初のSkillに向かないもの

逆に、

> 「このシステム全体の設計が良いか」

のような巨大な問いは最初のSkillに向きません。

Scopeが広すぎると、

- 必要Contextが増える
- Findingの評価が難しい
- false positiveの原因が分からない
- fixtureを作りにくい

からです。

## Skill Packから始めてもよい

自作Skillを最初から書かなくても、River ReviewにはSkill Packがあります。

Packにはofficial / community / experimentalといったmaturity tierがあります。

既存の公式観点で十分なら、まず小さなPackで使い勝手を確認し、その後にproject固有Skillを足す方が低コストです。

## 何を測るか

最初の1 Skillでは、複雑なKPIを作る必要はありません。

最低限、次を記録します。

- Useful Finding
- False Positive
- Missed Issue
- Humanが実際に修正したか
- Review Cost / latency
- 同じ指摘が再発したか

特に「何件出たか」だけで評価しないことが重要です。

Finding数が多いSkillが良いとは限りません。ノイズが多いだけかもしれません。

## 1 Skillの成功条件

たとえばmigration safety Skillなら、

> 何件かの実PRで、人間が繰り返していたrollback / destructive change観点を再現でき、誤検知と見逃しを説明できる

状態になれば、次へ広げる判断材料になります。

「3回なら合格」のような万能閾値は置きません。変更頻度やRiskに応じて、チームで観測期間を決めます。

## 広げない判断も持つ

試したSkillが、

- false positiveの原因を説明できない
- Evidenceを集めるコストが高すぎる
- Human Judgmentを置き換えようとしてしまう
- 実際の修正につながらない

なら、無理にCIへ昇格しません。

Skillを狭める、Ruleへ戻す、あるいは導入を止める選択も正常です。

## この章で持ち帰ること

River Review導入は、レビュー組織全体の作り直しから始めません。

**最も価値の高い繰り返し判断を1つ選び、Skill + fixtureとして成立するか確かめる**ところから始めます。

次章では、一般Skillでは扱えないproject固有の判断をrepo-ownedにします。

### Sources

- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
- [Skill Pack Guide](https://github.com/s977043/river-review/blob/main/pages/guides/use-skill-packs.md)
