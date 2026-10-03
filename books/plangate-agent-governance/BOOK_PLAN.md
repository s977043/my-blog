# Book Plan

## Iteration Log

### Loop 1 — Reader navigation / positioning

#### 検討

- 18章の論点境界は維持する
- Zenn目次では章がフラットに見えるため、7つのPartを独立ページとして追加する
- 既存Bookとの違いを「はじめに」で最初に宣言する
- 最後に中心主張へ戻る「おわりに」を追加する

#### Review

- Reader: PlanGateを知らない読者が、いきなり抽象概念へ入る前に読書目的を把握できる
- Editorial: Why -> What -> Before -> Execute -> Scale -> Improve -> Adopt の位置が目次で見える
- Technical: 既存Bookを置換せず、Plan前後まで扱う別Bookだと明確になった

#### 対応

- `00_introduction.md` を追加
- Part 1〜7 の区切りページを追加
- `99_afterword.md` を追加
- `config.yaml` の章順を更新

#### Post Review

- PASS: 既存Bookとのポジショニング衝突は解消
- PASS: 第4コンテンツ章までにPlanGate全体像へ到達する
- NEXT: 各章の抽象度に差があり、「具体例がある章」と「概念だけの章」が混在しているため、Loop 2でEvidence設計を揃える


### Loop 2 — Evidence traceability / concrete failures

#### 検討

- 抽象概念だけで章を成立させず、PlanGateのIssue / PR / 再現結果へtraceできる構成にする
- 「実例」は成功談だけでなく、Gateが外れた・検出器が誤判定した・greenが嘘だった失敗を優先する
- Observed / Verified / Interpretationを章内で混ぜない

#### Review

- Reader: 概念が「作者の思想」だけでなく、何が起きてその設計になったかで理解できる
- Editorial: 01 / 08 / 10 / 13 / 15 / 16が具体例を軸に相互接続できる
- Technical: Issue / PR番号を固定し、後から現在実装との差分を再確認できる

#### 対応

- 主要8章へ `Primary Evidence` を追加
- #351 / #1277 / #1326 / #1169 / #1085 / #1173 / #1396 / #1411 / #1402 を一次情報として割り当て
- Evidence typeを Observed / Verified で明示

#### Post Review

- PASS: 各Partに最低1つ具体的な一次情報が入った
- PASS: False Green章が抽象的なEval論ではなく、複数の実事故クラスを比較できる構造になった
- NEXT: 一次情報は揃ったが、章同士の責務境界に一部重複がある。Loop 3で重複削減とReader Journeyを最終調整する


### Loop 3 — Responsibility boundary / de-duplication

#### 検討

- 新Bookが既存 `plangate-guide` の「良いPlanの書き方」を再演しないよう責務を固定する
- Concept章とPlanGate具体化章の二段構造は維持する
- 読者が「全部導入しないと意味がない」と誤解しないよう、When NOT to useと段階導入を強化する
- jargonは概念の名前として使うが、最初に日本語で責務を説明する

#### Review

- Reader: 既存Bookを読んでいなくても理解できるが、Plan記法の詳細へ脱線しない
- Editorial: Principle -> PlanGate implementation の反復になり、章の重複ではなく「抽象→具体」の役割差が明確
- Technical: Governance costもtrade-offとして扱い、最大構成をbest practiceとして一般化しない

#### 対応

- 04章へ「PlanGateがやらないこと」を具体化
- 05章を配布形態ではなく責務分解として再定義
- 07 / 18章に既存Bookとのnon-duplication boundaryを追加
- 11 / 16 / 17章のタイトルと論点をreader problem中心へ変更
- Levelを上げる条件とWhen NOT to useを明文化

#### Post Review

- PASS: 既存Book = Plan作成のHow、新Book = Governance設計のWhy/Where/Boundary で分離できた
- PASS: 全18章に固有の役割があり、統合すると失われる論点がある
- PASS: 「全部入りPlanGate推奨」という誤読を抑えた
- PASS: 本文執筆へ進める構成品質に到達
- REMAINING: 各章本文の執筆時に、Issueの当時仕様と現行v8.23+仕様を再照合する


### Draft Loop 1 — Part I first full draft

#### 検討

- 第1部はPlanGateの機能紹介を急がず、「判断の失敗」から入る
- #351の1,697ファイル事例を第1章の主シーンにする
- 第2章でArtifactとEvidenceを明確に分ける
- 第3章でVerification / Review / Judgmentを責務として分離し、第2部の全体フローへ接続する

#### Review

- Reader: 抽象的なGovernance論から始めず、具体的な失敗から読める
- Editorial: 01 -> 02 -> 03が「なぜ / 何を見る / どう判断する」で連続する
- Technical: #351と現行README / philosophyの主張に限定し、一般的な効果を過度に断定していない

#### 対応

- 01〜03章を全文ドラフト化
- 旧Draft placeholder / Primary Evidenceメモを本文へ統合
- 各章末から次章への接続を追加

#### Post Review

- PASS: 第1部だけで中心問題が理解できる
- ISSUE: 「信頼する」という語が強く、Artifact自体を無条件に信頼するようにも読める
- ISSUE: 第3章のHuman Judgmentが「何でも人が決める」に見える余地がある
- NEXT: Loop 2でtrustの表現とautomation/human boundaryを精密化する


### Draft Loop 2 — Trust wording / authority boundary

#### 検討

- 「Artifactを信頼する」を slogan のままにせず、「判断根拠を自己申告から外部確認可能な材料へ移す」と定義する
- Artifact と Evidence の関係を「器 / 主張を支える材料」に分ける
- Judgmentを同期Human approvalと同義にしない
- AutomationできるVerification / Reviewと、Authorityの所在を分ける

#### Review

- Reader: Artifact自体のfalse greenまで後半へ自然につながる
- Editorial: 第2章末の問いが第3章へ直結し、重複が減った
- Technical: 「人間が全部見る」ではなく、risk-based automationとAuthorityの明示というPlanGateの現在方向に整合する

#### 対応

- 02章タイトルを「判断根拠をAgentの自己申告からArtifactとEvidenceへ移す」へ変更
- Artifact / Evidence / Judgmentの定義を精密化
- 03章に「Judgmentは人が全部クリックする意味ではない」を追加
- Autonomy / Authorityへの予告を追加

#### Post Review

- PASS: trustという語の誤解を抑えた
- PASS: Human Judgmentとautomationが対立しない説明になった
- ISSUE: 第1部全体で英語ラベルがまだ多く、初見読者の認知負荷が高い
- ISSUE: 第1章の冒頭は強いが、01〜03章を通した「3つの問い」のまとめがない
- NEXT: Loop 3で用語密度と第1部の読了感を調整する


### Draft Loop 3 — First-time reader / terminology load

#### 検討

- 第1部を「3つの問い」で始め、章ごとの役割を先に渡す
- 英語用語は日本語の責務を説明した後にラベルとして導入する
- #351を一般的なAI性能の証明として使わず、PlanGateの設計変更につながった観測事例として限定する
- 03章の結論でも3つの問いへ戻り、第1部を閉じる

#### Review

- First-time engineer: PlanGate固有語を知らなくても読み進められる
- Tech Lead / EM: 「何を根拠に / 何を確認し / 誰が決めるか」の3点を自分の開発プロセスへ転用しやすい
- Skeptical OSS reader: #351の単一事例を一般化しておらず、Observed factとInterpretationの境界が明確
- Editorial: 01の具体例 → 02の判断材料 → 03の責務分離が一本の導線になった

#### 対応

- Part 1導入へ3つの問いを追加
- Artifact / Evidence / Verification / Judgment / Autonomy / Authorityを日本語先行に変更
- 01章へ単一事例の一般化を避ける注記を追加
- 03章末を3つの問いで再整理

#### Post Review

- PASS: 第1部のReader Journeyが成立
- PASS: 用語の認知負荷を下げつつ、後続章で使う英語ラベルも導入できた
- PASS: 事実 / 設計解釈 / 一般論の境界が明確
- PASS: 第1部（01〜03章）は本文初稿として次Partへ進める状態
- REMAINING: 公開前には全Book横断で表記揺れと現行PlanGate versionとの差分を再監査する


### Part II Draft Loop 1 — Full draft / current architecture alignment

#### 検討

- 第4章で最初にPlanGate全体フローを見せ、「できる」と「進めてよい」を分離する
- 第5章はPlugin分類ではなく、Workflow / Skill / Agent / Gate / Artifact / Hookの責務分解として書く
- 第6章は「単一ファイルを正本にする」ではなく、関心ごとの既存SSoTとfresh-context checkpointを説明する
- v8.23のContext Lifecycleと現行Glossaryを一次情報として再照合する

#### Review

- Reader: 第1部の抽象概念が、第4章で具体的なPlanGate flowへ接続する
- Editorial: 04=全体地図、05=構成要素、06=状態管理と役割が重ならない
- Technical: C-3' / C-4 Human-owned / Context Lifecycle / RunState ownershipなど現行仕様との矛盾を避けている

#### 対応

- 04〜06章を全文ドラフト化
- C-3 / C-4に加え、C-3'は限定経路として注記
- Plugin導入 != Governance成立を明記
- Context Lifecycleの既存SSoT表とfresh-context方針を第6章へ反映

#### Post Review

- PASS: 第2部だけでPlanGateの全体像と構成要素を理解できる
- ISSUE: 第5章で構成要素が6つ連続し、機能カタログに見える箇所がある
- ISSUE: 第6章はv8.23固有のArtifact名が増え、初心者には実装詳細が早すぎる
- NEXT: Loop 2で「3つの層」へ再整理し、詳細名を本文と補足に分離する


## Positioning

既存の `books/plangate-guide/` は残す。

- 既存 Book: **AI にコードを書かせる前に、計画で判断を終えておくための実践ガイド**
- 新 Book: **AI エージェントへ仕事を任せるために、判断境界・証拠・状態・権限をどう設計するか**

既存 Book を新版へ置換しない。読者課題が異なる別 Book として育てる。

## Central Claim

> AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をつくる。

PlanGate はそのために、Plan / Review / Approval / Execution / Verification / Handoff / Human Judgment を成果物とゲートとして明示する。

## Reader

主読者:

- Claude Code / Codex / Cursor などを日常的に使うエンジニア
- AIコーディングを個人利用からチーム開発へ広げたい Tech Lead / EM
- 自律性を上げたいが、品質・責任・監査可能性を失いたくない人

前提:

- AIコーディングの基本操作は知っている
- PlanGate は知らなくても読める
- Scrum / TDD / SDD の専門知識は必須にしない

## Cross-Book Responsibility Contract

### Existing: `plangate-guide`

主担当:

- Why / Scope / Acceptance Criteriaをどう書くか
- 設計案比較、Mode、test-casesをどう作るか
- Planをどうレビューし、最初の1タスクを回すか

### New: `plangate-agent-governance`

主担当:

- なぜPlanがApprovalの入力になるのか
- Gate / Hook / Verification / Evidenceの責務分離
- Autonomy / Authority / Human Judgment
- Context / Handoff / multi-agent independence
- Delivery / MERGE_READY
- Harness Eval / False Green
- 段階導入とGovernance cost

新Book内でPlanのHow-toが必要になった場合は、概念理解に必要な最小限だけ説明する。

## Vocabulary Contract

- 初出では日本語の責務を先に説明し、その後に英語ラベルを置く
- `Verification / Review / Judgment` は同義語として混ぜない
- `Autonomy / Authority` は別軸として扱う
- `Artifact / Evidence` は「存在するもの」と「主張を支える証拠」を区別する
- PlanGate固有略号（C-X / V-X / WF-X / EH-X）は必要になる章まで出さない
- 用語を増やすこと自体を価値にしない

## Reader Transformation

Before:

- AI が賢ければ任せられると考える
- Review / Verification / Approval を同じものとして扱う
- 会話履歴を状態の正本にする
- 「完了しました」をそのまま受け取る
- 自律性を上げるほど人間の関与を消す方向に考える

After:

- Agent ではなく Artifact / Evidence / Boundary を設計対象として見る
- Verification / Review / Judgment を分離する
- Canonical Artifact と Fresh Context で状態を受け渡す
- Fresh Evidence で完了を判定する
- Autonomy と Authority を分け、人間の判断点を意図的に残す

## Narrative

```text
AIが速くなった
  ↓
判断がボトルネックになった
  ↓
AgentではなくArtifact/Evidenceを信頼する
  ↓
正しく作れたかと、作ってよいかは別
  ↓
PlanGate = Judgment Boundary を持つ Governance Harness
  ↓
Plan / Gate / Execution / Verification / Handoff
  ↓
Context と複数Agentへ拡張
  ↓
Delivery / Eval / False Green
  ↓
段階導入して自分の開発へ持ち込む
```

## Evidence Traceability Matrix

| Chapter | Primary evidence | What it proves |
| --- | --- | --- |
| 01 | PlanGate #351 | AIの推定とプロジェクト固有の実数が大きくずれる |
| 08 | PlanGate #351 | 推測を実測へ切り替える必要性 |
| 09 | README / docs | ReviewとApprovalを別の境界として扱う |
| 10 | #1277 / #1326 | Guardは存在だけでなく実際の入力空間で検証が必要 |
| 11 | README / #1402 | 完了判定にはfreshなverification evidenceが必要 |
| 13 | #1396 / #1411 | Contextをsemantic state / snapshot / fresh contextとして受け渡す |
| 15 | #1402 | DeliveryのAI責務終点をMERGE_READYとして定義できる |
| 16 | #1085 / #1169 / #1173 / #1277 / #1326 | greenや「guardあり」が実挙動の証明にならない |

## Evidence Boundary

### 主な一次情報

- `s977043/PlanGate` の README / docs / issue / release / 実装
- PlanGate 自身で再現・計測した failure / fix
- 必要に応じて公式ドキュメント（OpenAI / Anthropic / GitHub など）

### 書き分け

- **Observed**: PlanGate の実運用で実際に起きたこと
- **Verified**: コード、テスト、Issue、公式文書で確認できること
- **Interpretation**: 著者がそこから導いた設計上の解釈

効果を一般化しない。PlanGate の設計判断と、業界一般の原則を混同しない。

## Chapter Contract

各章は原則として次を持つ。

1. Reader Problem
2. Concrete Failure / Scenario
3. Concept
4. PlanGate での具体化
5. Trade-off / Limitation
6. Takeaway
7. 次章への接続

抽象論だけで終えない。最低1つは公開一次情報または再現可能な具体例を置く。

## Part I — なぜ判断境界が必要か

### 01 判断がボトルネックになった

Goal:
AI の高速化により「書けるか」ではなく「任せてよいか」が問題になることを示す。

Primary example:
規模 M と見積もられた作業が実測 1,697 ファイルだった事例。

Takeaway:
実装前判断の失敗は、コード品質だけでは防げない。

### 02 AgentではなくArtifactを信頼する

Goal:
Agent の自己申告ではなく外部から確認可能な成果物を判断材料にする。

Key model:
`Agent -> Artifact -> Evidence -> Judgment`

### 03 Verification / Review / Judgmentを分ける

Goal:
「動いた」「問題がない」「採用してよい」を別責務として理解する。

Key model:
`Verification != Review != Judgment`

## Part II — PlanGateの全体像

### 04 PlanGateの全体フロー

Goal:
詳細へ入る前に全体の地図を渡す。

Flow:
Requirement -> Plan -> Review -> Approval -> Execution -> Verification -> PR -> Human Judgment

### 05 Governance Harnessとして考える

Goal:
Plugin / Framework / Workflow のどれか一語へ押し込まず、PlanGate の設計対象を説明する。

Define:
Workflow / Skill / Agent / Gate / Artifact / Hook の責務境界。

### 06 Artifactを正本にする

Goal:
会話ではなく成果物を state の canonical source にする理由を説明する。

Artifacts:
pbi-input / plan / todo / test-cases / status / handoff / evidence。

## Part III — 実装前に品質を作る

### 07 RequirementからPlanを作る

Goal:
Why / Scope / Acceptance Criteria / Non-goals / Unknowns を実装前に固定する。

### 08 推測よりEvidenceを取りに行く

Goal:
未確認の前提を、検索・コード・テスト・ログなどの Cheapest Useful Verification で解消する。

Primary examples:
件数実測、存在しないファイル/関数を前提にしたPlan。

### 09 Approval Boundaryを置く

Goal:
Plan が存在することと、実行許可があることを分ける。

Focus:
C-1 / C-2 / C-3 と APPROVE / CONDITIONAL / REJECT。

## Part IV — 承認後を安全に自律化する

### 10 Hookでお願いを制約へ変える

Goal:
Prompt rule と mechanical enforcement の違いを示す。

Primary examples:
approval guard / scope guard / destructive operation guard。

### 11 Fresh Evidenceで完了を判定する

Goal:
「完了しました」を完了条件にしない。

Focus:
L-0 / V-1〜V-4 / fresh verification evidence。

### 12 AutonomyとAuthorityを分ける

Goal:
AIが自律実行できる範囲と、最終決定権を分ける。

Key model:
`Autonomy != Authority`

Boundary:
MERGE_READY は AI、MERGED は Human。

## Part V — 長時間・複数Agentへ拡張する

### 13 Contextを会話からArtifactへ移す

Goal:
Long session / model switch / worker switch でも判断基準を再現できる状態を作る。

Focus:
Intent Context Package / checkpoint / fresh context。

### 14 独立レビューを本当に独立させる

Goal:
Reviewer が Builder と同じ会話文脈を引きずる問題を扱う。

Focus:
Planner / Builder / Verifier / Reviewer / Human の責務分離。

### 15 DeliveryをMERGE_READYまで収束させる

Goal:
PR 作成後の CI / review repair を含め、AI の責務終点を定義する。

Boundary:
NO MERGE BY AI。

## Part VI — Harness自体を改善する

### 16 EvalとFalse Green

Goal:
「テストが緑 = 守れている」を疑う。

Primary examples:
- linked worktree で approval boundary が外れた
- 文字列判定による誤検知
- plugin registration の false green
- 誤起動で危険な gh/git が spawn された経路

Focus:
観測 -> 再現 -> 修正 -> regression guard。

## Part VII — 導入する

### 17 Level 1から段階導入する

Goal:
全部入りを要求しない。

Levels:
1 plan approval
2 + handoff
3 + hooks/validate
4 + metrics/outcome review
5 + eval/timeline

### 18 1タスクを最後まで回す

Goal:
読者が最小構成で実際に試せるところまで落とす。

Use:
小さな standard 未満のタスクを題材に、入力 -> plan -> approval -> execution -> verification -> handoff を通す。

## Appendices

### A1 用語集

C-X / V-X / WF-X / EH-X / Mode / Hardening Override / MERGE_READY。

### A2 よくある失敗

導入時の誤解、Hook未配線、重すぎるMode、self-reviewの過信、前提崩壊後の継続、scope外修正など。

## Existing Book Reuse Map

| Existing chapter | Reuse in new Book |
| --- | --- |
| 01_decide-before-code | 01 / 08 |
| 02_three-lenses | 07 導入の背景 |
| 03_why-scope-acceptance | 07 |
| 04_design-size-testing | 07 / 08 |
| 05_measure-assumptions | 08 |
| 06_boundaries-and-stops | 09 / 10 |
| 07_verification-first | 11 |
| 08_plan-review | 09 |
| 09_start-your-plan | 18 |
| 10_plugin-cycle | 17 / 18 |
| a1_pitfalls | A2 |

既存本文をコピーして終わらせない。新しい中心主張に必要な部分だけ再構成する。

## Definition of Done for Book Structure

- [ ] 既存 Book と reader problem が重複していない
- [ ] 第4章までに PlanGate 全体像が見える
- [ ] 各部に最低1つ PlanGate の公開一次事例がある
- [ ] Verification / Review / Judgment の責務が混ざっていない
- [ ] Autonomy / Authority の境界が明記されている
- [ ] Context / Handoff / MERGE_READY が後付け付録ではなく本編に入っている
- [ ] Level 1 から始められる
- [ ] PlanGate を使わない方がよいケースも本文か付録で明記する
