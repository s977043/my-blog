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

## 3ループの役割

3周とも同じ観点でレビューしない。

### Loop 1: 主題・論理構造

目的:

**記事全体が一つの問いと一つの中心主張へ収束している状態を作る。**

ペルソナ:

1. **Thesis Guardian**
   - Topic / Claimから逸れた章がないか
   - 第二の主題が生まれていないか
   - タイトル、冒頭、結論が同じ論点を指しているか

2. **Logic Editor**
   - 導入 → 問い → 根拠 → 具体例 → 結論の因果
   - 同じ主張の重複
   - 章順の不自然さ
   - 説明が先行し、結論への到達が遅くなっていないか

3. **Skeptical Senior Engineer**
   - 「それは昔からあるのでは？」に答えられるか
   - 新規性を誇張していないか
   - 技術トレンドから結論への飛躍がないか
   - 事実と筆者の解釈が区別されているか

改善方針:

- 冒頭で問いと結論を早める
- 重複セクションを統合する
- 主題から遠い背景説明を圧縮する
- Andrew Ng等の外部情報を「主役」にせず、筆者の主張を支える位置へ置く

### Loop 2: 読者理解・反論耐性・役割境界

目的:

**中心主張を変えずに、読者が納得できる具体性と反論耐性を作る。**

ペルソナ:

1. **Coding Agent Practitioner**
   - 実務の場面へ落とせるか
   - 抽象概念だけで終わっていないか
   - Before / Afterの判断差が分かるか

2. **Product Manager**
   - 「エンジニアがPdMになる」という誤読を生まないか
   - Product / Engineeringの責任境界が雑になっていないか
   - Problem / Outcome / Scopeが適切に扱われているか

3. **Engineering Manager / CTO**
   - 個人の能力論だけでなく、チームの意思決定として理解できるか
   - 技術制約、リスク、権限、停止条件が判断へ接続しているか
   - 実装速度と組織の意思決定速度を混同していないか

改善方針:

- 中心主張を説明する具体例を1つ強くする
- 主要な反論には本文内で答える
- 職種論へ逸れず「専門性を接続する」話として整理する
- Evidence不足なら「作らない / 先に計測する」という判断も示す
- 新しい概念を増やす場合は、主題を補助する役割に限定する

### Loop 3: 編集・密度・最終主張

目的:

**読者が最短距離で中心主張へ到達し、同じ主張を持ち帰れる状態にする。**

ペルソナ:

1. **note Editor**
   - スマホ可読性
   - 段落リズム
   - 見出し
   - 重複
   - 硬すぎる表現
   - 終盤の密度

2. **First-time Reader**
   - 前記事を読んでいなくても理解できるか
   - 専門用語が多すぎないか
   - 「この記事で何が新しく分かったか」が明確か

3. **Thesis Guardian**
   - 新キーワードがClaimを奪っていないか
   - 結論がタイトルの問いへ答えているか
   - 最後までArticle Contractが保たれているか

改善方針:

- 終盤の重複を統合する
- 派生概念は削除・短縮・次記事へ送る
- タイトルと最後の一文を呼応させる
- 新しいキャッチーな概念を「第二の主題」にしない

## Thesis Gate

各Improveの直後に、改善担当とは独立したエージェントで再レビューする。

次をすべて満たす場合のみ通過。

- [ ] Topicが変わっていない
- [ ] Claimの方向と強さが維持されている
- [ ] Reader Promiseが維持されている
- [ ] 第二の中心テーマが追加されていない
- [ ] タイトル・冒頭・結論が同じ主題を指している
- [ ] 反論処理によって結論が曖昧になっていない

1つでも満たさない場合:

1. 後続の自動改善を停止する
2. driftした箇所を記録する
3. 人間の判断なしに別の主張へ修正しない

## 指摘の優先順位

| 優先度 | 定義 |
| --- | --- |
| must | 主題・事実・論理の破綻。公開前に必須 |
| high | 読者の理解や中心主張を大きく弱める |
| medium | 改善価値はあるが主張理解には致命的でない |
| low | 好み・微調整 |

`medium / low` は「直せるから直す」ではなく、**Article Contractを強める場合だけ採用**する。

## 具体例の扱い

具体例は読者理解に有効だが、追加そのものを目的にしない。

採用条件:

- Claimを説明する
- 抽象論と実務判断を接続する
- 実際の情報または明示した仮想例である
- 新しい論点を増やさない

禁止:

- 著者が提示していない実体験を作る
- 架空の数値を実績として書く
- 例の説明が本文の主張より長くなる
- 例から新しい中心テーマを生やす

## 外部情報・引用

外部人物、記事、調査、仕様を使う場合:

- 可能な限り一次情報を確認する
- 外部の主張と筆者独自の解釈を分ける
- 外部情報を「答え」として使わない
- 外部情報の権威で筆者の主張を代替しない

理想:

```text
実務から得た問い / 仮説
        ↓
外部情報との接続
        ↓
自分なりの分解・解釈
        ↓
実務へ戻す
```

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
- [ ] 外部情報の紹介記事へ変質させない
- [ ] 著者未提示の体験・数値・事実を作らない
- [ ] `published/` 記事を自動で公開・上書きしない
- [ ] 自動マージしない

## 参考

- `.claude/skills/note-article-review/SKILL.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/workflows/note-thesis-review-loop.js`
- `.claude/workflows/article-review-improve-loop.js`
