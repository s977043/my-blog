#!/usr/bin/env node
// Report: AGENT_LEARNINGS.md の学びが、どこまで機械ガード（check・hook・CI・settings）へ昇格したかを集計する。
//
// ■ 背景
//   学びは AGENT_LEARNINGS.md に追記されるが、それが check や hook に落ちたかは追えていなかった。
//   docs/agent-growth-harness.md §3 の指標を、毎回同じ数え方で再現するための読み取り専用レポート。
//   正規表現による粗い計数なので、閾値判断ではなく推移の比較に使う。
//
// ■ 数え方（設計書 §3 と一致させる）
//   - `## 📇` 見出しより後ろを `\n### YYYY-MM-DD` で区切った各ブロックを 1 エントリとする
//   - 機械ガード言及 / 再発明記 / テーマは、下の表の正規表現がエントリ本文に 1 回でも当たれば数える
//   - 昇格候補: テーマに当たったエントリのうち、機械ガードに触れていないものが 3 件以上あるテーマ
//
// ■ `npm run check` に入れない理由
//   集計値は記事やスクリプトの不備ではない。形式の検証は `test:learnings-promotion`（self-test）で CI に載せている。
//
// ■ 使い方
//   npm run report:learnings-promotion
//   npm run report:learnings-promotion -- --json
//   npm run report:learnings-promotion -- --file path/to/AGENT_LEARNINGS.md
//   npm run test:learnings-promotion    # = node scripts/report-learnings-promotion.js --self-test
//
// 常に exit 0。ファイルを読めないときだけ exit 1。ファイルは書かない。

const fs = require("fs");
const path = require("path");

const LABEL = "[report:learnings-promotion]";
const DEFAULT_PATH = "AGENT_LEARNINGS.md";
const INDEX_MARKER = "## 📇";
const CANDIDATE_MIN = 3;

const GUARD_RE =
  /npm run (check|test):|scripts\/hooks|pre-commit|pre-push|PreToolUse|ci\.yml|check-[a-z-]+\.js/;
const RECUR_RE = /再発|2回目|二度目|同型|同じ(ミス|失敗)|再び/;

const THEMES = [
  { id: "parallel-session", label: "並列セッション", re: /並列セッション/ },
  {
    id: "gh-account",
    label: "gh アカウント",
    re: /gh auth|active account|kominem/,
  },
  { id: "formatter-churn", label: "formatter churn", re: /formatter|churn/i },
  { id: "worktree", label: "worktree", re: /worktree/ },
  { id: "stash", label: "stash", re: /stash/ },
  { id: "stale-pr", label: "stale PR / squash", re: /stale|squash/i },
  { id: "note-wxr", label: "note WXR", re: /WXR/ },
  {
    id: "zenn-release",
    label: "Zenn 公開・rate-limit",
    re: /release\/zenn|rate-limit|rate limit/,
  },
  {
    id: "qiita-publish",
    label: "Qiita 公開",
    re: /publish:qiita|qiita-cli|\.remote/,
  },
  { id: "claude-mem", label: "claude-mem 混入", re: /claude-mem/ },
];

// ---- 純関数（self-test 対象） ----

function splitEntries(text) {
  const idx = text.indexOf(INDEX_MARKER);
  const body = idx >= 0 ? text.slice(idx + INDEX_MARKER.length) : text;
  return body
    .split(/\n### (?=\d{4}-\d\d-\d\d)/)
    .slice(1)
    .map((e) => ({
      month: e.slice(0, 7),
      title: e.split("\n", 1)[0].trim(),
      text: e,
    }));
}

function analyze(text, themes = THEMES) {
  const entries = splitEntries(text);
  const total = entries.length;
  const byMonth = {};
  for (const e of entries) byMonth[e.month] = (byMonth[e.month] || 0) + 1;
  const isGuarded = (e) => GUARD_RE.test(e.text);
  const guarded = entries.filter(isGuarded).length;
  const recurring = entries.filter((e) => RECUR_RE.test(e.text));
  const themeStats = themes.map((t) => {
    const hit = entries.filter((e) => t.re.test(e.text));
    const unguarded = hit.filter((e) => !isGuarded(e)).length;
    return {
      id: t.id,
      label: t.label,
      count: hit.length,
      guarded: hit.length - unguarded,
      unguarded,
    };
  });
  return {
    total,
    byMonth: Object.fromEntries(Object.entries(byMonth).sort()),
    guard: {
      count: guarded,
      ratio: total ? Math.round((guarded / total) * 1000) / 1000 : 0,
    },
    recurring: {
      count: recurring.length,
      entries: recurring.map((e) => e.title),
    },
    themes: themeStats,
    candidates: themeStats
      .filter((s) => s.unguarded >= CANDIDATE_MIN)
      .sort((a, b) => b.unguarded - a.unguarded),
  };
}

function formatText(r) {
  return [
    `${LABEL} entries=${r.total} guard=${r.guard.count} (${(r.guard.ratio * 100).toFixed(1)}%) recurring=${r.recurring.count}`,
    `月別: ${Object.entries(r.byMonth)
      .map(([m, n]) => `${m}=${n}`)
      .join(", ")}`,
    "",
    "再発を明記したエントリ:",
    ...r.recurring.entries.map((x) => `  - ${x}`),
    "",
    "テーマ別（記録 / うちガード言及 / ガード未言及）:",
    ...r.themes.map(
      (x) => `  - ${x.label}: ${x.count} / ${x.guarded} / ${x.unguarded}`,
    ),
    "",
    `昇格候補（ガード未言及が ${CANDIDATE_MIN} 件以上）:`,
    ...(r.candidates.length
      ? r.candidates.map(
          (x) => `  - ${x.label}: 未言及 ${x.unguarded} 件（全 ${x.count} 件）`,
        )
      : ["  （なし）"]),
  ];
}

function parseArgs(argv) {
  const a = { json: false, file: DEFAULT_PATH };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--json") a.json = true;
    else if (x === "--file") a.file = argv[++i];
    else throw new Error(`unknown option ${x}`);
  }
  return a;
}

function main(argv) {
  const a = parseArgs(argv);
  const r = analyze(
    fs.readFileSync(path.resolve(process.cwd(), a.file), "utf8"),
  );
  if (a.json) console.log(JSON.stringify(r, null, 2));
  else for (const l of formatText(r)) console.log(l);
  return 0;
}

// ---- self-test ----

function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({
      name,
      ok: JSON.stringify(got) === JSON.stringify(want),
      got,
      want,
    });
  const fixture = [
    "# AGENT_LEARNINGS",
    "### 2020-01-01 インデックスより前の見出しは数えない",
    "## 📇 テーマ別インデックス",
    "- 並列セッション: 索引の行はエントリではない",
    "### 2026-09-01 並列セッションでブランチが変わった",
    "並列セッション。npm run check:pr-staleness で検知する。",
    "### 2026-09-02 並列セッションの再発",
    "並列セッションで再発した。",
    "### 2026-09-03 並列セッション 3 回目",
    "並列セッションで stash が消えた。",
    "### 2026-10-01 並列セッション 4 回目",
    "並列セッション。gh auth が kominem に戻った。",
    "#### 2026-10-02 深い見出しは区切りにしない",
    "### 日付の無い見出しも区切りにしない",
  ].join("\n");
  const r = analyze(fixture);

  eq("📇 以降の ### YYYY-MM-DD だけを区切る", r.total, 4);
  eq("月別件数", r.byMonth, { "2026-09": 3, "2026-10": 1 });
  eq("ガード言及数と割合", r.guard, { count: 1, ratio: 0.25 });
  eq("再発明記", r.recurring.entries, ["2026-09-02 並列セッションの再発"]);
  const ps = r.themes.find((x) => x.id === "parallel-session");
  eq(
    "テーマ件数（ガード言及 / 未言及）",
    [ps.count, ps.guarded, ps.unguarded],
    [4, 1, 3],
  );
  eq(
    "未言及 3 件以上のテーマだけが昇格候補",
    r.candidates.map((x) => x.id),
    ["parallel-session"],
  );
  eq(
    "gh アカウントは 1 件で候補外",
    r.themes.find((x) => x.id === "gh-account").count,
    1,
  );
  eq("エントリが無ければ割合 0", analyze("## 📇\nなし").guard, {
    count: 0,
    ratio: 0,
  });
  eq("引数を読む", parseArgs(["--json", "--file", "x.md"]), {
    json: true,
    file: "x.md",
  });
  let threw = false;
  try {
    parseArgs(["--nope"]);
  } catch {
    threw = true;
  }
  eq("未知のオプションは拒否", threw, true);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`${x.ok ? "PASS" : "FAIL"}: ${x.name}`);
  if (failed.length) {
    for (const x of failed)
      console.error(
        `  ${x.name}\n    got:  ${JSON.stringify(x.got)}\n    want: ${JSON.stringify(x.want)}`,
      );
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) selfTest();
  else {
    try {
      process.exit(main(process.argv.slice(2)));
    } catch (e) {
      console.error(`${LABEL} ${e.message}`);
      process.exit(1);
    }
  }
}
