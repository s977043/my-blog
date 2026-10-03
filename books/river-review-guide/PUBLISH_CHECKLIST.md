# River Review Zenn Book — Publish Checklist

> このファイルはZennのchaptersには含めない。公開前の再現可能な確認手順としてrepositoryに残す。

## 1. Content / structure

- [x] config.yamlに列挙したchapter fileがすべて存在する
- [x] duplicate chapterがない
- [x] Why → What → Design → Practice → Reliability → Improvement → Adoption のReader Journeyが成立している
- [x] Part 1〜7に「問い / 流れ / 読了後の状態」がある
- [x] Review Judgment as CodeをBookの中心主張として統一した
- [x] PlanGateとの対比記事にはせず、River Review単体のBookとして成立させた

## 2. Claim / source verification

Verification date: 2026-10-03

- [x] River Review main snapshot: `60f55e75d6eaead1956c6945afc53f57acd64dd9`
- [x] Latest Release: `v1.124.5`（2026-09-25）
- [x] Review Coverage = Experimental
- [x] Riverbed Memory v1 = runtime implemented
- [x] Riverbed関連の一部外部schema = Experimental
- [x] Riverbed external datastore v2 = Planned
- [x] Progressive Disclosureのimplemented / proto / plannedを分離
- [x] verify gate = Planned / 未実装
- [x] 自動承認・自動mergeをNon-goalとして維持
- [x] Review VerdictとExecution Authorityを分離
- [x] Loopの反復・停止・max iterationsはcaller ownershipを維持
- [x] 01〜33章すべてに最低1つのSource linkがある（33/33）
- [x] `SOURCE_MAP.md` にchapter → source / reverse impact mapを作成

## 3. Editorial review

- [x] 前半=概念、後半=運用として重複章の責務を整理
- [x] 仮想walkthroughとObserved / Verified factを混同しない
- [x] 実装済みとStableを同義にしない
- [x] 「AIなら必ずできる」型の過剰主張を避ける
- [x] Human Judgmentを自動化失敗ではなく責任層として扱う
- [ ] 全33章を通読し、用語ゆれ・冗長表現を最終校正する

## 4. Repository checks

このrepositoryの既存scriptを使う。

- [ ] `npm run list:books`
- [ ] `npm run check`
- [ ] internal link / title / markdown hygieneの失敗を解消する

未実行のままチェックを付けない。

## 5. Zenn preview

- [ ] `npm run preview`
- [ ] Bookトップのtitle / summary / topicsを確認
- [ ] Part 1〜7の見出しと章順を確認
- [ ] 表がモバイル幅で読めるか確認
- [ ] code block / text diagramが崩れていないか確認
- [ ] 外部GitHub linkが開くかspot check
- [ ] 33章 + 付録 + おわりにを通しでnavigation確認

## 6. Publish decision

- [ ] verification snapshot以降のRiver Review main差分を再確認
- [ ] `SOURCE_MAP.md` の影響章を使って変更sourceを再監査
- [ ] Latest Releaseが変わっていないか再確認
- [ ] `published: false` を変更する前にpreview結果を確認
- [ ] 公開後に誤りが見つかった場合の修正導線を確保

## Release boundary

このチェックリストの未完了項目が残っている状態は、**本文ドラフト完成**であって**公開準備完了**ではない。

特に `npm run check` と `npm run preview` は、実行結果を確認するまで完了扱いにしない。
