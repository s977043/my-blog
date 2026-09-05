# 委託規律テンプレート（my-blog）

このリポジトリでサブエージェント / 外部ワーカーに作業を委託するときの定型。`/orchestrate` などの委託時に **「`docs/worker-discipline-template.md` を読んでから着手すること」の1行を渡せば済む**ようにするためのファイル。

## このファイルの守備範囲（重複回避の方針）

規約の正本は `AGENTS.md`（何が正しいか）、ツール索引と手順は `CLAUDE.md`、経験則は `AGENT_LEARNINGS.md`。**それらを丸写ししない。**

- **実体を置く**: 委託という文脈でしか発生せず、他に単独の置き場が無いもの（worktree セットアップ、完了報告の形式、報告の作法、セッション上限時の指示）
- **1行の索引 + 参照で済ませる**: 既に他ファイルが正本を持つもの（禁止事項、Git 運用、hook の挙動）。ワーカーは 200 行超の `CLAUDE.md` を通読しないので、**「どこに何があるか」と「破ったときに黙って壊れるもの」だけをここに置く**
- 本ファイルと正本が食い違ったら**正本を優先**し、本ファイルを直す

---

## 1. worktree セットアップ

main の checkout では作業しない。ワーカーごとに worktree を切る。

```bash
cd <repo-root>
git worktree add <worktree-path> -b <branch> origin/main
cd <worktree-path>
npm ci   # 必須
```

**`npm ci` を省略しない**。`node_modules` が無いと `npm run check` の集約ランナーのうち `list:articles` / `list:books` / `check:qiita` の 3 件が exit 127（コマンド未検出）で落ちる。この 3 件だけが `node_modules` 配下のバイナリ（`zenn-cli` / `@qiita/qiita-cli`）を呼び、残りの check は Node 標準モジュールのみで動く。

ブランチ名は `AGENTS.md` §Git 運用の命名（`docs/<topic>` / `chore/...` / `feat/...`）に従う。

**Workflow を起動している間はメインセッションの作業ディレクトリを動かさない**（動かすと相対パス解決がズレて成果物が 2 箇所に分裂する。`AGENT_LEARNINGS.md` 2026-09-05）。

---

## 2. 触ってはいけない / 注意が要るファイル

正本は `AGENTS.md` §禁止事項 と §記事の状態（note固有）。以下は索引。

| 対象 | 制約 |
|---|---|
| `articles_note/drafts/` | note 実体のミラー。**手編集しない**（次回エクスポート取り込みで上書き再生成される） |
| `articles_note/published/` | 公開済み。反映 PR に ⚠️ バナー必須。マージ後は note 管理画面で手動反映が要る |
| `articles/*.md` の `published: true` | 勝手に変更しない。公開切替は `release/zenn` 経由の別フロー |
| `Qiita/public/.remote/` | qiita-cli 専用キャッシュ。**commit 禁止**（pre-commit hook がブロック） |
| `AGENTS.md` | `<claude-mem-context>` ブロックの混入を pre-commit hook がブロック。`git diff` で確認して `git checkout --` で破棄する |
| `AGENT_LEARNINGS.md` | **追記型**。既存エントリを書き換えず末尾に足す（`AGENT_LEARNINGS.md` §このファイルの位置づけ）。§📇 テーマ別インデックスへの追記は `npm run check:learnings-index` が検証する |
| `articles_note/export/` | git 管理下に入れない |
| `.claude/` 配下の既存規約 | ユーザー確認なしに変更しない |

**並列ワーカーがいる場合、委託側は「触ってよいファイル」を明示的に列挙して渡す。** 列挙が無いと共有ファイル（`CLAUDE.md` / `package.json` / `scripts/`）で衝突する。

記事本文を改善させる委託では、**`AGENTS.md` §表現規約の媒体固有セクションを情報源として明示的に渡す**。渡さないとワーカーは主題・論理しか見ず、note の禁止表記（ダッシュ）等が混入する（`AGENT_LEARNINGS.md` 2026-09-03）。

---

## 3. Git 運用の制約

- **main への直 commit は pre-commit hook がブロック**する。必ず作業ブランチで作業する（`scripts/hooks/pre-commit`）
- **`git push --force` を `main` に対して使わない**（`AGENTS.md` §禁止事項）
- **自動マージ禁止**。`gh pr merge` は人間ゲート。ワーカーは PR 作成までで止める
- `git add -A` を使わず**対象ファイルを明示**して stage する（`AGENTS.md` の claude-mem ブロックを巻き込まないため）
- commit の直前に `git branch --show-current` と `git status --short` を確認する（並列セッションのブランチ干渉対策。手順の詳細は `CLAUDE.md` §並列セッション耐性）
- push は `gh` の active account が `s977043` でないと pre-push hook がブロックする（`scripts/hooks/pre-push`）。事前に `npm run gh:ensure`
- マージは squash only（`--merge` は GraphQL エラーになる）

---

## 4. PostToolUse の formatter churn

Edit ツールでの編集が **ファイル全体の再整形**（テーブル整形・クォート統一・改行スタイル）を巻き込むことがある既知事象。+13 行の変更が 395 行の diff に埋もれた実例がある（`AGENT_LEARNINGS.md` 2026-07-03）。

**commit 後に必ず次を見る。**

```bash
git diff origin/main...HEAD --stat
```

意図した行数・ファイル数を超えていたら、**commit をやり直す**。`git checkout -- <file>` で revert し、Bash の heredoc か Python スクリプト経由で対象行だけを書き換える（この経路では formatter hook が発火しない）。

「意図した変更だけがある diff」をレビュー可能性の必須条件として扱う。

---

## 5. 完了報告に含める項目

以下を**すべて**入れる。無いものは「未実施」と書く。

1. **head SHA**（`git rev-parse HEAD`）と PR 番号
2. **変更ファイル一覧**
3. **`git diff origin/main...HEAD --stat` の出力**（3 点比較。PR 作成前にも見る）
4. **実行した検証コマンドと exit code**（例: `npm run check` → exit 0）
5. **スコープ外で気づいた問題**（手を出さず 1 行で添える）

報告の分量上限を委託側が指定する（目安 1,000〜1,500 tokens）。コードの再掲は不要で、**load-bearing な差分だけ**引用する。

---

## 6. 報告の作法

- **全称命題（「すべて」「一度も」「全件」）を書くなら、全数を確認してから書く。** サンプリングで全体を断定しない
- **一次情報で裏が取れない主張は断定しない。** 「〜と考えられる」「記録上は特定できていない」など確度に合った表現にする。確認できなかったものは「未確認」と明記する。消去法の**否定側は断定してよい**（根拠が実物にある）が、候補が複数残ったまま 1 つに確定させない（`AGENT_LEARNINGS.md` 2026-09-02）
- **別々のインシデント・別々の記録を接続して根拠にしない**
- **委託プロンプトの説明文は一次ソースではない。** オーガナイザーの記述は要約なので、必ずファイルを開いて確認してから書く。確認できなかった項目は書かない
- 「特定せよ」と読める指示でも、特定できなければ**「特定できる範囲を明示する」**に読み替えて返す

---

## 7. セッション上限に当たったとき

- **成果を commit だけして、状態を報告する。** worktree の部分成果は残るので、破棄して作り直さない
- 報告には head SHA、どこまで終わったか、次に何をすればよいかを書く
- 中途半端な状態でも push / PR 作成まで進めるかは委託側の指示に従う（指示が無ければ commit で止める）

---

## 8. 新設スクリプトには self-test を同梱し、CI にも繋ぐ

新設・大幅変更する check スクリプトには、**想定 PASS / 想定 FAIL の fixture を用いた self-test を同一 PR に同梱**する（`AGENT_LEARNINGS.md` 2026-07-03。ガード自体の初版バグが #391/#393、#417 で実際に発生した）。

このリポジトリの規約:

- 実装は `scripts/<name>.js` に `--self-test` フラグを生やす（既存の全 self-test がこの形。fixture は `scripts/fixtures/<name>/` に置く）
- `package.json` に `check:<name>` と `test:<name>`（= `node scripts/<name>.js --self-test`）の 2 本を足す
- `check:<name>` を `npm run check` の集約ランナーの `checks` リストに足す

**ただし集約ランナーに足すのは「読むだけの検査」に限る。** ファイルを削除・変更する運用スクリプト
（`cleanup:pr` / `publish:qiita` など）は `npm run check` に入れない。CI が副作用付きの操作を実行して
しまう。この種のスクリプトは bash でもよく（`scripts/cleanup-pr-worktree.sh` / `scripts/check-pr-staleness.sh`
が実例）、self-test を別ファイルへ切り出して `test:<name>` から `exec` する形も既存にある。
その場合も **self-test を `.github/workflows/ci.yml` へ繋ぐことは必須**。
- **`test:<name>` を `.github/workflows/ci.yml` の self-test ステップに足す**

**最後の 1 手を忘れない。** script を書いても CI に wire されていなければガードは効かない（`AGENT_LEARNINGS.md` 2026-06-07）。2026-09-06 に未接続の self-test 9 件が一括発覚している（PR #606）。

---

## 委託プロンプトに貼る定型ブロック

```markdown
## 規律

`docs/worker-discipline-template.md` を読んでから着手すること。特に §4（formatter churn）と §6（報告の作法）は必ず守る。

- worktree: `<path>` / ブランチ: `<branch>` / `npm ci` 済みで作業する
- 触ってよいファイル: `<列挙>`。それ以外は変更しない
- 一次ソース: `<ファイルパスの列挙>`（この委託文は要約なので、必ず原典で確認する）
- 検証: `npm run check` が exit 0 のままであること
- `git push` / `gh pr create` は<許可 or 禁止>。`gh pr merge` と force-push は禁止
- 完了報告は §5 の 5 項目を <N> tokens 以内で
```
