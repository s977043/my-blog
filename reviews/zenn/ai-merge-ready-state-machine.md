<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=b377f51222f63d90400bb56a6c64d4d1e77d1b0f loops=2 reviewedAt=2026-08-02T03:00:03Z -->

# レビュー成果物: ai-merge-ready-state-machine

- 対象記事: `articles/ai-merge-ready-state-machine.md`
- 改善ループ数: **2**（最大 3）
- レビュー状態: **post-humanize-verified**
- 総合判定: **公開可（must/high ゼロ・収束）**。残課題はすべて low の任意ポリッシュ。

> 注記: Humanize は Phase 1 の review-only です。Humanize の指摘だけを理由に本文を変更したり、公開ブロッカーへ昇格させたりしません。

---

## 1. 改善ループの要約

| ループ | 指摘件数 | must-high | 反映件数 | 主張保持 | converged | 概要 |
|:---:|:---:|:---:|:---:|:---:|:---:|---|
| Loop 1 | 6 | 1 | 6 | 保持 | false | 「価値の先出し→設計→限界」の構成が明快。high 1件は強調点7（トークンスコープでpush許可/merge禁止の境界は作れない）を支える GitHub 権限記述への一次出典付与（WebFetch で公式表を確認できず未検証のため著者確認推奨）。他は stale 初出補足・終盤3セクションの役割明示・疑似コード言語指定・状態表の入口行・日付表記の陳腐化対策など medium/low。 |
| Loop 2 | 5 | 0 | 4 | 保持 | false | Loop1 反映後、主張・7強調点・章立て骨格・published:false を保ったまま高完成度。トークン権限主張は公式リンク付きで据え置き（未検証扱い）。最も価値ある指摘は MERGE_READY_CANDIDATE の存在理由が薄い点（medium, clarity）で疑似コードの completion_needs_recheck 分岐と接続する一文で解消。他は終盤箇条書き重複・PlanGate 自己紹介重複・stop_with_error() の状態表非対称・topics 汎用語（すべて low, touchesClaim 全件 false）。 |
| Verify | 3 | 0 | 0 | — | **true** | 最終確認レビュー。8つの強調点すべて維持、主張の方向・希釈・反転なし。です・ます丁寧体、一人称「筆者」、括弧補足の語り口、章立て、published:false すべて保護。新規の事実誤りなし。残る3件は low の任意ポリッシュのみ。**収束と判断。** |

---

## 2. Humanize 結果（Phase 1 / review-only）

- **passed: true**
- 件数: **low 2 / medium 0 / high 0**
- high 指摘・保護領域への変更提案なし。主張・強調点（MERGE_READY と実マージの分離、経路を持たない設計、fail-closed、head SHA 束縛、allowlist 集約、責務境界の限界の正直な明示 ほか）はすべて保持。
- コード・表・mermaid・数値・バージョン・URL・PlanGate 用語・筆者の経験には指摘なし。

### 全 findings

| id | pattern | layer | risk | 保護領域 | 著者入力 | location | 指摘 / 修正案 |
|---|---|---|:---:|:---:|:---:|---|---|
| H-001 | S12-recurring-importance-closer | style | low | false | 不要 | 各章の締め（「不確実性は成功ではなく〜」冒頭 / 「intentとreceiptで〜」末尾 / 設計原則2 / 設計原則3） | 複数章が「〜が重要です／重要になります」で締められ締めの語彙が単調。4か所のうち2か所程度を、その章固有の帰結を述べる文末（例:「〜を分ける効果がここにある」「〜が破綻の分岐点になる」など主張を変えない言い換え）に変え語彙を分散。 |
| H-002 | S10-list-intro-template | style | low | false | 不要 | 「修正後の古い承認を使わない」導入部 / 「不確実性は成功ではなく〜」導入部 / 「外部作用はallowlistへ閉じ込める」中盤 | 箇条書き直前導入が「たとえば、次の〜です。」の同一鋳型で反復。1〜2か所を直前文からリストへ直結する形（例:「典型的にはこの順で進む」「起こり得るのはこうした状態だ」）に置換。内容・順序・項目は不変。 |

**著者入力が必要な項目: なし**（両件とも requiresAuthorInput=false、意味を変えない局所修正で対応可能）。

---

## 3. 最終レビュー 全 findings

overallVerdict: **収束（converged=true）**。8つの強調点はすべて維持、主張の反転・希釈なし。文体・語り口・章立て・published:false の保護領域は不可侵。must/high はゼロ。残る3件は low の任意ポリッシュで公開ブロッカーではない。外部主張（fine-grained token の Contents: write / Pull requests: write）も出典付きで妥当、「執筆時点（2026年8月）」の限定表現も現在日付と整合。

| id | persona | priority | location | touchesClaim | title / suggestion |
|---|---|:---:|:---:|:---:|---|
| eng-token-source-link-precision | engineer | low | L307 | false | **トークン権限の出典リンクをエンドポイント別アンカーへ精緻化**。現状リンクは一般ランディング `https://docs.github.com/en/rest/pulls` で該当節に直接到達しない。強調点7はそのまま、検証容易性向上のためマージ側を `.../rest/pulls/pulls#merge-a-pull-request`、レビュー作成側を `.../rest/pulls/reviews#create-a-review-for-a-pull-request` に分割。文面（Contents: write / Pull requests: write の対比）は変更不要。 |
| editor-failclosed-term-order | editor | low | L33 | false | **fail-closed の初出（messageボックス）に最小補足があると親切**。括弧定義は L255 まで出ない。予告リストなので現状も許容だが、L33 を「fail-closed（検証できない状態を成功扱いしない設計）、allowlist、intent／receiptの設計」のように一語補える。主張・語調・順序は不変。 |
| director-mermaid-b-loop-legibility | director | low | L110-L138 | false | **mermaid 図の中央評価ノード B へ戻る多重ループの読み取り負荷**。中間状態（C/E/M）と修正後 H が評価ノード B へ戻り初見で再評価ループの向きが追いにくい。骨格・状態名は変えず B ラベルを「最新headを再評価」に統一し、`M -->|再照合OK| B` のようにエッジへ短い語を添える。構成・主張は不変。 |

> L307 のリンクは解決するがランディングページのため WebFetch では該当権限節を確認できず——リンク切れではなく「個別エンドポイント節は未表示（未検証）」として扱う。

---

## 4. 残課題と公開可否の総合判定

### 残課題（すべて任意 / 公開ブロッカーではない）

- **low ポリッシュ 3件**（最終レビュー）: 出典リンクのアンカー精緻化 / fail-closed 初出補足 / mermaid 図の可読性。
- **Humanize 文体反復 2件**（Phase 1・参考情報）: 締めの語彙の単調化 / リスト導入鋳型の反復。いずれも意味を変えない局所修正。

### 未検証事項

- L307 のトークン権限記述（fine-grained token の Contents: write / Pull requests: write）は公式リファレンス参照付きだが、WebFetch で該当権限節を抽出できず「未検証（誤りとは断定せず据え置き）」。GitHub の権限スコープの通例と整合。

### 総合判定

**公開可（must なし・high なし・収束）。**

- must-high: **0**
- 主張・8つの強調点・文体・章立て骨格・`published: false` すべて保持。
- 残る指摘はすべて low の任意ポリッシュであり、公開をブロックしない。Humanize 指摘は review-only のため昇格させない。
