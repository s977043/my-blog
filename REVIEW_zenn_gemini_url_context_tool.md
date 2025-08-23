# articles/zenn_gemini_url_context_tool.mdの記事レビュー

## 🚩 レビュー方針
親記事のレビューの内容を引き継いでレビューを実施しました。以下の3つの観点から「内容を正しく理解できるか」を軸に確認し、気付いた点を指摘コメントとして残します。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **日本語表現** | @copilot | - 語尾・語調の統一<br>- 冗長／重複表現の削除<br>- 句読点・改行位置 | - [x] 済 |
| **内容理解（Webエンジニア視点）** | @copilot | - 手順どおりに再現できるか<br>- IDE 連携例が実動か<br>- コマンド誤記の有無 | - [x] 済 |
| **内容理解（AIプロンプトエンジニア視点）** | @copilot | - プロンプト例の妥当性<br>- メモリ／MCP 設定の適切さ<br>- セキュリティ（鍵管理）の過不足 | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい  
- [x] 表に長文が入っていない  
- [x] 画像パスが Zenn Preview で解決する（画像なし）  
- [x] 公式リンクはクリック可能（Markdown link）  
- [x] 前後編リンクが機能する（単体記事）  

---

## 指摘コメント

### 該当箇所 1
L50-L52 （プロンプト例）

```
prompt = """次のURLをURL context toolで参照し、本文に忠実に3点で要約してください。
URL: https://nextjs.org/docs/app
"""
```

### 問題点
プロンプト内で「3点で要約」と指定しているが、後のセクション（L83-L85）で期待される内容として具体例が示されている。一貫性のある指示になっていない。

### 提案
```python
prompt = """次のURLをURL context toolで参照し、以下の観点で要約してください：
1. ルーティングの仕組み
2. 新機能・特徴
3. 従来版との違い

URL: https://nextjs.org/docs/app
"""
```

---

### 該当箇所 2
L144-L153 （プロンプト雛形）

```
あなたは技術ライターです。以下のURLをURL context toolで参照し、公式本文に忠実に要約してください。

出力要件:
- 箇条書きで5点
- 引用は10語以内
- JSONも出力（keys: title, key_points[], citations[]）。citationsは参照URLの配列。

対象URL:
{{URL}}
```

### 問題点
「引用は10語以内」という制約が曖昧。日本語の語数カウントは単語の区切りが明確でないため、実行時に混乱を招く可能性がある。

### 提案
```text
- 引用は30文字以内
```
または
```text  
- 引用は簡潔に（重要なキーワードのみ）
```

---

### 該当箇所 3
L177-L190 （content_hash関数）

```python
def content_hash(url: str) -> str:
    """軽量な更新検知（ETag/Last-Modified→fallbackでbody先頭）"""
    try:
        r = requests.head(url, timeout=10, allow_redirects=True)
        tag = r.headers.get("ETag") or r.headers.get("Last-Modified")
        if tag:
            return hashlib.sha256(tag.encode()).hexdigest()
    except Exception:
        pass
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return hashlib.sha256(r.content[:100_000]).hexdigest()
    except Exception:
        return str(time.time())  # 失敗時は毎回実行に倒す
```

### 問題点
例外処理でまとめて`pass`と`Exception`を使用しているため、ネットワークエラーとHTTPエラーが区別できない。デバッグが困難になる可能性がある。

### 提案
```python
def content_hash(url: str) -> str:
    """軽量な更新検知（ETag/Last-Modified→fallbackでbody先頭）"""
    try:
        r = requests.head(url, timeout=10, allow_redirects=True)
        tag = r.headers.get("ETag") or r.headers.get("Last-Modified")
        if tag:
            return hashlib.sha256(tag.encode()).hexdigest()
    except (requests.RequestException, Exception) as e:
        print(f"HEAD request failed for {url}: {e}")
    
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        return hashlib.sha256(r.content[:100_000]).hexdigest()
    except requests.RequestException as e:
        print(f"GET request failed for {url}: {e}")
        return str(time.time())  # 失敗時は毎回実行に倒す
```

---

### 該当箇所 4
L134-L138 （環境変数例）

```env
GOOGLE_GENAI_API_KEY=xxxxx
NOTION_TOKEN=xxxxx
NOTION_DATABASE_ID=xxxxx
SLACK_BOT_TOKEN=xoxb-xxxxx
SLACK_CHANNEL_ID=Cxxxxx
```

### 問題点
セキュリティ上重要な環境変数の例が具体的過ぎる。特に `SLACK_BOT_TOKEN=xoxb-xxxxx` は実際のトークン形式を示しており、誤解を招く可能性がある。

### 提案
```env
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_channel_id
```

---

### 該当箇所 5
L267-L270 （複数URL例）

```text
対象URL:
- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/building-your-application/routing
- https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
```

### 問題点
実際の動作確認ができないURL例を使用している。記事の信頼性向上のため、執筆時点での有効なURLを使用すべき。

### 提案
URLの有効性を確認するか、より汎用的な例を使用：
```text
対象URL:
- https://example.com/docs/main
- https://example.com/docs/section1  
- https://example.com/docs/section2
```

---

### 該当箇所 6
L396-L404 （リトライ処理）

```python
def retry(func, max_attempts=3):
    for i in range(max_attempts):
        try:
            return func()
        except Exception:
            time.sleep(2 ** i)
    raise
```

### 問題点
最後の`raise`で元の例外情報が失われる。どの試行で何のエラーが発生したかトレースできない。

### 提案
```python
def retry(func, max_attempts=3):
    last_exception = None
    for i in range(max_attempts):
        try:
            return func()
        except Exception as e:
            last_exception = e
            if i < max_attempts - 1:  # 最後の試行でない場合のみsleep
                time.sleep(2 ** i)
    raise last_exception
```

---

### 該当箇所 7
L415-L419 （チェックリスト）

```
- [ ] APIキー・Secretは GitHub Secrets / 1Password で一元管理  
- [ ] 参照URLは **公開ページのみ**（ログイン・ペイウォール不可）  
- [ ] `url_context_metadata` を **毎回保存**（検証＆トラブル対応）  
- [ ] 失敗URLは **再試行キュー** で別管理  
- [ ] 週次で **不要URLの棚卸し**／**トークン使用量の棚卸し**
```

### 問題点
チェックリストが未チェック状態（`- [ ]`）のままだが、これは読者が実際に使用する際のチェックリストとして提示すべき。

### 提案
記事内では説明として扱い、実際のテンプレートファイルとして提供することを明記：
```markdown
## 9. 運用チェックリスト（テンプレート）

運用開始時には以下をチェックしてください：

- [ ] APIキー・Secretは GitHub Secrets / 1Password で一元管理  
- [ ] 参照URLは **公開ページのみ**（ログイン・ペイウォール不可）  
- [ ] `url_context_metadata` を **毎回保存**（検証＆トラブル対応）  
- [ ] 失敗URLは **再試行キュー** で別管理  
- [ ] 週次で **不要URLの棚卸し**／**トークン使用量の棚卸し**
```

---

## 総合評価

### 良い点
- 実務での導入を意識した段階的な構成
- コード例が豊富で実装イメージがしやすい
- セキュリティや運用面の考慮が含まれている
- mermaid図表でワークフローが視覚的に理解しやすい

### 改善点
- プロンプト例の一貫性向上
- エラーハンドリングの詳細化
- セキュリティ例示の適切化
- URL例の有効性確認

### 推奨アクション
1. 指摘箇所の修正
2. コード例の動作確認
3. セキュリティ関連記述の見直し
4. 読者がそのまま使えるテンプレートファイルの提供

---

*レビュー実施者: @copilot*  
*レビュー実施日: 2025-08-23*