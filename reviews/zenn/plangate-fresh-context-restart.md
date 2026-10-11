<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=c4a8934b696cf27624a99bd10a28efbe7ba5438c loops=1 reviewedAt=2026-10-11T00:00:00Z -->
# articles/plangate-fresh-context-restart.md の記事レビュー

> Zennカテゴリー: Tech
> 構成タイプ: 設計 / アーキテクチャ（運用設計）

- 対象記事: `articles/plangate-fresh-context-restart.md`（`published: false`）
- Article Plan: `article_seeds/ai-driven-development/2026-09-29-fresh-context-restart.md` の `Draft Article Plan: zenn/plangate-fresh-context-restart`（central_claim・out_of_scope は 2026-09-29 著者承認済み。`approved_at` は空欄）
- 総合判定: **公開可（must / high なし。medium 2件の対応を推奨）**

## レビュー方針

Claude Code / Codex で長時間作業する開発者に向け、「切る基準は使用率ではなく区切り」「再開は正本から」「正本はフェーズごとに更新」を示す設計記事。central_claim との一致、設計の事実と効果の仮説の書き分け、一次情報（PlanGate の issue / PR / doc、公式ドキュメント）との照合、題材の出どころ（個人リポジトリに限られているか）を重点にした。

## チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| Webディレクター | OK | L13 で結論先行、L22-26 で対象と根拠の限界を明示。見出しだけで論理が追える。タイトルと本文の主張が一致し、central_claim と一致 |
| Web編集者 | OK | 表記は安定。用語「正本」「引き継ぎ書」の初出定義あり。軽微な磨き込みのみ |
| Webエンジニア | 要改善 | 区切りの規定が「どのバージョンの PlanGate の事実か」で揺れる（medium-1） |
| 技術的事実検証 | OK | 外部 URL 9本は 200、PlanGate の issue #945（2026-07-31 起票 / 08-25 close）・#1061（08-12 起票）・PR #1411（09-29 merge）・v8.23.0（2026-10-06）・Codex 公式の "Keep one chat per coherent unit of work" を照合済み |

題材の出どころ: 根拠は PlanGate（s977043）と ai-second-brain（s977043）の記録のみ。会社リポジトリ・my-blog 運用を根拠にした記述は検出されなかった。

## 指摘コメント

### medium: 区切りの規定が v8.23.0 配布物と main で異なる

**該当箇所**: L88, L186

> 設計文書と working-context スキルのどちらでも、タスク規模の区分が standard（中規模）以上のときに適用します
> PlanGate では、この考え方を … v8.23.0（2026-10-06）で配布しました

**問題**
`docs/ai/context-lifecycle.md` に「standard mode and above」が入ったのは s977043/plangate#1429 の close（2026-10-09）で、最新リリース v8.23.0（2026-10-06）より後。v8.23.0 の配布物では doc §3 は mode 条件なしの MUST で、スキルとの食い違いが残っている。L186 と組み合わせると「v8.23.0 で両方 standard 以上」と読める。

**提案**
次リリース後に公開する（Seed の公開条件どおり）か、L88 を「main の設計文書（2026-10-09 時点）とスキル」と時点を明示する。

### medium: 「2026-09-23 の引き継ぎメモ」の出どころが読者に追えない

**該当箇所**: L62-68

**問題**
他の事例は issue 番号やリンクで追えるが、この事例だけ出典がない（Seed では ai-second-brain の memory）。どのリポジトリの記録かも本文で分からない。

**提案**
「筆者の個人の記憶用リポジトリに残したメモ」のように出どころを1句添える。公開リポジトリでなければ「非公開の個人メモ」と明示する。

### low: 参考の Codex リンク名

**該当箇所**: L194

**提案**
`Best practices（Codex / OpenAI）` の URL は learn.chatgpt.com。リンク名を実ページ名に合わせると迷いが減る（任意）。

## 総合評価

### 良い点
- 事実（PlanGate の規定）と筆者補足・仮説を表の列と文で明確に分けている（L91, L109）
- 反論（Codex の「同じチャット」、Claude Code の「履歴に価値があるとき」）を取り込み、主張の適用範囲を絞っている
- PlanGate を使わない読者向けの最小手順（L158-166）がある

### 残る改善点
- PlanGate の規定をどの時点の事実として書くか（medium-1）

### 推奨アクション
1. PlanGate 次リリース後に L186 のバージョン表記を更新して公開する
2. L62 に出典を1句添える

### SEO / 回遊
- 関連記事3本と同媒体の本文内リンク（L113）あり。リンク先の記事からの張り返しは公開時に確認する

### 未検証事項
- Claude Code best-practices の「more than twice」、Anthropic ブログの「compaction isn't sufficient」の文言は URL 到達のみ確認（Seed の記録と一致）
- PR #744（2026-07-07）の日付は Seed 記録に依拠

## 反映状況（2026-10-11）

- medium 2（引き継ぎメモの出どころ）と low（Codex のリンク名）は L64・L194 に反映した
- medium 1（v8.23.0 と main の差）は事実誤認として取り下げる。v8.23.0 のタグで `docs/ai/context-lifecycle.md` L54「(standard mode and above)」と `plugin/plangate/skills/working-context/SKILL.md` L85「必須（standard 以上）」を確認し、記事 L88 と一致した
