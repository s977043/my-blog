# 人間は何を判断するべきか

River Reviewが減らしたいのはHuman Judgmentそのものではなく、**人間でなくても再現可能な判断へ人間の注意力を使うこと**です。

人間監督はリスクに応じて配分します。

- **Cliff**: security boundary、個人情報、課金、不可逆migrationなど。人間承認を必須にする
- **Hill**: 継続しつつ期限付き観測と確認を置く
- **Field**: 低リスク。自律収束と事後監査を許す

River ReviewのVerdictは判断材料であり、責任やmerge権限そのものではありません。
