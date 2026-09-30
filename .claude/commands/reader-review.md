---
description: 公開中の記事を媒体ごとの想定読者として実際の公開本文で読み、読みやすさを review-only で点検して reviews/reader/<日付>.md の PR を作る（週次・クラウド実行前提）
argument-hint: "[本数（既定 5）]"
---

# /reader-review

公開中の記事を、媒体ごとの想定読者（ペルソナ）になりきって公開本文で読み、「どこで読むのをやめるか」「どの用語で止まるか」「次に何を読めばよいか分かるか」を点検する。全公開記事を、未レビュー → 最終レビューが古い順に、少しずつ巡回する。

**前提**: 週 1 回、クラウドのエージェントが実行する。ブラウザはなく、ネットワークはあり、このリポジトリを clone した環境で動く。ブラウザ操作（Playwright / Chrome 拡張）やローカル専用ツールには依存しない。ローカルでも同じ手順で動く。

**大原則**:

- **記事は編集しない（review-only）**。公開済み記事の修正は著者判断なので、改善案は提案に留める
- 自動マージ禁止。PR 作成までで止める
- 巡回状態 `docs/reader-review/rotation.json` は手で編集せず、手順 (e) のスクリプトで更新する

## 引数

- `$1` = レビューする本数（省略時 5。公開記事約 100 本なら約 5 か月で一巡）。全媒体を通して「未レビュー → 最終レビュー日が古い順」に選ぶ。同じ順位（未レビュー同士・同日同士）の中では媒体（zenn / qiita / note / izanami）を交互に並べ、1 回の中で媒体が混ざるようにする

## 手順

### 0. 準備

```bash
npm ci
DATE=$(TZ=Asia/Tokyo date +%F)
N=${1:-5}
test -e "reviews/reader/$DATE.md" && { echo "reviews/reader/$DATE.md は既にあります。今日の実行は済んでいるので停止します"; exit 1; }
OPEN_PRS=$(gh pr list --state open --search "head:docs/reader-review-" --json number,headRefName --jq '.[] | "#\(.number) \(.headRefName)"') \
  || { echo "未マージ PR の確認に失敗しました（gh が無い・未認証・権限不足）。rotation.json の同時更新を防ぐため停止します"; exit 1; }
test -z "$OPEN_PRS" || { echo "未マージの reader-review PR があります: $OPEN_PRS"; exit 1; }
```

同じ日付のレポートがある、または未マージの `docs/reader-review-*` PR がある場合は、作らずに報告して終了する（前回分がマージされていないと rotation.json が衝突する）。**PR の確認そのものが失敗したとき（`gh` が無い・未認証・権限不足・ネットワーク）も、先へ進まず停止する**。確認できないまま進むと、未マージの前回分と rotation.json を同時に更新してしまう。

前回の実行が push・PR 作成の途中で止まっていた場合は、新しく始めずに「(f) の途中で失敗したとき」の手順で再開する。

### (a) 対象の選定

```bash
node scripts/reader-review-targets.js --count "$N"
```

公開中の記事（Zenn 記事・Zenn Book・Qiita・note・izanami）をリポジトリから列挙し、rotation.json を見て N 本を選ぶ。件数の内訳は `node scripts/reader-review-targets.js --list | head -1` で見られる。

### (b) 本文の取得

```bash
OUT=$(mktemp -d)
node scripts/reader-review-targets.js --fetch --count "$N" --out "$OUT"
cat "$OUT/manifest.json"
# 特定の 1 本だけを読み直すとき（公開 URL を指定。rotation の順番は見ない）
# node scripts/reader-review-targets.js --fetch --url https://zenn.dev/minewo/articles/<slug> --out "$OUT"
```

(a) と同じ規則で同じ N 本を選び、公開本文を `$OUT/<番号>-<媒体>-<キー>.md` に書く。取得方法はスクリプト冒頭のコメントが正本（Zenn は API の body_html、Book は章ごとの API、Qiita は API v2、note は API v3、izanami は公開ページの本文要素）。

- 取得結果の最終行に `origin: live=… repo=… skip=…` が出る。記事ごとの内訳は manifest の `origin` で見る
- Qiita API は無認証で 60 req/h。1 回の実行で使うのは Qiita の本数分だけなので通常は問題ない
- 取得した本文は一時ディレクトリに置き、**コミットしない**
- 画像は alt テキストしか見えない。図の中身は評価せず、alt が無い・図の意味が本文から分からない、までを指摘する

### (b') 取得元の確認ゲート（レビュー前に必ず通す）

manifest の記事ごとに `origin` を確かめ、以降の扱いを決める。

```bash
node -e 'for (const m of require(process.argv[1])) console.log(m.origin.padEnd(5), m.url, m.reason || "")' "$OUT/manifest.json"
```

| `origin` | 意味 | レビュー | rotation 記録 | レポートに書くこと |
| --- | --- | --- | --- | --- |
| `live` | 公開ページの本文を読んだ | する | する | 取得方法 |
| `repo` | 公開本文が取れず、リポジトリの原稿を読んだ | する | する | 記事ごとに「公開ページではなく原稿を読んだ」と `reason`。公開版と差がありうる |
| `skip` | 公開ページが無い（Zenn の 404 = release/zenn へ未反映の可能性）、または取得も原稿の読み込みもできなかった | しない | しない | 対象外にした記事と `reason` を「対象外」節に列挙する |

- `repo` の記事の指摘は、原稿と公開版の差（画像の表示、埋め込み、記法の描画）に左右されうる。描画に関わる指摘は「原稿での確認」と書き添える
- 全件が `skip` なら、レポートも rotation も作らずに理由を報告して終了する

### (c) ペルソナでのレビュー（review-only）

`docs/reader-review/personas.md` を読み、記事ごとに媒体のペルソナを 1 人選ぶ（媒体に 2 人いる場合は記事の主題に近い方。選んだ理由を 1 行書く）。そのペルソナとして `$OUT` の本文を頭から読み、次を書く。記事が複数あるときはサブエージェントに 1 本ずつ並列で任せてよい。その場合も本手順と personas.md、担当記事の本文ファイルと manifest の `origin`・`reason` を渡し、次の制約を明示する: **担当記事のレポート部分（「## N. <記事タイトル>」節の本文）だけを作成して返す。記事ファイル・rotation.json・レポートファイルを含む他のファイルは編集しない**。レポートファイルへの統合と rotation の更新はメインのエージェントが行う。

1. **読むのをやめそうな箇所**: 見出し名と段落の書き出しで位置を示し、なぜそこでやめるかをペルソナの「どこで読むのをやめるか」に結びつけて書く。無ければ「なし」
2. **分かりにくい用語**: 説明なしで出てくる専門用語・略語・固有名と、初出の位置
3. **導線**: 冒頭 3 段落で何の記事か分かるか、読後に次に読むもの・試すものが示されているか
4. **改善案（優先度つき）**: P1 = 離脱や誤解に直結 / P2 = 読みやすさの改善 / P3 = あれば良い。1 記事あたり P1〜P2 を中心に 3〜6 件まで。書き換え例は短く添える

書き方の規律:

- 本文からの引用は逐語で短く。本文に無いことを指摘の根拠にしない
- 記事の主張の正誤判定・書かれていない話題の追加提案はしない（ペルソナは「読むのをやめる地点」を探す道具。`docs/content-channel-strategy.md` §記事の編集原則）
- スマホでの長さは、段落の文字数・表の列数・コードの行幅から推定したものだと明記する（実画面では見ていない）
- note 記事への書き換え例は note の表記規約に合わせる（`AGENTS.md` §note 固有。ダッシュを使わない、三点リーダーは `……`）

### (d) レポートの作成

`reviews/reader/$DATE.md` に次の形式で書く。

```markdown
# 読者 e2e レビュー YYYY-MM-DD

- 対象: N 本（`node scripts/reader-review-targets.js --count N` で選定）
- ペルソナ定義: `docs/reader-review/personas.md`
- 記事は編集していない。改善案は著者が判断するための提案

## サマリー

| # | 媒体 | 記事 | ペルソナ | 本文 | 最優先の改善案 |
| --- | --- | --- | --- | --- | --- |
| 1 | Zenn | [タイトル](URL) | Z1 | live | P1: ... |

## 1. <記事タイトル>

- URL: <公開 URL>
- 原稿: `<リポジトリのパス>`
- 本文: live（<取得方法>）/ <文字数> 文字 ※repo の場合は「公開ページではなく原稿を読んだ」、reason、「公開版と差がありうる」
- ペルソナ: Z1 実装担当のエンジニア（選んだ理由）

### 読むのをやめそうな箇所
### 分かりにくい用語
### 導線
### 改善案

| 優先度 | 箇所 | 提案 | 理由 |
| --- | --- | --- | --- |

### 確認できなかったこと

## 対象外（skip）

選定したがレビューしなかった記事と理由（manifest の reason）。無ければ「なし」。
```

### (e) 巡回状態の更新

レビューを書き終えた記事の URL だけを記録する。`skip` の記事と、レビューが途中で止まった記事は記録しない（次回また選ばれる）。

```bash
node scripts/reader-review-targets.js --record --date "$DATE" --report "reviews/reader/$DATE.md" <URL1> <URL2> ...
node scripts/reader-review-targets.js --list | head -1   # reviewed の件数が増えたか
```

### (f) ブランチ・コミット・PR

```bash
git switch -c "docs/reader-review-$DATE"
git branch --show-current          # docs/reader-review-$DATE と一致しなければ commit せず停止
npm run check                      # exit 0 を確認
git status --short                 # 変更がレポートと rotation.json だけか
git add "reviews/reader/$DATE.md" docs/reader-review/rotation.json
git commit -m "docs(reviews): add reader e2e review for $DATE"
git diff origin/main...HEAD --stat # 2 ファイルだけか
```

浅い clone で `git diff origin/main...HEAD` が merge base を見つけられずに失敗したら、`git fetch --deepen=50 origin main` してから再実行する。

push と PR 作成の直前に `npm run gh:ensure` を実行し、active account を s977043 にする。PR 本文は一時ファイルに書いて `--body-file` で渡す（本文に `git` を含む heredoc は worktree の隔離ガードに拒否されることがある）。

```bash
npm run gh:ensure
git push -u origin "docs/reader-review-$DATE"
gh pr create --base main --head "docs/reader-review-$DATE" --title "docs(reviews): reader e2e review $DATE" --body-file <本文ファイル>
```

PR 本文には、サマリー表（レポートと同じもの）、`repo` で代用した記事とその理由、`npm run check` の結果を書く。記事 PR ではないので Article Plan の Plan 行は不要。`gh` が無い環境では、その環境の PR 作成手段を使う。どちらも無ければ push までで止めて報告する。

**マージはしない**（`AGENTS.md` §禁止事項）。

#### (f) の途中で失敗したとき（再開手順）

レビューと rotation の記録はコミットにだけ残る。途中で止まったら、次の順に状態を確かめ、済んでいる段階の続きから再開する。

```bash
BR="docs/reader-review-$DATE"
git branch --list "$BR"                       # ローカルブランチがあるか
git log --oneline -1 "$BR" -- "reviews/reader/$DATE.md"   # レポートのコミットがあるか
git ls-remote --heads origin "$BR"            # push 済みか
gh pr list --state all --head "$BR" --json number,state,url   # PR があるか
```

| 状態 | 再開のしかた |
| --- | --- |
| ブランチもコミットも無い | 作業ツリーに `reviews/reader/$DATE.md` と rotation.json の変更が残っていれば (f) の最初から。残っていなければ (b) からやり直す |
| コミットはあるが push されていない | `npm run gh:ensure` → `git push -u origin "$BR"` → PR 作成 |
| push 済みで PR が無い | `npm run gh:ensure` → `gh pr create`（上と同じ引数） |
| PR がある | 何もしない。PR URL を報告する |

作り直すほうが確実なとき（別の日付をまたいだ、コミットの中身が壊れている等）は、未 push のブランチなら `git switch main` → `git branch -D "$BR"` → `git checkout -- docs/reader-review/rotation.json` で rotation を戻し、`reviews/reader/$DATE.md` を削除して (a) からやり直す。**push 済みのブランチや PR は消さずに報告し、人の判断を仰ぐ**。

### 報告

PR URL、レビューした記事（媒体・ペルソナ・本文の取得元）、P1 の件数、`repo` で代用した記事とその理由、`npm run check` の exit code を返す。

## ガードレール

- 記事ファイル（`articles/` `books/` `Qiita/public/` `articles_note/` `articles_izanami/`）は変更しない。差分に入っていたら commit しない
- コミットするのは `reviews/reader/$DATE.md` と `docs/reader-review/rotation.json` の 2 つだけ
- 取得した本文（`$OUT`）はコミットしない
- ブラウザ・Playwright・ローカルにしかないツールを使わない
- 自動マージ禁止
