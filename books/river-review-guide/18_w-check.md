# AIレビューを、もう一度レビューする

レビュー結果そのものもArtifactとして扱えます。

River ReviewのWチェックでは、`review-self` と `review-external` を入力に、既存レビューの重複・矛盾・根拠を再確認します。

```text
Implementation
   ↓
Review A / Review B
   ↓
Review Artifacts
   ↓
Synthesis / Verification
   ↓
Verdict material
```

ここでのVerdictも、Human Judgmentやmerge権限を置き換えるものではありません。
