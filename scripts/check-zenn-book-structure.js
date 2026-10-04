#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

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
    const h1Count = (content.match(/^#\s+.+$/gm) || []).length;
    if (h1Count !== 1) {
      errors.push(`${slug}.md: H1 は1つ必要（実際 ${h1Count}）`);
    }

    if (!hasBalancedFences(content)) {
      errors.push(`${slug}.md: fenced code block が閉じていない`);
    }

    const placeholder = content.match(/\b(TBD|FIXME|XXX)\b|【[^】]+】/);
    if (placeholder) {
      errors.push(`${slug}.md: 未解消placeholder候補 "${placeholder[0]}"`);
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
  return findBookDirs(rootDir).map((bookDir) => ({
    bookDir,
    errors: validateBook(bookDir, options),
  }));
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
    "# Intro",
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
  const validPart = "# Part\n\nNavigation.\n";

  write("config.yaml", validConfig);
  write("01_intro.md", validIntro);
  write("part1_topic.md", validPart);
  write("99_afterword.md", "# Afterword\n\nNo sources required.\n");

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
  write("01_intro.md", validIntro.replace("# Intro", "Intro"));
  expect(
    "missing H1",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("H1 は1つ必要")),
  );

  write(
    "01_intro.md",
    "# Intro\n\n~~~text\nunclosed\n\n### Sources\n\n- https://example.com\n",
  );
  expect(
    "unbalanced fence",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("fenced code block")),
  );

  write("01_intro.md", "# Intro\n\nNo sources.\n");
  expect(
    "numbered chapter source",
    () => validateBook(book, { requireSourcesNumbered: true }),
    (errors) => errors.some((e) => e.includes("Sources URL")),
  );

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

  expect(
    "validate all books root",
    () => validateBooksRoot(booksRoot).flatMap((result) => result.errors),
    (errors) => errors.length === 0 && findBookDirs(booksRoot).length === 2,
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
  const options = {
    requireSourcesNumbered: args.includes("--require-sources-numbered"),
  };

  if (args.includes("--all")) {
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
