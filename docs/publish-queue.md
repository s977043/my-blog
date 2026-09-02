# Publish Queue（手動公開・デッドラインリスト）

> 週次自動化スケジューラは凍結中（[`archive/README.md`](./archive/README.md)）。これは**人が手動で公開する順番＋締切**のリスト。Codex/Gemini 検証：リストだけでは停滞する→**デッドライン必須・不完全でも締切で公開**（相互リンク完成や2本同時を待たない）。

## 公開ルール（凍結期間中）

- 1 件ずつ手動公開。締切が来たら**内容が完璧でなくても publish する**（完璧主義の停滞回避＝Gemini 指摘）
- 手順は各記事内「公開当日チェックリスト」に従う（ignorePublish→false / updated_at / コメント削除 / `npm run check` / `npm run publish:qiita`）
- 公開したら下の Done へ移動し、公開日を記録
- Zenn は `published_at` を締切日 18:00 JST に設定 → release/zenn へ反映（rate-limit 24h/3本厳守）
  - **実観測の注記（2026-08-28 10:45 JST 実測）**: 上記の「24h/3本」より実効はさらに厳しい。`loop-maturity-rubric-audit`（published_at 2026-08-27 14:45 JST）の **18時間13分後**に release/zenn へマージした `river-review-judgment-placement`（sync PR #551、2026-08-27 23:58 UTC マージ）は、マージから約1時間45分経過時点で **HTTP 403** かつ `https://zenn.dev/api/articles?username=minewo&order=latest` に**未出現**＝deploy されなかった。同時刻の対照群 `loop-maturity-rubric-audit` は HTTP 200 / API 出現あり（id 640688）。**rate-limit 数値の正本は [`docs/publish-operating-policy.md`](./publish-operating-policy.md) §Rate-limit 遵守**（実効 ~24h/1本、`check:zenn-pace` は 1 件 WARN / 2 件 FAIL）。この実測はその「実効 ~24h/1本」を支持する追加観測であり、上記の既存表現を置き換えるものではない

## 状態遷移（機械可読）

各 Queue 行は先頭に `[state]` を持つ。**エージェントはこの表の遷移条件だけで状態を進め、`requires-human` に入ったら停止して通知する。**

| state | 意味 | 次へ進む条件（機械判定） |
|---|---|---|
| `backlog` | 候補として起票済み。着手可否は未判定 | 締切が設定され、一次情報の参照先が1つ以上ある |
| `ready` | 着手可能。一次情報が揃っている | 対応する `articles/<slug>.md` が存在する |
| `drafting` | 本文執筆中 | `npm run check` が通る |
| `in-review` | レビュー中 | `reviews/zenn/<slug>.md` の `publish-readiness` が `blocked=false` かつ `mustHigh=0` |
| `ready-to-publish` | 公開待ち | `npm run check:zenn-pace` が FAIL でない |
| `requires-human` | **異常停止**。人間の確認が必要 | （機械では進めない。人間が原因を解消して前の state へ戻す） |
| `done` | 公開済み。live URL と HTTP 200 を記録 | — |

### `requires-human` への遷移条件（異常停止の定義）

以下のいずれかを満たしたら、state を `requires-human` に落として**理由を行末に追記し停止する**。

- `in-review` で改善ループが **5 回**を超えても `mustHigh > 0` が残る
- 改善ループ **2 回連続で `mustHigh` が減少しない**（収束していない）
- `check:zenn-pace` が FAIL（rate-limit 抵触。公開は翌日以降）
- `check:publish-readiness` が `stale`（レビュー後に本文が変わった）
- 一次情報の参照先が実在しない（リンク切れ・削除済みスクリプト）

> **なぜ数値を決め打ちするか**: 「収束しなければ人間へ」だけでは、エージェントは収束していないことを自分で認めない。回数という**外形的な基準**にすることで、判定に主観が入る余地を消す。5 回 / 2 回連続は現時点の暫定値で、実測が溜まったら見直す（この数値自体が仮説）。

## Queue（締切順）

- `[ready-to-publish]` **#12 (note) 締切 2026-09-03**: 「AI駆動開発を「個人技」で終わらせない。チームの仕組みに変えるまで」（`articles_note/new/plangate-team-rollout.md`。PR #524 マージ済み・構成レビュー完了〔P1/P2 指摘なし〕）。一次情報: Growth-Teams-Agent の `docs/team-onboarding/CHANGELOG.md`・`improvement-backlog.md`〔FB-001/031/032〕・`.agents/metrics/`、plangate README。**公開前に人間判断が要る残件**: ①チーム統計・GTA内部情報・改善バックログ由来の実数の公開可否 ②note公開時に目次をON ③ASCII図の実表示確認（2026-08-27 に code block の最大表示幅を 67→38 に圧縮済み。崩れる場合は全体図のみ画像化）

  - 実測（2026-08-28 10:45 JST、マージから約1時間45分経過時点）: `https://zenn.dev/minewo/articles/river-review-judgment-placement` は **HTTP 403**、`https://zenn.dev/api/articles?username=minewo&order=latest` にも **未出現**
  - 対照群: `loop-maturity-rubric-audit` は同時刻に **HTTP 200** / API 出現あり（id 640688、published_at 2026-08-27 14:45 JST）。Zenn 連携そのものは生きている
  - 原因は **Zenn rate-limit** でほぼ確定。`AGENT_LEARNINGS.md` の 2026-05-22 エントリに**同型の先例**がある（`river-review-v033` を前記事の 22.4 時間後に publish → Zenn deploy log に「次の記事は投稿数の上限に達したためデプロイされませんでした」と表示され未反映。同 commit 内の他ファイル更新は deploy 成功）。今回はさらに短い間隔である。loop-maturity の公開（8/27 14:45 JST）から本記事の sync マージ（8/28 08:58 JST）まで **18時間13分**しかあいておらず、規約の 24 時間を下回っている
  - **`[done]` へ移してはならない理由**: `done` の遷移条件は「live URL と HTTP 200 を記録」。現状は 403 / API 未出現で公開が成立していない。マージ済みという事実だけで Done にすると、公開されていない記事を公開済みとして扱い、以後の rate-limit ペース計算と相互リンク作業がすべて誤った前提で進む
  - 人間の判断が要る点: ①さらに待って反映されるか（Zenn 側の遅延の可能性）②反映されなければ release/zenn への空 commit（`git commit --allow-empty`）で再 deploy ③再試行は **前回公開（`loop-maturity-rubric-audit` = 2026-08-27 14:45 JST）から 24 時間以上**あけてから（＝ 2026-08-28 14:45 JST 以降）
- `[ready-to-publish]` **#15 (zenn) 締切 2026-08-31 以降**: 「AIセカンドブレインのマルチエージェント記憶」（`articles/ai-second-brain-multi-agent-memory.md`、`published: false`）。レビュー成果物 `reviews/zenn/ai-second-brain-multi-agent-memory.md` — **2026-08-28 10:45 JST 実測**で `blocked=false mustHigh=0 verified=true loops=1 reviewedAt=2026-08-27T09:41:31Z`、`articleHash=5b87649768cb5df4a159a8c4e42ffbe115972ad5` が `git hash-object articles/ai-second-brain-multi-agent-memory.md` の現行値と**一致（fresh）**。`in-review` の遷移条件（blocked=false かつ mustHigh=0）を満たしたうえで `ready-to-publish` に置いている。**締切を 8/31 以降にしている理由**: 8/28 時点で `check:zenn-pace` が WARN(FAIL相当) 2 件、かつ #13 が deploy 未発火のため、先に #13 の決着を待つ必要がある。着手直前に readiness を**再測**すること（ゲート鮮度: reviewedAt からの経過ではなく articleHash 一致で判定する）
  - **2026-09-02 主張境界レビュー（`oss-article-claim-boundary`）で high 1 / medium 2 を検出・反映済み**（レビュー詳細は `reviews/zenn/ai-second-brain-multi-agent-memory.md` 7 章）。G1 (high): 「記憶を共有する4ツール」に ChatGPT が含まれるが、記事のどこにも接続方法が書かれておらず、冒頭では ChatGPT を「共有できない側」と説明する矛盾があった → 実測（`~/.codex/AGENTS.md` / `~/.gemini/settings.json` に ChatGPT 接続の記述なし）に基づき「記憶を共有する3ツール（Claude/Codex/Gemini）＋ChatGPTは別枠（Hermes運用のプロンプト基盤／人間の手動転記）」に統一。F5 (medium): 同じ実行者説明が2段落連続していた重複を、G1 の修正と同時に1段落へ統合して解消。G2 (medium): Hermes を「役割の呼び名」と説明する本文が、公開済み note 記事（Hermes Agentを「依頼窓口」として導入、`https://note.com/mine_unilabo/n/nc1ac531190c9`）と粒度差で衝突して見える点を、`## 参考` 節へのリンク追加のみで対応（本文の断定は変更せず、AGENTS.md のクロスプラットフォーム参照規約に従い末尾リンク集配下に配置。`npm run check:note-ref` OK）。反映後 `npm run check:publish-readiness -- ai-second-brain-multi-agent-memory` は `blocked=false mustHigh=0` を維持、**articleHash は `5b87649768cb5df4a159a8c4e42ffbe115972ad5` → `b43e3cbbe4329377cece98789e90ffee73cb9822`** に更新。タイトル・`topics`・`published: false`・記事の中心的主張は不変
- `[ready-to-publish]` **#16 (zenn) 締切 2026-09-01 以降**: 「『進めて』駆動のエージェントセッションログ」（`articles/proceed-driven-agent-session-log.md`、`published: false`）。レビュー成果物 `reviews/zenn/proceed-driven-agent-session-log.md`。**2026-08-28 11:0x JST の再レビュー（PR #556）で検出した high 1 件（F1）を同日反映済み**（タイトル前半「踏み外しかけた」→「境界に触れた」。本文・`topics`・`published` は不変）。さらに **2026-09-02 に medium 指摘 F2（「安全機構」のレイヤー未特定）を反映済み**（ケース1 本文に1文追加し、「安全機構」がリポジトリ側の Git hook ではないことを実物照合〔`scripts/hooks/pre-push` は gh アカウント検査のみ〕で特定。ツール許可レイヤーかサンドボックスかは一次記録で裏が取れないため断定していない。タイトル・`topics`・`published`・記事の主張は不変）。反映に伴い readiness を更新し、**`blocked=false mustHigh=0 verified=true`、`articleHash=a26dde3812e6d1e4688ae8c8fb80619ad13e7a2a`**（2026-09-02 実測、`git hash-object articles/proceed-driven-agent-session-log.md` の現行値と一致＝fresh）。`in-review` の遷移条件（blocked=false かつ mustHigh=0）を満たしたため `ready-to-publish` へ移した
  - **F1 (high、反映済み)**: タイトル前半「踏み外し**かけた**3つの瞬間」が、ケース3 は未遂ではなく既遂（PR #258 を丸ごと使ってリカバリした不可逆な作業損失）だという記事の中心的な区別を打ち消していた。前回の high 反映はタイトル**後半**（「止め損ねた」→「機構がまだ無かった」）のみで、同じ不整合が前半に残っていた。2026-08-28 にユーザー確定案で「境界に触れた」へ差し替え済み（変更はタイトル 1 行のみ）
  - **F2 (medium、2026-09-02 反映済み・修正版)**: 記事全体で 16 行言及される「安全機構」がどのレイヤー（ハーネス permission / Git hook / サンドボックス）かを一度も特定していなかった。ケース1 初出箇所（本文）に、実物照合で断定できる「Git hook ではない」（`pre-push` は gh アカウント検査のみ）を1文追加。ツール許可レイヤーかサンドボックスかは一次記録に記載がなく断定を避けている。以降の言及は初出からの参照で読める
  - **未反映のまま残す指摘**: F3（medium: 「漏れ出る」が private リポジトリという実態より強い）/ F4・F5（low）。いずれも公開ブロッカーではなく、著者判断で別途扱う
  - **締切を 2026-09-01 以降にしている理由**: 2026-08-28 時点で `npm run check:zenn-pace` が **WARN(FAIL相当) 2 件**、かつ #13 `river-review-judgment-placement` が Zenn rate-limit により deploy 未発火のまま未決着。新規 publish を重ねると同じ未発火を再発させるため、#13 の決着を待ってから着手する
  - 着手直前に `npm run check:publish-readiness -- proceed-driven-agent-session-log` を**再測**すること（ゲート鮮度は reviewedAt ではなく articleHash 一致で判定する）
- `[ready]` **#11 (zenn) 締切 2026-09-07**: 「worktree 分離だけでは防げない — 並列AIセッションのGit事故を"事後検知"で機械化する」（仮）。一次情報: `scripts/check-pr-staleness.sh`＋テスト、`scripts/hooks/pre-commit|pre-push`、Round 3〜5 の実測インシデント（#404/#405 の squash 済み記事巻き戻し等、`memory/project_parallel_session_metrics.md`）。差別化: 市場は git worktree による事前分離記事が多数だが、同一 working tree での実事故観測データと検知系（staleness チェック・hooks）は空白（theme-discovery 2026-08-10、スコア 17/20）
- `[done]` #7 (zenn-book) は **2026-06-01 公開完了**（下記 Done 参照）。本文・図・cover・5系統＋ultracode レビュー完了後、release/zenn PR #350 マージで go-live
- `[ready-to-publish]` #9 (zenn) は「Bookを多層AIレビューで作った話」。内容は収束済み・公開可。タイミングのみ分離（Book公開→update同期→新規publish の順で間隔を空ける）
- `[done]` #2 公開時、本文「関連記事」の scope-creep 参照に下記 Done の実 Qiita URL を差し込む（相互リンク確定）
- `[done]` #3〜#6 はデザイン三部作 Qiita 化＋PlanGate Qiita 化。Codex 助言に基づく段階公開（PlanGate → DESIGN.md → penpot-react → open-design）。1週ペース・初動の反応とタイトル調整余地を確保
- `[done]` #6（open-design）は Zenn 原典が 2026-05-26 週公開予定のため、Zenn 公開後の cross-post `:::note info` 有効化を**公開作業の前段**に組み込む（コメントアウト退避済み、手順は記事内 HTML コメントに記載）
- `[done]` #8 (open-design) は memory `project_open_design_article_scheduled` で記録済みの予定日。release/zenn rate-limit（24h/5本・1PR3本・24h間隔）を遵守
- 補充は `npm run suggest:theme -- --apply` が自動で行う（引数なしは dry-run）。`[backlog]` の採否だけが人間の判断で、行の作成そのものは人間の仕事にしない。

- `[backlog]` **(zenn) 締切 未設定**: 「check-article-humanizer.js が解いている問題」（自動起票 2026-08-26 / signal:S2:tool / score:4）。一次情報: `scripts/check-article-humanizer.js`
- `[backlog]` **(zenn) 締切 未設定**: 「check-publish-readiness.js が解いている問題」（自動起票 2026-08-26 / signal:S2:tool / score:4）。一次情報: `scripts/check-publish-readiness.js`
- `[backlog]` **(zenn) 締切 未設定**: 「suggest-next-theme.js が解いている問題」（自動起票 2026-08-26 / signal:S2:tool / score:4）。一次情報: `scripts/suggest-next-theme.js`
- `[backlog]` **(zenn) 締切 未設定**: 「Zenn の /api/articles は全件を返さない。件数の突合には articlesCount を使う」（自動起票 2026-08-26 / signal:S1:learning:2026-08-20 / score:3）。一次情報: `/api/articles`、`articlesCount`
- `[backlog]` **(zenn) 締切 未設定**: 「sync-release-zenn.sh の公開影響プレビューは新規ファイル追加を検知しない」（自動起票 2026-08-26 / signal:S1:learning:2026-08-20 / score:3）。一次情報: `sync-release-zenn.sh`

<!-- suggest:theme:insert-here 自動起票はこの行の直前に追記される。締切未設定の候補が締切つきの行より上に来ないよう、位置を固定している。移動・削除するとスクリプトが停止する。 -->

## Done

- 2026-08-31 zenn river-review-judgment-placement https://zenn.dev/minewo/articles/river-review-judgment-placement （queue #13、締切 8/29 を 2 日超過。id 640689、published_at 08:41 JST。**rate-limit hit からの復旧事例**: 8/28 08:58 の sync PR #551 マージが前回公開〔8/27 14:45〕の 18時間13分後で、Zenn が「次の記事は投稿数の上限に達したためデプロイされませんでした」と名指しで拒否。同一 deploy の既存 update 2 件は反映されたため、**rate-limit は新規 publish のみに掛かる**ことが確定した。8/28 19:07 に再実行を予約したがネットワークエラーで失敗し、8/31 08:41 に PR #566 で再実行して公開成功〔前回公開から 90 時間〕。公開3点セット: flip #550 main / sync #551〔hit〕/ 再 sync #566。HTTP 200・og:title・Zenn API 出現・canonical リンク〔#548〕・X 導線〔#539〕の反映をすべて確認済み）

- 2026-08-29 note agent-harness-engineering-note https://note.com/mine_unilabo/n/nd6a5d83d1488 （queue 外の新規執筆。「失敗をモデルのせいにしない。AI駆動開発を『Model + Harness』で考える」。記事本体 #558 → 冒頭・結論を個人の経験起点へ調整 #561 → WXR 再生成・note 手動公開。公開後、過去2記事からのシリーズ導線を #562、関連する前史「AI駆動開発はアジャイルにフィットするのか」への接続を #563 で整備。note公開済みだが、次回公式エクスポート取り込みで `published/nd6a5d83d1488.md` が生成されるまでは `articles_note/new/agent-harness-engineering-note.md` を編集用正本として残す。公開済み記事への相互リンク反映は note 管理画面でまとめて手動対応する）

- 2026-08-27 zenn loop-maturity-rubric-audit https://zenn.dev/minewo/articles/loop-maturity-rubric-audit （queue #14、締切 8/31 から 4 日前倒し。ループ成熟度ルーブリックによる自己採点と改善の記録。公開3点セット: X導線追加 #539 → flip #540 main → sync #541 release/zenn でマージし deploy 発火。HTTP 200・og:title・Zenn API 出現を確認済み〔id 640688、published_at 14:45 JST〕。レビュー経緯は /review-improve-loop 2ループ〔Humanize PASS〕＋ Codex CLI の独立ファクトチェック10件＋セルフレビュー。指摘由来の追随PRが #532 #533 #534。公開時 check:publish-readiness は stale WARN〔recorded=598f2ddb / current=64441e91〕だったが、レビュー後の差分は #539 のX導線4行の追記のみと全件確認のうえ公開した）

- 2026-08-20 note shaping_the_build_note https://note.com/mine_unilabo/n/n5070e13232ce （queue 外の新規執筆、WXR インポート→手動公開。id n5070e13232ce、publishAt 18:37 JST。前記事 `ai_engineering_essence`〔n103182c44979〕の続編として Andrew Ng の Skills Map を起点に企画したが、複数視点レビューで主題を2回転換: ①#517 で Time to Learning を中心に再構成しタイトルを「AIがコードを書く時代、エンジニアは『何を作るか』をどう決めるのか」→「AI時代の開発で短くすべきは、Time to CodeではなくTime to Learning」へ変更②#518 で冒頭に自己紹介と問題提起を加筆〔6,154→7,156字〕。図版は #504 で3点追加後、#517 の再構成で本文参照が1点〔shaping-decision-loop.png〕に減り、#519 でヒーロー画像を新タイトル版へ差し替え。WXR は改稿のたびに再生成が必要で、実際に2回作り直した〔16:02版→18:37版〕。`--base-url` 付き生成→verify_wxr 合格→インポート→手動公開。HTTP 200・note API 出現・eyecatch 設定を確認済み）

- 2026-08-20 zenn ai-review-gate-not-called https://zenn.dev/minewo/articles/ai-review-gate-not-called （queue #10、締切 8/24 から4日前倒し。Humanize ゲートの運用実測記事。当初「review-only Humanizer の設計論」で企画したが、多段レビューで中心主張を2回差し替え: ①4視点構成レビュー〔読者/スクラム・EM/編集/敵対的〕が初期の単一原因論を棄却し n=3 → n=8 の運用実測へ ②ChatGPT/GPT-5.6 Sol が Critical 2件を検出〔Skill の `allowed-tools` を排他的権限制限と誤認・公式仕様照合で訂正／「成果物がない」から「未実行」を推論〕。Codex CLI は事実誤認4件を検出、Gemini CLI は IneligibleTierError で実行不能。セルフ Humanize は passed:false〔F02〕→太字76→45。flip #510 main / sync #511 release/zenn でマージ→deploy 発火、HTTP 200・og:title・API 出現確認済み〔published_at 01:39 JST、id 636381〕）

- 2026-08-02 zenn ai-merge-ready-state-machine https://zenn.dev/minewo/articles/ai-merge-ready-state-machine （queue 外の新規執筆。PlanGate Delivery層〔v8.18〕を題材に「AIにPRを収束させるがマージはさせない」設計。構成案(#493)→ChatGPT執筆→事実検証(コード断片・6ファイル参照が実装と一致)→#495改稿(GitHub権限説明)→一次検証(PRマージ=Contents write をGitHub公式で確認)→/review-improve-loop 2周(Humanize passed)。flip #497 main / sync #498 release/zenn でマージ→Zenn deploy 発火、HTTP 200/API 反映確認済み〔published_at 12:17 JST〕。前回課題だったZenn連携中断は本公開時点で復旧済み）
- 2026-08-02 note ai_engineering_essence https://note.com/mine_unilabo/n/n103182c44979 （新規 note 公開、WXR インポート→手動公開。図解2枚〔Loop/Graph PNG〕付き。`articles_note/new/ai_engineering_essence_note.md` は編集の正本として残置、次回エクスポート取り込みで `published/n103182c44979.md` が自動生成される）
- 2026-07-20 zenn ai-agent-self-improvement-loop-design https://zenn.dev/minewo/articles/ai-agent-self-improvement-loop-design （queue 外の新規執筆。AIエージェントの自己改善を記録・棚卸し・機械化・剪定の4機能として設計。全面改稿→3ペルソナ×最大3ループ→Humanize〔論証観点T11〜T15〕→Codex外部レビュー2回で磨き込み。Loop1 が Skills 切り詰め仕様の事実誤りを検出〔セルフ/Codex 見落とし〕→公式仕様と自環境観測を分離。flip PR #484 main / sync PR #486 release/zenn でマージ→Zenn deploy 発火。デプロイ時に Zenn 側で「リポジトリの参照でエラー」バナーが出たが 1ファイル更新は反映され HTTP 200 / API 出現確認済み〔published_at 09:34 JST〕）
- 2026-06-22 qiita open-design-design-quality https://qiita.com/s977043/items/af06444b664553ecdc8a （queue #6。Zenn「Open Designでデザイン品質を上げる：Penpot契約運用とDESIGN.mdの続編」cross-post、Full レビュー済 PR#286。id:af06444b664553ecdc8a、締切 6/23 から 1 日前倒しで公開。ハイジーン（HTMLコメント削除／private:false・ignorePublish:false／cross-post `:::note info` 有効化）→ `npm run check` 全パス → `publish:qiita` → HTTP 200 反映確認済み）
- 2026-06-15 qiita penpot-react-design-system-contract https://qiita.com/s977043/items/8c4802b14352d6412ea5 （queue #5。Zenn「PenpotとReactを同じ契約で運用するデザインシステムの作り方」cross-post、Full レビュー済 PR#286。id:8c4802b14352d6412ea5、締切 6/16 から 1 日前倒しで公開。ハイジーン（HTMLコメント削除／private:false・ignorePublish:false／updated_at）→ `npm run check` 全パス → `publish:qiita` → HTTP 200 反映確認済み）
- 2026-06-11 zenn ai-review-rate-limit-fallback https://zenn.dev/minewo/articles/ai-review-rate-limit-fallback （queue 外の新規執筆。AIレビューをレート制限で止めない可用性多重化〔L1/L2/L3〕。多段磨き込み（実体験反映→3ペルソナ反復→Gemini L3レビュー→文章推敲→CI文脈除去→de-AI推敲＋3ペルソナ再レビュー）を経て公開。途中 #404 並列セッション衝突を調停。PR #413 main / #414 release/zenn でマージ→Zenn deploy 発火、HTTP 200 反映確認済み）
- 2026-06-10 qiita design-md-guide-and-adoption-log https://qiita.com/s977043/items/1ce6753867f4b166d74b （queue #4。Zenn「DESIGN.md 導入ガイド」cross-post、Full レビュー済 PR#285。id:1ce6753867f4b166d74b、締切 6/9 から 1 日遅れで公開）
- 2026-06-05 zenn river-review-plugin-migration https://zenn.dev/minewo/articles/river-review-plugin-migration （River Review の Claude Code/Codex プラグイン対応記事。queue 外の新規執筆、GitHub README を情報源に構成。Round 1/2 レビュー収束〔PR #379-#382〕→ PR #383 main / PR #384 release/zenn でマージ→Zenn deploy 発火、公開反映確認済み）
- 2026-06-04 note hermes-introduction-note https://note.com/mine_unilabo/n/nc1ac531190c9 （新規 note 公開、WXR インポート→手動公開。`articles_note/new/hermes-introduction-note.md` は編集の正本として残置、次回エクスポート取り込みで `published/nc1ac531190c9.md` が自動生成される）
- 2026-06-04 zenn multi-agent-book-review-workflow https://zenn.dev/minewo/articles/multi-agent-book-review-workflow （queue #9。PR #372 main / PR #373 release/zenn でマージ→Zenn deploy 発火、多層AIレビュー収束済み）
- 2026-06-02 qiita sdd-tdd-nonblocking-agent https://qiita.com/s977043/items/05934596111b9065465d （Zenn「仕様を揃えて止めない…3原則」cross-post、PR #353 改善反映、id:05934596111b9065465d）

- 2026-06-01 zenn-book plangate-guide「AI にコードを書かせる前にやること — PlanGate 実践ガイド」 https://zenn.dev/minewo/books/plangate-guide （全9章/無料、PR #350 で release/zenn マージ→公開。5系統×複数ラウンド＋ultracode レビュー収束、cover 500×700。issue #325）
- 2026-05-18 qiita claude-code-scope-creep-countermeasure https://qiita.com/s977043/items/a25ec91ea411f39bf340
- 2026-05-21 zenn ai-agile-value-increases https://zenn.dev/minewo/articles/ai-agile-value-increases （PR #289 main / PR #290 release/zenn、予定6/6から前倒し公開）
- 2026-05-22 zenn river-reviewer-v033-improvement-loop https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop — 当初 5/22 rate-limit hit でデプロイ拒否、2026-05-25 に release/zenn 空 commit（4ded8e6）で再デプロイ→公開反映確認済
- 2026-05-25 zenn open-design-design-quality https://zenn.dev/minewo/articles/open-design-design-quality （PR #305 main / PR #306 release/zenn、予定5/26から前倒し公開）
- 2026-05-19 qiita ai-coding-preflight-checklist https://qiita.com/s977043/items/b8dacca4ce2d9079454a （queue 上に残存していた古い #2 を実態に合わせて Done へ移動）
- 2026-05-27 qiita plangate-ai-coding-workflow https://qiita.com/s977043/items/6041bbc2659412341d54 （PR #314 経由で公開、予定6/2から前倒し）
- 2026-05-28 qiita multi-ai-discussion-roadmap-rewrite https://qiita.com/s977043/items/4e89a93c2ebfb928e2b1 （PR #319 経由で公開、予定6/30から前倒し、note原典 n5fe2e97b9600 cross-post）
