# DiffをPlanと一緒にレビューする

Diff Reviewで重要なのは、差分単体の「コード品質」だけではありません。

```text
Approved intent / Plan
        ↓
Implementation Diff
        ↓
Conformance Review
```

実装がPlanで約束した責務境界・変更範囲・検証方針を保っているかを確認します。

この章では、局所的なバグ指摘と、Plan-Diff整合という意味的なレビューを分けて扱います。
