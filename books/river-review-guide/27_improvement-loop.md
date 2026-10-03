# レビュー判断を改善するループ

AIレビューの改善というと、最初にPrompt Engineeringを想像しがちです。

River Reviewで改善対象になるのは、Promptだけではありません。

- Skill scope
- false-positive guard
- Evidence contract
- Context selection
- Judgment Placement
- Memory
- Reviewer routing
- Human boundary

すべてが改善対象です。

## 改善の入口は運用上の失敗

たとえば次の3つを考えます。

### False Positive

問題ではないものを指摘した。

### Missed Issue

人間レビューでは見つかったがSkillは見逃した。

### Repeated Human Judgment

人間が毎回同じ条件で同じ判断をしている。

それぞれ改善先が違います。

~~~text
False Positive
  → guard / negative fixture / suppression

Missed Issue
  → positive fixture / Skill update

Repeated Judgment
  → heuristic / deterministic promotion candidate
~~~

## Judgment Promotion

Judgment Placementで見たように、繰り返し発生する意味判断の条件が明文化できるようになったら、より再現可能な層へ移せます。

たとえば毎回、

> このdirectoryからdatabase layerを直接importしてはいけない

とHuman Reviewしているなら、architecture testへ落とせるかもしれません。

~~~text
Human / Agentic
   ↓ condition becomes explicit
Heuristic
   ↓ can be proven
Deterministic
~~~

これは「AIを賢くした」わけではありません。

**判断を環境へ埋め込んだ**のです。

## Create Last

改善時に注意したいのは、問題が起きるたびに新しいSkillを作ることです。

Skill数が増えすぎると、

- routingが複雑になる
- Contextが増える
- 重複Findingが増える
- Eval maintenanceが増える

ためです。

まず既存Skillのguard / fixture / scopeで解けないか確認し、必要な場合にだけ新しい判断単位を作ります。

## 改善の完了条件

変更しただけでは改善ではありません。

少なくとも、

- failureを再現できる
- candidate changeを説明できる
- evalでregressionを確認できる
- false positive / missed issueの両面を見る
- 実運用で再発を観測する

までつながると、改善loopとして閉じます。

## この章で持ち帰ること

レビュー改善は「より良いPromptを書く」ことではなく、**失敗を再現可能な判断資産へ変えること**です。

次章では、このReviewをgenerate → revise loopへ組み込み、いつ止めるかを扱います。

### Sources

- [Judgment Placement](https://github.com/s977043/river-review/blob/main/pages/explanation/judgment-placement.md)
- [Adopter Playbook](https://github.com/s977043/river-review/blob/main/pages/guides/adopter-playbook.md)
