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

## 記事の編集原則

記事は、読者に残したい主張が正しく伝わることを優先する。事実の正確さは守るが、調べて確認した情報をすべて本文に載せる必要はない。仕様書や実装ドキュメントの網羅性を、記事に求めない。

- 執筆前に「誰に、何を一つ伝えるか」を決める。各章・例・図は、その主張の理解に役立つものだけ残す。
- 主張を支える体験や事実は一次情報で確認する。確認できないことを事実として書かず、確認した範囲を超えて一般化しない。
- 例外・仕様の細部・検証経緯は、欠くと読者が主張を誤解したり、手順を誤ったりする場合に本文へ書く。それ以外は省くか、必要に応じて参照先を示す。
- レビューでは事実誤認を修正する。一方、正しい情報でも中心主張を薄める追記は求めず、削除や言い換えで解決できないか先に考える。

### 実体験を読者の判断に変える制作方針

**2026-11-06: 著者が支持した方向性を、企画・執筆・レビューで使う判断基準へ具体化。** 支持の範囲と未確認の読者仮説は [author-thinking-compass.md](author-thinking-compass.md#1-4-実体験の価値を読者へ届く形にする) に残す。共通ポジショニングと媒体役割は維持し、新しい Writer・レビュー系・公開ゲートは設けない。

AI駆動開発の記事では、**何を使ったかだけでなく、実際に何が起き、何を確かめ、次の判断をどう変えたか**を価値の中心に置く。読者が持ち帰るのは完成した仕組みのコピーだけでなく、自分の条件で採否を決めるための判断材料である。機能紹介・手順・概念解説も、その理解や判断に必要なら扱う。全記事を失敗談へ作り替えない。

#### 読者は肩書より、困っている状況で捉える

出発点となる読者仮説は「CodexやClaude Codeで実装は速く進むが、レビュー・確認・判断の負荷が残る人」。エンジニア・テックリード・EMは候補であり、その層へ実際に届いていることや効果は未確認。記事ごとに次を絞り、既存の `reader_problem` に書く。

- **状況**: 何を進めている人が、どの場面で止まるのか
- **前提**: 何を知っていて、どの権限・時間・環境の制約があるのか
- **欲しい判断**: 読む前に決められないことは何か

同じ題材でも、実装者が欲しい再現手順と、チームの運用を決める人が欲しい採否基準は違う。一記事で両方を網羅せず、主に答える読者の問いを一つ選ぶ。AI導入前の人や別の困りごとを持つ人を対象にする場合も、記事固有の理由と読者課題を優先する。

#### 固有名詞より先に、読む理由を示す

- タイトル・導入で、対象読者の困りごととこの記事で分かることを示す。独自OSSの名前を知らなくても読む理由が分かる状態にする。
- 固有名詞を禁止しない。検索意図に合う製品名、エラー名、設定名は残す。既存の「製品名＋問題語＋解決示唆」という入口設計とも両立させる。
- 自作ツールは検証に使った具体例として紹介し、採用を結論に固定しない。ツールを導入しない読者にも残る判断基準を示す。所有・開発への関与が判断に関わる場合は明らかにする。

編集上の比較例（実績や既存記事のタイトルではない）:

- 「○○の新機能紹介」だけで終えず、「AIレビューを入れたのに確認が減らない。どの段階を見直すか」のように問いを置く。
- 「Claude Codeの設定方法」は、対象の困りごとがあれば「Claude Codeがレビュー前に実装へ進むとき、どこで止めるか」のように具体化できる。ただし、本文で確かめていない原因・効果をタイトルで約束しない。

#### 一つの実例を、判断が変わるところまで掘る

中心主張を支える代表例を選び、**症状 → 原因候補 → 試した案・比較条件 → 修正 → 観測結果 → まだ分からないこと**のうち、実在し理解に必要な部分を残す。章見出しや全段階の充足を強制するテンプレートではない。具体的な組み立て方は [実体験から設計知へ変換する執筆原則](../articles_note/guides/experience-driven-writing-principles.md) を使う。

- 原因候補と確定原因を分ける。別の変更も同時に行ったなら、単独の対策の効果と断定しない。
- 採らなかった案・後で削った仕組みは、読者が選択を理解するのに必要なものを示す。
- 「実装した」「動作を確認した」「運用で使われた」「結果が改善した」は別の主張として根拠を確かめる。改善策を入れただけなら、効果は未検証のまま扱う。
- 一例の観測から、チーム全体・別環境・全モデルへ広げない。適用条件と未検証条件を、読者の採否に必要な範囲で明示する。
- 失敗・感情・数値を物語のために補わない。根拠不足なら追加検証や主張を狭める案を出す。主張の変更は後述「レビュー中の主張の扱い」に従う。

#### 読後の持ち帰りを一つに絞る

主目的は「理解できる」「判断できる」「試せる」のいずれかを中心に、一文で定める。たとえば「設定の有無と実際の実行を区別して確認できる」「自分の運用に停止条件が必要か判断できる」「直近の一タスクで確認漏れを一か所調べる」。すべての記事に明示的なCTAや操作を要求しない。

行動を勧めるなら、何を・どの条件で試し・何を見れば結果が分かるかを具体的にする。自作OSSの導入・複数リンクへの回遊・複数の改善を一度に求めず、本文だけでも持ち帰りが成立するようにする。関連リンクは既存の媒体間リンク規約に従う。

#### 既存の Article Plan とレビューへつなぐ

企画時は次を**同じSeedの既存Planへ**記録する。新しい台帳・frontmatter・必須フィールド・CI判定は増やさない。下表は記入の観点であり、Planの書式とPR作成条件は [article-lifecycle-contract.md](article-lifecycle-contract.md#4-article-planの記録pr作成ゲート) を正とする。

| 記録先 | 具体化する内容 |
| --- | --- |
| `reader_problem` | 読者の状況・前提と、答えが欲しい一つの問い |
| `central_claim` | 読後に残す中心主張。理解・判断・行動の主目的を説明できる一文 |
| `Evidence Boundary` | 観測者・条件・出所を含む `Observed`、確認事項と参照先を含む `Verified`、解釈・未検証事項としての `Hypothesis`。根拠リンクの掲載は別途判断する |
| `Outline` | 困りごとの入口、代表例で判断が変わった過程、適用限界、読後の持ち帰り。必要な部分を選ぶ |
| `out_of_scope` | 今回は答えない問い、効果未検証の部分、他記事へ分ける論点 |

記入例（架空の企画例。著者の実績・観測の代わりには使わない）:

```text
reader_problem: AIレビューを設定した実装者が、直近タスクで確認が実行されたか判断できない。
central_claim: 設定の存在と実行の証拠を分けると、次に確認すべき箇所を絞れる。
Outline: 困りごと → 一件の実行記録と設定の比較 → 言える範囲 → 自分の一件で照合する。
out_of_scope: 全モデルでの再発防止、チーム生産性の改善、自作ツールの導入手順。
```

この例に実在する `Observed` / `Verified` は与えていないため、そのままではPR作成条件を満たさない。記事化するときは掲載可能な一次情報で確かめる。著者入力だけで解消できる不足は既存の Author Input Gate に従い、検証待ちと区別する。

執筆・既存レビューではPlanと本文を照合し、次を確かめる。新しい採点表や別の合否判定は作らない。

1. **入口と価値**: タイトル・導入・結論が同じ読者の問いに答えているか。固有名詞を知らない人にも読む理由が分かるか。
2. **経験と根拠**: 何が起き、何を根拠に判断を変えたかを追えるか。観測・解釈・未検証を混ぜていないか。
3. **持ち帰りと削る判断**: 読者に残す理解・判断・行動が一つ見えるか。それに寄与しない機能説明や一般論を削れるか。

既存記事をこの方針へ一括改稿しない。次の新規企画や承認された改訂から使い、記事固有の著者意図と既存レビューを優先する。公開後は既存Metricsに加え、読者の質問・試行報告など、持ち帰りが届いたか分かる反応を確認できた範囲で記録する。PVや反応数だけで実践価値・読者属性・改善効果を断定せず、方針変更は既存の Learning Proposal / Human Gate に戻す。

### 検証と掲載を分ける（PR・コードへのリンク）

一次情報で確かめること（検証）と、その一次情報へのリンクを記事に載せること（掲載）は別の判断にする。リンクがないことは未検証を意味しない（2026-11-02 著者決定、Codex 相談済み）。

- **検証（必須）**: 主張ごとの根拠（PR・issue・ファイル・ログ）と確かめた内容は、記事ではなくレビュー記録（`reviews/` の「根拠一覧」や PR 本文）に残す
- **掲載（記事ごとに判断）**: 読者がたどることで理解・再現・検証ができる場合に載せる。本文の流れを止めるだけの PR 番号、背景なしでは読めない議論、第三者の情報を含むもの、後から内容が変わりやすいリンクは載せない
- リンクを載せても説明の責任はリンク先へ移らない。本文だけで主張が分かるように書く
- 媒体別の目安: note は物語に必要な1〜2か所だけにし、参照は末尾へ。Zenn は再現に役立つ実装・テストのファイルを末尾か節末にまとめ、PR 番号は「この変更で入った」と言う場合だけ。Qiita は手順の確認に必要なものだけ

### レビュー中の主張の扱い

レビュー開始時に、記事の「中心の問い・伝えたい主張・想定読者」を一文ずつ確認する。Article Planがある記事は、`Draft Article Plan`（仮のArticle Plan）も含め、その `central_claim` を主張の比較基準とする。レビューと修正の各回でこの三つと本文を照合し、指摘を積み重ねた結果、別の主張へ移っていないか確かめる。

- 通常のレビューでは、元の主張を保ったまま、根拠・構成・表現を直す。指摘は「誤り」「主張が伝わらない箇所」「任意の補足」を区別し、任意の補足を採用するために主張を変えない。
- 元の主張が一次情報で支えられない、または別の主張の方が読者に有益だと判断した場合は、主張の変更案として理由と新旧の主張を示す。通常のレビュー修正に紛れ込ませない。Plan Approval の扱いは `docs/article-lifecycle-contract.md` の「3. Human Gate」を正とする。著者の判断を得てからタイトル・導入・本文・結論を揃え直す。

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

**2026-11-06の解釈補正**: スナップショットの測定値は履歴として保ち、当時の「SEO流入」「タイトルが機能」「品質と非相関」などの読み取りは以下で限定し直す。11月現在の実測値へ更新したものではない。SNSの成果は別の投稿単位の記録で確認する。

### 2026-09 実測（最新）

| 媒体 | 取得日・取得元 | 主な値 |
| --- | --- | --- |
| **Zenn** | 2026-09-04 統計ダッシュボード + 記事の管理 | 表示回数（直近1か月）4,136 回 / 記事別合計表示回数 41,647 回（2022-01〜、39記事の掲載値の合算） |
| **note** | 2026-09-14 ダッシュボード（全35記事） | 全期間 imp 66,104 / PV 28,804 / スキ 677。過去28日 imp 1,705 / PV 776 / スキ 27 |
| Qiita | — | **2026-09 時点の実測なし**。主指標はストック数（下記「反応指標の媒体別運用方針」）で、方針は変えない |

#### Zenn（2026-09-04）

**上位3本で 25,933 回、記事別合計表示回数の 62%**。公開から数か月経過した記事に表示が集中している。ただし、この集計は流入元を分けておらず、SEO継続流入の証明ではない。

| 記事 | 表示回数 | ♡ | 公開日 |
| --- | --- | --- | --- |
| DESIGN.md 導入ガイド | 15,006 | 79 | 2026-04-06 |
| Obsidian と Supermemory MCP | 7,868 | 67 | 2025-08-30 |
| Claude Code → Codex App 移行 | 3,059 | 22 | 2026-05-04 |

上位記事の♡率が 0.5〜1.4% なのに対し、**少ない表示回数に対して♡率が高い記事が3本**ある。流入改善を試す候補だが、母数が小さく、読者の選ばれ方も異なる。内容の品質や改善不要をこの比率だけで確定しない。

| 記事 | ♡ | 表示回数 | ♡率 |
| --- | --- | --- | --- |
| `ai-merge-ready-state-machine` | 4 | 26 | 15.4% |
| `plangate-design-evolution-v3-to-v8` | 4 | 37 | 10.8% |
| `ai-review-gate-not-called` | 5 | 119 | 4.2% |

- `river-review-judgment-placement`（2026-08-31 公開）は公開4日で表示 2,056 回・♡22。直近1か月の表示 4,136 回の約半分を1本で占める
- 最長の `ai-driven-tdd-nextjs`（30,089字）は 386 回、15,006 回の DESIGN.md 導入ガイドは 11,615字。この2例は「長ければ読まれる」とは限らないことを示すが、文字数と表示回数の相関を評価した結果ではない

#### note（2026-09-14）

| 期間 | imp | PV | スキ | PV/imp |
| --- | --- | --- | --- | --- |
| 全期間 | 66,104 | 28,804 | 677 | 43.6% |
| 過去28日 | 1,705 | 776 | 27 | 45.5% |
| 過去7日 | 458 | 210 | 11 | 45.9% |

- **PV 資産は 2021-2022 のスクラム・採用系**（「プロダクト開発における…」5,702 /「プロジェクトマネージャー」4,689 /「webエンジニア採用」3,145 /「スクラムでの開発チーム」3,046 PV）。2026 年の AI 駆動開発シリーズは全期間でも PV 20〜500 台
- **露出を改善する余地があるという仮説**。28日で全記事合計 1,705 imp。PV/imp は45.5%だが、PVとimpが同一の露出・流入を数えると確認できていないためCTRではない。タイトルの有効性や本文の改善不要をこの比率だけで判断しない
- PV が imp を上回る記事群がある（28日: `n92b270e91110` imp 59 / PV 119、「プロンプトを磨け」imp 15 / PV 97）。媒体外からの流入も考えられるが、**この値だけでは検索・Xなどの流入元や構成比は特定できない**
- `n062a695d5af9`（SDD / Discovery と Delivery、2026-09-11 公開）が直近最良。3日で imp 190 / PV 86 / スキ 10、スキ/PV 11.6%。7日のスキ 11・28日のスキ 27 の大半をこの1本が稼ぐ

#### 2026-09 実測からの読み取り

- **Zenn**: 表示回数は少数の記事に集中している。上記の高♡率・低リーチ3本は、関連する上位記事からの文脈内リンクを試す候補。流入元・送客効果は別途確認する
- **note**: Zenn・Xからの送客と検索で見つけてもらう方法を試す候補とする。流入元別の効果は未検証。noteは現状サブ媒体として扱う（`## Profile strategy` の note profile direction と同じ判断）
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
| **Zenn** | いいね数／GA4 PV | エンゲ秒・PV/like 比率 | — | 平均 9.3 likes/記事。PV/likeは閲覧と反応の比率であり、流入元の分類には流入元別データが必要 |
| **Qiita** | **ストック数** | エンゲ秒・PV | **LGTM（いいね）を主要判断に使わない** | 保存価値の代理としてストックを優先する方針。品質との相関や実際の再訪・実用を直接証明する値ではない |
| **note** | スキ数（ログイン+匿名） | コメント | — | 平均 29.7 スキ/記事、匿名スキが24%（他媒体にないチャネル特性） |

2026-09 の補足: Zenn は統計ダッシュボードの表示回数と♡率（♡ / 表示回数）で、閲覧の集中と反応の比率を見た。note はimp・PV・スキを別々に記録する。PV/impは参考比率であり、CTRや入口の有効性を証明する指標にはしない。

### 集客タイプの書き分け（2026-05の比率から置いた仮説）

下表の比率は2026-05のGA4 PVとlikesによる観測で、タイプ名・流入経路の説明は編集上の仮説。比率だけでSEO主導・内部拡散を分類せず、流入元別データで確認する。2026-09の表示回数ベースの値には同じ目安を当てはめない。

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

- **note の役割追加**: 「2021〜2022 年公開の EM/PjM/Scrum 系記事が今も上位スキを蓄積」= long-tail evergreen 形成チャネル。新規 AI 系記事は短期反応より長期蓄積を期待する設計でよい。2026-09-14 実測でもPV資産は2021-2022のスクラム・採用系。外部・検索流入を伸ばす案は、流入元別の計測で確かめる仮説として扱う
- **Zenn の役割補強**: 検索意図に答える入口と、継続読者が深く読む記事の両方を候補にする。2026-09-04の上位3本への表示集中は、各記事の流入経路やこの2系統の成功を証明する値ではない
- **Qiita の役割補強**: 「検索入口」の実態は当面 Zenn が上位（2026-05 実測。2026-09 時点の Qiita 実測なし）。Qiita は **Tips の保存価値（ストック）**を主目的とする。タイトルは「製品名 + 問題語 + 解決示唆」の3要素を満たす

## Reader journey

**2026-11-06: 記事制作方針を、媒体の選択と流通までつなぐ。** 媒体の役割は上の「Channel roles」が正本。この節は、その役割を記事ごとの読者課題へ適用するための選び方である。

### 一つの問いに、まず一つの主媒体を選ぶ

| 読者が今知りたいこと | 主媒体の候補 | 他媒体へ派生させる条件 |
| --- | --- | --- |
| 症状を解消する最小手順・確認箇所 | Qiita | 設計や背景に別の問いが生まれ、短い手順だけでは答えられない |
| なぜその設計か、どう再現・実装するか | Zenn | 判断が変わった背景を読めるnote稿や、独立して役立つ短いQiita稿が必要 |
| なぜ困り、何を考え直し、どう運用を変えたか | note | 技術的な再現に別の説明が必要。会社由来なら名義・掲載可否を先に確認 |
| 継続して参照する体系ガイド・検証の更新 | Growth Lab | 単発記事とは異なる継続保守の価値があり、既存の正本・運用へ接続できる |
| このOSSが自分の課題に役立つか | izanami | 既存記事と異なる読者課題があり、現在の対象範囲に収まる。詳細は下の専用方針 |
| 実装・利用条件・現行仕様を確かめる | GitHub / アプリ | 記事の主張を確認するか、読者が試す必要がある。すべての記事に導入を求めない |

運用上は、過去の流入実績があるZennの技術記事・既存資産を優先候補にし、noteは背景と判断、Qiitaは一つの実務課題を担う。ただし2026-05の比較と2026-09の異なる指標から、現在の最適配分比率は出せない。固定の本数比率や全媒体への同時展開を約束しない。izanamiの対象範囲も拡大しない。

読者を「Qiita → Zenn → note → Growth Lab → GitHub」の全経路へ順に送ることは目的ではない。**その記事だけで問いへの答えを渡し、次の問いがあるときだけ適切な一か所へ案内する**。たとえば技術の再現が必要ならZenn、判断の背景ならnote、現行実装ならGitHubへ進める。検索でもSNSでも、この入口へ直接到達してよい。

- テーマごとに正本を選び、媒体別の `reader_problem` / `central_claim` / `Outline` を既存Article Planに残す。展開先を埋めるために記事を増やさない。
- 派生稿は独立した問いと持ち帰りを持たせる。同じ経験・証拠は使えても本文は転載しない。「Cross-posting rules」とAGENTS.mdのリンク位置・掲載境界に従う。
- 既存記事の関連リンク・固定記事は、読者の次の問いに合う場合だけ改訂候補にする。戦略の記録だけで公開済み本文やプロフィールを変更しない。

### 個人とOSSの認知を分けて考える（検討案）

**2026-11-06の追加論点。著者の確定方針ではなく、今後の企画・評価で検討する案。** 個人とOSSを完全に切り離すより、まず目的・読者・指標を分け、同じ実体験と実装根拠でつなぐ。アカウントの分割や新規ブランド作成をこの案だけで決めない。

| 観点 | 個人の認知・信頼 | 個別OSSの認知・利用検討 |
| --- | --- | --- |
| 目指す理解 | この人は何を経験し、何を根拠に判断するのか | この道具は自分の課題・環境に合い、何ができないのか |
| 読者の問い | 自分の開発でも使える考え方・確かめ方はあるか | 導入条件、最小の試し方、代替手段、制約は何か |
| 内容の中心 | 問題、検証、判断の変化。OSSを使わない読者にも持ち帰りがある | 解決する課題、再現できる例、現行仕様、導入・非導入の判断材料 |
| 観測候補 | 考え方への具体的な質問や継続的な反応、取得できる場合の再訪 | ドキュメント・リポジトリへの到達、確認できた試行報告、利用上の質問 |

いずれも指標の取得可否と意味を先に確かめる。フォロワー数は信頼、スター数は採用の証明ではなく、個人への反応を特定OSSの需要へ読み替えない。逆にOSSが使われても著者の判断軸が伝わったとは限らない。

個人の経験記事からは、主張を確かめる実装例として必要なOSSへつなぐ。OSSの案内からは、採否の判断に必要なら設計背景の記事へつなぐ。リンク位置は既存の掲載ルールに従い、双方への誘導を全記事・全投稿に義務づけない。記事や投稿の主目的は一つ選び、読者の理解が目的ならインストールを成功条件にしない。SNSの語り手・投稿先はこの目的の区別とは別に確認し、本人名義と紹介名義を混同しない。

## SNS distribution strategy

SNSは記事と並ぶ別の知識の正本ではなく、**困っている人が記事を見つけ、読む理由を理解する入口**とする。短文だけでも一つの観測・判断材料を渡し、詳しい根拠・限界・再現手順は記事で読めるようにする。投稿数・反応数を増やすために、記事より強い主張へ変えない。

### 現状から分かることと、分からないこと

以下は2026-11-06にリポジトリ上の記録を確認した結果であり、SNSの最新指標を新規取得したものではない。

- 既存の公開後運用は [publish-operating-policy.md](publish-operating-policy.md#公開後にやること全媒体共通) にある。my-blogは記事・告知素材、ai-marketing-osは配信仮説・実験・承認・結果を担当する。実験台帳・配信カレンダーをmy-blogに重複作成しない。
- Xの単発告知は [due-items.json](due-items.json) に観測予定が記録されている。ただし予定は投稿実績や成果の証拠ではない。実投稿時刻・投稿ID・既存の計測窓を配信側で照合してから評価する。非公開の承認記録や運用台帳は公開リポジトリへ転記しない。
- [note「読む→反応」実験の最終判定](experiments/2026-10-note-reading-loop.md) は2026-11-02に著者が打ち切りを決定した。実験行動は1週目だけで、**効果は検証できなかった**。効果なしの証明にも成功事例にもせず、週次計測・候補収集を再開しない。
- [izanamiの観測](../articles_izanami/README.md) には取得できない閲覧・採用指標や、公開直後を含まないGitHub trafficの期間制約がある。取得範囲で参照元が見えないことを、公開後の送客が一度もなかった証明にはしない。

### 配信候補をどう選ぶか

1. **共有する目的を決める**: 「シェアしたい記事」か「残しておく記事」かを既存手順で確認する。後者をSNSへ広めない。前者も、誰のどの困りごとに今答えるかを一文にする。
2. **まず既存X運用で一つの小さな試行を提案する**: 既存の引き渡し案と計測運用があるための候補であり、Xが最も有効と実証されたわけではない。全記事を個人Xへ流す運用にはしない。他SNSへ広げるのは、対象読者・運用できるアカウント・指標の取得可否が確認でき、別途実施が承認された場合にする。新規アカウント・広告・DM施策はこの方針に含めない。
3. **一投稿は一つの入口にする**: 困りごと、確認できた観測または対比、記事で判断できること、主リンクを選ぶ。独自OSS名だけの告知、根拠のない効果、本文にない失敗談、結論を隠すだけの煽りは使わない。投稿元が著者本人か紹介アカウントかを確認し、語り手を混同しない。
4. **再配信には新しい理由を持つ**: 追加検証、修正、別の読者課題などがある場合に限り候補にする。同文の機械的再投稿や複数SNSへの一括転載を標準にしない。計測中の窓と競合しないか確認し、投稿ごとに既存の承認手順を使う。

投稿日時・頻度・型の優劣は未検証。平日夜などを普遍的な最適解とせず、既存の配信枠・読者の時間帯・記事公開の実態に合わせた仮説にする。[lockfile記事の引き渡し案](share-drafts/2026-11-03-omikuji-lockfile.md) は素材・測定案の例として参照できるが、その未承認案・古い公開状態・仮の数値を全記事の規則や実行指示にしない。

### 試行と評価を小さく閉じる

新しいテンプレートや合否ゲートは増やさず、配信側の既存実験記録へ次を残す。戦略を記録することは、投稿・予約・アカウント操作・定期タスクの承認ではない。

- **実施前**: 一つの読者仮説、変える一要素、期待する観測、記事・投稿の確定版、正確な投稿先、取得できる指標、基準値、停止条件、評価時点を決める。承認範囲と公開URLの実在・内容を確認する。
- **実施後**: 予定ではなく実投稿のID・時刻 `t0` とタイムゾーンを記録し、既存の観測窓・他投稿を照合する。24h・72hなどの窓を採るなら実施前に選び、後から都合のよい時点へ変更しない。取り逃した値は実取得時刻の値として残し、過去時点の値を作らない。
- **指標**: 同じ投稿・同じ取得時点の表示回数とリンククリックが取得できる場合だけ、クリック数÷表示回数をリンクCTRとして扱う。分母0や欠測は算出不可。記事全体の閲覧・ストック増分は検索・回遊も含むため、X由来の純増や因果効果と呼ばない。UTM付きURLの作成だけで帰属計測済みとはしない。
- **価値の確認**: クリックは読了・実践・採用ではない。記事の問いに沿う質問や試行報告を確認できた範囲で記録し、反応がない場合も記事に価値がないと即断しない。
- **判定**: 事前の基準と取得できた範囲から、継続候補・一要素を調整・停止・判定保留を分ける。低露出・欠測・計測窓の混在は判定保留になりうる。単発の時系列比較をランダム化A/Bテストと呼ばない。

読み方の目安は、露出が少なければ配信枠・届く相手、露出はあるがクリックが少なければ問いの伝え方、クリック後の具体的な疑問が多ければ記事との期待差を**次の確認候補**にすること。因果の診断結果ではない。誤情報・リンク不達・承認版との不一致があれば配信を止めて報告し、自動で修正投稿しない。結果は既存のLearning Proposalへ返し、記事や方針を無断で書き換えない。

### 凍結・終了中の運用はそのまま保つ

週次公開スケジューラ・Rolling運用・月次の再計測は、[凍結範囲と解除条件](archive/README.md) および本書のRolling注記に従う。今回の媒体・SNS戦略の追加を解除と解釈しない。終了したnote交流実験も復活させない。承認済みの個別観測と凍結中の定期サイクルは区別し、新しい期限・投稿予約・監視をこのPRから自動作成しない。

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

最終更新: 2026-09-25（各媒体の文字数上限に合わせて短縮し、3 媒体のプロフィールへ反映。公開 API で保存内容を確認済み）。

- 文字数上限（2026-09-25 に各設定画面で確認）: **Zenn 160 字 / Qiita 200 字 / note 140 字**。下の文案は上限内に収めた、実際に保存した版
- 表記: OSS 名は現行の記事タイトルに合わせて **River Review** に統一する（2026-06-01 版コメントの「River Reviewer」は旧称）
- note 文案はダッシュを使わない（`AGENTS.md`「note 固有（JTFスタイル準拠）」）。Book 名は全角括弧で区切って表記する

### Zenn profile draft

```text
AIコーディングをチーム開発に乗せる運用設計を検証しています。
PlanGate / River Review / Agent Skills を中心に、Claude Code・Codex での実践ログを発信中。
📕 Book「PlanGate 実践ガイド」公開中
```

### Qiita profile draft

```text
AIコーディングエージェントをチーム開発で安全に使うための運用設計を検証しています。
PlanGate / River Review / Agent Skills / AI-readable repository などを書いています。

Zenn Book「PlanGate 実践ガイド」で、計画・実装・検証の型を体系化しました。
```

### note profile direction

Use note as the narrative hub.

- Explain the background and team-operation perspective.
- Link to the Zenn Book as the systematic guide, and to Zenn for technical details.
- Link to Qiita for short practical articles.
- Link to Growth Lab for canonical guides.
- Link to GitHub for OSS repositories.
- 2026-09-14の実測を起点に、他媒体から来た読者をBook・Zennへ案内する方法を試す。ただし流入元とボトルネックは未確定。プロフィールでも、その読者の次の問いに必要な導線を選ぶ

### note profile draft

```text
AIコーディングをチーム開発に乗せる運用設計を書いています。PlanGate / River Review / Agent Skills が中心。
体系ガイド（Zenn Book）: https://zenn.dev/minewo/books/plangate-guide
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

- [x] Zenn プロフィールを「Zenn profile draft」で更新する（2026-09-25。GitHub・サイト欄は専用フィールドに設定済み）
- [x] Qiita プロフィールを「Qiita profile draft」で更新する（2026-09-25）
- [x] note プロフィールを「note profile draft」で更新する（2026-09-25）。note の設定画面には SNS 用の欄（Facebook・Instagram 等）しかなく、Zenn / Qiita / Growth Lab / GitHub のリンク欄はないため、Book の URL を本文に入れた
- [x] Qiita の Pickup Articles を設定する（2026-09-25。上限 3 件）: 「River Review を作った」「AIコーディング前に確認する5項目」「Agent Skills に変える River Review 体験」
- [x] note の固定記事を PlanGate 入口（n02992266d622）に設定する（2026-09-25）。プロフィール → 固定記事 → Zenn Book の導線にそろえる
- [x] 各プロフィールページで表示を確認する（2026-09-25。Qiita のピックアップ・note の固定記事と自己紹介を画面で確認、自己紹介は3媒体とも公開 API で確認）

## Existing article update priorities

以下は改訂候補であり、記事ごとの読者課題と持ち帰りを優先する。過去の候補を一律のCTA義務や公開操作の承認と扱わない。

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

Use this as an optional shape for new and updated articles. Follow the editorial principles above; do not invent a failure or require a promotional CTA to fill the outline.

1. Problem statement.
2. Concrete observation, including a failure pattern when one was observed.
3. Proposed workflow or design.
4. Minimal example or checklist.
5. Where this fits in the broader system.
6. Related links by channel.
7. One reader takeaway; link to GitHub or Growth Lab when it supports that takeaway.

## Standard cross-link block

Use only the relevant links from a short block like this near the end of related articles; the list is not a requirement to send readers through every channel.

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
- 下記「30-day execution plan」は過去の記入例として残す。未完了の項目を現在の実行承認や凍結解除とみなさず、再利用時に最新状態と著者の判断を確認する

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

The following are signals to interpret, not proof of reader value or business outcomes. This historical plan does not restart the frozen recurring measurement cycle.

| Signal | Meaning |
| --- | --- |
| Views | 観測された閲覧。タイトル・配信などの原因を値だけで特定しない |
| Likes / reactions | 反応の代理指標。読了・満足・実践の証明ではない |
| Comments | 質問・感想の内容を読む。件数だけで共感の深さを断定しない |
| GitHub stars | 関心の代理指標。採用や記事からの転換とは限らない |
| Issues | 内容から利用状況や困りごとを確認。すべてを採用実績と数えない |
| Search queries | Future Qiita and Zenn article ideas |

## Immediate next actions

以下は以前の実行候補と完了記録。今回の戦略追記で再実行せず、現在の公開状態・計測記録・著者判断を確認してから必要な候補だけ取り上げる。

1. Update profile text across Zenn, Qiita, and note using the canonical copy above.
2. Set current AI-development articles as visible entry points.
3. Add cross-links to PlanGate, River Review, Agent Skills, and AI-readable repository articles.
4. Confirm note fixed entry article choice for the current growth goal.
5. ~~Publish two Qiita search-entry articles.~~ 完了（2本とも公開済み。上記「Week 2」参照）
6. Publish one note hub article.（構成案は `article_seeds/note-hub-plangate-river-skills/`。【著者確認】の空欄を埋めてから本文化）
7. ~~izanami: 指摘が多すぎるときの絞り方の構成案 PR #698 を確定して本文化する~~ 完了（River Review の3本を公開済み: 2026-09-24 / 09-28 / 09-29）。観測は各記事の公開後約30日（2026-10-24 / 10-28 / 10-29 頃）に行う

## Editorial guardrails

- Do not duplicate the same body across platforms.
- Do not make every article long.
- Do not send every reader directly to GitHub.
- Use contextual links where AGENTS.md permits them; keep cross-platform references at the end except for the canonical-source disclosure required by Cross-posting rules.
- Prefer concrete pain, concrete workflow, and concrete next action.
- Keep the shared category consistent: AIコーディングをチーム開発に乗せる運用設計.
