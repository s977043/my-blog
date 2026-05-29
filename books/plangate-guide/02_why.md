---
title: "なぜ AI 開発に承認ゲートが必要か"
---

<!--
役割: 本命への導入（圧縮）
素材: ai-dev-guardrail-plangate-river-reviewer / multi-ai-discussion-roadmap-rewrite
注意: 本命2章が固まってから書く。説教は短く、負の体験起点で
-->

## AI が速く書くほど起きること

<!--
負の体験起点:
- 勝手に既存コードをリファクタリングし始める
- 承認していないファイルを壊す
- スコープ逸脱・受入基準の消失・ブラックボックス化
事故ログ 1 本で代替（長い説教にしない）
-->

## ゲートがない開発 / ある開発（Before / After）

<!-- mermaid: Before（ゲート無し=事故る）/ After（ゲート有り=止まる） -->

## 既存の方法では何が足りないか

<!--
比較表（旧 07 章から吸収）:
- Claude Code 標準の hooks / permissions
- CI の branch protection
- SpecKit 系のワークフロー
それぞれが埋める範囲と、PlanGate が埋める差分（強制力＝enforcement / 段階導入）
-->

## 本書の進み方

<!-- 章末 CTA: 自分のリポジトリの事故事例を思い出す（自分ごと化） -->
