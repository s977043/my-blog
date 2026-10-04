# {{BOOK_TITLE}} — Editorial QA

> Internal editorial artifact. Zenn chaptersには含めない。
>
> Audit date: {{CREATED_DATE}}

## Static chapter audit

| Check | Result |
| --- | --- |
| Configured chapters | not checked |
| Exactly one H1 | not checked |
| Balanced fenced code blocks | not checked |
| Unresolved placeholders | not checked |
| Internal link consistency | not checked |

## Reader Journey review

- [ ] IntroductionでReader ProblemとCentral Claimが分かる
- [ ] 各Partに「この部で何を理解するか」がある
- [ ] 各章の役割が隣接章と重複していない
- [ ] 章末bridgeが次の問いへつながる
- [ ] Afterwordが新しい主張を追加せずCentral Claimへ戻る

## Claim review

- [ ] Observed / Verified / Interpretationを混同していない
- [ ] sourceの存在だけを動作証拠として扱っていない
- [ ] current main / release / experimental / plannedの時制を分けている
- [ ] 仮想例を実測事実のように書いていない

## Render-risk review

- [ ] 長い章に章内地図がある
- [ ] 横長tableを必要以上に使っていない
- [ ] code block / text diagramがmobileで読める幅か
- [ ] Part dividerが目次上のnavigationとして機能する

## What this audit does not prove

静的監査だけではZenn renderer上のpixel-level表示や外部link到達性は証明できない。公開前に `PUBLISH_CHECKLIST.md` を使う。
