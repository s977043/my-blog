# Greenを疑う — EvalとFalse Green

GuardやEvalを入れると、画面にはgreenが増えます。

CI PASS。doctor OK。registered: YES。review PASS。

しかし本当に知りたいのは、

> **greenかどうかではなく、そのgreenが何を証明しているか。**

です。

PlanGate自身では、greenだったのに守りたい性質が成立していないケースが何度もありました。

この章では、それらを個別バグとしてではなく、4つのFalse Greenパターンとして整理します。

## False Greenを4つに分ける

このBookではFalse Greenを、

> **検査や状態表示は成功を示しているが、判断したいClaimを実挙動で確認できていない状態**

と呼びます。

PlanGate公式用語ではなく、この章で使う整理です。

4つのパターンにすると再利用しやすくなります。

| パターン | 何がずれるか | PlanGateの例 |
| --- | --- | --- |
| Proxy Green | 代理指標と実挙動 | #1085 |
| Coverage Green | 検査範囲と現実の入力空間 | #1173 / #1277 |
| Classifier Green | 判定ロジックとcommand semantics | #1326 |
| Observer Green | 検査と観測対象の非干渉性 | #1169 |

## 1. Proxy Green — 「ある」を「効いている」と扱う

Issue #1085では、Codex pluginが実際には1件もロードされていないのにdoctorが、

~~~text
registered: YES
~~~

を返していました。

判定根拠はmarketplace cache directoryの存在でした。

しかし、確認したかったClaimは、

> Codex runtimeがPlanGate pluginを実際に利用できるか。

です。

~~~text
proxy
cache directory exists

claim
plugin works in runtime
~~~

がずれていました。

Source:
- https://github.com/s977043/PlanGate/issues/1085

この失敗を一般化すると、

~~~text
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
~~~

です。

現行ai-loop V2のHarnessManifestでは、Runtime Activationをこの6段階に分けています。

Verifier / Gateの改善では、単にcomponentが存在・発火しただけではなく、Evidenceが実際のDecisionへ影響した `influenced_decision` まで要求する設計です。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/harness-manifest.md

### 持ち帰る原則

> **存在確認を、動作確認の代わりにしない。**

「設定した」「登録した」「呼び出した」は、それぞれ別のClaimです。

## 2. Coverage Green — 見ている範囲だけでは正しかった

Coverage Greenには二つの形があります。

### 検査同士は一致していた

Issue #1173では、plugin配布allowlistが2箇所にありました。

既存testは、

~~~text
allowlist A == allowlist B
~~~

を確認し、PASSしていました。

しかし、実体の `scripts/ai-loop/*.py` は30ファイル、allowlistは28ファイル。

2ファイルが配布対象から漏れていました。

~~~text
A == B
~~~

でも、

~~~text
A == reality
~~~

とは限りません。

Source:
- https://github.com/s977043/PlanGate/issues/1173

### 代表経路では動いていた

Issue #1277では、Hardening Override Guardがrepository rootでは正しくBLOCKしていました。

一方、linked worktreeではpath normalizationの前提が崩れ、同じ保護対象fileをallowしていました。

Source:
- https://github.com/s977043/PlanGate/issues/1277

つまり、

~~~text
root pathでPASS
≠
保証したいpath class全体でPASS
~~~

です。

### 持ち帰る原則

> **Evalの対象集合を明示する。**

たとえば、

- repository root / linked worktree
- Claude / Codex
- local / plugin distribution
- Bash / Edit / Write
- current HEAD / stale HEAD

のように、保証対象となる入力クラスを先に決めます。

「1つの代表例で動いた」を全体保証へ広げません。

## 3. Classifier Green — 検出したが、意味を判定していなかった

Issue #1326では、force pushを止めるGuardが安全なcommandまでBLOCKしました。

`git push` と `--force` が同じcommand segmentに属するかを見ず、文字列全体から独立に探していたためです。

結果として、

- 別commandの `--force`
- echo内の `+`
- 実行されない文字列

まで危険操作と分類されました。

Source:
- https://github.com/s977043/PlanGate/issues/1326

ここで必要なのは、単にdangerous caseがBLOCKされるテストではありません。

### Positive Control

本当に止めたい入力を止める。

~~~text
git push --force-with-lease origin main
→ BLOCK
~~~

### Negative Control

通したい入力を通す。

~~~text
git push origin HEAD && echo a + b
→ allow
~~~

です。

~~~text
all dangerous blocked
~~~

だけを見ると、全部BLOCKするGuardも高得点になります。

### 持ち帰る原則

> **検出力と誤検出率を同時に見る。**

安全系ではfail-closedが重要でも、false positiveが増えすぎると、利用者やAgentは迂回経路を作り始めます。

Guard品質は「何件blockしたか」ではなく、意図したsemanticsをどれだけ正しく分類できるかで見ます。

## 4. Observer Green — Eval自身が対象を変えていた

Issue #1169では、read-only検査のつもりでPython scriptを `sh` から起動した結果、docstring内のbacktickがshell command substitutionとして評価されました。

install scriptが実行され、`.codex/skills/**` の34ファイルが書き換わりました。

Source:
- https://github.com/s977043/PlanGate/issues/1169

検査のつもりの操作が、観測対象を変更していたわけです。

~~~text
before
評価対象A

evalを実行
↓
対象を書き換える

after
評価対象Bを測定
~~~

この状態では「検査がPASSした」というEvidence自体の意味が弱くなります。

### 持ち帰る原則

> **Evalの副作用も脅威モデルに入れる。**

read-onlyを期待する検査では、

- working treeが変わっていないか
- external stateを更新していないか
- credentialsやcacheを汚していないか

も確認対象になります。

## False Greenの本質は「ClaimとOracleのずれ」

4つのパターンは違って見えます。

しかし、共通しているのは、

~~~text
判断したいClaim
        ≠
検査が実際に測っているもの
~~~

です。

だからEvalを作るとき、最初にtest codeを書くのではなく、Claimを固定します。

## 最小Eval Contract

このBookでは、Harness Evalを最低限次の6項目で考えます。

| 項目 | 問い |
| --- | --- |
| Claim | 何が成立したと言いたいのか |
| Target Identity | どのHarness / commit / runtimeを評価しているか |
| Oracle | 何を見ればClaimを判定できるか |
| Controls | known-badとknown-goodの両方があるか |
| Coverage | どの入力クラスを保証し、何を保証しないか |
| Promotion Boundary | 誰が評価条件を固定し、誰が採用を決めるか |

たとえばplugin activationなら、

~~~text
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
~~~

となります。

この6項目がないEvalは、greenになっても「何のgreenか」が曖昧になりやすくなります。

## Detect → Reproduce → Fix → Regression Guard

実運用でfailureを見つけたら、次の順にします。

### Detect

違和感や失敗を観測する。

### Reproduce

最小ケースへ落とし、

~~~text
input
expected
actual
target identity
~~~

を固定します。

### Fix

fixtureだけを通すpatchではなく、failure classへ修正を当てます。

### Regression Guard

再現ケースを継続実行できるfixture / test / canaryへ残します。

ここで重要なのが、**修正前の実装で本当にFAILすること**です。

新しいtestが最初から旧実装でもPASSするなら、検出力を証明していません。

## Harness改善Candidateは自分を裁かない

VerifierやEval自身を変更すると、さらに難しくなります。

変更後Verifierが自分自身を評価して、

> PASSしました。

と言っても、それだけでは採用根拠になりません。

現行ai-loop V2のEvaluation Trust Boundaryでは、

> **Candidate cannot modify the authority that judges the candidate.**

をinvariantにしています。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/evaluation-trust-boundary.md

つまりCandidateは、自分の採用評価中に、

- Evaluation Harness
- sealed / held-out fixtures
- Promotion Policy
- threshold
- 自分を裁くprotected Gate
- Human-owned Boundary

を都合よく変更できません。

## Evalを変更するときは、外側のOracleを持つ

Verifier Candidateを評価するなら、変更後Verifierの出力だけでなく、

- stable meta-verifier
- known mutants
- sealed positive / negative fixtures
- baseline detection power

のような外側の材料を使います。

原則はシンプルです。

> **評価対象と、評価を成立させるAuthorityを分離する。**

## PASS / FAIL / INCONCLUSIVEを分ける

Evidenceが足りないとき、

~~~text
FAILしていない
→ PASS
~~~

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

## Eval条件はCandidateより先に固定する

結果を見たあとで、

- thresholdを下げる
- failing fixtureを対象外にする
- trial数を減らす
- verifier setを狭める

と、EvalはCandidateを採用するための説明へ変わります。

そのためEvaluation Trust Boundaryでは、Candidate実装前にevaluation planを固定する方針を持っています。

読者が自分のHarnessで最小限取り入れるなら、

~~~text
baseline
known-bad
known-good
promotion threshold
critical regression
~~~

だけでも先に固定します。

結果を見て条件を変えたら、新しいEvalとしてやり直します。

## 改善を自動化してもPromotionは分ける

ai-loop V2のRatchetは、failureからHarness改善候補を作り、paired evaluationする方向へ進んでいます。

~~~text
Failure Evidence
→ Improvement Candidate
→ evaluator-observed delta
→ known-bad + negative control
→ Experiment Result
→ Promotion Decision
→ Human-owned Production Promotion
~~~

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/ratchet-traceability.md

Candidate生成やEvalを自動化しても、Production promotionまで同じ主体に渡しません。

第12章の、

~~~text
Autonomy != Authority
~~~

はHarness改善にも適用されます。

## この章で持ち帰ること

Harness Evalで最初に問うのは、

> testはいくつあるか。

ではありません。

> **そのgreenは、どのClaimを、どのOracleと対照で確かめた結果なのか。**

です。

False Greenを避けるために、

1. Proxyで実挙動を代用しない
2. 保証対象のCoverageを明示する
3. Positive / Negative Controlを持つ
4. Eval自身の副作用を見る
5. failureをregression fixtureへ固定する
6. Candidateと評価Authorityを分離する
7. 分からない状態をINCONCLUSIVEにする

という順で考えます。

> **Harnessもまた、信頼する対象ではなく、検証し続ける対象です。**

次の第7部では、この仕組みを最初から全部導入せず、必要なLevelから段階的に持ち込む方法を扱います。
