# Qiita記事レビュー: ai-coding-preflight-checklist

対象: `Qiita/public/ai-coding-preflight-checklist.md`
レビュー実施日: 2026-05-16
レビュー実施者: @claude

## 判定

**NEEDS_FIX**

5項目（Goal / Scope / Non-goals / Test / Risks）の詳細リファレンスとして記事単体の完成度は高く、テンプレートはそのまま持ち帰れる。ただしシリーズ公開を前提とすると、公開前に以下が必須対応：

1. 姉妹記事 `claude-code-scope-creep-countermeasure.md`（PR #246 でmain反映済み、既に「関連記事」節と公開当日チェックリストを保有）への**対称的な相互リンクが本記事側に存在しない**（scope-creep へ＋ PlanGate Qiita記事 https://qiita.com/s977043/items/5ebff79112ecf1af872c へ）
2. frontmatter `updated_at` が過去日のまま（公開当日更新の申し送りが未整備）
3. L17-22 の作業メモ HTML コメントが scope-creep 側のような「公開当日チェックリスト」形式に整っていない（手順が不足）

公開当日に `ignorePublish: false` 化＋下記 Must-fix を反映すれば READY。

## レビュー方針

来週 `claude-code-scope-creep-countermeasure` とシリーズ公開予定の Qiita 記事として、AIコーディング実務者が5項目をそのまま使えるか（読者視点）、テンプレ・Claude Code受け渡し例の再現性と scope-creep 記事との差別化が明瞭か（技術者視点）、検索流入・タグ・冒頭フック・シリーズ回遊設計（Qiita訴求視点）の3視点で確認した。姉妹記事側は既に対称リンクと公開当日チェックリストを完備しているため、本記事側の対称性欠落を重点確認した。

## レビュー視点

| 視点 | 見ること |
| --- | --- |
| 読者（実務エンジニア） | 5項目に共感でき、テンプレートをそのまま自分のIssueに使えるか |
| 技術者 | 5項目テンプレ・Claude Code受け渡し例の再現性、scope-creep記事とのテンプレ重複の差別化 |
| Qiita訴求 | 検索流入（"AIコーディング 計画" / "Goal Scope Non-goals"）、タグ5本、タイトル、冒頭フック、シリーズ回遊 |

---

## Must-fix（公開前に必須）

### 1. 姉妹記事への対称的な相互リンクが本記事に存在しない

姉妹記事 `claude-code-scope-creep-countermeasure.md` は L215-222 に「関連記事」節を持ち、本記事を「計画フォーマットの詳細（Goal / Scope / Non-goals / Test / Risks の書き方リファレンス）」として明示参照し、役割分担（症状全体像 vs 5項目詳細 vs PlanGate計測）を宣言済み。一方、本記事は L224-228「関連リンク」に GitHub リポジトリ3本があるのみで、**scope-creep 記事にも PlanGate Qiita 記事にも本文・関連節から到達できない**。

**問題点**: シリーズの相互リンクが片側のみ。scope-creep を先に公開、本記事を後に公開する設計上、後発の本記事こそ先行記事への回遊導線を持つべき。読者が本記事（詳細）に検索で着地したとき、症状全体像（scope-creep）と計測実例（PlanGate）へ戻れない。Qiita 内回遊が滞留時間・検索評価に寄与する機会を逃す。

**提案**: 「まとめ」（L208-222）の後、「関連リンク」（L224）の前に「関連記事」節を追加し、scope-creep 側 L215-222 と対称にする。

```markdown
## 関連記事

この記事は「5項目（Goal / Scope / Non-goals / Test / Risks）の書き方リファレンス」に絞っています。シリーズで役割を分けています。

- スコープクリープという「症状」と対策の全体像: 「Claude CodeでAIが勝手に実装範囲を広げる（スコープクリープ）ときの対策」（別記事 / 公開当日に実Qiita URLを差し込む）
- 「止めた回数を数字で見る」運用化の実例: [AIの止まり方を「数字で見る」ようにした体験：PlanGate v8.6.0](https://qiita.com/s977043/items/5ebff79112ecf1af872c)

本記事は「止めるための計画の書き方」、scope-creep記事は「まず症状に気づいて止める」、PlanGate記事は「止めた結果を計測する」と役割を分けています。
```

scope-creep の実Qiita URLは本記事と同時 or 先行公開で採番されるため、作業メモ（Must-fix 3）に「公開当日に scope-creep の実URLを差し込む」を明記する。

### 2. frontmatter `updated_at` と公開フローの申し送り

L10 `updated_at: '2026-05-13T00:00:00+09:00'`。本日（2026-05-16）時点で過去日。

**問題点**: Qiita は `updated_at` を記事日時として扱う。公開日より古い日付のまま publish すると新着で埋もれ、シリーズ同時訴求の効果が落ちる。

**提案（作業メモへ明記）**:
- `ignorePublish: true` / `private: false` / `id: null` は現状維持で正しい（来週公開、初回 publish で id 採番）。**変更不要**。
- 公開当日に `ignorePublish: false` へ変更し、同時に `updated_at` を**公開当日の日時**へ更新する、を作業メモに追記。

### 3. 作業メモ HTML コメント（L17-22）を「公開当日チェックリスト」形式へ

現状の L17-22 は簡素な作業メモで、scope-creep 側 L17-28 のような番号付き公開当日チェックリスト（ignorePublish化 / updated_at更新 / コメント自体の削除 / 相互リンク確定 / URL到達確認 / npm run check）になっていない。

```
作業メモ:
- 新規Qiita下書き。公開前に title / tags / private / ignorePublish を最終確認する。
- 公開する場合は ignorePublish: false に変更する。
- docs/content-channel-strategy.md のWeek 2実行項目として作成。
```

**問題点**: 公開当日に必要な手順（updated_at更新、HTMLコメント自体の削除、scope-creep実URL差し込み、関連記事節の追加）が漏れている。scope-creep 側と非対称で、公開オペレーションが片側だけ整備済みの状態。HTMLコメントは公開後も編集画面でソース閲覧可能なため「docs/content-channel-strategy.md」等の社内運用語が残ると体裁が悪い。

**提案**: scope-creep L17-28 と対称の公開当日チェックリスト形式に置換。

```
公開当日チェックリスト（来週公開予定 / 3視点レビュー反映済み 2026-05-16）:
1. frontmatter ignorePublish: true → false に変更（これをしないと publish されない）
2. frontmatter updated_at を公開当日の日時に更新
3. このHTMLコメントブロックを削除（公開後も編集画面で閲覧可・社内運用語を含むため）
4. シリーズ相互リンク確定:
   - 「関連記事」節に scope-creep 記事の実Qiita URLを差し込む（同日or先行公開で採番）
   - PlanGate記事リンク https://qiita.com/s977043/items/5ebff79112ecf1af872c は到達確認済み
5. 関連リンクの実URL最終確認（PlanGate / Growth Lab は 200 確認済み 2026-05-16）
6. npm run check パス確認 → npm run publish:qiita -- ai-coding-preflight-checklist
公開順: scope-creep（症状と全体像）→ 本記事（5項目の詳細）。問題提起を先に出す。
```

---

## Recommended（推奨）

### 4. scope-creep 記事とのテンプレ重複の差別化が冒頭で読者に伝わらない

本記事 L144-188 のテンプレート＋Claude Code受け渡し例は、scope-creep L167-193 の依頼テンプレートとほぼ同型（Goal/Scope/Non-goals/Test/Risks、「承認があるまで実装に進まないでください」まで一致）。方針は「統合せず差別化」（症状全体像 vs 5項目詳細）で正しいが、本記事の「はじめに」（L24-38）には scope-creep との関係・本記事の立ち位置（＝詳細リファレンス）が一言もない。

**問題点**: 両記事に検索着地した読者が「同じ著者が同じテンプレを2回出している」と感じ、保存価値が下がる。差別化方針は正しいが、それが読者に明示されていないと意図が伝わらない。

**提案**: 「はじめに」末尾 L38 の後に1文追加。
- 例: 「スコープクリープという症状そのものと対策の全体像は別記事で扱っています。本記事は5項目それぞれの書き方に絞ったリファレンスです。」
- これで Must-fix 1 の「関連記事」節と呼応し、シリーズの役割分担が冒頭から伝わる。

### 5. River Review は本文非言及のため関連リンクから除外を検討

L227 `River Review: https://github.com/s977043/river-review` は本文に一切言及がない。scope-creep 側レビューでも同様に River Review は「実装前の境界づくり」という記事スコープと不整合として除外判断され、scope-creep 本文・関連リンクには River Review が無い（L224-227 は PlanGate / Growth Lab のみ）。

**問題点**: 本記事のスコープ（実装"前"の5項目計画）に、レビュー側ツールの River Review は文脈が合わず唐突。scope-creep と非対称（あちらは除外済み）。

**提案**: scope-creep と揃え、関連リンクを PlanGate / Growth Lab の2本に絞り River Review を除外する。

```markdown
## 関連リンク

- PlanGate（承認なし、コードなしを仕組みにするワークフロー）: https://github.com/s977043/PlanGate
- Growth Lab: https://the3396.com/
```

PlanGate の説明文も scope-creep L226 と同文に揃えると、シリーズ内の表記が統一される。

### 6. 冒頭フックに結論先出しがなく Qiita 離脱導線になりうる

「はじめに」L24-38 は5項目の列挙まではあるが、「この記事で持ち帰れるもの＝そのまま使えるテンプレート」を冒頭で先出ししていない。L38 は「短いテンプレートとしてまとめます」止まり。scope-creep レビューでも冒頭結論先出しが推奨され、plangate-governance でも高評価だった。

**問題点**: Qiita 読者は冒頭数行で読む/離脱を判断する。詳細リファレンス記事ほど「最後にコピペできるテンプレがある」を先に見せると離脱が減り保存される。

**提案**: L38 の後に「先に結論」を1行。
- 例: 「結論だけ先に言うと、記事末尾の『そのまま使えるテンプレート』をコピーして埋めるだけで運用できます。各項目の書き方を以下で説明します。」

### 7. タグの最適化（シリーズ・既存記事との回遊強化）

L3-8: `生成AI` / `AI駆動開発` / `チーム開発` / `コードレビュー` / `開発プロセス`。

**問題点**: 妥当だが、姉妹記事 scope-creep のタグは `ClaudeCode` / `生成AI` / `AI駆動開発` / `チーム開発` / `コードレビュー`。本記事 L173「Claude Codeに渡す場合」という固有節があるのに `ClaudeCode` タグが無い。シリーズ2記事でタグが4/5しか一致せず、著者ページ内の関連表示・回遊が弱まる。

**提案**: `開発プロセス` → `ClaudeCode` への差し替えを検討。これで scope-creep と全5タグ一致し、シリーズが著者ページ・タグページで束になる。検索語「Claude Code 計画」「Claude Code Non-goals」との一致も上がる。

---

## Nits（任意）

### 8. タイトルのコロン記法と検索キーワード

L2 `AIコーディング前に確認する5項目: Goal / Scope / Non-goals / Test / Risks`。検索語との一致は良好（"AIコーディング 計画" "Goal Scope Non-goals" を網羅）。

**提案（任意）**: コロン全角/半角は現状半角で問題なし。強いて言えば「テンプレート」を含めると "AIコーディング テンプレート" の流入も拾える（例: 末尾に「（テンプレート付き）」）。必須ではない。

### 9. 「Claude Codeに渡す場合」テンプレと scope-creep の差異

L175-188 のClaude Code受け渡し例は scope-creep L171-193 とほぼ同一だが、本記事側は項目名のみ列挙（Goal/Scope/...の見出し説明が無い）でより簡潔。差別化として「本記事＝5項目の中身を本文で詳説済みなので受け渡し例は簡潔版」という位置づけは妥当。指摘なし（確認済み・現状維持で良い）。

### 10. コードブロック言語指定

L64-66 ほか全コードブロックが ```` ```markdown ```` で統一。テンプレート・悪い例・受け渡し例すべて適切。指摘なし（確認済み）。

---

## 共通チェック結果

- [x] 見出し階層が正しい（`##` のみで一貫、H1 はタイトル frontmatter）
- [x] 表に長文が入っていない（表は使用なし）
- [x] コードブロックの言語指定が適切（全て markdown 指定）
- [x] 外部リンクは記法上クリック可能（PlanGate / Growth Lab、River Review は Recommended 5 で除外推奨）
- [ ] 姉妹記事への対称相互リンク → Must-fix 1（scope-creep 側は完備、本記事側が欠落）
- [ ] frontmatter 公開フロー整合 → Must-fix 2（`ignorePublish: true` 等は正しい、当日更新の申し送り要）
- [ ] 作業メモを公開当日チェックリスト化 → Must-fix 3

## 総合評価

### 良い点
- Goal/Scope/Non-goals/Test/Risks の各節が「悪い例→良い例」構造で、読者がそのまま自分のIssueに転記できる実用性が高い。
- 「自分の感覚では `Scope` より `Non-goals` のほうが重要な場面も多い」（L112）など実務者の体感が入り、テンプレ記事になりがちな題材に説得力を与えている。
- 「そのまま使えるテンプレート」（L144-171）が空欄付きで提供され、コピペ即運用できる。詳細リファレンスとしての役割が明確。
- 「チームで使うときのコツ」（L190-206）で適用範囲（typo修正には不要）まで書かれており、過剰運用への歯止めがある。

### 改善点
- シリーズ相互リンクが片側（scope-creep）のみ完備で、後発の本記事に先行記事・PlanGate への回遊導線がない（最大のリスク）。
- 公開当日オペレーション（updated_at更新 / HTMLコメント削除 / 実URL差し込み）の申し送りが scope-creep 側と非対称で未整備。
- scope-creep とのテンプレ重複の差別化方針は正しいが、それが読者に冒頭で伝わらない。

### 推奨アクション
1. （Must）「関連記事」節を追加し scope-creep L215-222 と対称にする（scope-creep ＋ PlanGate Qiita記事）。
2. （Must）作業メモを scope-creep L17-28 と対称の公開当日チェックリスト形式へ置換（ignorePublish化 / updated_at更新 / コメント削除 / 実URL差し込み）。
3. （Recommended）「はじめに」に scope-creep との役割分担を1文、結論先出しを1行追加。
4. （Recommended）River Review を関連リンクから除外（scope-creep と整合）。タグ `開発プロセス`→`ClaudeCode` でシリーズ全5タグ一致。

### Qiita訴求観点での改善提案
- 検索流入の主軸は「AIコーディング 計画」「Goal Scope Non-goals」「Non-goals 書き方」。タイトル・本文で網羅済み。タグに `ClaudeCode` を足すと「Claude Code 計画」系も拾える。
- 同テーマ3記事（本記事 / scope-creep / plangate-governance id:5ebff79112ecf1af872c）を相互内部リンクで束ねると、Qiita 内回遊と著者ページ関連表示が強化され、シリーズとして検索評価が積み上がる。後発の本記事に先行記事リンクを置く設計が回遊上もっとも効く。
- 公開順は scope-creep（症状）→ 本記事（詳細）。問題提起を先に出し、検索で詳細に着地した読者を症状記事へ戻す双方向設計を作業メモに固定する。
