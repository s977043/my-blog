---
title: "Codex と Claude Code を同じリポジトリで回す — AGENTS.md / CLAUDE.md の 2 層規約"
emoji: "🤝"
type: "idea"
topics: ["ai駆動開発", "claudecode", "codex", "リポジトリ設計", "agents-md"]
published: true
---

:::message
**この記事で得られること**

- 複数 AI エージェントを同じリポジトリで運用する際の規約レイヤリング
- `AGENTS.md`（共通の正）+ `CLAUDE.md`（Claude Code 固有のツール索引）の 2 層設計
- `.agents/` と `.claude/` の drift（同期ズレ）管理、引っかかった罠
:::

## はじめに

あるリポジトリで、**Codex と Claude Code を同時に使う** 運用を始めました。記事執筆 / レビュー / PR 作成を両エージェントに分担させる構成です。

最初は `.claude/` だけで運用していましたが、Codex を併用し始めたところ、エージェントごとに別の規約を参照して矛盾するコミットが発生しました。

例えば（2 層分離前にありがちなパターン）:
- 表現ルール（敬体 / 常体、JTF スタイル）を `CLAUDE.md` にだけ書いていた
- Codex は `CLAUDE.md` を参照しないため、同じルールを知らない
- 結果、2 つのエージェントが同じ記事に対して相反する編集をする

この記事は、マルチエージェント時代の **規約レイヤリング** について整理したものです。

## 2 層規約の役割

解決策として、**規約を 2 層に分ける** アプローチを採用しました。

| ファイル | 役割 | 対象エージェント |
|---|---|---|
| `AGENTS.md` | 全エージェント共通の正 | Codex / Claude Code / その他 |
| `CLAUDE.md` | Claude Code 固有のツール索引 | Claude Code のみ |

ポイントは、**規約（何が正しいか）** と **ツール（何が使えるか）** を分離していること。

- `AGENTS.md`: コミットメッセージ規約、ブランチ命名、ディレクトリ配置、記事の表現ルール
- `CLAUDE.md`: Slash Commands、Subagents、Skills の索引、Permissions 指針

Codex は `AGENTS.md` しか読まなくても、エージェントの本分（規約遵守）は守れる。Claude Code は両方読んで、固有ツールも活用できる。

## 実例: このリポジトリの構成

```
repo/
├── AGENTS.md                 # 共通の正
├── CLAUDE.md                 # Claude Code 固有
├── AGENT_LEARNINGS.md        # 両エージェント共有の経験則
├── .claude/
│   ├── skills/               # Claude Code のスキル
│   ├── agents/               # サブエージェント定義
│   └── commands/             # Slash Commands
├── .agents/                  # AGENTS.md 標準のエージェント用（Codex など、drift 管理は後述）
│   └── skills/               # 現状は .claude/skills と drift 管理中
└── articles/
```

`AGENTS.md` の冒頭で「Codex や Claude Code など AI エージェントはまずこのファイルを読む」と明示しておくと、AGENTS.md 標準に準拠する新しいエージェントを導入したときも、追加設定なしで同じ規約を読ませられます。

## drift（同期ズレ）管理の罠

`.claude/skills/` と `.agents/skills/` に **同じスキルを重複して置いていた** ことがあります。両方とも `note-export-import` というスキルがあって、中身が微妙に違う状態。

原因を追うと、ある時点で `.claude/skills/` を `.agents/skills/` にコピーしたまま、片方だけ更新を続けていた、という古典的な drift でした。

### 対応策として試したもの

1. **シンボリックリンクで統一**: `.agents/skills → .claude/skills`
   - メリット: drift しない
   - デメリット: Windows 環境で問題が出る可能性
2. **同期スクリプト**: `rsync .claude/skills/ .agents/skills/` を pre-commit で実行
   - メリット: 明示的
   - デメリット: 忘れると古いコピーが残る
3. **片方を削除**: Codex が `AGENTS.md` だけで足りるなら、`.agents/skills/` は不要
   - メリット: シンプル
   - デメリット: Codex 固有のスキルを置きたい場合に困る

今は 3 の方針を検討中です。`AGENTS.md` に全規約を寄せて、各エージェントの固有配下はツール索引に特化する、という整理に向かっています。

## どちらで何を管理するか

運用ルールとして合意しているもの。

### `AGENTS.md` に書く

- コミットメッセージ規約（Conventional Commits）
- ブランチ命名規約
- 記事の表現規約（JTF スタイル、敬体 / 常体、プラットフォーム固有）
- Git 運用（squash only、force-push 禁止）
- 禁止事項（自動マージ、外部サービスの勝手な操作）

### `CLAUDE.md` に書く

- Slash Commands 一覧
- Sub-agents 一覧
- Skills 索引
- Permissions 指針（`settings.local.json`）
- 作業開始時のチェックリスト

### `AGENT_LEARNINGS.md` に書く

- 過去の失敗 / 成功パターン（両エージェントが読む）
- 推測と実測の区別付きの学び

## 引っかかった罠

### 1. AGENTS.md に固有ツールの話を書いてしまう

`AGENTS.md` に `gh pr create` の具体的な呼び方まで書こうとしたことがありますが、Codex は `gh` を直接呼べるため、規約ではなくツールの使い方の記述になってしまい冗長でした。**ツールの「使い方」ではなく「規約」だけを `AGENTS.md` に置く** 、が基本ルール。

### 2. CLAUDE.md に規約を重複記載

Claude Code で作業するとき用に `CLAUDE.md` に規約も書いていたら、`AGENTS.md` の更新と同期が取れなくなりました。**`CLAUDE.md` は `AGENTS.md` を参照するだけで、規約は重複させない**。

### 3. drift の存在に気づきにくい

`.agents/` と `.claude/` の drift は、普段使っていない方で発覚するまで気づきません。CI で diff チェックを入れるのが安全です。

```bash
# 同期確認の簡易チェック（内容差分 + 片側にしかないファイルの両方を検知）
if ! diff -rq .claude/skills/ .agents/skills/; then
  echo "drift detected between .claude/skills and .agents/skills" >&2
  exit 1
fi
```

`grep -v "^Only in"` で片側にしかないファイルを除外してしまうと drift の主要パターン（片側だけ増減する）を見逃すので、`diff` の exit code を直接判定して CI 失敗に繋げるのが安全です。

## Codex / Claude Code の得意不得意

実運用して感じた、使い分けの目安。

### Codex が得意

- シェルスクリプトや Python のワンショット実行
- 既存コードの局所修正
- 軽量な繰り返しタスク

### Claude Code が得意

- 複雑なリファクタ、多ファイル横断の変更
- ドキュメント重視の作業（記事執筆、レビュー）
- Sub-agent を並列起動する長時間タスク

### 両方で共通してハマる

- 規約の drift 検出（人間が気づくまで pattern 化しにくい）
- 外部 SaaS（note、Slack）の手動操作を要する作業

## まとめ

マルチ AI エージェント運用のポイントは、以下 3 点。

- **規約の正（`AGENTS.md`）とツール索引（`CLAUDE.md` 等）を分離** する
- **共通の経験則（`AGENT_LEARNINGS.md`）は両方が読む場所に置く**
- **drift は運用ルール + CI で検出** する

AGENTS.md の標準化は、マルチエージェント時代の「リポジトリ設計の共通語」になりつつあります。どのエージェントでも同じ規約を読む土台を作っておくと、ツールが増えても運用が破綻しにくいです。

### 関連記事

- AI が迷わないリポジトリ設計（入口 / 局所 / 仕組み / 正本の 4 分割）: [/articles/ai-legible-repository-design](/articles/ai-legible-repository-design)
- 開発セッション直後の振り返りを改善フローにつなげる運用: [/articles/engineering-process-improvement-skill](/articles/engineering-process-improvement-skill)
