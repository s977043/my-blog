# Skillにもテストが必要になる

Review Judgment as Codeの「as Code」は、判断基準をファイルへ置くことだけではありません。

変更したSkillが本当に良くなったかを、fixtureや期待出力で確認できる必要があります。

River Reviewにはfixtures-based evalがあり、代表diffと期待条件を固定して回帰を確認できます。

評価例:

- 必要なFindingを出せたか
- 誤検知を出していないか
- severity / confidenceが期待と一致するか
- plannerが適切なSkillを選んだか

Skillの品質も、レビュー対象です。
