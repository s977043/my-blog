#!/usr/bin/env node
// 自己成長ループのシグナル（ガード発火・やり直しの痕跡）をリポジトリ外の JSONL に記録する。
//
// ■ 背景
//   docs/agent-growth-harness.md §2 案 4（ガード発火ログ）と案 5（振り返りの起動）。
//   ガードが止めた回数や、セッション中の revert / reset が記録されず、振り返りが人の指示待ちだった。
//   記録はセッション終了ごとに hook が行い、処理（学び・ガード案への振り分け）は /self-improve が行う。
//
// ■ 保存先
//   ${GROWTH_SIGNALS_DIR:-$HOME/.claude/state/my-blog-growth}/signals.jsonl（1 行 1 JSON）
//   { id, ts, session_id, kind, source, detail, ref, processed }
//   ref は重複記録を避けるためのキー（commit SHA など）。
//
// ■ fail-open
//   hook から呼ぶサブコマンド（append / hook-session-start / hook-session-end）は、
//   書き込み失敗・git 失敗・入力不正のどれでも exit 0 で終わる。記録のためにガードやセッションを止めない。
//
// ■ 使い方
//   node scripts/growth-signals.js append --kind guard_block --source pre-push --detail "..." [--session-id X] [--ref R]
//   node scripts/growth-signals.js hook-session-start   # SessionStart hook（stdin に hook JSON）
//   node scripts/growth-signals.js hook-session-end     # SessionEnd hook（stdin に hook JSON）
//   node scripts/growth-signals.js list [--json] [--all]
//   node scripts/growth-signals.js mark <id>... --note "判断理由"
//   npm run test:growth-signals                         # = node scripts/growth-signals.js --self-test

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile, execFileSync, spawnSync } = require("child_process");

const LABEL = "[growth-signals]";
const DEFAULT_LOOKBACK_MS = 12 * 60 * 60 * 1000;
const SESSION_FILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REDO_RE = /^(fixup!|squash!)|やり直し|再(修正|対応|実行|試行|作成|適用|度|push|コミット|commit)/;
const REVERT_RE = /^Revert\b/;

function stateDir(env = process.env) {
  if (env.GROWTH_SIGNALS_DIR) return env.GROWTH_SIGNALS_DIR;
  return path.join(env.HOME || os.homedir(), ".claude", "state", "my-blog-growth");
}

function signalsPath(env) {
  return path.join(stateDir(env), "signals.jsonl");
}

function readSignals(env) {
  let text;
  try {
    text = fs.readFileSync(signalsPath(env), "utf8");
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

function newRecord({ kind, source, detail, sessionId, ref, now = new Date() }) {
  return {
    id: `${now.getTime().toString(36)}-${crypto.randomBytes(3).toString("hex")}`,
    ts: now.toISOString(),
    session_id: sessionId || null,
    kind,
    source,
    detail: detail || "",
    ref: ref || null,
    processed: false,
  };
}

// 失敗しても例外を投げない。書けた件数を返す。
function appendRecords(records, env) {
  if (records.length === 0) return 0;
  try {
    fs.mkdirSync(stateDir(env), { recursive: true });
    fs.appendFileSync(signalsPath(env), records.map((r) => JSON.stringify(r)).join("\n") + "\n");
    return records.length;
  } catch (e) {
    if (env.GROWTH_SIGNALS_DEBUG) console.error(`${LABEL} write failed: ${e.message}`);
    return 0;
  }
}

function summarize(signals) {
  const pending = signals.filter((s) => s.processed === false);
  const byKind = {};
  for (const s of pending) byKind[s.kind] = (byKind[s.kind] || 0) + 1;
  return { count: pending.length, byKind };
}

// SessionStart で出す文言。0 件なら null（何も出さない）。
function startMessage(signals) {
  const { count, byKind } = summarize(signals);
  if (count === 0) return null;
  const breakdown = Object.entries(byKind)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`)
    .join(", ");
  return `[growth-signals] 未処理のシグナル ${count} 件（${breakdown}）\n/self-improve で処理できます`;
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
async function collectGitSignals(cwd, sinceMs) {
  const found = [];
  const sinceSec = Math.floor(sinceMs / 1000);
  const [log, reflog, heads, status] = await Promise.all([
    // revert / fixup! / やり直しを示す commit（ローカルブランチ上、セッション開始以降）
    gitAsync(cwd, ["log", "--branches", `--since=@${sinceSec}`, "--format=%H%x09%s"]),
    // このワークツリーの HEAD reflog 上の reset
    gitAsync(cwd, ["reflog", "show", "--date=unix", "--format=%gd%x09%H%x09%gs", "HEAD"]),
    // 未 push の判定対象を選ぶためのローカルブランチ一覧（現在ブランチ印・upstream・追跡状態）
    gitAsync(cwd, ["for-each-ref", "refs/heads", "--format=%(HEAD)%09%(refname:short)%09%(upstream)%09%(upstream:track)"]),
    // 未コミットの変更（1 行目はブランチ名）
    gitAsync(cwd, ["--no-optional-locks", "status", "--porcelain", "--branch"]),
  ]);

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
    ? await gitAsync(cwd, ["log", ...targets, "--not", "--remotes", "--format=%H%x09%D", "--decorate-refs=refs/heads/", "--"])
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
      const diff = (await gitAsync(cwd, ["diff", "--", "AGENTS.md"])) || "";
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

  return found;
}

async function hookSessionEnd(env, input, now = new Date()) {
  const cwd = input.cwd || process.cwd();
  const since = sessionSince(env, input, now);
  const existing = new Set(readSignals(env).map((s) => `${s.kind}\t${s.ref}`));
  const records = (await collectGitSignals(cwd, since))
    .filter((f) => !existing.has(`${f.kind}\t${f.ref}`))
    .map((f) => newRecord({ ...f, source: "session-end", sessionId: input.session_id, now }));
  appendRecords(records, env);
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

function markProcessed(env, ids, note, now = new Date()) {
  const file = signalsPath(env);
  const want = new Set(ids);
  const text = fs.readFileSync(file, "utf8");
  let changed = 0;
  const lines = text.split("\n").map((line) => {
    if (!line.trim()) return line;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      return line;
    }
    if (!want.has(r.id) || r.processed) return line;
    changed++;
    r.processed = true;
    r.processed_at = now.toISOString();
    if (note) r.detail = `${r.detail} [processed: ${note}]`;
    return JSON.stringify(r);
  });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, lines.join("\n"));
  fs.renameSync(tmp, file);
  return changed;
}

function parseFlags(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else flags._.push(a);
  }
  return flags;
}

function main(argv, env = process.env) {
  const [cmd, ...rest] = argv;
  const flags = parseFlags(rest);
  switch (cmd) {
    case "append": {
      if (!flags.kind || !flags.source) return 0;
      appendRecords(
        [newRecord({ kind: flags.kind, source: flags.source, detail: flags.detail, sessionId: flags["session-id"], ref: flags.ref })],
        env,
      );
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
      const rows = flags.all ? all : all.filter((s) => s.processed === false);
      if (flags.json) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        console.log(`${LABEL} ${signalsPath(env)}`);
        for (const s of rows) console.log(`${s.id}\t${s.ts}\t${s.kind}\t${s.source}\t${s.detail}`);
        const { count, byKind } = summarize(all);
        console.log(`${LABEL} unprocessed ${count} ${JSON.stringify(byKind)}`);
      }
      return 0;
    }
    case "mark": {
      if (flags._.length === 0) {
        console.error(`${LABEL} usage: mark <id>... --note "判断理由"`);
        return 1;
      }
      const n = markProcessed(env, flags._, typeof flags.note === "string" ? flags.note : "");
      console.log(`${LABEL} marked ${n} signal(s) as processed`);
      return 0;
    }
    default:
      console.error(`${LABEL} usage: append | hook-session-start | hook-session-end | list | mark | --self-test`);
      return 1;
  }
}

// ---- self-test ----
// 一時ディレクトリを HOME に差し替えた子プロセスで実行し、実際の ~/.claude/state には書かない。

function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "growth-signals-"));
  const home = path.join(tmp, "home");
  fs.mkdirSync(home);
  const baseEnv = { ...process.env, HOME: home };
  delete baseEnv.GROWTH_SIGNALS_DIR;
  const sigFile = path.join(home, ".claude", "state", "my-blog-growth", "signals.jsonl");
  const helper = path.join(__dirname, "hooks", "growth-signal.sh");
  const results = [];
  const check = (name, ok, extra = "") => results.push({ name, ok: !!ok, extra });
  const run = (args, { input, env = baseEnv, cwd } = {}) =>
    spawnSync(process.execPath, [__filename, ...args], { input: input ?? "", env, cwd, encoding: "utf8" });
  const readFile = () => (fs.existsSync(sigFile) ? fs.readFileSync(sigFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

  try {
    // 1. 0 件のとき SessionStart は何も出さない
    let r = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s0", source: "startup" }) });
    check("0 件なら SessionStart は無出力・exit 0", r.status === 0 && r.stdout === "", JSON.stringify(r.stdout));

    // 2. append で HOME 配下に 1 行追記される
    r = run(["append", "--kind", "guard_block", "--source", "pre-push", "--detail", "gh account mismatch", "--session-id", "s1"]);
    let recs = readFile();
    check(
      "append は $HOME/.claude/state/my-blog-growth/signals.jsonl に追記する",
      r.status === 0 && recs.length === 1 && recs[0].kind === "guard_block" && recs[0].processed === false && recs[0].session_id === "s1" && recs[0].ts,
    );

    // 3. シェルヘルパー経由でも追記される
    r = spawnSync("bash", [helper, "append", "guard_block", "pre-commit", "main 直 commit"], { env: baseEnv, encoding: "utf8" });
    recs = readFile();
    check("growth-signal.sh append でも追記される", r.status === 0 && recs.length === 2 && recs[1].source === "pre-commit");

    // 4. 1 件以上で SessionStart が件数と kind 別内訳を 1〜3 行で出す
    r = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s2", source: "startup" }) });
    let out = null;
    try {
      out = JSON.parse(r.stdout);
    } catch {
      // 下で FAIL
    }
    const msg = out && out.systemMessage;
    check(
      "1 件以上なら SessionStart が件数・内訳・/self-improve を出す",
      r.status === 0 && msg && msg.includes("2 件") && msg.includes("guard_block 2") && msg.includes("/self-improve") && msg.split("\n").length <= 3 &&
        out.hookSpecificOutput.additionalContext === msg,
      r.stdout,
    );

    // 5. 書き込み失敗（state ディレクトリを作れない）でも exit 0
    const badHome = path.join(tmp, "not-a-dir");
    fs.writeFileSync(badHome, "file");
    const badEnv = { ...baseEnv, HOME: badHome };
    r = run(["append", "--kind", "guard_block", "--source", "x"], { env: badEnv });
    let r2 = spawnSync("bash", [helper, "append", "guard_block", "x", "y"], { env: badEnv, encoding: "utf8" });
    const r3 = run(["hook-session-end"], { env: badEnv, input: JSON.stringify({ session_id: "s3", cwd: tmp }) });
    const r4 = run(["hook-session-start"], { env: badEnv, input: "not json" });
    check("書き込み失敗・入力不正でも fail-open（exit 0）", [r, r2, r3, r4].every((x) => x.status === 0), [r, r2, r3, r4].map((x) => x.status).join(","));

    // 6. SessionEnd がローカル git から revert / redo / reset / 未 push / 未コミットを拾う
    const repo = path.join(tmp, "repo");
    fs.mkdirSync(repo);
    const g = (args, extraEnv = {}) =>
      execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
        cwd: repo,
        stdio: "ignore",
        env: { ...baseEnv, ...extraEnv },
      });
    g(["init", "-q", "-b", "feat/x"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "1");
    g(["add", "a.txt"]);
    // セッション開始より前の commit（拾わないことを確かめる）
    g(["commit", "-q", "-m", "feat: base 再修正"], { GIT_AUTHOR_DATE: "2020-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2020-01-01T00:00:00Z" });
    run(["hook-session-start"], { input: JSON.stringify({ session_id: "s-git", source: "startup" }) });
    fs.writeFileSync(path.join(repo, "a.txt"), "2");
    g(["commit", "-q", "-am", "fix: 再修正"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "3");
    g(["commit", "-q", "-am", "fixup! fix: 再修正"]);
    g(["revert", "--no-edit", "HEAD"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "4");
    g(["commit", "-q", "-am", "chore: tmp"]);
    g(["reset", "-q", "--hard", "HEAD~1"]);
    fs.writeFileSync(path.join(repo, "b.txt"), "wip");
    r = run(["hook-session-end"], { input: JSON.stringify({ session_id: "s-git", cwd: repo, reason: "other" }) });
    recs = readFile().filter((x) => x.source === "session-end");
    const kinds = new Set(recs.map((x) => x.kind));
    check(
      "SessionEnd が redo_commit / revert_commit / reflog_reset / unpushed_commits / uncommitted_changes を記録する",
      r.status === 0 && ["redo_commit", "revert_commit", "reflog_reset", "unpushed_commits", "uncommitted_changes"].every((k) => kinds.has(k)) &&
        !recs.some((x) => x.detail.includes("feat: base")) && recs.every((x) => x.session_id === "s-git"),
      [...kinds].join(","),
    );

    // 7. 同じ痕跡を二重に記録しない
    const before = readFile().length;
    run(["hook-session-end"], { input: JSON.stringify({ session_id: "s-git", cwd: repo, reason: "other" }) });
    check("SessionEnd を再実行しても同じ痕跡を重複記録しない", readFile().length === before, `${before} -> ${readFile().length}`);

    // 7b. 未 push の判定: upstream が [gone] のブランチと、upstream の無い現在以外のブランチは記録しない
    const home2 = path.join(tmp, "home2");
    fs.mkdirSync(home2);
    const env2 = { ...baseEnv, HOME: home2 };
    const sigFile2 = path.join(home2, ".claude", "state", "my-blog-growth", "signals.jsonl");
    const bare = path.join(tmp, "remote.git");
    const repo2 = path.join(tmp, "repo2");
    execFileSync("git", ["init", "-q", "--bare", bare], { stdio: "ignore" });
    fs.mkdirSync(repo2);
    const g2 = (args) =>
      execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
        cwd: repo2,
        stdio: "ignore",
        env: env2,
      });
    g2(["init", "-q", "-b", "main"]);
    g2(["remote", "add", "origin", bare]);
    fs.writeFileSync(path.join(repo2, "a.txt"), "1");
    g2(["add", "a.txt"]);
    g2(["commit", "-q", "-m", "init"]);
    g2(["push", "-q", "-u", "origin", "main"]);
    // マージ済み想定のブランチ: push 後にリモート側で削除 → upstream が [gone]
    g2(["switch", "-q", "-c", "gone-br"]);
    fs.writeFileSync(path.join(repo2, "a.txt"), "gone");
    g2(["commit", "-q", "-am", "gone work"]);
    g2(["push", "-q", "-u", "origin", "gone-br"]);
    g2(["switch", "-q", "main"]);
    g2(["commit", "-q", "--allow-empty", "-m", "squash merge of gone-br"]);
    g2(["push", "-q", "origin", "main"]);
    g2(["push", "-q", "origin", "--delete", "gone-br"]);
    // gone-br の commit を remote-tracking ref から外す（リモート削除と同じ状態）
    g2(["fetch", "-q", "--prune", "origin"]);
    // upstream の無い、現在ではないブランチ
    g2(["switch", "-q", "-c", "other-local"]);
    g2(["commit", "-q", "--allow-empty", "-m", "other local work"]);
    // upstream の無い現在ブランチ
    g2(["switch", "-q", "-c", "current-local", "main"]);
    g2(["commit", "-q", "--allow-empty", "-m", "current local work"]);
    r = run(["hook-session-end"], { env: env2, input: JSON.stringify({ session_id: "s-up", cwd: repo2 }) });
    const recs2 = fs.existsSync(sigFile2) ? fs.readFileSync(sigFile2, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
    const up = recs2.find((x) => x.kind === "unpushed_commits");
    check("upstream の無い現在ブランチの未 push commit は記録する", r.status === 0 && up && up.detail.includes("current-local"), up && up.detail);
    check(
      "upstream が [gone] のブランチ・upstream の無い現在以外のブランチは記録しない",
      up && !up.detail.includes("gone-br") && !up.detail.includes("other-local") && up.detail.startsWith("1 commit(s)"),
      up && up.detail,
    );

    // 8. mark で processed:true と判断理由が残り、全件処理後は SessionStart が無出力
    const ids = readFile().filter((x) => !x.processed).map((x) => x.id);
    r = run(["mark", ...ids, "--note", "既存エントリで足りる"]);
    recs = readFile();
    r2 = run(["hook-session-start"], { input: JSON.stringify({ session_id: "s4", source: "startup" }) });
    check(
      "mark 後は processed:true・detail に判断理由・SessionStart 無出力",
      r.status === 0 && recs.every((x) => x.processed === true && x.detail.includes("既存エントリで足りる")) && r2.stdout === "",
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const failed = results.filter((x) => !x.ok);
  for (const x of results) console.log(`${x.ok ? "PASS" : "FAIL"}: ${x.name}${x.ok || !x.extra ? "" : ` (${x.extra})`}`);
  if (failed.length > 0) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${results.length}`);
    process.exit(1);
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
