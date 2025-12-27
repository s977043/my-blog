---
title: "【River Reviewer】AIレビューを"運河"にする —— 暗黙知を「Agent Skills」で資産化し評価駆動で育てる"
emoji: "🌊"
type: "tech"
topics: ["ai", "typescript", "codereview", "architecture", "llm"]
published: false
---

:::message
この記事は、note記事『[AIコードレビューの「投げっぱなし」をやめる](https://note.com/mine_unilabo/n/nd21c3f1df22e)』の設計思想をベースに、自律型AIエージェントを組織の「資産」として運用するための実装パターンを解説する技術記事です。
:::

## 1. はじめに：AIエージェントの「投げっぱなし」を卒業する

`Claude Code` や `Codex` といった強力なAIツールの登場により、コードの生成・レビュー能力は劇的に向上しました。しかし、強力なエージェントを現場に導入すると、ある共通の課題に直面します。

それは、**「AIは自律的に動くが、プロジェクト固有の流儀（暗黙知）を必ずしも守らない」**ということです。多くのツールは「一般的なベストプラクティス」には従いますが、現場にある「このレガシーコードは触るな」といった**暗黙知**を考慮できません。これを私は、AIに対する**「投げっぱなし（Fire-and-Forget）」**の状態と呼んでいます。

まず、River Reviewerが「何であり、何でないか」を定義します。

*   **入力**: PR差分、仕様書、プロジェクト固有の共有メモリ（Shared Memory）
*   **出力**: 実装計画（Plan JSON）、Skillベースのレビューコメント、検証結果（Verify）
*   **非目的**: 完全自動マージ、プロジェクト外の一般論レビュー

## 2. アーキテクチャ：3つの流れと「二層の共有メモリ」

River Reviewerは、開発プロセスを3つのフェーズに分けるストリーム処理として設計します。

### 共有メモリ（Shared Memory）の二層構造
コンテキストを「共有メモリ」として抽出し、エージェントの注意力をコントロールします。実戦的には、以下の二層で管理することを推奨します。

1.  **組織憲法（Static Layer）**: 読み取り専用。コーディング規約、アーキテクチャ決定（ADR）、禁止ライブラリ等。
2.  **学習ログ（Dynamic Layer）**: 更新可能。過去のレビュー指摘の修正履歴、ハルシネーションの記録、既知のバグパターン等。

## 3. 統治：失敗のリスクから「自由度」を設計する

AIの「賢さ」に期待して丸投げするのではなく、失敗したときのリスクと検証のしやすさで**“自由度（＝裁量の幅）”**を先に決めます。

| 自由度 | 概要 | 推奨 Temp | 承認プロセス (HITL) | 適用領域 |
| :--- | :--- | :--- | :--- | :--- |
| **Cliff (崖)** | 失敗＝致命傷。厳格な検証。 | 0.0 | **事前承認必須** | 認証、決済、セキュリティ、DB移行 |
| **Hill (丘)** | 修正可能なミス。定型作業。 | 0.3 | 事後レビュー (PR) | リファクタリング、命名規則、テスト記述 |
| **Plain (平原)** | 探索的な思考。自由な発想。 | 0.8 | 承認不要 | ブレスト、モック作成、リスク洗い出し |

**低自由度（Cliff）**領域では、情報が足りないなら**推測せず質問に切り替える（Stop Conditions）**ことで、SRE的な安全性を担保します。

## 4. 実装詳細：Agent Skills と「10行ルール」

AIへの指示を「Agent Skills」という小さな単位に分割します。

### Agent Skill の実装例
一つのスキルにつき、以下の項目を簡潔に記述します。指示を絞ることでLLMの遵守率を最大化します。

```typescript
export const SecurityAuditSkill: AgentSkill = {
  name: "SQL Injection Guardian",
  riskLevel: "Cliff",
  rule: {
    priorities: ["SQLインジェクションの検知", "ORMの適切な使用"],
    prohibited: ["raw queryの直接使用", "サニタイズされていない入力の利用"],
    exceptions: ["分析用読み取り専用クエリ（要相談）"],
    stopConditions: ["コンテキスト不足により推測が必要な場合、即座に質問すること"],
    verify: {
      type: "shell",
      command: "npm run test:security",
      blocking: true // 失敗時にプロセスを停止
    }
  }
};
```

## 5. ワークフロー：Plan / Validate / Verify

「いきなりコードを書かせない」ことで、AIの暴走を上流で食い止めます。

### Step 1: Plan (JSON Schema)
AIはまず、以下の構造を持つ「計画書」を出力します。
```json
{
  "taskId": "AUTH-456",
  "riskLevel": "Cliff",
  "rationale": "認証ロジックの変更に伴うセキュリティリスクの確認",
  "skills": ["SecurityAuditSkill"],
  "affectedFiles": ["src/auth/service.ts"],
  "checks": ["OWASP SQL Injection points"]
}
```

### Step 2: Validate (Go/No-Go 判断基準)
人間（EMやテックリード）は以下の観点で計画を検閲します。
- **Cliff**: 計画が具体的か？ 停止条件は定義されているか？
- **Hill**: 影響範囲に漏れはないか？
- **Plain**: アイデアが発散しすぎていないか？

### Step 3: Verify (CI実行)
実装後、スキルに定義された `verify` コマンドを実行します。失敗時は自動的にリトライせず、**「なぜ失敗したか」のログを共有メモリに記録して停止**させます。

## 6. 核心：評価駆動（Evaluation-Driven）でスキルを育てる

「育てる」運用を実現するために、以下のKPIを設定し、計測します。

- **指摘の妥当率（Precision）**: AIの指摘のうち、人間が「修正が必要」と認めた割合
- **誤検知率（False Positive Rate）**: 規約に沿っているのにAIがエラーとした割合
- **PRリードタイムの短縮**: 人間による一次レビューがAIに代わることによる速度向上

### ゴールドデータの蓄積
「過去の良いレビューコメント」や「NG実装例」をコーパスとして蓄積し、スキルの `prohibitedItems` を更新し続けます。スキルの更新自体もPRで行い、**Policy as Code** として変更理由を記録します。

## おわりに：暗黙知を「技術資産」に変える

River Reviewerは、単純なプロンプト運用やRAGとは異なります。それは、組織の暗黙知を **Agent Skills** として言語化し、リスクに応じた**自由度を設計**し、評価を通じて成長させる「生きたガバナンス」です。

あなたのチームの「秘伝のタレ」を、今日から実装してみませんか？

---
- **GitHub**: [s977043/river-reviewer](https://github.com/s977043/river-reviewer)
- **note**: [AIコードレビューの「投げっぱなし」をやめる](https://note.com/mine_unilabo/n/nd21c3f1df22e)
- **Documentation**: [River Reviewer Docs](https://river-reviewer.vercel.app/)