#!/usr/bin/env node
// 週次公開スケジューラのコアロジック。
// 仕様: docs/weekly-publish-schedule.md / キュー: docs/publish-queue.md
//
// 使い方:
//   node scripts/weekly-publish.mjs notify              # 次エントリの通知用サマリを stdout に出す
//   node scripts/weekly-publish.mjs publish [--dry-run]  # 次エントリを公開（--dry-run 既定 OFF だが CI は明示渡し推奨）
//
// 設計方針:
//   - 取り消し困難な外部公開のため、publish は --execute を明示しない限り dry-run
//   - Qiita = qiita CLI（要 QIITA_TOKEN）。Zenn = published_at 設定 + release/zenn 反映は人手/承認ゲート前提
//   - rate-limit: publish 前に npm run check:zenn-pace を実行し FAIL なら中止
//   - キュー前進は publish 成功時のみ

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const QUEUE = path.join(REPO, 'docs/publish-queue.md');

function fail(msg) {
  console.error(`[weekly-publish] ERROR: ${msg}`);
  process.exit(1);
}

/** publish-queue.md の ## Queue 先頭エントリを構造化して返す */
function parseQueue() {
  if (!existsSync(QUEUE)) fail('docs/publish-queue.md が見つからない');
  const text = readFileSync(QUEUE, 'utf8');
  // 見出しは行頭アンカーで判定（本文中の `## Queue` 言及を誤検出しない）
  const qm = text.match(/^## Queue\s*$/m);
  const dm = text.match(/^## Done\s*$/m);
  if (!qm || !dm) fail('publish-queue.md の ## Queue / ## Done 見出しが不正');
  const qStart = qm.index + qm[0].length;
  const qEnd = dm.index;
  if (qEnd <= qStart) fail('publish-queue.md のセクション順序が不正');
  const body = text.slice(qStart, qEnd);

  const skip = body.match(/^- \[SKIP\]\s*(.*)$/m);
  if (skip) return { kind: 'skip', reason: skip[1].trim(), raw: text };

  // 最初の "- platform:" ブロックを拾う
  const m = body.match(/- platform:\s*(\S+)[\s\S]*?basename:\s*(\S+)[\s\S]*?path:\s*(\S+)[\s\S]*?review_class:\s*(\S+)[\s\S]*?goal_dod:\s*(.+)/);
  if (!m) return { kind: 'empty', raw: text };
  return {
    kind: 'entry',
    platform: m[1].trim(),
    basename: m[2].trim(),
    path: m[3].trim(),
    review_class: m[4].trim(),
    goal_dod: m[5].trim(),
    raw: text,
  };
}

function zennPaceOk() {
  try {
    execSync('npm run --silent check:zenn-pace', { cwd: REPO, stdio: 'pipe' });
    return true;
  } catch (e) {
    const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    return !/FAIL/.test(out);
  }
}

function cmdNotify() {
  const q = parseQueue();
  if (q.kind === 'empty') {
    console.log('QUEUE_EMPTY: 公開キューが空です。Rolling roadmap から補充してください。');
    return;
  }
  if (q.kind === 'skip') {
    console.log(`QUEUE_SKIP: 今週はスキップ指定 — ${q.reason}`);
    return;
  }
  const pace = zennPaceOk() ? 'OK' : 'WARN/FAIL（公開時に再判定・FAILなら翌週送り）';
  console.log(
    [
      '## 週次公開 承認リクエスト（金 18:00 JST 予定）',
      '',
      `- 媒体: **${q.platform}**`,
      `- 記事: \`${q.path}\``,
      `- レビュークラス: ${q.review_class}`,
      `- Goal-DoD: ${q.goal_dod}`,
      `- zenn-pace 事前: ${pace}`,
      '',
      '### 承認手順',
      '1. 記事内容を最終確認（必要なら修正コミット）',
      '2. Actions の `weekly-publish` 実行を Environment `production-publish` で **Approve**',
      '3. 中止する場合は Approve しない（キュー据え置き）。特定週スキップは publish-queue.md 先頭に `- [SKIP] 理由`',
    ].join('\n'),
  );
}

function publishQiita(entry, execute) {
  const abs = path.join(REPO, entry.path);
  if (!existsSync(abs)) fail(`記事が見つからない: ${entry.path}`);
  let md = readFileSync(abs, 'utf8');

  const now = new Date().toISOString().replace(/\.\d+Z$/, '+09:00'); // 簡易（CIはTZ=Asia/Tokyo前提）
  const before = md;
  md = md.replace(/^ignorePublish:\s*true\s*$/m, 'ignorePublish: false');
  md = md.replace(/^updated_at:\s*.*$/m, `updated_at: '${now}'`);
  // 公開当日チェックリストの HTML コメントブロックを削除
  md = md.replace(/<!--\s*\n公開当日チェックリスト[\s\S]*?-->\n?/m, '');

  if (before === md) {
    console.log('[qiita] frontmatter に変更なし（既に公開設定の可能性）。続行。');
  }
  if (!execute) {
    console.log(`[qiita][dry-run] ${entry.basename}: ignorePublish→false / updated_at 更新 / 当日コメント削除 を適用予定`);
    console.log('[qiita][dry-run] npx qiita publish をスキップ');
    return;
  }
  writeFileSync(abs, md);
  if (!process.env.QIITA_TOKEN) fail('QIITA_TOKEN secret 未設定。リポジトリ Secrets に追加が必要');
  execSync(`npx qiita publish ${entry.basename} --root Qiita`, { cwd: REPO, stdio: 'inherit' });
  console.log(`[qiita] 公開実行: ${entry.basename}`);
}

function publishZenn(entry, execute) {
  const abs = path.join(REPO, entry.path);
  if (!existsSync(abs)) fail(`記事が見つからない: ${entry.path}`);
  let md = readFileSync(abs, 'utf8');
  // 金曜 18:00 JST を published_at に設定（予約公開）
  const d = new Date();
  const fri = new Date(d);
  fri.setUTCHours(9, 0, 0, 0); // 09:00 UTC = 18:00 JST
  const stamp = `${fri.getUTCFullYear()}-${String(fri.getUTCMonth() + 1).padStart(2, '0')}-${String(fri.getUTCDate()).padStart(2, '0')} 18:00`;
  if (/^published_at:/m.test(md)) md = md.replace(/^published_at:.*$/m, `published_at: "${stamp}"`);
  else md = md.replace(/^published:\s*true\s*$/m, `published: true\npublished_at: "${stamp}"`);

  if (!zennPaceOk()) {
    console.log('[zenn] check:zenn-pace FAIL → 今週は公開せずキュー据え置き（rate-limit 安全弁）');
    process.exit(2);
  }
  if (!execute) {
    console.log(`[zenn][dry-run] ${entry.basename}: published_at="${stamp}" を設定予定 / release/zenn 反映は承認後の別手順`);
    return;
  }
  writeFileSync(abs, md);
  console.log(`[zenn] published_at=${stamp} 設定。release/zenn への反映は workflow の承認後ステップで実施`);
}

function advanceQueue(entry) {
  const text = readFileSync(QUEUE, 'utf8');
  const block = new RegExp(
    `- platform:\\s*${entry.platform}[\\s\\S]*?goal_dod:\\s*${entry.goal_dod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
  );
  const removed = text.replace(block, '');
  const today = new Date().toISOString().slice(0, 10);
  const doneLine = `- ${today} ${entry.platform} ${entry.basename}\n`;
  const out = removed.replace(/## Done\n/, `## Done\n${doneLine}`);
  writeFileSync(QUEUE, out);
  console.log(`[queue] ${entry.basename} を Done へ移動`);
}

function cmdPublish(execute) {
  const q = parseQueue();
  if (q.kind === 'empty') {
    console.log('QUEUE_EMPTY: 公開対象なし。終了。');
    return;
  }
  if (q.kind === 'skip') {
    // SKIP 行を消費して終了（次回は次エントリ）
    const text = readFileSync(QUEUE, 'utf8').replace(/^- \[SKIP\].*\n?/m, '');
    writeFileSync(QUEUE, text);
    console.log(`QUEUE_SKIP 消費: ${q.reason}`);
    return;
  }
  if (q.platform === 'qiita') publishQiita(q, execute);
  else if (q.platform === 'zenn') publishZenn(q, execute);
  else fail(`未知の platform: ${q.platform}`);

  if (execute) advanceQueue(q);
  else console.log('[dry-run] キュー前進はスキップ（--execute 時のみ）');
}

const mode = process.argv[2];
const execute = process.argv.includes('--execute');
if (mode === 'notify') cmdNotify();
else if (mode === 'publish') cmdPublish(execute);
else fail('mode は notify | publish');
