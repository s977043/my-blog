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

## Event / Speaker Context

利用可能なら、構成を作る前に次を確認する。

- 主催者の正式な告知ページ: タイトル、概要、持ち時間
- 申込時の説明と公開済み告知に差分がないか
- 話者本人の過去デッキ: 1本以上
- 同テーマの過去登壇: 再利用できる実例・図・失敗例

過去デッキが無ければ無理に探した体で進めない。
存在する場合は「一般的なプレゼン型」より話者本人の実物を優先する。

## Hook / Transition Heuristics

冒頭は定義やアジェンダより、聴衆の現在地・困りごと・問いから入れるかを先に検討する。

セクション間は、次の技術名を章タイトルとして置く前に、聴衆がそこで抱く疑問を1行で表せないか確認する。

これは強制ルールではない。
イベント要件やbriefでAgenda/結論先出しが必要ならそちらを優先する。

## Reveal Strategy

ストーリー上の発見を、冒頭で全部説明し切らない。

- 問いを置いた直後に全体の答えを出していないか
- 完成図を先に見せることでProgressive Disclosureが無効になっていないか
- 「今日は3つ話します」がStory上の緊張を潰していないか

ただし、意思決定会議・研修・配布前提など「先に地図が必要な場」ではVisual Contractに例外を記録する。

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
