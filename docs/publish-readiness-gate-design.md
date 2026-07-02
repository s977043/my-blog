# 設計提案: レビュー判定を公開ゲートに接続する（publish-readiness gate / 通称 P5）

> ステータス: **実装済み**（PR #447 / 2026-07-03）。推奨設計（案A・release/zenn 宛 PR・WARN 開始）どおり実装。
> 実装: `scripts/check-publish-readiness.js`（fixture self-test: `scripts/fixtures/publish-readiness/` + `npm run test:publish-readiness`）/ `npm run check:publish-readiness` / `.github/workflows/ci.yml`（release/zenn 宛 PR で WARN 段階・self-test は常時）/ WF Record フェーズの readiness コメント出力。
> **実装時の乖離（1点）**: 鮮度判定は `reviewedSha`（記事の commit sha）ではなく **`articleHash`（`git hash-object` による記事内容の blob hash）** を記録・比較する。WF は working tree 上で記事を改善した直後にレビューを記録するため、commit sha だと記事とレビューを同一 commit に入れた時点で必ず 1 commit ズレて**全記事が stale 誤検知**になる。blob hash なら「レビュー後に本文が変わったか」を commit 構成に依存せず判定できる（論点2 の意図は維持）。
> 関連: `/review-improve-loop`（#388）、zenn-pace CI ゲート（#391）、pace diff モード（#393）、公開影響プレビュー（#394）、`AGENT_LEARNINGS.md` 2026-06-08。

## 背景・課題

`/review-improve-loop`（`.claude/workflows/article-review-improve-loop.js`）は、記事の最終レビュー結果として次の機械可読な判定を **返り値**で持つ:

- `finalBlocked`（must が残る＝公開不可）
- `finalMustHigh` / `publishBlockers`（残件数）
- `reviewState`（`post-improve-verified` / `post-improve-UNVERIFIED` / `no-improve-or-converged`）

しかし、これらは**ワークフロー実行時の返り値にしか存在せず、永続化されていない**。そのため公開オペレーション（`published: true` 化 → release/zenn sync）の時点で「この記事は公開可否レビューを通っているか / ブロッカーが残っていないか」を**機械的に判定できない**。

現状の公開ゲートは **pace（二重公開）のみ**（#391/#393）。「品質的に公開してよいか（must 未解決でないか）」は人間の記憶に依存している。

## 目的

公開対象記事について「最終レビューで must（公開ブロッカー）が残っていない / 検証済みである」ことを、公開フローの CI で確認できるようにする。

## 設計上の論点と選択肢

### 論点1: 判定結果の保存場所

| 案                                                   | 内容                                                                                                                      | 長所                                 | 短所                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| **A. reviews/zenn/<slug>.md 先頭に機械可読コメント** | Record フェーズが `<!-- publish-readiness: blocked=false mustHigh=0 verified=true reviewedSha=<sha> -->` を md 先頭に書く | 既存追跡ファイルに同居・追加実装最小 | reviews と記事の鮮度ズレ（後述・論点2）。学び「記事PRにreview同梱しない」と緊張 |
| B. reviews-cache/（.gitignore） に JSON              | WF が機械可読 JSON を gitignore 領域に出力                                                                                | 記事PRに混ざらない                   | CI（他環境）から見えない＝CIゲートに使えない（致命的）                          |
| C. 記事 front matter にメタ                          | 記事自身に `reviewState:` 等を持たせる                                                                                    | 記事と必ず同期                       | 記事本文を WF が書き換える＝主張不変原則と緊張・Zenn 無関係 frontmatter 混入    |

**推奨: A**（CI から見える＝追跡必須。B は CI 不可視で要件を満たさない。C は記事汚染）。

### 論点2: 鮮度（reviews と記事の同期）

レビューは「ある時点のスナップショット」。記事を WF 後に手編集すると判定が古くなる（false OK のリスク）。

- **対策**: 判定コメントに `reviewedSha=<記事のその時点のcommit>` を含め、公開ゲートで「対象記事の最新コミット == reviewedSha か」を確認。ズレていれば **stale 扱いで WARN**（「レビュー後に記事が変更されている。再レビュー推奨」）。
- これにより「古い OK 判定で公開」を検知できる。

### 論点3: ブロック強度（WARN vs FAIL）

- 段階導入を推奨: **まず WARN（非ブロッキング）** で運用し、誤検知率・運用感を見てから **FAIL（STRICT）** に上げる。
- pace ゲート（#391/#393）が STRICT=1 を release/zenn 宛 PR 限定にしたのと同じ設計思想。

### 論点4: 接続点（どの PR の CI で効かせるか）

| 接続点                                | 判定                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------- |
| published:true 化 PR（main 宛）       | 公開意図が確定する地点。ここで WARN すると早期に気づける                    |
| **release/zenn 宛 PR（deploy 直前）** | 実 deploy 直前の最終ゲート。pace ゲートと同じ場所で一元化できる（**推奨**） |

**推奨: release/zenn 宛 PR**（pace と同じ step 群に集約。公開影響プレビュー #394 とも並ぶ）。

## 推奨設計（まとめ）

1. **WF（Record フェーズ）**: `reviews/zenn/<slug>.md` 先頭に
   `<!-- publish-readiness: blocked=<bool> mustHigh=<n> verified=<bool> reviewedSha=<sha> loops=<n> -->` を書く。
2. **新スクリプト `scripts/check-publish-readiness.js`**:
   - 引数 or `BASE_REF=origin/release/zenn` の diff から「今回公開される記事」を特定（#393 の diff モードと同じ要領）。
   - 各記事の `reviews/zenn/<slug>.md` 先頭コメントを読む。
     - コメントが無い（WF 未実行）→ skip（段階導入。将来 WARN 化検討）。
     - `blocked=true` → WARN（将来 STRICT で FAIL）。
     - `reviewedSha != 記事の最新 commit` → stale WARN。
3. **ci.yml**: release/zenn 宛 PR の step 群に `check:publish-readiness` を追加（pace ゲートの隣）。
4. **package.json**: `check:publish-readiness` script を追加。

## 未解決・留意点

- `/review-article`（旧コマンド）で作った reviews には readiness 行が無い → skip 対象。WF 経由記事のみ段階適用。
- 「stale 判定」の commit 比較は、記事の rename / 軽微な typo 修正でも stale 扱いになる。許容するか、frontmatter 以外の実質変更のみ見るか要検討。
- 真に厳密にするなら公開時に WF を再実行すべきだが、コスト大。本設計は「WF を通した記事の判定を信頼するベストエフォート」。

## 次アクション（次セッション）

1. 本提案の推奨設計でよいかレビュー。
2. WF Record の readiness コメント出力を実装（小）。
3. `check-publish-readiness.js` + ci.yml + package.json を実装（中）。WARN から開始。
4. 既存公開記事への遡及は不要（新規公開・更新時から適用）。
