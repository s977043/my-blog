---
name: talk-review
description: 登壇資料をAudience・Speaker・Editor・Technicalの4視点でreview-only確認し、Talk Contract drift、時間超過、理解断絶、事実境界、スライド過密を検出する。
allowed-tools:
  - Read
  - Grep
  - Glob
---

# talk-review

登壇資料の最終品質を、記事レビューとは異なる「聞く体験」で確認する。

このSkillは review-only。
`brief.md` / `story.md` / `deck.md` / `speaker-notes.md` を変更しない。

## 前提

必ず `brief.md` を最初に読む。
レビュー中の「もっと広げた方がよい」という提案で Talk Contract を変更しない。

## 4 personas

### Audience

想定聴衆として初見で確認する。

- 冒頭で聞く理由が分かるか
- 前のスライドを見ていないと理解不能な飛躍がないか
- 専門用語が突然出てこないか
- 1枚の情報量が多すぎないか
- 最後に何を持ち帰るか分かるか

### Speaker

実際に話す立場で確認する。

- Speaker Notesだけで自然に話せるか
- スライド間のtransitionがあるか
- 1枚で話す量が多すぎないか
- 時間超過時のCut Listが使えるか
- スライドに書いてある文を読むだけになっていないか

### Editor

ストーリー編集者として確認する。

- Hook→Problem→Insight→Takeawayの因果が成立するか
- 同じ主張を別表現で反復していないか
- 脱線がcore_thesisを薄めていないか
- Progressive Disclosureが理解に寄与しているか
- 終盤で新しい大論点を追加していないか

### Technical

技術・事実の境界を確認する。

`.claude/skills/article-domain-review/SKILL.md` の以下を再利用する。

- Domain Detection
- `official_fact / team_practice / author_interpretation / unverified`
- 一次情報優先
- 未確認を断定しない
- チーム運用を公式ルールへ一般化しない

登壇資料の表示文とSpeaker Notesの両方を対象にする。

## Humanize

`.claude/skills/article-humanizer-ja/SKILL.md` のStyle patternsを、次へ限定して参照する。

- Speaker Notesの不自然なAI定型表現
- スライド見出しの均一すぎる文型
- 日英用語の往復
- 抽象語の過密

記事向けの段落長など、登壇に適用できない観点を機械的に流用しない。

## Timing Review

`story.md` と `speaker-notes.md` のtarget timeを合計する。

判定:

- 予定時間内: PASS
- 予定時間を超える: NEEDS_CHANGES
- duration自体がprovisional: UNVERIFIED

枚数だけで良否を決めない。
ただし、各スライドを十分説明する時間がない場合は過密として指摘する。

## Slide Density

ソースMarkdownから確認できる範囲で以下を見る。

- 長文段落
- 箇条書き過多
- コード過多
- 1枚に複数message
- 図説明の詰め込み

PDFやレンダリング画像を確認できない場合、余白・クリッピング・実際のフォントサイズは `UNVERIFIED` とする。

## Priority

- `must`: 事実誤り、Talk Contract破壊、時間成立不能
- `high`: 理解の大きな断絶、重要主張の根拠不足、過密
- `medium`: 構成・transition・表現改善
- `low`: 任意の磨き込み

件数合わせをしない。

## Verdict

### READY

- must / high が0
- core_thesis driftがない
- 時間が成立
- 重要な事実がverified
- レンダリング未確認が内容理解を妨げない範囲

### NEEDS_CHANGES

- must / high が残る
- 時間超過
- Talk Contractとdeckがずれている

### UNVERIFIED

- 重要な事実の確認ができない
- durationがprovisionalのまま
- レンダリング確認が必須なのに確認できない

## 完了条件

- [ ] 4 personasすべて確認
- [ ] Contract drift確認
- [ ] Timing確認
- [ ] Technical claim boundary確認
- [ ] Humanize観点を登壇向けに限定適用
- [ ] 未確認事項をUNVERIFIEDとして残す
- [ ] 成果物を変更していない
