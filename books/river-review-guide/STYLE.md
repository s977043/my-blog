# 執筆スタイルシート（river-review-guide）

> Book全章で統一するための編集用メモ。config.yamlのchaptersには含めない。

## 文体

- 敬体を基本にする
- River Reviewを知らない読者を前提に、日本語で責務を説明してから英語ラベルを導入する
- 「AIならできる」「必ず防げる」のような過剰主張を避ける
- 成功談だけでなくIssue / PR / fixture / limitationを一次情報として使う
- 具体的なCLIやversionは公開前にcurrent main / latest releaseを再確認する

## Bookの背骨

各章は次の問いのどれかに答える。

1. 何をレビューするのか
2. 何を根拠にするのか
3. どの層で判断するのか
4. 誰が最終責任を持つのか
5. 判断の品質をどう検証・改善するのか

## 用語

| 表記 | 意味 |
| --- | --- |
| Review Judgment as Code | 中核思想 |
| Review Judgment Platform / team-owned audit layer | 現在のRiver Reviewの位置づけ |
| Engineering Judgment Infrastructure | 長期の拡張方向。現在機能の呼称として使わない |
| Skill | レビュー職務・判断基準を持つ実行単位 |
| Artifact | レビュー対象または判断材料となる構造化成果物 |
| Evidence | Findingや判断を支える確認可能な材料 |
| Verdict | caller / human向けの判定素材。承認そのものではない |
| Judgment Placement | 判断を適切な評価層へ置く設計原則 |
| Riverbed Memory | 過去判断を次のレビューへ再利用するoperating memory |

## 実装状態の表記

- **Current / Implemented**: current mainのコード・schema・公開docsで確認できる
- **Experimental**: 実装は存在するがStable Contractではない、またはobserve-only / opt-in
- **Planned / Direction**: roadmapやdesign上の方向。現在の提供機能として書かない

例:
- Riverbed Memory v1: Implemented
- Review Coverage: Experimental
- Riverbed external datastore v2: Planned
- Engineering Judgment Infrastructure: Long-term Direction

## 章の基本形

必要に応じて次の流れを使う。

```text
Problem
  ↓
Concrete Example
  ↓
Concept
  ↓
River Review Implementation
  ↓
Trade-off / Limitation
  ↓
Takeaway
```

型を機械的には強制しない。

## Evidence Boundary

- **Observed**: Issue / PR / 実行ログなどで観測できる事実
- **Verified**: current mainのコード・schema・公開docsで確認した現行仕様
- **Interpretation**: 設計意図や一般化。Observed / Verifiedと混ぜない


## Partページ

Partページは本文の要約を繰り返さず、navigationとして次を短く示す。

- この部で答える問い
- 章の流れ
- 読み終えたときの状態

Partをまたぐときは、前部で得た理解と次部で扱う問いを1文で接続する。

## Versioned claims

version依存の主張は、可能な限り公開前のverification snapshotへ紐づける。

- `main` だけを根拠にせず、検証したcommit SHAを `00_introduction.md` / `a3_roadmap.md` に残す
- ImplementedとStableを同義にしない
- Experimental / opt-in / observe-onlyを本文で必要に応じて明示する
- 公開・改訂前にLatest Releaseとsnapshot以降の差分を再確認する


## Canonical notation

本文中でRiver Reviewの概念名として使う場合は、次の表記を優先する。

- Skill
- Artifact / Review Artifact
- Evidence
- Finding
- Verdict
- Review Coverage
- Human Judgment
- Caller
- Riverbed Memory

ただし、schema field / CLI argument / file path / source title / code block内の識別子は公式表記をそのまま使う。

例:
- prose: 「FindingをReview Artifactへ保存する」
- schema: `findings[]`
- source path: `artifact-input-contract.md`

一般名詞としてのrepository / context / reviewは無理に大文字化しない。
