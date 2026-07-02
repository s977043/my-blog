#!/usr/bin/env node
// Check: publish-readiness gate（P5）。
// release/zenn 宛 PR で「この PR で公開される / 本文更新される公開記事」について、
// /review-improve-loop（.claude/workflows/article-review-improve-loop.js）が
// reviews/zenn/<slug>.md の先頭に記録した機械可読判定コメント
//
//   <!-- publish-readiness: blocked=<bool> mustHigh=<n> verified=<bool> articleHash=<blob-sha> loops=<n> reviewedAt=<iso> -->
//
// を検証する。設計: docs/publish-readiness-gate-design.md
//
// ■ ルール（段階導入・WARN から開始）
//   - reviews/zenn/<slug>.md が無い / readiness コメントが無い → skip（旧 /review-article 資産・WF 未実行。段階導入）
//   - blocked=true  → WARN。STRICT=1 のときのみ FAIL(exit 1)（pace ゲート #391/#393 と同じ設計思想）
//   - blocked が true/false 以外（unknown 等） → WARN（判定不能。非ブロッキング）
//   - articleHash != 現記事の blob hash（git hash-object） → stale WARN（レビュー後に記事が変更されている。非ブロッキング）
//
// ■ 設計書からの乖離（重要）
//   設計書は `reviewedSha=<記事のその時点の commit>` を記録し「記事の最新 commit == reviewedSha」で
//   鮮度を判定する案だったが、WF は working tree 上で記事を改善した直後に review を書くため、
//   記事とレビューを同一 commit に入れると reviewedSha は常に 1 commit 古くなり**全記事が stale 誤検知**になる。
//   本実装は commit sha ではなく記事内容の blob hash（`git hash-object articles/<slug>.md`）を
//   記録・比較する。内容が不変なら commit を跨いでも stale にならず、「レビュー後に本文が変わったか」を直接検知できる。
//
// ■ 使い方
//   - CI（release/zenn 宛 PR）: BASE_REF=origin/release/zenn npm run check:publish-readiness
//   - ローカル（slug 指定）:    npm run check:publish-readiness -- <slug> [<slug>...]
//   - self-test（fixture）:     npm run test:publish-readiness

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REVIEWS_DIR = "reviews/zenn";

// ---- 純関数（self-test 対象） ----

// reviews md から publish-readiness コメントの key=value 群を抽出する。無ければ null。
function parseReadiness(content) {
  const m = String(content).match(/<!--\s*publish-readiness:([\s\S]*?)-->/);
  if (!m) return null;
  const fields = {};
  for (const token of m[1].trim().split(/\s+/)) {
    const eq = token.indexOf("=");
    if (eq > 0) fields[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return fields;
}

// front matter の published: true を判定する。
function isPublishedTrue(md) {
  const fm = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^published:\s*true\s*$/m.test(fm[1]);
}

// 1 記事の判定。
// target: { slug, articleHash, hasReviewFile, readiness }
// returns: { slug, status: 'ok'|'blocked'|'unknown'|'stale'|'skip-no-review'|'skip-no-record', msg }
function evaluateTarget(target) {
  const { slug, articleHash, hasReviewFile, readiness } = target;
  if (!hasReviewFile) {
    return {
      slug,
      status: "skip-no-review",
      msg: `${REVIEWS_DIR}/${slug}.md が無い（レビュー未実施）。skip（段階導入）`,
    };
  }
  if (!readiness) {
    return {
      slug,
      status: "skip-no-record",
      msg: "readiness コメント無し（旧 /review-article 資産 or WF 未実行）。skip（段階導入）",
    };
  }
  if (readiness.blocked === "true") {
    return {
      slug,
      status: "blocked",
      msg: `最終レビューで must（公開ブロッカー）が未解決（mustHigh=${readiness.mustHigh || "?"}, reviewedAt=${readiness.reviewedAt || "?"}）。/review-improve-loop で解消してから公開する`,
    };
  }
  if (readiness.blocked !== "false") {
    return {
      slug,
      status: "unknown",
      msg: `blocked=${readiness.blocked || "(空)"} で判定不能（最終レビュー欠落の可能性）。再レビュー推奨`,
    };
  }
  if (
    readiness.articleHash &&
    articleHash &&
    readiness.articleHash !== articleHash
  ) {
    return {
      slug,
      status: "stale",
      msg: `レビュー後に記事本文が変更されている（articleHash 不一致: recorded=${readiness.articleHash.slice(0, 8)} current=${articleHash.slice(0, 8)}）。再レビュー推奨`,
    };
  }
  return {
    slug,
    status: "ok",
    msg: `blocked=false（mustHigh=${readiness.mustHigh ?? "?"}, verified=${readiness.verified ?? "?"}, reviewedAt=${readiness.reviewedAt || "?"}）`,
  };
}

// ---- git まわり（実行時のみ） ----

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

// diff モード: BASE...HEAD で変更された articles/*.md のうち、現在 published: true のものを対象にする
// （published:false→true フリップも、公開済み記事の本文更新も、公開に影響する変更として拾う）。
function findTargetFilesFromDiff(baseRef) {
  const files = sh(`git diff ${baseRef}...HEAD --name-only -- 'articles/*.md'`)
    .split("\n")
    .filter(Boolean);
  return files.filter(
    (f) => fs.existsSync(f) && isPublishedTrue(fs.readFileSync(f, "utf8")),
  );
}

function buildTarget(file) {
  const slug = path.basename(file, ".md");
  const articleHash = sh(`git hash-object '${file}'`).trim();
  const reviewPath = path.join(REVIEWS_DIR, `${slug}.md`);
  const hasReviewFile = fs.existsSync(reviewPath);
  const readiness = hasReviewFile
    ? parseReadiness(fs.readFileSync(reviewPath, "utf8"))
    : null;
  return { slug, articleHash, hasReviewFile, readiness };
}

// ---- self-test（fixture ベース） ----

function selfTest() {
  const dir = path.join(__dirname, "fixtures", "publish-readiness");
  const read = (name) => fs.readFileSync(path.join(dir, name), "utf8");
  let failed = 0;
  const assertEq = (label, actual, expected) => {
    if (actual === expected) {
      console.log(`  ok   ${label}`);
    } else {
      failed++;
      console.error(
        `  FAIL ${label}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
      );
    }
  };

  console.log("[check:publish-readiness --self-test] fixtures:", dir);

  // 1) front matter 判定
  assertEq(
    "published:true 記事を対象にする",
    isPublishedTrue(read("article-published.md")),
    true,
  );
  assertEq(
    "published:false 記事を対象外にする",
    isPublishedTrue(read("article-draft.md")),
    false,
  );

  // 2) readiness コメントのパース
  const clean = parseReadiness(read("review-clean.md"));
  assertEq("clean: コメントを検出", !!clean, true);
  assertEq("clean: blocked=false", clean && clean.blocked, "false");
  assertEq(
    "clean: articleHash",
    clean && clean.articleHash,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  assertEq(
    "no-record: コメント無しで null",
    parseReadiness(read("review-no-record.md")),
    null,
  );

  // 3) clean（blocked=false, hash 一致）→ ok
  assertEq(
    "case clean → ok",
    evaluateTarget({
      slug: "clean",
      articleHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      hasReviewFile: true,
      readiness: clean,
    }).status,
    "ok",
  );

  // 4) blocked（must 未解決）→ blocked
  const blocked = parseReadiness(read("review-blocked.md"));
  assertEq(
    "case blocked → blocked",
    evaluateTarget({
      slug: "blocked",
      articleHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      hasReviewFile: true,
      readiness: blocked,
    }).status,
    "blocked",
  );

  // 5) stale（レビュー後に本文変更）→ stale
  const stale = parseReadiness(read("review-stale.md"));
  assertEq(
    "case stale → stale",
    evaluateTarget({
      slug: "stale",
      articleHash: "ffffffffffffffffffffffffffffffffffffffff",
      hasReviewFile: true,
      readiness: stale,
    }).status,
    "stale",
  );

  // 6) readiness コメント無し → skip-no-record
  assertEq(
    "case no-record → skip-no-record",
    evaluateTarget({
      slug: "no-record",
      articleHash: "cccccccccccccccccccccccccccccccccccccccc",
      hasReviewFile: true,
      readiness: null,
    }).status,
    "skip-no-record",
  );

  // 7) reviews ファイル自体が無い → skip-no-review
  assertEq(
    "case no-review-file → skip-no-review",
    evaluateTarget({
      slug: "no-review",
      articleHash: "dddddddddddddddddddddddddddddddddddddddd",
      hasReviewFile: false,
      readiness: null,
    }).status,
    "skip-no-review",
  );

  // 8) blocked=unknown（最終レビュー欠落）→ unknown
  const unknown = parseReadiness(read("review-unknown.md"));
  assertEq(
    "case unknown → unknown",
    evaluateTarget({
      slug: "unknown",
      articleHash: "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      hasReviewFile: true,
      readiness: unknown,
    }).status,
    "unknown",
  );

  if (failed) {
    console.error(`[check:publish-readiness --self-test] FAIL: ${failed} 件`);
    process.exit(1);
  }
  console.log("[check:publish-readiness --self-test] PASS: 全ケース成功");
}

// ---- main ----

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const STRICT = process.env.STRICT === "1";
  const BASE_REF = process.env.BASE_REF;
  const slugs = argv.filter((a) => !a.startsWith("-"));

  let files;
  try {
    if (slugs.length > 0) {
      files = slugs.map(
        (s) =>
          `articles/${s.replace(/^articles\//, "").replace(/\.md$/, "")}.md`,
      );
      const missing = files.filter((f) => !fs.existsSync(f));
      if (missing.length) {
        console.error(
          `[check:publish-readiness] 記事が見つからない: ${missing.join(", ")}`,
        );
        process.exit(1);
      }
    } else if (BASE_REF) {
      files = findTargetFilesFromDiff(BASE_REF);
    } else {
      console.log(
        "[check:publish-readiness] skip: BASE_REF か slug 指定が必要",
      );
      console.log(
        "  CI: BASE_REF=origin/release/zenn npm run check:publish-readiness",
      );
      console.log("  ローカル: npm run check:publish-readiness -- <slug>");
      return;
    }
  } catch (e) {
    // base 解決失敗（shallow / base 未 fetch）等は誤検知を避けて skip（pace ゲートと同じ方針）。
    console.warn(
      `[check:publish-readiness] skip: 対象特定に失敗（${e.message.split("\n")[0]}）`,
    );
    console.warn(
      "  CI では fetch-depth: 0 と base ブランチの fetch を確認すること。",
    );
    return;
  }

  if (files.length === 0) {
    console.log(
      "[check:publish-readiness] OK: 公開対象（published: true の変更記事）なし",
    );
    return;
  }

  const results = files.map((f) => evaluateTarget(buildTarget(f)));
  let blockedCount = 0;
  for (const r of results) {
    const mark =
      r.status === "ok"
        ? "OK  "
        : r.status.startsWith("skip")
          ? "SKIP"
          : "WARN";
    console.log(`[check:publish-readiness] ${mark} ${r.slug}: ${r.msg}`);
    if (r.status === "blocked") blockedCount++;
  }
  if (BASE_REF)
    console.log(`  (mode=diff, base=${BASE_REF}, strict=${STRICT ? 1 : 0})`);

  if (blockedCount > 0) {
    console.error("");
    console.error(
      `[check:publish-readiness] ${STRICT ? "FAIL" : "WARN(FAIL相当)"}: 公開ブロッカー（must）未解決の記事が ${blockedCount} 件`,
    );
    console.error(
      "  対処: /review-improve-loop <slug> で must を解消 → reviews/zenn/<slug>.md の判定更新後に公開する",
    );
    console.error("  設計: docs/publish-readiness-gate-design.md");
    if (STRICT) process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { parseReadiness, isPublishedTrue, evaluateTarget };
