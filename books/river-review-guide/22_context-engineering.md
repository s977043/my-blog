# Contextを増やせばレビューは良くなるのか

レビュー品質を上げるために、リポジトリ全体を毎回すべて読むわけにはいきません。

River Reviewでは、Context BudgetやSkillのProgressive Disclosureを使い、必要な情報を段階的に絞ります。

概念上は次の3段階です。

1. metadataで候補を絞る
2. 選ばれたSkillのinstructionを読む
3. 実行時に必要なReference / Memory / Project Ruleを追加する

現行docsでは、Progressive Disclosureの一部は既存、一部は設計済み・追加予定として明示されています。本書でも実装済みと将来構想を分けて扱います。
