#!/usr/bin/env node
// 自己成長ループのシグナル（ガード発火・やり直しの痕跡）をリポジトリ外の JSONL に記録する。
//
// ■ 背景
//   docs/agent-growth-harness.md §2 案 4（ガード発火ログ）と案 5（振り返りの起動）。
//   ガードが止めた回数や、セッション中の revert / reset が記録されず、振り返りが人の指示待ちだった。
//   記録はセッション終了ごとに hook が行い、処理（学び・ガード案への振り分け）は /self-improve が行う。
//
// ■ 保存先（どちらも append-only）
//   ${GROWTH_SIGNALS_DIR:-$HOME/.claude/state/my-blog-growth}/
//     signals.jsonl    { id, ts, session_id, repo, kind, source, detail, ref }
//     processed.jsonl  { id, ts, note }   … /self-improve が処理済みにした id
//   未処理かどうかは両者を突き合わせて決める。書き換え（read → rename）をしないので、並行追記で行が消えない。
//   ref は重複記録を避けるためのキー（commit SHA など）。detail はトークン類をマスクしてから書く。
//
// ■ 記録の範囲
//   SessionEnd は CLAUDE_PROJECT_DIR（無ければ hook 入力の cwd）で git を実行し、origin が s977043/my-blog の
//   ときだけ記録する。Claude が別リポジトリへ cd していても、そのリポジトリの内容は記録しない
//   （AGENTS.md §題材と媒体の対応。my-blog は公開リポジトリ）。
//
// ■ fail-open
//   hook から呼ぶサブコマンド（append / hook-session-start / hook-session-end）は、
//   書き込み失敗・git 失敗・入力不正のどれでも exit 0 で終わる。記録のためにガードやセッションを止めない。
//
// ■ 使い方
//   node scripts/growth-signals.js append <kind> <source> <detail> [session_id]
//   node scripts/growth-signals.js hook-session-start   # SessionStart hook（stdin に hook JSON）
//   node scripts/growth-signals.js hook-session-end     # SessionEnd hook（stdin に hook JSON）
//   node scripts/growth-signals.js list [--json] [--all]
//   node scripts/growth-signals.js mark <id>... --note "判断理由"
//   npm run test:growth-signals                         # = node scripts/growth-signals.js --self-test

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile, execFileSync, spawn, spawnSync } = require("child_process");

const LABEL = "[growth-signals]";
const EXPECTED_REPO = "s977043/my-blog";
const DEFAULT_LOOKBACK_MS = 12 * 60 * 60 * 1000;
const SESSION_FILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const START_BREAKDOWN_MAX = 5;
// 件名の先頭（Conventional Commits の `type(scope)!:` の後）にあるやり直しの語だけを拾う
const REDO_RE = /^(fixup!|squash!)|^(?:[a-z]+(?:\([^)]*\))?!?:\s*)?(やり直し|再(修正|対応|実行|試行|作成|適用|度|push|コミット|commit))/;
const REVERT_RE = /^Revert\b/;

function stateDir(env = process.env) {
  if (env.GROWTH_SIGNALS_DIR) return env.GROWTH_SIGNALS_DIR;
  return path.join(env.HOME || os.homedir(), ".claude", "state", "my-blog-growth");
}

function signalsPath(env) {
  return path.join(stateDir(env), "signals.jsonl");
}

function processedPath(env) {
  return path.join(stateDir(env), "processed.jsonl");
}

// 記録前に認証情報らしき文字列を伏せる（呼び出し側で本文を渡さない運用に対する多重防御）
function redact(s) {
  return String(s ?? "")
    .replace(/:\/\/[^@/\s]+@/g, "://***@")
    .replace(/gh[pousr]_[A-Za-z0-9]+/g, "gh*_***")
    .replace(/github_pat_\w+/g, "github_pat_***")
    .replace(/(Authorization:\s*)(?:(?:Bearer|token|Basic)\s+)?\S+/gi, "$1***");
}

function readJsonl(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // 壊れた行は読み飛ばす
    }
  }
  return out;
}

// signals.jsonl と processed.jsonl を突き合わせ、processed と処理メモを付けた一覧を返す
function readSignals(env) {
  const notes = new Map();
  for (const p of readJsonl(processedPath(env))) if (p && p.id) notes.set(p.id, p.note || "");
  return readJsonl(signalsPath(env)).map((s) => {
    const done = notes.has(s.id);
    return { ...s, processed: done, detail: done && notes.get(s.id) ? `${s.detail} [processed: ${notes.get(s.id)}]` : s.detail };
  });
}

function parseRepo(url) {
  const m = String(url || "")
    .trim()
    .match(/^(?:https?:\/\/(?:[^@/]+@)?[^/]+\/|ssh:\/\/[^/]+\/|[^@\s]+@[^:]+:)([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  return m ? m[1] : null;
}

function detectRepoSync(dir) {
  try {
    return parseRepo(execFileSync("git", ["-C", dir, "remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2000 }));
  } catch {
    return null;
  }
}

function newRecord({ kind, source, detail, sessionId, ref, repo, now = new Date() }) {
  return {
    id: `${now.getTime().toString(36)}-${crypto.randomBytes(4).toString("hex")}`,
    ts: now.toISOString(),
    session_id: sessionId || null,
    repo: repo || null,
    kind,
    source,
    detail: redact(detail),
    ref: ref || null,
  };
}

// 失敗しても例外を投げない。書けた件数を返す。1 回の appendFileSync（O_APPEND）で書く。
function appendLines(file, rows, env) {
  if (rows.length === 0) return 0;
  try {
    fs.mkdirSync(stateDir(env), { recursive: true });
    fs.appendFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
    return rows.length;
  } catch (e) {
    if (env.GROWTH_SIGNALS_DEBUG) console.error(`${LABEL} write failed: ${e.message}`);
    return 0;
  }
}

function summarize(signals) {
  const pending = signals.filter((s) => !s.processed);
  const byKind = {};
  for (const s of pending) byKind[s.kind] = (byKind[s.kind] || 0) + 1;
  return { count: pending.length, byKind };
}

// SessionStart で出す文言。0 件なら null（何も出さない）。内訳は多い順に上位 5 件まで。
function startMessage(signals) {
  const { count, byKind } = summarize(signals);
  if (count === 0) return null;
  const entries = Object.entries(byKind).sort((a, b) => b[1] - a[1]);
  const shown = entries.slice(0, START_BREAKDOWN_MAX).map(([k, n]) => `${k} ${n}`);
  if (entries.length > START_BREAKDOWN_MAX) shown.push(`ほか ${entries.length - START_BREAKDOWN_MAX} 種`);
  return `[growth-signals] 未処理のシグナル ${count} 件（${shown.join(", ")}）\n/self-improve で処理できます`;
}

function readStdinJson() {
  try {
    if (process.stdin.isTTY) return {};
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 失敗時は null を返す（fail-open）
function gitAsync(cwd, args) {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, encoding: "utf8", timeout: 3000, maxBuffer: 8 * 1024 * 1024 }, (err, stdout) => resolve(err ? null : stdout));
  });
}

function shortHash(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
}

function sessionStartFile(env, sessionId) {
  return path.join(stateDir(env), "sessions", `${sessionId.replace(/[^A-Za-z0-9_.-]/g, "_")}.json`);
}

function recordSessionStart(env, sessionId, now) {
  if (!sessionId) return;
  try {
    const dir = path.join(stateDir(env), "sessions");
    fs.mkdirSync(dir, { recursive: true });
    const file = sessionStartFile(env, sessionId);
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ start: now.toISOString() }));
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (now.getTime() - fs.statSync(p).mtimeMs > SESSION_FILE_TTL_MS) fs.unlinkSync(p);
    }
  } catch {
    // fail-open
  }
}

// セッション開始時刻: SessionStart の記録 → transcript の作成時刻 → 既定の遡り幅
function sessionSince(env, input, now) {
  if (input.session_id) {
    try {
      const { start } = JSON.parse(fs.readFileSync(sessionStartFile(env, input.session_id), "utf8"));
      const t = Date.parse(start);
      if (!Number.isNaN(t)) return t;
    } catch {
      // 次の候補へ
    }
  }
  if (input.transcript_path) {
    try {
      const st = fs.statSync(input.transcript_path);
      const t = st.birthtimeMs || st.ctimeMs;
      if (t > 0) return t;
    } catch {
      // 次の候補へ
    }
  }
  return now.getTime() - DEFAULT_LOOKBACK_MS;
}

function unpushedTargets(heads) {
  const targets = [];
  for (const line of (heads || "").split("\n").filter(Boolean)) {
    const [mark, branch, upstream = "", track = ""] = line.split("\t");
    if (!branch) continue;
    if (upstream) {
      if (!track.includes("gone")) targets.push(`refs/heads/${branch}`);
    } else if (mark === "*") {
      targets.push(`refs/heads/${branch}`);
    }
  }
  return targets;
}

// ローカル git だけでやり直しの痕跡を集める。ネットワークは使わない。
// SessionEnd の待ち時間を抑えるため、git は並列に起動する。失敗した git の結果は記録しない。
// origin が EXPECTED_REPO でなければ何も返さない。
async function collectGitSignals(dir, sinceMs) {
  const found = [];
  const sinceSec = Math.floor(sinceMs / 1000);
  const [origin, log, reflog, heads, status] = await Promise.all([
    gitAsync(dir, ["remote", "get-url", "origin"]),
    // revert / fixup! / やり直しを示す commit（ローカルブランチ上、セッション開始以降）
    gitAsync(dir, ["log", "--branches", `--since=@${sinceSec}`, "--format=%H%x09%s"]),
    // このワークツリーの HEAD reflog 上の reset
    gitAsync(dir, ["reflog", "show", "--date=unix", "--format=%gd%x09%H%x09%gs", "HEAD"]),
    // 未 push の判定対象を選ぶためのローカルブランチ一覧（現在ブランチ印・upstream・追跡状態）
    gitAsync(dir, ["for-each-ref", "refs/heads", "--format=%(HEAD)%09%(refname:short)%09%(upstream)%09%(upstream:track)"]),
    // 未コミットの変更（1 行目はブランチ名）
    gitAsync(dir, ["--no-optional-locks", "status", "--porcelain", "--branch"]),
  ]);
  const repo = parseRepo(origin);
  if (repo !== EXPECTED_REPO) return { repo, found };

  for (const line of (log || "").split("\n").filter(Boolean)) {
    const [sha, subject = ""] = line.split("\t");
    if (REVERT_RE.test(subject)) {
      found.push({ kind: "revert_commit", ref: sha, detail: `${sha.slice(0, 7)} ${subject}` });
    } else if (REDO_RE.test(subject)) {
      found.push({ kind: "redo_commit", ref: sha, detail: `${sha.slice(0, 7)} ${subject}` });
    }
  }

  for (const line of (reflog || "").split("\n").filter(Boolean)) {
    const [gd, sha, gs = ""] = line.split("\t");
    const m = gd.match(/@\{(\d+)\}/);
    if (!m || Number(m[1]) < sinceSec) continue;
    if (/^reset:/.test(gs)) {
      found.push({ kind: "reflog_reset", ref: `${m[1]}:${sha}`, detail: `${gs} → ${sha.slice(0, 7)}` });
    }
  }

  // 未 push の commit（どの remote-tracking ref にも含まれない commit）。squash マージ運用ではマージ済みの
  // ローカルブランチも remote に含まれないため、upstream が [gone]（リモートで削除済み）のブランチは除外し、
  // upstream の無いブランチは現在のブランチだけを対象にする。
  const targets = unpushedTargets(heads);
  const unpushed = targets.length > 0
    ? await gitAsync(dir, ["log", ...targets, "--not", "--remotes", "--format=%H%x09%D", "--decorate-refs=refs/heads/", "--"])
    : "";
  const unpushedLines = (unpushed || "").split("\n").filter(Boolean);
  if (unpushedLines.length > 0) {
    const branches = unpushedLines
      .map((l) => l.split("\t")[1])
      .filter(Boolean)
      .flatMap((d) => d.split(", ").map((b) => b.replace(/^HEAD -> /, "")));
    const shas = unpushedLines.map((l) => l.split("\t")[0]).sort();
    found.push({
      kind: "unpushed_commits",
      ref: `unpushed:${shortHash(shas.join(","))}`,
      detail: `${unpushedLines.length} commit(s) on ${branches.join(", ") || "(unknown)"}`,
    });
  }

  if (status !== null) {
    const [head = "", ...rest] = status.split("\n");
    let lines = rest.filter(Boolean);
    // claude-mem の自動注入だけの AGENTS.md は除く（CLAUDE.md §並列セッション耐性）
    if (lines.some((l) => l.slice(3) === "AGENTS.md")) {
      const diff = (await gitAsync(dir, ["diff", "--", "AGENTS.md"])) || "";
      const removesLines = diff.split("\n").some((l) => l.startsWith("-") && !l.startsWith("---"));
      if (diff.includes("<claude-mem-context>") && !removesLines) lines = lines.filter((l) => l.slice(3) !== "AGENTS.md");
    }
    if (lines.length > 0) {
      const branch = head.replace(/^## /, "").replace(/\.\.\..*$/, "") || "(unknown)";
      found.push({
        kind: "uncommitted_changes",
        ref: `uncommitted:${shortHash(branch + "\n" + lines.join("\n"))}`,
        detail: `${lines.length} path(s) on ${branch}: ${lines.slice(0, 5).map((l) => l.slice(3)).join(", ")}${lines.length > 5 ? ", ..." : ""}`,
      });
    }
  }

  return { repo, found };
}

async function hookSessionEnd(env, input, now = new Date()) {
  // Claude の cd に追従する cwd ではなく、プロジェクトのディレクトリで git を実行する
  const dir = env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const since = sessionSince(env, input, now);
  const { repo, found } = await collectGitSignals(dir, since);
  const existing = new Set(readJsonl(signalsPath(env)).map((s) => `${s.kind}\t${s.ref}`));
  const records = found
    .filter((f) => !existing.has(`${f.kind}\t${f.ref}`))
    .map((f) => newRecord({ ...f, repo, source: "session-end", sessionId: input.session_id, now }));
  appendLines(signalsPath(env), records, env);
  if (input.session_id) {
    try {
      fs.unlinkSync(sessionStartFile(env, input.session_id));
    } catch {
      // 無ければよい
    }
  }
  return records;
}

function hookSessionStart(env, input, now = new Date()) {
  recordSessionStart(env, input.session_id, now);
  const msg = startMessage(readSignals(env));
  if (!msg) return null;
  return {
    systemMessage: msg,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: msg },
  };
}

// 処理済みの id を processed.jsonl に追記する。signals.jsonl は書き換えない。
// signals.jsonl が無い・未知の id がある → 何も書かずに exit 1。処理済みの id を含む → 警告して残りを書く。
function markProcessed(env, ids, note, now = new Date()) {
  if (!fs.existsSync(signalsPath(env))) {
    console.error(`${LABEL} ${signalsPath(env)} がありません`);
    return 1;
  }
  const signals = readSignals(env);
  const known = new Map(signals.map((s) => [s.id, s]));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    console.error(`${LABEL} 未知の id: ${unknown.join(", ")}（何も記録していません）`);
    return 1;
  }
  const todo = [...new Set(ids)].filter((id) => !known.get(id).processed);
  if (todo.length !== ids.length) console.error(`${LABEL} WARN: ${ids.length - todo.length} 件は処理済みか重複のため飛ばしました`);
  const written = appendLines(processedPath(env), todo.map((id) => ({ id, ts: now.toISOString(), note: redact(note) })), env);
  if (written !== todo.length) {
    console.error(`${LABEL} processed.jsonl への書き込みに失敗しました`);
    return 1;
  }
  console.log(`${LABEL} marked ${written} signal(s) as processed`);
  return 0;
}

function main(argv, env = process.env) {
  const [cmd, ...rest] = argv;
  switch (cmd) {
    case "append": {
      // 値は位置引数で受ける（`--force` のような - 始まりの detail をフラグと取り違えない）
      const [kind, source, detail = "", sessionId = ""] = rest;
      if (!kind || !source) return 0;
      const repo = detectRepoSync(env.CLAUDE_PROJECT_DIR || process.cwd());
      appendLines(signalsPath(env), [newRecord({ kind, source, detail, sessionId, repo })], env);
      return 0;
    }
    case "hook-session-start": {
      try {
        const out = hookSessionStart(env, readStdinJson());
        if (out) process.stdout.write(JSON.stringify(out) + "\n");
      } catch {
        // fail-open
      }
      return 0;
    }
    case "hook-session-end": {
      // 非同期で git を待つため、終了コードは呼び出し側（エントリポイント）で 0 にする
      return hookSessionEnd(env, readStdinJson()).then(
        () => 0,
        () => 0,
      );
    }
    case "list": {
      const all = readSignals(env);
      const rows = rest.includes("--all") ? all : all.filter((s) => !s.processed);
      if (rest.includes("--json")) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        console.log(`${LABEL} ${signalsPath(env)}`);
        for (const s of rows) console.log(`${s.id}\t${s.ts}\t${s.repo}\t${s.kind}\t${s.source}\t${s.detail}`);
        const { count, byKind } = summarize(all);
        console.log(`${LABEL} unprocessed ${count} ${JSON.stringify(byKind)}`);
      }
      return 0;
    }
    case "mark": {
      const noteIdx = rest.indexOf("--note");
      const note = noteIdx >= 0 ? rest[noteIdx + 1] || "" : "";
      const ids = noteIdx >= 0 ? [...rest.slice(0, noteIdx), ...rest.slice(noteIdx + 2)] : rest;
      if (ids.length === 0) {
        console.error(`${LABEL} usage: mark <id>... --note "判断理由"`);
        return 1;
      }
      return markProcessed(env, ids, note);
    }
    default:
      console.error(`${LABEL} usage: append | hook-session-start | hook-session-end | list | mark | --self-test`);
      return 1;
  }
}

// ---- self-test ----
// 一時ディレクトリを HOME に差し替えた子プロセスで実行し、実際の ~/.claude/state には書かない。

async function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "growth-signals-"));
  const home = path.join(tmp, "home");
  fs.mkdirSync(home);
  const baseEnv = { ...process.env, HOME: home };
  delete baseEnv.GROWTH_SIGNALS_DIR;
  delete baseEnv.CLAUDE_PROJECT_DIR;
  const stDir = path.join(home, ".claude", "state", "my-blog-growth");
  const sigFile = path.join(stDir, "signals.jsonl");
  const helper = path.join(__dirname, "hooks", "growth-signal.sh");
  const results = [];
  const check = (name, ok, extra = "") => results.push({ name, ok: !!ok, extra });
  const run = (args, { input, env = baseEnv, cwd } = {}) =>
    spawnSync(process.execPath, [__filename, ...args], { input: input ?? "", env, cwd, encoding: "utf8" });
  const runAsync = (args, env) =>
    new Promise((resolve) => {
      const c = spawn(process.execPath, [__filename, ...args], { env, stdio: ["ignore", "ignore", "ignore"] });
      c.on("close", (code) => resolve(code));
    });
  const listJson = (env = baseEnv, all = false) => JSON.parse(run(["list", "--json", ...(all ? ["--all"] : [])], { env }).stdout);
  const gitIn = (dir, env) => (args, extraEnv = {}) =>
    execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
      cwd: dir,
      stdio: "ignore",
      env: { ...env, ...extraEnv },
    });
  const MY_BLOG_URL = "https://github.com/s977043/my-blog.git";

  try {
    // 1. 0 件のとき SessionStart は何も出さない
    let r = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s0", source: "startup" }) });
    check("0 件なら SessionStart は無出力・exit 0", r.status === 0 && r.stdout === "", JSON.stringify(r.stdout));

    // 2. append で HOME 配下に 1 行追記される。- 始まりの detail も値として扱う
    r = run(["append", "guard_block", "pre-push", "--force used", "s1"]);
    let recs = listJson();
    check(
      "append は $HOME/.claude/state/my-blog-growth/signals.jsonl に追記する（detail は位置引数）",
      r.status === 0 && recs.length === 1 && recs[0].kind === "guard_block" && recs[0].processed === false && recs[0].session_id === "s1" &&
        recs[0].detail === "--force used" && "repo" in recs[0],
      JSON.stringify(recs),
    );

    // 3. シェルヘルパー経由でも追記される
    r = spawnSync("bash", [helper, "append", "guard_block", "pre-commit", "main 直 commit"], { env: baseEnv, encoding: "utf8" });
    recs = listJson();
    check("growth-signal.sh append でも追記される", r.status === 0 && recs.length === 2 && recs[1].source === "pre-commit");

    // 4. トークン類はマスクして書く
    const secret = "git push https://x-access-token:ghp_ABCdef123456@github.com/s977043/my-blog.git; curl -H 'Authorization: Bearer sekret' github_pat_11AAA_bbb gho_XYZ";
    run(["append", "guard_block", "redact-test", secret]);
    const raw = fs.readFileSync(sigFile, "utf8");
    check(
      "detail のトークン・認証ヘッダはマスクされる",
      !/ghp_ABC|x-access-token|sekret|github_pat_11|gho_XYZ/.test(raw) && raw.includes("://***@"),
      raw.split("\n").filter((l) => l.includes("redact-test")).join(""),
    );

    // 5. 1 件以上で SessionStart が件数と kind 別内訳（上位 5 件まで）を 1〜3 行で出す
    for (const k of ["k1", "k2", "k3", "k4", "k5"]) run(["append", k, "t", "x"]);
    r = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s2", source: "startup" }) });
    let out = null;
    try {
      out = JSON.parse(r.stdout);
    } catch {
      // 下で FAIL
    }
    const msg = out && out.systemMessage;
    check(
      "1 件以上なら SessionStart が件数・上位 5 種の内訳・/self-improve を出す",
      r.status === 0 && msg && msg.includes("8 件") && msg.includes("guard_block 3") && msg.includes("ほか 1 種") && msg.includes("/self-improve") &&
        msg.split("\n").length <= 3 && out.hookSpecificOutput.additionalContext === msg,
      r.stdout,
    );

    // 6. 書き込み失敗（state ディレクトリを作れない）でも exit 0
    const badHome = path.join(tmp, "not-a-dir");
    fs.writeFileSync(badHome, "file");
    const badEnv = { ...baseEnv, HOME: badHome };
    r = run(["append", "guard_block", "x"], { env: badEnv });
    let r2 = spawnSync("bash", [helper, "append", "guard_block", "x", "y"], { env: badEnv, encoding: "utf8" });
    const r3 = run(["hook-session-end"], { env: badEnv, input: JSON.stringify({ session_id: "s3", cwd: tmp }) });
    const r4 = run(["hook-session-start"], { env: badEnv, input: "not json" });
    check("書き込み失敗・入力不正でも fail-open（exit 0）", [r, r2, r3, r4].every((x) => x.status === 0), [r, r2, r3, r4].map((x) => x.status).join(","));

    // 7. mark の失敗系: signals.jsonl 不在・未知の id は exit 1
    const emptyEnv = { ...baseEnv, HOME: path.join(tmp, "home-empty") };
    r = run(["mark", "nope", "--note", "x"], { env: emptyEnv });
    r2 = run(["mark", "unknown-id", "--note", "x"]);
    check("mark は signals.jsonl 不在・未知の id で exit 1", r.status === 1 && r2.status === 1, `${r.status},${r2.status}`);

    // 8. SessionEnd がローカル git から revert / redo / reset / 未 push / 未コミットを拾う
    const repo = path.join(tmp, "repo");
    fs.mkdirSync(repo);
    const g = gitIn(repo, baseEnv);
    g(["init", "-q", "-b", "feat/x"]);
    g(["remote", "add", "origin", MY_BLOG_URL]);
    fs.writeFileSync(path.join(repo, "a.txt"), "1");
    g(["add", "a.txt"]);
    // セッション開始より前の commit（拾わないことを確かめる）
    g(["commit", "-q", "-m", "fix: 再修正 base"], { GIT_AUTHOR_DATE: "2020-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2020-01-01T00:00:00Z" });
    run(["hook-session-start"], { input: JSON.stringify({ session_id: "s-git", source: "startup" }) });
    fs.writeFileSync(path.join(repo, "a.txt"), "2");
    g(["commit", "-q", "-am", "fix: 再修正"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "3");
    g(["commit", "-q", "-am", "fixup! fix: 再修正"]);
    g(["commit", "-q", "--allow-empty", "-m", "docs: 手順のやり直しを防ぐ説明を追加"]);
    g(["revert", "--no-edit", "HEAD~1"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "4");
    g(["commit", "-q", "-am", "chore: tmp"]);
    g(["reset", "-q", "--hard", "HEAD~1"]);
    fs.writeFileSync(path.join(repo, "b.txt"), "wip");
    r = run(["hook-session-end"], { input: JSON.stringify({ session_id: "s-git", cwd: repo, reason: "other" }) });
    recs = listJson().filter((x) => x.source === "session-end");
    const kinds = new Set(recs.map((x) => x.kind));
    check(
      "SessionEnd が redo_commit / revert_commit / reflog_reset / unpushed_commits / uncommitted_changes を記録する",
      r.status === 0 && ["redo_commit", "revert_commit", "reflog_reset", "unpushed_commits", "uncommitted_changes"].every((k) => kinds.has(k)) &&
        !recs.some((x) => x.detail.includes("base")) && recs.every((x) => x.session_id === "s-git" && x.repo === "s977043/my-blog"),
      [...kinds].join(","),
    );
    check(
      "件名の途中の「やり直し」は redo_commit にしない",
      !recs.some((x) => x.kind === "redo_commit" && x.detail.includes("手順のやり直し")),
      recs.filter((x) => x.kind === "redo_commit").map((x) => x.detail).join(" | "),
    );

    // 9. 同じ痕跡を二重に記録しない
    const before = listJson(baseEnv, true).length;
    run(["hook-session-end"], { input: JSON.stringify({ session_id: "s-git", cwd: repo, reason: "other" }) });
    check("SessionEnd を再実行しても同じ痕跡を重複記録しない", listJson(baseEnv, true).length === before, `${before} -> ${listJson(baseEnv, true).length}`);

    // 10. 別リポジトリ（origin が s977043/my-blog でない）では記録しない。CLAUDE_PROJECT_DIR を cwd より優先する
    const other = path.join(tmp, "other");
    fs.mkdirSync(other);
    const go = gitIn(other, baseEnv);
    go(["init", "-q", "-b", "main"]);
    go(["remote", "add", "origin", "https://github.com/some-org/private-repo.git"]);
    go(["commit", "-q", "--allow-empty", "-m", "fix: 再修正 in other"]);
    fs.writeFileSync(path.join(other, "secret-plan.txt"), "x");
    const homeO = path.join(tmp, "home-other");
    const envO = { ...baseEnv, HOME: homeO };
    r = run(["hook-session-end"], { env: envO, input: JSON.stringify({ session_id: "s-o", cwd: other }) });
    const recsO1 = listJson(envO, true);
    r2 = run(["hook-session-end"], { env: { ...envO, CLAUDE_PROJECT_DIR: other }, input: JSON.stringify({ session_id: "s-o2", cwd: repo }) });
    const recsO2 = listJson(envO, true);
    const r5 = run(["hook-session-end"], { env: { ...envO, CLAUDE_PROJECT_DIR: repo }, input: JSON.stringify({ session_id: "s-o3", cwd: other }) });
    const recsO3 = listJson(envO, true);
    check(
      "origin が s977043/my-blog でないリポジトリでは記録せず、git の実行場所は CLAUDE_PROJECT_DIR を優先する",
      r.status === 0 && r2.status === 0 && r5.status === 0 && recsO1.length === 0 && recsO2.length === 0 && recsO3.length > 0 &&
        recsO3.every((x) => x.repo === "s977043/my-blog" && !x.detail.includes("secret-plan") && !x.detail.includes("in other")),
      `${recsO1.length},${recsO2.length},${recsO3.length}`,
    );

    // 11. 未 push の判定: upstream が [gone] のブランチと、upstream の無い現在以外のブランチは記録しない
    const home2 = path.join(tmp, "home2");
    fs.mkdirSync(home2);
    const env2 = { ...baseEnv, HOME: home2 };
    const bare = path.join(tmp, "remote.git");
    const repo2 = path.join(tmp, "repo2");
    execFileSync("git", ["init", "-q", "--bare", bare], { stdio: "ignore" });
    fs.mkdirSync(repo2);
    const g2 = gitIn(repo2, env2);
    g2(["init", "-q", "-b", "main"]);
    // origin は判定用の URL だけ（接続しない）。push はローカルの bare リモートへ
    g2(["remote", "add", "origin", MY_BLOG_URL]);
    g2(["remote", "add", "bare", bare]);
    fs.writeFileSync(path.join(repo2, "a.txt"), "1");
    g2(["add", "a.txt"]);
    g2(["commit", "-q", "-m", "init"]);
    g2(["push", "-q", "-u", "bare", "main"]);
    // マージ済み想定のブランチ: push 後にリモート側で削除 → upstream が [gone]
    g2(["switch", "-q", "-c", "gone-br"]);
    fs.writeFileSync(path.join(repo2, "a.txt"), "gone");
    g2(["commit", "-q", "-am", "gone work"]);
    g2(["push", "-q", "-u", "bare", "gone-br"]);
    g2(["switch", "-q", "main"]);
    g2(["commit", "-q", "--allow-empty", "-m", "squash merge of gone-br"]);
    g2(["push", "-q", "bare", "main"]);
    g2(["push", "-q", "bare", "--delete", "gone-br"]);
    g2(["fetch", "-q", "--prune", "bare"]);
    // upstream の無い、現在ではないブランチ
    g2(["switch", "-q", "-c", "other-local"]);
    g2(["commit", "-q", "--allow-empty", "-m", "other local work"]);
    // upstream の無い現在ブランチ
    g2(["switch", "-q", "-c", "current-local", "main"]);
    g2(["commit", "-q", "--allow-empty", "-m", "current local work"]);
    r = run(["hook-session-end"], { env: env2, input: JSON.stringify({ session_id: "s-up", cwd: repo2 }) });
    const up = listJson(env2).find((x) => x.kind === "unpushed_commits");
    check("upstream の無い現在ブランチの未 push commit は記録する", r.status === 0 && up && up.detail.includes("current-local"), up && up.detail);
    check(
      "upstream が [gone] のブランチ・upstream の無い現在以外のブランチは記録しない",
      up && !up.detail.includes("gone-br") && !up.detail.includes("other-local") && up.detail.startsWith("1 commit(s)"),
      up && up.detail,
    );

    // 12. mark で processed:true と判断理由が残り、全件処理後は SessionStart が無出力
    const ids = listJson().map((x) => x.id);
    r = run(["mark", ...ids, "--note", "既存エントリで足りる"]);
    recs = listJson(baseEnv, true);
    r2 = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s4", source: "startup" }) });
    const r6 = run(["mark", ids[0], "--note", "again"]);
    check(
      "mark 後は processed:true・detail に判断理由・SessionStart 無出力（処理済みの再 mark は警告で exit 0）",
      r.status === 0 && recs.every((x) => x.processed === true && x.detail.includes("既存エントリで足りる")) && r2.stdout === "" && r6.status === 0 &&
        /WARN/.test(r6.stderr),
    );

    // 13. 並行 append と mark で行が失われない
    const homeC = path.join(tmp, "home-conc");
    const envC = { ...baseEnv, HOME: homeC };
    const stC = path.join(homeC, ".claude", "state", "my-blog-growth");
    fs.mkdirSync(stC, { recursive: true });
    const seed = Array.from({ length: 3000 }, (_, i) => JSON.stringify({ id: `seed-${i}`, ts: "2026-01-01T00:00:00Z", kind: "seed", source: "t", detail: "", ref: null }));
    fs.writeFileSync(path.join(stC, "signals.jsonl"), seed.join("\n") + "\n");
    const jobs = [];
    for (let i = 0; i < 40; i++) {
      jobs.push(runAsync(["append", "conc", "t", `a${i}`], envC));
      jobs.push(runAsync(["mark", `seed-${i}`, "--note", "conc"], envC));
    }
    const codes = await Promise.all(jobs);
    const allC = listJson(envC, true);
    check(
      "並行 append 40 件と mark 40 件で行が失われない",
      codes.every((c) => c === 0) && allC.length === 3040 && allC.filter((x) => x.kind === "conc").length === 40 && allC.filter((x) => x.processed).length === 40,
      `codes=${[...new Set(codes)]} total=${allC.length} processed=${allC.filter((x) => x.processed).length}`,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const failed = results.filter((x) => !x.ok);
  for (const x of results) console.log(`${x.ok ? "PASS" : "FAIL"}: ${x.name}${x.ok || !x.extra ? "" : ` (${x.extra})`}`);
  if (failed.length > 0) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${results.length}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n${LABEL} self-test OK: ${results.length}/${results.length}`);
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    let code;
    try {
      code = main(process.argv.slice(2));
    } catch {
      code = 0;
    }
    // process.exit は macOS のパイプで stdout を切り捨てうるので exitCode で返す
    Promise.resolve(code).then((c) => {
      process.exitCode = c;
    });
  }
}
