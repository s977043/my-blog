---
name: tech-blog-writing
description: テックブログの企画前段（ネタ発見、一次経験の整理、媒体・記事タイプ選定、構成設計、根拠確認）または既存原稿の上流品質確認に使う。単発の翻訳・誤字修正・タイトル案だけの依頼には使わない。Zenn・Qiita・note・izanamiの記事案をDraft Article Planへつなぐ。
---

# tech-blog-writing

テックブログを「整った文章」ではなく、実務経験を再利用可能な技術知識へ変換するためのスキル。

文章生成そのものより、次を重視する。

- 誰のどの課題を扱うか
- 何を実際に経験・観測したか
- どの判断が、どの証拠によって変わったか
- どの条件まで主張できるか
- 何を書かないか

## トリガー

- テックブログのネタを考える
- 作業ログ、Issue、PR、障害対応、技術選定から記事候補を抽出する
- 記事の構成や書き方を決める
- `/check-tech-blog <記事パスまたは記事案>` で確認する
- Zenn・Qiita・note・izanami向けの記事が、一次経験と根拠を備えているかレビューする

## 正本と関連ルール

最初に次を読む。

1. `AGENTS.md` — 全媒体共通の規約
2. `docs/article-lifecycle-contract.md` — Seed provenance、Lifecycle state、Human Gate、Metrics / Learning 接続の正本
3. `docs/content-channel-strategy.md` — 媒体役割、書き分け、多媒体展開の正本
4. 対象媒体の構成・運用ルール
   - **Zenn**: `docs/article-guides/zenn-structure-best-practices.md` と `articles/README.md`
   - **note**: `articles_note/guides/note-structure-best-practices.md`、`articles_note/checklists/note-article-quality-checklist.md`、`articles_note/README.md`
   - **Qiita**: `Qiita/README.md` など既存の媒体固有ルール
   - **izanami**: `articles_izanami/README.md`

媒体選定後に構成案を作る場合は、**対象媒体の構成ガイドを先に読み、その判断基準を構成案へ反映する**。ガイドは固定テンプレートとして機械適用せず、記事の目的・読者・検索意図・一次経験を優先する。

本スキルは媒体別レビューを置き換えない。

- Zennレビュー: `article-reviewer` / `article-review-apply`
- noteレビュー: `note-article-review`
- AI特有表現の検出: `article-humanizer-ja`
- 公開操作: `/publish-zenn`、`/publish-qiita` など既存フロー

## 詳細ルールの読み分け

このSkillは上流の責務・境界・Lifecycleだけを入口に残し、詳細はモードに応じて読む。

- 記事企画・記事案モード:
  1. `references/editorial-principles.md`
  2. `references/idea-mode.md`
  3. `references/output-contract.md`
- 既存記事モード:
  1. `references/editorial-principles.md`
  2. `references/existing-article-mode.md`
  3. `references/output-contract.md`

`references/editorial-principles.md` は両モード共通の判断基準。モード固有の手順・テンプレートを通常コンテキストへ同時に載せない。

## Progressive Disclosure の境界

- `SKILL.md`: What / When / source of truth / Lifecycle / delegation / guardrails
- `references/editorial-principles.md`: 一次経験・主張・根拠・適用範囲・Research・記事タイプ
- `references/idea-mode.md`: Experience Record → ネタ判定 → 媒体選定 → Draft Article Plan → Draft handoff
- `references/existing-article-mode.md`: 既存記事の核抽出・6 Gate・既存Reviewへの委譲
- `references/output-contract.md`: 両モードの出力フォーマット

## Lifecycle上の責務

本スキルは Article Lifecycle 全体を実行する Orchestrator ではない。主に上流の次の区間を担当する。

```text
CAPTURED
  ↓
TRIAGED
  ↓
PROMOTED
  ↓
AUTHOR_INPUT_REQUIRED?
  ├─ yes → NEEDS_INPUT（LifecycleはPROMOTEDのまま）
  └─ no  → Draft Article Planを記録
              ↓
           PLANNED
              ↓
          DRAFTED以降は既存Writer / Review / Final Gateへ委譲
```

- Seedのprovenanceと状態定義は `docs/article-lifecycle-contract.md` を正とする
- `PROMOTED` へ進める場合は、外部Signalの出典と `evidence_status` を明示する
- 未解決の `AUTHOR_INPUT_REQUIRED` がある場合は記事ネタ判定を `NEEDS_INPUT` とし、Lifecycleは `PROMOTED` のまま止める。AIがmarkerを独断で削除して `PLANNED` へ進めない
- `PLANNED` は「読者課題・中心主張・根拠・媒体・構成・書かない範囲」の仮案が揃った状態とする
- 本文生成へ進む前に `Draft Article Plan`（仮のArticle Plan）をSeedへ記録する
- Plan Approval（Human）は独立した必須工程ではない。中心主張や書かない範囲の変更を採用する前に著者の判断を得る（この判断を Plan Approval としてよい）
- Plan ApprovalはLifecycle stateを追加しない。Lifecycleの `APPROVED` は既存契約どおり **公開承認** を意味する
- `DRAFTED` 以降は既存の媒体別レビュー、Final Gate、公開ポリシーへ委譲する
- 公開後のMetrics / Learningは本スキルで自動更新せず、Lifecycle契約に従って次のSignalへ戻す

## ワークフロー

入力が記事案・作業ログ・Issue/PR/ADR等なら **Mode A** として `references/idea-mode.md` を読む。
入力が許可された既存記事パスなら **Mode B** として `references/existing-article-mode.md` を読む。
どちらも `references/editorial-principles.md` と `references/output-contract.md` を併用する。

本Skillは長文本文の自動生成を入口責務にしない。Mode Aで `Draft Article Plan` が成立したら、既存の媒体別Draft / Reviewフローへ引き渡す。

## ガードレール

- レビューのみの依頼では記事本文を変更しない
- 著者の経験、失敗、成果、感情を捏造しない
- 未検証コードを動作済みと扱わない
- 出典を確認できない外部主張を断定しない
- 一般論を無理に一次経験へ見せかけない
- 記事の中心主張を、著者確認なく別の主張へ変えない
- `Draft Article Plan` をSeedに残す前に長文本文を自動生成しない
- 検索上位記事の多数派を、それだけで正しい主張・構成とみなさない
- `docs/article-lifecycle-contract.md` の状態・provenance・Metrics / Learning規約を本スキル内へ複製しない
- 公開、マージ、`published` / `ignorePublish` の切替を行わない
- `articles_note/drafts/` を編集しない

## 参考

- `AGENTS.md`
- `docs/article-lifecycle-contract.md`
- `docs/content-channel-strategy.md`
- `docs/article-guides/zenn-structure-best-practices.md`
- `articles_note/guides/note-structure-best-practices.md`
- `articles_note/checklists/note-article-quality-checklist.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/skills/article-review-apply/SKILL.md`
- `.claude/skills/note-article-review/SKILL.md`
- Forkwellイベント「おい、テックブログを書け」: https://jobs.forkwell.com/events/c8fat8q8c
