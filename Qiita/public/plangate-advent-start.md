---
title: "Claude Codeに実装を任せる前に「変更しないこと」を決める ― 自作OSS PlanGateの始め方"
tags:
  - ClaudeCode
  - AI駆動開発
  - OSS
  - PlanGate
  - テスト
private: true
updated_at: null
id: null
organization_url_name: null
slide: false
ignorePublish: true
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

Claude Code に「表示文言を直して」と頼むとき、変更してほしい場所は伝えても、変えてほしくない場所まで決めているでしょうか。

実装計画ができたことと、その計画で実装を始めてよいことは別です。この記事では、私が開発している OSS [PlanGate](https://github.com/s977043/PlanGate) を例に、実装前の判断材料を揃える方法を紹介します。

Claude Code を使っている開発者が、次の一つのタスクで試せる内容に絞ります。例は説明用の合成タスクです。Node.js で受入テストと差分を確認した結果を示しますが、PlanGate や Claude Code でこのタスクを実行した結果ではありません。PlanGate v8.24.0 の公開仕様を参照しています。

## 変更することと、変更しないこと

たとえば、画面に表示する「保存する」を「変更を保存する」に変えたいとします。

「分かりやすくして」という依頼だけでは、どこまで直してよいのかが決まりません。保存処理の共通化、API の変更、依存ライブラリの追加まで提案されたとき、それを今回の変更に含めてよいか判断しづらくなります。

実装を任せる前に、次のように入力を揃えます。PlanGate の PBI INPUT PACKAGE を簡略化した例です。

```markdown
## Context / Why
保存ボタンの意味を明確にしたい。

## What（Scope）
### In scope
- 保存ボタンの表示文言を「変更を保存する」にする。
- 表示文言の確認テストを更新する。

### Out of scope
- 保存APIのURL、HTTPメソッド、リクエスト形式
- 保存成功・失敗時の振る舞い
- 既存の依存関係

## 受入基準
- AC-01: 表示に使う文字列が「変更を保存する」である。
- AC-02: 従来の保存成功・失敗時のテストが通る。
- AC-03: API契約・依存定義に今回の変更がない。
```

重要なのは、Out of scope を書くだけで終わらせないことです。変更しないことにも、確認の方法を用意します。

| 受入基準 | 確認方法 |
| --- | --- |
| AC-01 | 表示に使う文字列のテスト |
| AC-02 | 既存の成功・失敗時のテスト |
| AC-03 | 合意した基準からの変更ファイルと契約・依存定義の差分確認 |

## 合成タスクで受入条件を確かめる

この例は学習用のため、外部依存のない小さな Git リポジトリで確かめました。Node.js v22.16.0 で、保存処理の URL・payload・成功時の戻り値・例外の伝播を確認するテストと、表示文言のテストを用意しました。

たとえば表示に使う定数を変更するなら、実装の変更より先に期待値を決められます。

```javascript
// test/label.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { saveLabel } from '../src/label.mjs';

test('button label', () => {
  assert.equal(saveLabel, '変更を保存する');
});
```

`src/label.mjs` の `export const saveLabel = '保存する';` は最初の状態です。テストを新しい期待値に変更した後、定数を `変更を保存する` に変更します。

| 段階 | 観測結果 |
| --- | --- |
| 変更前（既存テスト） | 3件成功 |
| 表示テストだけを新しい期待値に変更 | 2件成功・1件失敗（終了コード1） |
| 表示文言の定数を変更 | 3件成功 |
| Git の変更ファイル確認 | `src/label.mjs` と `test/label.test.mjs` のみ |

テストの対象は表示に使う文字列定数と、モックした保存処理です。実際の UI 表示、通信、PlanGate のゲート強制を確認したものではありません。

確認に使ったコマンドは次のとおりです。合成リポジトリの構成に合わせた例なので、読者のプロジェクトでは既存のテストコマンドとパスに置き換えます。

```bash
node --test test/*.test.mjs
git status --short
git diff HEAD --name-only
git diff HEAD --exit-code -- src/save.mjs test/save.test.mjs
```

ここでは変更前の状態を `HEAD` にコミットしておきます。`git diff HEAD` は追跡済みファイルを基準と比較し、`git status --short` は未追跡ファイルも確認するために併用します。実プロジェクトでは依存定義や API の契約ファイルも、非変更範囲に応じて確認対象へ加えます。

## PlanGate では何を判断するのか

PlanGate は、計画、承認、実装、検証、引き継ぎをつなぐ AI コーディング向けのワークフローハーネスです。既存の Claude Code の機能や権限設定を置き換えるものではありません。

| 成果物 | 確認すること |
| --- | --- |
| `plan.md` | 目的、制約、変更対象、実装方針 |
| `todo.md` | 作業分割、順序、担当 |
| `test-cases.md` | 受入基準とテストの対応 |
| レビュー結果 | 未解決の指摘、判断が必要な事項 |
| 承認記録（対象モード） | 人が実装への移行を認めたか |

たとえば、生成された計画が新しい API を作ろうとしているなら、今回の例では実装前に差し戻す理由があります。API の変更が必要と判明した場合は、元の依頼に黙って追加せず、別タスクとして扱うか、スコープを再度判断します。

## Claude Code で試す入口

検証用の Git リポジトリで試してください。macOS / Linux（Windows では WSL 推奨）を想定します。以下は2026年11月25日に確認した main のプラグインガイド（v8.24.0 表記）に基づく導入手順です。固定タグと main の案内には差があるため、導入時に配布版とガイドの対応を確認してください。今回の合成例での Claude Code 実行結果はまだありません。

Claude Code のセッション内で Marketplace を登録し、プラグインを導入します。

```text
/plugin marketplace add s977043/PlanGate
/plugin install plangate@plangate
```

インストール画面では検証用プロジェクトだけに適用する local scope を選び、CLI で導入状態を確認します。

```bash
claude plugin list
```

一部のスキル・コマンドは `bin/plangate` CLI を必要とします。CLI の取得、依存ツール、参照ファイルの準備は [導入ガイド](https://github.com/s977043/PlanGate/blob/v8.24.0/README.md) とプラグインの README に従ってください。Marketplace は取得時の配布版を導入するため、表示される版を確認してください。

作業コンテキストを用意します。以下は公式のコマンド定義をプラグインの名前空間で呼び出す例です。実際のコマンド一覧に合わせて呼び出してください。

```text
/plangate:working-context TASK-0001
```

`docs/working/TASK-0001/pbi-input.md` に先ほどの Why、Scope、受入基準を記入してから、計画を生成します。

```text
/plangate:ai-dev-workflow TASK-0001 plan
```

生成された計画、タスク、テストケースを照合します。例の受入基準は3項目で、v8.24.0 の規模分類ではその軸だけでも standard 相当です。最終的なモードは変更の種類・リスクなどを含めて判定します。

人が確認するのは、計画書がきれいに書けているかではなく、次の3点です。

- 変えてよい範囲が明確か。
- 変えてはいけない範囲まで計画が広がっていないか。
- 受入条件を確認できるテスト・差分確認があるか。

条件を満たさなければ計画を修正します。v8.24.0 の承認待ちの契約では、人の判断と `plan_hash` が `approvals/c3.json` に記録されます。今回の例では人が判断する運用に限定し、所定の承認手順を経る前に exec へ進みません。承認記録を AI が代わりに作成する運用ではありません。

## 導入と強制は別

PlanGate の導入には段階があります。軽いタスクでは計画やゲートを省略するモードもあり、最初からすべての機能を使う必要はありません。

| 確認したいこと | 確認の例 |
| --- | --- |
| プラグインが認識されているか | plugin list とコマンド一覧 |
| 計画が作られたか | 成果物の実体と受入基準の対応 |
| 実装を承認したか | 対象モードの承認記録 |
| 承認前の操作を機械的に止められるか | 別途配線した hook の動作検証 |

**プラグインを入れるだけでは hook の強制は有効になりません。** 強制するには別途設定と検証が必要です。警告だけの設定と、操作を拒否する設定も区別します。今回は既存の本番プロジェクトへの強制配線を勧めません。

## まとめ

次の変更を Claude Code に任せる前に、一つだけ試してみてください。変更範囲と同じくらい具体的に「今回は変えないこと」を書き、その確認方法を決めることです。

PlanGate は、この判断を計画・テスト・承認とつなげるために開発しています。

- [PlanGate の GitHub](https://github.com/s977043/PlanGate)
- [段階的導入ガイド](https://github.com/s977043/PlanGate/blob/v8.24.0/docs/staged-adoption-guide.md)
- [プラグインの導入・制約](https://github.com/s977043/PlanGate/blob/main/plugin/plangate/README.md)

自分の開発環境で試して気づいたことがあれば、Issue での改善提案も歓迎します。
