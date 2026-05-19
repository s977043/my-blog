#!/usr/bin/env node
// Lint: articles_note/new/**/*.md に Markdown テーブル（GFM table）が含まれていないか検査する。
//
// なぜ必要か:
//   note の WXR インポートは Markdown テーブルを描画できず、取り込み時に
//   セル内容がプレーンな行へ平坦化される（round-trip で体裁が崩れる）。
//   2026-05-15 セッションで「5段階の地図」表が取込 draft で崩れて初めて気づいた。
//   公開後に気づくと手戻りになるため、執筆元 (new/) の段階で WARN する。
//
// 挙動:
//   - articles_note/new/**/*.md のみ対象（drafts/ は note 実体ミラーで既に平坦化済みのため除外）
//   - テーブル検出は WARN（exit 0・非 fatal）。意図的に表を残し公開直前に画像化する運用も
//     あり得るため、ブロックせず気づきを与える方針。
//   - コードフェンス（``` ... ```）内は検査対象外。
//
// 関連: AGENT_LEARNINGS.md「2026-05-15 — note WXR round-trip は Markdown テーブルを平坦化する」

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const TARGET_DIR = path.join(REPO_ROOT, 'articles_note', 'new');

/** 再帰的に *.md を集める */
function collectMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...collectMarkdown(full));
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** GFM テーブルの区切り行か（| --- | :--: | 形式） */
function isTableDelimiter(line) {
  const t = line.trim();
  if (!t.includes('|') || !t.includes('-')) return false;
  // 例: |---|---|  / | :--- | ---: |  / --- | ---
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(t);
}

function findTables(content) {
  const lines = content.split('\n');
  const hits = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // 区切り行 + 直前にヘッダー行（| を含む）があれば GFM テーブルとみなす
    if (isTableDelimiter(line) && i > 0 && lines[i - 1].includes('|')) {
      hits.push(i); // 区切り行（ヘッダーの次行）の行番号 0-based
    }
  }
  return hits;
}

function main() {
  const files = collectMarkdown(TARGET_DIR);
  const report = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const hits = findTables(content);
    if (hits.length > 0) {
      report.push({
        file: path.relative(REPO_ROOT, file),
        lines: hits.map((h) => h), // header は h、区切りは h+1（1-based 表示）
      });
    }
  }

  if (report.length === 0) {
    console.log('[check:note-tables] OK: articles_note/new に note 非対応の Markdown テーブルなし');
    return;
  }

  console.warn('[check:note-tables] WARN: Markdown テーブルを検出しました');
  console.warn('  note の WXR インポートはテーブルを描画できず、取り込み時にプレーンな行へ平坦化されます。');
  console.warn('  公開前にリスト化／画像化するか、平坦化を許容するか判断してください。');
  console.warn('  参照: AGENT_LEARNINGS.md 2026-05-15「note WXR round-trip は Markdown テーブルを平坦化する」');
  console.warn('');
  for (const entry of report) {
    console.warn(`  ${entry.file}`);
    for (const ln of entry.lines) {
      // ln は区切り行 0-based。ヘッダー行は ln（=区切りの前行）→ 1-based でヘッダー = ln, 区切り = ln+1
      console.warn(`    L${ln} 付近: テーブル（ヘッダー行 + 区切り行）`);
    }
  }
  console.warn('');
  // WARN のみ。exit 0（non-fatal）— ブロックせず気づきを与える方針。
}

main();
