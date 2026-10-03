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
