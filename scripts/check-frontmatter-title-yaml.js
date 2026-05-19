#!/usr/bin/env node
// Check: Qiita/Zenn 記事 frontmatter の `title` が YAML 安全か検査する。
// 未クオートの title 値に `: `（コロン+空白）や YAML インジケータ先頭文字が
// 含まれると、パーサが title 値をネスト mapping と誤認し frontmatter ブロック
// 全体のパースが崩壊する（qiita-cli では全フィールドが型エラーになり publish 全滅）。
//
// 使い方: `npm run check:fm-title` 単独、または `npm run check` で一括実行。
//
// 経緯: 2026-05-19、Qiita/public/ai-coding-preflight-checklist.md の title
//       「AIコーディング前に確認する5項目: Goal / Scope / ...」に未クオートの
//       `: ` が含まれ、初 publish で全フィールド型エラー（CLI バージョン誤誘導
//       の罠つき）。3 ペルソナ+Codex レビューを通過したのに事前検出できず。
//
// 詳細: AGENT_LEARNINGS.md 2026-05-19 エントリ、PR #273 / #274

const fs = require('fs');
const path = require('path');

// 走査対象: Zenn=articles/, Qiita=Qiita/public/
const TARGETS = [
  { label: 'zenn', dir: path.join(__dirname, '..', 'articles') },
  { label: 'qiita', dir: path.join(__dirname, '..', 'Qiita', 'public') },
];

// 未クオート scalar の先頭に来ると YAML が特殊解釈する文字
const LEADING_INDICATORS = ['#', '[', ']', '{', '}', '&', '*', '!', '|', '>', '%', '@', '`', ',', '?', '-', ':'];

function getRawTitleLine(content) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const fm = fmMatch[1];
  return fm.split('\n').find((line) => line.startsWith('title:')) ?? null;
}

// 未クオート title 値が YAML 危険か判定。危険なら理由文字列、安全なら null。
function diagnose(rawLine) {
  const afterKey = rawLine.slice('title:'.length);
  const value = afterKey.trim();
  if (value === '') return null; // 空 title は別チェックの責務
  // シングル/ダブルクオート始まりはクオート済み＝安全
  if (value.startsWith("'") || value.startsWith('"')) return null;
  // 未クオート: コロン+空白はネスト mapping 誤認の最頻原因
  if (value.includes(': ')) {
    return "未クオートの title に ': '（コロン+空白）が含まれる（YAML がネスト mapping と誤認）";
  }
  // 末尾コロンも mapping キー誤認
  if (value.endsWith(':')) {
    return '未クオートの title が ":" で終わる（YAML が mapping キーと誤認）';
  }
  // 先頭インジケータ文字
  if (LEADING_INDICATORS.includes(value[0])) {
    return `未クオートの title が YAML インジケータ文字 "${value[0]}" で始まる`;
  }
  return null;
}

function main() {
  const violations = [];
  let scanned = 0;

  for (const { label, dir } of TARGETS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
    for (const f of files) {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const rawLine = getRawTitleLine(content);
      if (rawLine === null) continue; // frontmatter / title 行なし
      scanned += 1;
      const reason = diagnose(rawLine);
      if (reason) {
        violations.push({ platform: label, file: f, reason, rawLine: rawLine.trim() });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`[check:fm-title] OK: 全 ${scanned} 記事の title が YAML 安全（未クオート特殊シーケンスなし）`);
    return;
  }

  console.error(`[check:fm-title] FAIL: ${violations.length} 件の title が YAML 危険`);
  for (const v of violations) {
    console.error(`  [${v.platform}] ${v.file}`);
    console.error(`    ${v.rawLine}`);
    console.error(`    → ${v.reason}`);
  }
  console.error('');
  console.error("  対処: title 値をシングルクオートで囲む。例: title: 'foo: bar'");
  console.error('  詳細: AGENT_LEARNINGS.md 2026-05-19 / PR #273 #274');
  process.exit(1);
}

main();
