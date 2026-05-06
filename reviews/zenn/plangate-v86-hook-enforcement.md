# Zenn 記事レビュー: plangate-v86-hook-enforcement (Codex 2026-05-07)

## レビュー方針

対象記事 `articles/plangate-v86-hook-enforcement.md` は本文を編集せず、`/Users/user/Documents/GitHub/plangate/CHANGELOG.md` の v8.6.0 セクションを一次情報として、数値・概念定義・導入順の整合性を確認した。特に 11 events / CLI 32 PASS / hook 12→42 PASS / 推測禁止条項 / 2026-05-04 baseline / Privacy 12-9 カテゴリを全件照合し、加えて `articles/plangate-design-evolution-v3-to-v8.md` との重複を確認した。

## サマリ

| 優先度 | 件数 | 主因 |
|---|---:|---|
| High | 0 | CHANGELOG v8.6.0 と矛盾する重大な数値・概念誤差は確認されなかった |
| Medium | 3 | CHANGELOG が保証する順序・機能範囲を本文がやや強く言い切っている箇所、TL;DR と本文の重複 |
| Low | 2 | 初見読者向けの引き込みと公開済み記事としての表現調整 |

## 事実整合性チェック

- 11 events: 対象記事 L33「Metrics v1 が記録する 11 events」、L85「events は次の 11 種類です」、L89-L99 の event 一覧は、CHANGELOG L19「11 events（task_initialized / plan_generated / c3_decided / exec_started / hook_violation / v1_completed / fix_loop_incremented / external_review_completed / pr_created / c4_decided / handoff_completed）」と一致。修正不要。
- CLI 32 PASS: 対象記事 L47「Tests は 24 → 32 PASS（CLI 側）」、L187「CLI 側 32 PASS（v8.5.0 の 24 から +8）」は、CHANGELOG L34「tests/run-tests.sh: 24 → 32 PASS（ta-09 で +8 件、既存 24 件は 0 件 regress）」と一致。修正不要。
- Hook 12→42 PASS: 対象記事 L65「hook tests 12→42 PASS」は、CHANGELOG v8.6.0 L32「Hook tests 42 PASS」および v8.5.0 セクションの「12 → 42 件 PASS」と対応。v8.6.0 セクション単独では 12→42 の増分は再掲されていないが、本文は v8.5.0 の役割説明として記載しており矛盾なし。修正不要。
- 推測禁止条項: 対象記事 L34「Issue governance の『推測禁止条項』」、L136-L140「推測で埋めてはならない」は、CHANGELOG L15「Milestone mapping policy（推測禁止条項）」、L42「issue-governance.md §4『推測禁止条項』で再発防止」と一致。修正不要。
- 2026-05-04 baseline: 対象記事 L76「2026-05-04-baseline.{md,json}」、L151「v8.5.0 直後時点の baseline」は、CHANGELOG L18「docs/ai/eval-baselines/2026-05-04-baseline.{md,json}」「v8.5.0 直後の baseline」と一致。修正不要。
- Privacy 12-9 カテゴリ: 対象記事 L78「保存可能 12 / 禁止 9 カテゴリ」、L127-L130 の 12/9 カテゴリ説明は、CHANGELOG L17「保存可能 12 カテゴリ / 禁止 9 カテゴリ」と一致。修正不要。
- 4 本柱と依存関係: 対象記事 L72「4 つの PBI がこの順序で実装されました」は、CHANGELOG L11「baseline 固定（#194）と運用 governance（#201, #202）を先に置き、その上に Metrics v1（#195）を実装」、L38「#194 / #201 / #202 / #195 の 4 件」、L39「governance / privacy / baseline を先に整備してから Metrics v1」と部分一致。ただし CHANGELOG は baseline / governance / privacy の厳密な直列順までは保証していないため、本文の「この順序で」は強い。Medium 指摘 1。
- Metrics の有効化表現: 対象記事 L203「最初から Metrics v1 を on にしても」は、CHANGELOG L20-L22 および L29 が `bin/plangate metrics` の collect/report/aggregate 機能追加を述べる一方、常時 on/off の機能フラグは CHANGELOG に記載なし。機能実態を「collect しても」に寄せると誤解が減る。Medium 指摘 2。
- TL;DR と本文重複: 対象記事 L43-L47 の TL;DR は、L70-L81、L83-L121、L149-L159、L180-L187 でほぼ同じ事実を再説明している。CHANGELOG L11-L23、L34-L39 の主要事実を TL;DR と本文の双方で扱う構成自体は妥当だが、初見読者には同じ名詞が連続する。Medium 指摘 3。

## 3 ペルソナ別指摘

### Web ディレクター

- [Medium] L43-L47: TL;DR が v8.5 / v8.6 / events / baseline / tests をすべて列挙しており、CHANGELOG L11-L23、L34-L39 の要点を本文で再度読む構成になっている。Zenn 読者への引き込みとしては情報量が多く、冒頭の読了動機がやや説明寄り。 → TL;DR は「何が変わったか」「誰に効くか」「最初に読む場所」の 3 点に圧縮し、詳細な数値は本文の各章に寄せる。
- [Low] L49: 「チームで観測したい場合に向いています」は、CHANGELOG L11「比較で判断できる基盤」、L38-L39「P0 完走」「依存順守」と対応する価値を受けているが、検索流入の初見読者には導入後の成果が少し抽象的。 → 「hook violation や C-3/C-4 の判断を週次で振り返りたいチーム」のようにユースケースを具体化する。

### Web 編集者

- [Medium] L72: 「4 つの PBI がこの順序で実装されました」は、直後の表順を厳密な実装順として読ませる。CHANGELOG L11 は baseline / governance を先に置き Metrics v1 を実装、L39 は governance / privacy / baseline を先に整備と書くが、#194→#201→#202→#195 の完全な直列順までは明記していない。 → 「4 つの PBI は、Metrics v1 の前に baseline・governance・privacy を整える依存関係で実装されました」に変更する。
- [Low] L132: 「漏れる、という事故が起きにくい」は、CHANGELOG L17「redact / sanitize / 完全除外 / retention 90日 / public-private 別運用差分」、L19「§4 Forbidden は schema 上に存在させない」と対応するが、公開済み技術記事としては口語的で少し弱い。 → 「意図せず Forbidden カテゴリを保存しにくい構造です」に変更する。

### Web エンジニア

- [Medium] L203: 「最初から Metrics v1 を on にしても」は、CHANGELOG L20「TASK ディレクトリから 6 events 自動導出 + NDJSON append」、L29「metrics サブコマンド追加」とは対応するが、CHANGELOG に常時有効化する `on` 概念は記載なし。CLI 実行型の機能をフラグ常駐型のように誤読される可能性がある。 → 「最初から `metrics --collect` を回しても」に変更する。

## 修正アクション一覧

- L43-L47: `v8.5.0 までで Hook enforcement... Tests は 24 → 32 PASS...` → `v8.6.0 は、v8.5.0 で完成した Hook enforcement の上に、baseline・governance・privacy・Metrics v1 を載せ、以後の改善を比較可能にしたリリースです。詳細な 11 events と test 数は本文で整理します。` [Medium]
- L72: `4 つの PBI がこの順序で実装されました。` → `4 つの PBI は、Metrics v1 の前に baseline・governance・privacy を整える依存関係で実装されました。` [Medium]
- L203: `最初から Metrics v1 を on にしても、observe する対象（TASK 履歴）が無いと意味がありません。` → `最初から \`metrics --collect\` を回しても、observe する対象（TASK 履歴）が無いと意味がありません。` [Medium]
- L49: `チームで観測したい場合に向いています。` → `hook violation や C-3/C-4 の判断を週次で振り返りたいチームに向いています。` [Low]
- L132: `Metrics v1 を on にしただけで漏れる、という事故が起きにくい構造になっています。` → `Metrics v1 を使っても、Forbidden カテゴリを意図せず保存しにくい構造になっています。` [Low]

## 関連記事との重複所見

`articles/plangate-design-evolution-v3-to-v8.md` は、L50-L94 で「止める」軸として v8.5 Hook enforcement と v8.6 Metrics v1 の合流を説明し、L178-L184 で Metrics v1 / privacy contract を設計史の到達点として扱っている。対象記事も L58-L68、L161-L187 で同じ v8.5→v8.6 の関係を説明しているため、概念レベルの重複はある。

ただし役割は分けられている。関連記事は v3〜v8.6 の設計変遷を俯瞰する「地図」で、対象記事は v8.6.0 の Metrics v1 / Governance / Baseline を実務導入順に読む「リリース詳細」である。住み分けとして、対象記事では v3〜v8.4 の歴史説明を増やさず、CHANGELOG v8.6.0 の具体要素（11 events、CLI、privacy 12/9、baseline、推測禁止条項、32 PASS）に寄せるのがよい。逆に関連記事側は、対象記事へのリンクを「v8.6.0 の具体的な導入手順はこちら」と位置付けると重複が補完関係になる。
