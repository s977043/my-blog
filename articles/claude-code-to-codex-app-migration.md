---
title: "Claude CodeからCodex Appへ移行する実践ガイド"
emoji: "🛠️"
type: "tech"
topics: ["codex", "claudecode", "openai", "mcp", "ai駆動開発"]
published: false
---

:::message
**この記事で得られること**

- Claude CodeからCodex Appへ移るときに、何をそのまま移せて、何を見直すべきかが分かる
- `CLAUDE.md`、Skills、Slash commands、MCP、Subagents、Hooks、Automationsの移行方針を整理できる
- 自動インポート後に事故りやすい確認ポイントをチェックリスト化できる
:::

最近、開発作業の一部をClaude CodeからCodex Appへ移しています。

Claude Codeに慣れている人ほど、Codex Appへ移ると細かいところで迷います。設定ファイル、Skills、Slash commands、MCP、Subagents、Hooks、承認フロー、自動実行。似ている部分もありますが、置き場所や考え方は少しずつ違います。

この記事では、Claude CodeからCodex Appへ移行するときの考え方と、実際に確認すべきポイントを整理します。

:::message alert
この記事は「Claude CodeとCodex Appの完全互換表」ではありません。  
実務では、コピーで済む部分と、Codex側の設計に合わせて組み直した方がよい部分があります。
:::

## TL;DR

Claude CodeからCodex Appへの移行は、次の順番で進めるのが安全です。

1. Codex Appの自動インポートを使う
2. `AGENTS.md`、Skills、MCPを確認する
3. Subagents、Hooks、承認フローはCodex側で再設計する
4. 自動実行はAutomationsとWorktreeを前提に組み直す
5. 最初から完全移行せず、しばらくはClaude CodeとCodex Appを併用する

移行対象は、ざっくり3つに分けると判断しやすいです。

| 分類 | 対象 | 方針 |
| --- | --- | --- |
| ほぼ移せる | `CLAUDE.md`、基本的なSkills | まずコピーして、固有名やパスを直す |
| 確認して移す | Slash commands、MCP、settings | 自動インポート後に動作確認する |
| 設計し直す | Subagents、Hooks、承認、自動実行 | Codex側の仕組みに合わせて組み直す |

## まずは自動インポートから始める

Codex Appには、他のエージェント設定を取り込むためのインポート機能があります。

Codex Appを開き、以下の流れで進めます。

```text
Settings
  -> General
    -> Import other agent setup
```

このインポートでは、Claude Code側の設定のうち、移行可能なものをまとめて検出できます。

対象になり得るものは、たとえば以下です。

- instruction files
- settings
- skills
- MCP server config
- hooks
- slash commands
- subagents

最初から手で全部書き換える必要はありません。まずは自動インポートで移せるものを移し、その後で差分をレビューするのが現実的です。

:::message
この記事で後述する手動移行は、自動インポート後の確認ポイントとして読むのがおすすめです。
:::

## 移行対応マップ

まず、全体像です。

| Claude Code側 | Codex側 | 移行難易度 | コメント |
| --- | --- | --- | --- |
| `CLAUDE.md` | `AGENTS.md` | ◎ | かなり移しやすい |
| Skills | Codex Skills | ○ | 形式は近いが保存先を確認 |
| Slash commands | Skills / Custom prompts | △ | 原則Skillsへ寄せる |
| MCP | `config.toml` | △ | env、headers、transportを確認 |
| Subagents | Custom agents | △〜× | そのままではなく再設計前提 |
| Hooks | Codex Hooks | △〜× | イベント差分と承認設計を確認 |
| 権限・承認 | approval / sandbox / permissions | △ | 事故防止のため別途確認 |
| 自動実行 | Automations / Worktree | △ | トリガー移植ではなくワークフロー再設計 |

ポイントは、**同じ名前の機能があっても、運用の単位が同じとは限らない**ことです。

`CLAUDE.md` やSkillsは比較的移しやすいです。一方で、Subagents、Hooks、自動実行は「Claude Codeの挙動を再現する」よりも「Codex側で安全に動く形へ組み直す」と考えた方がうまくいきます。

## `CLAUDE.md` から `AGENTS.md` へ

Claude Codeでは、プロジェクト固有の指示や開発ルールを `CLAUDE.md` に書くことが多いと思います。

Codexでは、この役割を `AGENTS.md` が担います。

基本的には、まずコピーしてから調整する方針で問題ありません。

```bash
cp CLAUDE.md AGENTS.md
```

グローバル設定も同じ考え方です。

```text
Claude Code:
~/.claude/CLAUDE.md

Codex:
~/.codex/AGENTS.md
```

プロジェクト単位では、リポジトリ直下に `AGENTS.md` を置きます。

```text
my-app/
  AGENTS.md
  package.json
  src/
```

### 書き換えるべき内容

`CLAUDE.md` をそのまま `AGENTS.md` にしても、基本方針や開発コマンドは流用しやすいです。

たとえば、以下のような内容はCodexでもそのまま活きます。

```md
# Project instructions

## Development

- Use pnpm
- Run `pnpm typecheck` before finalizing changes
- Run `pnpm test` when touching business logic
- Do not modify generated files manually

## Pull request

- Summarize user-visible changes
- Include test results
- Mention migration steps if database schema changed
```

一方で、以下のような記述は見直し対象です。

```md
Use the `/review` command after implementation.
Ask the `security-reviewer` subagent before editing auth code.
Use Claude Code hooks to block unsafe file writes.
```

確認する観点は次の通りです。

- 「Claude Code」と書いている箇所
- Claude Code固有のSlash commandを前提にしている箇所
- Claude CodeのSubagentsを前提にしている箇所
- hookやpermissionの運用を書いている箇所
- 実行コマンド、テストコマンド、PR作成ルール
- パッケージマネージャーやブランチ運用のルール

`CLAUDE.md` は「開発ルールのソース」として残しつつ、Codex向けには `AGENTS.md` に同じ意図を移す、という考え方が扱いやすいです。

## Skillsを移行する

Claude CodeでSkillsを使っている場合、Codex側にも近い考え方があります。

ただし、保存先は同じではありません。

Codex Skillsでは、ユーザー共通のSkillとプロジェクト単位のSkillを分けて置きます。

```text
User skills:
$HOME/.agents/skills

Project skills:
.agents/skills
```

たとえば、プロジェクト内にテスト方針のSkillを置くなら、以下のような構成になります。

```text
my-app/
  .agents/
    skills/
      test-guide/
        SKILL.md
  AGENTS.md
  package.json
```

`SKILL.md` は、概ね次のような形です。

````md
---
name: test-guide
description: Use this when adding or updating tests in this repository.
---

# Test guide

## When to use

Use this skill when modifying application logic, API routes, or shared utilities.

## Steps

1. Identify affected test files
2. Run focused tests first
3. Run full test suite when shared logic changed
4. Report the exact commands and results

## Commands

```bash
pnpm test
pnpm typecheck
```
````

### Claude CodeのSkillsを移すときの注意

Claude Code側のSkillがすでに `SKILL.md` を中心にした構造なら、本文はかなり流用できます。

ただし、以下は確認してください。

- frontmatterの `name`
- frontmatterの `description`
- Claude Code固有のツール名
- Claude Code固有のSlash command
- MCPやSubagentへの依存
- ファイルパスの違い

おすすめは、いきなり全部移すのではなく、使用頻度の高いSkillを1つだけ選んで移すことです。1つ動けば、残りの移行方針も固まります。

## Slash commandsは原則Skillsへ寄せる

Claude Codeでは、`~/.claude/commands/` にMarkdownを置いてSlash commandとして使う運用があります。

CodexにもCustom promptsの仕組みはありますが、再利用可能な作業手順はSkillsへ寄せる方が扱いやすいです。

移行方針は次のように考えます。

| 既存のSlash command | Codex側の移行先 |
| --- | --- |
| 作業手順を含むもの | Skill |
| レビュー手順 | Skill |
| PR作成テンプレート | Skillまたはprompt |
| 短い定型文 | promptでもよい |
| チーム共有したいもの | `.agents/skills` |

たとえば、Claude Codeで以下のようなSlash commandを持っていたとします。

```md
# review

Review the current diff.
Focus on bugs, security issues, and missing tests.
Output findings first, then suggestions.
```

Codex側では、次のようにSkill化できます。

```text
.agents/skills/
  code-review/
    SKILL.md
```

````md
---
name: code-review
description: Use this when reviewing a code diff for bugs, security issues, and missing tests.
---

# Code review

Review the current diff.

Focus on:

- Bugs
- Security issues
- Missing tests
- Type errors
- Unexpected breaking changes

Output:

1. Findings
2. Risk level
3. Suggested fixes
4. Test recommendations
````

ポイントは、Slash commandを「呼び出し名」として捉えるのではなく、**再利用可能な作業手順**として捉え直すことです。

## MCP設定を `config.toml` へ移す

Claude CodeでMCPを使っている場合、ここは必ず確認が必要です。

Claude CodeではJSON形式でMCP設定を書いていることが多いですが、Codexでは主に `config.toml` に書きます。

基本の置き場所は以下です。

```text
~/.codex/config.toml
```

### stdio MCPの例

stdio型のMCPサーバーは、たとえば次のように書けます。

```toml
[mcp_servers.playwright]
command = "npm"
args = ["exec", "--yes", "@playwright/mcp"]
```

GitHub用のMCPサーバーでトークンが必要な場合は、認証情報の扱いに注意します。

```toml
[mcp_servers.github]
command = "npx"
args = ["-y", "@github/mcp-server"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxx" }
```

上の例は構造を示すためのものです。実運用では、トークンを設定ファイルに直書きしない方が安全です。シェル環境変数、secret manager、ローカルのenv管理など、自分の運用に合わせて秘匿してください。

### HTTP系MCPの確認ポイント

HTTPやSSE系のMCPを使っている場合は、stdioより確認事項が増えます。

- URL
- bearer token
- custom headers
- OAuth
- env経由のheaders
- tool allowlist / denylist
- projectごとの有効化

自動インポートで移ったとしても、実際にツールを呼び出せるかは必ず確認します。

:::message alert
MCP設定は、見た目上インポートできていても、認証や環境変数の解決で失敗することがあります。移行後は、各MCPサーバーごとに最小のツール呼び出しを実行して確認するのがおすすめです。
:::

## SubagentsはCustom agentsとして再設計する

Claude CodeでSubagentsを使い込んでいる場合、ここは単純なコピーでは終わりません。

Claude Codeでは、たとえば次のような構成を持っているケースがあります。

```text
.claude/
  agents/
    security-reviewer.md
    db-migration-reviewer.md
    frontend-implementer.md
```

Codex側にもSubagentsやCustom agentsの考え方がありますが、Claude Codeのagentsファイルをそのまま同じ構造で使うというより、Codex側のCustom agentsとして再設計するのが安全です。

たとえば、次のような情報に分解して移します。

| 観点 | 確認内容 |
| --- | --- |
| 役割 | 何を専門に見るagentか |
| 起動条件 | いつ呼ぶのか |
| 入力 | diff、ファイル、Issue、設計メモのどれを見るのか |
| 出力 | 指摘、修正案、実装、チェックリストのどれを返すのか |
| 権限 | ファイル編集やMCP利用を許可するか |
| 親スレッドへの戻し方 | 要約だけ返すのか、詳細も返すのか |

概念的には、次のように移し替えるイメージです。

````toml
name = "security-reviewer"
description = "Review authentication, authorization, and secret handling changes."

# Example only. Check the exact supported keys in your Codex environment.
instructions = """
You are a security reviewer.

Focus on:
- authentication bypass
- authorization mistakes
- secret leakage
- unsafe file handling
- SSRF
- SQL injection
- XSS

Return findings first.
Do not rewrite code unless explicitly asked.
"""
````

:::message
Custom agentsの設定形式や利用できるキーは、Codex App / CLIのバージョンで変わる可能性があります。記事の例は設計の分解例として扱い、実際に使う前に手元のCodex環境で確認してください。
:::

### Subagents移行で確認すること

Subagentsを移すときは、以下を確認します。

- agent名
- description
- model
- instructions
- 利用できるtools
- MCPサーバーとの紐づけ
- sandbox設定
- 呼び出し方
- 並列実行時の期待結果
- 親スレッドへ返す出力形式

特に重要なのは、**起動経路**です。

Claude Codeで「Task toolから単一の名前で呼ぶ」運用をしていた場合、Codex App上で同じ導線になるとは限りません。移行後は、小さいタスクで呼び出し確認をしてから本番運用に入るのがよいです。

## Hooksと承認フローを見直す

Hooksは、移行時に一番事故りやすい領域です。

Claude Code側で以下のような運用をしている場合、単純移行は避けた方がよいです。

- 特定ファイルへの変更をhookで止める
- 権限要求時に独自チェックを入れる
- Subagent終了時に検証を走らせる
- テスト失敗時に自動で停止させる
- tool実行前後にログを送る

Codex側にもHooksはありますが、イベント名や実行タイミング、承認フローとの関係は同じではありません。

移行では、次のように分けて考えると整理しやすいです。

| 目的 | Codex側での考え方 |
| --- | --- |
| tool実行前に検査したい | PreToolUse系。ただし対象ツールや挙動は環境ごとに確認する |
| tool実行後にログを取りたい | PostToolUse系。ただしファイル編集まで拾えるかは確認する |
| 承認要求を制御したい | hook移植だけで考えず、approval / sandbox / permissions側で再設計する |
| 最後に検証したい | Stop系 |
| 危険な操作を避けたい | sandbox / approval / permissionsで制御 |

特に承認要求まわりは、Claude CodeのhookイベントをCodexへ同名で置き換えられるとは限りません。`PermissionRequest` 相当の挙動は、Codex側のバージョンや実装状況で差が出やすい領域として扱い、移行時点の手元環境で必ず確認します。

Hookだけで安全性を作るのではなく、Codex側ではsandboxやapproval policyと組み合わせて設計するのが重要です。

## 承認・Sandbox・Permissionsを設定する

Claude CodeからCodex Appへ移るとき、承認や権限の考え方も見直します。

Codex側では、主に以下を組み合わせて考えます。

- approval policy
- sandbox mode
- workspace write
- network access
- project trust
- MCP tool approval

最初は、強い自動実行に寄せすぎない方が安全です。

おすすめは、次のような段階的な進め方です。

| フェーズ | 方針 |
| --- | --- |
| 移行直後 | 読み取り中心で確認 |
| 小さい修正 | workspace writeで限定的に許可 |
| MCP確認 | ツールごとに承認を確認 |
| 自動化開始 | Worktreeで分離 |
| 本格運用 | repoごとに権限プロファイルを調整 |

:::message alert
便利だからといって、いきなり強い自動実行設定に寄せるのは危険です。特にMCP、ファイル書き込み、ネットワークアクセス、認証情報を扱うrepoでは、最初は保守的に始める方が安全です。
:::

## AutomationsとWorktreeで自動化を組み直す

Claude Code側でhookやroutine的な仕組みを使っていた場合、Codex AppではAutomationsとWorktreeを使って組み直すのが自然です。

たとえば、以下のようなタスクはCodex Appと相性がよいです。

- 毎朝dependency updateを確認する
- 週次でlint / typecheck / testを走らせる
- issue一覧から小さい修正候補を探す
- staleなTODOコメントを整理する
- 長時間調査を別スレッドで進める
- 複数の実装案を別Worktreeで試す

Worktreeを使うと、現在作業中のブランチや未コミット変更と分離できます。

```text
main working tree:
my-app/

codex worktree:
my-app-codex-task-123/
```

自動化を始めるなら、最初は直接ローカル作業ツリーを触らせるより、Worktree上で走らせる方が安全です。

## 半日で試す移行手順

いきなり本番repoで移行するより、半日で小さく試す方が失敗しにくいです。

### 1. 小さいrepoを選ぶ

最初は、認証情報や本番DBに触れないrepoを選びます。MCPやSubagentsが多すぎるrepoは避けます。

### 2. 自動インポートする

Codex Appの `Import other agent setup` を使います。インポート後、生成・変更された設定を確認します。

### 3. `AGENTS.md` だけ整える

最初に整えるのは `AGENTS.md` です。テストコマンド、禁止事項、PRルールだけでも十分です。

### 4. よく使うSkillを1つだけ移す

すべてのSkillを移すより、もっとも使うSkillを1つだけ移します。たとえば `code-review` や `test-guide` です。

### 5. MCPを1つだけ動作確認する

MCPは複数同時に確認しない方がよいです。まず1つだけ接続し、最小のツール呼び出しで成功するか確認します。

### 6. Worktreeで小さい修正を試す

最後に、Worktree上で小さい修正を1つ実行します。差分確認、テスト、PR作成までの流れを見ます。

この6ステップが通れば、Codex Appを実務に入れる最低ラインは越えられます。

## 移行チェックリスト

実際に移行するときのチェックリストです。

### インポート前

- [ ] `CLAUDE.md` の内容を確認した
- [ ] `.claude/agents` の一覧を確認した
- [ ] `.claude/commands` の一覧を確認した
- [ ] `.claude/skills` の一覧を確認した
- [ ] MCPサーバーの一覧を確認した
- [ ] MCPで使う環境変数を確認した
- [ ] hooksで承認や停止条件を作っていないか確認した
- [ ] 移行対象repoの未コミット変更を退避した

### インポート後

- [ ] `AGENTS.md` が作られている
- [ ] `AGENTS.md` からClaude固有の記述を除いた
- [ ] Skillsの保存先を確認した
- [ ] Slash commandsをSkillsへ寄せる方針を決めた
- [ ] MCPサーバーが起動する
- [ ] MCPツールを1つずつ呼び出して確認した
- [ ] Subagents / Custom agentsの呼び出し方を確認した
- [ ] Hooksのイベント差分を確認した
- [ ] approval / sandbox / permissionsを確認した

### 本格運用前

- [ ] 小さいrepoで試した
- [ ] 変更差分を必ず確認する運用にした
- [ ] WorktreeでAutomationを試した
- [ ] PR作成までの流れを確認した
- [ ] 失敗時に戻せるようにした
- [ ] Claude CodeとCodex Appの併用方針を決めた

## 私のおすすめ構成

個人的には、いきなり完全移行するより、しばらくは併用がよいと思っています。

```text
repo/
  CLAUDE.md
  AGENTS.md
  .claude/
    agents/
    commands/
  .agents/
    skills/
  .codex/
    agents/
```

Claude CodeにはClaude Codeの良さがあり、Codex AppにはCodex Appの良さがあります。

私なら、次のように使い分けます。

| 用途 | 向いているもの |
| --- | --- |
| 1スレッドで粘り強く進めたい | Claude Code |
| 既存のClaude Subagents運用が強いrepo | Claude Code |
| 複数タスクを並列に進めたい | Codex App |
| Worktreeで安全に分離したい | Codex App |
| 定期実行したい | Codex App Automations |
| MCPを絡めた実装・調査 | 両方で検証 |

完全移行を急ぐより、`CLAUDE.md` と `AGENTS.md` を併存させ、徐々にCodex側の運用を厚くしていく方が現実的です。

## まとめ

Claude CodeからCodex Appへの移行は、単なるファイル名の置換ではありません。

`CLAUDE.md` から `AGENTS.md` への移行や、Skills、MCPの移行は比較的進めやすいです。一方で、Subagents、Hooks、承認フロー、自動実行は、Codex側の設計に合わせて見直した方がうまくいきます。

最初の進め方はシンプルです。

1. Codex Appの自動インポートを使う
2. `AGENTS.md` とよく使うSkillを整える
3. MCPを1つずつ確認する
4. SubagentsとHooksは再設計する
5. Worktreeで小さく自動化を試す

この順番なら、Claude Codeの運用資産を捨てずに、Codex Appの並列作業やAutomationの良さを取り込めます。

## 参考リンク

- Codex migration guide
  - https://developers.openai.com/codex/migrate
- AGENTS.md guide
  - https://developers.openai.com/codex/guides/agents-md
- Codex Skills
  - https://developers.openai.com/codex/skills
- Codex MCP
  - https://developers.openai.com/codex/mcp
- Codex Subagents
  - https://developers.openai.com/codex/subagents
- Codex Hooks
  - https://developers.openai.com/codex/hooks
- Codex App Automations
  - https://developers.openai.com/codex/app/automations
- Claude Code settings
  - https://docs.anthropic.com/en/docs/claude-code/settings
