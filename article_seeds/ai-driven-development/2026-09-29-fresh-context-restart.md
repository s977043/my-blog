---
seed_id: seed-20260929-fresh-context-restart
title: "いつ会話を捨てて、新しいセッションで始めるか"
date: 2026-09-29
status: seed
topics:
  - ai-driven-development
  - plangate
  - context-management
  - claude-code
source: external
source_url: https://github.com/s977043/plangate/pull/1411
source_ref: "https://github.com/s977043/plangate/issues/1410 ; https://code.claude.com/docs/ja/sessions ; https://code.claude.com/docs/en/best-practices"
evidence_status: verified
promoted_to:
article_type_candidates:
  - analysis
  - insight
---

# いつ会話を捨てて、新しいセッションで始めるか

## 観測事実

- PlanGate の issue #1410 と PR #1411（2026-09-29 に main へマージ）で、Context Lifecycle（会話履歴を持ち越さず、正本から新しいコンテキストで再開する方針）が `docs/ai/context-lifecycle.md` と `working-context` / `context-packager` スキルに入った
- 同方針は「いつ切るか」を trigger として列挙している。必須は worker / agent / model / runtime の変更、独立レビューの開始、worker 間の引き継ぎ、外部待ち・使用量上限による意図的な中断。推奨は圧縮やコンテキスト逼迫の直前、フェーズ遷移で必要な作業セットが変わるとき、修理・レビューのループで古い議論が溜まったとき
- 持ち越すものは段階で決めている。常に読むのは L0（`INDEX.md` と `current-state.md`）、次にフェーズが必要とする L1（Plan など）、evidence・decision-log・履歴（L2/L3）は具体的な問いがあるときだけ
- 持ち越さないものも明記している（隠れた思考過程、会話ログそのもの、evidence で代替できる生のツール出力、秘密情報）
- Claude Code 公式ドキュメントは、コンテキストが埋まるほど性能が落ちること、無関係なタスクの間で `/clear` すること、同じ問題で2回を超えて修正したら `/clear` して学びを入れたプロンプトで始め直すことを勧めている

## 自分の解釈

「コンテキストが長くなったら切る」だけだと判断基準が曖昧になる。PlanGate の方針は、トークン量ではなく**作業の境界**（誰が・何の役割で続きを担うかが変わる点）を切り目にしている。切っても困らないのは、判断と進捗が会話ではなく Plan・`current-state.md`・evidence に書かれているから。

## 違和感 / Reader Problem

Claude Code や Codex で長い作業を続けると、どこでセッションを切るべきか迷う。切ると文脈が消えそうで怖く、切らないと古い判断や失敗した試行を引きずる。`/clear` や `/compact` の使い方は公式ドキュメントにあるが、「どの時点で切るか」「切る前に何を書き残すか」はチームで決める必要がある。

## 今の仮説

- 切るかどうかの判断は、トークン量より「役割が変わるか」「待ちが入るか」「古い議論が溜まっているか」で決めたほうが迷わない
- 切る前に正本を更新する手順（checkpoint）が習慣になっていれば、新しいセッションの立ち上がりは短くなる

## 既存知識との接続

- Claude Code 公式: Writer / Reviewer パターン（新しいコンテキストのほうが直前に書いたコードへの偏りがなく、レビューに向く）
- Claude Code 公式: 圧縮後に残るもの（CLAUDE.md・自動メモリ・plan mode のプランはディスクから再注入、会話は要約に置き換わる）

## 記事化の角度

- Analysis: 公式の `/clear`・`/compact`・再開の仕組みと、PlanGate の「境界で切る」方針の対応
- Insight: 会話を記憶の置き場にしないと、切る判断が軽くなる

## 次に試すこと

- [x] 著者の個人リポジトリの記録から事例を集める（Plan の Observed）
- [ ] PlanGate の次リリースに Context Lifecycle が含まれたかを確認する

## 追記ログ

### 2026-09-29

- Seed 作成。一次情報は PlanGate #1410 / PR #1411 と Claude Code 公式ドキュメント
- 著者判断と事例調査を Plan に反映（central_claim に「正本をフェーズごとに更新する」を追加、公開条件、Observed の事例、他者の実践と Codex 公式の反論）

## Draft Article Plan: zenn/plangate-fresh-context-restart

- approved_at:
- channel: zenn
- slug: plangate-fresh-context-restart
- article_type: analysis
- 公開条件: PlanGate の次リリース（Context Lifecycle を含む版）の後
- 位置づけ: 一般則ではなく「PlanGate の運用設計」として示す。区切りで切ることの効果は計測していない
- reader_problem: Claude Code や Codex で長い作業をしている開発者は、どの時点で会話を捨てて新しいセッションに切り替えるか、切るときに何を残せば続きを失わないかを判断できずにいる。紹介されている実践例には、使用率を目安に切って会話の要約で引き継ぐものがあるが、残した要約は古くなる
- central_claim: PlanGate では、作業の区切りを切り替えの判断材料にし、フェーズごとに更新する正本から再開する
- 主張の補足（本文で述べる。central_claim には入れない）: 区切りは「必ず切る」合図ではなく判断材料で、同じ問題の途中で前進しているなら履歴を保って続けてよい。正本も古くなるので、フェーズが変わるたびの更新が要件になる
- 用語: 「正本」は初出で「正本（source of truth。作業中から更新し続ける計画・状態・証跡のファイル）」と定義し、会話を要約した引き継ぎ書（handoff）とは違うと対比する。L0〜L3 は初出で「入口の索引 → 現在の状態 → 必要なときだけ詳細」と言い換える
- 批判の対象: 「会話を要約した一度きりの引き継ぎ書だけに状態を預ける運用」に限る。引き継ぎ書そのものは否定せず、正本を指す入口として使ってよいと書く
- out_of_scope: ファイルを正本にして再開するという発想そのもの（`plangate-ai-coding-workflow` で扱った）、PlanGate の CLI の使い方、トークン数や使用率による機械的な閾値の設計、ベクトル DB や長期記憶サービスの設計、記憶の集約（`ai-second-brain-multi-agent-memory` で扱った）、自走と確認の境界（`ai-agent-autonomy-boundary-with-memory` で扱った）、status.md の書き方そのもの（`plangate-ai-coding-workflow` で扱った）、current-state.md 導入の経緯（会社リポジトリ由来の改善の取り込みのため）、長いコンテキストの研究の詳細、my-blog の運用、会社で観測した事例

### Evidence Boundary

- Observed:
  - 範囲: 著者の個人リポジトリの記録。直接示すのは「残したもの（要約も正本も）が古くなる・誤る」ことまで。区切りで切るほうが優れる、正本で誤再開が減る、は Hypothesis に置く
  - plangate #945（2026-07-31 起票、2026-08-25 close）【種別: 正本型】: L0 の `INDEX.md` が同一セッション中に3回古くなった（C-3 承認後・plan 再編集後・exec 完了後）。issue は「次セッションが誤った地点から再開する」と記録し、更新規定を追加して close した（https://github.com/s977043/plangate/issues/945）
  - ai-second-brain `09 Projects/plangate/session-retrospective-2026-04-24.md` と `09 Projects/plangate/sessions/2026-04-26.md` §D【種別: 要約型】: handoff.md は WF-05 完了時に1回生成する引き継ぎ書で、2026-04-24 は発行が後続セッションで一括対応になり、2026-04-26 は完了状態に更新されておらず（AC の一部が「実装中」のまま）PR #68 で後から直した。記録は「前回セッションでも同じ問題が観察されており、改善が定着していない」としている
  - ai-second-brain `08 Agent Context/memory/plangate/feedback_handoff_constraints_need_reverification.md`（2026-09-23）【種別: 要約型】: carry-over に書いた前提3つがすべて外れていた（「13件が判断待ち」→12件は13日前に CLOSED 済み、制約の向きが逆、紐付けは API 上は無くテキスト参照のみ）
  - plangate #1061（2026-08-12 起票、OPEN）: 委託時に、直前に自分で書いた事実（timeout 扱い）を委託プロンプトから落とし、ワーカーが600秒無進捗で止まった。同セッションの AI 往復は約29回と記録されている。原因は記録上特定されていない（https://github.com/s977043/plangate/issues/1061）
  - plangate #742 → PR #744（2026-07-07 マージ）: /compact 前に作業コンテキストの鮮度を検査する PreCompact ガードを追加。きっかけは外部の実行プロトコルの取り込み調査で、事故の記録ではない。有効化は導入先の Human 側配線に依存する
  - PR #1411 の独立レビュー（2026-09-24）: head `0761a64e` / origin/main `d6a2216f` を指定して開始し、critical / major は0件、minor 2件。マージ後の R1 敵対レビュー（2026-09-29、squash `117c9ac4` 時点）では major 2件・minor 2件（R1-1411-01〜04）が出た（https://github.com/s977043/plangate/pull/1411）。新しいコンテキストで始めたことと品質の関係は書かない
  - 仕組みの変化の年表: 2026-04 handoff の発行漏れ・完了状態の更新漏れ → 07-07 PreCompact の鮮度検査（PR #744）→ 08-25 INDEX の更新規定（#945 close）→ 08-26 seeds の読み出し経路（#1157 close）→ 09-29 Context Lifecycle のマージ（PR #1411）
- Verified:
  - PlanGate Context Lifecycle（https://github.com/s977043/plangate/blob/main/docs/ai/context-lifecycle.md §3〜§6）: 必須の区切り（worker / agent / model / runtime の変更、独立レビューの開始、worker 間の引き継ぎ、外部待ち・使用量上限による意図的な中断）、推奨の区切り（圧縮やコンテキスト逼迫が近いとき、フェーズ遷移で必要な作業セットが変わるとき、修理・レビューループで古い議論が溜まったとき、不要な探索が溜まったとき）、checkpoint 手順、L0 → L1 → L2/L3 の再開、持ち越さないもの。doc §3 は必須を mode 条件なしの MUST で書き、working-context スキル（https://github.com/s977043/plangate/blob/main/.agents/skills/working-context/SKILL.md）は standard 以上に限定しており、両者は食い違う（R1-1411-01、s977043/PlanGate#1429 で是正待ち）。PR #1411 は 2026-09-29 マージ、最新リリース v8.22.0（2026-09-23）には未収録
  - Claude Code Best practices（https://code.claude.com/docs/en/best-practices）: コンテキストが埋まるほど性能が落ちる。無関係なタスクの間で `/clear`。同じ問題で2回を超えて（more than twice）修正したら `/clear` して学びを入れたプロンプトで始め直す。仕様を書き終えたら新しいセッションで実装する。「A fresh context improves code review」（Writer / Reviewer）。一方で、複雑な1つの問題に深く取り組んでいて履歴に価値があるときは文脈を積み上げるべき時もある、とも書いている
  - Claude Code sessions / context window（https://code.claude.com/docs/ja/sessions 、https://code.claude.com/docs/ja/context-window#what-survives-compaction）: `/clear`・`/compact`・再開の挙動。圧縮後はプロジェクトルートの CLAUDE.md・自動メモリ・plan mode のプランがディスクから再注入され、会話は要約に置き換わる
  - Anthropic「Effective harnesses for long-running agents」（https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents）: 「compaction isn't sufficient」。新しいコンテキストで始めるエージェントは進捗ファイル（claude-progress.txt）・feature list・git log から状態を把握する
  - Anthropic「Effective context engineering for AI agents」（https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents）: context rot（トークンが増えるほど想起精度が落ちる）。長いタスクには compaction・構造化メモ・サブエージェントを使い分ける
  - Anthropic「How we built our multi-agent research system」（https://www.anthropic.com/engineering/multi-agent-research-system）: 200,000 トークンを超えると切り詰められるため計画を Memory に保存する。clean context のサブエージェントを careful handoff で起動する
  - OpenAI Codex Best practices（https://learn.chatgpt.com/guides/best-practices）: 同じ問題なら同じチャットのほうが推論の流れを保てて良いことが多い。作業が本当に分岐したときだけ fork する。本記事では反論として扱う
  - OpenAI「Run long horizon tasks with Codex」（https://developers.openai.com/blog/run-long-horizon-tasks-with-codex）: Plan の markdown を正本（source of truth）として繰り返し読み直す（revisit repeatedly）例
  - Chroma「Context Rot」（https://www.trychroma.com/research/context-rot）: 入力長で性能が大きく変わる。Liu et al.「Lost in the Middle」（https://arxiv.org/abs/2307.03172）: 関連情報が長い文脈の中ほどにあると性能が落ちる。本文では背景に留める
  - 紹介されている実践例（本文では名指しせず、出典は末尾の参考に載せる）:
    - 使用率を目安にする例: sora_biz（https://zenn.dev/sora_biz/articles/claude-code-session-continuity）はコンテキスト約80%で警告し、会話から HANDOFF.md を生成して次セッションに注入する。aitutorcode（https://aitutorcode.com/blog/claude-code-handoff-file）は約70%で止め、Claude に handoff ファイルを書かせる
    - 作業単位でリセットする例: classmethod（https://dev.classmethod.jp/articles/claude-code-session-handover/）はタスクの区切りでリセットし、要約した handover ファイルで引き継ぐ
- Hypothesis:
  - 区切りで切るほうが、量で切るより迷いが減り、途中で切れる事故が減る（比較の計測なし）
  - 使用率を目安にすると作業の途中で切れやすい（2章の構造から来る懸念。Observed なし）
  - フェーズごとに正本を更新すれば、要約だけに預ける運用より誤った地点からの再開が減る（上の Observed からの推論で、比較の計測なし）
  - #1061 は長いセッションで判断や事実が「蓄積」した例で、長いセッションが一因だと著者は考えている（原因は特定できていない）

### Outline

1. 長い会話は重くなり、圧縮だけでは足りない：短く。公式と研究は背景に留める
2. 紹介されている実践例：使用率を目安にする例と、作業単位でリセットする例。どちらも会話の要約を引き継ぎ書に残す
3. 残したものは古くなる：要約型（handoff.md の更新漏れ、carry-over の前提3つ）も正本型（#945 の INDEX 3回）も古くなる。「作業の途中で切れる」は2章の構造から来る懸念として述べる
4. 切り替えを判断する材料としての区切り：判断表（区切り × 必須／推奨／切らない × 理由）。#1061 は蓄積の例として著者の見立てで置く。独立レビューは PR #1411 の事実だけを書く
5. 正本はいつ古くなり、いつ更新するか：更新のタイミング（フェーズが変わるたび）と読む順（入口の索引 → 現在の状態 → 必要なときだけ詳細）に限る。checkpoint のひな形（現在のフェーズ・次の一手・未解決・根拠へのリンク・持ち越さないもの）と、PlanGate を使わない読者向けの最小手順。引き継ぎ書は正本を指す入口として使ってよい
6. 同じ問題の途中では切らない：前進しているなら続け、同じ修正を繰り返しているなら切る（Claude 公式の more than twice と両立）。Codex 公式の「同じチャット」への回答。簡単なタスクには課さない
7. まとめ：PlanGate のプラグインは、この考え方を仕組みにした例として置く（CLI は書かない）

### 著者の判断（2026-09-29）

- タイトルは仮題「いつ会話を捨てて、新しいセッションで始めるか：履歴ではなく正本から再開する」、slug は `plangate-fresh-context-restart` で進め、初稿のレビューで磨く
- #1061 は、記録の事実と分けたうえで「原因は特定できていないが、長いセッションが一因だと考えている」と著者の見立てとして書く
- 対照例の3記事は本文で名指しせず一般化し、出典は末尾の参考に載せる（classmethod はタスクの区切りでリセットしており、量で切る例ではない点は一般化の際にも崩さない）。レビュー・ループ1を受け、表現は「よくある実践」ではなく「紹介されている実践例」にし、一般的な慣行とは言い切らない

### PlanGate 側の是正待ち

- `docs/ai/context-lifecycle.md` §3 は必須の区切りを mode で限定しておらず、スキル側（standard 以上で必須）と食い違っている（PR #1411 の R1 指摘 R1-1411-01）。PlanGate 側で直してから（s977043/PlanGate#1429）、記事は揃った内容に合わせる

### 変更履歴

- 2026-09-29: 著者判断で central_claim に3つ目の柱（正本はフェーズが変わるたびに更新する）を追加。公開条件を PlanGate の次リリース後と決定。文書とスキルの食い違いは PlanGate 側で先に直す方針とし、著者確認の項目から外した
- 2026-09-29: 著者判断でタイトル・slug を仮のまま確定、#1061 は著者の見立てとして書く、対照例は一般化して末尾に出典を置く
- 2026-09-29: レビュー・ループ1（編集／事実検証／Codex）を反映。central_claim を「PlanGate の運用設計」として短くし、区切りを判断材料と位置づけた。Observed に要約型／正本型の種別を付け、優劣の主張は Hypothesis に移した。批判の対象を「要約した一度きりの引き継ぎ書だけに状態を預ける運用」に限定。Outline 1〜6章を組み直し、out_of_scope に「ファイルを正本にして再開する発想そのもの」を追加。PR #1411・context-lifecycle・Codex・context-window の記述を原典に合わせて修正
