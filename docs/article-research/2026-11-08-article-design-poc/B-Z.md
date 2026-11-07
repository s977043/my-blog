# B-Z: 方式 B（Treatment）による Fixture Z 構成案

## 1. 固定した入力

| 項目 | 値 |
| --- | --- |
| リポジトリ | /Users/user/Documents/GitHub/my-blog |
| 基準 SHA | fdc33406836f8ea3642dd385f63fca58a4bbd2a6（`git show fdc3340:<path>` で読んだ） |
| 対象記事 | articles/river-review-judgment-placement.md（593 行、published: true） |
| 共通ルール | AGENTS.md、.claude/skills/tech-blog-writing/SKILL.md、docs/content-channel-strategy.md、articles/README.md |
| 方式 B の追加入力 | .claude/skills/talk-story/SKILL.md、.claude/skills/talk-design/SKILL.md、talks/DESIGN.md（冒頭 80 行） |

## 2. 現行構成のベースライン

| # | 見出し | 1 行要旨 |
| --- | --- | --- |
| 0 | :::message（得られること） | 得られること 3 点、対象読者、検証 commit、扱わない範囲 |
| 1 | ## TL;DR | 4 層の判定フロー、Review→Learn→Codify の流れ、Promotion は未完成という注記 |
| 2 | ## なぜAIコードレビューの「判断配置」が必要なのか | Swizec 氏の記事を起点に「レビューできる≠すべき」、性質の違う判断 5 例 |
| 3 | ## 設計上の制約：全部をLintにも、全部をAIにも寄せない | 5 つの制約（既存 Checker 再実装しない／責任委譲しない／Trust Boundary／Promotion 等） |
| 4 | ## Judgment Placement：4つの判断層 | 4 層の表 |
| 4.1 | ### Deterministic | 型・test・schema 等は LLM に再判定させない |
| 4.2 | ### Heuristic | temporary-without-exit の条件と nit 既定 severity、後半への前方参照 |
| 4.3 | ### Agentic Review | Plan と Diff の整合など、複数 Artifact を扱う層 |
| 4.4 | ### Human Judgment | 責任を伴う判断、Finding→Caller/Human の図、MERGE_READY 記事リンク |
| 4.5 | ### 判断層と変更リスクは別の軸 | Judgment Placement と Human Judgment Focus（崖／丘／原っぱ）の 2 軸 |
| 5 | ## 実装1：評価方式をSkill Schemaに持たせる | evaluationType、deterministicGate、strict_block は AI が解除しない |
| 6 | ## 実装2：Static AnalysisとAI Reviewの責務を分ける | 静的解析と AI の分担、false positive は canary test へ |
| 7 | ## 実装3：Deterministic CommandにもTrust Boundaryを置く | host-trusted allowlist、sandbox、feature gate 内であること |
| 8 | ## 検証対象commitの実装例：AI Reviewerの判断自体をDeterministicな骨格で囲う | finding-critic.mjs の Phase 1a、fail-safe、LLM 境界は外 |
| 9 | ## Review → Rule Promotion | Promotion の判定フロー、関連記事リンク |
| 9.1 | ### 実例：temporary codeの撤去条件をHeuristicへ切り出す | PR #1788 / #1811、canary test、自動生成は未実装 |
| 10 | ## Review Judgment as Code | 判断基準を repo-owned Skill に置く、関連記事 3 本 |
| 11 | ## 4層にはそれぞれ別の失敗モードがある | 層ごとの強みと失敗モードの表 |
| 11.1 | ### Promotionを見送る条件 | 明文化できない、意味を失う等の 4 条件 |
| 12 | ## 検証結果：どこまで実装済みか | 実装状態の表、効果は未計測、公開後の進展 message |
| 13 | ## 最小導入：レビュー観点を1つ分類してみる | 6 ステップと「本当に LLM が必要か」 |
| 14 | ## まとめ | 4 層の再掲、資産化の結論 |
| 15 | ## 参考 | Book、外部記事、River Review の docs・コード・PR |

## 3. 本文作成前の設計（方式 B）

### 3.1 Article Contract Snapshot

| 項目 | 内容（記事から抽出。変更しない） |
| --- | --- |
| reader | Claude Code / Codex でレビュー自動化を進め、品質とコストの釣り合いに悩む開発者 |
| reader_problem | AI レビューを広げるとコストとノイズが増える。どの判断を誰に任せればよいか分からない |
| central_claim | Reviewer を増やすより、判断を Deterministic / Heuristic / Agentic / Human のどこに置くかを先に決める。繰り返す判断は安全に移せる場合だけ再現可能な層へ移す |
| evidence | River Review commit 56e0ae4 の Skill Schema、deterministic-gate、orchestrator、finding-critic.mjs、PR #1788 / #1811、検証結果表 |
| out_of_scope | モデル間の精度比較、コスト削減率、Finding から Lint Rule を自動生成する手順 |
| channel | Zenn tech（設計判断と実装詳細のストック記事、逆引き用途） |

### 3.2 Story Architecture

talk-story の 8 要素を記事向けに当てはめた。Zenn の参照記事は「先に地図が要る場」にあたるので、Reveal Strategy の例外として TL;DR で全体像を先に出す現行方針を保つ。

| 要素 | 担う節（案） | 備考 |
| --- | --- | --- |
| Hook | message、TL;DR | 現行どおり |
| Problem | なぜ判断配置が必要か | 現行どおり |
| Model | 4 つの判断層、2 軸 | 制約の節をこの後ろへ移す（後述） |
| Evidence | 実装 1〜4 | 見出しの並びを揃える |
| Tension | Promotion、失敗モード、見送る条件 | 現行は Review Judgment as Code が間に入り、緊張が切れる |
| Insight | Review Judgment as Code との関係 | 「何を判断するか」と「どこで判断するか」の対比として後ろへ置く |
| Application | 検証結果、最小導入 | 現行どおり |
| Takeaway | まとめ | TL;DR へ戻る形が既にある |

### 3.3 Section Map（案の並び）

| 新# | H2 | 役割 | 読者の問い | 主張 | 根拠 | 前後接続 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | message | 契約 | 自分向けか、どこまで信じてよいか | 得られること・範囲 | 検証 commit | → TL;DR |
| 1 | TL;DR | 地図 | 要するに何をするのか | 4 層と Promotion | — | → なぜ |
| 2 | なぜ判断配置が必要か | Problem | 全部 AI に見せては駄目なのか | レビューできる≠すべき | Swizec 氏の記事、5 例 | 5 例は次節の 4 層で回収する |
| 3 | 4つの判断層 | Model | どう分けるのか | 4 層と 2 軸 | 表、River Review docs | → 制約 |
| 4 | 設計上の制約 | Model の境界 | 分け方の前提は何か | 5 制約 | — | 各制約が実装 1〜4 のどこに対応するかを示す |
| 5 | 実装1：Skill Schema | Evidence | 宣言だけか | evaluationType と strict_block | schema | → 実装2 |
| 6 | 実装2：Static Analysis と AI Review | Evidence | Linter と AI が重ならないか | 責務分離 | review rule | → 実装3 |
| 7 | 実装3：Trust Boundary | Evidence | Deterministic なら安全か | 実行条件まで含めて Gate | orchestrator、feature gate | → 実装4 |
| 8 | 実装4：AI Reviewer の判断を Deterministic な骨格で囲う | Evidence | AI レビューの中ではどうか | 内部でも判断を分解 | finding-critic.mjs | → Promotion |
| 9 | Review → Rule Promotion（H3: 実例、見送る条件） | Tension | 分類した後はどうするのか | 移せるときだけ移す | PR #1788 / #1811 | → 失敗モード |
| 10 | 4層にはそれぞれ別の失敗モードがある | Tension | Deterministic に寄せれば成熟か | 層ごとに失敗が違う | 表 | → RJaC |
| 11 | Review Judgment as Code との関係 | Insight | 判断基準そのものはどこに置くか | 何を判断するか／どこで判断するか | — | 関連記事リンクをここに集める |
| 12 | 検証結果 | Application | どこまで実装済みか | 状態表、効果は未計測 | commit 56e0ae4 | → 最小導入 |
| 13 | 最小導入 | Application | 自分のチームでは何から始めるか | 1 観点を分類 | — | → まとめ |
| 14 | まとめ | Takeaway | — | TL;DR へ戻る | — | — |
| 15 | 参考 | 参照 | — | — | — | — |

### 3.4 Editorial Design

- 情報階層: 各 H2 の主張を太字 1 文にする現行の書き方（「機械的に確認できた事実を、確率的推論で上書きしない」など）は、talks/DESIGN.md の「1 枚に Primary 1 つ」に近い。変えない。
- 図と本文の役割: text 図が 9 つあり、どれも「流れ」を担う。本文は「なぜその順か」を担っていて、役割の重なりは少ない。ただし Heuristic の H3 と Promotion の実例で temporary-without-exit の検出条件の説明が 2 回出る。条件は実例側に一本化する。
- 段階的開示: TL;DR で 4 層の地図を出し、詳細は H3 で開く現行の構造を保つ。Promotion の図（判定フロー → 実例の流れ → 改善ループ）は既に段階的に示されている。
- モバイル: finding-critic の罫線つき text 図（┌─┴─┐）は狭い画面で折り返して崩れやすい。罫線を外し、インデントだけの木構造にする案を出す（内容は変えない）。4 列の表は 2 つあるが、セル内の文が短いので許容範囲。

## 4. 構成改善案（新しい見出し並び）

```text
:::message（NO_CHANGE）
## TL;DR（NO_CHANGE）
## なぜAIコードレビューの「判断配置」が必要なのか（小変更）
## Judgment Placement：4つの判断層（移動：制約より前へ）
  ### Deterministic：証明できるならAIに聞かない（NO_CHANGE）
  ### Heuristic：完全な証明までは要らない（縮約）
  ### Agentic Review：意味理解が必要になってからLLMを使う（NO_CHANGE）
  ### Human Judgment：責任までAIへ渡さない（NO_CHANGE）
  ### 判断層と変更リスクは別の軸（NO_CHANGE）
## 設計上の制約：全部をLintにも、全部をAIにも寄せない（移動：4層の後へ）
## 実装1：評価方式をSkill Schemaに持たせる（NO_CHANGE）
## 実装2：Static AnalysisとAI Reviewの責務を分ける（NO_CHANGE）
## 実装3：Deterministic CommandにもTrust Boundaryを置く（NO_CHANGE）
## 実装4：AI Reviewerの判断自体をDeterministicな骨格で囲う（見出し変更）
## Review → Rule Promotion：同じ判断を何度もAIへさせない
  ### 実例：temporary codeの撤去条件をHeuristicへ切り出す（NO_CHANGE）
  ### Promotionを見送る条件（移動：失敗モードの節から）
## 4層にはそれぞれ別の失敗モードがある（移動：Promotion の直後へ）
## Review Judgment as Code：判断基準をProviderから切り離す（移動：失敗モードの後へ）
## 検証結果：どこまで実装済みか（NO_CHANGE、公開後の進展 message も保持）
## 最小導入：レビュー観点を1つ分類してみる（NO_CHANGE）
## まとめ（NO_CHANGE）
## 参考（NO_CHANGE）
```

各節の変更内容と理由:

| 節 | 変更 | 理由 |
| --- | --- | --- |
| なぜ判断配置が必要か | 5 例の箇条書きの直後に「この 5 つは次節の 4 層に振り分けられる」の 1 文を足すか、4 層の表の後に 5 例との対応を 1 行ずつ示す | Problem で出した例が Model で回収されず、読者が自分で対応付ける必要がある |
| 4つの判断層／設計上の制約 | 順序を入れ替える | 制約 4（Trust Boundary）と 5（Promotion）が、4 層の定義より前に未定義語として出る。Model を見せてから境界条件を置くほうが因果を追いやすい |
| Heuristic（H3） | 検出条件の列挙（TODO / FIXME ... の文）を削り、「明示パターンから候補を絞り、nit で gate を止めない」の要点と後半への参照だけにする | 同じ条件が Promotion の実例でもう一度出る |
| 検証対象commitの実装例 | 見出しを「実装4：…」に揃える。「検証対象 commit 時点」は本文冒頭の文で既に言っているので見出しからは外す | 実装 1〜3 と同列の Evidence なのに見出しの型だけ違い、目次で別種の節に見える |
| Promotionを見送る条件 | 失敗モードの H3 から Promotion の H3 へ移す | 内容は Promotion の判断条件。失敗モードの表とは問いが違う |
| 失敗モード | Promotion の直後に置く | 「Deterministic に寄せるほど成熟ではない」は Promotion への反論で、Tension として続けて読ませたい |
| Review Judgment as Code | 失敗モードの後、検証結果の前へ移す | 現行は Promotion と失敗モードの間に入り、Promotion の議論が分断される。関連記事 3 本のリンクもここに集まっているので、本論が終わった後の「位置づけ」の節として置く |
| finding-critic の図 | 罫線を外してインデントの木構造にする（ラベルと分岐は変えない） | モバイルでの崩れ対策 |

NO_CHANGE: message、TL;DR、Deterministic、Agentic Review、Human Judgment、2 軸、実装1〜3、Promotion 実例、検証結果（公開後の進展 message 含む）、最小導入、まとめ、参考。

## 5. Keep / Move / Cut

| 区分 | 対象 | 理由 |
| --- | --- | --- |
| Keep | message と TL;DR の先出し | Zenn の参照記事は先に地図が要る。talk-story の Reveal Strategy の例外にあたる |
| Keep | 検証結果の表と「効果は未計測」の段落 | 実装状態と主張範囲の境界を担う。数値・状態は変えない |
| Keep | 公開後の進展 message | commit 固定の方針と、その後の状態を分けて示している |
| Keep | まとめの 4 層再掲 | Takeaway が TL;DR へ戻る形になっている |
| Keep | 本文中の Zenn 自記事リンク（MERGE_READY、feedback-ops、core-design、team-topology、riskmap） | AGENTS.md の同一プラットフォーム参照ルールで、文脈内に置いてよい |
| Keep | 参考の note リンク | 末尾リンク集にあり、クロスプラットフォーム規約どおり |
| Move | 設計上の制約 → 4 層の後 | 未定義語の先出しを解消する |
| Move | Promotionを見送る条件 → Promotion の H3 | 問いの所属を揃える |
| Move | 失敗モード → Promotion の直後 | Tension を連続させる |
| Move | Review Judgment as Code → 失敗モードの後 | Promotion の分断を解消し、位置づけの節にする |
| Cut | Heuristic H3 の検出条件の列挙 | Promotion 実例と重複する。実例側に残すので情報は失われない |
| Cut | 見出しの「検証対象commitの」 | 本文側で既に言っている。見出しを実装 1〜3 と揃える |

## 6. 著者判断に回す案

1. Review Judgment as Code の節を本記事に残すか。中心主張（判断の配置）とは別の概念で、core-design 記事の説明と重なる可能性がある。残すなら位置の移動だけ、削るなら 2〜3 文と関連記事リンクだけにする。概念の扱いを変える判断になるため、著者が決める。
2. 「なぜ」の 5 例と 4 層の対応を本文に明記するか。例の層への割り当て（例: 認証境界の変更は Human）は記事の中に既に書かれているので、新しい主張にはならない。ただし対応表として示すと読み方の主軸が変わるため、確認を取る。
3. 公開済み記事（published: true）なので、構成の移動を反映するかどうか自体を著者が決める。反映する場合は main → release/zenn の既存 update 単独 PR で流す（AGENTS.md の公開ルール）。

## 7. 自己申告

- 所要時間の目安: 約 15 分
- 読んだファイル（すべて fdc3340 時点）:
  - articles/river-review-judgment-placement.md（全文）
  - .claude/skills/talk-story/SKILL.md（全文）
  - .claude/skills/talk-design/SKILL.md（全文）
  - talks/DESIGN.md（冒頭 80 行。Philosophy、Quality Axes、Visual Hierarchy、Typography まで）
  - .claude/skills/tech-blog-writing/SKILL.md（見出しと箇条書きのみ。references/ は未読）
  - articles/README.md（見出しと箇条書きのみ）
  - docs/content-channel-strategy.md（Zenn を含む行のみ）
  - AGENTS.md（セッションのコンテキストとして読み込み済み）
- 読んでいないもの: docs/article-guides/zenn-structure-best-practices.md、talks/_templates/design.md、scratchpad/poc/ の他の出力ファイル
