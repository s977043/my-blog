---
title: "AIレビューの指摘が多すぎて読まれないとき、どこで絞り、何を人に回すか"
summary: "AIコードレビューの指摘が増えすぎると、チームは重要な指摘まで読まなくなります。River Reviewの設計を一例に、指摘を出す前の検証、読む順番、人に回す条件、繰り返す指摘の抑制を分けて決める考え方を整理します。"
tags:
  - AI
  - コードレビュー
  - OSS
status: draft
source_articles:
  - articles/river-review-judgment-placement.md
  - articles/river-reviewer-v033-improvement-loop.md
project_sources:
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md
  - https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md
  - https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/team-lead-synthesizer.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/suppression.mjs
  - https://github.com/s977043/river-review/issues/1857
  - https://github.com/s977043/river-review/issues/2202
  - https://github.com/s977043/river-review/issues/2418
  - https://github.com/s977043/river-review/issues/2425
  - https://github.com/s977043/river-review/issues/2430
izanami_url:
published_at:
---

<!--
構成案（本文未執筆）。本文を書くときはこのコメントブロックを削除する。

■ 位置づけ
- 読者課題: AIレビューの指摘が多すぎてチームが読まなくなる。どこで人が判断するかをどう設計するか
- 初回記事 ai-review-coverage.md は「指摘0件を信じてよいか（実行カバレッジ）」。本記事は反対側の「指摘が多すぎる」問題を扱う。Review Coverage の説明は繰り返さず、末尾で相互リンクするだけにする
- 既存記事 river-review-judgment-placement.md は「どの判断層（Deterministic/Heuristic/Agentic/Human）に置くか」という設計論。本記事はその層分けを再説明せず、「出てきた指摘を人がどう受け取るか」という受け手側の流れ（検証→並び→人に回す条件→抑制）で章を立てる。4層の図・見出し・文言は流用しない
- 各章は「失敗例 → 設計判断 → 読者が自チームに持ち帰る問い」の同じ粒度で書く。主軸は第1〜4章
- 製品宣伝にしない。River Review は「一例」として章内で文脈リンクし、他記事へのリンクは末尾の関連リンクにまとめる。本文中で既存記事へ誘導しない。初回記事のような製品紹介節は置かない
- Review Coverage という語は本文に出さない（初回記事との対比は導入の1文と末尾の相互リンクだけ）
- 【著者確認】が得られなかった章は、実体験を創作せず一般論として書く。「チーム」の例は個人リポジトリでの観測に限るか抽象化し、会社の文脈は使わない
- 「補足候補」は字数（目安: 本文 4,000字以内）に余裕があるときだけ採用する
- 判断配置の記事（judgment-placement）の Human Judgment 節の例（セキュリティ・課金・不可逆な移行など）と、Review → Rule Promotion の話は再掲しない

■ 安定度の扱い（pages/reference/stable-interfaces.md で確認、2026-09-24 時点）
- Stable: output.schema.json の最上位構造（issues[] / summary / decision）、Skill Schema の severity/confidence の意味論、gate 判定の終了コード 0/1/2/3 の意味（GitHub Action 経由）
- Beta: GitHub Action、Skill Schema
- Experimental: Suppression Context、Riverbed Memory、Risk Map
- Internal: CLI（river コマンド。npm 未公開）。`river suppression add` / `river review route` は CLI 経由のため Internal 扱い
- 表に載らない内部実装: verifier.mjs / finding-critic.mjs / team-lead-synthesizer.mjs は公開サーフェスではない。本文では「現在の実装ではこうしている」と書き、利用者が依存できる契約としては書かない
- finding-critic（review-engine に配線済みだが既定 off。`RIVER_FINDING_CRITIC=1` か config で有効化する opt-in）と、判断記録を改善ループへつなぐ設計（#1990、open）は、既存記事と重なるため本記事では扱わない（Codex レビュー 2026-09-24 を反映して旧第5章を削除）
-->

## 導入：指摘が多いと、重要な指摘も読まれなくなる

- 主張: 指摘の多さそのものより、「どれを読めばよいか分からない」状態が問題。読まれない指摘は0件と同じ結果になる（初回記事の「0件」と対になることを1文で示す）。導入の最後で、本記事の流れ（出す前に落とす → 読む順番を決める → 人に回す条件を決める → 抑制を検証する）を予告する
- 一次情報: なし（問題提起）
- 【著者確認】AIレビューの指摘が多すぎて、チームが読み飛ばすようになった実体験の有無と具体的な場面（件数・期間は分かる範囲で）

## 1. 指摘を減らす前に、指摘を「出す前」に落とす

- 主張: 件数を減らす第一段は、人が読む前に「形式として成り立たない指摘」を機械で落とすこと。ただし機械で検査できるのは形式と根拠の有無までで、「今回止めるべき指摘か」という意味の判断は機械では決まらない。この2つを分けて設計する
  - 機械で検査できる例（現在の実装の主な項目）: 根拠（Evidence）の記述があるか、根拠が差分に含まれるファイルを指しているか、一定の長さの修正提案があるか、重要度がその観点で宣言した上限を超えていないか、観点とファイル種別が噛み合っているか
  - 機械で決まらないもの: 重要度の理由が妥当か、今回のPRで止めるべきか。これは人（またはレビュー方針）の判断領域として残す
  - 区別して書く: 根拠が差分に存在しないファイルを指す指摘は落とす。一方、指摘の位置が差分の外（既存コード）であることは棄却理由にせず、範囲の情報として残す（扱いは第2章の並び順で決める）
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs （ルールベース、LLM を呼ばない。検査結果として reject の可否と理由を返し、呼び出し側が reject された指摘を出力から外す）
  - https://github.com/s977043/river-review/issues/1857 （open: 意味判断の層は未実装の設計課題）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§3 禁止事項: 過度な推測・抽象的なレビュー・範囲外の指摘。§3.1: 差分外の欠落を棄却できない場合は finding ではなく question として返す）
- 安定度: verifier は公開サーフェス外の内部実装。review-policy はレビュアーが従う方針として公開
- 補足候補: 意図コメントで指摘を取り下げてよいのは軽微な指摘だけで、セキュリティ・データ喪失・正しさのリスクは取り下げない（review-policy §3.1）。「減らしすぎ」への歯止めとして書く
- 持ち帰る問い: 自分たちの AI レビューは、人に見せる前に何を機械で落としているか。意味の判断まで機械に任せていないか
- 【著者確認】verifier の検証を入れる前後で、読まれない指摘が減ったと感じたか（数値がなければ感覚でよいか）

## 2. 読む順番を決める：先頭で「直すべきものがあるか」だけ分かるようにする

- 主張: 全件を同じ重さで並べると読まれない。先頭に判定と重要度別件数を置き、Critical/Major だけ展開し、Minor/Info は件数付きで折りたたむ。折りたたみは削除ではない。第1章で残した「差分の外の指摘」は消さず、並び順で後ろに回す
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§2.5 提示順と段階的開示、§6 優先順位 Critical/Major/Minor/Info）
  - https://github.com/s977043/river-review/blob/main/src/lib/team-lead-synthesizer.mjs （consensusLevel → severity → scope の順で並べる。「差分の外にある」ことは「重要でない」ことではない、という設計理由がコメントにある）
- 安定度: 並び順の実装は内部。severity の意味論は Stable（Skill Schema）
- 持ち帰る問い: レビュー結果を開いて最初の数行で「直すべきものがあるか」が分かるか
- 【著者確認】折りたたみ・並び順を変えたことで、チームの読み方が変わった経験があるか

## 3. 人に回す条件を先に決める：AIの判定を最終結論にしない

- 主張: 「人が全部読む」でも「AIが全部決める」でもなく、判定の出口を分けておく。本記事の独自点は次の2つに絞り、ESCALATE 条件の列挙は短くする
  - 止める（NO_GO）と人に渡す（ESCALATE）を区別する。判定できないときは「通す」ではなく「止める」に倒し、人が見て解除する
  - GO_WITH_OBSERVATION（止めないが人が後で見る）で、読む量を減らしつつ人の目を残す
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs （GO / GO_WITH_OBSERVATION / NO_GO / ESCALATE の判定規則。ゲート設定自体の変更は無条件に ESCALATE。未知・未判定は NO_GO）
  - https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md （gate 判定の終了コード: GO / GO_WITH_OBSERVATION=0、NO_GO=1、ESCALATE=3 が Stable）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§8 レビューモードルーター。risk-map の `require_human_review` に当たると human-required）
- 安定度: 終了コードの意味は Stable。Risk Map は Experimental。`river review route` は CLI（Internal）
- 書き方: River Review は「設計例」に留め、CLI や Risk Map の操作手順は案内しない。読者への持ち帰りはツールに依存しない「人が見る条件表を先にチームで合意する」とする
- 持ち帰る問い: 自分たちのレビューには「止める」「人に渡す」「通すが後で見る」の出口が別々にあるか
- 【著者確認】自分のチームでは、どの種類の変更を人の判断に必ず回すことにしているか（例を1〜2個）

## 4. 指摘を黙らせる仕組みにも検証が要る

- 主張: 毎回同じ指摘が出るとノイズになる。ただし抑制（suppression）は「黙らせる」操作なので、期限・取り消し・基準改訂時の扱いを設計しないと、効かない抑制や効きすぎる抑制が生まれる。ノイズを減らす仕組みにも検証が要る
- 書き方: Experimental な機能で観測した事例として書く。現在の挙動（期限・取り消しを見る、基準改訂時に止める判定は任意で有効化）と、修正までの経緯（#2418 → #2425 → #2430）を混同しない
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/suppression.mjs （失効は `context.expiresAt` を見る）
  - https://github.com/s977043/river-review/issues/2202 （open: 失効が暦のみという課題。基準改訂時に抑制を止める判定は Phase 2 として任意で有効化する形で実装済み）
  - https://github.com/s977043/river-review/issues/2418 、/2425 、/2430 （closed: 実体験の事例）
- 安定度: Suppression Context・Riverbed Memory は Experimental。`river suppression add` は CLI（Internal）
- 実体験候補（下記「実体験候補」の #2418 / #2425 / #2430）をこの章で使う
- 持ち帰る問い: 抑制を作ったあと、それが実際に効いているか、効きすぎていないかを確かめる手段を持っているか
- 【著者確認】#2418 に気づいた経緯（どの作業中に、何を見て「効いていない」と分かったか）

## まとめ：人が判断する場所を決めるためのチェックリスト

- 主張: 以下を順に決める（読者が自チームに持ち帰れる形）
  1. 出す前に機械で落とす条件と、機械に任せない意味判断の線引き
  2. 先頭に何を置くか、読む順番と折りたたむ範囲
  3. 止める・人に渡す・通すが後で見る、の出口と、判定不能時の倒し方
  4. 抑制の期限・取り消しと、抑制が効いているかの確かめ方
- 一次情報: 各章の再掲なし
- 【著者確認】チェックリストに自チーム固有の項目を足すか

## 参考・関連リンク（末尾にまとめる）

- River Review: https://github.com/s977043/river-review
- 初回記事（izanami）: 【著者確認】ai-review-coverage.md の公開 URL（公開後に記入）
- 関連記事（Zenn）: 【著者確認】river-review-judgment-placement、river-reviewer-v033-improvement-loop の Zenn 公開 URL（https://zenn.dev/minewo/articles/<slug>）（判断の記録を改善ループへ回す話はこちらに委ね、本文では扱わない）

<!--
■ 実体験候補（river-review の Issue/PR に事実として残る出来事。採用は著者判断）
- #2418（closed 2026-09-24）: `river suppression add` で作った suppression が phase フィルタで除外され、本番レビュー経路で一度も適用されていなかった。修正 PR は #2424
- #2425（closed 2026-09-24）: #2424 の修正で phase 無し suppression が届くようになった結果、無効化・取り消し済みの suppression も効いてしまう既存制約が表に出た
- #2430（closed 2026-09-24）: 期限切れ entry が同じ fingerprint の有効 entry を覆い隠す、active 判定が別経路と逆
- #2202（open）: 抑制の失効が暦のみ
- 使い方の案: 「抑制を作ったのに効いていなかった → 直したら今度は効きすぎる経路が見つかった」という流れで、抑制は入れて終わりではないことを示す（第4章）

■ 【著者確認】一覧
1. 導入: 指摘が多すぎて読まれなくなった実体験
2. 第1章: verifier 導入前後の体感
3. 第2章: 並び順・折りたたみでチームの読み方が変わったか
4. 第3章: 必ず人に回す変更の種類
5. 第4章: #2418 に気づいた経緯
6. まとめ: 自チーム固有のチェック項目
7. 関連リンク: 初回記事の公開 URL
-->
