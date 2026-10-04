#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "templates", "zenn-book");

function fail(message) {
  console.error(`[new:zenn-book] ${message}`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args.positional.push(token);
      continue;
    }
    const key = token.slice(2);
    if (["self-test", "dry-run"].includes(key)) {
      args[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`--${key} requires a value`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function validateSlug(slug) {
  if (!slug) throw new Error("slug is required");
  if (slug.length > 50) throw new Error("slug must be 50 characters or fewer");
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    throw new Error("slug must use lowercase letters, numbers, and hyphens");
  }
}

function listFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full, base));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return files.sort();
}

function render(content, values) {
  let out = String(content);
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{{${key}}}`, String(value));
  }
  const unresolved = out.match(/{{[A-Z0-9_]+}}/g);
  if (unresolved) {
    throw new Error(`unresolved template token: ${unresolved[0]}`);
  }
  return out;
}

function createBook({ slug, title, summary, topics, outDir, dryRun = false, date }) {
  validateSlug(slug);
  if (!title) throw new Error("--title is required");
  if (!summary) throw new Error("--summary is required");
  if (!topics.length) throw new Error("--topics requires at least one topic");
  if (topics.length > 5) throw new Error("--topics accepts at most 5 comma-separated topics");
  if (!fs.existsSync(TEMPLATE_DIR)) throw new Error(`template directory not found: ${TEMPLATE_DIR}`);
  if (fs.existsSync(outDir)) throw new Error(`target already exists: ${outDir}`);

  const values = {
    BOOK_SLUG: slug,
    BOOK_TITLE: title,
    BOOK_SUMMARY: summary,
    BOOK_TITLE_YAML: JSON.stringify(title),
    BOOK_SUMMARY_YAML: JSON.stringify(summary),
    TOPICS_JSON: JSON.stringify(topics),
    CREATED_DATE: date,
  };

  const templateFiles = listFiles(TEMPLATE_DIR);
  if (dryRun) {
    console.log(`[new:zenn-book] dry-run target: ${outDir}`);
    templateFiles.forEach((file) => console.log(`  ${file}`));
    return templateFiles;
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const rel of templateFiles) {
    const source = path.join(TEMPLATE_DIR, rel);
    const target = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const rendered = render(fs.readFileSync(source, "utf8"), values);
    fs.writeFileSync(target, rendered);
  }

  console.log(`[new:zenn-book] created ${outDir}`);
  console.log("[new:zenn-book] next:");
  console.log(`  1. edit ${path.join(outDir, "BOOK_PLAN.md")}`);
  console.log(`  2. edit ${path.join(outDir, "config.yaml")} chapters`);
  console.log(`  3. node scripts/check-zenn-book-structure.js ${outDir}`);
  console.log("  4. keep published: false until the human publish decision");

  return templateFiles;
}

function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zenn-book-template-"));
  const outDir = path.join(tmp, "sample-book");
  try {
    const files = createBook({
      slug: "sample-book",
      title: "Sample Book",
      summary: "Sample summary",
      topics: ["AI", "開発"],
      outDir,
      date: "2026-01-01",
    });

    const required = [
      "config.yaml",
      "BOOK_PLAN.md",
      "SOURCE_MAP.md",
      "EDITORIAL_QA.md",
      "PUBLISH_CHECKLIST.md",
      "00_introduction.md",
      "part1_topic.md",
      "01_first-chapter.md",
      "99_afterword.md",
    ];
    for (const file of required) {
      if (!files.includes(file) || !fs.existsSync(path.join(outDir, file))) {
        throw new Error(`missing generated file: ${file}`);
      }
    }

    const config = fs.readFileSync(path.join(outDir, "config.yaml"), "utf8");
    if (!config.includes('title: "Sample Book"')) throw new Error("title replacement failed");
    if (!config.includes("published: false")) throw new Error("published must default to false");
    if (/{{[A-Z0-9_]+}}/.test(config)) throw new Error("unresolved token in config");

    const check = spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts", "check-zenn-book-structure.js"), outDir],
      { encoding: "utf8" },
    );
    if (check.status !== 0) {
      throw new Error(`structure checker failed:\n${check.stdout}\n${check.stderr}`);
    }

    const dryRunDir = path.join(tmp, "dry-run-book");
    createBook({
      slug: "dry-run-book",
      title: "Dry Run",
      summary: "No files should be written",
      topics: ["test"],
      outDir: dryRunDir,
      dryRun: true,
      date: "2026-01-01",
    });
    if (fs.existsSync(dryRunDir)) {
      throw new Error("dry-run created files");
    }

    let existingBlocked = false;
    try {
      createBook({
        slug: "sample-book",
        title: "Duplicate",
        summary: "Must fail",
        topics: ["test"],
        outDir,
        date: "2026-01-01",
      });
    } catch (error) {
      existingBlocked = /target already exists/.test(error.message);
    }
    if (!existingBlocked) {
      throw new Error("existing target was not blocked");
    }

    console.log("[new:zenn-book] self-test PASS");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args["self-test"]) {
      selfTest();
      return;
    }

    const slug = args.positional[0];
    const topics = String(args.topics || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const outDir = args.out
      ? path.resolve(args.out)
      : path.join(ROOT, "books", slug || "");
    const date = new Date().toISOString().slice(0, 10);

    createBook({
      slug,
      title: args.title,
      summary: args.summary,
      topics,
      outDir,
      dryRun: Boolean(args["dry-run"]),
      date,
    });
  } catch (error) {
    fail(error.message);
  }
}

main();
