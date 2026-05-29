---
title: "付録B 設計変遷 v3 → v8（凝縮）"
---

> 検証バージョン: **PlanGate v8.10.0**（2026-05）。

PlanGate が今の形になるまでには、いくつもの試行錯誤がありました。結論だけのドキュメントより、「なぜこの設計に至ったか」の歴史のほうが信頼できることがあります。本付録はその要点を凝縮します（詳細は別記事「[PlanGate v3 から v8.6 までの設計変遷](https://zenn.dev/)」を参照）。

## なぜこの設計に至ったか

初期の PlanGate は「計画を書こう」という規約・テンプレートに近いものでした。しかし規約は**読まれず、守られない**。AI に「計画を書いてから実装して」とお願いしても、守る保証がない ―― この現実が、設計を「お願い」から「強制（Hook）」へと押し進めました。

本書が繰り返してきた「No approval, no code.」は、最初から強制力として実装されていたわけではなく、**規約 → 強制 → 計測**という進化の到達点です。

## 主要な転換点

| 版 | 節目 |
|----|------|
| v4〜v5 | 5 フェーズ（Plan → C-3 → Exec → Verify → Handoff）の状態遷移を確立 |
| v7 | Governance × Modularity のハイブリッドアーキテクチャ |
| v8.0 | Workflow DSL + Provider RFC + CLI テストスイート |
| **v8.5** | **Hook enforcement 完成（10/10 hooks）** ―― 規約から強制へ |
| v8.6 | EH-8（metrics privacy）+ Metrics v1 |
| v8.7 | EH-9（委譲 commit 境界）+ Run Outcome Review v1 |
| v8.8 | Keep Rate v1 / Dynamic Context Engine v1 |
| v8.9 | Reporting & Retrospective v1（EPIC #193 完遂）|
| **v8.10** | **Codex CLI parity / Guard 拡充 / C-3 Autonomous APPROVE 明文化** |

注目すべきは v8.5 です。ここで Hook enforcement が完成し、PlanGate は「計画を書くことを推奨するツール」から「**計画なしの実装を機械的に止めるツール**」へと質的に変わりました。本書の 2 本柱のうち Exec（強制力）が実体を持ったのがこの版です。

その後は「強制したことを計測する」方向（Metrics / Keep Rate / Reporting）へ進み、v8.10 では Codex CLI への対応と、計画承認の負荷を下げる Autonomous APPROVE が加わりました ―― 強制を、現場で回る運用へと洗練させる流れです。

## 本編各章からの参照

- 第 3 章「C-3 がボトルネックにならない工夫」→ v8.10 の Autonomous APPROVE がこの課題への回答
- 第 4 章「Hook 強制」→ v8.5 で完成した enforcement が土台
- 第 5 章「Keep Rate で計測」→ v8.8 以降の Metrics 系がこの計測を支える

設計は、現場で「守られない」「遅い」という痛みに当たるたびに更新されてきました。あなたのチームでも、まず使ってみて痛みを見つけ、それに合わせて運用を調整していくのが、PlanGate の使い方に最も合っています。
