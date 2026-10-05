# Existing article mode

> Canonical detail for Mode B (existing article upstream quality review). Entrypoint: `.claude/skills/tech-blog-writing/SKILL.md`.

### Mode B: 既存記事を確認する

対象パス:

- `articles/<slug>.md`
- `Qiita/public/<slug>.md`
- `articles_note/new/<slug>.md`
- `articles_note/drafts/<slug>.md`（読み取り専用であることを明記）
- `articles_note/published/<slug>.md`（公開済みであることを明記）
- `articles_izanami/<slug>.md`

#### B-1. 中心主張を抽出する

本文から次を1文ずつ抽出する。

- 想定読者
- 読者の問題
- 中心主張
- 読後に残す理解・判断・行動

抽出できない場合は欠落として指摘する。ただし、すべての記事に明示的なCTAや行動を要求しない。

#### B-2. 6ゲートで確認する

1. **Reader Gate**: 誰の何を解決する記事か
2. **Experience Gate**: 実際の経験、観測、判断変化があるか
3. **Evidence Gate**: 主張と根拠が対応しているか
4. **Scope Gate**: 適用条件と未検証範囲が明確か
5. **Subtraction Gate**: 一般論、重複、別テーマを削れるか
6. **Channel Gate**: 媒体役割、形式、読者意図に適合するか

各ゲートを `PASS` / `WARN` / `FAIL` で判定する。指摘ゼロを許容し、問題を捏造しない。

#### B-3. 既存レビューへ引き渡す

本スキルは記事の上流品質を確認する。必要に応じて次へ接続する。

- 文体・AI特有表現: `/humanize-review <path>`
- Zennの詳細レビュー: `/review-article <slug>`
- noteの詳細レビュー: `/review-note-article <state>/<slug>`
- 多視点検証: `/multi-review <path> <観点>`

レビュー後の状態遷移は `docs/article-lifecycle-contract.md` に従う。ここで `REVIEWED` / `READY` / `APPROVED` を独自定義しない。

```text
Existing Article
  ↓
媒体別Review
  ↓
既存Final Gate
  ↓
Human Approval
  ↓
Publish
  ↓
Metrics
  ↓
Learning Proposal
```

本スキルの役割は、次に渡すべき既存フローを明示するところまでとする。
