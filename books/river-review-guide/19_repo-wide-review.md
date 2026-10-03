# リポジトリ全体を踏まえてレビューする

Diffだけでは判断できない変更があります。

- 周辺ファイルとの命名・正規化の不一致
- 削除し忘れた設定やlocale
- API互換性と利用側への影響
- プロジェクト固有のArchitecture / Testing Rule

repo-wide reviewは、変更周辺の関連ファイルをContextへ追加してこうしたcross-file判断を支援します。

ただし、Contextを増やすほど良いわけではありません。次の部では、レビューそのものの完遂性・根拠・Context選択を検証対象として扱います。
