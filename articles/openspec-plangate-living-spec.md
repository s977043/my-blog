---
title: "OpenSpecとPlanGateを比較して見えた、AI駆動開発に足りなかったLiving Spec"
emoji: "🧩"
type: "idea"
topics: ["ai駆動開発", "openspec", "plangate", "sdd", "aiエージェント"]
published: false
---

:::message
この記事では、OpenSpecと、私が開発しているPlanGateのartifactとライフサイクルを比較します。

検証対象は **2026-09-30時点**です。PlanGateは main の commit 4995ad626825492914c6152c92f65849584dff60、OpenSpecは同日に確認した公式ドキュメントを参照しています。

ここで使う **Living Spec** は、OpenSpecの公式固有用語としてではなく、「変更後も更新され続け、現在のシステムの期待動作を表すmain spec」という意味でこの記事内の説明語として使います。
:::

## TL;DR

OpenSpecを見たとき、最初は「PlanGateとかなり似ている。取り込めるのでは」と考えました。

実際、artifactを並べるとかなり重なります。

- proposal.md と pbi-input.md
- design.md と design.md / plan.md
- tasks.md と todo.md

しかし比較していくと、一番大きな違いはファイル名ではありませんでした。

**何を正本として残そうとしているかが違います。**

~~~text
OpenSpec
  System State
  「現在のシステムは何をするものか」
        ↓
  Change
        ↓
  New System State

PlanGate
  Change Execution
  Intent
    ↓
  Plan
    ↓
  Review
    ↓
  Approval
    ↓
  Execute
    ↓
  Evidence
    ↓
  Judgment
~~~

私の今の結論は、**PlanGateへOpenSpec一式を追加する必要はない**です。

取り込みたいのは、OpenSpecそのものというより、

- 現在の期待動作を残すmain spec
- 今回変える部分だけを書くdelta spec

という考え方です。

## なぜOpenSpecをPlanGateと比較したのか

OpenSpecの標準構造を見ると、PlanGateを作ってきた自分には見覚えのあるartifactが並んでいました。

OpenSpecの標準 spec-driven schemaは、主に次の4 artifactを扱います。なお公式仕様では design は条件に応じて省略可能で、specs も change 設定によって省略できます。ここでは標準的な構成を比較対象にします。

~~~text
proposal.md
     │
     ├──── specs/<capability>/spec.md
     │
     └──── design.md
              │
              ↓
           tasks.md
              ↓
            apply
~~~

公式ドキュメントでは、それぞれおおむね次の責務です。

| Artifact | 責務 |
| --- | --- |
| proposal.md | Why |
| delta spec.md | What behavior changes |
| design.md | How |
| tasks.md | Implementation checklist |

一方、PlanGateにも、

~~~text
pbi-input.md
plan.md
todo.md
test-cases.md
design.md
review-self.md
review-external.md
approvals/c3.json
evidence/
handoff.md
~~~

といったartifactがあります。

最初の疑問は単純でした。

> OpenSpecをPlanGateに導入すると、何が増えるのか？

この問いから比較を始めました。

## artifactを対応させると、かなり重なる

現在の両者を責務で並べると、私は次のように整理しています。

| 目的 | OpenSpec | PlanGate | 見立て |
| --- | --- | --- | --- |
| 問題・変更理由 | proposal.md | pbi-input.md | かなり近い |
| Scope | proposal.md | pbi-input.md + plan.md | かなり近い |
| 変更する期待動作 | delta spec.md | AC + test-cases.md | 部分的に重なる |
| 技術設計 | design.md | design.md + plan.md | かなり近い |
| 実装タスク | tasks.md | todo.md | かなり近い |
| 計画の確認・レビュー | QuickstartにReview stepがある | review-self.md / review-external.md | 仕組みが異なる |
| 承認のprovenance | workflow上のReview | approvals/c3.json + hash | PlanGateの責務が厚い |
| 受入検証 | /opsx:verify 等 | test-cases.md + verification evidence | 仕組みが異なる |
| 現在仕様の正本 | openspec/specs/ | 明確な直接対応がない | 大きなGap |

ここで重要なのは「OpenSpecにレビューや検証がない」という話ではありません。

OpenSpecのQuickstartには人間がplanを確認するReview stepがあり、現在の公式workflowには /opsx:verify もあります。

この記事は「OpenSpecにはReviewやVerifyがなく、PlanGateにはある」という比較ではありません。違うのは、PlanGateが **review / approval / evidenceを明示的なartifactと機械検証可能なprovenanceとして強く束縛している** 点です。

## proposal.mdはpbi-input.mdとかなり近い

OpenSpecの proposal.md は、変更理由と変更内容、capability、impactを扱います。

PlanGateの pbi-input.md も、

- Context / Why
- What / Scope
- Acceptance Criteria
- Refinementで得た前提

などを持ちます。

したがって、責務としては、

~~~text
OpenSpec proposal.md
        ≒
PlanGate pbi-input.md
~~~

と見ています。

OpenSpecを取り込むためだけにPlanGateへ proposal.md を追加すると、Why / ScopeのSSoTが二つになります。

ここは増やさない方がよさそうです。

## design.mdとtasks.mdも重複が大きい

design.md も同じです。

OpenSpecではtechnical approachやarchitecture decisionを扱います。

PlanGateでは必要に応じて design.md を使いますが、plan.md 自体にも、

- Approach
- Files / Interfaces
- Work Breakdown
- Verification Plan
- Risks
- Stop Condition
- Replan Trigger
- Human Approval Boundary

があります。

そのため、

~~~text
OpenSpec design.md
        ≒
PlanGate design.md
      + PlanGate plan.md の一部
~~~

と考えています。

tasks.md と todo.md も近いです。

~~~text
OpenSpec tasks.md
        ≒
PlanGate todo.md
~~~

PlanGate側では depends_on、Owner、対象ファイル、rollbackなど、実行制御に必要な情報も持たせます。

ここもOpenSpec形式へ置き換えるより、既存artifactを維持する方が自然です。

## 最大のGapは「現在のシステム仕様」だった

比較していて、一番違うと感じたのがspecでした。

OpenSpecでは変更中に、

~~~text
openspec/changes/add-passkey/
└── specs/
    └── auth/
        └── spec.md
~~~

のようなdelta specを書きます。

これはシステム全体の仕様を書き直すものではなく、**今回何が追加・変更・削除されるのか**を記述するものです。標準schemaのdelta specでは、要求を ADDED / MODIFIED / REMOVED などの差分として表します。

つまり、完成後の全体像を変更フォルダへ複製するのではなく、Changed Whatだけを持てます。

そして変更完了後にarchiveすると、そのdeltaがmain側のspecへ反映されます。

~~~text
Before

openspec/specs/auth/spec.md
          +
openspec/changes/add-passkey/specs/auth/spec.md
                     ↓
                  archive
                     ↓
After

openspec/specs/auth/spec.md
~~~

OpenSpecのQuickstartでは、archive後の specs/ を「system as built」を表すsource of truthと説明しています。

ここがPlanGateと大きく違いました。

## PlanGateは「今回何を満たすか」を詳しく持っている

PlanGateにも仕様に近い情報はあります。

~~~text
pbi-input.md
  └ Acceptance Criteria

test-cases.md
  └ AC → Test Case

tests / evidence
  └ Observable behavior
~~~

ただし中心は、

> 今回の変更は何を満たせば完了なのか

です。

一方、OpenSpecのmain specsが持つのは、

> 現在のシステムは何をするものなのか

です。

時間軸が違います。

~~~text
OpenSpec main spec
=
Current What

PlanGate AC / test-cases
=
This Change Should Satisfy
~~~

PlanGateには変更単位の情報はかなり残ります。

私が比較していて引っかかったのは、変更履歴の豊富さとCurrent Systemの読みやすさは別問題だという点でした。

変更が100回積み上がったあと、

> 今のauth capabilityは結局どう振る舞うのか？

を知りたい場合、変更履歴やコード・テストから再構成する必要があります。

ここにGapがあると感じました。

## PlanGate側の強みはChange Executionのprovenance

逆方向の差もあります。

現在のPlanGateではplan phaseが、PBI INPUTから次の3ファイルを生成します。

~~~text
pbi-input.md
     ↓
plan.md
todo.md
test-cases.md
~~~

さらにC-3'の契約では、

~~~text
pbi-input.md
plan.md
todo.md
test-cases.md
review-self.md
review-external.md
~~~

の6要素をPlan Packageとして束縛します。

artifactごとのhashを取り、plan_package_hash とreviewer snapshotまで照合します。

その後も、

~~~text
Review
  ↓
C-3 / C-3'
  ↓
Approval
  ↓
Execution
  ↓
Verification
  ↓
Evidence
  ↓
C-4
~~~

という変更実行の境界があります。

ここでPlanGateが残しているものは、現在仕様というより、

- 何を意図したか
- どのplanをレビューしたか
- どのplanを承認したか
- その後planが変わっていないか
- 何を検証したか
- 何を根拠に完了と判断したか

という **変更実行のprovenance** です。

OpenSpecにもReviewやVerifyはありますが、今回確認した標準artifactの中心は、PlanGateのようなapproval tokenやPlan Package hashではありません。

同じ「AIに変更をさせる仕組み」でも、守ろうとしている対象が違います。

## System StateとChange Executionで分けると理解しやすかった

ここまで比較して、自分の中では次の2つに分けると整理しやすくなりました。

### OpenSpec: System State中心

~~~text
Current System
      ↓
    Change
      ↓
New Current System
~~~

変更が終わればdeltaをmain specへ吸収し、現在仕様を更新します。

### PlanGate: Change Execution中心

~~~text
Intent
  ↓
Plan
  ↓
Review
  ↓
Approval
  ↓
Execute
  ↓
Evidence
  ↓
Judgment
~~~

変更そのものを安全に進めるための境界と証跡を残します。

もちろん両ツールがこの片側しか扱わない、という意味ではありません。

**主な正本とartifact設計の重心が違う**、という整理です。

## Artifactを6種類の責務に分けてみる

この比較から、AI駆動開発のartifactを6種類に分けて考えるようになりました。

~~~text
Living Spec
    =
Current What

Delta Spec
    =
Changed What

PBI
    =
Why

Plan / Design
    =
How

Review / Approval
    =
Judgment

Test / Evidence
    =
Proof
~~~

個人的には、この分離が今回の一番大きな収穫でした。

Why / What / Howだけではありません。

AIが長時間・複数フェーズで変更を進めるなら、

- **Current What**: 今どういうシステムなのか
- **Changed What**: 今回どこを変えるのか
- **Why**: なぜ変えるのか
- **How**: どう変えるのか
- **Judgment**: その変更を受け入れてよいのか
- **Proof**: 本当に満たしたのか

を別責務として持った方がよさそうです。

## だからOpenSpecを全部入れるのではなく、Gapだけを埋めたい

比較前は「OpenSpecをPlanGateへ導入する」という発想でした。

今は少し違います。

例えば、

~~~text
proposal.md
→ pbi-input.md と重複

design.md
→ design.md / plan.md と重複

tasks.md
→ todo.md と重複
~~~

するので、これらを二重化したくありません。

一方、現在のPlanGateには、OpenSpecの

~~~text
specs/
└── auth/
    └── spec.md
~~~

のように、**capability単位でCurrent Systemの期待動作を継続更新する正本へ直接対応するartifact**がありません。

PlanGateにも各種contractや設計仕様はあります。ここで指しているGapは「仕様書が存在しない」ことではなく、変更完了後の振る舞いをcapability単位で畳み込んでいく正本が、Change Executionの標準artifactとしては置かれていないことです。

そこでPoCするなら、例えば次の程度から始めたいです。

~~~text
specs/
└── auth/
    └── spec.md

docs/working/TASK-1234/
├── pbi-input.md
├── spec-delta/
│   └── auth.md
├── plan.md
├── todo.md
├── test-cases.md
├── review-self.md
├── review-external.md
└── approvals/
    └── c3.json
~~~

重要なのは、spec-deltaを新しいplanにしないことです。

~~~text
Living Spec   → Current What
Delta Spec    → Changed What
PBI           → Why
Plan          → How
Review        → Judgment
Evidence      → Proof
~~~

と責務を分けます。

## Living Specをいつ更新するか

ここはまだ仮説ですが、PlanGateへ入れるなら更新タイミングも重要です。

C-3でplanが承認された時点では、まだシステムは変わっていません。

そこでmain specを更新すると、

~~~text
Spec上では存在する
        ↓
しかし実装にはまだ存在しない
~~~

という状態になります。

そのため、候補としては、

~~~text
Delta Spec
   ↓
Plan
   ↓
Review / Approval
   ↓
Implementation
   ↓
Verification / Evidence
   ↓
C-4 / Merge
   ↓
Living Specへ反映
~~~

が自然だと考えています。

OpenSpecも、実装後のarchiveでdeltaをmain specへ反映します。ただしOpenSpecのQuickstartではGitは別の関心事とされており、archiveをGitのmerge境界と同一視するものではありません。

ここで C-4 / Merge 後を候補にしているのは、OpenSpecのルールではなくPlanGateへ統合する場合の私の仮説です。実際に導入するなら、C-4とspec反映の順序、失敗時のrollback、並行変更時の競合まで検証が必要です。

まだ「この構造で完成」と言える段階ではありません。

## 次に1 capabilityだけで試す

いきなりPlanGate全体へspec layerを追加するつもりはありません。

まず1 capabilityだけで試します。

例えば、

~~~text
specs/auth/spec.md
~~~

を作り、変更時に、

~~~text
docs/working/TASK-XXXX/spec-delta/auth.md
~~~

を書く。

そのままPlanGateの既存フローで、

~~~text
Plan
→ Review
→ Approval
→ Implementation
→ Verification
→ Evidence
~~~

まで進めます。

変更が確定してから、

~~~text
spec-delta/auth.md
        ↓
specs/auth/spec.md
~~~

へ反映する。

ここで見たいのは「きれいな構造が作れるか」ではありません。

- ACとspecが二重正本にならないか
- test-casesとspecのdriftが増えないか
- AIがCurrent WhatとChanged Whatを正しく使い分けられるか
- 並行changeを扱えるか
- spec更新忘れを機械検知できるか

です。

うまくいけば、PlanGateは、

~~~text
Current System State
        ×
Change Execution History
~~~

の両方を持てるようになります。

## まとめ

OpenSpecとPlanGateを比較してみて、一番大きかった発見は、

**どちらを使うべきかではなく、何を正本として残しているかが違う**

ということでした。

OpenSpecは、変更をmain specへ畳み込みながら、現在のシステム仕様を育てていきます。

PlanGateは、Plan、Review、Approval、Evidenceを束縛しながら、今回の変更をどう実行・判断したかを残します。

だから、PlanGateへOpenSpec一式を追加するのではなく、

**PlanGateに欠けているCurrent What / Changed Whatだけを小さく取り込む。**

まずはそれを試してみます。

## 参考

- [OpenSpec - spec-driven schema](https://openspec.dev/docs/schemas/spec-driven)
- [OpenSpec - Quickstart](https://openspec.dev/docs/quickstart)
- [OpenSpec](https://openspec.dev/)
- [PlanGate](https://github.com/s977043/PlanGate)
- [PlanGate plan contract](https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/plan.md)
- [PlanGate review contract](https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/review.md)
- [PlanGate verify contract](https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/ai/contracts/verify.md)
- [PlanGate C-3' artifact contract](https://github.com/s977043/PlanGate/blob/4995ad626825492914c6152c92f65849584dff60/docs/workflows/ai-loop/c3-prime-contract.md)
