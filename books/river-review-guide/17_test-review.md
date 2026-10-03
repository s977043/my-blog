# テストが通ったことと、必要なことを試したことを分ける

テスト結果がgreenでも、必要なリスクを試していなければ十分とは言えません。

River Reviewでは、Tests / JUnit / CoverageなどをArtifactとして扱えます。

この章では次を分けます。

- **Execution result**: 実行したテストが成功したか
- **Test adequacy**: 仕様・リスク・失敗パスに対してテスト設計が十分か

AIレビューでは、この2つを混ぜないことが重要です。
