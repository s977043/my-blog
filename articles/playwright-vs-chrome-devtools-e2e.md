---
title: "結局どっち？ E2Eで私が「Chrome DevTools 中心・Playwright 限定」に落ち着いた理由"
emoji: "🧭"
type: "tech"
topics: ["Playwright", "ChromeDevTools", "OAuth", "E2E", "MCP"]
published: false
---

## はじめに

「E2E は Playwright で全部書く」——いまの定番です。
でも私の実務での運用は少し違って、**主軸は Chrome DevTools、Playwright は“凍結したい一部だけ”に絞って使う**形に落ち着きました。

「自動テストの話なのに DevTools が中心？」と思うかもしれません。
本記事は、その一見あまのじゃくな結論に至った理由を、実務の判断基準として整理します。
先に言うと、答えは「**どちらか一方**」ではなく「**工程ごとに使い分ける（中心は DevTools）**」です。タイトルの「結局どっち？」への私の答えは、この一文に尽きます。

:::message
**結論（先出し）**

- **日々の検証・原因調査は Chrome DevTools**（Recorder / Performance / Network / Console、そして Chrome DevTools MCP）。
- **Playwright は「壊れたら困るクリティカルパスを回帰として固定する」用途に限定**。CI で守る最小本数だけ。
- 二者択一ではなく、**役割分担で考えると迷わない**。コミュニティでは「観測する（Observe）か操作する（Act）か」で整理する論があり（Steve Kinney は **観測＝Chrome DevTools MCP / 操作＝Playwright MCP** と対応づけている）、本記事ではこれを実務語に置き換え、**「Debugging（なぜそうなったかの観測）= DevTools」「Driving（操作の再現・自動化）= Playwright」**と呼ぶ（Driving/Debugging という対比自体は一般的な比喩で、本記事独自の貢献は後述する **OAuth 管理画面での既存セッション流用**にある）。
:::

:::message
**想定読者と前提**

- **想定読者**: E2E を Playwright 中心で運用していて、保守コストや OAuth ログインの不安定さに悩んでいる人。
- **前提**: 対象は **Google OAuth でログインする管理画面**。Chrome DevTools と MCP（Model Context Protocol）を触れる環境を想定する。
:::

そして、この**「認証の入口」こそがツール選びを分ける最初の分岐点**になりました。Google OAuth でログインを突破させるかどうかが、Playwright 中心で行くか DevTools 中心で行くかを決めたのです。

## 1. Playwright と Chrome DevTools、そもそも何を比較しているのか

「Playwright vs Chrome DevTools」は、言葉のままだと噛み合いません。レイヤーが違うからです。

| | Playwright | Chrome DevTools |
|---|---|---|
| 本質 | ブラウザを**操作・自動化**するフレームワーク | ブラウザの内部を**観測・診断**するツール群 |
| 得意 | 同じ操作の再現、CI での回帰防止、クロスブラウザ | Network / Performance / Console の深掘り、原因究明 |
| E2E での役割 | テストコードとして固定する | 失敗の「なぜ」を掴む、テストを書く前の探索 |
| 比喩 | Driving（運転＝再現する） | Debugging（計器を読む＝なぜを知る） |

つまり対立軸は「どちらが優れているか」ではなく、**E2E のどの工程に重心を置くか**です。
私の実務では、**「テストを増やす」より「壊れた時に最短で原因に辿り着く」ことの ROI が高かった**——これが DevTools 中心の出発点です。

実際、私が DevTools 側に寄った一番の決め手は、**いま開いているブラウザのセッションをそのまま使って確認・検証できる**ことでした。
ログイン済みで、特定の状態まで操作した画面に対して、その場で **DOM を確認**し、**Console でエラーを拾える**。Playwright のように毎回クリーンなブラウザを立ち上げ、認証やセットアップを作り直す必要がない——この「**今の状態をそのまま観測できる**」手触りが、原因調査の速さに直結しました。

わかりやすい例が**ログインです**。対象の管理画面は **Google 認証（OAuth）**で入りますが、これを Playwright で自動化しようとすると、外部 IdP へのリダイレクト・（環境によっては）自動化ブラウザと判定される bot 検知・たまの UI 変更でフローが壊れやすくなります。認証の維持だけでテストが不安定になり、本来見たい中身に辿り着けない。
だから私は**ログインを Playwright で戦わせず、すでにログイン済みの既存セッションを DevTools 側で流用**しています。認証を突破する仕事を丸ごと省けるので、検証は「ログインの先」から始められる。

「再現してから守る」より先に、「**今そこにある不具合をすぐ覗ける**」ことの価値が、私の現場では大きかったのです。

## 2. それぞれの特徴と差分

レイヤーが違うと書きましたが、E2E の現場では役割が重なる場面も多いので、**特徴と差分を具体的に**並べておきます。

### 2-1. Playwright の特徴

**「操作を再現して、結果をアサートする」テスト自動化フレームワーク**です。

- **クロスブラウザ**：Chromium / Firefox / WebKit を同一 API で動かせる。
- **auto-wait（自動待機）**：要素が操作可能になるまで自動で待つ。`sleep` を撒かずに済み、flaky を構造的に減らせる。
- **テストランナー内蔵**：アサーション・並列実行・リトライ・フィクスチャが標準装備。
- **Trace Viewer**：失敗時のスナップショット・DOM・ネットワークを時系列で再生。落ちた瞬間を後から追える。
- **codegen / UI mode**：操作からコード生成、対話的なテスト実行。
- **CI 親和性が高い**：ヘッドレス・並列・コンテナ実行が前提の設計。
- 弱点：**ブラウザ内部の「なぜ」は浅い**。Performance プロファイルや Web Vitals の深掘りは本職ではない。テスト本数に比例して保守コストが増える。

### 2-2. Chrome DevTools の特徴

**「いま動いているブラウザの内部を観測・診断する」開発者ツール群**です。

- **既存ブラウザのセッションをそのまま使える**：ログイン済み・特定の状態まで操作した「いまのタブ」に対して、その場で確認・検証できる。認証やセットアップを毎回作り直さなくていい。
- **DOM とエラーの確認が速い**：Elements で DOM をその場で覗き、Console でランタイムエラー・警告を即座に拾える。「何が表示されていて、何が壊れているか」への到達が短い。
- **リアルタイム観測**：Network / Performance / Console / Memory / Application を生で見られる。
- **Performance insights**：描画・スクリプト・レイアウトのボトルネックを特定。Web Vitals を直接計測できる。
- **Network 解析**：リクエストの順序・待ち時間・失敗・ヘッダを精査。flaky の真因はだいたいここ。
- **Recorder**：操作フローを記録・再生。既定では JSON / Puppeteer 形式に書き出せ、Playwright へは拡張機能（Playwright Chrome Recorder）経由でエクスポートできる。
- **CDP（Chrome DevTools Protocol）**：自動化ツールが内部で叩いている共通基盤。（Chromium 駆動時は）Playwright も Puppeteer もこの上に乗る。
- 弱点：**Chromium 系のみ**（Chrome / Edge）。**自動テストランナーではない**ので、回帰の自動実行・CI 常駐・クロスブラウザ保証には向かない。手動操作が前提。

### 2-3. 観点別・差分早見表

| 観点 | Playwright | Chrome DevTools |
|---|---|---|
| 主目的 | 操作の自動化・回帰テスト | 内部の観測・原因診断 |
| 対応ブラウザ | Chromium / Firefox / WebKit | Chromium 系のみ（Chrome / Edge） |
| 実行形態 | コード（テストランナー） | GUI（手動）＋ Recorder |
| 既存セッションの再利用 | △ 既定は新規コンテキスト（`storageState`（保存した認証状態）/ `connectOverCDP`（既存ブラウザへの接続）で再現は可能） | ◎ ログイン済みの“今のタブ”にそのまま乗れる |
| DOM / エラーの即時確認 | ○ Trace から事後に確認 | ◎ Elements / Console でライブに確認 |
| 自動化・CI | ◎ 得意（ヘッドレス・並列） | △ Recorder の記録・書き出しどまり（CI 常駐は不向き） |
| 待機制御 | ◎ auto-wait | 手動観察 |
| ネットワーク診断 | ○ インターセプト/モック | ◎ 生のタイミング・失敗を精査 |
| パフォーマンス計測 | △ 限定的 | ◎ Performance / Web Vitals が本職 |
| 失敗の事後解析 | ○ Trace Viewer | ◎ ライブで Console / Network を追える |
| 学習・着手コスト | テスト設計の前提知識が要る | ブラウザがあればすぐ触れる |
| 向く工程 | 「守る」（固定・回帰） | 「調べる」（探索・原因究明） |
| 共通基盤 | Chromium 駆動時は内部で CDP を利用 | CDP の本家 |

ポイントは最下段の **CDP（Chrome DevTools Protocol）**。Playwright も **Chromium を動かすときは**内部でこのプロトコルを使っています（Firefox / WebKit は別の仕組みで駆動）。つまり Chromium 上では **両者は競合というより“同じ土台の上で役割が違う”**。だから「どちらか」ではなく「どこで切り替えるか」の話になります。

この表の中で私の現場に一番効いたのは、**「既存セッションの再利用」**の行でした。ここがツール選定の実質的な決め手になっています（理由は次章）。

## 3. なぜ「全部 Playwright」をやめたのか

E2E を Playwright で網羅しにいくと、現場でこうなりがちです（私が踏んだものを中心に）。

- **テストの保守コストが線形に増える**。UI 変更のたびにセレクタとフローの修正が積み上がる。
- **flaky（不安定テスト）の調査が結局 DevTools 仕事になる**。落ちた理由は Network のタイミングや特定リクエストの遅延で、Trace を見ても最後は DevTools の Performance/Network に戻る。
- **「テストが緑」と「ユーザー体験が良い」は別物**。描画の引っかかりや Web Vitals の劣化は、E2E のアサーションをすり抜ける。
- **外部認証（Google OAuth）と相性が悪い**。前述のとおり、ログインの自動化は外部 IdP リダイレクト・bot 検知でコストの割に壊れやすい。ここを Playwright で頑張るほど赤字になる。

ここから、**「再現して守るべきものは最小限を Playwright で固定」「それ以外の品質は観測で担保」**という線引きに変わっていきました。
とくに**認証は Playwright の守備範囲から外し**、ログイン済みの既存セッションを DevTools で流用する——という割り切りが、運用を一気に軽くしました。

## 4. 私の実際のワークフロー

「中心と限定」を具体の手順に落とすとこうなります。全体は **探索（DevTools で観測）→ 昇格（守る導線だけ Playwright へ）→ MCP での使い分け** の 3 ステップで運用しています。

### 4-1. まず DevTools で観測する（探索フェーズ）

- **Recorder** で操作フローを記録・再生。ネットワークスロットリングやスローモーション再生で、人間の目で挙動を確認する。
- **Performance / Performance insights** で描画・スクリプトのボトルネックを特定。
- **Network** でリクエストの順序・待ち時間・失敗を確認。前述のとおり、ここに真因が集まりやすい。
- **Console** でランタイムエラーと警告を拾う。

> Recorder は記録した操作を **JSON / Puppeteer などにエクスポート**でき、拡張機能を入れれば **Playwright のテストコードとしても書き出せます**。「手で確かめたフローを、そのまま回帰テストの種にする」流れが作れるのが強い。
> 参考: [Recorder features reference | Chrome for Developers](https://developer.chrome.com/docs/devtools/recorder/reference) / [Playwright Chrome Recorder 拡張](https://chromewebstore.google.com/detail/playwright-chrome-recorde/bfnbgoehgplaehdceponclakmhlgjlpd)

### 4-2. 守る価値があるものだけ Playwright に昇格させる（固定フェーズ）

- 探索で「これは壊れたら困る」と分かった導線だけ、Playwright のテストに落とす。
- DevTools Recorder のエクスポートを下敷きにすると、ゼロから書くより速い。
- CI で回すのはこの最小セット。**本数を増やさない規律**を運用ルールにする。

### 4-3. AI エージェント時代の観測：MCP の使い分け

この使い分けは、AI エージェント（Claude Code など）にブラウザを触らせるようになって、さらにはっきりしました。私自身、MCP を実務に組み込んで使っています。ここでも軸は同じで、前述した借用フレーム（Debugging＝観測 / Driving＝操作）がそのまま当てはまります。

| | Playwright MCP | Chrome DevTools MCP |
|---|---|---|
| 設計思想 | 操作の自動化（cross-browser） | 観測・診断（Chromium のみ） |
| エージェントへの入力 | アクセシビリティ（a11y）スナップショット[^mcp-input] | スクリーンショット + DevTools Protocol |
| 得意 | E2E 自動化・CI 連携 | Performance トレース・Network 診断・Web Vitals 計測 |
| コンテキスト消費の傾向 | 傾向として軽いとされる（テキストの a11y ツリー中心） | 傾向として重いとされる（スクショ + CDP の情報量が大きい） |

[^mcp-input]: Playwright MCP は要素を a11y（アクセシビリティ）スナップショットとして返す（[Playwright MCP 公式 README](https://github.com/microsoft/playwright-mcp) より）。コンテキスト消費の軽重は公開された数値根拠があるわけではなく、入力形式（テキスト中心 vs スクショ＋CDP）から推測した傾向。

ざっくり言えば、**「何が起きたか（ユーザー視点）= Playwright MCP」「なぜ起きたか（ブラウザ視点）= Chrome DevTools MCP」**。
私の重心が「なぜ」側なので、**調査タスクは Chrome DevTools MCP、回帰の自動実行は Playwright(MCP/CLI)** という分担にしています。

そして実務で一番効いているのは、ここでも**既存セッションの流用**です。Google 認証で入った管理画面のタブにエージェントを乗せ、**「この画面の DOM を確認して」「Console のエラーを拾って」**と頼めば、認証を突破させる手間ゼロで原因調査に入れる。人間がやっていた「DevTools を開いて中を覗く」をそのままエージェントに委譲できる感覚で、ここが Chrome DevTools MCP を中心に据えている実務上の理由です。
一方で Playwright MCP / CLI は、**守ると決めた少数のフローを CI で自動実行する**役回りに固定しています。

> 参考（いずれもコミュニティ／ベンダー記事）: [Runtime Tools Compared (Steve Kinney)](https://stevekinney.com/courses/self-testing-ai-agents/runtime-tools-compared) / [Chrome DevTools MCP vs Playwright MCP (Test-Lab.ai)](https://www.test-lab.ai/blog/chrome-devtools-mcp-vs-playwright-mcp-cli)。一次情報は各公式リポジトリ（[Playwright MCP](https://github.com/microsoft/playwright-mcp) / [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)）を参照。

## 5. 判断チェックリスト：どっちを使う？

| やりたいこと | 主に使う |
|---|---|
| 壊れたら事業インパクトが大きい導線を回帰で守る | **Playwright** |
| CI で毎回自動実行したい | **Playwright** |
| クロスブラウザで再現させたい | **Playwright** |
| テストが落ちた“理由”を突き止めたい | **Chrome DevTools** |
| 描画/スクロール/Web Vitals の体感劣化を調べたい | **Chrome DevTools** |
| リクエストの順序・遅延・失敗を追いたい | **Chrome DevTools** |
| まず手で操作して挙動を確かめ、種を作りたい | **Chrome DevTools（Recorder）→ Playwright に昇格** |

**原則**: 迷ったら「再現して守るのか（Playwright）」「なぜを知るのか（DevTools）」で割り当てる。

## 6. まとめ

- E2E の正解は「全部 Playwright で網羅」ではなく、**守る価値があるものを最小限固定し、それ以外は観測で担保する**こと。
- 私の実務では重心が「なぜ」側にあるため、**Chrome DevTools 中心・Playwright 限定**に落ち着いた。
- MCP 時代も同じ分担が効く：**Driving は Playwright、Debugging は Chrome DevTools**。

二択で考えず、**E2E のどの工程に重心を置くか**で道具を選ぶ——これが現時点での私の結論です。

### この運用にして変わったこと

- **E2E のコストが下がった**。守るフローを最小限に絞ったので、テストの構築・維持にかける時間そのものが減った。
- **設定・運用が軽い**。既存セッションを流用するぶん、認証まわりの作り込み（IdP 突破・トークン管理）が要らない。Playwright 側の設定も最小本数ぶんだけで済む。
- **起動が速い**。DevTools は「開けばすぐ」。別環境を立ち上げてログインし直す待ち時間がなく、不具合を見つけてから観測に入るまでが短い。

「テストを増やすほど安心」ではなく、**増やさない設計にしたことで、かえって E2E が回るようになった**——というのが正直な実感です。

## FAQ

:::details Q. E2E は Playwright で全部書くのが定番では？
網羅を目指すと保守コストが線形に増え、flaky の調査は結局 DevTools 仕事になります。私は「壊れたら困る少数のフローだけ Playwright で固定し、残りは観測で担保する」方針です。全部を否定しているのではなく、**重心を置く工程が違う**という話です。
:::

:::details Q. なぜログインを Playwright で自動化しないのですか？
対象が Google 認証（OAuth）だからです。外部 IdP へのリダイレクト・bot 検知・たまの UI 変更で自動化が壊れやすく、認証の維持だけでテストが不安定になります。ログイン済みの既存セッションを DevTools 側で流用すれば、この戦いを丸ごと省けます。
:::

:::details Q. Playwright でも認証状態は再利用できますよね？
できます（`storageState` での保存や `connectOverCDP` での既存ブラウザ接続）。ただ「いま開いているタブにそのまま乗る」手軽さは DevTools / Chrome DevTools MCP のほうが上で、探索フェーズの速さに効きます。固定して CI で回す段になったら `storageState` を使います。
:::

:::details Q. Chrome DevTools は Chromium 系だけ。クロスブラウザはどうする？
クロスブラウザ保証が要るフローは Playwright の担当です。DevTools は「調べる」、Playwright は「複数ブラウザで再現して守る」と役割を分けています。
:::

:::details Q. Chrome DevTools MCP と Playwright MCP、どちらを入れるべき？
目的しだいです。調査・原因究明が中心なら Chrome DevTools MCP、CI 連携の自動テストが中心なら Playwright MCP。多くのチームは両方入れて使い分けます（私もそうしています）。
:::

## 参考

- [Recorder features reference | Chrome for Developers](https://developer.chrome.com/docs/devtools/recorder/reference)（公式）
- [Playwright Chrome Recorder 拡張（Chrome Web Store）](https://chromewebstore.google.com/detail/playwright-chrome-recorde/bfnbgoehgplaehdceponclakmhlgjlpd)
- [Playwright MCP（公式リポジトリ）](https://github.com/microsoft/playwright-mcp)
- [Chrome DevTools MCP（公式リポジトリ）](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [Runtime Tools Compared: Playwright MCP, Chrome DevTools MCP（Steve Kinney）](https://stevekinney.com/courses/self-testing-ai-agents/runtime-tools-compared)（コミュニティの整理／個人講座）
- [Chrome DevTools MCP vs Playwright MCP vs CLI（Test-Lab.ai）](https://www.test-lab.ai/blog/chrome-devtools-mcp-vs-playwright-mcp-cli)（ベンダーブログ）
