# 全部入れない — Phase 0から段階導入する

PlanGateには、Workflow、Skill、Agent、Gate、Hook、Metrics、Evalなど多くの要素があります。

一覧だけを見ると、「これを全部入れないとPlanGateにならないのか」と感じるかもしれません。

現行の段階導入ガイドは、そうしていません。

CLI導入後の成長パスは **Phase 0〜3**、CLIを入れないplugin-only環境はその前段の **Level 0** として整理されています。

## 現行の段階導入

| 段階 | 主目的 | まだ使わなくてよいもの |
| --- | --- | --- |
| plugin-only Level 0 | 観点・型を試す | CLI / Hookによる機械強制 |
| Phase 0 | ultra-lightで1タスクを完走 | Plan / Gate / Agent / Hook / Metrics |
| Phase 1 | Planを先に作る習慣 | C-2 / C-3 / strict Hook / Metrics |
| Phase 2 | Approval Boundaryを導入 | full external review / strict一式 |
| Phase 3 | strict / external review / Metrics | projectに不要な機能 |

重要なのはPhase番号を覚えることではありません。

~~~text
観点を使う
↓
Planを残す
↓
Approval Boundaryを置く
↓
必要な境界だけ機械強制する
↓
運用データから改善する
~~~

という順で、失敗コストに合わせてGovernanceを強くすることです。

## Level 0 — CLIなしで「型」だけ試す

CLI導入の判断コストが高いなら、plugin-onlyから始められます。

この段階で使えるのは、

- Requirement整理
- Acceptance Criteria
- Risk / edge case観点
- Reviewの型
- Plan / Handoffの型
- mode分類の考え方

などです。

一方で、未承認実装のmechanical block、plan hash改変検知、doctorによるsettings検査、CLIによるexec / validateは使えません。

つまりLevel 0は、

> **Governanceの考え方は使うが、守る責任はまだ人間の規律にある。**

状態です。

これで価値が出るなら、無理にCLIへ進まなくても構いません。

## Phase 0 — まず1タスクを完走する

現行staged adoption guideのPhase 0はultra-lightです。

最小の流れは、

~~~text
bin/plangate init TASK-XXXX
↓
小さな変更を完了
↓
bin/plangate doctor
~~~

です。

PlanもC-3も必須ではなく、Agentも0体で構いません。

ここでの目的はGovernance全体を体験することではなく、

> **このprojectでPlanGateを使うこと自体が成立するか。**

を確認することです。

## Phase 1 — Planを残す

次に、実装前にPlanを作ります。

ここで得たいのは高度なReviewではありません。

> **先に何をするかを会話の外へ出してから実装する。**

という習慣です。

現行ガイドではlight mode、簡易C-1、最小Agent構成を使い、Hookも最初からblockへせずwarningから始めます。

見るべきなのは、

- Planが実装中の迷いを減らしたか
- 曖昧なscopeに早く気づけたか
- 実装中の確認待ちが減ったか

です。

## Phase 2 — Approval Boundaryを入れる

Planだけでは、

~~~text
Planを書いた
↓
そのまま実装
~~~

となり、ReviewとAuthorityはまだ分かれません。

そこでPhase 2でC-3を導入します。

ここから、

~~~text
Planがある
≠
Executionしてよい
~~~

という境界を持ちます。

重要なのは「たくさん止める」ことではありません。

> **Plan未作成・未承認・承認後Plan変更のような、繰り返し起こる境界違反を機械側へ移せるか。**

を見ることです。

## Phase 3 — 痛みが観測された場所だけstrictにする

Phase 3では、Hook、外部Review、Metricsなどを本格運用できます。

ただし「Phase 3だから全部ON」にしません。

たとえば、

- scope外変更が繰り返される
- Review漏れが繰り返される
- Handoff不備が複数人で問題になる
- CI / Verificationの手作業がボトルネックになる

といった観測があってから、対応する境界を強くします。

第16章と同じく、

> **観測されたfailure classへ仕組みを足す。**

という考え方です。

## WarningからBlockへ上げるのもAuthority変更

Hookをwarningで導入したあと、blockへ昇格すると開発フローが変わります。

~~~text
warning
= 観測する

block
= Authorityをmechanical gateへ渡す
~~~

からです。

False Positiveが多いGuardをいきなりblockへすると、迂回やbypassが増えます。

まず観測し、positive / negative controlを持ち、十分な確信ができてから強制します。

## 次のPhaseへ進むトリガー

カレンダーだけで進める必要はありません。

| 観測 | 次に検討するもの |
| --- | --- |
| 実装前にscopeが膨らむ | Plan / Acceptance |
| Planを書いても勝手に実装へ進む | Approval Boundary |
| 未承認やscope外変更が繰り返される | Hook / CLI enforcement |
| session切替で状態が失われる | Handoff / Current State |
| Builderの盲点がReviewへ残る | Independent Review |
| PR後のCI修正で人間が詰まる | Delivery loop |
| Guardの効き方を信用できない | Eval / positive-negative controls |
| 同じfailureが繰り返される | Regression / Ratchet |

つまり、

> **機能一覧ではなく、観測した摩擦をトリガーに強度を上げる。**

という考え方です。

## 既存workflowがあるなら、置き換えない

すでに自分たちのplan、TDD、CI、review、handoffがあるなら、全面置換は不要です。

現行coexistence guideでも、

- Approvalだけ
- Review観点だけ
- Handoff / Modeだけ
- Verification Gateだけ

を部分導入できます。

既存workflowで満たせている責務はそのまま残します。

> **欠けているBoundaryだけ輸入する。**

方が移行コストを小さくできます。

## PlanGateを使わない方がよいケース

PlanGate自身も、すべてのAIコーディングへ向くとはしていません。

たとえば、

- 短時間で捨てるprototype
- Notebookでの探索
- one-shot bug reproduction
- millisecond単位のinline completion
- Human approvalを意図的に持たない完全自律system
- 外部SaaSを唯一の正本とし、Markdown正本と二重管理になる環境
- 小さな変更に対してGovernance costの方が大きい場合

です。

本書では「3人以上」「3ヶ月以上」のような固定値を普遍的な採用条件にはしません。

チーム規模や期間はコスト感を変える要因ですが、本質は、

~~~text
Boundaryを置く便益
>
Boundaryを維持するコスト
~~~

かどうかです。

## 現行ドキュメントのLevel / Phase表記

2026年10月3日時点のmainでは、段階導入の正本はPhase 0〜3、plugin-onlyはLevel 0です。

一方、when-not-to-useの一部には旧いLevel 1→5表記が残っています。

本書では段階導入の正本を優先してPhase 0〜3として説明します。公開前に再確認します。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/staged-adoption-guide.md
- https://github.com/s977043/PlanGate/blob/main/docs/plugin-only-adoption.md
- https://github.com/s977043/PlanGate/blob/main/docs/coexistence-guide.md
- https://github.com/s977043/PlanGate/blob/main/docs/pages/explanation/product/when-not-to-use.md

## この章で持ち帰ること

段階導入の成功条件は、Phase 3へ到達することではありません。

> **今のfailureに対して必要なBoundaryだけが働き、不要なceremonyを増やしていないこと。**

です。

次章では、ここまでのBookを「全部設定する」のではなく、1つの小さなタスクで判断境界を一周します。