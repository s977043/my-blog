# note-finalize 実運用ログ（Issue #593 P2）

`note-finalize` Workflow（`.claude/workflows/note-finalize.js`）を実運用したときの実測値。Issue #593 の P2「note で実運用し、誤検知率 / 所要時間を測る」に対応する記録。

**すべて実測値**。取得できなかった項目は「計測できていない」と明記している。数値の抽出コマンドは §抽出方法 に置く。

- 計測期間: 2026-09-05 19:53 〜 2026-09-06 02:25（JST）
- 一次データ: `~/.claude/projects/-Users-user-Documents-GitHub-my-blog/<sessionId>/subagents/workflows/wf_*/`（`journal.jsonl` と `agent-*.jsonl`）
- 対象セッション: `814df778-784e-4a75-a9e1-aa87e586b095`

## 1. 実行回数と対象記事

`note-finalize` の run は **8 回 / 対象記事 2 本**。各 run はサブエージェント 5 体（Extract / Domain / Language / Visual / Editorial）で固定。

| # | run id | 対象記事 | 開始（UTC） |
| --- | --- | --- | --- |
| 1 | `wf_b400e3a8-008` | `articles_note/new/plangate-team-rollout.md` | 2026-09-05T19:53 |
| 2 | `wf_debb6a0c-86e` | `articles_note/new/harness-practice-note.md` | 2026-09-06T00:16 |
| 3 | `wf_46d8db60-ce4` | 同上 | 2026-09-06T00:40 |
| 4 | `wf_933e0346-d03` | 同上 | 2026-09-06T00:57 |
| 5 | `wf_7b83668a-7f7` | 同上 | 2026-09-06T01:14 |
| 6 | `wf_071abb97-9a8` | 同上 | 2026-09-06T01:36 |
| 7 | `wf_b5ce5593-a19` | 同上 | 2026-09-06T01:52 |
| 8 | `wf_71b2f9d7-ac5` | 同上 | 2026-09-06T02:15 |

同一セッションには `note-thesis-review-loop` の run（`wf_4e8a0a6d-d63` = 30 エージェント、`wf_74fe5671-8ca` = 20 エージェント）も残っているが、これは別 Workflow なので本ログの集計からは除外している。

## 2. 所要時間

run 内の全サブエージェント JSONL の最初と最後の `timestamp` の差。

| 指標 | 値 |
| --- | --- |
| 最短 | 428 秒（7.1 分、run #1） |
| 中央値 | 685 秒（11.4 分） |
| 平均 | 664 秒（11.1 分） |
| 最長 | 810 秒（13.5 分、run #5） |

各 run: 428 / 687 / 683 / 759 / 810 / 619 / 728 / 596 秒。

5 フェーズは `note-finalize.js` で **直列 `await`** なので、この値がそのまま壁時計時間に近い。並列化は未実施。

## 3. エージェント数とトークン消費

エージェント数は全 run で **5 体固定**（条件分岐による skip は起きていない。§7 参照）。

トークンは `agent-*.jsonl` の `message.usage` を `input + output + cache_read + cache_creation` で合算した値。

| # | run | 合計トークン |
| --- | --- | --- |
| 1 | `wf_b400e3a8-008` | 2.74M |
| 2 | `wf_debb6a0c-86e` | 5.08M |
| 3 | `wf_46d8db60-ce4` | 5.37M |
| 4 | `wf_933e0346-d03` | 6.44M |
| 5 | `wf_7b83668a-7f7` | 6.52M |
| 6 | `wf_071abb97-9a8` | 5.90M |
| 7 | `wf_b5ce5593-a19` | 6.82M |
| 8 | `wf_71b2f9d7-ac5` | 4.75M |

合計 **43.61M**、1 run 平均 **5.45M**。内訳の大半は cache_read（例: run #7 は 5.98M / 6.82M）。純 output は 1 run あたり 25k〜31k（run #1 のみ 5k）。

**コストの実額は計測していない**（journal に課金情報がない）。

## 4. verdict の推移

`verdict` は Workflow 側で `blockers`（`passed=false` の Gate）と `unverified` から算出される。journal には Gate ごとの `passed` しか残らないため、以下は同じ算出規則（`note-finalize.js` L370-392）を journal に再適用して復元した値。

| # | 対象 | verdict | blockers | unverified |
| --- | --- | --- | --- | --- |
| 1 | plangate | NEEDS_CHANGES | domain, editorial | なし |
| 2 | harness | NEEDS_CHANGES | domain, editorial | なし |
| 3 | harness | NEEDS_CHANGES | editorial | なし |
| 4 | harness | NEEDS_CHANGES | domain, editorial | なし |
| 5 | harness | NEEDS_CHANGES | visual, editorial | なし |
| 6 | harness | NEEDS_CHANGES | visual, editorial | なし |
| 7 | harness | **READY** | なし | なし |
| 8 | harness | NEEDS_CHANGES | visual | domain |

- harness 記事は **6 回目の再実行（run #7）で READY** に到達した。NEEDS_CHANGES → 修正 → 再実行を 5 サイクル要した。
- run #8 は READY 到達後にさらに修正を入れて再実行したもので、visual Gate が再び `passed=false` に落ちた。**READY は記事の状態に対して安定していない**（§6）。
- plangate 記事は 1 回のみで、再実行されていない。**1 記事の完走サイクルしか観測できていない。**

## 5. 指摘の内訳

`findings[].priority`（language Gate は `risk`）別の総件数。

| Gate | must | high | medium | low | 計 |
| --- | --- | --- | --- | --- | --- |
| domain | 0 | 5 | 18 | 13 | 36 |
| language | 0 | 0 | 2 | 35 | 37 |
| editorial | 1 | 14 | 20 | 5 | 40 |
| visual | — | — | — | — | 0 |

- 合計 **113 件 / 8 run**（1 run あたり平均 14.1 件）。
- **visual Gate は `findings` を 1 件も返していない**。判定は `images[].status`（KEEP / UPDATE / REMOVE / UNVERIFIED）と `addCandidates` で表現される設計のため。
- language Gate は 37 件中 35 件が `low`。**WARN 中心という設計意図どおりだが、8 run で `passed=false` に一度もなっていない**（Gate としては現状ほぼ無害・無効）。
- editorial Gate は 8 run 中 6 run で `passed=false`。最も検出圧が高い。

visual Gate の内訳:

| # | images 件数 | status | addCandidates | passed |
| --- | --- | --- | --- | --- |
| 1 | 0 | — | 2 | true |
| 2 | 3 | KEEP/KEEP/KEEP | 2 | true |
| 3 | 3 | KEEP/UPDATE/KEEP | 2 | true |
| 4 | 3 | KEEP/UPDATE/KEEP | 2 | true |
| 5 | 3 | KEEP/UPDATE/KEEP | 2 | false |
| 6 | 3 | KEEP/UPDATE/KEEP | 2 | false |
| 7 | 0 | — | 2 | true |
| 8 | 3 | KEEP/UPDATE/UPDATE | 2 | false |

domain Gate は全 8 run で `selectedReviewers` = 3 名、`claims` = 8 件と完全に一定。schema 上の上限（最大 3 ペルソナ）に毎回張り付いており、**「必要な数だけ選ぶ」が働いた形跡がない**。

## 6. 誤検知（false positive）

判定基準を先に置く。**「指摘が事実として誤っている / 対象記事の欠陥ではない」ものだけを誤検知に数え、「指摘は正しいが軽微」は数えない。**

### 誤検知として数えたもの（2 件、いずれも journal から確認可能）

1. **段落長を字数として述べた editorial 指摘（3 run）**
   run #2「600〜810字」、run #5「837字の」、run #6「400〜650字 / 約650字 / 約520字 / 約480字」。
   記事（`git show 3728ff9:articles_note/new/harness-practice-note.md`）の**最長行は 224 文字 / 579 バイト**であり、これらの数値は文字数として成立しない。run #6 が挙げた L145 / L147 / L151 は実測で 100 / 121 / 130 文字（300 / 297 / 332 バイト）。**バイト長を字数として報告した誤りである。**
   一方 run #7 の「213字の単一段落」は L221（213 文字）と一致し、run #3 の「150〜250字」も成立範囲。**同じ Gate が run ごとに違う数え方をしている**という不安定性でもある。
   なお、行番号は run 時点と merge 後（`3728ff9`）でずれる可能性があるため、個別行の対応づけには不確実性が残る。桁の食い違い（100 文字を 650 字と報告）は行ずれでは説明できない。

2. **visual Gate が図の存在を見落とした（run #1 / run #7）**
   両 run とも `images: []`（図なし）を返しているが、**同じ run の `addCandidates` 本文が「既存のtextブロック4つ」「既存の3つのASCII図」と、図の存在を前提に書いている**。同一 run 内で自己矛盾しており、`images` 側が誤り。これは誤検知（過剰検知）ではなく**見逃し（false negative）**だが、Gate の信頼性に対する同種の欠陥として記録する。
   run #7 は READY を出した run であり、**READY 判定の visual Gate は図を 1 枚も見ていない**。

### 誤検知として数えなかったもの

- **run #8 の domain `unverified=true`（Appendix H 本文を取得できず）**
  journal に `primarySourceAccess: "partial"`、「Appendix H 本文は取得できず。目次上の…」と残る。これは**設計どおりの動作**（一次情報にアクセスできないとき推測で verified にしない）であり、記事の欠陥でも指摘の誤りでもない。UNVERIFIED を READY へ丸めないという Done 条件が実際に働いた記録として扱う。
- **domain / editorial の `medium` / `low` 指摘**
  「正しいが軽微」に該当するものが多数あるが、事実誤認の裏取りをしていないため誤検知に数えない。**採用率は計測していない**（どの指摘を記事へ反映したかの対応表が残っていない）。

### journal から拾えなかったもの

- 「記事の `区分: 個人` が読者に見える」という指摘は、grep した限り **`note-finalize` の journal には存在しない**。同一セッションの `note-thesis-review-loop`（`wf_4e8a0a6d-d63`）の findings にあり、同じ journal 内で「`md_to_wxr.py` が `区分:` 行を除去することをスクリプトで確認したため、note 本文には出力されない」と自己解決されている。**note-finalize の誤検知としては数えない。**
- 人間が run の外で口頭に近い形で棄却した指摘は記録が残っておらず、**誤検知率の分母は確定できない**。上記 2 件は「journal 単独で誤りと判定できたもの」であり、**真の誤検知率の下限**にすぎない。

## 7. Gate が検出した層の推移（harness 記事 7 run）

blockers の遷移:

```
#2 domain, editorial   ← 引用・一次情報の境界（official_fact / author_interpretation）
#3 editorial
#4 domain, editorial   ← 修正で新たに踏んだ論証の穴
#5 visual, editorial   ← domain が抜け、図と本文の整合へ移る
#6 visual, editorial
#7 (none) = READY
#8 visual              ← READY 後の加筆で図の整合が再び崩れる
```

- **前半（#2-#4）は引用の正確さと主張の分類**（domain high 5 件はすべて #1・#2・#4 に集中）。
- **中盤（#5-#6）は図と本文の用語整合**（visual が blocker に登場）。
- **終盤（#6-#8）は校正層**（editorial の `must` 1 件は #6、language の `medium` 2 件は #8 で初めて出た）。

「引用の正確さ → 論証の成立 → 図の整合 → 校正」という層の移動は観測できた。ただし **#8 で visual が再発している**ため、単調に浅くなっているわけではない。

## 8. Issue #593 Done 条件との突合（P2 に関係する範囲）

| Done 条件 | 実測 |
| --- | --- |
| 最終結果が READY / NEEDS_CHANGES / UNVERIFIED になる | 達成。8 run すべてで判定が出た |
| 画像本体を確認できない場合 UNVERIFIED になる | 部分達成。domain の一次情報 unverified は run #8 で実際に発火。**visual の UNVERIFIED は 8 run で 0 件**（代わりに図を見落とした run が 2 件ある） |
| 専門領域を自動判定し、**必要な場合だけ** Domain Expert Review が走る | **未達**。`note-finalize.js` は Domain / Language / Visual / Editorial を無条件・直列に実行する。skip の分岐は存在しない |
| Final Gate が UNVERIFIED を READY として扱わない | 達成。run #8 は unverified により READY にならない |

### 無条件実行のコストは許容範囲か

**許容範囲と判断する。**

- 1 run 11 分・5.45M トークン。5 Gate のうち 1 つを skip しても短縮は 2 分前後にとどまる（フェーズ間に大きな偏りがない）。
- domain Gate は 8 run 中 **3 run で blocker を出しており**（#1 / #2 / #4）、「不要だったのに走った」run は観測されていない。条件付き skip を入れると、この 3 件を落とすリスクのほうが大きい。
- 実運用の律速は Gate 数ではなく **NEEDS_CHANGES → 修正 → 再実行のサイクル数（harness 記事で 6 回 = 累計約 1 時間 10 分・38M トークン）** である。ここを削らない限り条件分岐の効果は小さい。

したがって条件付き実行は **P2 時点では実装しない**ことを推奨する。優先度が高いのは visual Gate の不安定性（§6-2、§5 の UPDATE がありながら `passed=true` になる run #3 / #4）の是正。

## 9. 計測できていないもの

- Final Gate 通過後に人間が追加発見した P1/P2 指摘数（記録なし）
- language-density WARN の実修正採用率（採用の対応表なし）
- Domain Expert Review の指摘採用率（同上）
- snapshot drift による abort 件数（`note-finalize` は snapshot guard を持たない。guard は `note-thesis-review-loop` 側）
- READY 後の追加修正 PR 数（READY 到達が 1 記事 1 回のため母数不足）
- 課金額

## 10. 抽出方法

一次データのディレクトリ:

```bash
cd ~/.claude/projects/-Users-user-Documents-GitHub-my-blog/814df778-784e-4a75-a9e1-aa87e586b095/subagents/workflows
```

run と対象記事の対応:

```bash
for d in wf_*/; do echo -n "$d "; \
  grep -oh "articles_note/[a-z]*/[a-z0-9-]*\.md" "$d"/agent-*.jsonl \
  | sort | uniq -c | sort -rn | head -1; done
```

所要時間とトークン（`agent-*.jsonl` の `timestamp` と `message.usage` を走査）:

```bash
node -e '
const fs=require("fs");
for(const d of fs.readdirSync(".").filter(x=>x.startsWith("wf_"))){
  let lo=Infinity, hi=-Infinity, t=0;
  for(const f of fs.readdirSync(d).filter(f=>/^agent-.*\.jsonl$/.test(f)))
    for(const l of fs.readFileSync(d+"/"+f,"utf8").split("\n").filter(Boolean)){
      let o; try{o=JSON.parse(l)}catch(e){continue}
      if(o.timestamp){const x=Date.parse(o.timestamp); if(x<lo)lo=x; if(x>hi)hi=x;}
      const u=o.message&&o.message.usage;
      if(u)t+=(u.input_tokens||0)+(u.output_tokens||0)+(u.cache_read_input_tokens||0)+(u.cache_creation_input_tokens||0);
    }
  console.log(d, Math.round((hi-lo)/1000)+"s", (t/1e6).toFixed(2)+"M");
}'
```

Gate ごとの `passed` と findings 内訳（Gate は result のキー形状で判別する。`domains`→domain、`denseEnglishClusters`→language、`images`→visual、`firstTimeReaderPassed`→editorial）:

```bash
node -e '
const fs=require("fs");
for(const d of fs.readdirSync(".").filter(x=>x.startsWith("wf_"))){
  for(const l of fs.readFileSync(d+"/journal.jsonl","utf8").split("\n").filter(Boolean)){
    let o; try{o=JSON.parse(l)}catch(e){continue}
    if(o.type!=="result")continue;
    const r=o.result, k=Object.keys(r).sort().join("|");
    const g=k.includes("domains")?"domain":k.includes("denseEnglishClusters")?"language"
      :k.includes("images")?"visual":k.includes("firstTimeReaderPassed")?"editorial":null;
    if(!g)continue;
    const c={}; (r.findings||[]).forEach(f=>{const p=f.priority||f.risk||"unset"; c[p]=(c[p]||0)+1;});
    console.log(d,g,"passed="+r.passed,JSON.stringify(c));
  }
}'
```

段落長の実測（誤検知 1 の裏取り）:

```bash
git show 3728ff9:articles_note/new/harness-practice-note.md > /tmp/hp.md
python3 -c "
ls=open('/tmp/hp.md',encoding='utf-8').read().split('\n')
print(sorted(((len(s),len(s.encode()),i+1) for i,s in enumerate(ls)),reverse=True)[:3])
"
```
