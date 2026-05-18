---
title: プロンプトを磨くのをやめた：チームのレビュー知識を Agent Skills に変える River Reviewer 体験
tags:
  - 生成AI
  - AI駆動開発
  - コードレビュー
  - GitHubActions
  - OSS
private: false
updated_at: '2026-05-19T00:00:00+09:00'
id: null
organization_url_name: null
slide: false
ignorePublish: false
---

## はじめに

AI コードレビューを「とりあえず PR に投げる」段階から、チームで運用する段階に進めようとして、プロンプトを磨き続けていました。

最初はそれで十分でした。

ただ、人とプロジェクトが増えるに従って、次の問題が一気に出てきました。

- レビュー指摘の粒度が PR ごとにばらつく
- 同じ判断基準を毎回プロンプトに書き直す
- 「このレガシーコードは触るな」がプロンプトから抜け落ちる
- 改善した判断ロジックが、次のセッションで失われる
- レビュー結果を後から検証できない

つまり、AI レビューを「**チームの資産にできない**」状態でした。

そこで触ってみたのが [River Reviewer](https://github.com/s977043/river-reviewer/) という OSS フレームワークです。

考え方はシンプルです。

> プロンプトを磨くのをやめて、チームのレビュー知識を **Agent Skills（マニュアル付きの道具箱）** として明示化・バージョン管理する。

この記事では、River Reviewer を実際に触ってみての体験と、AI レビューを「再現可能な資産」にする運用設計を、Qiita 向けに体験寄りでまとめます。

## 先に結論

River Reviewer を入れて一番効いたのは、AI レビューの精度ではありません。

**「レビュー判断の根拠が後から再現できる」状態を作れたこと**です。

具体的には次の 3 つを順番に組んでいきました。

| # | 入れた要素 | これがないと何が困るか |
| --- | --- | --- |
| 1 | Agent Skills（暗黙知の明示化） | プロンプトに毎回判断基準を書く、改善が積み上がらない |
| 2 | 自由度の設計（崖・丘・原っぱ） | AI の裁量と検証コストを制御できず、レビュー疲れが出る |
| 3 | HITL（Human-in-the-Loop）ワークフロー | 結果が「AI が言ってる」で終わり、検証できない |

順番が大事で、3 番目（HITL）の前に 1〜2（Skills と自由度）を確定させています。これがないと、HITL を回しても「何を人間が判断するべきか」が曖昧になり、結局「AI 出力をそのまま貼る」運用に戻ってしまいます。

この記事は、AI コードレビューを v8.5.0 級の精度で組んでみたが「チームに展開すると崩れる」と感じている人向けです。

## 以前の使い方で困ったこと

最初は、PR ごとに直接プロンプトを書いていました。

```markdown
このPRをレビューしてください。
特に DB マイグレーションと API の後方互換性に注意してください。
```

これでも、けっこう動くレビューは出ます。

でも、チームで使い始めると困ることが増えました。

たとえば、ある人が PR で「DB マイグレーション順序のチェックを強くしたい」と要望したとします。

そのときは、プロンプトに「マイグレーション順序を確認」と追記すれば対応できます。

しかし次の問題が起きます。

- 別の人の PR ではその指示が抜ける（毎回コピペ忘れる）
- 何ヶ月か経つと、なぜその指示を入れたかの背景が忘れられる
- 「マイグレーション順序」の正しい判定基準が、プロジェクト固有なのに言語化されていない
- 改善されたプロンプトが、誰の手元にあるか分からなくなる

AI が悪いというより、**判断基準を人間側で資産化していなかった**のが原因でした。

人間同士のレビューでも、ベテランの暗黙知は新人に伝わりにくいです。AI の場合は、それが一回ごとに完全リセットされる、と言ってもいい状態でした。

## v8.5.0 まで Hook で止めた、その先で困ること

別記事 [PlanGate v8.6.0 の Metrics v1 と Governance を入れた話](https://qiita.com/s977043/items/5ebff79112ecf1af872c) で、自分は AI コーディングエージェントの「実装前に止める」仕組みを作っていました。

PlanGate は **「承認なし、コードなし」** が中心で、計画段階で止めることを得意としています。

でも、計画段階で止めても、実装後のレビューは依然として人手依存でした。

- レビュー観点の網羅性が PR ごとにブレる
- ベテランがいないプロジェクトでは、観点自体が出てこない
- AI レビューを使ってもプロンプト依存で、知識として残らない

実装前後を分けて言うと:

| フェーズ | PlanGate（実装前） | River Reviewer（実装後） |
| --- | --- | --- |
| 主役 | 計画と承認 | レビューの自動化と再現性 |
| 単位 | plan / todo / test-cases / approvals | Skills / Findings / Validation |
| 失敗時の戻し方 | 計画段階で修正 | スキル追加 / 設定で次回に活かす |

この 2 つが揃って、AI コーディングを「速度を上げつつチームで運用できる形」に近づきます。

## River Reviewer とは（何で、何でないか）

[River Reviewer](https://github.com/s977043/river-reviewer/) は、OSS の **artifact-driven なコードレビューフレームワーク**です。

ひとことで言うと、こうです。

**「PR の差分」だけを AI に投げるのではなく、`plan` / `diff` / `test-cases` / `junit` / `coverage` などのアーティファクトを入力にして、Skill Registry から状況に応じた Skill を選んでレビューする。**

何で **ない** かも明示されています。

- 「すべてのレビューを自動化するツール」ではない（HITL 前提）
- 「プロンプトを書きやすくするテンプレート集」ではない（Skill が主役）
- 「PlanGate の代替」でもない（連携対象）

リポジトリには次の構造があります（抜粋）。

```text
river-reviewer/
├── skills/           # Agent Skills の本体
│   ├── upstream/     # 設計フェーズ向け
│   ├── midstream/    # 実装フェーズ向け
│   └── downstream/   # QA フェーズ向け
├── pages/            # 公開ドキュメント（Vercel）
├── schemas/          # Findings / Review Artifact のスキーマ
├── runners/          # GitHub Actions / CLI / Node API ランナー
└── eval/             # Skill の評価フィクスチャ
```

「Skill を作る・育てる」ためのリポジトリ、と理解するのが早いです。

## Agent Skills の考え方

一番効いたのは「Agent Skills」という単位での暗黙知整理でした。

たとえば、上流（設計）の Skill 例は次のようになっています。

```text
skills/upstream/rr-upstream-plangate-plan-integrity-001/
├── SKILL.md                  # Skill メタデータ（何を見るか、対象 phase）
├── prompt/system.md          # 判断ロジック（system プロンプト）
├── prompt/user.md            # 入力テンプレート（user プロンプト）
├── fixtures/                 # 入力サンプル（評価用）
├── golden/                   # 期待出力（eval 比較対象）
└── eval/promptfoo.yaml       # promptfoo 設定（eval ランナー）
```

ポイントは、Skill ごとに次が **ファイルとして残る**ことです。

- **何を見るか**（`SKILL.md` のメタデータと観点）
- **どう判断するか**（`prompt/system.md` と `prompt/user.md`）
- **何が成功か**（`fixtures/` と `golden/`、`eval/promptfoo.yaml` で機械評価）
- **どう改善するか**（promptfoo の eval 結果と golden の差分）

これがあると、新人が「なぜこのレビュー観点があるのか」を後から追えます。

そして大事なのは、**Skill 自体が継続改善できる**ことです。

レビュー結果に違和感があれば、対応する Skill の `prompt/system.md` や `prompt/user.md` を直し、`fixtures/` に再現サンプルを足し、`eval/promptfoo.yaml` で回して `golden/` との差分を比較する。一連の改善ループが、コードと同じワークフローで回せます。

## 自由度の設計（崖・丘・原っぱ）

River Reviewer のドキュメントで面白い概念が **「自由度の設計」** です。

レビューの判断には、AI に任せていい範囲（自由度）があります。これを 3 段階に分けるのが提唱されています。

- **崖**: 越えると致命的（例: 認可ロジックの後方互換性違反）→ 強くブロック
- **丘**: 注意したい（例: テストカバレッジ不足）→ warning
- **原っぱ**: 自由に動いてよい（例: 命名スタイル）→ 緩く

これは、PlanGate の Hook の `default warning / strict block / bypass` と同じ思想です。

レビューも「全部 strict にすると疲れる」「全部 warning にすると見落とす」という両極端があるので、**観点ごとに自由度を設計する**のが効きます。

実務では、最初は「丘」中心で warning を出し、運用が固まった項目から「崖」に上げていく、という段階運用がしやすいです。

## HITL（Human-in-the-Loop）ワークフロー

3 つ目が HITL ワークフローです。

River Reviewer は **`Plan / Validate / Verify`** の 3 ステップを前提にしています。

```text
1. Plan       — どの Skill をどの順で適用するか、人間が事前に確認
2. Validate   — Skill の実行結果（findings）を構造化して出力
3. Verify     — 人間が findings を検証、必要なら Skill を改善
```

「投げて結果を貼る」ではなく、「投げる前に計画を見る」「結果は構造化されたファイルとして残す」「次回の改善材料にする」というループです。

これは Qiita でレビュー記事を読んでいて感じる **「AI レビュー結果を本当に信じていいの？」** という不安への、フレームワーク側からの回答だと思います。

## GitHub Actions で最小導入

実際に試すなら、GitHub Actions のリリースタグ（v0.28.0 系）で最小構成を組めます。`runners/github-action` のサブパスを参照する形が公式推奨です。

```yaml
name: River Reviewer
on:
  pull_request:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0
      - uses: s977043/river-reviewer/runners/github-action@v0.28.0
        with:
          phase: midstream  # SDLC フェーズに応じてスキル選択
          dry_run: true     # 初回は出力だけ確認、本実行に切り替えるのは確認後
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`phase` の値（`upstream` / `midstream` / `downstream`）で適用される Skill 群が切り替わります。たとえば後述の **PlanGate 連携 Skill は `phase: upstream`** に置かれているため、`phase: midstream` の最小例で動かしたいのは中流（実装フェーズ）向けの Skill です。

最初は **`dry_run: true`** で findings の出力だけを確認し、`estimate: true` で実行コストの目安を見てから、`dry_run` を外して本実行に切り替えるのが安全です。

これだけで、PR に対して `findings` 付きのレビューコメントが返ってきます。

## PlanGate との連携

River Reviewer は単独でも動きますが、PlanGate と組み合わせると効きます。

- **PlanGate**（実装前）が `plan.md` / `todo.md` / `test-cases.md` を成果物として生成
- **River Reviewer**（実装後）がその成果物を入力にして整合性を検査

具体的な Skill 例（いずれも `skills/upstream/` に置かれた **`phase: upstream` の Skill** です）:

- `rr-upstream-plangate-plan-integrity-001` — `plan` の整合性・網羅性をチェック
- `rr-upstream-plangate-exec-conformance-001` — `plan` と `diff` の一致をチェック

つまり、PlanGate が「人間が計画を承認したか」を保証し、River Reviewer が「実装が計画通りか」を保証します。

詳細な 2 層ガード設計の思想は [Zenn 記事「AI 駆動開発の 2 層ガード設計」](https://zenn.dev/minewo/articles/ai-dev-guardrail-plangate-river-reviewer) にまとめています。本記事は **GitHub Actions と `skills/upstream/` の実物を触って始める導入寄り** に絞っています。

## 始めるなら

River Reviewer をいきなり全 Skill 導入する必要はありません。

最初は、次の流れで十分試せます。

1. 既存リポジトリのどこか 1 つの PR で、`s977043/river-reviewer/runners/github-action@v0.28.0` を `phase: midstream` + `dry_run: true` で動かす
2. `estimate: true` で実行コストの目安を確認し、問題なければ `dry_run` を外す
3. 出力された `findings` を見て、**ピントが合っている指摘 / 合っていない指摘**を分類する
4. 合っていない指摘について、対応する Skill を 1 つだけ選んで `SKILL.md` と `prompt/system.md` / `prompt/user.md` を見る
5. Skill 側の表現を直すか、新しい Skill を 1 つ追加し、`fixtures/` と `golden/` を `eval/promptfoo.yaml` で回して比較する
6. 同じ PR で再実行して改善を確認

ここまでで、AI レビューが「単発のプロンプト依頼」から「**継続改善できる仕組み**」に切り替わったことを実感できます。

逆に、最初から全 Skill / 全 phase を入れると、Skill 同士の責務や eval の整備が間に合わず、運用負荷が勝ってしまいます。

## 導入するときの注意点

実際に運用してみて気づいた注意点をいくつか。

- **Skill はチームの暗黙知の数だけ作れるが、全部作ろうとしない**。最初は 3〜5 個まで
- **Skill には必ず eval フィクスチャを置く**。これがないと「改善したつもり」で精度が下がっても気づけない
- **AI レビューの結果を「人間が完全に信じる」運用にしない**。HITL を厳守
- **PlanGate と組み合わせるなら、PlanGate の `plan` / `todo` / `test-cases` 運用が安定してから**（目安として 1 ヶ月程度）。どちらも一度に入れると認知負荷が大きい

特に最初の 2 つは、River Reviewer のドキュメントでも繰り返し言われています。

## 明日から試すなら

River Reviewer をいきなり全部導入しなくても、まずは次の問いから始められます。

```markdown
チームのコードレビューで、毎回同じ指摘を出している項目を 5 つ書き出す。
それぞれについて、「なぜその指摘が必要か」を 1 行で書く。
```

この 5 つが、**最初の Agent Skill 候補**です。

その上で、River Reviewer の [スキル作成チュートリアル](https://river-reviewer.vercel.app/tutorials/creating-your-first-skill/) を見ながら 1 つだけ実装してみてください。

## まとめ

AI コードレビューの課題は、これから 3 つのフェーズで進む気がしています。

1. **プロンプトを書ければレビューできる**（モデルの能力）
2. **チームで運用できる仕組みになる**（Skill Registry / 自由度の設計）
3. **改善できているか観測できる**（eval / Findings の構造化）

River Reviewer は 2〜3 番目を埋めるための OSS フレームワークです。

3 番目に入って気付いたのは、AI レビューは **「強くする」より「感想で運用しないこと」** のほうが効くということでした。

PlanGate v8.6.0 を Metrics v1 で語った [Qiita 記事](https://qiita.com/s977043/items/5ebff79112ecf1af872c) と並行して、レビュー側にも「数字で扱える資産」が必要、という課題感を持つ人に向いていると思います。

## 参考リンク

- [River Reviewer GitHub Repository](https://github.com/s977043/river-reviewer/)
- [River Reviewer ドキュメント (Vercel)](https://river-reviewer.vercel.app/)
- [スキル作成チュートリアル](https://river-reviewer.vercel.app/tutorials/creating-your-first-skill/)
- [アーキテクチャ解説](https://river-reviewer.vercel.app/explanation/river-architecture/)
- [Artifact Input Contract](https://github.com/s977043/river-reviewer/blob/main/pages/reference/artifact-input-contract.md)
- 関連記事:
  - Zenn: [AI 駆動開発の 2 層ガード設計：PlanGate と River Reviewer で実装前後を守る](https://zenn.dev/minewo/articles/ai-dev-guardrail-plangate-river-reviewer)
  - Zenn: [AI エージェントを"投げっぱなし"にしない：Agent Skills と自由度の設計](https://zenn.dev/minewo/articles/zenn-river-reviewer-architecture)
  - note: [「プロンプトを磨けば勝てる」をやめた：AI レビューを運用に乗せる "Agent Skills" 設計](https://note.com/mine_unilabo/n/nd21c3f1df22e)
  - Qiita: [AIの止まり方を「数字で見る」ようにした体験：PlanGate v8.6.0 で Metrics v1 と Governance を入れた話](https://qiita.com/s977043/items/5ebff79112ecf1af872c)
  - Growth Lab: [プロンプトエンジニアリングの終焉：「スキル定義ファイル」でAIを即戦力にする](https://the3396.com/articles/agent-skill-hub)（本記事の「プロンプトを磨くのをやめた」をシリーズとして体系化した解説）
