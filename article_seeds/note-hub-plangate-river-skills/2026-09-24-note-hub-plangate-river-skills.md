---
seed_id: seed-20260924-note-hub-plangate-river-skills
title: "計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口"
date: 2026-09-24
status: seed
topics:
  - plangate
  - river-review
  - agent-skills
  - ai-driven-development
  - hub-article
source: external
source_url: https://github.com/s977043/PlanGate
source_ref: https://github.com/s977043/river-review / https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
evidence_status: verified
promoted_to:
article_type_candidates:
  - insight
  - analysis
---

# 計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口

note 個人名義のハブ記事（既存記事への入口）の構成案。本文はまだ書かない。

## 観測事実

一次情報は個人リポジトリの公開 README と Anthropic 公式ドキュメントに限る（2026-09-24 取得）。

PlanGate（https://github.com/s977043/PlanGate ）

- README の副題は「承認なし、コードなし」。人間が承認した計画・タスク・受入テストが揃うまで、AI にプロダクションコードを書かせないゲート型ワークフローと説明されている
- 一般的なエージェントフレームワークが自律性を重視するのに対し、承認境界・監査可能性・スクラム親和性を重視すると明記している
- 導入は Level 1（plan 承認だけ）から Level 5（eval / timeline）までの段階制で、Level 1 から始めることを推奨している
- 「やらないこと」として、自律エージェントを目指さない、全機能を最初から強制しない、を挙げている

River Review（https://github.com/s977043/river-review ）

- 「Review Judgment as Code」。レビュー基準を versioned / repo-owned な skill として扱う OSS フレームワークと説明されている
- 入力は diff だけでなく plan / tests / JUnit / 既存レビュー結果を含む
- コアモデルは「Skills define judgment / Gates execute judgment / Riverbed remembers judgment」の3文
- 「River Review = レビューする / PlanGate = 止める・通す」という役割分担を README 自身が明記している。GO / NO-GO の判断は呼び出し側と人間の責務で、自動承認・自動マージは行わない

Agent Skills（https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview ）

- Skill は指示・メタデータ・任意のリソース（スクリプト、テンプレート）をまとめたもので、関連するときに Claude が自動で使う
- progressive disclosure：メタデータは起動時に常に読み込まれ、SKILL.md 本体は発動時に、追加リソースは必要時に段階的に読み込まれる

## 自分の解釈

3つは同じ層の道具ではない。PlanGate は「いつ止めるか」、River Review は「何を基準に見るか」、Agent Skills は「その手順や基準をエージェントへどう渡すか」を担う、と整理できる。River Review が判断基準を skill として持つ点で、Agent Skills は両者を運ぶ器の位置にある。

この整理は README の記述からの筆者解釈であり、各 README が3者の関係をこの形で定義しているわけではない。本文でも事実と解釈を分けて書く。

## 違和感 / Reader Problem

- 既存記事がツール単位・バージョン単位に分かれていて、note から来た読者が「どれから読めばよいか」を判断できない
- 名前が3つ並ぶと「全部入れないといけない重い仕組み」に見える。実際は PlanGate 自体が Level 1 からの段階導入を勧めている
- note の読者はマネジメント視点の人が多く、Zenn の実装詳細記事へいきなり飛ばすと離脱しやすいと考えられる（未検証の仮説）

## 今の仮説

- 「止める・見る・渡す」の3動詞で役割を分けると、ツール名を知らない読者でも位置づけを掴める
- ハブ記事は新しい主張を足すより、既存記事への道順を示すことに徹したほうが価値が出る

## 既存知識との接続

リンク候補（articles/ は Zenn、articles_note/published/ は note。すべて公開済みを frontmatter / 出典行で確認）。

PlanGate

- note：[AIにコードを書かせる前に、人間が承認する場所を作る](https://note.com/mine_unilabo/n/n02992266d622)
- note：[AIコーディングの暴走を「仕組み」で止める（PlanGateという開発フロー）](https://note.com/mine_unilabo/n/n3aae6b5467b9)
- note：[AI駆動開発はアジャイルにフィットするのか](https://note.com/mine_unilabo/n/n92b270e91110)
- Zenn：`plangate-ai-coding-workflow`（アジャイルでAI駆動開発をどう回すか）
- Zenn：`plangate-v86-hook-enforcement`（PlanGate v8.6.0 の Metrics v1 と Governance）

River Review

- Zenn：`river-review-judgment-placement`（AIコードレビューを4層に分ける）
- Zenn：`river-review-plugin-migration`（Claude Code / Codex の Plugin にした話）
- Zenn：`river-reviewer-v033-improvement-loop`（v0.30 から v0.33 の改善）

Agent Skills

- note：[「プロンプトを磨けば勝てる」をやめた：AIレビューを運用に乗せる“Agent Skills”設計](https://note.com/mine_unilabo/n/nd21c3f1df22e)
- Zenn：`zenn-river-reviewer-architecture`（Agent Skills と自由度の設計）
- Zenn：`ai-generated-skill-md-reality-check`（AIに書かせた SKILL.md の実態）

横断

- Zenn：`ai-dev-guardrail-plangate-river-reviewer`（2層ガード設計：実装前後を守る）
- note：[失敗をモデルのせいにしない。AI駆動開発を「Model + Harness」で考える](https://note.com/mine_unilabo/n/nd6a5d83d1488)

Zenn 記事の URL はクロスポスト時のリンク方針（AGENTS.md §記事内クロスプラットフォーム参照）に従って本文化の段階で確定する。

## 記事化の角度

- Experience：【著者確認】3つを使い始めた順番ときっかけ（PlanGate が先か、River Review が先か）
- Tutorial：扱わない（手順は Zenn 側の役割）
- Analysis：README の「やること / やらないこと」と役割分担の記述を並べ、3者の境界を表にする
- Insight：「止める・見る・渡す」で分けると、導入を1つずつ選べる
- Evidence：各 README と公式ドキュメントの記述のみ。効果の数値は出さない

### 構成案（Draft Article Plan 前の構成メモ）

想定読者：AI コーディングをチームに入れたいが、個別記事の量に迷っている EM / テックリード。
想定分量：3,000〜4,000字。note 個人名義。

1. 導入：この記事は入口であること
   - 【著者確認】ハブ記事を書こうと思った動機（読者からの質問、自分の整理の必要など）
   - 3つを全部読む必要はない、目的別に1本選べばよい、と先に言う
2. 3つの役割を1枚で見る
   - 表：道具 / 担うこと（止める・見る・渡す） / 人間に残す判断 / 最初の1歩
   - 図候補：計画 → 実装 → レビューの流れに PlanGate と River Review を置き、Agent Skills を両者の下に敷く図（PNG 化前提）
   - README 由来の事実と筆者の整理を段落で分ける
3. PlanGate：計画の承認で止める
   - 「承認なし、コードなし」と Level 1 から始める段階導入
   - 【著者確認】自分のチームで最初に止めた場面の一次経験
   - 次に読む：note 2本、Zenn 1本
4. River Review：レビュー判断をチームの資産にする
   - Skills / Gates / Riverbed の3文と、自動マージしない境界
   - 【著者確認】レビュー判断を skill 化しようと思った具体的なきっかけ
   - 次に読む：Zenn 2本
5. Agent Skills：手順と基準をエージェントへ渡す器
   - 公式ドキュメントの progressive disclosure の説明（公式事実として引用）
   - 【著者確認】SKILL.md を書いてうまくいかなかった経験を、どの程度ハブで触れるか
   - 次に読む：note 1本、Zenn 2本
6. どこから読むか（目的別の道順）
   - 「AI に勝手に書かせたくない」→ PlanGate
   - 「レビューが属人化している」→ River Review
   - 「プロンプトが毎回ぶれる」→ Agent Skills
7. おわりに
   - 【著者確認】今後この入口記事に追加していく予定の記事（更新方針）

タイトル候補

- 計画を止める・判断を残す・手順を渡す：PlanGate / River Review / Agent Skills の入口
- AIコーディングをチームに乗せる3つの道具：どこから読むかの地図

## 次に試すこと

- [ ] 【著者確認】プレースホルダを埋める
- [ ] 初稿前に `## Draft Article Plan: note/<slug>` を追記する（承認後に見出しを Approved へ変更）
- [ ] 本文化の直前に各 README を再取得し、Level 構成や役割分担の記述が変わっていないか確認する

## 追記ログ

### 2026-09-24

- 構成案を作成。一次情報は PlanGate / river-review の README と Agent Skills 公式ドキュメント

## Draft Article Plan: qiita/plangate-advent-start

- channel: qiita
- slug: plangate-advent-start
- article_type: 比較・実務ガイド
- reader_problem: Claude Code に小さな実装変更を頼むとき、計画が生成されたことと着手してよいことを区別できず、変更してほしくない範囲・受入条件・検証・承認をどこで明確にするか迷っている開発者。
- central_claim: AI に実装を任せる前に、何を変えるかだけでなく何を変えないかを決め、受入条件と検証を含む計画を人が判断できる形にする。
- out_of_scope: Claude Code Plan Mode との機能優劣、全モード・全経路での物理的な編集禁止の保証、プラグイン導入だけで hook が有効になるという主張、未計測の品質・生産性向上、完全自律実装や自動承認の一般化、全機能・全ゲートの解説、会社の事例、未確認の著者体験。
- claim_boundary: required
- claim_boundary_reason: OSS の現行機能・導入方法・承認境界・hook の強制範囲・実行例を扱うため。
- lifecycle: PLANNED（企画。実践例の検証・初稿・公開承認は未実施）
- provisional_title: Claude Codeに実装を任せる前に「変更しないこと」を決める — 自作OSS PlanGateの始め方
- publication_target: Claude Code Advent Calendar 2026、シリーズ4、2026-12-10（JST）。参加登録は未完了。 https://qiita.com/advent-calendar/2026/claudecode
- tracking: https://github.com/s977043/my-blog/issues/1067

既存 Seed の PlanGate の設計思想と段階導入を根拠として、Claude Code を使う読者の最初の1タスクに焦点を絞る。既存 note ハブ企画に残る著者確認事項・体験は今回の主張に用いず、元の企画や metadata は変更しない。Qiita 公開済み plangate-ai-coding-workflow の PBI / スクラム運用解説、Zenn Book plangate-agent-governance の全体解説は転載しない。

### Evidence Boundary

- Observed: 個人 OSS PlanGate が公開され、現行 README / plugin guide は v8.24.0 を示している。既存 Seed の PlanGate の役割を、今回の読者課題へ絞り込む。著者の未記録の失敗・感情は補完しない。
- Verified: 2026-11-25、https://github.com/s977043/PlanGate/blob/main/README.md と https://github.com/s977043/PlanGate/blob/main/plugin/plangate/README.md を確認。plugin は agent / skill / command / rule を配布する。Claude Code marketplace の追加・local scope のインストール・一覧確認が案内されている。導入状態と実際の計画生成・hook 強制は別の確認対象であり、一部コマンドには bin/plangate CLI が必要。
- Verified: https://github.com/s977043/PlanGate/blob/main/docs/ai/contracts/plan.md は PBI INPUT PACKAGE から plan.md / todo.md / test-cases.md を生成する契約、Goal / Constraints / Files / Testing Strategy 等の成功条件、受入基準が未カバーの場合の停止、scope 外は別 PBI という規約を示す。
- Verified: https://github.com/s977043/PlanGate/blob/main/docs/staged-adoption-guide.md は Phase 0〜3、導入 Level、Task Mode を別軸としている。Phase 0 ultra-light は計画・ゲート省略、Phase 1 light は簡易計画、Phase 2 standard は C-1/C-3 等の導入、Phase 3 は strict 化。警告と block の区別、hook の jq/sed 前提、plugin 単体では hook 未配布という制約を守る。導入レベルをモードと混同しない。
- Verified: README の承認境界では C-3（Human）と rollout-policy で定義された eligible run に限る C-3' が別。C-4/merge は Human-owned。今回の例は human approval を扱う標準的な計画確認に限定し、C-3' の詳細は扱わない。v8.24.0 の review-questions.json / render feedback は opt-in のフィードバックであり承認ではない。必要なら補足に留める。
- Hypothesis: 変更する/しない範囲と AC、検証、未決事項を計画として明示し、承認と実装を分ければ読者が何を判断するか理解しやすくなる。手戻り削減や品質向上は測定していない。例は公開前に隔離された検証 repo で実行し、期待値と観測結果を区別する。

### Outline

1. Claude Code に「小さな変更」を依頼するとき、何を変更しないかが未定のまま計画を承認していないか。
2. 先に結論: 計画生成と着手判断は別。PlanGate は実装前に判断材料を揃える governance harness（適用モード・設定の範囲で）。
3. 1タスクの例: 検証用の小規模 repo で表示文言だけを修正する。公開用の合成例として、変更範囲・非変更範囲（API / 挙動 / 依存など）・受入条件・検証方法を対照的に示す。実際の著者体験を装わない。
4. Claude Code に導入する: 現行 plugin guide の marketplace / local scope / plugin list、必要な CLI を確認。設定変更・本番 repo への強制配線は行わず、検証用 repo を使用。
5. PlanGate の成果物で何を判断するか: PBI INPUT PACKAGE → plan / todo / test-cases → review → 人間承認（対象モード）という流れを最小限で示す。実行可能なコマンド、plan の記録、受入条件の対応、承認前後の状態は実測後に記載する。
6. hook 強制と安全境界: plugin の読み込みだけで強制されない、light / standard / strict 配線を混同しない。読者に必要な次の段階を公式ガイドに接続する。
7. まとめ: 次の1タスクで「今回変えないこと」と確認方法を決める。GitHub / Quick Start と改善提案の導線。

### Execution / Review

- [ ] #1067 の枠を著者の Qiita アカウントで確保する。
- [ ] 公開リポジトリの固定 release / commit、Claude Code 版、plugin guide / plan contract / approval contract を照合し、利用コマンドと前提を確定する。
- [ ] 合成タスクで導入確認、計画生成・レビュー・承認境界（選んだ mode の仕様と実際の挙動）、実装後の受入テストを実行し記録。未実施や未確認を成功として書かない。plugin の表示と hook block の確認は別。
- [ ] 12/1 までに Qiita/public/plangate-advent-start.md に初稿（ignorePublish: true）、既存手順で promoted_to / Article Graph を同期。
- [ ] 編集・技術・実証範囲・読者UX・既存記事差別化・公開安全性のレビューを行い、独立レビューは取得した結果だけを記録。重大指摘を解消し CI を確認。
- [ ] 12/8 までに著者判断、12/9 までに限定共有・予約確認（別承認）。12/10 公開確認。認知・試用の観測は #1067 に接続。
