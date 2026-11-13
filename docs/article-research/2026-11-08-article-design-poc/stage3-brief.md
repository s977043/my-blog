# 記事構成デザイン PoC 再採点（read-only）

ファイルを編集・commit・push しない。指定の出力ファイル 1 つにだけ書く。
読んでよいのは `<scratchpad>/poc/blind2/` の 4 ファイルと原稿だけ。同じディレクトリの他のファイル（score.md、mapping*.txt、A-*.md、B-*.md、blind/ など）は読まない。

原稿（`git -C <repo>/ show fdc3340:<path>`）:
- N: articles_note/published/nb5d70c30380b.md
- Z: articles/river-review-judgment-placement.md

構成案: blind2/N-P.md と N-Q.md（N の 2 案）、blind2/Z-P.md と Z-Q.md（Z の 2 案）。

採点の対象は各案の「構成改善案（見出しの並び、各節の要旨、変更理由、NO_CHANGE）」「Keep / Move / Cut」「著者判断」の中身だけ。設計メモ欄の有無や書式の量は採点に入れない。案の作り方を推測できた場合は、その旨と根拠を記録する。

## ハードゲート（1 つでも FAIL ならその案は不採用）
- G1 Claim: 中心主張と書かない範囲を維持
- G2 Evidence: 数値・出典・技術仕様・実装状態を捏造・変更しない
- G3 Experience: 一次経験と判断理由を捏造しない
- G4 Safety: 機密情報・個人情報・公開ポリシーの違反に限る（読者の誤解は G1/G2 で扱う）
- G5 Contract: 主張変更は著者判断として分けている

## 6 軸（各 0〜2、計 12）
Focus / Flow / Skimmability / Information Hierarchy / Reader Utility / Editorial Fit

各軸の点に、原稿のどこと比べてどう良く／悪くなるかの根拠を 1 行付ける。

## 出力
記事ごとに: 2 案のゲート判定、6 軸の点と根拠、合計、推奨案と理由、推測できた作り方（あれば）。
