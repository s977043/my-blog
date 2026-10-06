# Review Loop

> Entrypoint: `.claude/skills/zenn-book-writing/SKILL.md`

標準は `検討 → Review → 対応 → Post Review` を3ループ。

3回という回数を目的化せず、各loopの責務を変える。

## Structure Loop

本文前の章構成レビュー。

### Loop 1 — Reader Journey

見る:

- introductionから最初の価値まで遠くないか
- 固有用語より先にReader Problemが出るか
- Part順が理解順になっているか

### Loop 2 — Evidence / Claim

見る:

- 抽象章だけになっていないか
- 各Partに具体例または一次情報があるか
- current / experimental / directionを混ぜていないか

### Loop 3 — Responsibility / De-dup

見る:

- 同じ概念を別章で再説明していないか
- 既存記事・Bookと責務が重ならないか
- Chapter Contractが過剰テンプレ化していないか

## Draft Loop

Part本文を書くときも3種類の観点を使う。

### Loop 1 — Full draft

まずReaderが最後まで通れる本文にする。

完全な言い回しより、Concrete → Concept → Practice → Limitation → Bridgeを優先。

### Loop 2 — Claim / Terminology

- 一次情報を再確認
- 公式用語とBook modelを区別
- 強すぎる断定を修正
- source driftを反映

### Loop 3 — Transferability

- 読者が自分の環境へ持ち帰れる判断軸があるか
- product固有feature listで終わっていないか
- trade-off / when-not-to-useがあるか

## Book-wide Review

全章が揃ったら局所レビューを終了し、Book全体を見る。

確認:

- Central Claimが途中で変わっていない
- introductionとafterwordが同じ問いで閉じる
- Part dividerの情報密度
- 章間bridge
- 略号の初出
- 重複説明
- source baseline
- long chapter / table / TOC density

## Review roles

同じAgentが複数観点を持ってもよいが、判断軸は混ぜない。

- Reader
- Editorial / IA
- Technical / Source
- Skeptical practitioner
- Visual / Render risk

## Review log

`docs/books/<slug>/BOOK_PLAN.md` に最低限を残す。

~~~text
Loop N — name

検討
- ...

Review
- Reader:
- Editorial:
- Technical:

対応
- ...

Post Review
- PASS / NEEDS_CHANGES
- remaining:
~~~

ログは本文へ出さない。
