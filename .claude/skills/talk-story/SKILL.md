---
name: talk-story
description: Talk Briefを不変条件として、聞き手が時間軸で理解できる登壇ストーリーへ変換する。記事の章立てを流用せず、Hook→Problem→Evidence→Tension→Insight→Model→Application→Takeawayで構成する。
allowed-tools:
  - Read
  - Write
  - Edit
---

# talk-story

`talks/<slug>/brief.md` から `story.md` を作る。

## 不変条件

`brief.md` の以下を勝手に変更しない。

- audience
- core_thesis
- takeaways
- verified evidence
- constraints

ストーリー改善のために中心主張そのものを薄めたり、別テーマへ広げない。

## Spoken Story

記事は「戻って読める」が、登壇は基本的に一方向で進む。

そのため説明順は、網羅性ではなく理解の時間軸で決める。

基本形:

```text
Hook
 ↓
Problem
 ↓
Experience / Evidence
 ↓
Tension
 ↓
Insight
 ↓
Model
 ↓
Application
 ↓
Takeaway
```

すべての登壇へ機械的に8章を強制しない。
短いLTでは複数要素を統合してよい。

## 時間予算

`duration_minutes` の全量を本文で使い切らない。

目安:

- 本編: 85〜90%
- 遷移・呼吸・想定外: 10〜15%

Q&A時間がイベント側で別枠なら本編予算から除外する。

各セクションに `target time` を置き、合計が予算内か確認する。

## Progressive Disclosure

次の内容は1枚で完成図を見せるより、段階表示を優先する。

- 状態遷移
- Before / Afterの差分
- 複数責務の関係
- 原因→結果の連鎖
- 3要素以上のモデル
- 一度に説明すると口頭説明と視線が競合する図

`story.md` に候補を明示する。

## Tension

成功談だけにしない。
主張を生んだ違和感・失敗・トレードオフが実在する場合、それをストーリーの転換点にする。

ただし、著者が提示していない失敗談や数値を創作しない。

## Cut List

必ず用意する。

時間超過時に削っても `core_thesis` と `takeaways` が成立する内容を先に決める。

## 完了条件

- [ ] 冒頭2分以内に「なぜ聞くか」が分かる
- [ ] core_thesisまでの因果が追える
- [ ] evidenceとinterpretationが混ざっていない
- [ ] 時間予算内
- [ ] Progressive Disclosure候補が確認済み
- [ ] Cut Listがある
- [ ] 最後がbrief.mdのtakeawayへ戻る
