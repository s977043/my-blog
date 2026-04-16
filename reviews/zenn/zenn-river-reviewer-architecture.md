# articles/zenn-river-reviewer-architecture.mdの記事レビュー

## 🚩 レビュー方針
親ISSUE #11のレビュー観点（誤字脱字／用語誤用／文章わかりやすさ／内容重複／Web記事として読みやすい構成／技術記載の正確性／読者ニーズ充足／SEO改善）に基づき、「AIエージェントを"投げっぱなし"にしない：Agent Skillsと自由度の設計で実現する「評価駆動の開発エコシステム」」記事のレビューを実施しました。独自フレームワーク（River Reviewer）の設計説明記事のため、用語定義の一貫性・TypeScript例の実装可能性・フローベースの整合性を重点的に確認しました。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @claude | - 記事構成・読みやすさ<br>- 対象読者との整合性<br>- SEO最適化 | - [x] 済 |
| **Web編集者視点** | @claude | - 誤字脱字・表現統一<br>- 文章の明確性<br>- 重複表現の確認 | - [x] 済 |
| **Webエンジニア視点** | @claude | - TypeScript型定義の正確性<br>- Plan JSONスキーマの妥当性<br>- YAML例の運用可能性 | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい（h2-h3の適切な使用）
- [x] 表に長文が入っていない
- [x] 画像パスが Zenn Preview で解決する（画像なし、Mermaid使用）
- [x] 公式リンクはクリック可能（Markdown link）
- [x] コードブロックの言語指定が適切
- [x] メッセージボックス（:::message）の適切な使用

---

## 指摘コメント

### 該当箇所 1
L20-L23 （River Reviewer の定義文の重複）

```markdown
River Reviewer は、SDLC（設計 → 実装 →QA）を **上流/中流/下流** のフェーズとして扱い、フェーズに応じた「スキル」を適用してレビューを実行する **フローベースの AI レビューエージェント** です。GitHub Actions で PR 作成時に動かし、変更ファイルに応じてスキルを読み込み、スキーマ検証のうえで構造化したレビューコメントを出力できます。

River Reviewer は、PR や仕様を入力にして「計画 → レビュー → 検証」を流れで実行する、**AI レビュー運用のための OSS/フレームワーク** です。
```

### 問題点
連続する2段落で River Reviewer を定義しているが、定義文が2回繰り返されており、かつ片方は「フローベースのAIレビューエージェント」、もう片方は「AIレビュー運用のためのOSS/フレームワーク」と呼称が異なる。読者は「結局 River Reviewer はエージェントなのか、OSSフレームワークなのか、どちらで捉えればよいのか」を混乱する。

### 提案
1段落に統合し、呼称を「OSS/フレームワーク」に統一する（エージェントは動作主体、フレームワークは記事の主題として適切）。

```markdown
River Reviewer は、PR や仕様を入力にして「計画 → レビュー → 検証」を流れで実行する **AIレビュー運用のためのOSS/フレームワーク** です。SDLC（設計 → 実装 → QA）を **上流/中流/下流** のフェーズとして扱い、フェーズに応じた「スキル」を適用してレビューを実行します。GitHub Actions で PR 作成時に動かし、変更ファイルに応じてスキルを読み込み、スキーマ検証のうえで構造化したレビューコメントを出力します。
```

---

### 該当箇所 2
L20 （矢印記号の混在）

```markdown
River Reviewer は、SDLC（設計 → 実装 →QA）を **上流/中流/下流** のフェーズとして扱い
```

### 問題点
「設計 → 実装 →QA」という表記で、「実装」と「QA」の間に半角スペースがなく、前の「設計 → 実装」は半角スペースあり。矢印前後のスペースに不統一がある（「実装 → QA」となるべき）。他にL22「計画 → レビュー → 検証」は正しく全てスペースありで統一されているため、L20のみ不一致。

### 提案
```markdown
River Reviewer は、SDLC（設計 → 実装 → QA）を **上流/中流/下流** のフェーズとして扱い
```

---

### 該当箇所 3
L68-L72 （自由度テーブルのTemperature推奨値）

```markdown
| 自由度                     | カテゴリ               | 推奨 Temp | 承認 (HITL)      | ユースケース例                                    | 失敗時のインパクト     |
| :------------------------- | :--------------------- | :-------- | :--------------- | :------------------------------------------------ | :--------------------- |
| **低自由度：Cliff (崖)**   | **セキュリティ・基盤** | 0.0 - 0.1 | **事前承認必須** | 認証ロジックの変更、DB マイグレーション、権限変更 | サービス停止、情報漏洩 |
| **中自由度：Hill (丘)**    | **リファクタリング**   | 0.3 - 0.5 | 事後レビュー     | 重複コード共通化、型の厳格化、コンポーネント分割  | バグ混入、表示崩れ     |
| **高自由度：Plain (平原)** | **新規機能・案**       | 0.7 - 0.9 | 不要             | 新機能のロジック案、README 作成、正規表現列挙     | 案が不採用（低リスク） |
```

### 問題点
高自由度のユースケース例に「新規機能のロジック案」と「README 作成」が同居しているが、「新規機能のロジック」は本番コードに直結するため、失敗時のインパクトが「案が不採用（低リスク）」とは限らない（例：セキュリティを伴う認証機能の新規実装は Cliff 相当になる）。「新規機能案の提案」と「新規機能の実装」を区別しないと、読者が「新規機能は全部 Plain でよい」と誤解する可能性がある。

### 提案
```markdown
| **高自由度：Plain (平原)** | **アイデア出し・ドキュメント**       | 0.7 - 0.9 | 不要             | 新機能の**アイデア案**、README 作成、正規表現列挙、コード例の列挙     | 案が不採用（低リスク） |
```
本文でも「実装に繋がる新規機能は Cliff / Hill に該当する場合がある」と注記する。

---

### 該当箇所 4
L100-L124 （TypeScript インターフェース命名）

```typescript
interface AgentSkills {
  name: string;
  riskLevel: RiskLevel;
  rule: {
    priorities: string[];
    prohibited: string[];
    ...
  };
}

// 具体的なスキル定義の例
export const DatabaseMigrationSkills: AgentSkills = {
```

### 問題点
インターフェース名が `AgentSkills` と複数形になっているが、型定義の内容は単一の「スキル1つ」を表現している（`name` が単数、`riskLevel` が単数、`rule` が単数オブジェクト）。TypeScript の命名慣習では単一オブジェクトの型は単数形（`AgentSkill`）にする。複数スキルをまとめる集合なら配列やRecord型で表現する。同様に `DatabaseMigrationSkills` も単数の値だが複数形の命名。

### 提案
```typescript
type RiskLevel = "Cliff" | "Hill" | "Plain";

interface VerificationConfig {
  type: "shell" | "unit-test" | "e2e";
  command: string;
  blocking: boolean;
}

interface AgentSkill {
  name: string;
  riskLevel: RiskLevel;
  rule: {
    priorities: string[];
    prohibited: string[];
    stopConditions: string[];
    verify?: VerificationConfig;
  };
}

// 具体的なスキル定義の例
export const DatabaseMigrationSkill: AgentSkill = {
  name: "DB Schema Auditor",
  riskLevel: "Cliff",
  rule: {
    priorities: ["インデックスの貼り忘れ確認", "破壊的変更の検知"],
    prohibited: [
      "テーブルの直接削除（DROP）",
      "ダウンタイムが発生するカラム変更",
    ],
    stopConditions: [
      "既存データの移行手順が仕様書に記載されていない場合",
      "影響を受けるクエリの実行計画が不明な場合",
    ],
    verify: {
      type: "shell",
      command: "npm run test:migration-dry-run",
      blocking: true,
    },
  },
};
```

---

### 該当箇所 5
L115-L118 （TypeScript型定義の `verify` 必須化の矛盾）

```typescript
  rule: {
    priorities: string[];
    prohibited: string[];
    /**
     * Stop Conditions: AIが「これ以上進めてはいけない」と判断する境界線
     */
    stopConditions: string[];
    /**
     * Cliffレベルの場合、verifyの定義を必須とする運用を推奨
     */
    verify?: VerificationConfig;
  };
```

### 問題点
JSDocコメントでは「Cliffレベルの場合、verifyの定義を必須とする運用を推奨」と書かれているが、実際の型定義では `verify?: VerificationConfig;` とオプショナル（`?`）のまま。型レベルで強制するなら、Discriminated Union で `riskLevel: "Cliff"` の場合だけ `verify` を必須にする型設計にできる。型安全性を謳うならコード例もそれに沿うべき。

### 提案
型で強制する例を示すか、「型では強制せず運用で担保する」ことを明示する。型で強制する例：

```typescript
type RiskLevel = "Cliff" | "Hill" | "Plain";

interface VerificationConfig {
  type: "shell" | "unit-test" | "e2e";
  command: string;
  blocking: boolean;
}

interface BaseRule {
  priorities: string[];
  prohibited: string[];
  stopConditions: string[];
}

// Discriminated Union で Cliff のみ verify を必須化
type AgentSkill =
  | {
      name: string;
      riskLevel: "Cliff";
      rule: BaseRule & { verify: VerificationConfig }; // 必須
    }
  | {
      name: string;
      riskLevel: "Hill" | "Plain";
      rule: BaseRule & { verify?: VerificationConfig }; // 任意
    };
```

---

### 該当箇所 6
L95-L97 （YAMLスキル定義とTypeScript型定義の関係の説明）

```markdown
ここでは考え方を分かりやすくするため TypeScript の型で表現しますが、River Reviewer 本体のスキル定義は **YAML frontmatter（メタデータ）＋ Markdown（ガイダンス）** で管理し、スキーマで検証して運用のブレを抑えます。
```

### 問題点
「本体は YAML frontmatter + Markdown で管理」と記載されているが、記事中にはその YAML frontmatter の具体例が一切示されていない。一方で L100-L147 には TypeScript の型定義例が詳細に示されているため、読者は「実際にどんな YAML を書けばよいのか」を理解できないまま記事を読み進めることになる。L82-L90 の「10行ルール」も純粋なMarkdownで frontmatter を含んでいない。

### 提案
TypeScript 型定義の後に、対応する YAML frontmatter + Markdown のサンプルを追加する。

````markdown
### YAMLによるスキル定義の例

実運用では、上記の型に対応する YAML frontmatter + Markdown で管理します。

```markdown
---
name: "DB Schema Auditor"
riskLevel: Cliff
rule:
  priorities:
    - "インデックスの貼り忘れ確認"
    - "破壊的変更の検知"
  prohibited:
    - "テーブルの直接削除（DROP）"
    - "ダウンタイムが発生するカラム変更"
  stopConditions:
    - "既存データの移行手順が仕様書に記載されていない場合"
    - "影響を受けるクエリの実行計画が不明な場合"
  verify:
    type: shell
    command: "npm run test:migration-dry-run"
    blocking: true
---

# DB Schema Auditor

このスキルは、DBマイグレーションPRに対して...
```
````

---

### 該当箇所 7
L155-L175 （Plan JSON の妥当性）

```json
{
  "riskLevel": "Hill",
  "files": [{ "path": "src/db/migrate.ts", "reason": "migration changes" }],
  "skills": [{ "id": "db-schema-audit", "reason": "migrations touched" }],
  "proposedActions": [
    "Add index for users.email",
    "Avoid type change; use shadow column + backfill"
  ],
  "verify": [
    {
      "type": "shell",
      "command": "npm run test:migration-dry-run",
      "blocking": true
    }
  ],
  "questions": []
}
```

### 問題点
Plan JSON の `riskLevel` が `"Hill"` となっているが、同じスキル（`db-schema-audit` = DB マイグレーション）は L102-L147 の TypeScript 定義で `riskLevel: "Cliff"` と定義されていた。同じDBスキーマ変更に対してPlanでは `Hill`、スキル定義では `Cliff` と食い違っており、読者がどちらが正しいのか混乱する。本文 L176 では「`Cliff` ならば手動承認、`Hill` ならば CI による自動判定へ」と記述されており、この例は自動判定に流れる Hill を示したい意図と思われるが、同じ `migrate.ts` 変更に対してリスクレベルが一致しない。

### 提案
Plan JSON の例を `"Cliff"` に揃えるか、本文で「リスクレベルは変更内容によって自己判定され、同じファイルでも新規テーブル作成か型変更かでCliff/Hillに分岐する」と注記を入れる。

```json
{
  "riskLevel": "Cliff",
  "files": [{ "path": "src/db/migrate.ts", "reason": "migration changes" }],
  "skills": [{ "id": "db-schema-audit", "reason": "migrations touched" }],
  "proposedActions": [
    "Add index for users.email",
    "Avoid type change; use shadow column + backfill"
  ],
  "verify": [
    {
      "type": "shell",
      "command": "npm run test:migration-dry-run",
      "blocking": true
    }
  ],
  "questions": []
}
```

または Hill を保持する場合は、例の直前に「新規テーブル追加のHillケース」と注記を追加する。

---

### 該当箇所 8
L178 （`failed` と「即時停止」の動作の曖昧さ）

```markdown
3.  **Verify (検証)**: スキルに紐づく `verify` コマンドを実行。失敗時はリトライさせず、「**なぜ失敗したか（期待値との差分等）」を共有メモリ（Dynamic Layer）に書き込んで即時停止** させます。
```

### 問題点
強調マーカーが閉じていない。「**なぜ失敗したか（期待値との差分等）」を共有メモリ（Dynamic Layer）に書き込んで即時停止** させます」の部分で、開始の `**` と終了の `**` の位置関係が不整合（開始 `**` の後、次の `**` までの範囲に「**なぜ失敗したか（期待値との差分等）」を共有メモリ（Dynamic Layer）に書き込んで即時停止**」という長い範囲になっている）。また全角鉤括弧 `」` で区切られており、Markdown のレンダリング結果が意図通りになるか不安定。

### 提案
強調範囲を限定する。

```markdown
3.  **Verify (検証)**: スキルに紐づく `verify` コマンドを実行。失敗時はリトライさせず、**「なぜ失敗したか（期待値との差分等）」を共有メモリ（Dynamic Layer）に書き込んで即時停止**させます。
```

---

### 該当箇所 9
L10-L12 （記事冒頭の note 記事参照の表現）

```markdown
:::message
この記事は、note 記事『[AI コードレビューの「投げっぱなし」をやめる](https://note.com/mine_unilabo/n/nd21c3f1df22e)』の設計思想をベースに、自律型 AI エージェントを組織の「資産」として運用するための実装パターンを解説する技術記事です。
:::
```

### 問題点
note記事のタイトル部分で全角二重鉤括弧 `『...』` を使用しているが、他の箇所（例：L212）では `AI コードレビューの「投げっぱなし」をやめる` と単一鉤括弧で表記されており、表現が統一されていない。また、内部の「投げっぱなし」も鉤括弧で囲まれているため、`『AI コードレビューの「投げっぱなし」をやめる』` と入れ子の括弧になり、視認性が悪い。

### 提案
```markdown
:::message
この記事は、note記事「[AIコードレビューの「投げっぱなし」をやめる](https://note.com/mine_unilabo/n/nd21c3f1df22e)」の設計思想をベースに、自律型AIエージェントを組織の「資産」として運用するための実装パターンを解説する技術記事です。
:::
```

---

## 総合評価

### 良い点
- **独自フレームワークの説明構成**: 定義（何であり／何でないか）→ アーキテクチャ → 統治 → 実装 → ワークフロー → 運用 という流れが論理的
- **Mermaid図による可視化**: 3フェーズと共有メモリの関係が直感的に理解できる
- **自由度の3分類（Cliff/Hill/Plain）**: 地形のメタファーで記憶に残りやすく、Temperature・HITL・ユースケースが表で整理されている
- **「10行ルール」の存在**: 詳細な型定義の前に読者がすぐ真似できるテキスト例が提示されている
- **評価駆動の運用**: Compression / パージ / KPI が具体的で、フレームワークの「育て方」まで踏み込んでいる

### 改善点
- **定義文の重複と呼称ブレ**（L20-L23）
- **TypeScript命名の複数形化**（`AgentSkills` → `AgentSkill`）
- **型定義と運用の整合性**（Cliff時の `verify` 必須化が型レベルで表現されていない）
- **Plan JSONとスキル定義のriskLevel不一致**
- **YAML frontmatter 実例の欠如**（本体はYAML管理と宣言しているがYAMLサンプルが本文にない）
- **Markdown記法の閉じ忘れ/装飾崩れ**（L178）

### 推奨アクション
1. **定義文の統合**: L20-L23を1段落に統合、呼称を「OSS/フレームワーク」に統一
2. **TypeScript命名修正**: `AgentSkills` → `AgentSkill`（単数形）
3. **YAMLサンプルの追加**: TypeScript型定義に対応するYAMLfrontmatter + Markdown例を追加
4. **Plan JSONのriskLevel整合**: スキル定義と同じCliffに揃えるか、注記追加
5. **Markdown装飾の修正**: L178の強調マーカー閉じ忘れ修正

### SEO観点での改善提案
- **タイトル**: 「AIエージェントを"投げっぱなし"にしない：Agent Skillsと自由度の設計で実現する「評価駆動の開発エコシステム」」は長くクエリ認識されにくい。「AIエージェント運用 Agent Skills設計：評価駆動で暗黙知を資産化」のようにキーワードを前方に寄せると流入が増えやすい
- **独自用語の定義強化**: 「River Reviewer」「Agent Skills」「共有メモリ（Static/Dynamic Layer）」「Cliff/Hill/Plain」といった独自用語は、初出時にさらに1-2文で定義・例示を加えるとSEO上の認識精度が上がる
- **関連キーワードの自然な挿入**: 「AIコードレビュー」「自律エージェント」「GitHub Actions」「MCP」「プロンプトエンジニアリング」は検索ボリュームがある。現時点でも一部含まれているが、H2/H3見出しにも分散して配置すると効果的
- **note記事との棲み分け**: 記事冒頭でnote記事への参照があるが、zenn記事側の差別化ポイント（「実装パターン」「型定義」「Plan JSON」）を1-2行でリード文に追加すると、重複コンテンツ判定を避けやすい
- **OSS/GitHubリンクの位置**: 本文最後にGitHubリンクが配置されているが、記事前半（例：L20付近のフレームワーク定義直後）にもリンクを置くと、OSSとしての検索流入・クリック流入が増える
- **関連記事セクションの欠如**: 他の3記事（plangate、sdd-tdd-nonblocking-agent、serena-vs-cipher-comparison）と違い、本記事には記事末尾の「関連記事」「自社メディア」セクションが存在しない。統一感のためにも、同著者の他記事へのリンクセクションを末尾に追加することを推奨

---

*レビュー実施者: @claude*  
*レビュー実施日: 2026-04-15*
