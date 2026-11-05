---
title: pnpmのlockfile重複を8行で修復した事例と、CIで残った失敗
tags:
  - pnpm
  - CI
  - expo
private: false
updated_at: '2026-11-05T18:03:28+09:00'
id: 43e56cbb1bc22e0ff533
organization_url_name: null
slide: false
ignorePublish: false
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

`pnpm install --frozen-lockfile` が止まると、型チェックやテストの結果までたどり着けません。lockfileを修復して導入が通ったあとも、別の失敗が残ることがあります。

デジタルおみくじの[公開PR #466](https://github.com/s977043/digital-omikuji/pull/466)では、`acorn@8.17.0` の重複を取り除く8行の削除で、後続の検証を実行できる状態になりました。ただし、CI全体は成功していません。小さな修復で何が確かめられ、どこからが別の課題なのかを整理します。

この記事は2026-11-03時点の公開差分とCIログを読んだ記録です。修復前は `a93721414c12643280e65359b101b7fa1e750c85`、修復案は `03cbb89b00051c052058ff07e85bc800a47ab48f` を対象にしています。確認時点でPRはDraft・未マージです。その後、このPRはdevelopを取り込んだうえでマージされました。マージ時点のCI結果は、この記事の対象外です。

## 同じパッケージ名でも、見る場所が違う

PRの報告では、Node 24.19.0 / pnpm 9.15.2で修復前のfrozen installが `ERR_PNPM_BROKEN_LOCKFILE` で停止していました。このローカル実行はPR作成側の報告であり、記事執筆時に再実行した結果ではありません。

[修復前のlockfile](https://github.com/s977043/digital-omikuji/blob/a93721414c12643280e65359b101b7fa1e750c85/pnpm-lock.yaml)には、`acorn@8.17.0` が `packages` と `snapshots` のそれぞれで重複していました。この二つのセクションをまたいで同じキーがあること自体を、重複として削除するわけではありません。

`packages` 側では、同じintegrity・engines・hasBinを持つエントリーが二つあります。こちらは内容が一致しているかを確認できます。

`snapshots` 側は、片方が空のマッピング、もう片方に `optional: true` がありました。ここは「キーが同じなので後ろを消す」だけでは判断できません。

```yaml
# 修復前のsnapshots内の該当部分
acorn@8.17.0: {}

acorn@8.17.0:
  optional: true
```

このlockfileでは、espreeやacorn-walkなどの通常依存からもacornを参照しています。修復案はその参照を踏まえ、`optional: true` の付かないエントリーを残しています。同じ重複キーでも、片方の属性が異なるなら、利用側の参照まで見る必要があります。

## 修復の差分を、依存更新から切り離す

[修復コミット](https://github.com/s977043/digital-omikuji/commit/03cbb89b00051c052058ff07e85bc800a47ab48f)の変更は、`packages` の重複ブロック5行と `snapshots` の重複ブロック3行の削除です。空行を含めて8行になります。

`package.json`、lockfileの `importers`、依存先のバージョン参照は、この差分では変更していません。アプリのコードにも変更はありません。

PRには、`--fix-lockfile` では全体の再解決になったため採用しなかった、という記録もあります。これはこの作業での報告であり、同オプションがいつも大きな変更を起こすという意味ではありません。

同じ問題を調べるなら、次の順で差分を確認すると、修復と依存更新を区別しやすくなります。

1. エラーが示すセクション内に重複があるかを確認する。
2. 重複エントリーの属性と、そこを参照する依存を比べる。
3. 修復後のdiffで、依存バージョンやimportersに意図しない変更がないかを確認する。
4. プロジェクトで指定したpnpmを使い、frozen installと後続のチェックを実行する。

[pnpmの公式資料](https://pnpm.io/cli/install#--frozen-lockfile)では、`--frozen-lockfile` はlockfileを更新しないオプションとして説明されています。ここでは現在の資料をコマンドの意味の補助に使い、対象バージョンで復旧したことは次のCIログで確認します。

## 導入は復旧し、別のゲートは失敗した

ここで確認するCIは、Node 22.23.4 / pnpm 9.15.2で実行されています。

修復案と同じSHAを実行した[CI run](https://github.com/s977043/digital-omikuji/actions/runs/41561569192)では、各ジョブのsetupに `Lockfile is up to date, resolution step is skipped` が記録されています。型チェック、テスト、ESLintも成功しています。

| 確認対象 | 同じSHAのCI結果 |
| --- | --- |
| Type Check | 成功 |
| Tests | 45 suites / 311 tests成功 |
| ESLint | 成功 |
| Repo Guards | 失敗。expo-doctorは22項目中19項目成功 |
| 別workflowのWeb E2E | 15件成功 |

Web E2Eは[run 41561569081](https://github.com/s977043/digital-omikuji/actions/runs/41561569081)の結果です。対象SHAは同じですが、CI workflowとは別の実行です。

Repo GuardsにはSDKに対する依存バージョンの不整合などが残っています。lockfileを読み込めるようにしたことと、それらを解消したことは分けて記録します。この結果から、Android実機で動くことやストアへ提出できることまでは判断できません。

今回の差分で確認できるのは、導入を止めていた重複の修復と、その先のチェック結果です。次に手を付ける対象を決めるには、成功したチェックだけでなく、残った失敗を同じSHAに結び付けて残しておくことが役立ちます。
