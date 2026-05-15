---
title: "AIエージェント3種で戦略議論したら、OSSロードマップの主軸が根本から変わった話"
emoji: "🗣️"
type: "tech"
topics: ["ai", "claudecode", "codex", "gemini", "oss"]
published: false
---

私は PlanGate という、AI コーディングエージェント向けの軽量ガバナンスハーネスを個人 OSS として開発しています。

v8.7.0 では「自己進化フレーム（Steering Loop / Trace Timeline / Dogfooding Eval）」を主軸に据えるつもりでした。ところが Claude Code / Codex CLI / Gemini CLI の 3 種を使い分けて 5 ラウンドのディスカッションを回したところ、最終的に v8.7.0 の主軸は「自己進化機能」から「OSS 整備（段階導入ガイド・Plugin 成熟化・バージョニング安定性）」に組み替わりました。

この記事は、その 2 日間の意思決定プロセスの実践記録です。マルチエージェント議論を「どう設計したか」「どこで何を覆されたか」「結局どう決まったか」を、再現可能なパターンとして残します。

:::message
この記事で得られること

- 3 種の AI エージェントを役割分担して議論を回す具体的な進め方
- 「外部知見」と「Devil's Advocate」を別ラウンドで入れる効果
- OSS 機能設計で「作者個人最適化 vs 外部利用者価値」を判別する観点
- 5 ラウンドの実議論から得た、合意ではなく反証を価値にする設計判断
:::

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

ここから 5 ラウンドのディスカッションが始まります。

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
| 観測 → 評価 → 学習 → ガバナンス | MAPE-K（IBM Autonomic Computing） |
| 半年順序の妥当性 | AI Hierarchy of Needs（Monica Rogati） |
| 観測時のタグ付け先行 | Data Engine（Karpathy / Tesla） |
| dogfooding eval | Braintrust / Inspect AI / Aider Benchmarks |

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

Devil's Advocate ラウンドはさらに、仮想的な反対 PBI として **Run Outcome Review v1**（run 単位の振り返り 5 項目テンプレート）を逆提案してきました。「Trace Timeline よりこちらのほうが OSS 利用者には価値が直接届く」という主張です。

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

- **#226 段階的導入ガイド**（Level 1: plan 承認だけ → Level 5: eval / timeline までの段階定義）
- **#224 Plugin 成熟化**（plugin 解決順 / prefix / 更新手順 / 二重 install 回避）
- **#225 バージョニング安定性ポリシー**（breaking change vs additive の定義、既存 TASK artifact の扱い）

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

ロードマップ書き換えと README / philosophy への本質的価値メッセージ反映は別 PR に分けてマージ済みです。EPIC にも sub-issue を紐付け、押し出された PBI は次のマイルストーンへ移しました。

## マルチエージェント議論の実践 Tips

このプロセスから、汎用化できそうな実践 Tips を 4 つ抽出します。

### 1. エージェントの役割を最初に決めておく

3 種を「使い分け」ましたが、実際に効いたのは役割分担を明示したことでした。

- **Claude（Opus 4.7）**: 統合・進行役。各ラウンドの問いを構造化し、結論を次ラウンドに渡す
- **Codex CLI**: 深掘り・批判役。同じ前提を共有したまま反復でき、Devil's Advocate も担える
- **Gemini CLI**: 外部知見役。Web 検索と引用 URL で「業界事例との突合」に使う

役割を決めずに 3 種を並列で投げると、それぞれが「総合的に答える」モードに入って差が出ません。

### 2. 「合意ラウンド」と「反証ラウンド」を分ける

Round 1-3 までは合意を積み上げるラウンドで、Round 4 が反証ラウンドでした。同じエージェントに連続で賛否を出させる設計は、合意形成バイアスを切るのに効きます。

特に Round 4 を「Round 3 の結論を批判してくれ」と明示したのが効きました。批判の対象範囲を絞ると、Devil's Advocate ラウンドが「全部反対」にならず、撤回 / 延期 / 維持の三択で答えてくれます。

### 3. 外部知見は権威ではなく検証対象として扱う

Round 3 の Gemini 推奨は、引用 URL も業界事例も妥当で、そのまま採用しても表面上は問題なさそうに見えました。それでも Round 4 で「うちの現実制約に合うか」を別エージェントに検証させた結果、多数が撤回されました。

外部知見をそのまま採用する流れに乗りそうなときほど、別ラウンドで「自分たちの制約に対して妥当か」を検証する設計が必要です。

### 4. 「外部利用者視点」は最後ではなく最初に入れる

これは反省点でもあります。Round 5 で初めて「外部 OSS 利用者視点」を入れたら、議論の前提が崩れて主軸が動きました。本来はもっと早い段階、できれば Round 1 で「これは誰のための機能か」を固めておくべきでした。

OSS の機能設計で議論を回すなら、最初のラウンドで「作者個人最適化 vs 外部利用者価値」の判別軸を明示しておくと、後半で前提崩壊を起こさずに済みます。

## おわりに

5 ラウンドのディスカッションを通じて、私は v8.7.0 の主軸を Trace Timeline から OSS 整備に組み替えました。表面的な結果は「マイルストーンの組み替え」ですが、本質的に得たのは **「合意よりも異なる視点を価値にする議論の組み方」** でした。

エージェントを「便利な相談相手」として 1 種だけ使うと、合意は早く取れますが前提は崩れません。役割を分けた 3 種に、合意ラウンドと反証ラウンドを設計して回すと、自分が見落としていた前提そのものに辿り着けます。

このプロセスはどの OSS / プロダクト設計にも応用できると感じています。次に重要な設計判断を回すときも、同じパターンで議論を組むつもりです。
