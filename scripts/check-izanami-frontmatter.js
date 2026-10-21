#!/usr/bin/env node
// Check: articles_izanami/*.md の Front Matter が articles_izanami/README.md の契約を満たすか検証する。
//
// ■ 背景
//   izanami 原稿は Front Matter を管理情報として持つ（本文には含めない）。契約は README に
//   あるが機械検証が無く、他媒体と違って `npm run check` の対象外だった。
//
// ■ 検証内容（README §原稿の扱い が正本）
//   - 必須キー: title / summary / tags / status / source_articles / project_sources /
//     izanami_url / published_at（URL や公開日が未確定なら値は空欄でよいが、キーは置く）
//   - title / summary は空でない文字列、tags は1件以上の配列
//   - source_articles / project_sources は配列（空欄 = null も許す）
//   - status は draft / published のいずれか（idea は README の候補表で管理しファイルを作らない）
//   - status: published のときは izanami_url（https://izanami.dev/ で始まる）と
//     published_at（実在する YYYY-MM-DD）が必須
//
// ■ 対象
//   articles_izanami/ 直下の *.md（README.md は除く）。
//
// ■ 使い方
//   npm run check:izanami-frontmatter
//   npm run test:izanami-frontmatter    # self-test

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const IZANAMI_DIR = "articles_izanami";
const LABEL = "[check:izanami-frontmatter]";
const REQUIRED_KEYS = [
  "title",
  "summary",
  "tags",
  "status",
  "source_articles",
  "project_sources",
  "izanami_url",
  "published_at",
];
const STATUSES = ["draft", "published"];

// ---- 純関数（self-test 対象） ----

function parseFrontmatter(content) {
  const m = String(content).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return { error: "Front Matter（先頭の --- 〜 ---）が無い" };
  try {
    const data = yaml.load(m[1]);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { error: "Front Matter がキー: 値 の形になっていない" };
    }
    return { data };
  } catch (e) {
    return { error: `YAML として読めない: ${e.message.split("\n")[0]}` };
  }
}

function formatDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return typeof v === "string" ? v : null;
}

function isBlank(v) {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

// returns: エラーメッセージの配列（空なら OK）
function validateFrontmatter(content) {
  const parsed = parseFrontmatter(content);
  if (parsed.error) return [parsed.error];
  const fm = parsed.data;
  const errors = [];

  for (const key of REQUIRED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(fm, key)) errors.push(`必須キー ${key} が無い`);
  }
  for (const key of ["title", "summary"]) {
    if (key in fm && (typeof fm[key] !== "string" || fm[key].trim() === "")) {
      errors.push(`${key} は空でない文字列にする`);
    }
  }
  if ("tags" in fm && (!Array.isArray(fm.tags) || fm.tags.length === 0)) {
    errors.push("tags は1件以上の配列にする");
  }
  for (const key of ["source_articles", "project_sources"]) {
    if (key in fm && fm[key] !== null && !Array.isArray(fm[key])) {
      errors.push(`${key} は配列にする（未確定なら空欄）`);
    }
  }
  if ("status" in fm && !STATUSES.includes(fm.status)) {
    errors.push(`status は ${STATUSES.join(" / ")} のいずれか（got: ${JSON.stringify(fm.status)}）`);
  }
  if (fm.status === "published") {
    if (isBlank(fm.izanami_url) || !/^https:\/\/izanami\.dev\//.test(String(fm.izanami_url))) {
      errors.push("status: published なら izanami_url に https://izanami.dev/ の URL を入れる");
    }
    const date = formatDate(fm.published_at);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || formatDate(new Date(date)) !== date) {
      errors.push("status: published なら published_at に YYYY-MM-DD を入れる");
    }
  }
  return errors;
}

function collectMarkdownFiles() {
  const dir = path.join(ROOT, IZANAMI_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => path.join(dir, f));
}

// ---- self-test ----

function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });
  const fm = (body) => `---\n${body}\n---\n\n本文\n`;
  const base = [
    'title: "t"',
    'summary: "s"',
    "tags:\n  - AI",
    "source_articles:\n  - articles/a.md",
    "project_sources:\n  - https://github.com/s977043/x",
  ].join("\n");

  eq(
    "draft で URL・公開日が空欄なら OK",
    validateFrontmatter(fm(`${base}\nstatus: draft\nizanami_url:\npublished_at:`)),
    [],
  );
  eq(
    "published で URL と日付があれば OK（日付は YAML の Date 型）",
    validateFrontmatter(
      fm(`${base}\nstatus: published\nizanami_url: https://izanami.dev/post/x\npublished_at: 2026-09-24`),
    ),
    [],
  );
  eq(
    "published_at は文字列の YYYY-MM-DD でも OK",
    validateFrontmatter(
      fm(`${base}\nstatus: published\nizanami_url: https://izanami.dev/post/x\npublished_at: "2026-09-24"`),
    ),
    [],
  );
  eq(
    "published で URL・公開日が空欄なら 2 件",
    validateFrontmatter(fm(`${base}\nstatus: published\nizanami_url:\npublished_at:`)).length,
    2,
  );
  eq(
    "izanami.dev 以外の URL は NG",
    validateFrontmatter(
      fm(`${base}\nstatus: published\nizanami_url: https://example.com/x\npublished_at: 2026-09-24`),
    ).length,
    1,
  );
  eq(
    "キー欠落（izanami_url / published_at）を検出",
    validateFrontmatter(fm(`${base}\nstatus: draft`)),
    ["必須キー izanami_url が無い", "必須キー published_at が無い"],
  );
  eq(
    "実在しない日付は NG",
    validateFrontmatter(
      fm(`${base}\nstatus: published\nizanami_url: https://izanami.dev/post/x\npublished_at: "2026-99-99"`),
    ).length,
    1,
  );
  eq(
    "status: idea のファイルは NG（idea は候補表で管理）",
    validateFrontmatter(fm(`${base}\nstatus: idea\nizanami_url:\npublished_at:`)).length,
    1,
  );
  eq(
    "status の値違反",
    validateFrontmatter(fm(`${base}\nstatus: done\nizanami_url:\npublished_at:`)).length,
    1,
  );
  eq(
    "tags が空配列なら NG",
    validateFrontmatter(
      fm(`${base.replace("tags:\n  - AI", "tags: []")}\nstatus: draft\nizanami_url:\npublished_at:`),
    ),
    ["tags は1件以上の配列にする"],
  );
  eq(
    "source_articles が空欄（null）は OK、文字列は NG",
    [
      validateFrontmatter(
        fm(`${base.replace("source_articles:\n  - articles/a.md", "source_articles:")}\nstatus: draft\nizanami_url:\npublished_at:`),
      ).length,
      validateFrontmatter(
        fm(`${base.replace("source_articles:\n  - articles/a.md", "source_articles: articles/a.md")}\nstatus: draft\nizanami_url:\npublished_at:`),
      ).length,
    ],
    [0, 1],
  );
  eq("Front Matter 無しを検出", validateFrontmatter("# 見出し\n").length, 1);
  eq("YAML 構文エラーを検出", validateFrontmatter(fm("title: [")).length, 1);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? "ok  " : "FAIL"} ${x.name}`);
  if (failed.length) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    for (const f of failed)
      console.error(`  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`);
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

// ---- main ----

function main() {
  const files = collectMarkdownFiles();
  const violations = [];
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    for (const e of validateFrontmatter(fs.readFileSync(file, "utf8"))) {
      violations.push(`  ${rel}: ${e}`);
    }
  }
  if (violations.length > 0) {
    console.error(`${LABEL} FAIL: ${violations.length} 件（checked ${files.length} files）`);
    violations.forEach((v) => console.error(v));
    console.error("  契約: articles_izanami/README.md §原稿の扱い");
    return 1;
  }
  console.log(`${LABEL} OK: checked ${files.length} files`);
  return 0;
}

if (require.main !== module) {
  // ライブラリとして読み込まれたときは何も実行しない
} else if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  process.exit(main());
}
