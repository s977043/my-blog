---
name: tech-blog-writing
description: テックブログのネタ発見、一次経験の整理、媒体・記事タイプ選定、構成設計、公開前の根拠確認を一貫して支援する。Zenn・Qiita・noteの記事案または既存原稿を、経験・判断・検証の来歴が読者へ伝わる状態にする。
---

# tech-blog-writing

テックブログを「整った文章」ではなく、実務経験を再利用可能な技術知識へ変換するためのスキル。

文章生成そのものより、次を重視する。

- 誰のどの課題を扱うか
- 何を実際に経験・観測したか
- どの判断が、どの証拠によって変わったか
- どの条件まで主張できるか
- 何を書かないか

## トリガー

- テックブログのネタを考える
- 作業ログ、Issue、PR、障害対応、技術選定から記事候補を抽出する
- 記事の構成や書き方を決める
- `/check-tech-blog <記事パスまたは記事案>` で確認する
- Zenn・Qiita・note向けの記事が、一次経験と根拠を備えているかレビューする

## 正本と関連ルール

最初に次を読む。

1. `AGENTS.md` — 全媒体共通の規約
2. `docs/article-lifecycle-contract.md` — Seed provenance、Lifecycle state、Human Gate、Metrics / Learning 接続の正本
3. `docs/content-channel-strategy.md` — 媒体役割、書き分け、多媒体展開の正本
4. 対象媒体の構成・運用ルール
   - **Zenn**: `docs/article-guides/zenn-structure-best-practices.md` と `articles/README.md`
   - **note**: `articles_note/guides/note-structure-best-practices.md`、`articles_note/checklists/note-article-quality-checklist.md`、`articles_note/README.md`
   - **Qiita**: `Qiita/README.md` など既存の媒体固有ルール

媒体選定後に構成案を作る場合は、**対象媒体の構成ガイドを先に読み、その判断基準を構成案へ反映する**。ガイドは固定テンプレートとして機械適用せず、記事の目的・読者・検索意図・一次経験を優先する。

本スキルは媒体別レビューを置き換えない。

- Zennレビュー: `article-reviewer` / `article-review-apply`
- noteレビュー: `note-article-review`
- AI特有表現の検出: `article-humanizer-ja`
- 公開操作: `/publish-zenn`、`/publish-qiita` など既存フロー

## 基本原則

### 1. AIは編集者であり、経験の生成者ではない

AIへ任せてよいもの:

- 作業ログからの論点抽出
- 不足情報を明らかにする質問
- 構成案、見出し案、タイトル案
- 冗長さ、重複、表現のレビュー
- 公式情報と本文の照合補助

AIへ任せてはいけないもの:

- 経験していない失敗・成果・感情の生成
- 未実行コードの成功断定
- 観測していない数値や効果の生成
- 技術判断と事実確認の最終責任

不足する一次情報は補完せず、`著者確認が必要` として返す。

### 2. 身体性は文体ではなく知識の来歴で示す

「私は思った」だけでは一次経験として弱い。可能な範囲で次の因果を残す。

```text
当初の期待
→ 実行したこと
→ 観測した事実
→ 解釈・仮説
→ 判断の変更
→ 次回の行動
```

最低限、次のどれかを含める。

- 実際に発生した問題とその条件
- 試した案と採用・不採用理由
- ログ、テスト、メトリクス、diff、Issue、PRなどの証拠
- 導入前後で変わった判断または運用

### 3. 1記事1主張を基本にする

記事の中心主張を1文で説明できる状態にする。補助メッセージは原則3つまで。

関連していても中心主張を強めない内容は、次のいずれかへ分ける。

- 削除
- 別記事
- 補足
- 今後の課題

AIが追加した一般論を残すこと自体を品質とみなさない。

### 4. 主張と根拠を対応させる

強い主張ほど強い根拠を要求する。

| 主張 | 必要な根拠の例 |
|---|---|
| 手順が動く | 実行環境、バージョン、実行結果 |
| 品質が上がった | 比較条件、評価軸、観測値または具体例 |
| AがBより良い | 対象タスク、制約、比較基準、例外 |
| 一般に推奨できる | 公式情報、複数事例、適用条件 |
| 自分のケースで有効 | 実施条件、観測結果、未検証範囲 |

事実、推測、意見、経験を混同しない。

### 5. 適用範囲を明示する

防御的な言い訳ではなく、主張の境界を示す。

- 執筆・検証時点
- OS、ランタイム、ライブラリ、モデルなどの環境
- 対象タスク・チーム・規模
- 未検証条件
- 残った問題

### 6. 文章完成度と公開安全性を分ける

文章、図、網羅性は後から改善できる。次は公開前に満たす。

- 技術的正確性
- コード・手順の再現確認
- 機密情報、APIキー、個人情報の除外
- 引用、ライセンス、出典の確認
- 読者へ重大な損害を与えうる断定の回避

## 対応する記事タイプ

記事案を次のいずれかに分類する。混合する場合も主タイプを1つ決める。

| タイプ | 中心となる問い | 基本構成 |
|---|---|---|
| 学習ログ | 何を理解し直したか | 前提 → 誤解 → 検証 → 学び |
| トラブルシュート | 何が起き、どう切り分けたか | 症状 → 環境 → 仮説 → 試行 → 原因 → 対策 |
| 設計・意思決定 | なぜその案を選んだか | 課題 → 制約 → 選択肢 → 評価軸 → 判断 → 残課題 |
| 教訓・振り返り | 何を次から変えるか | 期待 → 出来事 → 転機 → 教訓 → 次の行動 |
| 手順・ガイド | 読者が何を再現できるか | 対象 → 前提 → 手順 → 確認 → 失敗時対応 |
| 概念解説 | 何と何を区別すべきか | 問題提起 → 定義 → 比較 → 具体例 → 適用判断 |
| 比較検討 | どの条件で何を選ぶか | 要件 → 候補 → 評価軸 → 検証 → 結論 |

## Lifecycle上の責務

本スキルは Article Lifecycle 全体を実行する Orchestrator ではない。主に上流の次の区間を担当する。

```text
CAPTURED
  ↓
TRIAGED
  ↓
PROMOTED
  ↓
PLANNED
  ↓
Plan Approval (Human)
  ↓
DRAFTED以降は既存Writer / Review / Final Gateへ委譲
```

- Seedのprovenanceと状態定義は `docs/article-lifecycle-contract.md` を正とする
- `PROMOTED` へ進める場合は、外部Signalの出典と `evidence_status` を明示する
- `PLANNED` は「読者課題・中心主張・根拠・媒体・構成・書かない範囲」が揃った状態とする
- 本文生成へ進む前に、中心主張と構成について **Plan Approval（Human）** を置く
- Plan ApprovalはLifecycle stateを追加しない。Lifecycleの `APPROVED` は既存契約どおり **公開承認** を意味する
- `DRAFTED` 以降は既存の媒体別レビュー、Final Gate、公開ポリシーへ委譲する
- 公開後のMetrics / Learningは本スキルで自動更新せず、Lifecycle契約に従って次のSignalへ戻す

## Research方針

Researchは「検索上位の平均的な記事を再構成するため」ではなく、一次経験の主張境界を確認し、読者が必要とする不足情報を補うために使う。

優先順位は次の通り。

1. 著者自身の一次経験・観測・実行ログ
2. 対象プロダクトや仕様の一次情報
3. 再現可能な検証結果
4. 検索意図・関連する二次情報
5. 競合・上位記事の構成

外部記事の見出し集合を、そのまま構成へ変換しない。一次経験が弱い場合は検索量で補強せず、`NEEDS_INPUT` または `PARK` にする。

Research結果は少なくとも次の3種類へ分ける。

- **Observed**: 著者が実際に観測したこと
- **Verified**: 一次情報や再現検証で確認した外部事実
- **Hypothesis**: 解釈・仮説。事実として書かない

検索流入を狙う記事では検索意図を確認するが、SEOを中心主張より上位の目的にしない。

## ワークフロー

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

#### A-4. Article Planを作り、Plan Approvalへ渡す

`READY` の記事案は、本文を書く前に次を1つのArticle Planへ固定する。

```markdown
## Reader Problem
誰の、どの問題を扱うか

## Central Claim
この記事で最も伝える1文

## Evidence
Observed / Verified / Hypothesis を区別した根拠

## Channel / Article Type
媒体と主タイプ

## Outline
必要最小限の見出し

## Out of Scope
今回は書かない論点

## Lifecycle
現在: PLANNED
次: Plan Approval (Human)
```

Plan Approvalでは、少なくとも **Reader Problem / Central Claim / Outline / Out of Scope** の4点を確認する。これは公開承認を表すLifecycleの `APPROVED` とは別の局所ゲートであり、新しいLifecycle stateは追加しない。承認前に長文本文を生成しない。

`/check-tech-blog` の review-only 実行では、Article Planを提案してよいが、記事本文やSeed metadataを変更しない。承認済みの計画が明示されている場合のみ、後続の既存執筆フローへ引き渡す。

#### A-5. 承認済みArticle PlanをSeedへ残し、Draftへ引き渡す

Plan Approvalを得たら、別台帳は作らず、元Seed本文へ `## Approved Article Plan: <channel>/<slug>` として承認済み内容を追記する。frontmatterへ複雑な計画構造を追加しない。1つのSeedから複数媒体・複数記事へ派生する場合は、派生記事ごとに別Planとして追記し、既存Planを上書きしない。

最低限、次を残す。

```markdown
## Approved Article Plan: note/example-slug

- approved_at: YYYY-MM-DD
- channel: note | zenn | qiita
- slug: example-slug
- article_type:
- reader_problem:
- central_claim:
- out_of_scope:

### Evidence Boundary
- Observed:
- Verified:
- Hypothesis:

### Outline
1. ...
2. ...
```

ここで記録するのは「承認された執筆契約」であり、公開承認ではない。多媒体展開では同一本文を使い回さず、媒体ごとのReader Problem / Central Claim / Outlineを個別に承認する。承認後に中心主張やOut of Scopeを変更する場合は、対象Planの下へ変更理由を追記してからDraftへ反映する。

Draftの配置は既存媒体規約を再利用する。

- Zenn: `articles/<slug>.md` を `published: false` で作る
- note: `articles_note/new/<slug>.md` を編集正本として作る
- Qiita: `npm run new:qiita -- <slug>` または既存雛形を使い、公開準備までは `ignorePublish: true` を維持する

Draftには承認済みArticle Planの **Reader Problem / Central Claim / Evidence Boundary / Outline / Out of Scope** を入力契約として渡す。外部記事や検索結果から新しい中心主張を追加しない。

Draft作成後は、新しいレビュー系を作らず既存フローへ渡す。

- Zenn: `/review-article <slug>` または `/article-pipeline <slug>`
- note: `/review-note-article new/<slug>` または `/article-pipeline-note new/<slug>`
- Qiita: 現行のQiitaレビュー運用へ委譲し、正式コマンドがないことを理由にZenn用コマンドを流用しない

### Mode B: 既存記事を確認する

対象パス:

- `articles/<slug>.md`
- `Qiita/public/<slug>.md`
- `articles_note/new/<slug>.md`
- `articles_note/drafts/<slug>.md`（読み取り専用であることを明記）
- `articles_note/published/<slug>.md`（公開済みであることを明記）

#### B-1. 中心主張を抽出する

本文から次を1文ずつ抽出する。

- 想定読者
- 読者の問題
- 中心主張
- 読後に残す理解・判断・行動

抽出できない場合は欠落として指摘する。ただし、すべての記事に明示的なCTAや行動を要求しない。

#### B-2. 6ゲートで確認する

1. **Reader Gate**: 誰の何を解決する記事か
2. **Experience Gate**: 実際の経験、観測、判断変化があるか
3. **Evidence Gate**: 主張と根拠が対応しているか
4. **Scope Gate**: 適用条件と未検証範囲が明確か
5. **Subtraction Gate**: 一般論、重複、別テーマを削れるか
6. **Channel Gate**: 媒体役割、形式、読者意図に適合するか

各ゲートを `PASS` / `WARN` / `FAIL` で判定する。指摘ゼロを許容し、問題を捏造しない。

#### B-3. 既存レビューへ引き渡す

本スキルは記事の上流品質を確認する。必要に応じて次へ接続する。

- 文体・AI特有表現: `/humanize-review <path>`
- Zennの詳細レビュー: `/review-article <slug>`
- noteの詳細レビュー: `/review-note-article <state>/<slug>`
- 多視点検証: `/multi-review <path> <観点>`

レビュー後の状態遷移は `docs/article-lifecycle-contract.md` に従う。ここで `REVIEWED` / `READY` / `APPROVED` を独自定義しない。

```text
Existing Article
  ↓
媒体別Review
  ↓
既存Final Gate
  ↓
Human Approval
  ↓
Publish
  ↓
Metrics
  ↓
Learning Proposal
```

本スキルの役割は、次に渡すべき既存フローを明示するところまでとする。

## 出力形式

### 記事ネタモード

```markdown
# Tech Blog Idea Check

## 判定
READY | NEEDS_INPUT | PARK

## Lifecycle
- 現在:
- 次:
- Plan Approvalが必要な判断:

## 中心主張候補
1文

## 一次経験・独自性
- 確認できたもの
- 不足しているもの

## 推奨
- 媒体:
- 記事タイプ:
- 想定読者:

## 根拠マップ
| 主張候補 | 根拠 | 状態 |

## 構成案
必要最小限の見出し

## 著者確認が必要
推測せず質問または不足事項を列挙
```

### 既存記事モード

```markdown
# Tech Blog Check

## 総合判定
PASS | NEEDS_REVISION | BLOCKED

## Lifecycle
- 現在:
- 次:
- 委譲先:

## 記事の核
- 想定読者:
- 読者課題:
- 中心主張:
- 読後価値:

## Gate Results
| Gate | 判定 | 根拠 |

## 優先修正
最大5件。重要度順

## 削れる内容
一般論、重複、別記事候補

## 著者確認が必要
経験、数値、判断理由などAIが補完できない項目

## 次のレビュー
既存コマンドへの接続提案
```

## ガードレール

- レビューのみの依頼では記事本文を変更しない
- 著者の経験、失敗、成果、感情を捏造しない
- 未検証コードを動作済みと扱わない
- 出典を確認できない外部主張を断定しない
- 一般論を無理に一次経験へ見せかけない
- 記事の中心主張を、著者確認なく別の主張へ変えない
- Plan Approval前に長文本文を自動生成しない
- 検索上位記事の多数派を、それだけで正しい主張・構成とみなさない
- `docs/article-lifecycle-contract.md` の状態・provenance・Metrics / Learning規約を本スキル内へ複製しない
- 公開、マージ、`published` / `ignorePublish` の切替を行わない
- `articles_note/drafts/` を編集しない

## 参考

- `AGENTS.md`
- `docs/article-lifecycle-contract.md`
- `docs/content-channel-strategy.md`
- `docs/article-guides/zenn-structure-best-practices.md`
- `articles_note/guides/note-structure-best-practices.md`
- `articles_note/checklists/note-article-quality-checklist.md`
- `.claude/skills/article-humanizer-ja/SKILL.md`
- `.claude/skills/article-review-apply/SKILL.md`
- `.claude/skills/note-article-review/SKILL.md`
- Forkwellイベント「おい、テックブログを書け」: https://jobs.forkwell.com/events/c8fat8q8c