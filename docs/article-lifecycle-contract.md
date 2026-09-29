# Article Lifecycle Contract

`article_seeds/` から記事へ昇格し、公開後の結果を次の学習へ戻すまでの境界を定義する。

このドキュメントは **状態遷移・Seed provenance・Article Plan の記録と PR 作成ゲート・Article Graph の契約**だけを扱う。媒体役割は `docs/content-channel-strategy.md`、公開操作の境界は `docs/publish-operating-policy.md`、note の公開前判定は既存 `note-finalize` を正とし、ここで二重定義しない。

## 1. 目的

閉ループを次の形で追跡可能にする。

```text
Signal / Experience
        ↓
      Seed
        ↓
   Article Plan
        ↓
      Draft
        ↓
 Existing Review
        ↓
 note-finalize etc.
        ↓
    Human Gate
        ↓
     Publish
        ↓
     Metrics
        ↓
    Learning
        ↓
   Next Signal
```

新しい Orchestrator / Writer / Final Gate は作らない。既存の Skills / Workflows / publish policy をつなぐための薄い契約と派生ビューだけを追加する。

## 2. Lifecycle state

全記事を単一の状態機械へ強制移行しない。以下はライフサイクル上の概念状態であり、既存ファイルの `status` 値を一括置換するためのものではない。

| State | 意味 | 主な成果物 |
| --- | --- | --- |
| `CAPTURED` | Signal / Experience を保存した | Seed候補 |
| `TRIAGED` | 記事化する価値・根拠を確認した | 判断メモ |
| `PROMOTED` | Article Seed として採用した | `article_seeds/**/*.md` |
| `PLANNED` | 読者課題・中心主張・媒体を仮決めした | 元Seedの媒体/slug別 `Draft Article Plan`（仮のArticle Plan）。Plan Approval後は `Approved Article Plan` が承認記録 |
| `DRAFTED` | Article Planを入力として記事本文がある | note / Zenn / Qiita / izanami 原稿 |
| `REVIEWED` | 既存レビューを通した | review artifact |
| `READY` | 既存 Final Gate が公開準備完了と判定した | READY verdict |
| `APPROVED` | 著者が公開を承認した | Human Gate |
| `PUBLISHED` | 外部媒体で公開済み | URL |
| `MEASURED` | 公開後の実測を取得した | channel metrics |
| `LEARNED` | 結果から再利用可能な学びを採否した | Learning / next Seed |

`note-finalize` の `READY / NEEDS_CHANGES / UNVERIFIED` は維持する。`REVIEWED → READY` の判定を本契約で置き換えない。

## 3. Human Gate

**Plan Approval（Human）** は局所ゲートであり、Lifecycle stateではない。独立した必須工程でもない。中心主張や書かない範囲の変更を採用する前に著者の判断を得る（この判断を Plan Approval としてよい）。承認されたPlanは見出しを `## Approved Article Plan: <channel>/<slug>` に変更する。Planの記録とPR作成時の確認は「4. Article Planの記録・PR作成ゲート」を正とする。Lifecycleの `APPROVED` は公開承認だけを意味する。

次は自律実行してよい。

- Signal / Seed の収集
- provenance の検証
- Article Graph の再生成
- 既存ファイルからの分析
- 次テーマ・改善案の提案

次は既存ポリシーどおり Human Gate を越えない。

- 公開
- merge
- 外部サービスへの不可逆な変更
- `UNVERIFIED` を事実として扱う変更

自動公開は本契約の対象外。

## 4. Article Planの記録・PR作成ゲート

### 適用範囲

本ゲートの導入日（本ゲートを追加したPRのマージ日）以降に新しく追加された原稿を「新規記事」とする。原稿の最初の追加 commit の日付（`git log --diff-filter=A --format=%cs -- <path> | tail -1`）が本ゲート導入日以降、または未追跡なら新規記事とする。導入日は `git log -S "Article Planの記録・PR作成ゲート" --format=%cs origin/main -- docs/article-lifecycle-contract.md | tail -1` で確認する。それ以前からある原稿（`articles_note/new/` の既存原稿を含む）と既存記事の改訂には遡及しない。各コマンド・エージェントはこの定義を参照し、個別に再定義しない。

### Planの記録

新規記事は初稿の生成前に、対象記事に対応するSeedの本文へ `## Draft Article Plan: <channel>/<slug>` を記録する。ブランチ作成の前提にはしない。別の台帳は作らない。1つのSeedから複数記事へ派生する場合は `Draft Article Plan` を上書きせず追加する。初稿やレビューで得た情報は同じ `Draft Article Plan` に反映する。

### PR作成ゲート

記事またはレビュー成果物のPRを作る直前に、`Draft Article Plan`（承認済みなら `Approved Article Plan`）で次の記録を確認する。記事本文やレビュー成果物を、この記録の代わりにしない。

- **Why**: 誰の、どの問題に答える記事か（`reader_problem`）
- **What**: 読後に残したい中心主張を一文で（`central_claim`）
- **一次情報**: 主張を支える観測・確認事項と、その出所（`Evidence Boundary` の `Observed` / `Verified`）。実体験は誰が何を観測したか、外部事実は再確認できる参照先を残す。解釈・仮説は分ける
- **書かない範囲**: 今回の主張に含めない論点（`out_of_scope`）

初稿前は仮の内容や「未確認」を明記してよい。PR作成時には四つの記録が揃い、中心主張を支える観測・確認事項の出所が特定できていることを確認する。確認予定や仮説だけでは一次情報の項目を満たさない。PlanはPRの差分またはベースブランチから読める状態にする。レビュー反映（`/apply-review` 系）のPRで、Planが未マージのレビューPRにしかない場合は、そのレビューPRを先にマージする。不足があればPR作成を止め、追加調査または主張の縮小を行う。レビューではこのPlanを基準に主張のずれを確認する。主張や書かない範囲を変える場合は、採用前に著者の判断（Plan Approval）を得て、変更理由を同じPlanに残す。レビュー反映（`/apply-review` 系）ではPlanを編集せず、該当する指摘を保留して著者へ報告する。Planの更新は著者の判断後に別コミットで行う。

記事・レビュー成果物のPR本文には `Plan: <SEED_PATH> (<channel>/<slug>)` の1行を書く。対象外なら `Plan: 対象外（ゲート導入前の原稿／改訂） (<channel>/<slug>)` と書く。

### Planが見つからない場合

対象の `<channel>/<slug>` に対応するPlanが `article_seeds/` に無い場合は、次の書式で報告し、PR作成へ進まない。

```text
Plan未検出: <channel>/<slug>（検索コマンドと結果）
```

## 5. Seed provenance contract

2026-09-23 以降に新規作成・明示移行する Seed は、既存 frontmatter に加えて以下を持つ。

Article Graph が読む metadata は **top-level scalar と list のみ**に限定する。Graph builder は汎用 YAML parser ではない。複雑な根拠・構造化データは frontmatter へ入れず本文に残す。

```yaml
seed_id: seed-YYYYMMDD-short-slug
source: experience
source_url:
source_ref:
evidence_status: observed
promoted_to:
article_type_candidates:
  - experience
```

### `seed_id`

- Seed の安定ID。
- `seed-YYYYMMDD-short-slug` 形式。
- ファイル名変更後も ID は変更しない。
- repository 内で一意。

### `source`

Signal の性質。

- `experience`: 自分の実体験・観測
- `external`: 外部記事・投稿・仕様など
- `mixed`: 実体験と外部情報の組み合わせ

値は将来追加できるが、意味を変えて既存値を再利用しない。

### `source_url` / `source_ref`

provenance の入口。

- `source_url`: Web 上の出典。HTTP(S) URL。
- `source_ref`: repository path、commit SHA、Issue/PR など再確認できる参照。
- `external` / `mixed` は少なくともどちらか一方を必須とする。
- `experience` は空でもよい。裏付けとなるログやPRがある場合は `source_ref` に残す。

複数の根拠が必要な場合は本文の「観測事実」「既存知識との接続」へ記録し、frontmatter を証拠DBにしない。

### `evidence_status`

- `observed`: 自分の観測・実体験として記録した。一般化は未検証。
- `verified`: 記事で使う主要な外部事実を一次情報等で確認した。
- `unverified`: 出典へ到達できない、または確認が不足している。

`unverified` を推測で `verified` に変えない。外部事実を含む場合は既存 Domain / Fact review を引き続き使う。

### `promoted_to`

Seed から生まれた公開物・記事ファイルへのリンクを保持する。

例:

```yaml
promoted_to:
  - articles/example.md
  - https://note.com/example/n/xxxx
```

Article Graph はこの値から `promoted_to` edge を作る。

### `article_type_candidates`

記事化するときに検討したい角度を任意で残す。

例: `experience` / `tutorial` / `analysis` / `insight` / `evidence`。

これは候補であり、媒体・記事タイプの最終決定ではない。Graph 上の空きを埋める目的で自動採用しない。

## 6. Legacy compatibility

既存 Seed は一括書き換えしない。

`seed_id` がない既存 Seed は `legacy:<relative-path-without-extension>` を派生IDとして読み込む。これは移行中の互換IDであり、ファイル移動に対して安定ではない。

既存 Seed に手を入れる機会があり、追跡価値がある場合だけ明示的な `seed_id` / provenance metadata へ移行する。移行だけを目的に大量変更しない。

## 7. Article Graph

`docs/article-graph.json` と `docs/article-graph.md` は **read-only derived view**。

Source of Truth は次。

1. `article_seeds/**/*.md`
2. 本契約
3. 各媒体の既存記事・公開台帳

Graph へ手修正しない。

```bash
npm run build:article-graph
npm run check:article-graph
npm run test:article-graph
```

v1 の Graph が扱うのは意図的に狭い。

- Seed node
- provenance metadata
- article type candidates
- `promoted_to` edge
- legacy migration warning

Graph DB、Embedding DB、記事自動生成、記事ランキングは導入しない。

## 8. Article Graph を記事化判断に使うときの制約

「Graph 上で空いている」という理由だけで記事を作らない。

新しい記事候補には少なくとも次のいずれかが必要。

- 一次体験
- 検証可能な Evidence
- 明確な Reader Problem

Article Graph は候補発見の補助であり、記事本数を最大化する装置ではない。

## 9. Metrics / Learning への接続

Metrics取得そのものは既存の `scripts/fetch-channel-metrics.mjs`、`docs/channel-metrics/`、`docs/content-channel-strategy.md` を再利用する。

### Seed ID と公開記事の接続

追加の対応台帳は作らない。Seed の `promoted_to` を正本とし、`docs/article-graph.json` の `promoted_to` edge と各媒体APIの公開URLを join する。

`fetch-channel-metrics.mjs` は公開記事ごとに次を追加する。

```json
{
  "seed_ids": ["seed-YYYYMMDD-example"]
}
```

URL比較では query / hash / 末尾スラッシュを正規化する。Zenn は username + slug から公開URLを組み立て、Qiita / note はAPIが返すURLを使う。

Metricsへ出す `seed_ids` は明示的な `seed_id` を持つ non-legacy Seed のみ。`legacy:*` はファイルパス由来で移動に弱いため、永続的なMetricsキーとして使わない。

```text
Seed ID
  ↓
promoted_to
  ↓
Published URL
  ↓
Channel Metrics + seed_ids
  ↓
Metrics Snapshot
  ↓
Learning Proposal
  ↓
Human Accept / Reject
  ↓
Next Seed or Strategy Update
```

`seed_ids` が空でもMetrics取得自体は失敗ではない。まだSeedへ紐付いていない既存記事を表す。

### Learning

Learning Proposalの自動生成・Skill / Strategy自動更新はまだ行わない。

1記事の数字だけで Skill / Strategy を自動更新しない。Learning は Proposal として扱い、複数観測または明確な反証を根拠にし、Human Gate を通す。

#### Editorial Learning Proposal

公開後Metricsとは別に、レビューや編集で得た修正知見は **Editorial Learning Proposal** として扱ってよい。これはLifecycle stateを追加しない補助経路であり、公開前にProposalを作っても `LEARNED` へ遷移したことにはしない。`LEARNED` は既存契約どおり、公開後の結果を含む学びを採否した状態として扱う。

```text
Review Finding
  ↓
Accept / Hold / Reject + reason
  ↓
Editorial Learning Proposal
  ↓
AGENT_LEARNINGS.md の更新条件を満たすか確認
  ↓
Editorial Learning Approval (Human)
  ↓
必要なら canonical guide / Skill / deterministic check へ昇格
```

- 採否と理由の記録は既存 Review / Applier の成果物を再利用し、専用DBを増やさない
- `AGENT_LEARNINGS.md` の更新条件を正とし、単発の好みや一度きりの文面修正を恒久ルール化しない
- 同じ指摘の再発、再現できる成功パターン、著者からの明示的な継続指示などをProposal候補として扱う
- Proposalは「どの規則へ昇格するか」を示すだけで、Skill / Guide / CIを自動更新しない
- Editorial Learning Approvalは公開承認のLifecycle state `APPROVED` とは別の局所判断であり、状態遷移を発生させない
- 安定した機械判定が可能なものだけ deterministic check 候補にする。意味判断を要するものは Skill / Guide に残す
- 却下されたレビュー指摘も、同型の誤提案が繰り返される場合は「禁止・境界ルール」のProposal候補になりうる
