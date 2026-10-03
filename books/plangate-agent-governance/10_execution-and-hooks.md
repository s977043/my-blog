# Hookで「お願い」を実行時の検査へ近づける

前章までで、PlanとApproval Boundaryを作りました。

では、承認前やscope外の変更をしないように、

> 承認されるまでコードを書かないでください。  
> Planの範囲外は変更しないでください。

とPromptへ書けば十分でしょうか。

規範としては必要です。

ただし、PlanGateでは重要な一部を、PromptだけでなくHookやCLIの検査へ移そうとしています。

ここで大事なのは、

> **Hookがあること** と **境界が実際に強制されていること**

を同じにしないことです。

## Promptは「守るべきルール」を伝える

PromptやRuleには役割があります。

- なぜそのルールがあるのか
- 何をscope外とするか
- どんな場合に止まるか
- どのEvidenceを残すか

といった意味をAgentへ伝えられます。

一方で、Agentが別tool経路を使ったり、設定が読み込まれていなかったりすれば、自然言語の指示だけでは実行を物理的に止められません。

そこで、機械判定できる境界をruntime側へ寄せます。

## Hookは「Gateそのもの」ではない

第5章でも触れたとおり、

~~~text
Gate
= 次へ進める条件

Hook
= その条件を実行時に検査する手段の一つ
~~~

です。

PlanGateでは、たとえば次のような不変条件をHookやCLIで検査します。

- Planが存在するか
- Approvalが成立しているか
- 承認後にPlanが変わっていないか
- forbidden_filesへ越境していないか
- delegation時のcommit境界を破っていないか
- protected branchで破壊的git操作をしていないか
- approval tokenをAIが直接書いていないか

目的は、「Agentにもっと注意させる」ことではありません。

**判定できるものは、判定できる場所へ移す**ことです。

## ただし、Hookの存在だけでは守れていない

ここが実運用で重要でした。

PlanGateの公開ドキュメントには、Hook実装と実際の配線・発火経路を分けて記録しています。

たとえば現行のClaude Code側では、ファイル書き込み系の一部Guardは `Edit|Write` matcherで発火します。

しかし、同じ内容をBash経由で書き込むと、そのGuardが発火しない経路が残っています。

つまり、

~~~text
Guard scriptが存在する
      ≠
すべての書き込みを守る
~~~

です。

「配線ファイルに書いてある」だけでも不十分で、runtimeが実際に登録・発火しているかを見る必要があります。

PlanGate自身もCodex側Hookについて、設定記述は存在していたのにruntime登録が0件だったFalse Greenを経験しています。

## linked worktreeで外れたHardening Override

PlanGate Issue #1277では、より具体的な境界漏れが見つかりました。

Hardening Override対象のファイルは、通常のrepository root配下ではblockされていました。

しかしlinked worktree配下ではpathの正規化前提が崩れ、

- rootの `CLAUDE.md` → BLOCK
- worktree側の `CLAUDE.md` → allow

という差が発生していました。

規範上は「変更禁止」でも、技術層の判定がそのpath表現を想定していなかったため、境界が空いていたわけです。

Source:
- https://github.com/s977043/PlanGate/issues/1277

この事例から分かるのは、

> **Guardはルール文ではなく、入力空間に対してテストする必要がある。**

ということです。

## 強く止めすぎても失敗する

逆方向の失敗もあります。

Issue #1326では、protected branch上の破壊的git操作を止めるEH-12が、実際には破壊的でないcommandまでblockしました。

原因は、`git push` と `--force` や `+` が同じcommand segmentに属するかを見ず、文字列全体から独立に探していたことです。

その結果、

- `git worktree remove --force`
- echo内の文字列
- `git push ... && echo a + b`

などまで誤blockしました。

実運用では5回tool callが止まり、回避のためにcommandを不自然に分割する摩擦が出ています。

Source:
- https://github.com/s977043/PlanGate/issues/1326

Guardは強ければ強いほど良いわけではありません。

~~~text
False Negative
→ 本来止めるべき操作を通す

False Positive
→ 安全な操作を止める
~~~

両方を減らす必要があります。

## Positive ControlとNegative Controlを持つ

そのため、Guardを評価するときは両側を見ます。

### Positive Control

本当に止めたい操作が、確実にBLOCKされるか。

例:

- `git push --force-with-lease`
- `git reset --hard`

### Negative Control

止めるべきでない操作が、通るか。

例:

- 安全なbranchへの通常push
- 別commandの `--force`
- 実行されない文字列の中の `push --force`

片方だけだと、「全部allow」も「全部block」もテスト成功に見えることがあります。

## Enforcementは経路込みで評価する

PlanGateの現行Hook documentationでは、強制を複数層に分けています。

- Claude PreToolUse
- CI
- `bin/plangate` CLI
- GitHub branch protection等の外部設定
- Codex側runtime integration

重要なのは、どの層も万能ではないことです。

たとえばCLI経由でしか発火しない検査は、CLIを使わなければ休眠します。

Claudeの `Edit|Write` matcherだけにあるGuardは、Bash経由では同じ保証になりません。

したがって、

> **Enforcementの仕様には「何を守るか」だけでなく「どの経路で発火するか」も含まれる。**

と考える必要があります。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/hook-enforcement.md

## Hookは最後の目的ではない

Hookを増やすことが目的ではありません。

決定論的に検査できる不変条件をruntimeへ移すと、Agentへ毎回同じ注意を繰り返さなくてよくなります。

その分、

- 設計判断
- 未知の問題
- trade-off
- Review

にAgentと人間の注意を使えます。

ただしGuard自体もsoftwareです。

path、shell、matcher、worktree、runtime、配線によって壊れます。

だから後半の第16章では、Harness自身をEvalする話へつながります。

## この章で持ち帰ること

Prompt上の「お願い」をすべてHookへ変える必要はありません。

機械的に判定でき、破ると危険な境界だけをruntimeへ寄せます。

そして、

> **Guard scriptの存在ではなく、実際の経路で止めるべきものを止め、通すべきものを通すことをEvidenceで確認する。**

ここまでがEnforcementです。

しかし、境界の内側で実装が進んだあと、「終わった」と判断するには別のEvidenceが必要です。

次章ではFresh Verification Evidenceを扱います。
