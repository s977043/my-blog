<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=4eced5748e3fe93fad0ba4ebe47c0cb9923e13e0 loops=0 reviewedAt=2026-10-11T07:02:00Z -->
# articles/openspec-plangate-living-spec.md のレビュー（改善ループ / Humanize / 最終レビュー）

- 対象記事: `articles/openspec-plangate-living-spec.md`
- 改善ループ数: 0（最大 3）
- レビュー状態: post-humanize-verified
- 総合判定: **公開可（must / high は 0 件、ブロッカーなし）**。ただし OpenSpec の仕様説明と URL は WebFetch で裏取りしておらず、未検証のまま

## 各ループの要約

| ループ | 指摘件数 | must/high | 反映件数 | 主張保持 | 収束 | verdict |
|---|---|---|---|---|---|---|
| 1 | 5 | 0 | 0 | 未評価（反映なし） | yes | must/high はなし。2 つのフロー図で candidate の位置が食い違っている（medium）。残りは重複の圧縮と表記の細部。OpenSpec の一部仕様は未検証なので、出典リンクの追加を推奨 |
| verify | 3 | 0 | 0 | 未評価（反映なし） | yes | 新しい事実誤り、主張の希釈、保護領域への影響はなし。medium 1 件、low 2 件。URL と OpenSpec 仕様は未検証 |

## Humanize 結果（Phase 1・review-only）

- passed: **true**
- 件数: high 0 / medium 1 / low 4
- 要約: 主張・事実・出典はよく保たれている。6 責務の対応図を 4 回再掲していること、否定の繰り返し、一文段落による引き延ばし、英語名詞の局所密集が指摘された
- Humanize の指摘は記録するだけ。本文は変更しておらず、公開ブロッカーにも昇格させない

| ID | パターン | リスク | 場所 | 理由 | 提案 |
|---|---|---|---|---|---|
| H-001 | T06 結論の重複 | medium | TL;DR / 6種類の章 / PoC章 / まとめ | 6 責務の対応図が 4 か所でほぼ同じ形で再掲されている | PoC章（395-401行）の図を削り、前述の6責務への参照に置き換える。まとめの図は残す |
| H-002 | T06 結論の重複 | low | 「artifactを対応させると、かなり重なる」109-113行 | 同じ否定を 2 文で繰り返し、233 行で 3 回目が出る | 109 行を削り 113 行に一本化する。強調点3は維持 |
| H-003 | F04/T05 一文段落 | low | 183-195, 207-217行 | 引用と一文段落で文が細切れになっている | 1 文にまとめ、対比の引用は片方だけ残す |
| H-004 | S15 英語名詞の局所密集 | low | 368-370行 | 英語名詞が連続して読解負荷が高い | artifact→成果物など、中心概念以外を日本語化する（判断は著者） |
| H-005 | S10/S17 表記の揺れ | low | 30行 / 395行 / 見出し | Current System と Current What の使い分けが曖昧。一人称「私」と「自分」が混在 | 意図がなければ Current What に統一する |

著者入力が必要な項目（requiresAuthorInput）: なし。ただし H-004 の用語選択は Terminology Contract に関わるので、著者の判断に委ねる。

## 最終レビューの findings

| ID | persona | priority | location | 指摘 | suggestion | 主張に関係 |
|---|---|---|---|---|---|---|
| F1 | engineer | medium | L448-464 / L496-505 | 2 つのフロー図で Current Spec candidate と Verification の順序が逆 | candidate も検証対象なら、両方とも「Current Spec candidate → Verification / Evidence」の順にそろえる。主張（candidate を同じ PR に含め、merge で有効化する）は変えない | yes |
| F2 | editor | low | L109-113, L233 | 「Review/Verify の有無の比較ではない」という説明が 3 回繰り返されている | L109 を削って L113 に一本化し、L233 は「前述のとおり」程度に短くする。強調点3の太字は残す | no |
| F3 | editor | low | L394-401 | コードブロック内の矢印の桁がずれている | L30-35 と同じ桁で矢印をそろえる | no |

overallVerdict: 新しい事実誤り、主張の希釈、文体の崩れ、保護領域（published: false、中心仮説、強調点1〜10）への影響はなかった。公開ブロッカーはなく、収束と判定した。

## 残課題

1. F1（medium）: フロー図 2 つの順序をそろえる。公開前の対応を推奨
2. F2 / H-002: 否定の重複を圧縮する
3. F3: 矢印の桁をそろえる
4. H-001 / H-003 / H-004 / H-005: 文体の改善（任意）
5. OpenSpec の仕様説明（verify が optional であること、sync ワークフロー、「system as built」の記述）と URL を一次情報で裏取りし、出典リンクを追加する

## 公開可否の総合判定

**公開可**。must は残っておらず、must/high は 0 件。公開前には F1 の修正と OpenSpec 仕様の裏取りを推奨する。

## 反映と追加の照合（2026-10-11）

- medium（フロー図2つの candidate の位置の食い違い）: 2つ目の図を1つ目に合わせ、Verification / Evidence の後に candidate を置いた
- 未検証だった OpenSpec の記述を Fission-AI/OpenSpec の main で照合し、すべて一致した: `docs-lab/start/quickstart.md` L148「Specs describe the system as built」・L159「Git is a separate concern」・L177 verify は optional workflow、`docs-lab/customize/profiles.md` L17 `sync`（spec の更新を archive せずに specs/ へ反映）
