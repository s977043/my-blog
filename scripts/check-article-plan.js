#!/usr/bin/env node
/**
 * check:article-plan
 *
 * docs/article-lifecycle-contract.md「4. Article Planの記録・PR作成ゲート」を機械で確認する。
 *
 * ■ 対象（新規記事のみ）
 *   articles/*.md（zenn）、Qiita/public/*.md（qiita）、articles_note/new/*.md（note）、
 *   articles_izanami/*.md（izanami）のうち README を除き、最初の追加 commit の日付が
 *   ゲート導入日以降のもの。未コミット（未追跡・ステージのみ）の原稿も新規記事とする。
 *   導入日・追加日の取り方は contract 記載のコマンドに合わせる（%cs、--follow なし）。
 *
 * ■ 誤検知を出さないための通過条件
 *   - 導入日が取れない（origin/main が無い、ゲート未マージ）なら対象 0 件で通す
 *   - shallow clone は追加日が当てにならないので対象 0 件で通す
 *   - ただし CI（GITHUB_ACTIONS=true）ではどちらも fail にする（lint が黙って無効化されるのを防ぐ）
 *
 * ■ 判定
 *   article_seeds/ 配下に `## (Draft|Approved) Article Plan: <channel>/<slug>` がちょうど1件あり、
 *   その節に reader_problem / central_claim / out_of_scope と、Evidence Boundary の
 *   Observed か Verified の記録があること。空欄・「未確認」「確認予定」などで始まる値・
 *   SKILL.md の見本文言、コードブロックと HTML コメントの中身は記録に数えない。
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const LABEL = "[check:article-plan]";
const GATE_MARKER = "Article Planの記録・PR作成ゲート";
const CONTRACT = "docs/article-lifecycle-contract.md";
const BASE_REF = "origin/main";
const CHANNEL_DIRS = [
  { dir: "articles", channel: "zenn" },
  { dir: "Qiita/public", channel: "qiita" },
  { dir: "articles_note/new", channel: "note" },
  { dir: "articles_izanami", channel: "izanami" },
];
/**
 * 記録に数えない値。「確認予定や仮説だけでは一次情報の項目を満たさない」（contract §4）ので、
 * 未確認・確認予定などで始まる値は後ろに補足が付いていても弾く。「未定義」のような語は通すため、
 * 直後が文末・空白・区切り記号のときだけ一致させる。
 */
const PLACEHOLDER =
  /^(?:(?:未確認|未定|確認予定|tbd|todo)(?=$|[\s（(、。,.:：/])|-$|\.{3}$|$|（[^）]*記入[^）]*）)/i;
/** tech-blog-writing SKILL.md A-5 の見本文言。書き換えずに残したものは記録に数えない */
const TEMPLATE_TEXTS = [
  "実体験なら誰が何を観測したか",
  "外部事実なら確認した内容と参照先",
  "未確認の見立て。Observed / Verified の代わりにしない",
];
const FORMAT_HINT =
  "期待する書式: `- reader_problem: …` / `- central_claim: …` / `- out_of_scope: …` と、`### Evidence Boundary` 配下の `- Observed: …` または `- Verified: …`";

function git(root, args) {
  try {
    return execFileSync("git", ["-C", root, "-c", "core.quotePath=false", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function gateDate(root) {
  const out = git(root, ["log", "-S", GATE_MARKER, "--format=%cs", BASE_REF, "--", CONTRACT]);
  if (!out) return null;
  const lines = out.trim().split("\n").filter(Boolean);
  return lines.length ? lines[lines.length - 1] : null;
}

function listArticles(root) {
  return CHANNEL_DIRS.flatMap(({ dir, channel }) => {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) return [];
    return fs
      .readdirSync(abs)
      .filter((f) => f.endsWith(".md") && !/^readme\.md$/i.test(f))
      .map((f) => ({ rel: path.posix.join(dir, f), channel, slug: f.slice(0, -3) }));
  });
}

/**
 * path → 最初の追加 commit の日付。1回の git log でまとめて取る（新しい順なので上書きで最古が残る）。
 * --no-renames が無いと、ディレクトリ内の git mv が A ではなく R になり、既存記事を未追跡扱いにしてしまう。
 * contract のファイル単位コマンドは移動元がパス指定に入らないので A になる。それに合わせる。
 */
function firstAddedDates(root) {
  const out = git(root, [
    "log", "--no-renames", "--diff-filter=A", "--name-only", "--format=@%cs", "HEAD", "--",
    ...CHANNEL_DIRS.map((c) => c.dir),
  ]);
  const map = new Map();
  if (!out) return map;
  let date = null;
  out.split("\n").forEach((line) => {
    if (line.startsWith("@")) date = line.slice(1);
    else if (line.trim() && date) map.set(line.trim(), date);
  });
  return map;
}

function collectTargets(root) {
  const gate = gateDate(root);
  if (!gate) return { gate: null, targets: [], reason: `${BASE_REF} からゲート導入日が取れない` };
  if ((git(root, ["rev-parse", "--is-shallow-repository"]) || "").trim() === "true") {
    return { gate, targets: [], reason: "shallow clone のため追加日を判定できない" };
  }
  const added = firstAddedDates(root);
  const targets = listArticles(root).filter((a) => {
    const d = added.get(a.rel);
    return !d || d >= gate;
  });
  return { gate, targets, reason: null };
}

// ---------- Plan の解析 ----------

function listSeedFiles(root) {
  const base = path.join(root, "article_seeds");
  if (!fs.existsSync(base)) return [];
  const walk = (abs) =>
    fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(abs, e.name);
      if (e.isDirectory()) return walk(p);
      return e.name.endsWith(".md") ? [p] : [];
    });
  return walk(base).map((p) => path.relative(root, p).split(path.sep).join("/"));
}

/**
 * Seed 本文から Plan 節を抜き出す。節は次の `#`/`##` 見出しまで。
 * コードブロックと HTML コメントの中は見本なので、見出しとしても記録としても数えない。
 * コメントは行番号を保つため改行だけ残して消す。
 */
function extractPlans(text) {
  const plans = [];
  let current = null;
  let inFence = false;
  const visible = text.replace(/<!--[\s\S]*?(?:-->|$)/g, (m) => m.replace(/[^\n]/g, ""));
  visible.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const h = line.match(/^##\s+(Draft|Approved)\s+Article Plan:\s*(\S+)\s*$/);
    if (h) {
      current = { kind: h[1], key: h[2], line: i + 1, body: [] };
      plans.push(current);
      return;
    }
    if (/^#{1,2}\s/.test(line)) {
      current = null;
      return;
    }
    if (current) current.body.push(line);
  });
  return plans;
}

const isFilled = (v) => {
  const s = v.trim();
  return !PLACEHOLDER.test(s) && !TEMPLATE_TEXTS.some((t) => s.startsWith(t));
};

/** `- key: 値` または値が空で直後に字下げした続き行がある形を記録ありとみなす */
function hasField(lines, key) {
  const re = new RegExp(`^(\\s*)[-*]?\\s*${key}\\s*[:：]\\s*(.*)$`, "i");
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(re);
    if (!m) continue;
    if (isFilled(m[2])) return true;
    const indent = m[1].length;
    for (let j = i + 1; j < lines.length; j += 1) {
      const l = lines[j];
      if (!l.trim()) continue;
      if (l.match(/^(\s*)/)[1].length <= indent) break;
      if (isFilled(l.replace(/^\s*[-*]?\s*/, ""))) return true;
    }
  }
  return false;
}

function missingFields(body) {
  const missing = ["reader_problem", "central_claim", "out_of_scope"].filter(
    (k) => !hasField(body, k),
  );
  const start = body.findIndex((l) => /^###\s+Evidence Boundary\s*$/i.test(l));
  let evidence = [];
  if (start >= 0) {
    const end = body.findIndex((l, i) => i > start && /^###?\s/.test(l));
    evidence = body.slice(start + 1, end < 0 ? undefined : end);
  }
  if (!hasField(evidence, "Observed") && !hasField(evidence, "Verified")) {
    missing.push("Evidence Boundary（Observed / Verified）");
  }
  return missing;
}

function indexPlans(root) {
  const index = new Map();
  listSeedFiles(root).forEach((rel) => {
    extractPlans(fs.readFileSync(path.join(root, rel), "utf8")).forEach((p) => {
      if (!index.has(p.key)) index.set(p.key, []);
      index.get(p.key).push({ ...p, file: rel });
    });
  });
  return index;
}

function evaluate(root) {
  const { gate, targets, reason } = collectTargets(root);
  const index = targets.length ? indexPlans(root) : new Map();
  const errors = [];
  targets.forEach((a) => {
    const key = `${a.channel}/${a.slug}`;
    const found = index.get(key) || [];
    if (found.length === 0) {
      errors.push(`${a.rel}: Plan未検出: ${key}（article_seeds/ に \`## Draft|Approved Article Plan: ${key}\` が無い）`);
    } else if (found.length > 1) {
      errors.push(`${a.rel}: Plan が ${found.length} 件ある: ${found.map((p) => `${p.file}:${p.line}`).join(", ")}`);
    } else {
      const missing = missingFields(found[0].body);
      if (missing.length) {
        errors.push(`${a.rel}: ${found[0].file}:${found[0].line} の Plan に記録が無い: ${missing.join(", ")}\n    ${FORMAT_HINT}`);
      }
    }
  });
  return { gate, targets, reason, errors };
}

/**
 * 終了コードを決める。ローカルでは導入日が取れなくても通すが、CI では fail にする。
 * contract の見出しの改名などで lint が黙って無効化されるのを防ぐため。
 */
function exitCode({ reason, errors }, env) {
  if (reason) return env.GITHUB_ACTIONS === "true" ? 1 : 0;
  return errors.length ? 1 : 0;
}

// ---------- self-test ----------

function selfTest() {
  let pass = 0;
  let fail = 0;
  const eq = (name, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (期待 ${JSON.stringify(expected)} / 実際 ${JSON.stringify(actual)})`}`);
    ok ? pass++ : fail++;
  };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-article-plan-"));
  const write = (rel, body) => {
    fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
    fs.writeFileSync(path.join(tmp, rel), body);
  };
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com" };
  const run = (args, date) =>
    execFileSync("git", ["-C", tmp, ...args], {
      stdio: "ignore",
      env: date ? { ...env, GIT_AUTHOR_DATE: `${date}T12:00:00`, GIT_COMMITTER_DATE: `${date}T12:00:00` } : env,
    });
  const commit = (msg, date) => {
    run(["add", "-A"]);
    run(["commit", "-q", "--no-verify", "-m", msg], date);
  };
  const plan = (key, { kind = "Draft", evidence = "- Observed: 筆者が 2026-09 に計測した" } = {}) =>
    `\n## ${kind} Article Plan: ${key}\n\n- reader_problem: 読者の課題\n- central_claim: 中心主張\n- out_of_scope: 書かない範囲\n\n### Evidence Boundary\n\n${evidence}\n- Hypothesis: 見立て\n`;
  const keys = (r) => r.targets.map((t) => `${t.channel}/${t.slug}`);

  try {
    run(["init", "-q"]);
    run(["config", "core.quotePath", "true"]);
    write("articles/old.md", "old\n");
    write("articles/日本語-old.md", "old\n");
    write("articles_izanami/README.md", "readme\n");
    write(CONTRACT, "# contract\n");
    write("articles_note/new/renamed.md", "x\n");
    commit("legacy", "2026-09-01");
    run(["mv", "articles_note/new/renamed.md", "articles_note/new/PRONI-renamed.md"]);
    commit("rename", "2026-09-10");

    // 導入日が取れない間は既存記事も未追跡記事も対象にしない
    write("articles/untracked-before-gate.md", "x\n");
    const noGate = evaluate(tmp);
    eq("導入日が取れなければ対象0件", noGate.targets.length, 0);
    eq("導入日が取れないときローカルでは通す", exitCode(noGate, {}), 0);
    eq("導入日が取れないとき CI では fail", exitCode(noGate, { GITHUB_ACTIONS: "true" }), 1);
    fs.unlinkSync(path.join(tmp, "articles/untracked-before-gate.md"));

    write(CONTRACT, `# contract\n\n## 4. ${GATE_MARKER}\n`);
    commit("gate", "2026-09-29");
    run(["update-ref", `refs/remotes/${BASE_REF}`, "HEAD"]);

    eq("導入日を origin/main から取る", evaluate(tmp).gate, "2026-09-29");
    eq("導入日前の既存記事・導入日前のリネーム・README は対象外", evaluate(tmp).targets.length, 0);
    eq("非 ASCII のファイル名を未追跡と誤判定しない", keys(evaluate(tmp)).includes("zenn/日本語-old"), false);
    eq("既存記事だけなら合格", evaluate(tmp).errors.length, 0);

    // 合格: 各チャネルに Plan が揃っている（Approved・続き行の値も受け付ける）
    write("articles/zenn-ok.md", "x\n");
    write("Qiita/public/qiita-ok.md", "x\n");
    write("articles_note/new/PRONI-note-ok.md", "x\n");
    write("articles_izanami/izanami-ok.md", "x\n");
    write(
      "article_seeds/theme/seed.md",
      "---\nseed_id: s\n---\n\n# Seed\n" +
        plan("zenn/zenn-ok") +
        plan("qiita/qiita-ok", { kind: "Approved", evidence: "- Verified:\n  - 公式ドキュメント https://example.com" }) +
        plan("note/PRONI-note-ok") +
        plan("izanami/izanami-ok") +
        "\n## 追記ログ\n",
    );
    commit("new articles", "2026-09-30");
    const ok = evaluate(tmp);
    eq("導入日以降の追加記事を対象にする", keys(ok).sort(), ["izanami/izanami-ok", "note/PRONI-note-ok", "qiita/qiita-ok", "zenn/zenn-ok"]);
    eq("Plan が揃っていれば合格", ok.errors, []);

    // 不合格: Plan 無し（未追跡の原稿も対象）
    write("articles/no-plan.md", "x\n");
    const noPlan = evaluate(tmp);
    eq("未追跡の原稿も対象にする", keys(noPlan).includes("zenn/no-plan"), true);
    eq("Plan 無しは不合格", noPlan.errors.length === 1 && /Plan未検出: zenn\/no-plan/.test(noPlan.errors[0]), true);
    fs.unlinkSync(path.join(tmp, "articles/no-plan.md"));

    // 不合格: コードブロック内の見出しは Plan に数えない
    write("articles/fenced.md", "x\n");
    write("article_seeds/fenced.md", "# S\n\n```markdown\n" + plan("zenn/fenced") + "```\n");
    eq("コードブロック内の Plan は数えない", /Plan未検出/.test(evaluate(tmp).errors.join()), true);
    fs.unlinkSync(path.join(tmp, "articles/fenced.md"));
    fs.unlinkSync(path.join(tmp, "article_seeds/fenced.md"));

    // 不合格: 同じ Plan が2件
    write("article_seeds/dup.md", "# Dup\n" + plan("zenn/zenn-ok", { kind: "Approved" }));
    eq("Plan の重複は不合格", /2 件/.test(evaluate(tmp).errors.join()), true);
    fs.unlinkSync(path.join(tmp, "article_seeds/dup.md"));

    // 不合格: 項目欠落・仮説だけ・未確認だけ
    write("articles/partial.md", "x\n");
    write(
      "article_seeds/partial.md",
      "# P\n\n## Draft Article Plan: zenn/partial\n\n- reader_problem: 課題\n- central_claim: 未確認\n\n### Evidence Boundary\n\n- Observed:\n- Hypothesis: 仮説だけ\n\n## 次の節\n\n- out_of_scope: 節の外なので数えない\n",
    );
    const partial = evaluate(tmp).errors.join("\n");
    const lacks = (name, text = evaluate(tmp).errors.join("\n")) =>
      new RegExp(`記録が無い: [^\\n]*${name}`).test(text);
    eq("未確認だけの central_claim は不合格", lacks("central_claim", partial), true);
    eq("節の外の out_of_scope は数えない", lacks("out_of_scope", partial), true);
    eq("Hypothesis だけの Evidence は不合格", lacks("Evidence Boundary", partial), true);
    eq("記録済みの reader_problem は指摘しない", lacks("reader_problem", partial), false);
    eq("欠落の報告に期待する書式を示す", /期待する書式: `- reader_problem:/.test(partial), true);

    // 合格: CRLF の Seed
    write("article_seeds/partial.md", "# P\n" + plan("zenn/partial").replace(/\n/g, "\r\n"));
    eq("CRLF の Seed でも記録を読む", evaluate(tmp).errors, []);

    // 見逃し防止: Plan 本文内のコードブロック・HTML コメントの見本は記録に数えない
    const withEvidence = (evidence) =>
      write("article_seeds/partial.md", "# P\n" + plan("zenn/partial", { evidence }));
    const evidenceMissing = () => lacks("Evidence Boundary");
    withEvidence("```markdown\n- Observed: 見本の観測\n```");
    eq("Plan 内コードブロックの見本は数えない", evidenceMissing(), true);
    withEvidence("<!--\n- Observed: 見本の観測\n-->");
    eq("Plan 内 HTML コメントの見本は数えない", evidenceMissing(), true);
    write(
      "article_seeds/partial.md",
      "# P\n<!--\n## Draft Article Plan: zenn/partial\n-->\n" + plan("zenn/partial"),
    );
    eq("HTML コメント内の Plan 見出しは Plan に数えない", evaluate(tmp).errors, []);

    // 見逃し防止: 確認予定・未確認（補足付き）・子要素の確認予定・A-5 見本文言は一次情報に数えない
    withEvidence("- Observed: 確認予定");
    eq("「確認予定」は Observed に数えない", evidenceMissing(), true);
    withEvidence("- Verified: 未確認（後日確認する）");
    eq("補足付きの「未確認」は Verified に数えない", evidenceMissing(), true);
    withEvidence("- Observed:\n  - 確認予定");
    eq("子要素の「確認予定」は数えない", evidenceMissing(), true);
    withEvidence("- Observed: 実体験なら誰が何を観測したか\n- Verified: 外部事実なら確認した内容と参照先");
    eq("A-5 の見本文言のままは数えない", evidenceMissing(), true);
    withEvidence("- Observed: 未定義の挙動を筆者が再現した");
    eq("「未定義」で始まる実記録は通す", evidenceMissing(), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`\n${LABEL} self-test ${fail === 0 ? "OK" : "FAILED"}: ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ---------- main ----------

function main() {
  if (process.argv.includes("--self-test")) return selfTest();

  const root = path.resolve(__dirname, "..");
  const result = evaluate(root);
  const { gate, targets, reason, errors } = result;
  if (reason) {
    if (exitCode(result, process.env)) {
      console.error(`${LABEL} FAILED: ${reason}。CI では lint が無効化されたまま通さない（${CONTRACT} §4 の見出しと ${BASE_REF} の取得を確認）`);
      process.exit(1);
    }
    console.log(`${LABEL} ${reason}。対象 0 件として通す`);
    return;
  }
  console.log(`${LABEL} ゲート導入日 ${gate} / 対象 ${targets.length} 件`);
  targets.forEach((t) => console.log(`  - ${t.rel}`));
  if (errors.length) {
    errors.forEach((e) => console.error(`  ERROR ${e}`));
    console.error(`${LABEL} FAILED: ${errors.length} 件（${CONTRACT} §4 を参照）`);
    process.exit(1);
  }
  console.log(`${LABEL} OK`);
}

main();
