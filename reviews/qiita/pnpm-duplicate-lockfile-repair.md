# pnpm重複lock修復の記事レビュー

対象: `Qiita/public/pnpm-duplicate-lockfile-repair.md`

Plan: `article_seeds/app-development/2026-11-03-omikuji-lockfile-repair.md` (`qiita/pnpm-duplicate-lockfile-repair`)

2026-11-03。未公開草稿のレビュー。公開可否の承認ではない。

## 独立レビューと採否

別エージェントが本文・Seed・SNS案をread-onlyで照合。`oss-article-claim-boundary` と `article-humanizer-ja` の観点を適用した。must/highなし。公開PR #466のDraft / OPEN、8行diff、CI両runのSHA、45 suites / 311 tests・Web E2E15件・expo-doctor19/22を照合した。

low: 前段のローカルNode 24報告とCI実行環境を混同しないよう、CI節にNode 22.23.4 / pnpm 9.15.2を追加する提案を採用。反映担当も実ログのsetup出力を確認した。主張と書かない範囲は変更していない。

文体lintの英語密度WARNは環境情報を述べる1段落。バージョン・コマンド名・報告元を保つため意図的に維持する。架空の一人称経験や成果率は追加しない。

## 5 loopsの検証記録

| Loop | 観点・証拠 | 判定 |
| --- | --- | --- |
| 1 要件 | 単一候補、本文前のDraft Article Plan、短いトラブルシュートに合うQiita、SNS案まで作成 | PASS |
| 2 挙動・事実境界 | 固定SHAの公開lockfile/diff/CIログを照合。ローカル報告・CI実測・native未検証を分離。独立レビューの環境注記を採用 | PASS |
| 3 設計・情報安全 | my-blogと製品はpublicと確認。非公開ソース・内部URL・画面を成果物へ持ち込まない。private:true / ignorePublish:true。CI定義は変更しない | PASS |
| 4 回帰・統合 | npm run checkの既存32チェックPASS。Article Plan、humanizer契約、git diff --checkもPASS。英語密度WARNは上記理由で維持 | PASS（注記あり） |
| 5 最終条件 | 本文・周知案・出典・未実施事項をレビュー。投稿・予約・広告・課金・マージを行わずDraft PRへ渡す | 草稿の引き渡し可。公開は未承認 |

各loopは異なる条件の確認であり、同じ検査の回数稼ぎではない。製品のテストは既存の同一SHAの有効証拠を再利用し、本作業でアプリを再実行したとは扱わない。

## 統合時の注意

基準mainは `e59f509a029390c506b2e6cc74400a960151007f`。open PR #953 / #879に同題材の記事はない。#879と派生ファイル `docs/article-graph.json` / `.md` が重なる。Seed本文は別パスで分担し、双方のSeedが入った最新mainからgraphを再生成する。相手のSeedや原稿は変更しない。graphを手編集して競合解消しない。

公開導線: Zennはrelease/zenn経由、Qiitaは明示publish。今回のmain向けDraft PRは媒体への投稿を実行しない。ただしpublic GitHub上の草稿であるため、原稿・SNS案・レビューを公開可能な素材だけで構成した。

`check:qiita-drift` は checked 0 / skip 23で終了し、既存公開記事のリモート照合は未検証。今回の新稿はid未発行で、既存公開記事は変更していない。

## 未実施

記事の媒体公開、SNS投稿・予約・成果測定、アプリの実機・native検証、新しいE2E実行、OSSへの投稿は行っていない。公開時は本文・Qiita・Xの投稿先/本文/時刻の判断と、固定時点からの製品状況の変化確認が必要。
