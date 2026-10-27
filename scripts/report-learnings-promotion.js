#!/usr/bin/env node
// Report: AGENT_LEARNINGS.md の各エントリが機械ガード（check・hook・CI・settings）の語に触れているかを集計する。
//   ガード語への言及（文字列一致）を数えるだけで、昇格の確定ではない。
//
// ■ 背景
//   学びは AGENT_LEARNINGS.md に追記されるが、それが check や hook に落ちたかは追えていなかった。
//   docs/agent-growth-harness.md §3 の指標を、毎回同じ数え方で再現するための読み取り専用レポート。
//   正規表現による粗い計数なので、閾値判断ではなく推移の比較に使う。
//
// ■ 数え方（設計書 §3 と一致させる）
//   - 既定では `docs/agent-learnings/archive/*.md`（古いエントリの移設先）のエントリも本体の後ろにつないで数える。`--file` 指定時はそのファイルだけ
//   - `## 📇` 見出しより後ろを `\n### YYYY-MM-DD` で区切った各ブロックを 1 エントリとする
//   - ガード語への言及（文字列一致。昇格の確定ではない）/ 再発明記 / テーマは、下の表の正規表現がエントリ本文に 1 回でも当たれば数える
//   - 昇格候補: テーマに当たったエントリのうち、機械ガードに触れていないものが 3 件以上あるテーマ
//   - ガード後の再発候補: THEMES の guards（ガード PR のマージ日）より後に追加された同テーマのエントリ。
//     導入月から最終エントリの月までの月数以上あれば、設計書 §5 の C 条件に当たるとみなす
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
// 集計結果によらず exit 0。ファイルを読めないとき、または引数が不正なときだけ exit 1。ファイルは書かない。

const fs = require("fs");
const path = require("path");

const LABEL = "[report:learnings-promotion]";
const DEFAULT_PATH = "AGENT_LEARNINGS.md";
const ARCHIVE_DIR = path.join("docs", "agent-learnings", "archive");
const INDEX_MARKER = "## 📇";
const CANDIDATE_MIN = 3;

const GUARD_RE =
  /npm run (check|test):|scripts\/hooks|pre-commit|pre-push|PreToolUse|ci\.yml|check-[a-z-]+\.js/;
// 「同一セッションで N 回」のように再発語を使わない書き方は拾えない。
const RECUR_RE = /再発(?!行|防止)|二度目|同じ(ミス|失敗)|再び/;

// guards: テーマの失敗を検出・阻止するガードを入れた PR と、そのマージ日（JST）。
//   日付は `gh pr view <n> --json mergedAt` の値を JST に直したもの。推測で埋めず、該当 PR が無いテーマは空にする。
//   ガード導入日は guards の最も早い日付。
const THEMES = [
  {
    id: "parallel-session",
    label: "並列セッション",
    re: /並[列行]セッション/,
    guards: [{ pr: 625, date: "2026-09-07" }], // check-pr-file-conflict.js
  },
  {
    id: "gh-account",
    label: "gh アカウント",
    re: /gh auth (setup-git|switch)|active account|kominem/,
    guards: [
      { pr: 294, date: "2026-05-21" }, // check-gh-account.sh
      { pr: 317, date: "2026-05-27" }, // pre-push hook
      { pr: 446, date: "2026-07-03" }, // PreToolUse hook
      { pr: 689, date: "2026-09-24" }, // hook を操作先 owner で絞る
    ],
  },
  { id: "formatter-churn", label: "formatter churn", re: /formatter/i, guards: [] },
  { id: "worktree", label: "worktree", re: /worktree/, guards: [] },
  { id: "stash", label: "stash", re: /stash/, guards: [] },
  {
    id: "stale-pr",
    label: "stale PR",
    re: /stale PR|pr-staleness/i,
    guards: [{ pr: 448, date: "2026-07-03" }], // check:pr-staleness
  },
  {
    id: "note-wxr",
    label: "note WXR",
    re: /WXR/,
    guards: [
      { pr: 672, date: "2026-09-23" }, // verify_wxr.py --structure-only
      { pr: 673, date: "2026-09-23" }, // note 公式のインポート条件
    ],
  },
  {
    id: "zenn-release",
    label: "Zenn 公開・rate-limit",
    // rate-limit は Zenn と同じエントリに出たときだけ数える（記事 slug の rate-limit を除く）
    test: (t) =>
      /release\/zenn/.test(t) ||
      (/Zenn/.test(t) && /rate-limit|rate limit/.test(t)),
    guards: [
      { pr: 207, date: "2026-05-07" }, // check-zenn-publish-pace.js
      { pr: 391, date: "2026-06-07" }, // release/zenn 宛 PR の CI ゲート
    ],
  },
  {
    id: "qiita-publish",
    label: "Qiita 公開",
    re: /publish:qiita|qiita-cli|\.remote/,
    guards: [
      { pr: 269, date: "2026-05-18" }, // check-qiita-publish-hygiene.js
      { pr: 323, date: "2026-05-28" }, // check-qiita-drift.js
      { pr: 366, date: "2026-06-03" }, // check-qiita-remote-cache.js / pre-commit の .remote 混入
    ],
  },
  {
    id: "claude-mem",
    label: "claude-mem 混入",
    re: /claude-mem/,
    guards: [{ pr: 366, date: "2026-06-03" }], // pre-commit の <claude-mem-context> 混入
  },
];

// ---- 純関数（self-test 対象） ----

function splitEntries(text) {
  const idx = text.indexOf(INDEX_MARKER);
  const body = idx >= 0 ? text.slice(idx + INDEX_MARKER.length) : text;
  return body
    .split(/\n### (?=\d{4}-\d\d-\d\d)/)
    .slice(1)
    .map((e) => ({
      date: e.slice(0, 10),
      month: e.slice(0, 7),
      title: e.split("\n", 1)[0].trim(),
      text: e,
    }));
}

// "YYYY-MM" から "YYYY-MM" までの月数（両端を含む）
function monthSpan(from, to) {
  const n = (m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7));
  return n(to) - n(from) + 1;
}

// ガード導入日より後（同日は含めない）の同テーマエントリを再発候補とする。
// 導入月から集計対象の最終月までの月数以上あれば、設計書 §5 の C 条件（導入後も月 1 件以上）に当たる。
function recurrenceOf(hit, guards, lastMonth) {
  if (!guards || !guards.length) return null;
  const since = guards.map((g) => g.date).sort()[0];
  const after = hit
    .filter((e) => e.date > since)
    .sort((a, b) => a.date.localeCompare(b.date));
  const months = lastMonth ? Math.max(monthSpan(since.slice(0, 7), lastMonth), 1) : 1;
  return {
    since,
    count: after.length,
    months,
    meetsC: after.length >= months,
    entries: after.map((e) => ({ date: e.date, title: e.title })),
  };
}

function analyze(text, themes = THEMES) {
  const entries = splitEntries(text);
  const total = entries.length;
  const byMonth = {};
  for (const e of entries) byMonth[e.month] = (byMonth[e.month] || 0) + 1;
  const months = Object.keys(byMonth).sort();
  const lastMonth = months[months.length - 1];
  const isGuarded = (e) => GUARD_RE.test(e.text);
  const guarded = entries.filter(isGuarded).length;
  const recurring = entries.filter((e) => RECUR_RE.test(e.text));
  const themeStats = themes.map((t) => {
    const hit = entries.filter((e) =>
      t.test ? t.test(e.text) : t.re.test(e.text),
    );
    const unguarded = hit.filter((e) => !isGuarded(e)).length;
    const themeByMonth = {};
    for (const e of hit) themeByMonth[e.month] = (themeByMonth[e.month] || 0) + 1;
    return {
      id: t.id,
      label: t.label,
      count: hit.length,
      guarded: hit.length - unguarded,
      unguarded,
      entries: hit.map((e) => ({
        date: e.date,
        title: e.title,
        guarded: isGuarded(e),
      })),
      byMonth: Object.fromEntries(Object.entries(themeByMonth).sort()),
      guardPrs: (t.guards || []).map((g) => ({ pr: g.pr, date: g.date })),
      recurrence: recurrenceOf(hit, t.guards, lastMonth),
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
    months,
    cConditionThemes: themeStats
      .filter((s) => s.recurrence && s.recurrence.meetsC)
      .map((s) => s.id),
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
      ? r.candidates.flatMap((x) => [
          `  - ${x.label}: 未言及 ${x.unguarded} 件（全 ${x.count} 件）`,
          ...x.entries
            .filter((e) => !e.guarded)
            .map((e) => `      - ${e.title}`),
        ])
      : ["  （なし）"]),
    "",
    `テーマ×月の記録数（${r.months.join(" / ")}）:`,
    ...r.themes.map(
      (x) =>
        `  - ${x.label}: ${r.months.map((m) => x.byMonth[m] || 0).join(" / ")}`,
    ),
    "",
    "ガード導入後の再発候補（導入日より後に追加された同テーマのエントリ）:",
    ...r.themes.flatMap((x) =>
      x.recurrence
        ? [
            `  - ${x.label}: ${x.recurrence.count} 件 / 導入後 ${x.recurrence.months} か月（導入 ${x.recurrence.since}、${x.guardPrs.map((g) => `#${g.pr}`).join(" ")}）${x.recurrence.meetsC ? " ← C 条件" : ""}`,
            ...x.recurrence.entries.map((e) => `      - ${e.title}`),
          ]
        : [`  - ${x.label}: ガード導入日なし`],
    ),
    "",
    `C 条件（導入後も月 1 件以上）に当たるテーマ: ${
      r.cConditionThemes.length
        ? r.themes
            .filter((x) => r.cConditionThemes.includes(x.id))
            .map((x) => `${x.label}（${x.recurrence.count} 件 / ${x.recurrence.months} か月）`)
            .join("、")
        : "なし"
    }`,
    "",
    "注意: 本文の文字列で判定しているため、昇格候補は実態より多めに出る。",
  ];
}

// アーカイブ本文の先頭（最初の日付見出し）から後ろを本体の後ろへつなぐ。
// アーカイブの冒頭説明が本体の最終エントリに混ざって数えられないようにする。
function joinArchives(text, archives) {
  let out = text;
  for (const a of archives) {
    const at = a.search(/^### \d{4}-\d\d-\d\d/m);
    if (at >= 0) out += "\n" + a.slice(at);
  }
  return out;
}

function readArchives(root) {
  const dir = path.join(root, ARCHIVE_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"));
}

function parseArgs(argv) {
  const a = { json: false, file: DEFAULT_PATH, archives: true };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--json") a.json = true;
    else if (x === "--file") {
      const v = argv[++i];
      if (!v || v.startsWith("--"))
        throw new Error(
          "--file にはファイルパスを指定してください（例: --file AGENT_LEARNINGS.md）",
        );
      a.file = v;
      a.archives = false;
    } else throw new Error(`unknown option ${x}`);
  }
  return a;
}

function main(argv) {
  const a = parseArgs(argv);
  const text = fs.readFileSync(path.resolve(process.cwd(), a.file), "utf8");
  const r = analyze(
    a.archives ? joinArchives(text, readArchives(process.cwd())) : text,
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
    "### 2026-10-03 Dependabot API が 403",
    "古いトークンなので gh auth refresh を試す。同型の別事象。",
    "### 2026-10-04 note エクスポートの画像 M は churn",
    "差分は churn にすぎない。",
    "#### 2026-10-02 深い見出しは区切りにしない",
    "### 日付の無い見出しも区切りにしない",
  ].join("\n");
  const r = analyze(fixture);

  eq("📇 以降の ### YYYY-MM-DD だけを区切る", r.total, 6);
  eq("月別件数", r.byMonth, { "2026-09": 3, "2026-10": 3 });
  eq("ガード言及数と割合", r.guard, { count: 1, ratio: 0.167 });
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
  eq("引数を読む（--file 指定時はアーカイブを足さない）", parseArgs(["--json", "--file", "x.md"]), {
    json: true,
    file: "x.md",
    archives: false,
  });
  eq("既定ではアーカイブも数える", parseArgs([]).archives, true);
  const joined = analyze(
    joinArchives("## 📇\n### 2026-09-01 本体\nx", [
      "# アーカイブ\nnpm run check:x\n### 2026-04-01 移した\ny",
    ]),
  );
  eq(
    "アーカイブの冒頭説明は数えず、エントリだけを本体につなぐ",
    [joined.total, joined.guard.count],
    [2, 0],
  );
  let threw = false;
  try {
    parseArgs(["--nope"]);
  } catch {
    threw = true;
  }
  eq("未知のオプションは拒否", threw, true);
  eq(
    "gh auth refresh（Dependabot トークン）は gh アカウントに数えない",
    r.themes.find((x) => x.id === "gh-account").count,
    1,
  );
  eq(
    "formatter の無い churn は formatter churn に数えない",
    r.themes.find((x) => x.id === "formatter-churn").count,
    0,
  );
  const extra = analyze(
    [
      "## 📇",
      "### 2026-10-05 トークンの再発行",
      "トークンを再発行した。再発防止に手順を書いた。",
      "### 2026-10-06 Stale PR は 3 点 diff で見る",
      "並行セッションが先にマージしていた。",
      "### 2026-10-07 レビューのフォールバック",
      "記事 ai-review-rate-limit-fallback の話。",
      "### 2026-10-08 Zenn の rate-limit",
      "Zenn はアカウント単位の rate-limit。",
    ].join("\n"),
  );
  const count = (id) => extra.themes.find((x) => x.id === id).count;
  eq("「再発行」「再発防止」は再発に数えない", extra.recurring.count, 0);
  eq("大文字の Stale PR も stale PR に数える", count("stale-pr"), 1);
  eq(
    "「並行セッション」も並列セッションに数える",
    count("parallel-session"),
    1,
  );
  eq(
    "Zenn の無い rate-limit（記事 slug）は Zenn テーマに数えない",
    count("zenn-release"),
    1,
  );
  eq(
    "テーマごとにエントリの日付・見出し・ガード言及を持つ",
    extra.themes.find((x) => x.id === "zenn-release").entries,
    [
      {
        date: "2026-10-08",
        title: "2026-10-08 Zenn の rate-limit",
        guarded: false,
      },
    ],
  );
  const rec = analyze(
    [
      "## 📇",
      "### 2026-08-31 alpha 導入前",
      "alpha",
      "### 2026-09-01 alpha 導入当日",
      "alpha",
      "### 2026-09-02 alpha 導入翌日",
      "alpha",
      "### 2026-10-05 alpha 翌月",
      "alpha",
      "### 2026-10-06 beta",
      "beta",
      "### 2026-11-01 gamma",
      "gamma",
    ].join("\n"),
    [
      { id: "alpha", label: "alpha", re: /alpha/, guards: [{ pr: 2, date: "2026-09-10" }, { pr: 1, date: "2026-09-01" }] },
      { id: "beta", label: "beta", re: /beta/, guards: [{ pr: 3, date: "2026-10-01" }] },
      { id: "gamma", label: "gamma", re: /gamma/, guards: [] },
    ],
  );
  const theme = (id) => rec.themes.find((x) => x.id === id);
  eq("集計対象の月一覧", rec.months, ["2026-08", "2026-09", "2026-10", "2026-11"]);
  eq("テーマ×月の記録数", theme("alpha").byMonth, { "2026-08": 1, "2026-09": 2, "2026-10": 1 });
  eq(
    "導入日は guards の最も早い日付。同日は再発候補に含めず翌日から数える",
    theme("alpha").recurrence.entries.map((e) => e.date),
    ["2026-09-02", "2026-10-05"],
  );
  eq(
    "導入月から最終月までの月数と C 条件（2 件 / 3 か月は非該当）",
    [theme("alpha").recurrence.months, theme("alpha").recurrence.meetsC],
    [3, false],
  );
  eq(
    "beta は 1 件 / 2 か月で非該当",
    [theme("beta").recurrence.count, theme("beta").recurrence.months, theme("beta").recurrence.meetsC],
    [1, 2, false],
  );
  eq("導入日なしテーマは recurrence が null", theme("gamma").recurrence, null);
  eq("導入日なしテーマの guardPrs は空", theme("gamma").guardPrs, []);
  const recC = analyze(
    ["## 📇", "### 2026-09-01 x", "alpha", "### 2026-09-02 y", "alpha", "### 2026-10-01 z", "alpha"].join("\n"),
    [{ id: "alpha", label: "alpha", re: /alpha/, guards: [{ pr: 1, date: "2026-09-01" }] }],
  );
  eq("2 件 / 2 か月は C 条件に当たる", recC.cConditionThemes, ["alpha"]);
  eq(
    "C 条件は既存の数え方を変えない",
    [recC.total, recC.themes[0].count, recC.themes[0].unguarded],
    [3, 3, 3],
  );
  eq(
    "THEMES のガード日付は YYYY-MM-DD",
    THEMES.every((x) => x.guards.every((g) => /^\d{4}-\d\d-\d\d$/.test(g.date))),
    true,
  );
  let msg = "";
  try {
    parseArgs(["--file"]);
  } catch (e) {
    msg = e.message;
  }
  eq("--file の値なしは日本語エラー", /ファイルパスを指定/.test(msg), true);

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
