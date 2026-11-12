#!/usr/bin/env node
// Check: note 原稿（Markdown）の本文が、社内レビュー用 Google ドキュメントの本文と同じ順序で揃っているかを突合する。
//
// ■ 背景
//   会社公式（PRONI）記事は「原稿・note 下書き・Google ドキュメント」の3面で同じ本文を保つ。
//   著者の文言修正を3面へ反映したあと、Doc 側だけ反映漏れ・順序違い・段落欠落になる事故を機械的に拾う。
//
// ■ 入力
//   --doc <path>   Google Docs コネクタ read_doc の出力を保存した JSON（または素のテキスト）。
//                  Docs API 形式なら textRun の content を段落ごとに読み、表セルを区別する。
//                  削除提案（suggestedDeletionIds）の textRun は除外し、挿入提案は WARN にする。
//   <manuscript>   articles_note/new/PRONI-*.md
//
// ■ 比較方法
//   - 原稿は frontmatter・コード・画像・メタ行（md_to_wxr.py の META_LINE_RE と同じ規則）・HTML コメントを除き、
//     Markdown 記法を外す。空白と全角コロンは比較時に無視する
//   - 原稿の順序どおりに Doc の段落を前へ進めながら探す（逐次検索）。見つからない行は NG で、カーソルは進めない
//   - 原稿の新しい段落（空行の後・見出し・箇条書きの項目・表セル）は Doc の段落の先頭から一致させる。
//     同じ段落の続きの行は、直前の一致の後ろで部分一致でよい
//   - 「A：B」の行は「A」「B」を順に探す（Doc の表セル A・B と同一視）
//   - 短い行（6文字未満）は一致しても WARN、Doc にあって原稿に無い段落（表セル以外）も WARN で列挙する
//
// ■ 使い方
//   node scripts/check-doc-manuscript-match.js --doc <read_doc.json> <manuscript.md>
//   node scripts/check-doc-manuscript-match.js --self-test
//   exit 0 = 一致（WARN は残りうる）/ exit 1 = 不一致行あり / exit 2 = 引数・入力エラー

const fs = require("fs");

const LABEL = "[check:doc-manuscript-match]";
const SHORT_LINE = 6;

// md_to_wxr.py の META_LINE_RE と同じ規則。WXR に出ない行なので突合しない。
const META_LINE_RE = /^>\s*(?:出典|公開状態|更新|区分)\s*[:：]/;

// ---- 純関数（self-test 対象） ----

function normalize(s) {
  return s.replace(/[\s：]+/g, "");
}

// Docs API 形式の JSON から段落を取り出す。API 形式でなければ null。
function docParagraphsFromApi(parsed) {
  const paras = [];
  let found = false;
  let suggestedInsertions = 0;
  function walk(value, inTable) {
    if (Array.isArray(value)) return value.forEach((v) => walk(v, inTable));
    if (!value || typeof value !== "object") return;
    if (value.paragraph && Array.isArray(value.paragraph.elements)) {
      found = true;
      let text = "";
      for (const el of value.paragraph.elements) {
        const run = el && el.textRun;
        if (!run || typeof run.content !== "string") continue;
        if (run.suggestedDeletionIds && run.suggestedDeletionIds.length) continue;
        if (run.suggestedInsertionIds && run.suggestedInsertionIds.length) suggestedInsertions++;
        text += run.content;
      }
      for (const part of text.split(/[\n\u000b]/)) paras.push({ text: part, inTable });
      return;
    }
    for (const [k, v] of Object.entries(value)) walk(v, inTable || k === "table");
  }
  walk(parsed, false);
  return found ? { paras, suggestedInsertions } : null;
}

function collectStrings(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

// returns { paras: [{text, norm, inTable}], suggestedInsertions, error }
function parseDoc(raw) {
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "error" in parsed) {
    return { error: `Doc の JSON に error がある: ${JSON.stringify(parsed.error).slice(0, 120)}` };
  }
  let result;
  if (parsed === null) result = { paras: raw.split(/\r?\n/).map((t) => ({ text: t, inTable: false })), suggestedInsertions: 0 };
  else {
    result = docParagraphsFromApi(parsed) || {
      paras: collectStrings(parsed, []).join("\n").split(/\n/).map((t) => ({ text: t, inTable: false })),
      suggestedInsertions: 0,
    };
  }
  result.paras = result.paras.map((p) => ({ ...p, norm: normalize(p.text) })).filter((p) => p.norm);
  if (result.paras.length === 0) return { error: "Doc の本文が 0 文字" };
  return result;
}

function stripMarkdown(line) {
  return line
    .replace(/<!--.*?-->/g, "")
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/(^|[^\w\\])([*_])(?=\S)(.+?)(?<=[^\s\\])\2(?!\w)/g, "$1$3")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .trim();
}

// returns [{ line, text, newPara }]
function manuscriptLines(md) {
  const lines = md.split(/\r?\n/);
  let start = 0;
  if (lines[0] && lines[0].trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) start = end + 1;
  }
  const result = [];
  let inFence = false;
  let inComment = false;
  let afterBlank = true;
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      afterBlank = true;
      continue;
    }
    if (inFence) continue;
    if (inComment) {
      if (raw.includes("-->")) inComment = false;
      afterBlank = true;
      continue;
    }
    if (/^\s*<!--/.test(raw) && !raw.includes("-->")) {
      inComment = true;
      continue;
    }
    if (raw.trim() === "") {
      afterBlank = true;
      continue;
    }
    if (META_LINE_RE.test(raw) || /^\s*\|?\s*:?-{3,}/.test(raw) || /^\s*-{3,}\s*$/.test(raw)) {
      afterBlank = true;
      continue;
    }
    const isTable = raw.trim().startsWith("|");
    const isBlockStart = /^\s*(#{1,6}\s|[-*+]\s|\d+\.\s)/.test(raw);
    const cells = isTable ? raw.split("|").map((c) => stripMarkdown(c)).filter(Boolean) : [stripMarkdown(raw)];
    let first = true;
    for (const text of cells) {
      if (!text) continue;
      result.push({ line: i + 1, text, newPara: isTable || afterBlank || isBlockStart || !first });
      first = false;
    }
    afterBlank = isTable;
  }
  return result;
}

// Doc 段落を前へ進めながら1行を探す。見つかれば新しいカーソル、無ければ null。
function matchLine(paras, cursor, item) {
  const parts = item.text.split("：").map(normalize).filter(Boolean);
  if (parts.length === 0) return { cursor, used: [] };
  let cur = { ...cursor };
  const used = [];
  for (const [pi, part] of parts.entries()) {
    const mustStart = pi === 0 && item.newPara;
    let hit = null;
    for (let p = cur.p; p < paras.length; p++) {
      const from = p === cur.p ? cur.off : 0;
      if (mustStart) {
        if (from > 0) continue;
        if (paras[p].norm.startsWith(part)) hit = { p, off: part.length };
      } else {
        const idx = paras[p].norm.indexOf(part, from);
        if (idx !== -1) hit = { p, off: idx + part.length };
      }
      if (hit) break;
    }
    if (!hit) return null;
    used.push(hit.p);
    cur = hit.off >= paras[hit.p].norm.length ? { p: hit.p + 1, off: 0 } : hit;
  }
  return { cursor: cur, used };
}

function compare(md, docRaw) {
  const doc = parseDoc(docRaw);
  if (doc.error) return { error: doc.error };
  const items = manuscriptLines(md);
  if (items.length === 0) return { error: "原稿の比較対象が 0 行" };
  const missing = [];
  const warnings = [];
  const matched = new Set();
  let cursor = { p: 0, off: 0 };
  for (const item of items) {
    const r = matchLine(doc.paras, cursor, item);
    if (!r) {
      missing.push(item);
      continue;
    }
    cursor = r.cursor;
    r.used.forEach((p) => matched.add(p));
    if (normalize(item.text).length < SHORT_LINE) warnings.push(`L${item.line}: 短い行のため一致の確度が低い: ${item.text}`);
  }
  doc.paras.forEach((p, i) => {
    if (!matched.has(i) && !p.inTable) warnings.push(`Doc にあって原稿に無い段落: ${p.text.trim().slice(0, 60)}`);
  });
  if (doc.suggestedInsertions) warnings.push(`Doc に挿入提案が ${doc.suggestedInsertions} 件ある（未承認の提案を含めて比較した）`);
  return { compared: items.length, missing, warnings };
}

// ---- self-test ----

function selfTest() {
  const cases = [];
  const ok = (md, doc) => {
    const r = compare(md, doc);
    return !r.error && r.missing.length === 0;
  };
  const api = (paras) =>
    JSON.stringify({ body: { content: paras.map((p) => ({ paragraph: { elements: (Array.isArray(p) ? p : [p]).map((c) => ({ textRun: typeof c === "string" ? { content: c } : c })) } })) } });
  const md = [
    "---", "title: x", "---", "# 見出し", "",
    "本文の **強調** と [リンク](https://example.com) です。", "- 箇条書きの項目",
    "| 列A | 列B |", "| --- | --- |", "| 値1 | 値2 |",
    "```bash", "echo code", "```", "![図](../assets/a.png)",
  ].join("\n");
  cases.push(["一致（素のテキスト）", ok(md, "見出し\n本文の強調とリンクです。\n箇条書きの項目\n列A\n列B\n値1\n値2")]);
  let r = compare(md, "見出し\n本文の強調とリンクです。\n列A\n列B\n値1\n値2");
  cases.push(["欠落行を行番号つきで返す", r.missing.length === 1 && r.missing[0].line === 7]);
  cases.push(["frontmatter とコードは対象外", !manuscriptLines(md).some((l) => /title|echo/.test(l.text))]);
  cases.push(["比較行数を返す", compare(md, "見出し\n本文の強調とリンクです。\n箇条書きの項目\n列A\n列B\n値1\n値2").compared === 7]);
  cases.push(["メタ行は対象外", manuscriptLines("> 区分: 会社公式\n> 更新：2026-11-05\n\n> 引用です").length === 1]);
  cases.push(["Markdown エスケープを外す", ok("みね（@mine\\_take）です。", "みね（@mine_take）です。")]);
  cases.push(["リンク行は Docs API の content だけと比べる", ok("前に[『記事』](https://example.com/a)を書いた。",
    api([["前に", { content: "『記事』", textStyle: { link: { url: "https://example.com/a" } } }, "を書いた。\n"]]))]);
  cases.push(["自動リンクの山括弧を外す", ok("<https://example.com/jobs?x=1>", "https://example.com/jobs?x=1")]);
  cases.push(["箇条書きの「A：B」と表セル A・B を同一視", ok("- 週1回：繰り返しを探す", "週1回\n繰り返しを探す")]);
  r = compare("# T\n\nAIは便利です。\n\nはい。\n\n結論は A です。\n\n- 週1回：確認\n\n結果は100%です。",
    api(["結論は A です。\n", "AIは便利です。はい。\n", "週1回確認\n", "結果は100%です。\n"]));
  cases.push(["段落の欠落（別段落が Doc で連結）と順序違いを検出", r.missing.map((m) => m.text).join("|") === "T|はい。|結論は A です。"]);
  r = compare("AIの話です。\n\nはい。", "AIの話です。\nはい。");
  cases.push(["短い行は一致しても WARN", r.missing.length === 0 && r.warnings.some((w) => w.includes("短い行"))]);
  r = compare("残す文です。", api([[{ content: "残す文です。" }, { content: "消す提案。", suggestedDeletionIds: ["s1"] }, "\n"]]));
  cases.push(["削除提案の textRun は除外", r.missing.length === 0 && !r.warnings.some((w) => w.includes("消す"))]);
  r = compare("本文です。", api([[{ content: "本文です。", suggestedInsertionIds: ["s2"] }, "\n"]]));
  cases.push(["挿入提案は WARN", r.warnings.some((w) => w.includes("挿入提案"))]);
  cases.push(["比較対象 0 行はエラー", !!compare("---\ntitle: x\n---\n", "本文").error]);
  cases.push(["Doc 本文 0 文字はエラー", !!compare("本文です。", "  \n").error]);
  cases.push(["error キーの JSON はエラー", !!compare("本文です。", JSON.stringify({ error: { code: 403 } })).error]);
  r = compare("原稿にある本文です。", JSON.stringify({ body: { content: [
    { paragraph: { elements: [{ textRun: { content: "原稿にある本文です。\n余計な段落です。\n" } }] } },
    { table: { tableRows: [{ tableCells: [{ content: [{ paragraph: { elements: [{ textRun: { content: "セル\n" } }] } }] }] }] } },
  ] } }));
  cases.push(["Doc にだけある段落を WARN（表セルは除外）", r.warnings.length === 1 && r.warnings[0].includes("余計な段落")]);
  cases.push(["斜体と HTML コメントを外す", ok("これは *斜体* と _下線_ です。<!-- メモ -->", "これは斜体と下線です。")]);
  let failed = 0;
  for (const [name, pass] of cases) {
    console.log(`${pass ? "ok" : "NG"} - ${name}`);
    if (!pass) failed++;
  }
  console.log(`${LABEL} self-test: ${cases.length - failed}/${cases.length} passed`);
  process.exit(failed ? 1 : 0);
}

// ---- main ----

function main(argv) {
  if (argv.includes("--self-test")) return selfTest();
  const di = argv.indexOf("--doc");
  const docPath = di >= 0 ? argv[di + 1] : null;
  const mdPath = argv.filter((a, i) => a !== "--doc" && i !== di + 1)[0];
  if (!docPath || !mdPath) {
    console.error(`${LABEL} usage: --doc <read_doc.json> <manuscript.md>`);
    process.exit(2);
  }
  let md, doc;
  try {
    md = fs.readFileSync(mdPath, "utf8");
    doc = fs.readFileSync(docPath, "utf8");
  } catch (e) {
    console.error(`${LABEL} ${e.message}`);
    process.exit(2);
  }
  const r = compare(md, doc);
  if (r.error) {
    console.error(`${LABEL} ${r.error}`);
    process.exit(2);
  }
  for (const m of r.missing) console.log(`${mdPath}:${m.line}: Doc の該当位置に見つからない: ${m.text.slice(0, 60)}`);
  for (const w of r.warnings) console.log(`WARN ${w}`);
  console.log(`${LABEL} 比較 ${r.compared} 行 / NG ${r.missing.length} / WARN ${r.warnings.length}`);
  process.exit(r.missing.length ? 1 : 0);
}

main(process.argv.slice(2));
