#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LABEL = "[list:changed-zenn-books]";

function parseArgs(argv) {
  const args = {
    base: process.env.BASE_REF || "",
    selfTest: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--self-test") {
      args.selfTest = true;
      continue;
    }
    if (token === "--base") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--base requires a value");
      }
      args.base = value;
      i += 1;
      continue;
    }
    throw new Error(`unknown argument: ${token}`);
  }

  if (!args.selfTest && !args.base) {
    throw new Error("--base is required (or set BASE_REF)");
  }

  return args;
}

function isValidBookSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(String(slug));
}

function extractBookSlugs(paths) {
  const slugs = new Set();

  for (const raw of paths) {
    const normalized = String(raw).replaceAll("\\", "/").trim();
    const match = normalized.match(/^books\/([^/]+)\/(.+)$/);
    if (!match) continue;

    const slug = match[1];
    if (!isValidBookSlug(slug)) continue;
    slugs.add(slug);
  }

  return [...slugs].sort();
}

function filterExistingBooks(slugs, rootDir = ROOT) {
  return slugs.filter((slug) =>
    fs.existsSync(path.join(rootDir, "books", slug, "config.yaml")),
  );
}

function changedPaths(baseRef, cwd = ROOT) {
  const result = spawnSync(
    "git",
    ["diff", "--name-only", "--no-renames", `${baseRef}...HEAD`, "--", "books"],
    { cwd, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(
      `git diff failed for ${baseRef}: ${result.stderr || result.stdout}`,
    );
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function listChangedBooks(baseRef, rootDir = ROOT) {
  const paths = changedPaths(baseRef, rootDir);
  const discovered = extractBookSlugs(paths);
  const existing = filterExistingBooks(discovered, rootDir);
  const removed = discovered.filter((slug) => !existing.includes(slug));

  return { paths, discovered, existing, removed };
}

function selfTest() {
  const paths = [
    "books/book-a/config.yaml",
    "books/book-a/01_intro.md",
    "books/book-b/cover.png",
    "articles/not-a-book.md",
    "books/Bad_Slug/config.yaml",
    "books/book-b/02_body.md",
  ];
  const slugs = extractBookSlugs(paths);
  if (JSON.stringify(slugs) !== JSON.stringify(["book-a", "book-b"])) {
    throw new Error(`extractBookSlugs failed: ${JSON.stringify(slugs)}`);
  }

  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "changed-zenn-books-"));
  try {
    fs.mkdirSync(path.join(tmp, "books", "book-a"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "books", "book-a", "config.yaml"), "title: a\n");
    const existing = filterExistingBooks(["book-a", "book-b"], tmp);
    if (JSON.stringify(existing) !== JSON.stringify(["book-a"])) {
      throw new Error(`filterExistingBooks failed: ${JSON.stringify(existing)}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  let missingBaseRejected = false;
  try {
    parseArgs([]);
  } catch {
    missingBaseRejected = true;
  }
  if (!missingBaseRejected) throw new Error("missing base was not rejected");

  const parsed = parseArgs(["--base", "origin/release-zenn"]);
  if (parsed.base !== "origin/release-zenn") {
    throw new Error(`parseArgs failed: ${JSON.stringify(parsed)}`);
  }

  console.log(`${LABEL} self-test PASS`);
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.selfTest) {
      selfTest();
      return;
    }

    const result = listChangedBooks(args.base);
    for (const slug of result.existing) {
      console.log(slug);
    }
    for (const slug of result.removed) {
      console.error(`${LABEL} skip removed book: ${slug}`);
    }
  } catch (error) {
    console.error(`${LABEL} ERROR: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  parseArgs,
  isValidBookSlug,
  extractBookSlugs,
  filterExistingBooks,
  changedPaths,
  listChangedBooks,
};
