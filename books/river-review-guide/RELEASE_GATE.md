# River Review Zenn Book — Release Gate

> 内部編集用。Zennのchaptersには含めない。

## Current status

**PUBLISH_CONFIG_VERIFIED / FINAL PR REVIEW**

Evaluated: 2026-10-04

本文・構成・source traceability、repository checks、全45章browser render、mobile / desktop visual review、Bookトップmetadata、cover表示まで公開前Gateを完了した。公開意思決定として `published: true` へ独立フリップし、その変更を含むCI・Zenn browser Gate・cover validation・Dependency reviewがSUCCESS。残る手順はPR最終レビューとmergeのみ。

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
- [x] Book cover: 500×700 / browser natural size 500×700 / validation error 0
- [x] Browser report: failures 0

## Blocking gates

以下が1つでも未完了なら `published: true` にしない。

1. [x] `npm run check:river-review-book` — 45 chapters PASS
2. [x] `npm run list:books` — Zenn CLIがBookを正常認識
3. [x] `npm run check` — 26 checks PASS
4. [x] `npm run preview` — CIでpreview server / Book route HTTP smoke test PASS
5. [x] mobile幅を含む表 / code block / text diagramの目視 — browser artifactで確認
6. [x] 33章 + 付録 + おわりにの最終通読
7. [x] 外部GitHub Source linkのspot check — 7/7取得成功
8. [x] Bookトップ title / summary / topics / included chapters=45 をactual Preview routeで確認
9. [x] Book coverを追加し、Preview validation warningを0件にする — 500×700 / browser load PASS

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


## Post-publish correction path

公開後に誤り・仕様drift・表示崩れが見つかった場合も、公開画面を直接修正しない。

~~~text
Book source update
  ↓
follow-up PR
  ↓
structure / source / browser visual checks
  ↓
review
  ↓
merge
  ↓
Zenn sync
~~~

修正時も `SOURCE_MAP.md` で影響章を確認し、versioned claimが変わる場合はRiver Review main / Latest Releaseを再照合する。

この導線により、公開後修正も本PRと同じEvidence chainを再利用する。
