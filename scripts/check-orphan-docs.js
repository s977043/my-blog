#!/usr/bin/env node
// Check: `docs/` 配下の Markdown のうち、どこからも参照されていない「孤立ドキュメント」を検出する。
//
// ■ 背景（なぜ必要か）
//   委託規律テンプレート（docs 配下）を新設した PR #609 は、どこからも参照されないまま main に入った。
//   ※このコメントで実パスを書かないのは、ガード自身が参照元になって当該ファイルを免責しないため。
//   「委託時に『このファイルを読め』の1行を渡せば済む」という設計だったが、**存在を知らなければ渡せない**。
//   並行作業のため一時的にリンクを外し、戻し忘れたのが原因で、横断レビューで初めて発覚した（PR #612 で手当て）。
//   新設ドキュメントで同じことが繰り返されるので、機械で検知する。
//
// ■ 検出対象（どのドキュメントの孤立を見るか）
//   `docs/**` と、`articles_note/` のうち**記事本体ではないサブディレクトリ**
//   （`articles_note/guides/**` / `articles_note/checklists/**` など）。
//   後者は note 記事の構成ガイド・品質チェックリストで、実体は「エージェント向けの指示
//   ドキュメント」であり `docs/` 配下と同じ性質を持つ。ここを対象外にしていたため、
//   2026-09-09 に `articles_note/guides/` の新設ファイルが被参照ゼロのまま main に入っても
//   `npm run check` が素通りした（外部レビューで初めて発覚）。
//
// ■ 走査範囲（参照元としてどこを見るか）
//   root の `*.md`（`AGENTS.md` / `CLAUDE.md` / `README.md` / `AGENT_LEARNINGS.md` など）、
//   `docs/**`、`.claude/**`、`scripts/**`、`.github/**`、`articles_note/`（記事本体を除く）、
//   `package.json`。
//   **意図的に `articles/` `Qiita/` `books/` `reviews/` と、`articles_note/` の記事本体
//   （`new/` `drafts/` `published/` `assets/` `export/` `build/`）を除外する。**
//   これらは公開コンテンツで、記事本文がたまたま docs のパスに言及していても
//   「エージェントや作業者が CLAUDE.md / AGENTS.md から辿り着ける」ことにはならない。
//   ここを含めると「どこかには書いてある」で素通りし、本来の孤立を見逃す（PR #609 の再発）。
//   逆に `scripts/` や `.github/` を外すと、スクリプトのコメントからだけ参照されている運用文書
//   （実際に `check-zenn-publish-pace.js` が `publish-operating-policy.md` を参照している）を
//   誤検知するので含める。`articles_note/` の記事本体以外（`README.md` と guides/checklists）は
//   ディレクトリの索引・相互参照であり、記事本文ではないので参照元に含める。
//
// ■ 参照の形式（実データを調べた結果）
//   このリポジトリでは以下の 2 形式が混在している。両方を数える。
//     1. Markdown リンク: `[`publish-queue.md`](./publish-queue.md)` / `[...](../AGENTS.md)`（相対パス）
//     2. バッククォート内のパス表記: `` `docs/publish-operating-policy.md` ``（リポジトリルート相対）
//   実装は「`.md` で終わるトークン」を Markdown リンク先とバッククォート内文字列から抽出し、
//   **リポジトリルート基準と参照元ファイルのディレクトリ基準の両方で解決**して照合する。
//   これで `./archive/README.md` のような相対リンクも、`docs/foo.md` のような絶対表記も拾える。
//   単なる basename 一致（`foo.md` がどこかに出現）は採らない。`README.md` や `2026-05-27.md` のような
//   衝突しやすい名前で誤って「参照あり」と判定してしまうため。
//
// ■ 除外（実データを見て決めた）
//   - `docs/archive/**` — 凍結資産。`docs/archive/README.md` が「解凍ラインを満たすまで参照しない」と
//     明記しており、**参照されないことが正常**。ここを対象にすると恒常的な誤検知になる。
//   - `articles_note/{new,drafts,published,assets,export,build}/**` — note 記事本体と画像。
//     記事は相互参照しないので孤立判定に馴染まない。参照元としても数えない（上記「走査範囲」参照）。
//   - `README.md`（basename 一致）— ディレクトリの索引ファイル。索引は「参照される側」ではなく
//     「参照する側」なので、被参照ゼロを異常としない。
//   それ以外（日付スナップショット等）は除外しない。孤立していれば実際に索引から辿れない。
//
// ■ FAIL ではなく WARN にした理由
//   導入時点の実データで孤立が 7 件あり（`npm run check:orphan-docs` の初回実行結果）、
//   即 FAIL にすると `npm run check` の集約ランナーが落ちて後続の検査結果が読めなくなる。
//   既存分の手当ては別 PR の仕事なので、まず WARN（exit 0）で可視化する。
//   既存分が解消されたら FAIL 化を検討する（そのとき変えるのは EXIT_ON_ORPHAN のみ）。
//   mutation を伴わない読み取り専用の検査なので `npm run check` には入れてよい。
//
// ■ 使い方
//   npm run check:orphan-docs    # 実データ
//   npm run test:orphan-docs     # self-test

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const LABEL = "[check:orphan-docs]";
// 孤立を検出する対象ディレクトリ。`articles_note` は記事本体を除いた部分だけが対象になる
// （除外は ARTICLE_BODY_PREFIXES で行う）。
const DOC_DIRS = ["docs", "articles_note"];

// 孤立を検出しても exit 0（WARN）。FAIL 化するときはここを true にする。
const EXIT_ON_ORPHAN = false;

// 参照元として走査するディレクトリ（ルート直下の *.md と package.json は別途）
const SOURCE_DIRS = ["docs", ".claude", "scripts", ".github", "articles_note"];
const SOURCE_EXTS = new Set([
  ".md",
  ".js",
  ".mjs",
  ".cjs",
  ".sh",
  ".yml",
  ".yaml",
  ".json",
  ".py",
  ".txt",
]);
const SKIP_DIR_NAMES = new Set(["node_modules", ".git", ".remote"]);

// 記事本体（`articles_note/` のうち note 記事・画像そのもの）。
// 検出対象からも参照元からも外す。ここに無い `articles_note/` 直下のもの
// （`guides/` `checklists/` `README.md` など）はエージェント向け指示ドキュメントとして扱う。
const ARTICLE_BODY_PREFIXES = [
  "articles_note/new",
  "articles_note/drafts",
  "articles_note/published",
  "articles_note/assets",
  "articles_note/export",
  "articles_note/build",
];

// 対象から外すパス接頭辞 / basename
const EXCLUDED_PREFIXES = ["docs/archive/"];
const EXCLUDED_BASENAMES = new Set(["README.md"]);

// ---- 純関数（self-test 対象） ----

// 記事本体（走査対象にも参照元にもしない）か。ディレクトリ自身とその配下の両方を真にする。
function isArticleBodyPath(relPath) {
  return ARTICLE_BODY_PREFIXES.some(
    (p) => relPath === p || relPath.startsWith(`${p}/`),
  );
}

function isExcludedDoc(relPath) {
  if (isArticleBodyPath(relPath)) return true;
  if (EXCLUDED_PREFIXES.some((p) => relPath.startsWith(p))) return true;
  return EXCLUDED_BASENAMES.has(path.posix.basename(relPath));
}

// 1ファイルの本文から「.md で終わる参照候補トークン」を抽出する。
// - Markdown リンク `](target)` の target
// - バッククォート内の文字列
function extractRefTokens(content) {
  const text = String(content);
  const tokens = [];

  for (const m of text.matchAll(/\]\(([^)\s]+?)(?:\s+"[^"]*")?\)/g)) {
    tokens.push(m[1]);
  }
  for (const m of text.matchAll(/`([^`\n]+?)`/g)) {
    tokens.push(m[1]);
  }
  // バッククォート無しの素のパス表記（例: スクリプトのコメント中 `docs/foo.md` 相当）
  for (const m of text.matchAll(/(?:^|[\s("'])((?:\.{1,2}\/)?[\w./-]+\.md)/g)) {
    tokens.push(m[1]);
  }

  return [
    ...new Set(
      tokens
        .map((t) => t.split("#")[0].trim())
        .filter((t) => t.toLowerCase().endsWith(".md")),
    ),
  ];
}

// トークンを、参照元ファイルの位置を基準に repo-relative path 群へ正規化する。
// ルート基準・参照元ディレクトリ基準の両方を返す（どちらで書かれていても拾うため）。
function resolveTokens(tokens, sourceRelPath) {
  const dir = path.posix.dirname(sourceRelPath);
  const out = new Set();
  for (const token of tokens) {
    const cleaned = token.replace(/^\.\//, "");
    if (!cleaned || cleaned.includes("*")) continue;
    // ルート基準
    out.add(path.posix.normalize(cleaned));
    // 参照元ディレクトリ基準
    out.add(path.posix.normalize(path.posix.join(dir, cleaned)));
  }
  return out;
}

// docs 配下の対象ファイル一覧と、参照元ファイル（相対パス→本文）から孤立を判定する。
// sources: { [relPath]: content }
// docFiles: string[]（repo-relative）
function evaluate(docFiles, sources) {
  const targets = docFiles.filter((f) => !isExcludedDoc(f));
  const excluded = docFiles.filter((f) => isExcludedDoc(f));

  const referenced = new Set();
  for (const [relPath, content] of Object.entries(sources)) {
    // 記事本体からの言及は参照として数えない（collectSources でも走査しないが、
    // evaluate 単体でも同じ保証を持たせる）
    if (isArticleBodyPath(relPath)) continue;
    const resolved = resolveTokens(extractRefTokens(content), relPath);
    for (const r of resolved) {
      // 自分自身への言及は参照とみなさない（PR #609 はこれで素通りした）
      if (r === relPath) continue;
      referenced.add(r);
    }
  }

  const orphans = targets.filter((f) => !referenced.has(f));
  return { targets, excluded, orphans };
}

// ---- ファイル収集 ----

function walk(absDir, relDir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (SKIP_DIR_NAMES.has(e.name)) continue;
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    const abs = path.join(absDir, e.name);
    // 記事本体は走査自体を打ち切る（drafts/ published/ assets/ は件数が多い）
    if (isArticleBodyPath(rel)) continue;
    if (e.isDirectory()) walk(abs, rel, acc);
    else acc.push(rel);
  }
  return acc;
}

function collectDocFiles() {
  const acc = [];
  for (const d of DOC_DIRS) {
    if (!fs.existsSync(path.join(ROOT, d))) continue;
    walk(path.join(ROOT, d), d, acc);
  }
  return acc.filter((f) => f.endsWith(".md"));
}

function collectSources() {
  const files = [];
  for (const d of SOURCE_DIRS) {
    if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d), d, files);
  }
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith(".md") || f === "package.json") files.push(f);
  }

  const sources = {};
  for (const f of files) {
    if (f !== "package.json" && !SOURCE_EXTS.has(path.extname(f))) continue;
    try {
      const stat = fs.statSync(path.join(ROOT, f));
      if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
      sources[f] = fs.readFileSync(path.join(ROOT, f), "utf8");
    } catch {
      /* 読めないファイルは無視 */
    }
  }
  return sources;
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

  const fixtureDir = path.join(__dirname, "fixtures", "check-orphan-docs");
  const read = (name) => fs.readFileSync(path.join(fixtureDir, name), "utf8");

  // 1) トークン抽出
  eq(
    "Markdown リンクとバッククォートの両形式を抽出する",
    extractRefTokens(
      "本文 [`publish-queue.md`](./publish-queue.md) と `docs/foo.md` と ![x](img.png)",
    ).sort(),
    ["./publish-queue.md", "docs/foo.md", "publish-queue.md"].sort(),
  );
  eq(
    "`.md` 以外のトークンは落とす",
    extractRefTokens("`npm run check` と [x](https://example.com)"),
    [],
  );

  // 2) 相対パスの解決
  eq(
    "参照元ディレクトリ基準で相対リンクを解決する",
    [...resolveTokens(["./archive/README.md"], "docs/publish-queue.md")].sort(),
    ["archive/README.md", "docs/archive/README.md"].sort(),
  );
  eq(
    "../ を含む相対リンクを解決する",
    [...resolveTokens(["../AGENTS.md"], "docs/publish-queue.md")].includes(
      "AGENTS.md",
    ),
    true,
  );

  // 3) 除外判定
  eq("docs/archive/ 配下は対象外", isExcludedDoc("docs/archive/foo.md"), true);
  eq("README.md は対象外", isExcludedDoc("docs/loop-audit/README.md"), true);
  eq("通常の docs は対象", isExcludedDoc("docs/foo.md"), false);
  eq(
    "articles_note/published/ は記事本体",
    isArticleBodyPath("articles_note/published/n123.md"),
    true,
  );
  eq(
    "articles_note/drafts ディレクトリ自身も記事本体",
    isArticleBodyPath("articles_note/drafts"),
    true,
  );
  eq(
    "articles_note/guides/ は記事本体ではない",
    isArticleBodyPath("articles_note/guides/foo.md"),
    false,
  );
  eq(
    "articles_note/guides/ は検出対象",
    isExcludedDoc("articles_note/guides/foo.md"),
    false,
  );
  eq(
    "articles_note/checklists/ は検出対象",
    isExcludedDoc("articles_note/checklists/foo.md"),
    false,
  );
  eq(
    "articles_note/new/ は対象外",
    isExcludedDoc("articles_note/new/foo.md"),
    true,
  );

  // 4) fixture ベースの統合判定
  const docFiles = [
    "docs/referenced-from-root.md", // CLAUDE.md からバッククォート表記で参照 → PASS
    "docs/referenced-relative.md", // docs 内から相対リンクで参照 → PASS
    "docs/referenced-from-script.md", // scripts のコメントから参照 → PASS
    "docs/orphan-doc.md", // 自分自身にしか出てこない → 検出
    "docs/archive/frozen.md", // 除外（凍結資産）
    "docs/README.md", // 除外（索引）
    "articles_note/guides/referenced-guide.md", // articles_note/README.md から参照 → PASS
    "articles_note/guides/orphan-guide.md", // 記事本文にしか出てこない → 検出
    "articles_note/published/n1234567890.md", // 除外（記事本体）
  ];
  const sources = {
    "CLAUDE.md": read("CLAUDE.md"),
    "docs/index-like.md": read("index-like.md"),
    "scripts/some-check.js": read("some-check.js"),
    "docs/orphan-doc.md": read("orphan-doc.md"),
    "articles_note/README.md": read("articles-note-readme.md"),
  };

  const result = evaluate(docFiles, sources);
  eq(
    "孤立は 2 件（docs と articles_note/guides の両方を検出する）",
    result.orphans.sort(),
    ["articles_note/guides/orphan-guide.md", "docs/orphan-doc.md"].sort(),
  );
  eq(
    "除外は archive / README / 記事本体の 3 件",
    result.excluded.sort(),
    [
      "articles_note/published/n1234567890.md",
      "docs/archive/frozen.md",
      "docs/README.md",
    ].sort(),
  );
  eq("対象は 6 件", result.targets.length, 6);
  eq(
    "自己言及だけのファイルは参照済みにならない",
    result.orphans.includes("docs/orphan-doc.md"),
    true,
  );

  // 5) 記事本体からの言及は参照として数えない
  const withArticleMention = evaluate(docFiles, {
    ...sources,
    "articles_note/published/n1234567890.md": read("published-article.md"),
  });
  eq(
    "記事本体が言及していても孤立のまま",
    withArticleMention.orphans.includes("articles_note/guides/orphan-guide.md"),
    true,
  );

  // 6) ガードが無い状態（= 参照を1本足すと解消する）ことの確認
  const fixed = evaluate(docFiles, {
    ...sources,
    "CLAUDE.md": `${read("CLAUDE.md")}\n- \`docs/orphan-doc.md\` を読むこと\n`,
    "articles_note/README.md": `${read("articles-note-readme.md")}\n- \`guides/orphan-guide.md\`\n`,
  });
  eq("参照を1本足せば孤立ゼロになる", fixed.orphans, []);

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
  const presentDirs = DOC_DIRS.filter((d) => fs.existsSync(path.join(ROOT, d)));
  if (presentDirs.length === 0) {
    console.log(`${LABEL} skip: ${DOC_DIRS.join(" / ")} が見つからない`);
    return 0;
  }

  const docFiles = collectDocFiles();
  const sources = collectSources();
  const { targets, excluded, orphans } = evaluate(docFiles, sources);

  if (orphans.length > 0) {
    console.warn(
      `${LABEL} WARN: どこからも参照されていないドキュメントが ${orphans.length} 件（対象=${targets.length}, 除外=${excluded.length}）`,
    );
    for (const o of orphans) {
      console.warn(
        `  ${o}  参照元が無い。CLAUDE.md / AGENTS.md / 関連 docs のいずれかからリンクするか、docs/archive/ へ移す`,
      );
    }
    return EXIT_ON_ORPHAN ? 1 : 0;
  }

  console.log(
    `${LABEL} OK: 孤立ドキュメントなし（対象=${targets.length}, 除外=${excluded.length}）`,
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

module.exports = {
  extractRefTokens,
  resolveTokens,
  isArticleBodyPath,
  isExcludedDoc,
  evaluate,
};
