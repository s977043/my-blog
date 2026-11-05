---
name: proni-article-finishing
description: 会社公式（PRONI）note 記事（articles_note/new/PRONI-*.md）を、社内レビューへ出す前に仕上げる工程（原稿と Google ドキュメントの一致確認 → note 下書き登録 → 表・目次の手直し → 図の要否と A/B 比較 → 過去指摘の再発確認 → 文言修正の3面反映 → 全体再レビュー）を順に進める。「PRONI 記事の仕上げ」「社内レビュー前の仕上げ」「会社公式記事を下書きまで整えて」で使う。
---

# proni-article-finishing

会社公式（PRONI）記事を、社内レビューに出せる状態まで仕上げる工程の手順書。各段の判定基準は既存の正本を使い、ここには**順番・入出力・人間ゲート・委託の雛形**だけを書く。

## 既存資産との分担

| 段 | 使う正本 | 本スキルで持つもの |
| --- | --- | --- |
| WXR 生成・検証・取り込み | `note-export-import` スキル、`articles_note/README.md` | 下書き登録のタイミング（段 2） |
| 広報観点の点検 | `proni-official-precheck` スキル、`articles_note/checklists/proni-official-precheck.md` | 委託の雛形（段 5） |
| 図の作成・確認 | `diagram-design` スキル、`article-visual-review` スキル | A/B 比較の手順（段 4） |
| 読者ペルソナ | `docs/reader-review/personas.md`（N1 / N2） | 比較・感想の依頼文 |
| note エディタ操作の落とし穴 | memory `reference_note_editor_playwright.md` | 本工程で使う操作のコード例（付録） |

## 入力

- `$1` = 原稿（`articles_note/new/PRONI-<slug>.md`）。`PRONI-` で始まらないなら止める
- 原稿の PR ブランチ、社内レビュー用 Google ドキュメントの ID、note 下書きの key（段 2 で得る）

## 人間ゲート（エージェントは実行しない）

- 社内レビュー・広報への提出、Google ドキュメントの共有設定
- note の「公開に進む」以降の押下
- 原稿 PR のマージ
- 図の採用版の最終決定（エージェントは推奨を添えて y/N で聞く）

## 工程

### 1. 原稿と Google ドキュメントの一致確認

- 入力: 原稿、Doc ID
- 手順: Google Docs コネクタの `read_doc` で本文を取り、出力 JSON を scratchpad に保存して突合する

  ```bash
  node scripts/check-doc-manuscript-match.js --doc <scratchpad>/<slug>-doc.json articles_note/new/PRONI-<slug>.md
  ```

- 出力: 不一致行の一覧（`<path>:<行>`）。どちらを正とするかは著者に確認する。原稿を正とするのが既定

### 2. note 下書き登録

- 手順は `note-export-import` スキルに従う（`md_to_wxr.py` → `verify_wxr.py` → `npm run clean:note-build` → note でインポート）
- **取り込む前に WXR の本文が最新の原稿と一致しているか確かめる**（マージ前の原稿で作った WXR を取り込んだ先例あり）
- 公開日は下書き作成日になるので、**公開時は再登録する前提**で作る。今回の下書きはレビュー用と明記する
- 出力: note 下書きの key（`https://editor.note.com/notes/<key>/edit/`）

### 3. 取り込み後の手直し

- WXR 取り込みで**表は1段落に潰れる**。note エディタで箇条書きに直す（付録 A）
- 目次は「メニュー → 目次」で挿入する（付録 B）
- 確認: API の body で `<table>` 由来の潰れた段落が残っていないこと、`table-of-contents` が1つあること

### 4. 図の要否と A/B 比較

1. 要否レビュー: Codex と Antigravity に「どこに図があると読者が助かるか／不要か」を聞く（雛形 T1）
2. 図案を2系統で作る: Claude 版（`diagram-design` スキル、PNG、style guide は「(e) keep default」）と Codex 版
3. 読者比較: N1 と N2 に、**作成者を伏せて A / B で**見せる。**A / B の割り当ては図ごとに入れ替える**（どちらが常に A かで偏らないため）（雛形 T2）
4. 採用版を推奨付きで著者に y/N で確認 → 読者の指摘を採用版に反映 → `article-visual-review` で確認
- 注意: 図を足すと「先の図で」「上の図」など本文の図参照が指す先がずれる。図を足したら `grep -nE '(先|上|下|次)の図' <原稿>` で全件見直す

### 5. 過去指摘の再発確認と広報観点

- Codex に2本並べて依頼する（雛形 T3）
  - 過去の PRONI 記事で受けた指摘の再発確認（memory の `feedback_proni_*` と既存レビュー成果物を入力に渡す。時制の混在は社内レビューで繰り返し指摘されている）
  - `proni-official-precheck` の観点での確認
- 出力は段 7 の統合表へ合流させる

### 6. 文言修正の3面反映

著者の文言修正は**原稿・note 下書き・Google ドキュメントの3面に同じ置換リストで**入れる。

1. 置換リストを scratchpad に JSON で作る: `[{"old": "旧文言", "new": "新文言"}]`。old は原稿中で一意、太字やリンクの境界をまたがない単位にする
2. 原稿: `node scripts/apply-manuscript-replacements.js <list.json> <原稿> --dry-run` → 問題なければ `--dry-run` を外して適用
3. note 下書き: 付録 C の方法で1件ずつ置換 → 下書き保存
4. Google ドキュメント: コネクタの更新で同じ置換を当てる
5. 照合（3面すべて）
   - 原稿: `grep -c` で旧文言 0・新文言 1
   - note: `https://note.com/api/v3/notes/<key>?draft=true` の `data.body` で旧文言 0・新文言あり（付録 D）
   - Doc: `read_doc` を取り直し、段 1 のスクリプトで原稿と突合して exit 0

### 7. 全体再レビュー

1. 並列で依頼する（出力先は重複させない）
   - 編集担当: `note-article-reviewer` エージェント（機械チェック `npm run check:article-sentence-style -- <原稿>` / `check:article-language-density -- <原稿>` 込み）
   - 読者: N1・N2 の感想（雛形 T2 の比較部分を外したもの）
   - Codex（`codex-invoker`）と Antigravity（`agy --mode plan -p`、雛形 T4）
   - テーマに応じた専門視点（例: アジャイル・スクラムの記事なら `growth-core:growth-agile-coach` と `growth-core:growth-scrum-master`）
2. 統合表にまとめる（下記の書式）。**必須は誤りに近いものだけ**、どちらでもよい改善は任意へ
3. 必須を反映（段 6 の3面反映を使う）→ 構成チェック・ペルソナ感想・前回と別の視点の Codex / Antigravity で再確認

#### レビュー統合表の書式

```markdown
| # | 区分 | 箇所（見出し / 行） | 指摘 | 出所 | 一次情報での確認 | 対応 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 必須 | §2 / L48 | 「〜した」と「〜です」が同じ段落で混在 | Codex, 編集担当 | 原稿 L48 で確認 | 反映（3面） |
| 2 | 任意 | §4 | 例を1つ足すと伝わりやすい | N2 | — | 公開後に検討 |
```

- 区分は「必須 / 任意」の2つ。複数の出所が同じ指摘をしたら1行にまとめ、出所に並べる
- 事実を変える書き換え案は、一次情報で確かめてから採否を決める（Antigravity の書き換え案が事実を変えた先例あり）

## 委託プロンプトの雛形

共通で必ず入れる: 対象は会社公式記事であること、note 表記規約（`AGENTS.md` §note 固有: ダッシュ禁止、三点リーダーは `……`、全角カッコ）、review-only であること、出力は必須 / 任意の2区分。会社公式記事の一次情報は会社側の資料のみで、個人リポジトリを混ぜないこと。

- **T1（図の要否）**: 「次の記事を読み、図があると読者（`docs/reader-review/personas.md` の N1/N2）の理解が速くなる箇所を最大3つ、不要なら不要と答える。各箇所について図の種類・載せる要素・載せない要素を書く。」
- **T2（A/B 比較）**: 「あなたは <N1 または N2 のペルソナ本文>。記事の該当節と図 A・図 B を見て、どちらが理解しやすいか、理由、採用した方に直してほしい点を答える。作成者は伏せてある。」
- **T3（再発確認・広報観点）**: 「過去の指摘一覧 <箇条書き> が次の原稿で再発していないか、該当箇所を逐語引用で示す。続けて `articles_note/checklists/proni-official-precheck.md` の観点で確認する。」
- **T4（Antigravity）**: Antigravity はファイルを読めないので、**本文をプロンプトに貼る**。依頼文は T3 と同じ形にし、書き換え案には「事実を変えていないか」を自己申告させる

## 付録: note エディタ操作（Playwright）

前提: 永続ログインのプロファイルを使う。アップロードできるのは `.playwright-mcp/` かリポジトリ配下のファイルのみ。操作は1件ずつ行い、毎回下書き保存して API で確かめる。

### A. 潰れた表を箇条書きにする

```js
async (page) => {
  const target = '列A 列B 値1 値2'; // 潰れた段落の textContent の先頭
  await page.evaluate((t) => {
    const p = [...document.querySelectorAll('.ProseMirror p')].find((el) => el.textContent.startsWith(t));
    const r = document.createRange();
    r.selectNodeContents(p);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }, target);
  await page.keyboard.press('Delete');
  await page.keyboard.type('- ');
  const rows = ['値1: 説明', '値2: 説明'];
  for (const [i, row] of rows.entries()) {
    await page.evaluate((t) => document.execCommand('insertText', false, t), row);
    if (i < rows.length - 1) await page.keyboard.press('Enter');
  }
}
```

### B. 目次を入れる・段落を新設する

- 目次: 入れたい位置の空段落にキャレットを置き、「メニューを開く」→「目次」（`#toc-setting`）
- 段落末で `Enter` を押すと `<br>` になる。**段落を新設するときは次の見出しの先頭で `Enter` → `ArrowUp`**
- 空段落を消すときは **`Backspace`** を使う。`Delete` は直後の `figure`（図）を消す

### C. 文言を1件置換する

```js
async (page) => {
  const [oldText, newText] = ['旧文言', '新文言'];
  const n = await page.evaluate(([o, nw]) => {
    const w = document.createTreeWalker(document.querySelector('.ProseMirror'), NodeFilter.SHOW_TEXT);
    const hits = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.includes(o)) hits.push(w.currentNode);
    if (hits.length !== 1) return hits.length;
    const node = hits[0], i = node.nodeValue.indexOf(o);
    const r = document.createRange();
    r.setStart(node, i); r.setEnd(node, i + o.length);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.execCommand('insertText', false, nw);
    return 1;
  }, [oldText, newText]);
  return n; // 1 以外なら置換していない。旧文言の単位を見直す
}
```

### D. 保存後の照合

```js
async (page) => {
  const key = '<note key>';
  const res = await page.evaluate(async (k) => (await (await fetch(`https://note.com/api/v3/notes/${k}?draft=true`)).json()).data.body, key);
  return { oldCount: res.split('旧文言').length - 1, hasNew: res.includes('新文言'), toc: res.includes('table-of-contents') };
}
```

## 出力

チャットに、段ごとの完了状況（済 / 人間ゲート待ち / 未着手）、段 7 の統合表、3面照合の結果を返す。レビュー成果物を残す場合は `reviews/note/new/PRONI-<slug>.md` に置き、社内の人名・チャンネル名・社内数値は伏せる。
