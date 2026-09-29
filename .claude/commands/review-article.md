---
description: 指定した記事を3ペルソナでレビューし、reviews/zenn/<slug>.md を生成してPRを作成する
argument-hint: <article-slug> (articles/ 配下のファイル名 .md 抜き)
---

# /review-article

指定した記事を3ペルソナ視点でレビューし、`reviews/zenn/<slug>.md` を生成してPRを作成する。

初稿は未追跡のまま、またはベースブランチにマージ済みの状態で実行する。記事本文のPRはこのレビューPRとは別に作る。

## 引数
- `$1` = 記事の slug (例: `plangate-ai-coding-workflow`)

## 手順

1. 引数検証 & 重複 PR 確認
   ```bash
   test -f articles/$1.md || { echo "記事が存在しません: articles/$1.md"; exit 1; }
   # 並列セッション衝突回避: このレビュー用ブランチを head に持つ open PR があれば停止して報告
   gh pr list --state open --head "docs/review-$1" --json number,title,headRefName
   ```
   既存 PR があれば作成せず報告して終了。

   新規記事か対象外（ゲート導入前の原稿／改訂）かを `docs/article-lifecycle-contract.md` の「4. Article Planの記録・PR作成ゲート」の適用範囲で判定する。以降のPlan手順は新規記事だけに適用する。新規記事では、レビュー時点で該当 Plan が存在することを確認する。ブランチ作成はPlanの完成前でも行ってよい。
   ```bash
   # 新規記事の判定: 1行目が空（origin/main に無い）か、2行目の導入日以降なら新規記事。
   # 3行目に R 行が出たら、その移動元パスで1行目を再実行し、移動元の追加日が導入日以降なら新規記事（媒体をまたぐ移動は新規記事）
   # 未コミットのリネームは npm run check:article-plan で確認する
   git log origin/main --follow --diff-filter=A --format=%cs -- articles/$1.md | tail -1
   git log -S "Article Planの記録・PR作成ゲート" --format=%cs origin/main -- docs/article-lifecycle-contract.md | tail -1
   git diff -M80% --name-status origin/main...HEAD | grep -F "articles/$1.md"
   ```
   ```bash
   # 新規記事のときだけ実行
   SEED_PATH=$(git grep --untracked -lE "^## (Draft|Approved) Article Plan: zenn/$1$" -- article_seeds)
   echo "$SEED_PATH"
   ```
   0件なら停止し、`Plan未検出: zenn/$1（検索コマンドと結果）` を報告する。2件以上なら候補のパスを報告して停止する。

2. main 同期 & ブランチ作成
   ```bash
   git checkout main && git pull origin main
   git checkout -b docs/review-$1
   git branch --show-current   # 期待ブランチ docs/review-$1 と一致するか確認
   ```
   不一致なら **commit を作らず停止**（並列セッション干渉、`memory/project_parallel_session_metrics.md` Round 5 参照。memory/ はリポジトリ外の個人領域）。

3. `article-reviewer` エージェントを起動し、以下を委譲:
   - `articles/$1.md` を読む
   - **構成の正本として `docs/article-guides/zenn-structure-best-practices.md` を必ず読む**
   - Front Matter の `type: tech | idea` が Zenn 公式のカテゴリー定義に合っているか確認する
   - `type` とは別に、記事の構成タイプを「実装/ハウツー・トラブルシュート・設計/アーキテクチャ・概念/考察/まとめ・混合」から判定する
   - 対象読者 / 得られること / 再現条件 / 先出し結論 / 見出し構造 / 実体験 / 失敗・判断 / 適用範囲を確認する
   - 技術的主張は一次情報・実コード・テスト・ログ・再計測のいずれかで裏取りする
   - 3ペルソナでレビュー
   - `reviews/zenn/$1.md` を生成（既存があれば上書き）
   - フォーマットは `.claude/agents/article-reviewer.md` 準拠
   - 初稿レビューでは `Draft Article Plan` を基準に主張のずれと不足情報を確認する
   - `:::message` / `:::details` / table は読みやすさと再現性に効く場合だけ提案し、装飾目的で機械適用しない
   - 構成ガイドは固定テンプレートとして強制せず、記事タイプ・検索意図・読者を優先する

4. PR作成ゲートの確認 & コミット
   新規記事では、コミット前に同節の作成ゲートを確認する。不足があればコミットもPR作成もせず、不足項目と `SEED_PATH` を報告する。

   Bash の呼び出し間でシェル変数は残らないため、`SEED_PATH` はこのブロックで再計算する。対象Planがベースブランチにない場合は、このコミットへ該当Seedも含める。Planが未追跡・未コミットのままならPRゲートを通過したとみなさない。対象外のときは `# 新規記事のみ` の4行を実行しない。
   ```bash
   # 新規記事のみ
   SEED_PATH=$(git grep --untracked -lE "^## (Draft|Approved) Article Plan: zenn/$1$" -- article_seeds)
   : "${SEED_PATH:?Plan未検出: zenn/$1}"
   [ "$(printf '%s\n' "$SEED_PATH" | wc -l)" -eq 1 ] || { echo "Plan候補が複数: $SEED_PATH"; exit 1; }
   git grep -qE "^## (Draft|Approved) Article Plan: zenn/$1$" origin/main -- "$SEED_PATH" || git add "$SEED_PATH"

   git add reviews/zenn/$1.md
   git commit -m "docs(reviews): add 3-persona review for $1"
   ```

5. push & PR作成

   PR本文のPlan行は同節の書式に従う。`PLAN_LINE` は、新規記事なら再計算した `SEED_PATH` から作り、対象外のときだけ対象外の行を明示的に代入する。
   ```bash
   # 新規記事: Plan を再計算する（見つからなければ止まる）
   SEED_PATH=$(git grep --untracked -lE "^## (Draft|Approved) Article Plan: zenn/$1$" -- article_seeds)
   [ "$(printf '%s\n' "$SEED_PATH" | wc -l)" -eq 1 ] || { echo "Plan候補が複数: $SEED_PATH"; exit 1; }
   PLAN_LINE="Plan: ${SEED_PATH:?Plan未検出: zenn/$1} (zenn/$1)"
   # 対象外（ゲート導入前の原稿／改訂）のときだけ、上の3行の代わりに次を使う
   # PLAN_LINE="Plan: 対象外（ゲート導入前の原稿／改訂） (zenn/$1)"
   # push/PR 直前に実際の active login を確認（s977043 でなければ switch）
   test "$(gh api user --jq .login)" = "s977043" || gh auth switch --hostname github.com --user s977043
   test "$(gh api user --jq .login)" = "s977043" || { echo "GitHub active account を s977043 に切り替えられませんでした"; exit 1; }
   git push -u origin docs/review-$1
   gh pr create --title "docs(reviews): add review for $1" --body "$(printf '3ペルソナでZenn記事レビューを生成しました。\n\nTarget: articles/%s.md\nOutput: reviews/zenn/%s.md\n%s\n\n構成ガイド・再現性・技術的正確性・一次情報の検証を重点観点としてレビューしています。' "$1" "$1" "$PLAN_LINE")"
   ```

6. 結果報告（PR URL、Zennカテゴリー、構成タイプ判定、指摘件数）

## ガードレール
- 既存 `reviews/zenn/$1.md` を上書きする場合は差分を提示して確認
- 記事本文 (`articles/$1.md`) は変更しない
- 構成ガイドをテンプレートとして機械適用しない
- 自動マージ禁止
