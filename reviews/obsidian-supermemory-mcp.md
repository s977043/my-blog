# articles/obsidian-supermemory-mcp.mdの記事レビュー

## 🚩 レビュー方針
親ISSUE #11のレビュー観点（誤字脱字 / 用語誤用 / 文章わかりやすさ / 内容重複 / Web記事として読みやすい構成 / 技術記載の正確性 / 読者ニーズ充足 / SEO改善）に基づき、「ObsidianとSupermemory MCPをつなぐ知識管理ワークフロー」記事のレビューを実施しました。MCP サーバ/クライアントの扱いと比較軸の公平性、導入コマンドの再現性、および「個人開発ベストプラクティス」として提示する内容の裏付けを中心に確認しています。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @claude | - 記事構成・読みやすさ<br>- 対象読者との整合性<br>- SEO最適化 | - [x] 済 |
| **Web編集者視点** | @claude | - 誤字脱字・表現統一<br>- 文章の明確性<br>- 重複表現の確認 | - [x] 済 |
| **Webエンジニア視点** | @claude | - MCP 関連記述の正確性<br>- `npx install-mcp` 等のコマンド妥当性<br>- 比較表の技術的公平性 | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい（h2-h3の適切な使用）
- [x] 表に長文が入っていない
- [x] 画像パスが Zenn Preview で解決する（画像なし）
- [x] 公式リンクはクリック可能（Markdown link）
- [x] コードブロックの言語指定が適切
- [x] メッセージボックス（:::message）の適切な使用

---

## 指摘コメント

### 該当箇所 1
L108-L113 （Step2: Supermemory MCP を登録）

```bash
npx install-mcp https://mcp.supermemory.ai/xxxx/sse --client claude
npx install-mcp https://mcp.supermemory.ai/xxxx/sse --client cursor
```

### 問題点
(1) URL 部分が `xxxx` のプレースホルダのままで、読者はどこで実際の URL を取得するかが示されていない（Supermemory のダッシュボード発行、Sign-in 手順など）。(2) `--client claude` の指定は曖昧で、Claude Desktop / Claude Code のどちらを対象にしているか不明。MCP を導入したいクライアントごとに設定方法が異なるため、重要な情報が欠落している。(3) `install-mcp` パッケージが Supermemory 公式推奨なのか、サードパーティ CLI なのかも記載がない。

### 提案
前提と URL の取得方法、クライアントの具体名を明記する。

```bash
# 1. Supermemory ダッシュボード (https://mcp.supermemory.ai/) で
#    アカウント登録し、MCP エンドポイント URL を取得
# 2. 使いたいクライアントごとに登録（下記は2025年末時点の例）

# Claude Desktop へ登録
npx install-mcp https://mcp.supermemory.ai/<あなたのID>/sse --client claude

# Cursor へ登録
npx install-mcp https://mcp.supermemory.ai/<あなたのID>/sse --client cursor
```

> `install-mcp` は MCP を各クライアントの設定ファイルへ書き込むためのユーティリティです。手動で `claude_desktop_config.json` 等を編集する方法もあります。

---

### 該当箇所 2
L34-L38 （Supermemory MCP の紹介）

```md
- Claude / Cursor / Gemini CLI など **100+ AI クライアント対応の MCP サーバ**
- URL を登録するだけで即利用可能（ホスト版あり）
- Notion / Google Drive / PDF なども「記憶」として統合できる
```

### 問題点
「100+ AI クライアント対応」という具体的な数字の出典が記載されていない。MCP 仕様（Anthropic が策定）の対応クライアント数は時期により変動するため、公式ソースへのリンクなしに数字を断定するのはリスクがある。また、「MCP サーバ」は MCP プロトコルに従うサーバ実装を指す一般用語で、Supermemory MCP 固有の価値提案として書く場合はもう少し具体化したほうが読者にも伝わる。

### 提案
数字の出典を明示するか、表現を緩める。

```md
- MCP プロトコルに対応した主要な AI クライアント（Claude Desktop / Cursor / Gemini CLI ほか）で横断利用できる
- URL を登録するだけで即利用可能（ホスト版あり）
- Notion / Google Drive / PDF などを「記憶」として統合できる

> Supermemory 公式ページでは「100+ クライアント対応」を謳っています: https://mcp.supermemory.ai/
```

---

### 該当箇所 3
L52-L62 （共有メモリーサービスの比較表）

```md
| **Supermemory MCP** | ◎（URL 登録ですぐ）   | マルチクライアント対応、外部サービス連携豊富 | Claude & Cursor 両方で同じ知識を利用できる | ホスト利用時は外部に保存される     |
...
| **Obsidian**        | ○                     | Markdown ノートアプリ（ローカル資産化）      | 知識の整理・資産化に最適                   | MCP 標準ではないため即席共有は弱い |
```

### 問題点
比較軸が「共有メモリーサービス」となっているが、表の中に Obsidian（ノートアプリ）、Mem.ai（メモアプリ）、Claude Projects（プロダクト内メモリ）が並んでおり、Cipher / Serena（MCP サーバ）とは本来性質が異なる。同じ軸で比較することで、読者は「Obsidian の弱みが『MCP 標準ではないから共有が弱い』」と誤解しやすいが、Obsidian 公式にも MCP 対応プラグインが存在する（Obsidian MCP など）。記事タイトルの「Obsidian × Supermemory MCP」という主題と比較表のノイズがやや衝突している。

### 提案
比較軸を 2 段に分ける、または補足を添える。

```md
「共有メモリー」と「ノート資産」は役割が異なるため、以下の 2 つの観点で整理します。

### A. MCP サーバ（即席共有メモリ）

| サービス | 導入 | 強み | 弱み |
| --- | --- | --- | --- |
| Supermemory MCP | ◎ URL 登録 | マルチクライアント対応、外部サービス連携豊富 | ホスト利用時は外部保存 |
| Cipher | ○ セルフホスト | OSS、完全ローカル可 | 構築コスト |
| Serena | ◎ | Claude Code 専用で軽快 | 他クライアント共有不可 |

### B. ノート資産（中長期ストック）

| サービス | 導入 | 強み | 弱み |
| --- | --- | --- | --- |
| Obsidian | ○ | Markdown ローカル、GitHub 連携容易 | 標準では MCP 経由即席共有は弱い（対応プラグインあり） |
| Mem.ai | ○ | UX 優れる | 開発ツール連携は弱め |
```

---

### 該当箇所 4
L56-L62 （比較表の「導入のしやすさ」列）

```md
| **Serena**          | ◎                     | Claude Code 向け効率化ツール                 |
| **Claude Projects** | ◎                     | Claude 内でプロジェクト記憶                  |
| **ChatGPT Memory**  | ◎                     | ChatGPT 専用の記憶                           |
```

### 問題点
「導入のしやすさ」列の値（◎ / ○）の基準が示されていない。例えば Serena は「Claude Code に特化した効率化ツール」であり、Claude Code の利用者にとっては ◎、そうでないユーザにとっては Claude Code を導入する手間がかかるので ○ 以下、のような文脈依存の評価のはず。記事内でその基準が読み取れないため、比較の公平性に疑問が残る。

### 提案
表のキャプションに基準を明記する。

```md
**評価基準**:
- 導入のしやすさ: 初回セットアップに必要なステップ数と専門知識
  - ◎: 数コマンド or GUI 数クリックで完了
  - ○: 何らかの事前セットアップ（アカウント作成/別ツール前提など）が必要
  - △: セルフホストやコード修正が必要

| サービス | 導入のしやすさ | ... |
```

---

### 該当箇所 5
L64-L75 （関連記事紹介）

```md
### 関連記事紹介

「Serena と Cipher の比較」については、こちらの記事がとても参考になります。
👉 [Serena vs Cipher 比較記事（Zenn: minewo さん）](https://zenn.dev/minewo/articles/serena-vs-cipher-comparison)

この記事では、

- **Serena** は「Claude Code に特化した効率化」
- **Cipher** は「OSS MCP サーバとしての永続メモリ」

という住み分けが丁寧に解説されています。
```

### 問題点
紹介している「minewo さん」は、この記事自体と同一の執筆者（Zenn topics や記事末尾の関連記事リンクから同一アカウントの投稿であることが推測できる）である可能性が高い。「minewo さん」と他人の記事であるかのような三人称で紹介するのは、読者に誤った印象を与え、記事全体の信頼性を損なう恐れがある（自作自演の印象）。

### 提案
自著であることが事実なら、率直に「こちらの拙著でも解説しています」等の表現にする。

```md
### 関連記事

Serena と Cipher の詳細比較は、別記事で整理しています。

👉 [2分で決まる：Serena vs Cipher　思想とアーキテクチャ](https://zenn.dev/minewo/articles/serena-vs-cipher-comparison)

要点:
- **Serena** は「Claude Code に特化した効率化」
- **Cipher** は「OSS MCP サーバとしての永続メモリ」

本記事の Supermemory MCP は、この 2 つの中間に位置する「手軽さ＋横断利用」が強みです。
```

---

### 該当箇所 6
L29 および L98 （「個人開発」の定義と重複主張）

```md
個人開発においては、**「知識の資産化」** として最適です。
```

```md
**→ 個人開発では「Obsidian × Supermemory MCP」が最もバランスが良い選択肢**といえる。
```

### 問題点
記事全体で「個人開発に最適」「個人開発では最もバランスが良い」「個人開発ではまずこのハイブリッドを導入し」(L129) という主張が 4 箇所以上繰り返されているが、なぜチーム開発では不適切なのか、個人開発特有のどの条件がハイブリッドを最適化するのか、技術的な根拠が弱い。結論として繰り返し強調されているが、裏付けの章がなく、説得力が不足している。

### 提案
「個人開発特有の条件」を明示する短い章を設ける。

```md
### なぜ「個人開発」で特に効くのか

個人開発では次の条件が揃うため、Obsidian × Supermemory MCP の組み合わせが効率的です。

1. **意思決定者が1人**: 知識の資産化ポリシーを迷わず決められる
2. **ツール横断が前提**: Claude / Cursor / Gemini CLI を気分で切り替えるケースが多い
3. **ガバナンスコスト低**: ホスト版の外部保存リスクを個人判断で許容できる
4. **ノート増加が緩やか**: Obsidian のローカル資産で十分捌ける規模
```

---

### 該当箇所 7
L7 （frontmatter の topics）

```yaml
topics: ["MCP", "Obsidian", "AI", "Supermemory", "知識管理", "zennfes2025ai"]
published: true
```

### 問題点
(1) Zenn の `topics` は **英小文字+数字+ハイフンのみ** が推奨されており、大文字 (MCP, Obsidian, AI, Supermemory) や日本語 (知識管理) は、Zenn 上で正規化されるか、別トピックとして扱われてタグ検索に引っかかりづらい可能性がある。(2) `zennfes2025ai` は 2025 年のイベントタグと推測されるが、記事を 2026 年以降に読む読者には古いタグに見える。

### 提案
Zenn の推奨規約に沿って小文字化する。

```yaml
topics: ["mcp", "obsidian", "ai", "supermemory", "knowledge-management"]
published: true
```

> 日本語タグ「知識管理」を残したい場合、Zenn の既存タグを確認のうえ追加する。`zennfes2025ai` は対象記事の場合のみ残し、2026 年新規投稿では外す。

---

### 該当箇所 8
L123-L129 （まとめ）

```md
## まとめ

- **Obsidian** は個人の知識資産を残す「土台」
- **Supermemory MCP** は AI クライアント横断で活用する「即席メモリ」
- この組み合わせが「軽さ・継続性・横断性」のバランスに優れている

個人開発ではまずこのハイブリッドを導入し、必要に応じて Cipher や Serena を追加するのがベストプラクティスです 🚀
```

### 問題点
「まとめ」で "Obsidian × Supermemory MCP" の組み合わせを「ベストプラクティス」と断言しているが、本文中には「この 2 ツールを実際にどう連携させるか」の具体的な運用例が欠けている。例えば Obsidian の Markdown を Supermemory MCP に取り込む手順、同期するのかリンクするのかといった技術的な記載がない。読者は「ワークフロー」というタイトルを読みに来たが、実は「比較とおすすめ」記事であった、という印象を受けやすい。

### 提案
まとめの直前か、Step3 の代わりに「連携の具体例」を追加する。

```md
### Step4: Obsidian のノートを Supermemory に取り込む

現状、Obsidian と Supermemory MCP の直接同期はありません。次のいずれかで連携します。

1. **手動インポート**: Obsidian の Markdown をコピーし、Supermemory ダッシュボードの「Add memory」へ貼り付け
2. **URL 経由**: Obsidian Publish で公開したページ URL を Supermemory に登録
3. **API 経由**: Supermemory API (`POST /v3/memories`) を cron で呼び、Vault 配下の `.md` を一括送信

```bash
curl -X POST https://api.supermemory.ai/v3/memories \
  -H "Authorization: Bearer $SUPERMEMORY_API_KEY" \
  -H "Content-Type: application/json" \
  -d @note.json
```
```

---

## 総合評価

### 良い点
- **明確な読者像**: 「個人開発者」という具体的な読者ターゲットが最初から設定されている
- **比較の網羅性**: Supermemory / Cipher / Serena / Obsidian / Claude Projects / ChatGPT Memory / Mem.ai と比較対象が広い
- **導入ステップの簡潔さ**: Step1〜Step3 で要点が整理されており、長すぎない
- **自社メディア/関連記事の分離**: 読者が次に辿る記事が 3 本明示されている

### 改善点
- **MCP 登録コマンドの再現性**: URL の取得方法、クライアント種別の具体化
- **比較軸の分離**: MCP サーバとノートアプリを同じ表で比較する構造を見直し
- **「100+ クライアント」数字の出典**: 公式ソースへのリンク追加
- **同一著者記事への言及**: 他人の記事であるかのような書き方を見直し
- **Obsidian × Supermemory 連携の具体化**: Markdown をどう渡すかの技術的詳細

### 推奨アクション
1. **Step2 の補強**: URL 取得手順、Claude Desktop/Code の区別、手動設定のフォールバック追記
2. **比較表の再設計**: 「MCP サーバ」と「ノートアプリ」を別表に分離
3. **個人開発推しの根拠追加**: 「なぜ個人開発で特に効くのか」の短章を追加
4. **連携ステップ (Step4) 追加**: Obsidian Vault → Supermemory のデータ移動手順
5. **frontmatter topics の小文字化**: Zenn の推奨規約に合わせる

### SEO観点での改善提案
- **タイトル最適化**: 「ObsidianとSupermemory MCPをつなぐ知識管理ワークフロー」は分かりやすいが、「MCP」検索意図の読者を惹きつけるため「MCP活用事例：Obsidian × Supermemory で AI クライアント横断の知識管理を作る」等に調整すると流入が増えうる
- **メタディスクリプション**: 「はじめに」の 3 つの悩みポイントを 150 字程度に圧縮して冒頭要約化
- **キーワード分布**: 「MCP」「Obsidian」は十分登場するが、「AI クライアント共通メモリ」「個人開発 ナレッジ管理」などロングテールキーワードを h3 で意識すると検索対応度が上がる
- **内部リンク**: 「関連記事」への 3 本のリンクは良い。本文中にも「Serena と Cipher の詳細は拙著参照」のインライン誘導があるため、同じパターンで「Growth Lab」や「PlanGate」記事への内リンクを本文途中に設置すると回遊率が上がる
- **公開日更新の明示**: MCP エコシステムは変化が激しいため、記事冒頭か末尾に「最終更新: YYYY-MM-DD」を明記し、情報鮮度をシグナル化する

---

*レビュー実施者: @claude*  
*レビュー実施日: 2026-04-15*
