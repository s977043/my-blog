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
