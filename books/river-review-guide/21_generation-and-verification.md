# 生成と検証を分ける

AIレビュアーがFindingを生成することと、そのFindingが正しいことは別です。

River Reviewでは、意味判断を担うレビューと、機械的に確かめられる条件の検証を分けます。

例:

- Evidence参照先が実在するか
- severityがSkillの宣言と整合するか
- 必要なFix情報があるか
- execution coverageが不完全ではないか

すべてを別LLMへ再質問するのではなく、決定論的に確認できるものは決定論的に確認します。
