---
title: "AIエージェントの記憶を1つのObsidian Vaultに集約する — Hermes司令塔のmulti-agent設計"
emoji: "🧠"
type: "idea"
topics: ["ai駆動開発", "obsidian", "claudecode", "codex", "エージェント設計"]
published: false
---

<!--
タイトル候補（公開前に1つへ確定）:
1. AIエージェントの記憶を1つのObsidian Vaultに集約する — Hermesを司令塔にしたmulti-agent second-brain設計
2. Claude / Codex / Gemini の記憶が分断する問題を、Obsidian Vault 1つで解く
3. AIエージェントの長期記憶を「自前のObsidian」に寄せる — multi-agent memory architecture

差別化メモ: 既存記事 obsidian-supermemory-mcp（MCP共有メモリのサービス比較）とは別物。
本稿は「自前 Vault を正本にした multi-agent 記憶 + Hermes Organizer の役割分担」という設計論。

情報源（自分の構築実体）:
- ai-second-brain リポジトリ README / 02 Architecture/Multi-Agent Memory Architecture.md
- 08 Agent Context/playbooks/multi-agent-memory-protocol.md
- 08 Agent Context/playbooks/hermes-multi-agent-role-split.md
- 07 ADR/2026-06-10-obsidian-ai-second-brain-adoption.md

公開前: このコメント削除 → npm run check → release/zenn フローで公開
-->

## 想定読者

- Claude Code / Codex CLI / Gemini CLI / ChatGPT を併用していて、知見がツールごとに分断していると感じている人
- AIエージェントに「同じ前提」を毎回読ませる手間を減らしたい人
- 個人のナレッジベース（second-brain）と、AIエージェントの長期記憶を1つに揃えたい人

## 先に結論

複数のAIエージェントを使うほど、記憶は**ツールごとに分断**します。Claude は Claude の場所、Codex は Codex の場所、ChatGPT は会話の中——どれが正本か曖昧なまま、同じ説明を繰り返すことになります。

これを、**1つの Obsidian Vault を「共有の長期記憶」の正本にする**ことで解きました。人間は Obsidian で読み書きし、各AIエージェントは同じ Markdown を読む。そして **Hermes を Organizer（司令塔）** に据え、記憶・分解・統合を担わせ、Claude Code / Codex は実行者に徹する役割分担にしています。

ポイントは3つです。

- 記憶の正本を `08 Agent Context/memory/<repo>/` に固定し、人間もAIも同じファイルを見る
- 各ツールの「記憶の接続方法」の違い（自動接続 / 指示ベース）を吸収する
- Hermes=Organizer、Claude/Codex=実行者、という**役割の線引き**で暴走と重複を防ぐ

## 1. なぜ記憶が分断するのか

<!-- 各ツールが独自の場所に記憶を溜める問題。具体例:
     - Claude Code は autoMemoryDirectory
     - Codex は ~/.codex、Gemini は ~/.gemini
     - ChatGPT は会話の中（揮発）
     結果: 「どれが正本か」が曖昧になり、同じ前提を毎回読ませる -->

## 2. 全体像：Think → Capture → Organize → Publish → Reuse

<!-- README の Concept を図で。raw(00 Inbox) → 週次整理 → 01-05(Wiki/成果物)
     → 08 Agent Context(昇格) ← → AIエージェントが読み書き。
     PARA 風フォルダ構成（00 Inbox 〜 08 Agent Context）の役割を簡潔に -->

## 3. 記憶の正本を1か所に固定する

<!-- multi-agent-memory-protocol より:
     - 08 Agent Context/memory/<repo>/ に MEMORY.md(索引) + 1ファイル1事実
     - 記録する/しないの線引き（秘匿情報・コード由来事実・揮発状態は書かない）
     - frontmatter 形式（name/description/type、feedback は Why/How to apply） -->

## 4. ツールごとの「接続方法」の違いを吸収する

<!-- Multi-Agent Memory Architecture の設計判断より:
     - Claude Code: autoMemoryDirectory で自動接続
     - Codex / Gemini: 保存先変更不可 → 指示ベース接続（~/.codex/AGENTS.md, ~/.gemini/GEMINI.md）
     - 指示の一本化: Gemini の context.fileName に AGENTS.md を足し、3ツール共通で読ませる
     - 個人リポジトリのみ Vault に集約（会社リポジトリは各ツール既定位置） -->

## 5. Hermesを司令塔にする — 役割分担で暴走を防ぐ

<!-- hermes-multi-agent-role-split より:
     - Hermes=Organizer: 目的/制約/完了条件の定義、分解、統合、矛盾・重複・未検証の検出
     - 実行者(Claude/Codex/Grok/Gemini)は割り当て範囲だけ。外部投稿・破壊的変更・永続設定変更はしない
     - Role Assignment 表（各ツールの primary use / avoid）
     - 実体験: 安全機構が cross-repo push / 権限自己書き換えを止めた話を「実行者の越権を止める」例として -->

## 6. 運用：週次で 00 Inbox を 08 Agent Context へ昇格する

<!-- 週次レビューのリズム。00 Inbox を整理 → 06 MOCs 更新 → 05 Content に発信ネタ
     → 重要判断は 07 ADR → 繰り返し渡したい前提は 08 Agent Context へ昇格 -->

## つまずきポイント

<!-- 実運用の落とし穴（AGENT_LEARNINGS にも記録済み）:
     - Vault 構成は変わる。エクスポート/集約スクリプトは現行構成に追従させる
     - 個人 vault への一括転送は安全機構に止められることがある（手動 push 前提）
     - Codex CLI はアカウントのプラン次第で全モデル拒否になる -->

## まとめ

<!-- 記憶の分断は「正本を1か所に決める」ことで解ける。
     人間とAIが同じ Markdown を見て、Hermes が司令塔、Claude/Codex が実行者。
     small start: memory/<repo>/MEMORY.md と 1ファイル1事実から始める -->

## 参考

- （自リポジトリの ADR / アーキテクチャノートへのリンクは公開構成に合わせて調整）
- 関連: [AIエージェントの『進めて』問題：自走と確認の境界をmemoryで永続化する](https://zenn.dev/minewo/articles/ai-agent-autonomy-boundary-with-memory)
