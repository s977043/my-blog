# Greenを疑う — EvalとFalse Green

AI開発にGuardやEvalを追加すると、安心感が増します。

CIはgreen。doctorもgreen。reviewもPASS。

しかし、greenという色は、

> **「検査が通った」**

ことしか直接には示しません。

本当に知りたいのは、

> **その検査が、守りたい性質を実際に測っているか。**

です。

この差を見落とすと、False Greenが生まれます。

## False Greenとは何か

このBookではFalse Greenを、

> **検査や状態表示は成功を示しているが、守りたい実挙動・契約・対象範囲は成立していない状態**

と呼びます。

これはPlanGate固有の公式用語ではなく、この章で複数の失敗をまとめるための呼び方です。

重要なのは「テストがバグっていた」という単純な話ではありません。

False Greenには、いくつか違う構造があります。

## 1. 存在を動作の証拠にしていた

PlanGate Issue #1085では、Codex pluginが実際には1件もロードされていないのに、doctorが

~~~text
registered: YES
~~~

を返していました。

原因は、判定が「marketplace cache directoryが存在するか」を見ていたことです。

しかし本当に確認したかったのは、

> CodexがPlanGate pluginのskillを実際にロードし、利用できる状態か。

でした。

~~~text
測っていたもの
= cache directoryの存在

知りたかったもの
= runtimeでpluginが実際にloadされたか
~~~

この二つがずれていました。

さらにvalidatorでもloaderでもplugin成立条件を満たしていないことが実測され、単なる表示上の問題ではないことが確認されています。

Source:
- https://github.com/s977043/PlanGate/issues/1085

### 教訓

Artifactや設定の**存在**を、runtime behaviorのEvidenceへ昇格させない。

~~~text
file exists
≠
loaded

registered
≠
fired

fired
≠
decisionへ影響した
~~~

という段階を分けます。

## 2. 検査同士は整合していたが、現実を見ていなかった

Issue #1173では、pluginへ配布するPython fileのallowlistが2箇所にありました。

既存testは、この2つのallowlistが一致していることを確認していました。

そしてtestはPASSしていました。

問題は、

> **どちらのallowlistも、実際の `scripts/ai-loop/*.py` 一覧と比較していなかった**

ことです。

実体は30ファイル、allowlistは28ファイル。

`discovery.py` と `test_discovery.py` が配布されていませんでした。

しかし、

~~~text
allowlist A == allowlist B
~~~

は成立しているのでCIはgreenでした。

これは自己整合性を測っていて、現実との整合性を測っていない例です。

Source:
- https://github.com/s977043/PlanGate/issues/1173

### 教訓

比較対象が同じ誤りを共有していないかを見る。

~~~text
configuration A
↔ configuration B
~~~

だけではなく、

~~~text
configuration
↔ actual filesystem / runtime / external state
~~~

との対照が必要です。

## 3. 入力空間の一部しか見ていなかった

Issue #1277では、Hardening Override対象fileを止めるEH-3が通常repository rootでは機能していました。

しかしlinked worktreeではpath normalizationの前提が崩れ、

- root側 `CLAUDE.md` → BLOCK
- worktree側 `CLAUDE.md` → allow

となっていました。

Guardは存在していました。

通常経路のtestもありました。

それでも、「worktree」という実際に日常利用される入力空間が検証されていませんでした。

Source:
- https://github.com/s977043/PlanGate/issues/1277

### 教訓

Guardを評価するときは、

> 正常な1入力で動いたか

ではなく、

> **どの入力空間を保証対象にするのか**

を先に定義します。

path、worktree、shell、runtime、provider、distribution形態などは、別の入力クラスになりえます。

## 4. 危険を止めたが、安全まで止めていた

Issue #1326は逆方向の失敗です。

protected branchでforce pushを止めるEH-12が、

- `git worktree remove --force`
- echo内の文字列
- `git push ... && echo a + b`

のような安全なcommandまでblockしていました。

原因は、`git push` と `--force` や `+` が同じcommand segmentに属するかを見ず、文字列全体から独立に探していたことです。

Source:
- https://github.com/s977043/PlanGate/issues/1326

このケースでは、危険操作を止めるpositive caseだけ見ていればgreenになります。

しかしGuard品質にはもう一つ必要です。

> **安全な操作を通すこと。**

### Positive ControlとNegative Control

たとえば、

~~~text
Positive Control
git push --force-with-lease origin main
→ BLOCKされるべき

Negative Control
git push origin HEAD && echo a + b
→ allowされるべき
~~~

の両方を持ちます。

「何を止めるか」と「何を止めないか」をセットで検証します。

## 5. 検査そのものが副作用を持っていた

Issue #1169では、read-only検査のつもりでPython scriptを `sh` から起動すると、module docstring内のbacktickがshell command substitutionとして評価されました。

その結果、install scriptが実行され、`.codex/skills/**` の34ファイルが書き換わりました。

Source:
- https://github.com/s977043/PlanGate/issues/1169

これは、

> 検査結果が正しいか

以前の問題です。

> **検査そのものが観測対象を変えていないか。**

という問いが必要になります。

measurementがsystemへ副作用を与えると、Evidence取得そのものが状態を変えます。

## 5つの事例に共通すること

ここまでの失敗を並べると、共通構造が見えます。

| 事例 | greenが示していたもの | 本当に知りたかったもの |
| --- | --- | --- |
| #1085 | cacheが存在 | pluginがruntimeで利用可能 |
| #1173 | allowlist同士が一致 | 配布対象が実体と一致 |
| #1277 | root経路でGuardが動く | 保証対象の全主要path classで動く |
| #1326 | dangerous caseをblock | dangerousをblockしsafeをallow |
| #1169 | check scriptを実行 | read-onlyに検査できる |

False Greenの本質は、

> **測定値と、本当に判断したいClaimがずれていること。**

です。

## Detect → Reproduce → Fix → Regression Guard

Harnessの失敗を見つけたとき、このBookでは次の4段階で扱います。

### 1. Detect

実運用で違和感や失敗を観測する。

- 本来loadされるはずなのに動かない
- Guardが素通りした
- safe commandが止まった
- 配布先だけ壊れた

この段階では原因を決めつけません。

### 2. Reproduce

最小ケースへ落とします。

~~~text
input
expected
actual
environment / identity
~~~

を固定し、再現できる形にします。

特に重要なのが対照です。

- known-badが失敗する
- known-goodが成功する

を並べます。

### 3. Fix

原因へ修正を入れます。

ただし、「今のfixtureが通るようにする」だけでは不十分です。

なぜその失敗クラスが起きたかを見ます。

たとえば、

- path normalizationの前提
- command tokenization
- runtime activation
- allowlist ownership

のように、失敗クラスへ修正を当てます。

### 4. Regression Guard

再現ケースをtest / fixture / canaryへ残します。

~~~text
失敗を発見
↓
人間が一度直す
↓
忘れる
~~~

ではなく、

~~~text
失敗を発見
↓
再現fixture
↓
修正
↓
fixtureを継続実行
~~~

へ変えます。

ここで初めて、経験がHarnessの能力になります。

## 「修正後にgreen」だけでもまだ足りない

ここでもう一段問題があります。

VerifierやEvalそのものを変更したとき、

> 変更後のVerifierが「PASS」と言った

だけで採用してよいでしょうか。

これは自己評価になります。

PlanGateのai-loop V2では、Evaluation Trust Boundaryとして、

> **Candidate cannot modify the authority that judges the candidate.**

をinvariantにしています。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/evaluation-trust-boundary.md

つまり、Harness改善Candidateが、

- 自分を裁くEvaluation Harness
- sealed fixture
- Promotion Policy
- threshold
- protected Gate
- Human-owned boundary

を同時に自分に都合よく変更できないようにします。

## Verifierを変えるなら、変更後Verifierだけで評価しない

VerifierやGateを改善するときは特に危険です。

たとえば「検出率を改善した」という変更を、その変更後Verifier自身のPASSだけで採用すると、

~~~text
Verifierを弱くする
↓
全部PASSする
↓
「改善しました」
~~~

も成立してしまいます。

現行V2のEvaluation Trust Boundaryでは、Verifier / Eval Candidateを、

- stable meta-verifier
- known mutants
- sealed positive / negative fixtures
- baseline detection power

などで評価する考え方を置いています。

つまり、

> **改善対象と、改善を裁く基盤を分離する。**

ということです。

## Eval条件は結果を見る前に固定する

もう一つ重要なのが、評価条件のpre-registrationです。

Candidateを作る前に、

- fixture IDs
- verifier set
- baseline
- trial count
- metrics
- threshold
- critical regression condition

を固定します。

結果が悪かったからthresholdを下げる。

落ちたfixtureを「今回対象外」にする。

trial数を減らす。

これを許すとEvalは採用理由づくりになります。

> **結果を見てから評価条件を緩めたら、新しいEvaluationとしてやり直す。**

という境界が必要です。

## PASS / FAILだけでなくINCONCLUSIVEを持つ

Evidenceが取れなかったときに、

~~~text
FAILしていない
→ PASS
~~~

へ倒すとFalse Greenになります。

そこでV2では、

- PASS
- FAIL
- INCONCLUSIVE

を分けます。

たとえば、

- baseline identityが取れない
- Verifierが利用不能
- fixtureがsealedではない
- activationが確認できない
- trial数不足

ならINCONCLUSIVEです。

INCONCLUSIVEはFAILとは違います。

しかし、Promotion Readyにもなりません。

これは、

> **分からないことをgreenへ変換しない**

ための状態です。

## Harness改善を自動化しても、Promotion Authorityは別にする

ai-loop V2のRatchetでは、

~~~text
FailureRecord / Evidence
  ↓
Harness Improvement Candidate
  ↓
paired evaluation
  ↓
Experiment Result
  ↓
Promotion Decision
  ↓
Human-owned Production Promotion
~~~

という方向を取っています。

現在の実行可能sliceは限定的ですが、設計上重要なのは、

> Candidate生成とProduction採用を同じAuthorityにしない

ことです。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/ratchet-traceability.md

AIが失敗から改善案を作り、fixtureで評価するところまでは自律化できます。

しかし、

> Harnessが自分を改善し、自分で評価し、自分でproductionへ昇格する

ところまで一気につなげない。

第12章の `Autonomy != Authority` は、Harness自身の改善にも適用されます。

## この章で持ち帰ること

Harnessにgreen checkを増やすだけでは、信頼性は上がりません。

見るべきなのは、

1. そのcheckは何をClaimしているか
2. Claimに対応する実挙動を測っているか
3. known-badとknown-goodの両方で検出力を確認したか
4. failureを再現fixtureへ固定したか
5. 改善Candidateが自分を裁くAuthorityを変更していないか
6. Evidence不足をINCONCLUSIVEとして扱えるか

です。

まとめると、

~~~text
Observe failure
↓
Reproduce with controls
↓
Fix the failure class
↓
Freeze regression evidence
↓
Evaluate candidate independently
↓
Promote through separate authority
~~~

となります。

> **Harnessもまた、信頼する対象ではなく、検証し続ける対象です。**

次の第7部では、この考え方を全部入りで導入するのではなく、Level 1から段階的に自分の開発へ持ち込む方法を扱います。
