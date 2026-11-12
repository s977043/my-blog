#!/usr/bin/env node
// note の公開版本文に、期待する文言が反映されたかを照合する。
//
// 使い方:
//   node scripts/check-note-live.js <guid> --absent <文字列>... --present <文字列>...
//
// https://note.com/api/v3/notes/<guid> の data.body を取得し、タグを除いて実体参照を戻した
// 読者に見える文字列で、
// --absent の文字列が 0 件、--present の文字列が 1 件以上なら exit 0。
// どれかを満たさない・取得できない場合は各条件の結果を出して exit 1。
//
// --draft は非対応（下書き API は認証が要る）。下書きはログイン済みブラウザで
// fetch('https://note.com/api/v3/notes/<guid>?draft=true', { credentials: 'include' }) で照合する。
//
// 外部 API に依存するため npm run check の集約には入れない。

const https = require('node:https');

function parseArgs(argv) {
  const args = { guid: null, absent: [], present: [], draft: false };
  let mode = null;
  for (const a of argv) {
    if (a === '--draft') args.draft = true;
    else if (a === '--absent' || a === '--present') mode = a.slice(2);
    else if (mode) args[mode].push(a);
    else if (!args.guid) args.guid = a;
    else throw new Error(`不明な引数: ${a}`);
  }
  return args;
}

function fetchBody(guid) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://note.com/api/v3/notes/${guid}`,
      { headers: { 'User-Agent': 'note-live-check' }, timeout: 10000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))?.data?.body;
            if (typeof body !== 'string') throw new Error('data.body がない');
            resolve(body);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

// 読者に見える文字列で照合する。HTML のままだと、実体参照（&gt; など）やタグをまたぐ文言が
// 見かけ上 0 件になり、消えていない旧文言を「消えた」と判定してしまう。
function visibleText(html) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const cp = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
      }
      return named[e.toLowerCase()] ?? m;
    });
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`[check-note-live] ${e.message}`);
    process.exit(1);
  }
  if (args.draft) {
    console.error('[check-note-live] --draft は非対応（認証が要る）。下書きはログイン済みブラウザで ?draft=true を fetch して照合する');
    process.exit(1);
  }
  if (!/^n[0-9a-f]{12}$/.test(args.guid || '') || args.absent.length + args.present.length === 0) {
    console.error('usage: check-note-live.js <guid> --absent <文字列>... --present <文字列>...');
    process.exit(1);
  }

  let body;
  try {
    body = visibleText(await fetchBody(args.guid));
  } catch (e) {
    console.error(`[check-note-live] ${args.guid} の取得に失敗: ${e.message}`);
    process.exit(1);
  }

  let ok = true;
  for (const s of args.absent) {
    const n = count(body, s);
    const pass = n === 0;
    ok = ok && pass;
    console.log(`${pass ? 'OK  ' : 'FAIL'} absent  (${n} 件) ${s}`);
  }
  for (const s of args.present) {
    const n = count(body, s);
    const pass = n > 0;
    ok = ok && pass;
    console.log(`${pass ? 'OK  ' : 'FAIL'} present (${n} 件) ${s}`);
  }
  process.exit(ok ? 0 : 1);
}

main();
