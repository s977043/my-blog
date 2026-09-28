#!/usr/bin/env node
/**
 * check:article-plan
 *
 * docs/article-lifecycle-contract.md「4. Article Planの記録・PR作成ゲート」を機械で確認する。
 *
 * ■ 対象（新規記事のみ）
 *   articles/*.md（zenn）、Qiita/public/*.md（qiita）、articles_note/new/*.md（note）、
 *   articles_izanami/*.md（izanami）のうち README を除き、次のどちらかに当たるもの。
 *   - ベースブランチ（origin/main）に無い（PR で追加・未追跡）。ベースブランチの原稿をリネームしただけのものは除く
 *   - ベースブランチで最初に追加された日（リネームは移動元を引き継ぐ）がゲート導入日以降
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
 * リネームとみなす類似度。既定の 50% だと、短い原稿を消して無関係な原稿を足しただけでも
 * front matter が共通なためリネームと判定される。書き換えを伴うリネームが新規扱いになるのは
 * Plan を足せば通るので、安全側に倒す。
 */
const RENAME_SIMILARITY = "-M80%";

/** 記事ディレクトリ直下の原稿なら媒体名、それ以外は null */
function channelOf(rel) {
  const hit = CHANNEL_DIRS.find(({ dir }) => path.posix.dirname(rel) === dir);
  return hit ? hit.channel : null;
}

/** 同じ媒体の中での移動だけをリネームとして扱う。媒体をまたぐ移動は新規記事 */
const sameChannel = (from, to) => channelOf(from) !== null && channelOf(from) === channelOf(to);

/** `git ... --name-status` の出力を [status, ...paths] の配列にする。`@` で始まる行は日付行 */
function nameStatusLines(out) {
  return out.split("\n").filter((l) => l.trim()).map((l) => l.split("\t"));
}

/**
 * ref 上の path → 最初に追加された日。履歴を古い順に1回だけ読む。
 * 同じ媒体内のリネーム（R）は移動元の追加日を引き継ぎ、削除（D）で記録を消す（再追加はその日付になる）。
 * git が失敗したら null（「追加日なし」と区別する）。
 */
function addedDates(root, ref) {
  const out = git(root, ["log", ref, "--reverse", RENAME_SIMILARITY, "--diff-filter=ADR", "--name-status", "--format=@%cs"]);
  if (out === null) return null;
  const map = new Map();
  let date = null;
  nameStatusLines(out).forEach(([status, from, to]) => {
    if (status.startsWith("@")) date = status.slice(1);
    else if (status === "A" && !map.has(from)) map.set(from, date);
    else if (status === "D") map.delete(from);
    else if (status.startsWith("R") && to) {
      map.set(to, sameChannel(from, to) && map.has(from) ? map.get(from) : date);
      map.delete(from);
    }
  });
  return map;
}

function treePaths(root, ref) {
  const out = git(root, ["ls-tree", "-r", "--name-only", ref, "--", ...CHANNEL_DIRS.map((c) => c.dir)]);
  return out === null ? null : new Set(out.split("\n").filter(Boolean));
}

/**
 * PR 内（コミット済み・ステージ済み・作業ツリー）の同じ媒体内のリネーム: 移動先 → 移動元。
 * merge-base と作業ツリーを比べるので、CI の detached HEAD（PR の merge commit）でも同じに動く。
 */
function renamesSince(root, mb) {
  const out = git(root, ["diff", RENAME_SIMILARITY, "--name-status", mb]);
  if (out === null) return null;
  const map = new Map();
  nameStatusLines(out).forEach(([status, from, to]) => {
    if (status.startsWith("R") && to && sameChannel(from, to)) map.set(to, from);
  });
  return map;
}

/**
 * 新規記事の判定（contract §4 の適用範囲）
 *   - ベースブランチにある原稿: ベースブランチで最初に追加された日が導入日以降なら新規
 *   - ベースブランチに無い原稿: 新規。ただし同じ媒体内のリネームは移動元で判定する。
 *     作業ブランチが古く、merge-base 時点からある原稿（その後 main でリネーム・削除された）は、
 *     merge-base の履歴の追加日で判定する
 *   - ベースブランチにあるのに追加日が取れない原稿は undetermined に入れ、新規として扱う
 */
function collectTargets(root) {
  const none = (reason, gate = null) => ({ gate, targets: [], undetermined: [], reason });
  const gate = gateDate(root);
  if (!gate) return none(`${BASE_REF} からゲート導入日が取れない`);
  if ((git(root, ["rev-parse", "--is-shallow-repository"]) || "").trim() === "true") {
    return none("shallow clone のため追加日を判定できない", gate);
  }
  const mb = (git(root, ["merge-base", BASE_REF, "HEAD"]) || "").trim();
  const baseTree = treePaths(root, BASE_REF);
  const baseDates = addedDates(root, BASE_REF);
  const mbTree = mb ? treePaths(root, mb) : null;
  const renames = mb ? renamesSince(root, mb) : null;
  if (!baseTree || !baseDates || !mbTree || !renames) {
    return none(`${BASE_REF} の履歴を読めない（merge-base: ${mb || "なし"}）`, gate);
  }
  let mbDates = null;
  const undetermined = [];
  const byDate = (rel, d) => {
    if (!d) {
      undetermined.push(rel);
      return true;
    }
    return d >= gate;
  };
  const isNew = (rel) => {
    if (baseTree.has(rel)) return byDate(rel, baseDates.get(rel));
    const from = renames.get(rel);
    if (from && (baseTree.has(from) || mbTree.has(from))) return isNew(from);
    if (mbTree.has(rel)) {
      mbDates = mbDates || addedDates(root, mb) || new Map();
      return byDate(rel, mbDates.get(rel));
    }
    return true;
  };
  const targets = listArticles(root).filter((a) => isNew(a.rel));
  return { gate, targets, undetermined, reason: null };
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
  const { gate, targets, undetermined, reason } = collectTargets(root);
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
  return { gate, targets, undetermined, reason, errors };
}

/**
 * 終了コードを決める。導入日や追加日を判定できないとき、ローカルでは通す（追加日が取れない原稿は
 * 新規として扱う）が、CI では fail にする。contract の見出しの改名や履歴の欠落で lint が
 * 黙って無効化されるのを防ぐため。
 */
function exitCode({ reason, errors, undetermined = [] }, env) {
  const ci = env.GITHUB_ACTIONS === "true";
  if (reason) return ci ? 1 : 0;
  if (ci && undetermined.length) return 1;
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

    // 新規記事の定義: ベースブランチに無い原稿は新規。リネームは移動元の追加日を引き継ぐ
    write("articles/backdated.md", "backdated\n");
    commit("backdated in PR", "2026-09-20");
    eq("PR で導入日より前の日付でコミットした原稿も対象（main に無い）", keys(evaluate(tmp)).includes("zenn/backdated"), true);

    run(["mv", "articles/old.md", "articles/old-renamed.md"]);
    commit("rename on main", "2026-10-01");
    run(["update-ref", `refs/remotes/${BASE_REF}`, "HEAD"]);
    const onMain = keys(evaluate(tmp));
    eq("main 上で導入日後にリネームした既存原稿は対象外", onMain.includes("zenn/old-renamed"), false);
    eq("main で導入日以降に追加された原稿は対象", onMain.includes("zenn/zenn-ok"), true);

    run(["mv", "articles_note/new/PRONI-renamed.md", "articles_note/new/PRONI-renamed2.md"]);
    commit("rename in PR", "2026-10-02");
    run(["mv", "articles/日本語-old.md", "articles/日本語-renamed.md"]);
    const inPr = keys(evaluate(tmp));
    eq("PR 内でリネームした既存原稿は対象外", inPr.includes("note/PRONI-renamed2"), false);
    eq("ステージしただけのリネームも移動元で判定する", inPr.includes("zenn/日本語-renamed"), false);
    run(["checkout", "-q", "--detach"]);
    eq("detached HEAD（CI）でも同じ判定になる", keys(evaluate(tmp)), inPr);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  renameScenarios(eq, env);

  console.log(`\n${LABEL} self-test ${fail === 0 ? "OK" : "FAILED"}: ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

/**
 * リネーム・削除まわりの判定を、シナリオごとに作り直した一時 repo で確かめる。
 * 各 repo は「導入日前の既存原稿 → 導入日のコミット（origin/main）」から始まり、ブランチ pr の上で動く。
 */
function renameScenarios(eq, env) {
  const FM = "---\ntitle: \"t\"\nemoji: \"📝\"\ntype: \"tech\"\ntopics: [\"ai\", \"review\"]\npublished: false\n---\n\n";
  const scenario = (name, legacy, fn) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-article-plan-rn-"));
    const write = (rel, body) => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), body);
    };
    const run = (args, date) =>
      execFileSync("git", ["-C", dir, ...args], {
        stdio: "ignore",
        env: date ? { ...env, GIT_AUTHOR_DATE: `${date}T12:00:00`, GIT_COMMITTER_DATE: `${date}T12:00:00` } : env,
      });
    const commit = (msg, date) => {
      run(["add", "-A"]);
      run(["commit", "-q", "--no-verify", "-m", msg], date);
    };
    const toMain = () => run(["update-ref", `refs/remotes/${BASE_REF}`, "HEAD"]);
    const keys = () => evaluate(dir).targets.map((t) => `${t.channel}/${t.slug}`);
    try {
      run(["init", "-q"]);
      run(["checkout", "-q", "-b", "pr"]);
      Object.entries(legacy).forEach(([rel, body]) => write(rel, body));
      commit("legacy", "2026-09-01");
      write(CONTRACT, `# contract\n\n## 4. ${GATE_MARKER}\n`);
      commit("gate", "2026-09-29");
      toMain();
      fn({ dir, write, run, commit, toMain, keys });
    } catch (e) {
      eq(`${name}: 例外なく実行できる`, String(e), "");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };

  // 1. 媒体をまたぐ移動は新規記事（PR 内・main 上の両方）
  scenario("媒体またぎ", { "articles_note/new/idea.md": FM + "note の原稿\n" }, ({ dir, run, commit, toMain, keys }) => {
    fs.mkdirSync(path.join(dir, "articles"));
    run(["mv", "articles_note/new/idea.md", "articles/idea-zenn.md"]);
    commit("move to zenn in PR", "2026-10-01");
    eq("PR 内で媒体をまたいで移動した原稿は新規", keys().includes("zenn/idea-zenn"), true);
    toMain();
    eq("main 上で媒体をまたいで移動した原稿も新規", keys().includes("zenn/idea-zenn"), true);
  });

  // 2. front matter が共通なだけの削除＋追加をリネームとみなさない
  scenario(
    "類似度",
    { "articles/short.md": FM + "短い既存原稿の本文です。\n" },
    ({ dir, run, write, commit, keys }) => {
      run(["rm", "-q", "articles/short.md"]);
      write("articles/unrelated.md", FM + "まったく別の新しい記事です。\n");
      commit("replace in PR", "2026-10-01");
      const similar = execFileSync("git", ["-C", dir, "diff", "-M50%", "--name-status", `${BASE_REF}`, "HEAD"], { encoding: "utf8" });
      eq("（前提）既定の類似度ではリネームと判定される組み合わせ", /^R/m.test(similar), true);
      eq("類似度 80% 未満の削除＋追加は新規", keys().includes("zenn/unrelated"), true);
    },
  );

  // 3. main にあるのに追加日が取れない原稿（merge commit の中で足された原稿）は CI で fail
  scenario("追加日なし", { "articles/base.md": FM + "base\n" }, ({ dir, run, write, commit, toMain }) => {
    run(["checkout", "-q", "-b", "side"]);
    write("articles/side.md", FM + "side\n");
    commit("side", "2026-09-10");
    run(["checkout", "-q", "pr"]);
    run(["merge", "-q", "--no-ff", "--no-commit", "side"], "2026-09-11");
    write("articles/evil.md", FM + "merge の中で足した原稿\n");
    commit("merge side", "2026-09-11");
    toMain();
    const r = evaluate(dir);
    eq("追加日を判定できない原稿を undetermined に入れる", r.undetermined, ["articles/evil.md"]);
    eq("追加日を判定できない原稿はローカルでは新規として扱う", r.targets.some((t) => t.rel === "articles/evil.md"), true);
    eq("追加日を判定できない原稿は CI では fail", exitCode({ ...r, errors: [] }, { GITHUB_ACTIONS: "true" }), 1);
    eq("追加日を判定できない原稿でもローカルは Plan 以外で落とさない", exitCode({ ...r, errors: [] }, {}), 0);
  });

  // 4. 作業ブランチが古く、その後 main で既存原稿がリネームされても誤検知しない
  scenario("古いブランチ", { "articles/x.md": FM + "既存の原稿 x\n" }, ({ run, commit, toMain, keys }) => {
    run(["checkout", "-q", "-b", "main-ahead"]);
    run(["mv", "articles/x.md", "articles/y.md"]);
    commit("rename on main", "2026-10-01");
    toMain();
    run(["checkout", "-q", "pr"]);
    eq("main で後からリネームされた既存原稿を古いブランチで新規扱いしない", keys().includes("zenn/x"), false);
  });

  // 5. main で削除した原稿を導入日以降に同名で再追加したら新規
  scenario("再追加", { "articles/readd.md": FM + "最初の版\n" }, ({ run, write, commit, toMain, keys }) => {
    run(["rm", "-q", "articles/readd.md"]);
    commit("delete", "2026-10-01");
    write("articles/readd.md", FM + "再追加した版\n");
    commit("re-add", "2026-10-02");
    toMain();
    eq("削除後に導入日以降で再追加した原稿は新規", keys().includes("zenn/readd"), true);
  });
}

// ---------- main ----------

function main() {
  if (process.argv.includes("--self-test")) return selfTest();

  const root = path.resolve(__dirname, "..");
  const result = evaluate(root);
  const { gate, targets, undetermined, reason, errors } = result;
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
  if (targets.length) {
    console.log("  （ステージしていない移動は新規扱いになる。既存原稿の移動なら git mv するかステージしてから再実行する）");
  }
  undetermined.forEach((rel) =>
    console.error(`  WARN ${rel}: ${BASE_REF} にあるが追加日を判定できないため新規として扱う（CI では fail）`),
  );
  const code = exitCode(result, process.env);
  if (code) {
    errors.forEach((e) => console.error(`  ERROR ${e}`));
    console.error(`${LABEL} FAILED: エラー ${errors.length} 件 / 追加日を判定できない原稿 ${undetermined.length} 件（${CONTRACT} §4 を参照）`);
    process.exit(1);
  }
  console.log(`${LABEL} OK`);
}

main();
