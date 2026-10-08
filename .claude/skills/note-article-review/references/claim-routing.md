# Claim routing

> note 原稿が実装・検証・効果を書くときの分岐。入口は `.claude/skills/note-article-review/SKILL.md`。境界そのものの Check は `.claude/skills/oss-article-claim-boundary/SKILL.md`。本文へ落とすのは `.claude/agents/note-review-applier.md`。

新しいスキルは作らない。媒体と主張の種類で、最初に読むスキルを決める。

## いつ境界レビューが要るか

次のどれかがある原稿、またはそのフォローアップPRだけ `claim_boundary: required`。

- 実装した、検証した、効果があった、という主張
- 段階の現在地。見る段階、配布、未実装
- 件数、率、台帳
- Loop Engineering、Harness Engineering などの借用用語

次は `not_required`。

- エッセイ、写真、表紙
- 構成と主題だけのレビュー
- 未公開の構成検討だけ

## 最初に読むスキル

| 媒体 | 主張 | 最初に読む | 本文へ落とす |
| --- | --- | --- | --- |
| note | required | `oss-article-claim-boundary` のあと `note-article-review` | `note-review-applier` |
| note | not_required | `note-article-review` | `note-review-applier` |
| note 主張型の反復 | required | 境界チェックのあと `note-thesis-review-loop` | `note-review-applier` |
| Zenn | 公開済みOSSの実装・Promotion | `oss-article-claim-boundary` のあと `article-reviewer` | `article-review-apply` |

エッセイに境界チェックを通さない。ハウツーだけの短い記事に3ループを通さない。

## Plan に残すフラグ

`tech-blog-writing` の Draft Article Plan と既存記事チェックに、次を1行残す。

```text
claim_boundary: required | not_required
```

required の理由を1つ書く。チーム展開、件数、借用用語、段階の現在地のいずれか。レビュー側はこのフラグを見て、境界スキルを読むかを決める。フラグが無い原稿は、上の条件でその場判定する。

## 反映してよい最小差分

`note-review-applier` は、境界指摘のうち次だけを採用できる。各1文。新しい主張は足さない。

| 指摘 | 後の文が守ること |
| --- | --- |
| 圧縮した矢印 | 確認できた主体と時点まで。未確認を同じ段落に残す |
| 段階の完了形 | 「入り始めた」「装置は未整備」。進行図も同じ時制 |
| 借用用語 | 原典の日付、対象、記事側の対象を同じ段落に置く |
| 用意したことが動いていたように読める | 「用意はしました」。後半の穴を消さない |
| 時点がない | 集計窓を1行。個別月を窓で上書きしない |

禁止。

- 母数がない件数から率を足す
- 未計測のリードタイム改善を書く
- 原典の部品表を、記事の観点の根拠として足す
- ファイル名と本文のずれを、本文へOSS名を足して解消する
- 数字の免責、単位の違い、未実装宣言を消す

low は触らなくてよい。PR更新後は、前回の指摘箇所だけを再照合する。

## Thesis Gate との境界

`note-thesis-review-loop` は主題を守る。境界チェックの代わりにしない。Thesis Gate が足すのは1点だけ。進行図と本文の時制が半歩ずれていないか。Claim を弱める修正は、ここでも自動採用しない。
