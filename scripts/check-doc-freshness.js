#!/usr/bin/env node
// Lint: ドキュメント横断で「Zenn deploy が main 直結である」前提の古い記述を検出。
// 2026-05-07 から release/zenn ブランチ運用に切替済み（PR #199）。
// 古い記述が残っていると次回作業者が誤運用する。
//
// 検出対象パターン（古い記述）:
//   - "main へのpush.*Zenn"
//   - "main にマージ.*Zenn (反映|同期|deploy|デプロイ)"
//   - "git push でZenn"（ただし `release/zenn` を含む文脈は許可）
//
// チェック対象:
//   - ルート: README.md / AGENTS.md / CLAUDE.md / AGENT_LEARNINGS.md
//   - docs/*.md
//   - articles/README.md / Qiita/README.md / articles_note/README.md
//   - .claude/skills/*/SKILL.md / .claude/agents/*.md / .claude/commands/*.md

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TARGETS = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'AGENT_LEARNINGS.md',
  'articles/README.md',
  'Qiita/README.md',
  'articles_note/README.md',
];

function collectDocsDir(rel) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(rel, f));
}

function collectClaudeDocs() {
  const out = [];
  const skillsDir = path.join(ROOT, '.claude/skills');
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir)) {
      const skillFile = path.join('.claude/skills', d, 'SKILL.md');
      if (fs.existsSync(path.join(ROOT, skillFile))) out.push(skillFile);
    }
  }
  for (const sub of ['.claude/agents', '.claude/commands']) {
    const dir = path.join(ROOT, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.md')) out.push(path.join(sub, f));
    }
  }
  return out;
}

const FILES = [
  ...TARGETS,
  ...collectDocsDir('docs'),
  ...collectClaudeDocs(),
];

// 古い記述パターン（2026-05-07 以降は release/zenn が deploy 対象）
// ただし `release/zenn` を含む行は許可（新運用の説明）
const STALE_PATTERNS = [
  {
    name: 'main直結 deploy 記述',
    re: /(?:main へ?の?push.*Zenn|main にマージ.*Zenn.*(?:反映|同期|deploy|デプロイ)|main へ?の?push.*?(?:自動)?デプロイ)/,
    allowIfContains: /release\/zenn/, // 同行に release/zenn があれば説明文として許可
  },
];

function lintFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return [];
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // コードブロック / 引用 / 履歴 の中は除外（簡易: > / `^\s*```` 行スキップは省略、否定パターンで対応）
    if (/^>/.test(line)) continue; // 引用行
    for (const p of STALE_PATTERNS) {
      if (p.re.test(line)) {
        if (p.allowIfContains && p.allowIfContains.test(line)) continue;
        violations.push({ line: i + 1, text: line.trim(), pattern: p.name });
      }
    }
  }
  return violations;
}

function main() {
  let total = 0;
  const report = [];
  for (const rel of FILES) {
    const v = lintFile(rel);
    if (v.length > 0) {
      total += v.length;
      report.push({ file: rel, violations: v });
    }
  }

  if (total === 0) {
    console.log('[check:doc-freshness] OK: stale "main direct deploy" 記述なし');
    return;
  }

  console.error(
    `[check:doc-freshness] FAIL: ${total} 件の古い記述が検出されました（main 直結 deploy 前提）`,
  );
  console.error(
    '  2026-05-07 から Zenn は release/zenn ブランチが deploy 対象（PR #199）。',
  );
  console.error('  詳細: AGENTS.md §「Zenn 公開フロー（release/zenn ブランチ経由）」');
  console.error('');
  for (const entry of report) {
    console.error(`  ${entry.file}`);
    for (const v of entry.violations) {
      console.error(`    L${v.line} [${v.pattern}]: ${v.text}`);
    }
  }
  process.exit(1);
}

main();
