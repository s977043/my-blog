# リポジトリ全体を踏まえてレビューする

PR diffだけでは判断できない問題があります。

locale追加の例でも、locale定義、同じ型を使うconsumer、fallback pattern、contract testが別ファイルにあれば、diffだけでは整合性を確認できません。

## repo-wide reviewが追加するもの

River Reviewのrepo-wide reviewは、変更ファイルから関連Contextを集めます。

~~~text
Changed Diff
   ↓
Related Context
   ├─ full file
   ├─ tests
   ├─ usages
   └─ config
   ↓
Agentic Review
~~~

目的はリポジトリ全体を読むことではなく、**判断に必要な周辺情報を足すこと**です。

## Contextには予算がある

Contextを増やすほど良いわけではありません。

- token / latency
- Attentionの分散
- irrelevant contextによる誤判断
- secret混入リスク

が増えるためです。

River ReviewではContext Budgetを使い、review modeやsectionごとに量を制御できます。

取得できなかったContextは「確認済み」とせず、skippedなどの状態として扱うことが重要です。

## Context収集はsecurity boundaryでもある

repo-wide context collectorでは、危険な情報をpromptへ入れないために複数段階で扱います。

| 段階 | 役割 |
| --- | --- |
| Path-level deny | .env、秘密鍵、credential系pathなどを対象外にする |
| Content redaction | 読み込んだtext内のtoken / API key patternなどを除去する |

repo-wide reviewは「Contextを最大化する機能」ではなく、**安全な範囲で必要なContextを選ぶ機能**です。

## Project RuleもContextになる

`.river/rules.md` を使うと、Architecture / Forbidden Pattern / Testing Ruleなどproject固有の基準をレビューへ渡せます。

これにより、「一般論として悪いか」ではなく、**このチームの設計基準に合うか**を判断できます。

## locale追加へ戻る

周辺Contextから、同じAPI型を使うconsumer、locale enumの正本、fallback pattern、contract testを確認できれば、FindingのEvidenceを具体化できます。

逆に必要Contextを取得できなければ、「リポジトリ全体との整合を確認済み」とは言えません。

## この章で持ち帰ること

repo-wide reviewでは、Contextを増やすのではなく、**判断に必要なContextを安全性と予算の中で選びます**。

ここまでで第4部の実践は終わりです。次の第5部では「レビューが実行されたこと」自体の信頼性を検証します。

### Sources

- [Repo-wide Review Guide](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
- [Epic #650](https://github.com/s977043/river-review/issues/650)
