---
title: "Codexはプロンプトではなくルールで制御する"
emoji: "🧠"
type: "tech"
topics: ["codex", "ai駆動開発", "llm", "agents-md", "プロンプト"]
published: false
---

## はじめに

Codex にコードを書かせていると、こういう挙動にぶつかることがあります。

- ちょっとした修正なのに大規模リファクタを始める
- 既存設計を無視して新しい構成を作る
- 不要な依存を勝手に追加する
- エラー処理を省略する
- 未完成のコードで止まる

知識が足りないわけではありません。

問題は **「判断の基準がないこと」** です。

この記事の結論はシンプルです。

> Codex は「プロンプト」で制御するものではない。  
> **判断ルールで制御する実行環境** として設計するものです。

その中核になるのが `developer_instructions` です。

## この記事で扱うこと

この記事では、`developer_instructions` を「強いプロンプト」ではなく、AI エージェントの判断レイヤーとして整理します。

扱う内容は次の 4 つです。

- `developer_instructions` と `AGENTS.md` の違い
- なぜ判断ルールが Codex の挙動を安定させるのか
- 実務で使えるテンプレート
- よくあるアンチパターン

## developer_instructions とは何か

`developer_instructions` は、Codex の振る舞いを制御するための上位レイヤーの指示です。

雑に言うと、Codex に対して次のようなことを定義できます。

- どう判断するか
- どう実装するか
- 何を避けるか
- どのような出力形式にするか
- いつ完了とみなすか

重要なのは、これは単なる補足情報ではないという点です。

`AGENTS.md` のようなプロジェクトローカルな指示よりも、より上位の制御レイヤーとして扱われるため、AI エージェントの挙動に強い影響を与えます。

## ざっくりした命令階層

概念的には、次のような階層で考えると理解しやすいです。

```text
developer_instructions
↓
system prompt
↓
AGENTS.md
↓
user input
```

ただし、内部実装の詳細を外部から完全に断定することはできません。

この記事では、実務上の設計モデルとして `developer_instructions` を「上位の判断ルール」として扱います。

## 一言で理解する

```text
developer_instructions = 行動ルール
AGENTS.md = 文脈
user prompt = タスク
```

Codex は「命令を実行するだけのツール」ではありません。

**ルールに従って判断するエージェント** として扱う方が、実務では安定します。

## AGENTS.md との違い

`AGENTS.md` と `developer_instructions` は混同しやすいですが、役割はかなり違います。

| 項目 | developer_instructions | AGENTS.md |
| --- | --- | --- |
| 主な役割 | 判断ルールの定義 | プロジェクト文脈の共有 |
| スコープ | エージェント全体の振る舞い | リポジトリやディレクトリ単位 |
| 内容 | 方針、制約、完了条件、安全ルール | 構成、コマンド、規約、注意点 |
| 性質 | ポリシーに近い | README に近い |
| 例 | 破壊的操作は確認する | テストは `pnpm test` で実行する |

一言で分けるなら、こうです。

```text
developer_instructions = どう判断するか
AGENTS.md = このプロジェクトではどう動くか
```

## なぜ developer_instructions が重要なのか

AI エージェントにコードを書かせるとき、失敗の多くは「知識不足」ではなく「判断ミス」から起きます。

たとえば、次のようなケースです。

- 小さな修正で済むのに大規模リファクタを始める
- 既存設計を無視して新しい構成を作る
- 必要ない依存を追加する
- 未検証のまま完了する
- エラー処理を省く
- placeholder を残す
- マイグレーションや削除操作を勝手に実行する

これらは、個別のプロンプトで毎回注意することもできます。

しかし、毎回書くのは面倒ですし、抜け漏れも起きます。

そこで `developer_instructions` に「判断ルール」として定義しておくと、エージェントの挙動を安定させやすくなります。

## なぜ developer_instructions が効くのか

LLM は基本的に以下の性質を持ちます。

- 与えられた指示の中で一貫した振る舞いを作ろうとする
- 明示されたルールがあると、それを優先して行動する
- 判断基準が曖昧な場合、それっぽい最適解を選ぶ

つまり、こういうことです。

```text
ルールがない → 推測で動く → 挙動がブレる
ルールがある → 判断基準が固定される → 挙動が安定する
```

`developer_instructions` は、この「判断基準」を固定するレイヤーです。

そのため、単発のプロンプトよりも強く効きます。

## Prompt Engineering から Prompt Architecture へ

従来のプロンプトエンジニアリングは、主に「その場でどう指示するか」が中心でした。

```text
このコードを直して
テストも書いて
簡潔に説明して
```

一方で、`developer_instructions` を使う発想は少し違います。

```text
どのような原則で判断するエージェントにするか
どのルールを常に適用するか
どの条件を満たしたら完了とするか
```

つまり、プロンプトを書くというより、**エージェントの実行環境を設計する**感覚に近いです。

これは、Prompt Engineering というより **Prompt Architecture** と呼んだ方がしっくりきます。

## 実務で使える developer_instructions テンプレート

以下は、実務でそのまま使いやすい形に整理したテンプレートです。

```text
# === Core Behavior ===
- Always prioritize correctness over speed
- Do not guess; ask clarifying questions when uncertain
- Follow instructions strictly unless they conflict with higher-priority rules

# === Decision Rules ===
- Prefer minimal changes over large refactors
- Preserve existing architecture and conventions
- Avoid introducing new dependencies unless necessary

# === Coding Standards ===
- Write clear, readable, and maintainable code
- Use explicit naming; avoid vague variable names
- Handle errors explicitly; avoid silent failures
- Add comments only when necessary for clarity

# === Execution Strategy ===
- Understand the problem before writing code
- Break complex tasks into smaller steps
- Validate assumptions before implementation
- Ensure output is directly usable; avoid placeholders

# === Safety & Constraints ===
- Do not perform destructive operations without confirmation
- Avoid security risks such as injection, secrets exposure, and unsafe eval
- Respect environment limitations

# === Output Rules ===
- Return complete, runnable code
- Do not include unnecessary explanations unless requested
- Keep responses concise and structured

# === When Done ===
- The solution works as intended
- Edge cases are handled
- Code passes tests or is testable
```

## なぜこの構造なのか

このテンプレートは、単に良さそうなルールを並べたものではありません。

エージェントの判断をレイヤーごとに安定させるために分けています。

## 1. Core Behavior

```text
# === Core Behavior ===
- Always prioritize correctness over speed
- Do not guess; ask clarifying questions when uncertain
- Follow instructions strictly unless they conflict with higher-priority rules
```

ここでは、エージェントの基本的な判断軸を定義します。

これは「人格」ではありません。

重要なのは、次のような判断基準です。

- 速さより正確性を優先する
- 不確実なときに推測しない
- 指示の優先順位を守る

AI にありがちな失敗のひとつは、曖昧な状態でもそれっぽく進めてしまうことです。

そのため、最上位の行動原則として「推測しない」「不確実なら確認する」を入れておく価値があります。

## 2. Decision Rules

```text
# === Decision Rules ===
- Prefer minimal changes over large refactors
- Preserve existing architecture and conventions
- Avoid introducing new dependencies unless necessary
```

ここでは、迷いやすい判断を固定します。

たとえば、AI エージェントはしばしば次のような行動をします。

- 必要以上にリファクタする
- 既存構成を無視する
- 便利そうなライブラリを追加する
- 周辺ファイルまで触る

実務では、これがかなり危険です。

特に既存プロダクトでは、正しいコードを書くこと以上に、**既存の設計と整合すること**が重要です。

そのため、次のようなルールが効きます。

```text
最小変更を優先する
既存アーキテクチャを尊重する
不要な依存を追加しない
```

これは、AI に「賢くやれ」と言うよりも具体的です。

## 3. Coding Standards

```text
# === Coding Standards ===
- Write clear, readable, and maintainable code
- Use explicit naming; avoid vague variable names
- Handle errors explicitly; avoid silent failures
- Add comments only when necessary for clarity
```

ここでは、コード品質の最低ラインを定義します。

AI のコードは一見動きそうでも、次のような問題が起きがちです。

- 変数名が曖昧
- エラーが握りつぶされる
- コメントが多すぎる
- 一時的な実装がそのまま残る

特に重要なのは、エラー処理です。

```text
Handle errors explicitly; avoid silent failures
```

これは本番コードでは必須です。

AI にコードを書かせる場合、正常系だけではなく異常系を明示的に扱わせる必要があります。

## 4. Execution Strategy

```text
# === Execution Strategy ===
- Understand the problem before writing code
- Break complex tasks into smaller steps
- Validate assumptions before implementation
- Ensure output is directly usable; avoid placeholders
```

個人的には、このセクションがかなり重要です。

AI エージェントは、いきなり実装に入ることがあります。

しかし、実務ではいきなり書くよりも、先にやるべきことがあります。

- 問題を理解する
- 影響範囲を確認する
- 前提を検証する
- 小さく分解する
- 実装後に確認する

ここを `developer_instructions` に入れておくことで、「とりあえず書く」挙動を抑えやすくなります。

## 5. Safety & Constraints

```text
# === Safety & Constraints ===
- Do not perform destructive operations without confirmation
- Avoid security risks such as injection, secrets exposure, and unsafe eval
- Respect environment limitations
```

本番運用では必須のレイヤーです。

特に危険なのは次のような操作です。

- ファイル削除
- DB マイグレーション
- 本番データ変更
- secret の出力
- `eval` やコマンドインジェクションにつながる実装
- 既存設定の破壊

AI エージェントが強力になるほど、事故の影響も大きくなります。

そのため、破壊的操作やセキュリティリスクについては、事前にルール化しておくべきです。

## 6. Output Rules

```text
# === Output Rules ===
- Return complete, runnable code
- Do not include unnecessary explanations unless requested
- Keep responses concise and structured
```

地味ですが、実務の体験を大きく変えるのがこのセクションです。

これがないと、AI の出力は次のようになりがちです。

- 説明が長すぎる
- コードが途中までしかない
- placeholder が残る
- 実行できない断片コードが返る
- 重要な変更点が埋もれる

特に以下は強く入れておきたいです。

```text
Return complete, runnable code
```

AI の出力は、読めるだけではなく、**そのまま使える**必要があります。

## 7. When Done

```text
# === When Done ===
- The solution works as intended
- Edge cases are handled
- Code passes tests or is testable
```

これは「完了」の定義です。

AI エージェントに作業させるとき、完了条件が曖昧だと、中途半端なところで止まります。

たとえば、以下のような状態です。

- 実装だけしてテストしない
- エッジケースを見ない
- 型エラーを確認しない
- 動作確認の観点がない
- TODO を残す

人間の開発でも Definition of Done が重要なように、AI エージェントにも Done 条件が必要です。

## 強化版テンプレート

より実務向けにするなら、以下を追加すると精度が上がります。

```text
# === Reasoning Control ===
- Think step-by-step for complex tasks
- Double-check critical logic before output
- Consider edge cases explicitly

# === Diff Discipline ===
- Minimize changes to existing code
- Avoid touching unrelated files
- Maintain backward compatibility

# === Review Mode ===
- After generating code, review it for:
  - bugs
  - edge cases
  - readability
```

## Reasoning Control

複雑なタスクでは、AI にいきなり答えを出させるより、段階的に考えさせる方が安定します。

ただし、重要なのは「長く考えろ」と書くことではありません。

見るべき観点を具体化することです。

```text
- critical logic
- edge cases
- assumptions
```

このように対象を明確にすると、出力の品質が上がりやすくなります。

## Diff Discipline

既存プロダクトでは、差分の小ささが重要です。

```text
# === Diff Discipline ===
- Minimize changes to existing code
- Avoid touching unrelated files
- Maintain backward compatibility
```

AI は、問題解決のために周辺コードまで変更しようとすることがあります。

しかし、チーム開発ではそれがレビュー負荷になります。

そのため、AI には明示的にこう伝えるべきです。

```text
関係ないファイルを触らない
既存互換性を壊さない
差分を小さくする
```

これはかなり効きます。

## Review Mode

AI にコードを出させたあと、もう一度自分で見直させるルールです。

```text
# === Review Mode ===
- After generating code, review it for:
  - bugs
  - edge cases
  - readability
```

これは人間のセルフレビューに近いです。

特に以下の観点は効果があります。

- バグがないか
- エッジケースを見ているか
- 読みやすいか
- 既存設計と合っているか
- 不要な変更がないか

AI は一発目の出力よりも、レビュー後の出力の方が安定することがあります。

## 実務での使い分け

### 小規模開発

小規模な個人開発であれば、シンプル版で十分です。

```text
Core Behavior
Decision Rules
Coding Standards
Output Rules
When Done
```

過剰にルールを入れると、かえって重くなります。

### チーム開発

チーム開発では、強化版まで入れた方が良いです。

```text
Core Behavior
Decision Rules
Coding Standards
Execution Strategy
Safety
Output Rules
When Done
Diff Discipline
Review Mode
```

特に重要なのは以下です。

- 既存設計を尊重する
- 関係ないファイルを触らない
- 互換性を壊さない
- 破壊的操作をしない
- テスト可能な状態にする

### 本番プロダクト

本番プロダクトでは、次の 3 つは必須です。

```text
Safety
Diff Discipline
When Done
```

理由はシンプルです。

- 事故を防ぐ
- レビュー負荷を減らす
- 中途半端な実装を防ぐ

AI を本番開発に入れるなら、生成能力よりも制御設計の方が重要になります。

## よくあるアンチパターン

### 1. 長すぎる

ルールを詰め込みすぎると、かえって効きづらくなります。

悪い例です。

```text
- Always write beautiful, excellent, modern, robust, scalable, secure, performant, readable, elegant code...
```

抽象的な形容詞が増えるほど、実効性は下がります。

### 2. 抽象的すぎる

悪い例です。

```text
- Follow best practices
- Write good code
- Be professional
```

これでは何をすればいいのか曖昧です。

良い例はこうです。

```text
- Avoid introducing new dependencies unless necessary
- Handle errors explicitly
- Avoid touching unrelated files
```

具体的な行動に落とすのが重要です。

### 3. AGENTS.md と混ぜる

`developer_instructions` と `AGENTS.md` に同じようなことを書きすぎると、役割が曖昧になります。

おすすめは分けることです。

```text
developer_instructions:
- 判断原則
- 安全制約
- 出力ルール
- 完了条件

AGENTS.md:
- プロジェクト構成
- セットアップ方法
- テストコマンド
- ディレクトリごとの規約
- 使用技術
```

### 4. 矛盾するルールを書く

たとえば、以下は衝突しやすいです。

```text
- Always keep responses short
- Explain all reasoning in detail
```

また、以下も危険です。

```text
- Never ask questions
- Ask clarifying questions when uncertain
```

矛盾したルールは、エージェントの挙動を不安定にします。

## 良い developer_instructions の条件

良い `developer_instructions` は、お願い文ではありません。

行動ルールです。

```text
悪い例:
- 丁寧に実装してください
- いい感じにしてください
- 品質高くしてください

良い例:
- Prefer minimal changes over large refactors
- Handle errors explicitly
- Do not perform destructive operations without confirmation
- Return complete, runnable code
```

ポイントは、AI が次の行動を決められる粒度まで落とすことです。

## まとめ

`developer_instructions` は、強いプロンプトではありません。

**意思決定を固定するためのレイヤー** です。

良いテンプレートは、次のように設計します。

- 「どう書くか」だけを指示しない
- 「どう判断するか」を定義する
- 完了条件まで明示する

最後に一言でまとめると、こうです。

> 良いテンプレート = 行動ルール  
> 悪いテンプレート = ただのお願い文

ここを設計できるかどうかで、AI は「便利ツール」から **安定した開発パートナー** になります。
