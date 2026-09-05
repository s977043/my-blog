#!/usr/bin/env node
// Clean: `articles_note/build/` に溜まる note インポート用 WXR を、記事ごとの最新1本だけに整理する。
//
// ■ 背景（なぜ必要か）
//   `md_to_wxr.py` は実行のたびに `import-<slug>-YYYYMMDD-HHMM.xml` を**新規ファイルとして**
//   追記していく（同名上書きをしない設計）。そのため同じ記事を何度か生成し直すと、
//   build/ に旧版が積み上がる。note のインポート UI はファイル選択式なので、**旧版を取り違えて
//   アップロードすると、古い本文の下書きが note 側に作られる**。インポートは常に新規下書きを
//   作る（既存記事の上書き不可）ため、取り違えの復旧には note 側の手動削除が必要になる。
//
// ■ 削除する / 残すの判定
//   1. 同一 slug の WXR が複数ある場合、**ファイル名のタイムスタンプが最新のものだけ残す**
//   2. `articles_note/new/<slug>.md` が存在しない slug の WXR は**全削除**する
//      （note へ公開済みの記事は new/ から外れ、`published/` ミラーへ降りる運用のため、
//       new/ に無い＝もうインポートする予定がない、と判断できる）
//   3. `.DS_Store` 等、`import-*.xml` 以外のファイルは対象外（触らない）
//
//   `articles_note/build/` は `.gitignore` 済みのローカル生成物であり、削除しても
//   `md_to_wxr.py` の再実行でいつでも復元できる。よって削除は破壊的操作にあたらない。
//
// ■ 使い方
//   npm run clean:note-build              # 実削除
//   npm run clean:note-build -- --dry-run # 削除対象の一覧表示のみ（何も消さない）
//   npm run test:clean-note-build         # self-test

const fs = require("fs");
const os = require("os");
const path = require("path");

const LABEL = "[clean:note-build]";
const BUILD_DIR = "articles_note/build";
const NEW_DIR = "articles_note/new";

// import-<slug>-YYYYMMDD-HHMM.xml
const FILE_RE = /^import-(.+)-(\d{8})-(\d{4})\.xml$/;

/**
 * build ディレクトリの内容から「残す/消す」を決める。純関数（fs に触らない）ので self-test しやすい。
 * @param {string[]} fileNames build/ 直下のファイル名一覧
 * @param {Set<string>} liveSlugs articles_note/new/ に .md が実在する slug の集合
 * @returns {{keep: string[], remove: {name: string, reason: string}[], ignored: string[]}}
 */
function plan(fileNames, liveSlugs) {
  const keep = [];
  const remove = [];
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
  ignored.sort();
  return { keep, remove, ignored };
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function liveSlugsFrom(dir) {
  const entries = readDirSafe(dir) || [];
  return new Set(entries.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)));
}

function run({ buildDir, newDir, dryRun }) {
  const files = readDirSafe(buildDir);
  if (files === null) {
    console.log(`${LABEL} SKIP: ${buildDir} が存在しない（生成物なし）`);
    return 0;
  }

  const { keep, remove, ignored } = plan(files, liveSlugsFrom(newDir));

  if (remove.length === 0) {
    console.log(`${LABEL} OK: 整理不要（keep=${keep.length}, ignored=${ignored.length}）`);
  } else {
    for (const r of remove) {
      const verb = dryRun ? "would remove" : "removed";
      if (!dryRun) fs.unlinkSync(path.join(buildDir, r.name));
      console.log(`${LABEL} ${verb}: ${r.name}  — ${r.reason}`);
    }
    const head = dryRun ? "DRY-RUN" : "DONE";
    console.log(`${LABEL} ${head}: ${remove.length}件を削除${dryRun ? "する予定" : ""}、${keep.length}件を保持`);
  }

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
    run({ buildDir: b, newDir: n, dryRun: true });
    const afterDry = fs.readdirSync(b).sort();
    run({ buildDir: b, newDir: n, dryRun: false });
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
    const code = run({ buildDir: path.join(tmp, "nope"), newDir: tmp, dryRun: false });
    console.log = orig;
    check("missing build dir exit", code, 0);
    check("missing build dir skip log", logged.some((l) => l.includes("SKIP")), true);
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
  process.exit(
    run({ buildDir: BUILD_DIR, newDir: NEW_DIR, dryRun: args.includes("--dry-run") })
  );
}

main();
