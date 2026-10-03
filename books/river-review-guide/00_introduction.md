# はじめに

この本は、River Reviewの機能一覧を説明するための本ではありません。

中心に置く問いは次です。

> **AIが生成する成果物が増えるほど、何を見て、何を根拠に、誰が「良い」と判断するのか。**

AIエージェントによってコードを書く速度は大きく上がりました。一方で、成果物を作る速度が上がっても、その成果物を受け入れてよいかを判断する速度は自動では上がりません。

生成される量が増えるほど、「計画と一致しているか」「テストは必要な失敗パスまで確認しているか」「AIのレビューコメント自体は正しいか」「どこから先は人が責任を持って判断すべきか」といった問いが増えます。

筆者が開発しているOSS [River Review](https://github.com/s977043/river-review) は、この問題を **Review Judgment as Code** として扱っています。

レビュー観点・判断基準・Evidence・責任範囲・エスカレーション条件・品質評価方法を、一度きりのプロンプトや個人の経験に閉じ込めず、**versioned / repo-owned / testable な資産**として持つ考え方です。

## River Reviewを「AIコードレビューツール」とだけ捉えない

現在のRiver Reviewは、自身を **Review Judgment Platform / team-owned audit layer** と位置づけています。

入力はdiffだけではありません。

~~~text
Requirement
Design
Plan
Diff
Tests
JUnit
Coverage
Existing Review
        ↓
   River Review
        ↓
Finding / Evidence / Verdict
~~~

判断をどこで実行するかも分けます。

~~~text
Deterministic
Heuristic
Agentic Review
Human Judgment
~~~

機械で証明できるものは機械へ、意味理解が必要なものはAgentic Reviewへ、責任や不可逆性を伴うものはHuman Judgmentへ置きます。

## この本で扱うこと

1. **Why** — なぜAI時代にレビュー判断の設計が必要なのか
2. **What** — River Reviewは何を責務として持つのか
3. **Design** — Skill / Artifact / Evidence / Judgmentをどう分けるのか
4. **Practice** — Plan / Diff / Tests / Review Resultを実際にどうレビューするのか
5. **Reliability** — AIレビューそのものをどう検証するのか
6. **Improvement** — MemoryとEvaluationで判断基準をどう改善するのか
7. **Adoption** — チームへどの順序で導入するのか

目標はRiver Reviewのコマンドを暗記することではありません。「この判断は機械で決めるか、AIへ任せるか、人が判断するか」「何をEvidenceにするか」を設計できる状態を目指します。

## 情報の基準

River Reviewの具体仕様は、**2026年10月3日時点の公開リポジトリ current main** を一次情報として確認して記述します。

公開前レビューで再現できるよう、本稿の仕様確認snapshotは次です。

- River Review main: `60f55e75d6eaead1956c6945afc53f57acd64dd9`
- Latest Release: **v1.124.5**（2026年9月25日公開）

本書ではrelease済み機能だけでなくcurrent main上のExperimentalな契約も扱うため、次の状態を区別します。

- **Implemented** — snapshotのcurrent mainで実装を確認できる
- **Experimental** — 実装は存在するがStable Contractではない、またはobserve-only / opt-in
- **Planned / Direction** — 設計・roadmap上の予定や長期方向

> **ImplementedはStableと同義ではありません。** 実行コードが存在していても、外部interfaceとしてはExperimentalなものがあります。

River Reviewのmainは今後も変わります。公開・改訂時には、このsnapshot以降の差分とLatest Releaseを再確認します。

### Sources

- [River Review README](https://github.com/s977043/river-review/blob/main/README.md)
- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [Stable Interfaces](https://github.com/s977043/river-review/blob/main/pages/reference/stable-interfaces.md)
- [River Review Releases](https://github.com/s977043/river-review/releases)
