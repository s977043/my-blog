# Rollout Plan: AI実装境界シリーズ（Qiita 3記事）

Qiita シリーズの実行計画（記入済み）。元テンプレは凍結（[`archive/multichannel-rollout-template.md`](./archive/multichannel-rollout-template.md)）。本ファイルは「次に出す2記事の公開手順」として live 維持。公開順・締切は [`publish-queue.md`](./publish-queue.md) が正。

- 正本参照: [`content-channel-strategy.md`](./content-channel-strategy.md)
- 作成: 2026-05-17 / 状態: 公開待ち（来週・各記事 `ignorePublish: true` 維持中）

---

## 0. テーマ定義

- テーマ名: AIコーディングの実装境界（スコープクリープと、その対策の体系）
- 一行サマリ: Claude Code 等で AI が実装範囲を勝手に広げる問題に、症状認識 → 計画フォーマット → 計測、の3段で対処する
- 共有ポジショニング接続: `content-channel-strategy.md` Core positioning「AIコーディングをチーム開発に乗せる運用設計」に直結（PlanGate クラスタ）

## 1. 正本（canonical）媒体の決定

- [x] **Zenn 正本ではない / Qiita 内シリーズ**: 本テーマは Qiita 検索入口クラスタとして設計済み。3記事は役割分担で重複回避（統合しない＝Codex/Gemini 合意）
- 正本扱い: シリーズ内の概念的正本は scope-creep（症状と全体像）。preflight と plangate は各論
- 選定理由: 既に Qiita で書き分け済み・カニバリ回避の差別化が完了している（PR #246/#247）

## 2. 媒体別の切り口（記入済み）

| 記事 | 役割 | 切り口 | 想定検索意図 | 状態 |
|---|---|---|---|---|
| scope-creep | 症状と全体像 | AIが実装範囲を広げる＝スコープクリープにどう気づき止めるか | "Claude Code 暴走" "AI 実装範囲" "スコープクリープ" | 準備完了 / ignorePublish:true / id:null |
| preflight-checklist | 5項目フレーム詳細 | Goal/Scope/Non-goals/Test/Risks の書き方リファレンス | "AIコーディング 計画" "Goal Scope Non-goals" | 準備完了 / ignorePublish:true / id:null |
| plangate-ai-agent-governance | 計測・公開済 | 止めた回数を数字で見る運用 | "AI 開発 メトリクス" | 公開済 id:5ebff79112ecf1af872c |

## 3. 公開順と相互リンク

- 公開順（根拠: 問題提起を先・詳細を後。Codex/Gemini 合意）:
  1. **scope-creep**（症状と全体像）
  2. **preflight-checklist**（5項目詳細）— 公開後、scope-creep の「関連記事」リンクへ実 Qiita URL を差し込み
  3. plangate（公開済・受け側、リンク確立済 https://qiita.com/s977043/items/5ebff79112ecf1af872c）
- 正本明示リンク文面: 各記事「関連記事」節に実装済み（相互参照済み）
- 相互リンク確定: ②公開後に①へ②URLを差し込む手順を各記事内「公開当日チェックリスト」に記載済み

## 4. レビュークラス（[review-gate-tiers](./archive/review-gate-tiers.md) 準拠・基準は凍結だが本シリーズは適用済み）

| 記事 | クラス | 根拠 | 実施済みレビュー |
|---|---|---|---|
| scope-creep | **Full** | シリーズ起点・後続が前提にする・多媒体クラスタの概念正本 | 3ペルソナ→Codex 二次（PR #246）|
| preflight-checklist | **Full** | シリーズ構成記事・対称性が公開ブロッカー要件 | 3ペルソナ→Codex 二次（PR #247）|
| plangate | （公開済・対象外） | — | — |

→ 判定どおり Full 適用済み。追加レビュー不要。

## 5. カニバリ自己チェック（公開前）

- [x] 既存記事と検索意図の重複確認済（scope-creep=症状 / preflight=計画書き方 / plangate=計測 で意図分離）
- [x] シリーズ化し相互リンクで束ね済（関連記事節）
- [x] 各記事本文は実質再構成（テンプレ共通だが役割で差別化、Codex 確認済）

## 6. AI生成コンテンツ適合

- [x] Qiita AI生成コンテンツガイドライン: 多段レビュー＋執筆者の一次体験（「自分が使っている対策」「自分の感覚では Non-goals のほうが重要」等の I-message）含む
- [x] E-E-A-T Experience: 両記事に実運用での具体例・失敗談を保持

## 7. 配信・導線

- 公開後の導線: 各記事「関連リンク」に PlanGate(GitHub) / Growth Lab。シリーズ内回遊は「関連記事」節で確立
- X 等拡散: 任意（公開当日にユーザー判断）

---

## 公開当日アクション（要約・詳細は各記事内チェックリスト）

来週、以下の順で実施（各記事の HTML コメント「公開当日チェックリスト」が手順の正）:

1. `scope-creep`: ignorePublish→false / updated_at 更新 / HTMLコメント削除 / `npm run check` → `npm run publish:qiita -- claude-code-scope-creep-countermeasure`
2. 採番された scope-creep の実 Qiita URL を控える
3. `preflight-checklist`: 同手順 + 「関連記事」の scope-creep 参照へ②のURL差し込み → publish
4. 公開後、`scope-creep` の「関連記事」へ preflight 実URLを追記（相互リンク完成）→ 軽微更新コミット

> 公開は来週・ユーザー主導。本計画は当日の判断を排し機械的に実行できる状態にすることが目的。
