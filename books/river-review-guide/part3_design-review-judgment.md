# 第3部 レビュー判断を設計する

ここからは、River Reviewの中核を5つの問いへ分けます。

1. **何を判断するか** — Skill
2. **何を入力として受け取るか** — Artifact
3. **何を根拠にするか** — Evidence
4. **どの層で判断するか** — Judgment Placement
5. **誰が責任を持つか** — Human Judgment

この5つを分離すると、「AIレビューを信頼できるか」という曖昧な問いを、設計できる問題へ変えられます。

本部では説明用の仮想例として、次の変更を使います。

> User Profile APIへ optional な locale フィールドを追加し、UI表示とテストも更新する。

単純に見える変更ですが、実際にはAPI contract、既存consumer、locale定義、テスト、Human Judgmentの境界まで含みます。

同じ変更を、Skill / Artifact / Evidence / Judgmentの視点から順に見ていきます。
