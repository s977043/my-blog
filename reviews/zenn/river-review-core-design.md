# articles/river-review-core-design.md の記事レビュー

> Zennカテゴリー: Tech
> 構成タイプ: 設計 / アーキテクチャ
> Review date: 2026-10-02
> 照合した River Review: `s977043/river-review` main `95b38f5`（2026-09-30）

## レビュー方針

River Reviewを初めて知る読者に、機能一覧ではなく「判断の流れに沿った責務の分け方」が伝わるかを重点に確認した。比較基準はDraft Article Planの `central_claim`（River ReviewのコアはチームのReview JudgmentをArtifact・Evidence・Verification・Memory・Human Judgmentへ分離し、再現可能な「判断のインフラ」として保持すること）。PR #731で直した3点（ranking・Review Coverage・Organizerの事実照合、既存記事との重複の圧縮、英語名詞の密度）は再照合し、同じ指摘は繰り返していない。著者方針（Plugin主軸でCLIは書かない、正確さより概要の分かりやすさ、同一Zenn内リンクは双方向）も観点に含めた。

## Article Plan

- Plan: `article_seeds/ai-driven-development/2026-09-29-river-review-core-design.md`（`## Draft Article Plan: zenn/river-review-core-design`、`approved_at` は空）
- Why（`reader_problem`）/ What（`central_claim`）/ 一次情報（`Evidence Boundary` の Observed・Verified）/ 書かない範囲（`out_of_scope`）の4項目は揃っている
- Planの記述で、現行実装と食い違う点が2つある。どちらも本文は正しく書けているので、記事の公開ブロッカーではない。Planの更新は著者の判断で別コミットにする
  - Verified「rankingは pathProximity / symbolUsage / siblingTest / commitRecency を持つ」: 設定で重みを指定できるのは4つだが、パイプライン（`src/lib/repo-context.mjs`）が計算するのは `pathProximity` だけ
  - Verified「Organizerを… deterministic projectionとして保つ設計を採用している」: ADR-012のStatusは `Proposed for Phase 0 of #2368`
- 指摘1を採用してタイトルや中心主張の言い回しを変える場合は、`central_claim` の変更になるため、採用前に著者の判断（Plan Approval）が要る

## チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| Webディレクター | 要改善 | 責務境界で整理する構成は中心主張に合っている。ただ、タイトルの「判断のインフラ」がRiver Review自身の語彙方針と食い違う（指摘1）。TL;DRに中心主張のMemoryとHuman Judgmentが入っていない（指摘2） |
| Web編集者 | 要改善 | 見出しだけで論理を追える。気になるのは、1行だけの段落と単語だけのコードブロックが多く、結びでTL;DRの内容をもう一度繰り返している点（指摘7） |
| Webエンジニア | 要改善 | 実装済みと設計段階の書き分けは本文ではできている。ただ、全体図が未実装のOrganizerを「現在の構造」に含めている（指摘3）。River Reviewをどう使うのか（Plugin）が一言もない（指摘4） |
| 技術的事実検証 | OK | Context Budgetの各値・ranking・観点別のレビュー役割・Verifierが決定論的であること・Review Coverage・ループの収束判定・Riverbedの種別・Decision Surfaceが表示専用であること・callerの責務を現行ファイルで確認した。食い違いはVerifierの「スキーマ」1語だけ（指摘6） |

### 事実照合の記録

| 本文 | 照合先 | 結果 |
| --- | --- | --- |
| L156-162 tiny 1,024 / medium 4,000 / large 16,000 | `src/lib/context-presets.mjs` | 一致 |
| L164 明示的なbudgetが優先 | 同上 `resolveContextBudget`、`pages/reference/config-schema.md` | 一致 |
| L166-168 rankingは既定で無効で、計算する信号は `pathProximity` のみ | `src/lib/repo-context.mjs`（`ranking.enabled === true` のときだけ、`signals: { pathProximity }`） | 一致 |
| L202-206 bug-hunter等の役割を1つのorchestratorが並列実行してmergeする | `src/lib/reviewer-orchestrator.mjs`（`REVIEWER_ROLES` に6役割、`Promise.allSettled`） | 一致 |
| L229 Verifierは別のLLMではなく決定論的 | `src/lib/verifier.mjs` 冒頭「Rule-based checks only (no LLM calls)」 | 一致（「スキーマ」は指摘6） |
| L259-271 complete / partial / not_executed、Experimental、既定ではGateを変えない、収束判定 | `docs/development/review-coverage-contract.md`、`pages/reference/loop-convergence-contract.md` | 一致 |
| L292-301 Riverbedの8種別 | `pages/reference/riverbed-storage.md` | 一致 |
| L338, L394 表示専用のDecision Surfaceは実装済み、Organizerは未実装 | `src/cli/render.mjs` `buildHumanDecisionSurface`（#2370、「projection, not a judge」）、ADR-012 | 一致 |
| L365-376 L1 / L2 / L3、L358-361 Visibility / Attention | ADR-012 D2・D4 | 一致 |
| L486 反復・停止・エスカレーションはcallerの責務 | `pages/reference/loop-convergence-contract.md` 冒頭 | 一致 |
| L174-176 SkillのProgressive Disclosure | `pages/explanation/river-architecture.md` L11 | 一致 |
| L51-59 TOKIUM記事（111セッション・8,096リクエスト、70%は運用上の目安、subagentへの隔離、巨大なセッションをresumeしない） | WebFetch（2026-10-02） | 一致 |
| L613-620 GitHub上の参考リンク7件 | `gh api repos/s977043/river-review/contents/<path>` | すべて実在 |

## 指摘コメント

### high: 「判断のインフラ」がRiver Review自身の語彙方針と食い違う

**該当箇所**: L2, L587-591, L609

> title: "River Reviewのコア設計：AIレビューではなく「判断のインフラ」を作る"
>
> River Reviewのコアは、そのためのReview Judgment Layerです。

**問題**
River Reviewの `pages/explanation/concept.md` は、説明に使う語彙を4層に分けている。そのうえで、「Engineering Judgment Infrastructure は将来の到達点を示す語であり、現在の River Review が提供している機能の説明としては使いません」と明記している。現在の呼び方は「Review Judgment Platform / Team-owned Audit Layer」、中核思想は「Review Judgment as Code」。

本記事はタイトルと結びで、現在のコアを「判断のインフラ」と呼んでいる。OSSの公式説明と著者の記事で看板が食い違うと、記事から公式ドキュメントへ移った読者が「現在の機能」と「将来の方向」を取り違える。結びの「Review Judgment Layer」も、concept.mdの語彙にはない語。

**提案**
「判断のインフラ」は目指す方向として残し、現在のコアとは書き分ける。最小修正の例:

- タイトル: 「River Reviewのコア設計：AIレビューから『判断のインフラ』へ」のように、方向を示す形にする
- L589-591の直後に1文足す: 「River Reviewのドキュメントでは、これを長期の方向（Engineering Judgment Infrastructure）と位置づけ、現在の中核はReview Judgment as Codeとしています」
- L609: 「Review Judgment Layer」を、concept.mdの語（Review Judgment as Code）か本文で定義した語にそろえる

`central_claim` も同じ言い回しなので、変えるなら著者の判断（Plan Approval）が先に要る。

### medium: TL;DRに中心主張のMemoryとHuman Judgmentが入っていない

**該当箇所**: L36-41

> 1. **Judgmentをモデルに閉じ込めない** …
> 4. **実行の制御を抱え込まない** …

**問題**
`central_claim` は「Artifact・Evidence・Verification・Memory・Human Judgmentへ分離」と言っている。一方、TL;DRの4点にはMemory（§5）とHuman Judgment（§6）が無い。本文の7節のうち、§3（Contextの選び方）・§5・§6の3節にTL;DRから入れない。TL;DRだけ読んだ読者には、「判断のインフラ」の全体像が伝わりきらない。

**提案**
4点を5〜6点に広げるか、2点目と3点目の後に1点ずつ足す。例:

- 「**会話の全文ではなく判断を記憶する**。Riverbed Memoryに、次の判断を変える情報（決定・受け入れたリスク・抑制）だけを残す」
- 「**人にはすべてを見せたうえで、判断が要る面に注意を集める**。Findingを隠さず、表示で注意を絞る」

### medium: 全体図が未実装のOrganizerを「現在の構造」に含めている

**該当箇所**: L494-535（とくにL518-521）

> 現在の構造をかなり圧縮すると、次のようになります。
> │ Organizer / Projection │

**問題**
§6のL394では「Organizerの組み込みは設計上の後続段階で、現時点ではまだ実装していません」と書いている。ところが全体図は「現在の構造」と前置きしたうえで、Organizerを独立した箱として置いている。PR #731で本文は直したが、図には直しが及んでいない。図だけ見た読者は、実装済みだと受け取る。

**提案**
箱の1行目を「Decision Surface（表示専用）」にし、Organizerは「（設計段階）」と注記する。前置きを「現在の構造と、設計中の部分を含めて圧縮すると」に変えてもよい。

### medium: River Reviewをどう使うのかが一言もない

**該当箇所**: L20, L28-32

> 筆者が開発しているOSS [River Review](https://github.com/s977043/river-review) では、…
>
> River Reviewの導入手順ではなく、なぜ現在の構造になっているのかを扱います。

**問題**
初めて知る読者には、River Reviewがどこで動くもの（エージェントのプラグインか、CIか、SaaSか）なのかが本文から分からない。導入手順を書かない方針は妥当だが、利用形態まで伏せると、Agent Hostとの境界を論じる§7の前提（River Reviewは呼び出される側）も伝わりにくい。README上の配布経路は、Claude Code / Codexのプラグインと、GitHub Actionsの2つ。著者方針はPlugin主軸で、CLIは書かない。

**提案**
`:::message` の2段落目に1文足す。例:「River Reviewは、Claude Code / Codexのプラグインと、GitHub Actionsから使うレビューOSSです」。コマンドやインストール手順は書かない。

### low: 「きっかけ」節が長く、River Reviewの本題に入るのが遅い

**該当箇所**: L43-79

**問題**
タイトルとTL;DRで「River Reviewのコア設計」を示したのに、最初のH2は他社記事のトークン消費の話が約30行続く。TL;DR直後のL43-47でも同じ話題を予告しているので、2回入っていることになる。Planの構成どおりで、§7への伏線として機能してはいる。ただ、River Reviewで検索して来た読者には遠回りに見える。

**提案**
L43-47の予告を削り、「きっかけ」節では3つの対策の箇条書きを「特に気になった2つ目」だけに絞る。

### low: Verifierの検証項目に「スキーマ」が入っている

**該当箇所**: L229

> Evidenceやスコープ、スキーマのように機械で確かめられる条件を検証しています。

**問題**
`src/lib/verifier.mjs` の `verifyFinding` が確かめているのは次の5つで、スキーマの検証は含まれない。

- Evidenceがあるか
- Evidenceの参照先がdiffにあるか
- フェーズと整合しているか
- 重大度に根拠があるか
- 修正案が具体的か

ほかにスコープの判定もある。今回の確認範囲では、スキーマ検証がVerifierの役割にあることを確認できなかった。

**提案**
「Evidenceがdiffに実在するか、重大度に根拠があるか、修正案があるかのように、機械で確かめられる条件」に置き換える。

### low: 1行段落・単語だけのコードブロックが多く、結びが3回目の要約になっている

**該当箇所**: L245-257, L317-326, L356-361, L550-609

**問題**
次のような文中の語句を、`text` のコードブロックに分けている。

- `security issue = none`
- `Transcript Memory`
- `Visibility = complete`

1文ずつの段落も続く。スマートフォンでは縦に長くなり、本文が細切れに見える。結びの「AI開発で重要なのは『賢いAgent』だけではない」は、TL;DRと全体図に続く3回目のまとめにあたる。中身も、未公開の `ai-agent-team-topology-judgment-escalation`（判断をどこに置くか）の主張と重なる。

**提案**
- 短い対比はインラインコードで本文に入れる。例: 「`findings: []` は `security issue = none` ではなく、`security review = not completed` かもしれない」
- 結びは、L587-609の「AIレビューから判断のインフラへ」の経緯と、チームが所有したい5項目に絞る。L552-585は削るか、topology記事の公開後にそちらへのリンクで済ませる

### low: emojiが未公開のtopology記事と同じ

**該当箇所**: L3

**問題**
`emoji: "🧭"` は `articles/ai-agent-team-topology-judgment-escalation.md` と同じ。どちらも「判断」を主題にしたAIエージェントの記事なので、Zennの一覧で並ぶと見分けにくい。

**提案**
どちらかを変える。インフラなら「🏗️」など。

## 総合評価

### 良い点

- 機能一覧ではなく、判断・Evidence・文脈の選び方・検証・記憶・人の判断・Hostとの境界という責務の流れで整理できており、`central_claim` に沿っている
- 実装済みと設計段階の書き分けが本文では丁寧。rankingの信号、Review CoverageがExperimentalであること、Decision SurfaceとOrganizerの別は、現行実装と一致した
- 「Findingが0件」と「レビューできた」を分ける例、TranscriptとJudgmentの区別は、River Reviewを使わない読者にも持ち帰れる
- Context SelectionとContext Lifecycleを分け、後者をAgent Hostへ返す境界が、§7の図で明確に示されている
- CLIのコマンドを書いておらず、著者方針に沿っている

### 残る改善点

- 「判断のインフラ」を現在のコアと呼ぶか、目指す方向と呼ぶか（指摘1。Plan Approvalが要る）
- TL;DR・全体図と本文の対応（指摘2・3）
- Plugin主軸の一言（指摘4）
- 未検証: Zennプレビューでの罫線図（L496-535）のモバイル表示は確認していない。本文にコマンドやコードの手順は無いため、実行検証は対象外

### 推奨アクション

1. 指摘1は、著者が「現在」と「方向」のどちらで呼ぶかを決めてから反映する。Planの `central_claim` を変える場合は別コミットで更新する。Planの記述の食い違い（rankingの4信号、ADR-012の「採用」）も同じタイミングで直す
2. 指摘2〜4を反映し、記事は `published: false` のままマージ候補にする
3. リンクの張り返し（同一Zenn内で `/articles/<slug>` 形式、双方向）
   - 本記事の公開時: 公開済みの `river-review-judgment-placement` の `## 関連記事` に本記事へのリンクを足す。公開済み記事の更新なので、本記事の新規公開とは別のPRにし、著者の承認を得て `release/zenn` へ流す。Seedの「次に試すこと」の未完了項目と同じもの
   - `plangate-fresh-context-restart` が後から公開される場合: その公開時に、本記事L450（いつセッションを切るかは範囲外）から同記事へリンクし、同記事のPlanGate Context Lifecycleの節から本記事へ張り返す
   - `ai-agent-team-topology-judgment-escalation` が後から公開される場合: その公開時に、同記事の「River Reviewを作ってきて、ここにつながった」節から本記事へリンクし、本記事の結び（指摘7で絞ったあと）から同記事へ張り返す
   - 先に公開される側の記事には、未公開の記事へのリンクを置かない（`release/zenn` 同期で404になるため）。後から公開する側の記事が、公開時に双方向のリンクを入れる
4. 公開前に、Zennの下書きデプロイ（`release/zenn` 宛てのPR）で罫線図とテーブルの表示を確認する

### SEO / 回遊

- タイトルには「River Review」「AIレビュー」が入っている。検索で見つけてもらうことより、指摘1の語彙を合わせるほうを優先する
- River Review系の公開済みZenn記事（`river-review-judgment-placement` ほか）とは、上記の張り返しで回遊を作る。他媒体への導線は、追加するとしても末尾の `## 参考` だけにする

## 編集部レビューの反映

### ループ1（2026-10-02）

指摘本文は書き換えず、反映内容だけを記録する。行番号は反映後の記事のもの。

| 指摘 | 判断 | 反映内容 |
| --- | --- | --- |
| high: 「判断のインフラ」 | 採用（著者の指示） | タイトルを「River Reviewのコア設計：AIレビューではなく、チームの判断を再現可能に残す」に変更（L2）。結びを「AIレビューから、チームが所有する判断へ」に組み直し、コアをReview Judgment as Code（判断をArtifact・Evidence・Verification・Memory・Human Judgmentへ分ける）と言い直した（L493-507）。「判断のインフラ」はconcept.mdが長期の方向とするEngineering Judgment Infrastructureとしてだけ触れた（L509）。「Review Judgment Layer」は削除。Planのtitle・今の仮説・central_claim・Outline 7も同じ趣旨で言い換え、追記ログに記録した。Planの事実の食い違い2点（rankingの信号、ADR-012のStatus）も直した |
| medium: TL;DRにMemoryとHuman Judgmentが無い | 採用 | TL;DRを6点にし、4点目に記憶、5点目に人の判断を足した（L36-43） |
| medium: 全体図のOrganizer | 採用 | 図の箱を「Human Decision Surface / (display only)」に変え（L461-464）、前置きでOrganizerは設計段階なので図に入れていないと注記した（L437） |
| medium: 使い方が一言もない | 採用 | `:::message` に「Claude Code / Codexのプラグインや、GitHub Actionsから使うレビューのOSS」と足した（L31）。CLIとコマンドは書いていない |
| low: 「きっかけ」節が長い | 採用 | TL;DR直後の予告3段落を削除し、3つの対策の箇条書きをsubagentへの隔離の1点に絞った（L51）。70%の出典に触れる§7の文は、箇条書き削除に合わせて言い回しを調整した（L404） |
| low: Verifierの「スキーマ」 | 採用 | 「根拠の参照先が差分に実在するか、重大度に根拠があるか、修正案があるか」に置き換えた（L219。提案文の英語名詞を和語にし、言語密度の警告を増やさないようにした） |
| low: 1行段落・単語だけのコードブロック、結びの3回目の要約 | 採用 | `security issue = none` / `complete` 等 / `Transcript Memory` / `Visibility = complete` をインラインコードで本文へ入れた（L233-235, L284, L306）。結びの「賢いAgent」の一般論（旧L550-585）を削除し、経緯とチームが所有したい5項目に絞った（L493-509） |
| low: emojiがtopology記事と同じ | 採用 | `🧭` から、`articles/` で未使用の `🗂️` に変更（L3） |

### ループ2（2026-10-02）

ループ2の指摘は編集部から直接受けたもので、上の指摘コメントには含まれない。行番号は反映後の記事（`articles/river-review-core-design.md`）のもの。

| 指摘 | 判断 | 反映内容 |
| --- | --- | --- |
| high H1: 中心主張と節の分量 | 採用 | §1 に同梱Skill `hallucinated-reference` の例を足し、何を見るか・何をEvidenceとするか・どの条件では指摘しないか・fixtureでの回帰確認を示した（L59-64。river-review の `skills/midstream/hallucinated-reference/` の SKILL.md と fixtures 2件で確認）。§7 のフロー図2つは文章にした（L291）。「きっかけ」節は3段落に縮めた（L45-51）。節の行数（見出しから次の見出しの前まで）は §1 が23行、「きっかけ」が8行、§7 が46行（反映前は §1 が14行、「きっかけ」が26行、§7 が94行） |
| high H2: 「同じ判断を再現できる」は強すぎる | 採用 | 「同じ基準・同じEvidenceで判断を再現しやすくしています」に変えた（L403） |
| medium M1: TL;DR 4 の「だけ」、Riverbed の一覧 | 採用 | 「だけ」を外した（L41）。分類の一覧の前に「typeではなく、残したい情報の分類として」と入れた（L225） |
| medium M2: Memory への登録 | 採用 | 全体図の前置きに、Memoryへの登録はsuppressionの追加やeval結果の保存のような明示的な操作だと添えた（L333。`pages/reference/riverbed-storage.md` で確認） |
| medium M3: slug の変更 | 採用 | `river-review-judgment-infrastructure` から `river-review-core-design` へ変更。記事・Seed・本ファイルを `git mv` し、Seed の seed_id・promoted_to・Plan の見出しと slug、本ファイル冒頭の対象パスとPlanのパスを更新した。article-graph を再生成した。旧 slug は Seed 追記ログの変更記録にだけ残る |
| medium M4: 結びの Engineering Judgment Infrastructure | 採用（§1 へ移動） | 結びの段落を削除し、§1 の Review Judgment as Code の説明の直後へ移した（L72）。記事は現在のコアの話で終わる |
| medium M5: §6 の英語名詞と表記の揺れ | 採用 | §6 の地の文を和語に寄せた（判断面、判定役、表示の区分など。L238-282）。英語は図と固有名に残した。表記は「サブエージェント」「エージェント」「人」「レビュー」にそろえた（Agent Host は呼び出し側の別名として括弧で残す） |
| low L1: 定型表現 | 採用 | 「ここで重要なのは」「次に重要なのが」「かなり重要」をすべて言い換えた。太字だけの1行段落は5か所から2か所（L68, L199）に減らした |
| low L2: 本筋から外れた段落 | 採用 | Review Team の節末尾の2段落を削除した |
| low L3: `:::message` の重複案内 | 採用 | Judgment Placement 記事への案内の1文を削除した（L31） |
| low L4: 入力の例 | 採用 | 図を「plan / diff / tests / JUnit / 既存レビューコメント」にした（L84-89） |
| low L5: Verifier の重大度 | 採用 | 「Skillが宣言した重大度を超えていないか」にした（L173。`verifier.mjs` の `checkSeverityJustified` で確認） |
| low L6: 「かなり制御できる」 | 採用 | 「Context Budget、ranking、Skillの段階的な読み込みで制御できる」にした（L287） |
| （ループ2の副作用への対応） | 自主対応 | 段落を統合したことで言語密度の警告が15件に増えたため、長い段落を分け、地の文の英語名詞（storage contract、preset、suppression、eval など）を和語にして8件まで戻した。§1 は Skill の例を足したことで敬体と常体の混在の警告が出たため、常体の文を敬体に寄せて解消した |

### ループ3（2026-10-02）

ループ3の指摘も編集部から直接受けたもの。行番号は反映後の記事のもの。

| 指摘 | 判断 | 反映内容 |
| --- | --- | --- |
| high H1: 「コードと同じリポジトリでバージョン管理」 | 採用 | 「このSkillはRiver Reviewのリポジトリで、fixtureと一緒にバージョン管理されています」と書き直した（L68）。続けて、チームはSkillやプロジェクト固有のレビュールール（`.river/rules.md`）を自分のリポジトリに置き、コードと一緒に管理できると書いた（L70）。根拠は river-review の README（「skill はあなたのリポジトリに置きます。レビュールールはコードと一緒にバージョン管理され」、Project-specific review rules 節の `.river/rules.md`）。CLI は書いていない |
| high H2: 呼び出し側のツリーが2回出る | 採用 | 全体図の後ろのツリーを削除し、「この外側に、セッションや再試行、停止を持つ呼び出し側（§7）があります」の1文にした（L368）。§7 は導入の1文を削り、段落を統合して46行から38行にした（L283-320） |
| medium M1: Engineering Judgment Infrastructure の段落 | 採用 | L70 直後の段落をまとめ、「ドキュメントが〜」の重複を解消した1段落にした（L72） |
| medium M2: L57 の長文 | 採用 | 2つの問題を述べる文と、対処を述べる文に分けた（L59） |
| medium M3: Verifier の長文 | 採用 | 「…決定論的なVerifierに通します。」で切り、検証の条件を次の文へ移した（L173） |
| medium M4: 記事の中心の明示 | 採用 | 「きっかけ」節の末尾に、中心は判断基準の置き方で、文脈の話は周りの責務の1つとして扱う、と足した（L53） |
| low L1: 「同梱しているSkill」 | 採用 | 「River Reviewのリポジトリにある、AI生成コード向けのSkill」にした（L61） |
| low L2: 太字だけの1行段落 | 採用 | 前の段落の末尾に続けた（L70） |
| low L3: aggregate status | 採用 | 「全体の状態」にした。値は英語のまま（L189） |
| low L4: Visibility / Attention の対 | 採用 | 括弧書きの英語を外し、和語の地の文にした（L254） |
| low L5: 張り返し | 対応なし（指示どおり） | 公開時に別PRで行う |
| （副作用への対応） | 自主対応 | 反映直後に言語密度の警告が8件から12件に増えたため、Skill例の段落を2つに分け、地の文の重複した英語名詞（Skill、Verifier、Evidence）を減らして8件に戻した |

記事冒頭のレビュー記録（publish-readiness のコメント）は1行目に無いため、追加していない。
