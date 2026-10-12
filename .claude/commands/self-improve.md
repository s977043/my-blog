---
description: 未処理の growth signals（ガード発火・やり直しの痕跡）を学び・ガード案に振り分け、上限内で自己改善 PR を作る
---

# /self-improve

SessionEnd hook が `~/.claude/state/my-blog-growth/signals.jsonl` に記録したシグナルを処理する。SessionStart で「未処理のシグナル N 件」と表示されたときに使う。

上限と承認の境界は `docs/agent-growth-harness.md` §4 安全策が正本。本コマンドはその範囲の内側だけで動く。**マージはしない**。

## 手順

### 1. 入力を読む

```bash
node scripts/growth-signals.js list --json
npm run report:learnings-promotion
```

- `list --json` は未処理（`processed:false`）だけを返す。各シグナルの `id` を後の手順で使う
- report のテーマ別記録数・ガード言及数・昇格候補を、手順 2 の判定材料にする

### 2. 既存の学びと突合して分類する

シグナルごとに `AGENT_LEARNINGS.md` を `kind`・`detail` の語（ブランチ名、ガード名、コミット件名）で grep し、次の 3 つに分ける。

| 分類 | 条件 | やること |
|---|---|---|
| (a) 既存で足りる | 同じ事象を説明する既存エントリがあり、ガードも働いている（`guard_block` はガードが止めた＝想定どおり） | 処理済みにするだけ。判断理由に該当エントリの見出し日付を書く |
| (b) 新しい学び | 既存エントリに無い落とし穴・成功パターン | `AGENT_LEARNINGS.md` 冒頭のテンプレートでエントリ案を書く |
| (c) ガード案 | 同テーマが 3 件目以上（report のテーマ別記録数で数える）、またはガード導入済みテーマで再発した | 新規 check の案を書く。初期は WARN（exit 0）で 2 週間運用し、バイパス用の `SKIP_*` 環境変数を持たせる前提 |

- 未 push・未コミットの残り（`unpushed_commits` / `uncommitted_changes`）は、まず現物を確認する（`git log --branches --not --remotes`、`git -C <worktree> status --short`）。放置ブランチなら CLAUDE.md §セッション終了時のチェックリストで片付け、(a) として処理する
- `redo_commit` は件名の語で拾っているので誤検知がある。やり直しではないもの（例: 単なる「再度確認」の文言）は (a) として理由を残す
- 推測で分類しない。一次情報（commit・ファイル・PR）で確かめられなかったものは処理済みにせず、報告に「未確認」と書いて残す

### 3. 上限を確かめてから PR にする

(b)・(c) があるときだけ PR を作る。作る前に当日（JST）の自己改善 PR を数える。

```bash
gh pr list --repo s977043/my-blog --state all --search "created:>=$(TZ=Asia/Tokyo date +%Y-%m-%dT00:00:00+09:00) head:chore/self-improve-" --json number --jq length
```

- **3 本以上なら PR を作らずに止め、ユーザーに報告する**（暴走検知）
- ブランチ名は `chore/self-improve-<topic>`。worktree を切り、`docs/worker-discipline-template.md` §1・§3 に従う
- 1 PR あたり **新規ガード 1 本・学びの追記 5 件まで**。超える分は次の PR に回すか、提案に留める
- `AGENT_LEARNINGS.md` は末尾への追記のみ。§📇 テーマ別インデックスへも足し、`npm run check:learnings-index` を通す
- ガード案は `scripts/<name>.js` に `--self-test` を同梱する（同 §8）。`npm run check` 集約への組み込み・CI への接続・hook のブロック条件の変更は承認事項なので、PR 本文に「承認後に別 PR」と書く
- 既存 check の判定を緩める変更（閾値・正規表現・除外パス・`SKIP_*` の既定値）はしない
- **`.claude/` 配下・`AGENTS.md`・`CLAUDE.md` の変更案は PR にしない**。報告に提案として書くだけにする
- push / PR 前に `npm run gh:ensure` と `npm run check`。**`gh pr merge` は実行しない**

### 4. 処理済みにする

PR を作ったものも作らなかったものも、判断理由を付けて処理済みにする。

```bash
node scripts/growth-signals.js mark <id> [<id>...] --note "<分類と理由。PR を作ったなら番号>"
```

- 理由は `detail` の末尾に `[processed: ...]` として残る
- 上限で止めた分・未確認の分は処理済みにしない（次回の SessionStart で再表示される）

### 5. 報告

- 分類ごとの件数と、処理済みにした `id` の数
- 作った PR（番号・ブランチ）と、上限で見送った案
- `.claude/`・`AGENTS.md`・`CLAUDE.md` への提案（PR にしていないもの）
- 処理済みにせず残したシグナルとその理由
