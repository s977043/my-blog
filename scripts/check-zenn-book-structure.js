#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const yaml = require("js-yaml");

const LABEL = "[check:zenn-book-structure]";

function parseChapters(config) {
  const chapters = [];
  let inChapters = false;

  for (const line of String(config).split(/\r?\n/)) {
    if (/^chapters:\s*$/.test(line)) {
      inChapters = true;
      continue;
    }
    if (!inChapters) continue;
    const item = line.match(/^\s{2}-\s+([A-Za-z0-9_-]+)\s*$/);
    if (item) {
      chapters.push(item[1]);
      continue;
    }
    if (/^\S/.test(line)) break;
  }

  return chapters;
}

function hasBalancedFences(content) {
  let open = null;

  for (const line of String(content).split(/\r?\n/)) {
    const m = line.match(/^\s*((?:\x60|~){3,})/);
    if (!m) continue;

    const marker = m[1][0];
    const length = m[1].length;

    if (!open) {
      open = { marker, length };
      continue;
    }

    if (open.marker === marker && length >= open.length) {
      open = null;
    }
  }

  return open === null;
}

function countH1OutsideFences(content) {
  let open = null;
  let count = 0;

  for (const line of String(content).split(/\r?\n/)) {
    const m = line.match(/^\s*((?:\x60|~){3,})/);
    if (m) {
      const marker = m[1][0];
      const length = m[1].length;
      if (!open) open = { marker, length };
      else if (open.marker === marker && length >= open.length) open = null;
      continue;
    }
    if (!open && /^#\s+.+$/.test(line)) count++;
  }

  return count;
}

// Zenn の Book チャプターは先頭の FrontMatter に title が必須。
// 戻り値は { error } か { title, body }（title は検証前の生の値）。
function parseChapterFrontMatter(content) {
  const lines = String(content).replace(/^﻿/, "").split(/\r?\n/);
  if (lines[0] !== "---") {
    if (/^---\s+$/.test(lines[0])) return { error: "FrontMatter の開始行 `---` の末尾に空白がある" };
    return { error: "先頭に FrontMatter（---）がない" };
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    if (lines.slice(1).some((line) => /^---\s+$/.test(line))) {
      return { error: "FrontMatter の終了行 `---` の末尾に空白がある" };
    }
    return { error: "FrontMatter が閉じていない（終了行の `---` がない）" };
  }

  let data;
  try {
    data = yaml.load(lines.slice(1, end).join("\n"));
  } catch (error) {
    return { error: `FrontMatter の YAML を解析できない: ${error.reason || error.message}` };
  }
  const title = data && typeof data === "object" ? data.title : undefined;
  return { title, body: lines.slice(end + 1).join("\n") };
}

function hasChapterTitle(frontMatter) {
  return typeof frontMatter.title === "string" && frontMatter.title.trim() !== "";
}

function isNumberedContentChapter(slug) {
  return /^\d{2}_/.test(slug) && !/^(?:00|99)_/.test(slug);
}

function validateBook(bookDir, options = {}) {
  const errors = [];
  const configPath = path.join(bookDir, "config.yaml");

  if (!fs.existsSync(configPath)) {
    return [`config.yaml が存在しない: ${configPath}`];
  }

  const config = fs.readFileSync(configPath, "utf8");
  for (const key of ["title", "summary", "published"]) {
    if (!new RegExp(`^${key}:\\s*.+$`, "m").test(config)) {
      errors.push(`config.yaml に ${key} がない`);
    }
  }

  const chapters = parseChapters(config);
  if (!chapters.length) errors.push("config.yaml の chapters が空");

  const seen = new Set();
  for (const slug of chapters) {
    if (seen.has(slug)) errors.push(`duplicate chapter: ${slug}`);
    seen.add(slug);
  }

  for (const slug of chapters) {
    const file = path.join(bookDir, `${slug}.md`);
    if (!fs.existsSync(file)) {
      errors.push(`chapter file が存在しない: ${slug}.md`);
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const frontMatter = parseChapterFrontMatter(content);
    const hasTitle = !frontMatter.error && hasChapterTitle(frontMatter);
    if (frontMatter.error) {
      errors.push(`${slug}.md: ${frontMatter.error}`);
    } else if (!hasTitle) {
      errors.push(`${slug}.md: FrontMatter に空でない title がない`);
    }

    if (options.checkH1 !== false && hasTitle) {
      const bodyH1Count = countH1OutsideFences(frontMatter.body);
      if (bodyH1Count > 0) {
        errors.push(
          `${slug}.md: 本文に H1 を置かない（FrontMatter の title が見出しになる。本文の H1: ${bodyH1Count}）`,
        );
      }
    }

    if (!hasBalancedFences(content)) {
      errors.push(`${slug}.md: fenced code block が閉じていない`);
    }

    if (options.checkPlaceholders !== false) {
      const placeholder = content.match(/\b(TBD|FIXME|XXX)\b|【[^】]+】/);
      if (placeholder) {
        errors.push(`${slug}.md: 未解消placeholder候補 "${placeholder[0]}"`);
      }
    }

    if (options.requireSourcesNumbered && isNumberedContentChapter(slug)) {
      const sourceBlock = content.split("### Sources")[1] || "";
      if (!/https?:\/\//.test(sourceBlock)) {
        errors.push(`${slug}.md: numbered chapter に Sources URL がない`);
      }
    }
  }

  return errors;
}

function findBookDirs(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, entry.name))
    .filter((dir) => fs.existsSync(path.join(dir, "config.yaml")))
    .sort();
}

function validateBooksRoot(rootDir, options = {}) {
  return findBookDirs(rootDir).map((bookDir) => {
    const bookOptions = { ...options };
    if (options.modernH1ByBookPlan) {
      bookOptions.checkH1 = fs.existsSync(path.join(bookDir, "BOOK_PLAN.md"));
    }
    return {
      bookDir,
      errors: validateBook(bookDir, bookOptions),
    };
  });
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "zenn-book-check-"));
  const book = path.join(root, "book");
  fs.mkdirSync(book, { recursive: true });

  const write = (name, content) => fs.writeFileSync(path.join(book, name), content);
  const validConfig = [
    'title: "Book"',
    'summary: "Summary"',
    "published: false",
    "chapters:",
    "  - 01_intro",
    "  - part1_topic",
    "",
  ].join("\n");
  const validIntro = [
    "---",
    'title: "Intro"',
    "---",
    "",
    "~~~text",
    "hello",
    "~~~",
    "",
    "### Sources",
    "",
    "- [Source](https://example.com/source)",
    "",
  ].join("\n");
  const validPart = '---\ntitle: "Part"\n---\n\nNavigation.\n';
  const introWithoutTitle = validIntro.replace('title: "Intro"', "free: true");
  const introWithBodyH1 = validIntro.replace("---\n\n~~~", "---\n\n# Intro\n\n~~~");

  write("config.yaml", validConfig);
  write("01_intro.md", validIntro);
  write("part1_topic.md", validPart);
  write("99_afterword.md", '---\ntitle: "Afterword"\n---\n\nNo sources required.\n');

  const cases = [];
  const expect = (name, fn, match) => {
    const errors = fn();
    cases.push({ name, ok: match(errors), errors });
  };

  expect(
    "reserved 99 chapter does not require sources",
    () => {
      write(
        "config.yaml",
        validConfig.replace("  - part1_topic", "  - part1_topic\n  - 99_afterword"),
      );
      return validateBook(book, { requireSourcesNumbered: true });
    },
    (errors) => errors.length === 0,
  );

  write("config.yaml", validConfig);

  expect(
    "valid book",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.length === 0,
  );

  write(
    "config.yaml",
    validConfig.replace("  - part1_topic", "  - 01_intro\n  - part1_topic"),
  );
  expect(
    "duplicate chapter",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("duplicate chapter")),
  );

  write("config.yaml", validConfig.replace("  - part1_topic", "  - missing"));
  expect(
    "missing chapter",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("chapter file が存在しない")),
  );

  write("config.yaml", validConfig);
  write("01_intro.md", introWithBodyH1);
  expect(
    "body H1 alongside title",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("本文に H1 を置かない")),
  );

  write(
    "01_intro.md",
    '---\ntitle: "Intro"\n---\n\n~~~text\nunclosed\n\n### Sources\n\n- https://example.com\n',
  );
  expect(
    "unbalanced fence",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("fenced code block")),
  );

  write("01_intro.md", '---\ntitle: "Intro"\n---\n\nNo sources.\n');
  expect(
    "numbered chapter source",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("Sources URL")),
  );

  write("01_intro.md", validIntro.replace('---\ntitle: "Intro"\n---', "# Intro"));
  expect(
    "chapter without FrontMatter",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("先頭に FrontMatter")),
  );

  write("01_intro.md", introWithoutTitle);
  expect(
    "FrontMatter without title",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("空でない title")),
  );

  write("01_intro.md", validIntro.replace('title: "Intro"', 'title: ""'));
  expect(
    "FrontMatter with empty title",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("空でない title")),
  );

  write("01_intro.md", validIntro.replace('title: "Intro"', 'title: "Intro"\nfree: true'));
  expect(
    "FrontMatter with title and free",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.length === 0,
  );

  const frontMatterCases = [
    ["FrontMatter after BOM", "﻿" + validIntro, (e) => e.length === 0],
    [
      "unclosed FrontMatter",
      validIntro.replace('title: "Intro"\n---', 'title: "Intro"'),
      (e) => e.some((m) => m.includes("閉じていない（")),
    ],
    [
      "opening delimiter with trailing space",
      validIntro.replace(/^---\n/, "--- \n"),
      (e) => e.some((m) => m.includes("開始行 `---` の末尾に空白")),
    ],
    [
      "closing delimiter with trailing space",
      validIntro.replace('"Intro"\n---', '"Intro"\n--- '),
      (e) => e.some((m) => m.includes("終了行 `---` の末尾に空白")),
    ],
    [
      "unquoted title containing colon",
      validIntro.replace('title: "Intro"', "title: 付録A1: 用語"),
      (e) => e.some((m) => m.includes("YAML を解析できない")),
    ],
    [
      "unterminated quoted title",
      validIntro.replace('title: "Intro"', 'title: "A'),
      (e) => e.some((m) => m.includes("YAML を解析できない")),
    ],
    [
      "null title",
      validIntro.replace('title: "Intro"', "title: ~"),
      (e) => e.some((m) => m.includes("空でない title")),
    ],
    [
      "comment-only title",
      validIntro.replace('title: "Intro"', "title: # x"),
      (e) => e.some((m) => m.includes("空でない title")),
    ],
    [
      "missing title reports a single error",
      introWithoutTitle,
      (e) => e.length === 1 && e[0].includes("空でない title"),
    ],
    [
      "broken YAML reports a single error",
      validIntro.replace('title: "Intro"', 'title: "A'),
      (e) => e.length === 1 && e[0].includes("YAML を解析できない"),
    ],
    [
      "H1-like lines inside code fences are not body H1",
      validIntro.replace("~~~text\nhello\n~~~", "~~~bash\n# comment\n~~~\n\n```sh\n# comment\n```"),
      (e) => e.length === 0,
    ],
  ];
  for (const [name, content, match] of frontMatterCases) {
    write("01_intro.md", content);
    expect(name, () => validateBook(book, { requireSourcesNumbered: true }), match);
  }

  const booksRoot = path.join(root, "books");
  const bookA = path.join(booksRoot, "book-a");
  const bookB = path.join(booksRoot, "book-b");
  fs.mkdirSync(bookA, { recursive: true });
  fs.mkdirSync(bookB, { recursive: true });
  for (const target of [bookA, bookB]) {
    fs.writeFileSync(path.join(target, "config.yaml"), validConfig);
    fs.writeFileSync(path.join(target, "01_intro.md"), validIntro);
    fs.writeFileSync(path.join(target, "part1_topic.md"), validPart);
  }

  fs.writeFileSync(path.join(bookA, "BOOK_PLAN.md"), "# Plan\n");

  expect(
    "validate all books root",
    () =>
      validateBooksRoot(booksRoot, {
        modernH1ByBookPlan: true,
        checkPlaceholders: false,
      }).flatMap((result) => result.errors),
    (errors) => errors.length === 0 && findBookDirs(booksRoot).length === 2,
  );

  fs.writeFileSync(path.join(bookA, "01_intro.md"), introWithBodyH1);
  expect(
    "modern book forbids body H1",
    () =>
      validateBooksRoot(booksRoot, {
        modernH1ByBookPlan: true,
        checkPlaceholders: false,
      }).flatMap((result) => result.errors),
    (errors) => errors.some((e) => e.includes("本文に H1 を置かない")),
  );
  fs.writeFileSync(path.join(bookA, "01_intro.md"), validIntro);

  fs.writeFileSync(path.join(bookB, "01_intro.md"), introWithBodyH1);
  expect(
    "legacy book may keep body H1 in all-book check",
    () =>
      validateBooksRoot(booksRoot, {
        modernH1ByBookPlan: true,
        checkPlaceholders: false,
      }).flatMap((result) => result.errors),
    (errors) => errors.length === 0,
  );

  fs.rmSync(root, { recursive: true, force: true });

  const failed = cases.filter((c) => !c.ok);
  for (const c of cases) console.log(`  ${c.ok ? "ok  " : "FAIL"} ${c.name}`);
  if (failed.length) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${cases.length}`);
    for (const c of failed) {
      console.error(`  - ${c.name}: ${JSON.stringify(c.errors)}`);
    }
    process.exit(1);
  }

  console.log(`\n${LABEL} self-test OK: ${cases.length}/${cases.length}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) return selfTest();

  const target = args.find((arg) => !arg.startsWith("--"));
  const allBooks = args.includes("--all");
  const options = {
    requireSourcesNumbered: args.includes("--require-sources-numbered"),
    checkPlaceholders: allBooks ? args.includes("--check-placeholders") : true,
    modernH1ByBookPlan: allBooks,
  };

  if (allBooks) {
    const rootDir = path.resolve(process.cwd(), target || "books");
    const results = validateBooksRoot(rootDir, options);
    if (!results.length) {
      console.error(LABEL + " FAIL: config.yaml を持つBookがない: " + rootDir);
      process.exit(1);
    }

    const failed = results.filter((result) => result.errors.length);
    for (const result of results) {
      const relative = path.relative(process.cwd(), result.bookDir);
      if (!result.errors.length) {
        const config = fs.readFileSync(path.join(result.bookDir, "config.yaml"), "utf8");
        console.log(LABEL + " OK: " + relative + " / " + parseChapters(config).length + " chapters");
        continue;
      }
      console.error(LABEL + " FAIL: " + relative + " / " + result.errors.length + " 件");
      for (const error of result.errors) console.error("  - " + error);
    }

    if (failed.length) process.exit(1);
    console.log(LABEL + " ALL OK: " + results.length + " books");
    return;
  }

  if (!target) {
    console.error(LABEL + " FAIL: book directory を指定してください");
    process.exit(1);
  }

  const bookDir = path.resolve(process.cwd(), target);
  const errors = validateBook(bookDir, options);

  if (errors.length) {
    console.error(LABEL + " FAIL: " + errors.length + " 件");
    for (const error of errors) console.error("  - " + error);
    process.exit(1);
  }

  const chapterCount = parseChapters(
    fs.readFileSync(path.join(bookDir, "config.yaml"), "utf8"),
  ).length;
  console.log(LABEL + " OK: " + target + " / " + chapterCount + " chapters");
}
if (require.main === module) main();

module.exports = {
  parseChapters,
  hasBalancedFences,
  isNumberedContentChapter,
  validateBook,
  findBookDirs,
  validateBooksRoot,
};
