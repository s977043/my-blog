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

- [ ] 著者の実体験（切り忘れ・切りすぎの事例）を確認する
- [ ] PlanGate の次リリースに Context Lifecycle が含まれたかを確認する

## 追記ログ

### 2026-09-29

- Seed 作成。一次情報は PlanGate #1410 / PR #1411 と Claude Code 公式ドキュメント

## Draft Article Plan: zenn/plangate-fresh-context-restart

- approved_at:
- channel: zenn
- slug: plangate-fresh-context-restart
- article_type: analysis
- reader_problem: Claude Code や Codex で長い作業をしている開発者が、どの時点で会話を捨てて新しいセッションに切り替えるべきか、切るときに何を残せば続きを失わないかを判断できずにいる
- central_claim: セッションはトークン量ではなく作業の境界（担い手の交代・独立レビュー・外部待ち）で切り、会話ではなく Plan と現在地メモ（`INDEX.md` / `current-state.md`）と evidence から再開すれば、切ることを怖がらなくてよい
- out_of_scope: PlanGate の CLI の使い方、トークン数による機械的な閾値、ベクトル DB や長期記憶サービスの設計、記憶の集約（`ai-second-brain-multi-agent-memory` で扱った）、自走と確認の境界（`ai-agent-autonomy-boundary-with-memory` で扱った）、status.md の書き方そのもの（`plangate-ai-coding-workflow` で扱った）、my-blog の運用、会社で観測した事例

### Evidence Boundary

- Observed: PlanGate PR #1411 のレビュー記録で、独立レビューが「必須の trigger が簡易タスクにも儀式を課す」矛盾を指摘し、スキル側で必須を standard 以上に限定する是正が入った（https://github.com/s977043/plangate/pull/1411 のコメント、2026-09-24〜25）。一方、マージ後の追加レビューでは `docs/ai/context-lifecycle.md` §3 が同じ限定を持たず、文書とスキルが食い違っていると記録されている（同 PR の R1 コメント）
- Verified:
  - PlanGate の trigger 一覧（必須 4 件・推奨 4 件）、checkpoint 手順 5 段、再開手順（L0 → L1 → L2/L3）、持ち越さないもの: https://github.com/s977043/plangate/blob/main/docs/ai/context-lifecycle.md （§3〜§6、main `4995ad6` 時点）
  - 必須は standard 以上に限り、ultra-light / light では任意: https://github.com/s977043/plangate/blob/main/.agents/skills/working-context/SKILL.md 「Context Lifecycle / fresh-context transition (#1410)」節
  - 新しい SSoT・checkpoint.json・RunState を作らず既存の仕組みを再利用する設計判断: https://github.com/s977043/plangate/issues/1410
  - PR #1411 のマージは 2026-09-29。最新リリース v8.22.0 は 2026-09-23 で、プラグインの配布物にはまだ入っていない（`gh release list -R s977043/plangate`）
  - Claude Code: コンテキストが埋まるほど性能が落ちる。無関係なタスクの間で `/clear`、同じ問題で2回を超えて修正したら `/clear` して学びを入れたプロンプトで始め直す。新しいコンテキストは直前に書いたコードへの偏りがなくレビューに向く（Writer / Reviewer）: https://code.claude.com/docs/en/best-practices
  - Claude Code: `/clear` は空のコンテキストで始め、以前の会話は保存され `/resume` で戻れる。`/compact` は履歴を要約に置き換える。`--continue` / `--resume` は会話履歴全体を復元する: https://code.claude.com/docs/ja/sessions
  - Claude Code: 圧縮後、CLAUDE.md・自動メモリ・plan mode のプランはディスクから再注入され、会話は要約に置き換わる。読んだ・編集したファイルは最大5つまで再読込: https://code.claude.com/docs/ja/context-window#what-survives-compaction
- Hypothesis:
  - 著者自身が、切らずに続けて古い判断を引きずった／切った後に文脈を失った経験があるか（未確認（著者確認待ち））
  - 著者が PlanGate の Context Lifecycle を実作業で使い、再開が速くなったか（未確認（著者確認待ち））
  - 「境界で切る」ほうが「量で切る」より迷いが減る、という主張は現時点では見立て

### Outline

1. 切るのが怖い、切らないと重い：長い作業で起きる迷いを置く
2. Claude Code が用意している道具：`/clear`・`/compact`・再開の違いと、圧縮後に残るもの（公式ドキュメント）
3. 量ではなく境界で切る：必須（担い手の交代・独立レビュー・外部待ち）と推奨（圧縮前・修理ループの繰り返し）
4. 切る前に書き残すもの：判断は Plan へ、現在地は `INDEX.md` / `current-state.md` へ、結果は evidence へ
5. 新しいセッションの読み方：現在地 → いまのフェーズに要る Plan → 問いがあるときだけ evidence
6. 簡単なタスクには儀式を課さない：必須を standard 以上に限った理由
7. まとめ：会話を記憶の置き場にしなければ、切る判断は軽くなる

### 著者確認が必要な点

- 実体験の有無と内容（Hypothesis の2件）。書けない場合は公式ドキュメントと PlanGate の設計だけで主張を立てる
- 公開時期：Context Lifecycle を含む PlanGate のリリース後にするか（未リリースのまま出すと、プラグイン利用者の手元に無い機能を紹介することになる）
- `docs/ai/context-lifecycle.md` §3 とスキルの食い違い（R1-1411-01）が直るのを待つか。記事はスキル側の記述（必須は standard 以上）に合わせる想定
- タイトル案「いつ会話を捨てて、新しいセッションで始めるか：履歴ではなく正本から再開する」の採否と、「正本」という語を読者向けにどう言い換えるか
- slug `plangate-fresh-context-restart` の採否（`plangate-` 接頭辞で既存の PlanGate 記事と並べる）
