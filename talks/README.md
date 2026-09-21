# talks

登壇資料を、記事とは独立した成果物として管理する。

記事は入力ソースの1つにできるが、登壇資料を作るために記事作成を必須にしない。

## 基本フロー

```text
Theme / Memo / Research / Issue / Article
                ↓
            Talk Brief
                ↓
          Story Architecture
                ↓
          Visual Contract
                ↓
               Deck
                ↓
          Speaker Notes
                ↓
       Multi-persona Review
                ↓
       Source Verification
                ↓
              Render
                ↓
         Visual Verification
                ↓
            Rehearsal
                ↓
             Finalize
```

## ディレクトリ構成

```text
talks/
├── DESIGN.md
├── README.md
├── _templates/
│   ├── brief.md
│   ├── story.md
│   ├── design.md
│   ├── deck.md
│   ├── speaker-notes.md
│   └── review.md
└── <slug>/
    ├── brief.md
    ├── story.md
    ├── design.md
    ├── deck.md
    ├── speaker-notes.md
    ├── references.md        # 必要な場合
    └── review.md
```

## Contracts

### Talk Contract

`talks/<slug>/brief.md` を内容の正本とする。

- audience
- duration_minutes
- core_thesis
- takeaways
- evidence
- constraints

### Visual Design System

`talks/DESIGN.md` を全登壇共通の視覚設計ルールとする。

中心原則:

> **1 slide = 1 attention target**

### Visual Contract

`talks/<slug>/design.md` を今回の登壇固有の視覚契約とする。

- Visual Intent
- Audience Environment
- Attention Strategy
- Key Figures
- Slide Families
- Machine Constraints
- Talk-specific Exceptions

StoryやDeckの改善でTalk Contract / Visual Contractを暗黙に変更しない。

## 6 Quality Axes

登壇資料を次の軸で評価する。

1. Focus
2. Flow
3. Hierarchy
4. Legibility
5. Truthfulness
6. Speakability

「情報量が少ない」だけでは良いスライドとは判定しない。
話者の説明と同期し、その瞬間に聴衆が見るべきものを迷わせないことを重視する。

## 入力パターン

### テーマから直接作る

```text
/talk-workflow ai-review-flow
```

### 既存メモ・調査結果から作る

```text
/talk-workflow ai-review-flow docs/research.md
```

### 既存記事から派生する

```text
/talk-workflow ai-review-flow articles/example.md
```

記事本文をそのままスライドへ変換しない。
中心主張・根拠・具体例をTalk Briefへ抽出し、Spoken Storyとして再構成する。

## 品質原則

- 1 slide = 1 attention target
- messageとattentionを分ける
- 読ませる資料ではなく、話を聞くための資料にする
- 複雑な構造はProgressive Disclosureする
- 図中テキストはラベル中心
- 重要な事実・数値・仕様は出典を保持
- 時間予算を使い切らない
- Speaker Notesへ説明を分離
- Source VerificationとRender Verificationを分離
- 実リハーサル前に時間成立を断定しない
- 最終レビューは6 personas / 6 quality axes

## Review Personas

- Audience
- Speaker
- Editor
- Presentation Designer
- Technical
- Accessibility

## 既存Skillの再利用

- `.claude/skills/article-domain-review/SKILL.md`
  - 公式事実 / チーム運用 / 筆者解釈の境界
- `.claude/skills/article-humanizer-ja/SKILL.md`
  - AI定型表現や不自然な日本語
- `.claude/skills/article-visual-review/SKILL.md`
  - semantic consistency / redundancy

登壇固有の視覚設計は `talks/DESIGN.md` / `talk-design` / `talk-slide-design` / `talk-review` を優先する。

## 機械検査

```bash
npm run check:talk -- <slug>
```

全登壇成果物:

```bash
npm run check:talk
```

Source Checkでは、required artifacts、Talk/Visual Contract、slide metadata、density、notes対応、予定時間、review verdict整合を確認する。

Source Check PASSはRender PASSを意味しない。

## Render / Rehearsal

### Render

可能ならPDFまたは画像へ書き出し、clipping、overlap、actual font size、margin、contrast、missing visualを確認する。

### Rehearsal

実際に話し、measured time、transition、attention synchronization、Cut Listを確認する。

Visual ContractがRender/Rehearsalを要求しているのに未実施なら最終Verdictは `UNVERIFIED`。

## 参考

設計思想の参考:

- https://github.com/minorun365/minorun-marp-skill
- https://qiita.com/minorun365/items/ed4c760f616cf3c0a958

コード・テーマ・検査ツールは初回実装ではvendoringしない。
