---
description: 記事制作Skillのfrontmatter descriptionがユーザー意図を正しくroutingできるか、positive / negative fixtureで意味評価する
argument-hint: [--focus <skill-name>]
---

# /eval-article-skill-routing

記事制作Skillの **semantic routing** を評価する。文字列一致で合否を出さない。

## Source of Truth

- fixture: `.claude/evals/article-skill-routing.json`
- routing定義: fixtureの `candidateSkills` にある各 `SKILL.md` の frontmatter `description`
- `CLAUDE.md` に別のrouting表を作らない

## 手順

1. `AGENTS.md` と `CLAUDE.md` を読む
2. fixtureを読む
3. candidateSkills の各 `SKILL.md` から frontmatter `name` / `description` だけを抽出する
4. 各caseを **fresh reviewer** に独立判定させる
   - 入力は `userPrompt` と candidate の `name / description` のみ
   - 記事本文、過去の正解、case idの意味は渡さない
   - 「単語が含まれるから」ではなく、依頼の目的・成果物・副作用の有無で1つ選ぶ
   - 該当Skillが無ければ `none`
5. expectedSkill と照合する
6. forbiddenSkills が選ばれていないことを確認する
7. confusion / false positive / false negative を集計する

## 出力

```text
Article Skill Routing Eval

cases: <n>
correct: <n>
accuracy: <0.00-1.00>
false_positive: <n>
false_negative: <n>

FAIL:
- <case id>: expected=<skill|none> actual=<skill|none> reason=<short>

Confusion:
- <expected> -> <actual>: <count>
```

全caseについて、`case id / expected / actual / pass / rationale` の表も残す。

## 合格条件

- 全 positive case が expectedSkill と一致
- negative case で禁止Skillを起動しない
- `--focus` 指定時もfixture自体は変更しない
- routing改善のためにSkill本文へタスク固有のキーワードを大量追加しない

## 改善ループ

失敗した場合:

```text
Failure
  ↓
frontmatter description の境界を最小修正
  ↓
同fixtureを再評価
  ↓
held-out / 新規negative caseを追加
```

fixtureに正解を合わせてdescriptionを過学習させない。実運用で起きた誤routingだけを新しいregression caseへ昇格する。

## ガードレール

- review-only。Skill / fixture / 設定を自動編集しない
- expectedSkillをReviewerへ見せない
- caseごとに独立して判定する
- `CLAUDE.md` と `SKILL.md` の二重routing定義を作らない
- 結果が空ならPASS扱いせず `UNVERIFIED` とする
