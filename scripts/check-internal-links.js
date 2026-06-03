#!/usr/bin/env node
// Check: 記事内の「内部リンク切れ」を検出する。リネーム（例: #361 River Reviewer→River Review）で
// slug 参照や相互リンクが壊れる事故クラスを機械検知する。
//
// `npm run check` に組み込むため、誤検知ゼロを最優先に保守的設計とする:
//   FATAL（exit 1）にするのは、リポジトリ内で静的に実在検証できる参照のみ:
//     1. Zenn 記事間リンク  /articles/<slug>  および  https://zenn.dev/minewo/articles/<slug>
//        → articles/<slug>.md の実在を検証
//     2. Zenn 画像の site-absolute 参照  /images/<path>  → images/<path> の実在を検証
//   外部URL（qiita.com / note.com / 一般サイト）・相対パス・アンカーは検証対象外（FP 回避）。
//
//   WARN（非 FATAL）: 記事本文ディレクトリにリネーム前の旧表記が残っていないかを参考表示。
//     旧表記リストは RENAMED_TERMS で管理（slug/URL に残る正規の語は除外する設計）。
//
// 対象: articles/**.md, Qiita/public/*.md（.remote 除く）, articles_note/**.md

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// 旧表記 WARN（表示文字列のみ。slug/URL に含まれる小文字 river-reviewer は正規参照なので対象外）
const RENAMED_TERMS = ['River Reviewer'];

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.remote' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function articleFiles() {
  const acc = [];
  walk(path.join(ROOT, 'articles'), acc);
  walk(path.join(ROOT, 'Qiita', 'public'), acc);
  walk(path.join(ROOT, 'articles_note'), acc);
  return acc;
}

const LINK_RE = /\]\(\s*([^)\s]+)/g;

function extractTargets(content) {
  const targets = [];
  let m;
  while ((m = LINK_RE.exec(content)) !== null) {
    targets.push(m[1]);
  }
  return targets;
}

function checkTarget(target) {
  // アンカー・クエリを除去
  const clean = target.split('#')[0].split('?')[0];
  if (!clean) return null;

  // 1. Zenn 記事間リンク（site-absolute / フル URL 両対応）
  let slug = null;
  const abs = clean.match(/^\/articles\/([A-Za-z0-9_-]+)$/);
  const full = clean.match(/^https?:\/\/zenn\.dev\/minewo\/articles\/([A-Za-z0-9_-]+)$/);
  if (abs) slug = abs[1];
  else if (full) slug = full[1];
  if (slug) {
    const exists = fs.existsSync(path.join(ROOT, 'articles', `${slug}.md`));
    return exists ? null : `Zenn 記事リンク切れ: ${target} → articles/${slug}.md が存在しない`;
  }

  // 2. Zenn 画像の site-absolute 参照
  const img = clean.match(/^\/(images\/[^)]+)$/);
  if (img) {
    const exists = fs.existsSync(path.join(ROOT, img[1]));
    return exists ? null : `画像リンク切れ: ${target} → ${img[1]} が存在しない`;
  }

  // それ以外は検証対象外（外部URL・相対パス・アンカー）
  return null;
}

function main() {
  const files = articleFiles();
  const errors = [];
  const warnings = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');

    for (const target of extractTargets(content)) {
      const err = checkTarget(target);
      if (err) errors.push(`  ${rel}: ${err}`);
    }

    for (const term of RENAMED_TERMS) {
      if (content.includes(term)) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.includes(term)) {
            warnings.push(`  ${rel}:${i + 1}: 旧表記「${term}」が残存`);
          }
        });
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[check:internal-links] WARN: 旧表記の残存 ${warnings.length} 件（要確認、非ブロッキング）`);
    warnings.slice(0, 50).forEach((w) => console.warn(w));
    if (warnings.length > 50) console.warn(`  ...他 ${warnings.length - 50} 件`);
  }

  if (errors.length > 0) {
    console.error(`[check:internal-links] FAIL: 内部リンク切れ ${errors.length} 件`);
    errors.forEach((e) => console.error(e));
    return 1;
  }

  console.log(`[check:internal-links] OK: 内部リンク切れなし（checked ${files.length} files）`);
  return 0;
}

process.exit(main());
