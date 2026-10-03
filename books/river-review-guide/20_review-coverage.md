# Findingが0件でも、レビュー完了とは限らない

River ReviewのReview Coverageは、**指摘件数とレビュー実行の完遂性を別の事実として扱う**ための仕組みです。

たとえばReviewerがtimeoutし、結果としてFindingが0件になった場合、それを「問題なし」と扱うべきではありません。

現行のReview Coverage Contractでは、reviewer role × diff chunkをReview Unitとして扱い、全体状態を `complete` / `partial` / `not_executed` などで表現します。

重要なのは、Review Coverageが現在 **Experimental** であることです。machine-readableな実行面へ出力されますが、Gate連携は段階的に扱われています。
