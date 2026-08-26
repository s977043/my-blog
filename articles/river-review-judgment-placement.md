---
title: "AIに全部レビューさせない。River Reviewで「判断」を適切な層に置く"
emoji: "🌊"
type: "tech"
topics: ["ai駆動開発", "codereview", "claudecode", "aiエージェント", "自動化"]
published: false
---

:::message
この記事で得られること

- なぜ「AIに全部レビューさせる」設計がスケールしにくいのか
- Lint / 静的解析 / AI / 人間をどう使い分けるか
- River Reviewで実装している `Judgment Placement` の考え方
- AIレビューで繰り返す判断を、Rule / Test / Checkerへ移していく方法

この記事は、私が個人で開発しているOSS「River Review」の設計・実装を題材にしています。
:::

## きっかけは「Stop burning tokens on code review」

先日、Swizec Teller氏の [Stop burning tokens on code review](https://swizec.com/blog/stop-burning-tokens-on-code-review) という記事を読みました。

AIでコード生成が速くなる一方、AIコードレビューを全PRに広げると、レビューコストとノイズが新しいボトルネックになる。そこで、LLMが繰り返し見つける決定論的な問題をCustom Linterへ移していく、という内容です。

特に印象に残ったのは、この考え方でした。

**LLMでレビューできることと、LLMでレビューすべきことは同じではない。**

型エラー、禁止API、依存方向、既知パターンのように機械的に判定できることまで、毎回LLMへ問い合わせる必要はありません。

この記事を読んで、自分が開発しているRiver Reviewでも、かなり近い問題を別の角度から扱っていることに気づきました。

River Reviewではこの問題を「AIレビューのコスト削減」だけではなく、**レビュー判断をどこで実行するべきか**という設計問題として整理しています。

この設計原則を **Judgment Placement** と呼んでいます。

## 先に結論：レビューではなく「判断」を分解する

River Reviewでは、レビュー判断を次の4層に分けます。

```text
Can it be proven?
  ↓ yes
Deterministic

Can it be reliably detected by explicit rules?
  ↓ yes
Heuristic

Does it require semantic or contextual judgment?
  ↓ yes
Agentic Review

Does it require responsibility or value judgment?
  ↓ yes
Human Judgment
```

ざっくり言えば、こうです。

| 判断 | 主な担当 |
| --- | --- |
| 型・schema・test・依存境界など、機械的に証明できる | Deterministic |
| temporary codeや既知smellなど、明示ルールで高精度に拾える | Heuristic |
| Plan-Diff整合、設計意図、テスト妥当性など、意味理解が必要 | Agentic Review |
| Security Boundary、個人情報、課金、不可逆変更など、責任が必要 | Human Judgment |

重要なのは、**すべてのレビュー項目を同じAI Reviewerに投げないこと**です。

レビューの目的を「AIにコメントを書かせること」から、「必要な判断を、最も適した場所で実行すること」へ変えます。

## なぜAIレビューを増やすだけでは足りないのか

AIコードレビューは便利です。

人間が見落としたバグや、テスト不足、設計上の違和感まで拾えることがあります。

しかし、運用を続けると次の問題が出てきます。

- Lintで拾える問題までAIが指摘する
- 同じチェックのために毎回LLMを呼ぶ
- 同じ変更でもモデルやContextで判断が揺れる
- 軽微な指摘が増え、重要なFindingが埋もれる
- AIのレビューを人間がレビューする時間が増える

例えば、次のようなチェックです。

```text
unused import
型エラー
formatting
禁止API
schema violation
dependency boundary
既知の危険パターン
```

これらの多くは、LLMよりも次の仕組みのほうが得意です。

```text
compiler
linter
static analysis
schema validator
architecture test
test
```

理由は単純です。

- 同じ入力なら同じ結果になる
- 速い
- LLMトークンを使わない
- CIやEditorで早く検出できる
- 「なぜ落ちたか」を説明しやすい

そこでRiver Reviewでは、新しいレビュー観点を増やす前に、まずこう考えます。

> この判断、本当にLLMが必要なのか？

## 1. Deterministic：証明できるなら、AIに聞かない

最初の層は `Deterministic` です。

例えば、

- type check
- test
- schema validation
- dependency boundary
- architecture test
- migration invariant

のように、機械的に合否を決められる領域です。

River ReviewのSkill Schemaには、評価方法を示す `evaluationType` があります。

```yaml
---
id: architecture-boundary
name: Architecture Boundary
description: dependency boundaryを検査する
category: midstream
evaluationType: deterministic
---
```

さらに、決定論的なチェックをGateとして扱う場合は `deterministicGate` を宣言できます。

```yaml
---
id: architecture-boundary
name: Architecture Boundary
description: dependency boundaryを検査する
category: midstream
evaluationType: deterministic

deterministicGate:
  command: "<host-approved-checker>"
  failSeverity: strict_block
---
```

ここで重要なのは、Deterministicな結果を**AIに再判定させない**ことです。

例えば静的解析がArchitecture Rule違反を検出した後に、LLMへ「今回は例外として許可してよいですか？」ともう一度聞く設計にはしません。

```text
Static Analysis
      ↓
  violation
      ↓
Deterministic Gate
      ↓
     block
```

River Reviewでは、`strict_block` として設定された決定論的Findingをhard blockとして扱えます。

これは「AIよりルールのほうが偉い」という話ではありません。

**機械的に証明できた事実を、確率的な推論で上書きしない**という責務分離です。

## 2. Heuristic：LLMほどの意味理解は要らない判断

すべてが完全なDeterministicになるわけではありません。

そこで次に `Heuristic` があります。

例えば、

- temporary code
- suspicious pattern
- known smell
- 撤去条件のない暫定実装
- 特定条件で危険になりやすい書き方

などです。

完全な証明は難しいものの、明示的なルールやDetectorでかなり高い精度で候補を絞れます。

```text
Code
 ↓
Heuristic Detector
 ↓
Candidate Finding
```

これも、何でもLLMへ渡すより、候補検出を安定させられる領域があります。

River ReviewのSkill Schemaでは `evaluationType: heuristic` として区別しています。

## 3. Agentic Review：ここでLLMを使う

意味理解が必要になったところで、初めて `Agentic Review` が中心になります。

例えば、次の判断です。

- 実装Diffが承認されたPlanの意図を維持しているか
- テストがPlanで約束された境界条件を満たしているか
- 責務分離が設計意図と一致しているか
- 複数Artifactの間に矛盾がないか
- 変更同士にsemantic conflictがないか

これらは単純な正規表現やLintでは扱いにくい領域です。

River Reviewは、PR diffだけを入力にするのではなく、

```text
plan
diff
tests
JUnit
ADR
PR description
past review
```

といった複数Artifactをまたいで判断することを前提にしています。

ここでは、LLMの意味理解やContextを使う価値があります。

```text
Plan ──────┐
Diff ──────┤
Tests ─────┤
ADR ───────┤
           ↓
     Agentic Review
           ↓
 Finding / Evidence / Verdict
```

つまり、AIレビューを減らしたいのではありません。

**AIにしかできない判断へ、AIレビューを集中させたい**のです。

## 4. Human Judgment：責任までAIへ渡さない

そして、AIにも置かない判断があります。

例えば、

- Security Boundaryを変更してよいか
- 個人情報の扱いを変えてよいか
- 課金ロジックを変更してよいか
- irreversible migrationを実行してよいか
- 事業としてトレードオフを受け入れるか

です。

これはモデル性能の問題だけではありません。

**責任を引き受ける主体が必要な判断**だからです。

River Reviewでは、ReviewerがFindingやEvidence、Verdictを出しても、最終的な承認やmergeまでReviewer自身へ持たせる設計にはしていません。

```text
River Review
   ↓
Finding / Evidence / Verdict
   ↓
Caller / PlanGate / Human
   ↓
GO / NO-GO / Approval / Merge
```

人間レビューをなくすのではなく、機械的に処理できる定型確認から人間を外し、**人間にしか引き受けられない判断へ注意力を移す**ことを目指しています。

## Static AnalysisとAI Reviewを競合させない

River Reviewのレビュー基準では、静的解析とAIレビューの責務も分けています。

```text
Static Analysis
  ↓
構文・パターン・決定論で扱える領域

AI Review
  ↓
設計・スコープ・要求・意味的整合性
```

例えば、ESLintで拾える問題をAIにも指摘させると、こうなります。

```text
ESLint
  ↓
同じ問題をAIも指摘
  ↓
人間が両方確認
```

レビュー工程が増えただけです。

理想は、

```text
ESLint
  ↓
自動修正 / block
  ↓
AIはこの領域を見ない
```

です。

一方、

> この実装はPlanで意図した責務分離を維持しているか？

のような問いはLintでは判断できません。

そこではじめてAgentic Reviewを使います。

## Deterministic Gate自体にもTrust Boundaryが必要だった

ここまでだと、「それならLintコマンドをたくさん実行すればよい」と見えるかもしれません。

しかし、AI Coding Agentが変更できるリポジトリで任意commandを実行するのは、それ自体が攻撃面になります。

例えばPR側で、

```yaml
deterministicGate:
  command: "npm run lint:ci"
```

と宣言できるとしても、`package.json` の `lint:ci` 自体をPRから書き換えられるなら、そのGateを信頼できません。

River Reviewではこの問題をTrust Boundaryとして扱いました。

現在のDeterministic Command実行は、概念的には次の流れです。

```text
Trusted Base
   ↓
approved allowlist
   ↓
exact command matching
   ↓
clean sandbox
   ↓
changed files
   ↓
deterministic result
```

実装では、

- host側のtrusted treeからallowlistを読む
- PR側のallowlistは実行判断に使わない
- command / argsをexact matchする
- clean working directoryを使う
- HOMEを分離する
- environmentを制限する
- 未承認commandは実行しない

といった制約を入れています。

レビューを決定論的にしても、**その判定器を誰が書き換えられるか**を設計しないと、Gateそのものが信頼できません。

これは実装してみて強く意識するようになった点です。

## 一番重要なのは「Review → Rule Promotion」

Judgment Placementで一番重要なのは、最初に4層へ分類することではありません。

**判断の置き場所が変化すること**です。

例えば、AI Reviewerが何度も、

> presentation layerからrepositoryを直接参照しています

と指摘しているとします。

最初はAgentic Reviewでも構いません。

しかし、何度も同じ判断をしているなら考えます。

```text
Repeated Agentic Finding
        ↓
条件を明文化できるか？
        ↓ yes
Architecture Rule
        ↓
Deterministic Checker
```

次回から、AIが気づかなくてもCheckerが守ります。

別の例として、

> temporary codeには撤去条件を書く

というルールなら、完全なDeterministicにはできなくてもHeuristic Detectorへ移せるかもしれません。

```text
Repeated Human / Agentic Judgment
            ↓
    Can it be explicit?
      ├─ no  → stay semantic / human
      └─ yes
           ↓
  Can it be deterministic?
      ├─ yes → test / schema / checker
      └─ no  → heuristic rule
```

つまり、レビューで得た知識を、**次回のレビューを不要にする仕組みへ変換する**わけです。

私はこの動きを、ReviewからRuleへのPromotionとして捉えています。

## Review Judgment as Code：コメントではなく判断を資産にする

River Reviewのもう一つの中心概念が **Review Judgment as Code** です。

一般的なAIレビューでは、レビュー基準がProvider側のプロンプトやモデル挙動に閉じることがあります。

```text
Diff
 ↓
AI Reviewer
 ↓
Comment
```

River Reviewでは、チーム固有の判断をrepo-ownedなSkillとして持ちます。

```text
Team Judgment
      ↓
repo-owned Skill
      ↓
version control
      ↓
Review
```

Security、Accessibility、Migration Safety、Dependency Policy、Plan Conformanceなどの判断基準をリポジトリ側で所有することで、

- 誰が基準を変えたか分かる
- PRで基準そのものをレビューできる
- version管理できる
- fixture / golden outputで回帰確認できる
- 複数のCoding Agentから再利用できる

ようになります。

AI Reviewerを賢くするだけではなく、**組織がレビュー判断を所有できる状態を作る**ことを重視しています。

## レビュー結果を次の仕組みに戻す

Skillを作って終わりでもありません。

レビュー結果、suppression、過去判断、fixture、evaluationを次の改善へ戻します。

```text
Review
  ↓
Finding
  ↓
Human / Agent decision
  ↓
Memory / Fixture / Evaluation
  ↓
Skill / Rule improvement
  ↓
Next Review
```

同じfalse positiveが繰り返されるなら、毎回AIを訂正するのではなくfixtureやcanaryへ戻す。

同じFindingが繰り返されるなら、HeuristicやDeterministicへPromotionできないか考える。

そうして、レビューシステム自体を少しずつ変えていきます。

## 目指しているレビューの流れ

最終的に、レビュー判断は次のように流れるのが理想だと考えています。

```text
Implementation
      ↓
────────────────────────
Deterministic
────────────────────────
compiler
typecheck
lint
test
schema
architecture rule
      ↓
────────────────────────
Heuristic
────────────────────────
known smell
temporary code
suspicious pattern
      ↓
────────────────────────
Agentic Review
────────────────────────
Plan-Diff consistency
architecture intent
test adequacy
semantic conflict
      ↓
────────────────────────
Human Judgment
────────────────────────
security boundary
privacy
billing
irreversible change
business trade-off
```

上ほど速く、安く、再現しやすい。

下へ行くほど意味理解や責任が必要になります。

ただし、全部を一番上へ移せばよいわけではありません。

判断をより決定論的な層へ移すのは、**同等以上の安全性・説明可能性・保守性を維持できる場合だけ**です。

意味的な判断を無理にRegexへ落とせば、誤検出と抜け漏れが増えます。

人間が責任を持つべき変更をAI Verdictだけで通すのも違います。

重要なのは、最も安い層ではなく、**安全に扱える最も再現可能な層へ判断を置くこと**です。

## River Reviewがやらないこと

この設計を明確にするため、意図的にやらないことも決めています。

### LinterやArchitecture Checkerを再実装しない

ESLint、compiler、Semgrep、architecture testなど、既存のCheckerが正しく判断できるなら、それをSource of Truthとして使います。

River Reviewは、その結果をFinding / Evidence / Verdictとして扱います。

### Human approvalをAIで置き換えない

Reviewerは判断材料を提供します。

最終承認やmergeの責任までReviewer自身に持たせることは目的にしていません。

### すべてをDeterministicにしない

Contextや意味理解が必要な判断はAgentic Reviewへ残します。

責任や価値判断を含むものはHuman Judgmentへ残します。

## まとめ：レビューするほど、次のレビューを減らしたい

AI駆動開発では、コード生成速度は今後も上がっていくと思います。

するとレビューの課題は、

> AI Reviewerを何人増やすか

ではなく、

> どの判断を、どこへ置くか

へ変わります。

River Reviewでは、その答えの一つとしてJudgment Placementを使っています。

```text
Can it be proven?
    → Deterministic

Can it be detected by rules?
    → Heuristic

Does it require semantic understanding?
    → Agentic Review

Does it require responsibility?
    → Human Judgment
```

そして、同じ判断を何度も繰り返すなら、その判断をより再現可能な仕組みへPromotionします。

```text
Review
 ↓
Learn
 ↓
Codify
 ↓
Automate
 ↓
Less Review
```

目指しているのは、AIにより多くレビューさせる仕組みではありません。

**レビューを通じてチームの判断を学習し、Rule / Test / Checker / Skillとして残し、次から人間やLLMが気づかなくても守れる状態を増やすことです。**

レビューを、毎回消費される作業から、組織に残る判断資産へ変える。

それがRiver Reviewで実装している **Review Judgment as Code** の方向性です。

## 参考

- [Stop burning tokens on code review - Swizec Teller](https://swizec.com/blog/stop-burning-tokens-on-code-review)
- [River Review - GitHub](https://github.com/s977043/river-review)
- [Judgment Placement - River Review](https://river-review.the3396.com/explanation/judgment-placement/)
- [River Review Skill Schema](https://river-review.the3396.com/reference/skill-schema/)
- [River Review deterministic-gate.mjs](https://github.com/s977043/river-review/blob/main/src/lib/deterministic-gate.mjs)
- [River Review deterministic-command-orchestrator.mjs](https://github.com/s977043/river-review/blob/main/src/lib/deterministic-command-orchestrator.mjs)
