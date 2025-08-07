---
title: "Gemini CLI GitHub Actions登場！あなたのリポジトリにAIチームメイトを迎えよう"
emoji: "🤖"
type: "tech"
topics: ["github", "githubactions", "ai", "gemini", "googlecloud"]
published: false
---

## はじめに：開発ワークフローに「AIの相棒」を

CI/CDで自動化は大きく進みました。次の波は、**指示待ちの自動化**を超えて、文脈を理解し自律的に動く**AIとの協業**です。

2025年8月、Googleがその未来を形にした「**Gemini CLI GitHub Actions**」を発表しました。リポジトリに常駐し、日々の開発を支える――まさに**AIコーディングチームメイト**。しかも、Google AI Studioの無料枠で多くの開発者が追加費用なく試せます。

この記事では、Gemini CLI GitHub Actionsの要点と、今日から導入する手順をシンプルに解説します。

---

## 何がすごい？AIチームメイトができること

**Gemini CLI GitHub Actions**は、すぐ使える強力な3ワークフローを提供します。面倒をAIに任せ、開発者は本質へ集中できます。

1. **インテリジェントなIssueトリアージ**  
   新規IssueをAIが解析し、内容に応じて `bug` や `feature-request` などのラベルを自動付与。雑務の整理から解放されます。

2. **迅速なPull Requestレビュー**  
   PR作成時にAIがコード品質・スタイル・潜在的な問題をチェックしてコメント。人のレビューは設計やロジックなど本丸に集中できます。

3. **@gemini-cliで呼べるオンデマンドAI**  
   Issue／PRのコメントで `@gemini-cli` をメンションするだけ。隣の優秀な同僚に頼む感覚でタスクを依頼できます。

**依頼例：**

- コード解説: `@gemini-cli explain this code change`  
- リファクタ提案: `@gemini-cli suggest improvements for this function`  
- テスト生成: `@gemini-cli write unit tests for the 'calculate_total' function`  
- バグ調査: `@gemini-cli help me debug this error: 'NullPointerException'`  
- 実装依頼: `@gemini-cli implement the changes suggested by @human-reviewer above`

コメント欄が、AIへの万能ホットラインに早変わりします。

---

## さっそく導入：3ステップ・クイックスタート

数分で完了します。

### Step 1：APIキーを用意（GitHubに登録）
1. **Google AI Studio**でAPIキーを発行。  
2. GitHubの **Settings > Secrets and variables > Actions** へ。  
3. **New repository secret** を選び、名前を `GEMINI_API_KEY`、値にAPIキーを保存。

### Step 2：ワークフローをセットアップ
最速はローカルの**Gemini CLI**を使う方法（Node.js v20+）。  
ターミナルでCLIを起動し、プロンプトで以下を実行します：

```
/setup-github
```

対話に沿って設定すると、最適なワークフローが `.github/workflows/` に自動追加されます。

### Step 3：AIを動かしてみる
- **PRレビューを試す**：新規PRを作成／更新すると、数分後にAIコメントが届きます。  
- **手動レビュー依頼**：既存のPR／Issueに `@gemini-cli /review` とコメントするだけ。

---

## AIを育てる：`GEMINI.md`で「プロジェクトの流儀」を伝える

リポジトリ直下に `GEMINI.md` を置くと、AIは常にこれを読み込み、背景知識として活用します。**暗黙知の教科書**にしましょう。

**記載例：**
- **コーディング規約**：例「Google Java Style。publicメソッドにはJSDoc必須」
- **コミット規約**：例「Conventional Commitsに準拠」
- **アーキテクチャ原則**：例「サービス間通信はgRPC。外部ライブラリは原則追加禁止」
- **ドキュメントのトーン**：例「ユーザー向けは専門用語を避け、親しみやすく」

`GEMINI.md`が充実するほど、AIは**汎用アシスタント**から**あなたの流儀を理解する相棒**へ進化します。

---

## 補足：Gemini Code Assist for GitHubとの違い

似た名前のGitHub App「**Gemini Code Assist for GitHub**」もあります。用途で使い分けましょう。

- **Gemini Code Assist for GitHub（App）**  
  インストールするだけで高品質なAIコードレビューを即利用できる**製品**。手軽に始めたい人向け。

- **run-gemini-cli（GitHub Action）**  
  コードレビューだけでなく、Issue運用やカスタム自動化など**ワークフロー全体**をAIで拡張できる**プラットフォーム**。柔軟に攻めたい人向け。

---

## まとめ：AIと共に、開発を次のステージへ

**Gemini CLI GitHub Actions**は、自動化を一段引き上げます。反復作業はAIに**委任**し、開発者は創造的で本質的な課題に集中する。  
AIがコードを書き、レビューし、Issueを整理する――その未来は、もうあなたのリポジトリで始められます。  
**新しいAIチームメイトを迎え、開発スタイルを更新しましょう。**
