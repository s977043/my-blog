<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=63a3de626bd9d476b4630ac8f80252045c35b982 loops=4 reviewedAt=2026-09-03T15:55:00Z -->

# レビュー成果物: proceed-driven-agent-session-log

- 対象記事: `articles/proceed-driven-agent-session-log.md`
- articleHash: `63a3de626bd9d476b4630ac8f80252045c35b982`
- 全 210 行 / `published: false`
- Zennカテゴリー: Idea
- 改善ループ数: **4**
- 総合判定: **must 0 / high 0 / medium 0 / 公開ブロッカーなし**

## 今回の再構成

初見レビューで、旧ケース1 `cross-repo push` は事実としては強い一方、

- Obsidian / vault
- 複数repository
- private repository
- cross-repo push

など固有前提が多く、記事の最初のケースとして理解コストが高いと判断した。

5リポジトリ横断の過去実績探索結果から、より一般化しやすい PlanGate の「マージ未確認でbranch削除」事故へ差し替えた。

## 採用した3ケース

| ケース | 境界 | 採用理由 |
|---|---|---|
| settings.local.json自己編集 | 権限境界 | 「AIが自分の権限を自分で変える」で危険性が即伝わる |
| マージ未確認でbranch削除 | 状態確認境界 | 会話上の状態 ≠ 外部Ground Truthという一般原則へ展開できる |
| git stash drop | 破壊的操作境界 | guard不在で実際に再作業が発生した対照例になる |

旧 `cross-repo push` は主ケースから削除した。内容自体は有用だが、本稿では一般性と初見理解を優先した。

## 一次情報の再検証

### ケース1: 権限設定の自己編集

- `my-blog/AGENT_LEARNINGS.md` 2026-05-18
- `.claude/settings.local.json` の自己編集は安全機構に繰り返しブロック
- project標準script経由では当該ケースで通過
- 「標準scriptなら常に安全」とは一般化しない
- 権限追加は人間操作へ戻す原則を採用

判定: **OK**

### ケース2: マージ未確認でbranch削除

PlanGate一次記録:

- `AGENT_LEARNINGS.md`: 「マージした」発言を信用し、未確定のまま `git push origin --delete` を実行
- PR #240 が未マージ状態でCLOSE
- reopenで復旧、作業ロストなし
- PR #241で振り返り・再発防止を実装
- `scripts/verify-pr-merged.sh` を追加

ガードはcleanup前に以下3条件を必須確認する。

```text
state == MERGED
mergedAt != null
mergeCommit != null
```

判定: **OK**。会話上の状態を外部実状態と混同した事故として一般化可能。

### ケース3: stash drop

- `my-blog/AGENT_LEARNINGS.md` 2026-05-17
- PR #257で内容編集取りこぼし
- cleanup時のstash drop後、PR #258で再作業
- Git公式仕様に合わせ「完全消失」とは断定せず、通常のstash参照を失い再作業した事実に限定

判定: **OK**

## 構成レビュー

旧構成:

```text
cross-repo / 権限 / stash
```

新構成:

```text
権限境界
  ↓
状態確認境界
  ↓
破壊的操作境界
```

3ケースが異なる失敗クラスを担当するため、比較表と後半の抽象化が明確になった。

中心主張も、

> 危険コマンドを禁止する

ではなく、

> 境界で何を検証するかを事故から学び、rule / verifier / guardへ変換する

へ整理されている。

## 初見レビュー

- ケース1は1文で危険性を理解できる
- ケース2は「終わったと思って削除したら終わっていなかった」で理解可能
- ケース3は実害が分かりやすい
- PlanGate固有用語は必要最小限で、詳細はPR番号・script名に閉じている
- `cross-repo push` を外したことで前提知識負荷が下がった

判定: **OK**

## 技術レビュー

- PlanGate PR #240 は現在 merged 状態だが、PR #241 と AGENT_LEARNINGS が「未マージCLOSE → reopen」の事故時系列を一次記録として保持している
- `verify-pr-merged.sh` の実装と記事の3条件は一致
- Git stashについては復旧可能性を残す表現を維持
- AI関与を一次記録で確認できない PocketEitan production deploy等は採用していない

判定: **OK**

## 公開判断

**公開可能。**

今回の書き換えで、記事の持ち帰りは次の3点に整理された。

1. 権限変更は人間へ戻す
2. 不可逆な後処理の前に外部Ground Truthを検証する
3. 破壊的cleanupの前に復旧可能性を確認する

そして、事故を

```text
記録
 ↓
分類
 ↓
検証点を決める
 ↓
rule / verifier / guard
```

へ変えることが、本稿の中心メッセージになっている。

`published: false` はPRでは維持する。
