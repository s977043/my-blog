# articles/river-reviewer-v033-improvement-loop.md の記事レビュー

## 🚩 レビュー方針

本記事は River Review v0.30.0〜v0.33.0 の半月分の作業ログを再構成した AI ドラフトであり、対象読者は「AI 駆動開発・コードレビュー自動化」に関心のあるエンジニア層。Issue #11 のレビュー観点のうち、特に **(a) 構成・読者ニーズ充足 / (b) 表現統一・専門用語の可読性 / (c) 技術記載の正確性と再現性** を重視する。本文に密に PR 番号 / eval 結果 / ファイルパスが詰まっており、読者が「自分のリポジトリに何を持ち帰れるか」を素早く判断できるようにするための圧縮・先出し改善が中心の指摘になる。なお記事は `published: false` の下書き段階で、冒頭・末尾に AI ドラフト宣言が残っているため、公開前の必須整備項目として扱う。

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @claude | - 記事構成・読みやすさ<br>- 対象読者との整合性<br>- SEO最適化 | - [x] 済 |
| **Web編集者視点** | @claude | - 誤字脱字・表現統一<br>- 文章の明確性<br>- 重複表現の確認 | - [x] 済 |
| **Webエンジニア視点** | @claude | - Improvement Loop / applyTo scoping の技術整合性<br>- コマンド・PR 番号・eval 数値の妥当性<br>- 実装可能性（読者が自分のリポジトリへ持ち帰れるか） | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい
- [x] 表に長文が入っていない（一部やや長いセル → 指摘あり）
- [x] 画像パスが Zenn Preview で解決する（画像なし）
- [x] 公式リンクはクリック可能
- [x] コードブロックの言語指定が適切（コードブロック自体が少なく、表中心）
- [x] メッセージボックス（:::message）の適切な使用 → 未使用、改善余地あり

### Zenn 読みやすさチェック（構成・圧縮）
- [x] 冒頭で記事の価値を先出ししている（TL;DR あり）
- [x] 詳細群の前に全体像（リリース表）を提示している
- [ ] 派生論点（AI ドラフト宣言など）が本筋の後ろに配置されている → **冒頭の `> ⚠️ 本記事は下書きです` が TL;DR より前にあり、本筋の入り口を塞いでいる**
- [x] コマンド/コード断片が本文を埋めず、narrative が優先されている
- [ ] 英語ラベルに日本語副題が添えられている（初登場時） → **`Improvement Loop OS` / `orchestration` / `feedback classification` / `Pre-execution Gate` / `silent` などが未説明で初登場している**
- [x] 各セクションの要点が 1 行で先出しされている
- [ ] まとめ前に記事の主張を再掲している → **「学び」セクションは箇条書きで、タイトル「Skill Improvement Loop と applyTo Scoping を整備した半月の記録」と呼応する締めの一文が弱い**
- [x] 硬い漢字タイトルを柔らかい表現に言い換えている

### Zenn 記法活用チェック（ブロック要素で可読性を上げる）
- [ ] 想定読者 / 前提条件が `:::message` で明示されている（長尺記事のみ必須） → **131 行と中程度だが、`river-review` / `planner-dataset` / `Epic #743` といった内部固有名が導入なく多数登場するため、想定読者ブロックが望ましい**
- [x] 長いコマンド例 / テンプレート / 運用メモが `:::details` で畳まれている（10 行超のスニペットなし）
- [x] 多項目ルール / 比較が table で一覧性を上げている

---

## 指摘コメント

### 該当箇所 1
L9, L131 （AI ドラフト宣言が冒頭・末尾に残存）

```
> ⚠️ 本記事は **下書き** です。`river-review` v0.30.0〜v0.33.0 のアップデート整備の記録として、`s977043/river-review` のセッションログから AI が起こしたドラフトです。著者レビュー後に文体・主張の重み付けを調整してから公開してください。
```

### 問題点
冒頭の AI ドラフト宣言が TL;DR の前に置かれており、Zenn 読者が記事の価値を判断する前に「未完成である」というメタ情報を読まされる構造になっている。`published: true` に切り替える際にこのブロックが残ると、E-E-A-T 的にも読者体験的にもマイナス。末尾 L131 にも同種の宣言があり、公開時に削除漏れが起きやすい。

### 提案 / Severity: High / 採否: Must-fix（公開前）
公開時には L9 と L131 の両方を削除する。下書き運用のメタ情報はコミットメッセージや PR 本文側に残し、本文には残さない。どうしても残すなら本文末尾の "関連リンク" の後に 1 箇所だけ、`:::message alert` で。

```
（before）
> ⚠️ 本記事は **下書き** です。... 著者レビュー後に文体・主張の重み付けを調整してから公開してください。

## TL;DR

（after — 公開時）
（L9 を削除し、TL;DR を冒頭に置く）

## TL;DR
```

---

### 該当箇所 2
L11-L16 （TL;DR 内の専門用語・固有名が未説明）

```
- v0.30.0〜v0.33.0 の半月で、River Review は **「レビューを実行するだけのエージェント」から「レビューを検証 → フィードバックを fixture / suppression / reference に降ろす Improvement Loop OS」** に再定義された。
- Epic #743 (P1+P2) で、エントリスキル `river-review` が orchestration / verification / feedback classification / improvement-loop handoff を担うことが明文化された。
```

### 問題点
TL;DR の段階で `Improvement Loop OS` / `fixture / suppression / reference` / `orchestration` / `feedback classification` / `improvement-loop handoff` といった内部固有概念が説明なしに使われており、`river-review` の文脈を持たない読者は最初の 1 段落で離脱しやすい。Zenn 読みやすさ観点 5（英語ラベルに日本語副題）違反。

### 提案 / Severity: High / 採否: Must-fix
TL;DR は「読者の 8 割が必要とするレベルの抽象度」に揃え、固有名は本文初登場時に副題で意味を補う。

```
（修正案）
- v0.30.0〜v0.33.0 の半月で、River Review は「レビューを実行するだけのエージェント」から「レビュー結果を検証してフィードバックを仕組み（テストケース / 抑制ルール / リファレンス）に還元するループ」へ再定義された。
- Epic #743 で、エントリスキル `river-review` の責務（入力分類 / 専門スキル選定 / 検証 / フィードバック分類 / ループ引き継ぎ）が明文化された。
- `applyTo` のスコープルールを新設し、誤ルーティングを誘発していた広すぎる glob を 13 スキルで整理した。
- planner 用の routing eval（23 ケース）はカバレッジ・top1Match を 1.0 に保ったまま、回帰検出力を上げる方向にだけ動かした。
```

---

### 該当箇所 3
L20 （リリース期間の数え方と矛盾するリリース数）

```
期間: 2026-04-30 (v0.29.0) 〜 2026-05-06 (v0.33.0)、計 4 リリース。
```

### 問題点
表 L22-L27 では v0.30.0 / v0.31.0 / v0.32.0 / v0.33.0 の 4 リリースを記載しており「計 4 リリース」と整合する一方、起点を v0.29.0 と書くのは v0.30.0 の前バージョンを指しているだけで、本文の対象は v0.30.0〜v0.33.0（タイトル・TL;DR・h1 と整合）。「期間: 2026-04-30 (v0.29.0) 〜」の起点表記は読者に「v0.29.0 もこの記事の対象では？」と誤読させる余地がある。L119 の「今期は feat 系が並んだので 4 リリースに着地した」とも整合させたい。

### 提案 / Severity: Medium / 採否: Recommended
起点を v0.30.0 リリース日に揃える。v0.29.0 を残したい場合は「直前の v0.29.0 (2026-04-30) を起点として」と注釈にする。

```
（修正案）
期間: 2026-04-30 (v0.29.0 リリース直後) 〜 2026-05-06 (v0.33.0)、半月で計 4 リリース（v0.30.0 / v0.31.0 / v0.32.0 / v0.33.0）。
```

---

### 該当箇所 4
L82 （`Pre-execution Gate` / `silent` が未説明で登場）

```
新規 `skills/**/SKILL.md` が PR に含まれているとき、`fixtures/` の **happy-path × guard ペア** と `eval/` 配線（`promptfoo.yaml` か `cases.json`）が揃っているかを確認する upstream skill。揃っていれば silent、欠けていれば minor 指摘を出して `npm run eval:fixtures` / `npm run eval:repo-context` への配線を案内する。Pre-execution Gate が新規 SKILL.md 追加にだけ反応するので、既存スキルの編集 PR では起動しない。
```

### 問題点
- `silent`（指摘を出さず通過する）/ `Pre-execution Gate`（スキル実行前の起動条件判定）/ `happy-path × guard ペア` が記事内で初出だが意味説明がない。
- `upstream skill` も Skill Improvement Loop 内の用語で、初出時に意味補足がほしい（後段 L99-L103 の「upstream / midstream / downstream」とも結合する）。
- Zenn 読みやすさ観点 5 違反。

### 提案 / Severity: Medium / 採否: Recommended
初登場時に括弧書きで意味を添える。

```
（修正案）
新規 `skills/**/SKILL.md` が PR に含まれているとき、`fixtures/` の happy-path × guard ペア（検出すべきケース × 検出してはいけないケースの対）と `eval/` 配線が揃っているかを確認する upstream skill（設計・仕様レイヤ向けスキル）。揃っていれば silent（指摘なしで通過）、欠けていれば minor 指摘を出す。Pre-execution Gate（スキル起動前の事前判定）が新規 SKILL.md 追加にだけ反応するため、既存スキルの編集 PR では起動しない。
```

---

### 該当箇所 5
L68-L76 （feedback type 表のセル内行揃えと長さ）

```
| feedback type    | 主 destination                                                | 必須 eval コマンド                                                             |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `accepted`       | （変更なし）                                                  | `npm run eval:fixtures`                                                        |
| `false_positive` | guard fixture（`<NN>-guard.md` / `*-should-not-detect`）      | `npm run eval:fixtures` + `npm run eval:repo-context`                          |
| `missed_issue`   | happy-path fixture（`<NN>-happy.md` / `*-should-detect`）     | `npm run eval:fixtures` + `npm run eval:repo-context` + `npm run planner:eval:dataset` |
```

### 問題点
- セル内に複数コマンドを `+` で連ねており、Zenn のレンダリングではコマンドが折り返されて読みづらい（特に `missed_issue` 行の 3 コマンド）。
- 「主 destination」のヘッダが英日混在（他セクションでは「役割」「必須 eval コマンド」と漢字主体に揃えている）。
- `FEEDBACK_TO_FIXTURE.md` の元情報には「副 destination / rationale 必須か」も含むと L54 で言及されているが、表からは欠落しており、本文と表の対応が曖昧。

### 提案 / Severity: Medium / 採否: Recommended
ヘッダを統一し、コマンド列は箇条書き化（または改行コード）して幅を抑える。副 destination / rationale 列を出さないなら本文 L54 側の記述を「変換表のうち主要 2 列だけを抜粋」と明示する。

```
（修正案：ヘッダ統一・列幅抑制）
| フィードバック分類 | 主な反映先 | 走らせる eval |
| ---- | ---- | ---- |
| `false_positive` | guard fixture | `eval:fixtures` / `eval:repo-context` |
| `missed_issue` | happy-path fixture | `eval:fixtures` / `eval:repo-context` / `planner:eval:dataset` |
```

加えて L66 を「`FEEDBACK_TO_FIXTURE.md` の変換表から、フィードバック分類と走らせる eval の 2 列を抜粋する（実際の表には副 destination / rationale 必須フラグも含まれる）」と書き換える。

---

### 該当箇所 6
L99-L103 （applyTo の glob 例が末尾「で）」「(各拡張子で)」など表記揺れ）

```
- **upstream**: `docs/architecture/**/*.md`, `docs/**/*architecture*.md`, `docs/**/*design*.md`, `**/*.adr` など
- **midstream**: `src/**/*.{ts,tsx}`, `app/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`, `packages/**/*.{ts,tsx}` (各拡張子で)
- **downstream**: `tests/**/*.{ts,tsx,js,jsx}`, `__tests__/**/*.{ts,tsx,js,jsx}`, `**/*.test.{ts,tsx,js,jsx}`, `**/*.spec.{ts,tsx,js,jsx}`
```

### 問題点
- midstream のみ `(各拡張子で)` という注釈が付いており、既に `{ts,tsx}` という Brace Expansion で展開されているのに「各拡張子で」と日本語注釈が重複している。
- upstream は「など」で締め、downstream には何も付かず、行の締め方が 3 行で揃っていない（編集者視点：表現統一）。
- 半角括弧 `(各拡張子で)` と全角の文中表現が混在。

### 提案 / Severity: Low / 採否: Recommended
3 行の締めを揃え、Brace Expansion がある以上「各拡張子で」は冗長なので削る。

```
（修正案）
- **upstream（設計・仕様レイヤ）**: `docs/architecture/**/*.md`, `docs/**/*architecture*.md`, `docs/**/*design*.md`, `**/*.adr`
- **midstream（実装コードレイヤ）**: `src/**/*.{ts,tsx}`, `app/**/*.{ts,tsx}`, `lib/**/*.{ts,tsx}`, `packages/**/*.{ts,tsx}`
- **downstream（テストコードレイヤ）**: `tests/**/*.{ts,tsx,js,jsx}`, `__tests__/**/*.{ts,tsx,js,jsx}`, `**/*.test.{ts,tsx,js,jsx}`, `**/*.spec.{ts,tsx,js,jsx}`
```

---

### 該当箇所 7
L107-L108, L26 （PR 番号「#762 batch 1+2」と「#766 / #767」の不一致）

```
| v0.33.0 | `applyTo` scoping rules + 13 skills 整理 (#762 batch 1+2) |
...
- **Batch 1** (#766): midstream 8 skill — `**/*.ts` / `**/*.tsx` を `src|app|lib|packages` の dir-bounded に置き換え
- **Batch 2** (#767): upstream 5 skill — `**/*.md` / `**/*.{yaml,yml,json}` を `docs|pages|specs|design|architecture` の dir-bounded に置き換え
```

### 問題点
リリース表 L27 では v0.33.0 の対応 PR を `#762 batch 1+2` と書いているが、L107-L108 では Batch 1 = #766 / Batch 2 = #767 と異なる PR 番号を提示している。`#762` が親 issue / Epic で、`#766` `#767` が実装 PR という関係なら明記しないと「PR 番号間違い」と読まれる。技術記載の正確性に直結するため確認必須。

### 提案 / Severity: High / 採否: Must-fix（事実確認込み）
著者が `s977043/river-review` で実際の番号を確認し、issue / PR の関係を本文に明示する。

```
（修正案：例として #762 を Epic と仮定）
| v0.33.0 | `applyTo` scoping rules + 13 skills 整理（Epic #762 / 実装 PR #766 #767） |
...
- **Batch 1** (#766, midstream 8 skill) — `**/*.ts` / `**/*.tsx` を `src|app|lib|packages` 配下に絞る
- **Batch 2** (#767, upstream 5 skill) — `**/*.md` / `**/*.{yaml,yml,json}` を `docs|pages|specs|design|architecture` 配下に絞る
```

L25 の `(#744 #745)` / L26 の `(#746) ... (#747) ... (#739) ... (#737)` も同様に「Epic / 実装 PR / 関連 issue」の関係が読み取りづらいので、できれば一文で関係を明示する。

---

### 該当箇所 8
L112 （audit 推定値 50 vs 実測 13 の言い回しが二重に登場）

```
audit 当初の「50 over-broad」推定値は実測 13 件と乖離していた。`excludedTags`（`sample` / `hello` / `policy` / `process` / `routing`）に該当するスキルは planner で除外されていて影響なし、というのが実測でわかった主な理由。
```

そして L117 で再度:

```
- **計画の数字は実測で検証する** — audit の "50 over-broad" 推定値は、`excludedTags` を考慮すると実際は 13 件だった。計画を数字で握る前に、実装側で測定する方が早い
```

### 問題点
同じ「50 → 13」のエピソードが本文（L112）と「学び」（L117）の両方でほぼ同一の文で繰り返されている。Zenn 読みやすさ観点の「冗長な繰り返し」削除候補に該当。学びは抽象化された教訓に絞り、具体数字は本文側に置くのが読みやすい。

### 提案 / Severity: Low / 採否: Recommended
学び側を抽象化し、本文側に具体数字を寄せる。

```
（修正案：L117）
- **計画の数字は実測で検証する** — `excludedTags` のように planner 側で先に絞られている要因があると、机上の audit と実測が大きく食い違う。計画を数字で固める前に、実装側で 1 度測ってから握る。
```

---

### 該当箇所 9
L78 （「ローカルで eval が exit 0」の運用が読者に転用しづらい）

```
ローカルで eval が exit 0 になることを確認してから push する運用に揃えた。CI 通過のみに頼らない、というのが地味に効いている。
```

### 問題点
- River Review リポジトリ内部の運用ルールで、読者が自分のリポジトリに持ち帰る際に「どの eval を、どのタイミングで、どう exit 0 を確認するか」が抽象的すぎる。読者ニーズ充足の観点で具体性が足りない。
- 「地味に効いている」は Zenn の narrative としては良いが、その前段の「なぜローカル eval が CI より効くのか」（feedback サイクル短縮 / planner eval が flaky 検出向け など）が省略されているため、説得力が弱い。

### 提案 / Severity: Medium / 採否: Recommended
具体コマンドと、なぜローカル先行が効くのかを 1 文足す。

```
（修正案）
ローカルで `npm run eval:fixtures` と `npm run planner:eval:dataset` が exit 0 になることを確認してから push する運用に揃えた。CI 通過だけに頼らずローカルを先に通す理由は、planner eval が non-determinism を含むため、CI でだけ落ちる回帰を「push 後に気づく」と feedback サイクルが伸びるからだ。
```

---

### 該当箇所 10
L120 （まとめ・締めの一文が弱く、タイトルと呼応していない）

```
- **release-please は chore 系コミットを版上げ対象から外す** — docs / chore PR の連続マージで version が動かないのは仕様。今期は feat 系が並んだので 4 リリースに着地した

## 関連リンク
```

### 問題点
記事タイトル「Skill Improvement Loop と applyTo Scoping を整備した半月の記録」と呼応する「半月で何を持ち帰れたか」を 1 文で再掲する締めがなく、最後の学びが release-please の機械的な仕様で終わっている。Zenn 読みやすさ観点 7（まとめ前の主張再掲）違反。

### 提案 / Severity: Medium / 採否: Recommended
「学び」の末尾に 1 段落、本記事の主張を再掲して関連リンクへ橋渡しする。

```
（追記案：L120 と L122 のあいだ）
半月の整備で River Review は「レビューを返すだけ」から「フィードバックを仕組みに還元する」エージェントへ移った。Improvement Loop の 9 ステップと applyTo の dir-bounded ルールは、他の AI コードレビュー基盤にもそのまま転用できるはずで、参考リンクを以下に置いておく。
```

---

## 総合評価

### 良い点
- **半月分の作業ログを「Improvement Loop」という一貫した軸で再構成できている**。リリース表 → Epic → eval → applyTo → 学び の章立ては、AI 駆動開発に関心のあるエンジニア層が一読で全体像を掴める構造。
- **数値で語る規律**（`coverage=1.0 / top1Match=1.0` / 23 cases / 13 skill / 50→13）が一貫しており、技術記事としての信頼性が高い。
- **feedback type 7 種 → 主 destination / 必須 eval コマンドの対応表**は、読者が自分のレビュー基盤に転用するときに最も価値のある一覧で、記事の中核として機能している。
- 関連リンクが GitHub の `main` を直接指しているため、読者がそのまま実装を辿れる。

### 改善点
- **冒頭の AI ドラフト宣言が公開時に残ると E-E-A-T を毀損**する。`published: true` 切替時の必須整備（指摘 1）。
- **専門用語・固有名詞の初登場時の意味補足が弱い**（指摘 2, 4）。`Improvement Loop OS` `Pre-execution Gate` `silent` `upstream/midstream/downstream` あたりは記事内で完結する説明があると一気に読みやすくなる。
- **PR 番号の整合性**（指摘 7）は技術記事の信頼性に直結。Epic / 実装 PR / 関連 issue の関係を 1 度だけ明示する。
- **本文と「学び」の重複**（指摘 8）と **締めの弱さ**（指摘 10）で、読後の印象が散漫。
- 表の **ヘッダ表記揺れ**（指摘 5）と **箇条書きの締め揺れ**（指摘 6）は編集者視点で公開前に揃える。

### 推奨アクション
1. **公開前の Must-fix**: L9 / L131 の AI ドラフト宣言の処遇決定 → TL;DR の専門用語補足（指摘 1, 2）→ PR 番号の関係明示（指摘 7）。
2. **Recommended**: 専門用語の副題追加（指摘 4）/ feedback 表のヘッダ統一（指摘 5）/ ローカル eval 運用の具体化（指摘 9）/ まとめの主張再掲（指摘 10）。
3. **想定読者ブロック追加**: TL;DR の前後に `:::message` で「想定読者: AI コードレビュー基盤を Skill 単位で運用しているエンジニア / 前提: River Review の概念に未習熟でも読めるよう本文中で補足する」と置くと、初見読者の離脱を抑えられる。
4. **Optional**: 期間表記の起点（指摘 3）/ glob 表記揺れ（指摘 6）/ 本文と学びの重複（指摘 8）を整える。

### SEO観点での改善提案
- **タイトル**: 「River Review v0.30.0 → v0.33.0：Skill Improvement Loop と applyTo Scoping を整備した半月の記録」は固有名詞密度が高く、検索意図とのマッチが「river-review を既に知っている読者」に偏る。サブタイトルに **「AI コードレビュー基盤の改善ループ設計」** など汎用検索クエリを足すと、River Review 未認知層にも届きやすい。
- **emoji**: `🌊` は「River」と整合しているので維持で良い。
- **topics**: `['ai', 'codereview', 'AgentSkills', 'AI駆動開発', 'oss']` は妥当。`ClaudeCode` / `eval` / `promptfoo` のいずれかを足すと、ツール検索からの流入が見込める。
- **冒頭 200 字**: 検索結果スニペット用に、TL;DR の 1 行目を「River Review を Improvement Loop OS に再定義した半月の作業を整理する」と能動態で書き直すと、検索クリック率が上がりやすい。
- **見出しキーワード**: `## 何が変わったか（high-level）` の `(high-level)` は SEO 上ノイズ。`## 半月で変わったこと（全体像）` のように日本語に揃えると、検索インデックスとマッチしやすい。

---

## 公開判断

**判定: NEEDS_FIX**

- Must-fix（指摘 1, 2, 7）が 3 件残っているため、`published: true` 切替前に解消が必要。
- Must-fix を解消し、Recommended のうち少なくとも指摘 4・5・10 を反映できれば READY 相当と判断可能。
- BLOCKED 要因（事実誤認や規約違反）は現時点で検出していない。指摘 7 の PR 番号は事実確認次第で軽微に解消できる範囲。

---

*レビュー実施者: @claude*
*レビュー実施日: 2026-05-08*

---

## 2026-05-20 再判定（read-only）

12日経過時点の状況再確認。記事は 131行 → 128行に微圧縮（最終更新 2026-05-08）。

### Must-fix の現状

| 指摘 | 内容 | 反映状況 |
|---|---|---|
| 1 | L9/L131 の AI ドラフト宣言削除 | ✅ **解消**（L8 で frontmatter 終了直後に TL;DR が始まり、宣言ブロックは残っていない。L120-128 も「関連リンク」で締めており末尾宣言なし）|
| 2 | TL;DR の専門用語補足 | △ **部分対応**（「誤ルーティング」「routing 用の評価セット」が付与されたが、`Improvement Loop OS` の日本語補足が未挿入）|
| 7 | PR 番号の関係明示 | 未確認（本文中で要再確認）|

### 鮮度劣化リスク

- v0.33.0 リリース直後の記録（半月分）として書かれているが、12日経過し v0.34+ の可能性あり
- 公開前に「2026-05-08 時点の作業ログ」と日付明示することで、鮮度劣化を限定的に止められる

### 更新後の判定: **READY（条件付き）**

公開ブロッカーは解消されているが、以下を満たして初めて READY 相当:

1. TL;DR L11 の「Improvement Loop OS」初出に1語の日本語補足を追加（例:「Improvement Loop OS（レビュー結果を仕組みへ還元するループ）」）
2. 冒頭または末尾に「2026-05-08 時点」の時点明示を1行追加
3. PR 番号関係（指摘7）を最終確認

これらを反映すれば NEEDS_FIX → READY に格上げ可能。Must-fix 件数は 3→1〜2 に減少。

### 公開推奨タイミング

- デザイン三部作・PlanGate と論点が独立するため、`docs/publish-queue.md` で別枠の締切設定が可能
- 鮮度劣化を考慮し、**早期公開推奨**（公開日が遅れるほど v0.33 の鮮度が落ちる）

*再判定実施者: @claude*
*再判定日: 2026-05-20*
