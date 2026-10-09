# Idea mode

> Canonical detail for Mode A (article idea → Draft Article Plan → Draft handoff). Entrypoint: `.claude/skills/tech-blog-writing/SKILL.md`.

### Mode A: 記事ネタを確認する

入力例:

- 作業ログ
- Issue / PR / ADR
- 障害対応メモ
- 技術選定の比較
- 短い記事案

#### A-1. Experience Recordを抽出する

次を、入力に存在する範囲で整理する。

```markdown
## 作業
何をしようとしたか

## 背景・読者課題
なぜ必要だったか。誰が同じ問題を持つか

## 制約
環境、期限、コスト、既存設計、チーム条件

## 当初の想定
最初は何が正しいと思っていたか

## 観測
実際に何が起きたか

## 試行と転機
何を試し、何によって判断が変わったか

## 最終判断
何を選び、なぜ選んだか

## 証拠
ログ、テスト、数値、diff、Issue、PR、公式情報

## 未解決
未検証条件、残った課題
```

空欄を推測で埋めない。

#### A-2. ネタ判定を行う

次の3段階で返す。

- `READY`: 中心主張、一次経験、読者価値、根拠が揃っている
- `NEEDS_INPUT`: 記事価値はあるが、著者の経験・証拠・条件が不足している
- `PARK`: 現時点では一般論または範囲が広すぎる。作業や検証を先に行う

Seedに未解決の `AUTHOR_INPUT_REQUIRED` が1件でも残っている場合は `NEEDS_INPUT` とする。著者本人が一次情報を提供するか、その情報を今回の記事では使わないと判断してマーカーを解消するまで `READY` にしない。AIは不足情報の質問や中心主張を縮小する案を出してよいが、マーカーを独断で削除しない。

新しく著者入力だけで解消できる不足を見つけた場合は、同じ不足を別セッションで再発見し続けないようにする。

- **write-enabled + 対応Seedがある**: `<!-- AUTHOR_INPUT_REQUIRED: ... -->` をSeedの関連箇所または未解決セクションへ残す。同じ内容のmarkerが既にあれば追加しない
- **write-enabled + この処理でSeedを新規作成する**: Seedへ昇格する価値がある場合だけ、不足をmarkerとして一緒に記録する。marker保存だけを目的にSeedを新規作成しない
- **review-only（`/check-tech-blog`）**: Seedを編集せず、出力の「著者確認が必要」に追加候補のmarker文面を示す
- **Seedがない単発の記事案**: marker保存のためだけにファイルを作らず、必要な著者入力を結果へ返す
- 外部仕様の確認や将来の実験はAuthor Inputではない。必要なら `Hypothesis` / `- [ ]` の検証項目として扱う

markerの削除は、著者本人から一次情報が得られた場合、または著者が「今回の記事ではその情報を使わない」と明示した場合だけ行う。AIが「中心主張に不要そう」と推測しただけでは削除しない。

ここでの `READY` は **記事ネタモード内のローカル判定**であり、`docs/article-lifecycle-contract.md` の Lifecycle state `READY`（既存Final Gate通過）とは別物。ローカル `READY` を理由に公開準備完了へ遷移させない。

判定観点:

- 読者の具体的な問題があるか
- 書き手に一次経験または独自検証があるか
- 期待と結果の差、または判断の変化があるか
- 根拠を提示できるか
- 1記事へ切り出せる大きさか
- 既存記事と検索意図が重複しないか
- 媒体役割に適合するか

#### A-3. 媒体と記事タイプを提案する

`docs/content-channel-strategy.md` を正として、推奨媒体を1つに絞る。

- note: 一次体験、背景、思想、マネジメント、判断の変化
- Zenn: 技術設計、実装、アーキテクチャ、体系化
- Qiita: 短いTips、トラブルシュート、検索起点の再現手順

多媒体展開は、同一本文の転載ではなく、別の読者意図へ再構成する場合だけ提案する。

媒体を決めた後に構成案を出す場合は、「正本と関連ルール」で指定した**媒体別構成ガイドを必ず読み直す**。

#### A-4. Draft Article Planを作る

`READY` かつ未解決の `AUTHOR_INPUT_REQUIRED` がない記事案は、本文を書く前に次を決め、A-5 の書式で1つの `Draft Article Plan` に記録する（`npm run check:article-plan` は A-5 の書式を読む）。

- Reader Problem（`reader_problem`）: 誰の、どの問題を扱うか
- Central Claim（`central_claim`）: この記事で最も伝える1文
- Evidence（`### Evidence Boundary`）: Observed / Verified / Hypothesis を区別した根拠
- Channel / Article Type（`channel`・`article_type`）: 媒体と主タイプ
- Outline（`### Outline`）: 必要最小限の見出し
- Out of Scope（`out_of_scope`）: 今回は書かない論点
- Claim Boundary（`claim_boundary`）: 主張境界チェックが必要か。判断基準は `.claude/skills/note-article-review/references/claim-routing.md`。条件を満たせば `required`、それ以外は `not_required`
- Lifecycle: 現在は PLANNED、次は DRAFTED

初稿前は仮説や未確認事項を明記してよい。PR作成前の通過条件は `docs/article-lifecycle-contract.md` の「4. Article Planの記録・PR作成ゲート」を正とする。

`/check-tech-blog` の review-only 実行では、Article Planを提案してよいが、記事本文やSeed metadataを変更しない。`Draft Article Plan` がSeedに記録されていれば、後続の既存執筆フローへ引き渡せる。

#### A-5. Draft Article PlanをSeedへ残し、Draftへ引き渡す

本文生成前に、未解決の `AUTHOR_INPUT_REQUIRED` が0件であることを確認する。残っていれば `NEEDS_INPUT` へ戻し、Draftを作らない。Gate解消後に、別台帳は作らず、元Seed本文へ `## Draft Article Plan: <channel>/<slug>` を追記する。追記先のSeedの探し方は `article_seeds/README.md` に従う。Seedの新規作成と `Draft Article Plan` の追記は書き込み可能なセッションで行い、`/check-tech-blog` のような review-only 実行では行わない（Planが見つからない場合の報告書式は `docs/article-lifecycle-contract.md` の「4. Article Planの記録・PR作成ゲート」を正とする）。Plan Approval の扱いは `docs/article-lifecycle-contract.md` の「3. Human Gate」を正とする。frontmatterへ複雑な計画構造を追加しない。1つのSeedから複数媒体・複数記事へ派生する場合は、派生記事ごとに別Planとして追記し、既存Planを上書きしない。

最低限、次を残す。

```markdown
## Draft Article Plan: note/example-slug

- approved_at: （Plan Approval後に記入）
- channel: note | zenn | qiita | izanami
- slug: example-slug
- article_type:
- reader_problem:
- central_claim:
- out_of_scope:
- claim_boundary: required | not_required

### Evidence Boundary
- Observed: 実体験なら誰が何を観測したか
- Verified: 外部事実なら確認した内容と参照先
- Hypothesis: 未確認の見立て。Observed / Verified の代わりにしない

### Outline
1. ...
2. ...
```

ここで記録するのは媒体ごとの執筆契約であり、公開承認ではない。多媒体展開では同一本文を使い回さず、媒体ごとのReader Problem / Central Claim / Outlineを個別に記録する。レビューで中心主張やOut of Scopeを変える提案が出たら、対象Planの下へ変更理由を追記し、採用前に著者の判断（Plan Approval）を得てからDraftへ反映する。

Draftの配置は既存媒体規約を再利用する。

- Zenn: `articles/<slug>.md` を `published: false` で作る
- note: `articles_note/new/<slug>.md` を編集正本として作る
- Qiita: `npm run new:qiita -- <slug>` または既存雛形を使い、公開準備までは `ignorePublish: true` を維持する
- izanami: `articles_izanami/<slug>.md` を `status: draft` で作る

Draftには `Draft Article Plan` の **Reader Problem / Central Claim / Evidence Boundary / Outline / Out of Scope / claim_boundary** を入力契約として渡す。外部記事や検索結果から新しい中心主張を無断で追加しない。

Draft作成後は、新しいレビュー系を作らず既存フローへ渡す。

- Zenn: `/review-article <slug>` または `/article-pipeline <slug>`
- note: `/review-note-article new/<slug>` または `/article-pipeline-note new/<slug>`
- Qiita: 現行のQiitaレビュー運用へ委譲し、正式コマンドがないことを理由にZenn用コマンドを流用しない
- izanami: 専用レビューコマンドなし。`/check-tech-blog articles_izanami/<slug>.md` で確認し、PR 前に `docs/article-lifecycle-contract.md` の作成ゲートを確認する
