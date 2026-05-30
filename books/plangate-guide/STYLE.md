# 執筆スタイルシート（plangate-guide）

> Book 全章で統一するための規約。既存公開記事の再編集時、トーン不統一・重複・文脈断絶を防ぐ。
> このファイルは Book には含めない（`config.yaml` の chapters に入れない）執筆用メモ。

## 文体・トーン

- 一人称・主語: 過度な「私」を避け、手順は命令形／説明は敬体（です・ます）
- 敬体で統一（常体と混在させない）
- 読者像: Claude Code / Codex を実務で使う Developer。基礎用語の説明は最小限
- 説教を避け、負の体験・具体例・コンソール出力で語る

## PlanGate 用語の表記（ゆれ防止）

| 正 | 避ける表記 | 備考 |
|----|-----------|------|
| C-3 / C-4 | C3, c-3 | 計画承認ゲート / PR レビューゲート |
| L-0 | L0 | lint 自動修正 |
| V-1〜V-4 | V1〜V4 | 検証フェーズ |
| EH-1〜EH-9 + EHS-1〜EHS-3（12/12実装）| EH1, EH-1〜EH-10 と書く | Enforcement Hook。**EH-10 は RFC Draft で未実装**。実装済みは 12/12（EH-1〜EH-9 + EHS-1〜EHS-3）。着手時に公式 glossary で再確認 |
| EHS-1〜EHS-3 | — | strict-mode 追加 Hook |
| Level 1〜5 | Lv1, レベル1 | 段階導入 |
| PBI INPUT | PBI input, pbi | |
| plan / todo / test-cases | Plan.md 等の表記ゆれ | 成果物名は小文字 |
| 「No approval, no code.」 | No approved plan, no code | 公式タグライン（誤記注意） |

## コードブロック・図

- コードブロックには言語指定とファイル名（必要時）。コンソール出力は実際の出力をそのまま
- 図は **mermaid** をインライン（assets 管理を避ける）。必須2点: Plan→Exec→Verify→Scale フロー / Before-After
- 記号（EH 等）は表に集約し、本文は「何を防ぐか」の意味で書く（陳腐化耐性）

## 章構造の共通ルール

- 各章冒頭: 検証バージョンバッジ ＋ 前章からの接続 1 段落（文脈断絶を防ぐ）
- 各章末: next action（CTA）を 1 つ。全章「star して」にしない
- 概念の初出章を 1 つに固定し、後続章は再説明せず章内リンクで送る（重複防止）

## 再編集の原則

- 既存公開記事の**本文コピペ禁止**。Book 固有の「Plan→Exec 主張への接続文」を新規に書く
- 稼ぎ頭 entry-point 記事（`ai-legible-repository-design` / `plangate-v86-hook-enforcement`）は
  canonical を記事側に置き、Book 章冒頭で元記事へリンク（自家中毒回避）
- 検証バージョンは **v8.10.0**（2026-05-29 リリース、バッジ表記は v8.10.0(2026-05)）。手順の最新は公式 docs / GitHub へのリンクに逃がす
