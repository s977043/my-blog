#!/usr/bin/env node
// Warn when guide-type Zenn articles lack a FAQ section.
// Guide-type: タイトルに guide-keyword を含む OR 800 word 以上。
// FAQ present: `## ... FAQ` 見出しが1つ以上 AND `### Q.` が3つ以上。

const fs = require('node:fs');
const path = require('node:path');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
const GUIDE_KEYWORDS = ['ガイド', '導入', '整え方', '作り方', 'ワークフロー', '設計', 'パターン', '運用', '実践'];
const MIN_WORDS_FOR_GUIDE = 800;
const MIN_QA_FOR_FAQ = 3;

const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

const warnings = [];
let okCount = 0;
let skipCount = 0;

for (const file of files) {
  const full = path.join(ARTICLES_DIR, file);
  const text = fs.readFileSync(full, 'utf8');

  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];
  if (!/published:\s*true/.test(fm)) {
    skipCount++;
    continue;
  }
  const titleMatch = fm.match(/title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : file;

  const body = text.slice(fmMatch[0].length);
  const wordCount = body.split(/\s+/).length;
  const isGuide = GUIDE_KEYWORDS.some((k) => title.includes(k)) || wordCount >= MIN_WORDS_FOR_GUIDE;
  if (!isGuide) {
    skipCount++;
    continue;
  }

  const hasFaqHeading = /^## .*FAQ/m.test(body) || /^## よくある質問/m.test(body);
  const qCount = (body.match(/^### Q\./gm) || []).length;
  const hasFaq = hasFaqHeading && qCount >= MIN_QA_FOR_FAQ;

  if (hasFaq) {
    okCount++;
  } else {
    warnings.push({ file, title, wordCount, qCount, hasHeading: hasFaqHeading });
  }
}

if (warnings.length === 0) {
  console.log(`[check:faq-coverage] OK: guide-type 全 ${okCount} 記事に FAQ あり (skip ${skipCount} 件)`);
  process.exit(0);
}

console.log(`[check:faq-coverage] WARN: guide-type ${warnings.length} 件に FAQ なし (ok ${okCount} / skip ${skipCount})`);
for (const w of warnings) {
  const reason = w.hasHeading
    ? `FAQ見出しありだが Q&A ${w.qCount} 件 (<${MIN_QA_FOR_FAQ})`
    : 'FAQセクションなし';
  console.log(`  - ${w.file} (${w.wordCount} words): ${reason}`);
}
console.log(`[check:faq-coverage] guide-type 判定: title に [${GUIDE_KEYWORDS.join('/')}] を含む or ${MIN_WORDS_FOR_GUIDE}+ words`);
console.log(`[check:faq-coverage] NOTE: WARN は強制力なし、新規記事のリマインダー用途`);
