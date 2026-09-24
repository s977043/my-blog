---
title: "AIレビューの指摘が多すぎて読まれないとき、人が判断する場所をどう決めるか"
summary: "AIコードレビューの指摘が増えすぎると、チームは重要な指摘まで読まなくなります。River Reviewの公開仕様を例に、指摘を出す前の検証、読む順番、人に回す条件、繰り返す指摘の抑制を分けて設計する考え方を整理します。"
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
  - https://github.com/s977043/river-review/blob/main/src/lib/finding-critic.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/team-lead-synthesizer.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/suppression.mjs
  - https://github.com/s977043/river-review/blob/main/src/lib/feedback.mjs
izanami_url:
published_at:
---

<!--
構成案（本文未執筆）。本文を書くときはこのコメントブロックを削除する。

■ 位置づけ
- 読者課題: AIレビューの指摘が多すぎてチームが読まなくなる。どこで人が判断するかをどう設計するか
- 初回記事 ai-review-coverage.md は「指摘0件を信じてよいか（実行カバレッジ）」。本記事は反対側の「指摘が多すぎる」問題を扱う。Review Coverage の説明は繰り返さず、末尾で相互リンクするだけにする
- 既存記事 river-review-judgment-placement.md は「どの判断層（Deterministic/Heuristic/Agentic/Human）に置くか」という設計論。本記事はその層分けを再説明せず、「出てきた指摘を人がどう受け取るか」という受け手側の流れ（検証→並び→人に回す条件→抑制）で章を立てる。4層の図・見出し・文言は流用しない
- 製品宣伝にしない。River Review は「一例」として章内で文脈リンクし、他記事へのリンクは末尾の関連リンクにまとめる

■ 安定度の扱い（pages/reference/stable-interfaces.md で確認、2026-09-24 時点）
- Stable: output.schema.json の最上位構造（issues[] / summary / decision）、Skill Schema の severity/confidence の意味論、gate 判定の終了コード 0/1/2/3 の意味（GitHub Action 経由）
- Beta: GitHub Action、Skill Schema
- Experimental: Suppression Context、Riverbed Memory、Risk Map
- Internal: CLI（river コマンド。npm 未公開）。`river suppression add` / `river review route` は CLI 経由のため Internal 扱い
- 表に載らない内部実装: verifier.mjs / finding-critic.mjs / team-lead-synthesizer.mjs は公開サーフェスではない。本文では「現在の実装ではこうしている」と書き、利用者が依存できる契約としては書かない
- finding-critic.mjs は冒頭コメントに「src/cli/** から到達しない」と明記。本番経路の機能として紹介しない
-->

## 導入：指摘が多いと、重要な指摘も読まれなくなる

- 主張: 指摘の多さそのものより、「どれを読めばよいか分からない」状態が問題。読まれない指摘は0件と同じ結果になる（初回記事の「0件」と対になることを1文で示す）
- 一次情報: なし（問題提起）
- 【著者確認】AIレビューの指摘が多すぎて、チームが読み飛ばすようになった実体験の有無と具体的な場面（件数・期間は分かる範囲で）

## 1. 指摘を減らす前に、指摘を「出す前」に落とす

- 主張: 件数を減らす第一段は、人が読む前に根拠のない指摘を機械的に落とすこと。根拠（Evidence）がない、差分にない箇所を指している、提案が実行できない、重要度の理由がない指摘は出力しない
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs （ルールベース、LLM を呼ばない。reject された指摘は出力しない）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§3 禁止事項: 過度な推測・抽象的なレビュー・範囲外の指摘。差分外の欠落を棄却できない場合は finding ではなく question として返す）
- 安定度: verifier は公開サーフェス外の内部実装。review-policy はレビュアーが従う方針として公開
- 補足候補: 意図コメントで指摘を取り下げてよいのは軽微な指摘だけで、セキュリティ・データ喪失・正しさのリスクは取り下げない（review-policy §3.1）。「減らしすぎ」への歯止めとして書く
- 【著者確認】verifier の検証を入れる前後で、読まれない指摘が減ったと感じたか（数値がなければ感覚でよいか）

## 2. 読む順番を決める：先頭で「直すべきものがあるか」だけ分かるようにする

- 主張: 全件を同じ重さで並べると読まれない。先頭に判定と重要度別件数を置き、Critical/Major だけ展開し、Minor/Info は件数付きで折りたたむ。折りたたみは削除ではない
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§2.5 提示順と段階的開示、§6 優先順位 Critical/Major/Minor/Info）
  - https://github.com/s977043/river-review/blob/main/src/lib/team-lead-synthesizer.mjs （consensusLevel → severity → scope の順で並べる。「差分の外にある」ことは「重要でない」ことではない、という設計理由がコメントにある）
- 安定度: 並び順の実装は内部。severity の意味論は Stable（Skill Schema）
- 【著者確認】折りたたみ・並び順を変えたことで、チームの読み方が変わった経験があるか

## 3. 人に回す条件を先に決める：AIの判定を最終結論にしない

- 主張: 「人が全部読む」でも「AIが全部決める」でもなく、人が判断すべき条件をあらかじめ宣言しておく。人間承認が必要な変更・リスクの高いファイル・判定が揺れた場合は ESCALATE とし、判定不能は GO ではなく NO_GO に倒す
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs （GO / GO_WITH_OBSERVATION / NO_GO / ESCALATE の判定規則。ゲート設定自体の変更は無条件に ESCALATE。未知・未判定は NO_GO）
  - https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md （gate 判定の終了コード: GO / GO_WITH_OBSERVATION=0、NO_GO=1、ESCALATE=3 が Stable）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§8 レビューモードルーター。risk-map の `require_human_review` に当たると human-required）
- 安定度: 終了コードの意味は Stable。Risk Map は Experimental。`river review route` は CLI（Internal）
- 補足候補: GO_WITH_OBSERVATION（止めないが人が後で見る）を「読む量を減らしつつ人の目を残す」中間の選択肢として説明する
- 【著者確認】自分のチームでは、どの種類の変更を人の判断に必ず回すことにしているか（例を1〜2個）

## 4. 同じ指摘を繰り返させない：抑制には期限と取り消しが要る

- 主張: 毎回同じ指摘が出るとノイズになる。ただし抑制（suppression）は「黙らせる」操作なので、期限・取り消し・基準改訂時の扱いを設計しないと、必要な指摘まで消える
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/suppression.mjs （失効は `context.expiresAt` を見る）
  - https://github.com/s977043/river-review/blob/main/src/lib/feedback.mjs （フィードバック分類。`out_of_scope` など、指摘への判断を記録して改善ループへつなぐ）
  - https://github.com/s977043/river-review/issues/2202 （open: 失効が暦のみで、基準を改訂しても旧基準の抑制が残る）
- 安定度: Suppression Context・Riverbed Memory は Experimental。`river suppression add` は CLI（Internal）
- 実体験候補（下記「実体験候補」の #2418 / #2425 / #2430）をこの章で使う
- 【著者確認】#2418 に気づいた経緯（どの作業中に、何を見て「効いていない」と分かったか）

## 5. 指摘の量ではなく、人の判断を記録して次に回す

- 主張: 指摘への Accept / Reject を記録し、繰り返す判断をルールやテストへ移すと、AIに聞く回数そのものが減る。ここは設計途中であることを明記する
- 一次情報:
  - https://github.com/s977043/river-review/issues/1990 （open, Design: Accept/Reject 履歴と Human Attention を改善ループへ接続する）
  - https://github.com/s977043/river-review/issues/1857 （open, Feature: High-Recall の指摘を blocking / advisory / suppressed に意味判定する層）
  - https://github.com/s977043/river-review/blob/main/src/lib/finding-critic.mjs （決定論部分のみ。CLI から到達しない）
- 安定度: いずれも設計中・未配線。「実装済み」と書かない
- 【著者確認】この章を入れるか、末尾の「今後」に短く寄せるか

## まとめ：人が判断する場所を決めるためのチェックリスト

- 主張: 以下を順に決める（読者が自チームに持ち帰れる形）
  1. 出す前に落とす条件（根拠・差分・実行可能性）
  2. 読む順番と、折りたたむ範囲
  3. 人に回す条件と、判定不能時の倒し方
  4. 抑制の期限と取り消し方法
  5. 人の判断をどこに記録するか
- 一次情報: 各章の再掲なし
- 【著者確認】チェックリストに自チーム固有の項目を足すか

## 参考・関連リンク（末尾にまとめる）

- River Review: https://github.com/s977043/river-review
- 初回記事（izanami）: 【著者確認】ai-review-coverage.md の公開 URL（公開後に記入）
- 関連記事（Zenn）: articles/river-review-judgment-placement.md、articles/river-reviewer-v033-improvement-loop.md の公開 URL

<!--
■ 実体験候補（river-review の Issue/PR に事実として残る出来事。採用は著者判断）
- #2418（closed 2026-09-24）: `river suppression add` で作った suppression が phase フィルタで除外され、本番レビュー経路で一度も適用されていなかった。修正 PR は #2424
- #2425（closed 2026-09-24）: #2424 の修正で phase 無し suppression が届くようになった結果、無効化・取り消し済みの suppression も効いてしまう既存制約が表に出た
- #2430（closed）: 期限切れ entry が同じ fingerprint の有効 entry を覆い隠す、active 判定が別経路と逆
- #2202（open）: 抑制の失効が暦のみ
- 使い方の案: 「抑制を作ったのに効いていなかった → 直したら今度は効きすぎる経路が見つかった」という流れで、抑制は入れて終わりではないことを示す（第4章）

■ 【著者確認】一覧
1. 導入: 指摘が多すぎて読まれなくなった実体験
2. 第1章: verifier 導入前後の体感
3. 第2章: 並び順・折りたたみでチームの読み方が変わったか
4. 第3章: 必ず人に回す変更の種類
5. 第4章: #2418 に気づいた経緯
6. 第5章: 章として残すか短縮するか
7. まとめ: 自チーム固有のチェック項目
8. 関連リンク: 初回記事の公開 URL
-->
