---
name: proni-article-finishing
description: 会社公式（PRONI）note 記事（articles_note/new/PRONI-*.md）を社内レビューへ出す前に、原稿・note 下書き・Google ドキュメントの3面で仕上げる工程。「PRONI 記事の仕上げ」「社内レビュー前の仕上げ」で使う。
---

# proni-article-finishing

会社公式（PRONI）記事を、社内レビューに出せる状態まで仕上げる工程の手順書。各段の判定基準は既存の正本を使い、ここには**順番・入出力・人間ゲート・委託の雛形**だけを書く。

## 既存資産との分担

| 段 | 使う正本 | 本スキルで持つもの |
| --- | --- | --- |
| WXR 生成・検証・取り込み | `note-export-import` スキル、`articles_note/README.md` | 下書き登録のタイミングと再登録（段 2） |
| 広報観点の点検 | `proni-official-precheck` スキル、`articles_note/checklists/proni-official-precheck.md` | 委託の雛形（段 5） |
| 図の作成・確認 | `diagram-design` スキル、`article-visual-review` スキル | A/B 比較と3面反映（段 4・4b） |
| 読者ペルソナ | `docs/reader-review/personas.md` | 本工程での使い方（下記の例外） |
| note エディタ操作の落とし穴 | my-blog の memory ディレクトリの `reference_note_editor_playwright.md` | 本工程で使う最小限のコード例（付録） |

## 入力

- `$1` = 原稿（`articles_note/new/PRONI-<slug>.md`）。`PRONI-` で始まらないなら止める
- 原稿の PR ブランチ、社内レビュー用 Google ドキュメントの ID、note 下書きの key（段 2 で得る）

## 人間ゲート（エージェントは実行しない／確認してから進む）

- 社内レビュー・広報への提出、Google ドキュメントの共有設定
- **未公開の会社公式記事の本文を外部 AI（Codex / Antigravity）へ渡すこと**。記事ごとに初回だけ確認する
- **レビュアーのコメント・提案が付いた Google ドキュメントを書き換えること**
- note の「公開に進む」以降の押下、旧下書きの削除
- 原稿 PR のマージ
- 図の採用版の最終決定（エージェントは推奨を添えて y/N で聞く）

## 公開リポジトリに残さないもの

社内の人名・チャンネル名・社内リポジトリ名・社内のパス・台帳 ID・内部 URL・社内数値は、原稿以外のコミット物（レビュー成果物・PR 本文・コミットメッセージ）に書かない。レビュー結果の逐語引用を含む一時成果物（統合表の下書き、外部 AI の出力、read_doc の JSON、置換リスト）は scratchpad に置き、ファイル名に slug を入れる（例: `<slug>-doc.json`）。コミットしない。

## ペルソナの使い方（本スキル固有の例外）

`docs/reader-review/personas.md` の正は「記事ごとに1人を選ぶ」。本スキルでは、**段 4 の図の A/B 比較と段 7 の全体再レビューに限り、N1・N2 の両方を使う**。会社公式記事は EM・PM と現場エンジニアの両方に読まれる前提で、片方だけだと図の好みが偏るため。

## 工程

### 1. 原稿と Google ドキュメントの一致確認

- 入力: 原稿、Doc ID
- 手順: Google Docs コネクタの `read_doc` で本文を取り、出力 JSON を scratchpad に保存して突合する

  ```bash
  node scripts/check-doc-manuscript-match.js --doc <scratchpad>/<slug>-doc.json articles_note/new/PRONI-<slug>.md
  ```

- 出力: NG（Doc の該当位置に無い原稿行。順序違い・段落欠落を含む）と WARN（短い行、Doc にだけある段落、挿入提案）。exit 2 は入力の問題（取得失敗・本文 0 文字）なので取り直す
- どちらを正とするかは著者に確認する。原稿を正とするのが既定

### 2. note 下書き登録

- 手順は `note-export-import` スキルに従う（`md_to_wxr.py` → `verify_wxr.py` → note でインポート）。`articles_note/build/` を整理する場合は、先に `npm run clean:note-build:dry` で対象を確かめる
- **取り込む前に WXR の本文が最新の原稿と一致しているか確かめる**（マージ前の原稿で作った WXR を取り込んだ先例あり）
- 出力: note 下書きの key（`https://editor.note.com/notes/<key>/edit/`）

#### 公開時の再登録

公開日は下書き作成日になるので、**公開時は最新の原稿から WXR を作り直して再登録する**。再登録した下書きには、レビュー用の下書きで手で入れた調整が残らない。新しい下書きで次を再現してから公開設定へ進む。

- [ ] 表 → 箇条書き（段 3）
- [ ] 目次（段 3）
- [ ] 図の挿入（段 4b）
- [ ] 段 6 の文言修正がすべて原稿に入っているか（原稿から作り直すので、原稿に入っていない修正は落ちる）
- [ ] draft API の body で上の4点を照合（付録 D）

レビュー用の旧下書きは、新しい下書きの照合が済むまで残す。削除は人間ゲート。

### 3. 取り込み後の手直し

- WXR 取り込みで**表は1段落に潰れる**。note エディタで箇条書きに直す（付録 A）
- 目次は「メニュー → 目次」で挿入する（付録 B）
- 確認: draft API の body で潰れた段落が残っていないこと、`table-of-contents` が1つあること

### 4. 図の要否と A/B 比較

1. 要否レビュー: Codex と Antigravity に「どこに図があると読者が助かるか／不要か」を聞く（雛形 T1）
2. 図案を2系統で作る: Claude 版（`diagram-design` スキル、PNG、style guide は「(e) keep default」）と Codex 版
3. 読者比較: N1 と N2 に、**作成者を伏せて A / B で**見せる。**A / B の割り当ては図ごとに入れ替える**（どちらが常に A かで偏らないため）（雛形 T2）
4. 採用版を推奨付きで著者に y/N で確認 → 読者の指摘を採用版に反映 → `article-visual-review` で確認

### 4b. 採用図の3面反映

1. 原稿: 原稿 PR に `articles_note/assets/<slug>-<name>.png` を追加し、本文に画像参照を入れる。`file` でサイズと寸法を確かめる（10KB 未満はプレースホルダの疑い）
2. note 下書き: 1枚ずつ挿入する。挿入位置の次の段落の先頭で `Enter` → `ArrowUp` で空段落を作る → 「メニューを開く」→「画像」→ file chooser に PNG。file chooser が残ったら、引数なしのアップロードで閉じる。挿入後に残った空段落は `Backspace` で消す（`Delete` は直後の図を消す）。アップロードできるのは `.playwright-mcp/` かリポジトリ配下のファイルのみ
3. Google ドキュメント: コネクタの `update_doc` で `insertInlineImage` を使う。URI は PR ブランチの raw URL でよい（Doc はレビュー用）。**note 本番取り込み用の WXR には PR ブランチの raw URL を使わない**（`AGENTS.md` §note 固有の `--base-url` 規約）
4. 図の参照語を見直す: 図を足すと「先の図で」「上の図」が指す先がずれる。`grep -nE '(先|上|下|次|前)の図' <原稿>` で全件確かめ、直したら段 6 の3面反映で入れる
5. 照合: 原稿の画像参照の数、draft API の body の `<figure` の数、Doc の `inlineObjects` の数が揃っていること

### 5. 過去指摘の再発確認と広報観点

- Codex に2本並べて依頼する（雛形 T3）
  - 過去の PRONI 記事で受けた指摘の再発確認（my-blog の memory ディレクトリの `feedback_proni_tense_consistency.md`・`feedback_proni_no_personal_repo_mix.md`・`feedback_redact_company_reviews_before_public.md` と既存レビュー成果物から、過去の指摘を一覧にして渡す）
  - `proni-official-precheck` の観点での確認
- 出力は段 7 の統合表へ合流させる

### 6. 文言修正の3面反映

著者の文言修正は**原稿・note 下書き・Google ドキュメントの3面に同じ置換リストで**入れる。

1. 置換リストを scratchpad に JSON で作る: `[{"old": "旧文言", "new": "新文言"}]`。old は原稿中で一意、太字やリンクの境界をまたがない単位にする
2. 原稿: `node scripts/apply-manuscript-replacements.js <list.json> <原稿> --dry-run` → 問題なければ `--dry-run` を外して適用
3. note 下書き: 付録 C の方法で1件ずつ置換し、下書き保存まで行う
4. Google ドキュメント: Google Docs コネクタの `update_doc` で `replaceAllText`（`matchCase: true`）を1件ずつ当て、応答の `occurrencesChanged` が 1 であることを確かめる。0 や 2 以上なら止めて原因を調べる。レビュアーのコメント・提案が付いている Doc は、書き換える前に著者へ確認する
5. 照合（3面すべて）
   - 原稿: `grep -c` で旧文言 0・新文言 1
   - note: draft API の body で旧文言 0・新文言あり（付録 D）
   - Doc: `read_doc` を取り直し、段 1 のスクリプトで原稿と突合して exit 0

### 7. 全体再レビュー

1. 並列で依頼する（出力は scratchpad に、名前を重複させない）
   - 編集担当: `note-article-reviewer` エージェント（機械チェック `npm run check:article-sentence-style -- <原稿>` / `check:article-language-density -- <原稿>` 込み）
   - 読者: N1・N2 の感想（雛形 T2 から比較部分を外したもの）
   - Codex（`codex-invoker`）と Antigravity（`agy --mode plan -p`、雛形 T4）
   - テーマに応じた専門視点（例: アジャイル・スクラムの記事なら `growth-core:growth-agile-coach` と `growth-core:growth-scrum-master`）
2. 統合表にまとめる（下記の書式）。**必須は誤りに近いものだけ**にし、どちらでもよい改善は任意へ回す
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

共通で必ず入れる: 対象は会社公式記事であること、review-only であること、note 表記規約（`AGENTS.md` §note 固有: ダッシュ禁止、三点リーダーは `……`、全角カッコ）、会社公式記事の一次情報は会社側の資料のみで個人リポジトリを混ぜないこと、出力は必須 / 任意の2区分。

- **T1（図の要否）**: 「次の記事を読み、図があると読者（`docs/reader-review/personas.md` の N1/N2）の理解が速くなる箇所を最大3つ、不要なら不要と答える。各箇所について図の種類・載せる要素・載せない要素を書く。」
- **T2（A/B 比較）**: 「あなたは <N1 または N2 のペルソナ本文>。記事の該当節と図 A・図 B を見て、どちらが理解しやすいか、理由、採用した方に直してほしい点を答える。作成者は伏せてある。」
- **T3（再発確認・広報観点）**:

  ```text
  入力:
  - 記事本文: <原稿の本文>
  - 過去の指摘一覧: <箇条書きの本文>
  - チェックリスト: <articles_note/checklists/proni-official-precheck.md の本文>
  観点:
  1. 過去の指摘が再発していないか（指摘ごとに 再発あり / なし）
  2. チェックリストの各カテゴリ（問題なし / 要確認 / 要修正）
  出力: | # | 区分（必須/任意） | 箇所（見出し / 行） | 逐語引用 | 指摘 | 根拠（指摘番号・カテゴリ） |
  停止条件: 入力のどれかが空・途中で切れている場合は、判定せず「入力不足: <欠けているもの>」とだけ返す。推測で補わない。
  ```

- **T4（Antigravity）**: ヘッドレスの `agy` は `read_file` の権限を求めて自動で拒否されるため、**本文をプロンプトに貼る**（2026-11-05 実測）。依頼文は T3 と同じ形にし、書き換え案を出す場合は「事実（数・時期・主語）を変えていないか」を案ごとに自己申告させる

## 付録: note エディタ操作（Playwright）

前提: 永続ログインのプロファイルを使う。操作は1件ずつ行い、毎回下書き保存して draft API で確かめる。ここに無い操作（段落の結合、末尾への見出しの追加など）と落とし穴の詳細は、my-blog の memory ディレクトリの `reference_note_editor_playwright.md` を参照する。

### A. 潰れた表を箇条書きにする

箇条書きの行は、note 上の潰れた段落からではなく**原稿の表から作る**（潰れた段落ではセルの区切りが失われている）。

```js
async (page) => {
  const target = '<潰れた段落の textContent の先頭>';
  const rows = ['<原稿の表の1行目を「列A：列B」の形にしたもの>', '<2行目>'];
  await page.evaluate((t) => {
    const p = [...document.querySelectorAll('.ProseMirror p')].find((el) => el.textContent.startsWith(t));
    const r = document.createRange();
    r.selectNodeContents(p);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }, target);
  await page.keyboard.press('Delete');
  await page.keyboard.type('- ');
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

### C. 文言を1件置換して保存・照合する

一意かどうかは、テキストノードの数ではなく**全テキストノードを合算した出現回数**で確かめる（1つのノードに2回出る場合を見落とさないため）。

```js
async (page) => {
  const [key, oldText, newText] = ['<note key>', '旧文言', '新文言'];
  const result = await page.evaluate(([o, nw]) => {
    const w = document.createTreeWalker(document.querySelector('.ProseMirror'), NodeFilter.SHOW_TEXT);
    const hits = [];
    while (w.nextNode()) {
      const v = w.currentNode.nodeValue;
      for (let i = v.indexOf(o); i !== -1; i = v.indexOf(o, i + o.length)) hits.push([w.currentNode, i]);
    }
    if (hits.length !== 1) return { replaced: false, occurrences: hits.length };
    const [node, i] = hits[0];
    const r = document.createRange();
    r.setStart(node, i); r.setEnd(node, i + o.length);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    document.execCommand('insertText', false, nw);
    return { replaced: true, occurrences: 1 };
  }, [oldText, newText]);
  if (!result.replaced) return result; // 旧文言の単位を見直す
  await page.getByRole('button', { name: '下書き保存' }).click();
  await page.waitForTimeout(3000); // 保存完了前に移動すると beforeunload が出る
  const body = await page.evaluate(async (k) =>
    (await (await fetch(`https://note.com/api/v3/notes/${k}?draft=true`)).json()).data.body, key);
  return { ...result, oldCount: body.split(oldText).length - 1, newCount: body.split(newText).length - 1 };
}
```

`oldCount` が 0、`newCount` が 1 以上なら完了。

### D. 保存後の照合

```js
async (page) => {
  const key = '<note key>';
  const body = await page.evaluate(async (k) =>
    (await (await fetch(`https://note.com/api/v3/notes/${k}?draft=true`)).json()).data.body, key);
  return {
    toc: (body.match(/table-of-contents/g) || []).length,
    figures: (body.match(/<figure/g) || []).length,
    lists: (body.match(/<ul/g) || []).length,
  };
}
```

## 出力

チャットに、段ごとの完了状況（済 / 人間ゲート待ち / 未着手）、段 7 の統合表、3面照合の結果を返す。コミットするレビュー成果物を残す場合は `reviews/note/new/PRONI-<slug>.md` に置き、§公開リポジトリに残さないもの に従って伏せる。
