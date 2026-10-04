# {{BOOK_TITLE}} — Book Plan

> Created: {{CREATED_DATE}}
> Book slug: `{{BOOK_SLUG}}`

## Book Contract

### Reader Problem

- 誰が:
- どの状況で:
- 何に困っているか:

### Reader Transformation

Before:

- 読む前にどう考えているか
- 何ができないか

After:

- 読了後にどう考えられるか
- 何を自分で判断・実行できるか

### Central Claim

> このBookで最後まで守る中心主張を1文で書く。

### Scope

扱う:

- 

扱わない:

- 

### Existing Content Boundary

既存記事・既存Bookと責務が重なる場合、どこまでを本Bookが持つかを書く。

## Evidence Boundary

必要に応じて次を分ける。

- **Observed**: 実際のIssue / PR / 実行ログ / 体験で観測したこと
- **Verified**: current source / code / official docsで確認したこと
- **Interpretation**: 著者の設計解釈・一般化
- **Unverified**: 確認できていない仮説。本文では断定しない

## Source Baseline

Verification date: {{CREATED_DATE}}

- 対象repository / docs:
- current main / commit:
- latest release:
- current mainとreleaseの差:
- 公開前に再確認する変動情報:

## Reader Journey

~~~text
Problem
  ↓
Core idea
  ↓
Design / model
  ↓
Practice
  ↓
Reliability / trade-off
  ↓
Adoption
~~~

Bookの目的に合わない段階は削ってよい。章数やPart数を固定テンプレートとして扱わない。

## Chapter Responsibility Map

| Chapter | Reader question | Responsibility | Evidence |
| --- | --- | --- | --- |
| 00 | なぜ読むのか | Introduction | Book Contract |
| Part 1 | この部で何を理解するのか | Reader navigation | Reader Journey |
| 01 | 最初に理解すべきことは何か | First chapter | Primary source / example |
| 99 | 何を持ち帰るか | Afterword | Central Claim |

章を追加するときは「隣の章と責務が重複していないか」を先に確認する。

## Chapter Contract

各本文章は必要に応じて次を持つ。

1. Reader Problem
2. Concrete Failure / Scenario
3. Concept
4. Implementation / Practice
5. Trade-off / Limitation
6. Takeaway
7. Bridge to next chapter

すべてを機械的に7見出しへ分ける必要はない。責務として満たす。

## Review Loop

標準は3ループ。

### Loop 1 — Reader Journey

- 初見読者が問題 → 概念 → 実践へ進めるか
- 固有用語が説明前に出ていないか
- 機能カタログになっていないか

### Loop 2 — Claim / Evidence / Source

- current sourceと整合しているか
- Observed / Verified / Interpretationを混同していないか
- 具体例が抽象主張を支えているか

### Loop 3 — Responsibility / De-dup / Publish Readiness

- 章責務が重複していないか
- 長章・表・見出し密度にrender riskがないか
- `published: false` を維持しているか
- 構造check / CI / link確認が通るか

## Definition of Done

### Structure

- [ ] Reader Problemが1文で説明できる
- [ ] Central Claimが1文で説明できる
- [ ] Reader Transformationが明確
- [ ] 各章の責務が重複していない
- [ ] 既存記事・既存Bookとの境界が明確

### Evidence

- [ ] 変動する仕様にはSource Baselineがある
- [ ] 主要主張が一次情報または再現可能な例へtraceできる
- [ ] 未確認事項を事実として書いていない

### Editorial

- [ ] 各公開MarkdownのH1は1つ
- [ ] fenced code blockが閉じている
- [ ] 未執筆placeholderが残っていない
- [ ] Part / chapterのbridgeが成立している
- [ ] 長章にreader navigationがある

### Publication

- [ ] `config.yaml` とchapter fileが一致
- [ ] `npm run check` PASS
- [ ] Zenn preview / render確認済み
- [ ] `PUBLISH_CHECKLIST.md` のblocking項目がない
- [ ] Humanが公開を明示判断した
