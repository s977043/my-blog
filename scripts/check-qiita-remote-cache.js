#!/usr/bin/env node
// Check: qiita-cli `publish` の pre-sync 巻き戻り事故を publish 前に検知する。
//
// 背景（AGENT_LEARNINGS.md 2026-06-03）:
//   `qiita publish` は冒頭で全記事 pull（syncArticlesFromQiita）を行い、
//   その syncItem は「作業ファイル == .remote/<id>.md キャッシュ」のとき
//   サーバ内容で作業ファイルを上書きする。
//   一括 sed/置換スクリプトが .remote/ キャッシュも作業ファイルと同じ内容に
//   書き換えてしまうと、publish 冒頭の pre-sync がサーバ旧内容で working を
//   巻き戻し、旧内容を再投稿してしまう（リネームが永久にサーバへ届かない）。
//
// 検知ロジック:
//   各 Qiita/public/<basename>.md について、
//     - working（updated_at 無視）== .remote/<id>.md（updated_at 無視）  ← pre-sync が上書きする条件
//     - かつ working（updated_at 無視）!= HEAD コミット版            ← 未公開のローカル編集がある
//   の両方を満たすファイルは、.remote キャッシュが（qiita-cli 以外で）書き換えられた
//   疑いが強く、このまま publish すると巻き戻る。FAIL で列挙し復旧手順を案内する。
//
// 使い方: publish:qiita の wrapper（scripts/publish-qiita.sh）が publish 直前に呼ぶ。
//         手動確認は `node scripts/check-qiita-remote-cache.js`。

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(process.cwd(), 'Qiita', 'public');
const REMOTE_DIR = path.join(PUBLIC_DIR, '.remote');

// updated_at 行を除いて比較用に正規化（qiita-cli は updatedAt を等価判定に含めない）
function normalize(content) {
  return content
    .split('\n')
    .filter((line) => !/^updated_at:\s*/.test(line))
    .join('\n')
    .trim();
}

function getId(content) {
  const m = content.match(/^id:\s*(.+)\s*$/m);
  if (!m) return null;
  const v = m[1].trim();
  if (v === 'null' || v === '' || v === "''" || v === '""') return null;
  return v.replace(/['"]/g, '');
}

function headVersion(relPath) {
  try {
    return execSync(`git show HEAD:"${relPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return null; // HEAD に無い（新規ファイル）
  }
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log('[check:qiita-remote-cache] Qiita/public/ が無いため skip');
    return 0;
  }
  const files = fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => f.endsWith('.md'));

  const flagged = [];
  for (const f of files) {
    const abs = path.join(PUBLIC_DIR, f);
    const working = fs.readFileSync(abs, 'utf8');
    const id = getId(working);
    if (!id) continue; // 未公開（id 無し）はサーバキャッシュも無いので対象外

    const remotePath = path.join(REMOTE_DIR, `${id}.md`);
    if (!fs.existsSync(remotePath)) continue; // キャッシュ未取得は対象外
    const remote = fs.readFileSync(remotePath, 'utf8');

    const relPath = `Qiita/public/${f}`;
    const head = headVersion(relPath);

    const nW = normalize(working);
    const nR = normalize(remote);
    const nH = head === null ? null : normalize(head);

    // pre-sync が working を上書きする条件 && 未公開のローカル編集がある
    if (nW === nR && nH !== null && nW !== nH) {
      flagged.push({ file: relPath, id });
    }
  }

  if (flagged.length > 0) {
    console.error(
      '[check:qiita-remote-cache] FAIL: .remote キャッシュが手編集された疑いがあります。',
    );
    console.error(
      '  このまま publish すると pre-sync がサーバ旧内容で作業ツリーを巻き戻し、旧内容が再投稿されます。',
    );
    console.error('  対象:');
    flagged.forEach((x) => {
      console.error(`    - ${x.file} (id: ${x.id})`);
    });
    console.error('');
    console.error('  復旧手順:');
    console.error('    1) 作業ファイルが意図した内容（最新）であることを確認');
    console.error(
      '    2) .remote キャッシュをサーバ実体へ戻す: `npm run pull:qiita`（または該当 .remote/<id>.md を削除）',
    );
    console.error(
      '    3) working と .remote が相違することを確認してから `npm run publish:qiita -- <slug> --force`',
    );
    console.error(
      '  詳細: AGENT_LEARNINGS.md 2026-06-03「qiita publish の pre-sync 巻き戻し」',
    );
    return 1;
  }

  console.log(
    `[check:qiita-remote-cache] OK: pre-sync 巻き戻りリスクなし（checked ${files.length}）`,
  );
  return 0;
}

process.exit(main());
