# Upstream and license

> Source: `.claude/skills/article-humanizer-ja/SKILL.md`. provenance / license確認時だけ読む。

このSkillは、以下の公開リポジトリで整理された3層構造と日本語向けパターンを調査材料としている。

- Repository: `makotofalcon/humanizer-ja`
- Referenced commit: `4cc01cdd5aff4102888e9396c3ba16da99828f78`
- Upstream version: `1.0.0`
- License: MIT
- Retrieved: 2026-07-16

## Local design differences

- 全文を書き換えるSkillではなく、review-onlyとして実装
- `Edit` / `Write` / `AskUserQuestion` を許可しない
- 技術記事のコード、URL、数値、バージョン、公式用語を保護
- 「人間の温度を注入する」「雑味を残す」など、元記事にない声を追加する方針は採用しない
- 存在しない体験談や具体例を生成せず、著者入力が必要な`high`指摘として返す
- Zenn / note / Qiita の媒体差とリポジトリ規約を優先
- 指摘を `low` / `medium` / `high` に分類し、将来の自動修正範囲を限定

## MIT License notice

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
