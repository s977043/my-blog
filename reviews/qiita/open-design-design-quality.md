# Qiita記事レビュー: open-design-design-quality

対象: `Qiita/public/open-design-design-quality.md`
レビュー日: 2026-05-20 / レビュー実施者: @claude
状態: `ignorePublish: true` / `private: true`（下書き・未公開）
備考: 先行作 `plangate-ai-coding-workflow` の Qiita レビュー4指摘を**初稿時点で予防反映**。**Zenn 原典は 2026-05-26 週公開予定**のため、Qiita 側の Zenn 原典 cross-post `:::note info` は壊れリンク回避のため**コメントアウトで一時退避**（公開時に有効化）。

## レビュー視点

| 視点 | 見ること | 評価 |
| --- | --- | --- |
| フロントエンドエンジニア | Open Design の判定軸が実装可能か | ◎ 2章で公開API/CLI/フォーマットの具体例を提示 |
| EM / TL | 続編単体で読めるか・前2記事との接続 | ◎ 4章で契約/入口の最小サマリを1行ずつ補足 |
| Qiita読者 | 想定読者・先に結論で保存価値があるか | ◎ 冒頭で担保 |
| 移植品質 | YAML 安全・画像・Zenn専用記法 | ◎ 画像は raw.githubusercontent.com 経由、`:::details` をベタ表示へ変換 |

## 自動チェック結果

- `npm run check`: PASS（`check:qiita-publish-hygiene` / `check:fm-title`（46記事） / `check:note-ref`）
- タイトル `"Open Designでデザイン品質を上げる：..."` は全角コロンのみで YAML 安全（クオートはスタイル統一のため）
- 画像参照: `https://raw.githubusercontent.com/s977043/my-blog/main/images/open-design-design-quality/open-design-quality-flow.png`（main 上で確認済み・103KB・プレースホルダ閾値超）
- Zenn 専用記法の `:::message`／`:::details` を Qiita 適合形式（`:::note info`／ベタ表示）へ変換

## 指摘

### 指摘1（公開時の必須対応）: Zenn 原典 cross-post の有効化

Qiita 公開タイミングが Zenn 原典より早い場合は壊れリンク化するため、現状はコメントアウトで退避。**Zenn 公開（2026-05-26 週予定）後に有効化**。公開メモコメント内に手順を明記済み。

### 指摘2（公開時の任意対応）: Qiita 三部作の相互リンク

前作 `penpot-react-design-system-contract` と ガイド `design-md-guide-and-adoption-log` の Qiita 版（同 PR で同時投入）の Qiita 内 ID が確定したら、本記事末尾の参考リンクを Zenn URL から Qiita 内部リンクへ昇格させると三部作回遊が完成する。

### 指摘3（任意）: 5章の `:::details` 折りたたみ撤去

Zenn 版では「観測できた定性変化」を `:::details` で畳んでいたが、Qiita には等価記法がないためベタ表示。情報損失なし、読みやすさへの影響は軽微。

## 反映状況サマリ（予防反映）

| 先行作レビュー指摘 | 予防反映 | 反映箇所 |
| --- | --- | --- |
| 対象読者・先に結論なし | ✅ | 冒頭に「想定読者」「先に結論」節を配置 |
| クロスポスト原典明示なし | △ 一時退避 | コメントアウトで保留（Zenn 公開後に有効化、公開メモに手順明記） |
| 主張語の反復 | ✅ | Zenn レビュー反映後の本文ベースで反復削減済み |
| テンプレート直前の体験文 | ✅ | 各 3-1〜3-4 に「要点:」一行先出し、5章に観測結果の narrative |

## 総合評価

**下書きとして公開準備が整っている**。ただし公開順序の制約があり、**Zenn 原典公開後**に以下を順次反映:

1. コメントアウトしている Zenn cross-post `:::note info` を有効化
2. Qiita 三部作の他2記事（penpot-react / DESIGN.md ガイド）が公開済みであれば末尾参考リンクを Qiita 内部リンクへ差替

公開時は `private:false`/`ignorePublish:false`・`updated_at` 更新・公開メモ削除 → `npm run check` → `publish:qiita`。
