---
seed_id: seed-20261010-agile-hotl-practice-evolution
title: "AIが賢くなった今、アジャイルの原点に戻ってきた"
date: 2026-10-10
status: draft
topics:
  - ai-driven-development
  - agile
  - hitl-hotl
  - agent-autonomy
  - fast-feedback
source: mixed
source_url: https://www.anthropic.com/news/measuring-agent-autonomy
source_ref: https://github.com/s977043/PlanGate/pull/1549
evidence_status: verified
promoted_to:
article_type_candidates:
  - experience
  - insight
---

# AIが賢くなった今、アジャイルの原点に戻ってきた

## 最近起きたこと（観測事実）

- DATのEXP-001では「一度の実験をミスしない」ために準備・確認が膨らみ、肝心の実測Runに進めないことが問題となった。対応候補は [DAT #124](https://github.com/s977043/dynamic-agent-topology/pull/124)（2026-10-10時点ではDraft）と [DAT #125](https://github.com/s977043/dynamic-agent-topology/pull/125)（同時点では提案中）。
- PlanGateではIssue棚卸しを3〜5件の小バッチで回し、棚卸しの方法自体を振り返る二重ループを設計した。初回2バッチ6件の観測は残るが、所要時間や改善効果は未検証。[PlanGate #1548](https://github.com/s977043/PlanGate/pull/1548)
- PlanGateでは「人間の判断が必要 ≠ すべての作業が停止」を方針候補として記録し、許可された調査・証拠収集・PR準備と、Human-ownedの承認・マージを分離した。[PlanGate #1549](https://github.com/s977043/PlanGate/pull/1549)
- River Reviewではアジャイルに立脚した実践進化方針を、既存のガバナンスと切り離した公開文書として取り込んだ（2026-10-10 05:44 JSTにマージ。運用効果は未計測）。[River Review #2634](https://github.com/s977043/river-review/pull/2634)
- 私自身は、以前はAIエージェントの自由度を抑え、細かなゲートで制御することを重視してきた。モデル能力と運用経験が変化した今、その前提を見直し始めている（体験に基づく解釈。効果の一般化ではない）。

## 違和感

AIに長い仕事を任せられるようになった一方、確認・承認・準備を増やし続けると、実際の学習と価値提供が進まなくなる。だからといって、権限変更や不可逆な操作の承認をAIに渡すのも違う。

## 今の仮説

**AIの自由度を一律に抑える設計から、AIが自律できる境界を設計する方向へ。**

HITLをすべてHOTLへ置き換えるのではない。**人間を外すのではなく、承認の粒度と判断の置き場所を変える**。Human in Command（目的・権限の設定）とHuman on the Loop（許可範囲での監督）、重要判断のHuman in the Loopを組み合わせる。その境界内では小さく動かし、確かなEvidenceを取り、観測・適応する。アジャイルが重視してきた価値提供と振り返りは、その中心にある。

私がこのOSS群で残す境界は、①何が起きているか観測できる、②必要なら介入・停止できる、③戻せる範囲で小さく試せる、④権限変更・マージ・本番反映のような重要判断は人間に残す、⑤方針の文書化と実際の改善効果を区別すること。なお「操作ごとの承認」は以前の自分の運用例であり、HITLの普遍的な定義ではない。

## 外部知識との接続・正確性の境界

このSeedの `evidence_status: verified` は、主要な**外部事実の出典を確認済み**という意味であり、Seed全体の効果実証を意味しない。River Review #2634の公開方針のマージ、アジャイル宣言原文、Anthropicの自律利用の一次資料は確認済み。一方、DAT・PlanGateの関連PRで検討中の方針、筆者の解釈、HOTLとFast Feedbackによる改善効果は、導入完了・効果検証済みとは扱わない。`source: mixed` は一次体験と外部資料を組み合わせた出所区分であり、`evidence_status` の値ではない。

- [アジャイルソフトウェア開発宣言](https://agilemanifesto.org/iso/ja/manifesto.html)と[背後にある原則](https://agilemanifesto.org/iso/ja/principles.html)：変化への対応、小さな価値提供、継続的な振り返りを重視。**HITL/HOTLやHuman-ownedの細部は宣言の直接の規定ではない**。
- [Anthropic: Measuring AI agent autonomy in practice（2026-02-18）](https://www.anthropic.com/news/measuring-agent-autonomy)：Claude Codeの自律実行と利用者の監督に関する観測。**モデル性能の向上だけが自律利用の変化を説明するわけではない**。
- [Anthropic: Trustworthy agents in practice（2026-04-09）](https://www.anthropic.com/research/trustworthy-agents)：逐次承認の摩擦と、人間の意味ある制御・介入可能性の両立を議論。
- 実装PRの状態、改善率、Humanの承認権限は混同しない。「方針を提案・文書化した」と「運用効果を実証した」は異なる。

## Draft Article Plan: x/agile-hotl-practice-evolution

- channel: X Articles（短い考察記事。単一ポストの256文字キャプションとは別）
- reader_problem: AIエージェントの能力が上がるほど細かい承認・チェックが滞留し、スピードと安全性をどう両立するか悩んでいる実践者。
- central_claim: AIが賢くなった今は、行動を逐一制御するより、目的と安全境界を人間が設計し、その中で小さく試し学べる運用へ進化させることが大切。
- Evidence Boundary / Observed: DAT EXP-001の過剰準備の問題と、PlanGateのIssue棚卸し・判断待ちの整理。上記公開Issue/PRの説明とユーザーの実体験。
- Evidence Boundary / Verified: River Reviewの公開方針PR、アジャイル宣言原文、Anthropicの自律利用に関する一次資料。
- Evidence Boundary / Hypothesis: HOTLとFast Feedbackの適用で実測到達時間とHuman判断の負荷を減らせるか。モデル向上は変化の一因であり、単独原因と断定しない。
- out_of_scope: 3OSSの網羅的な機能紹介、HITL全面廃止の提言、HOTL本番解禁の宣言、定量的な効果実証、特定モデルの性能ランキング、Scrumの実施手順。
- status: Draft（著者の公開承認前）

## X Articles 初稿（本文のみコピー対象）

# AIが賢くなった今、アジャイルの原点に戻ってきた

AIが賢くなった。なのに、自分が進めていた実験は、なかなか前に進まなかった。

原因の一つは、失敗しないための準備に時間をかけすぎたことだった。

AI駆動開発を続ける中で、自分の考えが変わり始めた。

以前は、AIエージェントをどう制御するかを強く意識していた。任せる作業を小さく区切り、人間が確認し、承認して次へ進める。自分が取り組み始めた頃は、それが合理的だったと思う。

でも、モデルの能力が上がり、ツールや自分の任せ方も変わった。エージェントに長い仕事を任せられるようになって、別の問題が見えてきた。

**AIは進めるのに、人間の確認待ちや、失敗を避けるための準備が仕事を止めてしまう。**

### 失敗しない準備が、実験を止めていた

自分が開発しているDynamic Agent Topology（DAT）で、それを実感した（[改善の検討記録](https://github.com/s977043/dynamic-agent-topology/pull/124)）。

AIエージェントの構成を比較する実験で、1回の実行を失敗させないように、条件や検証方法を丁寧に整えようとした。その結果、肝心の実測に進むまでの準備が膨らんでいた。

そこで問いを変えた。

「どうすれば失敗しないか」より、**「守るべき境界を守りながら、どうすれば最初の有効な結果を得られるか」**。

安全性や実験条件を緩める話ではない。戻せる範囲では小さく試し、失敗を早く見つけて学ぶ。その方が、前に進めるのではないかと考えた。

### 関わり方を分ける

**HITLからHOTLは、人間を外す話ではない。承認の粒度を変える話だ。**

以前の自分の運用では、AIの操作ごとに人間が確認して進める形を重視していた。一方、HOTL（Human on the Loop）は、許可した範囲ではAIを走らせ、人間が監督し、必要なときに介入する。何が起きているか見え、止められることが前提だ。

今は人間の役割を、次のように分けて考えている。

- **Human in Command**：目的・権限・任せる範囲を決める。
- **Human on the Loop**：許可範囲の自律実行を見守り、ずれたら介入する。
- **Human in the Loop**：重要な承認や不可逆な操作で判断する。

権限変更やマージ、本番反映のような判断は、私のOSS運用では人間が持つ。その一方で、許可済みの調査や準備まで止める必要はない。

**AIの自由度を一律に抑えるのではなく、AIが自律できる境界を設計する。変えるのは制御の強さより、判断の置き場所だ。**

[PlanGate](https://github.com/s977043/PlanGate/pull/1549)では、「人間の判断が必要」という理由で、許可済みの調査や準備まで全部止めない方針を検討した。[River Review](https://github.com/s977043/river-review/pull/2634)でも、守る判断・承認の境界と、見直せる開発の進め方を分けた（2026年10月10日〈日本時間〉に公開方針のPRをマージ。運用効果は未計測）。

### そこで、アジャイルの原点に戻ってきた

考えてみると、新しいことだけをしているわけではなかった。

価値のある成果を小さく届ける。実際の結果を観察する。変化に応じてやり方を変える。プロセス自体も振り返って改善する。

以前から大切にしてきたアジャイルの考え方だった。

ただ、AIによって実行できる仕事の量や速さが変わった今、**人間が毎回操作するのではなく、人間が方向と境界を定め、AIと一緒に学習のサイクルを回す**形が見えてきた気がする。

まだ、この進め方でどこまで改善するかは測れていない。

それでも今は、完璧なプロセスを完成させることより、**自分たちのプロセスを変え続けられること**を大切にしたい。

AIが賢くなったから、人間の判断が不要になったわけではない。

**人間が何を判断すべきかを、改めて考え直せるようになった。**

## X記事投稿時の短いキャプション案（256字以内）

AIが賢くなったのに、失敗しない準備で実験が止まった。HITLからHOTLは、人間を外す話ではない。承認の粒度と判断の置き場所を変える話だ。人間が目的と境界を決め、その中でAIが小さく試し、Evidenceを得る。アジャイルの原点に戻って考え直した、まだ検証途中の実践です。

## 公開前の確認・追記ログ

- [x] 主要な公開PRと文書を確認。PlanGate/DATの未マージ提案と、River Reviewのマージ済み方針を混同しない
- [x] モデル能力の向上は筆者の実感と外部の自律利用の観測にとどめ、因果を断定しない
- [x] Human-ownedの承認、Feature Freeze、Evidenceの真正性を維持する
- [x] Grokのレビューを反映。`evidence_status` は有効値 `verified` を維持し、Verifiedの範囲を本文で限定。River Reviewのマージ日時はJSTに換算。HITL全面廃止と誤読される見出し・キャプションを修正
- [x] 追補の思想を本文へ反映。Human in Command / HOTL / HITLの役割、監督・停止可能性、権限・マージ・本番反映のHuman-owned境界を明示。HITLの説明は「以前の自分の運用」として一般化を避けた
- [ ] 著者レビュー・X記事としての公開判断
- [ ] 公開後にX記事URLを `promoted_to` に追加
- [ ] DATでの有効な実測Runまでの時間、PlanGateの判断待ち・追加質問などを継続観測
