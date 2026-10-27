---
title: "先に一致したルールが後ろの厳しいルールを隠す。River Reviewのrisk mapのfirst-matchを診断する"
emoji: "🌊"
type: "tech"
topics: ["codereview", "aiレビュー", "glob", "riverreview", "ai駆動開発"]
published: false
---

AI レビューや CI に「このパスの変更はこの重さで見る」という規則を書いているなら、規則を足した時点で効いていると思いがちです。ところが、規則を上から順に見て最初に一致したものを採る評価（first-match）では、広い規則の後ろに置いた厳しい規則が黙って効かなくなります。

この記事では、River Review の risk map を題材に、この隠れ方を手元で再現し、2026 年 10 月に追加された診断関数 `diagnoseShadowedRiskRules` がどう設計されているかを読みます。

:::message
**記事の時点**: 2026-10-28 に s977043/river-review の main（`df5ce89c`）を clone して確認しました。診断関数はライブラリに追加された段階で、Router や CLI・レポートへの組み込みはまだありません。以下の実例は、この main で筆者が動かした再現例です。
:::

## risk map は上から読んで最初に当たった規則を採る

River Review の risk map は、パスの glob と、そのパスに求める扱い（`action`）を順に並べた設定です。`action` は 3 段階あります。

| action | 意味 | 優先度 |
| --- | --- | --- |
| `comment_only` | コメントだけ付ける | 0 |
| `escalate` | 一段重いレビューへ上げる | 1 |
| `require_human_review` | 人のレビューを必須にする | 2 |

評価する `evaluateRisk`（`src/lib/risk-map.mjs`）は、変更ファイルごとに規則を上から見て、最初に一致した規則の `action` を採ります。

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

first-match には、設定を上から読めば結果が分かるという利点があります。その代わり、順序を誤ると後ろの規則に一度も評価が届きません。

## 再現：認証パスの変更が comment_only で通る

Issue #2781 が例に挙げている構成をそのまま入力にします。広い `src/**` を先に、厳しい `src/auth/**` を後に書いたものです。

```js
import { evaluateRisk, diagnoseShadowedRiskRules } from './src/lib/risk-map.mjs';

const riskMap = { rules: [
  { pattern: 'src/**', action: 'comment_only', reason: 'general source' },
  { pattern: 'src/auth/**', action: 'require_human_review', reason: 'authentication' },
]};
const files = ['src/auth/login.ts', 'src/app.ts'];

console.log(evaluateRisk(riskMap, files));
```

結果は次のとおりです（抜粋）。

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

`src/auth/login.ts` は `src/auth/**` にも一致しますが、先に `src/**` に当たって評価が止まります。`evaluateRisk` の結果では、認証パスの `action` が `comment_only` になり、`humanReviewFiles` は空でした。

設定ファイルを見ただけでは、この誤りは目立ちません。`src/auth/**` の行は確かに書いてあるからです。表に出るのは「AI レビューの分類が甘い」という結果のほうで、原因が規則の順序だと気づくには、評価の仕組みまで降りる必要があります。

## 順序を入れ替えれば直る。ただし気づけない

この例に限れば、直し方は単純です。2 つの規則を入れ替えると `aggregateAction` は `require_human_review` になりました。

問題は、この例のような隠れ方を `evaluateRisk` の出力だけから見つけるのは難しいことです。規則が増え、複数人が足していくと、新しい厳しい規則を末尾に足す書き方は自然に起きます。順序を直す前に、まず「いま隠れている厳しい規則があるか」を見えるようにしたい。そこで PR #2784 が追加したのが `diagnoseShadowedRiskRules(riskMap, filePaths)` です。

## 診断関数を読む

同じ入力で診断を呼ぶと、次の結果が返ります。

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

「`src/auth/login.ts` は 0 番の `src/**`（comment_only）で決まったが、1 番の `src/auth/**`（require_human_review）にも一致している」と読めます。この形に落ち着くまでの設計判断が 4 つあります。

### 1. 実際の変更ファイルだけで判定する

診断は glob 同士の包含関係を理屈で調べません。JSDoc には「hypothetical glob containment ではなく、実際に重なった一致を報告する」とあります。ファイルごとに全規則を走査し、最初に一致した規則を `selected` として覚え、以降に一致した規則のうち優先度が高いものを `findings` に積みます。

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

一致判定には `evaluateRisk` と同じ `minimatch(file, pattern, { dot: true })` を使っています。glob の包含を自前で解こうとすると、`**` や `{a,b}` の扱いで評価器とずれる余地が生まれます。実パスに対して同じ関数で 2 回目の走査をするだけにしておけば、診断と評価の解釈が食い違いません。

### 2. 優先度が高い規則だけを報告する

後ろの規則がすべて問題になるわけではありません。`src/**` の後ろに同じ `comment_only` や、より軽い規則があっても、評価の結果は変わらないので報告しません。報告するのは、後ろの規則のほうが `ACTION_PRIORITY` で厳しい場合だけです。重なりを全部出すと、意図して書いた上書きまで警告になり、読まれなくなります。

### 3. 分からないときは unknown と言う

risk map が無いときと、変更ファイルが空のときは、`findings` を空配列で返しつつ `status: 'unknown'` と理由コードを付けます（`kind` などの共通フィールドは省いた抜粋です）。

```json
{ "status": "unknown", "reasonCodes": ["missing-risk-map"], "findings": [] }
{ "status": "unknown", "reasonCodes": ["no-changed-files"], "findings": [] }
```

規則の `action` が既知の 3 値でない、`pattern` が文字列でない、といった不正な入力は `RiskMapError` を投げます。欠損・空入力は `unknown`、不正入力は `RiskMapError` として区別し、空の `findings` を「問題なし」に見せないようにしています。

### 4. 承認の根拠にしない

出力には常に `authorizesApproval: false` と `evidenceTrust: 'unverified-input'` が付きます。JSDoc にも、first-match の評価・レビューのルーティング・GitHub の承認やマージ権限を変えない、と書かれています。

これは単なる注記ではなく、診断の限界から来る線引きです。たとえば同じ risk map で `src/app.ts` だけを変更すると、結果は `status: 'analyzed'` で `findings` は空になります。

```json
{ "status": "analyzed", "reasonCodes": [], "findings": [] }
```

`src/auth/**` が `src/**` に隠れている構造は何も変わっていません。今回の変更ファイルがたまたまそこに当たらなかっただけです。`findings` が空でも、それは「この変更ファイルでは、隠れた厳しい規則が見つからなかった」以上の意味を持ちません。risk map 全体が正しい順序だという証明にはならないので、承認に使えない形で出しています。

## テストで決めていること

`tests/risk-map.test.mjs` は手元で 24 件すべて通りました（`node --test tests/risk-map.test.mjs`、pass 24 / fail 0）。そのうち名前が `shadow diagnostic:` で始まるテストが 8 件あり、上の 4 つの判断（隠れた厳しい規則の検出、unknown の分岐、不正入力の例外など）を固定しています。

## 時点：まだどこからも呼ばれていない

2026-10-28 時点の main（`df5ce89c`）では、`src/` 配下で `diagnoseShadowedRiskRules` を参照しているのは定義している `src/lib/risk-map.mjs` だけです。Issue #2781 は OPEN のままで、診断を Router や CLI・レポートに出す統合は今後の段階として残っています。つまりこの記事で見たのは、評価を変えずに隠れた規則を取り出せる部品ができた、というところまでです。

関連して、PR #2780 は Risk Map が未設定のとき、小さな認証・決済系の変更を Router が `team` 以上のレビューへ引き上げるようにしました。これは first-match の評価には触れない別の対策で、risk map を書いているリポジトリでの順序の誤りは、今回の診断の守備範囲です。

## first-match だけの問題ではない

規則の順序で結果が決まる設定は、向きが逆でも同じ型の問題を持ちます。GitHub の CODEOWNERS は後ろの規則が勝つ方式で、公式ドキュメントのサンプルにも「Order is important; the last matching pattern takes the most precedence.」とあります（[About code owners - GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)）。こちらでは、後ろに足した広い規則が、前に書いた細かい規則を隠します。

どちらの方式でも、規則を書いた行が存在することと、その規則が評価に届くことは別です。順序で決まる規則を AI レビューや CI のリスク判定に使っているなら、実際の変更ファイルに対して「本当はもっと厳しく見るはずだった」規則が無いかを、評価とは別の読み取り専用の経路で出しておくと、分類の甘さに気づけます。その結果を承認の根拠にしないことまで含めて、診断の設計です。

River Review の判断をどの層に置くかという全体の考え方は、[AIコードレビューを4層に分ける。River ReviewのJudgment Placement設計](/articles/river-review-judgment-placement) にまとめています。チームの判断を残す設計の全体像は [River Reviewのコア設計：AIレビューではなく、チームの判断を再現しやすい形で残す](/articles/river-review-core-design)、実装後ガードの中での位置づけは [AI駆動開発の2層ガード設計：PlanGateとRiver Reviewで実装前後を守る](/articles/ai-dev-guardrail-plangate-river-reviewer) で書いています。

## 参考

- [s977043/river-review PR #2784](https://github.com/s977043/river-review/pull/2784)（`diagnoseShadowedRiskRules` の追加）
- [s977043/river-review Issue #2781](https://github.com/s977043/river-review/issues/2781)
- [s977043/river-review PR #2780](https://github.com/s977043/river-review/pull/2780)
- [About code owners - GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
