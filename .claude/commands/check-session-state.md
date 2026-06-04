---
description: セッション冒頭/節目に実施する状態確認ルーチンを一括実行する
---

# /check-session-state

セッション冒頭・作業の節目で「ブランチ / 重複PR / 作業ツリー / check / rate-limit」を一括確認する。AGENT_LEARNINGS で繰り返し発生する事故クラス（並列セッション干渉・重複作業・claude-mem 混入・rate-limit 見落とし）の事前検知用。

## 手順

1. **アカウント** — push/PR が必要になる前段で確認
   ```bash
   gh auth status 2>&1 | grep -A1 "Active account: true" | head -2
   ```
   `s977043` でなければ `gh auth switch --user s977043`

2. **ブランチ / 作業ツリー**
   ```bash
   git branch --show-current
   git status --short
   ```
   - main 以外なら作業中ブランチを認識
   - claude-mem 自動注入の `M AGENTS.md` を見たら CLAUDE.md §「`M AGENTS.md` は WIP ではない」を参照

3. **重複 PR / DRAFT PR**
   ```bash
   gh pr list --state open --json number,title,isDraft --jq '.[] | "#\(.number) [\(if .isDraft then "draft" else "ready" end)] \(.title)"'
   ```
   並列セッション衝突回避（CLAUDE.md §作業開始時のチェックリスト 1〜2）

4. **集約 check（記事構造・hygiene・リンク）**
   ```bash
   npm run check
   ```
   exit 0 でない場合は内訳を確認（faq-coverage WARN は非ブロッキング、CLAUDE.md 参照）

5. **Zenn rate-limit pace（release/zenn 公開系を触る前は必須）**
   ```bash
   npm run check:zenn-pace
   ```
   過去 24h で 1 件以上 publish 切替があれば WARN。次の Zenn 公開は慎重に分散

6. **Qiita drift（Qiita 作業を触る前推奨）**
   ```bash
   npm run check:qiita-drift
   ```
   レート制限時は当該記事を skip（誤検知しない）

7. **直近マージ済 PR（前回作業の継続を把握）**
   ```bash
   gh pr list --state merged --limit 5 --json number,title --jq '.[] | "#\(.number) \(.title)"'
   ```

## 出力フォーマット

ユーザーには上記7項目を**1メッセージ**で要約報告する。各項目を1〜2行に圧縮。問題があれば 🚩 を付ける。

## 関連
- `CLAUDE.md` §作業開始時のチェックリスト
- `AGENT_LEARNINGS.md` §G CI/tooling / §D 並列セッション / §E GitHub account
