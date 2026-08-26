#!/usr/bin/env node
// Suggest: 記事テーマの自律発見（Automations「仕事の発見」）。
//
// 人間が次テーマを思いつくのを待つのをやめ、リポジトリ内のシグナルから
// publish-queue.md の `[backlog]` 行を機械的に起票する。
//
// ■ 設計原則
//   「機械的に検証できる候補だけを自動採用する」。
//   一次情報が実ファイルとして存在することを検証できない候補は **起票しない**。
//   確信度の高低で人間に判断を投げるのではなく、検証不能ならノイズとして捨てる。
//   （人間の確認は「起票された backlog を ready に上げるか」の一点だけに集約する）
//
// ■ シグナル
//   S1 未記事化の学び : AGENT_LEARNINGS.md の日付付きエントリのうち、
//                       見出しキーワードが既存記事にも Queue にも出てこないもの
//   S2 未記事化の道具 : scripts/ 配下の実行スクリプトのうち、
//                       ファイル名がどの記事本文にも出てこないもの
//   S3 クラスタ       : 同一カテゴリタグが THRESHOLD 件以上溜まっているもの（シリーズ候補）
//
// ■ 使い方
//   npm run suggest:theme              # dry-run。起票案を表示するだけ
//   npm run suggest:theme -- --apply   # publish-queue.md の Queue セクションに追記
//   npm run test:suggest-theme         # self-test（純関数のみ・I/O なし）

const fs = require("fs");
const path = require("path");

const LEARNINGS = "AGENT_LEARNINGS.md";
const QUEUE = "docs/publish-queue.md";
const ARTICLES_DIR = "articles";
const SCRIPTS_DIR = "scripts";
const CLUSTER_THRESHOLD = 4;
const ADOPT_SCORE = 3; // これ未満は起票しない（台帳を候補で埋めない）
const ADOPT_LIMIT = 5; // 1 回の起票上限。人間が一度に判断できる量に合わせる

// ---- 純関数（self-test 対象） ----

// AGENT_LEARNINGS の日付付きエントリを抽出する。
// `### YYYY-MM-DD — <見出し> [タグ][タグ]` の形式のみを対象とし、
// テンプレート行（YYYY-MM-DD リテラル）は除外する。
function parseLearnings(md) {
  const out = [];
  const re = /^### (\d{4}-\d{2}-\d{2}) — (.+?)\s*((?:\[[^\]]+\])*)\s*$/gm;
  let m;
  while ((m = re.exec(md)) !== null) {
    const tags = (m[3] || "").match(/\[([^\]]+)\]/g) || [];
    out.push({
      date: m[1],
      title: m[2].trim(),
      tags: tags.map((t) => t.slice(1, -1)),
    });
  }
  return out;
}

// 見出しから照合用キーワードを取り出す。
// バッククォートで囲まれた識別子（コマンド名・ファイル名）を優先する。
// 識別子が無い見出しは照合の信頼性が低いため空配列を返し、候補から落とす。
function keywordsOf(title) {
  const ticks = title.match(/`([^`]+)`/g) || [];
  return ticks
    .map((t) => t.slice(1, -1).trim())
    .filter((t) => t.length >= 4 && !t.includes(" "));
}

// keyword が本文集合のどこにも出現しないなら true（＝未記事化）。
function isUncovered(keyword, corpora) {
  return !corpora.some((c) => c.includes(keyword));
}

// タグごとの件数を数え、閾値以上のものを返す。
function clusterTags(entries, threshold) {
  const count = new Map();
  for (const e of entries) {
    for (const t of e.tags) count.set(t, (count.get(t) || 0) + 1);
  }
  return [...count.entries()]
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, n]) => ({ tag, count: n }));
}

// 候補を publish-queue.md の 1 行に整形する。
function formatQueueLine(c) {
  return `- \`[backlog]\` **(${c.channel}) 締切 未設定**: 「${c.title}」（自動起票 ${c.foundAt} / signal:${c.signal} / score:${c.score}）。一次情報: ${c.evidence.map((e) => `\`${e}\``).join("、")}`;
}

// 候補に採用スコアを付ける。
// 「起票できること」と「起票すべきこと」は別物なので、シグナルの強さで足切りする。
//   S1 実インシデント由来 = 強い（既に痛みが発生している）
//   S2 道具の存在だけ     = 弱い（誰かが困った証拠がない）。自己テストや規模で補強されて初めて強い
//   S3 クラスタ           = 件数が閾値の 2 倍を超えたらシリーズとして強い
function scoreCandidate(c, facts = {}) {
  if (c.signal.startsWith("S1")) return 3;
  if (c.signal.startsWith("S2")) {
    return 1 + (facts.hasSelfTest ? 2 : 0) + (facts.lines >= 150 ? 1 : 0);
  }
  if (c.signal.startsWith("S3")) {
    const n = Number(c.signal.split(":")[2] || 0);
    return n >= CLUSTER_THRESHOLD * 2 ? 3 : 1;
  }
  return 0;
}

// 既に Queue / Done に同じ一次情報が載っているなら重複として弾く。
function isDuplicate(queueMd, evidence) {
  return evidence.some((e) => queueMd.includes(e));
}

// ---- I/O ----

function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function collectArticles() {
  let files = [];
  try {
    files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files.map((f) => readSafe(path.join(ARTICLES_DIR, f)));
}

function collectScripts() {
  try {
    return fs
      .readdirSync(SCRIPTS_DIR)
      .filter((f) => /\.(js|sh|mjs)$/.test(f))
      .filter((f) => !/^test-|\.test\./.test(f));
  } catch {
    return [];
  }
}

function build() {
  const learningsMd = readSafe(LEARNINGS);
  const queueMd = readSafe(QUEUE);
  const articles = collectArticles();
  const corpora = [...articles, queueMd];
  const today = new Date().toISOString().slice(0, 10);
  const candidates = [];

  // S1: 未記事化の学び
  for (const e of parseLearnings(learningsMd)) {
    const kws = keywordsOf(e.title);
    if (kws.length === 0) continue; // 検証不能 → 捨てる
    const uncovered = kws.filter((k) => isUncovered(k, corpora));
    if (uncovered.length === 0) continue;
    candidates.push({
      channel: "zenn",
      title: e.title.replace(/`/g, ""),
      evidence: uncovered,
      signal: `S1:learning:${e.date}`,
      foundAt: today,
    });
  }

  // S2: 未記事化の道具
  const pkgScripts = JSON.parse(readSafe("package.json") || "{}").scripts || {};
  for (const f of collectScripts()) {
    if (!isUncovered(f, corpora)) continue;
    const body = readSafe(path.join(SCRIPTS_DIR, f));
    candidates.push({
      channel: "zenn",
      title: `${f} が解いている問題`,
      evidence: [`scripts/${f}`],
      signal: "S2:tool",
      foundAt: today,
      facts: {
        hasSelfTest: /--self-test/.test(body) ||
          Object.values(pkgScripts).some((v) => v.includes(f) && v.includes("self-test")),
        lines: body.split("\n").length,
      },
    });
  }

  // S3: クラスタ
  for (const c of clusterTags(parseLearnings(learningsMd), CLUSTER_THRESHOLD)) {
    candidates.push({
      channel: "zenn",
      title: `[${c.tag}] に分類された学び ${c.count} 件のシリーズ化`,
      evidence: [`AGENT_LEARNINGS.md [${c.tag}]`],
      signal: `S3:cluster:${c.count}`,
      foundAt: today,
    });
  }

  // 一次情報が実在することを検証できないものは落とす（S3 を除く）
  const verified = candidates.filter((c) => {
    if (c.signal.startsWith("S3")) return true;
    if (c.signal.startsWith("S2")) return fs.existsSync(c.evidence[0]);
    return true;
  });

  return verified
    .filter((c) => !isDuplicate(queueMd, c.evidence))
    .map((c) => ({ ...c, score: scoreCandidate(c, c.facts) }))
    .filter((c) => c.score >= ADOPT_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, ADOPT_LIMIT);
}

function apply(lines) {
  const md = readSafe(QUEUE);
  const anchor = "## Queue（締切順）\n";
  if (!md.includes(anchor)) throw new Error("Queue セクションが見つからない");
  const next = md.replace(anchor, anchor + "\n" + lines.join("\n") + "\n");
  fs.writeFileSync(QUEUE, next);
}

// ---- self-test ----

function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  const sample = [
    "### エントリ形式（テンプレート）",
    "### YYYY-MM-DD — <短い見出し> [カテゴリ]",
    "### 2026-08-20 — `sync-release-zenn.sh` の公開影響プレビューは新規ファイル追加を検知しない [Gotcha][Tooling]",
    "### 2026-07-19 — 素の見出しには識別子がない [Tooling]",
  ].join("\n");

  const parsed = parseLearnings(sample);
  eq("テンプレート行を除外する", parsed.length, 2);
  eq("日付を取る", parsed[0].date, "2026-08-20");
  eq("タグを取る", parsed[0].tags, ["Gotcha", "Tooling"]);

  eq("識別子を抽出する", keywordsOf("`sync-release-zenn.sh` の話"), ["sync-release-zenn.sh"]);
  eq("識別子が無ければ空", keywordsOf("素の見出し"), []);
  eq("短すぎる識別子は捨てる", keywordsOf("`ab` の話"), []);

  eq("既出なら未記事化ではない", isUncovered("foo.sh", ["about foo.sh here"]), false);
  eq("未出なら未記事化", isUncovered("foo.sh", ["nothing"]), true);

  eq(
    "閾値以上のタグだけ返す",
    clusterTags([{ tags: ["A"] }, { tags: ["A"] }, { tags: ["B"] }], 2),
    [{ tag: "A", count: 2 }]
  );

  eq(
    "一次情報が既出なら重複",
    isDuplicate("... `scripts/foo.sh` ...", ["scripts/foo.sh"]),
    true
  );

  eq("S1 は無条件で採用圏", scoreCandidate({ signal: "S1:learning:2026-01-01" }), 3);
  eq("S2 は自己テストなしなら足切り", scoreCandidate({ signal: "S2:tool" }, { hasSelfTest: false, lines: 40 }), 1);
  eq("S2 は自己テストありで採用圏", scoreCandidate({ signal: "S2:tool" }, { hasSelfTest: true, lines: 40 }), 3);
  eq("S2 は規模でも加点", scoreCandidate({ signal: "S2:tool" }, { hasSelfTest: true, lines: 200 }), 4);
  eq("S3 は閾値2倍未満なら足切り", scoreCandidate({ signal: "S3:cluster:5" }), 1);
  eq("S3 は閾値2倍以上で採用圏", scoreCandidate({ signal: "S3:cluster:32" }), 3);

  const line = formatQueueLine({
    channel: "zenn",
    title: "T",
    evidence: ["scripts/x.sh"],
    signal: "S2:tool",
    foundAt: "2026-08-26",
    score: 3,
  });
  eq("backlog 行になる", line.startsWith("- `[backlog]` **(zenn) 締切 未設定**: 「T」"), true);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? "ok  " : "FAIL"} ${x.name}`);
  if (failed.length) {
    console.error(`\n[suggest:theme] self-test FAILED: ${failed.length}/${t.length}`);
    for (const f of failed) console.error(`  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`);
    process.exit(1);
  }
  console.log(`\n[suggest:theme] self-test OK: ${t.length}/${t.length}`);
}

// ---- main ----

if (require.main !== module) {
  // ライブラリとして読み込まれたときは何も実行しない
} else if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  const cands = build();
  if (cands.length === 0) {
    console.log("[suggest:theme] 新規候補なし（シグナルはすべて記事化済み or Queue 済み）");
    process.exit(0);
  }
  const lines = cands.map(formatQueueLine);
  console.log(`[suggest:theme] ${cands.length} 件の候補を検出\n`);
  for (const l of lines) console.log(l);
  if (process.argv.includes("--apply")) {
    apply(lines);
    console.log(`\n[suggest:theme] ${QUEUE} に ${lines.length} 行を追記した`);
  } else {
    console.log(`\n（dry-run。追記するには --apply）`);
  }
}

module.exports = { parseLearnings, keywordsOf, isUncovered, clusterTags, scoreCandidate, formatQueueLine, isDuplicate };
