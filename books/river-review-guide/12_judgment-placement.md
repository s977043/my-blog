# 判断を4つの層へ配置する

River Reviewは、レビューを単一のAI工程ではなく、判断を適切な評価層へ配置するシステムとして扱います。

```text
Can it be proven?                  -> Deterministic
Can explicit rules detect it?      -> Heuristic
Does it need semantic context?     -> Agentic Review
Does it require responsibility?    -> Human Judgment
```

目的はコスト削減ではありません。同等以上の安全性・説明可能性・保守性を保てる場所へ判断を置くことです。
