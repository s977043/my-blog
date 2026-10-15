# SWE-Journey note記事レビュー（2026-10-15）

- 対象: `articles_note/new/swe-journey-requirement-analysis.md`
- Seed / Plan: `article_seeds/ai-driven-development/2026-10-15-swe-journey-requirements.md`
- 種別: 個人note / 論文を読んだことを起点にしたオピニオン・考察
- 状態: **独立最終Gate READY・PRマージ準備完了・公開未承認**（初回は本セッション内の複数視点編集レビュー、外部レビューは著者が転記した別モデルの判定として分けて記録）
- 実行範囲: 原稿の論旨・引用境界・note可読性・静的確認。GitHub ActionsのCIは2026-10-15にContent checks / Dependency reviewともに成功（head `1775f57`）。本追記時にはローカルの全31検査も成功。note実機プレビューは未実施。

## Article Contract

| 項目 | 固定した内容 |
| --- | --- |
| Topic | SWE-Journeyを読んで生まれた「専門家がしている要求確認をAIが補えないか」という問い |
| Claim | 専門家に依頼されたとき成果が高いなら、専門家が行う確認・調査・検証をAIの仕組みに組み込み、依頼者への過度な依存を減らせないか |
| Audience | AI駆動開発を実践するテックリード・EM・PdM |
| Reader Promise | 依頼者別の差の数字だけでなく、何をAIが調べ、何を人間に問い返すかという次の設計課題を持ち帰る |
| Emphases | 模擬ユーザーの評価条件 / Asking・Finding・Fixing / 不確実性の判断境界 / 今後の比較実験 |

このContractの主張を弱める一般論への置換は採用しない。

## 視点1：note編集者（導入・主題）

- **所見**: 「AIの進化一般」から始めない。ユーザーが明示した「SWE-Journeyを読んで気が付いた」から始まっている。
- **採用**: 冒頭数段落は論文の結果→違和感→自分の問いに集中。Claude Code / Codex一般論を導入に置かない。
- **不採用**: 冒頭にAI駆動開発の背景・定義を追加する案。既視感が増し、今回の固有の発見を薄める。
- **再点検**: 記事終盤まで中心の問いを維持。PlanGate紹介に記事の主役を譲っていない。

## 視点2：研究に厳しい読者（根拠・誇張）

- **所見**: 55.5ポイント差の数字が強いため、専門知識の因果効果、実務の成功率と誤解されやすい。
- **採用**: 13モデル平均の最終機能テスト通過率と明記し、模擬ユーザー・評価条件差・交絡要因を導入と数値の説明近傍に置く。
- **採用**: 「AIに質問させるだけで改善する」との因果断定を避ける。ケーススタディと一般的効果を区別。
- **採用**: PlanGateの設計と本研究の検証結果を分離。後段の3条件比較は将来の仮説検証として扱う。
- **再点検**: ソフトウェアアーキテクト78.50%、新人35.57%、PdM30.48%、非エンジニア23.00%。差は55.50**ポイント**（「55.5%改善」等とは書かない）。
- **出典**: [原論文](https://arxiv.org/abs/2610.11559)、[PlanGate公開方針](https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/north-star.md)。

## 視点3：テックリード・PdM（現場での理解・持ち帰り）

- **所見**: 抽象語だけでは依頼時の振る舞いを想像できない。
- **採用**: ファイル不具合の仮想例を1本に絞り、調査して済む不確実性と人間が判断すべき不確実性の差を説明する。
- **採用**: Asking / Finding / Fixing は一度説明し、章全体は「正しい質問数」ではなく「人に聞かずに済むことの見分け方」に重点を置く。
- **不採用**: 要求分析フレームワークの一覧、PlanGateアーキテクチャの詳細、モデル別ランキング。別記事相当の枝葉が増える。
- **再点検**: モデル性能以外に改善の余地がある、という疑問が読み終わったあとに残る構成。

## Claim Boundary

- [x] 外部事実の引用可能な原典を示した
- [x] 数値の単位と評価設定を限定した
- [x] 専門性の単独因果とは断定しない
- [x] 研究結果／筆者の考察／未実施の実験を区別した
- [x] PlanGateの効果を実証済みと扱っていない
- [x] 仮想例を実体験として見せていない
- [x] 会社コード・会社の未公開実績を個人noteの一次体験として使わない

## 静的検証（GitHub上の原稿を対象）

- [x] タイトル、冒頭がSWE-Journeyを起点にしている
- [x] 4ペルソナの値と差を照合
- [x] noteで避ける長いダッシュ記号の混入なし
- [x] noteで崩れやすいMarkdown表を本文に使用していない
- [x] Approved Article PlanにWhy / What / Evidence / Out of scopeを記録
- [x] Article Graphは正本Seedから算出、生成器の既存出力とレンダリングが一致することを確認して更新
- [x] 初回PR時のGitHub Actions「Content checks」「Dependency review」は成功（[CI run 38735261965](https://github.com/s977043/my-blog/actions/runs/38735261965)）。今回のレビュー記録更新後のCIは別途確認する。
- [ ] noteエディタ上のスマートフォン表示・表紙画像：公開前に著者確認
- [ ] 研究が示す効果ではなく筆者の仮説として構成したことへの著者最終承認

## 外部Grokレビュー（著者からの転記、2026-10-15）

> 来歴: 著者が会話へ転載したGrokのレビュー内容。GrokからGitHubに直接提出された正式レビューではなく、モデルの実行ログは添付されていない。以下は提供されたレビューを要約したもので、こちらが別モデルを再実行したと装わない。

- **総合判定: Approve**
- **Must / High / Medium / Low: 指摘なし**（転記されたレビューにおける判定）
- **中心主張**: 「専門家が自然に行う要求確認・調査・検証の一部をAIに組み込めないか」という問いを維持。研究結果・仮説・PlanGateの設計を混同しない。
- **一次情報の数値**: 13モデル平均Final F2Pの78.50%（Software Architect）、23.00%（Non-coder）、差55.50ポイント、30課題・594サブタスク・4模擬ユーザーとの整合が取れているとの評価。
- **因果関係の境界**: 専門知識だけの効果とは断定せず、シミュレーターの結果を現実の開発成功率として扱っていない。
- **ケーススタディ**: Asking / Finding / Fixingについて、質問量の単独効果が証明されたかのような記述は避けられている。
- **PlanGate**: 要求分析・Human-owned判断・Evidenceの分離を設計の接続として記述し、効果実証と取り違えていない。
- **編集採否**: 追加指摘はないため、本文は変更しない。論文の網羅的な説明や一般論を追加して独自の発見を薄めない。

### このレビューが閉じる範囲

- [x] 外部別モデルからの主張境界・原論文照合に関するApproveを記録。
- [x] 独立Thesis Gateは後述の別エージェントによる修正後再確認で完了（Grok転記とは別）。
- [ ] noteエディタの表示・公開承認。
- [ ] PRマージの著者承認（この転記は明示的なマージ指示ではない）。

## 独立最終レビューと修正（2026-10-15）

- 実行者: 改善担当とは別のCodexエージェント（AI上の専門家ペルソナと一次情報照合。実在専門家の監修ではない）。
- 実行方法: Workflowツールがないため、`note-finalize`の各GateとThesis Gateを手動で独立確認。正式Workflowの実行済み、3ループ完了とは扱わない。
- 一次情報: [原論文v1](https://arxiv.org/html/2610.11559v1)の§3、Table 2、§4.2、Appendix C.2〜C.4と、[PlanGate公開設計](https://github.com/s977043/PlanGate/blob/main/docs/ai/ai-loop-v2/north-star.md)のHuman Attention / Bounded Discovery / authority境界を照合。arXivのabsページで公開日も確認。
- official_fact: 30課題・594サブタスク・13モデル、4ペルソナのFinal F2P値、模擬ユーザー条件、3能力を確認。
- team_practice: PlanGateの要求整理と人間判断の境界は公開設計に対応。成果改善の実証ではない。
- author_interpretation: 要求分析をAIへ委ねる仮説、調査と人間判断の区別、今後の比較実験は筆者の考察として保持。
- 初回must指摘1件: Fixing Rightを検証だけで説明し、原論文の「実際に変更を実装する」が抜けていた。説明や完了宣言だけで済ませず実コードを修正する定義へ変更し、独立再確認で解消。
- 言語修正: 冒頭と要求分析フローを敬体に統一。数値・主張・未実証の境界は変更しない。
- 任意提案の不採用: 追加図、タイトル変更、論文の網羅的説明は不要。本文の問いを保ち、論点を増やさない。

## Final Gate（修正後の独立再確認）

- Article Contract / Independent Thesis Gate: **PASS**。Topic・Claim・Reader Promiseを保持。第二の主題、結論の競合、実証済みへの時制変化なし。
- Terminology Contract: SWE-Journey / PlanGateと3能力の正式名を維持。日本語説明は初出のみ。
- Domain Review: **PASS**。blocking findings 0、重要な未検証項目0。
- Language Review: **PASS**。正式ラベル一覧の英語密度WARN 1件は日本語説明付きのため許容。
- Visual Review: **N/A（PASS）**。本文画像0、追加図不要、未確認画像なし。
- Editorial Review: **PASS**。対象読者・問い・根拠・仮例・読後の判断が一貫。
- Additional Thesis Loop: **not required**。構造上の重大問題はなく、今回の手動Gateでマージ準備を確認。過去の3ループ実施証明にはしない。
- Verdict: **READY（原稿の手動独立最終Gate）**。
- 機械検証: `npm ci`、修正後`npm run check`（全31項目）、対象指定の`check:article-sentence-style`（7章で混在なし）、`check:article-humanizer-contract`、`git diff --check`成功。
- マージ・公開: 未実施。今回の依頼はPRをマージ可能にする作業。note公開の承認とは分ける。

## 公開時の残タスク

1. 著者による本文・タイトルの最終確認と公開判断。
2. noteエディタの表示・目次・表紙の確認。必要ならWXR生成・画像制作を別工程で実施。
3. note公開後にSeedの`promoted_to`へ公開URLを追記しArticle Graphを再生成。
