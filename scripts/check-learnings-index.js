#!/usr/bin/env node
// Check: AGENT_LEARNINGS.md の「📇 テーマ別インデックス」の健全性を検証する。
//
// 背景:
//   rank8 (PR #371) で非破壊インデックスを追加したが、新規エントリ追加時に
//   インデックスへの登録忘れリスクがある。本 check で登録漏れを WARN 検出する。
//   さらに 2026-09-05、F 節（review / 記事品質 / convention）で同一の 3 行が
//   `**現行正本**:` 行を挟んで 2 回現れている重複が見つかった。登録漏れしか
//   見ていなかったため重複は素通りしていたので、重複検出を FAIL として追加した。
//
// 判定ロジック（誤検知ゼロ優先）:
//   [1] 登録漏れ（WARN・非ブロッキング）
//     1. 本文の `### YYYY-MM-DD —` 見出しから日付を抽出
//     2. インデックス（A〜G テーマ）配下の `- YYYY-MM-DD —` 行から日付を抽出
//     3. 本文の日付が**一切**インデックスに登場しなければ WARN
//     4. 同日複数エントリが 1 行に圧縮されている場合は OK 判定（実運用パターン）
//   [2] 重複行（FAIL・ブロッキング）
//     - **同一テーマ節の中**で、**行全体（trim 後）が完全一致**する `- YYYY-MM-DD —`
//       行が 2 回以上現れたら FAIL。
//     - 節をまたぐ重複は FAIL にしない。インデックス冒頭に「同じエントリが複数テーマに
//       再掲されることがある」と明記されている意図的な運用だから。
//     - 「日付＋タイトル前方一致」等のゆるい単位も採らない。A 節と G 節の 2026-06-07
//       「Zenn 二重公開ガード…」のように、同じ学びを節ごとに言い換えて載せている実例が
//       あり、ゆるくすると意図的な再掲を誤検知する。完全一致なら「コピペ由来の事故的な
//       重複」だけが残る。
//
// 集約 `npm run check` に組み込み。登録漏れは WARN のみ、重複は exit 1。
//
// 使い方:
//   npm run check:learnings-index   # 実データ
//   npm run test:learnings-index    # self-test

const fs = require("fs");
const path = require("path");

const FILE_NAME = "AGENT_LEARNINGS.md";
const LABEL = "[check:learnings-index]";

// ---- 純関数（self-test 対象） ----

// インデックス区間と本文区間を切り出す。見出しが揃っていなければ null（= skip）。
function locateSections(lines) {
  let indexStart = -1;
  let indexEnd = -1;
  let bodyStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## 📇 テーマ別インデックス/.test(lines[i])) indexStart = i;
    else if (/^## 🧭 学びエントリ/.test(lines[i])) {
      if (indexStart >= 0 && indexEnd < 0) indexEnd = i;
      bodyStart = i;
    }
  }
  if (indexStart < 0 || bodyStart < 0) return null;
  return {
    indexStart,
    indexEnd: indexEnd >= 0 ? indexEnd : bodyStart,
    bodyStart,
  };
}

// インデックス区間を `### X. …` テーマ節ごとに分解する。
// 戻り値: [{ key: "F", heading, entries: [{ text, line }] }]
function parseIndexSections(lines, indexStart, indexEnd) {
  const sections = [];
  let current = null;
  for (let i = indexStart; i < indexEnd; i++) {
    const line = lines[i];
    const h = line.match(/^###\s+([A-Z])\.\s*(.*)$/);
    if (h) {
      current = { key: h[1], heading: h[2].trim(), entries: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue; // 節見出しより前（導入文）は対象外
    if (!/^-\s+\d{4}-\d{2}-\d{2}\s/.test(line)) continue;
    current.entries.push({ text: line.trim(), line: i + 1 });
  }
  return sections;
}

// 同一節内で行全体が完全一致する重複を返す。
// 戻り値: [{ section, text, lines: [n, ...] }]
function findDuplicateEntries(sections) {
  const dups = [];
  for (const section of sections) {
    const seen = new Map();
    for (const e of section.entries) {
      if (!seen.has(e.text)) seen.set(e.text, []);
      seen.get(e.text).push(e.line);
    }
    for (const [text, lineNums] of seen) {
      if (lineNums.length > 1)
        dups.push({ section: section.key, text, lines: lineNums });
    }
  }
  return dups;
}

// 本文エントリのうち、インデックスに日付が一度も出てこないものを返す。
function findUnindexedEntries(lines, bodyStart, sections) {
  const indexDates = new Set();
  for (const s of sections)
    for (const e of s.entries) {
      const m = e.text.match(/^-\s+(\d{4}-\d{2}-\d{2})\s/);
      if (m) indexDates.add(m[1]);
    }

  const missing = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^### (\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/);
    if (!m) continue;
    // テンプレート行（`### YYYY-MM-DD —` プレースホルダ）はスキップ
    if (line.includes("YYYY-MM-DD")) continue;
    if (indexDates.has(m[1])) continue;
    missing.push({ date: m[1], title: m[2].trim(), line: i + 1 });
  }
  return missing;
}

// content 全体を評価する。skip の場合 { skip: 理由 }。
function evaluate(content) {
  const lines = content.split("\n");
  const loc = locateSections(lines);
  if (!loc) return { skip: "インデックス or 学びエントリ見出しが無い" };
  const sections = parseIndexSections(lines, loc.indexStart, loc.indexEnd);
  return {
    sections,
    duplicates: findDuplicateEntries(sections),
    missing: findUnindexedEntries(lines, loc.bodyStart, sections),
    entryCount: sections.reduce((n, s) => n + s.entries.length, 0),
  };
}

// ---- self-test ----

const FIXTURE_HEAD = [
  "## 📇 テーマ別インデックス",
  "",
  "> 同じエントリが複数テーマに再掲されることがある。",
  "",
];
const FIXTURE_BODY = ["## 🧭 学びエントリ", ""];

function fixture(indexBody, bodyEntries = []) {
  return [
    ...FIXTURE_HEAD,
    ...indexBody,
    "",
    ...FIXTURE_BODY,
    ...bodyEntries,
  ].join("\n");
}

function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({
      name,
      ok: JSON.stringify(got) === JSON.stringify(want),
      got,
      want,
    });

  // 1) 重複なしなら duplicates は空
  eq(
    "重複が無ければ FAIL しない",
    evaluate(
      fixture([
        "### F. review",
        "**現行正本**: `AGENTS.md`",
        "- 2026-09-03 — レビューループは数値の「単位」を保存しない",
        "- 2026-04-16 — reviews/ はプラットフォームで3分割する",
      ]),
    ).duplicates,
    [],
  );

  // 2) 同一節内の完全一致重複を検出する（今回の実事故と同じ形）
  const dupResult = evaluate(
    fixture([
      "### F. review",
      "- 2026-09-03 — レビューループは数値の「単位」を保存しない",
      "**現行正本**: `AGENTS.md`",
      "- 2026-09-03 — レビューループは数値の「単位」を保存しない",
    ]),
  );
  eq("同一節内の完全一致重複を 1 件検出する", dupResult.duplicates.length, 1);
  eq("重複の節キーと行番号を報告する", dupResult.duplicates[0].lines, [6, 8]);

  // 3) 節をまたぐ完全一致は意図的な再掲なので FAIL しない
  eq(
    "節をまたぐ同一行は FAIL しない（意図的な再掲）",
    evaluate(
      fixture([
        "### A. Zenn",
        "- 2026-06-07 — Zenn 二重公開ガードは CI 未 wire だと無意味",
        "### G. CI",
        "- 2026-06-07 — Zenn 二重公開ガードは CI 未 wire だと無意味",
      ]),
    ).duplicates,
    [],
  );

  // 4) 同日・別タイトルは別行として扱う（日付だけで判定していない）
  eq(
    "同日で文言が違う 2 行は重複ではない",
    evaluate(
      fixture([
        "### A. Zenn",
        "- 2026-05-22 — Zenn rate-limit は実効 24h/2本でも hit する",
        "- 2026-05-22 — release/zenn sync は単一ファイル限定で取り出す",
      ]),
    ).duplicates,
    [],
  );

  // 5) 節見出しより前の行はインデックス項目として数えない
  eq(
    "導入文中の箇条書きは節に属さないので無視する",
    evaluate(
      fixture([
        "- 2026-01-01 — 節の外にある行",
        "### A. Zenn",
        "- 2026-01-01 — 節の外にある行",
      ]).toString(),
    ).duplicates,
    [],
  );

  // 6) 登録漏れの WARN 判定は従来どおり
  const missResult = evaluate(
    fixture(
      ["### F. review", "- 2026-09-03 — 既に載っている学び"],
      [
        "### 2026-09-03 — 既に載っている学び [Workflow]",
        "",
        "### 2026-09-09 — 未登録の学び [Gotcha]",
      ],
    ),
  );
  eq(
    "インデックス未登録の本文エントリを 1 件 WARN 対象にする",
    missResult.missing.length,
    1,
  );
  eq(
    "未登録エントリの日付を報告する",
    missResult.missing[0].date,
    "2026-09-09",
  );

  // 7) テンプレート行は本文エントリとして数えない
  eq(
    "`YYYY-MM-DD` プレースホルダはスキップ",
    evaluate(
      fixture(
        ["### F. review", "- 2026-09-03 — x"],
        ["### YYYY-MM-DD — <短い見出し> [カテゴリ]"],
      ),
    ).missing.length,
    0,
  );

  // 8) 見出しが無いファイルは skip
  eq("見出しが無ければ skip", Boolean(evaluate("# 何もない\n").skip), true);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? "ok  " : "FAIL"} ${x.name}`);
  if (failed.length) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    for (const f of failed)
      console.error(
        `  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`,
      );
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

// ---- main ----

function main() {
  const file = path.join(process.cwd(), FILE_NAME);
  if (!fs.existsSync(file)) {
    console.log(`${LABEL} skip: ${FILE_NAME} が見つからない`);
    return 0;
  }

  const result = evaluate(fs.readFileSync(file, "utf8"));
  if (result.skip) {
    console.log(`${LABEL} skip: ${result.skip}`);
    return 0;
  }

  // 登録漏れ（WARN・非ブロッキング）
  if (result.missing.length > 0) {
    console.warn(
      `${LABEL} WARN: インデックス未登録の日付を持つエントリ ${result.missing.length} 件`,
    );
    console.warn(
      "  ※ rank8 のテーマ別インデックス（A〜G）に該当日付の登録を追加すると発見性が上がります（非ブロッキング）",
    );
    for (const e of result.missing)
      console.warn(`  ${FILE_NAME}:${e.line}  ${e.date} — ${e.title}`);
  }

  // 重複（FAIL・ブロッキング）
  if (result.duplicates.length > 0) {
    console.error(
      `${LABEL} FAIL: 同一テーマ節の中で完全一致する重複行 ${result.duplicates.length} 件`,
    );
    for (const d of result.duplicates)
      console.error(
        `  ${FILE_NAME}:${d.lines.join(",")}  [${d.section} 節] ${d.text}`,
      );
    console.error(
      "  ※ どちらか 1 行を残して削除すること（節をまたぐ再掲は対象外）",
    );
    return 1;
  }

  if (result.missing.length === 0)
    console.log(
      `${LABEL} OK: インデックス ${result.entryCount} 行に重複なし・本文エントリの登録漏れなし`,
    );
  else
    console.log(`${LABEL} OK: インデックス ${result.entryCount} 行に重複なし`);
  return 0;
}

if (require.main !== module) {
  // ライブラリとして読み込まれたときは何も実行しない
} else if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  process.exit(main());
}
