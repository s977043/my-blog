---
title: "AIレビューの指摘が多すぎて読まれないとき、どこで絞り、何を人に回すか"
summary: "AIコードレビューの指摘が増えすぎると、チームは重要な指摘まで読まなくなります。どのAIレビューツールでも決められる4つの線引き（出す前に絞る、読む順番、人に回す出口、黙らせた指摘の見直し）を、OSSの実装例とあわせて整理します。"
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
- 読者は Copilot や CodeRabbit などの既製ツールの利用者を主に想定する。各章に「既製ツールの利用者ができる代わりの手段」を1行置く。ツールの設定名・ファイル名を書くときは、執筆時に各ツールの公式ドキュメントで確認する（未確認の設定名は書かない）
- River Review の実装を引くときは「2026-09-24 時点の実装例で、将来の互換性は保証しない」を本文で一度だけ明記し、安定度ラベルは本文で繰り返さない
- 各章の必須要素は「設計判断」と「持ち帰る問い（No なら最初の一手）」。失敗例は、著者確認が取れた章か公開一次情報で確認できる章だけに書く
- 字数の配分目安: 導入 400字、各章 800字、まとめ 400字（合計 4,000字前後）
- 実体験の扱い: 第4章は公開 Issue で確認できる事実として書く。著者本人の一人称の場面は、著者確認が取れたものだけ書く
- 公開条件: 初回記事 ai-review-coverage.md を先に公開し、その URL を末尾に入れてから本記事を公開する
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
- 量の測り方を1〜2行入れる: 直近20件程度のPRで、PR 1件あたりの AI 指摘数（重複を除く）と採用率を数える。採用率は「重複を除いた AI 指摘」を分母、「修正された、または明示的に受け入れられた指摘」を分子にする。保留・却下は分子に入れない。新しい章にはしない
- 一次情報: なし（問題提起）。著者確認が得られなければ「起こりうる運用上の問題」として書き、効果を断定しない
- 【著者確認】AIレビューの指摘が多すぎて、チームが読み飛ばすようになった実体験の有無と具体的な場面（件数・期間は分かる範囲で）

## 1. 指摘を減らす前に、指摘を「出す前」に落とす

- 主張: 件数を減らす第一段は、人が読む前に「形式として成り立たない指摘」を機械で落とすこと。ただし機械で検査できるのは形式と根拠の有無までで、「今回止めるべき指摘か」という意味の判断は機械では決まらない。この2つを分けて設計する
  - 用語の区別（本文では1文の定義にとどめ、見出しや箇条書きの軸にしない）: 「根拠の置き場所」（指摘の根拠として示す差分）と「問題の所在」（指摘している問題があるコード）
  - 機械で検査できる例（River Review の現在の実装の主な項目。いずれも書式の検査）: 根拠（Evidence）の記述があるか、根拠でファイル名を挙げた場合にそのファイルが差分に含まれるか（ファイル名がなければ通す。行単位の確認はしない）、一定の長さの修正提案があるか、重要度がその観点で宣言した上限を超えていないか、指摘の工程（phase）がファイル種別や観点の宣言と噛み合っているか
  - 機械で決まらないもの: 重要度の理由が妥当か、今回のPRで止めるべきか。これは人（またはレビュー方針）の判断領域として残す
  - 区別して書く: 根拠で差分の外のファイルを名指しした指摘は落とす。一方、問題の所在が差分の外（既存コード）であることは、それだけでは棄却理由にせず、範囲の情報として残す（扱いは第2章の並び順で決める）
  - 既製ツールの利用者の代わりの手段: ツールの指示ファイルやレビュー指示に「根拠として、差分に含まれるファイルと箇所を示す」「意図が説明されている軽微な点は指摘しない」と書く
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/verifier.mjs （ルールベース、LLM を呼ばない。検査結果として reject の可否と理由を返し、呼び出し側が reject された指摘を出力から外す）
  - https://github.com/s977043/river-review/issues/1857 （open: 意味判断の層は未実装の設計課題）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§3 禁止事項: 過度な推測・抽象的なレビュー・範囲外の指摘。§3.1: 差分外の欠落を棄却できない場合は finding ではなく question として返す）
- 安定度: verifier は公開サーフェス外の内部実装。review-policy はレビュアーが従う方針として公開
- 補足候補: 意図コメントで指摘を取り下げてよいのは軽微な指摘だけで、セキュリティ・データ喪失・正しさのリスクは取り下げない（review-policy §3.1）。「減らしすぎ」への歯止めとして書く
- 持ち帰る問い: 自分たちの AI レビューは、人に見せる前に何を落としているか。意味の判断まで機械に任せていないか
  - No なら最初の一手: レビュー指示に「根拠として差分の箇所を示す」ことを必須として書く
- 【著者確認】verifier の検証を入れる前後で、読まれない指摘が減ったと感じたか（数値がなければ感覚でよいか）

## 2. 読む順番を決める：先頭で「直すべきものがあるか」だけ分かるようにする

- 主張: 全件を同じ重さで並べると読まれない。先頭に判定と重要度別件数を置き、Critical/Major だけ展開し、Minor/Info は件数付きで折りたたむ。折りたたみは削除ではない。第1章で残した「問題の所在が差分の外にある指摘」は消さず、並び順で後ろに回す
  - 既製ツールの利用者の代わりの手段: 重要度の高い指摘だけを PR の要約欄やチャット通知に流す。要約欄に重要度別の件数を出させ、軽微な指摘は消さずに後ろへ回す
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§2.5 提示順と段階的開示、§6 優先順位 Critical/Major/Minor/Info）
  - https://github.com/s977043/river-review/blob/main/src/lib/team-lead-synthesizer.mjs （consensusLevel → severity → scope の順で並べる。「差分の外にある」ことは「重要でない」ことではない、という設計理由がコメントにある）
- 安定度: 並び順の実装は内部。severity の意味論は Stable（Skill Schema）
- 持ち帰る問い: レビュー結果を開いて最初の数行で「直すべきものがあるか」が分かるか
  - No なら最初の一手: 重要度の高い指摘の件数だけを先頭（要約）に出すようにする
- 【著者確認】折りたたみ・並び順を変えたことで、チームの読み方が変わった経験があるか

## 3. 人に回す条件を先に決める：AIの判定を最終結論にしない

- 主張: 「人が全部読む」でも「AIが全部決める」でもなく、判定の出口を分けておく。本記事の独自点は次の2つに絞り、ESCALATE 条件の列挙は短くする
  - 出口を日本語で定義する: 「通す」「通すが後で人が見る」「止めて直させる」「人に判断を渡す」。River Review の現行実装例では GO / GO_WITH_OBSERVATION / NO_GO / ESCALATE に当たる
  - 「止めて直させる」と「人に判断を渡す」を区別する。River Review の現行実装例では、未実行・未確定のように判定材料が足りないときは「通す」ではなく「止めて直させる」に倒し、人の判断が要る条件は「人に判断を渡す」に分けている。判定できない理由によって出口を分ける設計もある（例: 決定論的な検査がそもそも実行できない場合は「人に判断を渡す」とする判定規則。2026-09-24 時点では規則だけがあり、まだ使われていない）。一般則ではなく設計選択肢の一例として書く
  - ESCALATE の条件は列挙しない（判断配置の記事と重なるため）。条件の詳細は gate-decision.mjs へのリンク1本で済ませる
  - 「通すが後で人が見る」で、読む量を減らしつつ人の目を残す
  - 本文に条件表の雛形を置く: 行＝変更の種類、列＝4つの出口。各行の出口は1つに決めるルールを添え、記入例を1行だけ入れる（例: 「レビューが最後まで実行されなかった → 止めて直させる」）。残りは空欄で読者が埋める
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/gate-decision.mjs （GO / GO_WITH_OBSERVATION / NO_GO / ESCALATE の判定規則。ゲート設定自体の変更は無条件に ESCALATE。未知・未判定は NO_GO。NO_GO は「直す」出口で、人が判断する段階ではないとコメントにある。DETERMINISTIC_UNRUNNABLE → ESCALATE は規則のみで入力元は未配線）
  - https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md （gate 判定の終了コード: GO / GO_WITH_OBSERVATION=0、NO_GO=1、ESCALATE=3 が Stable）
  - https://github.com/s977043/river-review/blob/main/pages/reference/review-policy.md （§8 レビューモードルーター。risk-map の `require_human_review` に当たると human-required）
- 安定度: 終了コードの意味は Stable。Risk Map は Experimental。`river review route` は CLI（Internal）
- 書き方: River Review は「設計例」に留め、CLI や Risk Map の操作手順は案内しない。読者への持ち帰りはツールに依存しない「人が見る条件表を先にチームで合意する」とする
- 持ち帰る問い: 自分たちのレビューには「止めて直させる」「人に判断を渡す」「通すが後で見る」の出口が別々にあるか。判定できないときの扱いをチームで合意しているか
  - No なら最初の一手: 条件表の雛形を埋めて、チームで一度合意する
- 【著者確認】自分のチームでは、どの種類の変更を人の判断に必ず回すことにしているか（例を1〜2個）

## 4. 指摘を黙らせる仕組みにも検証が要る

- 主張: 毎回同じ指摘が出るとノイズになる。ただし抑制（suppression）は「黙らせる」操作なので、期限・取り消し・基準改訂時の扱いを設計しないと、効かない抑制や効きすぎる抑制が生まれる。ノイズを減らす仕組みにも検証が要る
- 章の冒頭の問いを読者向けにする: 黙らせた指摘（抑制・resolve・学習させたルールなど）の一覧を、いつ誰が見直すか
- 既製ツールの利用者の代わりの手段: resolve した指摘・無視させた指摘・レビュー指示で除外した観点を一覧にしておき、決めた時期に見直す
- 書き方: Issue の経緯は「1つの観測例」として1段落に縮め、「効いていなかった（#2418）→ 直したら効きすぎた（#2425）」の2段にする。#2430 は注記に回す。主文は「抑制には失効・取り消し・基準変更時の見直しを設計する」に置く。Experimental な機能で観測した事例として書く。現在の挙動（期限・取り消しを見る、基準改訂時に止める判定は任意で有効化）と、修正までの経緯（#2418 → #2425 → #2430）を混同しない
- 一次情報:
  - https://github.com/s977043/river-review/blob/main/src/lib/suppression.mjs （失効は `context.expiresAt` を見る）
  - https://github.com/s977043/river-review/issues/2202 （open: 失効が暦のみという課題。基準改訂時に抑制を止める判定は Phase 2 として任意で有効化する形で実装済み）
  - https://github.com/s977043/river-review/issues/2418 、/2425 、/2430 （closed: 実体験の事例）
- 安定度: Suppression Context・Riverbed Memory は Experimental。`river suppression add` は CLI（Internal）
- 実体験候補（下記「実体験候補」の #2418 / #2425 / #2430）をこの章で使う
- 持ち帰る問い: 抑制を作ったあと、それが実際に効いているか、効きすぎていないかを確かめる手段を持っているか
  - No なら最初の一手: 黙らせた指摘の一覧を見直す日を決める（例: 四半期ごと、レビュー基準を変えたとき）
- 実体験（著者確認済み 2026-09-25）: 抑制に「レビュー基準が変わったら止める」失効条件を追加し（PR #2417）、本番のレビュー経路で効くか確かめたところ、`river suppression add` で作った抑制がそもそも1件も届いていなかった（#2418）。作成は成功し一覧にも残るため、利用者からは効いているように見えていたが、それまでずっと効いていなかった。直すと、今度は取り消し済みの抑制まで効くようになった（#2425）
  - 書き方: 一人称で1段落。「効いていなかった → 直したら効きすぎた」の2段。連鎖をどう見つけたか（誰のレビューか）は著者未回答のため書かない

## まとめ：どこで絞り、何を人に回すかのチェックリスト

- 主張: 以下を順に決める（読者が自チームに持ち帰れる形）
  1. 出す前に機械で落とす条件と、機械に任せない意味判断の線引き
  2. 先頭に何を置くか、読む順番と折りたたむ範囲
  3. 止める・人に渡す・通すが後で見る、の出口と、判定不能時の倒し方
  4. 抑制の期限・取り消しと、抑制が効いているかの確かめ方
- 導入順（手間の小さい順）: ①導入で測った指摘数と採用率を基準にする → ②人に回す条件表を合意する → ③出させない指摘をレビュー指示に書く → ④黙らせた指摘の見直し日を決める。各章の「最初の一手」はこの順序と矛盾しない範囲で1行にとどめる
- 一次情報: 各章の再掲なし
- 【著者確認】チェックリストに自チーム固有の項目を足すか

## 参考・関連リンク（末尾にまとめる）

- River Review: https://github.com/s977043/river-review
- 初回記事（izanami）: 【著者確認】ai-review-coverage.md の公開 URL（公開後に記入）
- 関連記事（Zenn）: https://zenn.dev/minewo/articles/river-review-judgment-placement 、https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop （判断の記録と改善ループは本文では扱わない）

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
5. ~~第4章: #2418 に気づいた経緯~~ → 確認済み（2026-09-25）
6. まとめ: 自チーム固有のチェック項目
7. 関連リンク: 初回記事の公開 URL
-->
