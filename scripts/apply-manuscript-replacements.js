#!/usr/bin/env node
// 置換リスト JSON を note 原稿へ「一意置換」で当てる。
//
// ■ 背景
//   著者の文言修正は「原稿・note 下書き・Google ドキュメント」の3面へ同じ内容で入れる。
//   同じ置換リストを3面の正として使うため、原稿側はこのスクリプトで当て、
//   note 下書き・Doc 側は同じリストを手順どおり当ててから照合する。
//
// ■ 置換リストの形式
//   [{ "old": "旧文言", "new": "新文言" }, ...]
//   old は原稿中にちょうど1回だけ現れること。0回・2回以上なら1件も書き込まずに exit 1。
//   各 old の出現回数は、リストの前の置換を当てた後の本文で数える（順に当てる）。
//
// ■ 使い方
//   node scripts/apply-manuscript-replacements.js <replacements.json> <manuscript.md> [--dry-run]
//   node scripts/apply-manuscript-replacements.js --self-test
//   exit 0 = 全件適用 / exit 1 = 一意でない置換あり（未書き込み）/ exit 2 = 引数・形式エラー

const fs = require("fs");

const LABEL = "[apply:manuscript-replacements]";

// ---- 純関数（self-test 対象） ----

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = text.indexOf(needle);
  while (i !== -1) {
    n++;
    i = text.indexOf(needle, i + needle.length);
  }
  return n;
}

function applyReplacements(text, list) {
  const errors = [];
  let out = text;
  list.forEach((r, idx) => {
    const n = countOccurrences(out, r.old);
    if (n !== 1) {
      errors.push({ index: idx, old: r.old, count: n });
      return;
    }
    out = out.replace(r.old, () => r.new);
  });
  return { text: out, errors };
}

function validateList(list) {
  return (
    Array.isArray(list) &&
    list.every((r) => r && typeof r.old === "string" && r.old !== "" && typeof r.new === "string")
  );
}

// ---- self-test ----

function selfTest() {
  const cases = [];
  const base = "AはBです。CはDです。";
  let r = applyReplacements(base, [{ old: "AはB", new: "AはX" }]);
  cases.push(["一意なら置換", r.errors.length === 0 && r.text === "AはXです。CはDです。"]);
  r = applyReplacements(base, [{ old: "です。", new: "だ。" }]);
  cases.push(["複数出現はエラー", r.errors.length === 1 && r.errors[0].count === 2]);
  r = applyReplacements(base, [{ old: "Z", new: "Y" }]);
  cases.push(["0回はエラー", r.errors.length === 1 && r.errors[0].count === 0]);
  r = applyReplacements(base, [{ old: "B", new: "E" }, { old: "E", new: "F" }]);
  cases.push(["順に当てる", r.errors.length === 0 && r.text === "AはFです。CはDです。"]);
  r = applyReplacements(base, [{ old: "B", new: "$&$&" }]);
  cases.push(["$ を特殊文字として扱わない", r.text === "Aは$&$&です。CはDです。"]);
  cases.push(["形式チェック", validateList([{ old: "a", new: "" }]) && !validateList([{ old: "", new: "b" }]) && !validateList({})]);
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
  const dryRun = argv.includes("--dry-run");
  const [listPath, mdPath] = argv.filter((a) => a !== "--dry-run");
  if (!listPath || !mdPath) {
    console.error(`${LABEL} usage: <replacements.json> <manuscript.md> [--dry-run]`);
    process.exit(2);
  }
  let list, text;
  try {
    list = JSON.parse(fs.readFileSync(listPath, "utf8"));
    text = fs.readFileSync(mdPath, "utf8");
  } catch (e) {
    console.error(`${LABEL} ${e.message}`);
    process.exit(2);
  }
  if (!validateList(list)) {
    console.error(`${LABEL} 置換リストは [{"old": "...", "new": "..."}] の配列にする（old は空にしない）`);
    process.exit(2);
  }
  const result = applyReplacements(text, list);
  if (result.errors.length) {
    for (const e of result.errors) console.log(`#${e.index}: ${e.count} 回出現（1 回にする）: ${e.old.slice(0, 60)}`);
    console.log(`${LABEL} 一意でない置換が ${result.errors.length} 件あるため書き込まない`);
    process.exit(1);
  }
  if (!dryRun) fs.writeFileSync(mdPath, result.text);
  console.log(`${LABEL} ${list.length} 件を${dryRun ? "適用可能（dry-run）" : "適用"}: ${mdPath}`);
  process.exit(0);
}

main(process.argv.slice(2));
