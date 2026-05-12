# Zenn / Qiita / note / Growth Lab コンテンツ方針

最終更新: 2026-05-12

## 目的

このリポジトリで管理している Zenn / Qiita / note の記事群を、単発の記事管理ではなく、複数媒体をまたいだ技術発信ポートフォリオとして運用する。

主な目的は次の3つ。

1. AIコーディング・AIレビュー・開発生産性領域での認知を高める
2. Zenn / Qiita / note / Growth Lab / GitHub の導線を整理し、読者の回遊を増やす
3. PlanGate / River Reviewer / Agent Skills などのOSS・実験プロジェクトへの理解と利用を増やす

## 中心テーマ

中心テーマは次の一文に集約する。

> AIコーディングをチーム開発に乗せる運用設計

単に「AIを使って速く書く」ではなく、チーム開発に必要な次の観点を扱う。

- 実装前の計画と承認
- AIエージェントのスコープ制御
- PR差分だけに閉じないレビュー設計
- 再現性のあるAIレビュー観点
- AIが迷わないリポジトリ構造
- EM / TL / PdM が見るべき運用・品質・リスク
- AI活用を感想ではなくメトリクスで振り返る仕組み

## 媒体ごとの役割

| 媒体 | 役割 | 主な読者 | 記事の型 |
|---|---|---|---|
| note | 思想・背景・マネジメント・ストーリー | EM / TL / PdM / 技術広報 / 採用候補者 | なぜ必要か、何に困ったか、どう考えたか |
| Zenn | 技術深掘り・設計・実装パターン | エンジニア / アーキテクト / OSS利用候補者 | 仕組み、設計、コード、設定、運用パターン |
| Qiita | 検索流入・実務Tips・短い導入記事 | いますぐ困っている開発者 | 困りごと、対策、手順、チェックリスト |
| Growth Lab | 正本・長期SEO・体系化 | 継続的に読みたい読者 / 検索ユーザー | 完全ガイド、検証ログ、まとめ、更新履歴 |
| GitHub | 実装・一次情報・Issue導線 | OSS利用者 / コントリビューター | README、仕様、Issue、リリースノート |

## 主要クラスター

### 1. PlanGate

位置づけ: AIにコードを書かせる前の承認ゲート。

扱う論点:

- `plan -> approve -> exec` の基本フロー
- 「承認なし、コードなし」という運用原則
- Claude Code / Cursor / Codex でスコープが広がる問題
- 目的、変更範囲、やらないこと、テスト観点、リスクの事前確認
- Hook enforcement / Governance / Metrics

媒体別の書き分け:

| 媒体 | タイトル例 |
|---|---|
| note | AIにコードを書かせる前に、人間が承認する場所を作る |
| Zenn | PlanGateの設計: plan / approve / exec とHook enforcement |
| Qiita | Claude CodeでAIが勝手に実装範囲を広げるときの対策 |
| Growth Lab | PlanGate完全ガイド: 導入、運用、Metrics、Governance |

### 2. River Reviewer

位置づけ: PR差分だけでなく、開発の流れ全体を見るレビュー設計。

扱う論点:

- AI開発ではPR差分だけ見ても遅い理由
- 要件、設計、実装、検証、リリース後のレビュー対象化
- ADR / チームルール / 運用リスクの確認
- GitHub Actions やレビュー成果物との接続

媒体別の書き分け:

| 媒体 | タイトル例 |
|---|---|
| note | AIコードレビューはPR差分だけでは足りない |
| Zenn | River Reviewerの設計: 開発フロー全体をレビューする |
| Qiita | GitHub ActionsでAIレビューを流れ全体に広げる |
| Growth Lab | River Reviewer運用ドキュメント |

### 3. Agent Skills

位置づけ: プロンプト職人芸ではなく、レビュー観点を再利用可能な運用資産にする。

扱う論点:

- AIレビューの指摘がブレる理由
- エージェントごとの判断基準差
- プロンプト多重管理の問題
- Plan / Validate / Verify の分離
- 10行ルールなど、再利用可能なレビュー観点

媒体別の書き分け:

| 媒体 | タイトル例 |
|---|---|
| note | プロンプトを磨けば勝てる、をやめた |
| Zenn | Agent SkillsでAIレビューの再現性を上げる設計 |
| Qiita | AIレビューの指摘が毎回変わるときに見るチェックリスト |
| Growth Lab | Agent Skillsカタログと運用ガイド |

### 4. AI-readable repository

位置づけ: AIエージェントが迷わず読むためのリポジトリ構造。

扱う論点:

- `AGENTS.md` / `CLAUDE.md` / `docs/ai` の役割分担
- 長い指示ファイルに重要ルールが埋もれる問題
- ADR、設計メモ、運用ルールの置き場所
- 人間にもAIにも読みやすい構造

媒体別の書き分け:

| 媒体 | タイトル例 |
|---|---|
| note | AIが迷わないチーム開発ドキュメントをどう作るか |
| Zenn | AIが迷わないリポジトリ設計 |
| Qiita | AGENTS.mdとCLAUDE.mdの役割を分ける |
| Growth Lab | AI-readable repository設計ガイド |

### 5. EM / TL / PdM とAI開発運用

位置づけ: AI時代のチーム開発における役割再定義。

扱う論点:

- PdM: 目的、顧客価値、受入基準を明確にする
- TL: 設計、差分、品質リスク、技術的整合性を見る
- EM: AI活用を属人化させず、チーム運用に落とす
- 速度ではなく、手戻り、レビュー負荷、リスク検知を見る

媒体別の書き分け:

| 媒体 | タイトル例 |
|---|---|
| note | AIエージェント時代のEM / TL / PdMの役割 |
| Zenn | AI開発運用で見るべき技術的ガードレール |
| Qiita | AIコーディング前に確認する5項目 |
| Growth Lab | AI開発チーム運用プレイブック |

## 導線設計

### 基本導線

```text
Qiita  -> Zenn -> GitHub
note   -> Zenn -> GitHub / Growth Lab
Zenn   -> GitHub / Growth Lab / note
Growth Lab -> GitHub / Zenn / note
```

### 読者別の入口

| 読者 | 入口 | 次に送る場所 |
|---|---|---|
| いますぐ困っている開発者 | Qiita | Zenn / GitHub |
| 技術的に深く知りたい開発者 | Zenn | GitHub / Growth Lab |
| 背景や思想を知りたい人 | note | Zenn / Growth Lab |
| 継続的に体系で読みたい人 | Growth Lab | Zenn / GitHub |
| OSSを試したい人 | GitHub | Zenn / Growth Lab |

### 各記事末尾の共通CTA

記事末尾には、媒体の役割に応じたCTAを置く。

#### note

```text
実装や設定の詳細はZennにまとめています。
短い導入手順はQiita、継続的な検証ログはGrowth Labに整理しています。
OSSとして試せるものはGitHubに置いています。
```

#### Zenn

```text
この記事の背景やチーム運用上の考え方はnoteにまとめています。
実装はGitHub、検証ログや関連ドキュメントはGrowth Labに整理しています。
```

#### Qiita

```text
詳しい設計背景はZenn、チーム運用上の考え方はnoteにまとめています。
実装例はGitHubにあります。
```

#### Growth Lab

```text
このページは長期的に更新する正本です。
実装詳細はGitHub、技術記事はZenn、背景や所感はnoteにも分けて公開しています。
```

## 記事作成ルール

### 1記事1論点

特にQiitaは1記事1論点に絞る。

良い例:

- Claude CodeでAIが勝手に実装範囲を広げるときの対策
- AIコーディング前に確認する5項目
- PRレビューだけではAI開発が危ない理由
- AGENTS.mdとCLAUDE.mdの役割を分ける

避ける例:

- AI開発運用のすべて
- Claude Code、レビュー、組織、メトリクスを1本で全部説明する記事

### 冒頭で読者の困りごとを明示する

冒頭は、抽象論ではなく実務上の困りごとから入る。

例:

```text
Claude CodeやCursorで実装を任せると、便利な一方で、
気づいたら変更範囲が広がっていたり、テスト観点が後付けになったりします。

この記事では、AIにコードを書かせる前に確認する5項目を整理します。
```

### 先に結論を書く

各記事の冒頭には、次のいずれかを置く。

- この記事でわかること
- 結論
- 対象読者
- 今回扱わないこと

### 同一テーマの丸ごと転載はしない

同じテーマを複数媒体で扱う場合も、本文の丸ごと転載は避ける。

| やらない | やる |
|---|---|
| 同じ本文をnote / Zenn / Qiitaに貼る | 読者と目的ごとに切り口を変える |
| どの記事も長くする | Qiitaは短く、Zennは深く、noteは背景を書く |
| すべてGitHubへ直接送る | 媒体間で理解の階段を作る |
| 末尾リンクだけ置く | 冒頭・本文中・末尾に自然な関連記事導線を置く |

## 公開済み記事の更新方針

### note

優先更新:

1. PlanGate系の記事を入口記事として整える
2. Agent Skills記事にチェックリストを追加する
3. EM / TL / PdM記事にAIエージェント時代の役割分担を追記する
4. 各記事にZenn / Qiita / Growth Lab / GitHubへの導線を追加する

noteで重視すること:

- タイトルは思想だけでなく検索語も含める
- 冒頭50〜100文字で要点を示す
- ハッシュタグは5個前後に絞る
- 固定記事は、アクセス増を狙う期間はPlanGate系に寄せる

### Zenn

優先更新:

1. PlanGate記事群に関連記事導線を追加する
2. River Reviewer記事からPlanGate / Agent Skillsへつなぐ
3. AI-readable repository記事をPlanGate / River Reviewerの前提記事として位置づける
4. 技術詳細、CLI、設定、GitHub Actions、SchemaをZennに集約する

Zennで重視すること:

- 実装手順と設計判断を書く
- コマンド、ディレクトリ構成、設定例を入れる
- GitHub READMEやOSSへの導線を強める
- noteへのリンクは「背景を知りたい人向け」に置く

### Qiita

優先更新:

1. Pickup Articleを現在のAI開発運用テーマに寄せる
2. PlanGate / River Reviewer の入口記事を整える
3. 検索されやすい短いTips記事を増やす
4. プロフィールをAI開発運用テーマに揃える

Qiitaで重視すること:

- タイトルに具体的な困りごとを入れる
- 1記事1論点にする
- 長い背景説明はZenn / noteへ逃がす
- 「まず試す」ための手順やチェックリストを入れる

## プロフィール方針

各媒体のプロフィール文は、中心テーマを揃える。

### Zenn

```text
AIコーディングをチーム開発に乗せる運用設計を検証しています。
PlanGate / River Reviewer / Agent Skills / AI-readable repository を中心に、
Claude Code・Codex・GitHub Actions・Next.js・Laravelでの実践ログを発信中。

詳しい検証ログ: Growth Lab
思想・背景: note
OSS: GitHub
```

### Qiita

```text
AIコーディングエージェントをチーム開発で安全に使うための運用設計を検証しています。
PlanGate / River Reviewer / Agent Skills / AI-readable repository などを書いています。

note: 背景・思想
Zenn: 技術深掘り
Growth Lab: 検証ログ
GitHub: OSS
```

### note

```text
AIコーディング、AIレビュー、開発生産性、エンジニアリングマネジメントについて書いています。
PlanGate / River Reviewer / Agent Skills など、AIをチーム開発に乗せるための運用設計を検証中です。

技術詳細: Zenn / Qiita
検証ログ: Growth Lab
OSS: GitHub
```

## 直近30日の実行計画

### Week 1: 導線整備

- Zennプロフィールを更新する
- Qiitaプロフィールを更新する
- noteプロフィールにZenn / Qiita / Growth Lab / GitHub導線を追加する
- QiitaのPickup ArticleをAI開発運用系に寄せる
- 既存のPlanGate / River Reviewer / Agent Skills記事に相互リンクを追加する

### Week 2: Qiita入口記事を追加

優先して出す記事:

1. Claude CodeでAIが勝手に実装範囲を広げるときの対策
2. AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks
3. PRレビューだけではAI開発が危ない理由

### Week 3: Zenn深掘り記事を追加

優先して出す記事:

1. PlanGateのHook enforcement設計
2. River Reviewerのレビュー対象設計
3. Agent SkillsでAIレビューの再現性を上げる方法

### Week 4: noteまとめ記事とGrowth Lab正本化

優先して出す記事:

1. note: AIコーディングをチーム開発に乗せるために作っているもの
2. Growth Lab: PlanGate / River Reviewer / Agent Skills のまとめページ
3. 各媒体の記事末尾に正本ページへの導線を追加する

## 計測指標

| 指標 | 見る目的 |
|---|---|
| noteのビュー / スキ / コメント | 思想・背景記事の反応を見る |
| ZennのView / Like / GitHub遷移 | 技術深掘り記事の反応を見る |
| Qiitaの閲覧数 / LGTM / ストック | 検索流入と実務Tipsの需要を見る |
| Growth Labの検索流入 / 回遊 | 長期SEOと正本ページの効果を見る |
| GitHub Star / Issue / Clone | OSSへの送客成果を見る |

## 判断基準

### 伸びた記事は派生させる

伸びた記事は、次の形に分解して増やす。

- 背景記事: note
- 技術詳細: Zenn
- Tips: Qiita
- 完全版: Growth Lab
- 実装: GitHub

### 伸びなかった記事はタイトルと冒頭を直す

本文を大きく書き換える前に、次を確認する。

- 誰の困りごとかが冒頭で明確か
- 検索される語がタイトルに入っているか
- この記事で何が得られるかが最初に書いてあるか
- 関連記事やGitHubへの導線があるか

## 当面の最優先事項

最初の一手は、次の3つに絞る。

1. Zenn / Qiita / note のプロフィールを「AIコーディングをチーム開発に乗せる運用設計」に統一する
2. PlanGate系記事を入口にして、Zenn / Qiita / note / GitHub の相互導線を作る
3. Qiitaに短い入口記事を追加し、Zennの深掘り記事とGitHubへ送る

この方針により、媒体ごとの記事がバラバラに見える状態を避け、読者が「この人はAI開発をチーム運用に乗せる人だ」と認識しやすい構造を作る。
