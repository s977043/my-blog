---
title: AIの止まり方を「数字で見る」ようにした体験：PlanGate v8.6.0でMetrics v1とGovernanceを入れた話
tags:
  - 生成AI
  - AI駆動開発
  - チーム開発
  - ClaudeCode
  - コードレビュー
private: false
updated_at: '2026-05-06T17:30:00+09:00'
id: null
organization_url_name: null
slide: false
ignorePublish: false
---

## はじめに

AIコーディングエージェントを使っていると、最初の関心は「どこまで書けるか」になります。

ただ、チームで使うようになると、関心は次に移ります。

- どこで止めるか
- どれくらい止まっているか
- 止めた結果、運用は良くなっているのか

自分は **PlanGate** というワークフローを作って、AIに実装させる前に計画を立てさせ、人間が承認してから実装に進める運用にしてきました。考え方はシンプルです。

> 承認なし、コードなし。

v8.5.0 までで「止める」ための仕組み（Hook enforcement 10/10）は出揃いました。続く v8.6.0 で、その上に **「止まった回数を記録して比較する」** ための仕組みが乗りました。

この記事は、PlanGate v8.6.0 で入れた Metrics v1 と Governance を、なぜ入れたか・入れて何が変わったかという体験ベースで書きます。

## 先に結論

v8.6.0 でやったことを一言でまとめると、こうです。

**AIをどこで止めたかを、感想ではなく数字で振り返れるようにした。**

具体的には次の 4 つを順番に入れました。

| # | 入れたもの | これがないと何が困るか |
| --- | --- | --- |
| 1 | 改善前 baseline | 「良くなった気がする」で終わってしまう |
| 2 | Issue governance | AIが Roadmap PBI を「もっともらしく」推測で埋めてしまう |
| 3 | Metrics privacy ポリシー | 何を保存して良いか毎回考えることになる |
| 4 | Metrics v1（11 events） | Hookが何回どこで止まったか分からない |

順番が大事で、4 番目（Metrics 実装）の前に 1〜3（baseline / governance / privacy）を確定させています。これがないと、Metricsを取り始めても「比較対象がない」「保存可否を都度判断」「推測データが混ざる」で、せっかく取った数字が信頼できなくなります。

この記事は、PlanGate を v8.5.0 まで触ってきた人、または「AI のレビュー疲れを数字で改善したい」と感じている人向けです。

## 以前の使い方で困ったこと

最初は、AIにかなり直接的に頼んでいました。

```markdown
このIssueを読んで実装してください。
関連ファイルを確認し、必要な変更を入れてください。
```

これでも動くコードは出ます。でも、チームでレビューする段階で困ることが増えました。

たとえば、小さなUI修正のつもりだったのに、AIが周辺コンポーネントの整理までしてくれる。単体で見れば悪い変更ではないのですが、レビュー側はこうなります。

- 今回の目的に必要な変更なのか分からない
- ついでの改善を入れるかどうかをレビュー中に判断する必要がある
- 確認すべきテスト範囲が増える
- PRが大きくなり、レビューの焦点がぼやける

AIが悪いというより、**実装前の境界が曖昧だった**のだと思います。人間同士でも、スコープが曖昧なタスクは膨らみます。AIの場合は、それが速く、大量に起きます。

## v8.5.0 までで「止める」は揃った

そこで PlanGate では、AIにいきなりコードを書かせるのをやめました。

まず次の成果物を作らせます。

```text
plan.md
todo.md
test-cases.md
review-self.md
```

そして人間が `plan.md` を読んでから判断します（C-3 gate と呼んでいます）。

- APPROVE
- CONDITIONAL
- REJECT

v8.5.0 までで、この C-3 を**プロンプトのお願いではなく実行時に強制する**ための Hook が 10 本揃いました。

| Hook | 何を止めるか |
| --- | --- |
| EH-1 | `plan.md` なしの production code 編集 |
| EH-2 | C-3 承認なしの実装 |
| EH-3 | 承認後の `plan.md` 改変（`plan_hash` 検査） |
| EH-4 | `test-cases.md` なしの V-1 検証 |
| EH-5 | 検証 evidence なしの PR 作成 |
| EH-6 | `forbidden_files` の scope 外編集 |
| EH-7 | C-3 / C-4 承認なしのマージ |
| EHS-1 | standard 以上で V-3 外部レビュー必須 |
| EHS-2 | handoff の必須要素チェック |
| EHS-3 | fix loop 上限超過 |

ここまでで、「**危ないことはだいたい止まる**」状態にはなりました。

## でも、止まったかどうかが分からない

ところが、運用していて気づいたのは別の問題です。

- Hook が今週どこで何回発火したか、覚えていない
- 「最近 forbidden_files が出やすい気がする」が感想ベース
- TASK ごとに C-3 が CONDITIONAL になった割合を出せない
- 改善のために Hook を strict 化したくても、効果を比較できない

**止めることはできるが、止めたことを振り返れない**。これが v8.6.0 を作る動機でした。

## v8.6.0 で入れた Metrics v1

そこで PlanGate v8.6.0 では、TASK の進行で起きる出来事を 11 種類のイベントとして定義し、JSON Schema (`schemas/plangate-event.schema.json`) で型を固定しました。

| Event | 何を記録するか |
| --- | --- |
| `task_initialized` | TASK ディレクトリ作成、PBI 番号、mode |
| `plan_generated` | plan / todo / test-cases が揃ったか |
| `c3_decided` | C-3 の判定（APPROVED / CONDITIONAL / REJECTED） |
| `exec_started` | exec フェーズ開始 |
| `hook_violation` | どの hook が、どの条件で発火したか |
| `v1_completed` | V-1 完了、AC PASS/FAIL/WARN 件数 |
| `fix_loop_incremented` | 修正ループ回数 |
| `external_review_completed` | V-3 外部レビュー結果 |
| `pr_created` | PR 番号と差分サマリ |
| `c4_decided` | C-4 マージ承認 |
| `handoff_completed` | handoff 必須要素チェック |

集計は CLI で行えます。

```bash
# TASK ディレクトリから 6 events を自動導出して NDJSON に追記
bin/plangate metrics --collect TASK-0061

# TASK 単位のサマリ
bin/plangate metrics --report TASK-0061

# 全 TASK 横断（hook violation / C-3 / V-1 / C-4 / fix_loop_max / mode）
bin/plangate metrics --aggregate

# JSON 出力（dashboard 連携向け）
bin/plangate metrics --aggregate --json
```

これを入れてから、retrospective でこういう会話ができるようになりました。

```text
今週 forbidden_files が 4 件出てる。
3 件は同じ PBI で、scope 定義が広すぎたっぽい。
次の sprint で allowed_files を分割しよう。
```

「気がする」ではなく、**TASK と回数で会話できる**ようになったのが大きな変化でした。

## 「推測で埋めない」というルール

Metrics と一緒に整えたのが、Issue 運用のルール（`docs/ai/issue-governance.md`）です。

きっかけは v8.5.0 → v8.6.0 期間で発覚した事故でした。Roadmap の PBI 11 件が **誤って v7.x の milestone に紐付いていた**のです。

原因は、Issue Form を AI に埋めさせると、milestone をそれっぽく推測してくれてしまうことでした。LLM は親切なので、「このタスクならたぶん v7.5 だろう」と空欄を埋めます。それが大量に積まれていた、という話です。

そこで v8.6.0 では governance docs §4 で **推測禁止条項** を明文化しました。

> Roadmap PBI を Issue 化するとき、Why / What / AC / Non-goals / Labels / Milestone を**推測で埋めてはならない**。明示されていない要素は「未確定」として残し、確定後に更新する。

支える仕組みは 2 つです。

1. `.github/ISSUE_TEMPLATE/plangate-roadmap-task.yml` — Roadmap PBI 用の Issue Form。Why / What / AC / Non-goals / Labels / Milestone を **必須入力で強制**
2. Label taxonomy — `kind` / `area` / `priority` / `status` の **4 軸**で分類。milestone mapping は別ドキュメント

「AI が代わりに書ける部分」と「人間が確定するまで埋めてはいけない部分」を分離するのが要点です。

## 改善前の baseline を取っておく

もう 1 つ、地味ですが大事だったのが baseline 取得です（`docs/ai/eval-baselines/2026-05-04-baseline.{md,json}`）。

代表 5 TASK を選び、PlanGate の既存 8 観点 eval（scope / approval / AC coverage / verification / stop / tool overuse / format / latency-cost）を全件適用して、結果を JSON snapshot で保存しています。

これがあると、後続の改善（v8.7.0 候補の Eval expansion / Model Profile v2 / Tool Error Taxonomy など）を入れたときに、**観点ごとに baseline と diff** が取れます。

逆に言うと、baseline がないままでは harness を改善しても「なんとなく良くなった気がする」で終わります。Metrics v1 と組み合わせて、**「比較で判断できる harness」** が v8.6.0 のゴールでした。

## Privacy はスキーマで強制する

Metrics を入れるときに最初に決めたのが、何を記録して**良いか**ではなく、何を記録しては**いけないか**です（`docs/ai/metrics-privacy.md`）。

- **保存可能 12 カテゴリ**: TASK ID、event 種別、timestamp、mode、AC count、hook 名、C-3/C-4 decision、V-1 result、fix loop count、PR 番号、差分行数集計、handoff 必須要素チェック結果
- **禁止 9 カテゴリ**: file path（フルパス）、stack trace、command output、provider metadata、API key、ユーザー名、commit message 全文、コード本文、private prompt 内容

スキーマ設計時にこの線引きが先行参照されるので、**Forbidden カテゴリは schema 上に存在しない**形になっています。Metrics を on にしただけで漏れる、という事故が起きにくい構造です。

events.ndjson は `docs/working/_metrics/events.ndjson` に出力されますが、`.gitignore` 済で public repo に commit されません。

## 数字で振り返るとどう変わるか

Metrics v1 が入ってから、retrospective の会話は確実に変わりました。

以前はこんな感じでした。

```text
今週は Hook がよく止まってた印象。
plan.md の運用が定着してきた気がする。
forbidden_files の指定が雑だったかも。
```

今はこうなります。

```text
今週は hook_violation が 12 件、内訳は forbidden_files が 8、
plan_hash が 3、merge_approval が 1。
forbidden_files の 8 件中 5 件は TASK-0078 系。
allowed_files の glob を見直そう。
```

差は「印象」と「件数 + TASK」の差ですが、改善アクションの粒度が変わります。

そして、ここで取れる数字は v8.7.0 以降の改善（#196 Eval comparison / #198 Keep Rate / #199 Dynamic Context など）の評価指標にもそのまま使われる予定です。**Metrics v1 は dashboard というより、後続改善の評価軸**として置いた、という位置付けが近いです。

## 導入するときの注意点

Metrics v1 まで入れる場合、**先に baseline と privacy を読む**のを強くおすすめします。

```text
1. docs/ai/metrics-privacy.md を読む（保存可能/禁止の線引きを把握）
2. 既存 TASK から代表 3〜5 件で baseline snapshot を作る
3. bin/plangate metrics --collect <TASK> --dry-run で events 抽出を確認
4. Issue 運用を governance テンプレートに揃える
5. dry-run を外し、bin/plangate metrics --aggregate で週次集計を始める
```

特に 1 と 2 を飛ばすと「Metrics は取れているが何と比較すればいいか分からない」状態になります。これは Metrics を取り始めてから気付くと辛いので、最初に整える価値があります。

## 明日から試すなら

PlanGate v8.6.0 をいきなり全部導入しなくても、まずは次の依頼文だけで考え方を試せます。

```markdown
まず実装計画を作ってください。
まだコードは変更しないでください。
計画には、Goal / Non-goals / Scope / Test plan / Risks を含めてください。
```

返答を見て、人間が次の 3 点だけ確認します。

- 今回やらないことが明確か
- テスト観点がレビュー可能な粒度か
- AIが触ろうとしている範囲が広すぎないか

ここまでが v8.5.0 相当の体験です。

その上で「**止めた回数を集計したくなった**」段階で、v8.6.0 の Metrics v1 / governance / baseline / privacy を入れに行く、という順序で十分だと思います。

## まとめ

AIコーディングエージェントの課題は、これから 3 つのフェーズで進む気がしています。

1. **コードを書けるか**（モデルの能力）
2. **どう安全に進めるか**（PlanGate v8.5.0 までの Hook enforcement）
3. **改善できているか観測できるか**（PlanGate v8.6.0 の Metrics v1 / governance / baseline）

3 番目に入って気付いたのは、AI 運用は「強くする」より「**感想で運用しないこと**」のほうが効くということでした。

Hook で止めたら必ずイベントが残る。Roadmap PBI は推測で埋めない。改善前の状態は snapshot で固定する。これが揃うと、AI 運用が retrospective に乗せられるようになります。

PlanGate v8.6.0 は、その最初のひと揃いとして作りました。Hook で止めた経験があるチームほど、「止めた回数の集計」と「baseline との比較」の効きが体感できると思います。

## 参考リンク

- [PlanGate GitHub Repository](https://github.com/s977043/PlanGate)
- [PlanGate CHANGELOG（v8.6.0）](https://github.com/s977043/PlanGate/blob/main/CHANGELOG.md)
- [Harness Improvement Roadmap (EPIC #193)](https://github.com/s977043/plangate/issues/193)
- [Issue governance](https://github.com/s977043/PlanGate/blob/main/docs/ai/issue-governance.md)
- [Metrics privacy](https://github.com/s977043/PlanGate/blob/main/docs/ai/metrics-privacy.md)
- [Metrics 運用 guide](https://github.com/s977043/PlanGate/blob/main/docs/ai/metrics.md)
- [Hook enforcement](https://github.com/s977043/PlanGate/blob/main/docs/ai/hook-enforcement.md)
