# 記事構成デザイン PoC 第 2 段（read-only）

ファイルを編集・commit・push しない。指定の出力ファイル 1 つにだけ書く。scratchpad/poc/ の A-*.md、B-*.md、mapping.txt は読まない（盲検のため）。読むのは scratchpad/poc/blind/ の 4 ファイルと原稿だけ。

原稿（基準 fdc3340、`git -C <repo>/ show fdc3340:<path>`）:
- N: articles_note/published/nb5d70c30380b.md（note 体験記事）
- Z: articles/river-review-judgment-placement.md（Zenn 技術記事）

構成案: blind/N-X.md、blind/N-Y.md（N の 2 案）、blind/Z-X.md、blind/Z-Y.md（Z の 2 案）。どちらがどの方式かは知らされていない。案の中身から方式を推測できた場合は、その旨と根拠を記録する（盲検が崩れた記録）。

## ハードゲート（1 つでも FAIL ならその案は不採用）
- G1 Claim: 中心主張と書かない範囲を維持
- G2 Evidence: 数値・出典・技術仕様・実装状態を捏造・変更しない
- G3 Experience: 一次経験と判断理由を捏造しない
- G4 Safety: 機密・公開ポリシー
- G5 Contract: 主張変更は著者判断として分けている

## 6 軸（各 0〜2、計 12）
Focus / Flow / Skimmability / Information Hierarchy / Reader Utility / Editorial Fit

## 検証パターン
T01 note のストーリーと発見順、T02 Zenn の速読理解、T03 見出しだけで中心主張・因果・結論を追えるか、T04 各章の主眼、T05 段階的開示、T06 主張・根拠の不変【P0】、T07 一次経験・筆者らしさ【P0】、T08 図と本文の分担、T09 モバイル可読性（実表示は不可、UNVERIFIED で可）、T10 Scope Drift と著者判断の分離【P0】、T11 Cut で反例・手順・条件を失わないか、T12 良い節を NO_CHANGE にできているか、T13 媒体差分、T14 タイトル・導入・H2・結論の整合

各判定に具体的な箇所と根拠を付ける。確かめていないものは UNVERIFIED。AI の評価なので、実読者の理解改善を実証したとは書かない。
