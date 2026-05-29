# Zenn Book 企画書: PlanGate 実践ガイド

> 関連 issue: [#325](https://github.com/s977043/my-blog/issues/325)
> ステータス: 企画ドラフト（実装は次段階）
> 最終更新: 2026-05-29

## 0. 本書の主張（背骨）

本書を貫く一本の主張は次の通り。章はすべてこの順序を支えるために存在する。

> **計画（Plan）の精度が、開発の成否をほぼ決める。**
> 計画が正しく精度が高ければ、実装はその通りに進み、設計・計画どおりの実装で問題が起きない状態に到達する。
> だからこそ **Plan が最も重要**。
>
> ただし、どんなに良い計画でも**実行時に守られなければ意味がない**。
> よって、計画を実装フェーズで守らせる **Exec（強制力）が second pillar** になる。

この2本柱（**Plan = 何を作るかの精度 / Exec = それを逸脱させない強制力**）が本書の本命。
Why はこの主張の導入、Verify / Scale は「守られたことの証明と継続」の補強と位置づける。

PlanGate の用語に対応づけると:

- **Plan の精度** = PBI INPUT → 確認質問 → plan / todo / test-cases の同時生成 → **C-3 承認ゲート**（人間が計画を承認するまで実装させない）
- **計画を守らせる Exec** = Hook 強制（EH-1〜EH-9 + EHS-1〜EHS-3）による scope / approval / evidence の不変条件検査。「計画外のファイルを触る」「承認なしに実装する」を機械的にブロック

## 1. 決定済み方針

| 項目 | 決定 | 理由 |
|------|------|------|
| 対象読者 | **Developer 中心** | Claude Code / Codex を実際に使う開発者。手を動かす実践ログ・Hook 設定を主軸にする。EM/PM は Scale 章で従属的に扱う |
| 価格 | **無料 Book** | issue の目的が「PlanGate OSS の認知拡大」。到達優先で Like / 読者数を最大化する |
| 媒体 | Zenn Book（`books/plangate-guide/`） | 既存 `books/flame-portrait-essay/` と同形式（config.yaml + 章別 md） |
| 言語 | 日本語先行 | 英語版は反応を見て後続判断（issue の検討事項として保留） |

## 2. タイトル案（Developer 訴求でフレーミング）

issue の Zenn 分析では「問題解決型・実践的」コンテンツが高 Like。「ガバナンス」より「AI に書かせて事故らない実践」を前面に。

1. **「AI にコードを書かせる前にやること — PlanGate 実践ガイド」**（第一候補）
2. 「No approved plan, no code — AI 駆動開発を事故らせない実践ガイド」
3. 「AIエージェントを安全にチーム開発へ組み込む実践ガイド」

- summary 案: 「AI 開発の成否は計画の精度で決まる。精度の高い計画（Plan）の作り方と、それを実行時に守らせる強制力（Exec）を 2 本柱に、PlanGate の実践ログで解説する。」
- topics 案: `["AI", "ClaudeCode", "開発手法", "TDD", "OSS"]`

## 3. 章構成と既存記事マッピング

既存記事は**再編集ベース**（新規執筆を最小化）。各章の「素材」を Book 用に再構成し、Book 固有の導線・図を加える。

**本命は 02 Plan と 03 Exec の2章**（★）。ここに最も紙幅と精度を割く。他章はこの2本柱を導入・補強する位置づけ。

| 章 | タイトル（案） | 役割 | 主な素材記事 | 再編集 / 新規 |
|----|--------------|------|------------|-------------|
| 00 | はじめに（Book の狙い・読み方） | 主張提示 | — | 新規（短） |
| 01 | なぜ AI 開発に承認ゲートが必要か（Why） | 本命への導入 | `ai-dev-guardrail-plangate-river-reviewer`（2層ガード）/ `multi-ai-discussion-roadmap-rewrite`（問題提起） | 再編集（圧縮） |
| **02** | **計画フェーズを設計する（Plan）★本命①** | **計画の精度＝成否を決める核** | `plangate-ai-coding-workflow`（考え方とテンプレート）/ `ai-legible-repository-design`（置き場所） | 再編集＋加筆 |
| **03** | **実装フェーズを制御する（Exec）★本命②** | **良い計画を実行時に守らせる強制力** | `plangate-v86-hook-enforcement`（Hook ガード）/ `sdd-tdd-nonblocking-agent`（3原則）/ `ai-driven-tdd-nextjs`（最小ループ） | 再編集＋加筆 |
| 04 | 検証・引き継ぎを残す（Verify & Handoff） | 守られたことの証明 | `ai-article-quality-gate-workflow`（3層ゲート転用）/ `ai-code-review-feedback-ops`（指摘の分類・記録） | 再編集＋加筆 |
| 05 | チームに広げる（Scale） | 継続の仕組み | `engineering-process-improvement-skill`（振り返り）/ `plangate-v86-hook-enforcement`（Metrics: Keep Rate 等） | 再編集 |
| 06 | 設計変遷から学ぶ（付録） | 信頼の担保 | `plangate-design-evolution-v3-to-v8` | ほぼ流用 |

### 本命2章の書き分け（最重要）

- **02 Plan（本命①）** — 「なぜ Plan が最も大切か」を本書の中心命題として正面から論じる。**精度の高い計画とは何か**（PBI INPUT の埋め方、確認質問で曖昧さを潰す、test-cases で受入基準を先に固定する、plan / todo / test-cases の同時生成）、そして **C-3 承認ゲート**で「計画が正しいと人間が認めるまで実装に進ませない」運用を具体例で示す。素材記事は「テンプレート紹介」止まりなので、**「計画の精度が実装品質を決める」という因果の説明を加筆**する。
- **03 Exec（本命②）** — 「良い計画も守られなければ無意味」を起点に、**計画を実行時に逸脱させない強制力**を主役にする。Hook 強制（EH-1〜EH-9 + EHS-1〜EHS-3）で scope 外編集・承認なし実装・evidence なし PR が**機械的にブロックされる**挙動を、コンソール出力つきで再現。記号の羅列でなく「何を防ぐか」を軸に。Next.js TDD の詳細（`ai-driven-tdd-nextjs`）は分量過大になるため**コラム/付録へ退避**し、本文は「計画を守らせるループ」に絞る。

> 既存記事はすべて Zenn 公開済み（`published: true`）。Book 化では**重複コンテンツ扱いにならないよう**、記事は「単発の入口」、Book は「体系的な通し読み」と役割分担し、相互リンクで補完する。再編集は本文コピペでなく、各章で「本命主張（Plan→Exec）への接続文」を新規に書き起こすこと。

## 4. 公開タイミング

- PlanGate の次メジャーリリースに合わせる案を軸に検討（issue 検討事項）。
- Zenn rate-limit（24h/5本、Book は別枠だが要確認）に留意。Book は単発 publish のため記事 publish キューとは独立。
- 公開前に `npm run check`（list:books 含む）を通す。

## 5. 未決の検討事項（issue から継続）

- [ ] 英語版の有無（日本語先行で確定 → 反応次第で翻訳判断）
- [ ] 公開タイミングを PlanGate メジャーリリースに合わせるか
- [ ] 各章の図版（Before/After 図、Plan→Exec→Verify フロー図）を新規作成するか既存記事から流用するか
- [ ] cover 画像の用意

## 6. 次セッションの着手手順（実装フェーズ）

1. `books/plangate-guide/config.yaml` を `published: false` で作成
2. `00_intro.md` 〜 `06_appendix.md` の空骨組み（見出しのみ）を配置
3. 章ごとに素材記事から再構成（1章ずつ PR 分割推奨）
4. `npm run list:books` で構造検証
5. cover 画像・図版を追加
6. 全章揃ったら `published: true` に切替えて公開
