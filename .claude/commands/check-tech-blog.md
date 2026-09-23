---
description: テックブログの記事案または既存原稿を、一次経験・根拠・適用範囲・媒体適合性の観点でreview-only確認する
argument-hint: <article-path-or-idea>
---

# /check-tech-blog

指定された記事案または既存記事を `tech-blog-writing` Skillで確認する。**記事本文は変更しない。**

## 引数

`$ARGUMENTS` を次のいずれかとして扱う。

### 記事パス

- Zenn: `articles/<slug>.md`
- Qiita: `Qiita/public/<slug>.md`
- note: `articles_note/<state>/<slug>.md`

### 記事案

短い文章、作業メモ、記事タイトル候補、または次の形式。

```text
idea: AIに実装させる前にPlanレビューを入れたら手戻りが減った話
```

## 手順

1. `AGENTS.md` を読む
2. `docs/article-lifecycle-contract.md` を読む
3. `docs/content-channel-strategy.md` を読む
4. `.claude/skills/tech-blog-writing/SKILL.md` を読む
5. `$ARGUMENTS` が実在する許可パスなら既存記事モード、そうでなければ記事ネタモードで実行する
6. 記事ネタモードでは、中心主張、一次経験、根拠、読者課題、推奨媒体、記事タイプを確認し、Lifecycle上の現在地と次のHuman Gateを明示する
7. `READY` の記事案では Article Plan（Reader Problem / Central Claim / Evidence / Channel / Outline / Out of Scope）までを提案し、長文本文は生成しない
8. 既存記事モードでは、Reader / Experience / Evidence / Scope / Subtraction / Channel の6ゲートを確認し、次に委譲する既存Review / Final Gateを明示する
9. Skillの出力形式に従って結果を返す
10. 記事本文、Seed metadata、レビュー成果物、設定ファイルを変更していないことを確認する

## 必須ルール

- `Read` / `Grep` / `Glob` を中心に使い、レビューだけの実行では `Edit` / `Write` / git操作を行わない
- 記事案にない経験、失敗、成果、数値、感情を生成しない
- 不足情報は `著者確認が必要` として明示する
- 指摘ゼロを許容し、問題を捏造しない
- 外部仕様や最新情報を断定する場合は、一次情報を確認できたものだけを採用する
- Researchでは Observed / Verified / Hypothesis を分離し、検索上位記事の多数派を根拠にしない
- Human Gate前に長文本文を生成しない
- `articles_note/drafts/` は読み取り専用、`articles_note/published/` は公開済みであることを結果に明記する
- 公開、マージ、front matterの公開状態変更は行わない

## 出力

### 記事ネタの場合

- `READY` / `NEEDS_INPUT` / `PARK`
- Lifecycle上の現在地 / 次状態 / Human Gate対象
- 中心主張候補
- 一次経験・独自性
- 推奨媒体と記事タイプ
- 根拠マップ
- 最小構成案
- 著者確認が必要な項目

### 既存記事の場合

- `PASS` / `NEEDS_REVISION` / `BLOCKED`
- Lifecycle上の現在地 / 次状態 / 委譲先
- 記事の核
- 6ゲートの判定表
- 優先修正（最大5件）
- 削れる内容
- 著者確認が必要な項目
- 次に使う既存レビューコマンド
