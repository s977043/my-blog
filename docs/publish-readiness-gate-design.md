# 設計提案: レビュー判定を公開ゲートに接続する（publish-readiness gate / 通称 P5）

> ステータス: **提案（未実装）**。本ドキュメントは設計選択肢を整理し、次セッションでの実装判断を容易にするためのもの。
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

| 案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| **A. reviews/zenn/<slug>.md 先頭に機械可読コメント** | Record フェーズが `<!-- publish-readiness: blocked=false mustHigh=0 verified=true reviewedBlob=<blob> -->` を md 先頭に書く | 既存追跡ファイルに同居・追加実装最小 | reviews と記事の鮮度ズレ（後述・論点2）。学び「記事PRにreview同梱しない」と緊張 |
| B. reviews-cache/（.gitignore） に JSON | WF が機械可読 JSON を gitignore 領域に出力 | 記事PRに混ざらない | CI（他環境）から見えない＝CIゲートに使えない（致命的） |
| C. 記事 front matter にメタ | 記事自身に `reviewState:` 等を持たせる | 記事と必ず同期 | 記事本文を WF が書き換える＝主張不変原則と緊張・Zenn 無関係 frontmatter 混入 |

**推奨: A**（CI から見える＝追跡必須。B は CI 不可視で要件を満たさない。C は記事汚染）。

### 論点2: 鮮度（reviews と記事の同期）

レビューは「ある時点のスナップショット」。記事を WF 後に手編集すると判定が古くなる（false OK のリスク）。

- **⚠️ コミット SHA は使えない（鶏と卵問題）**: `reviewedSha=<記事のその時点の commit>` を記録し「記事の最新 commit == reviewedSha」で比較する素朴案は破綻する。WF が記事と reviews を**同一コミット `B` で commit すると、記事の最新 commit は `B` になるが reviewedSha は記録時点の `A` のまま** → 変更直後でも常に stale 判定。
- **対策案1（推奨）: Blob SHA で比較**。コミット SHA でなく**ファイル内容のハッシュ**を記録: `git hash-object articles/<slug>.md`。コミット前後でも内容が変わらない限り同値なので鶏卵問題を回避。判定コメントは `reviewedBlob=<blob-sha>` とし、ゲートで `git hash-object` の現在値と比較。
- **対策案2: `git log` でパス変更を遡る**。`reviewedSha` 以降に記事への変更コミットがあるかを `git log <reviewedSha>..HEAD -- articles/<slug>.md` で判定（出力が空でなければ stale）。
- いずれも「レビュー後に記事が実質変更された」場合のみ stale とし、**古い OK 判定での公開を検知**する。

### 論点3: ブロック強度（WARN vs FAIL）

- 段階導入を推奨: **まず WARN（非ブロッキング）** で運用し、誤検知率・運用感を見てから **FAIL（STRICT）** に上げる。
- pace ゲート（#391/#393）が STRICT=1 を release/zenn 宛 PR 限定にしたのと同じ設計思想。

### 論点4: 接続点（どの PR の CI で効かせるか）

| 接続点 | 判定 |
|---|---|
| published:true 化 PR（main 宛） | 公開意図が確定する地点。ここで WARN すると早期に気づける |
| **release/zenn 宛 PR（deploy 直前）** | 実 deploy 直前の最終ゲート。pace ゲートと同じ場所で一元化できる（**推奨**） |

**推奨: release/zenn 宛 PR**（pace と同じ step 群に集約。公開影響プレビュー #394 とも並ぶ）。

## 推奨設計（まとめ）

1. **WF（Record フェーズ）**: `reviews/zenn/<slug>.md` 先頭に
   `<!-- publish-readiness: blocked=<bool> mustHigh=<n> verified=<bool> reviewedBlob=<git hash-object の値> loops=<n> -->` を書く（鮮度比較は **Blob SHA**。論点2 参照）。
2. **新スクリプト `scripts/check-zenn-publish-readiness.js`**（命名は既存 `check:zenn-pace`/`check:zenn-title` と整合させ `zenn-` を含める）:
   - 引数 or `BASE_REF=origin/release/zenn` の diff から「今回公開される記事」を特定（#393 の diff モードと同じ要領）。
   - 各記事の `reviews/zenn/<slug>.md` 先頭コメントを読む。
     - コメントが無い（WF 未実行）→ skip。ただし**無音にせず INFO ログを出す**（`console.info('[check:zenn-publish-readiness] skip: <slug> はレビュー未実行')`）。段階導入期の透明性を確保し、未実行率の把握＝将来の WARN/FAIL 化判断を容易にする。
     - `blocked=true` → WARN（将来 STRICT で FAIL）。
     - `reviewedBlob != git hash-object の現在値` → stale WARN。
3. **ci.yml**: release/zenn 宛 PR の step 群に `check:zenn-publish-readiness` を追加（pace ゲートの隣）。
4. **package.json**: `check:zenn-publish-readiness` script を追加。

## 未解決・留意点

- `/review-article`（旧コマンド）で作った reviews には readiness 行が無い → skip 対象。WF 経由記事のみ段階適用。
- 「stale 判定」の commit 比較は、記事の rename / 軽微な typo 修正でも stale 扱いになる。許容するか、frontmatter 以外の実質変更のみ見るか要検討。
- 真に厳密にするなら公開時に WF を再実行すべきだが、コスト大。本設計は「WF を通した記事の判定を信頼するベストエフォート」。

## 次アクション（次セッション）

1. 本提案の推奨設計でよいかレビュー。
2. WF Record の readiness コメント出力を実装（小）。
3. `check-zenn-publish-readiness.js` + ci.yml + package.json を実装（中）。WARN から開始。
4. 既存公開記事への遡及は不要（新規公開・更新時から適用）。
