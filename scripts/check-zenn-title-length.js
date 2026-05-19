#!/usr/bin/env node
// Check: articles/*.md の frontmatter `title` が Zenn 70 文字上限以内か検査する。
// Zenn は 70 文字を超えるタイトルでデプロイ保存に失敗する仕様。
//
// 使い方: `npm run check:zenn-title` 単独実行、または `npm run check` で他チェックと一括実行。
//
// 経緯: 2026-05-08、`articles/river-reviewer-v033-improvement-loop.md` のタイトルが
//       84 文字で Zenn デプロイログに「Titleには最大70文字まで使用できます」が出て保存失敗。
//       3ラウンドのレビューを通過したのに事前検出できなかったため、自動ガード化する。
//
// 詳細: AGENTS.md §「Zenn 公開フロー」、PR #215

const fs = require('fs');
const path = require('path');

const LIMIT = 70;
const ARTICLES_DIR = path.join(__dirname, '..', 'articles');

function extractTitle(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  const titleLine = fm.split('\n').find((line) => line.startsWith('title:'));
  if (!titleLine) return null;
  // title: 'foo' / title: "foo" / title: foo の3形式に対応
  const m = titleLine.match(/^title:\s*(?:'([^']*)'|"([^"]*)"|(.*))\s*$/);
  if (!m) return null;
  return (m[1] ?? m[2] ?? m[3] ?? '').trim();
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('[check:zenn-title] articles/ ディレクトリが見つからないためスキップ');
    return;
  }

  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md');

  const violations = [];
  for (const f of files) {
    const fullPath = path.join(ARTICLES_DIR, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const title = extractTitle(content);
    if (title === null) {
      // frontmatter または title 行が無い記事はスキップ（README など）
      continue;
    }
    if (title.length > LIMIT) {
      violations.push({ file: f, length: title.length, title });
    }
  }

  if (violations.length === 0) {
    console.log(`[check:zenn-title] OK: 全 ${files.length} 記事のタイトルが ${LIMIT} 文字以内`);
    return;
  }

  console.error(`[check:zenn-title] FAIL: ${violations.length} 件のタイトルが ${LIMIT} 文字を超過`);
  for (const v of violations) {
    console.error(`  ${v.file} (${v.length} chars)`);
    console.error(`    ${v.title}`);
  }
  console.error('');
  console.error(
    '  対処: タイトルを ' + LIMIT + ' 文字以内に短縮する。Zenn は 70 文字を超えるタイトルでデプロイ保存に失敗する。',
  );
  console.error('  詳細: PR #215 を参照');
  process.exit(1);
}

main();
