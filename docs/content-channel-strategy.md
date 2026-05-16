# Content Channel Strategy

## Purpose

This document defines the publishing strategy for note, Zenn, Qiita, and Growth Lab.

The goal is to grow access by treating the channels as one technical content portfolio, not as isolated article destinations.

## Status: canonical（正本）

**このドキュメントが媒体役割・書き分け方針の唯一の正本（single source of truth）。**

- `README.md` / `articles/README.md` / `Qiita/README.md` / `AGENTS.md` 等で媒体役割に言及する場合は、ここを参照（`docs/content-channel-strategy.md` を見よ）に留め、定義を二重に書かない
- 役割定義が他ファイルと食い違った場合、本ドキュメントが優先。他ファイルは追従修正する
- 最終更新方針: 各媒体のアルゴリズム/読者特性は年単位で変わる。陳腐化したら「Channel roles」を改訂し、改訂日と根拠を残す（現行は 2025-2026 動向反映版）

## Core positioning

Use the following positioning as the shared theme across all channels.

> AIコーディングをチーム開発に乗せる運用設計

This positioning connects the existing topics into a single recognizable category.

- PlanGate: stop AI before implementation and require approval.
- River Reviewer: review the full development flow, not only PR diffs.
- Agent Skills: make AI review criteria reusable and reproducible.
- AI-readable repository design: make repositories easier for agents to navigate.
- Metrics and governance: evaluate AI development workflows with numbers, not impressions.

## Channel roles

2025-2026 の各媒体動向（Codex 方針検討 + Gemini 検証で更新）を反映した役割定義。

| Channel | Role（2025-2026版） | Primary content | 補足（媒体特性の現実） |
| --- | --- | --- | --- |
| note | 一次体験・思想の正本（E-E-A-T の Experience 核） | なぜ作ったか／どう苦労したか／意思決定の背景。AI で代替できない一次情報 | Helpful Content 以降、個人の実体験記事が強い。媒体横断展開の「思想の正本」候補 |
| Zenn | 体系化された技術知識（ストック資産・逆引きリファレンス） | アーキテクチャ、実装詳細、スキーマ、設計判断。将来の自分と読者の資産 | 深掘りだけでなく逆引きリファレンス用途で SEO が強い |
| Qiita | 検索入口＋議論の火種（鮮度・コミュニティ評価） | 短い実務 Tips、トラブルシュート、最初の一歩。最新トレンドへの即応 | 単なる Tips 置き場ではなく鮮度・正確性のアルゴリズム評価が厳格化。AI 生成コンテンツガイドライン遵守が必須 |
| Growth Lab | Canonical long-form hub | Complete guides, validation logs, evergreen documentation | 体系ガイドの最終到達点 |
| GitHub | Source of truth for OSS | README, releases, issues, implementation docs | OSS の実装真実 |

## Reader journey

Design articles so that readers can move through this path.

1. Qiita: discover the problem through a concrete search query.
2. Zenn: understand the technical design and implementation.
3. note: understand the background, motivation, and team-operation perspective.
4. Growth Lab: read the canonical guide or validation log.
5. GitHub: star, try, file an issue, or contribute.

Do not publish the same body to every platform. Reframe the same topic for each reader intent.

## Cross-posting rules（重複コンテンツ・カニバリ回避）

1テーマ多媒体展開は露出最大化に有効だが、本文を微調整しただけの再投稿は検索エンジンに実質同一と判定され、ドメイン最強の1本以外がインデックス未登録になるリスクがある（Gemini 検証指摘）。

- **正本を1つ決める**: テーマごとに「正本（canonical）媒体」を1つ決め、他媒体は再構成版と位置づける。デフォルトの正本方向は **note（一次体験・思想）→ Zenn/Qiita へ抽出**。技術仕様が主役のテーマは Zenn を正本にしてよい（テーマ単位で選択）
- **冒頭に正本明示リンク**: 再構成版の冒頭に「本記事は〈正本媒体〉を正本とし、媒体特性に合わせて再構成したものです」と1文＋正本へのリンクを置く。スパム判定回避と読者の回遊を兼ねる
- **本文を実質変える**: 媒体ごとに読者意図に合わせて再構成（同一段落の使い回しをしない）。note=体験/思想、Zenn=体系/実装、Qiita=実務 Tips/トラブルシュート
- **カニバリ自己チェック**: 自分の既存記事と検索意図が被らないか公開前に確認（同テーマ複数記事はシリーズ化し相互リンクで束ねる）

## AI 生成コンテンツの媒体ポリシー

- **Qiita**: AI 生成コンテンツガイドラインに従い、AI を主として作成した記事は明示する。違反はシャドウバン級の不利益。多段 AI レビューを通した記事でも「付加価値のない AI 生成物」と見なされないよう、執筆者の一次体験・独自見解（I-message）を必ず含める
- 全媒体共通: Google は AI 生成そのものを罰しないが「付加価値のない量産」は順位を大きく下げる。E-E-A-T の Experience（実体験）を各記事に1つは必ず入れる

## Topic clusters

### PlanGate

Main message:

> 承認なし、コードなし。

Channel mapping:

| Channel | Article angle |
| --- | --- |
| note | AIにコードを書かせる前に、なぜ人間の承認が必要なのか |
| Zenn | PlanGateの設計: plan / approve / exec and hook enforcement |
| Qiita | Claude CodeでAIが勝手に実装範囲を広げるときの対策 |
| Growth Lab | PlanGate complete guide: setup, operation, metrics, governance |

### River Reviewer

Main message:

> AIコードレビューはPR差分だけでは足りない。

Channel mapping:

| Channel | Article angle |
| --- | --- |
| note | AIレビューはPR差分だけでは足りない理由 |
| Zenn | River Reviewer architecture and review phases |
| Qiita | GitHub ActionsでAIレビューを開発フロー全体に広げる |
| Growth Lab | River Reviewer operation guide and validation log |

### Agent Skills

Main message:

> プロンプトではなく、再利用できるレビュー観点を設計する。

Channel mapping:

| Channel | Article angle |
| --- | --- |
| note | AIレビューの指摘がブレる理由 |
| Zenn | Skill Registry, fixtures, golden files, and eval design |
| Qiita | AIレビューの観点を10行ルールで揃える |
| Growth Lab | Agent Skills catalog and improvement process |

### AI-readable repository design

Main message:

> AIが迷わない置き場所を作る。

Channel mapping:

| Channel | Article angle |
| --- | --- |
| note | AI時代にリポジトリ設計がチーム運用課題になる理由 |
| Zenn | AGENTS.md, CLAUDE.md, docs/ai, ADR placement strategy |
| Qiita | AGENTS.mdとCLAUDE.mdの役割を分ける |
| Growth Lab | Repository design guide for AI agents |

## Profile strategy

Use the following text as the canonical source for external profile updates.
The live profile fields on each platform are maintained outside this repository, so
this document keeps the shared positioning, short bio copy, and link order aligned.

Unify profiles so that readers immediately understand the theme.

### Zenn profile draft

```text
AIコーディングをチーム開発に乗せる運用設計を検証しています。
PlanGate / River Reviewer / Agent Skills / AI-readable repository を中心に、
Claude Code・Codex・GitHub Actions・Next.js・Laravelでの実践ログを発信中。

詳しい検証ログ: Growth Lab
思想・背景: note
OSS: GitHub
```

### Qiita profile draft

```text
AIコーディングエージェントをチーム開発で安全に使うための運用設計を検証しています。
PlanGate / River Reviewer / Agent Skills / AI-readable repository などを書いています。

note: 背景・思想
Zenn: 技術深掘り
Growth Lab: 検証ログ
GitHub: OSS
```

### note profile direction

Use note as the narrative hub.

- Explain the background and team-operation perspective.
- Link to Zenn for technical details.
- Link to Qiita for short practical articles.
- Link to Growth Lab for canonical guides.
- Link to GitHub for OSS repositories.

### note profile draft

```text
AIコーディングをチーム開発に乗せる運用設計について書いています。
PlanGate / River Reviewer / Agent Skills を中心に、
AIエージェントを個人の便利ツールで終わらせず、チームの開発フローにどう組み込むかを考えています。

技術深掘り: Zenn
実践メモ: Qiita
検証ログ: Growth Lab
OSS: GitHub
```

### Current entry-point candidates

Use these as the visible first-step articles when updating pinned articles, pickup articles, or profile links.

| Channel | Entry point |
| --- | --- |
| note | [AIにコードを書かせる前に、人間が承認する場所を作る](https://note.com/mine_unilabo/n/n02992266d622) as the fixed entry article |
| Zenn | [PlanGate v8.6.0 metrics and governance](https://zenn.dev/minewo/articles/plangate-v86-hook-enforcement) / [AI-readable repository design](https://zenn.dev/minewo/articles/ai-legible-repository-design) |
| Qiita | [PlanGate v8.6.0 metrics and governance](https://qiita.com/s977043/items/93027e02e962ec327c2f) / `Qiita/public/river-reviewer-agent-skills.md` (River Reviewer and Agent Skills, publish candidate) |
| Growth Lab | canonical guides and validation logs for PlanGate and River Reviewer |
| GitHub | PlanGate / River Reviewer / repository docs and issues |

### Manual update checklist

Use this order when applying the strategy outside the repository.

1. Update the Zenn profile with the Zenn profile draft.
2. Update the Qiita profile with the Qiita profile draft.
3. Update the note profile with the note profile draft and links to Zenn (https://zenn.dev/minewo), Qiita (https://qiita.com/s977043), Growth Lab (https://the3396.com/articles), and GitHub (https://github.com/s977043).
4. Set Qiita Pickup Articles to the current AI-development entry points.
5. Set the note fixed article to the PlanGate entry article above.
6. Revisit this document after publishing the Qiita River Reviewer / Agent Skills candidate to update the entry-point URL in the table above.

## Existing article update priorities

### note

1. Make a PlanGate-related article the fixed entry article when the goal is access growth.
2. Add an opening summary to PlanGate articles.
3. Add internal links between PlanGate, River Reviewer, Agent Skills, and EM/TL/PdM articles.
4. Add stronger GitHub calls to action.
5. Use around five tags per article.

Recommended tags for PlanGate articles:

```text
#AI
#生成AI
#Claude
#AIエージェント
#開発生産性
#PlanGate
```

### Zenn

1. Keep Zenn as the technical deep-dive channel.
2. Strengthen article clusters around PlanGate, River Reviewer, Agent Skills, and AI-readable repository design.
3. Add links from each technical article to the corresponding note background article and GitHub repository.
4. Use Zenn for implementation details, not broad narrative essays.

### Qiita

1. Use Qiita as the short search-entry channel.
2. Prefer one issue per article.
3. Update pinned or pickup articles so current AI development topics are visible.
4. Use titles that match concrete search intent.

Recommended Qiita article titles:

- Claude CodeでAIが勝手に実装範囲が広がるときの対策
- AIコーディング前に確認する5項目
- PRレビューだけではAI開発が危ない理由
- AGENTS.mdとCLAUDE.mdの役割を分ける
- PlanGateを1タスクだけ試す手順

## Standard article structure

Use this shape for new and updated articles.

1. Problem statement.
2. Concrete failure pattern.
3. Proposed workflow or design.
4. Minimal example or checklist.
5. Where this fits in the broader system.
6. Related links by channel.
7. GitHub or Growth Lab call to action.

## Standard cross-link block

Use a short block like this near the end of related articles.

```markdown
## Related links

- Background and team-operation perspective: note
- Technical implementation details: Zenn
- Short setup and troubleshooting notes: Qiita
- Canonical guide and validation logs: Growth Lab
- OSS implementation: GitHub
```

## 30-day execution plan

### Week 1: Align visible entry points

- Update Zenn profile.
- Update Qiita profile.
- Update note profile links.
- Change Qiita pickup articles to current AI-development topics.
- Make a PlanGate article the primary note entry point.

### Week 2: Publish search-entry articles

Publish two short Qiita articles.

1. Claude CodeでAIが勝手に実装範囲が広がるときの対策
2. AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks

### Week 3: Publish hub narrative

Publish one note hub article.

Title draft:

> AIコーディングをチーム開発に乗せるために作っているもの: PlanGate / River Reviewer / Agent Skills

Purpose:

- Explain the whole portfolio.
- Route readers to Zenn, Qiita, Growth Lab, and GitHub.
- Make the category understandable in one article.

### Week 4: Measure and update

Track the following signals.

| Signal | Meaning |
| --- | --- |
| Views | Title, tags, and distribution strength |
| Likes / reactions | Reader satisfaction |
| Comments | Depth of resonance |
| GitHub stars | OSS conversion |
| Issues | Practical adoption and friction |
| Search queries | Future Qiita and Zenn article ideas |

## Immediate next actions

1. Update profile text across Zenn, Qiita, and note using the canonical copy above.
2. Set current AI-development articles as visible entry points.
3. Add cross-links to PlanGate, River Reviewer, Agent Skills, and AI-readable repository articles.
4. Confirm note fixed entry article choice for the current growth goal.
5. Publish two Qiita search-entry articles.
6. Publish one note hub article.

## Editorial guardrails

- Do not duplicate the same body across platforms.
- Do not make every article long.
- Do not send every reader directly to GitHub.
- Do not hide related links only at the bottom; add contextual links in the body.
- Prefer concrete pain, concrete workflow, and concrete next action.
- Keep the shared category consistent: AIコーディングをチーム開発に乗せる運用設計.
