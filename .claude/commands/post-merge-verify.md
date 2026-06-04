---
description: PR マージ後の事後検証を一括実行する（live URL 反映 / drift / 後片付け）
argument-hint: <merged-pr-number> または <article-slug>（platform 自動判定）
---

# /post-merge-verify

PR マージ直後に実施する事後検証ルーチン。AGENT_LEARNINGS で繰り返し発生する事故クラス（公開反映の見落とし / 後片付け忘れ / .remote 巻き戻り）の検知用。

## 手順

1. **引数の解釈**
   - 数字なら PR 番号として `gh pr view <n>` で title / merged 状態を取得
   - 文字列なら article slug として扱い、`articles/<slug>.md` `Qiita/public/<slug>.md` `articles_note/*/<slug>.md` のいずれかから platform を推定

2. **main 同期 + 後片付け**
   ```bash
   git switch main && git pull --ff-only
   git branch -d <merged-branch>          # 既に削除済みなら error は無視
   git status --short
   git stash list                          # セッション残置の確認
   ```

3. **live URL 反映確認（platform ごと）**
   - **Zenn**: 公開済み記事の場合
     ```bash
     curl -s -o /dev/null -w "%{http_code}\n" "https://zenn.dev/minewo/articles/<slug>"
     curl -s "https://zenn.dev/minewo/articles/<slug>" | grep -oE 'property="og:title" content="[^"]*"' | head -1
     ```
     200 + og:title が記事タイトルと一致すれば OK
   - **Qiita**: id が frontmatter にあれば
     ```bash
     curl -s -o /dev/null -w "%{http_code}\n" "https://qiita.com/s977043/items/<id>"
     ```
   - **note**: 公開後の URL を引数 / ユーザー入力から取得
     ```bash
     curl -s -o /dev/null -w "%{http_code}\n" "https://note.com/mine_unilabo/n/<guid>"
     ```

4. **drift / 後続事故クラス検知**
   ```bash
   npm run check:qiita-drift           # Qiita 系を触った場合
   npm run check:zenn-pace             # Zenn 公開系を触った場合
   ```

5. **release/zenn ↔ main 同期度**（Zenn 系のとき）
   ```bash
   git fetch origin main release/zenn
   git diff origin/release/zenn..origin/main --stat -- articles/ books/
   ```
   差分が想定外なら申し送り

6. **publish-queue 反映の要否**
   - 新規公開なら `docs/publish-queue.md` の Done セクションへ追加候補（実体験 URL 必須）
   - Queue 行を Done へ移すなら別 PR で（マージ済 PR と束ねない）

## 出力フォーマット

ユーザーには上記項目を**1メッセージ**で要約報告。✅ 通った項目 / 🚩 要対応項目を明示。

## 関連
- `CLAUDE.md` §セッション終了時のチェックリスト
- `AGENT_LEARNINGS.md` §A Zenn / §B Qiita / §C note
