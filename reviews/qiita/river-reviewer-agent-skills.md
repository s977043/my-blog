# Qiita 記事レビュー: river-reviewer-agent-skills (Codex 2026-05-07)

## レビュー方針

対象記事 `Qiita/public/river-reviewer-agent-skills.md` を本文編集なしでレビューした。最優先は、River Reviewer v0.33.0 時点の一次情報との事実整合性とした。

確認した一次情報:

- `/Users/user/Documents/GitHub/river-reviewer/README.md`
- `/Users/user/Documents/GitHub/river-reviewer/CHANGELOG.md`
- `/Users/user/Documents/GitHub/river-reviewer/pages/reference/artifact-input-contract.md`
- `/Users/user/Documents/GitHub/river-reviewer/skills/upstream/`
- `/Users/user/Documents/GitHub/river-reviewer/runners/github-action/action.yml`

差別化対象として、Zenn 2 本、note 公開済 1 本、既存 Qiita 1 本の本文を確認した。

## サマリ (優先度別件数表 + 総合判定)

| 優先度 | 件数 | 主因 |
| --- | ---: | --- |
| High | 2 | GitHub Actions の利用例と Skill ディレクトリ例が v0.33.0 時点の実物とずれている |
| Medium | 3 | 既存記事との差別化不足、artifact 一覧の代表例不足、導入アクションが現行 README の安全な導入手順より粗い |
| Low | 2 | 3 ペルソナ別の導入価値が薄い、用語表記の揺れ |

総合判定: **NEEDS_FIX**

理由: `private: true` / `ignorePublish: true` と Qiita frontmatter は公開前ドラフトとして問題ない。一方、本文に一次情報と明確に異なるコード例・ディレクトリ例があり、公開前に修正が必要。

## 事実整合性チェック (行番号 + 事実 vs 本文記述)

### High

1. L223-L228: GitHub Actions の `uses` が現行 README と一致しない
   - 本文記述: `uses: s977043/river-reviewer@v1`
   - 一次情報: README v0.33.0 のクイックスタートは `uses: s977043/river-reviewer/runners/github-action@v0.28.0`。同 README は「最新リリース: v0.33.0」としつつ、Action は `@v0.28.0` などのリリースタグへピン留めする説明になっている。
   - 実物確認: `/Users/user/Documents/GitHub/river-reviewer/runners/github-action/action.yml` は `phase` input を持つ composite action。README の path 付き Action が実物と一致する。
   - 影響: Qiita 読者がそのまま workflow に貼ると、存在しない Action 参照として失敗する可能性が高い。

2. L153-L159: Skill ディレクトリ構造例が `skills/upstream/` の実物と一致しない
   - 本文記述: `README.md` / `prompt.md` / `tests/` / `schema.json`
   - 一次情報: 実物の `skills/upstream/rr-upstream-plangate-plan-integrity-001/` は `SKILL.md`、`eval/promptfoo.yaml`、`fixtures/*.md`、`golden/*.md`、`prompt/system.md`、`prompt/user.md` で構成される。`rr-upstream-plangate-exec-conformance-001/` も同系統。
   - 影響: 「Skill ごとに何がファイルとして残るか」の説明自体は正しいが、実物と違う構成例は読者がリポジトリを開いた瞬間に混乱する。

### Medium

3. L123: artifact 入力の代表例から `coverage` が抜けている
   - 本文記述: `plan` / `diff` / `test-cases` / `junit` など
   - 一次情報: README は「`plan` / `diff` / `test-cases` / `junit` ほか」とする。Artifact Input Contract の対象一覧には `coverage` も含まれ、形式は Cobertura XML、LCOV、Istanbul JSON のいずれか。
   - 判定: 「など」なので誤りではないが、レビュー観点で指定された artifact 種類との整合を明示するなら `coverage` も本文に含めるほうがよい。

4. L244-L245: PlanGate 連携 Skill の存在は正しいが、いずれも `phase: upstream`
   - 本文記述: `rr-upstream-plangate-plan-integrity-001` と `rr-upstream-plangate-exec-conformance-001` を具体例として挙げる。
   - 一次情報: `skills/upstream/` に両方とも実在する。各 `SKILL.md` の frontmatter は `category: upstream` / `phase: upstream`。
   - 判定: 本文の Skill ID は正しい。ただし L206-L231 で `phase: midstream` の最小導入を出した直後に、PlanGate 連携として upstream Skill を示すため、読者には「midstream でこの Skill が動く」と誤読されやすい。`PlanGate 連携の例は upstream phase` と補足したい。

5. L257-L260: 「合っていない指摘の対応 Skill を見る」導入手順が現行 README の安全手順より粗い
   - 本文記述: `river-reviewer@v1` を `phase: midstream` で動かし、対応する Skill を見て修正または追加する。
   - 一次情報: README の Action 例は `OPENAI_API_KEY`、`fetch-depth: 0`、permissions、`dry_run`、`estimate`、`max_cost`、設定ファイル、Node 22 などを明示している。
   - 判定: 体験記事としては許容範囲。ただし公開記事としては、まず `dry_run: true` または `estimate: true` で試す流れを入れると実務導入の安全性が上がる。

### Low

6. L174-L188: 自由度の設計は一次情報と整合
   - 本文記述: 崖・丘・原っぱの 3 段階。
   - 一次情報: README は「自由度の設計: 崖・丘・原っぱのリスク設計」と明記している。note 公開済記事も低自由度（崖）/ 中自由度（丘）/ 高自由度（原っぱ）として説明している。
   - 判定: 事実整合性は問題なし。本文は「これは PlanGate の Hook の `default warning / strict block / bypass` と同じ思想」と続けるため、PlanGate 側の厳密な用語に自信がない場合は「近い考え方」と少し弱めると安全。

7. L194-L200: HITL の `Plan / Validate / Verify` は一次情報と整合
   - 本文記述: River-Reviewer は `Plan / Validate / Verify` の 3 ステップを前提。
   - 一次情報: README は HITL を前提にした `Plan / Validate / Verify` の運用と説明している。note 公開済記事も HITL の説明で `Plan / Validate / Verify` を扱っている。
   - 判定: 事実整合性は問題なし。

### frontmatter

- L2: title は 61 文字。Qiita の記事タイトルとして過度に長すぎる状態ではない。
- L3-L8: tags は 5 個で上限内。
- L9: `private: true` 維持。
- L14: `ignorePublish: true` 維持。
- High 指摘なし。

## 差別化チェック

| 対象 | 重複度 | 確認結果 |
| --- | --- | --- |
| Zenn: `articles/ai-dev-guardrail-plangate-river-reviewer.md` | 中 | 2 層ガード設計、PlanGate と River Reviewer の役割分担、Plan / Validate / Verify が重なる。対象記事は River Reviewer 体験寄りなので、Skill 改善ループと GitHub Actions 導入に寄せれば差別化できる。 |
| Zenn: `articles/zenn-river-reviewer-architecture.md` | 高 | Agent Skills、自由度の設計、HITL、10 行ルールの思想が強く重なる。対象記事は Qiita 向けに「実際に repo のどのファイルを見るか」「どの workflow を貼るか」まで具体化しないと焼き直しに見える。 |
| note: `https://note.com/mine_unilabo/n/nd21c3f1df22e` | 高 | タイトル、プロンプト最適化からの転換、Agent Skills、崖・丘・原っぱ、HITL がかなり重なる。note は設計思想と失敗談、Qiita は導入手順と実物ファイルの読み方に寄せると棲み分けしやすい。 |
| Qiita: `Qiita/public/plangate-ai-agent-governance.md` | 低〜中 | 体験談の構成、冒頭の課題提示、先に結論、導入前後の語り口が近い。ただし対象が PlanGate Metrics/Governance と River Reviewer Skills で異なるため、トーン参考としては自然。 |

差別化の主課題: 対象記事は「River Reviewer 単独の体験寄り」と書いているが、現状は note/Zenn で既に語った思想の再説明が多い。Qiita 版としては、README v0.33.0 の実物 workflow、`skills/upstream/` の実ファイル、Artifact Input Contract の入力一覧を使い、「このファイルを見れば始められる」記事へ寄せると公開価値が上がる。

## 3 ペルソナ別指摘 (Web ディレクター / Web 編集者 / Web エンジニア)

### Web ディレクター

- Medium: L51-L63 の「一番効いたこと」は分かりやすいが、導入後にディレクターが確認できる成果物が `findings` なのか、PR コメントなのか、Review Artifact なのかが曖昧。レビュー判断の再現性を、非エンジニアも見られる単位で一度だけ説明したい。
- Low: L274 の「PlanGate を 1 ヶ月運用してから」は体験として良いが、なぜ 1 ヶ月かが本文だけでは根拠薄い。期間より「計画成果物が安定してから」と書くほうが再利用しやすい。

### Web 編集者

- Medium: note と Zenn の既存記事を読んだ読者には、L45、L174-L204、L291-L303 が既視感になりやすい。Qiita では「動かすための最小構成」「Skill の実物構成」「失敗したらどこを見るか」を強めると媒体ごとの差が出る。
- Low: `River Reviewer` / `River-Reviewer` の表記が混在している。リポジトリ名・記事タイトル・本文で表記を統一したい。

### Web エンジニア

- High: L223-L228 の Action 参照はそのまま実行できるコード例として危険。README v0.33.0 の path 付き Action 参照に直す必要がある。
- High: L153-L159 の Skill 構造例が実物と違うため、リポジトリを開いて確認するエンジニアほど不信感を持つ。`SKILL.md` / `prompt/system.md` / `prompt/user.md` / `fixtures` / `golden` / `eval/promptfoo.yaml` の実構成に合わせる。
- Medium: L123 に `coverage` を足すと、Artifact Input Contract を読んだ読者との整合が良くなる。

## 修正アクション一覧 (L<行番号>: <修正前> -> <修正後> [優先度])

- L223-L228: `uses: s977043/river-reviewer@v1` -> `uses: s977043/river-reviewer/runners/github-action@v0.28.0` に変更し、README と同じ `env: OPENAI_API_KEY`、必要なら `dry_run: true` を追加する [High]
- L131-L142: リポジトリ構造抜粋の `runners` 行は維持しつつ、GitHub Actions の導入例で `runners/github-action` を参照する説明を追加する [High]
- L153-L159: `README.md / prompt.md / tests / schema.json` -> `SKILL.md / prompt/system.md / prompt/user.md / fixtures / golden / eval/promptfoo.yaml` の実構成に置き換える [High]
- L123: `` `plan` / `diff` / `test-cases` / `junit` など `` -> `` `plan` / `diff` / `test-cases` / `junit` / `coverage` など `` [Medium]
- L231-L233: 「phase を切り替えるだけで...自動選択」 -> 「`phase: midstream` では中流向け、PlanGate 連携 Skill は `phase: upstream` の例として扱う」旨を追記する [Medium]
- L244-L245: Skill 例の直前に「以下は `skills/upstream/` にある PlanGate 連携 Skill」と明記する [Medium]
- L257-L260: `phase: midstream` で動かす手順 -> 最初は `dry_run: true` または `estimate: true` で確認し、実行コストと出力を見てから本実行する流れに変更する [Medium]
- L249: 「本記事は River-Reviewer 単独の体験寄り」 -> 「本記事は GitHub Actions と Skill 実物を触る導入寄り」へ寄せ、Zenn 2 層ガード記事との差を明確化する [Medium]
- L274: 「PlanGate を 1 ヶ月運用してから」 -> 「PlanGate の plan / todo / test-cases が安定してから。目安として 1 ヶ月」 [Low]
- L41, L47, L119, L237, L253, L299: `River Reviewer` / `River-Reviewer` -> 表記をどちらかに統一する。固有名は README に合わせるなら `River Reviewer` [Low]
