---
title: "River Reviewは誰がレビューを実行するのか"
---

River Reviewという名前から、専用のAIレビューモデルが常に動く仕組みを想像するかもしれません。

実際には、**起動する場所**と**判断を実行する主体**は分かれています。

この章では実行surfaceだけを整理します。複数Reviewer Roleの設計は第23章で扱います。

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

River Reviewはcapability packとして、既存エージェントへチームのレビュー判断を追加します。

## 2. Deterministic / Heuristic

すべてのレビューにLLMは必要ありません。

schema validation、明示ルールの検査、Findingの構造検証、Coverage集計、既知patternのheuristicなどは、より決定論的に実行できます。

「何をLLMへ渡さないか」も実行モデルの一部です。判断の配置原則は第12章で詳しく扱います。

## 3. Headless LLM

GitHub Actions経由のheadless実行では、River Review側からLLM providerを呼び出します。

~~~text
GitHub Actions
      ↓
River Review
      ↓
LLM provider
~~~

CI上で継続的にレビューしたい場合はこちらが使えます。GitHub ActionはImplementedですが、Stable InterfacesではBeta（v0.x）扱いで、inputsや挙動がminor versionで変わる可能性があります。

## 実行surfaceと判断所有権を混ぜない

PluginでもCIでも、Review Judgmentの正本はチーム側へ置けます。

~~~text
Execution surface changes
Claude / Codex / CI
        ↓
Review Judgment remains
Skill / Rule / Artifact / Eval
~~~

この分離があると、モデルや実行環境が変わっても「何を重要と考えるか」を残せます。

## この章で持ち帰ること

River Reviewは、特定モデルに固定されたAIレビュアーではありません。

**複数の実行surfaceから、チーム所有のReview Judgmentを実行できる層**です。

次の第3部では、実行する判断そのものをSkill / Artifact / Evidence / Placement / Human Judgmentへ分解します。

### Sources
- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [What is River Review](https://github.com/s977043/river-review/blob/main/pages/explanation/what-is-river-review.md)
