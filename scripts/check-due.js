#!/usr/bin/env node
// Check: 期限付きの約束（計測・観測・反映待ちなど）の期限切れと接近を表示する。
//
// ■ 背景
//   2026-10-04 07:02 JST が期限だった X 告知実験（EXP-20261001-001）の計測が、リポジトリ外の
//   メモにしか書かれておらず約 26 時間遅れ、72h 値が取れなかった。期限を `docs/due-items.json`
//   に機械が読める形で残し、このスクリプトで見えるようにする。
//
// ■ 判定
//   - `done: false` の項目を、期限切れ（overdue）と 72 時間以内（soon）に分けて表示し、残りの件数も出す
//   - 既定は exit 0。`--strict` のときだけ期限切れがあれば exit 1
//   - JSON の形式エラー（必須キー欠落、due が解釈できない・タイムゾーンが無い、id の重複）はどのモードでも exit 1
//
// ■ `npm run check` に入れない理由
//   期限切れは記事やスクリプトの不備ではなく、時間の経過で起きる。集約 check に入れると、期限を
//   過ぎた時点で無関係な記事の PR まで CI が落ちて止まる。期限の確認は `npm run check:due` を
//   単独で実行する。形式の検証は `test:due`（self-test）で CI に載せている。
//
// ■ 使い方
//   npm run check:due
//   npm run check:due -- --strict
//   npm run check:due -- --now 2026-10-25T00:00:00+09:00
//   npm run test:due    # = node scripts/check-due.js --self-test

const fs = require("fs");
const path = require("path");

const LABEL = "[check:due]";
const DUE_PATH = "docs/due-items.json";
const SOON_HOURS = 72;
const HOUR_MS = 60 * 60 * 1000;
const ISO_WITH_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// ---- 純関数（self-test 対象） ----

function parseInstant(s) {
  if (typeof s !== "string" || !ISO_WITH_TZ.test(s)) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function validate(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return ["top-level must be an object"];
  if (obj.version !== 1) errors.push("version must be 1");
  if (!Array.isArray(obj.items)) return [...errors, "`items` must be an array"];
  const seen = new Set();
  obj.items.forEach((it, i) => {
    const at = `items[${i}]${it && typeof it.id === "string" ? ` (${it.id})` : ""}`;
    if (!it || typeof it !== "object" || Array.isArray(it)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const k of ["id", "due", "what", "source"]) {
      if (typeof it[k] !== "string" || !it[k].trim()) errors.push(`${at}: \`${k}\` is required (non-empty string)`);
    }
    if (typeof it.done !== "boolean") errors.push(`${at}: \`done\` is required (boolean)`);
    if (typeof it.due === "string" && it.due.trim() && parseInstant(it.due) === null)
      errors.push(`${at}: \`due\` must be ISO 8601 with a timezone (e.g. 2026-10-09T17:00:00+09:00): ${it.due}`);
    if (typeof it.id === "string" && it.id.trim()) {
      if (seen.has(it.id)) errors.push(`${at}: duplicate id`);
      seen.add(it.id);
    }
  });
  return errors;
}

function classify(items, nowMs) {
  const open = items
    .filter((it) => !it.done)
    .map((it) => ({ ...it, dueMs: parseInstant(it.due) }))
    .sort((a, b) => a.dueMs - b.dueMs);
  const overdue = open.filter((it) => it.dueMs <= nowMs);
  const soon = open.filter((it) => it.dueMs > nowMs && it.dueMs - nowMs <= SOON_HOURS * HOUR_MS);
  const later = open.filter((it) => it.dueMs - nowMs > SOON_HOURS * HOUR_MS);
  return { overdue, soon, later, done: items.length - open.length };
}

function hoursLabel(ms) {
  const h = Math.abs(ms) / HOUR_MS;
  return h >= 48 ? `${(h / 24).toFixed(1)} 日` : `${h.toFixed(1)} 時間`;
}

// 表示と終了コードを決める。I/O は呼び出し側。
function run({ raw, nowMs, strict }) {
  const lines = [];
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    return { code: 1, lines: [`${LABEL} FAIL: ${DUE_PATH} is not valid JSON: ${e.message}`] };
  }
  const errors = validate(obj);
  if (errors.length) {
    return { code: 1, lines: [`${LABEL} FAIL: ${DUE_PATH} has ${errors.length} format error(s)`, ...errors.map((e) => `  - ${e}`)] };
  }
  const c = classify(obj.items, nowMs);
  lines.push(`${LABEL} now=${new Date(nowMs).toISOString()} overdue=${c.overdue.length} soon(<=${SOON_HOURS}h)=${c.soon.length} later=${c.later.length} done=${c.done}`);
  for (const it of c.overdue)
    lines.push(`  OVERDUE ${it.due}（${hoursLabel(nowMs - it.dueMs)}超過） ${it.id}: ${it.what}  [source: ${it.source}]`);
  for (const it of c.soon)
    lines.push(`  SOON    ${it.due}（あと ${hoursLabel(it.dueMs - nowMs)}） ${it.id}: ${it.what}  [source: ${it.source}]`);
  if (c.overdue.length && strict) {
    lines.push(`${LABEL} FAIL (--strict): ${c.overdue.length} overdue item(s)`);
    return { code: 1, lines };
  }
  if (c.overdue.length) lines.push(`${LABEL} 期限切れがある。対応したら done: true にする（--strict なら exit 1）`);
  return { code: 0, lines };
}

// ---- CLI ----

function parseArgs(argv) {
  const a = { strict: false };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--strict") a.strict = true;
    else if (x === "--now") {
      if (i + 1 >= argv.length) throw new Error("--now needs a value");
      a.now = argv[++i];
    } else throw new Error(`unknown option ${x}`);
  }
  return a;
}

function main(argv) {
  const a = parseArgs(argv);
  let nowMs = Date.now();
  if (a.now !== undefined) {
    nowMs = parseInstant(a.now);
    if (nowMs === null) throw new Error(`--now must be ISO 8601 with a timezone: ${a.now}`);
  }
  const raw = fs.readFileSync(path.resolve(process.cwd(), DUE_PATH), "utf8");
  const r = run({ raw, nowMs, strict: a.strict });
  for (const l of r.lines) (r.code ? console.error : console.log)(l);
  return r.code;
}

// ---- self-test ----

function selfTest() {
  const t = [];
  const eq = (name, got, want) => t.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });
  const item = (id, due, done = false) => ({ id, due, what: `${id} の内容`, source: "self-test", done });
  const doc = (items) => JSON.stringify({ version: 1, items });
  const NOW = parseInstant("2026-10-05T12:00:00+09:00");

  // 1) 正常: 期限が先の項目だけなら exit 0、overdue/soon なし
  const later = run({ raw: doc([item("a", "2026-10-20T09:00:00+09:00")]), nowMs: NOW, strict: true });
  eq("期限が 72h より先の項目だけなら --strict でも exit 0", later.code, 0);
  eq("件数行に later=1 を出す", /overdue=0 soon\(<=72h\)=0 later=1 done=0/.test(later.lines[0]), true);

  // 2) 期限切れ
  const od = [item("past", "2026-10-04T07:02:00+09:00")];
  eq("期限切れは既定で exit 0", run({ raw: doc(od), nowMs: NOW, strict: false }).code, 0);
  const odStrict = run({ raw: doc(od), nowMs: NOW, strict: true });
  eq("期限切れは --strict で exit 1", odStrict.code, 1);
  eq("期限切れを OVERDUE 行で出す", odStrict.lines.some((l) => /OVERDUE .* past:/.test(l)), true);
  eq("期限ちょうどは期限切れに数える", classify([item("x", "2026-10-05T12:00:00+09:00")], NOW).overdue.length, 1);

  // 3) 72h 以内
  const soon = classify(
    [item("in72", "2026-10-08T12:00:00+09:00"), item("over72", "2026-10-08T12:00:01+09:00")],
    NOW,
  );
  eq("ちょうど 72h 後は soon、それを過ぎたら later", [soon.soon.map((x) => x.id), soon.later.map((x) => x.id)], [["in72"], ["over72"]]);
  eq("soon だけなら --strict でも exit 0", run({ raw: doc([item("in72", "2026-10-08T12:00:00+09:00")]), nowMs: NOW, strict: true }).code, 0);
  eq(
    "タイムゾーンが違っても同じ時刻として比べる（UTC 表記の 72h 以内）",
    classify([item("utc", "2026-10-06T00:00:00Z")], NOW).soon.length,
    1,
  );

  // 4) done
  const withDone = classify([item("d", "2026-10-01T00:00:00+09:00", true), item("o", "2026-10-30T00:00:00+09:00")], NOW);
  eq("done: true は期限切れに数えず done 件数に入れる", [withDone.overdue.length, withDone.done, withDone.later.length], [0, 1, 1]);
  eq("done 済みの期限切れだけなら --strict でも exit 0", run({ raw: doc([item("d", "2026-10-01T00:00:00+09:00", true)]), nowMs: NOW, strict: true }).code, 0);
  eq("期限順に並べる", classify([item("b", "2026-10-07T00:00:00+09:00"), item("a", "2026-10-06T00:00:00+09:00")], NOW).soon.map((x) => x.id), ["a", "b"]);

  // 5) 形式エラー（どのモードでも exit 1）
  const bad = (name, items, re) => {
    const r = run({ raw: doc(items), nowMs: NOW, strict: false });
    eq(name, [r.code, r.lines.some((l) => re.test(l))], [1, true]);
  };
  bad("必須キー欠落（what）は exit 1", [{ id: "a", due: "2026-10-09T17:00:00+09:00", source: "s", done: false }], /`what` is required/);
  bad("done が bool でなければ exit 1", [{ ...item("a", "2026-10-09T17:00:00+09:00"), done: "false" }], /`done` is required/);
  bad("due が解釈できなければ exit 1", [item("a", "2026-13-40T99:00:00+09:00")], /`due` must be ISO 8601/);
  bad("due にタイムゾーンが無ければ exit 1", [item("a", "2026-10-09T17:00:00")], /`due` must be ISO 8601/);
  bad("日付だけの due は exit 1（時刻とタイムゾーンを書く）", [item("a", "2026-10-24")], /`due` must be ISO 8601/);
  bad("id の重複は exit 1", [item("a", "2026-10-09T17:00:00+09:00"), item("a", "2026-10-10T17:00:00+09:00")], /duplicate id/);
  eq("JSON として壊れていれば exit 1", run({ raw: "{", nowMs: NOW, strict: false }).code, 1);
  eq("version 違いは exit 1", run({ raw: JSON.stringify({ version: 2, items: [] }), nowMs: NOW, strict: false }).code, 1);
  eq("items が配列でなければ exit 1", run({ raw: JSON.stringify({ version: 1, items: {} }), nowMs: NOW, strict: false }).code, 1);

  // 6) 引数
  eq("--strict と --now を読む", parseArgs(["--strict", "--now", "2026-10-25T00:00:00+09:00"]), { strict: true, now: "2026-10-25T00:00:00+09:00" });
  let threw = false;
  try {
    parseArgs(["--nope"]);
  } catch {
    threw = true;
  }
  eq("未知のオプションは拒否", threw, true);

  // 7) 実データの形式（期限の状態は時刻で変わるので形式だけ見る）
  const real = path.join(__dirname, "..", DUE_PATH);
  if (fs.existsSync(real)) eq(`${DUE_PATH} の形式が正しい`, validate(JSON.parse(fs.readFileSync(real, "utf8"))), []);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`${x.ok ? "PASS" : "FAIL"}: ${x.name}`);
  if (failed.length) {
    for (const x of failed) console.error(`  ${x.name}\n    got:  ${JSON.stringify(x.got)}\n    want: ${JSON.stringify(x.want)}`);
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    try {
      process.exit(main(process.argv.slice(2)));
    } catch (e) {
      console.error(`${LABEL} ${e.message}`);
      process.exit(1);
    }
  }
}
