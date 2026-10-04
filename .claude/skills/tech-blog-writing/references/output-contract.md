# Output contract

> Canonical detail for tech-blog-writing outputs. Entrypoint: `.claude/skills/tech-blog-writing/SKILL.md`.

## 出力形式

### 記事ネタモード

```markdown
# Tech Blog Idea Check

## 判定
READY | NEEDS_INPUT | PARK

## Lifecycle
- 現在:
- 次:
- Draft Article Planで確認する項目（PR作成前に不足しうるもの）:

## 中心主張候補
1文

## 一次経験・独自性
- 確認できたもの
- 不足しているもの

## 推奨
- 媒体:
- 記事タイプ:
- 想定読者:

## 根拠マップ
| 主張候補 | 根拠 | 状態 |

## 構成案
必要最小限の見出し

## 著者確認が必要
- 未解決の AUTHOR_INPUT_REQUIRED:
- 追加で必要な質問・不足事項:
```

`AUTHOR_INPUT_REQUIRED` が残っている場合は判定を `NEEDS_INPUT` とし、Draft Article Plan / Draftへ進めない。

### 既存記事モード

```markdown
# Tech Blog Check

## 総合判定
PASS | NEEDS_REVISION | BLOCKED

## Lifecycle
- 現在:
- 次:
- 委譲先:

## 記事の核
- 想定読者:
- 読者課題:
- 中心主張:
- 読後価値:

## Gate Results
| Gate | 判定 | 根拠 |

## 優先修正
最大5件。重要度順

## 削れる内容
一般論、重複、別記事候補

## 著者確認が必要
経験、数値、判断理由などAIが補完できない項目

## 次のレビュー
既存コマンドへの接続提案
```
