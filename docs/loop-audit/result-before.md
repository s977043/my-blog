# 採点結果 v1（Before: ハーネス導入前）

対象: my-blog の記事公開パイプライン（Zenn / Qiita / note）
採点基準: `docs/loop-audit/rubric.md` v1
測定日: 2026-08-26
測定コミット: 8d4c3b0

| モジュール | G | 不成立になった条件 | 証拠（検証コマンド / 参照） |
|---|:-:|---|---|
| Automations | **C** | B の「仕事の発見が自動」 | `docs/publish-queue.md:21`「補充は手動。次テーマが決まったら行を追加」。C の「自動の停止判断」は成立（`check-zenn-publish-pace.js:33` FAIL_THRESHOLD=2 で deploy ブロック） |
| Memory / State | **C** | B の「状態遷移が定義されている」 | `docs/publish-queue.md` のセクションは `Queue` / `Done` の2値のみ。遷移条件・異常停止ステータスの定義なし（Queue行 7） |
| Sub-agents | **B** | A の「基準に基づき自動でエスカレーション」 | 実装者(`review-applier`) ≠ 評価者(`article-reviewer`) が成立。合否基準も `check-publish-readiness.js` の `blocked` / `mustHigh` / `verified` として機械可読で存在。ただし `STRICT=1` 未設定時は WARN 止まりで、エスカレーション判断は人間 |
| Skills | **B** | A の「主要手順が自己テストを持つ」 | skills 6 / commands 14 / agents 5、呼び出し条件は CLAUDE.md と frontmatter に明文化。self-test は 17 本の check に対し 3 本（`test:pr-staleness` `test:publish-readiness` `test:article-humanizer`） |
| Connectors | **C** | B の「主要な外部系に API/CLI で到達」 | Zenn=GitHub連携 / Qiita=CLI で到達。note は WXR 生成までが機械、インポートと公開は管理画面の手作業（`publish-queue.md` Done 各行「WXR インポート→手動公開」） |
| Isolation | **C** | B の「物理分離されている」 | `git worktree list` = 1（分離なし）。C の「事故を検知するガード」は成立（`check-pr-staleness.sh` + `hooks/pre-commit` + `hooks/pre-push`） |

## サマリ

- **B: 2 / C: 4。F はゼロ。**
- 落ちている理由が 6 軸中 4 軸で共通している: **「工程を実行する仕組み」はあるが「次に何をやるかを決める仕組み」と「異常を自分で申告する仕組み」が無い。**
- 具体的には、パイプラインの**後工程（公開実行）だけが機械化**され、**前工程（仕事の発見）と横断の状態管理が人間の頭の中**にある。

## 反証（採点者の判断を却下した項目）

- Automations を D と採点する案を却下した。「工程間の受け渡しは人間」に見えるが、`/publish-zenn` はフェーズ0〜3を1コマンドで進行させ、停止するのは**意図的な著者ゲート2箇所のみ**。これは自動化の欠落ではなく設計上の不可逆操作ガードであり、D の条件文とは異なる事象。
- Sub-agents を C と採点する案を却下した。C の条件は「合格条件が『致命的なし』しか無い」だが、`check-publish-readiness.js` は `mustHigh`（未対応の高重要度指摘数）と `loops`（改善ループ回数）を別フィールドで持ち、致命的の有無とは独立に判定できる。
