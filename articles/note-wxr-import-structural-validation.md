---
title: "xmllintが通るのにnoteが弾く — WXRインポート失敗から作った構造検証スクリプト"
emoji: "🔬"
type: "tech"
topics: ["wxr", "note", "python", "xml", "ai駆動開発"]
published: true
---

:::message
**この記事で得られること**

- `xmllint` や `ElementTree` で通る WXR が note 側で弾かれる原因の特定方法
- `<item>` 配下に必要な `wp:*` 14 フィールドの実測リストと、著者フィールドの対応関係
- 公式エクスポートとの diff を必須ゲートにする検証スクリプト `verify_wxr.py` の設計と、回帰検出の実例
:::

> 姉妹記事: note 側の運用観点は note 版に分けて書く予定です。本記事は Zenn 向けに技術デバッグ / スクリプト実装に寄せています。

## はじめに

note.com が提供する WXR（WordPress eXtended RSS）インポート機能を使って、AI エージェントが生成した記事を下書きに投入しようとしたところ、「インポートにエラーが発生したため、記事の読み込みに失敗しました」で止まりました。

驚いたのは、**私が用意していた検証はすべて合格していた** こと。

- `xmllint --noout` で well-formed 判定 ✅
- `ElementTree.parse` で構造解析 ✅
- 画像 URL の HEAD リクエスト（`curl -I`）で 200 OK ✅
- 公式エクスポートのスキーマと channel レベルで一致 ✅

これだけ通しても、note は受け付けてくれませんでした。この記事は、原因特定と再発防止のための **構造検証スクリプト** の設計を、実際のコード付きで共有するものです。

## 表面的な検証はすべて通る

まずは well-formed 性の確認から。`xmllint --noout` は XML の構文チェックには十分ですが、**セマンティクス（意味的な整合性）には踏み込まない** ツールです。

```bash
$ xmllint --noout import-ai_agent_operations_opinion_note.xml
# 出力なし → 構文的には OK
```

同様に、Python の `ElementTree.parse` も構造解釈の深さは不十分です。

```python
from xml.etree import ElementTree as ET
tree = ET.parse("import-ai_agent_operations_opinion_note.xml")
# 例外なし → パース可能
```

これらで通ると「大丈夫そう」と判断してしまいがちですが、note の importer は **WordPress WXR 仕様に準拠した post メタデータ** を要求しており、構文的に有効でも要素が欠けていれば弾きます。

## 根本原因 1: `<item>` 配下 `wp:*` 14 フィールドの欠落

公式エクスポートを解析してみると、各 `<item>` に **14 個の `wp:*` フィールド** が必ず揃っていました。

```xml
<item>
  <!-- 共通タグ（WordPress 非依存 / RSS + Dublin Core + content / excerpt 拡張） -->
  <title>...</title>
  <link>...</link>
  <dc:creator>みね</dc:creator>
  <guid isPermaLink="false">nxxxxxxxxxxxx</guid>
  <description></description>
  <content:encoded>...</content:encoded>
  <excerpt:encoded></excerpt:encoded>

  <!-- ここから wp:* の 14 フィールド。これが無いと note importer は post として認識しない -->
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

私の生成スクリプトは `<content:encoded>` までしか出力しておらず、`wp:*` フィールドは **ゼロ個** でした。note importer はこの状態の `<item>` を post として認識せず、読み込みを中断します。

**特に重要なのは `wp:post_type=post` と `wp:status`** です。これらが無いと記事種別が判定できず、何を作成すべきか importer が決められません。

## 根本原因 2: 著者フィールドの対応が WordPress 慣例と逆

もうひとつの発見は、note の著者フィールドの使い方が **WordPress 一般慣例と逆** だったことです。

| 場所 | WordPress 一般慣例 | note 公式エクスポート |
|---|---|---|
| item `<dc:creator>` | login ID（`mine_unilabo`） | **表示名（`みね`）** |
| channel `<wp:author_display_name>` | 表示名（`みね`） | **login ID（`mine_unilabo`）** |

私の初回実装は WordPress 慣例に従っていたため、反転したペアを生成していました。事前学習として書き残していた `AGENT_LEARNINGS.md` のエントリも推測ベースで「`dc:creator` = login ID」と断定しており、**実測と逆の学びを次のセッションの罠として残していた** ことも判明しました。

## 検証スクリプト `verify_wxr.py` の設計

同じ罠を二度踏まないために、**公式エクスポートとの構造 diff を必須ゲート** にする検証スクリプトを書きました。標準ライブラリだけで動きます。

### 入力と出力

実リポジトリでは `.claude/skills/note-export-import/scripts/verify_wxr.py` に配置しています。

```bash
python3 .claude/skills/note-export-import/scripts/verify_wxr.py \
  articles_note/build/import-*.xml

# よく使うなら alias を張っておく
alias verify-wxr='python3 .claude/skills/note-export-import/scripts/verify_wxr.py'
verify-wxr articles_note/build/import-*.xml
```

- 自動検出: `articles_note/export/<date>/*.zip` から公式エクスポートを取り出して参照
- 明示指定: `--reference <path>` で参照ファイルを固定可能
- exit code: 0（合格）/ 1（構造差分あり）

### チェック項目

1. XML well-formed（`ElementTree.parse` できる）
2. `<channel>` 直下タグ集合（`<item>` を除く）に、公式側にあって生成側に無いタグが無いか
3. 各 `<item>` 直下の `wp:*` タグ集合に、公式側にあって生成側に無いタグが無いか
4. `<dc:creator>` が小文字英数 + アンダースコアのみ（= login ID っぽい）なら警告
5. `<img src>` が `https://` で始まっているか（note は相対パス / `http://` いずれも取り込み不可）

### 実装のポイント

```python
def item_wp_tags(item):
    prefix = "{http://wordpress.org/export/1.2/}"
    return {
        el.tag.split("}", 1)[-1]
        for el in item
        if el.tag.startswith(prefix)
    }

ref_wp = item_wp_tags(ref_item)
gen_wp = item_wp_tags(gen_item)
missing_wp = ref_wp - gen_wp
if missing_wp:
    errors.append(f"<item> に必須 wp:* タグが欠落: {sorted(missing_wp)}")
```

`set` 差分で 14 フィールドの欠落を一発検出できます。参照エクスポートが手元にあるなら、スキーマ定義書より実物比較のほうが信頼性が高いです。

## 回帰検出デモ: 旧スクリプトに対して実行

修正前の `md_to_wxr.py` で生成した WXR に対して `verify_wxr.py` を実行すると、以下の出力が得られました。

```
$ python3 .claude/skills/note-export-import/scripts/verify_wxr.py /tmp/regression-demo.xml

[ERROR] <item> に必須 wp:* タグが欠落:
  ['comment_status', 'is_sticky', 'menu_order', 'ping_status',
   'post_date', 'post_date_gmt', 'post_id', 'post_modified',
   'post_modified_gmt', 'post_name', 'post_parent', 'post_password',
   'post_type', 'status']
[WARN] <dc:creator> が login ID 形式 ('mine_unilabo'): 表示名を入れるのが note 公式形式。

exit: 1
```

2026-04-18 の実インポート失敗で発見した 14 フィールド欠落と著者フィールド反転の **両方を非ゼロ終了で検出** しました。CI やローカルゲートに組み込めば、同種の回帰は事前に止められます。

## 教訓: 公式実物との diff を必須にする

この体験から得た学びは、ひとことで言えば **「公式エクスポートがあるなら、実物と diff しろ」** です。

- `xmllint --noout` は **構文チェック** しか見ない
- `ElementTree.parse` は **Python で扱えるか** しか見ない
- スキーマ定義書に頼るのも、書いてないフィールドが実は必須、というケースを拾えない
- 一番信頼できるのは **公式が実際に吐いている WXR そのもの** と `<item>` 単位で diff する

特に AI エージェントが生成するファイルは、検証の甘さが import 失敗として遅れて表面化しがちです。**AI 生成ドキュメントに書かれた「公式形式準拠」は自動では信用しない**、というのが運用ルールになりました。

## まとめ

note WXR のインポート失敗は、以下の 3 点を踏まえれば再発しにくくなります。

- **`<item>` 配下の `wp:*` 14 フィールド** を公式エクスポートで実測して必須化
- **著者フィールドの対応（`dc:creator` = 表示名 / `wp:author_display_name` = login）** を記憶ではなく実物で確認
- **公式エクスポートとの構造 diff** を CI / ローカルゲートにする

`xmllint --noout` は構文検証。構造検証（セマンティクス）には別途スクリプトが要る、という距離感が今回のいちばんの収穫でした。

同じ note に WXR をインポートする方のデバッグ時間を減らせれば幸いです。
