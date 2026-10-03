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

## Scope

扱う: Review Judgment as Code / Skills / Gates / Riverbed / Artifact / Evidence / Judgment Placement / Human Judgment / Review Coverage / Verification / Context / Review Team / Memory / Evaluation / staged adoption。

扱わない: 全CLIリファレンス、モデル性能ランキング、自動merge bot設計、PlanGate固有Planning手順、未実装機能を現在機能として扱うこと。

## Iteration Log

### Loop 1 — Reader navigation / positioning

#### 検討

- 参照Bookの強みを「Why → What → Components → Practice → Principles → Extension → Hands-on」の学習順序として取り込む
- README順ではなく読者の理解順へ並べる
- River Reviewを知らないことを前提にする
- Bookの中心を機能紹介ではなくReview Judgmentの設計へ置く

#### Review

- Reader: 第1部だけで問題意識とReview Judgment as Codeまで到達できる
- Editorial: 「問題 → 製品 → 設計 → 実践 → 信頼性 → 改善 → 導入」の順が自然
- Technical: Experimental / Plannedを現在機能と混ぜない方針が必要
- Positioning: 既存単発記事は深掘り、Bookは体系導線とする

#### 対応

- `books/river-review-guide/` を新設
- Bookの中心主張と7部構成を定義
- 第1部と第2部冒頭までの読める骨格を実装
- `STYLE.md` で主張境界を固定

#### Post Review

- PASS: 機能カタログではなくReader Journeyとして成立
- PASS: River Review未経験者から入れる
- PASS: Review Judgment as Codeが早い段階で中心に置かれている
- NEXT: 現行River Reviewの一次情報を章ごとに割り当てる
