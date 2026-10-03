# 第5部 長時間・複数Agentへ拡張する

長時間セッション、モデル切替、別Worker、独立レビューになると、会話履歴だけでは状態を安定して渡せません。

この部ではContext、Handoff、役割分離、MERGE_READYまでのDeliveryを扱います。
