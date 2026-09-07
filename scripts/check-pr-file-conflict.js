#!/usr/bin/env node
// Check: いま触っているファイルを、他の open PR が同時に触っていないかを検知する。
//
// ■ 背景（なぜ必要か）
//   2026-09-06、`articles_note/new/harness-practice-note.md` を複数ゲートで仕上げている最中に、
//   並行セッションが同じファイル 1 本だけを +175/-128 で書き換える PR #623 を作成し、
//   27 分後にマージした（作成 09:32:01Z / マージ 09:59:26Z）。オーガナイザー側が気づいたのは
//   自分の PR #624（作成 09:35:19Z）の CI を見たときで、**気づけた手がかりは PR 番号の飛びだけ**
//   だった。実害は限定的だったが、検知手段が存在しないこと自体が問題なので機械化する。
//
// ■ 何を見るか
//   対象ファイル（引数、無ければ現ブランチの `git diff origin/main...HEAD --name-only`）と、
//   open PR が触っているファイル集合の積を取る。自分のブランチに対応する PR は当然一致するので除外する。
//
// ■ WARN（exit 0）にした理由
//   `check:orphan-docs` が WARN を選んだのと同じ理由（同スクリプト冒頭コメント）に加え、
//   **重なり自体は必ずしも異常ではない**（同じ記事を別観点で直す stacked な作業はありうる）。
//   ここで欲しいのは「気づく手段」であって停止ではない。ブロックしたい場面のために `--strict`
//   （検知したら exit 1）を用意し、既定は WARN に倒す。
//
// ■ 集約ランナー `npm run check` には入れない
//   `docs/worker-discipline-template.md` §8 の「読むだけの検査は集約へ」は満たすが、
//   本 check は **gh API とネットワークに依存する**。`check:qiita-drift` が API レート制限を理由に
//   集約へ入れていないのと同じ扱いにする（CI の毎回実行で API を焼かない / オフラインで赤くしない）。
//   代わりに self-test だけを CI へ繋ぐ。
//
// ■ API レート制限・オフライン時
//   gh API 呼び出しは **`gh pr list` の 1 回だけ**（`--json files` で open PR のファイル一覧まで
//   まとめて取れる）。gh 未インストール / 未認証 / ネットワーク不通 / レート制限のいずれでも
//   **SKIP して exit 0**（誤検知しない）。`check:qiita-drift` の skip 方針と揃える。
//
// ■ 使い方
//   npm run check:pr-conflict                       # 現ブランチの変更ファイルで判定
//   npm run check:pr-conflict -- <file> [<file>...]  # ファイルを明示
//   npm run check:pr-conflict -- --strict            # 検知したら exit 1
//   npm run test:pr-conflict                         # self-test（gh API を叩かない）

const { execFileSync } = require("child_process");

const LABEL = "[check:pr-conflict]";
const PR_LIMIT = 100;

// ---- 純関数（self-test 対象） -------------------------------------------

/**
 * 対象ファイルと open PR 一覧から衝突を求める。
 * @param {string[]} targetFiles 自分が触っているファイル（リポジトリルート相対）
 * @param {Array<{number:number,headRefName:string,title:string,updatedAt:string,author?:{login:string},files:Array<{path:string}>}>} prs
 * @param {{selfBranch?:string, selfPr?:number}} self 除外する自分の PR
 * @returns {Array<{number:number,branch:string,title:string,updatedAt:string,author:string,files:string[]}>}
 */
function findConflicts(targetFiles, prs, self = {}) {
  const targets = new Set(targetFiles.filter(Boolean));
  const out = [];
  for (const pr of prs || []) {
    if (self.selfPr && pr.number === self.selfPr) continue;
    if (self.selfBranch && pr.headRefName === self.selfBranch) continue;
    const hit = (pr.files || [])
      .map((f) => f.path)
      .filter((p) => targets.has(p));
    if (hit.length === 0) continue;
    out.push({
      number: pr.number,
      branch: pr.headRefName,
      title: pr.title,
      updatedAt: pr.updatedAt,
      author: (pr.author && pr.author.login) || "unknown",
      files: hit.sort(),
    });
  }
  return out.sort((a, b) => a.number - b.number);
}

function formatReport(conflicts) {
  return conflicts
    .map(
      (c) =>
        `  - PR #${c.number} (${c.branch} / @${c.author} / updated ${c.updatedAt})\n` +
        c.files.map((f) => `      ${f}`).join("\n") +
        `\n      ${c.title}`,
    )
    .join("\n");
}

// ---- I/O ----------------------------------------------------------------

function run(cmd, args) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function currentBranch() {
  try {
    return run("git", ["branch", "--show-current"]).trim() || null;
  } catch {
    return null;
  }
}

function changedFiles() {
  try {
    return run("git", ["diff", "origin/main...HEAD", "--name-only"])
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** open PR 一覧を取得。取得できなければ null（= SKIP）。 */
function fetchOpenPrs() {
  const gh = process.env.PR_CONFLICT_GH || "gh";
  try {
    const raw = run(gh, [
      "pr",
      "list",
      "--state",
      "open",
      "--limit",
      String(PR_LIMIT),
      "--json",
      "number,headRefName,title,updatedAt,author,files",
    ]);
    return JSON.parse(raw);
  } catch (e) {
    const msg = (
      e && (e.stderr || e.message) ? String(e.stderr || e.message) : ""
    ).trim();
    console.log(
      `${LABEL} SKIP: open PR 一覧を取得できません（gh 未認証 / オフライン / レート制限）`,
    );
    if (msg) console.log(`${LABEL}   detail: ${msg.split("\n")[0]}`);
    return null;
  }
}

function main(argv) {
  const strict = argv.includes("--strict");
  const files = argv.filter((a) => !a.startsWith("--"));
  const targets = files.length > 0 ? files : changedFiles();

  if (targets.length === 0) {
    console.log(`${LABEL} OK: 対象ファイルなし（origin/main との差分が空）`);
    return 0;
  }

  const prs = fetchOpenPrs();
  if (prs === null) return 0;

  const conflicts = findConflicts(targets, prs, {
    selfBranch: currentBranch(),
  });
  if (conflicts.length === 0) {
    console.log(
      `${LABEL} OK: 他の open PR と重なるファイルなし (targets ${targets.length} / open PR ${prs.length})`,
    );
    return 0;
  }

  const level = strict ? "FAIL" : "WARN";
  console.log(
    `${LABEL} ${level}: ${conflicts.length} 件の open PR が同じファイルを触っています`,
  );
  console.log(formatReport(conflicts));
  console.log(
    `${LABEL} 先に相手の PR を確認する。並行作業なら分担を決めてから着手する。`,
  );
  return strict ? 1 : 0;
}

// ---- self-test ----------------------------------------------------------

function selfTest() {
  let failures = 0;
  const ok = (name) => console.log(`PASS: ${name}`);
  const ng = (name, detail) => {
    console.log(`FAIL: ${name}`);
    if (detail) console.log(`  | ${detail}`);
    failures++;
  };
  const eq = (name, got, want) => {
    const g = JSON.stringify(got);
    const w = JSON.stringify(want);
    g === w ? ok(name) : ng(name, `期待 ${w} / 実際 ${g}`);
  };

  const pr = (number, branch, files, extra = {}) => ({
    number,
    headRefName: branch,
    title: `PR ${number}`,
    updatedAt: "2026-09-06T09:32:01Z",
    author: { login: "s977043" },
    files: files.map((path) => ({ path })),
    ...extra,
  });

  // case1: 実インシデント再現（#623 が自分の対象ファイルを触っている）
  const target = ["articles_note/new/harness-practice-note.md"];
  const prs = [
    pr(623, "docs/note-harness-practice", [
      "articles_note/new/harness-practice-note.md",
    ]),
    pr(624, "fix/note-finalize-visual-gate", [
      ".claude/workflows/note-finalize.js",
    ]),
  ];
  eq(
    "case1 衝突している PR 番号を検出する",
    findConflicts(target, prs, {
      selfBranch: "fix/note-finalize-visual-gate",
    }).map((c) => c.number),
    [623],
  );

  // case2: 自分のブランチの PR は除外する
  eq(
    "case2 自ブランチの PR は衝突に数えない",
    findConflicts(target, [pr(700, "mine", target)], { selfBranch: "mine" }),
    [],
  );

  // case3: PR 番号での自己除外
  eq(
    "case3 selfPr で除外できる",
    findConflicts(target, [pr(700, "other", target)], { selfPr: 700 }),
    [],
  );

  // case4: 重ならなければ 0 件
  eq(
    "case4 重なりが無ければ検出しない",
    findConflicts(["docs/a.md"], prs, {}),
    [],
  );

  // case5: 衝突ファイル名だけを返す（PR の他ファイルは混ぜない）
  const c5 = findConflicts(
    ["docs/a.md"],
    [pr(701, "x", ["docs/a.md", "docs/b.md"])],
    {},
  );
  eq("case5 衝突したファイルのみ報告する", c5[0].files, ["docs/a.md"]);
  eq("case5 更新日時を保持する", c5[0].updatedAt, "2026-09-06T09:32:01Z");

  // case6: 複数 PR は番号昇順
  eq(
    "case6 複数衝突は番号昇順",
    findConflicts(
      ["docs/a.md"],
      [pr(9, "b", ["docs/a.md"]), pr(3, "c", ["docs/a.md"])],
      {},
    ).map((c) => c.number),
    [3, 9],
  );

  // case7: files が欠けた PR で落ちない
  eq(
    "case7 files 欠損 PR を無視する",
    findConflicts(["docs/a.md"], [{ number: 1, headRefName: "z" }], {}),
    [],
  );

  // case8: gh を叩かない e2e（偽 gh を PR_CONFLICT_GH で注入）
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pr-conflict-"));
  try {
    const fake = path.join(dir, "fake-gh");
    const payload = JSON.stringify([
      {
        number: 623,
        headRefName: "docs/note-harness-practice",
        title: "docs(note): apply harness article best practices",
        updatedAt: "2026-09-06T09:59:26Z",
        author: { login: "s977043" },
        files: [{ path: "articles_note/new/harness-practice-note.md" }],
      },
    ]);
    fs.writeFileSync(
      fake,
      `#!/usr/bin/env bash\nset -e\nif [ "$1" = "pr" ] && [ "$2" = "list" ]; then\n  cat <<'JSON'\n${payload}\nJSON\n  exit 0\nfi\necho "fake-gh: 未対応の呼び出し: $*" >&2\nexit 64\n`,
    );
    fs.chmodSync(fake, 0o755);
    const env = { ...process.env, PR_CONFLICT_GH: fake };
    const node = process.execPath;
    const self = __filename;
    const runCase = (args) => {
      try {
        const out = execFileSync(node, [self, ...args], {
          encoding: "utf8",
          env,
        });
        return { code: 0, out };
      } catch (e) {
        return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
      }
    };
    const warn = runCase(["articles_note/new/harness-practice-note.md"]);
    warn.code === 0 && /WARN/.test(warn.out) && /#623/.test(warn.out)
      ? ok("case8 偽 gh 経由で #623 を WARN 検知（exit 0）")
      : ng(
          "case8 偽 gh 経由で #623 を WARN 検知（exit 0）",
          `exit=${warn.code} out=${warn.out}`,
        );

    const strictRun = runCase([
      "--strict",
      "articles_note/new/harness-practice-note.md",
    ]);
    strictRun.code === 1 && /FAIL/.test(strictRun.out)
      ? ok("case9 --strict で exit 1")
      : ng(
          "case9 --strict で exit 1",
          `exit=${strictRun.code} out=${strictRun.out}`,
        );

    const clean = runCase(["docs/never-touched-by-open-pr.md"]);
    clean.code === 0 && /OK:/.test(clean.out)
      ? ok("case10 重なり無しは OK / exit 0")
      : ng(
          "case10 重なり無しは OK / exit 0",
          `exit=${clean.code} out=${clean.out}`,
        );

    // case11: gh が失敗しても SKIP して exit 0（オフライン / レート制限）
    const broken = path.join(dir, "broken-gh");
    fs.writeFileSync(
      broken,
      `#!/usr/bin/env bash\necho "API rate limit exceeded" >&2\nexit 1\n`,
    );
    fs.chmodSync(broken, 0o755);
    let skip;
    try {
      skip = {
        code: 0,
        out: execFileSync(node, [self, "docs/a.md"], {
          encoding: "utf8",
          env: { ...process.env, PR_CONFLICT_GH: broken },
        }),
      };
    } catch (e) {
      skip = { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
    }
    skip.code === 0 && /SKIP/.test(skip.out)
      ? ok("case11 gh 失敗時は SKIP して exit 0")
      : ng(
          "case11 gh 失敗時は SKIP して exit 0",
          `exit=${skip.code} out=${skip.out}`,
        );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  if (failures > 0) {
    console.log(`${LABEL} self-test FAILED: ${failures} 件`);
    return 1;
  }
  console.log(`${LABEL} self-test OK`);
  return 0;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  process.exit(argv.includes("--self-test") ? selfTest() : main(argv));
}

module.exports = { findConflicts, formatReport };
