---
name: article-domain-review
description: 技術記事が扱う専門領域を検出し、必要な専門家ペルソナを最大3つ選び、公式事実・チーム運用・筆者解釈の境界を一次情報に照らしてreview-onlyで確認する。
---

# article-domain-review

記事の技術的な正しさだけでなく、**「どこまでが公式仕様で、どこからがチーム運用・筆者の解釈か」**を確認するためのreview-onlyスキル。

## 目的

- 記事に実際に必要な専門領域だけをレビューする
- Scrum / Agile / DDD / TDD / Spec Kit などの正式用語を一次情報に照らす
- チーム固有の運用を公式ルールとして一般化しない
- 筆者独自の解釈を外部権威で上書きしない
- 実在する外部専門家の確認と、AI上の専門家ペルソナを混同しない

## 対象

- Zenn: `articles/*.md`
- note: `articles_note/new/*.md`、`articles_note/published/*.md`、`articles_note/drafts/*.md`（レビューのみ）
- Qiita: `Qiita/public/*.md`

## 基本フロー

```text
Article
  ↓
Domain Detection
  ↓
Claim Classification
  ↓
Reviewer Selection (max 3)
  ↓
Primary-source Verification
  ↓
Boundary Review
```

## 1. Domain Detection

記事タイトルだけで決めず、本文中で意味を持って使われている概念から領域を抽出する。

候補例:

- Scrum
- Agile
- Product Discovery
- DDD
- TDD
- SDD / Spec-driven development
- GitHub Spec Kit
- AI Agents / Coding Agents
- Web / Frontend / Backend
- Security
- Database
- Cloud / AWS

単に名前が1回出るだけの領域は選択しない。

## 2. Claim Classification

レビュー対象となる重要主張を、必ず次の4種類へ分類する。

| type | 意味 | 扱い |
|---|---|---|
| `official_fact` | 公式仕様、正式用語、公開された挙動 | 一次情報で確認する |
| `team_practice` | 筆者・チームの運用、ローカルな決め | 公式ルールへ一般化しない |
| `author_interpretation` | 実践から得た解釈・整理・主張 | 事実と混同していないか確認する |
| `unverified` | 外部確認が必要だが確認できなかった | 未検証として残す |

### 境界の例

- 「Scrum GuideではDefinition of Doneを〜と定義する」→ `official_fact`
- 「自分たちのチームではリファインメントで受入基準を明確にする」→ `team_practice`
- 「Discoveryでは学習条件を先に定義すると考えている」→ `author_interpretation`

## 3. Reviewer Selection

領域ごとにAgentを大量生成しない。記事に必要な観点だけを**最大3つ**選ぶ。

例:

```text
Detected domains:
- Scrum
- Agile
- Product Discovery
- Spec Kit

Selected reviewers:
- Scrum Master
- Agile Coach
- Spec Kit primary-source verifier
```

選択基準:

1. 公式用語・仕様を誤ると記事の信頼性に直結する領域
2. 記事の中心主張と強く関係する領域
3. 読者が誤解しやすい責務・境界を持つ領域

## 4. Primary-source policy

`official_fact` は可能な限り一次情報を使う。

優先順位:

1. 公式仕様 / 公式ガイド / 公式リポジトリ
2. 公式ブログ / 公式ドキュメント
3. 信頼できる二次情報

二次情報だけで公式仕様を断定しない。

### 代表例

- Scrum: Scrum Guide
- Agile: Agile Manifesto / Principles
- GitHub Spec Kit: GitHub公式リポジトリ、README、該当ソース
- OSS: 公式README / CHANGELOG / 実コード / テスト

WebFetchが失敗した場合は `unverified` とする。失敗を「誤り」と断定しない。

## 5. 専門家ペルソナの扱い

このスキルが生成するScrum Master / Agile Coach等は**AI上の専門家ペルソナ**であり、実在する外部専門家による監修ではない。

出力では必要に応じて次を明記する。

> 専門家ペルソナ + 一次情報に照らしたレビュー。実在する外部専門家への監修依頼ではない。

禁止:

- 「専門家監修済み」と断定する
- 実在しないレビュアー名・所属・資格を作る
- ペルソナの権威を根拠に公式事実を確定する

## 6. Review findings

指摘は次の優先度を使う。

- `must`: 公式仕様・正式用語の明確な誤り、事実と解釈の重大な混同
- `high`: 読者が公式ルールと誤認する境界不明瞭、中心主張を支える重要事実の未検証
- `medium`: 用語の精度、適用範囲、断定の強さを改善できる
- `low`: 表記・補足など任意

件数合わせをしない。問題がなければ findings は空でよい。

## 出力スキーマ

```json
{
  "domains": ["Scrum", "Agile"],
  "selectedReviewers": ["Scrum Master", "Agile Coach"],
  "claims": [
    {
      "claim": "...",
      "type": "official_fact",
      "status": "verified",
      "source": "https://...",
      "note": "..."
    }
  ],
  "findings": [
    {
      "priority": "high",
      "location": "...",
      "reason": "...",
      "suggestion": "..."
    }
  ],
  "passed": true,
  "unverified": false,
  "summary": "..."
}
```

`status` は `verified / contradicted / unverified / not-applicable` のいずれか。

## 完了条件

- [ ] 記事の中心主張に関係する専門領域だけを選択した
- [ ] reviewer persona は最大3つ
- [ ] 重要主張を4分類した
- [ ] `official_fact` は一次情報を優先して確認した
- [ ] `team_practice` を公式ルールとして一般化していない
- [ ] `author_interpretation` を筆者の主張として保護した
- [ ] 未確認は `unverified` と明示した
- [ ] 実在する外部専門家の監修と誤認させる表現がない
- [ ] 記事本文を変更していない
