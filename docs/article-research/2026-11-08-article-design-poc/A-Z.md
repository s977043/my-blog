# 方式 A（Control）: Fixture Z 構成改善案

## 1. 固定した入力

- リポジトリ: <repo>/
- 基準: origin/main = fdc33406836f8ea3642dd385f63fca58a4bbd2a6（`git -C ... show fdc3340:<path>` で読んだ）
- 対象: `articles/river-review-judgment-placement.md`（593 行、published: true）
- 共通ルール: `AGENTS.md`、`.claude/skills/tech-blog-writing/SKILL.md`、`docs/content-channel-strategy.md`、`articles/README.md`
- talk-story / talk-design / talks/DESIGN.md は読んでいない

固定した中心主張（変更しない）: 「AIコードレビューでは、Reviewer を増やすより、判断をどの層（Deterministic / Heuristic / Agentic / Human）へ置くかを先に決める。繰り返す判断は再現可能な層へ移す。ただし Promotion の自動化は未実装」。検証 commit `56e0ae4`、実装状態の表、PR #1788 / #1811、inner round 2 / hard cap 5 などの数値・状態はすべてそのまま使う。

## 2. 現行構成のベースライン

| # | 見出し | 1 行要旨 |
| --- | --- | --- |
| 0 | :::message（得られること） | 対象読者、検証 commit、書かない範囲 |
| 1 | ## TL;DR | 4 層の判定フローと Review→Codify の流れ。Promotion は未完成と明記 |
| 2 | ## なぜ「判断配置」が必要か | Swizec 氏の記事が起点。レビューには性質の違う判断が混ざる |
| 3 | ## 設計上の制約 | 5 つの制約（既存 Checker を再実装しない、責任を委譲しない等） |
| 4 | ## Judgment Placement：4つの判断層 | 4 層の表 |
| 4.1 | ### Deterministic | 機械判定は LLM に再判定させない |
| 4.2 | ### Heuristic | 候補抽出。temporary-without-exit の条件と severity nit を説明 |
| 4.3 | ### Agentic Review | Plan と Diff の整合など。複数 Artifact を入力にする |
| 4.4 | ### Human Judgment | 責任を伴う判断。merge は Caller / Human。関連記事リンク |
| 4.5 | ### 判断層と変更リスクは別の軸 | Judgment Placement と Human Judgment Focus（崖/丘/原っぱ）の 2 軸 |
| 5 | ## 実装1：Skill Schema | evaluationType、deterministicGate、strict_block は AI が解除しない |
| 6 | ## 実装2：Static Analysis と AI Review | 責務を分ける。false positive は canary test で防ぐ |
| 7 | ## 実装3：Trust Boundary | host-trusted allowlist、sandbox、feature gate の内側にある |
| 8 | ## 検証対象commitの実装例：finding-critic | Phase 1a の deterministic skeleton。fail-safe の一覧 |
| 9 | ## Review → Rule Promotion | 判定フロー、関連記事リンク |
| 9.1 | ### 実例：temporary code を Heuristic へ | 条件の再掲、PR #1788 / #1811、canary test、自動生成は未実装 |
| 10 | ## Review Judgment as Code | 判断基準を repo-owned Skill に置く。関連記事リンク 3 本 |
| 11 | ## 4層にはそれぞれ別の失敗モード | 失敗モードの表。移すのは安全性等を保てるときだけ |
| 11.1 | ### Promotionを見送る条件 | 見送る 4 条件 |
| 12 | ## 検証結果：どこまで実装済みか | 実装状態の表、効果は計測していない、公開後の進展 message |
| 13 | ## 最小導入 | 観点を 1 つ選んで 6 ステップで分類する |
| 14 | ## まとめ | 4 層の要約と目指す状態 |
| 15 | ## 参考 | 外部リンク、検証 commit のファイル、note 記事 |

## 3. 構成改善案

### 診断（共通ルールに照らした問題点）

1. **同じ内容が 2 か所にある**: temporary-without-exit の検出条件が 4.2 と 9.1 でほぼ同じ文で書かれている。4.2 には「後半で扱います」という予告まで付いている。
2. **Promotion の話が 3 か所に分かれている**: 9（Promotion）→ 10（Review Judgment as Code）→ 11.1（見送る条件）の順なので、「移す条件」と「移さない条件」の間に別の概念が挟まる。
3. **失敗モードの表（11）が後ろにある**: 4 層の性質の説明なのに、実装とPromotionの後に出てくる。「Deterministic へ寄せるほど成熟、ではない」という前提は、Promotion を読む前に要る。
4. **finding-critic（8）の位置づけが見出しから分からない**: 内容は「AI レビューの内部でも判断を分ける」4 つ目の実装例だが、実装1〜3 と見出しの形が揃っていない。
5. **10 節の後半が関連記事 3 本の紹介になっている**: content-channel-strategy の「中心主張を薄める追記は削る」に照らすと、本文の流れが止まる。同一媒体リンクは本文内に置いてよい（AGENTS.md）ので、削除ではなく本数と位置を絞る。

### 新しい見出しの並び

| 新 # | 見出し | 要旨 | 変更 |
| --- | --- | --- | --- |
| 0 | :::message | 現行のまま | NO_CHANGE |
| 1 | ## TL;DR | 現行のまま | NO_CHANGE |
| 2 | ## なぜAIコードレビューの「判断配置」が必要なのか | 現行のまま | NO_CHANGE |
| 3 | ## 設計上の制約：全部をLintにも、全部をAIにも寄せない | 現行のまま | NO_CHANGE |
| 4 | ## Judgment Placement：4つの判断層 | 4 層の表 | NO_CHANGE |
| 4.1 | ### Deterministic | 現行のまま | NO_CHANGE |
| 4.2 | ### Heuristic | temporary-without-exit は名前と「severity nit で gate を止めない」だけ残す。検出条件の列挙は 7.1 に一本化する | 短縮（Move） |
| 4.3 | ### Agentic Review | 現行のまま | NO_CHANGE |
| 4.4 | ### Human Judgment | 現行のまま（ai-merge-ready 記事への文脈リンクも残す） | NO_CHANGE |
| 4.5 | ### 判断層と変更リスクは別の軸 | 現行のまま | NO_CHANGE |
| 4.6 | ### 4層にはそれぞれ別の失敗モードがある（旧 11 の表と直後の 2 段落） | 「Deterministic ほど成熟、ではない」を、4 層の説明の締めに置く | Move（H2→H3） |
| 5 | ## 実装1：評価方式をSkill Schemaに持たせる | 現行のまま | NO_CHANGE |
| 6 | ## 実装2：Static AnalysisとAI Reviewの責務を分ける | 現行のまま | NO_CHANGE |
| 7 | ## 実装3：Deterministic CommandにもTrust Boundaryを置く | 現行のまま | NO_CHANGE |
| 8 | ## 実装4：AI Reviewerの判断自体をDeterministicな骨格で囲う（旧 8） | 内容は現行のまま。見出しの頭を実装1〜3 と揃え、「検証対象commitの」は本文の 1 文目へ移す。Phase 1a 止まりの注記はそのまま残す | 見出しのみ変更 |
| 9 | ## Review → Rule Promotion：同じ判断を何度もAIへさせない | 現行のまま | NO_CHANGE |
| 9.1 | ### 実例：temporary codeの撤去条件をHeuristicへ切り出す | 検出条件はここだけに書く | NO_CHANGE（4.2 から吸収） |
| 9.2 | ### Promotionを見送る条件（旧 11.1） | 「移す条件」の直後に「移さない条件」を置く | Move |
| 10 | ## Review Judgment as Code：判断基準をProviderから切り離す | 前半（定義と、Judgment Placement との違いの 1 文）は残す。関連記事 3 本は、river-review-core-design の 1 本を本文に残し、残り 2 本（agent-team-topology、riskmap-first-match）は 14 のまとめの後か参考へ移す | 短縮（Move） |
| 11 | ## 検証結果：どこまで実装済みか | 現行のまま（表、効果は計測していない、公開後の進展） | NO_CHANGE |
| 12 | ## 最小導入：レビュー観点を1つ分類してみる | 現行のまま | NO_CHANGE |
| 13 | ## まとめ | 現行のまま | NO_CHANGE |
| 14 | ## 参考 | 10 から移した同一媒体リンク 2 本を「関連記事」として足す（Zenn 内の相対リンク形式のまま） | 追記 |

### 変更理由のまとめ

- 読者の問いの順に並べる: 「何層あるか → 各層の弱点は何か → どう実装したか → 層をどう移すか（移さないか）→ どこまでできているか → 自分はどう始めるか」。現行は「弱点」と「移さない条件」が実装状態の直前に来ていて、問いの順が前後している。
- 重複を消す: temporary-without-exit の条件を 1 か所にする。
- 主張・数値・実装状態の記述は変えない。移動と見出しの変更だけで済ませる。

## 4. Keep / Move / Cut

| 区分 | 対象 | 理由 |
| --- | --- | --- |
| Keep | TL;DR の 2 つのフロー図と「Promotion は未完成」の注記 | 中心主張と実装の境界を最初に示している |
| Keep | 実装1〜3、finding-critic の fail-safe 一覧と数値（2 / 5） | Zenn の役割（実装詳細・設計判断）の中核 |
| Keep | 検証結果の表、「効果は計測していない」の段落、公開後の進展 message | 実装状態と主張の範囲を分けている。追試性の根拠 |
| Keep | 最小導入の 6 ステップ | River Review を使わない読者の持ち帰り |
| Move | 旧 11「失敗モード」→ 4 層の節の末尾 H3 | 4 層の性質の説明なので、Promotion より前に要る |
| Move | 旧 11.1「見送る条件」→ Promotion の節内 | 移す条件と移さない条件を隣に置く |
| Move | 4.2 の temporary-without-exit 条件の列挙 → 9.1 へ一本化 | 同じ文が 2 回出る。予告文も不要になる |
| Move | 10 節の関連記事 2 本 → 参考（関連記事） | 本文の流れが止まるため。同一媒体リンクなので削除はしない |
| Cut | 4.2 の「この観点をHeuristicへ切り出した経緯は、後半のPromotionの実例で扱います。」 | 一本化すると予告が不要 |
| Cut 候補（軽微） | 10 節の「この判断基準を中心に置いたとき……」以外の導入句 | 移動後に残る接続文を 1 文に縮める |

## 5. 著者判断に回す案

1. **10 節「Review Judgment as Code」を本文から外すか**: この記事の主題は「どこで判断するか」で、RJaC は「何を判断するか」の別概念。参考リンクへの 1 行に縮めると記事が締まるが、River Review の中心概念との関係を示す役割もあるため、主張の範囲に関わる。著者判断とする。推奨は「現行どおり残し、関連記事だけ移す」。
2. **関連記事リンクの本数**: AGENTS.md は同一媒体の文脈内リンクを許容し、上限もない。10 節から 2 本を参考へ移すのは読みやすさのための提案で、規約違反の修正ではない。採否は著者に任せる。
3. **published 記事であること**: `published: true` の記事の変更は ⚠️ 付き PR で著者承認が要る（AGENTS.md 禁止事項）。既存 update は単独 PR で release/zenn へ流す。
4. （構成外の気づき）末尾の「普段は X で……発信している。」だけ常体。本文は敬体。構成案の範囲外なので記録のみ。

## 6. 自己申告

- 所要時間の目安: 約 10 分
- 読んだファイル（すべて fdc3340 時点）:
  - `articles/river-review-judgment-placement.md`（全文）
  - `articles/README.md`
  - `.claude/skills/tech-blog-writing/SKILL.md`（references/ 配下は読んでいない）
  - `docs/content-channel-strategy.md`（冒頭・編集原則・Channel roles 付近のみ）
  - `AGENTS.md`（セッションのコンテキストで読んだもの）
- 読んでいない: `docs/article-guides/zenn-structure-best-practices.md`（brief の共通ルールに挙がっていないため）、talk-* 系
