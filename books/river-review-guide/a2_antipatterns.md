# 付録B よくあるアンチパターン

## 巨大な1つのレビューPromptへ全部詰め込む

責務・Context・評価方法を分けにくくなります。

## Finding 0件を安全と同義にする

レビュー未完了やtimeoutをfalse cleanとして扱う可能性があります。

## 全Artifactを毎回Contextへ入れる

トークンだけでなくAttention Budgetも消費します。

## Agent数を増やせば品質が上がると考える

必要なのは責務分離であり、Agent数そのものではありません。

## AI VerdictをMerge Authorityにする

Verdictは判断材料であり、責任やmerge権限そのものではありません。

## Suppressionを永久免除にする

Scope・理由・再浮上条件を持たないSuppressionは、レビュー品質を静かに劣化させます。

## Skillを作るがEvalを持たない

判断基準を変更しても、良くなったか確認できません。
