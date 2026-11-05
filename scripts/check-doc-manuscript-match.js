#!/usr/bin/env node
// Check: note 原稿（Markdown）の本文行が、社内レビュー用 Google ドキュメントの本文に含まれるかを突合する。
//
// ■ 背景
//   会社公式（PRONI）記事は「原稿・note 下書き・Google ドキュメント」の3面で同じ本文を保つ。
//   著者の文言修正を3面へ反映したあと、Doc 側だけ反映漏れになる事故を機械的に拾う。
//
// ■ 入力
//   --doc <path>   Google Docs コネクタ read_doc の出力を保存した JSON（または素のテキスト）。
//                  JSON は構造を問わず、文字列値をすべて連結して本文とみなす。
//   <manuscript>   articles_note/new/PRONI-*.md
//
// ■ 比較方法
//   原稿は frontmatter・コードブロック・画像行・空行を除き、Markdown 記法（見出し記号・箇条書き記号・
//   強調・リンク記法）を外した文字列にする。両者とも空白を除去して比較する（Doc の改行・表の分割を吸収）。
//
// ■ 使い方
//   node scripts/check-doc-manuscript-match.js --doc <read_doc.json> <manuscript.md>
//   node scripts/check-doc-manuscript-match.js --self-test
//   exit 0 = 全行一致 / exit 1 = 不一致行あり / exit 2 = 引数・読み込みエラー

const fs = require("fs");

const LABEL = "[check:doc-manuscript-match]";

// ---- 純関数（self-test 対象） ----

function collectStrings(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

// Google Docs API 形式なら textRun の content だけを拾う（リンク URL や書式値が本文の間に挟まらないように）。
function collectContents(value, out) {
  if (Array.isArray(value)) value.forEach((v) => collectContents(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "content" && typeof v === "string") out.push(v);
      else collectContents(v, out);
    }
  }
  return out;
}

function docTextFrom(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  const contents = collectContents(parsed, []);
  return contents.length ? contents.join("") : collectStrings(parsed, []).join("\n");
}

// 空白と全角コロンを除く（原稿の「A：B」と Doc の表セル「A」「B」を同一視する）。
function normalize(s) {
  return s.replace(/[\s：]+/g, "");
}

// md_to_wxr.py の META_LINE_RE と同じ規則。WXR に出ない行なので突合しない。
const META_LINE_RE = /^>\s*(?:出典|公開状態|更新|区分)\s*[:：]/;

function stripMarkdown(line) {
  return line
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .replace(/^#{1,6}\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

function manuscriptLines(md) {
  const lines = md.split(/\r?\n/);
  let start = 0;
  if (lines[0] && lines[0].trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) start = end + 1;
  }
  const result = [];
  let inFence = false;
  for (let i = start; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || META_LINE_RE.test(raw)) continue;
    if (/^\s*\|?\s*:?-{3,}/.test(raw) || /^\s*-{3,}\s*$/.test(raw)) continue;
    const cells = raw.trim().startsWith("|")
      ? raw.split("|").map((c) => stripMarkdown(c)).filter(Boolean)
      : [stripMarkdown(raw)];
    for (const text of cells) {
      if (text && !/^<!--.*-->$/.test(text)) result.push({ line: i + 1, text });
    }
  }
  return result;
}

function findMissing(md, docRaw) {
  const doc = normalize(docTextFrom(docRaw));
  return manuscriptLines(md).filter(({ text }) => !doc.includes(normalize(text)));
}

// ---- self-test ----

function selfTest() {
  const cases = [];
  const md = [
    "---",
    "title: x",
    "---",
    "# 見出し",
    "",
    "本文の **強調** と [リンク](https://example.com) です。",
    "- 箇条書き",
    "| 列A | 列B |",
    "| --- | --- |",
    "| 値1 | 値2 |",
    "```bash",
    "echo code",
    "```",
    "![図](../assets/a.png)",
  ].join("\n");
  const doc = JSON.stringify({ body: ["見出し", "本文の 強調 と リンク です。", "箇条書き", "列A", "列B", "値1", "値2"] });
  cases.push(["一致", findMissing(md, doc).length === 0]);
  cases.push(["素のテキストも読める", findMissing(md, "見出し\n本文の強調とリンクです。\n箇条書き 列A 列B 値1 値2").length === 0]);
  const missing = findMissing(md, JSON.stringify({ body: "見出し 本文の強調とリンクです。 列A 列B 値1 値2" }));
  cases.push(["欠落行を行番号つきで返す", missing.length === 1 && missing[0].line === 7 && missing[0].text === "箇条書き"]);
  cases.push(["frontmatter とコードは対象外", !manuscriptLines(md).some((l) => /title|echo/.test(l.text))]);
  cases.push(["メタ行は対象外", manuscriptLines("> 区分: 会社公式\n> 更新：2026-11-05\n> 引用です").length === 1]);
  cases.push(["Markdown エスケープを外す", findMissing("みね（@mine\\_take）です。", "みね（@mine_take）です。").length === 0]);
  const apiDoc = JSON.stringify({
    body: { content: [{ paragraph: { elements: [
      { textRun: { content: "前に", textStyle: {} } },
      { textRun: { content: "『記事』", textStyle: { link: { url: "https://example.com/a" } } } },
      { textRun: { content: "を書いた。\n", textStyle: {} } },
    ] } }] },
  });
  cases.push(["リンク行は Doc API の content だけと比べる", findMissing("前に[『記事』](https://example.com/a)を書いた。", apiDoc).length === 0]);
  cases.push(["自動リンクの山括弧を外す", findMissing("<https://example.com/jobs?x=1>", "https://example.com/jobs?x=1").length === 0]);
  cases.push(["箇条書きの「A：B」と表セル A・B を同一視", findMissing("- 週1回：繰り返しを探す", JSON.stringify({ body: { content: [{ textRun: { content: "週1回\n" } }, { textRun: { content: "繰り返しを探す\n" } }] } })).length === 0]);
  let failed = 0;
  for (const [name, ok] of cases) {
    console.log(`${ok ? "ok" : "NG"} - ${name}`);
    if (!ok) failed++;
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
  const missing = findMissing(md, doc);
  for (const m of missing) console.log(`${mdPath}:${m.line}: Doc に見つからない: ${m.text.slice(0, 60)}`);
  console.log(`${LABEL} ${missing.length === 0 ? "OK" : `${missing.length} 行が Doc に見つからない`}`);
  process.exit(missing.length ? 1 : 0);
}

main(process.argv.slice(2));
