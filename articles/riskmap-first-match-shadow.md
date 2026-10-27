---
title: "先に一致したルールが後ろの厳しいルールを隠す。River Reviewのrisk mapのfirst-matchを診断する"
emoji: "🌊"
type: "tech"
topics: ["codereview", "aiレビュー", "glob", "riverreview", "ai駆動開発"]
published: false
---

AI レビューや CI の設定では、「特定のパスを変更したときは、より慎重にレビューする」といったルールを設けることがよくあります。ただ、ルールを書き足しただけでは効かないことがあります。ルールを上から順に調べ、最初に一致したものを使う方式（first-match）では、広いルールの後ろに厳しいルールを書くと、後ろのルールまで判定が届きません。前のルールに隠れてしまうのです（この記事では「隠れる」と呼びます。英語では shadow）。

この記事では、AI コードレビューツール「River Review」の risk map を題材にします。まず、ルールが隠れて厳しい判定がすり抜ける現象を手元で再現します。その上で、2026 年 10 月に追加された診断関数 `diagnoseShadowedRiskRules` が、隠れたルールをどう見つけ、どう報告するように作られているかを読みます。

:::message
**記事の時点**: 2026-10-28 に s977043/river-review の main（`df5ce89c`）を clone して確認しました。診断関数はライブラリに追加された段階で、Router や CLI・レポートへの組み込みはまだありません。以下の実例は、この main で筆者が動かした再現例です。
:::

## risk map は上から読んで最初に当たった規則を採る

River Review の risk map は、対象パスを指定する glob パターンと、その変更に対する対応方針（`action`）を並べた設定です。`action` には重要度に応じて 3 段階のレベルがあります。

| action | 意味 | 優先度 |
| --- | --- | --- |
| `comment_only` | コメントだけ付ける | 0 |
| `escalate` | 一段重いレビューへ上げる | 1 |
| `require_human_review` | 人のレビューを必須にする | 2 |

リスクを判定する `evaluateRisk` 関数（`src/lib/risk-map.mjs`）は、変更されたファイルごとにルールを上から順に走査します。そして、最初に一致したルールの `action` を採用します。

```js
for (const file of filePaths) {
  let matched = false;
  for (const rule of riskMap.rules) {
    if (minimatch(file, rule.pattern, { dot: true })) {
      fileRisks.push({ file, action: rule.action, rule: { pattern: rule.pattern, reason: rule.reason } });
      matched = true;
      break;
    }
  }
  // 一致しなければ defaults.action
}
```

この first-match 方式には、設定ファイルを上から順に読むだけで判定結果を追いやすい利点があります。一方で、記述の順番を誤ると、後ろに書いた重要なルールまで評価が届かない問題が生じます。

## 再現：認証パスの変更が comment_only で通る

Issue #2781 で挙げられている設定例を使って、この現象を実際に再現してみます。対象範囲の広い `src/**` を手前に配置し、厳密に検査したい `src/auth/**` を後ろに記述したケースです。

```js
import { evaluateRisk, diagnoseShadowedRiskRules } from './src/lib/risk-map.mjs';

const riskMap = { rules: [
  { pattern: 'src/**', action: 'comment_only', reason: 'general source' },
  { pattern: 'src/auth/**', action: 'require_human_review', reason: 'authentication' },
]};
const files = ['src/auth/login.ts', 'src/app.ts'];

console.log(evaluateRisk(riskMap, files));
```

実行結果の抜粋は次のとおりです。

```json
{
  "fileRisks": [
    { "file": "src/auth/login.ts", "action": "comment_only", "rule": { "pattern": "src/**", "reason": "general source" } },
    { "file": "src/app.ts", "action": "comment_only", "rule": { "pattern": "src/**", "reason": "general source" } }
  ],
  "aggregateAction": "comment_only",
  "escalatedFiles": [],
  "humanReviewFiles": []
}
```

`src/auth/login.ts` は本来 `src/auth/**` にも一致します。しかし、手前にある `src/**` に先に合致するため、そこで判定処理が終了してしまいます。その結果、認証パスに対する `action` は `comment_only` に落ち着き、人間の確認を求める `humanReviewFiles` は空のままになります。

設定ファイルを見るだけでは、この不備にはなかなか気づけません。`src/auth/**` という厳しいルール自体は正しく記載されているように見えるためです。実際に表面化するのは「なぜか AI レビューの判定が甘い」という結果だけです。ルールの記述順序に原因があると突き止めるには、評価エンジンの内部仕様まで掘り下げて調査する必要があります。

## 順序を入れ替えれば直る。ただし気づけない

今回の例だけであれば、対処自体はシンプルです。2 つのルールの記述順を入れ替えるだけで、`aggregateAction` は期待通り `require_human_review` に変わります。

しかし本当に厄介なのは、このようなルールの遮蔽を `evaluateRisk` の実行結果から察知するのが難しい点です。プロジェクトの規模が拡大して複数人がルールを編集すると、新しく設けた厳格なルールをファイルの末尾へ追記する運用は自然に起こります。順序を修正する前に、まずは「今まさに隠れて機能していない厳しいルールが存在するか」を可視化する必要があります。そこで PR #2784 によって追加された機能が、診断関数 `diagnoseShadowedRiskRules(riskMap, filePaths)` です。

## 診断関数を読む

先ほどと同じ設定と変更ファイルを渡してこの診断関数を実行すると、次の結果が得られます。

```json
{
  "kind": "risk-map-rule-shadow/v1",
  "authorizesApproval": false,
  "evidenceTrust": "unverified-input",
  "status": "analyzed",
  "reasonCodes": [],
  "findings": [
    {
      "file": "src/auth/login.ts",
      "selectedRuleIndex": 0,
      "selectedPattern": "src/**",
      "selectedAction": "comment_only",
      "shadowedRuleIndex": 1,
      "shadowedPattern": "src/auth/**",
      "shadowedAction": "require_human_review"
    }
  ]
}
```

この結果から、「`src/auth/login.ts` は 0 番目のルール `src/**`（`comment_only`）で確定したが、実は後ろにある 1 番目のルール `src/auth/**`（`require_human_review`）にも一致していた」という事実が読み取れます。この出力構造と判定ロジックを確立するにあたり、4 つの明確な設計判断がなされています。

### 1. 実際の変更ファイルだけで判定する

この診断関数は、glob パターン同士の包含関係を机上の理論だけで解析しません。JSDoc にも「hypothetical glob containment ではなく、実際に重なった一致を報告する」と明記されています。具体的には、変更対象のファイルごとにすべてのルールを走査します。最初に一致したルールを `selected` として保持し、それ以降に一致したルールのうち、より優先度が高いものを `findings` に記録します。

```js
for (const [ruleIndex, rule] of riskMap.rules.entries()) {
  if (!minimatch(file, rule.pattern, { dot: true })) continue;
  if (selectedRule === null) {
    selectedRule = rule;
    selectedRuleIndex = ruleIndex;
  } else if (ACTION_PRIORITY[rule.action] > ACTION_PRIORITY[selectedRule.action]) {
    candidates.push({ file, selectedRuleIndex, /* ... */ shadowedRuleIndex: ruleIndex, /* ... */ });
  }
}
```

パターンの一致判定には、`evaluateRisk` と共通の `minimatch(file, pattern, { dot: true })` を利用しています。glob の包含関係を独自ロジックで解釈しようとすると、`**` や `{a,b}` などの解釈において実際の評価器との間にズレが生じやすくなります。実際のファイルパスに対して同じ判定関数を適用して再度走査する構成にしておくことで、診断と評価の間で解釈が食い違わないようにしています。

### 2. 優先度が高い規則だけを報告する

後ろにあるルールがすべて問題になるわけではありません。たとえば `src/**` の後ろに同じ `comment_only` や、さらに軽いルールが置かれていても、最終的な判定結果に変化はないため報告対象から除外します。報告するのは、後ろのルールのほうが `ACTION_PRIORITY` 上でより厳しい対応を求めている場合のみです。パターンの重複をすべて警告してしまうと、開発者が意図して記述した上書き設定まで警告に含まれてしまい、結果として重要な警告が読まれなくなるためです。

### 3. 分からないときは unknown と言う

risk map の設定自体が存在しない場合や、変更ファイルの一覧が空の場合は、`findings` を空配列にした上で `status: 'unknown'` と理由コードを返します（以下は共通フィールドを省略した抜粋です）。

```json
{ "status": "unknown", "reasonCodes": ["missing-risk-map"], "findings": [] }
{ "status": "unknown", "reasonCodes": ["no-changed-files"], "findings": [] }
```

ルールの `action` が規定の 3 値のいずれにも当てはまらない場合や、`pattern` が文字列でない場合は、不正な入力として `RiskMapError` 例外を送出します。情報の不足や空入力は `unknown`、不正な入力データは例外として厳密に区別しています。これにより、空の `findings` を安易に「問題なし」と誤認させない設計にしています。

### 4. 承認の根拠にしない

出力結果には、常に `authorizesApproval: false` と `evidenceTrust: 'unverified-input'` が付与されます。JSDoc にも、first-match による本来の評価結果、レビューの振り分け処理、および GitHub 上の承認やマージ権限には一切関与しない旨が記載されています。

これは単なる注記ではなく、診断の限界から来る線引きです。たとえば同じ risk map の構成であっても、変更ファイルが `src/app.ts` のみであれば、診断結果は `status: 'analyzed'` となり `findings` は空になります。

```json
{ "status": "analyzed", "reasonCodes": [], "findings": [] }
```

このときでも、`src/auth/**` が `src/**` の陰に隠れている設定上の構造自体は何ら解消されていません。今回の変更ファイルが該当するパスに偶然含まれていなかっただけに過ぎません。したがって `findings` が空であっても、それは「今回の変更ファイル群では、隠れた厳しいルールが見つからなかった」という限定的な事実を示すだけです。risk map 全体の順序が正しいという証明にはならないため、安全策として承認判断の根拠に利用できない仕様にしています。

## テストで決めていること

手元の環境で `tests/risk-map.test.mjs` を実行したところ、24 件のテストがすべて成功しました（`node --test tests/risk-map.test.mjs`、pass 24 / fail 0）。このうち `shadow diagnostic:` という接頭辞で始まるテストが 8 件含まれており、前述した 4 つの設計判断（隠れた厳しいルールの検出、unknown への分岐、不正入力に対する例外処理など）の振る舞いを固定しています。

## 時点：まだどこからも呼ばれていない

2026-10-28 時点の main ブランチ（`df5ce89c`）において、`src/` 配下で `diagnoseShadowedRiskRules` を参照しているのは定義元である `src/lib/risk-map.mjs` のみです。Issue #2781 は依然として OPEN の状態であり、この診断機能を Router、CLI、あるいはレポート表示へ組み込む作業は今後のステップとして残されています。つまり現時点で確認できたのは、「既存の判定処理を壊すことなく、背後に隠れたルールを抽出できる部品が整備された」という段階までです。

関連する変更として、PR #2780 では risk map が未設定のリポジトリにおいて、認証や決済に関わる小さな変更を Router 側で自動的に `team` レベル以上のレビューへ引き上げる仕組みが導入されました。そちらは first-match の評価ロジックには手を加えない別系統の安全策です。プロジェクト独自に risk map を定義しているリポジトリでの順序誤りについては、今回の診断関数が担当する領域となります。

## first-match だけの問題ではない

ルールの記述順序によって評価結果が決まる設計は、評価の向きが逆であっても同じ構造の課題を抱えています。たとえば GitHub の CODEOWNERS は、後ろに記述されたルールが優先される仕組み（last-match 方式）を採用しています。公式ドキュメントのサンプルにも「Order is important; the last matching pattern takes the most precedence.」と記載されています（[About code owners - GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)）。この方式では、ファイルの末尾に追加した適用範囲の広いルールが、手前に書かれていた細かいルールを覆い隠してしまいます。

どちらの評価方式であっても、「設定ファイルにルールが記述されていること」と「そのルールが実際に評価へ到達すること」は別問題です。順序に依存する判定ルールを AI レビューや CI のリスク制御に用いる場合は、実際の変更ファイルに対して「本来はより厳格に検査すべきルールが潜んでいないか」を監視する仕組みが役立ちます。本来の判定とは独立した読み取り専用の経路で結果を提示すれば、意図しない判定の甘さに早い段階で気づけます。その結果を承認の根拠にしないことまで含めて、診断の設計です。

River Review における判定責務の配置設計については、[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement) で整理しています。チームの判断を再現可能な形で保持するコア設計については [River Reviewのコア設計：AIレビューではなく、チームの判断を再現しやすい形で残す](/articles/river-review-core-design) を、実装後ガードにおける位置づけについては [AI駆動開発の2層ガード設計：PlanGateとRiver Reviewで実装前後を守る](/articles/ai-dev-guardrail-plangate-river-reviewer) をあわせてご参照ください。

## 参考

- [s977043/river-review PR #2784](https://github.com/s977043/river-review/pull/2784)（`diagnoseShadowedRiskRules` の追加）
- [s977043/river-review Issue #2781](https://github.com/s977043/river-review/issues/2781)
- [s977043/river-review PR #2780](https://github.com/s977043/river-review/pull/2780)
- [About code owners - GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
