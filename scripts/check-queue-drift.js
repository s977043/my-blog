#!/usr/bin/env node
// Check: `docs/publish-queue.md` の Queue（Done 未反映）と記事の公開状態の乖離を検出する。
//
// ■ 背景（なぜ必要か）
//   Queue の行が `ready-to-publish` 等の「未公開扱い」の state のまま残っているのに、
//   参照先の `articles/<slug>.md` が実際には `published: true` に切り替わっている（＝ Zenn
//   公開フローで release/zenn へ既にマージ済み）ケースがある。この乖離に気づかず作業すると、
//   次のセッションが二重公開の準備に進んで時間を浪費する（`AGENT_LEARNINGS.md`
//   2026-05-27 エントリで実害が記録済み。当時は Qiita 側だったが同型の事故は Zenn 側でも起こりうる）。
//
// ■ 検出対象・仕様
//   - `docs/publish-queue.md` の各行を走査し、先頭が `` - `[<state>]` `` の行だけを対象にする
//     （Done セクションの行は `- 2026-08-31 zenn ...` のように `[state]` 接頭辞を持たないため
//     自然に対象外になる）
//   - state が `ready-to-publish` / `ready` / `drafting` / `in-review` の行のみ判定する
//   - 行中から `` `articles/<slug>.md` `` 形式のパス参照を抽出する。**`articles_note/...`（note）は
//     対象外**（"articles/" の直後が "_" ではなく "/" である参照のみを拾うため、正規表現上
//     `articles_note/` は自然にマッチしない）
//   - 同一行に異なる slug が複数マッチした場合は「どれが対象か特定できない」として **スキップ**
//     （誤検知ゼロを優先。推測しない）
//   - slug が取れない行、`articles/<slug>.md` が実在しない行も **スキップ**
//   - 対象の `articles/<slug>.md` が `published: true` なら **FAIL**
//
// ■ 誤検知ゼロを最優先する理由
//   判定できない行を無理に判定すると、実際には正しい queue 行を FAIL 扱いしてしまい、
//   ガード自体への信頼を失う（`AGENT_LEARNINGS.md` 2026-07-03 エントリ「check スクリプト新設時は
//   fixture ベースの self-test を同梱する」が指摘する事故パターン）。判定不能な行は件数のみ表示し、
//   個別には報告しない。
//
// ■ 使い方
//   npm run check:queue-drift    # 実データ
//   npm run test:queue-drift     # self-test

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const QUEUE_PATH = "docs/publish-queue.md";
const LABEL = "[check:queue-drift]";

const TARGET_STATES = new Set([
  "ready-to-publish",
  "ready",
  "drafting",
  "in-review",
]);

// ---- 純関数（self-test 対象） ----

// Queue 行1行から state / PR番号 / articles/<slug>.md の slug を抽出する。
// 対象行でなければ null。slug は一意に特定できないときは null（呼び出し側でスキップ判定）。
function parseQueueLine(line) {
  const stateMatch = String(line).match(/^-\s*`\[([a-z-]+)\]`/);
  if (!stateMatch) return null;
  const state = stateMatch[1];

  const prMatch = line.match(/\*\*#(\d+)/);
  const prNum = prMatch ? prMatch[1] : null;

  // "articles/<slug>.md" のみを拾う（"articles_note/..." は "articles" の直後が "_" のため非マッチ）
  const slugMatches = [
    ...line.matchAll(/(?:^|[^_\w])articles\/([\w-]+)\.md/g),
  ].map((m) => m[1]);
  const uniqueSlugs = [...new Set(slugMatches)];
  const slug = uniqueSlugs.length === 1 ? uniqueSlugs[0] : null;

  return { state, prNum, slug, ambiguous: uniqueSlugs.length > 1 };
}

// front matter の published: true を判定する（check-publish-readiness.js と同一仕様）。
function isPublishedTrue(md) {
  const fm = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^published:\s*true\s*$/m.test(fm[1]);
}

// Queue 本文を評価する。exists/readFile を注入することで実ファイルシステムに依存せず
// self-test できるようにする。
// deps: { exists(relPath): boolean, readFile(relPath): string }
// returns: { checked: [...], skipped: [...], failures: [...] }
function evaluateQueue(queueContent, deps) {
  const lines = String(queueContent).split(/\r?\n/);
  const checked = [];
  const skipped = [];
  const failures = [];

  lines.forEach((line, idx) => {
    const parsed = parseQueueLine(line);
    if (!parsed) return;
    if (!TARGET_STATES.has(parsed.state)) return;

    const lineNo = idx + 1;

    if (!parsed.slug) {
      skipped.push({
        line: lineNo,
        reason: parsed.ambiguous
          ? "slug が複数マッチし特定不能"
          : "articles/<slug>.md の参照なし",
      });
      return;
    }

    const relPath = `articles/${parsed.slug}.md`;
    if (!deps.exists(relPath)) {
      skipped.push({ line: lineNo, reason: `${relPath} が存在しない` });
      return;
    }

    const body = deps.readFile(relPath);
    const entry = {
      line: lineNo,
      state: parsed.state,
      prNum: parsed.prNum,
      slug: parsed.slug,
    };

    if (isPublishedTrue(body)) {
      failures.push(entry);
    } else {
      checked.push(entry);
    }
  });

  return { checked, skipped, failures };
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

  // 1) parseQueueLine
  eq(
    "state と PR 番号と slug を抽出する",
    parseQueueLine(
      "- `[ready-to-publish]` **#15 (zenn) 締切 2026-08-31 以降**: 「タイトル」（`articles/foo-bar.md`、`published: false`）",
    ),
    {
      state: "ready-to-publish",
      prNum: "15",
      slug: "foo-bar",
      ambiguous: false,
    },
  );
  eq(
    "state prefix が無い行は null",
    parseQueueLine("  実測（2026-08-28 ...）: `https://zenn.dev/...`"),
    null,
  );
  eq(
    "articles_note/ 参照は slug 非抽出（note 行）",
    parseQueueLine(
      "- `[ready-to-publish]` **#12 (note) 締切 2026-09-03**: 「タイトル」（`articles_note/new/foo.md`）",
    ).slug,
    null,
  );
  eq(
    "異なる slug が複数あれば slug=null（ambiguous=true）",
    parseQueueLine(
      "- `[ready]` **#1 (zenn)**: `articles/a.md` と `articles/b.md` を両方参照",
    ),
    { state: "ready", prNum: "1", slug: null, ambiguous: true },
  );
  eq(
    "同一 slug への複数参照は一意として扱う",
    parseQueueLine(
      "- `[in-review]` **#2 (zenn)**: `articles/x.md` レビューは `reviews/zenn/x.md` ではなく本文 `articles/x.md` を見る",
    ).slug,
    "x",
  );

  // 2) isPublishedTrue
  eq(
    "published: true を検出する",
    isPublishedTrue("---\ntitle: t\npublished: true\n---\n本文"),
    true,
  );
  eq(
    "published: false は検出しない",
    isPublishedTrue("---\ntitle: t\npublished: false\n---\n本文"),
    false,
  );
  eq(
    "frontmatter が無ければ false",
    isPublishedTrue("published: true\n本文"),
    false,
  );

  // 3) evaluateQueue（fixture: 仮想ファイルシステム）
  const virtualFiles = {
    "articles/already-published.md":
      "---\ntitle: t\npublished: true\n---\n本文",
    "articles/still-draft.md": "---\ntitle: t\npublished: false\n---\n本文",
  };
  const deps = {
    exists: (p) => Object.prototype.hasOwnProperty.call(virtualFiles, p),
    readFile: (p) => virtualFiles[p],
  };

  const queueFixture = [
    "## Queue（締切順）",
    "",
    // 1: ready-to-publish だが既に published:true → FAIL
    "- `[ready-to-publish]` **#20 (zenn) 締切 2026-09-10**: 「乖離記事」（`articles/already-published.md`）",
    // 2: ready-to-publish で published:false → checked（OK）
    "- `[ready-to-publish]` **#21 (zenn) 締切 2026-09-11**: 「下書き記事」（`articles/still-draft.md`）",
    // 3: in-review で published:true → FAIL
    "- `[in-review]` **#22 (zenn) 締切 2026-09-12**: 「レビュー中だが公開済み」（`articles/already-published.md`）",
    // 4: backlog は対象 state 外 → 完全に無視（checked/skipped どちらにも入らない）
    "- `[backlog]` **(zenn) 締切 未設定**: 「起票のみ」（`articles/already-published.md`）",
    // 5: note 行 → slug 非抽出 → skip
    "- `[ready-to-publish]` **#12 (note) 締切 2026-09-03**: 「note記事」（`articles_note/new/foo.md`）",
    // 6: 実在しない記事 → skip
    "- `[ready]` **#23 (zenn)**: 「未作成記事」（`articles/does-not-exist.md`）",
    // 7: done セクションの行（[state] 接頭辞なし）→ そもそもマッチしない
    "",
    "## Done",
    "",
    "- 2026-08-31 zenn foo https://zenn.dev/minewo/articles/foo",
  ].join("\n");

  const result = evaluateQueue(queueFixture, deps);

  eq("FAIL 件数（乖離2件）", result.failures.length, 2);
  eq(
    "FAIL の slug 一覧",
    result.failures.map((f) => f.slug).sort(),
    ["already-published", "already-published"].sort(),
  );
  eq("checked 件数（正常1件）", result.checked.length, 1);
  eq("checked の slug", result.checked[0].slug, "still-draft");
  eq(
    "skipped 件数（note 1件 + 実在しない 1件 = 2件。backlog は対象 state 外で不算入）",
    result.skipped.length,
    2,
  );

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? "ok  " : "FAIL"} ${x.name}`);
  if (failed.length) {
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    for (const f of failed)
      console.error(
        `  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`,
      );
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

// ---- main ----

function main() {
  const queuePath = path.join(ROOT, QUEUE_PATH);
  if (!fs.existsSync(queuePath)) {
    console.log(`${LABEL} skip: ${QUEUE_PATH} が見つからない`);
    return 0;
  }

  const content = fs.readFileSync(queuePath, "utf8");
  const deps = {
    exists: (rel) => fs.existsSync(path.join(ROOT, rel)),
    readFile: (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"),
  };
  const { checked, skipped, failures } = evaluateQueue(content, deps);

  if (failures.length > 0) {
    console.error(
      `${LABEL} FAIL: queue と実態の乖離 ${failures.length} 件（checked=${checked.length}, skipped=${skipped.length}）`,
    );
    for (const f of failures) {
      console.error(
        `  ${QUEUE_PATH}:${f.line}  queue #${f.prNum || "?"} の ${f.slug} は published:true。Done へ移すこと`,
      );
    }
    return 1;
  }

  console.log(
    `${LABEL} OK: queue と実態の乖離なし（checked=${checked.length}, skipped=${skipped.length}）`,
  );
  return 0;
}

if (require.main !== module) {
  // ライブラリとして読み込まれたときは何も実行しない
} else if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  process.exit(main());
}

module.exports = { parseQueueLine, isPublishedTrue, evaluateQueue };
