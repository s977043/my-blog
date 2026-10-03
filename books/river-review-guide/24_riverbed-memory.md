# 会話ではなく、判断を記憶する

Riverbed Memoryは、過去レビューの全文Transcriptを保存するためのものではありません。

次の判断を変える情報を、構造化されたRecordとして残します。

現行v1では、`.river/memory/index.json` にエントリを保存し、typeとして `adr` / `review` / `wontfix` / `pattern` / `decision` / `eval_result` / `suppression` / `resurface` などを扱います。

本書ではこれを **Judgment Memory** として説明します。
