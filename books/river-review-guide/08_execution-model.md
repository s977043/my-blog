# River Reviewは誰がレビューを実行するのか

River ReviewのSkillは、River Review専用LLMを常に呼び出すためのものではありません。

現行の実行モデルは大きく3つです。

1. Claude Code / CodexなどがSkillを読む **AIエージェント駆動**
2. 明示ルールで判定する **機械的チェック**
3. GitHub Actions / standalone実行からLLMを呼ぶ **Headless LLM**

「どこから起動するか」と「誰のモデルで判断するか」を分けて考えることが、この章のポイントです。
