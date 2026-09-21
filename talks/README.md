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
             Deck
                ↓
          Speaker Notes
                ↓
       Multi-persona Review
                ↓
             Finalize
```

## ディレクトリ構成

```text
talks/
├── README.md
├── _templates/
│   ├── brief.md
│   ├── story.md
│   ├── deck.md
│   ├── speaker-notes.md
│   └── review.md
└── <slug>/
    ├── brief.md
    ├── story.md
    ├── deck.md
    ├── speaker-notes.md
    ├── references.md        # 必要な場合
    └── review.md
```

## SSoT

`talks/<slug>/brief.md` を登壇の契約（Talk Contract）の正本とする。

最低限、次を固定する。

- audience: 誰に話すか
- duration_minutes: 何分話すか
- core_thesis: 一番伝えたいこと
- takeaways: 聴衆が持ち帰るもの
- evidence: 主張を支える一次情報・実体験
- constraints: イベント要件、公開可否、利用可能な素材

`story.md` や `deck.md` の改善で `core_thesis` を勝手に変更しない。

## 入力パターン

### 1. テーマから直接作る

記事は不要。

```text
/talk-workflow ai-review-flow
```

会話中のテーマ・メモ・要件から Talk Brief を起こす。

### 2. 既存メモ・調査結果から作る

```text
/talk-workflow ai-review-flow docs/research.md
```

### 3. 既存記事から派生する

```text
/talk-workflow ai-review-flow articles/example.md
```

記事をスライドへ逐語変換しない。Talk Briefへ必要な主張・事例・根拠だけ抽出し、話し言葉向けに再構成する。

## 品質原則

- 1 slide = 1 message
- 読ませる資料ではなく、話を聞くための資料にする
- 複雑な構造は Progressive Disclosure で段階表示する
- 図中テキストはラベル中心にし、説明文を詰め込まない
- 重要な事実・数値・仕様は出典を保持する
- 時間予算を超える枚数・説明量を作らない
- Speaker Notes に、スライドに書かない説明を逃がす
- 最終レビューは Audience / Speaker / Editor / Technical の4観点で行う

## 既存Skillの再利用

登壇資料固有のSkillだけで完結させず、必要に応じて既存の品質保証を使う。

- `.claude/skills/article-domain-review/SKILL.md`
  - 公式事実 / チーム運用 / 筆者解釈の境界確認
- `.claude/skills/article-humanizer-ja/SKILL.md`
  - AI定型表現や不自然な日本語の検出
- `.claude/skills/article-visual-review/SKILL.md`
  - 図の意味整合・冗長性の考え方を参照。ただし登壇資料固有の配置判定は `talk-slide-design` / `talk-review` を優先

## 参考

スライド作成の設計思想として以下を参照する。ただしコード・テーマ・検査ツールは初回実装ではvendoringしない。

- https://github.com/minorun365/minorun-marp-skill
- https://qiita.com/minorun365/items/ed4c760f616cf3c0a958
