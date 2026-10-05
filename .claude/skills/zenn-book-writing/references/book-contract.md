# Book Contract

> Entrypoint: `.claude/skills/zenn-book-writing/SKILL.md`

本文より先に、Bookが何を解決するかを固定する。

## Required

### Reader Problem

1文で答える。

> 誰が、どの状況で、何に困っているか。

複数personaを置いてもPrimary readerは1つにする。

### Reader Transformation

Before / Afterを分ける。

Beforeは知識不足ではなく「今どんな判断ができないか」を書く。

Afterは「読了後に何を説明・判断・実行できるか」を書く。

### Central Claim

1文。

良いCentral Claimは、各章が「この主張のどこを支えるか」を説明できる。

悪い例:

- Xについて全部説明する
- Xの使い方を紹介する

良い方向:

- 何をどう捉え直すと、どの問題を解けるか

### Scope / Non-goals

Bookへ入れる内容より、入れない内容を明示すると章膨張を抑えやすい。

### Existing Content Boundary

既存記事・既存Book・READMEがある場合、

- 既存成果物が持つ責務
- 新Bookが持つ責務
- 相互参照だけで済ませる範囲

を決める。

## Evidence Boundary

必要に応じて、

- Observed
- Verified
- Interpretation
- Experimental
- Planned / Direction
- Unverified

を定義する。

主題がOSSやcurrent productならSource Baselineを必須にする。

## Source Baseline

時制のある主張を固定する。

- verification date
- current main SHA / docs snapshot
- latest release
- current mainとreleaseの差
- upstream docs間の不整合
- 公開前に再確認する項目

Source Baselineは「すべてのsourceを一覧化すること」ではない。変動する主張の基準点を残す。

## Reader Journey

READMEや機能一覧の順をそのまま章順にしない。

~~~text
Reader Problem
→ Core Idea
→ Mental Model
→ Practice
→ Reliability / Trade-off
→ Adoption
~~~

を基本に、不要な段階は削る。

## Chapter Responsibility Map

各章へ1つのreader questionを割り当てる。

| Chapter | Reader Question | Responsibility | Evidence |
| --- | --- | --- | --- |

隣接章で同じ答えを繰り返すなら統合か責務変更を検討する。

## Anti-patterns

- 章数を先に決めて内容を埋める
- README headingをそのままBook chapterにする
- 機能ごとに1章を作る
- 既存記事を章として貼り合わせる
- current仕様と設計思想を同じ強さで書く
