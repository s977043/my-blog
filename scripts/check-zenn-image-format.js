#!/usr/bin/env node
// Check: Zenn 記事が `/images/` の SVG を参照していないかを検出する。
//
// ■ 背景（なぜ必要か）
//   Zenn は記事内画像を Cloudinary 経由で配信するが、Cloudinary は SVG を処理できず
//   HTTP 400（0 bytes）を返す。結果、記事の図が「表示できません」となり読者に届かない。
//   Zenn 自身も「対応している画像の拡張子は .png,.jpg,.jpeg,.webp,.gif」と表示する。
//   既存の `check:internal-links` は **ファイルの実在しか見ていない** ため、
//   images/<path>.svg が存在する限り PASS してしまい、この事故クラスを検出できなかった。
//
// ■ なぜ WARN ではなく既定で FAIL（exit 1）にするか
//   このリポジトリには段階導入のため WARN から始めた前例（`check:publish-readiness` の
//   STRICT=1 でのみ FAIL）があるが、本チェックは以下の理由で **STRICT 環境変数の有無に
//   関わらず既定で FAIL** とする:
//     1. 判定が二値で確定的（拡張子が .svg か否か）。レビュー状態や外部 API に依存しないため
//        誤検知の余地がなく、WARN で人間の目視に委ねる必要がない。
//     2. 対処が機械的（PNG 化して参照を差し替える）で、実行コストが小さい。
//     3. 見逃した場合の損失が非対称。表示されない図をそのまま公開すると読者に情報が届かず、
//        公開後の修正は Zenn の rate-limit（24h あたりの公開本数制限）に阻まれて即時復旧できない。
//   段階導入が必要だった publish-readiness と違い、既存記事の網羅的な事前整備を待つ理由もない。
//
// ■ 検出対象
//   - articles/*.md（README.md は除外）
//   - Markdown 画像記法      ![alt](/images/....svg)
//   - HTML img タグ          <img src="/images/....svg">
//   - フェンス付きコードブロック（``` / ~~~）内は対象外（記事本文で SVG 非対応を
//     「例示」しているケースを誤検知しないため。実例: articles/multi-agent-book-review-workflow.md）
//
// ■ 使い方
//   npm run check:zenn-image-format    # 実データ
//   npm run test:zenn-image-format     # self-test

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ARTICLES_DIR = "articles";
const LABEL = "[check:zenn-image-format]";

// ---- 純関数（self-test 対象） ----

// Markdown 画像記法: ![alt](/images/foo.svg "title")
// alt に `]` を含むケースは稀なので貪欲でない [^\]]* で十分。
const MD_IMAGE_RE = /!\[[^\]]*\]\(\s*(\/images\/[^)\s]+)/g;
// HTML img タグ: <img ... src="/images/foo.svg" ...>
const HTML_IMG_RE = /<img\b[^>]*?\bsrc\s*=\s*["'](\/images\/[^"']+)["']/gi;

// 参照パスが Zenn で表示できない SVG かを判定する。
// クエリ・アンカーは除去してから拡張子を見る（?v=2 等が付いても検出できるように）。
function isSvgPath(target) {
  const clean = String(target).split("#")[0].split("?")[0];
  return /\.svg$/i.test(clean);
}

// 1 ファイル分の本文から SVG 参照を抽出する。
// returns: [{ line: <1始まり>, target: <参照パス>, kind: 'markdown'|'html' }]
function findSvgReferences(content) {
  const hits = [];
  let inFence = false;
  let fenceMarker = null;

  const lines = String(content).split(/\r?\n/);
  lines.forEach((line, i) => {
    // フェンス開始/終了の判定（``` と ~~~ の両方。開始マーカーと同種でのみ閉じる）
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        return;
      }
      if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      return;
    }
    if (inFence) return;

    for (const [re, kind] of [
      [MD_IMAGE_RE, "markdown"],
      [HTML_IMG_RE, "html"],
    ]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        if (isSvgPath(m[1])) hits.push({ line: i + 1, target: m[1], kind });
      }
    }
  });

  return hits;
}

// ---- ファイル収集（実行時のみ） ----

function articleFiles() {
  const dir = path.join(ROOT, ARTICLES_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() && e.name.endsWith(".md") && e.name !== "README.md",
    )
    .map((e) => path.join(dir, e.name))
    .sort();
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

  // 1) 拡張子判定
  eq("svg を検出する", isSvgPath("/images/a/b.svg"), true);
  eq("大文字 SVG も検出する", isSvgPath("/images/a/b.SVG"), true);
  eq("png は検出しない", isSvgPath("/images/a/b.png"), false);
  eq("クエリ付き svg を検出する", isSvgPath("/images/a/b.svg?v=2"), true);
  eq("アンカー付き svg を検出する", isSvgPath("/images/a/b.svg#x"), true);
  // 「svg」を含むだけのパスに反応しない（部分一致に緩めた変異を殺す）
  eq("パス中の svg 文字列に反応しない", isSvgPath("/images/svg-notes/a.png"), false);

  // 2) Markdown 画像記法
  eq(
    "Markdown 画像の svg を行番号付きで検出する",
    findSvgReferences("# t\n\n![図](/images/foo/bar-ja.svg)\n"),
    [{ line: 3, target: "/images/foo/bar-ja.svg", kind: "markdown" }],
  );
  eq(
    "Markdown 画像の png は検出しない",
    findSvgReferences("![図](/images/foo/bar-ja.png)\n"),
    [],
  );
  eq(
    "alt が空でも検出する",
    findSvgReferences("![](/images/a.svg)").length,
    1,
  );
  eq(
    "title 付きでも検出する",
    findSvgReferences('![図](/images/a.svg "説明")').length,
    1,
  );
  eq(
    "同一行に 2 つあれば 2 件",
    findSvgReferences("![a](/images/a.svg) ![b](/images/b.svg)").length,
    2,
  );

  // 3) HTML img タグ
  eq(
    "HTML img（ダブルクォート）を検出する",
    findSvgReferences('<img src="/images/a.svg" alt="x">'),
    [{ line: 1, target: "/images/a.svg", kind: "html" }],
  );
  eq(
    "HTML img（シングルクォート）を検出する",
    findSvgReferences("<img src='/images/a.svg'>").length,
    1,
  );
  eq(
    "HTML img で src が後方の属性でも検出する",
    findSvgReferences('<img alt="x" width="600" src="/images/a.svg">').length,
    1,
  );
  eq("HTML img の png は検出しない", findSvgReferences('<img src="/images/a.png">'), []);

  // 4) 対象外（FP 回避）
  eq(
    "コードブロック内は対象外",
    findSvgReferences("```text\n![図](/images/a.svg)\n```\n"),
    [],
  );
  eq(
    "~~~ フェンス内も対象外",
    findSvgReferences("~~~\n![図](/images/a.svg)\n~~~\n"),
    [],
  );
  eq(
    "コードブロックを閉じたあとは検出を再開する",
    findSvgReferences("```\n![a](/images/a.svg)\n```\n\n![b](/images/b.svg)\n"),
    [{ line: 5, target: "/images/b.svg", kind: "markdown" }],
  );
  eq(
    "画像でない通常リンクの svg は対象外",
    findSvgReferences("[図の元データ](/images/a.svg)"),
    [],
  );
  eq(
    "外部 URL の svg は対象外（Zenn の /images 配信ではない）",
    findSvgReferences("![badge](https://img.shields.io/x.svg)"),
    [],
  );

  // 5) 実データに対する経路（依存欠落・パス解決の検査）
  eq("記事ファイルを列挙できる", articleFiles().length > 0, true);
  eq(
    "README.md を対象から除外する",
    articleFiles().some((f) => path.basename(f) === "README.md"),
    false,
  );
  // cwd 非依存（サブディレクトリから実行しても記事を読めるか）ではなく、
  // ここでは「列挙が空でない」ことだけを保証する。ROOT は cwd 依存の設計。

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
  const files = articleFiles();
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, "utf8");
    for (const hit of findSvgReferences(content)) {
      violations.push(`  ${rel}:${hit.line}  ${hit.target}`);
    }
  }

  if (violations.length > 0) {
    console.error(
      `${LABEL} FAIL: Zenn が表示できない SVG 画像参照 ${violations.length} 件（checked ${files.length} files）`,
    );
    violations.forEach((v) => console.error(v));
    console.error(
      "  対処: 対象 SVG を PNG に変換して images/ に配置し、記事の参照を .png に差し替える（Zenn の対応拡張子は .png/.jpg/.jpeg/.webp/.gif）",
    );
    return 1;
  }

  console.log(
    `${LABEL} OK: SVG 画像参照なし（checked ${files.length} files）`,
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

module.exports = { isSvgPath, findSvgReferences, articleFiles };
