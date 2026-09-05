---
name: article-visual-review
description: 技術記事の挿入図を、配置・本文との意味整合・用語整合・冗長性・追加図の必要性・alt・媒体互換性の観点でreview-only確認する。画像本体を確認できない場合はUNVERIFIEDにする。
---

# article-visual-review

記事に入っている図を、**ファイル形式ではなく読者理解と意味の整合性**の観点でレビューするreview-onlyスキル。

既存の `scripts/check-note-images.js` などの機械チェックを置き換えない。

## 目的

- 図を置く位置が適切か確認する
- 本文と図の意味・用語が一致しているか確認する
- 本文をそのまま複製するだけの図を増やさない
- 長い抽象説明で、本当に図が必要な箇所だけ追加候補にする
- 画像本体を見られない環境で「問題なし」と断定しない

## 対象

- Markdown画像参照 `![alt](path)`
- 記事本文に埋め込まれた図解・スクリーンショット
- note / Zenn / Qiita の本文画像

装飾目的だけのサムネイルやOGPは、本文理解に関係しない限り対象外にしてよい。

## 既存lintとの責務分離

### deterministic check

例: `scripts/check-note-images.js`

- パス
- 拡張子
- SVG非対応
- placeholder疑い
- note import互換性

### Visual Review

本スキルが担当する。

- 何を説明する図か
- どこに置くべきか
- 本文と意味が合うか
- 本文と図中の用語が合うか
- 図を追加 / 更新 / 削除すべきか

## レビュー観点

### 1. placement

- 図を見る前に、読者が「何を見る図か」を理解できるか
- 図が説明対象より早すぎないか
- 図の後に同じ内容を全文再説明していないか
- 記事の概念地図なら、詳細へ入る前に置けているか

### 2. semantic_consistency

- 本文の因果・順序・双方向性が図で変わっていないか
- 本文では反復・往復なのに、図が一方向のPhase Gateに見えないか
- 図が本文より強い断定をしていないか

### 3. terminology_consistency

- 本文で採用した正式用語と図中ラベルが一致しているか
- 旧用語が画像だけに残っていないか
- 日本語 / 英語の表記方針が本文と大きくずれていないか

例:

- 本文: `受入基準`
- 図: `完了条件`

この場合、意味が異なるなら `UPDATE`。

### 4. redundancy

- 本文の箇条書きをそのまま箱にしただけでないか
- 既存図と役割が重複していないか
- 図を削っても理解が変わらないならREMOVE候補にできる

### 5. missing_visual

追加図は「あると豪華」ではなく、次の場合だけ提案する。

- 複数概念の関係を文章だけで追う必要がある
- 状態遷移 / Loop / 分岐 / 比較が中心論点
- 同じ説明を複数段落使っており、構造を図で圧縮できる
- 読者が誤解しやすい境界を視覚化できる

追加図は最大2候補を目安にする。記事に十分な図があれば `ADD` を無理に作らない。

### 6. accessibility

- altが `image` やファイル名だけになっていないか
- altだけで図の役割が分かるか
- 本文に必要情報がなく、図だけを見ないと結論が分からない状態になっていないか

### 7. import_compatibility

媒体固有lintの結果があれば参照する。
noteでは `AGENTS.md` と `scripts/check-note-images.js` の規約を優先する。

## 判定

各画像を次のどれかに分類する。

| status | 意味 |
|---|---|
| `KEEP` | 配置・意味・用語が適切 |
| `UPDATE` | 図の役割は必要だが、内容・用語・alt等の修正が必要 |
| `REMOVE` | 重複や誤解が大きく、削除の方がよい |
| `ADD` | 本文に新規図を追加する価値が高い |
| `UNVERIFIED` | 画像本体を確認できず、意味整合を判定できない |

重要: 画像本体を確認できない場合、altやファイル名だけで `KEEP` にしない。

## 出力スキーマ

```json
{
  "applicable": true,
  "images": [
    {
      "path": "articles_note/assets/example.png",
      "location": "## ... の直後",
      "status": "KEEP",
      "role": "Discovery / Deliveryの全体像",
      "findings": []
    }
  ],
  "addCandidates": [
    {
      "location": "## Contract...",
      "reason": "2つのContractの対比が記事の最終モデルだから",
      "concept": "Discovery Contract ↔ Delivery Contract"
    }
  ],
  "passed": true,
  "unverified": false,
  "summary": "..."
}
```

画像が0枚でも、本文を読んで `missing_visual` を確認する。

## passed / unverified

- `passed: false`: `UPDATE` / `REMOVE` のうち公開前に直す価値が高いものが残る
- `unverified: true`: 記事理解に重要な画像本体を確認できない
- 画像なしで追加図も不要: `applicable: false`, `passed: true`

## 禁止事項

- 記事本文・画像ファイルを変更しない
- 画像を自動生成しない
- 画像本体を確認できないのに意味を推測して承認しない
- OCR結果だけを根拠に図全体の意味を断定しない
- 図を増やすこと自体を目的にしない
- 本文の主張を図に合わせて変更しない

## 完了条件

- [ ] すべての本文画像を列挙した
- [ ] 各画像に役割と判定がある
- [ ] 本文との意味・用語整合を確認した
- [ ] 追加図の必要性を確認した（不要なら0件）
- [ ] altを確認した
- [ ] 媒体互換性は既存lintと役割分担した
- [ ] 見られない画像はUNVERIFIEDにした
- [ ] 本文・画像を変更していない
