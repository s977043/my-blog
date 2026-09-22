# Content Closed Loop note: 3ループ論旨レビュー記録

> 対象: `articles_note/new/content-closed-loop-note.md`
>
> 実施日: 2026-09-23
>
> レビュー方式: `note-thesis-review-loop` の3ループ構成を基準にした模擬ペルソナレビュー
>
> 注: ここでのペルソナはAIによる模擬レビューであり、外部専門家・実在読者による監修ではない。

## Article Contract

### Topic

AIを使った記事制作で、文章生成や自動投稿を増やす前に、Signal → Seed → Article → Publish → Metrics → Learning の追跡可能性をどう作ったか。

### Claim

記事制作の自動化で先に強くするべきなのは生成能力ではなく、状態・根拠・結果をつなぎ、公開後の学びを次の入力へ戻せる仕組みである。

### Audience

- AIを使って記事制作やメディア運用を効率化しているエンジニア
- AIエージェントを複数工程へ導入し始めた個人・小規模チーム
- コンテンツ制作の「量」ではなく学習ループを改善したい人

### Reader Promise

読者は、記事制作を閉ループ化するために最低限必要な provenance、Seed ID、Article Graph、Metrics link、人間の承認境界の役割を理解できる。

### Emphasis

- 外部記事は発想のきっかけであり、本記事の中心は筆者自身の実装経験
- 観測事実と解釈を分ける
- 派生GraphをSSoTにしない
- 公開後Metricsと安定Seed IDを接続する
- 公開・学習の一般化はHuman Gateを維持する
- 本記事自身をCanaryとして端から端まで検証する

## Loop 1: 主題・論理構造

### ペルソナ

- Thesis Guardian
- Logic Editor
- Skeptical Senior Engineer

### 主な指摘

1. 初稿は外部記事紹介から入り、中心主張が出るまで少し長かった。
2. 「自動化したいのに学習だけが人間の記憶へ戻る」が記事全体の問題設定として強いので、より早く結論へ接続すべき。
3. 外部記事の自動投稿方式が本記事の推奨方式と誤読される可能性があった。
4. 実装詳細が増えると「Article Graphを作る記事」に主題がずれる懸念があった。

### 適用した改善

- 導入直後に「文章生成ではなく、状態・根拠・結果をつなぐことへ自動化の中心を移した」と中心主張を追加。
- 外部記事は発想のきっかけとしてのみ配置し、以降は筆者の実装経験を主役にした。
- 自動投稿は導入しなかったことを独立セクションで明示。
- Article Graphは「Seedから再生成する派生物」と限定し、Graph自体を主役にしない構成へ整理。

### Thesis Gate

| 項目 | 判定 |
| --- | --- |
| Topic維持 | 合格 |
| Claim維持 | 合格 |
| Reader Promise維持 | 合格 |
| 第二の主題なし | 合格 |
| タイトル・導入・結論が整合 | 合格 |
| 未解決Must/High | 0 |

## Loop 2: 実務境界・反論耐性

### ペルソナ

- Coding Agent Practitioner
- Engineering Manager / CTO
- Content Operations Designer

### 主な指摘

1. 「数字が取れれば学べる」と読めると、相関と因果を混同する。
2. 過去Seedのpath由来IDをMetricsへ使うと、renameで追跡が壊れる。
3. Article Graphを編集可能な台帳として扱うとSSoTが二重化する。
4. 自動化を進める話なのに公開・Strategy更新を自動化しない理由が必要。
5. 12件 / 3件 / 9件という数値は時点依存なので、恒久値に見せない方がよい。

### 適用した改善

- 「数字は観測結果であって原因ではない」と明記。
- Metricsへ接続するのは明示的に固定した `seed_id` のみと説明。
- Article Graphは読み取り専用の派生物と明示。
- 公開と、公開後の数字をStrategyへ一般化する判断は人間が持つと明記。
- 件数は「導入直後の時点」と時点を限定。

### Thesis Gate

| 項目 | 判定 |
| --- | --- |
| Topic維持 | 合格 |
| Claim維持 | 合格 |
| Reader Promise維持 | 合格 |
| 技術境界の過度な一般化なし | 合格 |
| 事実と解釈の区別 | 合格 |
| 未解決Must/High | 0 |

## Loop 3: note編集・初見可読性

### ペルソナ

- note Editor
- First-time Reader
- Thesis Guardian

### 主な指摘

1. `read-only`、`Human Gate`、`query/hash`、`Canary` など実装用語が連続していた。
2. 技術読者には理解できるが、noteの一次体験記事としては英語名詞密度が高い。
3. 「次にやること」にレビューが含まれていたが、レビュー後の記事では時系列がずれる。
4. 最後の持ち帰りを「記事本数」ではなく「SignalからLearningまでの流れ」に収束させるべき。

### 適用した改善

- `read-only` → 「読み取り専用」、`Human Gate` → 「人間の承認」へ変更。
- URLのquery/hash詳細は「余分なパラメータを正規化」へ圧縮。
- `Canary` は初出で「本番の流れを最初に通す試験記事」と説明。
- `Learning Proposal` は「学びの提案」と併記。
- 今後の手順から「記事レビュー」を外し、公開以降の手順だけに更新。
- 結論を「きっかけから学びまで途切れず流れること」へ集約。

### Thesis Gate

| 項目 | 判定 |
| --- | --- |
| Topic維持 | 合格 |
| Claim維持 | 合格 |
| Reader Promise維持 | 合格 |
| note可読性 | 合格 |
| 終盤に競合する結論なし | 合格 |
| 未解決Must/High | 0 |

## 最終判定

**論旨レビューは合格。**

記事の中心は最後まで「AIにもっと書かせる」ではなく「生成前の根拠と公開後の学びをつなぐ」に保たれている。

次のGateはリポジトリのdeterministic check / CIと、公開前のHuman Gate。公開URL取得後にSeedの `promoted_to` へURLを追加し、Metrics joinを実測する。
