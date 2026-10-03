# 観点を分けて並列レビューする

River ReviewのReview Teamは、Agent数を増やすこと自体を目的にしません。

bug-hunter / security-scanner / test-gap / dependency-reviewer / frontend-reviewer / ci-cd-reviewerなど、**判断観点の責務を分ける**ために使います。

各roleのFindingはorchestrator側で統合されます。

ここで重要なのは、各Reviewerが承認権限を持たないことです。Review Teamは判断材料を増やしますが、GO / NO-GOやmergeはcaller / human側に残ります。
