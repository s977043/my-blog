# articles/ai-agent-team-topology-judgment-escalation.md の記事レビュー

> Zennカテゴリー: Idea
> 構成タイプ: 設計 / アーキテクチャ

## レビュー方針

モデル比較記事へ縮退させず、「AIチーム設計の本体はJudgmentの配置とEscalationである」という中心主張が、初見読者にも技術読者にも一貫して届くかを重点確認した。あわせて、Provider固有の最新仕様は公式一次情報で裏付け、River Reviewとの接続は機能紹介ではなく著者の設計上の一次経験として扱えているかを確認した。

## チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| Webディレクター | OK | 問題提起 → Role/Model分離 → Verification/Review分離 → Reviewer/Judge分離 → Escalationという発見の階段が成立している。タイトルと結論も中心主張に一致。 |
| Web編集者 | OK | モデル名や設定表を後半のBinding例へ移し、前半を概念の発見に集中できている。長文だが見出しだけで論理を追える。 |
| Webエンジニア | OK | V0/V1、Context boundary、Permission、Runtime Receipt、Escalation Policyまで設計判断へ落ちており、単なる概念論で終わっていない。 |
| 技術的事実検証 | OK | GPT-6.1 Solのeffort/Multi-agent/価格、Codexのsubagent設定、Sonnet 5.5 / Opus 5.5の位置づけを2026-10-01時点の公式情報で確認。Provider Profileは著者の設計例として明示済み。 |

## 編集部レビュー3ループの反映

### Loop 1: 記事の発見を絞る

- Review: 冒頭がGPT / Claudeの使い分け記事に見え、後半の発見より入口が小さかった。
- 対応: 「モデル名を組織図へ書くこと自体が問題ではないか」を入口にし、`Role != Model` から始まる発見の階段へ再構成した。

### Loop 2: 独自性をモデルルーティングからJudgmentへ移す

- Review: `Role != Model` だけでは一般的なモデルルーティング最適化に見える。
- 対応: `Verification != Review`、`Reviewer != Judge`、`Context is a boundary` を段階的に導入し、Topologyの中心をEscalationへ移した。

### Loop 3: 仕様書ではなく発見の記事にする

- Review: 完成形の定義が先行すると、著者が実践からどう考えを変えたかが弱くなる。
- 対応: River ReviewでのEvidence / Judgment分離からAgent Team全体へ一般化した経緯を本文へ戻し、Provider Profileは後半の実装例へ降格した。

## 最終確認での追加修正

- `Agent Team Topologies` という既存の整理があるため、新規概念名の発明を主張していないことを本文へ追記した。
- River Review接続図の `C-1 / C-2 / C-3` は説明コストが高いため、`SELF REVIEW / INDEPENDENT REVIEW / JUDGE` へ一般化した。

## 公開前確認での追加修正（2026-10-01）

- タイトルに検索語（Claude Code / Codex / マルチエージェント）を入れた。中心主張「どこで判断するか」は残した
- TL;DRと「5つの原則」の並びを揃え、本文で説明していなかった `Effort != Autonomy` の節を追加した
- 冒頭の「Sol / Astra」をモデル名と分かる表記にした。Multi-agentがbetaであることと、Codexのrole設定が `agents.<name>.config_file` 経由であることを公式情報に合わせて明記した
- Runtime Receiptの例を、設定と実行がずれた `MISMATCH` のケースにした
- River Reviewの節から、Zenn記事 `river-review-judgment-placement` へリンクした。張り返しは本記事の公開時に入れる（未公開記事へのリンクを公開記事に置かないため）

## 総合評価

### 良い点

- 一番強い主張「安いモデルへ仕事を落とすのではない。判断を必要な場所だけ上位レイヤーへ上げる」が、タイトル・中盤・結論を貫いている。
- `test passed != requirement satisfied != good design != safe to merge` が、VerificationとJudgmentを分ける必要性を短く説明できている。
- Provider非依存TopologyとProvider Profileを分離したため、モデル世代が変わっても記事の本論が残る。
- 「7 Logical Roles = 7 Agentsではない」と明示し、Multi-agentの過剰設計を避けている。
- River Reviewとの接続が自作OSSの宣伝ではなく、設計思想が発展した一次経験として機能している。

### 残る改善点

- 定量的な効果は未検証。Runtime ReceiptやEscalationの実測は今後の検証対象として本文で明示しているため、現時点の公開ブロッカーではない。
- Provider Profileはモデル更新で陳腐化するため、公開時点の日付表記と公式リンクを維持する。

### 推奨アクション

1. 本PRでは `published: false` のままマージ候補とする。
2. 公開前にZennプレビューでASCII図・表のモバイル表示を確認する。
3. 公開判断時にモデル名・価格・公式リンクだけ再確認する。

### SEO / 回遊

- タイトルは検索語を詰め込むより中心主張を優先した構成で妥当。
- 既存のRiver Review / Agent Team系記事との内部リンクは、公開時に検索意図の重複を再確認して必要なものだけ追加する。
