# リポジトリ全体を踏まえてレビューする

PR diffだけでは判断できない問題があります。

locale追加の例なら、

- 対応するlocale定義は別ファイルにある
- 同じProfile型を利用するconsumerが別packageにある
- fallbackの既存パターンが別componentにある
- API contract testが別directoryにある

といったケースです。

このときdiffだけを見ても、整合性を判断できません。

## repo-wide reviewが追加するもの

River Reviewのrepo-wide reviewは、変更ファイルから関連Contextを集めてレビューへ追加します。

公開ガイドでは、full file、関連tests、symbol usage、configやsibling fileなどを対象にします。

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

これにより、cross-fileな不整合を見つけやすくなります。

## 「全部読む」はやらない

repo-wide reviewの目的は、リポジトリ全体を毎回LLMへ送ることではありません。

Contextにはコストがあります。

- token量
- latency
- 注意の分散
- secret混入リスク
- irrelevant contextによる誤判断

そのためRiver ReviewではContext Budgetを持ち、sectionごとの上限やreview modeで量を制限できます。

必要なContextを選び、不要なものはskippedとして扱う方が、判断しやすい場合があります。

## Context収集はsecurity boundaryでもある

リポジトリ全体からファイルを読むなら、秘密情報をLLMへ送らない設計が必要です。

River Reviewのrepo-wide context collectorでは、path-level denyとcontent redactionを組み合わせます。

### Path-level deny

.env、秘密鍵、credential系など、危険なpathをそもそもContext対象から外します。

### Content redaction

読み込んだtextにもtokenやAPI key patternが含まれる可能性があるため、promptへ渡す前にredactします。

つまりrepo-wide reviewは、

> Contextを増やす機能

ではなく、

> **安全な範囲で、判断に必要なContextを選ぶ機能**

と考えた方が正確です。

## Project RuleもContextになる

.river/rules.md を使うと、プロジェクト固有のArchitecture / Forbidden Pattern / Testing RuleなどをレビューContextへ入れられます。

これにより、

「一般論として悪いか」

ではなく、

「このチームの設計基準に合っているか」

を判断しやすくなります。

## locale追加へ戻る

diffだけではlocale追加自体に問題がなくても、repo-wide contextから、

- 同じAPI型を使うconsumer
- locale enumの正本
- fallback pattern
- contract test

を見つけられれば、より具体的なEvidenceを持って判断できます。

逆に関連Contextが取得できなかった場合は、「全体整合を確認済み」とは言えません。

この違いが、次のPartで扱うReview CoverageやContext Coverageにつながります。

## この章で持ち帰ること

repo-wide reviewの価値は、Contextを最大化することではありません。

**判断に必要な周辺Contextを、安全性と予算の中で選択すること**です。

次の第5部では、AIレビューそのものの完遂性・Evidence・Contextをどう検証するかへ進みます。

### Sources

- [Repo-wide Review Guide](https://github.com/s977043/river-review/blob/main/pages/guides/repo-wide-review.md)
- [Epic #650](https://github.com/s977043/river-review/issues/650)
