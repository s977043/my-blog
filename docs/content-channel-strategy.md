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
- River Review: review the full development flow, not only PR diffs.
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

## Data-driven channel weighting（2026-05 実測スナップショット）

GA4 と各媒体 API で取得した実測値（2026-05-21 時点）に基づく、Channel roles の補強と運用方針更新。次回測定で陳腐化判定。

**詳細データ**: [`channel-metrics/2026-05-21.md`](./channel-metrics/2026-05-21.md) — トップ10一覧・PV/like 分類・既知課題のフル記録
**公開操作の境界**: [`publish-operating-policy.md`](./publish-operating-policy.md) — 自律実行範囲・著者ゲート・rate-limit 遵守

### 流入規模（GA4 PV ベース）

| 媒体 | PV | UU | 平均エンゲ | 媒体内最高 PV 記事 | 比率 |
| --- | --- | --- | --- | --- | --- |
| **Zenn** | **9,345** | 5,717 | 32秒 | DESIGN.md 4,172 PV（全体の46%） | 1.0x（基準） |
| Qiita | 160 | 107 | 39秒 | スコープクリープ対策 36 PV | **0.017x** |
| note | （要 GA） | — | — | （API スキ数で代替: PjM/PdM/PO 108スキ） | — |

**確認された事実**: Zenn が **流入の主戦場**（Qiita の約58倍）。集客導線設計は Zenn 起点で考える。Qiita は派生・補完チャネルとして位置付ける。

### 反応指標の媒体別運用方針

| 媒体 | 主指標 | 副指標 | 見ない指標 | 根拠 |
| --- | --- | --- | --- | --- |
| **Zenn** | いいね数（記事内バズ）／GA4 PV（SEO 流入） | エンゲ秒・PV/like 比率 | — | 平均 9.3 likes/記事、PV/like 比でフロー型（SEO主導）と内部拡散型を区別 |
| **Qiita** | **ストック数** | エンゲ秒・PV | **LGTM（いいね）** | LGTM 押下率が極端に低く品質と非相関。ストックの方が再訪・実用判断の代理指標 |
| **note** | スキ数（ログイン+匿名） | コメント | — | 平均 29.7 スキ/記事、匿名スキが24%（他媒体にないチャネル特性） |

### 集客タイプの書き分け（Zenn 実測で発見）

PV/like 比率で2タイプに分離。執筆時にどちらを狙うかを意識する。

| タイプ | PV/like 目安 | 特徴 | 該当例 | 執筆指針 |
| --- | --- | --- | --- | --- |
| **SEO 主導型**（フロー） | 100〜200+ | 検索クエリで集客、フォロワー外まで届く | ai-generated-skill-md-reality-check 224 / codex-developer-instructions 146 | タイトルに具体製品名＋問題語＋解決示唆。冒頭200字に検索意図キーワード集約 |
| **Zenn 内バズ型**（コアファン） | 3〜10 | フォロー新着・いいね順トレンド経由 | obsidian-supermemory-mcp 3 | 思想・体験談寄り。タイトルに固有名詞密度を上げてもよい |
| **バランス型** | 50〜100 | 両経路で安定 | DESIGN.md 58 / Claude Code移行 98 | 入口記事として最有力。シリーズ起点に配置する |

### キラーコンテンツと派生戦略

**DESIGN.md 導入ガイド単独で Zenn 全 PV の 46%（4,172/9,345）** を占める。これを軸にした派生・回遊設計を最優先とする。

- 関連シリーズ（PenpotとReactの契約 / Open Design 続編）はリンク経由で DESIGN.md トラフィックを派生記事へ流す
- Qiita 三部作（PR #285/#286 で予防反映済）は Zenn DESIGN.md からのクロス導線の受け皿
- **Codex × Claude Code 系**（移行ガイド/規約/ルール制御）が次の柱（合計 24%、3記事）— 継続供給価値が高い

### 既知の運用課題（実測で表面化）

- **Qiita 旧 ID `93027e02e962ec327c2f`（404）が今も月8 PV 集める** — 削除済記事の残留トラフィック。Qiita は記事リダイレクト不可のため、新 URL `5ebff79112ecf1af872c` への外部参照差し替えを既知の範囲で進める
- **note は GA4 未連携または未取得** — 媒体内スキ数のみで運用。将来 GA4 連携できれば SEO 流入の質を Zenn と比較可能になる

### Channel roles の補強（実測反映）

上記表「Channel roles」の運用補助として以下を併記:

- **note の役割追加**: 「2021〜2022 年公開の EM/PjM/Scrum 系記事が今も上位スキを蓄積」= long-tail evergreen 形成チャネル。新規 AI 系記事は短期反応より長期蓄積を期待する設計でよい
- **Zenn の役割補強**: 「逆引きリファレンス」だけでなく**SEO 主導型の入口記事 + 内部拡散型のコアファン記事**の2系統を同時運用する場として位置づける
- **Qiita の役割補強**: 「検索入口」の実態は当面 Zenn が上位。Qiita は **Tips の保存価値（ストック）**を主目的とする。タイトルは「製品名 + 問題語 + 解決示唆」の3要素を満たす

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

## Article skeletons（既存公開記事から抽出した勝ち骨子）

新規テンプレ文書は作らない（凍結方針）。下記は既存公開記事に共通する構成。これを手本にし、逸脱する場合だけ理由を持つ。Claude 作成 → Codex 検証（2026-05-17、Gemini はクォータ欠測）で確定。

**Zenn**: frontmatter → `:::message`（想定読者＋得られること）→ `## TL;DR`（結論3-5行先出し）→ 本文 H2（段階/Round/番号の論理順・各 H2 冒頭1行に要点）→ `:::details`（長い補足・PR/Issue を畳む）→ `## 実践Tips`/まとめ → おわりに（主張再掲＋次の一歩）

**Qiita**: frontmatter（tags≤5）→ `## はじめに`（症状・痛み起点で共感）→ `## 先に結論`〔推奨。必須ではない〕→ 本文 H2（対策N/番号ステップ・1 H2=1論点・コードブロックは言語指定）→ `## 明日から試すなら`等（コピペ可能テンプレ＋行動）→ `## まとめ`（箇条書き再掲）→ `## 関連記事`（シリーズ相互リンク）＋`## 関連リンク`（OSS/サイト）

> これは骨子であって強制ではない。記事クラスや題材で増減してよい。重いテンプレ化・チェックリスト化はしない（Yak Shaving 回避）。

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

### River Review

Main message:

> AIコードレビューはPR差分だけでは足りない。

Channel mapping:

| Channel | Article angle |
| --- | --- |
| note | AIレビューはPR差分だけでは足りない理由 |
| Zenn | River Review architecture and review phases |
| Qiita | GitHub ActionsでAIレビューを開発フロー全体に広げる |
| Growth Lab | River Review operation guide and validation log |

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
PlanGate / River Review / Agent Skills / AI-readable repository を中心に、
Claude Code・Codex・GitHub Actions・Next.js・Laravelでの実践ログを発信中。

詳しい検証ログ: Growth Lab
思想・背景: note
OSS: GitHub
```

### Qiita profile draft

```text
AIコーディングエージェントをチーム開発で安全に使うための運用設計を検証しています。
PlanGate / River Review / Agent Skills / AI-readable repository などを書いています。

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
PlanGate / River Review / Agent Skills を中心に、
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
| Qiita | [PlanGate v8.6.0 metrics and governance](https://qiita.com/s977043/items/5ebff79112ecf1af872c) / `Qiita/public/river-reviewer-agent-skills.md` (River Review and Agent Skills, publish candidate) |
| Growth Lab | canonical guides and validation logs for PlanGate and River Review |
| GitHub | PlanGate / River Review / repository docs and issues |

### Manual update checklist

Use this order when applying the strategy outside the repository.

1. Update the Zenn profile with the Zenn profile draft.
2. Update the Qiita profile with the Qiita profile draft.
3. Update the note profile with the note profile draft and links to Zenn (https://zenn.dev/minewo), Qiita (https://qiita.com/s977043), Growth Lab (https://the3396.com/articles), and GitHub (https://github.com/s977043).
4. Set Qiita Pickup Articles to the current AI-development entry points.
5. Set the note fixed article to the PlanGate entry article above.
6. Revisit this document after publishing the Qiita River Review / Agent Skills candidate to update the entry-point URL in the table above.

## Existing article update priorities

### note

1. Make a PlanGate-related article the fixed entry article when the goal is access growth.
2. Add an opening summary to PlanGate articles.
3. Add internal links between PlanGate, River Review, Agent Skills, and EM/TL/PdM articles.
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
2. Strengthen article clusters around PlanGate, River Review, Agent Skills, and AI-readable repository design.
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

## Roadmap operating model（Rolling）

四半期固定のロードマップは AI 分野の変化に対し遅すぎる（Gemini 検証）。**四半期で大枠、月次で具体を新陳代謝する Rolling 方式**で運用する。

- **四半期（大枠）**: 注力する **1〜2 クラスタ × 媒体配分** を決める（Topic clusters から選ぶ。記事単位のガントは作らない）
- **月次（具体）**: 月次振り返りで翌月の具体ネタを微調整（バックログを新陳代謝）。※この Rolling 運用と月次計測サイクルは現在**凍結中**（[`archive/README.md`](./archive/README.md) 参照）。記事を継続公開できる段階に達するまで適用しない
- **還流**: T+30 瞬発 / T+180 持続の結果で「次の1クラスタ」と「資産記事のリライト」をバックログへ。判断単位は記事案でなくクラスタ
- 下記「30-day execution plan」は本モデルの**現サイクルの記入インスタンス**。サイクルごとに更新し、過去分は履歴として残してよい

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

> AIコーディングをチーム開発に乗せるために作っているもの: PlanGate / River Review / Agent Skills

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
3. Add cross-links to PlanGate, River Review, Agent Skills, and AI-readable repository articles.
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
