---
seed_id: seed-20261103-omikuji-lockfile-repair
title: "pnpmの重複lock修復と検証範囲を分ける"
date: 2026-11-03
status: seed
topics:
  - pnpm
  - CI
source: external
source_url: https://github.com/s977043/digital-omikuji/pull/466
source_ref: s977043/digital-omikuji@03cbb89b00051c052058ff07e85bc800a47ab48f
evidence_status: verified
promoted_to:
  - Qiita/public/pnpm-duplicate-lockfile-repair.md
article_type_candidates:
  - analysis
---

# pnpmの重複lock修復と検証範囲を分ける

## 観測事実

2026-11-03に執筆エージェントが公開PRのdiffとGitHub Actionsログを確認した。著者本人の操作・感情の再現ではなく、公開された開発記録の分析として扱う。

- 修復前: `a93721414c12643280e65359b101b7fa1e750c85`。
- 修復案: `03cbb89b00051c052058ff07e85bc800a47ab48f`。PR #466は確認時点でOPEN / Draft。変更はpnpm-lock.yamlの8行削除のみ。
- `packages` の同一acorn entryと、`snapshots` の通常/optional entryが重複。修復差分は通常entryを残す。
- [CI run 41561569192](https://github.com/s977043/digital-omikuji/actions/runs/41561569192): 各setupのresolution skipped、Type Check / Tests / ESLint成功、Repo Guards失敗を確認。ログは45 suites / 311 tests成功、expo-doctorは19/22成功。
- [Web E2E run 41561569081](https://github.com/s977043/digital-omikuji/actions/runs/41561569081): 同じhead SHAで15 passed。
- ローカルNode 24.19.0 / pnpm 9.15.2、修復前のERR_PNPM_BROKEN_LOCKFILEはPR本文の報告。執筆環境での再実行とは区別する。

## 選定理由と境界

短いdiffと同一SHAのCI証拠があるため、アプリ全体の改善報告より先に1本へ切り出す。画面監査を扱う公開PR #465は別候補とし、この稿では画像やUI改善成果を使用しない。非公開資料は出典に使用しない。汎用E2E手順・Skillの正本を本repoへ移さず、製品リポジトリも編集しない。

既存記事・Seedのlockfile/acorn検索とopen PR #953 / #879を確認し、同題材の原稿は見つからなかった。my-blog基準SHA: `e59f509a029390c506b2e6cc74400a960151007f`。並行開発の結果は更新されうるため、公開前にPR状態を再確認し、この記事の固定時点と混ぜない。

## Draft Article Plan: qiita/pnpm-duplicate-lockfile-repair

- channel: qiita
- slug: pnpm-duplicate-lockfile-repair
- article_type: analysis
- reader_problem: pnpmのlockfile重複でCIが止まり、依存更新を広げずに復旧範囲と残課題を確認したい開発者。
- central_claim: 重複lockの修復では参照と差分を確認して導入を復旧し、その成功と後続の品質ゲートを分けて判定する。
- out_of_scope: アプリのUI改善効果、ストア公開可能性、native検証、pnpm一般のバグ断定、非公開実装、著者の未表明の体験・感情。
- claim_boundary: required

### Evidence Boundary

- Observed: 執筆エージェントによる公開diff・CIログの読解。新たなアプリ実行は行っていない。
- Verified: 上記2 runのhead SHAと成功/失敗、PR #466の8行削除、修復前後の公開lockfile。一般仕様は[pnpm install公式資料](https://pnpm.io/cli/install)を補助に使用するが、9.15.2の結果は対象CIを根拠とする。
- Hypothesis: 同じ種類のトラブルで、変更範囲と残る失敗を分けると次の調査対象を絞りやすい。一般的な成功率・時間短縮は未計測。

### Outline

1. installで止まった公開事例と対象SHA
2. packagesとsnapshotsを分けて見る
3. 8行削除で変えたもの・維持したもの
4. CIで確認できた復旧と残った失敗

## 文体・運用の参照

公開プロフィールの著者表示を確認した[既存Qiita記事](https://qiita.com/s977043/items/fd5e5642efb40bfe4198)とローカル原稿を参照。問題から始め、短い段落と具体例を置く敬体を採る。Gitの所有・著者メタデータだけで全文章を本人執筆と断定せず、一人称の経験や成果表現は借用しない。writing-style / docs-artifact専用Skillは利用可能な一覧・ローカル探索では未検出。

## 次に試すこと

- [ ] 本文と公開先Qiitaの著者レビュー。
- [ ] 公開後、[SNS引き渡し案](../../docs/share-drafts/2026-11-03-omikuji-lockfile.md)を既存運用へ渡す。投稿・予約・計測は未実施。

Lifecycle: DRAFTED。公開承認・実測結果はまだない。
