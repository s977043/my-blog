---
title: "AIコーディングを承認なしに走らせない：PlanGate v8.5.0のHook enforcement入門"
emoji: "🚦"
type: "tech"
topics: ["ai", "claudecode", "githubactions", "oss", "automation"]
published: false
---

AIコーディングエージェントを使うと、実装の初速は大きく上がります。

一方で、速くなった分だけ次のような問題も目立ちます。

- 計画が曖昧なままコード変更に進む
- 関連しそうな改善をAIが勝手に広げる
- テスト観点が後付けになる
- PRの差分が大きくなり、レビューが重くなる
- セッションが変わると判断の根拠が失われる

PlanGate は、この問題に対して「AIをもっと賢くする」のではなく、**人間が承認するまで進めないゲート**を置くアプローチです。

> 承認なし、コードなし。

この記事では、PlanGate v8.5.0 時点の考え方と、Hook enforcement によって何を守れるようになったのかを整理します。

:::message
この記事で得られること

- AIコーディングで「実装前に止める」設計が必要になる理由
- PlanGate の C-3 / C-4 gate と成果物の全体像
- v8.5.0 の Hook enforcement 10/10 が何を守るのか
- 小さく導入するための順番と、最初に見るべきファイル
:::

## TL;DR

PlanGate は、AI コーディングエージェントを安全に使うための軽量ガバナンスハーネスです。

実装前に `plan.md` / `todo.md` / `test-cases.md` を作り、人間が C-3 gate で承認してから `exec` に進みます。

v8.5.0 では Hook enforcement が 10/10 実装済みになり、承認前の実装、計画改変、検証 evidence 不足、scope 外編集などを hook / CLI で検査できるようになりました。

「AIに速く書かせる」だけでなく、「AIがどこで止まるべきか」をチームで定義したい場合に向いています。

## この記事の対象読者

- Claude Code / Codex CLI などのAIコーディングエージェントを実務で使っている人
- AIが作るPRの差分が大きくなり、レビューに困っている人
- スクラムやPBIベースの開発で、AIにも計画・承認・検証の流れを守らせたい人
- OSSとしてPlanGateを試す前に、思想と導入順を把握したい人

## 通常のAI実装依頼との違い

PlanGateは、AIに実装させること自体を否定するものではありません。

違いは、実装開始前に「判断可能な成果物」を固定することです。

| 観点 | 通常のAI実装依頼 | PlanGate経由 |
| --- | --- | --- |
| 開始条件 | Issueや依頼文を読んだら実装開始 | `plan.md` / `todo.md` / `test-cases.md` 作成後、C-3承認で開始 |
| スコープ制御 | プロンプト上の注意に依存 | Non-goals / allowed_files / forbidden_files で境界を明示 |
| レビュー入口 | 生成された差分を読む | plan / test-cases / evidence と差分を照合する |
| 失敗時の戻し方 | 実装差分を戻す | 計画段階で修正しやすい |
| 監査性 | 会話ログに残りがち | `docs/working/TASK-XXXX/` に成果物として残す |

AIが速く実装するほど、チーム側には「実装前に何を合意したか」が必要になります。

PlanGateは、その合意をファイルとgateとして残すための仕組みです。

## PlanGateとは

PlanGate は、AI コーディングエージェントのためのガバナンス優先ワークフローハーネスです。

中心にある考え方はシンプルです。

```text
PBIを書く
→ AIが計画を作る
→ 人間がC-3で承認する
→ AIが実装する
→ 検証する
→ PRでC-4レビューする
→ マージする
```

つまり、AIにいきなり実装させるのではなく、先に次の成果物を作らせます。

- `plan.md`
- `todo.md`
- `test-cases.md`
- `review-self.md`
- `approvals/c3.json`

実装に進む前に、人間が「この計画でよいか」を判断します。

この時点で止められるのが重要です。実装後に方向修正するより、計画段階で止めるほうが安く済みます。

## なぜHook enforcementが必要なのか

プロンプトに「承認前に実装しないでください」と書くだけでも、ある程度は効きます。

しかし、実務で使うなら、それだけでは弱いです。

LLMは文脈を誤解することがあります。長いセッションでは指示の優先度も揺れます。人間側も、急いでいると承認前に実装へ進ませてしまうことがあります。

そこで PlanGate v8.5.0 では、守りたい不変条件を Hook と CLI で検査する方向に寄せました。

言い換えると、次の役割分担です。

| 層 | 役割 |
| --- | --- |
| Prompt | 目的、成功条件、停止条件を伝える |
| Artifact | plan / todo / test-cases / approval / evidence を残す |
| CLI | 成果物と承認状態を検証する |
| Hook | 破ってはいけない条件を実行時に検査する |

プロンプトでお願いするだけではなく、実行時のガードとして扱うのがポイントです。

## v8.5.0で守れるようになったこと

v8.5.0 では Hook enforcement が 10/10 実装済みになりました。

代表的には、次のような検査ができます。

| Hook | 目的 |
| --- | --- |
| EH-1 | `plan.md` なしの production code 編集を検知する |
| EH-2 | C-3承認なしの実装をブロックする |
| EH-3 | 承認後の `plan.md` 改変を `plan_hash` で検知する |
| EH-4 | `test-cases.md` なしの V-1 実行を検知する |
| EH-5 | 検証 evidence なしの PR 作成を検知する |
| EH-6 | `forbidden_files` による scope 外編集を検知する |
| EH-7 | C-3 / C-4 承認なしのマージを検知する |
| EHS-1 | standard 以上で V-3 外部レビューを必須化する |
| EHS-2 | handoff の必須要素を検査する |
| EHS-3 | fix loop の上限超過を検知する |

テストスイートも分かれています。

```bash
sh tests/run-tests.sh        # CLI / eval / schema など
sh tests/hooks/run-tests.sh  # hook enforcement
```

v8.5.0 時点では、CLI側が 24 PASS、hook側が 42 PASS です。

## 最小導入の流れ

PlanGateを試すだけなら、最初からすべてのHookを本番運用に入れる必要はありません。

まずは、1つのタスクで次の流れを試すのが現実的です。

```bash
# 1. 作業コンテキスト作成
/working-context TASK-0001

# 2. plan / todo / test-cases を作る
/ai-dev-workflow TASK-0001 plan

# 3. 人間が plan.md を読む
#    APPROVE / CONDITIONAL / REJECT を判断する

# 4. 承認後に実装へ進む
/ai-dev-workflow TASK-0001 exec
```

この時点で見るべきものは、完璧な自動化ではありません。

大事なのは、AIがコードを書く前に、次の3点を人間が確認できるかです。

- 何をやるか
- 何をやらないか
- どうなったら終わりか

この3点が揃わないまま実装に入ると、AIが速いほど差分も速く膨らみます。

## plan.mdで見るべき項目

PlanGateでは、`plan.md` が単なる作業メモではなく、実装に進むための判断材料になります。

私は最低限、次の項目を見ます。

```markdown
# Plan

## Goal
今回達成すること

## Non-goals
今回はやらないこと

## Scope
変更対象と影響範囲

## Test plan
実行するテスト、追加するテスト

## Risks
壊れやすい箇所、確認が必要な前提

## Acceptance criteria
完了条件
```

特に重要なのは `Non-goals` です。

AIは親切なので、関連する改善をつい広げます。リファクタリング、命名整理、文言の調整、周辺コンポーネントの整理など、単体では良さそうな変更が混ざることがあります。

しかし、レビュー可能性を保つには「今回はやらないこと」を先に決める必要があります。

`Non-goals` があると、レビューで次のように判断できます。

```text
この変更自体は良さそうだが、今回のNon-goalsに含まれているため別PRに分ける。
```

これは、AIを縛るためというより、チームの判断を安定させるための線引きです。

## forbidden_filesでスコープを守る

v8.5.0のHook enforcementで特に実務向けなのが、`forbidden_files` による scope 外編集検知です。

たとえば、子PBIで次のような境界を置けます。

```yaml
allowed_files:
  - src/features/user-list/**
  - tests/user-list/**

forbidden_files:
  - prisma/schema.prisma
  - src/app/api/**
  - .github/workflows/**
```

このような情報があると、AIが関連ファイルを広く読んだとしても、編集してよい範囲を明確にできます。

AIにとって「関連がありそう」は、必ずしも「今回変更してよい」ではありません。

この違いを明示できるのが、PlanGateの運用上の価値です。

## evalとschemaで後から検証する

PlanGateは、計画とHookだけではなく、evalとschemaも持っています。

`bin/plangate eval` は、完了済みタスクから8観点の評価を生成します。

例として、次のような観点を扱います。

- scope discipline
- approval discipline
- acceptance criteria coverage
- verification honesty
- stop behavior
- tool overuse
- format adherence
- latency / cost

また、`validate-schemas` によって、JSON artifact が schema に合っているかも検証できます。

```bash
bin/plangate validate-schemas TASK-0001
bin/plangate eval TASK-0001 --no-write
```

AI駆動開発では、実装速度だけを見ると判断を誤ります。

スコープを守れたか、承認前に進まなかったか、検証結果を正直に残したか。こうした観点を後から見られることが、運用を安定させます。

## 導入前チェックリスト

PlanGateを入れる前に、まず次の問いに答えられるかを確認すると、導入しやすくなります。

- AIが実装に入る前に、人間が承認すべき成果物は何か
- 今回やらないことを、どこに書くか
- テスト観点を、実装前に誰が確認するか
- scope外ファイルをどう定義するか
- 実装後の検証 evidence をどこに残すか
- C-4のPRレビューで、人間が最終判断する観点は何か

この問いに答えられない場合、いきなりHookをstrictにするより、まず `plan.md` と `test-cases.md` の運用から始めるほうがよいです。

## どこから本番導入するか

いきなり全Hookをstrictにする必要はありません。

おすすめは、次の順番です。

1. まず `plan.md` / `test-cases.md` / C-3承認を手動運用で試す
2. 次に `bin/plangate validate` をCIやPR前チェックに入れる
3. その後、誤検知が少ないHookからdefault warningで入れる
4. 運用が固まったものだけ strict block に上げる

PlanGateのHookには、default / strict / bypass の3モード設計があります。

| モード | 使い方 |
| --- | --- |
| default | warning中心。導入初期向け |
| strict | ブロックする。本番運用向け |
| bypass | 緊急時のescape。監査ログ前提 |

最初からすべてを止めると、AI作業の妨げになることがあります。

まずはwarningで観測し、どの条件なら安全にブロックできるかを見るほうが現実的です。

## まとめ

AIコーディングエージェントの課題は、「コードを書けるか」から「どう安全に進めるか」へ移っています。

PlanGateは、そのための軽量なガバナンスハーネスです。

- 計画を作る
- 人間が承認する
- 承認後に実装する
- 検証結果を残す
- Hook / CLI / Schema / Evalで運用を検査する

この流れにすると、AIの速度を活かしながら、チームがレビューできる形を保ちやすくなります。

AIに任せる範囲を広げるほど、止める場所の設計が重要になります。

PlanGate v8.5.0 の Hook enforcement は、その「止める場所」をプロンプトのお願いではなく、実行可能な仕組みに近づけるための一歩です。

まず試すなら、1つのタスクだけで十分です。

`plan.md` を作らせ、人間が読み、承認してから実装に進める。そこから始めるだけでも、AIとの開発はかなりレビューしやすくなります。

## 次の一歩

- まずは PlanGate の README を読み、`plan → approve → exec` の流れを確認する
- 既存の小さなIssueを1つ選び、`plan.md` と `test-cases.md` だけを手動で試す
- 良さそうなら GitHub でスターして、後で試せるように保存する
- 実際に試して詰まった点があれば、Issue や Discussions でフィードバックする

PlanGate はまだ発展中のOSSです。
AIコーディングをチームで安全に回すためのハーネスとして、実務からのフィードバックを歓迎しています。

## 参考リンク

- [PlanGate GitHub Repository](https://github.com/s977043/PlanGate)
- [CHANGELOG](https://github.com/s977043/PlanGate/blob/main/CHANGELOG.md)
- [Hook enforcement](https://github.com/s977043/PlanGate/blob/main/docs/ai/hook-enforcement.md)
