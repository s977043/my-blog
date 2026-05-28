#!/usr/bin/env node
// Qiita ローカル (Qiita/public/*.md) と Qiita リモートの本文 drift を検知する。
//
// 「コミット済みだが publish:qiita 未実行」でローカルがリモートより進んでいる状態を WARN する。
// ネットワーク不可・QIITA_TOKEN 未設定の環境では skip（CI 以外で誤検知させない）。
//
// 終了コード:
//   0 = drift なし、または検査不能（ネットワーク不可 / token なし）でスキップ
//   0 = drift あり（WARN のみ、強制力なし。CI を止めない）
//
// 環境変数:
//   STRICT=1  drift 検出時に exit 1（CI で厳格に止めたい場合）

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const PUBLIC_DIR = path.join(__dirname, '..', 'Qiita', 'public');
const STRICT = process.env.STRICT === '1';

function stripFrontmatter(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? text.slice(m[0].length) : text;
}

function fetchItem(id) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://qiita.com/api/v2/items/${id}`,
      { headers: { 'User-Agent': 'qiita-drift-check' }, timeout: 8000 },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function normalize(s) {
  // 改行・末尾空白の差異を無視して本文の実質差分だけ見る
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

async function main() {
  const files = fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.md'));
  const drifted = [];
  let checked = 0;
  let skipped = 0;

  for (const file of files) {
    const full = path.join(PUBLIC_DIR, file);
    const text = fs.readFileSync(full, 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const id = (fm[1].match(/^id:\s*(.+)$/m) || [])[1]?.trim();
    const ignore = /ignorePublish:\s*true/.test(fm[1]);
    if (!id || id === 'null' || ignore) {
      skipped++;
      continue;
    }

    const item = await fetchItem(id);
    // item 取得失敗 or body 空（レート制限・一時障害）は drift 誤検知を避けてスキップ
    if (!item || !item.body) {
      skipped++;
      continue;
    }
    checked++;

    const localBody = normalize(stripFrontmatter(text));
    const remoteBody = normalize(item.body);
    if (localBody !== remoteBody) {
      drifted.push({ file, id });
    }
  }

  if (drifted.length === 0) {
    console.log(`[check:qiita-drift] OK: drift なし (checked ${checked} / skip ${skipped})`);
    process.exit(0);
  }

  console.log(`[check:qiita-drift] WARN: ${drifted.length} 件でローカルとQiitaリモートに本文 drift (checked ${checked} / skip ${skipped})`);
  for (const d of drifted) {
    console.log(`  - ${d.file} (id: ${d.id}) → npm run publish:qiita -- ${d.file.replace(/\.md$/, '')}`);
  }
  console.log(`[check:qiita-drift] 対処: 上記を publish:qiita で同期。ローカルが正なら updated_at 更新後に公開`);
  process.exit(STRICT ? 1 : 0);
}

main();
