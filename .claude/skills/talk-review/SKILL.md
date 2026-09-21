---
name: talk-review
description: 登壇資料をAudience・Speaker・Editor・Presentation Designer・Technical・Accessibilityの6視点とFocus・Flow・Hierarchy・Legibility・Truthfulness・Speakabilityの6品質軸でreview-only確認する。
allowed-tools:
  - Read
  - Grep
  - Glob
---

# talk-review

登壇資料の品質を「読む文書」ではなく **聞く・見る・話す体験**として確認する。

このSkillはreview-only。
`brief.md` / `story.md` / `design.md` / `deck.md` / `speaker-notes.md` を変更しない。

## 前提

必ず次の順に読む。

1. `brief.md`
2. `story.md`
3. `talks/DESIGN.md`
4. `design.md`
5. `deck.md`
6. `speaker-notes.md`
7. `references.md`（存在する場合）

レビュー提案でTalk ContractやVisual Contractを勝手に変更しない。

## 6 Personas

### Audience

初見の聴衆として確認する。

- 冒頭で聞く理由が分かるか
- 今どこを見ればよいか迷わないか
- 専門用語が突然出ないか
- 前のスライドを忘れても話を追えるか
- 最後に何を持ち帰るか分かるか

### Speaker

実際に話す立場で確認する。

- Speaker Notesだけで自然に話せるか
- slide間のtransitionがあるか
- visualを見せるタイミングと説明が同期するか
- Cut Listが使えるか
- slideを読み上げるだけになっていないか

### Editor

ストーリー編集者として確認する。

- Hook→Problem→Insight→Takeawayの因果が成立するか
- 同じ主張を不要に反復していないか
- 脱線がcore_thesisを薄めていないか
- 終盤で新しい大論点を追加していないか
- closingが冒頭の問題へ戻るか

### Presentation Designer

視覚設計として確認する。

- 1 slide = 1 attention targetか
- hierarchyがあるか
- PrimaryとSecondaryが競合していないか
- whitespaceが確保されているか
- Progressive Disclosureが視線誘導になっているか
- slide familyの選択がstory上の役割と一致するか
- densityをfont縮小で解決していないか

Render未確認なら clipping / actual font / real margin は `UNVERIFIED`。

### Technical

技術・事実の境界を確認する。

`.claude/skills/article-domain-review/SKILL.md` の以下を再利用する。

- Domain Detection
- official_fact / team_practice / author_interpretation / unverified
- 一次情報優先
- 未確認を断定しない
- チーム運用を公式ルールへ一般化しない

図、コード、Speaker Notesも対象。

### Accessibility

会場・配信・再利用時の理解可能性を見る。

- 色だけで意味を分けていないか
- descriptiveな見出しか
- 小さい文字へ逃げていないか
- visualの重要な意味がSpeaker Notesでも説明されるか
- contrastがRenderで確認されているか
- 視覚情報が無いとcore thesisを理解できない箇所が放置されていないか

## 6 Quality Axes

### Focus
今見るPrimaryが1つ。

### Flow
前後の意味が自然につながる。

### Hierarchy
視線の優先順位が明確。

### Legibility
投影・配信で読める。

### Truthfulness
図・数値・コード・主張が正しい。

### Speakability
自然に話せ、transitionと時間が成立する。

各軸を `PASS / FAIL / UNVERIFIED` で `review.md` に記録する。

## Humanize

`.claude/skills/article-humanizer-ja/SKILL.md` のStyle patternsを次へ限定して参照する。

- Speaker Notesの不自然なAI定型表現
- スライド見出しの均一すぎる文型
- 日英用語の不自然な往復
- 抽象語の過密

記事向け段落ルールを機械的に流用しない。

## Timing Review

`deck.md` の各slide `time` を予定時間の正本とする。

`story.md` section target time と `speaker-notes.md` target_timeは整合確認に使い、二重加算しない。

- 予定時間超過: NEEDS_CHANGES
- duration provisional: UNVERIFIED
- rehearsal未実施: 実測時間はUNVERIFIED

予定時間内でもRehearsal PASSとはしない。

## Contract Drift

最低限:

- brief ↔ story
- brief ↔ design
- brief ↔ speaker notes
- brief ↔ review

の audience / duration / core_thesis を確認する。

初期値 `false` を根拠にせず、実値を比較する。

## Visual Contract Compliance

`design.md` とDeckを比較する。

- attention strategy
- selected slide families
- key figures
- machine constraints
- talk-specific exceptions

Design変更が必要ならDeckだけ直さず、契約変更として扱う。

## Source vs Render

Source Reviewで確認できる内容と、実レンダリングが必要な内容を分ける。

Source:
- metadata
- density
- contract drift
- evidence boundary
- story / design consistency

Render:
- clipping
- overlap
- actual font size
- margin
- contrast
- missing SVG/image elements
- visual rhythm

Source PASSだけでRender PASSにしない。

## Rehearsal

実施結果がある場合:

- measured_minutes
- run_count
- transition issues
- attention synchronization
- cut_candidates

を確認する。

実施していない場合は `UNVERIFIED`。

## Priority

- `must`: 事実誤り、契約破壊、時間成立不能、重要情報が見えない
- `high`: 理解断絶、重要主張の根拠不足、Primary競合、重大な過密
- `medium`: 構成・transition・hierarchy・表現改善
- `low`: 任意のpolish

件数合わせをしない。

## Verdict

### READY

- must / high = 0
- Talk Contract driftなし
- Visual Contract違反なし
- Timing Plan成立
- important facts verified
- 6 Quality AxesにFAILなし
- required Render Verification = PASS
- required Rehearsal Verification = PASS

### NEEDS_CHANGES

- must / highが残る
- 時間超過
- contract drift
- 明確なsource/render defect

### UNVERIFIED

- 重要事実未確認
- duration provisional
- required Render未実施
- required Rehearsal未実施
- actual legibilityを確認できない

## 完了条件

- [ ] 6 personas確認
- [ ] 6 Quality Axes確認
- [ ] Talk Contract drift確認
- [ ] Visual Contract compliance確認
- [ ] Timing Plan確認
- [ ] Technical claim boundary確認
- [ ] Accessibility確認
- [ ] Source / Renderを分離
- [ ] Rehearsal状態確認
- [ ] 成果物を変更していない
