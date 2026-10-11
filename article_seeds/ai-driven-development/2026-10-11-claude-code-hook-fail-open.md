---
seed_id: seed-20261011-claude-code-hook-fail-open
title: "危険コマンドを止める Claude Code hook が、検査の手前で素通ししていた"
date: 2026-10-11
status: seed
topics:
  - ai-driven-development
  - claude-code
  - hooks
  - security
source: external
source_url: https://github.com/s977043/growth-lab/pull/986
source_ref: "s977043/growth-lab .claude/hooks/safety.sh（4cfab484 / 997d1019 / 4968c28c / 97505505、修正 3d967255）; https://code.claude.com/docs/en/hooks"
evidence_status: verified
promoted_to:
article_type_candidates:
  - experience
  - analysis
---

# 危険コマンドを止める Claude Code hook が、検査の手前で素通ししていた

> Metadata contract は `../TEMPLATE.md` と `../../docs/article-lifecycle-contract.md` を正とする。

## 観測事実

- s977043/growth-lab の `.claude/hooks/safety.sh`（PreToolUse hook）は、`data.command` しか見ておらず、実際のペイロード（`tool_input.command`）からコマンドを取り出せないと `exit 0` で素通ししていた
- 修正は growth-lab #986（squash `3d967255`、2026-08-13）。抽出失敗で `exit 2`（fail-closed）に倒した

## 違和感 / Reader Problem

hook を置いた安心感があっても、パターン照合に到達しているか、到達できないときにどちらへ倒れるかは確かめないと分からない。

## 追記ログ

### 2026-10-11

- Seed 作成。初稿 `articles/claude-code-hook-fail-open.md` の公開前レビューで Plan が無いことが分かり、記録を後追いで残した

## Draft Article Plan: zenn/claude-code-hook-fail-open

- approved_at:
- channel: zenn
- slug: claude-code-hook-fail-open
- article_type: experience
- reader_problem: Claude Code の PreToolUse hook で危険コマンドをブロックしている開発者は、書いた hook が実際に届くペイロードで検査に到達しているか、抽出や実行に失敗したときに止まるのか素通しするのかを確かめていない
- central_claim: 危険パターンの網羅より先に、パターン照合へ到達できているかと、到達できなかったときにどちらへ倒れるかを確かめ、抽出に失敗したら止める（fail-closed）。
- out_of_scope: 危険パターンの網羅そのもの（どのコマンドを止めるべきか）、hook の基本的な書き方、exit 0 + stdout の JSON で決定を返す方式の詳細、修正後に growth-lab で続いた判定の改修（#1117 以降）、`onFailure` の導入経緯、my-blog の運用、会社で観測した事例

### Evidence Boundary

- Observed:
  - 範囲: 著者の個人リポジトリ s977043/growth-lab の `.claude/hooks/safety.sh` の履歴と、著者による実行結果
  - 修正前の世代（`4cfab484` 2026-02-01 / `997d1019` 2026-03-05 / `4968c28c` 2026-03-05 / `97505505` 2026-05-08）に `{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}` を流すとすべて exit 0（記事本文の実測、2026-09-10）
  - 修正 `3d967255`（growth-lab #986、2026-08-13）: 抽出失敗を `exit 2` に倒し、`data.command` と `data.tool_input.command` の両方を見る。修正前後に同じ6パターンと node 不在を流した exit code の表は記事本文のとおり
  - 修正直後に worktree 環境で main / develop 直 push ブロックの誤発火があり解消した、テスト 29 件（記事本文の記述。#986 の記録が出所）
- Verified:
  - Claude Code Hooks リファレンス（https://code.claude.com/docs/ja/hooks 、2026-09-10 閲覧・2026-10-11 再確認）: stdout に有効な JSON が無い場合、ブロックは exit code 2 のみ。exit 1 などは非ブロッキングエラーでアクションは進む。exit 0 + JSON の `permissionDecision: "deny"` でも止められる
  - 同「Block the action when a hook fails」（https://code.claude.com/docs/en/hooks#block-the-action-when-a-hook-fails 、2026-10-11 閲覧）: `command` / `http` hook に `"onFailure": "block"` を設定すると hook 失敗時にアクションを止める。既定は `"continue"`
- Hypothesis:
  - 抽出失敗が空文字として静かに返る設計だと、フォールバックの故障にも気づけない（本記事の1事例からの推論）

### 変更履歴

- 2026-10-11: 公開前レビューで Plan の欠落が分かり、初稿の内容に合わせて Draft Article Plan を記録（主張は初稿のまま）
