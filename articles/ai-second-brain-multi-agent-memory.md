---
title: "AIエージェントの記憶を1つのObsidian Vaultに集約する — Hermes司令塔のmulti-agent設計"
emoji: "🧠"
type: "idea"
topics: ["ai駆動開発", "obsidian", "claudecode", "codex", "memory"]
published: false
---

## 想定読者

- Claude Code / Codex CLI / Gemini CLI / ChatGPT を併用していて、知見がツールごとに分断していると感じている人
- AIエージェントに「同じ前提」を毎回読ませる手間を減らしたい人
- 個人のナレッジベース（second-brain）と、AIエージェントの長期記憶を1つに揃えたい人

:::message
本記事が前提にするもの:

- Claude Code / Codex CLI / Gemini CLI の併用経験（各 CLI の基本操作）
- Obsidian の基本操作（Vault・フォルダ・Markdown ノート）
- git remote の概念（`origin` の owner で個人/会社を判別する）

PARA や MCP といった用語も登場しますが、知らなくても読み進められるよう本文で補足します。
:::

## 先に結論

複数のAIエージェントを使うほど、記憶は**ツールごとに分断**します。Claude は Claude の場所、Codex は Codex の場所、ChatGPT は会話の中。どれが正本なのか曖昧なまま、同じ説明を何度も繰り返すことになります。

これを、**1つの Obsidian Vault を「共有の長期記憶」の正本にする**ことで解きました。人間は Obsidian で読み書きし、各AIエージェントは同じ Markdown を読む。そして **Hermes を Organizer（司令塔）** に据え、記憶・分解・統合を担わせ、Claude Code や Codex は実行者に徹する役割分担にしています。

ポイントは3つです。

:::message
- 記憶の正本を `08 Agent Context/memory/<repo>/` に固定し、人間もAIも同じファイルを見る
- 各ツールの「記憶の接続方法」の違い（自動接続か、指示ベースか）を吸収する
- Hermes=Organizer、Claude/Codex=実行者という**役割の線引き**で、暴走と重複を防ぐ
:::

## なぜ記憶が分断するのか

AIエージェントを1種類だけ使っているうちは問題になりません。困るのは、複数を併用しはじめてからです。

各ツールは、それぞれ別の場所に記憶を溜めます。

- Claude Code は専用のメモリーディレクトリ
- Codex CLI は `~/.codex` 配下
- Gemini CLI は `~/.gemini` 配下
- ChatGPT は会話の中（基本は揮発する）

同じプロジェクトの「判断基準」や「過去に踏んだ罠」を、ツールを変えるたびに説明し直すことになります。Claude には伝えたのに Codex は知らない。先週 ChatGPT と詰めた前提が、今週には残っていない。

問題の根っこは、記憶の保存先が増えたことではなく、**「どれが正本か」が決まっていない**ことです。だから、まず正本を1か所に決めます。

## 全体像：Think → Capture → Organize → Publish → Reuse

正本に選んだのは、Obsidian Vault です。人間が読み書きする場所と、AIエージェントが読む場所を、同じ Markdown ファイルに重ねました。

```text
Web Clipper / ChatGPT転記 → 00 Inbox（raw）
        ↓ 週次整理
01-05（Wiki化・成果物） → 08 Agent Context（昇格）
        ↓                       ↑↓ 読み書き
   人間が Obsidian で閲覧     Claude / Codex / Gemini / Hermes
```

考える（Think）、書き留める（Capture）、整える（Organize）、発信する（Publish）、再利用する（Reuse）。この流れに沿って、Vault は PARA（Projects / Areas / Resources / Archives）を参考にした番号付きフォルダ構成にしています。

```text
00 Inbox/         # 一時メモ、未整理ノート
01 Research/      # 技術調査、比較、検証ログ
02 Architecture/  # 設計メモ、システム構成、技術選定
03 Management/    # EM/CTO/スクラム/チーム運営知見
04 AI Tools/      # ChatGPT, Claude, Codex, Hermes Agent
05 Content/       # X投稿、ブログ、発信ネタ
06 MOCs/          # Map of Contents
07 ADR/           # Architecture Decision Records
08 Agent Context/ # AIエージェントが読む文脈
```

人間の入口は `00 Inbox`、AIエージェントの入口は `08 Agent Context` です。両者は分かれているようで、週次の整理でつながります（後述）。

## 記憶の正本を1か所に固定する

AIエージェントの長期記憶は、`08 Agent Context/memory/<repo>/` に置きます。リポジトリごとにサブフォルダを分け、それぞれに索引と本体を持たせます。

```text
08 Agent Context/memory/<repo-name>/
  MEMORY.md   # 索引。1行1記憶のポインタ
  *.md        # トピック別メモリー（1ファイル1事実）
```

「1ファイル1事実」にしているのは、後から AI が必要な記憶だけを拾いやすくするためです。索引（`MEMORY.md`）には1行サマリだけを並べ、詳細は個別ファイルに逃がします。

何を書き、何を書かないかも決めておきます。ここが緩いと、Vault がただのログ置き場になって劣化します。

**記録するもの**

- ユーザーの好み・判断基準へのフィードバック（なぜそうするか／どう適用するかを添える）
- リポジトリ固有の制約・運用ルール（例: gh アカウント切り替え、CI の罠）
- 再発した失敗と、確立した対策

**記録しないもの**

- 認証情報・APIキー・トークン・生のチャットトランスクリプト
- リポジトリのコードや git 履歴から導出できる事実
- そのセッション限りの作業状態（必要なら日付つきの carryover（次セッションへの引き継ぎメモ）として）

各メモリーは frontmatter を持つ Markdown です。`feedback` や `project` タイプには「なぜ（Why）」「どう適用するか（How to apply）」を必ず添え、関連メモリーは `[[name]]` でリンクします。

```markdown
---
name: gh-account-switch
description: PR 操作前に gh active account を s977043 へ切替える（403 回避）
metadata:
  type: project   # user | feedback | project | reference のいずれか
---

<!-- 本文。feedback/project タイプは Why: と How to apply: を必ず添える -->

**Why:** active account が別アカウントだと PR 作成/マージが `must be a collaborator` で失敗するため。
**How to apply:** push / PR 操作の直前に `npm run gh:ensure` を走らせる。
```

## ツールごとの「接続方法」の違いを吸収する

正本を1か所に決めても、各ツールがそこを読んでくれなければ意味がありません。ここがいちばん泥臭いところです。MCP（Model Context Protocol）サーバで横断共有する手もありますが、本記事は MCP に依存せず Markdown を正本に置く構成を取ります。ツールによって「記憶への接続方法」が違います。

- **Claude Code**: 公式設定の `autoMemoryDirectory`（auto memory の保存先を指定するキー）で、メモリーディレクトリを自前 Vault 配下に向けて自動接続できる。なお auto memory 自体の ON/OFF は `autoMemoryEnabled` で制御する。project/local スコープで設定した場合は、ワークスペースの信頼ダイアログを承認したあとに有効になる（参照: [Claude Code settings](https://code.claude.com/docs/en/settings)）
- **Codex CLI**: 保存先を変更できない。そこで `~/.codex/AGENTS.md` に**指示ベース**で「この Vault の memory を読め」と、対象パスを書いて接続する（ファイル内容のミラーではなく、参照先を指示として記述する）
- **Gemini CLI**: 同じく保存先を変更できないため指示ベース。`~/.gemini/GEMINI.md` に書くほか、後述のとおり settings.json の `context.fileName` に `AGENTS.md` を追加して共通規約を読ませる（参照: [Gemini CLI configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)）

指示の置き場所がツールごとにバラけると、また分断します。そこで指示を一本化しました。Gemini の `context.fileName` に `AGENTS.md` を追加し、各リポジトリの `AGENTS.md` を3ツール共通で読ませる形にしています。規約は `AGENTS.md` に集約し、ツール固有の事情だけを各設定ファイルで吸収する、という考え方です。

もう1つ重要な線引きが、**集約するのは個人リポジトリだけ**という点です。会社のリポジトリでは Vault に書かず、各ツールの既定位置を使います。判定に迷ったら `git remote get-url origin` の owner を見ます。個人と会社の記憶を混ぜないための、シンプルだが効く境界です。

## Hermesを司令塔にする — 役割分担で暴走を防ぐ

記憶を共有できると、次は「誰が何をするか」が問題になります。複数のAIエージェントに同じ Vault を渡すと、今度は作業が重複したり、勝手にスコープを広げたりします。

そこで **Hermes を Organizer（司令塔）** に据えました。ここで言う Hermes は、特定の製品やサービスの名前ではなく、**「指示・分解・統合・レビューだけを担う役割」そのもの**を指す呼び名です。筆者はこの役割を Claude / ChatGPT 上のプロンプト規約として与えた1エージェントとして運用していますが、要は「実装はせず、まとめ役に徹するエージェント」だと捉えてください。

Hermes の仕事は、自分で実装を抱え込むことではありません。

- 目的・制約・完了条件を定義する
- 作業を分解し、実行者ごとに担当を割り当てる
- 各実行者の成果物を統合する
- 矛盾・重複・未検証の主張を検出する
- 最終判断・残タスク・次アクションをまとめる

実行者（Claude Code / Codex / Grok / Gemini）は、割り当てられた範囲だけを担当します。記憶を共有する併用ツール（Claude / Codex / Gemini / ChatGPT）に加え、最新情報の調査や外部比較は Grok に振る、という役割の振り分けです。勝手にスコープを広げず、成果物には前提・変更点・検証結果・残リスクを書きます。そして**外部投稿・破壊的変更・永続設定の変更はしません**。

記憶を共有する4ツール（Claude / Codex / Gemini / ChatGPT）に加え、調査特化の Grok を実行者として役割分担に組み込みます。次の表の「避けること」列は、机上のルールではなく仕組みのブロックと二重化しています（後述）。

| Role | 主な使いどころ | 避けること |
|---|---|---|
| Hermes | 指示・分解・統合・レビュー・Obsidian整理 | 実装を抱え込みすぎる |
| Claude Code | 既存コード理解、設計整理、長文/記事レビュー、リファクタ提案 | 破壊的変更、未承認の大量編集 |
| Codex | 実装、テスト、Git操作、PR作成、差分レビュー、ローカル検証 | main 直 push、未確認の reset |
| Grok | 最新情報調査、外部比較、SNS向け観点 | 公式確認なしの断定 |
| Gemini | 別視点レビュー、大量文脈の照合、仕様矛盾検出 | 最終判断の単独決定 |

この線引きは、机上のルールではありません。実際に運用すると、安全機構が実行者の越権を止める場面が出てきます。たとえば、あるリポジトリのコンテンツを別リポジトリへ一括 push しようとした操作や、自分の権限設定を書き換えようとした操作が、ブロックされました。Organizer が「ここは人間に確認」と判断すべき境界を、仕組みが代わりに守ってくれた形です。役割分担と安全機構は、セットで効きます。

## 運用：週次で 00 Inbox を 08 Agent Context へ昇格する

仕組みは、放っておくと腐ります。維持するのは週次のリズムです。

1. `00 Inbox` を整理する
2. `06 MOCs`（Map of Contents）を更新する
3. `05 Content` に発信ネタを作る
4. 重要な技術判断は `07 ADR` に残す
5. AIに繰り返し渡したい前提・手順は `08 Agent Context` へ昇格させる

ポイントは「昇格」、つまり雑メモを長期記憶に引き上げることです。最初から完璧な記憶を書こうとせず、まず `00 Inbox` に雑に貯める。そのうち何度も参照する前提だけが、`08 Agent Context` の長期記憶に上がっていきます。淘汰を前提にすると、書くハードルが下がります。

## つまずきポイント

実運用で踏んだ罠を3つ。

- **Vault の構成は変わる**。記事や記憶を集約するスクリプトは、出力先の現行構成（フォルダ名・添付の置き場）に毎回追従させる必要があります。古い構成のまま流すと、live な Vault に反映されません。
- **個人 Vault への一括転送は止められることがある**。別リポジトリへの大量コピーは安全機構がデータ持ち出しとして検知するため、その手の push は人間が手動で実行する前提にしておきます。
- **CLI ツールはアカウントのプラン次第で動かない**。たとえば Codex CLI は、ログインしていてもプランに利用権がないと全モデルが拒否されます。CLI レビューはレート制限・権限切れ前提で、落ちたら即フォールバックします。

## 運用してみて効いたのは別の3点

冒頭の3点（正本の固定・接続方法の吸収・役割分担）は、設計としては最初から見えていました。実際に運用して効いたのは、むしろその周辺の別の3点（捨てる基準・役割分担と安全機構・週次昇格）です。

いちばん効いたのは、**接続の技術より「何を書かないか」の線引き**でした。秘匿情報やコード由来の事実、セッション限りの状態を弾く規約がないと、Vault はすぐにログ置き場へ劣化します。記憶の質は、書く仕組みより捨てる基準で決まりました。

次に効いたのが、**役割分担と安全機構がセットで働く**ことです。Hermes が「ここは人間に確認」と言うべき境界を、実際には仕組みのブロックが先に止める場面が何度もありました。Organizer の判断を、ルールだけでなくガードで二重化できたのは想定外の収穫でした。

そして、これらを保ったのは**週次の昇格**という地味なリズムです。淘汰を前提に雑メモから始めたことで、運用そのものが止まりませんでした。

大げさな基盤を作る必要はありません。まずは `memory/<repo>/MEMORY.md` と「1ファイル1事実」のメモから始めれば十分です。そこから、人間とAIが同じ記憶を見て進められる状態に寄せていけます。

## 参考

- 関連: [ObsidianとSupermemory MCPをつなぐ知識管理ワークフロー](https://zenn.dev/minewo/articles/obsidian-supermemory-mcp) — 外部 MCP サービスで横断共有する案。本記事は「自前 Vault を正本に固定し指示ベースで集約する」点が異なる
- 関連: [AIエージェントの『進めて』問題：自走と確認の境界をmemoryで永続化する](https://zenn.dev/minewo/articles/ai-agent-autonomy-boundary-with-memory)
- 関連: [推測で書いた学びが次の罠になった — AGENT_LEARNINGS.md の運用設計](https://zenn.dev/minewo/articles/agent-learnings-md-operation)
