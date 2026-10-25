---
title: Codex でプラグインのスキルが出てこないときは、スキル一覧の予算超過を疑う
tags:
  - Codex
  - OpenAI
  - AgentSkills
  - 生成AI
  - トラブルシューティング
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: true
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

## はじめに

Codex にプラグインを導入して有効化したのに、そのプラグインのスキルが使えないことがあります。

こういうとき、まず manifest の書き方や導入手順を疑いがちです。ただ、原因がほかのプラグインのスキルと合わせた「スキル一覧の大きさ」にあることもあります。

この記事では、自分の OSS（River Review）のスキルが Codex で出てこなかった件を例に、切り分けと対処の手順をまとめます。

先に結論を書くと、次の順で確かめます。

1. `codex debug prompt-input` で、モデルに渡るスキル一覧に目的のスキルが入っているかを見る
2. 隔離した `CODEX_HOME` で、そのプラグインだけを入れた状態と比べる
3. `skills.max_context_tokens` を変えて比べる

:::note info
数値と挙動は、codex-cli 0.160.1 で 2026-10-25 に確認したものです。バージョンが変わると挙動も変わる可能性があります。
:::

## 症状

- プラグインは導入済みで、有効になっている
- それなのに、そのプラグインのスキルを Codex が使わない
- `codex debug prompt-input` の出力にも、そのスキルの名前が出てこない

River Review の場合、配布しているスキルは 12 個あります。手元の実環境（ほかのプラグインも入っている状態）で確かめたところ、既定の設定では 12 個のうち 1 個も一覧に出ていませんでした。

## 切り分け1: モデルに渡るスキル一覧を見る

`codex debug prompt-input` を使うと、モデルに渡す入力を確認できます。目的のスキル名で絞り込むと、一覧に入っているかが分かります。

```bash
codex debug prompt-input test | grep 'river-review:'
```

River Review のガイドでは、リポジトリの外で実行する手順にしています。作業中のリポジトリのスキルが混ざらないようにするためです。

ここで出てこなければ、「プラグインが読まれていない」のか「読まれているが一覧から落ちている」のかを分けます。

## 切り分け2: 隔離した CODEX_HOME で比べる

`CODEX_HOME` を空のディレクトリに向け、目的のプラグインだけを入れて同じコマンドを実行します。

```bash
CODEX_HOME=/tmp/codex-isolated codex debug prompt-input test | grep 'river-review:'
```

River Review の場合、この状態では 12 個すべてが出ました。

隔離環境で出るなら、manifest やスキルの定義は正しく読まれています。実環境で出ない原因は、ほかのプラグインと合わせた状態のほうにあります。

## 原因: スキル一覧には予算がある

Codex は、最初にモデルへ渡すスキル一覧の大きさに予算を設けています。公式ドキュメントの記述は次のとおりです（2026-10-25 に確認）。

- 設定キーは `skills.max_context_tokens`
- 既定値は、モデルのコンテキストウィンドウの 2%
- 明示的に指定する値の上限は 10,000 トークン
- ウィンドウの大きさが分からないときは 8,000 文字
- 予算を超えると、まず説明文を短くする。それでも収まらないほどスキルが多いと、最初の一覧から一部を省き、警告を出す
- 予算がかかるのは最初の一覧だけ。使うスキルが選ばれたあとは、その SKILL.md を全文読む

つまり、プラグインを足していくと、どこかで一覧に入りきらなくなり、入っているはずのスキルがモデルから見えなくなります。

どのスキルから省かれるかについて、River Review のトラブルシューティングガイドでは「名前順で後ろにある `river-review:*` が一覧から落ちることがある」と書いています。これは手元の観測からの説明で、公式ドキュメントでは確認できていません。

## 切り分け3: 予算を変えて比べる

`-c` で設定を一時的に上書きし、予算を上げた状態で同じコマンドを実行します。

```bash
codex -c skills.max_context_tokens=10000 debug prompt-input test | grep 'river-review:'
```

手元の実環境での結果は次のとおりです。

| 条件 | 一覧に出た River Review のスキル（12 個中） |
| --- | --- |
| 実環境・既定の予算 | 0 |
| 隔離した `CODEX_HOME`（River Review のみ）※ | 12 |
| 実環境・`skills.max_context_tokens=10000` | 12 |

数え方は、出力に現れた `river-review:<name>` の異なり数です（コマンド由来の項目は除いています）。codex-cli 0.160.1 での測定で、実環境の 2 行は 2026-10-25 に測りました。※の行は River Review の PR（#2782）に記録された値です。

予算を上げると出るなら、原因は予算超過と判断できます。

## 対処

方法は 2 つあります。

### 使っていないプラグインを外す

一覧に載るスキルの数を減らせば、予算内に収まります。普段使っていないプラグインがあるなら、まずこちらを検討します。

### 予算を上げる

`-c` で出ることを確かめたら、`~/.codex/config.toml` に設定します。

```toml:~/.codex/config.toml
[skills]
max_context_tokens = 10000
```

公式ドキュメントでは、明示的に指定する値の上限は 10,000 トークンです。これを超える値を書いたときにどう扱われるか（切り詰められるのか、エラーになるのか）は確認できていないので、10,000 以内で指定します。

予算はモデルに渡す一覧の大きさの上限なので、上げれば一覧が占める入力も増えます。上げる前に、外せるプラグインがないかを先に見ておくのがよいと思います。

## 確認

設定したあと、もう一度一覧を見ます。

```bash
codex debug prompt-input test | grep 'river-review:'
```

目的のスキルが出ていれば完了です。

## まとめ

- Codex でプラグインのスキルが出てこないときは、manifest より先にスキル一覧の予算超過を疑う
- `codex debug prompt-input` で一覧を見て、隔離した `CODEX_HOME` と予算の変更で切り分ける
- 対処は、使っていないプラグインを外すか、`skills.max_context_tokens` を 10,000 以内で上げる

## 参考

- [Configuration reference（OpenAI Codex）](https://developers.openai.com/codex/config-reference)
- [Skills（OpenAI Codex）](https://developers.openai.com/codex/skills)
- [docs(troubleshooting): Codex でスキルが見えないときのスキル予算超過を追記（s977043/river-review #2782）](https://github.com/s977043/river-review/pull/2782)
- [River Review トラブルシューティング（プラグイン）](https://github.com/s977043/river-review/blob/main/pages/guides/troubleshooting.md#plugin)
