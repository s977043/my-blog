# Qiita記事レビュー: design-md-guide-and-adoption-log

対象: `Qiita/public/design-md-guide-and-adoption-log.md`
レビュー日: 2026-05-20 / レビュー実施者: @claude
状態: `ignorePublish: true` / `private: true`（下書き・未公開）
備考: 先行作の `plangate-ai-coding-workflow` Qiita レビュー4指摘（対象読者・先に結論／原典明示／反復削減／テンプレ直前の体験文）を**初稿時点で予防的に反映**して執筆。

## レビュー方針

Zenn 公開済み記事の Qiita 移植版。Growth Lab デザイン三部作の中核（前作=契約、続編=Open Design 品質）を結ぶ「入口」記事。Qiita 読者は AI駆動開発・ドキュメンテーション運用への実利を期待するため、Zenn 原文の構造を保ちつつ Qiita 適合（想定読者・先に結論・原典明示）を冒頭で担保した。

## レビュー視点

| 視点 | 見ること | 評価 |
| --- | --- | --- |
| チーム開発者 | DESIGN.md なしで起きる症状に共感できるか | ◎ 5症状が具体的（余白・角丸・密度・AI前提反復・レビュー論点ぶれ） |
| EM / TL | 既存運用に薄く乗せる導入手順が描けるか | ◎ 5層モデル＋最小3ステップ＋4観点導線が明示 |
| Qiita読者 | 体験談として読みやすく保存価値があるか | ◎ 想定読者・先に結論・原典明示を冒頭で担保 |
| 移植品質 | Zenn記法→Qiita記法・YAML安全性・mermaid | ◎ タイトルクオート、mermaid 標準フェンス、Zenn専用記法なし |

## 自動チェック結果

- `npm run check`: PASS（`check:qiita-publish-hygiene` / `check:fm-title`（45記事） / `check:note-ref`）
- タイトル `"DESIGN.md 導入ガイド: AI実装のための..."` はコロン含むため YAML 安全化でダブルクオート済（publish 全滅ピットフォール回避）
- mermaid ブロックは Qiita 標準 ```mermaid フェンスで Zenn 由来の style 記法を除去（Qiita では style 記法が描画されない場合があるため安全側に倒した）
- ` ```md / ```text / ```mermaid ` フェンス健全性 確認済み
- `:::note info` 変換（Zenn 元には :::message なし、原典明示で1箇所のみ新規導入）

## 指摘

### 指摘1（任意）: Penpot に依存した記述の汎用性補足

`pnpm penpot:verify` / `Penpot Cloud` 採用判断など Penpot 前提の説明が複数箇所あるが、L173 と L189 で「考え方は Penpot 専用ではない」と明示。Qiita 読者の Penpot 非利用層への配慮としてバランスは取れている。追加対応不要。

### 指摘2（任意）: 関連ページのリンク密度

末尾「関連ページ」が Growth Lab デザインシステム1リンクのみ。Qiita 群（PlanGate / River Reviewer / ai-coding-preflight-checklist など）との回遊導線を作るなら、Qiita 内 ID リンクを2-3本添えると保存後の再訪率が上がる。**公開タイミングで関連 Qiita 記事 ID が確定してから追加するのが安全**（壊れリンク回避）。

### 指摘3（任意）: 三部作の相互リンク

前作 `penpot-react-design-system-contract` と 続編 `open-design-design-quality` の Qiita 版が存在しない現状、本記事を起点に Zenn 版へ誘導する形でも妥当。Qiita 版が揃った時点で相互リンクへ昇格を推奨。

## 総合評価

### 良い点

- 冒頭の「症状リスト」が具体的でチーム開発者に刺さる（余白・角丸・密度・AI前提反復・レビュー論点ぶれ）
- 5層モデル（Tokens→Primitives→Components→Article Patterns→Page Templates）の mermaid 図が概念把握を支援
- 7つの導入実績サブセクションが体験ベース、テンプレ密度が低く narrative が中心
- 「うまくいかなかったこと」を独立節で誠実に明示（誇張回避）
- FAQ 5項目で実務質問を先回り
- 移植の機械的品質が高い（YAML 安全・mermaid 安全側・フェンス健全・公開ハイジーン clear）
- `ignorePublish: true` 維持で誤公開リスクなし

### 改善点

- 必須対応なし（先行作レビューの教訓を予防反映済み）
- 任意改善は公開タイミングでの相互リンク強化（指摘2・3）

### 公開可否判断

**下書きとして公開準備が整っている**。先行作 `plangate-ai-coding-workflow` のレビュー4指摘を初稿時点で予防反映済みのため、追加修正なしで公開フローへ進める。

## 反映状況サマリ（予防反映）

| 先行作レビュー指摘 | 予防反映 | 反映箇所 |
| --- | --- | --- |
| 対象読者・先に結論なし | ✅ | TL;DR 直後に「想定読者」「先に結論」節を追加 |
| クロスポスト原典明示なし | ✅ | 冒頭に Zenn 原典への `:::note info` を配置 |
| 主張語の反復 | ✅ | Zenn 原文をベースに「言い換えると」等の重複を確認、過剰反復なし |
| テンプレート直前の体験文 | ✅ | 各サンプル直前に「初期導入では」「自分たちのケースでは」等の体験文が既に存在 |

公開時は `private:false`/`ignorePublish:false`・`updated_at` 更新・公開メモ削除 → `npm run check` → `publish:qiita`。
