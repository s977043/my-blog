# River Review Zenn Book — Editorial QA

> 内部編集用。Zennのchaptersには含めない。
>
> Audit date: 2026-10-04

## Static chapter audit

01〜33章を対象に、GitHub上のcurrent draftを静的確認した。

| Check | Result |
| --- | --- |
| Numbered chapters | 33 |
| Exactly one H1 per chapter | 33 / 33 |
| At least one `### Sources` URL | 33 / 33 |
| Unbalanced fenced code blocks | 0 |
| `TBD` / `FIXME` / `XXX` placeholders | 0 |
| `TODO` matches requiring action | 0 |

### TODO match note

12章に「TODOに撤去条件が無い」という文字列が1件ある。

これはHeuristic Reviewの具体例であり、未執筆プレースホルダではない。

## Source density note

31章「Pluginから始め、必要ならCIへ広げる」は当初Adopter PlaybookのみをSourceとしていた。

Integration Modeの全体像も扱うため、River Review READMEを追加した。

## What this audit does not prove

この静的監査だけでは、次は確認できない。

- Zenn renderer上での表・コードブロック表示
- 外部リンクのHTTP到達性
- repository scriptが行うtitle / internal link / markdown hygiene
- 全33章を連続して読んだときの最終的な文章リズム
- verification snapshot以降にRiver Review mainへ入った変更

そのため `npm run check` と `npm run preview`、最終通読は未完了のまま維持する。

## Publish boundary

Static QA PASSは **公開可能判定ではない**。

公開前には `PUBLISH_CHECKLIST.md` の未完了項目を確認する。


## Book structure checker QA

`scripts/check-zenn-book-structure.js` を追加し、River Review Bookの構造チェックをCI contractへ移した。

確認済み:

- checker sourceの構文確認: PASS
- `--self-test`: 6 / 6 PASS
- `package.json`: `check:river-review-book` がaggregate `npm run check` に含まれる
- `.github/workflows/ci.yml`: `test:zenn-book-structure` がself-test stepに1回だけ含まれる

初回writeではencoding / content corruptionをPost Reviewで検出し、次commitで修正した。修正版をGitHubから再取得し、異常文字列が無いことを確認済み。

まだ確認していないこと:

- branch checkout上での `npm run check:river-review-book`
- aggregate `npm run check`
- Zenn CLIによる `npm run list:books`
