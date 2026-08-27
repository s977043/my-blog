---
title: "AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計"
emoji: "🌊"
type: "tech"
topics: ["ai駆動開発", "codereview", "claudecode", "aiエージェント", "自動化"]
published: false
---

:::message
**この記事で得られること**

- Lint / 静的解析 / AI / 人間へ、レビュー判断をどう振り分けるか
- River Reviewで実装している `Judgment Placement` とコード上の責務境界
- Deterministic Gateを安全に実行するTrust Boundaryと、判断をRule / Testへ移す考え方

対象読者は、Claude CodeやCodexなどのCoding Agentを使い、レビューの自動化・品質・コストのバランスを考えている人です。

検証対象は **2026-08-27時点のRiver Review `main`、commit `56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9`** です。実装済み、設計原則、拡張中の機能を分けて記載します。

この記事では、モデル間の精度比較やAIレビューのコスト削減率のベンチマーク、FindingからLint Ruleを自動生成する実装手順までは扱いません。
:::

## TL;DR

AIコードレビューで重要なのは、Reviewerを増やすことより、**その判断を本当にLLMへ置くべきかを決めること**だと考えています。

River Reviewでは、この設計原則を **Judgment Placement** と呼んでいます。

```text
機械的に証明できる？
  ↓ yes
Deterministic（決定論的な検査）

明示ルールで高精度に拾える？
  ↓ yes
Heuristic（ルールベースの候補検出）

意味やContextの理解が必要？
  ↓ yes
Agentic Review（AIによる意味的レビュー）

責任・価値・不可逆性を伴う？
  ↓ yes
Human Judgment（人間の最終判断）
```

例えば、依存方向を機械的に検査できるならAIへ聞かない。PlanとDiffの意味的な整合はAIへ任せる。課金や個人情報のように責任を伴う変更はHuman Judgmentへ残す、という分け方です。

さらに、Agentic ReviewやHuman Reviewで同じ判断が繰り返されるなら、条件を明文化し、より再現可能な層へ移します。

```text
Review
  ↓
Learn
  ↓
Codify
  ↓
Rule / Test / Checker
  ↓
Less Review
```

ただし、現時点で「AIの指摘から自動でLint Ruleを生成・昇格するパイプライン」まで完成しているわけではありません。**Promotionは設計原則であり、実装済みの評価層・Gate・fixture / evaluationを使いながら段階的に進める領域**です。

## なぜAIコードレビューの「判断配置」が必要なのか

きっかけの一つになったのが、Swizec Teller氏の [Stop burning tokens on code review](https://swizec.com/blog/stop-burning-tokens-on-code-review) です。

AIでコード生成が速くなる一方、AIコードレビューを全PRへ広げると、コストやノイズが新しいボトルネックになる。そこで、LLMが繰り返し見つける決定論的な問題をCustom Linterへ移していく、という内容です。

自分の言葉で一文にすると、こうなります。

> **LLMでレビューできることと、LLMでレビューすべきことは同じではない。**

これは、自分が開発しているOSS [River Review](https://github.com/s977043/river-review) で整理してきた問題とかなり近いものでした。

ただし、River Reviewでは「LLMレビューをLintへ置き換える」だけでは足りないと考えています。レビューには、そもそも性質の違う判断が混ざっているからです。

- 型エラーがないか
- 依存方向が規約を守っているか
- temporary codeの兆候がないか
- PlanとDiffの意図が一致しているか
- 認証境界の変更を受け入れてよいか

これらをすべて同じReviewerへ投げる必要はありません。

そこで、**「レビューするか」ではなく「判断をどこへ置くか」**を先に設計するようにしました。

## 設計上の制約：全部をLintにも、全部をAIにも寄せない

Judgment Placementを考えるとき、River Reviewでは次の制約を置いています。

1. **既存Checkerを再実装しない**  
   compiler / test / linter / architecture checkerで判定できるものは、それらをSource of Truthとして使う。
2. **意味的判断を無理にDeterministic化しない**  
   Regexや依存ルールへ落とすことで安全性や説明可能性が下がるならAgentic Reviewへ残す。
3. **責任をAIへ委譲しない**  
   River ReviewはFinding / Evidence / Verdictを提供するが、最終承認やmergeはCaller / Humanの責務とする。
4. **レビュー対象側の設定を無条件に信頼しない**  
   deterministicなcommandを実行する場合でも、PR側が自分で許可ルールを書き換えられないTrust Boundaryを作る。
5. **同じ判断を永遠にAIへ繰り返させない**  
   条件が安定して明文化できた判断は、より再現可能な評価層へのPromotionを検討する。

この制約があるため、「AIレビューの精度を上げる」だけではなく、レビューシステム全体の責務分離が必要になります。

## Judgment Placement：4つの判断層

4層を整理すると次のようになります。

| 層 | 役割 | 向いている判断 | 主な手段 |
| --- | --- | --- | --- |
| Deterministic | 決定論的な検査 | 機械的に証明・検査できる事実 | compiler / test / schema / checker |
| Heuristic | ルールベースの候補検出 | 明示ルールで高精度に兆候を拾える | pure-code detector / rule |
| Agentic Review | AIによる意味的レビュー | 複数Artifactや意味理解が必要 | LLM Reviewer |
| Human Judgment | 人間の最終判断 | 責任・価値・不可逆性を伴う | Human / Caller |

### Deterministic：証明できるならAIに聞かない

例えば、次のような判断です。

- type check
- test
- schema validation
- dependency boundary
- architecture test

River Reviewでは、こうした機械的に判定できる結果をSource of Truthとして扱い、同じ合否をLLMに再判定させません。

### Heuristic：完全な証明までは要らない

例えば、temporary code、suspicious pattern、known smell、撤去条件のない暫定実装の候補などです。

完全に正しい / 間違いを証明できなくても、明示ルールで候補を高精度に絞れるなら、まずpure-code detectorへ置けます。

### Agentic Review：意味理解が必要になってからLLMを使う

ここで初めてLLMが中心になります。

例えば、

- 実装DiffがPlanの意図を維持しているか
- テストが要求された境界条件を十分に扱っているか
- 責務分離が設計意図と一致しているか
- 複数Artifactの間に矛盾がないか

といった判断です。

River ReviewはDiffだけでなく、`plan` / `test-cases` / `review-self` / `review-external` / `junit` / `coverage` / `lint` / `typecheck` など複数の入力Artifactを扱います。

LLMのContextと意味理解を使う価値があるのは、この層です。

### Human Judgment：責任までAIへ渡さない

例えば、

- Security Boundaryの変更を受け入れるか
- 個人情報の扱いを変えてよいか
- 課金ロジックを変更してよいか
- irreversible migrationを実行してよいか
- 事業としてそのトレードオフを受け入れるか

です。

これはモデル性能だけの問題ではありません。**責任を引き受ける主体が必要な判断**です。

River ReviewがFinding / Evidence / Verdictを出しても、GO / NO-GO、反復、停止、承認、mergeをReviewer自身の責務にはしていません。

```text
River Review
   ↓
Finding / Evidence / Verdict
   ↓
Caller / Human
   ↓
GO / NO-GO / Approval / Merge
```

### 判断層と変更リスクは別の軸

ここは混同しやすいポイントです。

River Reviewでは、Judgment Placementと変更リスクに応じたHuman Judgment Focusを別の軸として扱います。

| 軸 | 問い | 分類 |
| --- | --- | --- |
| Judgment Placement | この判断を誰 / 何が実行するか | Deterministic / Heuristic / Agentic / Human |
| Human Judgment Focus | この変更にどれだけ人間監督が必要か | 崖 / 丘 / 原っぱ |

例えばリスクの高い「崖」の変更でも、型・依存方向・Evidence検証はDeterministicやHeuristicが担当できます。一方、Human Judgmentへ配置した判断を含む変更は、人間承認が必要な領域として扱います。

**AIを使うかどうかと、人間が責任を持つかどうかは同じ問いではありません。**

## 実装1：評価方式をSkill Schemaに持たせる

Judgment Placementはドキュメント上の考え方だけではありません。

River ReviewのSkill Schemaには、評価層を表す `evaluationType` があります。

```text
deterministic
heuristic
agentic
```

例えば、決定論的なArchitecture CheckをSkillとして宣言するなら、概念的には次のようになります。

```yaml
---
id: architecture-boundary
name: Architecture Boundary
description: dependency boundaryを検査する
category: midstream
applyTo:
  - "src/**/*.ts"
evaluationType: deterministic

deterministicGate:
  command: "architecture-check"
  args: []
  failSeverity: strict_block
---
```

`applyTo` を含めているのは、現在のSkill Schemaではレビュー対象を示すフィールドが必要だからです。

また、`evaluationType: deterministic` と書いただけで必ずhard blockになるわけではありません。`deterministicGate` を明示したSkillだけがGateとして強制され、Gateを持たないdeterministic Skillはadvisoryとして扱えます。

`failSeverity: strict_block` のFindingは、AI Reviewerが「今回は問題ない」と再判定して解除する対象にはしません。

```text
Deterministic Detector
        ↓
      Finding
        ↓
   strict_block
        ↓
     hard block
```

**機械的に確認できた事実を、確率的推論で上書きしない**ためです。

## 実装2：Static AnalysisとAI Reviewの責務を分ける

River Reviewのレビュー基準では、静的解析とAI Reviewの責務も明示的に分けています。

```text
Static Analysis
  ↓
構文・パターン・決定論で扱える領域

AI Review
  ↓
設計・スコープ・受入基準・意味的整合性
```

例えばESLintやCustom Linterで確実に検出できる問題をAIにも指摘させると、LinterとAIの両方をHumanが確認することになり、レビュー工程を増やしただけになり得ます。

River Reviewでは、Custom Linterのfalse positiveもAIに都度判断させるのではなく、既知の誤検出パターンをcanary testへ戻して回帰防止する方針にしています。

つまり、静的解析の領域は静的解析自身を改善し、AIは意味的な判断へ集中させます。

## 実装3：Deterministic CommandにもTrust Boundaryを置く

「LLMを使わずcommandを実行すれば安全」とは限りません。

AI Coding Agentが変更できるリポジトリで、レビュー対象のPRが任意commandを宣言できるなら、その実行機構自体が攻撃面になります。

River ReviewのDeterministic Command実行は、概念的に次の構造です。

```text
PR側のSkill
   ↓
deterministicGate command / args
   ↓
Host-trusted base checkout
   ↓
approved allowlistとexact argv match
   ↓
clean cwd + empty HOME + scrubbed env
   ↓
changed filesをstage
   ↓
executor
```

重要なのは、**PR head側のallowlistを実行許可の根拠にしない**ことです。

現在の実装では、

- allowlistはhost-trustedなbase checkoutから読む
- PR headの `.river/deterministic-allowlist.yaml` は読まない
- `command` と `args` をexact matchする
- clean working directoryを作る
- HOMEを空の一時ディレクトリへ分離する
- environmentを制限する
- allowlistがない / trusted treeがない場合は何も実行しない

というsafe-defaultを取っています。

ただし、**実装済みであることと、全経路で常時有効であることは別です。** 検証対象commitのreview pipelineでは、Deterministic Command実行は `RIVER_DETERMINISTIC_EXEC=1` と `RIVER_TRUSTED_TREE` の両方がそろうfeature gateの内側にあります。

Deterministicにするほど自動的に信頼できる、ではありません。

**「誰がその判定器と実行条件を書き換えられるのか」まで含めてDeterministic Gate**です。

## 検証対象commitの実装例：AI Reviewerの判断自体をDeterministicな骨格で囲う

検証対象commitには、`Evidence-Grounded Adversarial Review` のPhase 1aとして `src/lib/finding-critic.mjs` が追加されています。

目的は「LLM ReviewerのFindingを、別のCritic視点で検証する」ことですが、**Phase 1aのモジュール自体はLLMを呼びません**。先に、決定論で扱える部分だけをstate machineとして切り出しています。

```text
Finding
  ↓
Deterministic pre-verification
  ├─ verification failure → Criticへ送らない
  └─ verified
        ↓
    Critic response
        ↓
Deterministic parser / state machine
        ↓
  ┌─────┴────────────────────┐
  │ timeout / parse failure │
  │ evidence contradiction  │
  │ inner-loop cap          │
  └──────────┬───────────────┘
             ↓
Findingを保持 + HumanへEscalate
```

実装には、例えば次のfail-safeがあります。

- deterministic pre-verificationがない → HumanへEscalate
- Critic timeout → Findingを消さずHumanへEscalate
- Critic responseをparseできない → clean扱いにしない
- deterministic verifierがFindingを確認済みなのに、Criticの反証Evidenceがdiffへ接地しない → HumanへEscalate
- inner loopが収束しない → hard capで停止しHumanへEscalate

デフォルトのinner roundは2、protocol上のhard capは5です。

重要なのは、「AIを二重化した」ことではありません。

```text
意味的な反論     → Agentic Review
Evidenceの成立   → Deterministic
収束制御         → Deterministic
壊れた状態       → fail-safe
解消できない競合 → Human Judgment
```

と、**AIレビューの内部でも判断を分解している**ことです。

なお、現時点ではこれは **Phase 1aのdeterministic skeleton** です。LLM境界はこのモジュールの外にあり、`src/cli/**` から到達する完成済み機能ではありません。「Adversarial Reviewがすでに全面稼働している」という状態ではありません。

## Review → Rule Promotion：同じ判断を何度もAIへさせない

Judgment Placementで重要なのは、最初の4分類だけでなく、**運用から学んで判断の置き場所を変え続けること**です。

例えば、Agentic Reviewerが何度も、

> presentation layerからrepositoryを直接参照している

と指摘しているとします。

最初は意味理解が必要でも、繰り返すうちに条件が明確になるかもしれません。

```text
Repeated Human / Agentic Judgment
            ↓
Can the condition be explicit?
   ├─ no  → semantic / humanに残す
   └─ yes
        ↓
Can it be deterministic?
   ├─ yes → test / schema / checker
   └─ no  → heuristic rule / skill
```

条件が安定したら、次からAIが気づかなくても守れる仕組みへ移します。

これは「AI Reviewerをもっと賢くする」とは別の改善です。

**AI Reviewerが覚えていなくても、リポジトリ側が守れる状態を増やす**改善です。

River Reviewでは、この考え方をRiverbed、fixture、evaluation、Review Evolution Cycleと接続し、Promotionが本当に品質を上げたかを検証する設計にしています。

一方で、現在の実装境界は明確にしておく必要があります。

**Findingを観測すると自動でLint Ruleを生成し、自動承認して有効化する仕組みは未実装です。** Promotionは判断原則であり、ルール化した結果が安全性・説明可能性・保守性を上げるかを評価しながら進める領域です。

## Review Judgment as Code：判断基準をProviderから切り離す

Judgment Placementとセットになるのが、River Reviewの中心概念 **Review Judgment as Code** です。

判断基準をProvider側のpromptやモデル挙動に置く構成では、チーム固有の基準をProviderから独立して版管理・検証しにくくなります。

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

これにより、

- 誰が判断基準を変えたか追跡できる
- PRで基準そのものをレビューできる
- fixture / golden outputで回帰確認できる
- モデルやCoding Agentを変えても基準を再利用できる

という状態にできます。

Review Judgment as Codeが「**何を判断するか**」を資産化する考え方なら、Judgment Placementは「**その判断をどこで実行するか**」を決める原則です。

## 4層にはそれぞれ別の失敗モードがある

Judgment Placementは「Deterministicへ寄せるほど成熟している」というモデルではありません。

| 層 | 強み | 主な失敗モード |
| --- | --- | --- |
| Deterministic | 高速・再現可能 | ルール自体が間違う、実行境界が危険 |
| Heuristic | 安価に候補抽出できる | false positive / false negative |
| Agentic Review | 意味・Contextを扱える | 揺らぎ、hallucination、コスト |
| Human Judgment | 責任・価値判断を扱える | 待ち時間、認知負荷、属人化 |

そのため、判断をよりDeterministicな層へ移すのは、**同等以上の安全性・説明可能性・保守性を維持できる場合だけ**です。

意味的な判断を無理にRegexへ落とす必要はありません。逆に、機械的に証明できる事実をLLMへ戻して再審査する必要もありません。

### Promotionを見送る条件

判断をよりDeterministicな層へ移せそうに見えても、次のような場合はPromotionを急ぎません。

- 条件をまだ安定して明文化できない
- rule / checkerへ落とすと、元の意味や重要な例外を失う
- deterministic化によって安全性・説明可能性・保守性が下がる
- 責任・価値・不可逆性を伴い、人間が判断主体である必要がある

この場合はAgentic ReviewやHuman Judgmentへ残し、fixture / evaluationや実運用のEvidenceを増やします。**「機械化できそう」ではなく、「より再現可能な層へ安全に移せる」ことがPromotionの条件**です。

## 検証結果：どこまで実装済みか

記事内の設計と現在のRiver Reviewを混同しないため、検証対象commit `56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9` で確認した状態を整理します。

| 項目 | 状態 |
| --- | --- |
| Judgment Placementの4層定義 | ドキュメント化済み |
| Human Judgment Focusとの2軸整理 | ドキュメント化済み |
| Skill `evaluationType` | 実装済み |
| `deterministicGate` schema | 実装済み |
| deterministic `strict_block` | 実装済み |
| 静的解析とAI Reviewの責務分離 | review ruleとして運用済み |
| host-trusted allowlist / sandbox | 実装済み |
| Deterministic Commandのreview pipeline呼び出し | feature gate付きで配線済み |
| Review → Rule Promotion | 設計原則として定義済み |
| FindingからRuleを自動生成・自動有効化 | 未実装 |
| Evidence-Grounded Adversarial Review | Phase 1a deterministic skeletonまでmainへ導入済み |
| Semantic Change Conflict Review | 拡張検討中 |
| Agent Trajectory Review | 拡張検討中 |

この記事では、Judgment Placement導入による**AIレビュー費用の削減率やレビュー精度の改善率は計測していません**。したがって、ここで主張しているのは「責務分離と実装境界が存在すること」であり、「この設計で何%安く / 正確になった」という効果ではありません。

この区別は重要です。設計思想が先行している領域を「すでに完成した機能」として説明すると、OSSの記事として追試性を失います。

## 最小導入：レビュー観点を1つ分類してみる

River Reviewを導入しなくても、Judgment Placement自体は使えます。最初からレビュー全体を作り替える必要はありません。

まず、繰り返し出ているレビュー観点を1つ選び、次の順で考えます。

1. **既存のcompiler / test / linter / checkerで検査できないか**
2. **deterministicなrule / schema / commandで検査できないか**
3. **heuristic detectorで高精度に候補抽出できないか**
4. **複数Artifactの意味理解が必要ならAgentic Reviewへ置く**
5. **責任・価値・不可逆性を伴うならHuman Judgmentを残す**
6. **運用結果をRiverbed / fixture / evaluationへ戻し、配置が適切だったか再評価する**

そのうえで、同じHuman / Agentic Judgmentが繰り返され、条件を安定して明文化できるようになったらPromotionを検討します。

レビュー項目を増やす前に、次の1行を置くのがおすすめです。

> **この判断、本当にLLMが必要なのか？**

## まとめ

Swizec Teller氏の記事は、「LLMが繰り返し指摘する決定論的な問題をLinterへ移す」という実践的な問題提起でした。

River Reviewで取り組んでいるJudgment Placementは、その問いをもう少し広く捉えています。

```text
証明できる      → Deterministic
ルールで拾える  → Heuristic
意味理解が必要  → Agentic Review
責任が必要      → Human Judgment
```

そして、分類して終わりではありません。

レビューで同じ判断を繰り返すなら、条件を明文化し、より再現可能な仕組みへ移していく。一方で、責任を伴う判断や意味的な判断を無理に機械化しない。

目指しているのは、AIにより多くレビューさせることではなく、**AI・ルール・テスト・人間が、それぞれ得意な判断だけを担当できる状態を作ること**です。

レビューを毎回消費されるコメントから、次の判断を減らす組織の資産へ変える。

それが、現在のRiver ReviewでJudgment Placementを設計・実装している理由です。

## 参考

- [Stop burning tokens on code review - Swizec Teller](https://swizec.com/blog/stop-burning-tokens-on-code-review)
- [River Review - GitHub](https://github.com/s977043/river-review)
- [Judgment Placement - River Review](https://river-review.the3396.com/explanation/judgment-placement/)
- [Judgment Placement - 検証対象commit](https://github.com/s977043/river-review/blob/56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9/pages/explanation/judgment-placement.md)
- [Human Judgment Focus - River Review](https://river-review.the3396.com/explanation/human-judgment-focus/)
- [River Review Skill Schema - 検証対象commit](https://github.com/s977043/river-review/blob/56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9/pages/reference/skill-schema.md)
- [Artifact Input Contract - River Review](https://river-review.the3396.com/reference/artifact-input-contract/)
- [deterministic-gate.mjs - 検証対象commit](https://github.com/s977043/river-review/blob/56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9/src/lib/deterministic-gate.mjs)
- [deterministic-command-orchestrator.mjs - 検証対象commit](https://github.com/s977043/river-review/blob/56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9/src/lib/deterministic-command-orchestrator.mjs)
- [finding-critic.mjs - 検証対象commit](https://github.com/s977043/river-review/blob/56e0ae4c4e03efd7f5b254fbe2eabde22edbd7c9/src/lib/finding-critic.mjs)
- [AIコードレビューを仕組みにする: 指摘の分類・記録・改善の回し方](https://zenn.dev/mine_take/articles/ai-code-review-feedback-ops)

---

普段は X（[@mine_take](https://x.com/mine_take)）で、AIコーディングをチーム開発に乗せる運用設計について発信している。
