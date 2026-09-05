#!/usr/bin/env node
// Clean: `articles_note/build/` に溜まる note インポート用 WXR を、記事ごとの最新1本だけに整理する。
//
// ■ 背景（なぜ必要か）
//   `md_to_wxr.py` は `--out` 省略時に `import-<slug>-YYYYMMDD-HHMM.xml` を生成する。
//   タイムスタンプは**分粒度**なので、同一分内の再実行は同名を `out.write_text` で上書きし、
//   分をまたげば別ファイルとして積み上がる。つまり多くの場合、生成し直すたびに旧版が残る。
//   note のインポート UI はファイル選択式なので、**旧版を取り違えてアップロードすると、
//   古い本文の下書きが note 側に作られる**。インポートは常に新規下書きを作る（既存記事の
//   上書き不可）ため、取り違えの復旧には note 側の手動削除が必要になる。
//
// ■ ファイル名の slug（`md_to_wxr.py` の derive_default_outname が正本）
//   - 単一ファイル指定  → そのファイルの stem（＝記事 slug）
//   - 単一ディレクトリ指定 → ディレクトリ名（`new` / `drafts` / `published`）
//   - 複数指定          → `bundle`（ディレクトリ名が空なら `batch`）
//   後者2つは「複数記事を束ねた生成物」であり、slug から記事を逆引きできない。
//
// ■ 削除する / 残すの判定
//   1. 予約名（new / drafts / published / bundle / batch）の slug は**一切削除しない**。
//      同一 slug でも束ねた記事集合が実行ごとに異なりうるため、新しい版が古い版の上位互換とは
//      限らず、「最新1本を残す」規則を適用すると失われる生成物がある。よって旧版も残す。
//   2. 上記以外で、同一 slug の WXR が複数ある場合は**タイムスタンプが最新のものだけ残す**
//   3. 上記以外で、`articles_note/{new,published,drafts}/<slug>.md` がどこにも存在しない slug の
//      WXR は**全削除**する（new/ に無い＝インポート予定なし。published/ drafts/ のミラーは
//      note guid 名なので、guid 由来の WXR を誤って消さないために live 判定へ含める）
//   4. `.DS_Store` 等、`import-*.xml` 以外のファイルは対象外（触らない）
//
//   `articles_note/build/` は `.gitignore` 済みのローカル生成物であり、削除しても
//   `md_to_wxr.py` の再実行でいつでも復元できる。よって削除は破壊的操作にあたらない。
//
// ■ 使い方
//   npm run clean:note-build              # 実削除
//   npm run clean:note-build:dry          # 削除対象の一覧表示のみ（`--` 不要。推奨）
//   npm run clean:note-build -- --dry-run # 同上（`--` を忘れると npm がフラグを食う点に注意。
//                                         #  その場合も npm_config_dry_run 経由で dry-run 扱いにする）
//   npm run test:clean-note-build         # self-test

const fs = require("fs");
const os = require("os");
const path = require("path");

const LABEL = "[clean:note-build]";
const BUILD_DIR = "articles_note/build";
const NEW_DIR = "articles_note/new";
const LIVE_DIRS = ["articles_note/new", "articles_note/published", "articles_note/drafts"];

// import-<slug>-YYYYMMDD-HHMM.xml
const FILE_RE = /^import-(.+)-(\d{8})-(\d{4})\.xml$/;

// md_to_wxr.py が「記事 slug ではない」名前を付けるケース（ディレクトリ指定 / 複数指定）
const RESERVED_SLUGS = new Set(["new", "drafts", "published", "bundle", "batch"]);

/**
 * dry-run 判定。`npm run <script> --dry-run` は `--` 忘れで npm 自身のフラグとして食われ、
 * process.argv には現れないまま script が実行される（＝確認のつもりで実削除される）。
 * このとき npm は環境変数 npm_config_dry_run=true を渡すので、これも dry-run として扱う。
 * @returns {{dryRun: boolean, source: string|null}}
 */
function resolveDryRun(argv, env) {
  if (argv.includes("--dry-run")) return { dryRun: true, source: "引数 --dry-run" };
  const v = env.npm_config_dry_run;
  if (v !== undefined && v !== "" && v !== "false" && v !== "0") {
    return { dryRun: true, source: "環境変数 npm_config_dry_run（`--` なしの npm フラグ）" };
  }
  return { dryRun: false, source: null };
}

/**
 * build ディレクトリの内容から「残す/消す」を決める。純関数（fs に触らない）ので self-test しやすい。
 * @param {string[]} fileNames build/ 直下のファイル名一覧
 * @param {Set<string>} liveSlugs articles_note/{new,published,drafts}/ に .md が実在する slug の集合
 * @returns {{keep: string[], remove: {name: string, reason: string}[], reserved: {name: string, reason: string}[], ignored: string[]}}
 */
function plan(fileNames, liveSlugs) {
  const keep = [];
  const remove = [];
  const reserved = [];
  const ignored = [];
  const bySlug = new Map();

  for (const name of fileNames) {
    const m = FILE_RE.exec(name);
    if (!m) {
      ignored.push(name);
      continue;
    }
    const [, slug, ymd, hm] = m;
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push({ name, stamp: `${ymd}${hm}` });
  }

  for (const [slug, entries] of bySlug) {
    if (RESERVED_SLUGS.has(slug)) {
      for (const e of entries) {
        reserved.push({
          name: e.name,
          reason: `slug "${slug}" は複数記事を束ねた生成物で provenance 不明のため自動削除しない`,
        });
      }
      continue;
    }
    if (!liveSlugs.has(slug)) {
      for (const e of entries) {
        remove.push({ name: e.name, reason: `${NEW_DIR}/${slug}.md が存在しない（インポート予定なし）` });
      }
      continue;
    }
    // タイムスタンプ文字列は固定長ゼロ埋めなので辞書順比較で時系列順になる
    entries.sort((a, b) => (a.stamp < b.stamp ? 1 : a.stamp > b.stamp ? -1 : 0));
    keep.push(entries[0].name);
    for (const e of entries.slice(1)) {
      remove.push({ name: e.name, reason: `同一 slug の新しい版 ${entries[0].name} がある` });
    }
  }

  keep.sort();
  remove.sort((a, b) => a.name.localeCompare(b.name));
  reserved.sort((a, b) => a.name.localeCompare(b.name));
  ignored.sort();
  return { keep, remove, reserved, ignored };
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function liveSlugsFrom(dirs) {
  const set = new Set();
  for (const dir of dirs) {
    for (const f of readDirSafe(dir) || []) {
      if (f.endsWith(".md")) set.add(f.slice(0, -3));
    }
  }
  return set;
}

function run({ buildDir, liveDirs, dryRun, dryRunSource }) {
  const files = readDirSafe(buildDir);
  if (files === null) {
    console.log(`${LABEL} SKIP: ${buildDir} が存在しない（生成物なし）`);
    return 0;
  }

  if (dryRun) console.log(`${LABEL} dry-run 判定: ${dryRunSource || "不明"}`);

  const { keep, remove, reserved, ignored } = plan(files, liveSlugsFrom(liveDirs));

  if (remove.length === 0) {
    console.log(
      `${LABEL} OK: 整理不要（keep=${keep.length}, reserved=${reserved.length}, ignored=${ignored.length}）`
    );
  } else {
    for (const r of remove) {
      const verb = dryRun ? "would remove" : "removed";
      if (!dryRun) fs.unlinkSync(path.join(buildDir, r.name));
      console.log(`${LABEL} ${verb}: ${r.name}  — ${r.reason}`);
    }
    const head = dryRun ? "DRY-RUN" : "DONE";
    console.log(`${LABEL} ${head}: ${remove.length}件を削除${dryRun ? "する予定" : ""}、${keep.length}件を保持`);
  }

  for (const r of reserved) console.log(`${LABEL} kept (reserved): ${r.name}  — ${r.reason}`);
  for (const name of keep) console.log(`${LABEL} keep: ${name}`);
  return 0;
}

// ---------------------------------------------------------------- self-test

function selfTest() {
  let pass = 0;
  let fail = 0;
  const check = (name, actual, expected) => {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
      pass += 1;
    } else {
      fail += 1;
      console.error(`  FAIL ${name}\n    expected: ${e}\n    actual  : ${a}`);
    }
  };

  // 1. 同一 slug の複数版 → 最新1本だけ残る
  {
    const r = plan(
      [
        "import-foo-20260101-0900.xml",
        "import-foo-20260905-1637.xml",
        "import-foo-20260831-0906.xml",
      ],
      new Set(["foo"])
    );
    check("multi-version keep", r.keep, ["import-foo-20260905-1637.xml"]);
    check("multi-version remove", r.remove.map((x) => x.name), [
      "import-foo-20260101-0900.xml",
      "import-foo-20260831-0906.xml",
    ]);
  }

  // 2. 同日・時刻違いも正しく比較する
  {
    const r = plan(
      ["import-foo-20260905-0900.xml", "import-foo-20260905-1637.xml"],
      new Set(["foo"])
    );
    check("same-day keep", r.keep, ["import-foo-20260905-1637.xml"]);
  }

  // 3. new/ に無い slug は最新版でも削除する
  {
    const r = plan(["import-gone-20260905-1637.xml"], new Set(["foo"]));
    check("orphan slug keep", r.keep, []);
    check("orphan slug remove", r.remove.map((x) => x.name), ["import-gone-20260905-1637.xml"]);
  }

  // 4. slug にハイフン・数字を含んでも境界を誤らない
  {
    const slug = "ai-software-engineering-principles-note";
    const r = plan([`import-${slug}-20260905-1637.xml`], new Set([slug]));
    check("hyphenated slug", r.keep, [`import-${slug}-20260905-1637.xml`]);
  }

  // 5. import-*.xml 以外は触らない
  {
    const r = plan([".DS_Store", "notes.txt", "import-foo-20260905-1637.xml"], new Set(["foo"]));
    check("ignored files", r.ignored, [".DS_Store", "notes.txt"]);
    check("ignored not removed", r.remove, []);
  }

  // 6. 空ディレクトリ
  {
    const r = plan([], new Set());
    check("empty dir", { keep: r.keep, remove: r.remove }, { keep: [], remove: [] });
  }

  // 7. 複数 slug が混在しても互いに干渉しない
  {
    const r = plan(
      [
        "import-a-20260101-0900.xml",
        "import-a-20260102-0900.xml",
        "import-b-20260103-0900.xml",
      ],
      new Set(["a", "b"])
    );
    check("multi slug keep", r.keep, ["import-a-20260102-0900.xml", "import-b-20260103-0900.xml"]);
    check("multi slug remove", r.remove.map((x) => x.name), ["import-a-20260101-0900.xml"]);
  }

  // 8. --dry-run では実ファイルが消えないこと（fs 経路の検証）
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-note-build-"));
    const b = path.join(tmp, "build");
    const n = path.join(tmp, "new");
    fs.mkdirSync(b);
    fs.mkdirSync(n);
    fs.writeFileSync(path.join(n, "foo.md"), "# foo\n");
    fs.writeFileSync(path.join(b, "import-foo-20260101-0900.xml"), "<x/>");
    fs.writeFileSync(path.join(b, "import-foo-20260905-1637.xml"), "<x/>");

    const logged = [];
    const orig = console.log;
    console.log = (...a) => logged.push(a.join(" "));
    run({ buildDir: b, liveDirs: [n], dryRun: true, dryRunSource: "self-test" });
    const afterDry = fs.readdirSync(b).sort();
    run({ buildDir: b, liveDirs: [n], dryRun: false, dryRunSource: null });
    const afterReal = fs.readdirSync(b).sort();
    console.log = orig;

    check("dry-run keeps files", afterDry, [
      "import-foo-20260101-0900.xml",
      "import-foo-20260905-1637.xml",
    ]);
    check("real run deletes old", afterReal, ["import-foo-20260905-1637.xml"]);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 9. build/ 不在は SKIP（例外を投げない）
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-note-build-"));
    const logged = [];
    const orig = console.log;
    console.log = (...a) => logged.push(a.join(" "));
    const code = run({ buildDir: path.join(tmp, "nope"), liveDirs: [tmp], dryRun: false });
    console.log = orig;
    check("missing build dir exit", code, 0);
    check("missing build dir skip log", logged.some((l) => l.includes("SKIP")), true);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 10. 予約名 slug（ディレクトリ指定・複数指定の生成物）は旧版も含めて削除しない
  {
    for (const slug of ["bundle", "batch", "new", "drafts", "published"]) {
      const r = plan(
        [`import-${slug}-20260101-0900.xml`, `import-${slug}-20260905-1637.xml`],
        new Set(["foo"])
      );
      check(`reserved ${slug} not removed`, r.remove, []);
      check(`reserved ${slug} listed`, r.reserved.map((x) => x.name), [
        `import-${slug}-20260101-0900.xml`,
        `import-${slug}-20260905-1637.xml`,
      ]);
      check(`reserved ${slug} not in keep`, r.keep, []);
    }
  }

  // 11. published/ drafts/ の note guid ミラーも live 扱い（guid 由来の WXR を消さない）
  {
    const r = plan(
      ["import-n2ef833cbece8-20260905-1637.xml", "import-nabc123-20260905-1637.xml"],
      new Set(["n2ef833cbece8", "nabc123"])
    );
    check("guid slugs kept", r.keep, [
      "import-n2ef833cbece8-20260905-1637.xml",
      "import-nabc123-20260905-1637.xml",
    ]);
    check("guid slugs not removed", r.remove, []);
  }

  // 12. liveSlugsFrom は new/published/drafts を横断して集める
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-note-build-"));
    const dirs = ["new", "published", "drafts"].map((d) => path.join(tmp, d));
    dirs.forEach((d) => fs.mkdirSync(d));
    fs.writeFileSync(path.join(dirs[0], "foo.md"), "#\n");
    fs.writeFileSync(path.join(dirs[1], "n2ef833cbece8.md"), "#\n");
    fs.writeFileSync(path.join(dirs[2], "n99draft.md"), "#\n");
    fs.writeFileSync(path.join(dirs[0], "not-md.txt"), "x");
    check(
      "liveSlugsFrom crosses dirs",
      [...liveSlugsFrom(dirs)].sort(),
      ["foo", "n2ef833cbece8", "n99draft"]
    );
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  // 13. `--` 忘れ（npm_config_dry_run）でも dry-run と判定する
  {
    check("dry-run via argv", resolveDryRun(["--dry-run"], {}), {
      dryRun: true,
      source: "引数 --dry-run",
    });
    const env = resolveDryRun([], { npm_config_dry_run: "true" });
    check("dry-run via env flag", env.dryRun, true);
    check("dry-run via env source", env.source.includes("npm_config_dry_run"), true);
    check("no dry-run by default", resolveDryRun([], {}), { dryRun: false, source: null });
    check("env false is not dry-run", resolveDryRun([], { npm_config_dry_run: "false" }).dryRun, false);
    check("env empty is not dry-run", resolveDryRun([], { npm_config_dry_run: "" }).dryRun, false);
  }

  // 14. npm_config_dry_run 環境下では実ファイルが消えない（fs 経路の回帰検出）
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clean-note-build-"));
    const b = path.join(tmp, "build");
    const n = path.join(tmp, "new");
    fs.mkdirSync(b);
    fs.mkdirSync(n);
    fs.writeFileSync(path.join(n, "foo.md"), "# foo\n");
    fs.writeFileSync(path.join(b, "import-foo-20260101-0900.xml"), "<x/>");
    fs.writeFileSync(path.join(b, "import-foo-20260905-1637.xml"), "<x/>");

    const { dryRun, source } = resolveDryRun([], { npm_config_dry_run: "true" });
    const logged = [];
    const orig = console.log;
    console.log = (...a) => logged.push(a.join(" "));
    run({ buildDir: b, liveDirs: [n], dryRun, dryRunSource: source });
    console.log = orig;
    check("env dry-run keeps files", fs.readdirSync(b).sort(), [
      "import-foo-20260101-0900.xml",
      "import-foo-20260905-1637.xml",
    ]);
    check("env dry-run logs source", logged.some((l) => l.includes("npm_config_dry_run")), true);
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`${LABEL} self-test: ${pass} passed, ${fail} failed`);
  return fail === 0 ? 0 : 1;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    process.exit(selfTest());
  }
  const { dryRun, source } = resolveDryRun(args, process.env);
  process.exit(
    run({ buildDir: BUILD_DIR, liveDirs: LIVE_DIRS, dryRun, dryRunSource: source })
  );
}

main();
