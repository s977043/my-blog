# 人間レビューとの境界を決める

自動化を増やしても、すべての判断をAIへ渡すわけではありません。

重要なのは、

> **AIができるか**

ではなく、

> **誰がその判断の責任を持つべきか**

です。

## 4つの扱いに分ける

チームへ導入するときは、レビュー結果を次のような扱いへ分けると整理しやすくなります。

| 扱い | 意味 | 例 |
| --- | --- | --- |
| Automatic | 機械的に継続してよい | format / type / deterministic checks |
| Ask | 不明点を質問してEvidenceを増やす | contract不明 / context不足 |
| Escalate | 人の判断へ戻す | security境界 / policy conflict |
| Human Approval Required | 承認があるまで進めない | payment / personal data / irreversible migration |

この分類はRiver Reviewの固定enumそのものではなく、本書で導入判断を整理するための見方です。

## RiskとAuthorityを一緒に決める

運用では、FindingのseverityだけでAuthorityを決めない方が安全です。

同じmajor Findingでも、変更domainによって責任の置き場所が違うからです。

| Risk tier | Reviewの役割 | Authority |
| --- | --- | --- |
| Field | 定型チェック・既知patternを確認 | policy条件内なら自律継続、事後監査 |
| Hill | 意味的整合・Evidence不足を整理 | callerが継続可能だが、観測期限や人確認を設定 |
| Cliff | Risk検出・Evidence整理・policy照合 | **Human Approval Required** |

たとえばdocs変更のmajor Findingと、payment flowのmajor Findingを同じ自動処理にしません。

**severityは問題の重さ、Authorityは誰が決めるか**です。

## VerdictとAuthorityを分ける

River ReviewがFindingやdecisionを返しても、それはAuthorityではありません。

~~~text
Review Engine
  ↓
Finding / Evidence / Verdict
  ↓
Decision Surface
  ↓
Authority Owner
~~~

たとえばRiver Reviewが「重大なFindingなし」と返しても、payment変更ならHuman Approval Requiredのpolicyを維持できます。

逆にdocs typoのような低リスク変更を毎回人間へ戻す必要もありません。

## Cliffでは人間承認を残す

Human Judgment Focusでは、高リスク領域をCliffとして扱います。

代表例は、

- authentication / authorization
- payment
- personal data
- security boundary
- irreversible migration

です。

ここでRiver Reviewが担うのは、

- Riskの検出
- Evidenceの整理
- 既存policyとの照合
- Humanへ返す理由の明示

までです。

最終的に受け入れる責任は人間側に残します。

## 「人が見る」を曖昧なfallbackにしない

よくある設計は、

> AIが自信なさそうなら人へ聞く

です。

これだけでは、いつ人に戻るかがモデルの自己評価に依存します。

代わりに、

- file / domain risk
- change type
- Evidence completeness
- policy
- irreversibility

など、外から確認できる条件でHuman Handoffを設計します。

## HillではObservationという選択もある

すべてをGO / STOPの二択にする必要はありません。

可逆で中リスクの変更なら、

> 進めるが一定期間内に人間レビューする

というGO_WITH_OBSERVATION型もあります。

これにより、Human waitingを減らしつつ、重要な意味判断を後から回収できます。

ただし期限を過ぎても無視してよい、という意味ではありません。

Observation expiryを過ぎたら再レビューや停止へ戻す必要があります。

## Human Reviewの価値を「最後の検査」に限定しない

人間が強いのは、バグ検出だけではありません。

- 事業優先順位
- ユーザーへの影響
- 組織責任
- 倫理的判断
- 長期Architecture
- 例外受入

など、Value Judgmentを含む領域です。

AIレビューが増えるほど、こうした判断へ人のAttentionを残すことが重要です。

## この章で持ち帰ること

Human-in-the-loopは、すべての出力を人が読むことではありません。

**RiskとAuthorityを分け、責任を伴う判断のOwnerを明示すること**です。

最後の章では、この境界も含めてレビューシステム自体を継続的に改善します。

### Sources

- [Human Judgment Focus](https://github.com/s977043/river-review/blob/main/pages/explanation/human-judgment-focus.md)
- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
- [Loop Convergence Contract](https://github.com/s977043/river-review/blob/main/pages/reference/loop-convergence-contract.md)
