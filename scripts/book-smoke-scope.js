#!/usr/bin/env node
// PR の差分が Book smoke（River Review Book preview + browser check）に影響しうるかを判定する。
// 影響しないと確定できたときだけ GITHUB_OUTPUT に skip_smoke=true を書く。
// 判定できないとき（merge commit でない / git 失敗 / 空 diff）は常に実行側へ倒す。
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const SCOPE_PREFIXES = ["books/", "images/"];
const SCOPE_FILES = [
  "scripts/check-zenn-book-browser.mjs",
  "scripts/book-smoke-scope.js",
  "package.json",
  "package-lock.json",
  ".github/workflows/ci.yml",
];

function inScope(file) {
  return (
    SCOPE_FILES.includes(file) ||
    SCOPE_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
}

function classify(files) {
  if (!files.length) return { skip: false, reason: "empty diff" };
  const hits = files.filter(inScope);
  if (hits.length)
    return { skip: false, reason: `in scope: ${hits.join(", ")}` };
  return { skip: true, reason: "no Book-related path changed" };
}

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function decide(cwd) {
  try {
    const parents = git(cwd, ["rev-list", "--parents", "-n", "1", "HEAD"])
      .trim()
      .split(/\s+/);
    if (parents.length !== 3)
      return { skip: false, reason: "HEAD is not a 2-parent merge commit" };
    const out = git(cwd, [
      "diff",
      "--name-only",
      "--no-renames",
      "HEAD^1",
      "HEAD",
    ]);
    return classify(
      out
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
  } catch (error) {
    return {
      skip: false,
      reason: `git failed: ${String(error.message).split("\n")[0]}`,
    };
  }
}

function report(result, outputPath) {
  if (result.skip) {
    console.log(`::notice::Book smoke skipped (${result.reason})`);
    if (outputPath) fs.appendFileSync(outputPath, "skip_smoke=true\n");
  } else if (/^(git failed|HEAD is not a 2-parent merge)/.test(result.reason)) {
    console.log(
      `::warning::Book smoke scope undecidable (${result.reason}); running smoke`,
    );
  } else {
    console.log(`[book-smoke-scope] run smoke (${result.reason})`);
  }
}

function selfTest() {
  let passed = 0;
  const expect = (name, actual, skip) => {
    if (actual.skip !== skip)
      throw new Error(
        `${name}: expected skip=${skip}, got ${JSON.stringify(actual)}`,
      );
    passed += 1;
  };

  expect("books change", classify(["books/river-review-guide/01.md"]), false);
  expect(
    "articles only",
    classify(["articles/foo.md", "Qiita/public/bar.md"]),
    true,
  );
  expect("package-lock", classify(["package-lock.json"]), false);
  expect("ci.yml", classify([".github/workflows/ci.yml"]), false);
  expect("images", classify(["images/foo/a.png"]), false);
  expect("empty diff", classify([]), false);
  expect("self", classify(["scripts/book-smoke-scope.js"]), false);
  expect(
    "prefix lookalikes",
    classify(["books-archive/x.md", "imagesX.md", "docs/books/a.md"]),
    true,
  );
  expect("package.json", classify(["package.json"]), false);
  expect("other workflow", classify([".github/workflows/other.yml"]), true);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "book-smoke-scope-"));
  try {
    const run = (...args) => git(dir, args);
    const commit = (msg) =>
      run(
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@example.com",
        "commit",
        "-q",
        "-m",
        msg,
      );
    run("init", "-q", "-b", "main");
    expect("git failure (no HEAD)", decide(dir), false);

    fs.mkdirSync(path.join(dir, "books/x"), { recursive: true });
    fs.writeFileSync(path.join(dir, "books/x/a.md"), "a\n");
    fs.writeFileSync(path.join(dir, "books/x/b.md"), "b\n");
    run("add", ".");
    commit("base");
    const mergePr = (name, mutate) => {
      run("checkout", "-q", "-b", name, "main");
      mutate();
      run("add", "-A");
      commit(name);
      run("checkout", "-q", "--detach", "main");
      run(
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@example.com",
        "merge",
        "-q",
        "--no-ff",
        "-m",
        `merge ${name}`,
        name,
      );
      const result = decide(dir);
      run("checkout", "-q", "main");
      return result;
    };

    expect(
      "rename out of books",
      mergePr("rename", () => {
        fs.mkdirSync(path.join(dir, "articles"), { recursive: true });
        run("mv", "books/x/a.md", "articles/a.md");
      }),
      false,
    );
    expect(
      "delete in books",
      mergePr("delete", () => run("rm", "-q", "books/x/b.md")),
      false,
    );
    expect(
      "non-books merge",
      mergePr("notes", () =>
        fs.writeFileSync(path.join(dir, "notes.md"), "n\n"),
      ),
      true,
    );

    fs.writeFileSync(path.join(dir, "other.md"), "o\n");
    run("add", ".");
    commit("single parent");
    expect("non-merge commit", decide(dir), false);

    const before = process.env.GITHUB_OUTPUT;
    delete process.env.GITHUB_OUTPUT;
    report({ skip: true, reason: "self-test" }, process.env.GITHUB_OUTPUT);
    if (before !== undefined) process.env.GITHUB_OUTPUT = before;
    passed += 1;

    const logged = [];
    const origLog = console.log;
    console.log = (msg) => logged.push(msg);
    try {
      report({ skip: false, reason: "git failed: x" });
      report({ skip: false, reason: "empty diff" });
    } finally {
      console.log = origLog;
    }
    if (!logged[0].startsWith("::warning::") || logged[1].startsWith("::warning::"))
      throw new Error(`warning branch: ${JSON.stringify(logged)}`);
    passed += 1;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log(`[test:book-smoke-scope] PASS (${passed} cases)`);
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else report(decide(process.cwd()), process.env.GITHUB_OUTPUT);
}

module.exports = { classify, decide, inScope };
