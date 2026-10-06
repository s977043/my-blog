---
title: "Greenを疑う — EvalとFalse Green"
---

GuardやEvalを入れると、画面にはgreenが増えます。

CI PASS。doctor OK。registered: YES。review PASS。

しかし本当に知りたいのは、

> **greenかどうかではなく、そのgreenが何を証明しているか。**

です。

PlanGate自身では、greenだったのに守りたい性質が成立していないケースが何度もありました。

この章では、それらを個別バグとしてではなく、4つのFalse Greenパターンとして整理します。

## この章の地図

この章は長いため、先に全体像を置きます。

```text
前半
False Greenを4パターンで見分ける
→ Proxy / Coverage / Classifier / Observer

中盤
失敗を改善へ変える
→ Claim / Oracle / Controls / Regression

後半
改善Candidateを安全に採用する
→ Trust Boundary / held-out Eval / Promotion / Recurrence
```

最初に読むなら前半と「最小Eval Contract」までで十分です。

Harness改善そのものを設計するときに、後半のEvaluation Trust Boundary以降へ進んでください。

## False Greenを4つに分ける

本書ではFalse Greenを、

> **検査や状態表示は成功を示しているが、判断したいClaimを実挙動で確認できていない状態**

と呼びます。

PlanGate公式用語ではなく、この章で使う整理です。

4つのパターンにすると再利用しやすくなります。

| パターン | 何がずれるか | PlanGateの例 |
| --- | --- | --- |
| Proxy Green | 代理指標と実挙動 | #1085 |
| Coverage Green | 検査範囲と現実の入力空間 | #1173 / #1277 |
| Classifier Green | 判定ロジックとコマンドsemantics | #1326 |
| Observer Green | 検査と観測対象の非干渉性 | #1169 |

### 1. Proxy Green — 「ある」を「効いている」と扱う

Issue #1085では、Codex pluginが実際には1件もロードされていないのにdoctorが、

```text
registered: YES
```

を返していました。

判定根拠はmarketplace cache directoryの存在でした。

しかし、確認したかったClaimは、

> Codex runtimeがPlanGate pluginを実際に利用できるか。

です。

```text
proxy
cache directory exists

claim
plugin works in runtime
```

がずれていました。

Sources:
- https://github.com/s977043/PlanGate/issues/1085

この失敗を一般化すると、

```text
installed
≠
registered
≠
selected
≠
fired
≠
produced evidence
≠
influenced decision
```

です。

現行ai-loop V2のHarnessManifestでは、Runtime Activationをこの6段階に分けています。

Verifier / Gateの改善では、単にcomponentが存在・発火しただけではなく、Evidenceが実際のDecisionへ影響した `influenced_decision` まで要求する設計です。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/harness-manifest.md

持ち帰る原則は「存在確認を、動作確認の代わりにしない。」です。

「設定した」「登録した」「呼び出した」は、それぞれ別のClaimです。

### 2. Coverage Green — 見ている範囲だけでは正しかった

Coverage Greenには二つの形があります。

#### 検査同士は一致していた

Issue #1173では、plugin配布allowlistが2箇所にありました。

既存テストは、

```text
allowlist A == allowlist B
```

を確認し、PASSしていました。

しかし、実体の `scripts/ai-loop/*.py` は30ファイル、allowlistは28ファイル。

2ファイルが配布対象から漏れていました。

```text
A == B
```

でも、

```text
A == reality
```

とは限りません。

Sources:
- https://github.com/s977043/PlanGate/issues/1173

#### 代表経路では動いていた

Issue #1277では、Hardening Override Guardがrepository rootでは正しくBLOCKしていました。

一方、linked worktreeではpath normalizationの前提が崩れ、同じ保護対象fileをallowしていました。

Sources:
- https://github.com/s977043/PlanGate/issues/1277

つまり、

```text
root pathでPASS
≠
保証したいpath class全体でPASS
```

です。

持ち帰る原則は「Evalの対象集合を明示する。」です。

たとえば、

- repository root / linked worktree
- Claude / Codex
- local / plugin distribution
- Bash / Edit / Write
- current HEAD / stale HEAD

のように、保証対象となる入力クラスを先に決めます。

「1つの代表例で動いた」を全体保証へ広げません。

### 3. Classifier Green — 検出したが、意味を判定していなかった

Issue #1326では、force pushを止めるGuardが安全なコマンドまでBLOCKしました。

`git push` と `--force` が同じコマンドsegmentに属するかを見ず、文字列全体から独立に探していたためです。

結果として、

- 別コマンドの `--force`
- echo内の `+`
- 実行されない文字列

まで危険操作と分類されました。

Sources:
- https://github.com/s977043/PlanGate/issues/1326

ここで必要なのは、単にdangerous caseがBLOCKされるテストではありません。

#### Positive Control

本当に止めたい入力を止める。

```text
git push --force-with-lease origin main
→ BLOCK
```

#### Negative Control

通したい入力を通す。

```text
git push origin HEAD && echo a + b
→ allow
```

です。

```text
all dangerous blocked
```

だけを見ると、全部BLOCKするGuardも高得点になります。

持ち帰る原則は「検出力と誤検出率を同時に見る。」です。

安全系ではfail-closedが重要でも、false positiveが増えすぎると、利用者やAgentは迂回経路を作り始めます。

Guard品質は「何件blockしたか」ではなく、意図したsemanticsをどれだけ正しく分類できるかで見ます。

### 4. Observer Green — Eval自身が対象を変えていた

Issue #1169では、read-only検査のつもりでPython scriptを `sh` から起動した結果、docstring内のbacktickがshellコマンドsubstitutionとして評価されました。

install scriptが実行され、`.codex/skills/**` の34ファイルが書き換わりました。

Sources:
- https://github.com/s977043/PlanGate/issues/1169

検査のつもりの操作が、観測対象を変更していたわけです。

```text
before
評価対象A

evalを実行
↓
対象を書き換える

after
評価対象Bを測定
```

この状態では「検査がPASSした」というEvidence自体の意味が弱くなります。

持ち帰る原則は「Evalの副作用も脅威モデルに入れる。」です。

read-onlyを期待する検査では、

- working treeが変わっていないか
- external stateを更新していないか
- credentialsやcacheを汚していないか

も確認対象になります。

## False Greenの本質は「ClaimとOracleのずれ」

4つのパターンは違って見えます。

しかし、共通しているのは、

```text
判断したいClaim
        ≠
検査が実際に測っているもの
```

です。

だからEvalを作るとき、最初にテストcodeを書くのではなく、Claimを固定します。

## 最小Eval Contract

本書では、Harness Evalを最低限次の6項目で考えます。

| 項目 | 問い |
| --- | --- |
| Claim | 何が成立したと言いたいのか |
| Target Identity | どのHarness / commit / runtimeを評価しているか |
| Oracle | 何を見ればClaimを判定できるか |
| Controls | known-badとknown-goodの両方があるか |
| Coverage | どの入力クラスを保証し、何を保証しないか |
| Promotion Boundary | 誰が評価条件を固定し、誰が採用を決めるか |

たとえばplugin activationなら、

```text
Claim
pluginがruntimeで実際に利用できる

Target
candidate HarnessManifest

Oracle
runtime activation evidence

Controls
manifestあり → loadされる
manifestなし → loadされない

Coverage
isolated Codex runtime

Promotion
Candidate自身の自己申告だけでは採用しない
```

となります。

この6項目がないEvalは、greenになっても「何のgreenか」が曖昧になりやすくなります。

## Detect → Reproduce → Fix → Regression Guard

実運用で失敗を見つけたら、次の順にします。

1. **Detect**: 違和感や失敗を観測する
2. **Reproduce**: 最小ケースへ落とし、次を固定する

```text
input
expected
actual
target identity
```

3. **Fix**: fixtureだけを通すpatchではなく、failure classへ修正を当てる
4. **Regression Guard**: 再現ケースを継続実行できるfixture / テスト / canaryへ残す

ここで重要なのが、**修正前の実装で本当にFAILすること**です。

新しいテストが最初から旧実装でもPASSするなら、検出力を証明していません。

### Regression suiteを「事故の墓場」にしない

失敗を再現テストへ残すのは重要です。

しかし、事故のたびにfixtureを1件ずつ永久追加すると、テストsuiteは過去の事故履歴そのものになります。

```text
incident A
→ test A

incident B
→ test B

incident C
→ test C
```

だけでは、なぜ別テストなのか、何を守っているのか分からなくなります。

そこでfixtureを、個別Incidentだけでなく**failure class / invariant**へ結びつけます。

たとえば#1326なら、

> 「この特定コマンドをallowする」

だけでなく、

> **`git push` とforce tokenが同じコマンドsegmentに属するときだけdangerousと分類する**

というinvariantにします。

すると、新しいcaseが見つかっても、

- 既存classの境界値として追加するのか
- 新しいfailure classなのか
- 既存fixtureと統合できるのか

を判断できます。

### Regression assetを見直す

定期的に次も見ます。

- 同じinvariantを重複テストしていないか
- fixtureの前提がもう存在しないのに残っていないか
- known-badが本当にbaselineでFAILするか
- known-goodが過剰にBLOCKされていないか
- テスト自体が対象コードの内部実装へ結合しすぎていないか

Regression Guardも保守対象です。

## Evaluation Trust Boundaryを作る

### Harness改善Candidateは自分を裁かない

VerifierやEval自身を変更すると、さらに難しくなります。

変更後Verifierが自分自身を評価して、

> PASSしました。

と言っても、それだけでは採用根拠になりません。

現行ai-loop V2のEvaluation Trust Boundaryでは、

> **Candidate cannot modify the authority that judges the candidate.**

をinvariantにしています。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/evaluation-trust-boundary.md

つまりCandidateは、自分の採用評価中に、

- Evaluation Harness
- sealed / held-out fixtures
- Promotion Policy
- threshold
- 自分を裁くprotected Gate
- Human-owned Boundary

を都合よく変更できません。

### Evalを変更するときは、外側のOracleを持つ

Verifier Candidateを評価するなら、変更後Verifierの出力だけでなく、

- stable meta-verifier
- known mutants
- sealed positive / negative fixtures
- baseline detection power

のような外側の材料を使います。

原則はシンプルです。

> **評価対象と、評価を成立させるAuthorityを分離する。**

### known fixtureだけに最適化しない

公開されたregression fixtureだけを見てCandidateを改善すると、そのケースだけ通るpatchを作ることもできます。

```text
known-badを知る
↓
そのinputだけ特別扱い
↓
fixture PASS
↓
未知の同型failureは残る
```

そこで現行V2のEvaluation Trust Boundaryでは、Candidate作成前にIDを固定したsealed / held-out fixtureを評価Authority側で持つ考え方があります。

Candidateはそのfixtureを自分で変更できません。

目的は「秘密のテストを作ること」ではありません。

> **改善が既知ケースの暗記ではなく、failure classへ効いているかを見る。**

ためです。

known fixtureは開発・再現に使い、独立したfixtureはpromotion evaluationへ使う。

この分離が、Evalへの過学習を減らします。

### PASS / FAIL / INCONCLUSIVEを分ける

Evidenceが足りないとき、

```text
FAILしていない
→ PASS
```

にしないことも重要です。

現行V2ではPromotion Decisionを、

- PASS
- FAIL
- INCONCLUSIVE

へ分けています。

たとえば、

- baseline identityが取れない
- verifierが利用不能
- activation evidenceが不足
- sealed fixtureのintegrityが確認できない
- trial数不足

ならINCONCLUSIVEです。

INCONCLUSIVEはFAILとは違いますが、Promotion Readyでもありません。

> **分からない状態をgreenへ変換しない。**

ための値です。

### Eval条件はCandidateより先に固定する

結果を見たあとで、

- thresholdを下げる
- failing fixtureを対象外にする
- trial数を減らす
- verifier setを狭める

と、EvalはCandidateを採用するための説明へ変わります。

そのためEvaluation Trust Boundaryでは、Candidate実装前にevaluation planを固定する方針を持っています。

読者が自分のHarnessで最小限取り入れるなら、

```text
baseline
known-bad
known-good
promotion threshold
critical regression
```

だけでも先に固定します。

結果を見て条件を変えたら、新しいEvalとしてやり直します。

## 改善Candidateを最小化してPromotionする

### 失敗が出ても、最初に新しいAgentやHookを作らない

Harness改善では、問題を見つけると新しい仕組みを足したくなります。

しかし、componentが増えるほど、

- routing
- distribution
- activation
- ownership
- Eval

の面積も増えます。

現行Ratchet Traceabilityでは、改善候補を考える順序として、概ね次を置いています。

1. 既存configurationの是正
2. deterministicテスト / lint / invariant
3. 既存Verifierの改善
4. reuse / update / merge / deprecate
5. 既存ownershipでは表現できない場合だけcreate

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/ratchet-traceability.md

これは、失敗からすぐ新しいSkillやAgentを生やさないための **Create Last** 原則と読めます。

Harness改善そのものがinstruction debtを増やさないようにします。

### 改善を自動化してもPromotionは分ける

ai-loop V2のRatchetは、失敗からHarness改善候補を作り、paired evaluationする方向へ進んでいます。

```text
Failure Evidence
→ Improvement Candidate
→ evaluator-observed delta
→ known-bad + negative control
→ Experiment Result
→ Promotion Decision
→ Human-owned Production Promotion
```

Candidate生成やEvalを自動化しても、Production promotionまで同じ主体に渡しません。

第12章の、

```text
Autonomy != Authority
```

はHarness改善にも適用されます。

## Promotion後に「再発したか」を観測する

paired evaluationでPASSしても、改善の学習は終わりではありません。

productionで同じ失敗パターンが再発していないかを観測します。

現行Ratchet Traceabilityでは、counterfactualな

```text
prevented_recurrence_count
```

は記録しない方針です。

「この改善で事故を10件防いだ」のような、観測できない数字を作らないためです。

代わりに最小の観測として、

```text
eligible_run_count = N
matching_failure_run_count = M
same_pattern_recurrence_rate = M / N
```

を置きます。

しかもclassifierが変われば比較条件も変わるため、同じclassifier digestで観測したrunだけを比較対象にします。

ここで言えるのは、

> **同じ定義で観測した失敗パターンが、その後どれくらい発生したか。**

までです。

原因と効果を過度に断定しません。

## 改善ループを閉じる

ここまでをつなぐと、Harness Improvement Loopは次のようになります。

```text
Production Failure
        ↓
Failure Evidence
        ↓
failure classを特定
        ↓
known-bad / known-goodを再現
        ↓
最小のImprovement Candidate
        ↓
independent / sealed evaluation
        ↓
PASS / FAIL / INCONCLUSIVE
        ↓
separate Promotion Authority
        ↓
Production observation
        ↓
same-pattern recurrenceを測る
        └──────────────→ 次の改善
```

失敗から学び、独立に評価し、採用し、実運用で再び観測するところまでが一つのloopです。

## この章で持ち帰ること

Harness Evalで最初に問うのは、

> テストはいくつあるか。

ではありません。

> **そのgreenは、どのClaimを、どのOracleと対照で確かめた結果なのか。**

です。

False Greenを避けるために、

1. Proxyで実挙動を代用しない
2. 保証対象のCoverageを明示する
3. Positive / Negative Controlを持つ
4. Eval自身の副作用を見る
5. 失敗をregression fixtureへ固定する
6. Candidateと評価Authorityを分離する
7. 分からない状態をINCONCLUSIVEにする
8. fixtureをfailure class / invariantへ整理する
9. promotion後も同じpatternの再発を観測する

という順で考えます。

> **Harnessもまた、信頼する対象ではなく、検証し続ける対象です。**

次の第7部では、この仕組みを最初から全部導入せず、必要なBoundaryと運用範囲から段階的に持ち込む方法を扱います。
