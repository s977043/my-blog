#!/usr/bin/env node
// Lint: Zenn 記事内で note.com/mine_unilabo へのリンクが本文中（末尾リンク集より前）に
// 出現した場合に警告する。規約は AGENTS.md「記事内クロスプラットフォーム参照」節を参照。

const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'articles');
const NOTE_PATTERN = /note\.com\/mine_unilabo/;
const ALLOWED_SECTION_HEADERS =
  /^#{1,3}\s*(参考|参照|関連記事|関連リンク|リンク|References?|See also|おわりに|宣伝|自社メディア)/;

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let inAllowedSection = false;
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^#{1,6}\s/.test(line)) {
      inAllowedSection = ALLOWED_SECTION_HEADERS.test(line);
      continue;
    }

    if (NOTE_PATTERN.test(line) && !inAllowedSection) {
      violations.push({ line: i + 1, text: line.trim() });
    }
  }

  return violations;
}

function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`[check:note-ref] directory not found: ${TARGET_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(TARGET_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(TARGET_DIR, f));

  let totalViolations = 0;
  const report = [];

  for (const file of files) {
    const violations = lintFile(file);
    if (violations.length > 0) {
      totalViolations += violations.length;
      report.push({ file: path.relative(process.cwd(), file), violations });
    }
  }

  if (totalViolations === 0) {
    console.log('[check:note-ref] OK: no note.com/mine_unilabo links outside allowed sections');
    return;
  }

  console.error(
    `[check:note-ref] FAIL: ${totalViolations} note.com link(s) found outside allowed sections`,
  );
  console.error(
    '  Allowed sections: ## 参考 / ## 関連記事 / ## リンク / ## References / ## おわりに / ## 宣伝 / ## 自社メディア',
  );
  console.error('  See AGENTS.md 「記事内クロスプラットフォーム参照」');
  console.error('');
  for (const entry of report) {
    console.error(`  ${entry.file}`);
    for (const v of entry.violations) {
      console.error(`    L${v.line}: ${v.text}`);
    }
  }
  process.exit(1);
}

main();
