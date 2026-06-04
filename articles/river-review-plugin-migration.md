---
title: "テンプレコピーをやめた — River Review を Claude Code / Codex の Plugin にした話"
emoji: "🔌"
type: "tech"
topics: ["claudecode", "codex", "marketplace", "プラグイン", "agentskills"]
published: false
---

> TL;DR

- River Review（AI コードレビュー OSS）を、v1.x で **Claude Code / Codex のプラグインマーケットプレイス対応**に移行した。
- 導入は **3 ステップのコマンドだけ**で完了するようになり、テンプレコピーや `AGENTS.md` の手配置、`skills/` のコピー作業が不要になった。
- 設計の中核は「**マーケットプレイスを Single Source of Truth（SSoT）にする**」こと。`.claude-plugin/marketplace.json` を共有 SSoT にし、Claude Code と Codex のどちらからでも同じスキルパックを取得できる。
- 「v0.x（Manual Era）」と「v1.x（Plugin Era）」を切り分けて比較することで、**OSS を Plugin 化するときに何を変えるべきか**が見えた。同じ判断は他の OSS にも転用できる。

## はじめに

[River Review](https://github.com/s977043/river-review) は、チームのレビュー判断を「スキル」として版管理し、PR の自動ゲートに変換するための OSS です。`plan` / `diff` / `tests` / `JUnit` といった SDLC 成果物に対して、レビュー観点を再現可能な形で適用できます。

これまで（v0.x）の導入は、リポジトリを clone してテンプレをコピー、`AGENTS.md` を手で書き、`skills/agent-skills/` を所定の場所に配置、という**手作業の連続**でした。コードを書くより前に「環境を整える時間」のほうが長くなる、というのは OSS あるあるです。

v1.x で **Claude Code / Codex のプラグインマーケットプレイス対応**に踏み切ったことで、このセットアップは **3 ステップのコマンド**にまで縮みました。本記事ではその移行で考えたこと、設計判断、そして移行で見えた「OSS を Plugin 化するときの一般的な視点」を整理します。

:::message
本記事は River Review の **v1.x のマーケットプレイス対応**に絞った話です。「そもそも River Review は何のための OSS か」は別記事を参照してください。
- [プロンプトを磨くのをやめた：チームのレビュー知識を Agent Skills に変える River Review 体験（Qiita）](https://qiita.com/s977043/items/607d78c35745b17f9bc8)
- [AI 駆動開発の 2 層ガード設計：PlanGate と River Review で実装前後を守る](https://zenn.dev/minewo/articles/ai-dev-guardrail-plangate-river-reviewer)
:::

## v0.x の何が問題だったか

v0.x の導入手順は、ざっくり以下のようなものでした。

1. リポジトリを clone
2. `templates/agent-workflow/codex/AGENTS.md` を自分のプロジェクトにコピー
3. `skills/agent-skills/` 配下を自分のプロジェクトの所定パスへコピー
4. Codex を使うなら `.codex/config.toml` を手で書く
5. 以後、River Review 側でスキルが更新されたら**もう一度コピー作業をやり直す**

つまり「**配るのはテンプレート、組み立ては利用者の手作業**」という設計でした。これは OSS としては正直で誠実なやり方ですが、3 つの摩擦を残します。

- **初回セットアップに時間がかかる**：パス・命名・コピー先のミスでハマる
- **アップデート追随がだるい**：更新を取り込むたびに手作業を繰り返す
- **`AGENTS.md` を二重管理しがち**：自プロジェクトの規約と River Review 由来の規約が混ざる

OSS で「観点パッケージ」を提供するときは、**配布形式の選択そのものが利用体験を大きく左右する**——River Review のように「使う側がカスタムするより素直に最新を取りたい」ユースケースが多い OSS では、テンプレ配布は摩擦のほうが目立ちます。

## v1.x で踏み切ったこと

v1.x の方針はシンプルです。

- **マーケットプレイスを SSoT にする**：観点・スキルパックの正本を `.claude-plugin/marketplace.json` に置く
- **Claude Code / Codex の両方を「マーケットプレイスから取得する側」にする**：手書きの設定ファイルを最小化する
- **手作業のフォールバックは残す**：オフライン環境などのために、v0.x 相当のテンプレコピー手順は併存させる

結果として、**導入は 3 ステップ**で済むようになりました。

> 以下のコマンドは **River Review v1.2.1 時点で動作確認した手順**です。Claude Code のスラッシュコマンドと Codex のサブコマンドで CLI 構造が違うため、各ツールの最新ドキュメントもあわせて確認してください。

### Claude Code

```bash
/plugin marketplace add s977043/river-review
/plugin install river-review@river-review-marketplace
/reload-plugins
```

### Codex

```bash
codex plugin marketplace add s977043/river-review
codex plugin install river-review@river-review-marketplace
codex plugin marketplace add s977043/river-review@v1.2.1  # バージョン pin する場合
```

「マーケットプレイスを追加 → プラグインを入れる → リロード」という同じ流れが Claude Code と Codex で揃っているのがポイントです。

> リリースタグでバージョンを pin する運用（例: `@v1.2.1`）も README に明記してあります。プロダクションでは pin が安全です。

## 設計の中核：マーケットプレイスを SSoT にする

Plugin 化と聞くと「マニフェストファイルを書いて配布形式を変える」だけのように見えますが、River Review の v1.x で本当に意味があったのは **SSoT を移動したこと**でした。

- v0.x（Manual Era：テンプレ手配置時代）: SSoT は **テンプレ群**（`templates/agent-workflow/codex/AGENTS.md` などのファイル一式）
- v1.x（Plugin Era：プラグイン配布時代）: SSoT は **`.claude-plugin/marketplace.json`**

SSoT がマーケットプレイス定義に移動したことで、

- Claude Code 用 / Codex 用に**別々の取り込み口**を作っても、**観点の正本は 1 か所**
- バージョン更新は marketplace.json の差分だけで意味が伝わる
- 利用者は「どこからスキルが落ちてくるか」を 1 ファイル見れば判断できる

という整理になります。`.codex-plugin/` の存在は「Codex に固有の interface metadata だけ別出しする」ためで、観点や判断基準そのものは marketplace 側に集約しています。

ここを 1 か所にするだけで、後述の「Claude Code と Codex の使い分け」が**配布側の設計**ではなく**利用側のユースケース**の話に綺麗に分離されます。

## Claude Code と Codex の使い分け

同じスキルパックを使えるとはいえ、**何に向くか**は違います。River Review としては以下のような使い分けを README に明記しています。

| シナリオ | 向くツール | 理由 |
|---|---|---|
| 文脈を切り替えながら対話的に PR レビューしたい | **Claude Code** | ブラウザ親和的、会話で状態を持てる |
| バッチでレビューを回す / エージェント駆動のパイプラインに組み込みたい | **Codex** | CLI ファースト、自動化と相性が良い |
| スキルのマーケットプレイス + バージョニング | **両方** | `.claude-plugin/marketplace.json` を共有 |
| プロジェクト個別のサンドボックスポリシーを効かせたい | **Codex** | `.codex/config.toml` で適用 |

OSS としては「両方で使える」だけだと混乱します。**どの場面で何を使うか**まで指針を書いておくことで、利用者が自分のユースケースで迷わなくなります。

## v0.x → v1.x の比較

横並びにすると、何が変わったかが見えやすくなります。

| 観点 | v0.x（Manual Era） | v1.x（Plugin Era） |
|---|---|---|
| 配布形式 | テンプレ + 手順書 | マーケットプレイス経由のプラグイン |
| Claude Code セットアップ | 手書きコピー + 手動設定 | `/plugin marketplace add` → `install` → `reload` |
| Codex セットアップ | テンプレコピー + `.codex/config.toml` を手書き | `codex plugin marketplace add` + `install` |
| バージョン管理 | リポジトリ tag を読んで利用者が判断 | リリースタグで pin（例: `@v1.2.1`） |
| スキル更新 | 利用者が clone し直してコピー | プラグイン再 install で取得 |
| `AGENTS.md` 管理 | 自プロジェクトと River Review 由来が混ざる | マーケットプレイスから配信、自プロジェクトと分離 |
| 標準スキルパック | `skills/agent-skills/` に羅列 | `river-review-code` / `-security` / `-performance` / `-architecture` / `-testing` / `adversarial-review` を内蔵 |

「テンプレコピーから卒業した」が一番効いた変化です。利用者の初回セットアップ時間が短くなることもさることながら、**アップデートのたびのコピー作業が消えた**のが運用上は大きいです。

## オフラインや特殊環境のためのフォールバック

社内ネットワークやオフライン環境などでマーケットプレイスが使えないケースもあるので、v0.x 相当の手順を **fallback** として README に残しています。

```bash
cp templates/agent-workflow/codex/AGENTS.md ./AGENTS.md
cp -R skills/agent-skills ./skills
# .codex/config.toml の手動設定が必要
```

「Plugin Era にしたから旧式は廃止」ではなく、**旧式は明示的に fallback として位置づけ直す**ことで、Plugin 経路に統一しつつも逃げ道を残せます。OSS で標準形を切り替えるときは、この「旧路線を fallback として再定義」が摩擦を減らします。

## 学び：OSS を Plugin 化するときに考えたいこと

River Review の移行を通して、他の OSS でも転用できそうな設計判断は次のあたりでした。

### 1. SSoT を**配布物**から**マーケットプレイス定義**へ動かす

Plugin 化の本質は「ファイルの場所を変えること」ではなく、**正本をどこに置くか**を変えることです。`marketplace.json` 1 ファイルが SSoT になっただけで、利用者から見たメンタルモデルが「ファイルを集める作業」から「スキルパックを取得する作業」に変わります。

### 2. Claude Code と Codex を**配布側で**揃え、**利用側で**使い分けさせる

「両対応です」とだけ書くと、利用者は使い分けで迷います。**配布側は同じマーケットプレイスを共有**しつつ、利用ユースケースは表で明示しておくと、ドキュメントの摩擦が減ります。

### 3. v0.x の手順は**廃止せずフォールバックに格上げ**する

「旧式は使うな」より「旧式はこのケースで使ってください」のほうが、利用者は安心して新標準に移れます。River Review でも `cp templates/...` の手順は README に残し、`Installation Fallback (No Marketplace)` というセクション名で明示しています。

### 4. バージョン pin の運用を README で先に書く

`@v1.2.1` のような pin は技術的には CLI で済む話ですが、README で「**プロダクションでは pin を推奨**」と先に書いておくと、本番で「最新が壊れた」事故が出にくくなります。Plugin マーケットプレイスは便利なぶん、**意図せず最新を引いてしまう**事故と隣り合わせなので、運用の標準形をドキュメントに刻んでおく価値があります。

## まとめ

River Review の v1.x は、機能を増やしたバージョンというより **配布のかたちを変えたバージョン**でした。

- セットアップが **3 ステップのコマンド**になった
- Claude Code と Codex で **同じマーケットプレイス**を共有できるようになった
- 観点・スキルパックの SSoT が `.claude-plugin/marketplace.json` に集約された
- 旧手順はフォールバックとして残し、移行コストを下げた

OSS としての「正しさ」は、機能の豊かさだけでなく、**利用者が最新を素直に使える経路を用意できているか**にもあります。Plugin 化はそのための手段で、River Review にとっては効いた選択でした。

## 関連記事

- [プロンプトを磨くのをやめた：チームのレビュー知識を Agent Skills に変える River Review 体験（Qiita）](https://qiita.com/s977043/items/607d78c35745b17f9bc8)
- [AI 駆動開発の 2 層ガード設計：PlanGate と River Review で実装前後を守る](https://zenn.dev/minewo/articles/ai-dev-guardrail-plangate-river-reviewer)
- [AI エージェントを"投げっぱなし"にしない：Agent Skills と自由度の設計で実現する「評価駆動の開発エコシステム」](https://zenn.dev/minewo/articles/zenn-river-reviewer-architecture)
- [River Review v0.30 → v0.33：Improvement Loop と applyTo Scoping 整備の半月](https://zenn.dev/minewo/articles/river-reviewer-v033-improvement-loop)
