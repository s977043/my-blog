---
title: "ObsidianとSupermemory MCPをつなぐ知識管理ワークフロー"
emoji: "🧠"
type: "tech"
topics: ["MCP", "Obsidian", "AI", "Supermemory", "知識管理", "zennfes2025ai"]
published: true
---

## はじめに

個人開発をしていると、こんな悩みはありませんか？

- 毎回 AI に同じ前提をコピペしている
- 仕様メモやテスト設計を残しても活用できていない
- ローカルに蓄積した知識と AI ツールをつなげたい

そこでおすすめなのが、**「Obsidian × Supermemory MCP」** のハイブリッド運用です。
この記事では、個人開発における実際の使い方とメリットを紹介します。

---

## Obsidian とは？

- Markdown ベースのノートアプリ
- 完全ローカル保存（安心して使える）
- プラグインで LLM 連携やベクトル検索も可能

個人開発においては、**「知識の資産化」** として最適です。

---

## Supermemory MCP とは？

- Claude / Cursor / Gemini CLI など **100+ AI クライアント対応の MCP サーバ**
- URL を登録するだけで即利用可能（ホスト版あり）
- Notion / Google Drive / PDF なども「記憶」として統合できる

一言でいえば、**「AI クライアント横断の共通メモリ」** です。

---

## ワークフロー全体像

1. **Obsidian**: 仕様メモ、テスト設計、実装ノートを Markdown で保存
2. **Supermemory MCP**: 即席メモリとして Claude/Cursor から参照
3. **Claude / Cursor**: コーディング・レビューで利用

---

## 共有メモリーサービスの比較検討

個人開発で「共有メモリー」として利用できるサービスを整理しました。

| サービス            | 導入のしやすさ        | 特徴                                         | 個人開発での強み                           | 弱み                               |
| ------------------- | --------------------- | -------------------------------------------- | ------------------------------------------ | ---------------------------------- |
| **Supermemory MCP** | ◎（URL 登録ですぐ）   | マルチクライアント対応、外部サービス連携豊富 | Claude & Cursor 両方で同じ知識を利用できる | ホスト利用時は外部に保存される     |
| **Cipher**          | ○（セルフホスト必要） | OSS MCP サーバ、完全ローカル運用可能         | 自前環境で安全に使える、改造も自由         | 構築コストが高い                   |
| **Serena**          | ◎                     | Claude Code 向け効率化ツール                 | Claude Code 専用で軽快、トークン圧縮に強い | 他クライアントとは共有できない     |
| **Obsidian**        | ○                     | Markdown ノートアプリ（ローカル資産化）      | 知識の整理・資産化に最適                   | MCP 標準ではないため即席共有は弱い |
| **Claude Projects** | ◎                     | Claude 内でプロジェクト記憶                  | Claude だけで完結するなら便利              | Cursor 等とは共有不可              |
| **ChatGPT Memory**  | ◎                     | ChatGPT 専用の記憶                           | ChatGPT 中心なら自然に利用可能             | 他クライアントと共有不可           |
| **Mem.ai**          | ○                     | メモアプリ＋ AI                              | 個人メモ重視、UX に優れる                  | 開発ツール連携は弱め               |

### Serena と Cipher の違い

詳細比較は末尾の関連記事にまとめています。要点:

- **Serena** は「Claude Code に特化した効率化」
- **Cipher** は「OSS MCP サーバとしての永続メモリ」

本記事の Supermemory MCP は、この 2 つの中間に位置する「手軽さ＋横断利用」が強みです。

---

## なぜ Obsidian × Supermemory MCP が最適なのか？

個人開発の条件を満たす「資産化」と「即効性」を同時に得られるからです。

- **資産化（Obsidian）**

  - Markdown 形式でメモを残せる
  - GitHub と同期でき、将来の再利用や公開も容易

- **即効性（Supermemory MCP）**
  - Claude / Cursor で同じ前提を横断的に呼び出せる
  - コピペ作業が不要になり、開発スピードが上がる

さらに他サービスと比べて…

- Cipher → 本格運用には最適だが導入負荷が高い
- Serena → 軽快だが Claude 専用
- Claude Projects / ChatGPT Memory → ベンダーロックインが強い

**→ 個人開発では「Obsidian × Supermemory MCP」が最もバランスが良い選択肢**といえる。

---

## 導入のステップ

:::message
Step2 のコマンドは公開時（2025-08）の手順です。Step2 の補足と Step2.5 は 2026-11 時点の[公式ドキュメント](https://supermemory.ai/docs/supermemory-mcp/introduction)で確かめた内容です。最新の挙動は公式で確認してください。
:::

### Step1: Obsidian を用意

- Vault を作成し、仕様・テスト設計・実装ノートを保存

### Step2: Supermemory MCP を登録

```bash
npx install-mcp https://mcp.supermemory.ai/xxxx/sse --client claude
npx install-mcp https://mcp.supermemory.ai/xxxx/sse --client cursor
```

`xxxx` は公開時にユーザーごとに発行されていた URL の一部です。2026-11 時点の公式ドキュメントでは、サーバ URL は `https://mcp.supermemory.ai/mcp` の 1 本で、`xxxx` の部分はありません。クライアントに登録するとブラウザが開き、サインインして参照させるスペースを選びます（OAuth なので API キーは不要）。Cursor の場合は `~/.cursor/mcp.json` に次を書きます。

```json
{
  "mcpServers": {
    "supermemory": {
      "url": "https://mcp.supermemory.ai/mcp"
    }
  }
}
```

ほかのクライアントの手順は[公式のセットアップガイド](https://supermemory.ai/docs/supermemory-mcp/setup)を参照してください。

### Step2.5: Obsidian のノートを Supermemory に入れる

公式ドキュメントにある取り込み方は次の 2 つです。

- `upload-file` ウィジェットでファイルを 1 つずつアップロードする。Markdown に対応しているので、Vault 内の `.md` ファイルをそのまま選べます
- AI クライアントに本文を渡し、`add_memory` で保存させる（保存前に内容を確認したいときは `guided-save` ウィジェット）

Obsidian と直接同期する機能は、公式ドキュメントでは確認できませんでした。

### Step3: Claude / Cursor で利用

```
supermemory に保存した設計ノートを呼び出して
```

---

## まとめ

- **Obsidian** は個人の知識資産を残す「土台」
- **Supermemory MCP** は AI クライアント横断で活用する「即席メモリ」
- この組み合わせが「軽さ・継続性・横断性」のバランスに優れている

個人開発ではまずこのハイブリッドを導入し、必要に応じて Cipher や Serena を追加するのがベストプラクティスです 🚀

---

## 参考

- [Supermemory MCP 公式](https://mcp.supermemory.ai/)
- [Cipher GitHub](https://github.com/byterover/cipher)
- [Serena 解説記事](https://zenn.dev/aki_think/articles/c4f5b2a75ff4d4)
- [Obsidian](https://obsidian.md/)

## 自社メディア

:::message
- [Growth Lab](https://the3396.com/) - AIエージェント開発、SEO最適化、仕様駆動開発の検証ログを、代表記事からすぐ読み進められる形で整理しています。
:::

## 関連記事

:::message
- [2分で決まる：Serena vs Cipher　思想とアーキテクチャ——CLIオンデマンドか常駐メモリか](https://zenn.dev/minewo/articles/serena-vs-cipher-comparison) - AIエージェント開発における文脈管理と常駐メモリの違いを比較した記事です。
- [アジャイルでAI駆動開発をどう回すか: PlanGateの考え方とテンプレート](https://zenn.dev/minewo/articles/plangate-ai-coding-workflow) - 仕様駆動開発と承認フローをAI実行に接続する運用設計です。
- [仕様を揃えて止めない：マルチエージェント開発の3原則（SDD・TDD・ノンブロッキング）](https://zenn.dev/minewo/articles/sdd-tdd-nonblocking-agent) - マルチエージェント開発で仕様の揺れを減らす基本原則です。
- [AIエージェントの記憶を1つのObsidian Vaultに集約する — Hermes司令塔のmulti-agent設計](https://zenn.dev/minewo/articles/ai-second-brain-multi-agent-memory) - 外部 MCP ではなく自前の Obsidian Vault を正本にして、複数エージェントの記憶を集約する設計です。
:::
