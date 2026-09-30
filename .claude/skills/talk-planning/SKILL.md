---
name: talk-planning
description: テーマ・メモ・調査結果・Issue・既存記事のいずれからでも、登壇のAudience・時間・中心主張・持ち帰り・根拠・制約をTalk Briefとして固定する。記事作成を前提にしない。
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# talk-planning

登壇資料生成の最初に **Talk Contract** を作るためのSkill。

## 原則

登壇資料は記事の派生物とは限らない。

入力は次のどれでもよい。

- ユーザーが会話で与えたテーマ
- 箇条書きメモ
- 調査結果
- GitHub Issue / README / 設計資料
- 既存のZenn / Qiita / note記事
- 過去の登壇資料

入力形式が違っても、必ず `talks/<slug>/brief.md` へ正規化してから後続処理へ進む。

## Talk Contract

最低限、次を固定する。

```yaml
slug:
title:
audience:
duration_minutes:
core_thesis:
takeaways:
evidence:
constraints:
non_goals:
success_condition:
```

### core_thesis

1つだけにする。

複数の主張がある場合は「この登壇を聞いた人に、一番何を信じて帰ってほしいか」で1つへ絞る。
周辺主張は `takeaways` または `evidence` に落とす。

### audience

肩書だけでなく、現在地を書く。

悪い例:

```text
Webエンジニア
```

良い例:

```text
AIコーディングを個人では使っているが、チーム運用へ広げるとレビュー待ちや品質保証に困っているエンジニアリングリーダー
```

### duration_minutes

不明でも作業を止めない。
暫定20分として `constraints` に「provisional」と記録する。
最終判定は時間未確認として `UNVERIFIED` にする。

### evidence

重要主張は次の型で分類する。

- `official_fact`
- `team_practice`
- `author_interpretation`
- `unverified`

分類ルールは `.claude/skills/article-domain-review/SKILL.md` を参照する。

会社・顧客の非公開情報を個人登壇の具体例へ変換しない。リポジトリの `AGENTS.md` にある公開可能範囲を優先する。

## 記事をsourceにする場合

記事構造を保持しない。

抽出するのは次だけ。

- 中心主張
- 具体例
- 根拠
- 読者/聴衆が困る場面
- 再利用可能なモデル
- 出典

見出し順、段落、記事の説明量はTalk Contractへ持ち込まない。

## 不明点の扱い

作業を止めず、次のように扱う。

- 推測しても主張を変えない軽微な項目: provisionalとして進める
- 事実・数値・登壇条件: `unverified` として残す
- 著者の経験が必要な具体例: 作らない
- 公開可否が不明な内部事例: 使用しない

## 完了条件

- [ ] `brief.md` が存在する
- [ ] audience が現在地まで具体化されている
- [ ] core_thesis が1つ
- [ ] takeaways が1〜3個
- [ ] evidence が分類されている
- [ ] 未確認事項が明示されている
- [ ] 記事がなくても成立する
- [ ] sourceが記事でも記事構造をコピーしていない
