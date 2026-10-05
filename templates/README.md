# Templates

再利用可能な成果物テンプレートを置く。

## Zenn Book

- `zenn-book/` — Reader Contract / Source Map / Editorial QA / Publish Checklistを含むZenn Bookテンプレート
- 生成: `npm run new:zenn-book -- <slug> --title "..." --summary "..." --topics "AI,開発"`
- 作成・レビュー手順: `.claude/skills/zenn-book-writing/SKILL.md`

template自体は `books/` 配下に置かない。Zenn CLIが公開Bookとして認識しない場所で管理する。
