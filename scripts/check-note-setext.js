#!/usr/bin/env node
// Check: articles_note/new/**/*.md で「段落が setext 見出しへ化ける」事故を検出する。
//
// ■ 背景（なぜ必要か）
//   Markdown では `---`（水平線）の直前行が非空だと **setext 見出し記法**として解釈され、
//   直前の段落が `<h2>` になる（`===` は同様に `<h1>` になる）。`new/<slug>.md` は
//   `md_to_wxr.py` でインポート用 WXR に変換されて note へ流し込まれる本文原稿であり、
//   この事故が起きると段落が見出しとして WXR に出力され、note インポート後に本文中へ
//   誤った見出しが混入する。
//
//   実例: PR #581（`articles_note/new/plangate-team-rollout.md` で4段落が意図せず `<h2>` 化）。
//   `git show 5f313ff` で修正内容（空行1行の挿入のみ、本文は無変更）を確認できる。
//
// ■ なぜ対象を `new/` だけに限定するか（`published/`・`drafts/` は対象外）
//   `articles_note/README.md` の定義どおり、`published/`・`drafts/` は note 公式エクスポート
//   （WXR）を `wxr_to_md.py` で Markdown 化した**読み取り専用ミラー**。次回エクスポート
//   取り込みで無条件に上書き再生成されるため、そこを直しても意味がない。加えて setext 化が
//   実害になるのは「Markdown → WXR → note インポート」という **`new/` → note 方向の変換経路
//   のみ**で、`published/`・`drafts/` はその逆方向（note → Markdown）の結果であり、
//   再び WXR に変換されることはない。つまり対象外にした場合の見逃しリスクが無い。
//
// ■ 検出対象
//   - articles_note/new/**/*.md
//   - コードブロック（``` / ~~~ で囲まれた範囲）の外にある `---` / `===` のみ
//   - frontmatter（ファイル先頭の `---` 〜 次の `---` の範囲）は対象外
//     （frontmatter の開始・終了デリミタ自体、およびその直後の行を誤って
//      「直前行が非空」と判定しないよう明示的に除外する）
//   - 直前行が水平線・setext 記法の行そのもの（`---` / `===`）の場合も除外する
//     （CommonMark 上、水平線の直後の水平線は「段落」を形成しないため setext にならない）
//
// ■ なぜ FATAL（exit 1）か
//   判定は機械的（コードブロック外・frontmatter外の `---`/`===` の直前行が非空か）で
//   曖昧さがなく、見逃すと note インポート用 WXR に誤った見出しがそのまま出る非対称リスクがある。
//
// ■ 使い方
//   npm run check:note-setext    # 実データ
//   npm run test:note-setext     # self-test

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const NOTE_DIR = "articles_note/new";
const EXCLUDE_DIRS = new Set(["export", "build"]);
const LABEL = "[check:note-setext]";

// ---- 純関数（self-test 対象） ----

// frontmatter の終端行インデックス（0始まり）を返す。frontmatter が無ければ -1。
// 先頭行が `---` で、以降に `---` のみの行があればそこを終端とみなす。
function findFrontmatterEnd(lines) {
  if (lines.length === 0 || lines[0].trim() !== "---") return -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") return i;
  }
  return -1;
}

// 1 ファイル分の本文から setext 化リスクのある `---`/`===` 行を検出する。
// returns: [{ line: <1始まり>, marker: '---'|'===', prevSnippet: <直前行の先頭50文字> }]
function findSetextViolations(content) {
  const lines = String(content).split(/\r?\n/);
  const fmEnd = findFrontmatterEnd(lines);
  const violations = [];

  let inFence = false;
  let fenceMarker = null;

  for (let i = 0; i < lines.length; i++) {
    if (fmEnd !== -1 && i <= fmEnd) continue; // frontmatter 範囲は対象外

    const line = lines[i];

    // フェンス開始/終了（``` と ~~~ の両方。開始マーカーと同種でのみ閉じる）
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        continue;
      }
      if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      continue;
    }
    if (inFence) continue;

    const trimmed = line.trim();
    if (trimmed !== "---" && trimmed !== "===") continue;

    const prevIdx = i - 1;
    if (prevIdx < 0) continue; // 直前行が無い（ファイル先頭）
    if (fmEnd !== -1 && prevIdx === fmEnd) continue; // 直前行が frontmatter 終端デリミタ

    const prev = lines[prevIdx];
    const prevTrimmed = prev.trim();
    if (prevTrimmed === "") continue; // 直前行が空 → 通常の水平線 / setext ではない
    if (prevTrimmed === "---" || prevTrimmed === "===") continue; // 直前行も水平線様 → 段落にならない

    violations.push({
      line: i + 1,
      marker: trimmed,
      prevSnippet: prevTrimmed.slice(0, 50),
    });
  }

  return violations;
}

// ---- ファイル収集（実行時のみ） ----

function collectMarkdownFiles() {
  const dir = path.join(ROOT, NOTE_DIR);
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (EXCLUDE_DIRS.has(e.name)) continue;
        walk(path.join(d, e.name));
      } else if (e.isFile() && e.name.endsWith(".md")) {
        results.push(path.join(d, e.name));
      }
    }
  }
  walk(dir);
  return results.sort();
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

  // 1) 基本ケース: 直前行が非空の `---` は検出する
  eq(
    "直前行が非空の --- を検出する",
    findSetextViolations("段落テキスト\n---\n").map((v) => v.line),
    [2],
  );
  eq(
    "直前行が非空の === を検出する（h1化）",
    findSetextViolations("段落テキスト\n===\n").map((v) => v.line),
    [2],
  );

  // 2) 直前行が空なら通常の水平線として許容
  eq(
    "直前行が空行なら検出しない（通常の水平線）",
    findSetextViolations("段落テキスト\n\n---\n"),
    [],
  );

  // 3) PR #581 相当（複数箇所・実際の修正パターン: 空行挿入で解消）
  eq(
    "空行を挟んだ複数の --- はすべて非検出",
    findSetextViolations("見出し\n\n本文A\n\n---\n\n本文B\n\n---\n"),
    [],
  );
  eq(
    "空行が無い複数の --- はすべて検出",
    findSetextViolations("本文A\n---\n\n本文B\n---\n").map((v) => v.line),
    [2, 5],
  );

  // 4) コードブロック内は対象外
  eq(
    "``` フェンス内の --- は対象外",
    findSetextViolations("説明\n```text\n設定値\n---\n```\n"),
    [],
  );
  eq(
    "~~~ フェンス内の --- は対象外",
    findSetextViolations("説明\n~~~\n設定値\n---\n~~~\n"),
    [],
  );
  eq(
    "フェンスを閉じたあとは検出を再開する",
    findSetextViolations("```\nコード\n---\n```\n本文\n---\n").map(
      (v) => v.line,
    ),
    [6],
  );

  // 5) frontmatter は対象外（開始・終了デリミタ自体、直後の行を誤検知しない）
  eq(
    "frontmatter の閉じ --- を誤検知しない",
    findSetextViolations("---\ntitle: t\ntopics: []\n---\n\n本文\n"),
    [],
  );
  eq(
    "frontmatter 直後の本文行は通常どおり検出する",
    findSetextViolations("---\ntitle: t\n---\n段落テキスト\n---\n").map(
      (v) => v.line,
    ),
    [5],
  );
  eq(
    "frontmatter の閉じが無い場合、先頭 --- は直前行なしとして非検出",
    findSetextViolations("---\n段落テキスト\n"),
    [],
  );

  // 6) 直前行が水平線様（--- や ===）なら段落を形成しないため非検出
  eq(
    "連続する --- は検出しない（直前行が水平線様）",
    findSetextViolations("---\n---\n"),
    [],
  );

  // 7) スニペットは50文字に丸める
  eq(
    "prevSnippet は先頭50文字に丸める",
    findSetextViolations(`${"あ".repeat(80)}\n---\n`)[0].prevSnippet.length,
    50,
  );

  // 8) frontmatter 終端検出の純関数
  eq("frontmatter なしなら -1", findFrontmatterEnd(["本文", "---"]), -1);
  eq(
    "frontmatter ありなら終端行 index",
    findFrontmatterEnd(["---", "title: t", "---", "本文"]),
    2,
  );

  // 9) 実データに対する経路（依存欠落・パス解決の検査）
  eq(
    "articles_note/new 配下の md を列挙できる",
    collectMarkdownFiles().length > 0,
    true,
  );
  eq(
    "export/ 配下は対象から除外する",
    collectMarkdownFiles().some((f) => f.split(path.sep).includes("export")),
    false,
  );
  eq(
    "build/ 配下は対象から除外する",
    collectMarkdownFiles().some((f) => f.split(path.sep).includes("build")),
    false,
  );
  eq(
    "published/ 配下は列挙対象に含まれない（articles_note/new 限定のため構造的に除外）",
    collectMarkdownFiles().some((f) => f.split(path.sep).includes("published")),
    false,
  );
  eq(
    "drafts/ 配下は列挙対象に含まれない（articles_note/new 限定のため構造的に除外）",
    collectMarkdownFiles().some((f) => f.split(path.sep).includes("drafts")),
    false,
  );

  // 10) 実データの回帰ケース: published/n79e2918aa7f4.md:190 の脚注ブロック
  //     （setext 化しうる形だが、published/ は読み取り専用ミラーで実害が無いため対象外）
  eq(
    "published/ の実在する setext 化パターンは検出対象外（ロジックの回帰確認のみ・new/ 限定で構造的に非検出）",
    findSetextViolations(
      "※3：**グランドルール**とは「参加者が安心して発言でき、ふるまうことができる「**安全な場**」を作る1つの方法です\n※4：**ステークホルダー**とはプロダクトに対して利害関係を持つ**スクラム**チーム以外の人たちのこと\n---\n",
    ).length > 0,
    true, // findSetextViolations 自体は new/ 限定を知らない（フィルタは collectMarkdownFiles 側の責務）
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
  const files = collectMarkdownFiles();
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, "utf8");
    for (const v of findSetextViolations(content)) {
      violations.push(
        `  ${rel}:${v.line}  直前行「${v.prevSnippet}」の直後に \`${v.marker}\` → setext 見出し化`,
      );
    }
  }

  if (violations.length > 0) {
    console.error(
      `${LABEL} FAIL: note インポート用 WXR 生成時に段落が見出し化するリスク ${violations.length} 件（checked ${files.length} files）`,
    );
    violations.forEach((v) => console.error(v));
    console.error(
      "  対処: 該当 `---`/`===` の直前に空行を1行挿入する（本文の文言は変更しない）。参考: PR #581 / `git show 5f313ff`",
    );
    return 1;
  }

  console.log(
    `${LABEL} OK: note インポート用 WXR 生成時の見出し化リスクなし（checked ${files.length} files, articles_note/new/ のみ）`,
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
  findFrontmatterEnd,
  findSetextViolations,
  collectMarkdownFiles,
};
