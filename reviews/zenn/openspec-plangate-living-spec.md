# articles/openspec-plangate-living-spec.md の記事レビュー

> Zennカテゴリー: Idea
> 構成タイプ: 概念解説 / 設計・アーキテクチャ
> Review target: PR #733
> Review date: 2026-10-01

## 編集部エージェントチーム

今回のレビューでは、同じ記事を次の5つの役割から読む。

| 役割 | 主な責務 |
| --- | --- |
| 編集長 | 中心主張、読者価値、タイトルと本文の一致 |
| Zenn編集 | 構成、情報密度、初見での読みやすさ |
| 技術ファクトチェック | OpenSpec / PlanGate の事実境界、公式仕様との一致 |
| アーキテクト | 責務分離、SSoT、状態遷移、driftリスク |
| 初見読者 | PlanGate未認知でも理解・持ち帰りできるか |

## レビュー方針

メイン読者は、Claude Code / Codexなどを使ってAI駆動開発を進め、Plan・仕様・レビューartifactが増えてきた中級〜上級エンジニア。PlanGateの紹介記事ではなく、「現在仕様」と「変更差分」をどう分けるかというReader Problemを主役にする。

## レビュー → 対応 ループ

### Loop 1: 事実境界と正本化タイミング

**レビュー**

- Medium: L106 のOpenSpec `verify` がcore workflowの一部に見えやすい。
- High: L422以降のCurrent Spec更新をmerge後の別処理にすると、実装とCurrent Specの間にdrift窓ができる。

**対応**

- `/opsx:verify` を optional workflow と明記し、default core profileには含まれないことを反映。
- Current Specはmerge後に別更新せず、同じchange / PR内にcandidateを含め、mergeを境界に正本化する仮説へ変更。
- OpenSpecのarchive / syncとGit mergeは別関心事であることを維持。

**再レビュー**

- 技術ファクトチェック: OK
- アーキテクト: OK
- 残課題: PlanGate内部仕様の密度

### Loop 2: PlanGate詳細を主線から外す

**レビュー**

- Medium: C-3' / Plan Package / hash / reviewer snapshot が本文中盤で主役になり、タイトルから期待する「今の仕様をどう残すか」から離れる。

**対応**

- Change Executionのprovenanceとして必要な要点だけを本文に残した。
- C-3'の6 artifactとhash詳細は `:::details` へ退避。
- OpenSpecとPlanGateの比較軸を「機能の有無」ではなく「何を正本として守るか」に戻した。

**再レビュー**

- 編集長: OK
- Zenn編集: OK
- 初見読者: 主線を追いやすくなった
- 残課題: 終盤に旧PoC手順と用語揺れが残る

### Loop 3: 読者への持ち帰りとPoC手順を統一

**レビュー**

- Medium: 「現在仕様 / 変更仕様 / 変更差分」が混在。
- High: PoC手順の一部に、旧い「変更確定後にspecへ反映」という説明が残り、Loop 1のcandidate方式と矛盾。
- Medium: まとめが再びPlanGate固有の結論へ寄っている。

**対応**

- 「現在仕様」と「変更差分」に統一。
- PoCを `Delta Spec → Implementation → Current Spec candidate → Verification → Merge → 正本化` に統一。
- まとめを Current What / Changed What / Why / How / Judgment / Proof の6責務へ戻し、PlanGateは自分の実践例として位置づけた。
- 見出しを「自分のフローでは、足りない責務だけを追加したい」「自分のAI開発フローに当てはめるための2つの問い」へ変更。

**再レビュー**

- 編集長: OK
- Zenn編集: OK
- 技術ファクトチェック: OK
- アーキテクト: OK
- 初見読者: OK

## チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| 編集長 | OK | PlanGate未認知でも入れるタイトル・中心主張になった |
| Zenn編集 | OK | 長い内部仕様を折りたたみ、本筋がCurrent What / Changed Whatへ収束 |
| 技術ファクトチェック | OK | OpenSpec verifyのoptional境界とarchive/syncの役割を明確化 |
| アーキテクト | OK | Current Spec candidateとmerge境界で正本化する仮説へ統一 |
| 初見読者 | OK | 6責務と2つの問いを自分のフローへ持ち帰れる |
| CI | 再確認中 | 最新headで確認する |

## 総合評価

### 良い点

- タイトルがPlanGate認知に依存せず、AI駆動開発のReader Problemから入れる。
- OpenSpecを導入チュートリアルとしてではなく、設計上の発見を得る一次情報として使えている。
- Current What / Changed What / Why / How / Judgment / Proof の6責務が独自の整理軸として残る。
- PlanGate固有の詳細は著者の一次体験・実装根拠として機能し、記事全体の主語にはなっていない。
- 「まだ仮説」「1 capabilityで試す」と境界を置いており、完成済みのベストプラクティスとして断定していない。

### 残る改善点

公開ブロッカーになる指摘は現時点でなし。実際のPoC後には、Current Spec candidateの生成方法、並行change、rollback、AC / test-casesとのdriftについて実測を追記できる。

## 改善後の読者ペルソナ反応

### Persona A: AI駆動開発を実践する中級エンジニア

> 「Planやレビュー記録は増えているのに、今の仕様はどこを見るのか、という違和感が自分にもある。OpenSpecを入れるかどうかより、Current WhatとChanged Whatを分ける、という考え方を持ち帰れるのが良かった。まず自分のrepoでも一つのcapabilityだけ試したい。」

### Persona B: Tech Lead / EM

> 「ツール比較ではなくSSoTと責務分離の話として読める。特にJudgmentとProofまで分けた6責務は、AIエージェントをチーム運用するときの設計レビューに使えそう。PlanGateを知らなくても本筋は理解できる。」

### Persona C: OpenSpecに興味がある読者

> 「OpenSpecの機能紹介だけではなく、main spec / delta specがなぜ効くのかを別の実践と比較しているのが面白い。verifyがoptionalであることなど、OpenSpecを過大評価していない点も安心できる。」

### Persona D: 懐疑的なシニアエンジニア

> 「specを増やせば解決する、という記事ではないのが良い。二重正本やdriftをリスクとして残し、PoCで検証するとしているので読みやすい。ただし本当に運用コストが下がるかは実測待ち。次の記事ではそこを見たい。」

## 推奨アクション

1. 最新headのCIを通す
2. mainとの差分とmergeabilityを確認
3. 本文は `published: false` のままmainへマージ可能
4. PoC実施後、実測結果を別記事または追記で検証する
