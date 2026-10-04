---
name: note-thesis-review-loop
description: note.com記事を、主題・中心主張を不変条件として固定し、観点を変えた3ループの「複数ペルソナレビュー → 改善 → 独立再レビュー」で磨く。主張の希釈・論点拡散・概念過多を防ぎながら、論理、反論耐性、読者理解、編集密度を改善する。
---

# note-thesis-review-loop

note記事を公開前に磨くための、**主題・主張保護型の3ループレビュー**。

通常の `note-article-review` が記事全体の品質観点を広く確認するのに対し、このスキルは次の状況に特化する。

- 複数観点でレビュー → 改善 → 再レビューを繰り返したい
- 改善を重ねることで主題や主張が薄まるのを防ぎたい
- 「指摘を増やす」より「記事の中心メッセージを強くする」ことを優先したい
- オピニオン / 考察 / 続編記事で、別テーマへの脱線や概念過多を抑えたい

## トリガー

以下の依頼では本スキルを優先する。

- 「複数観点でレビュー → 改善 → 再レビューを3ループ」
- 「主題、主張が薄れないようにレビューして」
- 「複数エージェント / 複数ペルソナで記事を磨いて」
- 「公開前に記事を3回レビューして改善して」
- 「論点が増えすぎていないか確認しながら改善して」

対象:

```text
articles_note/new/<slug>.md
articles_note/drafts/<slug>.md
articles_note/published/<slug>.md
```

## 基本原則

### 1. 最初にArticle Contractを固定する

本文を変更する前に、記事から次の5項目を抽出する。

| 項目 | 意味 |
| --- | --- |
| Topic | この記事が答える中心テーマ / 問い |
| Claim | 筆者が最終的に伝えたい中心主張 |
| Audience | 第一想定読者 |
| Reader Promise | 読後に読者が理解・判断できるようになること |
| Emphases | Claimを支える重要論点 |

この5項目を **Article Contract** と呼ぶ。

Article Contractは3ループを通じた不変条件であり、改善のために勝手に変更しない。

### 2. 改善より主題保持を優先する

レビュー指摘が正しくても、以下に該当する場合は自動採用しない。

- 別の中心テーマを追加する
- 主張を「どちらとも言える」へ弱める
- 読者対象を広げすぎる
- 網羅性を上げる代わりに中心メッセージを薄める
- 別記事にできる概念を本文の主役へ昇格させる
- 反論への配慮で結論そのものを曖昧にする

**より多く書くことではなく、中心主張をより明確にすることを改善とみなす。**

### 3. レビュー担当と改善担当を分ける

MakerとCheckerを同じ役割にしない。

各ループは必ず、

```text
複数ペルソナ Review
        ↓
Improve
        ↓
独立 Thesis Gate
```

の順で進める。

改善担当の自己申告だけで「主張は維持された」と判定しない。

## 詳細レビュー定義

3ループのペルソナ・改善方針とThesis Gateの詳細は、通常のSkill入口から分離する。実行前に必要な範囲を読む。

- 3ループの目的・ペルソナ・改善方針:
  - `references/loop-personas.md`
- Thesis Gate、指摘優先度、具体例、外部情報の扱い:
  - `references/thesis-gate.md`

`SKILL.md` は Article Contract、主題保持、Maker / Checker分離、Workflow、PR境界を正本として保持する。詳細ペルソナを分離しても、各Loopで異なる観点を使い、Improve後に独立Thesis Gateを通す契約は変えない。

## Workflow実行

`.claude/workflows/note-thesis-review-loop.js` を使用する。

概念上の呼び出し:

```text
Workflow({
  name: "note-thesis-review-loop",
  args: {
    article: "articles_note/new/<slug>.md"
  }
})
```

Workflowは以下を行う。

```text
Extract Article Contract
        ↓
Loop 1 Review
        ↓
Improve
        ↓
Thesis Gate
        ↓
Loop 2 Review
        ↓
Improve
        ↓
Thesis Gate
        ↓
Loop 3 Review
        ↓
Improve
        ↓
Thesis Gate
        ↓
Final Verify
        ↓
Record
```

成果物:

```text
reviews/note/<state>/<slug>.thesis-loop.md
```

Workflow自身はbranch / commit / push / PRを行わない。

## PRへ反映するとき

Workflow終了後に人間または上位エージェントが以下を確認する。

- Final Verifyがpassed
- `abortedForDrift=false`
- unresolvedImportantが0
- 記事diffに主題・主張の意図しない変更がない
- `published/` の場合はnote側への反映方法を確認

その後、通常のGitHubフローでコミット・PRを作る。

PR本文には最低限、次を残す。

- Article Contract
- 3 Loopの観点
- 主な改善
- Thesis Gateの結果
- Final Verify
- 意図的に採用しなかった指摘

## 既存Skillとの使い分け

| Skill | 用途 |
| --- | --- |
| `note-article-review` | note記事の通常レビュー。品質チェック、JTF、スマホ可読性、発見性 |
| `note-thesis-review-loop` | 主張型記事を複数観点で反復改善。主題・中心主張の保持を最優先 |
| `article-humanizer-ja` | AI定型表現や文章の不自然さをHumanize観点で確認 |

推奨順:

```text
下書き
  ↓
note-thesis-review-loop
  ↓
article-humanizer-ja
  ↓
note-article-review（公開前の通常品質ゲート）
```

ただし短い記事や純粋なハウツー記事では、3ループは過剰になり得る。その場合は `note-article-review` のみでよい。

## ガードレール

- [ ] 3ループの開始前にArticle Contractを抽出する
- [ ] 各Loopで異なるペルソナと目的を使う
- [ ] Improve後は必ず独立Thesis Gateを通す
- [ ] Claimを弱める「バランス調整」を自動採用しない
- [ ] 網羅性のために論点を増やさない
- [ ] H2本数を固定値で評価せず、読者が追う軸と役割重複で判断する
- [ ] 専門用語は初出で一度だけ説明し、同じ括弧説明を繰り返さない
- [ ] 最終Loopでは追加より削減を優先する
- [ ] 外部情報の紹介記事へ変質させない
- [ ] 著者未提示の体験・数値・事実を作らない
- [ ] `published/` 記事を自動で公開・上書きしない
- [ ] 自動マージしない

## 参考

- `.claude/skills/note-article-review/SKILL.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/workflows/note-thesis-review-loop.js`
- `.claude/workflows/article-review-improve-loop.js`
