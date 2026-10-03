# River Review Zenn Book Plan

## Bookの中心主張

> **AIレビューの本質は「より賢いモデルに見てもらうこと」ではなく、何を見て、何をEvidenceとして、どの層で判断し、誰が責任を持つかを設計することにある。**

River Reviewは、この判断を **Review Judgment as Code** としてversioned / repo-owned / testableな組織資産へ変える。

## Reader Problem

主対象は、Claude Code / Codex / Cursorなどを実務で使い、コード生成よりレビュー・判断・監督の負荷が問題になってきたDeveloper / Tech Lead / EM。

## Reader Journey

```text
Why review design?
      ↓
What is River Review?
      ↓
How to design judgment?
      ↓
How to use it?
      ↓
Can the review itself be trusted?
      ↓
How does judgment improve?
      ↓
How do we adopt it as a team?
```

## 全体構成

全7部・33章を計画する。

1. なぜAI時代にレビューの設計が必要なのか
2. River Reviewとは何か
3. レビュー判断を設計する
4. River Reviewで実際にレビューする
5. AIレビューそのものを信頼しすぎない
6. レビュー判断を学習・改善する
7. 自分のチームへ導入する

## Evidence Map

BookはRiver Review公開リポジトリを一次情報とする。主要章の正本候補は次。

| 章 | 主な一次情報 |
| --- | --- |
| 04 Review Judgment as Code | `pages/explanation/concept.md`, `docs/philosophy.md` |
| 06 開発の流れ | `pages/explanation/concept.md`, `pages/explanation/review-scope.md` |
| 07 Skills / Gates / Riverbed | `README.md`, `pages/explanation/concept.md` |
| 08 実行モデル | `pages/explanation/what-is-river-review.md` |
| 09 Skill | `pages/explanation/skills.md`, `pages/reference/skill-schema.md` |
| 10 Artifact | `pages/reference/artifact-input-contract.md`, `pages/reference/review-artifact.md` |
| 11 Evidence | `pages/reference/review-artifact.md`, verifier実装・fixture |
| 12 Judgment Placement | `pages/explanation/judgment-placement.md` |
| 13 Human Judgment | `pages/explanation/human-judgment-focus.md`, design philosophy |
| 18 Wチェック | `pages/guides/w-check.md` |
| 19 repo-wide review | `pages/guides/repo-wide-review.md` |
| 20 Review Coverage | `docs/development/review-coverage-contract.md`, schema |
| 22 Context | `pages/explanation/progressive-disclosure.md`, architecture |
| 24 Riverbed | `pages/explanation/riverbed-memory.md`, storage reference |
| 28 Loop | `pages/reference/loop-convergence-contract.md` |

## Claim Boundary

- **Observed**: Issue / PR / 実行ログ / fixtureで観測できること
- **Verified**: current mainのコード・schema・公開docsで確認した現行仕様
- **Interpretation**: なぜその設計にしたか、読者が持ち帰れる一般化
- **Experimental**: 現行実装に存在してもobserve-only等の制約があるもの
- **Direction**: Engineering Judgment Infrastructureなど長期方向

## Scope

扱う: Review Judgment as Code / Skills / Gates / Riverbed / Artifact / Evidence / Judgment Placement / Human Judgment / Review Coverage / Verification / Context / Review Team / Memory / Evaluation / staged adoption。

扱わない: 全CLIリファレンス、モデル性能ランキング、自動merge bot設計、PlanGate固有Planning手順、未実装機能を現在機能として扱うこと。

## Iteration Log

### Loop 1 — Reader navigation / positioning

#### 検討
- 参照Bookの強みを章数ではなく学習順序として取り込む
- README順ではなく読者の理解順へ並べる
- Bookの中心を機能紹介ではなくReview Judgmentの設計へ置く

#### Review
- Reader: 第1部だけで問題意識とReview Judgment as Codeまで到達できる
- Editorial: 問題 → 製品 → 設計 → 実践 → 信頼性 → 改善 → 導入が自然
- Technical: Experimental / Plannedを現在機能と混ぜない方針が必要

#### 対応
- `books/river-review-guide/` を新設
- 第1部と第2部冒頭まで実装
- `STYLE.md` で主張境界を固定

#### Post Review
- PASS: 機能カタログではなくReader Journeyとして成立
- NEXT: 現行River Reviewの一次情報を章ごとに割り当てる

### Loop 2 — Evidence traceability / concrete responsibility

#### 検討
- 抽象概念だけで章を成立させず、公開docs / schema / code / fixtureへtraceできるようにする
- 第3部はSkill / Artifact / Evidence / Judgment Placement / Human Judgmentという責務の分解として書く
- current mainの仕様と長期構想を同じ強さで書かない
- 「AIレビューを信頼する方法」ではなく「どこに判断を置くか」を主役にする

#### Review
- Reader: 第3部まで読むと、River Review固有機能ではなく自分のレビュー設計へ転用できる
- Editorial: 09〜13章が「何を判断する / 何を入力にする / 何を根拠にする / どこで判断する / 誰が責任を持つ」で連続する
- Technical: Artifact Input Contract、Judgment Placement、Human Judgment FocusをSSoTとして明示できる
- Skeptical reader: verdictを承認と同義にせず、人間責任の境界を保持している

#### 対応
- Evidence Mapを追加
- 第2部のコアモデル・実行モデルを追加
- 第3部を責務境界の5章として追加
- Judgment Placementは4層SSoTに合わせる
- Human JudgmentはCliff / Hill / Fieldと「責任を委譲しない」を中心にする

#### Post Review
- PASS: Bookの思想が現行River Reviewの公開仕様へtraceできる
- PASS: 第3部が機能説明でなく再利用可能な設計原則になった
- PASS: Human JudgmentとAgentic Reviewの責務が混ざっていない
- NEXT: 実践章で同じ1つの変更をPlan → Diff → Test → W-checkまで追える構成にする


### Loop 2 — Practice walkthrough extension

#### 検討

- 概念理解だけで終わらせず、同じ変更をPlan → Diff → Tests → review resultへ追えるようにする
- First Runはインストール手順の羅列ではなく、入力と出力の関係を先に理解させる
- Wチェックとrepo-wide reviewを高度機能扱いだけにせず、「レビュー結果もArtifact」「局所差分だけでは不足」という設計原則へ接続する

#### Review

- Reader: 第4部で初めて手を動かすが、第1〜3部の概念と分断されていない
- Editorial: 14=全体、15=Plan、16=Diff、17=Tests、18=review result、19=context拡張で責務が重ならない
- Technical: PlanGate依存にせずArtifact Input Contractを基準にできる
- Safety: Wチェックのverdictを自動merge権限として扱わない

#### 対応

- 第4部を追加
- 1つの例を複数章で追跡する方針をPart導入に固定
- WチェックをReview Artifactの再レビューとして位置づけ
- repo-wide reviewをContext Engineeringの実践例として位置づけ

#### Post Review

- PASS: 第4部が単なるHow-to集ではなく、Artifact間の整合を見る実践編になった
- PASS: Plan / Diff / Tests / Review Result / Repo Contextのつながりが明確
- NEXT: ループ3で「AIレビューをどう検証し、どう改善するか」と導入戦略まで完成させる


### Loop 3 — Review reliability / learning / adoption

#### 検討

- Bookを「使い方」で終わらせず、レビュー自体の信頼性を検証対象にする
- Review CoverageはExperimental、Riverbed v1は実装済み、external store v2はplannedという状態差を本文構造に反映する
- Skill改善はPrompt調整だけでなくfixture / eval / judgment promotionへ接続する
- generate → review → reviseの反復・停止・merge authorityはcaller側に残す
- 導入はPlugin / comment-only等の低リスク経路から段階的に進める

#### Review

- Reader: 「AIレビューを導入する」から「レビュー判断システムを運用する」へ理解が進む
- Editorial: Part 5=信頼性、Part 6=改善、Part 7=導入で役割が重ならない
- Technical: Review CoverageのExperimental表記、Riverbed v1/v2、Loop Convergenceのcaller ownershipが現行docsと整合
- Adoption: 最大構成をbest practiceとして押し付けず、1 Skill / Plugin / comment-onlyから始める逃げ道がある

#### 対応

- 第5部「AIレビューそのものを信頼しすぎない」を追加
- 第6部「レビュー判断を学習・改善する」を追加
- 第7部「自分のチームへ導入する」を追加
- Glossary / Antipatterns / Roadmap / Afterwordを追加
- config.yamlを全7部・33章構成へ更新
- STYLE.mdへCurrent / Experimental / Directionの表記ルールを追加

#### Post Review

- PASS: Why → What → Design → Practice → Reliability → Improvement → Adoptionが一冊のReader Journeyとして閉じた
- PASS: READMEの機能順ではなく、読者が判断設計を学ぶ順になった
- PASS: River Review固有機能と一般化できる設計原則の境界が明確
- PASS: 現行仕様と長期方向を混同しにくい構造になった
- REMAINING: 各章は現時点では構成稿。本文執筆ではIssue / PR / fixtureの具体例を章ごとに1つ以上割り当て、current mainを再照合する


### Draft Loop 1 — Why / What full draft

#### 検討
- 構成稿だった01〜08章を、River Reviewの一次情報と実例に接続して本文化する
- Whyは一般論だけでなく、River Review自身のHarness retrospectiveで観測した「1巡では拾えなかった静かな変更」を具体例に使う
- Review Judgment as Codeは実在Skill hallucinated-reference を使ってResponsibility / Evidence / Guard / Handoffまで示す
- WhatではAIコードレビューSaaSではなくReview Judgment Platform / team-owned audit layerという現行位置づけを明確にする
- current releaseとcurrent mainを区別する

#### Review
- First-time engineer: 「なぜ必要か」から入るため、River Review固有用語の押し付けになっていない
- Skeptical reader: 自プロダクトの振り返りをEvidenceとして使い、一般的なAI性能の断定には広げていない
- Technical: README / philosophy / review-scope / skill実体と整合し、PlanGate依存とも誤読しにくい
- Editorial: 01→04でWhyが閉じ、05→08で具体的なRiver Review像へ自然に進む

#### 対応
- 00_introduction.md をBook全体の読み方と情報基準まで含む本文へ拡張
- 01〜08章を構成稿から本文初稿へ更新
- 01章へ2026-09-05 Harness retrospectiveの観測事例を追加
- 04章へ hallucinated-reference Skillの具体例を追加
- 05章へNon-goalsとCaller / PlanGate / Human境界を追加
- 08章へAgent-driven / Deterministic / Headless LLMの3実行形態を追加

#### Post Review
- PASS: 第1〜2部だけで「Why → Review Judgment as Code → River Reviewの責務」が理解できる
- PASS: 抽象語が具体的なSkill・Artifact・実例へ接続した
- PASS: モデル性能を主役にせず、判断基準の所有権を主役にできた
- ISSUE: 第3部以降はまだ章間で概念密度に差があり、特にEvidence / Human Judgment / Artifactの関係を具体例でつなぐ必要がある
- NEXT: Draft Loop 2で第3〜4部を同一walkthroughへ統合する


### Draft Loop 2 — Judgment design / one walkthrough

#### 検討
- 第3〜4部を個別機能の羅列にせず、User Profile APIへoptional localeを追加する同一例でつなぐ
- 09〜13章は Skill / Artifact / Evidence / Judgment Placement / Human Judgment の責務を明確に分離する
- 14〜19章は Plan → Diff → Tests → Review Result → Repo Context の順に、同じ変更を異なるArtifactから見る
- Verifierの責務は意味判断ではなく、Evidence存在・severity上限・diff scopeなど機械確認可能な部分に限定する
- Wチェックのverdictとmerge authorityを同義にしない
- repo-wide contextでは、Contextを増やす価値だけでなくsecret redaction / budget / selectionのコストも説明する

#### Review
- First-time engineer: 第3部の5問を保持したまま第4部へ進める
- Tech Lead: SkillをPromptではなくレビュー職務として読み替えられる
- Technical: Artifact Input Contract / Skill schema / Verifier / Judgment Placement / Human Judgment Focusと整合
- Skeptical reader: 仮想例は説明用と明示し、実装事実のEvidenceと混同していない
- Security: repo-wide reviewを「全部送る」設計として紹介せず、多段redactionとbudgetを含めている

#### 対応
- Part 3導入へ5つの問いと共通walkthroughを追加
- 09〜13章を本文初稿へ更新
- Part 4導入と14〜19章を同一walkthroughで本文化
- 11章へ現行Verifierのrule-based checksを具体化
- 12章へJudgment promotionを追加
- 13章へCliff / Hill / FieldとVerdict != Authorityを明記
- 18章へWチェックのdeduplicate / hallucination guard / synthesisを追加
- 19章へrepo-wide contextのbenefit / budget / redactionを追加

#### Post Review
- PASS: Design章とPractice章が同じconcept vocabularyでつながった
- PASS: 「何を見る / 何を根拠に / どこで判断 / 誰が決める」が一貫している
- PASS: Wチェックとrepo-wide reviewが高度機能カタログではなく、Artifact / Evidence / Context原則の実践として読める
- ISSUE: Part 5〜7はまだ説明密度が薄く、Review Coverageの具体Gap、Riverbed lifecycle、Eval、段階導入の根拠を増やす必要がある
- NEXT: Draft Loop 3でReliability / Improvement / Adoptionを本文化し、Book全体の読了後アクションまで閉じる


### Draft Loop 3 — Reliability / memory / staged adoption

#### 検討
- Part 5で「0 findings」と「review complete」を分け、Review Coverageの実装背景とExperimental境界を具体化する
- Part 6でMemoryをTranscriptではなくJudgmentとして扱い、active / superseded / archivedのlifecycleまで説明する
- Evalはpositive fixtureだけでなくnegative fixtureとPlanner selectionも対象にする
- Improvement LoopはPrompt改善に閉じず、Judgment Placementのpromotionへ接続する
- Loop ConvergenceではCONVERGEDの根拠にCoverageを含め、max iterations等の外部Policyはcaller所有に残す
- Part 7は最大構成を推奨せず、1 Skill → Plugin/local → comment-only CI → selective gateの順で導入する
- Human JudgmentはReview VerdictとAuthorityを分離し、Cliff領域を明示する

#### Review
- First-time engineer: 「全部入れないと使えない」という印象がなく、1 Skillから開始できる
- Tech Lead / EM: Human waitingを減らしつつ、security / payment / personal data / irreversible changeのAuthorityを人間に残せる
- Technical: Review Coverage Experimental、Riverbed v1 Implemented / v2 Planned、Progressive Disclosureの実装差分、Loop caller ownershipが現行docsと整合
- Eval: Finding数ではなくFalse Positive / Missed Issue / negative fixture / Planner selectionまで品質対象にしている
- Operations: Memoryの蓄積だけでなくsupersede / expire、Suppressionのresurface条件を扱っている

#### 対応
- Part 5の20〜23章を本文初稿へ更新
- Part 6の24〜28章を本文初稿へ更新
- Part 7の29〜33章を本文初稿へ更新
- 20章へIssue #2212のpartial execution gapを具体化
- 24章へRiverbed v1のentry lifecycleとv2境界を追加
- 26章へpositive / negative fixtureとPlanner evalを追加
- 28章へCoverage-qualified convergenceとcaller-owned stop policyを追加
- 31章へIntegration Modeとcomment-onlyからの段階導入を追加
- 32章へDecision Surface / Authority Matrixを追加
- 33章へ観測→分類→資産化→評価→昇格の継続改善loopを追加

#### Post Review
- PASS: Why → What → Design → Practice → Reliability → Improvement → Adoptionの全7部が本文として接続した
- PASS: River Reviewを「AIレビュー製品の使い方」ではなく「レビュー判断システムの設計・運用」として一貫して説明できた
- PASS: Implemented / Experimental / Planned / Directionの主張境界を維持した
- PASS: Human Judgmentを自動化の失敗扱いにせず、責任を残す設計として扱った
- PASS: 最大構成をbest practiceとして押し付けず、段階導入と撤退可能性を確保した
- REMAINING: 公開前には全33章の一次情報リンクをcurrent mainへ再照合し、Zenn previewで表・コードブロック・Partページの表示を通し確認する


### Polish Loop 1 — Remove conceptual duplication

#### 検討
- 初稿全体で同じ概念が複数回説明されている箇所を、前半=概念、後半=運用へ分離する
- 07章と24章のRiverbed、08章と23章のReview Team、12章と27章のPromotion、13章と32章のHuman Judgmentを主対象にする
- 重複を削るだけでなく、後続章へ意図的に引き継ぐ導線を追加する

#### Review
- Editorial: 07/08/12/13で詳細を先取りしすぎており、後半章の新規性を弱めている
- Reader: 同じ語彙が再登場すること自体は問題ないが、同じ説明が再登場するとBookが長く感じる
- Technical: 章削除は不要。責務の粒度を変えるだけでReader Journeyを維持できる

#### 対応
- 07章をCore Modelの概観に限定し、Riverbed lifecycle詳細を24章へ寄せる
- 08章からReview Teamの詳細を外し、実行surfaceとjudgment ownershipに集中する
- 12章はJudgment Placementの分類原則まで、promotion運用は27章へ寄せる
- 13章はHuman Attentionの配分原則まで、Verdict / Authority / Handoff policyは32章へ寄せる
- 各章末に後続章への役割分担を明示する

#### Post Review
- PASS: 前半で概念を理解し、後半で運用詳細へ進む階層が明確になった
- PASS: 23 / 24 / 27 / 32章に「後で読む理由」が生まれた
- PASS: Bookの総章数を変えずに重複感を削減できた
- NEXT: Polish Loop 2でcurrent mainと全重要主張を再照合し、古い・曖昧な表現を修正する


### Polish Loop 2 — Re-verify current implementation state

#### 検討
- current mainが動く前提で、公開時に再現可能な検証snapshotを残す
- ImplementedとStableを同義にしない
- Review Coverageの「saved-run convergenceでは既定で効く / Gate強制はopt-in」という非対称を明示する
- LLM未実行runも収束Evidenceとして扱わない現行contractを反映する
- Progressive Disclosureのimplemented / proto / plannedを維持する

#### Review
- Current main: `60f55e75d6eaead1956c6945afc53f57acd64dd9` を再照合
- Latest Release: `v1.124.5`（2026-09-25）を再確認
- Review Coverage: Experimental。Gate integrationは `RIVER_GATE_COVERAGE=1` でopt-in
- Loop Convergence: saved-run diffではpartial / not_executedのCONVERGEDをNO_SIGNALへ降格。LLM未実行runも同様に扱う
- Riverbed Memory v1: 実装済み。ただしStable Interfaces上の関連schemaはExperimental
- Progressive Disclosure: metadata summaryはproto、metadata専用loaderとStage 2/3完全分離は未完了

#### 対応
- 00章に検証snapshot SHAを追加
- 20章にGateとsaved-run convergenceの非対称を明記
- 24章に「Implemented != Stable」を追加
- 28章にLayer 1 / Layer 2 / caller policyの境界とllmNotExecutedを追加
- 付録Cへverification snapshotとinterface stabilityの注意を追加

#### Post Review
- PASS: 時制のある主張を特定commitへ固定できた
- PASS: 「実装済み」を「安定API」と誤読しにくくなった
- PASS: Review Coverageがどこで既定適用され、どこでopt-inかを区別できた
- PASS: self-correction loopの停止Evidenceが現行contractと一致した
- NEXT: Polish Loop 3でZenn読者としての可読性・Part導線・公開前チェックリストを仕上げる


### Polish Loop 3 — Zenn reader experience / publish readiness

#### 検討
- 参照Bookの強みは章数ではなく、summaryで読了後の状態を示し、Partを学習順のナビゲーションとして使っている点にある
- 本BookのPart 1 / 2が短く、単なる区切りに見えるため、全Partで「この部で答える問い」「章の流れ」「読了後の状態」を揃える
- Bookトップのsummaryにも、33章で何を学び、最後に何ができるかを明記する
- 公開作業を会話に残さず、repository側へpublish checklistとして固定する

#### Review
- Reader: 45 entryの長いBookでも、Part単位の目的が見えるため現在地を見失いにくい
- Editorial: Partページは本文の繰り返しではなくnavigationに限定する
- Zenn: summaryは「問題 → 扱う範囲 → 読了後の状態」を先に出す
- Operations: repositoryには `npm run check` と `npm run preview` が既にあり、公開前手順として再利用できる
- Safety: 未実行のpreview / checkを実行済みとは記録しない

#### 対応
- config.yaml summaryを読者価値先出しへ更新
- Part 1〜7を同じnavigation formatへ統一
- STYLE.mdにPartページとverification snapshotの編集ルールを追加
- PUBLISH_CHECKLIST.mdを新設し、current main再照合済み項目と未実行項目を分離
- Zenn preview / repository checksは未実行のまま明記

#### Post Review
- PASS: Bookトップから読了後の状態が分かる
- PASS: 各Partが「何のために読むか」を説明するnavigationになった
- PASS: 長いBookでもWhy → What → Design → Practice → Reliability → Improvement → Adoptionの現在地が保てる
- PASS: 公開前作業がrepository-owned checklistになった
- REMAINING: `npm run check` と `npm run preview` の実行・目視はローカル/CI実行環境で行う。公開意思決定はその結果を見て行う


### Reader Loop 1 — First-time engineer

#### 検討
- 初見読者は第3部で Skill / Artifact / Evidence / Judgment Placement / Human Judgment が短い間隔で登場し、概念を同時に保持する負荷が高い
- 章を削るより、Book冒頭で読書経路を示し、第3部に日本語の一言定義を置く方がReader Journeyを壊さない
- 付録用語集は「調べる場所」なので、本文側でも最低限の読み替えを持たせる

#### Review
- First-time engineer: 33章を最初から全部読む前提だと長く見える
- Reader: 「設計思想だけ知りたい」「実践から見たい」「導入判断をしたい」の3目的がある
- Editorial: 用語の厳密さは維持しつつ、最初の一言だけ日本語へ落とすと理解が早い

#### 対応
- はじめにへ3つの読書経路を追加
- 第3部へ5概念の日本語一言定義表を追加
- 用語集へ「まず押さえる5語」を追加

#### Post Review
- PASS: 全章を順番に読まなくても目的別に入れる
- PASS: 第3部で英語ラベルを覚える前に責務を理解できる
- PASS: 既存の正式用語は変更していない
- NEXT: Reader Loop 2でTech Lead / EM視点から、導入判断に必要なDecision Surfaceを強化する


### Reader Loop 2 — Tech Lead / EM adoption decisions

#### 検討
- Tech Lead / EMは「機能があるか」より、導入対象をどう選び、いつGateを強くし、誰にAuthorityを残すかを判断したい
- 第29〜32章には要素は揃っているが、判断基準が文章へ分散している
- 導入を進める条件だけでなく、進めない条件・戻す条件も必要

#### Review
- Tech Lead: 最初のSkill候補を比較できる軸が欲しい
- EM: comment-onlyからblockingへ上げる際の出口条件が欲しい
- Governance: Risk tierとReview VerdictだけでなくAuthority Ownerを明示したい
- Operations: false positiveやownership不明の状態でGateを強くしない方針が必要

#### 対応
- 29章へFirst Skill選定マトリクスを追加
- 31章へGate昇格条件とrollback条件を追加
- 32章へRisk × Review × Authorityの運用マトリクスを追加
- 数値閾値は万能値として固定せず、チームでbaselineを置く方式にした

#### Post Review
- PASS: 「何を導入するか」だけでなく「いつ強くするか」を判断できる
- PASS: Human AuthorityをRisk tierと接続できた
- PASS: 導入を後戻り可能にし、false positiveが多い状態でblockingへ進みにくくした
- NEXT: Reader Loop 3で公開編集者視点から、33章の一次情報traceabilityとメンテナンス性を仕上げる


### Reader Loop 3 — Publication editor / source maintainability

#### 検討
- 各章末にはSourcesがあるが、River Review側の仕様変更から影響章を逆引きしにくい
- 公開後にmainが進む前提では、章単位のSourceだけでなくBook全体のsource mapが必要
- 公開編集では「sourceがある」ことと「source coverageを確認済み」を分けて記録する

#### Review
- Source audit: 01〜33章すべてに最低1つのSource sectionを確認（33/33）
- Technical editor: runtime implementation / public docs / issue / retrospectiveのSource種別を区別できると再検証しやすい
- Maintenance: Stable Interfaces / Review Coverage / Riverbed / Loop Convergenceなど変化しやすいsourceから影響章を逆引きしたい
- Publishing: Source mapは読者向けchapterではなく内部編集資料にする

#### 対応
- `SOURCE_MAP.md` を新設し、01〜33章の主要sourceと再確認ポイントを一覧化
- sourceを Design / Reference / Runtime / Issue / Observed の種別で整理
- `PUBLISH_CHECKLIST.md` にsource coverage 33/33とSOURCE_MAP更新確認を追加
- Source mapはconfig.yaml chaptersへ含めない

#### Post Review
- PASS: 33/33章でsource coverageを確認できた
- PASS: River Review側の変更から影響章を逆引きできる
- PASS: 本文のSourcesと内部maintenance mapの責務を分離できた
- PASS: 公開後の改訂コストを下げる構造になった
- REMAINING: Zenn CLIによる `npm run check` / `npm run preview` と全章目視は未実行


### Final Edit Loop 1 — Canonical terminology

#### 検討
- 最終編集では内容追加より、同じ概念が同じ表記で読めることを優先する
- 本文中のConcept labelと、schema / path / code identifierを分ける
- Skill / Artifact / Evidence / Finding / Verdict / Review Coverage / Human Judgment / Callerをcanonical notationとして固定する

#### Review
- 全33章を対象に lowercase `finding` / `artifact` / `skill` の出現位置を監査
- 大半はSource URL / file pathで、変更すべき本文揺れは限定的だった
- `repo-owned` や `repository` は一般表現として現状維持が妥当

#### 対応
- STYLE.mdへCanonical notationルールを追加
- 03章の `skill` を `Skill` へ統一
- 30章の `private skill` を `private Skill` へ統一
- 33章の図中 `finding` を `Finding` へ統一
- schema / source pathは変更しない

#### Post Review
- PASS: 概念名とコード識別子の表記境界が明確になった
- PASS: 一括置換を避け、Source URLやschema名を壊していない
- NEXT: Final Edit Loop 2で中盤章の冗長表現と章間遷移を圧縮する


### Final Edit Loop 2 — Compress the reliability sequence

#### 検討
- 第4部末〜第5部は W-check → repo-wide → Coverage → Verification → Context → Review Team と概念が連続し、説明の重複が読書速度を落としやすい
- 内容を削るのではなく、各章の「新しく増える問い」を1つに絞る
- 一覧で理解できる箇所は表へ圧縮し、前章で説明済みの原則を繰り返さない

#### Review
- 18章: Deduplicate / Hallucination guard / Synthesisを個別小見出しにする必要は薄い
- 19章: Context Budgetとsecret protectionは両方重要だが、説明を短くできる
- 21章: ReviewerとVerifierの責務差は比較表の方が速く理解できる
- 22章: Progressive Disclosure 3段階は表へ圧縮できる
- 23章: Role数より責務分離が主張なので、Agent一般論を減らせる

#### 対応
- 18章を「Review ResultもArtifact」という1主張へ集約
- 19章を「Contextを安全に選ぶ」に集約
- 21章をReviewer / Verifier比較表中心へ変更
- 22章をContext Budget / Progressive Disclosure / Coverage差の3点へ圧縮
- 23章を「観点分離 != 独立検証」に集中
- 20章はversioned contractの詳細が必要なため大幅圧縮しない

#### Post Review
- PASS: 第4部末から第5部への流れが「review result → context → execution completeness → finding validity → context quality → reviewer responsibility」と連続した
- PASS: 実装仕様を削らず、同じ説明の再登場を減らした
- PASS: 20章のExperimental / Gate opt-inなど時制依存情報は維持した
- NEXT: Final Edit Loop 3で公開前の静的監査項目をrepository-ownedに強化する


### Final Edit Loop 3 — Static editorial QA

#### 検討
- preview前でも機械的に確認できる不整合はrepository上で先に潰す
- H1 / Sources / fence / placeholderを33章すべて監査する
- 静的QAとZenn renderer確認を同じ「完了」にしない

#### Review
- 01〜33章: H1は全章1つ
- 01〜33章: 全章に最低1つのSources URL
- fenced code blockの開閉不整合: 0
- TBD / FIXME / XXX: 0
- TODO match: 12章のレビュー例1件のみで、未執筆placeholderではない
- 31章はSourceが1本のみだったためIntegration Modeの根拠を補強可能

#### 対応
- `EDITORIAL_QA.md` を追加
- 31章へRiver Review READMEをSource追加
- `PUBLISH_CHECKLIST.md` に静的QA完了項目を追加
- npm / Zenn preview未実行項目は未完了のまま維持

#### Post Review
- PASS: 33章の基本Markdown構造に静的不整合なし
- PASS: placeholder誤検出を人間レビューで解消
- PASS: 静的QAとrender / CLI QAの境界を維持
- REMAINING: `npm run list:books`, `npm run check`, `npm run preview`, 全章最終通読、公開直前のRiver Review差分確認


### Publish Prep Loop 1 — Full-read transition review

#### 検討
- 全章の最終通読では、個別章の内容よりPart境界の受け渡しを優先して確認する
- 重点確認対象は各Partの最終章と次Partの先頭章
- 本編最終章と「おわりに」が同じ結論を二重に語らないよう役割を分ける

#### Review
- 04章: 第1部の結論は明確だが、第2部へのhandoffが欠けている
- 08 / 13 / 19 / 23 / 28章: 次Partへの遷移が明示されている
- 33章: Book全体の最終主張まで言い切っており、99_afterwordと役割が重なる
- 99_afterword: 「レビューを組織の判断資産へ」という感情的・抽象的な締めとして残す価値がある

#### 対応
- 04章へ第1部終了と第2部へのhandoffを追加
- 33章は運用上の結論までに留め、Book全体の最終メッセージは99_afterwordへ集約
- 章数・構成・主張自体は変更しない

#### Post Review
- PASS: 各Part境界に明示的なhandoffが揃った
- PASS: 33章=運用の結論、99_afterword=Book全体の締めという役割分担になった
- PASS: 記事の寄せ集めではなく、一冊として終端まで接続した
- NEXT: Publish Prep Loop 2でrepository既存チェック手順とBook固有チェックの整合を確認する


### Publish Prep Loop 2 — Put Book structure under CI

#### 検討
- repositoryの `npm run check` は多数のcontent checkを持つが、既存の多くは `articles/` / Qiita / noteを対象とし、Zenn Book本文を直接検査しない
- River Review Bookで手作業確認してきた H1 / chapter存在 / duplicate / fence / Sources をCIへ移す
- 既存Bookへ一括で新規制約を課すと影響範囲が広いため、checkerは汎用化しつつRiver Review Bookだけstrict対象にする

#### Review
- `list:books`: Zenn CLIがBookを認識するかは確認できるが、Book固有の編集規約までは保証しない
- `check:internal-links`: articles / Qiita / noteが対象でbooksは対象外
- `check:article-sentence-style`: articles系が対象でbooksは対象外
- CI方針: self-testを持つ新設checkはContent harness self-testsで常時実行する既存ルールがある
- 新checkerはexternal dependency不要で、Node built-insのみで実装可能

#### 対応
- `scripts/check-zenn-book-structure.js` を追加
- checkerを任意Book directoryに対して再利用可能にした
- River Review Bookでは numbered chapterにSources URLを必須化
- duplicate chapter / missing file / H1数 / fence不整合 / placeholderを検査
- `check:river-review-book` を `npm run check` に追加
- `test:zenn-book-structure` をCI self-testへ追加

#### Post Review
- PASS: 手作業で確認していたBook構造の主要項目をCI contractへ移せた
- PASS: 既存3 Bookには新しいstrict ruleを強制していない
- PASS: checker自体にhermetic self-testを持たせ、既存CI設計と整合した
- REMAINING: branch push単体ではCIが起動しないため、実行結果はPRまたはworkflow_dispatch環境で確認する必要がある
- NEXT: Publish Prep Loop 3でpublish checklistを新しい自動Gateへ合わせ、公開判定を整理する


### Publish Prep Loop 3 — Explicit release gate

#### 検討
- 本文完成と公開準備完了を同じ状態にしない
- current main / Latest Releaseを公開直前に再確認する
- repository checks / preview / final readをblocking gateとして明示する
- `published: true` は本文編集とは別の最終操作にする

#### Review
- River Review main: `60f55e75d6eaead1956c6945afc53f57acd64dd9` のまま（2026-10-04再確認）
- Latest Release: `v1.124.5` のまま
- Review Coverage / Riverbedのstability記述にもdriftなし
- 新Book checker: 初回writeのcorruptionをPost Reviewで検出し修正済み
- 修正版checker: syntax PASS / self-test 6/6 PASS
- `package.json`: Book checkerがaggregate `npm run check` に含まれる
- CI: `test:zenn-book-structure` をself-test stepへ追加済み
- 実branch checkout上の `npm run check:river-review-book` / `npm run check` / `npm run preview` は未実行

#### 対応
- 公開情報のverification dateを2026-10-04へ更新
- `PUBLISH_CHECKLIST.md` にchecker self-testと再検証結果を反映
- `EDITORIAL_QA.md` にchecker QAと初回corruption修正を記録
- `RELEASE_GATE.md` を新設し、CONTENT_COMPLETE / RELEASE_BLOCKEDを明示
- Release state machineとrollback conditionsを追加

#### Post Review
- PASS: 「本文完成」と「公開可能」をrepository上で明確に分離できた
- PASS: versioned claimsは2026-10-04時点でもfresh
- PASS: 新checker自体はself-testで検証済み
- BLOCKED: repository checkoutでのaggregate checkとZenn previewが未完了
- DECISION: `published: false` を維持する


### PR / CI Loop 1 — Draft PR and diff review

#### 検討
- CONTENT_COMPLETEの次はbranch内レビューではなくPR単位で差分とCIを確認する
- RELEASE_BLOCKEDのためReady for ReviewではなくDraft PRから始める
- Book本文だけでなくCI / package / checkerの3ファイルを重点レビューする

#### Review
- Draft PR #750を作成
- Changed files: 55（Book配下52 + CI / package / checker 3）
- Additions: 4,924 / Deletions: 1
- Book外変更は `.github/workflows/ci.yml`, `package.json`, `scripts/check-zenn-book-structure.js` のみ
- checkerの実ファイルを再取得し、parseChaptersのcapture groupが存在することを確認
- patch表示だけからcapture group欠落と誤認したが、実ファイル確認で誤検出と判定

#### 対応
- PR #750をDraftで作成
- CIを起動
- patchだけでなくbranch上の実ファイルとCIをEvidenceにする方針へ修正

#### Post Review
- PASS: PRの変更範囲はBook + Book QA/CIに限定されている
- PASS: 公開フリップは含めていない
- PASS: Dependency reviewは成功
- NEXT: PR / CI Loop 2でContent checksの実行結果を確認する

### PR / CI Loop 2 — Fix the first CI failure

#### 検討
- CI failureを本文の問題 / checkerの問題 / repository既存問題へ分類する
- checker self-testと実Book checkを別Evidenceとして扱う

#### Review
- Content harness self-tests: SUCCESS
- `test:zenn-book-structure`: 6/6 PASS
- `list:books`: SUCCESS。River Review BookをZenn CLIが認識
- aggregate `npm run check`: FAILURE
- failureは `check:river-review-book` の1件のみ
- 原因: `99_afterword.md` を通常のnumbered content chapterとしてSources必須にしていた
- 既存article sentence-style等の出力はWARNのみで今回failureの原因ではない

#### 対応
- `00_` / `99_` をreserved chapterとしてSources必須判定から除外
- `isNumberedContentChapter()` を追加
- `99_afterword` がSourcesなしでPASSするself-test fixtureを追加
- checker self-testを6ケースから7ケースへ拡張

#### Post Review
- PASS: failure原因はBook本文ではなくcheckerの境界条件と特定
- PASS: 予約章の扱いを明示的な関数へ分離
- PASS: regression fixtureを追加
- PENDING: 更新commitに対するCI rerunで7/7 self-testと実Book checkを確認
- NEXT: PR / CI Loop 3で再CIとPR全体を最終レビューする


### PR / CI Loop 3 — Re-run CI and tighten the release gate

#### 検討
- checker修正後のCIでself-testだけでなく、実Book / aggregate checkまで通ることを確認する
- PR全体のmergeabilityと変更範囲を再確認する
- preview前に一次情報linkの代表spot checkを行い、source driftを減らす

#### Review
- 修正commit `94a422cfd15baccc71aa31a0e4ebe65a9051a889`: CI SUCCESS
- `test:zenn-book-structure`: 7/7 PASS
- `check:river-review-book`: 45 chapters PASS
- aggregate `npm run check`: 26 checks PASS
- `npm run list:books`: River Review Bookを正常認識
- 現在HEAD `d82ddb651d7e3c85c0ee3aa9142cebe67f3a5724`: Content checks / Dependency review SUCCESS
- PR #750: mergeable=true / Draft維持
- Part 1〜7から代表一次情報を1本ずつspot checkし、7/7取得成功

#### 対応
- Publish Checklistのrepository checksを完了扱いへ更新
- external GitHub source spot checkを完了扱いへ更新
- Release Gateを `AUTOMATION_VERIFIED / PREVIEW_BLOCKED` へ進める
- checker QAを7/7 self-test / 45 chapter / 26 aggregate checksの実CI Evidenceへ更新
- Zenn preview / mobile目視 / 33章最終通読は未完了のまま維持

#### Post Review
- PASS: Book構造・Zenn CLI認識・repository aggregate checksがCI上で通った
- PASS: PRはmergeableで、Dependency reviewも成功
- PASS: 代表Source 7/7が現在も取得可能
- BLOCKED: `npm run preview` とrenderer目視、全33章最終通読が未完了
- DECISION: PR #750はDraft、`published: false` を維持


### Preview Loop 1 — Automate the minimum Zenn render path

#### 検討
- `list:books` は構造認識までで、実際にpreview serverがBook routeをrenderできることは証明しない
- visual reviewを完全自動化する前に、server起動 / Book route / title renderをsmoke testへ移す
- CSS見た目・mobile幅・表の可読性はHuman Previewに残す

#### Review
- repositoryは `zenn-cli 0.5.4` を使用
- `zenn preview` はport指定とno-watch起動が可能
- 既存CIにはpreview serverを起動するstepがない
- 新規dependencyを追加せず、既存Node/Zenn CLI + curlだけで検証可能

#### 対応
- CIに `Smoke test River Review Book preview` stepを追加
- `zenn preview --no-watch --port 8000` をbackground起動
- `/books/river-review-guide` がHTTP成功するまで最大30秒poll
- HTMLにBook titleが含まれることを確認
- process cleanupをtrapで保証

#### Post Review
- PENDING: PR CI上で実route / titleがPASSするか確認
- SAFETY: visual qualityはこのsmoke testではPASS扱いにしない
- NEXT: CI結果をReviewし、必要ならroute / render assumptionsを修正する


### Preview Loop 1 — Post Review / responsibility correction

#### Review
- CIはpreview server起動後、Book routeへのHTTP request成功までは到達した
- failureはraw HTMLへのtitle grepで発生
- Zenn previewはbrowser側renderを含むため、raw HTMLにBook titleが存在することをsmoke test契約にするのは過剰
- server起動 / route応答 と visual content confirmationを分離すべき

#### 対応
- smoke testからraw HTML title grepを削除
- HTTP 200 + response body non-emptyを自動Gateにする
- title / summary / layoutはbrowser preview reviewへ残す

#### Post Review
- PASS: automationが証明できる範囲へ責務を戻した
- PENDING: 修正後CIでpreview route smoke testがPASSすること
