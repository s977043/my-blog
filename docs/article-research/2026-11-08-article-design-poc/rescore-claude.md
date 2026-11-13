# 再採点（Claude）

採点対象は構成改善案・Keep/Move/Cut・著者判断の中身のみ。設計メモ欄の有無と書式量は点に入れていない。

## N（articles_note/published/nb5d70c30380b.md）

### ゲート
| ゲート | N-P | N-Q |
|---|---|---|
| G1 Claim | PASS（並び維持、移動と圧縮のみ。チーム展望の扱いは著者判断へ） | PASS（Move 1 件と太字調整のみ） |
| G2 Evidence | PASS（0/5 本・DGM 数値・出典を Keep と明記） | PASS（数値・出典に手を入れない） |
| G3 Experience | PASS | PASS |
| G4 Safety | PASS | PASS |
| G5 Contract | PASS（展望・先に結論・Loop 削除・リンク本数を著者判断に分離） | PASS（リード結論・時制・反映可否を著者判断に分離） |

### 6 軸
| 軸 | N-P | 根拠 | N-Q | 根拠 |
|---|---|---|---|---|
| Focus | 2 | 原則の 3 重出現（#2・#4・まとめ）と、#3 と重なるまとめの「プロンプト→環境」2 段落の削除で主張が絞れる | 1 | 原則の重複とまとめの閉じ 5 つの競合に触れず、現行の散り方が残る |
| Flow | 2 | 原則を #4 の歯止め直前へ移すと「事故→失敗→歯止め 3 つ」の順になる。Loop 移動で #4 が体験で閉じる | 2 | Loop を #5 冒頭へ移し「実務が先、名前は後」を明確化。P と同等 |
| Skimmability | 1 | #1 冒頭のリード重複を圧縮するが、長い #4 3 回目段落は未対応 | 1 | #4 3 回目段落の分割を候補に挙げるが構成外扱いで、見出し側の改善はない |
| Information Hierarchy | 2 | 太字 2 文を中心主張の足場として Keep、閉じの数を減らして締めの一文を立てる | 2 | 各節の Primary を太字 1 つに絞る案（#3 末尾段落の全文太字解除）が具体的 |
| Reader Utility | 1 | まとめ H3 を Keep。持ち帰り部分の強化はない | 1 | 同様に H3 Keep のみ |
| Editorial Fit | 2 | note の物語型と「先に結論」方針の衝突を判断し、公開済み記事のリンク削除を著者判断へ回している | 2 | published の ⚠️ バナー・手動反映を明記し、急がない判断を添えている |
| 合計 | **10** | | **9** | |

推奨: **N-P**。Move の大半は両案共通だが、N-P はまとめの閉じ競合と原則の重複という原稿上の実問題を扱い、N-Q はそこを残している。N-Q の時制指摘（「あとで……やります」）は予告表現として成立しており、優先度は低い。

## Z（articles/river-review-judgment-placement.md）

### ゲート
| ゲート | Z-P | Z-Q |
|---|---|---|
| G1 Claim | PASS（並べ替えと縮約のみ。RJaC の扱いは著者判断） | PASS（同上） |
| G2 Evidence | PASS（検証表・未計測・公開後 message を Keep） | PASS（56e0ae4、#1788/#1811、2/5 を変えないと明記） |
| G3 Experience | PASS | PASS |
| G4 Safety | PASS | PASS |
| G5 Contract | PASS（5 例と 4 層の対応明記は新しい読み方の軸になるとして著者確認に回した） | PASS（RJaC 除外・リンク移動を著者判断に） |

### 6 軸
| 軸 | Z-P | 根拠 | Z-Q | 根拠 |
|---|---|---|---|---|
| Focus | 2 | Heuristic H3 の temporary-without-exit 条件重複を実例側へ一本化 | 2 | 同じ重複を一本化し、RJaC 節の関連記事 3 本を絞る |
| Flow | 2 | 制約節（L89）が 4 層定義（L106）より前で Trust Boundary/Promotion を未定義語として出す問題を、順序入れ替えで解消。Promotion→失敗モード→RJaC で Promotion の分断（L364→L436→L486）も解消 | 2 | 失敗モードを 4 層末尾 H3 へ上げ、見送る条件を Promotion 直下へ。分断は解消するが、制約節の未定義語先出しは残る |
| Skimmability | 2 | 「実装4」へ見出しを揃え、目次で Evidence 列が読める。finding-critic の罫線図をモバイル向けに | 2 | 「実装4」への見出し統一は同じ |
| Information Hierarchy | 2 | H2 の型（Model→境界→Evidence→Tension→Insight→Application）が見出しだけで追える | 1 | 失敗モードを H2→H3 へ降格すると 4 層節が 6 つの H3 を抱えて長くなり、Promotion への反論という位置づけが見出しから消える |
| Reader Utility | 2 | 「なぜ」の 5 例を 4 層で回収する対応（著者確認付き）は読者が自分の観点を分類する補助になる | 1 | 最小導入等は Keep のみ。関連記事を参考へ移すのは回遊を減らす方向 |
| Editorial Fit | 1 | Zenn の地図先出しは守るが、5 例対応の 1 文追加は「移動と縮約のみ」の範囲を一歩出る | 2 | AGENTS.md 同一媒体リンク規約を正しく引き、release/zenn 単独 PR・⚠️ を明記。常体 1 文の混在も範囲外として記録 |
| 合計 | **11** | | **9** | |

推奨: **Z-P**。原稿上の構造問題（制約節の未定義語先出し、Promotion の分断）を両方とも解消している。Z-Q は後者だけで、失敗モードの降格で 4 層節が重くなる。

## FAIL
4 案ともハードゲート FAIL なし。

## 作り方の推測
推測できた。各案に、伏せ字にされた構成設計スキル（Story Architecture／Reveal Strategy／Primary 1 つ／talk 系デザインガイドの冒頭 80 行）を使った案と使っていない案が 1 つずつある。
- 使った案: N-Q、Z-P。根拠は「設計（本文作成前）」節の Article Contract Snapshot・Story Architecture・Section Map・Editorial Design と、自己申告の伏せ字 SKILL.md 2 本＋デザインガイド 80 行の読了記録
- 使っていない案: N-P、Z-Q。自己申告で伏せ字ファイルを「読んでいない」と明記
- 点の傾向: スキルあり案は Z で勝ち（Model→境界の並べ替えを導いた）、N で負け（型の当てはめに留まり、閉じ競合を拾えなかった）。スキル有無で一貫した優劣は見られない
