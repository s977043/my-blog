---
title: "全部入れない — 2つの導入軸を読み分ける"
---

PlanGateには、Workflow、Skill、Agent、Gate、Hook、Metrics、Evalなど多くの要素があります。

一覧だけを見ると、「これを全部入れないとPlanGateにならないのか」と感じるかもしれません。

現行ドキュメントには、**2つの段階表現が併存**しています。

- README: **Level 1〜5** — どの機能範囲まで採用するかを示す段階
- staged-adoption-guide: **Phase 0〜3** — Day 1から運用習熟を進める導入ロードマップ
- plugin-only-adoption: **Level 0** — Pluginだけで観点・型を試す入口

どれか一つが「正しく」、残りが「旧い」と断定するより、用途を分けて読む方が安全です。

## 本書ではPluginのLevel 0から始める

この章では、**実際にどの順序で導入するか**を説明します。最初の段はPluginだけで始めるLevel 0にし、その先はstaged-adoption-guideのPhase 1〜3の考え方を借ります。

| 段階 | 主目的 |
| --- | --- |
| Level 0（Plugin） | Pluginを入れて観点・型を試す |
| Phase 1 | Planを先に作る習慣をつくる |
| Phase 2 | Approval Boundaryを導入する |
| Phase 3 | 必要なHook / 外部Review / Metricsを強化する |

各段で「何をまだ使わなくてよいか」は、後続の節で具体的に説明します。

## Level 0 — Pluginで「型」だけ試す

最初はPluginを入れるだけで始められます。

この段階で使えるのは、

- Requirement整理
- Acceptance Criteria
- Risk / edge case観点
- Reviewの型
- Plan / Handoffの型
- mode分類の考え方

などです。

一方で、未承認実装の機械的な停止、承認後のPlan改変の検知、設定の自動検査、機械検証は、Pluginだけでは働きません。

つまりLevel 0は、

> **Governanceの考え方は使うが、守る責任はまだ人間の規律にある。**

状態です。

これで価値が出るなら、無理に次の段へ進まなくても構いません。

公式の段階導入ガイドには、PlanGateが動くかを確かめるPhase 0もあります。手順は[公式ガイド](https://github.com/s977043/PlanGate/blob/main/docs/staged-adoption-guide.md)を参照してください。

READMEのLevel 1〜5は、Plan approval → handoff → hooks/validate → metrics → eval/timelineと、**採用する機能範囲を段階化する別の見取り図**として参照します。

重要なのはPhase番号を覚えることではありません。

```text
観点を使う
↓
Planを残す
↓
Approval Boundaryを置く
↓
必要な境界だけ機械強制する
↓
運用データから改善する
```

という順で、失敗コストに合わせてGovernanceを強くすることです。

## PhaseとModeは別の軸

ここは混同しやすいところです。

現行の段階導入ガイドでは、Phaseは**導入・習熟の進み方**を表します。

一方、Modeは**そのタスク自体に必要な運用強度**を表します。

```text
Phase
= チーム / projectがPlanGateをどこまで導入しているか

Mode
= 今回のtaskにどれだけ重いGateが必要か
```

したがって、

> Phase 3まで導入したチームだから、すべてのタスクをcriticalで回す

という意味ではありません。

導入が進んだあとも、軽いタスクは軽いModeで扱います。

逆に、導入初期でも高リスクタスクを軽く扱ってよいという意味でもありません。

**導入成熟度とタスクriskを別軸で持つ**ことが、過剰なceremonyを避けるポイントです。

## Phase 1 — Planを残す

次に、実装前にPlanを作ります。

ここで得たいのは高度なReviewではありません。

> **先に何をするかを会話の外へ出してから実装する。**

という習慣です。

現行ガイドではlight mode、簡易C-1、最小Agent構成を使い、Hookも最初からblockへせずwarningから始めます。

見るべきなのは、

- Planが実装中の迷いを減らしたか
- 曖昧な範囲に早く気づけたか
- 実装中の確認待ちが減ったか

です。

## Phase 2 — Approval Boundaryを入れる

Planだけでは、

```text
Planを書いた
↓
そのまま実装
```

となり、ReviewとAuthorityはまだ分かれません。

そこでPhase 2でC-3を導入します。

ここから、

```text
Planがある
≠
Executionしてよい
```

という境界を持ちます。

重要なのは「たくさん止める」ことではありません。

> **Plan未作成・未承認・承認後Plan変更のような、繰り返し起こる境界違反を機械側へ移せるか。**

を見ることです。

## Phase 3 — 痛みが観測された場所だけstrictにする

Phase 3では、Hook、外部Review、Metricsなどを本格運用できます。

ただし「Phase 3だから全部ON」にしません。

たとえば、

- 範囲外変更が繰り返される
- Review漏れが繰り返される
- Handoff不備が複数人で問題になる
- CI / Verificationの手作業がボトルネックになる

といった観測があってから、対応する境界を強くします。

第16章と同じく、

> **観測されたfailure classへ仕組みを足す。**

という考え方です。

## WarningからBlockへ上げるのもAuthority変更

Hookをwarningで導入したあと、blockへ昇格すると開発フローが変わります。

```text
warning
= 観測する

block
= Authorityをmechanical gateへ渡す
```

からです。

False Positiveが多いGuardをいきなりblockへすると、迂回やbypassが増えます。

まず観測し、positive / negative controlを持ち、十分な確信ができてから強制します。

## 次のPhaseへ進むトリガー

カレンダーだけで進める必要はありません。

| 観測 | 次に検討するもの |
| --- | --- |
| 実装前に範囲が膨らむ | Plan / Acceptance |
| Planを書いても勝手に実装へ進む | Approval Boundary |
| 未承認や範囲外変更が繰り返される | Hookなどの機械的な強制 |
| セッション切替で状態が失われる | Handoff / Current State |
| Builderの盲点がReviewへ残る | Independent Review |
| PR後のCI修正で人間が詰まる | Delivery loop |
| Guardの効き方を信用できない | Eval / positive-negative controls |
| 同じ失敗が繰り返される | Regression / Ratchet |

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

- 短時間で捨てるプロトタイプ
- Notebookでの探索
- one-shot bug reproduction
- millisecond単位のinline completion
- Human approvalを意図的に持たない完全自律system
- 外部SaaSを唯一の正本とし、Markdown正本と二重管理になる環境
- 小さな変更に対してGovernance costの方が大きい場合

です。

本書では「3人以上」「3ヶ月以上」のような固定値を普遍的な採用条件にはしません。

チーム規模や期間はコスト感を変える要因ですが、本質は、

```text
Boundaryを置く便益
>
Boundaryを維持するコスト
```

かどうかです。

## 公式仕様と、本書の判断原則を分ける

この章では、二つを混ぜないようにします。

### PlanGate公式の現在仕様

- plugin-only Level 0
- Phase 0〜3（本書ではLevel 0とPhase 1〜3を使う）
- warningからstrictへの段階導入
- coexistence / partial adoption
- when-not-to-useの非採用ケース

### 本書で提案している判断原則

- 機能一覧ではなく、観測した失敗から次の仕組みを足す
- warning→blockをAuthority変更として扱う
- 人数や期間の固定値より、Boundary便益と維持コストで判断する
- PhaseとModeを別軸にする

前者は現行PlanGateの仕様です。

後者は、その仕様と本書全体の議論から整理した設計上の解釈です。

## LevelとPhaseを混同しない

2026年10月3日時点のmainでは、READMEにLevel 1〜5、staged-adoption-guideにPhase 0〜3、plugin-only-adoptionにLevel 0が併存しています。

本書では、

```text
Level 1〜5
= 採用する機能範囲の見取り図

Phase 0〜3
= 導入・習熟のロードマップ

Mode
= 個々のtask risk / 運用強度
```

として読み分けます。

公開ドキュメント間で用語が完全統一されているとは扱いません。

Sources:
- https://github.com/s977043/PlanGate/blob/main/docs/staged-adoption-guide.md
- https://github.com/s977043/PlanGate/blob/main/docs/plugin-only-adoption.md
- https://github.com/s977043/PlanGate/blob/main/docs/coexistence-guide.md
- https://github.com/s977043/PlanGate/blob/main/docs/pages/explanation/product/when-not-to-use.md

## 導入後は4方向で見直す

Governanceは、一度入れたら増やし続けるものではありません。

一定期間使ったら、各Boundaryを次の4方向で見直します。

| 判断 | いつ選ぶか |
| --- | --- |
| Keep | 失敗を抑え、摩擦も許容範囲 |
| Strengthen | 同じ境界違反が繰り返される |
| Simplify | 手作業やceremonyが便益より重い |
| Remove | 既存CIやworkflowへ責務が移り、二重化した |

たとえば、warning Hookをblockへ上げるのはStrengthenです。

一方、既存CIで同じ検査が十分に担保できるようになったなら、PlanGate側の重複GateをRemoveする選択もあります。

重要なのは、

> **導入量ではなく、責務の重複と失敗coverageを管理する。**

ことです。

## この章で持ち帰ること

段階導入の成功条件は、Phase 3へ到達することではありません。

> **今の失敗に対して必要なBoundaryだけが働き、不要なceremonyを増やしていないこと。**

です。

次章では、ここまでのBookを「全部設定する」のではなく、1つの小さなタスクで判断境界を一周します。