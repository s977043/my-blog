# Qiita記事レビュー: penpot-react-design-system-contract

対象: `Qiita/public/penpot-react-design-system-contract.md`
レビュー日: 2026-05-20 / レビュー実施者: @claude
状態: `ignorePublish: true` / `private: true`（下書き・未公開）
備考: 先行作 `plangate-ai-coding-workflow` の Qiita レビュー4指摘（対象読者・先に結論／原典明示／反復削減／テンプレ直前の体験文）を**初稿時点で予防反映**して執筆。デザイン三部作 Qiita 化の起点記事。

## レビュー視点

| 視点 | 見ること | 評価 |
| --- | --- | --- |
| フロントエンドエンジニア | 同期ではなく契約という発想の実装可能性 | ◎ token JSON / component-map / 検証順が具体的 |
| AI 駆動開発実践者 | AI へのデザイン指示テンプレが現場で使えるか | ◎ 目的・対象ユーザー・優先順位・禁止事項の8項目で網羅 |
| Qiita読者 | 想定読者・先に結論・原典明示で保存価値が出ているか | ◎ 冒頭で担保 |
| 移植品質 | YAML 安全・記法互換 | ◎ タイトルクオート、Zenn専用記法なし |

## 自動チェック結果

- `npm run check`: PASS（`check:qiita-publish-hygiene` / `check:fm-title`（46記事） / `check:note-ref`）
- タイトルにコロンなし＝YAML 安全（クオートはスタイル統一のため任意）
- フェンス健全性 OK（```text / ```bash / ```markdown）

## 指摘

### 指摘1（任意）: 関連リンクの非対称

末尾「参考」が「ガイド: DESIGN.md 導入ガイド」のみで、続編（Open Design）への言及がない。Qiita 三部作が揃った時点で続編リンクを追加すると回遊が完成する（**続編 Qiita 公開後**に追記推奨、現時点では Qiita 版 ID 未確定のため保留）。

### 指摘2（任意）: 6章「大きな変更では」の `:::details` 折りたたみ未適用

Zenn 版では `:::details` で確認順10項目を畳んでいたが、Qiita 版はベタ表示。Qiita には `:::note` 系はあるが Zenn の `:::details` 等価は無いため、現状のベタ表示で問題なし（情報損失なし）。

## 反映状況サマリ（予防反映）

| 先行作レビュー指摘 | 予防反映 | 反映箇所 |
| --- | --- | --- |
| 対象読者・先に結論なし | ✅ | 冒頭に「想定読者」「先に結論」節を配置 |
| クロスポスト原典明示なし | ✅ | 冒頭に Zenn 原典への `:::note info` を配置 |
| 主張語の反復 | ✅ | Zenn 原文をベース、過剰反復なし |
| テンプレート直前の体験文 | ✅ | 各章の問題提起→テンプレ→運用補足のリズムが既に narrative |

## 総合評価

**下書きとして公開準備が整っている**。デザイン三部作 Qiita 化の起点として、続編（Open Design）公開後に相互リンク強化を推奨。公開時は `private:false`/`ignorePublish:false`・`updated_at` 更新・公開メモ削除 → `npm run check` → `publish:qiita`。
