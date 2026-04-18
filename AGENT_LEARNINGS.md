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

<!--
## 追加時のテンプレート

### YYYY-MM-DD — <短い見出し> [カテゴリ]

**観察**:

**対策/学び**:

**根拠**:
-->
