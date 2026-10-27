# AGENT_LEARNINGS.md

AIエージェント（Claude Code / Codex / その他）がこのリポジトリで作業する際に役立つ、**経験則・gotcha・成功パターン**を蓄積する記録。

## このファイルの位置づけ

- **正**: `README.md` / `CLAUDE.md` / 各ディレクトリの `README.md`（これらの規約を守ること）
- **経験則**: 本ファイル `AGENT_LEARNINGS.md`（過去の失敗・学びを次回に活かす）。古いエントリ本文は `docs/agent-learnings/archive/`
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
5. **追記先とアーカイブ**: 追記は本体（このファイル）の末尾。`docs/agent-learnings/archive/` は過去分の読み取り専用で、追記も本文の書き換えもしない。移設は日付で切り（2026-07-31 以前 → `archive/2026.md`）、本文は変えず、索引（§📇）は本体に全件残す。日付参照は本体とアーカイブの両方を検索して辿る:

   ```bash
   grep -rn "### 2026-06-03" AGENT_LEARNINGS.md docs/agent-learnings/archive/
   ```

### エントリ形式（テンプレート）

```markdown
### YYYY-MM-DD — <短い見出し> [カテゴリ]

**観察**: 何が起きたか。事実ベース。

**対策/学び**: どう対応したか、または今後どうするか。

**根拠**: 参照PR/Issue/コミット（あれば）
```

カテゴリ: `Platform` / `Workflow` / `Gotcha` / `Performance` / `Convention` / `Tooling`

---

## 📇 テーマ別インデックス

> **このファイルは「履歴と根拠（PR番号付き）」**。rate-limit の数値・公開手順などの**確定ルールの正本は AGENTS.md / docs**（各テーマの「現行正本」を参照）。本インデックスと本文が最新ルールと食い違う場合は正本を優先する。
> 各エントリは日付見出し `### YYYY-MM-DD —` で本文を検索（grep / Ctrl-F）できる。同じエントリが複数テーマに再掲されることがある。
> **2026-07-31 以前の日付のエントリ本文は `docs/agent-learnings/archive/2026.md` に移した**（本文は無変更・日付だけで分けた。索引はここに全件残す）。日付で本体に見つからなければアーカイブを同じ日付で grep する。

### A. Zenn 公開フロー / rate-limit / release-zenn
**現行正本**: `docs/publish-operating-policy.md` §Rate-limit 遵守（数値）/ `AGENTS.md` §Zenn 公開フロー（運用）
- 2026-05-22 — Zenn rate-limit は実効 24h/2本でも hit する（「24h/5本」は楽観値）
- 2026-05-22 — 公式 rate-limit と内部基準は別物。著者明示指示なら内部基準は超過可
- 2026-05-22 — release/zenn sync は単一ファイル限定で取り出す（全体マージ回避）
- 2026-05-07 — Zenn rate-limit はアカウント単位、ブランチ切替・手動デプロイ・追加 commit でも解放されない
- 2026-05-07 — Zenn ダッシュボード設定切替後は既存ブランチを派生元の状態と整合させる
- 2026-05-26 — release/zenn sync PR の競合は articles_note/drafts/ で頻発、main 側採用が標準
- 2026-04-20 — 一括公開 PR の粒度判断は PR 本文に理由を明記する
- 2026-06-07 — Zenn 二重公開ガードは CI 未 wire だと無意味（STRICT=1 を release/zenn 宛 PR に繋ぐ。詳細は G 節）
- 2026-07-20 — Zenn デプロイの中断/バナーは表示を信じず HTTP 200・API で実反映を確認。トークン発行失敗の連続は連携再接続が必要

- 2026-08-20 — `sync-release-zenn.sh` の公開影響プレビューは新規ファイル追加を検知しない。deploy 実差分を直接照合する
- 2026-08-20 — Zenn `/api/articles` は約23件しか返さない。全件突合は `zenn.dev/<user>` の `articlesCount`
- 2026-08-27 — Zenn は SVG を配信できない（Cloudinary `/image/fetch/` が 400）。図版は PNG 1600x900 で置く
### B. Qiita publish / drift / 重複公開
**現行正本**: `docs/pr-operations.md` §公開前ガード（`check:qiita-remote-cache` / `publish:qiita` wrapper）
- 2026-06-03 — `qiita publish` は冒頭で全記事 pull。`.remote/` 手編集でローカル改変が巻き戻る
- 2026-05-18 — Qiita 公開は `npm run publish:qiita`（documented script）で叩く
- 2026-05-18 — Qiita slug↔id 乖離は重複公開を生む／dedup はリモート削除まで `qiita pull` 禁止
- 2026-05-19 — Qiita frontmatter title 内 `: ` 未クオートだと publish 全滅
- 2026-05-27 — publish-queue.md は実態と乖離しやすい、公開実行直前に id / web 状態を確認
- 2026-05-18 — 不可逆ブロッカーは申し送り前に外部状態を実在確認する
- 2026-07-19 — 連続 publish:qiita はガード誤 FAIL。working≠.remote を cmp 確認して SKIP_REMOTE_CACHE_CHECK=1 で続行

### C. note WXR / 画像 / インポート
**現行正本**: `articles_note/README.md`（state/構成）/ `.claude/skills/note-export-import/SKILL.md`（手順）
- 2026-04-26 — エクスポートZIP取り込み後にローカル修正が上書きされる（→ `wxr_to_md.py` の git-dirty ガードで防止）
- 2026-04-18 — WXR の著者フィールドと CDATA エスケープ規則 / 必須フィールド
- 2026-04-19 — note インポートの運用制約と 2 スペース改行の罠
- 2026-04-27 — note WXR の画像は GitHub Raw URL / `<figure>` タグ必須（`<p><img>` は省略される）
- 2026-04-30 — `md_to_wxr.py` は `--base-url` 未指定なら exit 1 / 画像サイズ検証 / URLテキスト化 v2 / HTMLパターン整合
- 2026-05-15 — note 用 SVG は Chrome headless + font-family 注入 / WXR round-trip はテーブル平坦化
- 2026-05-04 — note公式由来の小容量PNGは false positive として許容
- 2026-05-16 — note `new/` と `drafts/` の重複は用途で正を分ける
- 2026-09-23 — note WXR はCI構造preflightと公式export完全比較を二段階に分ける。検査側の誤判定も疑う
- 2026-09-14 — エクスポート取り込みで出る画像の `M` はメタデータ数バイトの churn。検体1点を測ってから一括 revert（新規は `??` で出る）

### D. 並列セッション / ブランチ干渉 / commit
**現行正本**: `docs/pr-operations.md` §並列セッション耐性 / `scripts/hooks/pre-commit`
- 2026-09-03 — 長時間ワークフローは実行中にベースごと入れ替わる
- 2026-09-05 — Workflow のエージェントは相対パスをメインセッションの cwd 基準で解決する。cwd 移動で成果物が2箇所に分裂する
- 2026-04-20 — 並列セッション干渉で commit が意図せず main に着地する
- 2026-04-20 — 並列セッションによるブランチ干渉と復旧手順 / 切替頻度の観測データ
- 2026-04-20 — 並列エージェント起動前に書き込み許可を事前確認する
- 2026-04-17 — commit 直前にカレントブランチを確認
- 2026-05-17 — `git mv` と Edit を同一コミットにすると未staging編集を取りこぼす
- 2026-05-16 — `M AGENTS.md` は claude-mem 自動注入ブロックで WIP ではない
- 2026-06-10 — 並列セッションが squash 済み記事を別 base で再マージし磨き込みを巻き戻す（`git diff main...branch` 3点比較で実害確認）
- 2026-07-19 — check:pr-staleness 誤検知が1日4件。原因は lookback 和集合の過剰計上と macOS collation。#464 で resurrection 判定＋LC_ALL=C 修正
- 2026-08-27 — ゲートは実行直前に最新の状態で測る（古い checkout の readiness は OK に化ける）

- 2026-09-07 — PR 番号の飛びは並行セッションの作業衝突のサイン。`check:pr-conflict` で同一ファイルを触る open PR を検知する
- 2026-09-24 — squash マージ済みブランチは `--is-ancestor` でも3点 diff でも未マージに見える。PR の状態で判定する（`npm run clean:merged-branches`）
### E. GitHub account / gh CLI / PR 運用
**現行正本**: `CLAUDE.md` §作業開始時のチェックリスト / `scripts/hooks/pre-push`
- 2026-05-21 — gh active account の自動切替を毎回 pre-push で検知する
- 2026-04-30 — `gh auth setup-git` は active account を上書きする副作用がある
- 2026-04-20 — 作業開始前の重複 PR 確認で二重作業を避ける
- 2026-04-20 — `gh pr create` 失敗時は `--head` で指名すると復旧が早い
- 2026-04-20 — `gh pr merge` 前に open 状態を再確認して二重マージ試行を防ぐ
- 2026-04-20 — Stale PR は `git diff main..branch` で事前にリグレッション検出する
- 2026-06-11 — `gh auth setup-git` 後に account が kominem-unilabo へ反転、push/PR/merge が 403。各操作直前に switch + 確認
- 2026-06-11 — このリポジトリは merge commit 不可・squash only。`gh pr merge` は常に `--squash` を使う
- 2026-08-10 — Dependabot alerts API の 403 はスコープ不足とは限らない。まず `gh auth refresh`
- 2026-08-12 — squash 自動削除設定下では `push origin --delete` が空振り。掃除は `git fetch --prune`
- 2026-08-27 — Dependabot alerts API の 403 はスコープが揃っていても発生。まず `gh auth refresh`
- 2026-09-24 — my-blog の gh hook が操作先を見ずに s977043 へ戻していた。#689 で操作先 owner を判定するよう修正
- 2026-10-05 — クラウドの routine の GitHub 連携はローカルの gh アカウントとは別設定。連携が kominem-unilabo だと結果の PR 化が 403 で失われる

### F. review / 記事品質 / convention
**現行正本**: `.claude/agents/*` / `AGENTS.md` §表現規約
- 2026-09-03 — レビューワークフローに媒体固有の表記規約を渡さないと違反が混入する
- 2026-09-03 — レビューループは数値の「単位」を保存しない
- 2026-09-03 — 自作OSS記事では「過剰な自己批判」も一次情報と矛盾する
- 2026-04-16 — reviews/ はプラットフォームで3分割する
- 2026-04-16 — 新規 Agent 作成直後は harness 未リロード
- 2026-04-16 — note記事は JTF スタイル準拠が必須 / published/ 反映は ⚠️ バナー必須
- 2026-04-16 — 記事レビューは並列エージェント実行で10倍速 / ディレクトリ構成はスキル作成前に実態確認
- 2026-04-20 — Zenn 記法活用観点を reviewer / applier の両側に恒久化する
- 2026-04-20 — Zenn 記事から note 記事への参照は「本文 NG / 末尾参考リンク OK」
- 2026-04-17 — jtf-style はコードブロック内の日本語コメントも対象 / 固有名詞は `.cspell.json` 集約 / lint 警告は全部直す
- 2026-05-26 — 既存ガイド系記事への FAQ セクション横展開は SEO/可読性に効く
- 2026-06-07 — 記事公開 PR に中間レビュー成果物(reviews/)を同梱しない（改善で陳腐化する）

- 2026-08-20 — Skill の `allowed-tools` は事前承認であって排他的な権限制限ではない（排他制限は Custom Subagent の `tools`）
- 2026-08-27 — レビュー成果物は `articleHash` を `git hash-object` と突き合わせてから信じる
- 2026-09-02 — 内部リンクと外部リンクでベストプラクティスは逆。「文脈内配置が良い」は同一ドメイン内の話
- 2026-09-02 — 委託ワーカーは消去法の残りを断定に変える。一次情報が特定していない主張は確度を明示させる
- 2026-09-04 — Codex CLI は長文プロンプトで exit 0 のまま無言終了する。疎通は成功していても落ちる
- 2026-09-06 — WARN-only の新 lint を集約 check に直結すると既存資産に大量 WARN が出て signal/noise を壊す。対象限定で入口を分ける
- 2026-09-07 — 自分が書いた引用の帰属は、外部一次情報と同じ厳しさで検証する（読んだ直後でも要約段階で誤帰属する）
- 2026-09-17 — 規律を定めたドキュメントは、その規律を自分自身に適用して検算する（出典と未検証の明示が落ちやすい）
- 2026-10-05 — 模擬ペルソナの「実例が欲しい」は実データで反証された。模擬の指摘は確かさ A/B/C で扱い、C は実データで確かめてから手を打つ
- 2026-10-11 — 公開判断を変えるサブエージェントの事実主張は伝える前に一次情報と carry-over へ突合。レビュー観点に「案内・見出し・中身の対応」と固有用語の説明
### G. CI / tooling / マルチAI
- 2026-08-27 — `catch` が ReferenceError を握りつぶすと実装の誤りが「検証したが不一致」に化ける（純関数テストは依存欠落を検出しない）
- 2026-05-21 — 媒体実測の取得は `scripts/fetch-channel-metrics.mjs` に集約
- 2026-05-15 — CI run が runner を掴めず長時間 queued なら空コミットで re-trigger
- 2026-05-18 — 同一結論へ収束したマルチAI相談は2回目以降スキップ
- 2026-06-04 — Codex は「実装委譲」ではなく「設計判断の壁打ち」として使うと費用対効果が高い
- 2026-06-07 — Zenn 二重公開ガードは script があっても CI 未 wire だと無意味（STRICT=1 を release/zenn 宛 PR に繋ぐ）
- 2026-06-07 — 外部レビュー CLI(Gemini/Codex)はレート制限前提、L1: 独立Claude → L2: bot → L3: CLI で多重化する
- 2026-06-08 — zenn-pace ゲートは date モードだと「溜めて sync」で見逃す。release/zenn 差分(diff モード)で計測する
- 2026-06-10 — Workflow ツールの dynamic workflow に `args` が注入されないことがある。scriptPath コピーに slug 直書きで回避
- 2026-06-18 — Obsidian エクスポートは vault 構成変更に追従必須／my-blog→vault の cross-repo push は安全機構でブロック／Codex CLI は ChatGPT アカウント無権限だと全モデル拒否
- 2026-07-03 — check スクリプト新設時は fixture ベースの self-test を同梱する（初版バグが30日で2件: #391→#393 / #417）
- 2026-07-03 — PostToolUse formatter hook が Edit 時に無関係な再整形 churn を diff へ混入させる。revert して Bash/Python 経由で最小差分適用
- 2026-07-03 — Workflow スクリプトでは引数なし `new Date()` / `Date.now()` / `Math.random()` が throw する。プレースホルダ＋実行時置換で回避
- 2026-07-19 — Workflow の args 未注入バグが1セッションで3回再発。回避は確立済みだが恒久修正の検討価値あり
- 2026-07-19 — codex-rescue にBG切り離しさせると worktree 掃除でタスク孤児化・成果物消失。general-purpose+worktree 同期実行にする
- 2026-07-23 — Bash ツールが ~/Documents 配下へ EPERM（macOS TCC）。ローカル git 不能時は gh -R / curl で外形確認、復旧は権限再付与かセッション再起動
- 2026-08-20 — 同系統モデルだけのレビューでは仕様誤認を検出できない。検証手段（再実行・公式ドキュメント突合）で分ける
- 2026-08-20 — Gemini CLI の個人無料枠が停止（IneligibleTierError）。L3 で Gemini を当てにしない
- 2026-09-05 — 消費側を書く前に生成側の一次ソースを読む／`npm run <script> --dry-run` は `--` 忘れで実行される／書いた手順は1回実行して確かめる
- 2026-09-06 — Workflow phase が custom Agent 定義を Read してもその `tools` 権限は継承しない／Workflow スクリプトの構文崩れは `node --check` では検出できない

- 2026-09-07 — 検査系は「問題なし」と「検査できなかった」を別の値にする（Visual Gate の passed=true 丸め）
- 2026-10-05 — 期限付きの約束は `docs/due-items.json` に記録し、その時刻に起こす手段も同時に用意する（`npm run check:due`）
- 2026-10-15 — my-blog は PUBLIC。記事以外のファイル（チェックリスト・スキル・docs）にも社内の固有名を書かない
---

## 🧭 学びエントリ

### 2026-10-15 — my-blog は PUBLIC リポジトリ。記事以外のファイルにも社内の固有名を書かない [Convention][Gotcha]

**観察**: 会社公式（PRONI）記事の提出前チェックリストとスキルを作った際、広報担当者の実名と社内の Slack チャンネル名・ページ名を書いた。自分の見直しでは気づかず、複数エージェントレビューで must 指摘された。既存の規約は記事の題材の扱いだけで、チェックリスト・スキル・docs など記事以外のファイルは対象外になっていた。

**対策/学び**:

- 会社公式記事まわりのチェックリスト・スキル・docs・レビュー成果物を書くときは、社員の実名・Slack チャンネル名・社内ページ名を役割名（「広報担当」など）に置き換える
- コミット前に `git diff --cached` を社員名とチャンネル接頭辞（`#`）で目視確認する
- squash マージでも PR のコミット履歴には残るので、push 前に確認する

**根拠**: #847

### 2026-10-11 — 公開判断を変えるサブエージェントの事実主張は、伝える前に一次情報と引き継ぎメモへ突合する [Workflow][Gotcha]

**観察**: Zenn 記事 `plangate-fresh-context-restart` の公開前レビューを article-reviewer 1 体・1 パスで回した。must/high 0 だったが、medium 1「PlanGate v8.23.0 には standard 以上の規定が無い」をオーガナイザーが裏取りせずにユーザーへ伝え、ユーザーは「次のリリースを待つ」と判断した。タグを直接読むと規定は v8.23.0 に入っており（設計文書 L54・スキル L85）、事実誤認だった。前セッションの carry-over には「v8.23.0 で既に一致＝公開条件は満たした」と書いてあったが照合していなかった。その後ユーザーが Gemini に PDF でレビューさせ、自己レビューが拾わなかった読者向けの指摘を 2 件得た（冒頭の案内が章名を指し目次の節名とずれる / 見出し「（2項目）」が 2 ブロック × 3 行と紛れる）。Gemini の「誤字 3 件」は PDF 化での欠けで原稿には無かった。

**対策/学び**:

- **公開を止める・遅らせる・条件を変える事実主張は、サブエージェント由来でも、ユーザーに伝える前に一次情報（タグ・ファイル・API）で確かめ、carry-over / memory の記述と突合する**。食い違ったら一次情報を採る。must/high の出口条件とは別のゲートとして扱う（Codex の指摘: 事実主張の真偽と可読性の欠陥を同じ重大度の軸で扱っていたのが受理設計の穴）
- 拾えなかった 2 件は描画特有ではなく、テキスト構造の問題（案内文と見出しの対応、見出しの数詞と中身）だった（agy の指摘）。効くのは「別モデル」より「目次から辿る読者の視点」。公開前レビューの観点に「冒頭の案内・見出し・中身の対応」を入れる。描画後の確認（Zenn の下書きプレビュー）は表の折り返しなど表示依存の問題に限って使う
- 別モデルのレビューを毎回必須にするのはコストに見合わない（Codex）。Codex と agy はどちらも、最優先は上の受理ゲートだと答えた。なお両者が独立に挙げた「PlanGate 固有の規模区分が未説明」は #808 で反映した
- 外部 AI が PDF やスクリーンショットから出した誤字指摘は、原稿を grep してから採否を決める
- Gemini CLI（gemini-cli 0.42.0、個人の無料枠）は 2026-10-11 時点で `IneligibleTierError: UNSUPPORTED_CLIENT` により使えない。Gemini 系の独立レビューは `agy`（Antigravity CLI、`agy --mode plan -p "<prompt>"`）を使う

**反映先**: `CLAUDE.md` §サブエージェント報告の受理基準（受理ゲート）、`.claude/agents/article-reviewer.md` §レビュー観点・§事実検証、`.claude/workflows/article-review-improve-loop.js` の reviewPrompt（観点と一次情報の場所の明記）

**根拠**: PR #804（レビュー成果物・medium 1 取り下げ）、PR #808（Gemini 指摘 2 件と Codex・agy 指摘 1 件の反映）、Codex（gpt-5.5）と agy への振り返りレビュー

### 2026-09-23 — note WXR は「構造preflight」と「公式export比較」を二段階に分ける [Workflow][Tooling][Gotcha]

**観察**: `content-closed-loop-note` のCanary公開準備で、リポジトリ自身の `md_to_wxr.py` をGitHub Actions上で実行した。WXR生成自体は成功したが、最初の一回限りpreflightは「タイトルにだけ存在する文字列が本文HTMLにもある」と誤ってassertしFAILした。WXR不具合ではなく**検査側の誤判定**だった。assertを実在する本文マーカーへ直すと、XML parse・必須 `wp:*`・著者・画像参照・Artifact uploadがすべて成功した。

同時に、既存 `verify_wxr.py` は公式note export ZIPが無い環境では実行不能だったため、CIで再利用できないことが分かった。そこで `--structure-only` とfixture self-testを追加し、その後note公式ヘルプの現行インポート条件（UTF-8 / 20MB以下 / 1000記事以下 / `<rss>` / `excerpt, content, wfw, dc, wp` 名前空間）まで早期検証へ取り込んだ。最終self-testは **11/11 PASS**、既存Content checks / Dependency reviewもPASSした。

**対策/学び**:

- **WXR検証を二段階に分ける**。CI・一時環境では `verify_wxr.py --structure-only`、公開前Human Gateでは通常 `verify_wxr.py` で公式exportと比較する。structure-onlyのPASSを「公式形式への完全準拠」とは扱わない
- 構造preflightでは、XML well-formedだけでなく **UTF-8 / 20MB / 1000件 / rss root / 必須namespace prefix+URI / channel,item / minimum wp:* / author / image URL** を見る
- 検査がFAILしたら生成物だけでなく**検査条件そのものも疑う**。特に「タイトルは本文から分離される」など変換器の仕様を無視したassertはfalse negativeを作る
- 新しいcheckはfixtureベースのself-testを同梱しCIへwireする。今回の `verify_wxr.py --self-test` は valid / namespace欠落・URI違い / non UTF-8 / >1000 / >20MB / wp欠落 / creator警告 / local image / non-rss / invalid XML の11ケース
- WXR検証コマンドでは `import-*.xml` のglobを使わず、**対象1ファイルを明示**する。過去世代が複数残るとshell展開で別引数になりうる
- Human Gateを短縮するため、WXR本体・SHA-256・目視チェックリストを1つのPublish Packetとして渡す

**根拠**: Issue #670、PR #672、PR #673。Canary WXR SHA-256 `9135972be3ccce13040264e48786fff59cb0060524b10a57fb02a252db2601c4`。PR #673 CIで `verify_wxr` self-test 11/11 PASS。

### 2026-09-07 — 自分が書いた引用の帰属は、外部一次情報と同じ厳しさで検証する [Workflow][Gotcha]

**観察**: 会社公式記事（`articles_note/new/PRONI-ai-software-engineering-principles-note.md`）に、社内 note の既存記事から一節を引用する段落を追加した。引用元の全文を API で取得して読んだ**直後**の作業だったにもかかわらず、「最大のボトルネックが『何を解くかを定義すること』へと移ってきた」を **CTO と EM の2名の共同発言**として書いた。実際は EM 単独の発言で、CTO は同意したうえで別の表現（「何を作るかを決められること」の価値が上がった）を使っていた。

**なぜ危なかったか**: 同じターンで、外部一次情報（GitHub Spec Kit の `assess` 拡張・Creative Exploration・SDD の what/how 定義）は WebFetch で1件ずつ裏取りし、「ファクトチェック実施済み・問題なし」と報告していた。**外部の主張には厳しく、自分が書いた要約文には検証を当てていなかった**。ユーザーの「マージ可能な品質まで進めて」を受けたセルフレビューで初めて発見した。それがなければ、同僚の発言を誤帰属させたまま会社公式記事としてマージされていた。

**対策/学び**:

- **引用を書いたら、引用元の該当箇所を開き直して話者と文言を照合する**。「さっき読んだ」は検証ではない。要約・圧縮の過程こそ誤りが入る
- 複数人が登場するインタビュー記事からの引用は特に危険。同意・言い換えを「共同発言」に丸めない
- PR 作成を「完了」と報告する前にセルフレビューを1回通す。今回は PR 作成後にレビューして2件（誤帰属・名乗りの同語反復）が出た。**PR 作成の報告は品質保証を含まない**という状態を作らない
- 社内向け・会社公式の記事は、広報ガイドライン §4 が「生成AIの出力をそのまま使わず必ず人間がファクトチェック」を明示的に要求している。引用の帰属もその対象

**根拠**: PR #626（commit `e24e8b4` で修正）

### 2026-08-27 — Zenn は SVG 画像を配信できない。図版は PNG で置く [Platform][Gotcha]

**観察**: Zenn は記事内の画像を Cloudinary 経由で配信するが、**SVG は `/image/fetch/...` で HTTP 400（0 bytes）を返し表示されない**。PNG は `/image/upload/...` で HTTP 200（`image/png`）を返す。Referer / User-Agent を付けても結果は変わらないため、ホットリンク防止ではなく**形式が原因**。影響したのは `loop-maturity-rubric-audit`（3枚）/ `multi-ai-discussion-roadmap-rewrite`（2枚）/ `plangate-v86-hook-enforcement`（2枚）で、**Zenn 記事で SVG を使ったものは 1 つも図が表示されたことがなかった**。

**なぜ検出できなかったか**: `check:internal-links` は参照先ファイルの**実在**しか見ておらず、表示可否を検証しない。「存在すること」と「表示されること」は別。さらに、既存記事が `.svg` を使っていたのでそれを前例として踏襲したが、**その前例自体が壊れていた**（壊れた前例は前例にならない）。

**対策/学び**:
- Zenn の図版は **PNG（1600x900）** で置く。SVG は使わない
- cairosvg でラスタライズする場合、フォントスタック `-apple-system,...,'Yu Gothic',...` は解決できず**日本語が豆腐（□）になる**。`YuGothic` へ差し替えてから変換する
- PNG 化後は live で **HTTP 200** と `static.zenn.studio/user-upload/deployed-images/` からの配信を確認する（ファイルを置いただけで終わりにしない）

**根拠**: 2026-08-27 の実測（SVG: `/image/fetch/` → 400 / 0 bytes、PNG: `/image/upload/` → 200 / image/png）

### 2026-08-27 — レビュー成果物は `articleHash` を突き合わせてから信じる [Workflow][Gotcha]

**観察**: 未追跡のレビュー成果物が `mustHigh=2` を主張していたが、その `articleHash` は**削除済みブランチ系統の版**のものだった。main の記事は既に指摘の一部を織り込み済みで、実際に残っていたブロッカーは **1 件だけ**。古い hash の成果物をそのまま信じると、解決済みの指摘へ対応工数を払うことになる。

**対策/学び**:
- レビュー結果を採用する前に、記録された `articleHash` と `git hash-object <記事>` を突き合わせる。不一致なら「当時の版に対する指摘」として再検証してから採否を決める
- 本文を変更すると readiness 記録は**必ず**陳腐化する。公開直前に本文を触るなら、readiness の再取得か stale の許容判断を**明示的に**行う（実例: X 導線を後から追記して stale WARN になった）

**根拠**: 2026-08-27 の公開準備セッション（未追跡レビュー成果物の hash 不一致を検出）

### 2026-08-27 — ゲートは実行直前に最新の状態で測る [Workflow][Gotcha]

**観察**: 共有ワーキングツリーが **1 コミット古い**状態で `check:publish-readiness` を実行し「OK」と出た。最新 `origin/main` の worktree で測り直すと `stale WARN` だった。ゲートの出力は「いつの状態を測ったか」に完全に依存する。

**対策/学び**: 並列セッションが同一チェックアウトを触る環境では、ゲート実行前に以下のいずれかを行う。

```bash
# A: HEAD が origin/main と一致しているか確認してから測る
git fetch origin main && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || echo "STALE"
# B: 測定専用の worktree を切って測る
git worktree add --detach /tmp/gate-check origin/main
```

**根拠**: 2026-08-27 の公開準備セッション（同一 slug に対し古い checkout で OK / 最新で stale WARN）

### 2026-08-27 — Dependabot alerts API はスコープが揃っていても古いトークンで 403 になる [Tooling][Gotcha]

**観察**: `gh api /repos/.../dependabot/alerts` が 403 を返した。`gh auth status` 上のスコープは要件を満たしており、スコープ不足を疑って権限を洗い直したが原因ではなかった。実際にはトークンが古く、`gh auth refresh` で解消した。

**対策/学び**: Dependabot alerts API の 403 は、**スコープ不足を疑う前に `gh auth refresh` を先に試す**。スコープ表示は「そのトークンに付いている権限」であって「そのトークンが今も有効か」を示さない。

**根拠**: 2026-08-27 の実測。2026-08-10 の同型エントリ（E 節）の再発

### 2026-08-27 — `catch` が ReferenceError を握りつぶすと、実装の誤りが「検証したが不一致」に化ける [Gotcha][Tooling]

**事象**: `scripts/suggest-next-theme.js` の `occursOutsideLearnings()` が常に `false` を返していた。原因は `execFileSync` の import 漏れで、発生した ReferenceError を `catch { return false }` が飲み込んでいたこと。呼び出し側からは「git grep したが見つからなかった」と区別がつかず、S1 の一次情報検証が丸ごと無効化されたまま main にマージされた（PR #523）。

**なぜ検出できなかったか**: self-test は純関数 `isVerifiableEvidence(facts)` に値を注入して検査していたため、`facts` を作る側の依存欠落は素通りした。「テストを追加した」と「欠陥を検出できる」は別。

**対策**:
- `catch` は**想定内の失敗だけ**を扱う。`git grep` なら不一致の `exit 1`（`e.status === 1`）のみを `false` に倒し、それ以外は再 throw する
- 外部コマンドに依存する関数は、純関数テストとは別に **hit / miss の両方を実際に 1 回叩く** テストを持つ
- テスト用の「存在しない文字列」はソースに直書きしない。リテラルがファイル内に出現して自分自身に hit する（実際に踏んだ）。実行時に連結して作る

**関連**: 同 PR で、パス解決が cwd 相対だったためサブディレクトリから実行すると入力を 1 バイトも読めず「候補なし」で exit 0 する沈黙の失敗も同時に修正した。ルートは `__dirname` 起点の `git rev-parse --show-toplevel` で解決する。

### 2026-08-20 — Zenn の `/api/articles` は全件を返さない。件数の突合には `articlesCount` を使う [Gotcha][Tooling]

**観察**: 公開記事の総数を突合しようとして `https://zenn.dev/api/articles?username=minewo&count=100` を叩いたところ、**23 件しか返らず** `next_page` も `total_count` も `null` だった。リポジトリ側の `published: true` は 37 件あり、一見すると 14 件が未反映（rate-limit hit 等）に見える。しかし実際には drift は無く、`https://zenn.dev/minewo` の HTML に埋まる `"articlesCount":37` と一致していた。**`count` パラメータは効かず、このエンドポイントは全件取得に使えない。**

**対策/学び**: 用途で使い分ける。

| 目的 | 使うもの |
|---|---|
| **特定記事**の反映確認（公開直後） | `/api/articles?username=X` に slug が出現するか（最近の記事は含まれる） |
| **全件数**の突合（drift 検知） | `curl -s https://zenn.dev/<user>` から `"articlesCount":N` を抽出 |

```bash
# 公開記事数（Zenn 実サイト）
curl -s "https://zenn.dev/minewo" -A "Mozilla/5.0" | grep -oE '"articlesCount":[0-9]+'
# リポジトリ側（release/zenn を正とする）
n=0; for f in $(git ls-tree -r --name-only origin/release/zenn -- articles/); do
  git show "origin/release/zenn:$f" | grep -qm1 "^published: true" && n=$((n+1)); done; echo $n
```

古い記事は API の 23 件に含まれないため、**API の不在をもって「未公開」と判定してはいけない**。2026-05-22 エントリの「API で記事一覧に出現するかを確認」は、公開直後の新規記事に限って有効。

**根拠**: 2026-08-20 の公開後確認（main 37 / release/zenn 37 / Zenn 実サイト 37 で一致、API のみ 23）

### 2026-08-20 — `sync-release-zenn.sh` の公開影響プレビューは新規ファイル追加を検知しない [Gotcha][Tooling]

**観察**: `ai-review-gate-not-called` の公開時、sync スクリプトの公開影響プレビューが「新規 published: false → true: **0 件**」と表示した。しかし実際には `articles/ai-review-gate-not-called.md` が `published: true` の**新規ファイル**として release/zenn へ入り、1 本が公開された。checker は `false → true` の**切替**を数える実装のため、release/zenn 側にファイルが存在しない（＝最初から true で追加される）ケースをカウントしない。

**対策/学び**: プレビューの件数を鵜呑みにせず、**deploy 対象の実差分を直接照合する**。release/zenn 側にファイルが無い記事は必ずこの経路になる（新規記事はすべて該当）。

```bash
git diff origin/release/zenn...HEAD --stat -- articles/ books/
for f in $(git diff origin/release/zenn...HEAD --name-only -- articles/ books/); do
  git show origin/release/zenn:$f 2>/dev/null | grep -m1 '^published:' || echo "$f: ファイル無し"
  grep -m1 '^published:' $f
done
```

プレビューが 0 件でも「公開されるものが無い」とは限らない。逆に、対象 slug 以外の flip 混入チェックにはプレビューが有効なので、**両方を実行する**。

**根拠**: PR #511（sync）、公開反映は HTTP 200 / Zenn API id 636381 で確認済み

### 2026-08-20 — Skill の `allowed-tools` は事前承認であって排他的な権限制限ではない [Convention][Gotcha]

**観察**: `article-humanizer-ja` の frontmatter に `allowed-tools: Read / Grep / Glob` のみを記載し、「`Edit` / `Write` を渡していない＝書き換え能力を持たない」と解釈して記事の中核主張として書いた。Claude Code 公式ドキュメントを確認すると、Skill の `allowed-tools` は**列挙したツールを事前承認する**設定であり、利用可能なツールを排他的に制限するものではない。

- 事前承認: https://code.claude.com/docs/en/skills#pre-approve-tools-for-a-skill
- 排他制限が必要なら Custom Subagent の `tools` allowlist: https://code.claude.com/docs/en/subagents#available-tools

**対策/学び**: 「設定に X が無い＝X ができない」という推論は、**その設定の意味論を公式ドキュメントで確認しない限り成立しない**。実装ファイル（frontmatter）を読んだだけでは裏取りにならない。read-only 境界を実効化したいなら、Custom Subagent の `tools` allowlist か permission deny を使い、書き込み能力が存在しないことをテストする。

**根拠**: 公開記事 `ai-review-gate-not-called` の改稿（外部レビューで検出、公式仕様照合で訂正）

### 2026-08-20 — 同系統モデルだけのレビューでは仕様の誤認を検出できない [Workflow][Pattern]

**観察**: 記事レビューで Claude 系 4 視点（読者 / スクラム・EM / 編集 / 敵対的）＋ Codex CLI を実施したが、**5 系統すべてが `allowed-tools` の仕様誤認を見逃した**。検出したのは ChatGPT で、公式ドキュメントとの突合という手段を取ったため。一方 Codex は数値の再現性（計測日の欠落、件数の自己矛盾）で 4 件を検出しており、Claude 系 4 視点はそちらも見逃していた。

**対策/学び**: 検出できる誤りの種類は**モデル系統ではなく検証手段**に依存する。同系統を増やしても、同じ手段しか取らなければ同じ穴が残る。重要な記事では次を分けて依頼する:

- **論理・構成** → 同系統の複数視点で足りる
- **数値・コマンドの再現性** → 実際に再実行させる（Codex が有効だった）
- **仕様・API の意味** → 公式ドキュメントとの突合を明示的に指示する（これを指示しないと誰もやらない）

**根拠**: 公開記事 `ai-review-gate-not-called` のレビュー履歴（`reviews/zenn/ai-review-gate-not-called.md`）

### 2026-08-20 — Gemini CLI の個人無料枠が停止、多視点レビューの L3 が 1 系統減った [Tooling][Gotcha]

**観察**: `gemini -p` が `IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals` で実行不能（CLI 0.42.0）。Antigravity への移行を案内される。`--skip-trust` で trusted-directory の警告を回避しても、認証段階で同じエラーになる。`GEMINI_API_KEY` / `GOOGLE_API_KEY` 未設定のため API キー経由のフォールバックも不可。

**対策/学び**: 2026-06-07 エントリの「L1: 独立Claude → L2: bot → L3: CLI(Gemini/Codex)」の前提が変わった。**L3 で Gemini を当てにしない**。復旧は API キー設定（`export GEMINI_API_KEY=...`）か Antigravity 移行で、いずれも環境側＝ユーザー対応。実行不能だった事実自体をレビュー記録に残し、「外部視点が何系統確保できたか」を明示する。

**根拠**: 2026-08-20 の `/multi-review` 相当実行（Codex 0.144.1 は正常動作、Gemini 0.42.0 のみ失敗）

### 2026-08-10 — Dependabot alerts API の 403 はスコープ不足とは限らず、まず `gh auth refresh` を試す [Gotcha][Auth]

**観察**: Dependabot の脆弱性アラートを `gh api repos/:owner/:repo/dependabot/alerts` で取得しようとしたところ 403。エラーメッセージは特定スコープの不足を示唆していたが、`gh auth status` で確認すると**当該スコープは既に保持済み**だった。`gh auth refresh` でトークンを再発行すると、**同一スコープのまま**同じ API が成功した。7月中旬に発行した古いトークンが原因で、スコープ表示と実際にトークンへ焼き込まれた権限が乖離していた。

**対策/学び**: gh CLI の 403 でエラーメッセージが「needs スコープ X」と言っていても、`gh auth status` にそのスコープが出ているなら**メッセージは誤誘導**。スコープを追加する前に `gh auth refresh` を先に試すほうが速い。長期間ローテーションしていないトークンでは、表示上のスコープと実権限がずれうると考えておく。

**根拠**: 2026-08-10 の Dependabot 対応セッション（後続の PR #503 で js-yaml DoS 2 件を解消）

### 2026-08-12 — squash マージでリモートブランチが自動削除される設定下では `git push origin --delete` が空振りする [Gotcha][Workflow]

**観察**: PR マージ後の掃除で `git push origin --delete <branch>` を実行したところ、リモート参照が既に存在せずエラーになった。このリポジトリは squash マージ時にリモートブランチが自動削除される設定で、`gh pr merge --squash --delete-branch` の時点で削除が完了していた。ローカルに残っていたのは**追跡参照（remote-tracking ref）だけ**で、実体はなかった。

**対策/学び**: マージ後の掃除は `git fetch --prune` だけで足りる。削除コマンドを打つ前に `git ls-remote --heads origin <branch>` で実体の有無を確認すると、無駄なエラーを踏まない。ローカルブランチの削除（`git branch -d`）は別途必要。

**根拠**: 2026-08-12 のセッション（#503 マージ後の掃除）

### 2026-09-02 — 内部リンクと外部リンクでベストプラクティスは逆になる [Convention]

**観察**: `river-review-judgment-placement` の内部リンク整備で「文脈内配置は末尾リンク集より評価される」という一般的な SEO 指針を見つけ、これを根拠に AGENTS.md の「note / Qiita へのリンクは末尾リンク集のみ」という規約を緩めるべきかを検討した。調べ直したところ、この指針は**同一ドメイン内のリンクについてのもの**で、Zenn 記事から note / Qiita へのリンクには前提が一致しなかった。既存規約は緩める必要がなかった。

**気づき**: 本当の穴は別にあった。**他媒体へのリンクにだけ規約があり、同一媒体内の自記事リンクは無規約**という非対称が残っていた。実態として、内部リンクを持つ既存 4 記事すべてが `## まとめ` 以降にしかリンクを置いていない。「規約があるほう」ばかり整備され、「規約がないほう」が放置されていた。

**対策/学び**:
- リンクの配置指針を検討するときは、まず **同一ドメイン内か他プラットフォームか**を切り分ける。切り分ける前に一般論を当てはめない
- AGENTS.md 表現規約に「記事内の同一プラットフォーム参照（Zenn ↔ Zenn / Qiita ↔ Qiita）」節を新設。説明的アンカーテキスト・`/articles/<slug>` 相対形式・双方向の張り返しを明文化した
- クロスプラットフォーム参照の節には「この指針は同一ドメイン内の話なので本規約を緩める根拠にならない」と理由を追記し、同じ検討を繰り返さないようにした
- 一般的なベストプラクティスを既存規約の変更根拠にする前に、**その指針の適用範囲が自分のケースと一致しているか**を確認する。今回は適用範囲を確認しないまま「規約が best practice と衝突している」と一度ユーザーへ報告してしまった

**Codex レビューで受けた指摘（反映済み）**:
- 検索エンジンの挙動を断定する書き方（「評価を外へ渡す」「1〜3本に絞る」）は、計測していない以上、恒久規約には強すぎる。**SEO の事実ではなく、このリポジトリの運用方針として書く**
- 「文脈内リンク 2〜4 本」のような数値は、根拠・計測方法・見直し条件がないなら置かない。上限だけが独り歩きして必要な導線を抑制する
- `docs/content-channel-strategy.md` §Cross-posting rules は「再構成版の**冒頭**に正本明示リンク」を求めており、クロスプラットフォーム参照の禁止と衝突していた。**例外として明記**し、規約同士の矛盾を解消した

**根拠**: 2026-09-02 PR #571（記事側の内部リンク 3 本整備）の検討過程。規約の出発点は 2026-04-20 の PR #92 → revert `50fa0f3` の 2 段階修正エントリ

---

### 2026-09-03 — 長時間ワークフローは実行中にベースごと入れ替わる [Workflow][Gotcha]

**観察**: `note-thesis-review-loop`（3ループ・約45分・18エージェント）の実行中に、並列セッションがワーキングツリーを `main` へ切り替えた。ワークフローは**切り替わった先の古い記事（282行・再構成前）を編集し続け**、319行の成果物を作って正常終了した。`abortedForDrift=false` / `finalPassed=true` / `unresolvedImportant=0` と、返り値はすべて成功を示していた。成果物は系統が違うため丸ごと破棄。45分と約130万トークンを失った。

既存の「並列セッション干渉」エントリはブランチ切替と commit 混入が対象だったが、これは**長時間バックグラウンド処理の入力ファイルが実行中に別物へ差し替わる**という別の形。ワークフローの返り値だけでは検知できない。

**対策/学び**:
- 長時間ワークフロー完了時は、返り値を信じる前に **`git branch --show-current` と対象ファイルの行数・主題マーカーを実測する**。今回は「再構成で入れたはずの語句が0件」で検知できた
- 検知したら成果物をスクラッチパッドへ退避 → `git checkout --` で作業ツリーを戻す → 正しいブランチへ復帰 → 再実行。誤ベースの成果物から拾える指摘はほぼない（前提が違うため）
- 隔離したい場合は worktree だが、`EnterWorktree` は「ユーザーまたは CLAUDE.md が明示的に worktree を指示した場合のみ」使用可。勝手に使わない

**根拠**: PR #575（1回目 run `wf_344dba80-c63` を破棄、2回目 `wf_843c1612-5d3` で正常完了）

### 2026-09-03 — レビューワークフローに媒体固有の表記規約を渡さないと違反が混入する [Workflow][Convention]

**観察**: 3ループレビューが note 記事に**禁止表記のダッシュ（`—` `——`）を20箇所混入**させた。`AGENTS.md` §note固有（JTFスタイル準拠）に「ダッシュは使用しない → 全角括弧や句点で置換」と明記されているが、ワーカーは主題・論理・読者理解の観点しか見ておらず表記規約を参照していなかった。検出したのは Copilot の PR 行コメント。混入箇所はタイトル / 見出し / 挿入句 `——A——` / ラベル区切り `**X** — Y` の4種類に散っていた。

**対策/学び**:
- 記事改善を委託するときは、委託プロンプトの情報源に **`AGENTS.md` の媒体固有セクション**を明示的に含める
- レビュー系ワークフローの完了後、コミット前に `grep -n "—\|―" <file>` を1回走らせる
- 置換は既存 `articles_note/published/*.md` の表記に合わせる。ラベル区切りは全角コロン `**ラベル**：説明` が既存記事の標準
- 恒久対策は `npm run check` へのダッシュ検出追加（未実装）

**根拠**: PR #575（Copilot 行コメント4件、commit `a6e6e7c`）

### 2026-09-03 — レビューループは数値の「単位」を保存しない [Workflow][Gotcha]

**観察**: 3ループレビューが、実行系 K1 の分母61を「スキル単位ではなく**ケース単位**の件数」と書き換えた。`metrics_k1.py` の実出力は `Skills with passing canary: 42 / 61` で単位はスキル。数値そのものは保持されるが、**数値が何を数えているかの説明が言い換えの過程で入れ替わる**。さらに後続の圧縮パスで、一度直した「19スキル」が別の箇所で「19件」へ再発した。

**対策/学び**:
- レビューループ後は、数値の**存在**（grep で件数一致）だけでなく、**単位と分母の説明**を一次情報と突き合わせる
- 同じ数値が複数箇所に出る記事では、単位表記の揺れを `grep -n "<数値>"` で全件並べて確認する。1箇所直して終わりにしない
- 数値の書き換え・丸めは禁止できても、「説明の言い換え」は禁止しにくい。**検証側で捕まえる前提**で運用する

**根拠**: PR #575（commit `059a9b4` で初回修正、圧縮パス後に再発し最終 commit で再修正）

### 2026-09-03 — 自作OSS記事では「過剰な自己批判」も一次情報と矛盾する [Convention][Workflow]

**観察**: `oss-article-claim-boundary` を自作OSS＋社内リポジトリのチーム展開記に適用したところ、検出された must 3件のうち2件が**誇張ではなく自己批判の行きすぎ**だった。「配布前のレビューゲートが存在しない」は、実際には main の branch protection が `required_approving_review_count: 1` で承認必須（事実として誤り）。「バージョンを固定する仕組みがない」も `plugin.json` に version と bump スクリプトがあり、無いのは利用側が pin する経路だけだった。

自作ツールの記事では「贔屓目による誇張」を疑うのが定石だが、**贔屓目を打ち消そうとした自己批判のほうが先に一次情報と衝突した**。しかも記事の決め台詞がその誤った自己批判に乗っていたため、主張の芯が誤情報で支えられる形になっていた。

**対策/学び**:
- 主張境界レビューでは、褒めている箇所と同じ強度で**貶している箇所も一次情報に当てる**。「〜が存在しない」「〜の仕組みがない」という否定形の断定は特に照合する
- 照合先はリポジトリ内の記述だけでなく、**GitHub API の branch protection / ruleset** まで見る。運用ルールがコードやドキュメントに書かれていないことがある
- 直すときは自己批判を削らず、**欠けているものを正確に言い直す**（「レビューゲートがない」→「段階配布とロールバックがない」）。記事の力を保ったまま事実に合わせられる

**根拠**: PR #575（`reviews/note/new/plangate-team-rollout.claim-boundary.md` must-1 / must-2）

### 2026-09-02 — 委託ワーカーは「消去法の残り」を断定に変える [Workflow][Gotcha]

**観察**: 公開前記事のレビュー指摘（「安全機構」がどのレイヤーか未特定）の反映を subagent へ委託したところ、「エージェント実行ハーネスのツール許可レイヤーによる拒否を指す」と**断定した1文**を記事へ追加してきた。一次情報である `AGENT_LEARNINGS.md` 2026-06-18 エントリは「安全機構が判定してブロック」としか書いておらず、レイヤーを特定していない。ワーカーは Git hook を消去法で除外したところまでは正しかったが、**残った候補が複数（ツール許可レイヤー / サンドボックス）あるのに1つへ確定させた**。さらに根拠として別インシデント（2026-05-18 の Qiita publish で `/permissions` を使った件）を接続していた。

**気づき**: ワーカーは「調べて分からなかった」を報告しづらい。委託プロンプトが「特定せよ」と読める書き方だと、**確度の低い推論でも埋めて返す**。消去法で候補が1つに絞れなかったときに何を書くかを、事前に指示しておく必要がある。前段の指摘（レビュー側）が「特定されていないのが欠落」と書いていたことも、ワーカーを断定へ押した。

**対策/学び**:
- 委託プロンプトに **「一次情報で裏が取れない主張は断定せず、『〜と考えられる』『記録上は特定できていない』など確度に合った表現にする」** を定型として入れる。あわせて **「別々のインシデント・別々の記録を接続して根拠にしない」** も明記する
- 消去法の**否定側は断定してよい**（根拠が実物にある）。今回も「`pre-push` は gh アカウント検査しかしていないので Git hook ではない」は残した。否定と肯定で確度が違うことを指示に書き分ける
- レビュー指摘が「Xが特定されていない」という形のとき、反映タスクは**「特定する」ではなく「特定できる範囲を明示する」**と定義して渡す
- 完了報告の実物照合では、**追加された断定文の根拠を一次情報まで戻って確認する**。ワーカーが挙げた根拠が別文脈のものになっていないかを見る

**根拠**: 2026-09-02 PR #574。初回報告を差し戻し、`pre-push` の実装（`check-gh-account.sh` の結果しか見ない）を根拠に否定側のみ断定する表現へ修正させた

---

### 2026-09-04 — Codex CLI は長文プロンプトで exit 0 のまま無言終了する [Tooling][Gotcha]

**観察**: PR のレビューを `codex exec --sandbox read-only` へ委託したところ、**3 回連続で回答がゼロ**だった。いずれも exit code は 0 で、エラーメッセージも出ない。

1. 前景実行 → 10 分でタイムアウト（出力なし）
2. `nohup` + バックグラウンド → ログにプロンプトのエコーだけが残り終了。`Reading additional input from stdin...` の行があった
3. `< /dev/null` で stdin を切る → 「差分と規約を照合します。一次情報も確認します」という**前置き 1 行だけ**出力して終了

「Codex が壊れている」と判断しかけたが、`codex exec ... "1+1 の答えだけを数字で答えてください。"` の疎通テストは **19,054 tokens 使って正常に応答**した。つまり CLI もアカウントも生きていた。

4 回目に**プロンプトを大幅に短縮**（観点を 3 つに絞り、diff を貼らず `git diff main...HEAD` を実行させる形へ）したところ、62,975 tokens を使って must 2 件・should 1 件の実のあるレビューが返った。

**気づき**: 失敗が exit 0 で返るため、**成功と区別がつかない**。「実行できた＝結果が空だった」と読んでしまい、レビュー対象に問題がなかったのだと誤解しかねない。実際 2 回目は「Codex が Approve した」と解釈する余地があった。

**対策/学び**:

- `codex exec` は **stdin を必ず切る**（`< /dev/null`）。付けないと stdin 待ちで沈黙終了する
- **プロンプトに diff やファイル本文を貼らない**。パスと実行すべきコマンドを渡し、Codex 自身に読ませる。貼った時点でそれは一次ソースではなく要約でもある
- 観点は 3 つ程度に絞る。長い依頼文は分割する
- **exit 0 を成功の証拠にしない**。出力に `tokens used` 行と実際の回答本文があるかを確認してから受理する。無ければ失敗として扱う
- 疑わしいときは最小プロンプト（`1+1`）で疎通を切り分ける。CLI 全体の障害と、そのプロンプト固有の失敗を区別できる
- 長文が必要な場合は前景 10 分で切らず、バックグラウンド実行にしてログを後から読む

**根拠**: 2026-09-04 セッション。PR #571 のレビュー依頼で 3 回空振り（約 25 分のロス）、短縮版の 4 回目で成功し、そこで得た must 2 件を #571 へ反映した

---

### 2026-09-05 — Workflow のエージェントは相対パスをメインセッションの cwd 基準で解決する。実行中に cwd を動かすと成果物が2箇所に分裂する [Workflow][Gotcha]

**観察**: `articles_note/new/ai-driven-development-experience-note.md` を対象に、5ループのレビュー改善 Workflow を PR #585 のブランチの worktree で起動した。実行中、オーガナイザー（メインセッション）が別 PR の作業のため作業ディレクトリを worktree → 別 worktree → main checkout と移した。その結果、**後半ループのエージェントが相対パスを main checkout 基準で解決**し、そこに記事のコピーを untracked ファイルとして作成・編集した。worktree 側は途中ループ止まり、main checkout 側が最終版という分裂が生じ、最終検証エージェントが検証したのは main checkout 側だった。Workflow の完了報告は全エージェント成功の正常終了で、**分裂は報告に一切現れなかった**。

2026-09-03 の「長時間ワークフローは実行中にベースごと入れ替わる」は並列セッションがワーキングツリーを切り替えた事例だが、今回のドリフト源は**自分自身の作業ディレクトリ移動**だった。「worktree で隔離しているのでドリフト源は存在しない」という事前判断が誤りで、worktree はメインセッションの cwd 移動を隔離しない。

**対策/学び**:
- Workflow 実行中はメインセッションの作業ディレクトリを動かさない。別 PR の作業を挟むなら Workflow の完了を待つ
- 同日マージの PR #595 が入れた snapshot guard（`scripts/check-note-thesis-snapshot.js`）が、この事象に直接効く。`capture` が `git rev-parse --show-toplevel` でリポジトリルートを **cwd から**解決したうえで、`branch`（`git branch --show-current`、detached なら `DETACHED`）/ `headSha`（`git rev-parse HEAD`）/ `articlePath` / `articleSha256`（記事本文の SHA-256）の4項目を記録する。各エージェントは `verify` で初回 snapshot と4項目を突き合わせ、1つでも異なれば `ABORT: article snapshot changed` を stderr に出して exit 2 で止まる。worktree と main checkout では `branch` と `headSha` が食い違うため、今回の分裂は verify 段階で捕捉される
- `.claude/workflows/note-thesis-review-loop.js` では、Extract / 各ループの Review・Improve・Recheck / FinalVerify の**全プロンプト先頭に `verify` 実行が挿入**され、`snapshotOk=false` なら Read/Edit を続行せず返す規約になっている。Improve だけは編集後に `capture` を再実行し、`branch` / `headSha` / `articlePath` が初回と一致するかをワークフロー側でも突き合わせる（`sameExecutionContext`）。いずれかで不一致なら `aborted: 'article-snapshot-changed'` で終了する
- **#595 以前の版を fork した Workflow にはこのガードが無い**。fork したスクリプトを使い回す場合は、本家の更新（特にガード追加）を取り込んでから起動する

**根拠**: 2026-09-05 の実行。PR #595（マージ commit `d126e92`、`.claude/workflows/note-thesis-review-loop.js` / `scripts/check-note-thesis-snapshot.js` / `scripts/check-note-thesis-review-loop.js` / `package.json` を変更）を一次ソースとして確認

---

### 2026-09-05 — 消費側を書く前に生成側の一次ソースを読む／書いた手順は自分で1回実行して確かめる [Tooling][Gotcha]

**観察**: 同日、同じ根本原因（**consumer 側を、producer 側・実行系の実挙動を確認せずに書いた**）から3つの欠陥が出た。

1. **生成側の命名規則を読まずに削除スクリプトを書いた**。`scripts/clean-note-build.js`（PR #596）は `articles_note/build/` の WXR を記事ごと最新1本に整理する。初版は「`articles_note/new/<slug>.md` が無い slug は削除」だったが、生成側 `.claude/skills/note-export-import/scripts/md_to_wxr.py` の `derive_default_outname` は **単一ファイル指定 → ファイルの stem / 単一ディレクトリ指定 → ディレクトリ名（`new` / `drafts` / `published`、空なら `batch`） / 複数指定 → `bundle`** を返す。`articles_note/new/new.md` や `bundle.md` は定義上存在しないため、**ディレクトリ指定で生成した直後の WXR が即座に削除対象**になっていた。一次ソースを読んでいれば設計時点で分かった。
2. **`npm run <script> --dry-run` は npm がフラグを食い、確認のつもりが実行になる**。使い捨ての `package.json` で probe した実測（npm 11.12.1）:

   ```text
   $ npm run probe --dry-run        # `--` なし
   ARGV=[]
   npm_config_dry_run="true"
   SCRIPT ACTUALLY RAN

   $ npm run probe -- --dry-run     # `--` あり
   ARGV=["--dry-run"]
   npm_config_dry_run=undefined
   SCRIPT ACTUALLY RAN
   ```

   `--` を1つ忘れるだけで、script は `--dry-run` を受け取らないまま**実行される**。破壊的操作を伴う npm script では致命的。さらに悪いことに、私は `CLAUDE.md` の運用手順に `--dry-run` の使い方を書き、その踏み方を自分で促していた。
3. **PR 作成前に3点 diff を見ず、他 PR の差分が混入した**。記事改善の PR で、ブランチが main をマージ済みだったため別 PR（#596）の3ファイルが diff に載った。`git diff <base>...HEAD --stat` を作成前に見れば即座に分かった。ブランチを base から作り直して復旧した。これは `CLAUDE.md` §`gh pr merge` 直前チェックリストと 2026-06-10 / 2026-04-20 のエントリに既に明記されている規律で、**新しい発見ではなく、書いてある手順を実行しなかった**という失敗である。

**対策/学び**:

- **消費側を書く前に生成側の一次ソースを読む**。関数名や docstring から挙動を推測せず、戻り値の全パターンを自分の目で確認する。今回なら `derive_default_outname` の3分岐。
- 生成側の命名規則が「記事 slug ではない」ケースを持つなら、消費側は**予約語として明示的に除外**する。`clean-note-build.js` は `RESERVED_SLUGS = {new, drafts, published, bundle, batch}` を一切削除せず（束ねた生成物は provenance が不明で、新しい版が古い版の上位互換とは限らない）、`live` 判定も `new/` だけでなく `published/` `drafts/` を横断して note guid 名の WXR を守るようにした。
- **破壊的な npm script では `npm_config_dry_run` も dry-run として扱う**。`clean-note-build.js` の `resolveDryRun(argv, env)` は `--dry-run` 引数と `npm_config_dry_run` の両経路を見て、**どちらの経路で dry-run と判定したかをログに出す**。加えて `--` を覚えなくてよい専用 script `clean:note-build:dry` を用意した。同じ形の script を追加するときは踏襲する。
- **手順を書いたら、その手順どおりに1回実行して確かめる**。ドキュメントに書いた時点で他人（次の自分を含む）はそのとおり打つ。未実行の手順は仕様ではなく願望。
- PR 作成前にも `git diff <base>...HEAD --stat` を見る。3点比較はマージ前だけの作法ではない。

**根拠**: 2026-09-05 の作業。PR #596（`scripts/clean-note-build.js` 追加、マージ commit `ddb3ba4`）、`.claude/skills/note-export-import/scripts/md_to_wxr.py` の `derive_default_outname`、npm 11.12.1 での再実測。3点 diff の先行エントリは 2026-06-10 / 2026-04-20、同日の別事象（Workflow の cwd 基準相対パス）は PR #600 のエントリを参照

### 2026-09-06 — WARN-only の新 lint を集約 `check` に直結しない。対象を絞る入口を分ける [Tooling][Workflow]

**観察**: `scripts/check-article-language-density.js`（日本語段落中の英語名詞密集を検知する WARN-only lint）を追加した際、初版は `npm run check` から全記事を対象に走らせた。既存記事に **57 件の WARN** が出て、集約 check の出力が新規変更由来の指摘で埋もれた。新しい観点そのものは正しいのに、既存資産の在庫が一気に噴き出して signal/noise 比を壊した形。

**対策/学び**:

- 責務を分けた。`check:article-humanizer` を `check:article-humanizer-contract`（Harness の契約検査。CI 常時）と `check:article-language-density`（実記事の密度検査）に割り、**集約 `npm run check` には contract 側だけを繋いだ**。
- 実記事の密度確認は `/finalize-note-article <target>` から **対象記事だけ**に走らせる（`npm run check:article-language-density -- articles_note/<state>/<slug>.md`）。引数なしで叩くと `articles_note/new|published` 全体が対象になるので、手で叩くときも必ず対象を渡す。
- この分離は後戻りしやすいので、`scripts/check-note-finalize.js` に「集約 `check` が `check:article-language-density` を含んでいたら FAIL」という逆向きのガードを入れてある。
- 一般化: **既存資産に対して在庫 WARN が出るタイプの lint は、集約ゲートではなく「これから触る対象」を指定する入口に置く**。集約側には契約・self-test だけを残す。

**根拠**: PR #594（マージ commit `c2fbc4f`）。`package.json` の `check` は `check:article-humanizer-contract` を含み `check:article-language-density` を含まない。`scripts/check-article-language-density.js` の `DEFAULT_TARGETS` / `--` 引数処理、`scripts/check-note-finalize.js` の `must not scan all historical articles` ガード、`.claude/commands/finalize-note-article.md` L38。57 件という実数は PR #594 本文の記述。

### 2026-09-06 — Workflow phase が custom Agent 定義を Read してもツール権限は継承しない [Platform][Gotcha]

**観察**: `.claude/workflows/note-finalize.js` の DomainReview / VisualReview phase は、レビュー契約を参照するために `.claude/agents/article-domain-reviewer.md` / `article-visual-reviewer.md` を `Read` する。だがこれは**定義文書を読んでいるだけ**で、その frontmatter の `tools:`（`WebFetch` など）が phase の実行権限に加わるわけではない。「Agent 定義を読んだから一次情報を取りに行ける」と錯覚すると、実際には取得できていない主張を `verified` として返してしまう。

**対策/学び**:

- Workflow の prompt 側に明文化する。note-finalize は Domain phase に `primarySourceAccess: available / partial / unavailable` を返させ、**`unavailable` なら中心主張の `official_fact` を推測で `verified` にせず `unverified=true`** とする（L272-273）。Visual phase も同様に「Agent 定義を Read しても画像を読む能力は増えない」→ 画像本体を確認できなければ `KEEP` ではなく `UNVERIFIED`（L319）。
- `unverified` が立った Gate は最終 verdict を `UNVERIFIED` に落とし、`READY` を名乗らせない。**能力の欠如を「合格」ではなく「未検証」に写像する**のが要点。
- 関連: 2026-08-20 の「Skill の `allowed-tools` は事前承認であって排他的な権限制限ではない（排他制限は Custom Subagent の `tools`）」と同じ族の誤解。**権限の所在は「読んだ文書」ではなく「いま実行している主体」にある**。

**根拠**: PR #594（マージ commit `c2fbc4f`）で追加された `.claude/workflows/note-finalize.js` L272-273 / L319、および `primarySourceAccess` の enum 定義（L91-101 付近）。PR #594 本文にも同趣旨の記載あり。

### 2026-09-07 — 「検知できない状態」を放置しない（検査不能を合格に丸めない / PR 番号の飛びは衝突のサイン） [Workflow][Gotcha]

**観察**: 同じセッションで、検知手段が欠けていたことに起因する事象が 2 件出た。

1. **検査不能を「合格」に丸めていた**。`.claude/workflows/note-finalize.js` の 4 Gate のうち、Domain Gate は一次情報を取得できないとき `unverified` を返す設計だったのに、Visual Gate は**図を 1 枚も認識できなくても `images: 0` のまま `passed: true`** を返し、その run が `READY` を出していた（対象 run: `wf_b5ce5593` / `wf_b400e3a8`）。同一ワークフロー内で Gate ごとに扱いが割れていた。
2. **並行セッションの PR が同じファイルを書き換えていたのに気づけなかった**。`articles_note/new/harness-practice-note.md` を複数ゲートと外部レビューで仕上げている最中、並行セッションが**同じ 1 ファイルだけを +175/-128 で書き換える PR #623**（作成 `2026-09-06T09:32:01Z` / マージ `09:59:26Z`、author s977043）を出してマージした。こちらの PR #624（作成 `2026-09-06T09:35:19Z`）の CI を見たときに初めて気づき、**手がかりは PR 番号が 1 つ飛んでいたことだけ**だった。中心的な切り分けは別表現で残ったので実害は限定的だったが、気づく手段が無かったこと自体が問題。

**対策/学び**:

- **検査系を作るときは「問題なし」と「検査できなかった」を必ず別の値にする。** 同じ値へ丸めると、検査が動いていない状態が成功として報告される。note-finalize では `reconcileVisual` を FinalGate に置き、会計不一致・検査漏れ・自己矛盾を検出したら `passed` は書き換えず `unverified` を立てる（Domain Gate と同じ扱いに揃える）。**同一ワークフロー内で Gate ごとに扱いを変えない**のが要点。
- **PR を起票した直後に番号が飛んでいたら、他セッションが並行して PR を作っているサイン**として扱う。連番の欠けは「気づける唯一の兆候」なので見逃さない。
- 兆候頼みにしない仕組みとして `npm run check:pr-conflict`（`scripts/check-pr-file-conflict.js`）を追加した。現ブランチの変更ファイル（または引数指定のファイル）が他の open PR のファイル集合と重なるかを 1 回の `gh pr list --json files` で判定する。既定は WARN、`--strict` で exit 1。gh 未認証 / オフライン / レート制限では SKIP して誤検知しない。作業着手前とレビュー前に叩く。

**根拠**: Issue #622 / PR #624（マージ commit `d8a620c`、`.claude/workflows/note-finalize.js` の `VISUAL_SCHEMA.scan` と `reconcileVisual`）。PR #623 は `gh pr view 623 --json createdAt,mergedAt,additions,deletions,files` で確認（1 ファイル / +175 / -128）。

---

### 2026-09-14 — note エクスポート取り込みで大量に出る画像の `M` は、実体差分ゼロの churn [Tooling][Gotcha]

**観察**: `wxr_to_md.py` で公式エクスポート ZIP を取り込んだところ、`articles_note/assets/` の PNG 100 点が `M` になった。新規記事は 1 本（`n062a695d5af9`）なのに、画像だけが全面的に変更扱いになる。実体を確認すると、ファイルサイズ・寸法・カラーモードはすべて同一で、`cmp -l` で差分は 6 バイトだけだった（PNG のメタデータ chunk と思われる）。note 側が同じ画像をエクスポートのたびに再生成しているため、内容が変わらなくても毎回バイト差分が出る。

**対策/学び**:

- 取り込み後に `git status` が画像多数の `M` を出したら、**まず 1 点を検体として実体差分を測る**。`git show HEAD:<path> > /tmp/old.png` してから `ls -l` / `file`（サイズ・寸法）と `cmp -l`（差分バイト数）を比べる
- サイズ・寸法が同一で差分が数バイトなら churn。`git checkout -- articles_note/assets/` でまとめて捨てる。commit するとエクスポートのたびに 100 点規模の無意味な diff がリポジトリへ積もる
- **新規追加された画像は `??` として出る**ので、`M` を全部捨てても取りこぼさない。この非対称性が安全に一括 revert できる根拠になる
- 逆に、サイズか寸法が変わっていたら note 側で画像が差し替わっているので、その分は取り込む
- 2026-10-08 の再発: 1 点の検体では足りず「全件で実体が同じか」を問われた。全件を `git diff --name-only` で列挙し、PNG の IDAT を展開して比較すると決着する（100 点中 95 点は `pHYs` の 2835→2834 のみ、5 点は再圧縮でデコード後は同一）。`python3 -I` で数行書けば済む
- 破棄は `uncommitted-restore-guard` フックが止める。ユーザー確認を取ってから `UNCOMMITTED_RESTORE_GUARD_SKIP=1` を付けて `git restore` する。記事側の差分（公開済み記事のバッククォート消失など）は画像と別に取り込み可否を判断する

**根拠**: PR #660（`n062a695d5af9` の取り込み。画像 100 点を revert し、2 点の新規のみ commit）。検体は `n38127f1a545f_860b42c08800b229c1439cf3f8df4b67.png`（1,789,472 バイト / 3840x2010 が前後で一致、`cmp -l` の差分 6 バイト）

### 2026-09-17 — 規律を定めたドキュメントは、その規律を自分自身に適用して検算する [Convention][Workflow]

**観察**: 「他者の OSS を解説する記事の書き方」ガイド（`docs/article-guides/oss-explainer-writing.md`）を書いた。必須要件として「推測には該当ファイルパスを添えよ」「観測していない効果を書くな」を挙げながら、**ガイド本体が両方を破っていた**。冒頭は「外部読解型の実例分析をもとに整理した」と書くだけでその実例の URL を示さず、運用実績ゼロの内容を「必須要件」と断言していた。セルフレビューで気づいて公開前に修正した。

**対策/学び**:

- 規約・ガイド・チェックリストを書いたら、**成果物自身を最初の適用対象にする**。書いたチェックリストを自分に対して 1 周回す
- 特に落ちやすいのは「出典の明示」と「未検証であることの明示」。**書き手は自分の根拠を知っているので、示す必要を感じない**。読者は知らない
- 既存ガイドと並べる場合、根拠の強さが揃っているかを見る。`zenn-structure-best-practices.md` は公開実績を根拠に持つが、新規ガイドは外部事例の分析にすぎない。同じ棚に置くなら、その差を本文に書く

**根拠**: PR #661（初回 commit `aa45a0f` → セルフレビュー反映 `7165d9d`。出典明示・未運用の明記・参考節の体裁統一の 3 点）

---

### 2026-09-24 — my-blog の gh アカウント hook は操作先を見ずに s977043 へ戻す。別リポジトリへの push はコマンド内で切り替える [Gotcha][Tooling]

**観察**: my-blog で起動したセッションから、会社リポジトリ（`unilabo/site-management-system`）へ PR を出そうとした。直前のコマンドで `gh auth switch --user kominem-unilabo` しておいたのに、`git push` と `gh pr create` を含むコマンドが「Repository not found」「Could not resolve to a Repository」で失敗した。my-blog の PreToolUse hook（`.claude/settings.json` → `scripts/hooks/claude-gh-account-guard.sh` → `check-gh-account.sh --fix`）が、**push 系コマンドの直前に、操作先に関係なく active を s977043 へ戻していた**。これまでの記録（kominem-unilabo へ反転して my-blog の操作が 403 になる）とは逆向きの事象。

**対策/学び**:

- my-blog のセッションから別アカウントのリポジトリを操作するときは、**アカウントの切り替えを push / PR と同じ Bash コマンドの中で行い、最後に s977043 へ戻す**。hook はコマンド実行前に1回だけ走るので、コマンド内の切り替えは上書きされない
- 失敗時は何も push されていないことを確認してから再実行する（今回は push 前に失敗した）
- 根本対策: PR #689 で hook が操作先の owner（`gh -R` / `git -C` / `cd` 先の origin）を判定し、s977043 以外なら補正しないよう修正済み。owner を判定できないコマンド（変数を含むパス等）では従来どおり s977043 へ戻すので、コマンド内切り替えは引き続き有効な回避策

**根拠**: unilabo/site-management-system PR #1549 の作成時（2026-09-24）。1回目は失敗、コマンド内切り替えで成功

### 2026-09-24 — squash マージ済みのブランチは `--is-ancestor` でも3点 diff でも「未マージ」に見える。判定は PR の状態で行う [Gotcha][Workflow]

**観察**: ローカル環境の整理で stale ブランチを消そうとし、まず `git merge-base --is-ancestor <branch> origin/main` で判定したら、PR がマージ済みの5本が「未マージ」と出た。次に `git diff origin/main...<branch>` を見ると差分が残っていたため、「main に無い作業がある」と一度誤って報告した。どちらも、**squash マージでは元のコミットが main の祖先にならず、merge-base も古いまま**なので、マージ済みでも差分が出る。`git branch -d` も同じ理由で拒否する。

**対策/学び**:

- このリポジトリは squash マージのみなので、ローカルブランチがマージ済みかは **`gh pr list --state all --head <branch>` で PR の状態を見る**。MERGED なら `git branch -D` で消してよい。まとめて洗い出すには `npm run clean:merged-branches`（既定 dry-run、`-- --apply` で削除。#689）
- PR が無いブランチは、対象ファイルが main に存在するかと、ブランチ固有のコミット内容で判断する。祖先関係や3点 diff の結果だけで「未マージ」と結論しない
- 消す前に `git rev-parse <branch>` で SHA を控えておけば、`git branch <name> <sha>` で戻せる

**根拠**: 2026-09-23 のローカル整理（9 ブランチ削除。うち 5 本は PR #625 / #638 / #639 / #653 / #654 のマージ済み squash ブランチ）

### 2026-10-05 — クラウドの routine の GitHub 連携は、ローカルの gh アカウントとは別の設定 [Gotcha][Tooling]

**観察**: 2026-10-02 の初回 `/reader-review` をクラウドの routine（claude.ai）で実行した。公開ページの取得とレビューまでは完了したが、routine の GitHub 連携が kominem-unilabo だったため branch 作成が 403 になり、結果が失われた。ローカルの `gh` のアクティブアカウント（s977043）や `npm run gh:ensure`・PreToolUse hook は、クラウド側の連携には効かない。

**対策/学び**:

- 公開ページを読むだけなら GitHub は不要だが、結果を branch / PR にするには routine 側の GitHub 連携が s977043 である必要がある。クラウド実行を設定するときは、連携アカウントを別に確認する
- 当面はローカル実行に切り替え、routine `trig_01HhLm6SgRWMhdvBAjZUsZCE` は無効化した。次回の実行予定は `docs/due-items.json` に置いた

**根拠**: 2026-10-02 の初回 routine 実行（branch 作成 403）、2026-10-05 の振り返り

### 2026-10-05 — 模擬ペルソナインタビューの「実例が欲しい」は実データで反証された [Workflow]

**観察**: 模擬ペルソナインタビュー（`/reader-review` の深掘り）で「実例・一次体験が欲しい」という指摘が出たが、公開記事の実データでは支持されなかった。Zenn 42 本では実例あり/なしの反応差は閲覧数で説明でき、閲覧数の帯をそろえると差が消えた。X での他者の紹介 12 件のうち、筆者の実例を引いたものは 0 件だった。模擬の回答は好意的・平均的に寄る。

**対策/学び**:

- 模擬の指摘は確かさ A（実データ・リポジトリの事実で裏付けあり）/ B（本文の文字から確かめられる）/ C（模擬の回答だけが根拠）で扱う
- C は「次に見る実データ」で確かめてから手を打つ。模擬の回答だけで記事の改訂方針を決めない

**根拠**: `docs/reader-review/interview-method.md`、`reviews/reader/2026-10-02-deep.md`

### 2026-10-05 — 期限付きの約束は、記録と「その時刻に起こす手段」を同時に用意する [Workflow]

**観察**: X の告知実験 EXP-20261001-001 の計測期限（2026-10-04 07:02 JST）が、リポジトリ外の `carry-over.md` にしか書かれていなかった。期限の時刻にセッションを起こす手段も無く、計測は約 26 時間遅れて 2026-10-05 になり、72h 値は取れなかった。

**対策/学び**:

- 計測・観測・反映待ちなど期限付きの約束をしたら、(1) `docs/due-items.json` に項目を足す（`due` はタイムゾーン付き ISO 8601。済んだら `done: true` にして残す）、(2) その時刻に起こす手段（ローカルのスケジュール、ユーザーへのリマインド依頼など）も同じタイミングで用意する。記録だけでは、その時刻に誰も見ない
- 期限切れと 72 時間以内の項目は `npm run check:due` で見る（`-- --strict` で期限切れがあれば exit 1）。期限切れで記事 PR の CI を止めないよう、`npm run check` には入れていない

**根拠**: EXP-20261001-001 の計測遅れ（2026-10-04 → 2026-10-05）、`scripts/check-due.js`

---

<!--
## 追加時のテンプレート

### YYYY-MM-DD — <短い見出し> [カテゴリ]

**観察**:

**対策/学び**:

**根拠**:
-->
