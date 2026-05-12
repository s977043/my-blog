# Content Channel Strategy

## Purpose

This document defines the publishing strategy for note, Zenn, Qiita, and Growth Lab.

The goal is to grow access by treating the channels as one technical content portfolio, not as isolated article destinations.

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

| Channel | Role | Primary content |
| --- | --- | --- |
| note | Background, narrative, management perspective | Why the workflow matters, EM/TL/PdM implications, lessons learned |
| Zenn | Technical deep dives | Architecture, implementation details, schemas, GitHub Actions, examples |
| Qiita | Search entry points and practical tips | Short how-to articles, troubleshooting, first-step guides |
| Growth Lab | Canonical long-form hub | Complete guides, validation logs, evergreen documentation |
| GitHub | Source of truth for OSS | README, releases, issues, implementation docs |

## Reader journey

Design articles so that readers can move through this path.

1. Qiita: discover the problem through a concrete search query.
2. Zenn: understand the technical design and implementation.
3. note: understand the background, motivation, and team-operation perspective.
4. Growth Lab: read the canonical guide or validation log.
5. GitHub: star, try, file an issue, or contribute.

Do not publish the same body to every platform. Reframe the same topic for each reader intent.

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

### Current entry-point candidates

Use these as the visible first-step articles when updating pinned articles, pickup articles, or profile links.

| Channel | Entry point |
| --- | --- |
| note | PlanGate-related article as the fixed entry article when the goal is access growth |
| Zenn | `articles/plangate-v86-hook-enforcement.md` / `articles/ai-legible-repository-design.md` |
| Qiita | `Qiita/public/93027e02e962ec327c2f.md` / `Qiita/public/river-reviewer-agent-skills.md` |
| Growth Lab | canonical guides and validation logs for PlanGate and River Reviewer |
| GitHub | PlanGate / River Reviewer / repository docs and issues |

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
