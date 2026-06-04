#!/usr/bin/env node
// Check: AGENT_LEARNINGS.md の「📇 テーマ別インデックス」と「## 🧭 学びエントリ」本文の整合を検証する。
//
// 背景:
//   rank8 (PR #371) で非破壊インデックスを追加したが、新規エントリ追加時に
//   インデックスへの登録忘れリスクがある。本 check で登録漏れを WARN 検出する。
//
// 判定ロジック（誤検知ゼロ優先）:
//   1. 本文の `### YYYY-MM-DD —` 見出しから日付を抽出
//   2. インデックス（A〜G テーマ）配下の `- YYYY-MM-DD —` 行から日付を抽出
//   3. 本文の日付が**一切**インデックスに登場しなければ WARN（A〜G いずれにも登録されていない）
//   4. 同日複数エントリが 1 行に圧縮されている場合は OK 判定（実運用パターン）
//
// 集約 `npm run check` に組み込み非ブロッキング。漏れを WARN 表示するのみ。

const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'AGENT_LEARNINGS.md');

if (!fs.existsSync(FILE)) {
  console.log('[check:learnings-index] skip: AGENT_LEARNINGS.md が見つからない');
  process.exit(0);
}

const content = fs.readFileSync(FILE, 'utf8');
const lines = content.split('\n');

// セクションの境界を検出
let indexStart = -1;
let indexEnd = -1;
let bodyStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (/^## 📇 テーマ別インデックス/.test(lines[i])) indexStart = i;
  else if (/^## 🧭 学びエントリ/.test(lines[i])) {
    if (indexStart >= 0 && indexEnd < 0) indexEnd = i;
    bodyStart = i;
  }
}

if (indexStart < 0 || bodyStart < 0) {
  console.log('[check:learnings-index] skip: インデックス or 学びエントリ見出しが無い');
  process.exit(0);
}

// インデックス区間の `- YYYY-MM-DD —` 行から日付を収集
const indexDates = new Set();
const indexBlock = lines.slice(indexStart, indexEnd >= 0 ? indexEnd : bodyStart);
for (const line of indexBlock) {
  const m = line.match(/^-\s+(\d{4}-\d{2}-\d{2})\s/);
  if (m) indexDates.add(m[1]);
}

// 本文の `### YYYY-MM-DD — タイトル ...` 見出し（テンプレ例外）から日付と見出しを収集
const bodyEntries = [];
const bodyBlock = lines.slice(bodyStart);
for (let i = 0; i < bodyBlock.length; i++) {
  const line = bodyBlock[i];
  const m = line.match(/^### (\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/);
  if (!m) continue;
  // テンプレート行（`### YYYY-MM-DD —` プレースホルダ）はスキップ
  if (line.includes('YYYY-MM-DD')) continue;
  bodyEntries.push({ date: m[1], title: m[2].trim(), line: bodyStart + i + 1 });
}

const missing = bodyEntries.filter((e) => !indexDates.has(e.date));

if (missing.length === 0) {
  console.log(
    `[check:learnings-index] OK: 本文 ${bodyEntries.length} エントリすべてインデックスに日付登録あり`,
  );
  process.exit(0);
}

console.warn(
  `[check:learnings-index] WARN: インデックス未登録の日付を持つエントリ ${missing.length} 件`,
);
console.warn(
  '  ※ rank8 のテーマ別インデックス（A〜G）に該当日付の登録を追加すると発見性が上がります（非ブロッキング）',
);
for (const e of missing) {
  console.warn(`  AGENT_LEARNINGS.md:${e.line}  ${e.date} — ${e.title}`);
}
process.exit(0);
