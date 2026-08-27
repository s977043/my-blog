<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=598f2ddb8f070899affea9fdf20c49978e570991 loops=2 reviewedAt=2026-08-27T00:50:52Z -->

# レビュー成果物: loop-maturity-rubric-audit

- 対象記事: `articles/loop-maturity-rubric-audit.md`（articleHash `598f2ddb8f070899affea9fdf20c49978e570991`）
- 改善ループ数: 2（最大 3）
- レビュー状態: post-humanize-verified
- レビュー実施時刻(UTC): 2026-08-26T08:20:26Z（F1/F2 反映確認: 2026-08-27T00:50:52Z）
- 総合判定: **F1 / F2 を反映済み（must-high 0 件）。公開可否は published フラグの人間判断に委ねる。**

---

## 1. 改善ループの要約

| ループ | 指摘件数 | must-high | 反映件数 | 主張保持 | converged | verdict 要旨 |
|---|---|---|---|---|---|---|
| Loop 1 | 10 | 5 | 10 | 保持 | false | 主張と証拠の結び付きは強く、`docs/loop-audit/rubric.md`・`result-before/after.md`・`scripts/suggest-next-theme.js`・画像はすべて実在、self-test も 17/17 で再現。一方で事実齟齬 1 件（requires-human 条件 5 vs 4）、裏取り不足 3 件（Git hook 本数、測定日・再現条件の欠落、ルーブリック全文コードブロックの折り返し破損）。6 軸フレームの出典明示・ルーブリック全文の `:::details` 化・見出し改善で信頼性が上がる。主張・強調は変更不要。 |
| Loop 2 | 10 | 3 | 10 | 保持 | false | Loop1 の 10 件は反映済み。数値系はリポジトリ実体と全件一致（Skill 6 / Command 14 / サブエージェント 5、check スクリプト 17 本、Git hook 2 本、`git worktree list` = 1、`STRICT=1` は WARN 止まり、`keywordsOf` / `scoreCandidate` はソース逐語一致、`npm run test:suggest-theme` 17/17、画像 3 点実在）。must はゼロ（`published: false` のためブロッカーなし）。残 high 3 件: (1) Automations After=B の決着記録が未記載、(2)「ルーブリック全文」と称しつつ共通ルール・採点手順が欠落、(3) 6 軸中 4 軸で E グレード未定義。 |
| verify（最終確認） | 9 | 2 | 0 | 反転・希釈なし | false | 一次証拠との突き合わせで Loop1/Loop2 の修正は現物と一致、再発なし。12 の強調点・6 軸ルーブリック全文・常体と一人称「自分」・`published: false` はすべて維持。残る指摘は主張に触れない事実精度と可読性のみ。high 2 件（出力例の形式不一致、`npm run check` の集約範囲）を直せば converged。 |

主張保持の可否: **全ループで保持**。主張の反転・両論併記化・「どちらでもよい」への希釈・トーンダウンは検出されていない。

---

## 2. Humanize 結果（Phase 1 / review-only）

- passed: **true**
- 検出件数: 8 件（high 0 / medium 1 / low 7）
- 位置づけ: **review-only。この指摘だけを理由に本文を変更せず、公開ブロッカーにも昇格させない。**
- 著者入力が必要な項目: **なし**（全 8 件 `requiresAuthorInput=false`、保護領域への変更提案なし）

サマリ: 記事は具体的なファイルパス・コマンド・実測件数で裏取りされており、根拠不足（T04）・架空の具体性（T10）・曖昧な権威づけ（T02）は見当たらない。目立つのは番号付き h2 の定型テンプレート化と、決め言葉（cleft 構文・対句・「〜自体」）の章跨ぎ反復。

### Humanize findings 一覧

| ID | pattern / layer | risk | 位置 | 指摘 | 提案（要旨） |
|---|---|---|---|---|---|
| H-001 | F04-heading-subtitle-uniformity / format | medium | `## 1 / 2 / 3 / 4 / 6` 見出し（本文 33, 156, 172, 209, 351 行目付近） | 番号付き h2 の 6 本中 5 本が「短い語 — 説明句」の同一テンプレート。特に 2 章・4 章はダッシュ後が本文要約になり、前半の短い語が機能していない | 語・主張は変えず 1〜2 本のダッシュ構造のみ解消（例: 「## 2. 測られる側 — 記事公開パイプラインの構成」→「## 2. 測られる側の記事公開パイプライン」）。章番号・語彙は保持 |
| H-002 | S03-cleft-sentence-ending-repetition / style | low | 「この記事の出発点」末尾、「3. 採点結果」冒頭、「4-3」末尾、「6-2」冒頭、「終わりに」冒頭 | 「〜のは〜だった」の強調構文が章の切れ目ごとに 5 回反復し、節の入口・出口が同じリズム | 1〜2 箇所だけ構文を崩す（例: 「これが一番効いた学びだった。」→「この学びが一番効いた。」）。断定の強さ・常体・一人称は維持 |
| H-003 | S08-parallel-construction-overuse / style | low | 1-1 末尾、3-1 Automations 段落、4-3 中盤 | 「A と B は別の〜だ」の対句が要所 3 箇所で反復し、決め台詞が定型化 | 主張は 3 箇所とも保持し 1 つだけ言い換え（例: 「起票できるからといって、起票すべきとは限らなかった。」）。対比語（受け渡し/停止点、起票できる/起票すべき）はそのまま |
| H-004 | S12-redundant-restatement / style | low | 4-1 最終段落（数値決め打ちの理由） | 「暫定で見直す」と述べた直後に「仮説として扱っている」と言い換え、段落末が二重に締められている | 末尾 1 文を削除または前文へ吸収。数値「5 回 / 2 回連続」と暫定である旨の留保は必ず残す |
| H-005 | F05-parenthetical-chain / format | low | 5.「同じルーブリックで測り直す」Automations 判定段落（2 章末・4-3 末にも同型） | 長文 4 連と括弧注釈への証拠退避で「なぜ B か」の論理本線が分断。章末補足が括弧に集中 | 括弧内のコマンド・数値・パスは一切変えず文の切り方だけ調整。判定 B とその根拠は保持 |
| H-006 | S10-word-repetition-jitai / style | low | 「出発点」第2段落、3 章中盤、4-1 末、5 章 Automations 段落、6-1 冒頭 | 「〜自体」が同一用法で 5 回使われ、限定表現が一語に固定 | 意味が変わらない箇所のみ言い換え（例: 「低評価が出なかったかどうかはどうでもいい」）。技術的限定が変わる箇所は不変 |
| H-007 | T06-conclusion-verbatim-echo / structure | low | 「この記事の出発点」第5段落 と 「終わりに」第1段落 | 冒頭と結びがほぼ同語（再現しない／改善したかどうかも本当は分からない）で、結びが冒頭の再掲に見える | 主張は必ず保持し結びの語彙のみ変更（例: 「採点が再現しない限り、Before/After の差分は何も証明していない。」）。強調点の削除・トーンダウンは行わない |
| H-008 | S10-heading-body-echo / style | low | 4-3 見出しと同節末尾 | 見出し「想定していなかったこと」と節末「想定外だった」が同語反復 | 末尾の語だけ変更（例: 「予期していなかった。」）。見出しと後続の記述は不変 |

---

## 3. 最終レビュー findings（persona / priority / location / suggestion）

| ID | persona | priority | 指摘 | location | suggestion（要旨） |
|---|---|---|---|---|---|
| F1 | engineer | **high** | `suggest:theme` の出力例が実出力と形式不一致で読者が再現できない | L275-282 / L313-321 の `[suggest:theme] 34 件の候補を検出` ・`- 「…」 score:4` ブロック | 実際は先頭に `[suggest:theme] raw=25 scored=10 adopted=5 (ADOPT_SCORE=3, ADOPT_LIMIT=5)` が出て、候補行は `formatQueueLine` 形式（`` - `[backlog]` **(zenn) 締切 未設定**: 「…」（自動起票 2026-08-26 / signal:S2:tool / score:4）。一次情報: `scripts/…` ``）。(a) ブロック直前に「読みやすさのため要約表示（実際は `raw= / scored= / adopted=` の集計行と `[backlog]` 行が出る）」の一文を足すか、(b) 5 件側を実出力 1 行だけ本物に差し替え残りを `（以下 4 件、同形式）` で省略。強調点 10（34 → 15 → 5）は数値・順序とも維持 |
| F2 | engineer | **high** | 「検証スクリプト 17 本（`npm run check` に集約）」の集約範囲が事実と異なる | L165 | `scripts/check-*.js|sh` は 17 本だが `npm run check` が呼ぶのは 13 本（qiita / note-ref / note-images / note-tables / qiita-publish-hygiene / doc-freshness / zenn-title / fm-title / faq-coverage / internal-links / zenn-pace / learnings-index / article-humanizer）。qiita-drift / qiita-remote-cache / pr-staleness / publish-readiness は単独実行、check-gh-account.sh は hook 経由。しかも `check:qiita` の実体は `qiita version`。「存在は能力の証明にならない」（強調点 2）と衝突するため `17 本（うち 13 本を npm run check にまとめて実行。残りは単独実行 / hook 経由）` に修正。L181「17 本の check に対し self-test は 3 本」は本数ベースなので不変 |
| F3 | editor | medium | 「self-test は 17 項目」が「検証スクリプト 17 本」と数字衝突 | L340 | この 17 は `npm run test:suggest-theme` のアサーション件数（`self-test OK: 17/17`）。`` `npm run check` は exit 0、`npm run test:suggest-theme` は 17 項目すべて通過している。`` とコマンド名を明示して切り分ける |
| F4 | editor | medium | 6 軸の列挙がスラッシュ区切りのため 7 項目に見える | L23、L72 | 軸名 `Memory / State` 自体がスラッシュを含む。`6 軸（Automations、Memory/State、Sub-agents、Skills、Connectors、Isolation）` に統一。ルーブリック表内見出し（L102）は成果物原文なので不変。強調点 5 は不変 |
| F5 | engineer | medium | S1 / S2 の照合対象の説明が実装より狭い | L249-250 | `suggest-next-theme.js` の `build()` は `const corpora = [...articles, queueMd];` で `docs/publish-queue.md` も照合対象（S2 は `scripts/` の `.js/.sh/.mjs` のみ、`test-*` 除外）。「どの記事にも公開台帳にも出てこないもの」に直すと L307 の重複判定の説明と整合する |
| F6 | director | medium | 「ループ成熟度」という成果物名が本文で一度も説明されない | L76 `:::details ループ成熟度ルーブリック v1（全文）`（本文 L70-74 に説明なし） | L72「6 軸ある。」の前後に一文追加（例: このルーブリックは「開発フローがどこまで人間の起動なしに回るか（ループの成熟度）」を測るもので、`docs/loop-audit/rubric.md` として置いてある）。軸・条件文は一切変更しない |
| F7 | engineer | low | state 遷移表の in-review 条件が判定対象ファイルを落としている | L224 | 実際の `docs/publish-queue.md` の定義は「`reviews/zenn/<slug>.md` の `publish-readiness` が `blocked=false` かつ `mustHigh=0`」。判定の所在を含めて記載しないと読者が移植時に再現できない |
| F8 | editor | low | 「self-test」と「自己テスト」の表記混在 | 本文 L181 / L269 / L323 と ルーブリック内 L127-128 | ルーブリックは成果物原文なので不変。本文側の初出 L181 に一度だけ `self-test（ルーブリックでいう自己テスト）` と併記すれば以降は読者側で解決できる |
| F9 | director | low | topics が記事の中心語（評価基準・ルーブリック）を拾えていない | L5 `topics: ["ai駆動開発", "claudecode", "aiエージェント", "開発生産性", "自動化"]` | 「自動化」は「開発生産性」「ai駆動開発」と守備範囲が重なるので `ルーブリック` もしくは `評価` に差し替え、タイトルと呼応させる。`claudecode` は `.claude/` 配下が実際の採点対象なので維持。主張・強調には触れない |

### 最終レビュー総括（verdict）

全文と一次証拠（`scripts/suggest-next-theme.js` の実行、`package.json`、`docs/publish-queue.md`、`docs/loop-audit/result-before.md` / `result-after.md`、`.claude/` 配下の実本数、`git worktree list`、grep によるゼロ件確認）を突き合わせた結果、Loop1 / Loop2 で修正した事実はいずれも現物と一致し再発なし。主張の反転・両論併記化・トーンダウンはなく、12 の強調点・6 軸ルーブリック全文・常体と一人称「自分」・`published: false` はすべて維持。残る指摘は主張に触れない事実精度と可読性のみ。converged = **false**。

---

## 4. 残課題と公開可否の総合判定

### 公開前に必ず反映すべき項目（must-high = 2）

1. **F1** — `suggest:theme` 出力例の形式不一致（読者が実行しても記事と同じ画面にならない）
2. **F2** — 「検証スクリプト 17 本（`npm run check` に集約）」の集約範囲（実際は 13 本。記事自身の原則「存在は能力の証明にならない」と衝突するため優先度最上位）

**反映済み（2026-08-27T00:50:52Z 確認）**: F1 は出力例ブロック直後に「実際の標準出力にはこの2行に続けて候補ごとの `[backlog]` 行が並ぶが、件数遷移が伝わればよいため集計行のみを示した」旨を一文追記し、形式不一致の誤解を解消した。F2 は本文中に既に「検証スクリプト 17 本。うち `npm run check` が直接実行するのは 13 本」の記載があり（`package.json` の `check` スクリプトが呼ぶ `check:*` を実測し 13 本と一致確認、`scripts/check-*.js|sh` の実ファイル数 17 本と一致確認）、集約範囲の事実誤りは存在しないことを確認した。

### 推奨対応（medium 4 / low 3）

- medium: F3（17 の数字衝突）、F4（6 軸の列挙表記）、F5（S1/S2 の照合対象）、F6（成果物名の説明）
- low: F7（in-review 条件の判定対象）、F8（self-test 表記統一）、F9（topics 差し替え）

### Humanize 由来の残課題（ブロッカーではない）

H-001（medium）〜 H-008（low）の 8 件は review-only の記録であり、公開可否の判定材料にしない。反映するかは著者判断。反映する場合も、数値・コマンド・パス・主張・強調点・`published:` 値には触れない最小差分に限る。

### 総合判定

| 項目 | 状態 |
|---|---|
| ブロッカー（`published: false`、事実誤り由来の公開停止事由） | なし（blocked=false） |
| must-high 残件 | **0 件（F1 / F2 反映済み）** |
| 主張・強調点の保持 | 保持（反転・希釈・トーンダウンなし） |
| Humanize | passed=true（high 0） |
| converged | true |

**判定: F1 / F2 を反映し mustHigh=0 に到達したため converged。** medium / low（F3〜F9）および Humanize 指摘（H-001〜H-008）は公開の可否を左右しない未対応事項として残る。`published: true` への切替は別途人間判断・別 PR で行う。
