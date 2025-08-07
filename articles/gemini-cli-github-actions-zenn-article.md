---
title: "Gemini CLI GitHub Actions登場：GitHubに“AIパートナー”を迎える"
emoji: "🤖"
type: "tech"
topics: ["github", "githubactions", "ai", "gemini", "googlecloud"]
published: true
---

## はじめに：開発ワークフローに“AIパートナー”を組み込む

CI/CDで“機械的な自動化”は出揃いました。次は、**文脈を理解して自律的に動くAIを、GitHub上の実務フローへ溶け込ませる**段階です。

**Gemini CLI GitHub Actions** は、その入口です。リポジトリに常駐してPR/Issueに反応する **AIパートナー**。まずは **Google AI Studio の無料枠** から、追加コストなく試せます。

この記事では、Webエンジニア向けに、要点と**最短導入手順**をコンパクトに解説します。

---

## 何ができる？— AIパートナーの主要機能

### 1. インテリジェントな Issue トリアージ
新規 Issue を解析し、内容に応じて `bug` / `feature-request` などのラベルや優先度を自動付与。  
人手の仕分けを減らし、**対応そのものに集中**できます。

### 2. 迅速な Pull Request レビュー
PR 作成・更新をトリガーに、AIが**コード品質／スタイル／潜在的な不具合**をチェックしてコメント。  
人間のレビューは、設計やロジックなど**本質領域にフォーカス**できます。

### 3. `@gemini-cli` でオンデマンド呼び出し
Issue / PR のコメントで `@gemini-cli` をメンションするだけで、**その場で依頼**できます。

- 解説: `@gemini-cli explain this code change`  
- 改善提案: `@gemini-cli suggest improvements for this function`  
- テスト作成: `@gemini-cli write unit tests for calculateTotal`  
- バグ調査: `@gemini-cli help me debug this error: NullPointerException`  
- 実装依頼: `@gemini-cli implement the changes suggested by @human-reviewer above`

> コメント欄が、そのまま **AIへのホットライン** になります。

---

## クイックスタート：3ステップで導入

**所要時間：数分**

### Step 1：APIキーを用意（GitHubに登録）
1. **Google AI Studio** でAPIキーを発行。  
2. GitHub の **Settings > Secrets and variables > Actions** へ。  
3. **New repository secret** を選び、名前を `GEMINI_API_KEY`、値にAPIキーを保存。

### Step 2：ワークフローをセットアップ
最速はローカルの **Gemini CLI** を使う方法（Node.js v20+）。  
ターミナルでCLIを起動し、プロンプトで以下を実行：

```
/setup-github
```

対話に沿って設定すると、最適なワークフローが `.github/workflows/` に自動追加されます。

### Step 3：AIを動かしてみる
- **PRレビューを試す**：新規PRを作成／更新すると、数分後にAIコメントが届きます。  
- **手動レビュー依頼**：既存のPR／Issueに `@gemini-cli /review` とコメントするだけ。

---

## プロジェクトに“流儀”を教える：`GEMINI.md`

リポジトリ直下に `GEMINI.md` を置くと、AIは常にこれを読み込み、判断や提案の前提として活用します。**暗黙知の教科書**にしましょう。

**記載例：**
- **コーディング規約**：例「Google Java Style。publicメソッドにはJSDoc必須」  
- **コミット規約**：例「Conventional Commitsに準拠」  
- **アーキテクチャ原則**：例「サービス間通信はgRPC。外部ライブラリは原則追加禁止」  
- **ドキュメントのトーン**：例「ユーザー向けは専門用語を避け、親しみやすく」

`GEMINI.md`が充実するほど、AIは**汎用アシスタント**から**あなたの流儀を理解するAIパートナー**へ進化します。

---

## 似た選択肢との違い：Gemini Code Assist for GitHub（App）

GitHubには、似た名称の **Gemini Code Assist for GitHub**（GitHub App）もあります。用途で使い分けましょう。

- **Gemini Code Assist for GitHub（App）**  
  インストールするだけで高品質なAIコードレビューを即利用できる **製品**。お手軽スタート向け。

- **run-gemini-cli（GitHub Action）**  
  コードレビューに加え、Issue運用やカスタム自動化など**ワークフロー全体**をAIで拡張できる **プラットフォーム**。柔軟に攻めたい場合はこちら。

---

## 運用Tips：安全性・制御・可観測性

- **認証**：可能なら **Workload Identity Federation** を検討。長期APIキーを置かず、短期トークン化でリスク低減。  
- **権限最小化**：必要なスコープだけ付与し、実行可能コマンドは**許可リスト**で制御。  
- **監視**：ログとメトリクスを可観測基盤（例：Cloud Monitoring / OpenTelemetry対応）へ集約。挙動の可視化と早期検知に役立つ。

---

## まとめ：反復はAIへ、価値創出に集中

**Gemini CLI GitHub Actions** で、反復作業はAIに **委任**、人は設計・実装・検証の本質へ。  
**AIパートナー** をGitHubに迎え、開発スタイルを一段引き上げましょう。

---

> 追記歓迎：Zenn記事としての公開後、`GEMINI.md` のサンプルや `.github/workflows/` の最小構成テンプレートも別記事で配布予定です。需要があればコメントください。
