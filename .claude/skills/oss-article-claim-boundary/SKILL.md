---
name: oss-article-claim-boundary
description: 公開済みOSS設計記事とその改善PRを、主張境界の観点でレビューする。Judgment Placement、Promotion、実装済みと設計原則の切り分け、検証対象commitの固定、一次情報照合が主題のときに使う。読みやすさレビューは article-reviewer に残す。
---

# oss-article-claim-boundary

公開済みOSS設計記事と、その改善PRをレビューする。構成・誤字・SEOは `article-reviewer` の領分。本スキルは **主張の境界** だけを見る。

## いつ使う

- 公開済み記事へ実装実績、Promotion実例、公開後の進展を足すPR
- 設計原則と実装済み機能が混在する技術記事
- 検証対象commitを固定した記事の追記

使わない。

- 未公開の構成検討だけ
- 一般的な読みやすさレビューだけ
- FindingからRuleを自動生成するコード変更そのもの

## 先に読むもの

1. PR本文のねらいとセルフレビュー
2. 記事diff（追加と削除）
3. 記事が指す一次情報。READMEではなく Skill、detector、PR、開発ノート
4. 前回レビューがあるなら、そこで未解消だった弱点

一次情報に当たれない主張は未検証とし、誤りと断定しない。

## Check 1 — 前回の弱点を1本の差分で回収しているか

公開後改善PRでは、新規論点を増やしていないかを見る。

- 前回レビューの弱点が、PR本文のねらいと対応しているか
- 1つの実装史で複数の弱点を回収できているか。無理に別エピソードを足していないか
- 抽象例を実例へ置換した場合、失った説明経路が記事全体でまだ読めるか。読めないなら nit。ブロッカーにしない

## Check 2 — 層の分類が実装と一致しているか

Judgment Placement系の記述は、次を一次情報と照合する。

- Deterministic Gate なら deterministicGate、strict_block、checker command
- Heuristic なら detector registry、severity、gateを止めるか否か
- Agentic Skill なら SKILL.md の意味判断と委譲表
- Human Judgment なら GO/NO-GO をCaller側に残しているか

禁止。

- Heuristic detector を Deterministic Gate として書いている
- nit / non-blocking を blocking に読める
- Skill が委譲した観点を、同じSkillが今も指摘しているように書く

マーカー集合や除外条件は記事で省略してよい。ただし「必ず悪い」「完全一致」など証明に読める表現は直す。

## Check 3 — Promotionの型を盛っていないか

Promotionと書いてある実例が、実際はどの型かを分類する。

- 自動昇格。Finding観測からRule生成、自動有効化
- 責務移譲。意味判断のうち明示できる部分を detector / checker へ切る
- 条件改善。false positive や scope drift を観測し、canaryで固定する

記事が自動昇格に読めるなら must。責務移譲なのに Promotion とだけ書くなら、1文の免責を要求する。

「未実装です」と書いてある自動生成パイプラインを、実例節が上書きしていないかも見る。

## Check 4 — スナップショットと追記の時刻が混線していないか

検証対象commitを固定した記事では、次を分ける。

- 本文の「このcommit時点の状態」
- 公開後の進展（別日付の message でよい）
- 参考リンクが main を指す理由

本文の検証表を最新化せず、message で追記する方針は正しい。その方針を本文が壊していないかを見る。main リンクの陳腐化は nit。

## Check 5 — 効果主張に計測が付いているか

費用削減率、精度改善率、件数を書くなら、母数・基準日・未実行を併記しているか。

未計測なら「責務分離がある」までにする。設計思想を完成機能として書いていたら must。

## 指摘の出し方

優先度は `article-reviewer` と同じ。

- **must**: 未実装を実装済みに読める、層の取り違え、一次情報と矛盾する断定
- **high**: Promotionの型が誤読される、前回の中核弱点が未回収
- **medium**: 実例が1種類だけになり説明経路が欠ける、用語の揺れ
- **low**: main リンクの将来ドリフト、図の重複、マーカー省略

件数合わせをしない。問題がなければ Approve でよい。

各指摘には次を付ける。

- 該当箇所（記事節またはPR hunk）
- 照合した一次情報（path、PR number、または未検証）
- 最小修正（1文追加で足りるならそれ以上要求しない）

記事本文（`articles/*.md`）は変更しない。指摘はチャットまたは `reviews/` 側の記録に残す。

## 出力

```markdown
# OSS記事 主張境界レビュー

## 判定
Approve / Comment / Request changes

## ねらいとの対応
- 回収できた弱点
- まだ残る弱点

## 一次情報照合
| 主張 | 一次情報 | 結果 |
| --- | --- | --- |
| ... | path or PR | 一致 / ずれ / 未検証 |

## 指摘
### <must/high/medium/low>: タイトル
**該当**: ...
**照合**: ...
**問題**: ...
**提案**: ...

## マージ判断
1文。直すなら何を何文足すかまで書く。
```

## article-reviewer との境界

- 読みやすさ、3ペルソナ、Zenn記法は `article-reviewer`
- 採否して本文へ入れるのは `article-review-apply`
- 実装済み / 原則 / 層 / Promotion / commit固定は本スキル

両方必要なときは、本スキルを先に通し、残った読みやすさだけを `article-reviewer` に渡す。
