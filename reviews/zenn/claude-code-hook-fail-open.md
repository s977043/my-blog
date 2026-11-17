# articles/claude-code-hook-fail-open.md の記事レビュー

> Zennカテゴリー: Tech
> 構成タイプ: トラブルシュート（検証・修正の混合）

## レビュー方針

Claude Code の PreToolUse hook で危険コマンドを止めている開発者に、「書いた hook がパターン照合へ到達しているか／到達できないときどちらへ倒れるか」を実測で示す記事。Plan は `article_seeds/ai-driven-development/2026-10-11-claude-code-hook-fail-open.md`（Draft Article Plan, `zenn/claude-code-hook-fail-open`）。`central_claim`「網羅より先に到達と倒れ方を確かめ、抽出失敗は fail-closed」と本文の主張は一致する。重点は (1) 題材の出どころ規約、(2) 実測値と公式仕様の再検証、(3) 2026-10-11 以降に停滞した理由の確認。

## 公開可否の判定

**READY（著者承認待ち）**。must / high は 0 件。

- 題材の出どころ: OK。対象は `s977043/growth-lab` の `.claude/hooks/safety.sh`（`gh repo view s977043/growth-lab --json owner` → `s977043`）。個人リポジトリで、my-blog の hook（`claude-gh-account-guard` など）ではない。GitHub アカウント併用の事故も扱っていない。会社リポジトリの観測も含まない
- 停滞の理由: 本文側に未解決のブロッカーは無い。#629（初稿）→ #650（カバー画像）→ #653（公開ブロッカー1件と high 1件を解消）→ #812（2026-10-11。Plan の記録、`onFailure` の追記、引用を要約へ変更）で、指摘はすべて閉じている。#812 の後にレビュー成果物が作られず、`docs/publish-queue.md` にも載っていないため、公開判断の段階に進まないまま止まっていた（publish-queue を grep して 0 件）
- Plan の不足項目: `approved_at` が空（Draft）。公開前に著者が Approved へ進める

## チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| Webディレクター | OK | タイトル、冒頭の結論、想定読者、扱う範囲が冒頭の `:::message` にまとまっている。見出しだけで「現象 → 仕様 → 原因 → 実測 → jq でも残る → 直し方 → 副作用 → 自己点検」と追える |
| Web編集者 | OK | 「後述の〜」の参照先は実在する見出し名と一致する。冒頭の `:::message` はやや長いが、検証環境と `onFailure` の注記は再現性に効くので残してよい |
| Webエンジニア | OK | 修正前後の 6 パターンを自分で再現し、記事の表と一致した。trap ERR / EXIT の比較、PATH の付け方（#653 で修正済み）も妥当 |
| 技術的事実検証 | OK（一部未検証） | 公式 hooks ドキュメントと growth-lab の実コードで裏を取った。jq 版の表、node 不在の行、trap 表は今回再実行していない（#653 で独立に再現済みの記録あり） |

## 根拠一覧

| 記事の箇所 | 主張 | 一次情報 | 確認結果 | 記事に掲載 |
| --- | --- | --- | --- | --- |
| L37-L52 / L153-L160 | 修正前は実ペイロード・壊れた JSON・非 JSON・配列で exit 0、フラットな形のみ exit 2。修正後は 5 パターンで exit 2、`ls -la` は 0 | `s977043/growth-lab` `.claude/hooks/safety.sh@97505505`（修正前）/ `@3d967255`（修正後）を取得し、本レビューで 6 パターンを実行 | 一致 | しない |
| L174-L184 | 4 世代すべて exit 0 | growth-lab の commit `4cfab484` / `997d1019` / `4968c28c` / `97505505` はいずれも `safety.sh` を変更している（`gh api .../commits/997d1019` の files に含まれる）。今回実行したのは `97505505` だけ | 一部一致（3 世代は未再実行） | しない |
| L64-L67 | exit 2 のみがブロック。その他の非ゼロは非ブロッキングで、`hook error` 通知が出る | https://code.claude.com/docs/en/hooks（2026-11-16 閲覧） | 一致 | する |
| L68 | `WorktreeCreate` は例外 | 同上。今回の取得範囲では未確認 | 未検証 | する |
| L380 | `onFailure: "block"` は v2.1.295 以降、既定は `"continue"` | 同上「Block the action when a hook fails」。バージョンは一致。既定値を明記した文は無いが、未設定なら action は進むと書かれている | 一致（既定値は文意から） | する |
| L382-L399 | `command` + `args` の設定例 | 同上。command hook のフィールド表に `args` がある | 一致 | — |
| L147-L148 | sed フォールバックはエスケープが二重でグループにならず空を返す | growth-lab #986 本文「欠陥1」 | 一致 | しない |
| L337 | テスト 29 件 | `scripts/safety-hook.test.mjs@3d967255` の `test(` が 29 件（#986 本文の「17 テスト」は初回 commit 時点の数） | 一致 | しない |
| L333 | 修正の直後に worktree で main / develop 直 push の誤ブロック | #986 の 2 commit 目「push ガードをセグメント/トークン単位に刷新」。worktree での誤発火そのものは未確認 | 未検証 | しない |

## 指摘コメント

### low: `onFailure` の「既定は `"continue"`」は文意からの推定

**該当箇所**: L26, L68, L380

> 既定は `"continue"` です。

**問題**
現行の公式ページには `onFailure` の値として `"continue"` / `"block"` が載っているが、「既定値は continue」と明記した文は無い（未設定なら action は進む、という説明はある）。

**提案**
「未設定（`"continue"` と同じ）では」など、文意どおりの言い方にする。今のままでも誤りではない。

### low: 関連記事からの張り返し

**該当箇所**: 末尾「関連記事」

**問題**
`ai-review-gate-not-called` / `proceed-driven-agent-session-log` からこの記事へのリンクはまだ無い。AGENTS.md の同一媒体参照の規約では、公開時に双方向にそろえる。

**提案**
公開と同じ時期に、リンク先 2 記事の関連記事へこの記事を追加する。どちらも `published: true` なので、その更新は `release/zenn` を経由する別の update PR にし、著者承認を得る。

### low: 題材リポジトリ名を出すかどうか

**該当箇所**: L31, L174-L184

**問題**
本文には「このスクリプト」とあるだけで、growth-lab の名前も #986 も出てこない。主張の成立には影響しないので、掲載しない判断でもよい（`docs/content-channel-strategy.md`「検証と掲載を分ける」）。

**提案**
任意。読者が修正後の全体を読めるとよいと判断するなら、「参考」に growth-lab の `safety.sh@3d967255` を足す。

## 総合評価

### 良い点
- 主張・実測・仕様が一致していて、修正前後の挙動を第三者でも再現できる
- jq 版でも fail-open が残ることを示し、抽出方法の問題ではなく失敗時の方針の問題だと切り分けている
- exit 0 + JSON 方式と `onFailure` の境界を書き、誤診断を防いでいる

### 残る改善点
- 上記の low 3 件（どれも任意）
- 未検証: 3 世代（`4cfab484` / `997d1019` / `4968c28c`）の再実行、jq・node 不在・trap の各表の再実行、`WorktreeCreate` の例外、worktree での誤ブロック

### 推奨アクション
1. 著者が Plan を Approved に進める（`approved_at` を記入）
2. `docs/publish-queue.md` に載せ、`BASE_REF=origin/release/zenn npm run check:zenn-pace` を確認してから `release/zenn` で公開する
3. 公開後に関連記事 2 本からの張り返しを、別の update PR で入れる

### SEO / 回遊
- タイトルに「Claude Code hook」「素通し」が入っていて、検索意図（hook が効かない）と合う。追加の対応は不要
