---
description: note記事を公開直前にDomain・言語密度・図・編集の独立Gateで確認し、READY / NEEDS_CHANGES / UNVERIFIEDを返す
argument-hint: <state>/<slug> （例: new/ai_agent_article、published/n1234、drafts/n1234）
---

# /finalize-note-article

指定した note 記事を、**内容を自動変更せず**公開直前のFinalization Harnessで確認する。

目的は「レビューを増やす」ことではなく、既存の品質観点を必ず最後まで通し、見落としを `READY / NEEDS_CHANGES / UNVERIFIED` で明示すること。

## 引数

- `$1` = `<state>/<slug>`
- state: `new` / `drafts` / `published`

以下も可:

```text
articles_note/new/<slug>.md
articles_note/drafts/<slug>.md
articles_note/published/<slug>.md
```

## 実行前

1. `AGENTS.md` を読む
2. 対象stateを確認する
3. `drafts/` は読み取り専用ミラー、`published/` はnote側手動反映が必要であることを確認する

## 手順

### 1. deterministic language lint

対象記事だけをWARNチェックする。

```bash
npm run check:article-language-density -- articles_note/<state>/<slug>.md
```

このlintは**WARN only**。
英語を自動翻訳せず、短い範囲に英語名詞が集中している候補を早期検知する。

WARNが0件でも、後段のHumanize Gateはスキップしない。逆にWARNが出ても、それだけで公開ブロックしない。

### 2. note-finalize Workflow

Workflowツールで実行する。

```text
Workflow({
  name: "note-finalize",
  args: {
    article: "$1"
  }
})
```

実体:

```text
.claude/workflows/note-finalize.js
```

フェーズ:

```text
Extract
  ↓
DomainReview
  ↓
LanguageReview
  ↓
VisualReview
  ↓
EditorialReview
  ↓
FinalGate
```

### 3. 結果を報告

最低限、次を1メッセージで報告する。

```text
Final Editorial Gate

Article Contract: <summary>
Terminology Contract: <summary>
Domain Review: PASS / FAIL / UNVERIFIED
Language Review: PASS / FAIL
Visual Review: PASS / FAIL / N/A / UNVERIFIED
Editorial Review: PASS / FAIL
Thesis Loop: required / not required

Verdict: READY / NEEDS_CHANGES / UNVERIFIED
```

## Verdict

### READY

- Domain / Language / Visual / Editorialにblocking findingがない
- 重要な未検証項目がない
- 重いthesis loopを追加で実行する必要がない
- `drafts/` ではない

READYでも自動commit / merge / note公開はしない。

### NEEDS_CHANGES

- 1つ以上のGateにblocking findingがある
- または `requiresThesisLoop=true`

修正は別ステップで行い、Finalization Harness自体は本文を変更しない。

### UNVERIFIED

- 一次情報を確認できない
- 記事理解に重要な画像本体を確認できない
- Gate結果が欠けた
- `drafts/` の読み取り専用ミラーを対象にしている

`UNVERIFIED` を `READY` に丸めない。

## Domain Review

`.claude/skills/article-domain-review/SKILL.md` に従う。

- 記事から専門領域を検出
- 専門家ペルソナは最大3つ
- `official_fact / team_practice / author_interpretation / unverified` を分離
- `official_fact` は一次情報を優先

Scrum Master / Agile Coach等はAI上の専門家ペルソナであり、実在する外部専門家に依頼していない場合は「専門家監修済み」と断定しない。

## Language Review

`.claude/skills/article-humanizer-ja/SKILL.md` の S15 / S16 / S17 とTerminology Contractを使う。

- 英語名詞の局所密集
- 日英併記の反復
- 同一概念の表記往復

英語をゼロにすることは目的にしない。

## Visual Review

`.claude/skills/article-visual-review/SKILL.md` に従う。

- 配置
- 本文との意味整合
- 用語整合
- 冗長性
- 追加図の必要性
- alt

画像を見られない場合は `UNVERIFIED`。
既存 `npm run check:note-images` はパス・形式・import互換性のdeterministic checkとして別に維持する。

## Thesis Loopとの関係

`note-finalize` 自体は重い3ループを内包しない。

Editorial Reviewで主題・論理構造に大きな問題がある場合のみ、次を別実行する。

```text
Workflow({
  name: "note-thesis-review-loop",
  args: {
    article: "articles_note/<state>/<slug>.md"
  }
})
```

理由:

- 短い記事に18エージェント規模のループを強制しない
- Final Gateの役割を短い独立チェックに保つ
- 長時間Workflowのworking tree / branch driftリスクを増やさない

## state別の扱い

### new

編集正本。
Final Gate後の修正・PR化が可能。

### drafts

noteエクスポート由来の読み取り専用ミラー。
レビューはできるがVerdictは `UNVERIFIED` とし、本文修正へ進まない。

### published

レビュー可能。
リポジトリで修正PRを作る場合も、最終的なnote.com反映は管理画面で手動実施する。

## ガードレール

- Finalization Workflowはreview-only
- 記事・画像・レビュー成果物を変更しない
- git操作を行わない
- 自動マージしない
- 自動公開しない
- `drafts/` を変更しない
- 未検証を推測で埋めない
- 画像を見られないのに「問題なし」としない
- 実在しない専門家の監修実績を作らない

## 関連

- Issue #593
- `.claude/workflows/note-finalize.js`
- `.claude/skills/article-domain-review/SKILL.md`
- `.claude/skills/article-visual-review/SKILL.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/skills/note-thesis-review-loop/SKILL.md`
- `.claude/agents/note-article-reviewer.md`
