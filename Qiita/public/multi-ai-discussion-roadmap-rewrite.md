---
title: "AIエージェント3種で戦略議論したら、OSSロードマップの主軸が根本から変わった話"
tags:
  - AI駆動開発
  - ClaudeCode
  - Codex
  - Gemini
  - OSS
private: true
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: true
---

<!--
公開メモ（公開前に削除）:
- 初期状態: private: true / ignorePublish: true（ローカル下書き）
- Qiita へ限定共有: private: true / ignorePublish: false
- 一般公開: private: false / ignorePublish: false
- 公開当日に updated_at を更新し、本コメントを削除してから npm run check → publish:qiita
- 元記事(Zenn): https://zenn.dev/minewo/articles/multi-ai-discussion-roadmap-rewrite
- 元記事(note): https://note.com/mine_unilabo/n/n5fe2e97b9600
- 公開後に下記 :::note info を有効化して Zenn 原典リンクを表示
-->

<!--
Qiita 公開時に有効化する :::note info（コメントアウト解除して公開）:

:::note info
本記事は、note に掲載した [AIエージェント3種で戦略議論したら、OSSロードマップの主軸が根本から変わった話](https://note.com/mine_unilabo/n/n5fe2e97b9600) を Qiita 向けに再構成したものです。
:::
-->

私は PlanGate という、AI コーディングエージェント向けの軽量ガバナンスハーネスを個人 OSS として開発しています。

v8.7.0 では「自己進化フレーム（Steering Loop / Trace Timeline / Dogfooding Eval）」を主軸に据えるつもりでした。ところが Claude Code / Codex CLI / Gemini CLI の 3 種を使い分けて 5 ラウンドのディスカッションを回したところ、最終的に v8.7.0 の主軸は「自己進化機能」から「OSS 整備（段階導入ガイド・Plugin 成熟化・バージョニング安定性）」に組み替わりました。

この記事は、その 2 日間の意思決定プロセスの実践記録です。マルチエージェント議論を「どう設計したか」「どこで何を覆されたか」「結局どう決まったか」を、再現可能なパターンとして残します。

なお、本記事の「Round 1〜5」は、残っている 5 本の議論ログを記事用に 5 段階へ再構成した呼び方です。実際には各ログの中で複数回のやり取り（サブラウンド）を重ねており、原本のラウンド番号と 1 対 1 で対応するものではありません。「Round 3：Gemini」も時系列上の 3 回目という意味ではなく、5 段階のうち外部知見と照合したフェーズを指します。

## 想定読者と前提

- Claude Code / Codex CLI / Gemini CLI のいずれかを触ったことがあり、AI エージェントを複数併用して設計判断を回したい OSS 開発者・プロダクト設計者
- 個人 OSS のロードマップ策定を題材にしていますが、議論の組み立て方は他の設計判断にも応用できる前提で書いています

## TL;DR

- 発端は SpeakerDeck の Steering Loop（観測ループ）に関する講演。これを自プロダクトに取り込む方針を Claude × Codex で 3 反復詰めた
- Round 3 で Gemini に外部知見と突合させると、OpenTelemetry GenAI / Token 必須化 / multi-judge AC など複数の「業界常識」推奨が出てきた
- Round 4 で同じ Codex に Devil's Advocate を依頼すると、Gemini 推奨の多数を「PlanGate の現実制約に合わない」と覆した
- Round 5 で「外部 OSS 利用者視点」を入れた瞬間、議論の前提だった「自己進化を v8.7.0 の主役にする」こと自体が外れた
- 結果、v8.7.0 主軸は OSS 整備（段階導入ガイド / Plugin 成熟化 / バージョニング安定性）に組み替わり、自己進化機能は optional / experimental に格下げ

合意を作る議論ではなく、**異なる視点で前提を壊しに行く議論** を回すと、ロードマップの主軸そのものが動きます。

## 発端：Steering Loop の講演を読んだ

きっかけは SpeakerDeck で公開されていた [Practical Harness Engineering — Understanding Steering Loops](https://speakerdeck.com/nrslib/practical-harness-engineering-understanding-steering-loops-through-real-world-examples) という講演資料でした。

要点は、AI エージェントの実行を `events.ndjson` のような追記型ログに残し、全制御点を replay 可能にする「観測ループ」を作るというものです。PlanGate には既に `events.ndjson` ベースの Metrics v1 があり、これを Trace Timeline / Dogfooding Eval に発展させる構想を持っていたため、講演内容と自分の構想を突き合わせたくなりました。

ここから、記事上 5 段階に整理したディスカッションが始まります。

## Round 1-2：Codex で Steering Loop と自己進化軸を詰める

最初の 2 ラウンドは Codex CLI で進めました。Codex は「同じ前提を共有したまま深掘りと批判を交互に出してくれる」という特性があり、内部設計の詰めに向きます。

- **Round 1（Steering Loop 強化方針）**: events schema を v2 に上げる案を出したところ、Codex が「破壊的変更ではなく schema 1.1 additive bump で十分」と返してきました。schema 互換性は私が見落としていた点で、ここで方針が修正されました。同時に Trace Timeline v1 + Gate Event Normalization を新規 PBI として起票する案がまとまります
- **Round 2（自己進化軸の網羅）**: 「自己進化」と一言で言っていたものを 15 軸 4 階層に分解しました。ここで Codex が出した整理が面白くて、**Steering Loop は自己進化の中心ではなく、観測・再現の基盤に過ぎない** という結論になりました。中心は「評価 → 学習 → ガバナンス」というループのほう、と

この時点で私は「Trace Timeline v1 を v8.7.0 の主役に据えれば良い」と思っていました。Round 2 の結論を Codex 単独で出した直後だったので、自信もありました。ここまでは合意形成のループです。

## Round 3：Gemini で外部知見と照合する

Round 3 では、ここまでの結論を Gemini CLI に渡して、業界・学術の類似フレームと突合してもらいました。Gemini は Web 検索を組み合わせて外部ソースを引用できるので、「自分たちの設計が業界のどの流れに乗っているか」を確認する用途に向きます。

Gemini からは具体的な引用つきで以下のような対応関係が返ってきました。

| PlanGate 概念 | 業界対応 |
|---|---|
| 観測 → 評価 → 学習 → ガバナンス | MAPE-K（IBM Autonomic Computing の自律制御モデル） |
| 半年順序の妥当性 | AI Hierarchy of Needs（Monica Rogati: データ基盤→分析→ML の優先順） |
| 観測時のタグ付け先行 | Data Engine（Karpathy / Tesla: データ収集→評価→改善の循環） |
| dogfooding eval | Braintrust / Inspect AI / Aider Benchmarks（LLM 評価 OSS 群） |

ここまでは「業界の主流と整合している」というポジティブな照合結果です。問題はその後で、Gemini が「PlanGate が見落としている観点」として以下を「入れるべき」と推奨してきました。

- **OpenTelemetry GenAI Semantic Conventions** 準拠（`gen_ai.prompt` / `gen_ai.usage.tokens` 等の標準属性名）
- **Token / Cost attribution** の必須フィールド化（events.ndjson にトークン使用量とモデル名を必須）
- **LLM-as-a-Judge の不確実性管理**（同一トレースを複数 Judge にかけて一致率を出す）

外部ソース URL つきで、いずれも業界事例として妥当に見えます。私は素直に「これは v8.7.0 に取り込んだほうがよさそうだ」と考えました。

Round 3 終了時点では、Gemini 推奨を全部のせる方向で固まりかけていたわけです。

## Round 4：同じ Codex に Devil's Advocate を依頼する

ここで意図的に進路を変えました。Round 3 の Gemini 推奨を、Round 1-2 と同じ Codex に「Devil's Advocate として批判してほしい」と渡したのです。

「同じエージェントに賛成と反対を別ラウンドで言わせる」のは、合意形成バイアスを崩すために有効でした。Codex の Devil's Advocate ラウンドの結論は明快で、Gemini 推奨のうち以下を撤回・延期すべきと判定しました。

- **OpenTelemetry GenAI 準拠** → 撤回。理由は、PlanGate は単一セッション中心で分散トレーシングが要らない段階のため、独自 schema の上に OTel 互換 layer を被せる維持費が外部 OSS 価値を上回る
- **Token / Cost 必須化** → 撤回。理由は、events.ndjson に必須フィールドを増やすと既存 reader が壊れる。additive で「あれば使う」が筋
- **multi-judge consensus を AC に入れる** → 撤回。理由は、現状 PlanGate に Judge は C-3/C-4 ゲート 2 種しかなく、一致率を測る対象がない
- **"Promising Trace" フラグ機能** → 延期。Tesla Data Engine の思想は理解できるが、v8.7.0 の段階で入れると「観測機能」より「分類機能」が先行して目的がブレる

Devil's Advocate ラウンドはさらに、仮想的な反対 PBI として **Run Outcome Review v1**（run 単位の振り返り 5 項目テンプレート: 目的 / 実行サマリ / 失敗点 / 学び / 次アクション）を逆提案してきました。Trace Timeline が「観測の基盤」を提供するのに対し、Run Outcome Review は「振り返りの型」をそのまま配布するため、OSS 利用者に価値が届くまでの距離が短い、という主張です。

この時点で、Round 3 で「業界整合」と納得していたものが、半分以上ひっくり返りました。**外部知見は権威ではなく、検証対象** であることを思い知らされたラウンドです。

## Round 5：外部 OSS 利用者視点で主軸を組み替える

Round 4 まで全部、議論の前提は「私（作者）の運用」でした。PlanGate は OSS として公開しているのに、4 ラウンド全部で外部利用者の存在が暗黙だったわけです。

Round 5 では Codex に「これまでの全議論が 1 人運用前提だったことを認めた上で、新規 OSS 利用者・3〜10 人チーム導入視点で批判的に再評価してほしい」と依頼しました。

返ってきた結論で、特に効いたのが次の一行です。

> PlanGate の OSS 価値は「AI 開発の安全な型を配布すること」であって、「作者の運用ログを高度化すること」ではない。

これでロードマップの前提が崩れました。Codex の整理によると、外部利用者にとっての本当の価値は次の 3 つで、Trace Timeline 中心ではどれも直接は満たしません。

1. 自分の AI 開発 run がなぜ失敗したかを後で説明できる
2. チームで plan / review / handoff の品質を揃えられる
3. PlanGate 自体の更新で既存運用が壊れないと判断できる

そして v8.7.0 の最優先 3 件として、自己進化機能ではなく以下を主軸に据えるべきと提案してきました。

- **[#226 段階的導入ガイド](https://github.com/s977043/plangate/issues/226)**（Level 1: plan 承認だけ → Level 5: eval / timeline までの段階定義）
- **[#224 Plugin 成熟化](https://github.com/s977043/plangate/issues/224)**（plugin 解決順 / prefix / 更新手順 / 二重 install 回避）
- **[#225 バージョニング安定性ポリシー](https://github.com/s977043/plangate/issues/225)**（breaking change vs additive の定義、既存 TASK artifact の扱い）

「自己進化」という単語自体も、外部表現としては `run review` / `timeline` / `regression check` のような実務語彙に置き換えるべき、と。

## 着地：ロードマップを Option B から Option D に組み替える

Round 5 までの結論を反映して、v8.7.0 milestone を組み替えました。元計画（Option B）と確定版（Option D）の差分は次のとおりです。

| 順位 | 元計画（Option B） | 確定版（Option D） |
|---|---|---|
| 主 | Trace Timeline v1 | **段階的導入ガイド** |
| 主 | Run Outcome Review v1 | **Plugin 成熟化** |
| 主 | （なし） | **バージョニング安定性ポリシー** |
| 副 | Gate Event Normalization | Run Outcome Review v1 |
| 実験 | （なし） | Trace Timeline v1（experimental） |
| 延期 | （v8.8.0） | Dogfooding Eval v1（外部 fixture を意識） |

主軸 3 件が全部入れ替わっています。元計画で主役だった Trace Timeline v1 は experimental に格下げ、Run Outcome Review v1 は副に降格、代わりに OSS 整備 3 件が P0 に上がりました。

この変化は、単なる優先順位の入れ替えではなく、価値の届け先が変わった結果です。

ロードマップ書き換えと README / philosophy への本質的価値メッセージ反映は別 PR に分けてマージ済みで、押し出された PBI は次のマイルストーンへ移しました。

<details>
<summary>実際に反映した PR / Issue</summary>

- ロードマップ書き換え + 5 議論ログ commit: [PR #232](https://github.com/s977043/plangate/pull/232)（マージ済み）
- README / philosophy へ本質的価値メッセージ反映: [PR #233](https://github.com/s977043/plangate/pull/233)（マージ済み）
- v8.7.0 主軸組み替え: #226 / #224 / #225 を P0 に昇格、#197 を v8.8.0 へ押し出し、#228 / #229 を新規起票
- v8.8.0 整備: #230 / #231 を新規起票
- EPIC [#193](https://github.com/s977043/plangate/issues/193) に sub-issue 7 件を紐付け

</details>

## マルチエージェント議論の実践 Tips

このプロセスから、汎用化できそうな実践 Tips を 4 つ抽出します。

### 1. エージェントの役割を最初に決めておく

3 種を「使い分け」ましたが、実際に効いたのは役割分担を明示したことでした。

- **Claude（Opus 4.7）**: 統合・進行役。回答者というより、各ラウンドの問いを構造化し、Codex / Gemini の回答を受けて結論を次ラウンドへ渡す立場。3 種を同列の回答者として並べたわけではない
- **Codex CLI**: 深掘り・批判役。同じ前提を共有したまま反復でき、Devil's Advocate も担える
- **Gemini CLI**: 外部知見役。Web 検索と引用 URL で「業界事例との突合」に使う

役割を決めずに 3 種を並列で投げると、それぞれが「総合的に答える」モードに入って差が出ません。私は今回、ラウンド開始前に Claude 側のプロンプトで 3 種の役割を明文化してから走らせました。

### 2. 「合意ラウンド」と「反証ラウンド」を分ける

Round 1-3 までは合意を積み上げるラウンドで、Round 4 が反証ラウンドでした。同じエージェントに連続で賛否を出させる設計は、合意形成バイアスを切るのに効きます。

特に Round 4 を「Round 3 の結論を批判してくれ」と明示したのが効きました。批判の対象範囲を絞ると、Devil's Advocate ラウンドが「全部反対」にならず、撤回 / 延期 / 維持の三択で答えてくれます。

私は次回、Round 4 を「賛成側 Codex」と「反対側 Codex」の 2 セッションに分け、別コンテキストで衝突させてみるつもりです。同一セッション内の Devil's Advocate より、前提共有が切れる分だけ反証が鋭くなるという仮説を検証したいからです。

### 3. 外部知見は権威ではなく検証対象として扱う

Round 4 で効いたのは、「Gemini の推奨をそのまま渡して批判してくれ」ではなく、「自分たちの現実制約（単一セッション中心 / Judge は 2 種のみ / 1 人運用）を先に明示してから、その制約に照らして批判してくれ」と頼んだことでした。制約を先に渡すと、Devil's Advocate ラウンドが「全部反対」ではなく「撤回 / 延期 / 維持」の三択で具体的に答えてくれます。

外部知見をそのまま採用する流れに乗りそうなときほど、私は「引用が正しいか」ではなく「自分たちの制約に対して妥当か」を別ラウンドで検証するようにしています。

### 4. 「外部利用者視点」は最後ではなく最初に入れる

これは反省点でもあります。Round 5 で初めて「外部 OSS 利用者視点」を入れたら、議論の前提が崩れて主軸が動きました。本来はもっと早い段階、できれば Round 1 で「これは誰のための機能か」を固めておくべきでした。

OSS の機能設計で議論を回すなら、最初のラウンドで「作者個人最適化 vs 外部利用者価値」の判別軸を明示しておくと、後半で前提崩壊を起こさずに済みます。私は次回から、Round 1 のプロンプト冒頭に「この機能は誰の、どの課題を解くのか」を必須項目として書き込み、各ラウンドの結論をその軸で必ず一度照合する運用にするつもりです。

## おわりに

5 ラウンドのディスカッションを通じて、私は v8.7.0 の主軸を Trace Timeline から OSS 整備に組み替えました。表面的な結果は「マイルストーンの組み替え」ですが、本質的に得たのは **「合意よりも異なる視点を価値にする議論の組み方」** でした。

エージェントを「便利な相談相手」として 1 種だけ使うと、合意は早く取れますが前提は崩れません。役割を分けた 3 種に、合意ラウンドと反証ラウンドを設計して回すと、自分が見落としていた前提そのものに辿り着けます。

このプロセスはどの OSS / プロダクト設計にも応用できると感じています。次に重要な設計判断を回すときも、同じパターンで議論を組むつもりです。

## マルチエージェント議論のFAQ

### Q. Claude Code / Codex CLI / Gemini CLI のうち、1種だけで議論するなら何を選びますか？
A. 役割で選びます。設計の深掘りなら Codex、外部知見の照合なら Gemini、進行と統合なら Claude です。1種に絞ると「合意は早いが前提は崩れない」状態になりやすいので、最重要の意思決定では最低2種は使う前提で組むのが現実的です。

### Q. 5ラウンドは多すぎませんか？2〜3ラウンドで切り上げる判断はどこで？
A. 「外部利用者視点を入れたか」「Devil's Advocate を1回挟んだか」の2点を満たしていれば 2-3ラウンドで切り上げても可です。今回 5ラウンドかかったのは、Round 5（外部利用者視点）を最後に入れた結果として主軸が崩れたためで、Round 1 で先に入れていれば全体は短縮できました。

### Q. Devil's Advocate ラウンドが「全部反対」になって有用な結論が出ないことはありませんか？
A. あります。対策は「現実制約（運用規模 / Judge数 / 既存ユーザー数）を先に明示してから批判を依頼する」ことです。制約なしで批判だけ頼むとエージェントは安全側に倒して全部反対に寄ります。撤回 / 延期 / 維持の三択で答えさせるプロンプト設計にすると、具体的な判断が返ってきます。

### Q. マルチエージェント議論のログは何に残していますか？
A. ローカルの Markdown ファイル（議論セッションごとに1ファイル）に残し、リポジトリの `docs/discussions/` 配下にコミットしています。後から「あの判断はどのラウンドで覆ったか」を辿れるようにするためで、Codex / Gemini どちらの出力かは見出しで明示します。ログを残さずに進めると、同じ議論を別の機能で再発見してしまうコストが大きいです。

### Q. このパターンはチーム開発でも使えますか？個人 OSS との違いは？
A. 使えますが、議論ログをチームメンバー全員が読める場所に置く必要があります。Slack スレッドや GitHub Discussion で「ラウンド単位」にスレッドを分けると振り返りやすいです。チームで使う場合、Round 5 相当の「外部利用者視点」はステークホルダー（PdM / カスタマーサクセス）に直接依頼するのが効きます。
