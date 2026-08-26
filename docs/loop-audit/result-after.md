# 採点結果 v2（After: 改善後の再採点）

対象: my-blog の記事公開パイプライン（Zenn / Qiita / note）
採点基準: `docs/loop-audit/rubric.md` **v1（Before / After を同じ最新版 v1 で再採点）**
測定日: 2026-08-26

| モジュール | Before | After | 変化の根拠（検証コマンド） |
|---|:-:|:-:|---|
| Automations | C | **C** | `docs/publish-queue.md` の候補発見は `npm run suggest:theme -- --apply` により機械化した。一方、起動は依然として人間（`grep -rn "suggest:theme" .github/ scripts/hooks/` = 0 件）。最新版 v1 の B は起動・発見・実行の自動化を要求するため C に留める |
| Memory / State | C | **B** | 7 つの state と遷移条件、`requires-human`（異常停止）の遷移条件 5 件を定義。A に届かないのは台帳の state を読んで進行させる機械がまだ無いため |
| Sub-agents | B | B | 変化なし。エスカレーションが人間判断のまま |
| Skills | B | B | self-test は 3 → 4 本（`test:suggest-theme` 追加）。check 17 本に対して依然として部分的 |
| Connectors | C | C | 変化なし。note のインポート・公開は手作業のまま |
| Isolation | C | C | 変化なし。worktree 分離なし |

## サマリ

- **B:2 / C:4 → B:3 / C:3。**
- Memory / State は C → B に上昇した。
- Automations は仕事の発見ロジックを機械化したが、起動が人間のままなので C → C。実装は改善したがグレードは上がらなかった。
- この再採点は公開前レビューで「人間の起動なしに仕事が進むか」という軸名と B 判定の矛盾を指摘されたため実施した。

## 実装中に判明したこと（設計時に想定していなかった）

- 初回実装では **34 件**の候補が出た。34 件の backlog は 0 件と実質同じで、人間が読まない。
- シグナルの強さでスコアを付け、`ADOPT_SCORE=3` 未満を捨て、1 回の起票を `ADOPT_LIMIT=5` 件に制限して 34 → 15 → 5 に収束させた。
- ただし **34 → 15 → 5 は S1 の一次情報実在チェックを追加する前の初回ログ**であり、現在コードの再実行値ではない。現在は raw / scored / adopted の中間件数を標準出力に残す。
- **自動化は人間の作業を消すのではなく、人間が判断する対象の総量を決める仕事に置き換える。** 足切り基準を持たない自動化は、判断コストを人間に転嫁するだけで総量を増やす。

## 回帰確認

- `npm run check` exit=0（`check` が呼ぶ 13 本すべて通過）
- `npm run test:suggest-theme` 20/20 通過
