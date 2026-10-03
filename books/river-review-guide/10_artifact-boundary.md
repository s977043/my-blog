# 会話ではなくArtifactを境界にする

長時間のAI開発では、要件・計画・実装理由・テスト結果・レビュー結果が会話へ蓄積します。

River Reviewは、会話を正本にせずArtifactを外部入力として扱います。

現行のArtifact Input Contractには、`plan`、`design`、`diff`、`junit`、`coverage`、`review-self`、`review-external`などが定義されています。

Artifactを境界にすると、別セッション・別Agent・CIでも同じ判断材料を再利用できます。
