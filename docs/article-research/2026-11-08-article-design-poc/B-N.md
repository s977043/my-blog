# B-N: 方式 B（Treatment）による Fixture N 構成案

## 1. 固定した入力

| 種別 | パス | 基準 |
| --- | --- | --- |
| Fixture N | articles_note/published/nb5d70c30380b.md | fdc33406836f8ea3642dd385f63fca58a4bbd2a6 |
| 履歴参考 | articles_note/new/harness-practice-note.md | 9f65b84（見出し構成は公開版と同一） |
| 共通ルール | AGENTS.md / .claude/skills/tech-blog-writing/SKILL.md / docs/content-channel-strategy.md / articles_note/checklists/note-article-quality-checklist.md | fdc3340 |
| 方式 B 追加 | .claude/skills/talk-story/SKILL.md / .claude/skills/talk-design/SKILL.md / talks/DESIGN.md | fdc3340 |

注: 対象は published。反映するなら ⚠️ バナー付き PR と note 管理画面での手動反映が要る（AGENTS.md）。

## 設計（本文作成前）

### (1) Article Contract Snapshot

| 項目 | 内容 |
| --- | --- |
| reader | AI エージェントで開発していて、「できました」報告の確認が負担になっている個人開発者・EM・TL |
| reader_problem | AI の報告を人間が毎回目で確かめていて、見落とすとそのまま通ってしまう |
| central_claim | AI に毎回正しく書かせることより、間違いを検知でき、境界を越えられず、次のガードへ変えられる仕組み（ハーネス）を作ること。ガード自身も間違うので運用し直す。受理の判断は人間に残す |
| evidence | PlanGate PR #240（未マージ CLOSE）、BLOCK 表示で通過した終了コード、ガード作り直し 3 回（#1023/#1042/#1045/#1069/#1110/#1121、誤 block 6 回）、Codex CLI 設定で 5 本中 0 本登録（#1083）、Böckeler（2026-04-02）、Osmani Loop Engineering、DGM 論文の数値と objective hacking |
| out_of_scope | チームでの共通化の設計（末尾で予告のみ）、PlanGate / River Review の使い方、会社リポジトリの事例 |
| channel | note 個人（背景・思想・体験の正本）。参照は末尾へ |

### (2) Story Architecture（talk-story の型を記事へ当てた対応）

| 型 | 現行での担い手 | 状態 |
| --- | --- | --- |
| Hook | リード冒頭の事故 | 成立 |
| Problem | 「できました」が信用できなくなった | 成立 |
| Experience | 周囲を作り始めた | 成立 |
| Insight（前倒し） | 人間がフィードバックループをやめた | Tension より前に来ている |
| Tension | ガードも間違った | 成立。記事で最も強い節 |
| Model | Harness Engineering という名前 | 成立 |
| Application | 境界は残す | 成立 |
| Takeaway | まとめ | 成立。冒頭の問いへ戻る |

主な所見は 2 点。
- リードの終わりで「私が選んだのは後者」「間違いを検知でき……次のガードへ変えていける形」と結論をほぼ言い切っている。Reveal Strategy の観点ではやや早い。ただし note では先に結論を置く方針（チェックリスト「先に結論」）もあるため、構成は変えず、著者判断に回す（§5）
- Loop Engineering の引用が Tension 節の末尾にあり、次の Model 節（名前を知った）と役割が重なる。外部の枠組みを 1 か所にまとめると、「実務が先、名前は後」という順序がはっきりする

LT の 8 章は強制しない。現行の 7 H2 はおおむね型に沿っているので、並び替えは最小限にとどめる。

### (3) Section Map

| H2 | 役割 | 読者の問い | 主張 | 根拠 | 前後接続 |
| --- | --- | --- | --- | --- | --- |
| リード | Hook | 自分にも起きる？ | 報告を信じて事故が起きた。仕組みで止める | PR #240 | → 何が壊れていたか |
| 1 できました | Problem | 何が壊れていた？ | 壊れていたのは AI の外側の手続き | #240、終了コード | → では何を作った |
| 2 周囲を作る | Experience | 何を作った？ | 事前の関門とレビュー基準、事故に紐づく検査 | PlanGate、River Review、MERGED 確認 | → 結果どう変わった |
| 3 ループをやめた | Insight | 人間の役割は？ | 検知役を降り、判断役を残した | 図 3 | → でもガードは完璧？ |
| 4 ガードも間違う | Tension | 仕組みは信用できる？ | ガードも運用対象。歯止め 3 つ | 3 回の作り直し、6 回、0/5 本 | → これは何と呼ばれている |
| 5 名前を知った | Model | 一般化できる？ | 実務が先、名前は後。CI も含めてハーネス | Böckeler、（移動後）Osmani | → 改善を AI に任せる範囲は |
| 6 境界は残す | Application | どこまで任せる？ | 受理の権限 4 つと、基準 2 つ | DGM | → 持ち帰るルール |
| 7 まとめ | Takeaway | 何を持ち帰る？ | 間違いが安く済むことを設計する | 本文の再掲 | 冒頭へ戻る |

### (4) Editorial Design

- 情報階層: 太字の 1 文が各節の Primary（talk-design の 1 attention target を節単位で当てた）。現行で 1 節に太字が 2〜3 個ある節は 3・4・6。4 の 3 つの太字（最初は／次は／さらに）は段階を示す見出しの代わりなので残す。3 は「人間がフィードバックループ……」を Primary にし、末尾の段落全体を太字にしている箇所は太字を外す候補
- 図の役割: 図 1（人間の目だけ）→ 図 2（Before/After）→ 図 3（事前と事後の両側）→ 図 4（ループの改善）。この流れはそれぞれ段階的開示になっている。重複はない。KEEP
- 段階的開示: 4 節の「止められていない → 止めすぎ → 対象違い → 一度も起動していない」は原因の連鎖として良い順序。KEEP
- モバイル: 4 節の 3 回目（リダイレクト照合と初版の取りこぼし）の段落が長い。スマホで 1 画面を超えるので、文の分割を候補にする（構成変更ではない）。7 節の H3 2 つはチェックリスト的で保存性が高い。KEEP

### (5) Keep / Move / Cut は §4 に記載

## 2. 現行構成のベースライン

| 見出し | 1 行要旨 |
| --- | --- |
| （リード） | 「マージした」報告で未マージ PR を CLOSE。仕組みで止めると決めた。自己紹介と免責 |
| ## 「できました」が信用できなくなった | 報告と事実を区別していなかった。BLOCK 表示で通過するガード。壊れていたのは外側の手続き。図 1 |
| ## AIを賢くするより、周囲を作り始めました | PlanGate、River Review、MERGED 確認スクリプト。図 2。検査は観測した事故に紐づける |
| ## 人間がフィードバックループそのものになるのをやめた | 事前と事後のガード。図 3。検知役をやめ、判断役は残す。ハーネスの定義 |
| ## ガードを作ると、そのガードも間違いました | 作り直し 3 回、0/5 本登録、歯止め 3 つ。図 4。Loop Engineering |
| ## 後から「Harness Engineering」という名前を知った | Böckeler の guides/sensors。CI も含めてハーネス。前回記事 |
| ## ハーネスの改善もAIに任せる。ただし、境界は残す | DGM。人間に残す 4 つの権限と 2 つの基準 |
| ## まとめ。AIが間違えないことより、間違いが安く済むことを設計する | 3 つの問い。### 検査を増やすとき ### AIへ権限を渡すとき。結び |
| ## 参考 | PlanGate の PR/issue |

## 3. 構成改善案

| # | 見出し（案） | 要旨 | 変更 |
| --- | --- | --- | --- |
| リード | （変更なし） | 同上 | NO_CHANGE（結論の出し方は §5） |
| 1 | ## 「できました」が信用できなくなった | 同上 | NO_CHANGE |
| 2 | ## AIを賢くするより、周囲を作り始めました | 同上 | NO_CHANGE。末尾の「この原則を当てているのは……」の段落は残す（誤読を防ぐ限定のため） |
| 3 | ## 人間がフィードバックループそのものになるのをやめた | 同上 | 構成は NO_CHANGE。太字を Primary 1 つに絞る（Editorial のみ） |
| 4 | ## ガードを作ると、そのガードも間違いました | 作り直し → 歯止め 3 つ → 図 4「ループを回す仕組みそのものを次の周回の対象に」で閉じる | Loop Engineering の 2 段落（Osmani の説明と引用、「私がここでやってきたのは……」）を 5 節の冒頭へ移す。理由: 4 節を自分の体験だけで閉じ、外部の枠組みを 5 節にまとめるため |
| 5 | ## 後から「Harness Engineering」という名前を知った | 冒頭に Loop Engineering を置き、続けて Böckeler。「実務から先に同じ結論へたどり着き、あとで名前を知った」を両方の引用の後に置く | 移動先。見出しは変えない。前回記事への言及は残す |
| 6 | ## ハーネスの改善もAIに任せる。ただし、境界は残す | 同上 | NO_CHANGE |
| 7 | ## まとめ。…… | 同上 | NO_CHANGE。「チームへ広げるなら……」は 1 文の予告にとどまり、結論より目立たないので残す |
| 参考 | ## 参考 | 同上 | NO_CHANGE |

H2 の並びは変えない。H2 だけを追っても Problem → Experience → Insight → Tension → Model → Application → Takeaway が読めるため。

## 4. Keep / Move / Cut

| 区分 | 対象 | 理由 |
| --- | --- | --- |
| Keep | H2 7 本と並び順 | H2 だけで因果が追え、talk-story の時間軸にもおおむね沿っている |
| Keep | 図 1〜4 | それぞれ別の状態を示していて重複がない。並びも段階的開示になっている |
| Keep | 4 節の 3 段階の太字と 0/5 本の件 | 記事の Tension の中心。一次経験と数値はそのまま |
| Keep | 7 節の H3 2 つ | 読後に使い回せる判断基準。保存したくなる部分 |
| Move | Loop Engineering の段落（4 節末 → 5 節冒頭） | 外部の枠組みを 1 節にまとめる。4 節は図 4 と太字の 1 文で閉じる |
| Cut（軽微） | 3 節末の段落全体の太字 | 1 節に Primary が複数あり、強調が弱まる。文は残し、太字だけ外す |
| Cut 候補（要確認） | 2 節「あとで、これに近い失敗を自分でもやります。」 | 4 節の予告として効いているが、時制がほかと揃っていない。削るより「あとで、これに近い失敗を自分でもしました。」と直す案も出せる。著者判断 |
| Cut しない | 4 節と 7 節で繰り返す歯止め 3 つ | 重複だが、7 節はチェックリストとしての再掲で保存用途がある。削らない |

## 5. 著者判断に回す案

1. リードの結論の出し方: 「私が選んだのは後者でした」以降の段落を残す（note の先に結論の方針）か、問いで止めて 1 節に回すか（Reveal Strategy）。推奨は現行維持。タイトルですでに結論を示しているため、リードで隠しても緊張は生まれにくい
2. 2 節末「自分でもやります」の時制（§4）
3. 公開済み記事なので、上記の Move を公開後に反映する価値があるか。変更は読みやすさの改善で、誤りの修正ではない（memory「公開直前は必要な指摘だけ直す」と同じ考え方で、急がなくてよい）

中心主張・数値・出典・実装状態の変更を要する案はない。

## 6. 自己申告

- 所要時間の目安: 約 10 分
- 読んだファイル（すべて fdc3340、履歴は 9f65b84）
  - articles_note/published/nb5d70c30380b.md
  - articles_note/new/harness-practice-note.md（9f65b84、見出しのみ）
  - .claude/skills/talk-story/SKILL.md
  - .claude/skills/talk-design/SKILL.md
  - talks/DESIGN.md（先頭 80 行）
  - .claude/skills/tech-blog-writing/SKILL.md（先頭 60 行）
  - docs/content-channel-strategy.md（note の該当箇所の grep）
  - articles_note/checklists/note-article-quality-checklist.md
- 読んでいない: AGENTS.md はセッションのコンテキストで読み込み済み。articles_note/guides/note-structure-best-practices.md と tech-blog-writing の references/ は読んでいない
