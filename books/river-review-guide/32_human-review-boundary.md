# 人間レビューとの境界を決める

Human Reviewの境界は「AIが自信なさそうなら人へ聞く」だけでは不十分です。

チーム側で、どの種類の変更がHuman-ownedなのかを明示します。

例:

- 低リスクで機械検証可能 → 自律継続
- 意味判断が必要だが可逆 → Agentic Review + 観測
- security boundary / payment / personal data / irreversible migration → Human Approval Required

重要なのは、人間レビューを減らすことではなく、**責任を伴う判断へ人間の注意を集中させること**です。
