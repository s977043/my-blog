# articles/note-wxr-import-structural-validation.mdの記事レビュー

## 🚩 レビュー方針

親 ISSUE #11 のレビュー観点（誤字脱字／用語誤用／文章わかりやすさ／内容重複／Web記事として読みやすい構成／技術記載の正確性／読者ニーズ充足／SEO 改善）に加え、PR #69 で追加された「Zenn 読みやすさ観点 8 項目」を確認基準として適用しました。本記事は 2026-04-18 の note WXR インポート失敗（PR #62）を題材とした実体験ベースの技術デバッグ記事であり、想定読者は note / WXR / XML 検証に関心のあるエンジニアおよび AI 駆動でドキュメント生成しているエンジニアです。したがって、(1) 原因特定のストーリー性、(2) 検証スクリプト `verify_wxr.py` の再現可能性、(3) 記事内のコマンド・パス・コードが実リポジトリの実装（`.claude/skills/note-export-import/scripts/verify_wxr.py`）と一致しているか、の 3 点を重視してチェックしました。著者の既出記事（`ai-dev-guardrail-plangate-river-reviewer.md` / `engineering-process-improvement-skill.md`）で定着している `:::message` 冒頭要約 + 姉妹記事リンクの構成とも揃っているかを観点に含めます。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @claude | - タイトル訴求力・SEO キーワード<br>- 想定読者との整合性・冒頭要約のフック<br>- 見出し設計と派生論点の位置 | - [x] 済 |
| **Web編集者視点** | @claude | - 誤字脱字・表現統一（常体/敬体）<br>- 文章の明確性・重複表現<br>- 硬い漢字タイトルの言い換え | - [x] 済 |
| **Webエンジニア視点** | @claude | - コマンド・パスが実リポジトリと一致<br>- コードスニペットの実行可能性<br>- 技術記述の正確性（XML 仕様・importer 挙動） | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい（h2 のみ、h3 無し）
- [x] 表に長文が入っていない
- [x] 画像パスが Zenn Preview で解決する（画像なし）
- [x] 公式リンクはクリック可能（外部リンクなし、指摘 9 参照）
- [x] コードブロックの言語指定が適切（`bash` / `python` / `xml` が明示）
- [x] メッセージボックス（:::message）の適切な使用（冒頭 L9-L15 に「この記事で得られること」あり）

### Zenn 読みやすさチェック（構成・圧縮）
- [x] 冒頭で記事の価値を先出ししている（L9-L15 の `:::message`）
- [x] 詳細群の前に全体像を提示している（L23-L28 の 4 項目リストで「表面的検証がすべて通った」を先出し）
- [x] 派生論点（AI 駆動開発観点）が本筋の後ろに配置されている（L166 の「AI 生成ドキュメントに書かれた『公式形式準拠』は自動では信用しない」が教訓セクション末尾）
- [x] コマンド/コード断片が本文を埋めず、narrative が優先されている
- [ ] 英語ラベルに日本語副題が添えられている（`WXR` / `well-formed` / `セマンティクス` 等、初登場時の日本語補足にばらつき。指摘 3 参照）
- [ ] 各セクションの要点が 1 行で先出しされている（「根本原因 1 / 2」「検証スクリプトの設計」等は詳細に直接入っており、セクション冒頭の 1 行サマリが不足。指摘 6 参照）
- [x] まとめ前に記事の主張を再掲している（L159 「公式エクスポートがあるなら、実物と diff しろ」）
- [ ] 硬い漢字タイトル（「根本原因 1」「根本原因 2」「回帰検出デモ」等）を柔らかい表現に言い換える余地あり（指摘 8 参照）

---

## 指摘コメント

### 該当箇所 1
L103-L108 （`verify_wxr.py` のパス記述が実リポジトリと不一致）

```bash
python3 scripts/verify_wxr.py articles_note/build/import-*.xml
```

### 問題点

記事では `verify_wxr.py` を `scripts/verify_wxr.py` として紹介しているが、実リポジトリでは `.claude/skills/note-export-import/scripts/verify_wxr.py` に配置されている。また L143 の回帰検出デモでも同じく `scripts/verify_wxr.py` 表記となっている（`/tmp/regression-demo.xml` というサンプル出力込み）。記事内の他のコマンド（`xmllint --noout`、`ElementTree.parse`）は読者の環境で直接実行できるコマンドだが、`verify_wxr.py` だけはリポジトリ固有のスクリプトであり、パスがずれていると読者が「どこにあるのか」で詰まる。技術記事の再現性としては致命的な齟齬。

### 提案

実リポジトリの配置パスを明示し、かつ `scripts/` エイリアスを使いたい場合はシンボリックリンクか PATH 追加の前提を注記する。

```bash
# 実リポジトリでの配置
python3 .claude/skills/note-export-import/scripts/verify_wxr.py \
  articles_note/build/import-*.xml

# よく使うなら PATH か alias を張っておく
alias verify-wxr='python3 .claude/skills/note-export-import/scripts/verify_wxr.py'
verify-wxr articles_note/build/import-*.xml
```

L143 のデモ出力側も同様に `.claude/skills/note-export-import/scripts/verify_wxr.py /tmp/regression-demo.xml` と揃える。

**優先度: High**（記事の中核である検証スクリプトの所在が読者に伝わらない）

---

### 該当箇所 2
L51-L83 （「14 フィールド」の数え方と記載の不一致）

```xml
<item>
  <title>...</title>
  <link>...</link>
  <dc:creator>みね</dc:creator>
  <guid isPermaLink="false">nxxxxxxxxxxxx</guid>
  <description></description>
  <content:encoded>...</content:encoded>
  <excerpt:encoded></excerpt:encoded>
  <wp:post_id>1</wp:post_id>
  ...
  <wp:is_sticky>0</wp:is_sticky>
</item>
```

### 問題点

本文（L51 の見出し、L53、L81、L172 など）では一貫して「`wp:*` 14 フィールド」としているが、**XML 例示に並んでいる `wp:*` タグは数えると 14 個**（post_id / post_date / post_date_gmt / post_modified / post_modified_gmt / comment_status / ping_status / post_name / status / post_parent / menu_order / post_type / post_password / is_sticky）で、数値自体は正しい。ただし読者が XML 例から目視で数える際に、`excerpt:encoded` が `wp:*` ではなく `excerpt` 名前空間であること、`guid` や `description` が `wp:*` ではないことに気付かず「20 個近く並んでいるのに 14 とは？」となる可能性が高い。現状の例示では `wp:*` とそれ以外が混在しており、14 フィールドの根拠が図で示されていない。

L145-L149 のエラー出力では確かに 14 個が列挙されているため、記事内で自己整合はしているが、本文と XML 例示の間に「`wp:*` は 14 個、残りは WordPress 共通タグ」の明示が無い。

### 提案

XML 例示のコメントで `wp:*` と非 `wp:*` を区別するか、14 個の列挙を 1 箇所に集約する。

```xml
<item>
  <!-- 共通タグ（WordPress 非依存） -->
  <title>...</title>
  <link>...</link>
  <dc:creator>みね</dc:creator>
  <guid isPermaLink="false">nxxxxxxxxxxxx</guid>
  <description></description>
  <content:encoded>...</content:encoded>
  <excerpt:encoded></excerpt:encoded>

  <!-- ここから wp:* 14 フィールド（これが無いと note importer が post として認識しない） -->
  <wp:post_id>1</wp:post_id>
  <wp:post_date>2026-04-18 09:15:18</wp:post_date>
  <wp:post_date_gmt>2026-04-18 00:15:18</wp:post_date_gmt>
  <wp:post_modified>...</wp:post_modified>
  <wp:post_modified_gmt>...</wp:post_modified_gmt>
  <wp:comment_status>open</wp:comment_status>
  <wp:ping_status>open</wp:ping_status>
  <wp:post_name>...</wp:post_name>
  <wp:status>publish</wp:status>
  <wp:post_parent>0</wp:post_parent>
  <wp:menu_order>0</wp:menu_order>
  <wp:post_type>post</wp:post_type>
  <wp:post_password></wp:post_password>
  <wp:is_sticky>0</wp:is_sticky>
</item>
```

**優先度: High**（記事タイトル級の数値の根拠が図中で追えない問題）

---

### 該当箇所 3
L19-L31 （「はじめに」の冒頭と英略語の補足不足）

```markdown
## はじめに

note.com が提供する WXR（WordPress eXtended RSS）インポート機能を使って、AI エージェントが生成した記事を下書きに投入しようとしたところ、「インポートにエラーが発生したため、記事の読み込みに失敗しました」で止まりました。
```

### 問題点

冒頭で `WXR（WordPress eXtended RSS）` の展開は行われているが、本文後半で登場する用語（L34 の `well-formed`、L49 の `セマンティクス`、L85 の `importer`、L98 の `構造 diff`）には日本語副題が添えられておらず、Zenn 読みやすさ観点 5「英語ラベルに日本語副題が添えられているか（初登場時）」を満たしていない。特に `well-formed`（整形式）は XML 仕様用語で、「整形式（syntax が閉じている状態）」か「構文的に正しい」の説明が無いと、XML Schema の `valid`（妥当）との違いが曖昧なまま記事が進む。本記事の核心は「well-formed ≠ valid ≠ note が受け取れる」という距離感のため、ここを最初に言語化する価値は高い。

### 提案

L34 の「表面的な検証はすべて通る」節の冒頭を補強する。

```markdown
## 表面的な検証はすべて通る

まずは well-formed 性（= XML の構文が閉じているかどうか）の確認から。`xmllint --noout` は XML の構文チェックには十分ですが、**セマンティクス（意味的な整合性、つまり「その要素が importer の期待どおりに中身を持っているか」）には踏み込まない** ツールです。
```

同様に L85 の `importer` 初登場時にも「(= note 側で WXR を取り込むプログラム)」を 1 回だけ補足する。

**優先度: Medium**

---

### 該当箇所 4
L89-L93 （著者フィールド対応表の論理順序）

```markdown
| 場所 | WordPress 一般慣例 | note 公式エクスポート |
|---|---|---|
| item `<dc:creator>` | login ID（`mine_unilabo`） | **表示名（`みね`）** |
| channel `<wp:author_display_name>` | 表示名（`みね`） | **login ID（`mine_unilabo`）** |
```

### 問題点

対応表の見出しで左が「WordPress 一般慣例」、右が「note 公式エクスポート」となっているが、本記事の主題は「note の実装に合わせる」ことであり、読者が参照すべき正解は右列。しかし表の視線誘導（左→右）では「まず慣例を見てから note は逆」と読むことになり、**note に寄せるべき値** がどちらかが一瞬分かりにくい。加えて列名「note 公式エクスポート」は太字にもなっておらず、左右の優先順位が記号的に示されていない。

もう 1 点、`<wp:author_display_name>` は WordPress 仕様的には `<wp:author>` ブロック配下の子要素であり、item 直下ではなく channel 直下の `<wp:author>` 配下に置かれる。L92 の「channel `<wp:author_display_name>`」は概ね正しいが、厳密には `<wp:author>` の中の `<wp:author_display_name>` である点が省略されている。読者が自分の WXR 構造を確認する際に迷いやすいポイント。

### 提案

表の左右を入れ替え（正解側を左に）、かつパスを完全形で示す。

```markdown
| 場所 | note 公式エクスポート（これが正解） | WordPress 一般慣例（参考） |
|---|---|---|
| `<item>` 直下 `<dc:creator>` | **表示名（`みね`）** | login ID（`mine_unilabo`） |
| `<channel>` > `<wp:author>` > `<wp:author_display_name>` | **login ID（`mine_unilabo`）** | 表示名（`みね`） |
```

**優先度: Medium**

---

### 該当箇所 5
L112-L116 （`verify_wxr.py` のチェック項目リストが実装と不整合）

```markdown
1. XML well-formed（`ElementTree.parse` できる）
2. `<channel>` 直下タグ集合が公式と一致
3. 各 `<item>` 直下の `wp:*` タグ集合が公式と一致
4. `<dc:creator>` が login ID 形式なら警告（`AGENT_LEARNINGS.md` の罠エントリを明示引用）
5. `<img src>` が https で始まる（note は相対パス・http では画像を取り込めない）
```

### 問題点

項目 2 は「`<channel>` 直下タグ集合が公式と一致」と書かれているが、実装（`verify_wxr.py` L54-L55）では `channel_top_tags` が **`item` を除く channel 直下タグ集合** を返している。記事の表現だと `item` も含まれるように読めてしまい、読者が「チェック内容は一致判定なのか欠落判定なのか」で混乱する。実装では `missing = ref_ct - gen_ct`（参照側にあって生成側に無いタグ）を検出しており、**欠落検出であって完全一致チェックではない**。同様に項目 3 も「一致」ではなく「欠落検出」が正確。

また項目 5 の「note は相対パス・http では画像を取り込めない」は、実装上は `https://` で始まるかどうかだけを見ており（L132-L139）、`http://`（平文 HTTP）の画像は警告対象になる。本文の「相対パス・http では取り込めない」は、note の実挙動としては正しいが、`verify_wxr.py` が具体的に何を条件にしているかは「https で始まる」が正確な実装仕様。

### 提案

実装に合わせて「一致」→「欠落検出」に表現を統一し、項目 5 は条件を明示する。

```markdown
1. XML well-formed（`ElementTree.parse` できる）
2. `<channel>` 直下タグ集合（`<item>` を除く）に、公式側にあって生成側に無いタグが無いか
3. 各 `<item>` 直下の `wp:*` タグ集合に、公式側にあって生成側に無いタグが無いか
4. `<dc:creator>` が小文字英数＋アンダースコアのみ（= login ID っぽい）なら警告
5. `<img src>` が `https://` で始まっているか（note は相対パス・`http://` いずれも取り込み不可）
```

**優先度: High**（「このスクリプトは何をチェックしてくれるのか」の認識が、読者が採用を判断する核心情報のため）

---

### 該当箇所 6
L32-L50 / L51-L83 / L96-L136 （各 h2 セクション冒頭の要点先出し不足）

```markdown
## 表面的な検証はすべて通る

まずは well-formed 性の確認から。`xmllint --noout` は XML の構文チェックには十分ですが ...
```

### 問題点

Zenn 読みやすさ観点 6「各セクションの要点が 1 行で先出しされているか」に照らすと、本記事の各 h2 はタイトルは良いが、本文がいきなり詳細説明から始まり、「このセクションの結論」が段落の末尾に配置されている。たとえば「表面的な検証はすべて通る」節では、結論の「構文的に有効でも要素が欠けていれば弾きます」が L49 の節末に置かれており、読者は 3 つのコマンド例を読んだ後にようやく主張に到達する。「根本原因 1」「根本原因 2」「検証スクリプト `verify_wxr.py` の設計」「回帰検出デモ」も同様で、いずれも節冒頭に 1 行サマリが無い。

### 提案

各 h2 の冒頭に、そのセクションの結論を 1 行で先出しする。

```markdown
## 表面的な検証はすべて通る

**結論から言うと、XML の構文チェック系ツールはどれも「note が受け取れるか」を教えてくれません。**

まずは well-formed 性の確認から。`xmllint --noout` は XML の構文チェックには十分ですが、**セマンティクス（意味的な整合性）には踏み込まない** ツールです。

（以下続く）
```

```markdown
## 根本原因 1: `<item>` 配下 `wp:*` 14 フィールドの欠落

**note importer は WXR の `<item>` を post として認識するために、`wp:post_type` や `wp:status` を含む 14 個の `wp:*` フィールドを必須にしています。**

公式エクスポートを解析してみると、各 `<item>` に 14 個の `wp:*` フィールドが必ず揃っていました。
```

**優先度: Medium**（読みやすさに直結するが、本文の情報量は十分なため）

---

### 該当箇所 7
L138-L155 （回帰検出デモの再現性）

```bash
$ python3 scripts/verify_wxr.py /tmp/regression-demo.xml

[ERROR] <item> に必須 wp:* タグが欠落:
  ['comment_status', 'is_sticky', 'menu_order', 'ping_status',
   'post_date', 'post_date_gmt', 'post_id', 'post_modified',
   'post_modified_gmt', 'post_name', 'post_parent', 'post_password',
   'post_type', 'status']
[WARN] <dc:creator> が login ID 形式 ('mine_unilabo'): 表示名を入れるのが note 公式形式。

exit: 1
```

### 問題点

- `/tmp/regression-demo.xml` がどのように生成されたかの手順が本文に無く、読者が回帰検出デモを再現できない。「修正前の `md_to_wxr.py` で生成した WXR」とあるが、どのコミットの `md_to_wxr.py` か、どうロールバックして生成するのかが不明。
- `verify_wxr.py` の実装（L107-L109、L170-L174）では、参照 WXR が見つからない場合は `[FATAL] 参照WXR が見つからない` で早期 return する設計になっているが、デモ出力には参照 WXR の情報（例: `checking: ...` / `against: ...` の 2 行）が欠けている。実際に実行すると L163-L164 の `print(f"checking: {args.generated}")` と `print(f"against : {ref}")` が必ず出力される。このため、記事のデモ出力は実際の `verify_wxr.py` の出力と厳密には一致しない（読者が再現時に「本文と出力が違う」と感じる）。
- exit code は実装上 `return 1` で shell の `$?` に反映されるが、記事の `exit: 1` 表記はスクリプト自体が `exit: 1` と出力しているように見える。実際には `$?` 確認 (`echo $?`) の結果であり、注釈が必要。

### 提案

再現手順を 1 ブロックで閉じ、実際の出力を正確に載せる。

```markdown
## 回帰検出デモ: 旧スクリプトに対して実行

`md_to_wxr.py` の PR #62 修正前コミット（`af68894` 時点）で生成した WXR に対して `verify_wxr.py` を実行すると、以下の出力が得られます。

\`\`\`bash
# PR #62 前の md_to_wxr.py で WXR を再生成（回帰デモ用）
git show af68894:.claude/skills/note-export-import/scripts/md_to_wxr.py > /tmp/md_to_wxr_old.py
python3 /tmp/md_to_wxr_old.py articles_note/new/<slug>.md --out /tmp/regression-demo.xml

# 検証実行
python3 .claude/skills/note-export-import/scripts/verify_wxr.py /tmp/regression-demo.xml
\`\`\`

\`\`\`
checking: /tmp/regression-demo.xml
against : /tmp/note-verify/note-XXXXXX.xml

[ERROR] <item> に必須 wp:* タグが欠落:
  ['comment_status', 'is_sticky', 'menu_order', 'ping_status',
   'post_date', 'post_date_gmt', 'post_id', 'post_modified',
   'post_modified_gmt', 'post_name', 'post_parent', 'post_password',
   'post_type', 'status']
[WARN] <dc:creator> が login ID 形式 ('mine_unilabo'): 表示名を入れるのが note 公式形式。
         AGENT_LEARNINGS.md 2026-04-18 後段エントリ参照
\`\`\`

終了コードは `1`（`echo $?` で確認）で、CI では非ゼロ終了として失敗扱いにできます。
```

**優先度: Medium**（再現性の担保と、実際の出力との乖離の解消）

---

### 該当箇所 8
L51 / L85 / L138 （硬い漢字タイトル）

```markdown
## 根本原因 1: `<item>` 配下 `wp:*` 14 フィールドの欠落

## 根本原因 2: 著者フィールドの対応が WordPress 慣例と逆

## 回帰検出デモ: 旧スクリプトに対して実行
```

### 問題点

Zenn 読みやすさ観点 8「硬い漢字タイトルを柔らかく言い換えているか」に照らすと、「根本原因 1 / 2」「回帰検出デモ」は論文的で読み手にやや硬い。Zenn の読者（実装者）には、デバッグ記事としての narrative 性が伝わる見出しのほうが馴染む。特に「根本原因 1 / 2」は番号付きのリストとして扱われているが、「原因 1 はこうだった」という過去形の体験談寄り見出しにするとストーリー性が出る。

### 提案

```markdown
## 原因その 1: `<item>` に `wp:*` 14 フィールドが丸ごと抜けていた

## 原因その 2: 著者フィールドの使い方が WordPress 慣例と逆だった

## 実演: 修正前のスクリプトで本当に検出できるか
```

タイトル側で「原因は 2 つあった」「本当に検出できるか」と問いを立てると、読者は次の章を読む動機を得られる。

**優先度: Low**（本文は十分読みやすいため、体験向上目的）

---

### 該当箇所 9
L168-L178 （まとめセクションの外部リンク / 姉妹記事リンクの不在）

```markdown
## まとめ

note WXR のインポート失敗は、以下の 3 点を踏まえれば再発しにくくなります。

- **`<item>` 配下の `wp:*` 14 フィールド** を公式エクスポートで実測して必須化
- **著者フィールドの対応（`dc:creator` = 表示名 / `wp:author_display_name` = login）** を記憶ではなく実物で確認
- **公式エクスポートとの構造 diff** を CI / ローカルゲートにする

`xmllint --noout` は構文検証。構造検証（セマンティクス）には別途スクリプトが要る、という距離感が今回のいちばんの収穫でした。

同じ note に WXR をインポートする方のデバッグ時間を減らせれば幸いです。
```

### 問題点

- L17 で「姉妹記事: note 側の運用観点は note 版に分けて書く予定です」と宣言しているにもかかわらず、まとめ側で姉妹記事へのアンカーがない。公開順序次第では片側リンクでも良いが、最低限「note 版（予定）」のプレースホルダで意図を残すのが Zenn の導線設計上望ましい。
- 記事中で言及されている外部リソース（WordPress WXR 仕様、note 公式エクスポート機能の案内ページ、`xmllint` 公式ドキュメント）への公式リンクが 1 本も無い。SEO 観点では外部参照リンクの不足で記事の権威性が落ちやすく、また読者の追跡調査も困難になる。
- `AGENT_LEARNINGS.md` が L94 と L150 で引用されているが、本記事の読者（社外含む）はこのファイルを参照できないため、引用先の要点を本文内に抜粋するか、参照元のコミットリンク（`git show` 等）を補足する必要がある。

### 提案

```markdown
## まとめ

（中略・箇条書きはそのまま）

## 関連リソース

- 姉妹記事（運用観点）: note 版「（タイトル / 公開時追記）」
- WordPress WXR 仕様: [WXR File Format - WordPress Codex](https://codex.wordpress.org/Tools_Export_Screen) （※ 仕様は公式実物 diff で補完することを推奨）
- note 公式エクスポート機能: [note ヘルプセンター - 記事のエクスポート](https://www.help-note.com/)（実際の公開ヘルプ URL は公開前に確認）
- 本記事のスクリプト実装: `.claude/skills/note-export-import/scripts/verify_wxr.py`（PR #62 / #63 参照）
```

**優先度: Medium**（SEO + 導線設計、姉妹記事ペア展開の依頼背景に対応）

---

### 該当箇所 10
L34-L40 （`xmllint --noout` のコメント表記）

```bash
$ xmllint --noout import-ai_agent_operations_opinion_note.xml
# 出力なし → 構文的には OK
```

### 問題点

コードブロック内で `$` プロンプトと `#` コメントが混在しており、実際に bash にそのまま貼り付けると `$` と `#` は可視化用記号であって実行されるべきではない（`$` 付きで貼ると `command not found`、`#` 付きの行は安全だが他のブロックと書式が揃っていない）。記事の他のコードブロック（L103、L121-L134、L143）は `$` プロンプトを使っていないため、本ブロックだけ書式が不統一。

また、ファイル名 `import-ai_agent_operations_opinion_note.xml` は特定記事のファイル名そのものであり、一般読者には「どこから生成されたファイルか」が伝わりにくい。プレースホルダ表記（`<your-wxr>.xml`）にするか、補足コメントを添える方が再現しやすい。

### 提案

```bash
# 自分の WXR ファイルで確認する場合
xmllint --noout articles_note/build/import-<slug>-YYYYMMDD-HHMM.xml
# 出力が無ければ構文的には OK（= well-formed）
```

```python
from xml.etree import ElementTree as ET
# パース時に例外が出なければ Python 側からは扱える
tree = ET.parse("articles_note/build/import-<slug>-YYYYMMDD-HHMM.xml")
```

**優先度: Low**（機能に影響はないが、体裁の統一）

---

## 総合評価

### 良い点

- **体験ベースの説得力**: 2026-04-18 のインポート失敗という実体験を、`xmllint` ✅ / `ElementTree` ✅ / 画像 HEAD ✅ / channel スキーマ一致 ✅ の 4 項目で「表面検証がすべて通った」と冒頭で提示することで、読者が「自分も同じ失敗をしそう」という共感から入れる構成。Zenn で最も読まれる「自分で踏んだ罠の記事」の王道パターンを押さえている。
- **主張の抽出が明確**: L159 の「公式エクスポートがあるなら、実物と diff しろ」が一文で記憶に残る形になっており、Zenn 読みやすさ観点 7（まとめ前の主張再掲）を満たす。
- **set 差分による検出アイデアが実践的**: L121-L134 の `set` 演算 1 行で 14 フィールド欠落を一発検出する設計は、読者が自分のツールにも応用しやすく、技術記事として貢献度が高い。
- **冒頭 `:::message` が機能している**: L9-L15 の「この記事で得られること」3 点が記事の価値を正確に先出ししており、著者の他記事（`ai-dev-guardrail-plangate-river-reviewer.md`）と書式が揃っている。
- **AI 駆動開発側への接続**: L166 の「AI 生成ドキュメントに書かれた『公式形式準拠』は自動では信用しない」が、本記事を単なる WXR デバッグ記事から AI 時代の検証ゲート記事に引き上げている。topics の `ai駆動開発` と呼応しており、SEO 観点でも妥当。

### 改善点

- **パス表記の不一致**（指摘 1）: `scripts/verify_wxr.py` と実配置 `.claude/skills/note-export-import/scripts/verify_wxr.py` の齟齬。技術記事の再現性として最優先で修正すべき。
- **チェック項目リストと実装の表現不整合**（指摘 5）: 「一致」ではなく「欠落検出」が正確。採用判断の核心情報なので High 優先度。
- **14 フィールドの根拠提示**（指摘 2）: XML 例示に `wp:*` とそれ以外が混在しており、読者が目視で 14 の根拠を追えない。
- **各セクション冒頭の要点先出し不足**（指摘 6）: Zenn 読みやすさ観点 6 に未対応のセクションが複数。
- **姉妹記事リンク / 外部公式リンクの不在**（指摘 9）: 依頼背景（姉妹 note 記事とのペア展開）への対応が本文内で閉じていない。

### 推奨アクション

1. **High 優先度 3 件の修正（指摘 1・2・5）**: パス修正、14 フィールド根拠の図示、チェック項目リストの表現修正。この 3 件で技術記事としての正確性水準に到達する。
2. **Medium 優先度 4 件の修正（指摘 3・4・6・7・9）**: 英略語の補足、著者対応表の向き替え、セクション冒頭の要点先出し、回帰デモの再現性、関連リソースセクションの追加。公開後の追補でも可だが、指摘 9 は姉妹記事公開前に対応する方がペア展開の意図が伝わる。
3. **Low 優先度 2 件（指摘 8・10）**: 硬い見出しの言い換え、コードブロックの書式統一。最終仕上げで対応。
4. **検証スクリプトへの読者導線**: PR #62 / #63 / この記事 をリンクで相互接続し、読者が「いつ入った機能か」を辿れるようにする。

### 公開可否と条件

**条件付き公開可**。High 優先度 3 件（指摘 1・2・5）を反映すれば Zenn 公開可能な水準。特に指摘 1（パス不一致）は修正なしで公開すると読者が再現に詰まるため、公開前の修正を強く推奨。Medium 優先度のうち指摘 9（関連リソース）は姉妹 note 記事の公開順序と合わせてタイミング調整すれば良く、記事単体としての完成度は High 3 件の修正で達成できる。

### SEO観点での改善提案

- **タイトル**: 現状「xmllintが通るのにnoteが弾く — WXRインポート失敗から作った構造検証スクリプト」は 40 文字程度で訴求力があり、「xmllint が通るのに」という矛盾提示は Zenn 読者のクリックを誘う良い形。ただし `note` は小文字ドメイン表記のため、検索クエリ「note WXR インポート 失敗」「note インポートエラー」とのマッチを高めるため、topics に `note インポート` 系の語を追加する余地あり（現状 `note` のみ）。
- **topics**: `["wxr", "note", "python", "xml", "ai駆動開発"]` は妥当だが、`wordpress` を追加すると WordPress 経由で note にインポートしたい層にリーチできる。また `ci` / `ガードレール` / `検証` 系のトピックを 1 つ入れると「AI 駆動開発の検証ゲート」文脈からの流入が増える可能性がある。
- **内部リンク**: 著者の既出記事のうち、`ai-dev-guardrail-plangate-river-reviewer.md`（2 層ガード設計）、`engineering-process-improvement-skill.md`（振り返り改善スキル）は本記事のテーマと強く接続する。まとめ or 関連リソースセクションで 1〜2 本リンクすれば回遊率の向上が見込める。
- **見出し階層**: 現状は h2 のみ 8 セクションで構成されており、目次ジャンプは機能する。指摘 6 のセクション冒頭 1 行サマリを入れることで、目次から飛んだあとの可読性も高まる。
- **冒頭フック**: L23-L28 の「これだけ通しても、note は受け付けてくれませんでした」は読者の興味を強く掴む良いフック。`:::message` と合わせて、記事の入口は十分機能している。

---

*レビュー実施者: @claude*
*レビュー実施日: 2026-04-18*
