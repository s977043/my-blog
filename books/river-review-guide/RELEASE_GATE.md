# River Review Zenn Book — Release Gate

> 内部編集用。Zennのchaptersには含めない。

## Current status

**AUTOMATION_VERIFIED / PREVIEW BLOCKED**

Evaluated: 2026-10-04

本文・構成・source traceabilityに加え、PR上のrepository checksまで完了した。ただしZenn previewと最終通読が未完了なので `published: true` へは進めない。

## Evidence already satisfied

- [x] config chapter entries: 45
- [x] missing chapter: 0
- [x] duplicate chapter: 0
- [x] numbered chapter source coverage: 33 / 33
- [x] H1 static audit: 33 / 33
- [x] fenced code block static audit: unbalanced 0
- [x] unresolved TBD / FIXME / XXX: 0
- [x] Part 1〜7 navigationを整備
- [x] `SOURCE_MAP.md` でreverse impact mapを作成
- [x] River Review main snapshotを2026-10-04に再確認: `60f55e75d6eaead1956c6945afc53f57acd64dd9`
- [x] Latest Releaseを2026-10-04に再確認: `v1.124.5`
- [x] Zenn Book structure checker self-test: 7 / 7 PASS
- [x] Book checkerをaggregate `npm run check` とCI self-testへ配線
- [x] `check:river-review-book`: 45 chapters PASS
- [x] aggregate `npm run check`: 26 checks PASS
- [x] `npm run list:books`: River Review Book認識
- [x] PR #750 current reviewed HEAD: Content checks / Dependency review SUCCESS
- [x] Part 1〜7 representative Source links: 7 / 7 accessible

## Blocking gates

以下が1つでも未完了なら `published: true` にしない。

1. [x] `npm run check:river-review-book` — 45 chapters PASS
2. [x] `npm run list:books` — Zenn CLIがBookを正常認識
3. [x] `npm run check` — 26 checks PASS
4. [ ] `npm run preview` — Zenn rendererでBookを表示
5. [ ] mobile幅を含む表 / code block / text diagramの目視
6. [ ] 33章 + 付録 + おわりにの最終通読
7. [x] 外部GitHub Source linkのspot check — 7/7取得成功

## Release state machine

~~~text
CONTENT_COMPLETE
      ↓ repository checks PASS
AUTOMATION_VERIFIED
      ↓ Zenn preview PASS
PREVIEW_VERIFIED
      ↓ final read + source freshness PASS
RELEASE_READY
      ↓ explicit publish change
PUBLISHED
~~~

状態を飛ばさない。

## Rollback conditions

RELEASE_READY後でも、次のいずれかが見つかったら前段階へ戻す。

- River Review main / Latest Releaseがsnapshotから変わり、versioned claimへ影響する
- CI / Book checkerが失敗する
- Zenn previewで表・コードブロック・chapter navigationが崩れる
- source linkの主要一次情報が移動・削除される
- 最終通読で重複・誤解を招く表現・未裏付け主張が見つかる

## Publish boundary

`published: false → true` は、**RELEASE_READYを確認した後の独立した変更**として行う。

本文修正と公開フリップを同時に行わないことで、公開直前のEvidenceをfreshに保つ。
