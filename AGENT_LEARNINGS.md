# AGENT_LEARNINGS.md

AIエージェント（Claude Code / Codex / その他）がこのリポジトリで作業する際に役立つ、**経験則・gotcha・成功パターン**を蓄積する記録。

## このファイルの位置づけ

- **正**: `README.md` / `CLAUDE.md` / 各ディレクトリの `README.md`（これらの規約を守ること）
- **経験則**: 本ファイル `AGENT_LEARNINGS.md`（過去の失敗・学びを次回に活かす）
- **個人設定**: `.claude/` 配下の Skill / Agent / Command（自動適用される振る舞い）

本ファイルは **追記型**。古いエントリも履歴として残し、更新日と理由を明記する。

## 更新ルール

1. **誰が更新するか**: AIエージェントがセッション終盤に学びを抽出、または ユーザーが明示的に指示した時
2. **いつ追加するか**:
   - 同じミスを2回以上した / 非自明な落とし穴を発見した時
   - 特定の成功パターンが再現できると確認した時
   - ユーザーから「次回はこうして」と明示的な指示を受けた時
3. **書かないこと**:
   - コードを読めば分かる事実（ファイルパスや関数名の羅列）
   - 一度きりのタスクの詳細（メモリや会話で完結する内容）
4. **書き方**: 下記テンプレート参照

### エントリ形式（テンプレート）

```markdown
### YYYY-MM-DD — <短い見出し> [カテゴリ]

**観察**: 何が起きたか。事実ベース。

**対策/学び**: どう対応したか、または今後どうするか。

**根拠**: 参照PR/Issue/コミット（あれば）
```

カテゴリ: `Platform` / `Workflow` / `Gotcha` / `Performance` / `Convention` / `Tooling`

---

## 🧭 学びエントリ

### 2026-04-30 — `gh auth setup-git` は active account を上書きする副作用がある [Gotcha/Auth]

**観察**: PR #178 作成時、HTTPS push が `Permission denied to kominem-unilabo` で失敗。`gh auth setup-git` でクレデンシャルヘルパーを再設定して push は通ったが、直後の `gh pr create` が `must be a collaborator (createPullRequest)` で失敗。`gh auth status` を確認すると active account が **s977043 → kominem-unilabo に切り替わっていた**。`gh auth switch -u s977043` で復旧後、再実行で成功。CLAUDE.md には「`git push` 直前の auth 確認」しか書かれておらず、`gh pr create` / `gh pr merge` 前の確認は盲点だった。

**対策/学び**:
- `gh auth setup-git` を実行したら直後に必ず `gh api user --jq .login` で active account を再確認する
- `git push` だけでなく、`gh pr create` / `gh pr merge` の **直前すべて** で active account を確認する（CLAUDE.md チェックリスト #3 を更新済み）
- 失敗時の復旧コスト: 1ラウンドの再実行（30秒〜1分）。発生頻度はこのリポでは中。同種の auth 切替は他にも `gh auth refresh` などで起こりうる
- `git push`（HTTPS）と `gh pr create`（GitHub API）は別の認証経路を使う点に注意。push が通っても PR 操作が通るとは限らない

**根拠**: PR #178 作成セッション、本振り返り PR で改善実装

### 2026-04-30 — `md_to_wxr.py` は画像参照ありで `--base-url` 未指定なら exit 1 で失敗する [Workflow/Guard]

**観察**: 振り返り PR セッションで `md_to_wxr.py` を `--base-url` なしで実行する誤りが複数記事で発生。従来は `[warn] ローカル画像 N件あり` の警告のみで WXR 生成が成功してしまうため、警告を見落とすと「note インポートして画像が出ない → 再生成 → 再インポート」の手戻りが発生する設計だった。本振り返り PR でガード化（exit 1）を実装。

**対策/学び**:
- 画像参照ありで `--base-url` 未指定なら exit 1 で終了。WXR ファイル自体は調査用に書き出される
- 意図的にローカル参照を残したい場合は `--allow-local-images` を明示
- WXR 生成は **必ず `--base-url https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets`** を付ける（CLAUDE.md チェックリスト #6 に追記済み）

**根拠**: 本振り返り PR で `.claude/skills/note-export-import/scripts/md_to_wxr.py` 改修

### 2026-04-30 — note 画像配置時はサイズ・寸法を必ず検証する [Gotcha/Workflow]

**観察**: PR #167 で OpenAI Symphony 記事のカバーとして配置された PNG が **600×315 / 7KB のプレースホルダ画像**で、本番運用までその状態が見過ごされた。他のカバー画像は 1200×630 / 65–103KB が標準だが、ファイル名が同じなだけで実物確認がなく、note 取り込み時に画像として認識されず URL がテキストとしてレンダリングされる現象が発生（PR #174 / #175 で計2回追加対応）。

**対策/学び**:
- 画像配置 PR では `file <path>` で寸法と形式を、`ls -la` でサイズを必ず確認する
- 既存カバー画像と比較し、サイズが極端に小さい（<10KB）場合は警戒する
- `npm run check:note-images` を CI に組み込み、`articles_note/assets/**/*.png` の <10KB を WARN（プレースホルダ早期検知）
- noteインポート後に「画像が表示されない」「URLがテキストになっている」現象を見つけたら、まず画像実体のサイズと寸法を疑う

**根拠**: PR #174（実画像差替）/ PR #175（v2リネームでキャッシュバイパス）/ PR #176（CI 自動検知追加）

### 2026-04-30 — note 画像 URL がテキスト化されたら v2 リネーム戦略でキャッシュバイパス [Gotcha]

**観察**: プレースホルダ画像（7KB）を本番画像に差替後（PR #174）も、note 上で取り込み済みの下書きでは URL がテキスト表示のまま改善しなかった。GitHub Raw URL の CDN キャッシュ（5分）と、note 側の「この URL は画像にならない」判定キャッシュの両方が原因。同URLでの再インポートでは取り込みに失敗するケースがある。

**対策/学び**:
- 画像差替後にユーザー側で「URLテキスト化」が継続している場合、ファイル名を変更（例: `cover.png` → `cover-v2.png`）して URL 自体を別物にする
- 記事 md の参照を新ファイル名に更新し、WXR を再生成 → ユーザーは note 上の壊れた下書きを削除して再インポート
- 旧ファイルは他で参照される可能性があるため残置（不要なら後日削除）

**根拠**: PR #175

### 2026-04-30 — note WXR インポートは公式エクスポートの HTML パターンに揃える [Format/Critical]

**観察**: `md_to_wxr.py` は標準 python-markdown の出力（`<p>本文</p>`、ブロック間 `\n`、`<br/>` XHTML形式）を CDATA に詰めて WXR を生成していた。note は WordPress wpautop 相当の補正をしないため、Markdown 内の改行が `<br>` にならず、ブロック間の `\n` も意図しない空白として扱われ、note 上で「空の改行が出る」「改行が消える」現象が発生した。`verify_wxr.py` は構造チェックのみで HTML パターンの差分は検知できない。

**対策/学び**:
- `python-markdown` に **`nl2br` 拡張を必ず追加**（`extensions=["fenced_code", "tables", "sane_lists", "nl2br"]`）。Markdown の単一 `\n` を `<br>` に変換しないと note 上で改行が消える
- 全ブロック要素（`p`/`h2`/`h3`/`ul`/`ol`/`pre`/`figure`/`blockquote`）に **UUID v4 の `name=id=` 属性を必ず付与**。公式エクスポートと同じパターンに合わせると note エディタが「公式投稿と同じ構造の下書き」として認識する
- `<li>X</li>` は **`<li><p name=UUID id=UUID>X</p></li>` で二重ラップ**（公式形式準拠、リスト項目もコピペ・再編集しやすくなる）
- HTML5 ボイド形式に統一（`<br>`/`<img>`/`<hr>`、自己終端 `/>` は使わない）
- 外部リンクには `target="_blank" rel="nofollow noopener"` を付与
- `<code>` の `class="language-X"` は削除（note は class 属性を保持しない）
- ブロック要素間の `\n` は除去（公式は `</p><p>...` のように密結合）
- 空段落が必要な場面は `<p name=UUID id=UUID><br></p>`（`<p></p>` は note レンダラで潰される、`<p>&nbsp;</p>` はゴミ空白が入る）
- 検証は `verify_wxr.py`（構造）+ 公式エクスポート WXR の HTML パターン比較（目視 or 専用 linter）の二段構え

**実装ポイント** (`.claude/skills/note-export-import/scripts/md_to_wxr.py`):
- `transform_html_to_note_format()` パイプラインで wrap_images_in_figure → normalize_void_elements → strip_code_class → wrap_li_content → add_uuid_to_blocks → add_external_link_attrs → collapse_block_whitespace の順で正規化

**根拠**: PR #172 / 2エージェント並列調査（公式WXR 28記事のHTMLパターン解析 + Web仕様調査 14URL）/ 全11記事の再生成で `verify_wxr.py` PASS

### 2026-04-20 — 並列エージェント起動前に書き込み許可を事前確認する [Workflow]

**観察**: Zenn 記事 11 本を `article-reviewer` サブエージェントで並列起動したところ、全 11 本が `Write(reviews/zenn/**)` permission denied で停止した。バックグラウンド実行中の permission prompt に応答できず、全エージェントの作業が無駄になった（精読・指摘生成は完了していたがファイル書き込みのみ失敗、20〜30 分のロス）。

**対策/学び**:
- 大量並列起動の前に、対象パスへの Write/Edit が `.claude/settings.local.json` で allow されているか確認する
- 記事 / レビュー / スキル定義など**本プロジェクトで頻繁に書き込むパス**は事前に設定へ追加:
  - `Write(reviews/zenn/**)` / `Edit(reviews/zenn/**)`
  - `Write(reviews/note/**)` / `Edit(reviews/note/**)`
  - `Write(articles/**)` / `Edit(articles/**)`（既に暗黙許可相当だが明示推奨）
- background (`run_in_background: true`) エージェントは permission prompt に応答できない前提で設計する

**根拠**: PR #91（11 本再レビュー生成、初回は全滅、許可追加後に再起動で成功）

### 2026-04-20 — 並列セッション干渉で commit が意図せず main に着地する [Gotcha]

**観察**: 同一ワーキングツリーで複数セッションが走る環境では、`git switch -c <branch>` 実行直後に別セッションの作業でブランチが切り替わり、気づかないまま `git commit` が **main に直接着地する**事案が 1 セッションで 3〜4 回発生した。PR 作成のための push も意図したブランチではなく main に対するものになりそうになった。

**対策/学び**:
- `git commit` 直前に **必ず `git branch --show-current` で期待ブランチ確認**（既存の CLAUDE.md ガードを厳守）
- 誤って main に commit した場合の復旧フロー:
  ```bash
  git branch -f <intended-branch> HEAD   # 該当 commit を目的ブランチに付け替え
  git reset --keep origin/main           # main をリモートに戻す（--hard より安全）
  git switch <intended-branch>           # 作業継続
  ```
- `git reset --keep` は uncommitted changes を保護し、問題があれば中止する安全な reset

**根拠**: 本セッションで少なくとも PR #91 / PR #101 / PR #109 の 3 回の復旧が発生

### 2026-04-20 — Zenn 記法活用観点を reviewer / applier の両側に恒久化する [Workflow]

**観察**: ChatGPT 外部レビューで「`:::message` / `:::details` / table で長文を畳む」指示を受けたが、既存の `article-reviewer` の Zenn 読みやすさ観点（1-8）には記法活用が含まれていなかった。毎回外部レビューを受けると再現性がなく、コストも掛かる。

**対策/学び**:
- `article-reviewer` の観点 9-11 として追加し、ルール #8 の「毎回チェック」対象に組み込む（観点 9: 想定読者 `:::message` / 観点 10: `:::details` で畳む / 観点 11: table 化）
- `review-applier` / `article-review-apply` SKILL には **文面生成の有無**で採否を機械判定する基準を追加:
  - 採用可: `:::details` で既存を畳む、table 化、既存段落を `:::message` で囲う、固有 SHA を一般表現に置換
  - 保留: 新規文面生成（想定読者・コアメッセージ・中間まとめ・最小導入など）
- 外部レビューの知見は **エージェント定義へ昇格**させると次回から内製で再現できる

**根拠**: PR #107（記事反映）/ PR #108（reviewer 強化）/ PR #109（applier + SKILL 強化）

### 2026-04-16 — reviews/ はプラットフォームで3分割する [Platform]

**観察**: Zenn / note / Qiita の記事を同一リポジトリで管理している。当初 `reviews/` 配下はフラットで Zenn 前提だったが、note記事のレビュー生成で配置規約の衝突が発生した。

**対策/学び**:
- `reviews/{zenn|note|qiita}/` で**必ずプラットフォーム別サブディレクトリ**を切る
- note は公開状態で意味が変わるため、さらに `reviews/note/{new|drafts|published}/` と階層化
- 新規プラットフォーム追加時はこの規約に従うこと

**根拠**: PR #48、`.claude/agents/note-article-reviewer.md`、`reviews/*/` のディレクトリ構造

---

### 2026-04-16 — 新規 Agent 作成直後は harness 未リロード [Gotcha]

**観察**: `.claude/agents/<name>.md` を作成して直後に `Agent(subagent_type: "<name>")` で呼び出すと「Agent type not found」エラー。ハーネスのリロード前はまだ未登録状態。

**対策/学び**:
- 新規 Agent を使いたい場合:
  - (A) ユーザーに Claude Code の再起動を依頼してから使う
  - (B) `general-purpose` エージェントに仕様書の Read を指示してインライン委譲（即時実行したい時）
- 新規 Skill / Command も同様の可能性。system-reminder にそれらが列挙されたら利用可能と判断できる

**根拠**: 2026-04-16 セッション、note-article-reviewer 初回呼び出し失敗

---

### 2026-04-16 — note記事は JTF スタイル準拠が必須 [Convention]

**観察**: note.com は「テキスト校正くん」等のJTF 日本語スタイルガイド系リンターで警告が出やすい。特にダッシュ（`—` `――` `──` `―`）は個人記事で頻出する違反パターン。

**対策/学び**:
- 原則ダッシュは使わず、**全角括弧**（）や**句点**で置換
- 三点リーダーは `……`（2 つ並べる）
- カッコ類は全角 `（）「」『』`
- 敬体／常体の混在は章単位のみ許容、文中混在は避ける
- note向けレビューでは JTF 違反を**必ず個別指摘として含める**

**根拠**: `.claude/agents/note-article-reviewer.md`、reviews/note/ の複数レビューで繰り返し検出

---

### 2026-04-16 — published/ 記事の反映は ⚠️ バナー必須 [Workflow]

**観察**: note は WXR インポートで既存記事を上書き更新**できない**（常に新規下書きとして作成される）。`articles_note/published/` 配下を編集してもリポジトリ上の変更とnote側の実状態が乖離する。

**対策/学び**:
- `articles_note/published/` 配下の記事に反映PRを作る場合、PR 本文冒頭に必ず:
  ```
  > ⚠️ **公開済み記事** (`articles_note/published/`)
  > 本PRは既にnote.com上で公開されている記事への修正提案を含みます。
  > note はインポートで既存記事を上書き更新できないため、マージ後はnote管理画面で手動反映が必要です。
  ```
- `/review-note-article published/<slug>` ではレビューだけ、反映は著者判断（note側の手動編集を伴うため）
- 自動マージ禁止（CODEOWNERSとは別に、published系は慎重）

**根拠**: `articles_note/README.md` note仕様制約、`.claude/skills/note-article-review/SKILL.md` ガードレール

---

### 2026-04-16 — 記事レビューは並列エージェント実行で10倍速 [Performance]

**観察**: 個人記事10件のレビュー生成を並列エージェントで実行し、実働10分弱で完了。逐次（1件2〜3分想定）だと30分以上かかる見積もり。

**対策/学び**:
- 独立したレビュー/分析タスクは `run_in_background: true` で並列起動する
- 並列数の目安: 10〜12程度までは安定動作を確認
- 並列時の注意:
  - 各エージェントの成果物パスを**重複しないよう**明示的に指定する
  - 出力先ディレクトリは事前に `mkdir -p` で作成しておく（並列 mkdir レースを回避）
  - TaskCreate で各ジョブを事前に作っておくと進捗管理が容易

**根拠**: 2026-04-16 セッション、reviews/note/published/ 10件の生成

---

### 2026-04-16 — ディレクトリ構成はスキル作成前に実態確認 [Workflow]

**観察**: `note-article-review` スキルを最初に作ったとき、`articles_note/<slug>.md` フラット構成を前提にしていた。実際は `articles_note/{new,drafts,published}/<slug>.md` と階層化されており、作成直後に改修が必要になった。

**対策/学び**:
- 新規スキル/コマンド/エージェントを設計する前に:
  1. `ls <対象ディレクトリ>` で実構成を確認
  2. 既存類似スキル（Zenn 用など）との整合を確認
  3. 出力パス規約を最初から2軸以上（プラットフォーム×状態 など）で設計
- READMEと実構成が乖離していないかも確認する（本リポジトリは各ディレクトリに README.md あり）

**根拠**: 2026-04-16 セッション、`.claude/skills/note-article-review/SKILL.md` の path convention 2段改修

---

### 2026-04-17 — jtf-style (3.1.1) はコードブロック内の日本語コメントも対象 [Convention]

**観察**: `テキスト校正くん` (VS Code 拡張) が `jtf-style/3.1.1.全角文字と半角文字の間` のスペースを警告する。ルート `README.md` で「コードブロック内は触らない」方針でツリー図の日本語コメントを放置したところ、Gemini Code Assist から差し戻しの review コメントを受けた。

**対策/学び**:
- 全角/半角が隣接する箇所ではスペースを入れない（例: `Zenn と Qiita` → `ZennとQiita`、`articles/ 配下` → `articles/配下`）
- **ツリー図やbashコメントの日本語説明文も本文扱い**で同ルールを適用する
- コードブロック**内の純ASCII**（コマンド本体やパス）は対象外
- 新規記事/READMEを書く前に既存ファイルが準拠しているかをGrepで確認してから追従する

**根拠**: PR #49、Gemini Code Assist review（2026-04-16）

---

### 2026-04-17 — 固有名詞は `.cspell.json` に集約する [Tooling]

**観察**: `Qiita`・`Zenn`・`Findy`・`FindyTeamPlus`・`unilabo`・`PRONI` など、プロジェクト特有の固有名詞は cSpell のデフォルト辞書に含まれず `Unknown word` 警告が多発する。

**対策/学び**:
- リポジトリルートに `.cspell.json` を置いて `words` に追加していく
- `caseSensitive: false` にすれば `Qiita`/`qiita` 両方カバーできる
- `ignorePaths` に `.gitignore` 相当のビルド成果物・エクスポート置き場（`Qiita/public/.remote/`、`articles_note/export/`、`node_modules/`）を記載
- 新しい固有名詞で警告が出たら、その場で `words` に追加する運用（辞書を育てる）

**根拠**: PR #49、`.cspell.json`

---

### 2026-04-17 — commit 直前にカレントブランチを確認 [Gotcha]

**観察**: IDE や hook の影響で `git checkout` が意図せず別ブランチに切り替わっていることがある。PR #49 の修正を `docs/readme-style-and-cspell` に積むつもりで `git commit && git push` したところ、`docs/agent-guide-bootstrap` にコミットが載ってしまい、cherry-pick で PR ブランチに反映し直す羽目になった。

**対策/学び**:
- 複数ブランチをまたぐ作業の場合、commit直前に必ず `git branch --show-current` または `git status` の 1 行目を確認する
- `git status` 冒頭行をBashの最初のコマンドに混ぜておくと癖になる（例: `git status && git commit ...`）
- 間違えて別ブランチに push した場合は、**force-push で消す前に** cherry-pick で正しいブランチに反映して PR が通る状態を先に作る（破壊的操作は最後）

**根拠**: PR #49、commit `f192cb2` → `7b80d42` cherry-pick

---

### 2026-04-17 — lint/diagnostics の警告は「まず全部直す」がデフォルト [Workflow]

**観察**: READMEのjtf-style警告に対して「プロジェクト慣習に合わせて残す」と初回判断したが、ユーザーから「修正して」で差し戻された。lint設定が生きている = ルールとして守る前提というのが正解だった。

**対策/学び**:
- プロジェクト側で VS Code 拡張やCIで lint ルールが有効な場合、警告は「無視可」ではなく「直すべき」と解釈するのがデフォルト
- 残す判断をするなら、理由と根拠（例: 他ファイルとの整合、技術的制約）を明示してユーザー確認を取る
- lint通過が前提のスタイルが既に確立している場合は `.cspell.json` のような辞書ファイルで吸収する設計も選択肢

**根拠**: 2026-04-17 セッション、README更新の差し戻し

---

### 2026-04-18 — WXR(note公式形式)の著者フィールドとCDATAエスケープ規則 [Convention]

**観察**: `md_to_wxr.py`をnote.com公式エクスポート形式に寄せる改修で、authorの扱いとCDATA衝突で複数回手戻りが発生した。特に以下が非自明:

1. ~~`<dc:creator>`には **author_login** を入れるのがWXR慣例で、表示名はここに入れない~~ **← 2026-04-18 後段エントリで訂正。事実は逆**
2. ~~表示名は`<wp:author><wp:author_display_name>`で指定する~~ **← 同上**
3. CDATA衝突は`<title>`と`<content:encoded>`の**両方**で起きうる。タイトルに`]]>`を含む記事があるとXMLが途中終了する（この点は継続して有効）

**対策/学び**:
- `]]>`分割処理（`]]]]><![CDATA[>`）はbody HTMLだけでなく **titleにも** 適用する。共通化するならlambda/関数として抽出する
- 時刻を複数箇所で扱う場合（pubDateと出力ファイル名のts等）、**全箇所で同じTZ**に統一すること。`datetime.now()`と`datetime.now(timezone(timedelta(hours=9)))`を混在させると実行環境で揺れる
- gemini-code-assist / sentry-seerのline-level commentはピンポイントかつ根拠が明確なので、ローカル検証（`xmllint --noout` + サンプル実行）で裏取りしてから一気に反映するのが効率的

**根拠**: PR #57 (dad8236)、gemini-code-assist / sentry-seerのレビュー、commit `b8044f5`

---

### 2026-04-18 — note WXR インポート失敗で判明した必須フィールド [Convention] [Incident]

**観察**: 上記エントリの知見で生成したWXRをnoteに投入したところ「記事の読み込みに失敗しました」でインポートエラー。公式エクスポートZIPを再解析したところ、2つの誤りが判明:

1. **著者フィールドは `<dc:creator>` と `<wp:author_display_name>` の役割が上記エントリの記載と逆**
   - 公式: `<dc:creator>` = 表示名（`みね`）、`<wp:author_display_name>` = login ID（`mine_unilabo`）
   - 直感に反するが、note公式エクスポート `note-mine_unilabo-1.xml` がそうなっている
2. **`<item>` 直下に 14 個の `wp:*` フィールドが必要**。これらを省略するとnote importerがエラーで弾く
   - 必須と推定されるもの: `wp:post_id` `wp:post_type=post` `wp:status` `wp:post_date` / `wp:post_date_gmt` / `wp:post_modified` / `wp:post_modified_gmt` `wp:comment_status` `wp:ping_status` `wp:post_name`（URLエンコード済スラッグ） `wp:post_parent` `wp:menu_order` `wp:post_password` `wp:is_sticky`
   - 旧スクリプトは「note公式エクスポートと同形式」を謳いつつ、これらを全て省略していた。channelレベルだけ公式形式でも`<item>`が空だとimporterが post として認識しない

**対策/学び**:
- WXR 変更時は「XMLとして well-formed」では不十分。**公式エクスポートZIPと `<item>` の wp:* タグを一個一個照合**する。`xmllint --noout` は構文チェックしかできない
- 著者フィールドは直感に頼らず実測。WordPress標準のWXR慣例とnoteの実装は違う
- `ElementTree.parse` で公式/生成の両方をloadして `[el.tag for el in item]` を diff すると抜けが1発で分かる（検証スクリプト化候補）
- 新規フィールド追加や公式形式対応で「import 成功まで」を確認するには、実際にnote管理画面に投入するしかない（xmllint・schema検証だけでは通らないエラーがある）

**根拠**: 2026-04-18 06:58 JST に `import-ai_agent_operations_opinion_note-20260418-0649.xml` をnoteに投入→「インポートにエラーが発生したため、記事の読み込みに失敗しました」、公式エクスポート `note-mine_unilabo-1.xml` との `<item>` 構造比較、PR #62 (fix/note-wxr-import-fields)

---

### 2026-04-19 — note インポートの運用制約と 2 スペース改行の罠 [Convention] [UX]

**観察**: note WXR インポートを運用フェーズで複数記事に適用した際に、スクリプトでは捕捉できない 2 つの制約が判明した。

1. **note 管理画面のインポートは 1 ファイル単位のみ**。WXR に複数 `<item>` を束ねて投入する設計は技術的には動くが、UI は 1 つのファイルしか受け付けない。複数記事を投入する場合は個別 WXR を 1 本ずつシリアル送信する前提で運用する。
2. **Markdown の 2 スペース改行（行末 2 スペース）が note 側で `<br />` として余白過多を生む**。Python-Markdown の変換で `<br />` になり、note は段落間の標準余白 + `<br />` の追加余白を両方適用するため、スマホ表示で間延びして見える。`verify_wxr.py` は well-formed と構造しか見ないので、この視覚問題は検出できない。

**対策/学び**:
- 複数記事の一括投入スクリプトを設計するなら「1 ファイル生成 → 投入 → 下書き確認」のシリアルフローを前提にする。並列投入しても note 側で順次処理されるだけで高速化しない
- 2 スペース改行は Markdown の仕様としては正しいが、note の表示を考えると「段落内で息継ぎを入れたい」用途では空行による段落分けの方が安全
- `ai_agent_operations_opinion_note.md`（26 箇所）と `note_production_ai_app_article.md`（11 箇所）で同じ問題が再現。レビュー時の Medium 指摘で 2 スペース改行を推奨する場合は、note の実表示影響を先に検証する
- `note-article-reviewer` と `article-reviewer` の両方にチェック項目化済み（PR #69 / #70）。観点 #10: 「2 スペース改行が意図的（多用しすぎて `<br />` 由来の余白過多になっていない）」

**根拠**: 2026-04-19 のユーザー直接指摘（改行過多）、PR #67（production-ai-app 改行修正）、PR #71（ai_agent 改行修正）、PR #70（note-article-reviewer 観点 #10 追加）

---

### 2026-04-20 — 並列セッションによるブランチ干渉と復旧手順 [Gotcha] [Workflow]

**観察**: Claude Code と Codex CLI、または Claude Code 複数セッションを同一ワーキングツリーで同時実行すると、自作業の外でブランチが切り替わる事例が複数回発生。2026-04-18 のセッションで `docs/learnings-note-import-constraints` に commit が紛れ込み、2026-04-19 のセッションでは `chore/apply-review-zenn-candidates-d-f-e-c` に自動切替されて stash 退避が必要になった。2026-04-17 の `[Gotcha]` エントリ（IDE/hook 由来）と原因は別で、こちらは**並列セッションの進行に起因する**。

**観測された干渉パターン**:
1. 期待ブランチ（例: main）で作業中に `git commit` が別ブランチに載る
2. `git switch -c` で作った新規ブランチが他セッションによって消滅・改名される
3. ローカルに意図しない merge commit が作られ fast-forward pull が失敗する

**対策/学び**:
- **branch-impacting 操作の前に毎回 `git branch --show-current` を確認**（`git add` / `git commit` / `git push` / `git reset` / `git switch` / `gh pr create` 直前）
- commit 前に `git status --short` も併用。意図しないファイルが stage されていないか確認
- ブランチが期待と異なる場合の復旧手順:
  ```bash
  # 1. 現在のブランチに一時退避
  git stash push -u -m "parallel-session-rescue-$(date +%s)"
  # 2. main へ復帰して最新を取得
  git switch main && git pull origin main --ff-only
  # 3. 必要ならブランチ再作成し、reflog から誤配置 commit を cherry-pick
  git reflog | head -10
  git cherry-pick <sha>
  ```
- 誤配置 commit は **force-push で消す前に** cherry-pick で救出（破壊的操作は最後）
- 2026-04-17 の同系統エントリと合わせて「commit 前ブランチ確認」が二重に重要。IDE/hook だけでなく並列セッションも原因になる

**根拠**: 2026-04-19 セッション（本 PR の振り返り）、cbfc4ac misplaced commit、stash `parallel-session-work-stash-1776610597`、PR #73 → #74 → #80 の復旧フロー

---

### 2026-04-20 — 作業開始前の重複 PR 確認で二重作業を避ける [Workflow]

**観察**: 4 本の Zenn 記事（D / F / E / C）に対するレビュー反映作業を進めようとしたら、別セッションが同じ作業を並列で実施しており PR #81〜#84 が既に作成・マージ済みだった。review agent を走らせた後に反映作業に入る段階で気づいて途中破棄。PR #85（並列セッション耐性強化）が扱うのはブランチ干渉で、こちらは **成果物レベルの重複作業** が主題で相補的。

**観測された失敗手順**:
1. `reviews/zenn/` 配下の成果物が存在しない前提で 4 本の review agent を並列起動
2. 完了通知を受けてから反映作業を開始しようとしたタイミングで、同名ファイルが既存 PR に含まれていることが判明
3. ブランチ `chore/apply-review-zenn-candidates-d-f-e-c` は空のまま破棄

**対策/学び**:
- **作業開始前に以下 3 コマンドを習慣化**:
  ```bash
  # (A) open PR を確認（進行中の重複作業がないか）
  gh pr list --state open --json number,title,headRefName

  # (B) 直近マージを確認（既に完了している作業がないか）
  gh pr list --state merged --limit 10 --json number,title,mergedAt

  # (C) 対象ファイルの変更履歴を確認
  git log --all --oneline -- <target-files>
  ```
- 特に「review 成果物を生成する系」タスクは、他セッションと衝突しやすい（同じ記事に対して 2 人が別々にレビューを回すシナリオ）
- agent が「ファイルが既に存在する」と報告した場合は、`git log --all -- <file>` で実在を確認する。ローカルに無くても別ブランチに存在することがある
- 重複が判明した段階で作業を止めるのが正解。既存 PR にマージされる前提で自分のブランチは破棄
- PR #85 が扱う「ブランチ干渉」とは別軸。こちらは「同じテーマで別々に作業が走る」重複で、`gh pr list` チェックが主な防御策

**根拠**: 2026-04-20 セッション、PR #81〜#84 との衝突、`chore/apply-review-zenn-candidates-d-f-e-c` ブランチ破棄、PR #85 エントリとの相補関係

---

### 2026-04-20 — `gh pr create` 失敗時は `--head` で指名すると復旧が早い [Gotcha] [Workflow]

**観察**: PR #85 でブランチ確認ガードを導入した直後のセッションで、10 本公開 PR（#87）を作成しようとした際、push 直後に並列セッションが別ブランチ（`docs/learnings-duplicate-pr-check`）へ自動切替。`gh pr create` が `aborted: you must first push the current branch to a remote, or use the --head flag` で失敗した。

**気づき**: エラーメッセージ末尾の `or use the --head flag` が復旧の鍵。`git switch` で目的ブランチに戻って再試行するよりも、**`gh pr create --head <intended-branch>` で指名する** ほうが副作用が少ない。切替は並列セッションとの新たな競合を生む可能性がある。

**対策/学び**:
- `gh pr create` 実行直前に以下 3 行でプリチェック:
  ```bash
  git branch --show-current
  git rev-parse HEAD
  git rev-parse "@{u}" 2>/dev/null || echo "NO_UPSTREAM"
  ```
- 失敗時の対処マトリクス:
  - ブランチ名ズレ: `gh pr create --head <intended-branch>`（切替不要）
  - upstream 未 track: `git push -u origin <branch>`
  - push 未完了: `git log origin/<branch> --oneline -1` で remote head を確認
- `--head` フラグは PR #87 復旧で実戦投入済み（成功）

**根拠**: 2026-04-20 セッション PR #87、PR #85 のガードは commit/push には効いたが `gh pr create` 直前には未適用だった

---

### 2026-04-20 — 一括公開 PR の粒度判断は PR 本文に理由を明記する [Convention] [Workflow]

**観察**: 10 本の Zenn drafts を 1 PR にまとめて公開した（PR #87）。粒度判断の背景（レビュアー負荷 / 公開タイミング揃え / ロールバック単純さ）は振り返りでは語れるが PR 本文には残っていなかった。将来の読者・エージェントが「なぜ 10 本束ね？」を追跡できない。

**対策/学び**:
- **N 本以上を 1 PR にまとめる場合、粒度判断の理由を PR 本文 Summary 直下に明記**
- 記載例:
  > **バンドル粒度の理由**: 10 本を 1 PR にまとめた理由は (1) 全記事が同一の品質ゲート通過済み (2) Zenn 公開タイミングを揃えたい (3) ロールバック単位を単純化 — の 3 点。
- 個別改訂が必要になった場合は個別 PR で対応する前提も明記
- AGENTS.md の Git 運用節にも「バンドル PR の理由明記」を追加して恒久ルール化

**根拠**: 2026-04-20 PR #87 の振り返り。粒度判断は結果的に正しかったが、過程が成果物に残っていない問題

---

### 2026-04-20 — Stale PR は `git diff main..branch` で事前にリグレッション検出する [Gotcha] [Workflow]

**観察**: PR #93（`docs/review-note-drafts`）は `mergeStateStatus: CLEAN` / CI all green の状態で open だったが、merge-base が古く main に先行マージされた PR #90（three-persona 未完メモ章 9 行削除）を **undo** してしまうリグレッションを内包していた。GitHub 上の UI や `gh pr view` では検知できず、`git diff main..origin/<branch> --stat`（tree-to-tree diff）で初めて気づいた。

**気づき**: `mergeStateStatus: CLEAN` は「コンフリクトなくマージ可能」という意味であって「main の最新コミットを undo しない」保証ではない。特に squash merge ワークフローでは、ブランチ側にまだ squash 前の個別コミットが残っており「既に main にある」ことを git が認識しない。

**対策/学び**:
- `gh pr merge` 実行前に以下のプリチェックを必須化:
  ```bash
  gh pr view <n> --json state,mergeStateStatus --jq .  # state=OPEN 再確認
  git fetch origin main <branch>
  git diff origin/main..origin/<branch> --stat        # tree-to-tree diff（commit 単位ではなく最終状態）
  ```
- 差分が PR 本文の想定範囲を超える / 削除行が予想外に多い場合は、ブランチに `git merge origin/main --no-ff` してから main 側を採用したファイルを取り直す
- 今回は `git merge origin/main` → three-persona 1 ファイルが自動でマージ解決 → diff が純粋 +309 行（6 新規ファイル）に整理できた

**根拠**: 2026-04-20 PR #93 マージ直前に検出。merge-base `c69cde9`（#88 時点）のため、ブランチは #89/#90/#91/#92 すべての逆変換を含んでいた。tree-to-tree diff で検知、catch-up merge (`92e4818`) で解消

---

### 2026-04-20 — Zenn 記事から note 記事への参照は「本文 NG / 末尾参考リンク OK」 [Convention]

**観察**: Zenn の本文中で note 投稿を「姉妹記事」「本編」「設計思想ベース」として紹介する表現は、Zenn 単体の記事として読むと他メディアへの誘導が強く不自然だった。PR #92 で 7 箇所を削除後、ユーザー補足で「単純な参考リンクは OK」と判明し 4 箇所を revert (`50fa0f3`) する 2 段階修正が発生した。

**気づき**: 「note に言及する/しない」ではなく、**本文中の主張の根拠/導入として持ち出すか（NG）** と **末尾の参考/関連リンク集に列挙するか（OK）** が判定軸。後者は読者にとって追加情報源の提示に留まる。

**対策/学び**:
- Zenn / Qiita 記事で `note.com/mine_unilabo` へのリンクを置く場合は:
  - ✅ OK: `## 参考` / `## 関連記事` / 末尾リンク集 など、記事末尾のセクション配下
  - ❌ NG: 本文中の「姉妹記事」「本編」「設計思想ベース」等の言及、`:::message` や導入段落内のリンク
- 方針は AGENTS.md の「表現規約」に恒久化
- 検出は `scripts/check-note-reference.js` + `npm run check:note-ref` で lint 化（見出し `## 参考` / `## 関連` / `## リンク` / `## References` 以下は許容、それ以外で `note.com/mine_unilabo` へのリンクが出たら警告）

**根拠**: 2026-04-20 PR #92（7 箇所削除）+ revert commit `50fa0f3`（4 箇所復活）の 2 段階修正

---

### 2026-04-20 — `gh pr merge` 前に open 状態を再確認して二重マージ試行を防ぐ [Workflow]

**観察**: Phase 1 で open PR #94/#95/#96 を並列マージしようとしたところ、3 本とも `Pull request was already merged` で失敗。並列セッションが先にマージを完了していた。副作用（無駄 push 等）はなかったが、診断ログに "already merged" が複数行出てノイズになり、一瞬「何が起きた？」と戸惑った。

**気づき**: 並列セッション環境では、PR リストを取得してからマージ実行までの数秒〜数十秒の間に他セッションがマージを完了させている可能性が常にある。`gh pr merge` 自体は冪等（二重マージしない）だが、事前確認があればログの意図が明確になる。

**対策/学び**:
- `gh pr merge <n>` の直前に `gh pr view <n> --json state --jq .state` で `OPEN` を確認
- 並列起動する場合も各コマンドの先頭で state 再確認してから merge
- CLAUDE.md「並列セッション耐性」節に明文化

**根拠**: 2026-04-20 Phase 1 実行ログ、PR #94/#95/#96 の `! Pull request was already merged` 出力

---

### 2026-04-20 — 並列セッションによるブランチ切替頻度の観測データ [Metrics] [Workflow]

**観察**: Round 3 振り返り PR (#103) マージ後の単一セッション内で、**意図外のブランチ切替が計 3 回** 発生した。いずれも stash→switch→pop で復旧可能だったが、頻度として記録しておく。

| # | 発生タイミング | 当時のブランチ→切替先 | 復旧 |
|---|---|---|---|
| 1 | Round 3 PR 作成中 (`git commit` 直前) | `chore/process-improvements-round3` → `chore/apply-review-engineering-process-improvement-skill` | stash → switch → pop |
| 2 | Round 3 PR push 直前 | 意図せず main に直接コミット (`cee373a`) | `git reset --hard origin/main` + 目的ブランチへ `git reset --hard <sha>` |
| 3 | PR #110（note draft 反映）commit 直前 | `chore/apply-review-note-n9988537bc326` → `chore/review-applier-zenn-markdown-guidance` | stash → switch → pop |

**気づき**: 並列セッション数とブランチ切替頻度は比例する可能性が高い。本セッションは同時 3-4 セッション体制だったと推定される（開始時の b0089ff / f2b3feb / PR #107 など複数の未 push commit や open PR が観測された）。

**対策/学び**:
- 現状の復旧手順（Round 2/3 で明文化済み）は **3/3 成功** — recoverable な問題として安定化している
- 頻度データは次 Round 4 meta-retrospective の材料（3 セッション分以上蓄積後に「構造的対策が必要か」を判断）
- 実装フェーズでは **branch-impacting 操作の直前** に `git branch --show-current` を機械的に打つ習慣をさらに強化

**根拠**: 2026-04-20 Round 3 振り返り + PR #110 作業セッション。3 回の切替すべてを recover 成功

---

### 2026-04-26 — note.com エクスポートZIP取り込み後にローカル修正が上書きされる [Incident] [Convention]

**観察**: note.com 公式エクスポートZIPを `wxr_to_md.py` で取り込むと、ローカルで review-applier が適用済みの `articles_note/drafts/` 記事が note.com 上の古い状態で上書きされる。
具体的には `ncced36189e87.md`（リンク修復・誤字修正済み）と `n5a41a48f6d46.md`（URL→コードスパン修正済み）が巻き戻された。
エクスポートZIPは「現在のnote.com上の状態」を返すため、**note.com側がまだ更新されていない記事はローカルの修正が失われる**。

**対策/学び**:
1. エクスポートZIP取り込み直後に `git diff articles_note/` で差分を確認する
2. ローカルで修正済みだがnote.com未反映の記事があれば、`git checkout -- articles_note/drafts/<slug>.md` で復元
3. 根本対策: review-applier がPRをマージした後、対象記事をnote.com上でも速やかに更新してから次回エクスポートを取る
4. エクスポートZIP取り込み = ローカルの git 状態を note.com 状態で強制同期、という認識で運用する

**根拠**: 2026-04-26 セッション。PR #127/#128 でマージ済みの修正が、同日のエクスポートZIP取り込み（commit 896c3ad）で巻き戻された。`git checkout --` で復元に成功。

---

### 2026-04-26 — マージ競合PRのリベースパターン [Git] [Pattern]

**観察**: main ブランチに変更がマージされた後、既存PRのブランチが競合してマージ不能になるケースがある（PR #148: mermaid ブロック vs PNG 画像参照が同一箇所に挿入）。元ブランチに直接 `git rebase` すると force-push で他のセッションに影響するリスクがある。

**対策/学び**:
1. `git checkout -b fix/pr<N>-rebase origin/<conflicting-branch>` で修正専用ブランチを作成
2. `git rebase origin/main` → 競合を Edit ツールで解消 → `git add` → `git rebase --continue`
3. `git push --force-with-lease origin fix/pr<N>-rebase` でプッシュ
4. `gh pr create --head fix/pr<N>-rebase --base main ...` で新PR作成
5. `gh pr merge <new-pr> --squash --auto` でCI通過後の自動マージを予約
6. 元のPR（`#N`）を `gh pr close` でクローズ（コメントに新PR番号を記載）

元ブランチを直接 force-push するより、「修正専用ブランチ → 新PR」パターンのほうが副作用が少ない。

**根拠**: 2026-04-26 セッション。PR #148 (`insert-ai-agent-images-v2`) が main の mermaid 追加と競合。`fix/pr148-rebase` ブランチで解決し PR #149 でマージ成功。

---

### 2026-04-27 — note WXR の画像を GitHub Raw URL で自動取り込みする [Convention] [Tooling]

**観察**: `md_to_wxr.py` に `--base-url https://raw.githubusercontent.com/s977043/my-blog/main/articles_note/assets` を渡すと、記事内の `../assets/<file>` 参照が HTTPS 絶対 URL に書き換えられ、note importer が画像を自動取り込みできるようになった。ただし以下の制約が判明した:

1. `--base-url` が変換するのは `../assets/` および `assets/` プレフィックスのみ。`images/` など別パスは変換されない
2. note は **JPEG/PNG/GIF のみ自動取り込み対応。SVG は非対応**
3. GitHub Raw URL が HTTP 200 を返すには、対象ファイルが main にマージ済みである必要がある（WXR アップロード前に先に PR をマージすること）

**対策/学び**:
- 記事内の画像パスは `../assets/<file>` に統一する。`images/` などのパスは `--base-url` で変換されないため、WXR 生成前に修正する
- SVG 画像は事前に PNG 変換が必要。**macOS では `cairosvg` は日本語フォントを描画できず□□□になる**（.ttc フォントの解決失敗）。代わりに Chrome headless を使う（次エントリ参照）
- WXR アップロード前に画像の GitHub Raw URL が HTTP 200 を返すかを `curl -s -o /dev/null -w "%{http_code}"` で確認する
- 変換した PNG と修正した記事パスを先に PR マージ → WXR アップロード の順序を守る

**根拠**: 2026-04-27 セッション。PR #154（SVG→PNG 変換・パス修正・WXR 再生成）

---

### 2026-04-27 — note WXR の画像は `<figure>` タグ必須、`<p><img>` では省略される [Incident] [Convention]

**観察**: `--base-url` で GitHub Raw URL に変換した WXR をインポートすると、本文は取り込まれるが**画像だけ省略**される問題が発生。原因を調査したところ、python-markdown が生成する `<p><img alt="" src="..." /></p>` をnoteのインポーターが無視していた。note公式エクスポートXMLの画像は**全件**以下の形式でラップされている:

```html
<figure name="uuid"><img src="..."><figcaption></figcaption></figure>
```

note公式ヘルプには「`https://` URLの JPEG/PNG/GIF なら `<img>` で取り込み可能」と記載があるが、インポーターの実装はエクスポート形式（`<figure>`）のみを認識している模様。

**追加調査結果**（3エージェント並列調査 2026-04-27）:
- GitHub Raw URL（`raw.githubusercontent.com`）は HTTP 200・Content-Type: image/png を返す ✅
- CSP/CORS ヘッダーはブラウザ側制約であり、noteのサーバーサイドインポーターには影響しない
- `<figure>` 形式への変換で問題解決の見込み（PR #157）

**対策/学び**:
- `md_to_wxr.py` に `wrap_images_in_figure()` を追加。markdown変換後のHTMLで `<p><img /></p>` を `<figure name="uuid"><img src="..."><figcaption></figcaption></figure>` に後処理変換する
- 正規表現は `alt` 属性をオプション扱いにすること（`(?:alt="[^"]*"\s+)?`）。python-markdownは常に `alt=""` を出力するが、raw HTML混入ケースも考慮
- WXR構造を変更したら、必ず note公式エクスポートXML と `<item>` の要素を照合して確認する

**根拠**: 2026-04-27 セッション。PR #157（`wrap_images_in_figure` 追加・alt オプション化）。3エージェント並列調査（format-analyst/url-verifier/fix-reviewer）

---

### 2026-04-27 — macOS で SVG に日本語テキストが含まれる場合 Chrome headless を使う [Tooling]

**観察**: `cairosvg` が SVG→PNG 変換時に日本語を□□□（豆腐文字）として出力した。原因は macOS の .ttc フォントファイル（Hiragino/Noto Sans JP）を cairosvg が解決できないため。Playwright も `file://` プロトコルをブロックした。

**対策/学び**:
- 日本語テキストを含む SVG は **Chrome headless で PNG 変換**する（macOS ネイティブフォントを使うため正常描画）:
  ```bash
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --headless=new \
    --screenshot="articles_note/assets/output.png" \
    --window-size=1200,630 \
    --hide-scrollbars \
    "file:///$(pwd)/articles_note/new/images/input.svg" 2>/dev/null
  ```
- `cairosvg` は英数字のみの SVG には使えるが日本語文字には使わない
- 変換後の PNG が記事から `../assets/` 参照されること・GitHub Raw URL で取得できることを確認してから WXR 生成する

**根拠**: 2026-04-27 セッション。PR #158（Chrome headless 変換・日本語文字化け修正）

---

<!--
## 追加時のテンプレート

### YYYY-MM-DD — <短い見出し> [カテゴリ]

**観察**:

**対策/学び**:

**根拠**:
-->
