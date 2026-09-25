# Content Channel Strategy

## Purpose

This document defines the publishing strategy for note, Zenn, Qiita, Growth Lab, and izanami.

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

izanami also has a separately scoped discovery track for the user's named individual apps and OSS projects. This track can cover app-building problems outside the shared positioning above; it does not change the positioning of the existing channels.

## Channel roles

2025-2026 の各媒体動向（Codex 方針検討 + Gemini 検証で更新）を反映した役割定義。

| Channel | Role（2025-2026版） | Primary content | 補足（媒体特性の現実） |
| --- | --- | --- | --- |
| note | 一次体験・思想の正本（E-E-A-T の Experience 核） | なぜ作ったか／どう苦労したか／意思決定の背景。AI で代替できない一次情報 | Helpful Content 以降、個人の実体験記事が強い。媒体横断展開の「思想の正本」候補 |
| Zenn | 体系化された技術知識（ストック資産・逆引きリファレンス） | アーキテクチャ、実装詳細、スキーマ、設計判断。将来の自分と読者の資産 | 深掘りだけでなく逆引きリファレンス用途で SEO が強い |
| Qiita | 検索入口＋議論の火種（鮮度・コミュニティ評価） | 短い実務 Tips、トラブルシュート、最初の一歩。最新トレンドへの即応 | 単なる Tips 置き場ではなく鮮度・正確性のアルゴリズム評価が厳格化。AI 生成コンテンツガイドライン遵守が必須 |
| Growth Lab | Canonical long-form hub | Complete guides, validation logs, evergreen documentation | 体系ガイドの最終到達点 |
| izanami | 個人開発・OSSの発見チャネル | 個人OSSやアプリの課題起点の記事、設計・実装から得た実践知 | 役立つ記事を主役にし、関連プロダクトへの導線と読者の反応を検証する。SEOスコアや被リンク数は成果の保証・品質判定に使わない。**当面は River Review と AI レビュー運用の題材に集中する**（2026-09-24 著者判断。初回記事は公開済み、詳細は `articles_izanami/README.md`） |
| GitHub | Source of truth for OSS | README, releases, issues, implementation docs | OSS の実装真実 |

## Data-driven channel weighting（2026-09 実測で更新。2026-05 スナップショットは履歴として併記）

2026-09 の実測（Zenn 2026-09-04 / note 2026-09-14）と、2026-05-21 の GA4・各媒体 API 実測を並べて、Channel roles の補強と運用方針を示す。次回測定で陳腐化判定。再取得は `scripts/fetch-channel-metrics.mjs`。

**指標の基準に注意**: 2026-09 の値は媒体ごとに取得日と指標が異なる（Zenn は統計ダッシュボードの表示回数、note はダッシュボードの imp / PV / スキ）。2026-05 の GA4 PV とも基準が異なる可能性があるため、**新旧の数値、および 2026-09 の媒体間の数値を直接比較しない**。

**詳細データ（2026-09、最新）**: [`channel-metrics/2026-09-14.md`](./channel-metrics/2026-09-14.md) — Zenn（2026-09-04）/ note（2026-09-14）の集計日・取得元・指標の違いと、上位記事・低リーチ記事・既知課題のフル記録
**詳細データ（2026-05、履歴）**: [`channel-metrics/2026-05-21.md`](./channel-metrics/2026-05-21.md) — トップ10一覧・PV/like 分類・既知課題のフル記録
**公開操作の境界**: [`publish-operating-policy.md`](./publish-operating-policy.md) — 自律実行範囲・著者ゲート・rate-limit 遵守

### 2026-09 実測（最新）

| 媒体 | 取得日・取得元 | 主な値 |
| --- | --- | --- |
| **Zenn** | 2026-09-04 統計ダッシュボード + 記事の管理 | 表示回数（直近1か月）4,136 回 / 記事別合計表示回数 41,647 回（2022-01〜、39記事の掲載値の合算） |
| **note** | 2026-09-14 ダッシュボード（全35記事） | 全期間 imp 66,104 / PV 28,804 / スキ 677。過去28日 imp 1,705 / PV 776 / スキ 27 |
| Qiita | — | **2026-09 時点の実測なし**。主指標はストック数（下記「反応指標の媒体別運用方針」）で、方針は変えない |

#### Zenn（2026-09-04）

**上位3本で 25,933 回、記事別合計表示回数の 62%**。いずれも公開から数か月経過した SEO 継続流入型。

| 記事 | 表示回数 | ♡ | 公開日 |
| --- | --- | --- | --- |
| DESIGN.md 導入ガイド | 15,006 | 79 | 2026-04-06 |
| Obsidian と Supermemory MCP | 7,868 | 67 | 2025-08-30 |
| Claude Code → Codex App 移行 | 3,059 | 22 | 2026-05-04 |

上位記事の♡率が 0.5〜1.4% なのに対し、**♡率が桁違いに高いのに届いていない記事が3本**ある。内容ではなく流入の問題として扱う。

| 記事 | ♡ | 表示回数 | ♡率 |
| --- | --- | --- | --- |
| `ai-merge-ready-state-machine` | 4 | 26 | 15.4% |
| `plangate-design-evolution-v3-to-v8` | 4 | 37 | 10.8% |
| `ai-review-gate-not-called` | 5 | 119 | 4.2% |

- `river-review-judgment-placement`（2026-08-31 公開）は公開4日で表示 2,056 回・♡22。直近1か月の表示 4,136 回の約半分を1本で占める
- **字数と表示回数に相関なし**。最長の `ai-driven-tdd-nextjs`（30,089字）は 386 回、15,006 回の DESIGN.md 導入ガイドは 11,615字

#### note（2026-09-14）

| 期間 | imp | PV | スキ | PV/imp |
| --- | --- | --- | --- | --- |
| 全期間 | 66,104 | 28,804 | 677 | 43.6% |
| 過去28日 | 1,705 | 776 | 27 | 45.5% |
| 過去7日 | 458 | 210 | 11 | 45.9% |

- **PV 資産は 2021-2022 のスクラム・採用系**（「プロダクト開発における…」5,702 /「プロジェクトマネージャー」4,689 /「webエンジニア採用」3,145 /「スクラムでの開発チーム」3,046 PV）。2026 年の AI 駆動開発シリーズは全期間でも PV 20〜500 台
- **ボトルネックは note 内の露出（imp）**。28日で全記事合計 1,705 imp、1記事あたり月20〜60。PV/imp が 45% と高く、タイトルは機能している。改善対象は中身でもタイトルでもなく配信量
- **外部・検索流入が実質の柱**。PV が imp を上回る記事群がある（28日: `n92b270e91110` imp 59 / PV 119、「プロンプトを磨け」imp 15 / PV 97）
- `n062a695d5af9`（SDD / Discovery と Delivery、2026-09-11 公開）が直近最良。3日で imp 190 / PV 86 / スキ 10、スキ/PV 11.6%。7日のスキ 11・28日のスキ 27 の大半をこの1本が稼ぐ

#### 2026-09 実測からの読み取り

- **Zenn**: 流入は少数の SEO 継続流入型記事に集中している。上記の高♡率・低リーチ3本は、上位記事からの文脈内リンクで流入を作る対象（主題の適合は記事を読んで判断する）
- **note**: note 内のバズより、Zenn・X からの送客と検索流入が現実的。note は現状サブ媒体として扱う（`## Profile strategy` の note profile direction と同じ判断）
- **媒体間の比重**: 2026-09 は同一指標での媒体間比較をしていない。「Zenn が集客の主戦場」という判断は下記 2026-05 の GA4 実測に基づくもので、2026-09 の値はこれを覆す材料になっていない

### 2026-05-21 スナップショット（履歴）

2026-05-21 時点の GA4 と各媒体 API の実測。現況の値ではない。

| 媒体 | PV | UU | 平均エンゲ | 媒体内最高 PV 記事 | 比率 |
| --- | --- | --- | --- | --- | --- |
| **Zenn** | **9,345** | 5,717 | 32秒 | DESIGN.md 4,172 PV（全体の46%） | 1.0x（基準） |
| Qiita | 160 | 107 | 39秒 | スコープクリープ対策 36 PV | **0.017x** |
| note | （要 GA） | — | — | （API スキ数で代替: PjM/PdM/PO 108スキ） | — |

**確認された事実（2026-05）**: Zenn が **流入の主戦場**（Qiita の約58倍）。集客導線設計は Zenn 起点で考える。Qiita は派生・補完チャネルとして位置付ける。

### 反応指標の媒体別運用方針

| 媒体 | 主指標 | 副指標 | 見ない指標 | 根拠（2026-05 実測） |
| --- | --- | --- | --- | --- |
| **Zenn** | いいね数（記事内バズ）／GA4 PV（SEO 流入） | エンゲ秒・PV/like 比率 | — | 平均 9.3 likes/記事、PV/like 比でフロー型（SEO主導）と内部拡散型を区別 |
| **Qiita** | **ストック数** | エンゲ秒・PV | **LGTM（いいね）** | LGTM 押下率が極端に低く品質と非相関。ストックの方が再訪・実用判断の代理指標 |
| **note** | スキ数（ログイン+匿名） | コメント | — | 平均 29.7 スキ/記事、匿名スキが24%（他媒体にないチャネル特性） |

2026-09 の補足: Zenn は統計ダッシュボードの表示回数と♡率（♡ / 表示回数）で、流入の集中と低リーチ記事を見た。note は imp と PV/imp で、露出の量と入口の効き方を分けて見る。

### 集客タイプの書き分け（2026-05 Zenn 実測で発見）

PV/like 比率で2タイプに分離。執筆時にどちらを狙うかを意識する。PV/like 比は 2026-05 の GA4 PV と likes による値で、2026-09 の表示回数ベースの値には同じ目安を当てはめない。

| タイプ | PV/like 目安 | 特徴 | 該当例 | 執筆指針 |
| --- | --- | --- | --- | --- |
| **SEO 主導型**（フロー） | 100〜200+ | 検索クエリで集客、フォロワー外まで届く | ai-generated-skill-md-reality-check 224 / codex-developer-instructions 146 | タイトルに具体製品名＋問題語＋解決示唆。冒頭200字に検索意図キーワード集約 |
| **Zenn 内バズ型**（コアファン） | 3〜10 | フォロー新着・いいね順トレンド経由 | obsidian-supermemory-mcp 3 | 思想・体験談寄り。タイトルに固有名詞密度を上げてもよい |
| **バランス型** | 50〜100 | 両経路で安定 | DESIGN.md 58 / Claude Code移行 98 | 入口記事として最有力。シリーズ起点に配置する |

### キラーコンテンツと派生戦略

**DESIGN.md 導入ガイドが Zenn の最大流入記事**。2026-05 は GA4 PV で単独 46%（4,172/9,345）、2026-09 は表示回数 15,006 回で上位3本（計 62%）の筆頭。これを軸にした派生・回遊設計を最優先とする。

- 関連シリーズ（PenpotとReactの契約 / Open Design 続編）はリンク経由で DESIGN.md トラフィックを派生記事へ流す
- Qiita 三部作（PR #285/#286 で予防反映済）は Zenn DESIGN.md からのクロス導線の受け皿
- **Codex × Claude Code 系**（移行ガイド/規約/ルール制御）が次の柱（2026-05 は合計 24%、3記事）— 継続供給価値が高い。2026-09 も Claude Code → Codex App 移行が表示 3,059 回で3位
- 2026-09 の追加: 高♡率・低リーチの3本（`ai-merge-ready-state-machine` / `plangate-design-evolution-v3-to-v8` / `ai-review-gate-not-called`）へ、上位記事から文脈内リンクで流入を作る

### 既知の運用課題（実測で表面化）

- **Qiita 旧 ID `93027e02e962ec327c2f`（404）が月8 PV を集めていた**（2026-05 時点）— 削除済記事の残留トラフィック。Qiita は記事リダイレクト不可のため、新 URL `5ebff79112ecf1af872c` への外部参照差し替えを既知の範囲で進める。2026-09 時点の残留トラフィックは未計測
- **note は 2026-05 時点で GA4 未連携または未取得**だった。2026-09 は note ダッシュボードの imp / PV / スキで計測した。GA4 連携の状況は未確認
- **Qiita は 2026-09 時点の実測なし**。次回測定で 2026-05 との差分を取る

### Channel roles の補強（実測反映）

上記表「Channel roles」の運用補助として以下を併記:

- **note の役割追加**: 「2021〜2022 年公開の EM/PjM/Scrum 系記事が今も上位スキを蓄積」= long-tail evergreen 形成チャネル。新規 AI 系記事は短期反応より長期蓄積を期待する設計でよい。2026-09-14 実測でも PV 資産は 2021-2022 のスクラム・採用系で、流入は note 内の露出より外部・検索流入が柱
- **Zenn の役割補強**: 「逆引きリファレンス」だけでなく**SEO 主導型の入口記事 + 内部拡散型のコアファン記事**の2系統を同時運用する場として位置づける。2026-09-04 実測では、公開から数か月経過した SEO 継続流入型の上位3本が記事別合計表示回数の 62% を占める
- **Qiita の役割補強**: 「検索入口」の実態は当面 Zenn が上位（2026-05 実測。2026-09 時点の Qiita 実測なし）。Qiita は **Tips の保存価値（ストック）**を主目的とする。タイトルは「製品名 + 問題語 + 解決示唆」の3要素を満たす

## Reader journey

Design articles so that readers can move through this path.

1. Qiita: discover the problem through a concrete search query.
2. Zenn: understand the technical design and implementation.
3. note: understand the background, motivation, and team-operation perspective.
4. Growth Lab: read the canonical guide or validation log.
5. GitHub or the app: star, try, install, file feedback, or contribute.

izanami is an additional discovery entry point into the relevant OSS or app, not a required step in this sequence. Its articles should help readers understand a concrete problem and decide whether the linked project is useful to them.

Do not publish the same body to every platform. Reframe the same topic for each reader intent.

## izanami channel policy

izanami is an additional distribution channel for practical articles connected to the author's OSS and apps. Its purpose is to help relevant readers discover a product, try it, and provide feedback. It does not replace the existing canonical documentation or article channels.

### Editorial scope

- Select topics from existing articles and project experience, then write a **new izanami article** for a reader problem that the existing article does not already answer in the same way.
- Reusing the same first-hand observations, code, and verified facts is allowed. Reusing the original article's structure and wording with superficial edits is not; the new article must offer a distinct reader benefit, framing, and conclusion.
- Use the project repository and its public documentation as the source of truth for current implementation claims. Link to the relevant repository, app, or canonical guide where it helps the reader act.
- Product links must be relevant to the article's solution and clearly identified. Do not make the article a product announcement or add unrelated links solely to obtain backlinks.
- Keep links to articles on other publishing platforms in a short references/related-links section at the end, consistent with the cross-platform linking rule below. Contextual links to the product being explained may appear where useful.
- When an izanami article is a materially reworked version of an existing article, follow the canonical-source opening-link rule in Cross-posting rules. A distinct article with a different reader problem may cite related articles at the end without presenting itself as a repost.
- Treat izanami's title, summary, tag, and SEO/LLMO checks as editorial aids. Do not optimize to a score at the expense of accuracy or reader value.

### Project eligibility and evidence boundaries

The default source boundary in `AGENTS.md` still applies. Personal repositories owned by `s977043` are eligible. Company-owned repositories and their observations remain excluded from personal publishing unless the user explicitly authorizes a specific project and channel.

For this izanami initiative, the user explicitly authorized coverage of PlanGate, River Review, Growth Lab, PocketEitan, and the jellyfish aquarium project. This authorization is limited to these named projects and izanami. The jellyfish aquarium repository is owned by `3396-cc`; use only information that is already public in its repository or product page, and do not include private company context, internal metrics, or non-public implementation details. This exception does not change eligibility for Zenn, Qiita, or personal note articles.

Before drafting each article, record the existing article(s) that supplied its topic and the project references used to verify its claims. If either the existing article or public project evidence cannot be identified, keep that topic in the idea state until the source is confirmed.

### Search, links, and measurement

- Product awareness, referral visits, adoption, and naturally earned third-party citations are desired outcomes to observe, not guaranteed results. An izanami article's link to the author's project is an outbound referral link from izanami and an inbound backlink to the project. However, the sampled izanami product page marks its external product link `rel="nofollow"`; do not assume these links pass ranking signals or promise SEO benefit. Verify the actual article/product link attributes when publishing, and measure referral value separately from search visibility. Do not create content or arrange links primarily to manipulate search rankings. Track external sites that independently cite or link to the project separately when measurable.
- Do not publish duplicate or near-duplicate articles to manufacture search coverage. Google may choose which similar URL to show, and canonical hints are not a guaranteed syndication control. Since izanami-specific indexing controls have not been verified, publish only independently useful articles; do not rely on a canonical setting being available.
- Prefer a small initial trial, then review available article views, engagement/feedback, tracked outbound visits, repository or app visits, and attributable adoption signals after about 30 days. Mark unavailable measures as unmeasured. Continue, adjust, or stop based on observed reader and product outcomes, not post count or SEO tool scores alone.
- Product listing and article publishing are separate actions and should be evaluated separately. Listing a product does not justify publishing an article that lacks independent reader value.

### Repository management

Izanami article sources are maintained in `articles_izanami/`. Each Markdown file is the sole local source for that izanami article and its metadata; do not keep a second published mirror. Record the source article paths, project evidence references, publication status, and live izanami URL with the article. The directory README documents the file contract and points back to this section for policy.

### References

- [izanami Content Guide](https://izanami.dev/docs/content-guide) and [Community Guidelines](https://izanami.dev/guideline) — reader value, originality, and promotional-content boundaries.
- [izanami Editor](https://izanami.dev/docs/editor) — article summaries, quality checks, tags, and reader feedback features.
- [Google: Creating Helpful, Reliable, People-First Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) — original information, first-hand expertise, and reader satisfaction.
- [Google: Canonicalization troubleshooting](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting) — canonical hints and syndicated-content caveats.
- [Google: Spam Policies](https://developers.google.com/search/docs/essentials/spam-policies) — link spam and scaled-content abuse boundaries.

## Cross-posting rules（重複コンテンツ・カニバリ回避）

1テーマ多媒体展開は露出を増やせる一方、読者価値がほぼ同じページを複数公開しても検索結果へ別々に表示されるとは限らない。Google は類似・重複ページの canonical 化を行い、シンジケート記事では canonical 指定だけで複製先の検索表示を確実に防げないとしている（上記 Google 公式資料）。

- **正本を1つ決める**: テーマごとに「正本（canonical）媒体」を1つ決め、他媒体は再構成版と位置づける。デフォルトの正本方向は **note（一次体験・思想）→ Zenn/Qiita へ抽出**。技術仕様が主役のテーマは Zenn を正本にしてよい（テーマ単位で選択）
- **冒頭に正本明示リンク**: 再構成版の冒頭に「本記事は〈正本媒体〉を正本とし、媒体特性に合わせて再構成したものです」と1文＋正本へのリンクを置く。読者へ関係を明示し、正本を伝える補助情報として使う。検索エンジンが正本として選ぶことを保証するものではない
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
| izanami | AIレビュー結果をどう信頼し、どう読むか（指摘0件の扱い、指摘が多すぎるときの絞り方）。River Review は設計例として扱う |

Zenn は River Review の設計と実装、izanami はレビュー結果を受け取る側の運用判断を扱う。同じ一次情報を使ってもよいが、読者課題と結論を分ける（`izanami channel policy` の Editorial scope）。

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

最終更新: 2026-09-23（issue #231 の 2026-06-01 版コメントを起点に、2026-09 時点の公開記事・Book と実測値へ合わせて更新）。

- 文字数上限: Zenn / Qiita / note いずれのプロフィール欄も**上限未確認**。貼り付け時に入り切らない場合は、各文案の最終行（媒体リンク行）から削る
- 表記: OSS 名は現行の記事タイトルに合わせて **River Review** に統一する（2026-06-01 版コメントの「River Reviewer」は旧称）
- note 文案はダッシュを使わない（`AGENTS.md`「note 固有（JTFスタイル準拠）」）。Book 名は全角括弧で区切って表記する

### Zenn profile draft

```text
AIコーディングをチーム開発に乗せる運用設計を検証しています。
PlanGate / River Review / Agent Skills / AI-readable repository を中心に、
Claude Code・Codex・GitHub Actions での実践ログを発信中。

📕 Book「AI にコードを書かせる前にやること — PlanGate 実践ガイド」公開中
検証ログ: Growth Lab ／ 思想・背景: note ／ OSS: GitHub
```

### Qiita profile draft

```text
AIコーディングエージェントをチーム開発で安全に使うための運用設計を検証しています。
PlanGate / River Review / Agent Skills / AI-readable repository などを書いています。

Zenn Book「PlanGate 実践ガイド」で、計画・実装・検証の型を体系化しました。
note: 背景・思想 ／ Zenn: 技術深掘り＋Book ／ Growth Lab: 検証ログ ／ GitHub: OSS
```

### note profile direction

Use note as the narrative hub.

- Explain the background and team-operation perspective.
- Link to the Zenn Book as the systematic guide, and to Zenn for technical details.
- Link to Qiita for short practical articles.
- Link to Growth Lab for canonical guides.
- Link to GitHub for OSS repositories.
- 実測（2026-09-14）では note は外部・検索流入が柱で、note 内の露出（imp）がボトルネック。プロフィールは note 内回遊より「他媒体から来た読者を Book と Zenn へ渡す」役割を優先する

### note profile draft

```text
AIコーディングをチーム開発に乗せる運用設計について書いています。
PlanGate / River Review / Agent Skills を中心に、AIエージェントを個人の便利ツールで終わらせず、チームの開発フローにどう組み込むかを考えています。

体系ガイド（Zenn Book「AIにコードを書かせる前にやること」PlanGate実践ガイド）: https://zenn.dev/minewo/books/plangate-guide
技術深掘り: Zenn ／ 実践メモ: Qiita ／ 検証ログ: Growth Lab ／ OSS: GitHub
```

### Current entry-point candidates

Use these as the visible first-step articles when updating pinned articles, pickup articles, or profile links.
すべて 2026-09-23 に `curl -s -o /dev/null -w "%{http_code}"` で HTTP 200 を確認済み。

| Channel | Entry point | 選定理由 |
| --- | --- | --- |
| note | [AIにコードを書かせる前に、人間が承認する場所を作る](https://note.com/mine_unilabo/n/n02992266d622) as the fixed entry article | PlanGate の入口。固定記事候補（従来どおり） |
| note | [AI駆動開発でSDDを考え直した。DiscoveryとDeliveryでは「先に定義するもの」が違った](https://note.com/mine_unilabo/n/n062a695d5af9) | 2026-09-11 公開。公開3日でスキ/PV 11.6%（2026-09-14 実測）と直近で最も反応が高い |
| note | [「プロンプトを磨けば勝てる」をやめた：AIレビューを運用に乗せる“Agent Skills”設計](https://note.com/mine_unilabo/n/nd21c3f1df22e) | River Review / Agent Skills の思想側の入口 |
| Zenn | [Book: AI にコードを書かせる前にやること — PlanGate 実践ガイド](https://zenn.dev/minewo/books/plangate-guide) | 2026-06-01 公開。体系ガイドの最終到達点 |
| Zenn | [AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](https://zenn.dev/minewo/articles/river-review-judgment-placement) | 2026-08-31 公開。公開4日で表示 2,056 回（2026-09-04 実測） |
| Zenn | [AIが迷わないリポジトリ設計：長いプロンプトより先に整える4つの置き場所](https://zenn.dev/minewo/articles/ai-legible-repository-design) | AI-readable repository design の入口（従来どおり） |
| Zenn | [PlanGate v8.6.0 metrics and governance](https://zenn.dev/minewo/articles/plangate-v86-hook-enforcement) | Metrics and governance の入口（従来どおり） |
| Zenn | [AIにマージさせない。PRをMERGE_READYまで運ぶ状態機械の設計](https://zenn.dev/minewo/articles/ai-merge-ready-state-machine) | ♡率 15.4% に対し表示 26 回（2026-09-04 実測）。反応は高いが届いていないため、入口として露出を足す |
| Qiita | [PlanGate v8.6.0 metrics and governance](https://qiita.com/s977043/items/5ebff79112ecf1af872c) | Pickup 候補（従来どおり） |
| Qiita | [プロンプトを磨くのをやめた：チームのレビュー知識を Agent Skills に変える River Review 体験](https://qiita.com/s977043/items/607d78c35745b17f9bc8) | Pickup 候補。旧表の「publish candidate」（`Qiita/public/river-reviewer-agent-skills.md`）が公開済みになったもの |
| Qiita | [AIコードレビューはPRだけ見ていていいのか？ 開発の流れ全体をレビューするOSS「River Review」を作った](https://qiita.com/s977043/items/5a4665e78c4bd1a5c1bc) | Pickup 候補。River Review 本体の紹介 |
| Qiita | [AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks](https://qiita.com/s977043/items/b8dacca4ce2d9079454a) | Pickup 候補。検索入口型の短い実務 Tips |
| Growth Lab | canonical guides and validation logs for PlanGate and River Review | 記事単位の URL は本表では持たない |
| GitHub | PlanGate / River Review / repository docs and issues | 記事単位の URL は本表では持たない |

### Manual update checklist

リポジトリ側の文面準備は完了済み。残りは各サービス設定画面での手作業のみ。この順で実施する。

- [ ] Zenn プロフィールを「Zenn profile draft」で更新する（https://zenn.dev/minewo の設定画面）
- [ ] Qiita プロフィールを「Qiita profile draft」で更新する（https://qiita.com/s977043 の設定画面）
- [ ] note プロフィールを「note profile draft」で更新し、リンク欄に Zenn（https://zenn.dev/minewo）、Qiita（https://qiita.com/s977043）、Growth Lab（https://the3396.com/articles）、GitHub（https://github.com/s977043）を設定する
- [ ] Qiita の Pickup Articles を上表の Qiita 行から選んで設定する（設定可能な件数は未確認）
- [ ] note の固定記事を上表の note 1行目（PlanGate 入口）に設定するか判断し、設定する
- [ ] 貼り付け後、各プロフィールページを開いて改行・リンクの表示崩れがないか確認する

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

Recommended Qiita article titles（2026-09-23 時点の状況。公開済みの URL はすべて HTTP 200 を確認）:

| 候補タイトル | 状況 |
| --- | --- |
| Claude CodeでAIが勝手に実装範囲が広がるときの対策 | 公開済み: [Claude CodeでAIが勝手に実装範囲を広げる（スコープクリープ）ときの対策](https://qiita.com/s977043/items/a25ec91ea411f39bf340) |
| AIコーディング前に確認する5項目 | 公開済み: [AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks](https://qiita.com/s977043/items/b8dacca4ce2d9079454a) |
| PRレビューだけではAI開発が危ない理由 | 近い主題の記事が公開済み: [AIコードレビューはPRだけ見ていていいのか？ 開発の流れ全体をレビューするOSS「River Review」を作った](https://qiita.com/s977043/items/5a4665e78c4bd1a5c1bc)。別記事として書くかは未判断 |
| AGENTS.mdとCLAUDE.mdの役割を分ける | Qiita では未公開。同主題の Zenn 記事が公開済み: [Codex と Claude Code を同じリポジトリで回す — AGENTS.md / CLAUDE.md の 2 層規約](https://zenn.dev/minewo/articles/dual-agent-repo-codex-and-claude-code)。Qiita で書く場合は「Cross-posting rules」に従い本文を転載しない |
| PlanGateを1タスクだけ試す手順 | 未公開。関連する公開記事 [アジャイルでAI駆動開発をどう回すか: PlanGateの考え方とテンプレート](https://qiita.com/s977043/items/6041bbc2659412341d54) は最小構成とテンプレートを扱うが、1タスクを試す手順の記事ではない |

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

### Week 2: Publish search-entry articles（完了）

Publish two short Qiita articles. → 2本とも公開済み（2026-09-23 に `curl -s -o /dev/null -w "%{http_code}"` で HTTP 200 を確認）。

1. [Claude CodeでAIが勝手に実装範囲を広げる（スコープクリープ）ときの対策](https://qiita.com/s977043/items/a25ec91ea411f39bf340)（計画時の仮題「Claude CodeでAIが勝手に実装範囲が広がるときの対策」）
2. [AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks](https://qiita.com/s977043/items/b8dacca4ce2d9079454a)

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
5. ~~Publish two Qiita search-entry articles.~~ 完了（2本とも公開済み。上記「Week 2」参照）
6. Publish one note hub article.（構成案は `article_seeds/note-hub-plangate-river-skills/`。【著者確認】の空欄を埋めてから本文化）
7. izanami: 2本目（指摘が多すぎるときの絞り方）の構成案 PR #698 を確定して本文化する。初回記事の観測は 2026-10-24 頃に行う

## Editorial guardrails

- Do not duplicate the same body across platforms.
- Do not make every article long.
- Do not send every reader directly to GitHub.
- Do not hide related links only at the bottom; add contextual links in the body.
- Prefer concrete pain, concrete workflow, and concrete next action.
- Keep the shared category consistent: AIコーディングをチーム開発に乗せる運用設計.
