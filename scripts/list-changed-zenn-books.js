#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const os = require("os");

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

function publishedState(config) {
  for (const rawLine of String(config).split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^published:\s*["']?(true|false)["']?\s*(?:#.*)?$/i);
    if (match) return match[1].toLowerCase() === "true";
  }
  return null;
}

function classifyBooks(slugs, rootDir = ROOT) {
  const published = [];
  const draft = [];
  const removed = [];

  for (const slug of slugs) {
    const configPath = path.join(rootDir, "books", slug, "config.yaml");
    if (!fs.existsSync(configPath)) {
      removed.push(slug);
      continue;
    }

    const state = publishedState(fs.readFileSync(configPath, "utf8"));
    if (state === true) published.push(slug);
    else draft.push(slug);
  }

  return { published, draft, removed };
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
  const classified = classifyBooks(discovered, rootDir);

  return { paths, discovered, ...classified };
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

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "changed-zenn-books-"));
  try {
    fs.mkdirSync(path.join(tmp, "books", "book-a"), { recursive: true });
    fs.mkdirSync(path.join(tmp, "books", "book-b"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "books", "book-a", "config.yaml"),
      "title: a\npublished: true\n",
    );
    fs.writeFileSync(
      path.join(tmp, "books", "book-b", "config.yaml"),
      "title: b\npublished: false\n",
    );
    const classified = classifyBooks(["book-a", "book-b", "book-c"], tmp);
    if (JSON.stringify(classified.published) !== JSON.stringify(["book-a"])) {
      throw new Error(`published classification failed: ${JSON.stringify(classified)}`);
    }
    if (JSON.stringify(classified.draft) !== JSON.stringify(["book-b"])) {
      throw new Error(`draft classification failed: ${JSON.stringify(classified)}`);
    }
    if (JSON.stringify(classified.removed) !== JSON.stringify(["book-c"])) {
      throw new Error(`removed classification failed: ${JSON.stringify(classified)}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const gitTmp = fs.mkdtempSync(path.join(os.tmpdir(), "changed-zenn-books-git-"));
  try {
    const git = (...args) => {
      const result = spawnSync("git", args, { cwd: gitTmp, encoding: "utf8" });
      if (result.status !== 0) {
        throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
      }
      return result.stdout.trim();
    };

    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "fixture");

    fs.mkdirSync(path.join(gitTmp, "books", "book-a"), { recursive: true });
    fs.mkdirSync(path.join(gitTmp, "books", "book-b"), { recursive: true });
    fs.mkdirSync(path.join(gitTmp, "articles"), { recursive: true });
    fs.writeFileSync(
      path.join(gitTmp, "books", "book-a", "config.yaml"),
      "title: a\npublished: true\n",
    );
    fs.writeFileSync(path.join(gitTmp, "books", "book-a", "01.md"), "# A\n");
    fs.writeFileSync(
      path.join(gitTmp, "books", "book-b", "config.yaml"),
      "title: b\npublished: true\n",
    );
    fs.writeFileSync(path.join(gitTmp, "books", "book-b", "01.md"), "# B\n");
    fs.writeFileSync(path.join(gitTmp, "articles", "x.md"), "# X\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    const base = git("rev-parse", "HEAD");

    fs.writeFileSync(path.join(gitTmp, "books", "book-a", "01.md"), "# A2\n");
    fs.rmSync(path.join(gitTmp, "books", "book-b"), { recursive: true, force: true });
    fs.writeFileSync(path.join(gitTmp, "articles", "x.md"), "# X2\n");
    git("add", "-A");
    git("commit", "-q", "-m", "change");

    const changed = listChangedBooks(base, gitTmp);
    if (JSON.stringify(changed.published) !== JSON.stringify(["book-a"])) {
      throw new Error(`git fixture published failed: ${JSON.stringify(changed)}`);
    }
    if (JSON.stringify(changed.removed) !== JSON.stringify(["book-b"])) {
      throw new Error(`git fixture removed failed: ${JSON.stringify(changed)}`);
    }
    if (changed.discovered.includes("x")) {
      throw new Error(`article path leaked into Book detection: ${JSON.stringify(changed)}`);
    }
  } finally {
    fs.rmSync(gitTmp, { recursive: true, force: true });
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
    for (const slug of result.published) {
      console.log(slug);
    }
    for (const slug of result.draft) {
      console.error(`${LABEL} skip unpublished book: ${slug}`);
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
  publishedState,
  classifyBooks,
  changedPaths,
  listChangedBooks,
};
