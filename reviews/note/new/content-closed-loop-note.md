# `content-closed-loop-note.md` 記事レビュー

> 対象: note向け一次体験・技術オピニオン記事「AIに記事を書かせる前に、『学びが戻る仕組み』を作ることにした」
>
> 状態: `new`
>
> レビュー日: 2026-09-23
>
> 詳細: [3ループ論旨レビュー](./content-closed-loop-note.thesis-loop.md) / [Final Gate](./content-closed-loop-note.finalize.md)

## 記事タイプと想定読者

- 記事タイプ: 一次体験 + Content Operations設計
- メインターゲット: AIで記事制作を自動化しているエンジニア・個人開発者
- サブターゲット: 複数AIエージェントを使うメディア運用を設計したい人
- 読者への約束: 文章生成・自動投稿より先に、Signal → Seed → Article → Metrics → Learningをつなぐ理由と最小構成を理解できる

## 総合チェック

| 観点 | 判定 | 確認内容 |
| --- | --- | --- |
| 主題 | OK | 自動投稿ではなく「学びが戻る仕組み」に一貫 |
| 一次体験 | OK | 実際に導入したSeed ID / Article Graph / Metrics joinを中心に記述 |
| 外部情報境界 | OK | 外部note記事はきっかけとして扱い、成果や効果を筆者の実績として流用していない |
| 技術境界 | OK | Graphは派生物、Metricsは観測、stable IDのみjoinと限定 |
| note可読性 | OK | 実装用語を日本語化・初出説明し、表は使用していない |
| Human Gate | OK | 公開・Strategy更新の自動化は行わず判断境界を明示 |
| 論旨レビュー | OK | 3ループすべてThesis Gate合格、Must/High 0 |
| 公開状態 | READY | Final Gate合格。WXR生成・公式export照合・note公開はHuman Gateとして残す |

## 良い点

- 読んだ外部記事を紹介するだけでなく、自分のシステムへ導入し、そこから得た違和感と判断を書いている。
- 「機能追加」ではなく「情報が途中で消えないようにする」という説明が、非技術的にも伝わる。
- 既存9 Seedを移行しない判断、新DBを作らない判断、自動公開しない判断が入り、やらなかったことにも理由がある。
- この記事自体をCanaryとして使うため、記事内容と運用検証が一致している。
- 公開後に `promoted_to` → Metrics `seed_ids` を実測できるので、次の追記に具体的な結果を残せる。

## 残る任意改善

公開を妨げる指摘はない。公開後にのみ追加価値が出る項目として次がある。

- note公開URLが得られた後、SeedへURLを追加した結果
- Metrics取得で同じ `seed_id` が付いた実測結果
- 最初のLearning Proposalと、その採用 / 棄却理由
- Signal → LearningのLead Timeを何回か蓄積した後の定量評価

これらは公開前に捏造・予測して埋めず、実測後の追記に回す。

## 最終判定

**Final GateはREADY。note公開のHuman Gateへ進行可能。**

ただし本記事の目的上、公開しただけではCanary完了ではない。公開URLをSeedへ戻し、Metricsで `seed_id` を再接続し、Learning Proposalまで作って初めてClosed Loopの端から端までの検証が完了する。
