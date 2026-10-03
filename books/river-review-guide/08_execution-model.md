# River Reviewは誰がレビューを実行するのか

River Reviewという名前から、専用のAIレビューモデルが常に動く仕組みを想像するかもしれません。

実際には、**起動する場所**と**判断を実行する主体**は分かれています。

現在の利用形態は大きく3つに整理できます。

## 1. AIエージェント駆動

Claude CodeやCodexなどのエージェントがRiver ReviewのSkillを読み、自身のモデルでレビューします。

~~~text
Claude Code / Codex
      ↓
River Review Skill
      ↓
Agent's own model
      ↓
Review result
~~~

この経路では、通常River Review用の別LLM API Keyは必要ありません。

River Reviewはcapability packとして、エージェントへチームのレビュー判断を追加します。

## 2. Deterministic / Heuristic

すべてのレビューにLLMは必要ありません。

schema validation、明示ルールの検査、findingの構造検証、coverage集計、既知patternのheuristicなどは、より決定論的に実行できます。

この発想は後で扱うJudgment Placementにつながります。

## 3. Headless LLM

GitHub Actionsやstandaloneのrunnerでは、River Review側からLLM providerを呼び出す経路があります。

~~~text
GitHub Actions / runner
      ↓
River Review
      ↓
LLM provider
~~~

CI上で継続的にレビューしたい場合はこちらが使えます。

## 実行方法と判断所有権を混ぜない

3つの経路があっても、Review Judgmentの正本はチーム側へ置けます。

~~~text
Execution surface changes
Claude / Codex / CI
        ↓
Review Judgment remains
Skill / Rule / Artifact / Eval
~~~

モデルや実行環境が変わっても、「何を重要と考えるか」を残します。

## Review Teamも完全自律な独立組織ではない

River Reviewには、bug-hunter / security-scanner / test-gap / dependency-reviewerなどのReviewer Roleがあります。

ただし現在のReview Teamは、複数の完全独立エージェントが勝手に意思決定する構造ではありません。

1つのorchestrator内で観点別roleを並列実行し、findingsを統合します。

~~~text
Review Orchestrator
  ├─ bug-hunter
  ├─ security-scanner
  ├─ test-gap
  └─ dependency-reviewer
          ↓
      findings[]
~~~

目的はAgent数を増やすことではなく、**レビュー観点の責務を分離すること**です。

## この章で持ち帰ること

River Reviewは、特定モデルに固定されたAIレビュアーではありません。

AIエージェント、CI、機械的チェックのどこからでも、チーム所有のReview Judgmentを実行できるようにする仕組みです。

### Sources
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [What is River Review](https://github.com/s977043/river-review/blob/main/pages/explanation/what-is-river-review.md)
