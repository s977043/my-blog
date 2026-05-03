#!/usr/bin/env node
// Lint: articles_note/new/**/*.md と articles_note/drafts/**/*.md の画像参照が
// note インポートで自動取り込み可能な形式（`../assets/*.png|jpg|jpeg|gif`）であるか
// を検査する。
//
// 検知対象（NG パターン）:
//   - `./images/` 参照 — md_to_wxr.py の --base-url 書き換え対象外で URL がローカルパスのまま残る
//   - `*.svg` 参照 — note は SVG 非対応
//   - 拡張子なし参照 — note インポート時に画像として認識されない
//
// 加えて警告（FAIL ではない）:
//   - articles_note/assets/**/*.png のうち <10KB のもの（プレースホルダ画像の早期検知）
//
// 規約は AGENT_LEARNINGS.md「2026-04-30 — note WXR インポートは公式エクスポートの HTML パターンに揃える」
// と「2026-04-30 — note 画像配置時はサイズ・寸法を必ず検証する」を参照。

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const TARGET_DIRS = [
  path.join(REPO_ROOT, 'articles_note', 'new'),
  path.join(REPO_ROOT, 'articles_note', 'drafts'),
];
const ASSETS_DIR = path.join(REPO_ROOT, 'articles_note', 'assets');

const PLACEHOLDER_THRESHOLD_BYTES = 10 * 1024; // 10KB
const KNOWN_SMALL_IMAGE_ALLOWLIST = new Map([
  [
    'n40f2574d87dd_1667319411397-qcBZVCr3h6.png',
    'note公式エクスポート由来の8-bit colormap PNG。1008x78 の横長画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1667319577877-rGQU9yQIAL.png',
    'note公式エクスポート由来の8-bit colormap PNG。256x78 の小型画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1667319623725-hXYLUtYMLQ.png',
    'note公式エクスポート由来の8-bit colormap PNG。263x78 の小型画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1667319660478-qqvDmHmzRq.png',
    'note公式エクスポート由来の8-bit colormap PNG。255x78 の小型画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1667319710460-J11DU7Efrf.png',
    'note公式エクスポート由来の8-bit colormap PNG。263x78 の小型画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1673434419505-br9qojMB89.png',
    'note公式エクスポート由来の8-bit colormap PNG。273x409 の画像でプレースホルダではない',
  ],
  [
    'n40f2574d87dd_1673436710546-5Xnp5DrvLd.png',
    'note公式エクスポート由来の8-bit colormap PNG。230x201 の画像でプレースホルダではない',
  ],
  [
    'nb068316a12ec_picture_pc_ff61930fdd92bcdb206e6b425e44eb84.png',
    'note公式エクスポート由来の8-bit colormap PNG。600x160 のバナー画像でプレースホルダではない',
  ],
]);

// note インポート可能な画像参照: ../assets/<name>.<png|jpg|jpeg|gif>
// または絶対 URL (http(s)://...)
const VALID_IMAGE_RE =
  /!\[[^\]]*\]\((?:https?:\/\/[^)]+|\.\.\/assets\/[^)]+\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF))\)/;

// 画像参照全般を検出
const ALL_IMAGE_RE = /^!\[[^\]]*\]\(([^)]+)\)/;

function lintMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(ALL_IMAGE_RE);
    if (!m) continue;

    const ref = m[1];
    // 絶対 URL は OK
    if (/^https?:\/\//.test(ref)) continue;

    // ./images/ 参照は NG
    if (ref.startsWith('./images/')) {
      violations.push({
        line: i + 1,
        ref,
        reason:
          '`./images/` 参照は md_to_wxr.py の --base-url 書き換え対象外。`../assets/<name>.png` に変更してください',
      });
      continue;
    }

    // SVG は NG
    if (/\.svg$/i.test(ref)) {
      violations.push({
        line: i + 1,
        ref,
        reason: 'note は SVG 非対応。Chrome headless で PNG に変換し `../assets/<name>.png` を参照してください',
      });
      continue;
    }

    // 拡張子なし or 想定外パスは NG
    if (!VALID_IMAGE_RE.test(line)) {
      violations.push({
        line: i + 1,
        ref,
        reason: '`../assets/<name>.(png|jpg|jpeg|gif)` 形式または絶対 URL を使用してください',
      });
    }
  }

  return violations;
}

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(dir, f));
}

function findSmallImages() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  const small = [];
  for (const f of fs.readdirSync(ASSETS_DIR)) {
    if (!/\.(png|jpg|jpeg|gif)$/i.test(f)) continue;
    const fp = path.join(ASSETS_DIR, f);
    const stat = fs.statSync(fp);
    if (KNOWN_SMALL_IMAGE_ALLOWLIST.has(f)) continue;
    if (stat.size < PLACEHOLDER_THRESHOLD_BYTES) {
      small.push({ file: path.relative(process.cwd(), fp), size: stat.size });
    }
  }
  return small;
}

function main() {
  let totalErrors = 0;
  const errorReport = [];
  const warnReport = [];

  // 画像参照のチェック (FAIL)
  for (const dir of TARGET_DIRS) {
    const files = findMarkdownFiles(dir);
    for (const file of files) {
      const violations = lintMarkdownFile(file);
      if (violations.length > 0) {
        totalErrors += violations.length;
        errorReport.push({ file: path.relative(process.cwd(), file), violations });
      }
    }
  }

  // 小さすぎる画像の検知 (WARN)
  const smallImages = findSmallImages();
  if (smallImages.length > 0) {
    warnReport.push(...smallImages);
  }

  // 警告は exit 0 でも出す
  if (warnReport.length > 0) {
    console.warn(
      `[check:note-images] WARN: ${warnReport.length} image(s) below ${PLACEHOLDER_THRESHOLD_BYTES} bytes (potential placeholder)`,
    );
    for (const w of warnReport) {
      console.warn(`  ${w.file} (${w.size} bytes)`);
    }
    console.warn('  画像が極端に小さい場合、note インポート時に画像として認識されない可能性があります');
    console.warn('');
  }

  if (totalErrors === 0) {
    console.log('[check:note-images] OK: all image references are note-import compatible');
    return;
  }

  console.error(
    `[check:note-images] FAIL: ${totalErrors} invalid image reference(s) in articles_note/`,
  );
  console.error('  See AGENT_LEARNINGS.md 2026-04-30 entry「note WXR インポート」');
  console.error('');
  for (const entry of errorReport) {
    console.error(`  ${entry.file}`);
    for (const v of entry.violations) {
      console.error(`    L${v.line}: ${v.ref}`);
      console.error(`      → ${v.reason}`);
    }
  }
  process.exit(1);
}

main();
