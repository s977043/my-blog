# 「完了しました」ではなくFresh Evidenceで判定する

実装が終わると、AIエージェントは報告します。

> 実装しました。  
> テストは通っています。  
> 完了です。

この報告は便利です。

ただし、PlanGateの実行契約では、完了系の主張をそのまま受け入れません。

Iron Lawの一つに、

> **NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

があります。

重要なのは `Evidence` だけではなく、**Fresh** であることです。

## 一度通ったテストは、現在の成果物の証拠とは限らない

たとえば、

1. テストを実行してPASS
2. Review指摘に対応してコードを変更
3. 再テストせず「完了」

という流れを考えます。

手順1のテスト結果は本物です。

ただし、手順2の変更後のコードに対する証拠ではありません。

~~~text
commit A
  ↓ test PASS
commit B
  ↓
「AでPASSしたからBもOK」
~~~

とは言えません。

Evidenceには、**どの成果物に対する証拠か**という時間軸があります。

## Fresh Evidenceとは何か

このBookでいうFresh Evidenceは、

> **現在判断しようとしている成果物に対して、判断に必要な検証を直近で行った証拠**

です。

古くなる代表例は、

- コードを変更した
- Review repairを入れた
- dependencyやgenerated artifactが変わった
- branch / worktreeが変わった
- 対象commitが変わった
- 別環境の結果をそのまま流用した

といったときです。

PlanGateのquality command evidence仕様でも、Evidenceの `createdAt` が対象実装より古ければstaleとしてblockする設計があります。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/quality-command-evidence.md

## VerificationとReviewを混ぜない

第3章で整理したように、

~~~text
Verification
= 定義済み条件を満たしたか

Review
= 定義し切れなかった問題も探す
~~~

です。

PlanGateのV系は、この違いを複数の段階に分けています。

現行Glossaryでは、

- V-1: Acceptance Verification
- V-2: high-risk / critical向けの最適化
- V-3: standard以上の外部モデルReview
- V-4: critical向けのrelease前check

と整理されています。

すべてのModeで全段階を使うわけではありません。

大事なのは番号ではなく、**仕様適合性と設計Reviewを別のEvidenceとして扱う**ことです。

## V-1 — 決めたAcceptance Criteriaを確認する

V-1の問いは比較的明確です。

> Planで決めたAcceptance Criteriaを、現在の実装は満たしているか。

前章からの注文一覧APIなら、

- valid statusで対象だけ返る
- invalid statusは400
- paginationと併用できる

といったtest-casesを一つずつ突合します。

ここで「コードがきれいか」は主題ではありません。

決めた条件を満たしたかをEvidenceで確認します。

## V-3 — 仕様に書き切れなかった問題を見る

一方、外部Reviewでは、

- 責務境界が不自然ではないか
- security上の見落としはないか
- edge caseが抜けていないか
- 既存architectureを壊していないか

など、Acceptance Criteriaだけでは拾えない問題を見ます。

V-1がPASSでも、V-3で問題が出ることはあります。

逆にV-3が「良さそう」と言っても、V-1の機械的なAcceptance Verificationの代わりにはなりません。

## 「コマンドを実行した」ではなく結果をEvidenceにする

品質コマンドも同じです。

PlanGateのquality command evidence仕様では、

- command
- exit code
- output excerpt
- conclusion
- timestamp

などをEvidenceとして記録し、required commandの未実行やFAILをGate条件にできます。

ここでの違いは、

~~~text
READMEに
「pnpm test:markdown を実行すること」
と書いてある

      ≠

その対象commitに対して
実行して exitCode=0 のEvidenceがある
~~~

です。

ルールの存在と、実行証跡を分けます。

## Freshnessだけでも十分ではない

新しければ何でもEvidenceになるわけでもありません。

たとえば、テストコマンドを間違えて対象が0件でもexit 0になるなら、freshでも意味がありません。

検査対象が正しいか、positive controlが成立しているか、必要な範囲を見ているかも重要です。

このBookでは、Evidenceを見るときに次の3点を確認します。

~~~text
Fresh
= 現在の成果物に対するものか

Relevant
= 判断したいClaimを実際に確認しているか

Reproducible
= 何を実行し、どういう結果だったか追えるか
~~~

これはPlanGate公式の「三要件」という意味ではなく、本書でEvidenceを読むときのチェック観点です。

「新しいログがある」だけを完了条件にしないための整理として使います。

## Evidenceの目的は、人間の再実行を減らすことでもある

Fresh Evidenceを要求すると、毎回人間が同じテストを手元でやり直す必要が減ります。

AIが、

- 対象commit
- 実行command
- exit code
- output
- conclusion

を残せれば、人間は「本当にやったのか」をゼロから再現するのではなく、Evidenceの妥当性を見ることに集中できます。

つまりVerification Evidenceは、AIを疑うためだけの仕組みではありません。

> **人間による二重作業を減らしつつ、完了判断の質を維持するためのインターフェース**

でもあります。

## 完了判定は「最新状態へのClaim」

完了という言葉を、

> 作業をたくさんした

という意味で使わず、

> **現在の成果物が、定義した条件を満たしていることをFresh Evidenceで確認できる**

というClaimとして扱います。

PlanGate Core Contractでも、完了系の報告・記録の直前に一次Evidenceを取り直す `verify-then-report` をDecision Ruleとして持っています。

Source:
- https://github.com/s977043/PlanGate/blob/main/docs/ai/core-contract.md

## この章で持ち帰ること

AIの「テストは通っています」を疑い続けることが目的ではありません。

> **完了判定を、Agentの記憶や自己申告から、現在の成果物に紐づくEvidenceへ移す。**

それがFresh Verificationです。

EnforcementとFresh Evidenceがあると、AIへ実装をかなり任せられるようになります。

それでも最後に残る問いがあります。

> 自律的に作業できるなら、最終決定までAIへ渡してよいのか。

次章では、AutonomyとAuthorityを分けます。
