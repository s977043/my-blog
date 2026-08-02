<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=460151a2e13b651a27a8555ae38633bb0a1bf838 loops=4 reviewedAt=2026-08-02T02:28:00Z -->

# レビュー成果物: ai-merge-ready-state-machine

- **対象記事**: `articles/ai-merge-ready-state-machine.md`
- **実施日**: 2026-08-02
- **改善ループ数**: 4（初回3ループ＋マージ後の最終レビュー1回）
- **レビュー視点**: director（論旨・読者価値）/ editor（構成・文章）/ engineer（実装整合）/ security（脅威モデル・過大保証）
- **レビュー状態**: マージ後レビューの指摘反映済み
- **総合判定**: 公開可能（must/high なし、`published: false` 維持）

---

## 1. 不変条件

### 中心主張

PRを `MERGE_READY` まで収束させる処理はAIへ任せるが、マージの判断と実行は人間へ残す。その境界を、自然言語の禁止事項だけでなく、状態機械・fail-closed・外部作用境界・再開可能な記録によって構造化する。

### 保持した強調点

1. `MERGE_READY` は「マージしてよい」ではなく、人間の最終判断へ載せられる状態
2. AIが担当する内部状態機械に `MERGED` への遷移を置かない
3. 最新head SHAにCI・レビュー・証跡を束縛し、staleな結果を使わない
4. 検証不能な入力を成功扱いせず、人間へエスカレーションする
5. 外部作用をallowlistへ集約する
6. allowlistと静的検査は完全なsandboxではない
7. 責務境界と権限境界は別物
8. 判定と外部作用を分離する
9. intent／receiptだけでは厳密なexactly-onceを保証しない
10. 自律性の設計では「どこで止まるか」を決める

### 変更していないもの

- Front Matterの `published: false`
- 記事タイトルと中心メッセージ
- PlanGate実装への参照リンク
- 一人称のです・ます調

---

## 2. Loop 1: 技術整合性と境界の定義

### レビュー結果

| ID | 視点 | 優先度 | 指摘 |
|---|---|---|---|
| L1-01 | engineer | high | 状態表とMermaid図が `MERGE_READY_CANDIDATE`、`HUMAN_ESCALATED`、`EXEC_RETURN` を省略し、本文の状態機械説明と不一致 |
| L1-02 | security | high | 「AIにマージさせない」が、ワークフロー上の責務境界なのか、認証・権限による強制境界なのか曖昧 |
| L1-03 | director | medium | 導入直後に `:::message` が2つ連続し、予告内容が重複 |
| L1-04 | editor | medium | マージ判断の例で「リリース」と「ブランチへの取り込み」が混在 |
| L1-05 | engineer | medium | `MERGE_READY` で人間へ何を引き渡すのかが抽象的 |
| L1-06 | editor | low | `MERGE_READY_CANDIDATE` の表説明が長く、一覧性が低い |
| L1-07 | engineer | low | Mermaidの人間領域ノード宣言順を堅牢化できる |

### 反映内容

- 状態表に中間状態・終端・2つのexitを追加
- Mermaid図へ `MERGE_READY_CANDIDATE`、`HUMAN_ESCALATED`、`EXEC_RETURN` を追加
- 人間領域をsubgraphとして先に定義し、AI状態機械外への破線遷移を明示
- 導入の2つのメッセージを1つへ統合
- マージ判断とリリース判断の混同を修正
- `MERGE_READY` recordの6フィールドを追加
- 「責務境界であり、権限境界ではない」という説明を追加

### 判定

中心主張は保持。状態機械の説明と図の不一致、境界の過大解釈につながる箇所を解消した。

---

## 3. Loop 2: 読者理解と保証範囲

### レビュー結果

| ID | 視点 | 優先度 | 指摘 |
|---|---|---|---|
| L2-01 | engineer | high | `MERGE_READY` recordが「最終判断に必要な情報をすべて保証する」と読める。実装は記録の存在までで、根拠内容の妥当性は人間の責務 |
| L2-02 | director | medium | 状態名の説明だけでは、1本のPRがどう進むか想像しにくい |
| L2-03 | security | medium | 許可するpushが一般的な `git push` に読め、forceや削除を組み立てない実装境界が伝わりにくい |
| L2-04 | editor | medium | allowlist、snapshot、intent、receiptの初出説明が不足 |
| L2-05 | engineer | medium | intentあり・receiptなしの扱いを「未完了」と断定すると、外部作用成功後・receipt前中断の不確実性が薄れる |
| L2-06 | editor | low | 1文段落と定型的な対比表現が続く箇所がある |

### 反映内容

- 「1本のPRがMERGE_READYへ進むまで」を追加し、6ステップで状態遷移を具体化
- recordを「最終判断を支える最小限の情報」と定義
- dispositionの記録存在と、根拠内容の真正性を分離
- `MERGE_READY` recordは人間の差分・証跡レビューを置き換えないと明記
- 許可対象を「PR headへの非force push」と具体化
- allowlist、snapshot、intent、receiptを初出で説明
- intentあり・receiptなしを「再要求され得る」とし、exactly-onceの限界を維持
- 複数の短い段落を統合し、読み進めやすく調整

### 判定

must/highは解消。抽象的な設計解説から、実装の保証範囲と人間の確認責務が分かる記事へ改善した。

---

## 4. Loop 3: 転用可能性と誤用防止

### レビュー結果

| ID | 視点 | 優先度 | 指摘 |
|---|---|---|---|
| L3-01 | security | high | 「権限を分離する」とだけ書くと、PRコメントとマージが同じ書き込み権限に含まれる場合もトークンスコープだけで分離可能と誤解される |
| L3-02 | editor | medium | `main` 固有の表現は、base branch名が異なる環境への転用を妨げる |
| L3-03 | director | medium | 一般原則は示されているが、読者が自分の環境で確認する項目へ落ちていない |
| L3-04 | security | medium | ruleset / required review / branch protectionと、PlanGate内部の責務境界の関係を整理すると誤用を減らせる |
| L3-05 | editor | low | 「重要な限界があります」などの予告文を削って、事実から入れる方が簡潔 |

### 反映内容

- `main` を「対象ブランチ」へ一般化
- 実行主体・権限分離に加え、ruleset、required review、branch protectionを多層防御として整理
- 「自分の環境へ転用するときの確認項目」を7項目で追加
- 導入順を「停止地点の定義 → 最新headへの証跡束縛 → 外部作用の集約」と提示
- 冗長な予告文を削除

### 判定

主張を変えず、PlanGate固有の実装紹介から、他のAIエージェント運用へ転用できる設計記事へ収束した。

---

## 5. Loop 4: マージ後の仕様確認と公開前調整

### レビュー結果

| ID | 視点 | 優先度 | 指摘 |
|---|---|---|---|
| L4-01 | security | high | PR更新とマージが同じGitHub権限に含まれるという説明は不正確。レビュー系は `Pull requests: write`、REST APIのマージは `Contents: write` |
| L4-02 | engineer | medium | GitHubのstale approval却下と、PlanGateのhead SHA束縛の役割差が未説明 |
| L4-03 | editor | medium | 「現在のリポジトリ設定」は時間とともに古くなるため基準日が必要 |
| L4-04 | director | medium | topicsのClaude Code / Codex依存が、本文の汎用的な主張と一致しない |
| L4-05 | editor | low | 冒頭のメッセージ内で想定読者と得られることが同じリストに混在 |

### 反映内容

- GitHub公式仕様に合わせ、レビュー系とマージ系のfine-grained token権限を分離して説明
- PR headへのpushとREST APIマージがともにContents書き込み能力と関係するため、トークンスコープだけでは「push可・merge不可」を分離しにくい点へ主張を修正
- GitHubのstale approval却下はリポジトリ側のマージ制約、PlanGateのhead SHA束縛は判定入力の内部整合性チェックと整理
- PlanGateのrequired approving review設定に `2026年8月2日時点` を付記
- topicsを `ai駆動開発 / aiagent / github / 設計 / 自動化` へ変更
- 冒頭メッセージを「想定読者」「この記事で得られること」に分割

### 判定

GitHub権限モデルに関する事実誤認を解消した。記事の中心主張は維持し、外部仕様とPlanGate内部設計の境界がより明確になった。

---

## 6. 最終レビュー

### 複数視点の判定

| 視点 | 判定 | コメント |
|---|---|---|
| director | pass | 問題提起、設計判断、限界、転用手順が一貫している |
| editor | pass | 冒頭の情報分類、用語、基準日の明示により公開時の読みやすさが向上した |
| engineer | pass | 状態集合、head SHA束縛、record、intent／receiptの説明が現行設計と整合 |
| security | pass | GitHubの権限モデルを正確に記述し、責務境界と強制的な権限境界を混同していない |

### 公開可否

**公開可能**。

- must: 0
- high: 0
- 中心主張: 保持
- 過大保証: なし
- `published`: `false` のまま
- 記事参照リンク: 維持
- GitHub権限モデル: 公式仕様と照合済み
