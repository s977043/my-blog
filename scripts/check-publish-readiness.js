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
//   - articleHash != 現記事の blob hash（git hash-object） → 後述の「正規化比較」で本文差分の有無を確かめ、
//     本文が変わっている場合のみ stale WARN（レビュー後に記事が変更されている。非ブロッキング）
//
// ■ published フリップのノイズ除去（本ファイルの本題）
//   記録される articleHash は front matter を含む blob 全体の hash なので、公開時の
//   `published: false → true` の 1 行だけで必ず不一致になる。本文が 1 文字も変わっていない
//   公開フリップ PR でも構造的に stale WARN が出て、本物の本文ドリフトが埋もれていた。
//   そこで比較を「front matter の `published:` 行を除いた内容」の hash で行う。
//   記録側（`.claude/workflows/article-review-improve-loop.js` が subagent に
//   `git hash-object <記事>` を実行させて埋める）は blob hash のまま変更していないため、
//   記録された blob sha を `git cat-file -p` で復元し、その内容を同じ正規化に通してから比較する。
//   復元できない sha（object DB に無い＝削除済みブランチ系統など）は判定不能として WARN に落とす。
//   `published:` 以外の front matter（title / topics / emoji / type）の変更は従来どおり stale として検出される。
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

const { execFileSync } = require("child_process");
const crypto = require("crypto");
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

// front matter から `published:` の行だけを取り除く。front matter が無ければそのまま返す。
// 除去対象は front matter 内の 1 行目のみ（本文中の "published:" は触らない）。
function stripPublishedField(md) {
  const s = String(md);
  const m = s.match(/^---\r?\n([\s\S]*?\r?\n)---/);
  if (!m) return s;
  const fm = m[1].replace(/^published:[^\n]*\n/m, "");
  return "---\n" + fm + "---" + s.slice(m[0].length);
}

// 「published 行を除いた記事内容」の hash。記録側の blob sha とは別系統の値なので、
// 復元した旧 blob の内容も必ずこの関数に通してから比較する。
function normalizedArticleHash(md) {
  return crypto
    .createHash("sha256")
    .update(stripPublishedField(md), "utf8")
    .digest("hex");
}

// front matter の published: true を判定する。
function isPublishedTrue(md) {
  const fm = String(md).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^published:\s*true\s*$/m.test(fm[1]);
}

// 1 記事の判定。
// target: {
//   slug, articleHash, hasReviewFile, readiness,
//   normalizedHash?,                      // 現記事の「published 行を除いた内容」の hash
//   resolveRecordedNormalizedHash?,       // (blobSha) => 同形式の hash | null（復元不能なら null）
// }
// returns: { slug, status: 'ok'|'blocked'|'unknown'|'stale'|'stale-unresolved'
//                          |'skip-no-review'|'skip-no-record', msg }
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
    const recorded = readiness.articleHash;
    const normalizedHash = target.normalizedHash;
    // 記録側が将来 published 行を除いた hash を書くようになっても素通しできるようにしておく。
    if (normalizedHash && recorded === normalizedHash) {
      return {
        slug,
        status: "ok",
        msg: `blocked=false（mustHigh=${readiness.mustHigh ?? "?"}, verified=${readiness.verified ?? "?"}, reviewedAt=${readiness.reviewedAt || "?"}）`,
      };
    }
    const resolve = target.resolveRecordedNormalizedHash;
    const recordedNormalized =
      normalizedHash && typeof resolve === "function"
        ? resolve(recorded)
        : null;
    if (recordedNormalized === null) {
      return {
        slug,
        status: "stale-unresolved",
        msg: `articleHash 不一致（recorded=${recorded.slice(0, 8)} current=${articleHash.slice(0, 8)}）だが、記録された版を object DB から復元できず本文差分を判定できない。手動で差分を確認する`,
      };
    }
    if (recordedNormalized !== normalizedHash) {
      return {
        slug,
        status: "stale",
        msg: `レビュー後に記事本文が変更されている（articleHash 不一致: recorded=${recorded.slice(0, 8)} current=${articleHash.slice(0, 8)}。published 行を除いても内容が異なる）。再レビュー推奨`,
      };
    }
    return {
      slug,
      status: "ok",
      msg: `blocked=false（mustHigh=${readiness.mustHigh ?? "?"}, verified=${readiness.verified ?? "?"}, reviewedAt=${readiness.reviewedAt || "?"}）/ articleHash は不一致だが差分は front matter の published 行のみで本文は不変`,
    };
  }
  return {
    slug,
    status: "ok",
    msg: `blocked=false（mustHigh=${readiness.mustHigh ?? "?"}, verified=${readiness.verified ?? "?"}, reviewedAt=${readiness.reviewedAt || "?"}）`,
  };
}

// ---- git まわり（実行時のみ） ----

// シェルを介さず git を実行する（baseRef / file にシェル特殊文字が混じっても injection しない）
function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

// 記録された blob sha から「published 行を除いた内容」の hash を復元する。
// object DB に無い（削除済みブランチ系統 / shallow clone）場合は null。
const recordedNormalizedCache = new Map();
function resolveRecordedNormalizedHash(sha) {
  const key = String(sha);
  if (!/^[0-9a-f]{40}$/.test(key)) return null;
  if (recordedNormalizedCache.has(key)) return recordedNormalizedCache.get(key);
  let result = null;
  try {
    const type = execFileSync("git", ["cat-file", "-t", key], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (type === "blob") {
      const content = execFileSync("git", ["cat-file", "-p", key], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        maxBuffer: 64 * 1024 * 1024,
      });
      result = normalizedArticleHash(content);
    }
  } catch {
    result = null;
  }
  recordedNormalizedCache.set(key, result);
  return result;
}

// diff モード: BASE...HEAD で変更された articles/*.md のうち、現在 published: true のものを対象にする
// （published:false→true フリップも、公開済み記事の本文更新も、公開に影響する変更として拾う）。
function findTargetFilesFromDiff(baseRef) {
  const files = git(
    "diff",
    `${baseRef}...HEAD`,
    "--name-only",
    "--",
    "articles/*.md",
  )
    .split("\n")
    .filter(Boolean);
  return files.filter(
    (f) => fs.existsSync(f) && isPublishedTrue(fs.readFileSync(f, "utf8")),
  );
}

function buildTarget(file) {
  const slug = path.basename(file, ".md");
  const articleHash = git("hash-object", file).trim();
  const normalizedHash = normalizedArticleHash(fs.readFileSync(file, "utf8"));
  const reviewPath = path.join(REVIEWS_DIR, `${slug}.md`);
  const hasReviewFile = fs.existsSync(reviewPath);
  const readiness = hasReviewFile
    ? parseReadiness(fs.readFileSync(reviewPath, "utf8"))
    : null;
  return {
    slug,
    articleHash,
    normalizedHash,
    hasReviewFile,
    readiness,
    resolveRecordedNormalizedHash,
  };
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
  // 記録 hash からの復元は git を使うため、self-test では stub リゾルバを渡して hermetic に保つ。
  const stale = parseReadiness(read("review-stale.md"));
  const RECORDED_SHA = "0123456789012345678901234567890123456789";
  assertEq(
    "case stale → stale（published 行を除いても内容が違う）",
    evaluateTarget({
      slug: "stale",
      articleHash: "ffffffffffffffffffffffffffffffffffffffff",
      normalizedHash: "current-body",
      resolveRecordedNormalizedHash: (sha) =>
        sha === RECORDED_SHA ? "reviewed-body" : null,
      hasReviewFile: true,
      readiness: stale,
    }).status,
    "stale",
  );

  // 5b) published フリップだけ（本文は不変）→ ok。この PR の本題。
  assertEq(
    "case published フリップのみ → ok（stale にしない）",
    evaluateTarget({
      slug: "flip",
      articleHash: "ffffffffffffffffffffffffffffffffffffffff",
      normalizedHash: "same-body",
      resolveRecordedNormalizedHash: (sha) =>
        sha === RECORDED_SHA ? "same-body" : null,
      hasReviewFile: true,
      readiness: stale,
    }).status,
    "ok",
  );

  // 5c) 記録された blob を復元できない → 判定不能（WARN）
  assertEq(
    "case 復元不能 → stale-unresolved",
    evaluateTarget({
      slug: "unresolved",
      articleHash: "ffffffffffffffffffffffffffffffffffffffff",
      normalizedHash: "current-body",
      resolveRecordedNormalizedHash: () => null,
      hasReviewFile: true,
      readiness: stale,
    }).status,
    "stale-unresolved",
  );

  // 5d) 記録側が将来 normalized hash を書いた場合も一致とみなす（前方互換）
  assertEq(
    "case 記録値が normalized hash → ok",
    evaluateTarget({
      slug: "forward-compat",
      articleHash: "ffffffffffffffffffffffffffffffffffffffff",
      normalizedHash: RECORDED_SHA,
      resolveRecordedNormalizedHash: () => null,
      hasReviewFile: true,
      readiness: stale,
    }).status,
    "ok",
  );

  // 5e) 正規化そのもの: published 行だけの差は同一 hash、他の front matter / 本文の差は別 hash
  const fmArticle = (published, title, body) =>
    `---\ntitle: "${title}"\nemoji: "🦁"\ntype: "tech"\ntopics: ["ai"]\npublished: ${published}\n---\n\n${body}\n`;
  assertEq(
    "normalize: published:false→true で hash 不変",
    normalizedArticleHash(fmArticle("false", "T", "本文")) ===
      normalizedArticleHash(fmArticle("true", "T", "本文")),
    true,
  );
  assertEq(
    "normalize: title 変更は検出する",
    normalizedArticleHash(fmArticle("true", "T", "本文")) ===
      normalizedArticleHash(fmArticle("true", "T2", "本文")),
    false,
  );
  assertEq(
    "normalize: 本文変更は検出する",
    normalizedArticleHash(fmArticle("true", "T", "本文")) ===
      normalizedArticleHash(fmArticle("true", "T", "本文2")),
    false,
  );
  assertEq(
    "normalize: front matter 外の published: 行は除去しない",
    stripPublishedField("# 見出し\n\npublished: true\n"),
    "# 見出し\n\npublished: true\n",
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
module.exports = {
  parseReadiness,
  isPublishedTrue,
  stripPublishedField,
  normalizedArticleHash,
  evaluateTarget,
};
