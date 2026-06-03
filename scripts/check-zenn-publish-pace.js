#!/usr/bin/env node
// Check: 過去 24h で `articles/*.md` の `published: false → true` 切替コミットが
// 何件あるかを集計する。Zenn rate-limit 対策。
//
// 使い方: 新規 publish 系 PR を作る前に `npm run check:zenn-pace` で確認する。
// `npm run check`（集約）には組み込まない: 既存記事の修正 PR でも検査してしまい、
// main 運用での誤検知になるため意図的に除外している（開発者が単独実行する想定）。
//
// 閾値の根拠: 文書上の公式 rate-limit は「24h/5本」だが、実観測では release/zenn の
// publish:true 切替が 24h 以内 2 件目で deploy がブロックされた（実効 ~24h/1本）。
// → 安全マージンを実測に倒し WARN=1 / FAIL=2 とする。
// 詳細: AGENT_LEARNINGS.md 2026-05-22「Zenn rate-limit は実効 24h/2本でも hit する」、
//       AGENTS.md §「Zenn 公開フロー」。
//
// memory/ 参照（feedback_zenn_publish_rate_pacing.md 等）はリポジトリ外の個人 auto-memory
// 領域であり、CI/他者環境には存在しない点に注意。

const { execSync } = require('child_process');

const WARN_THRESHOLD = 1; // これ以上の publish が 24h 内にあると次の公開は hit リスク（実測）
const FAIL_THRESHOLD = 2; // 24h 内 2 件目で deploy ブロックを実観測（実効 rate-limit）

function listRecentCommits() {
  const out = execSync(
    'git log --since="24 hours ago" --pretty=format:%H -- articles/',
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean);
}

function countPublishFlips(sha) {
  const diff = execSync(
    `git show ${sha} --unified=0 -- 'articles/*.md'`,
    { encoding: 'utf8' },
  );
  // 1 commit 内の `-published: false` + `+published: true` ペアを 1 件として数える
  // ファイルごとに対になっているはずなので、+published: true の件数で代用
  const lines = diff.split('\n');
  let flips = 0;
  let sawMinus = false;
  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) continue;
    if (line === '-published: false') sawMinus = true;
    else if (line === '+published: true' && sawMinus) {
      flips++;
      sawMinus = false;
    } else if (line.startsWith('---') || line.startsWith('+++') || line === '') {
      // skip
    }
  }
  return flips;
}

function main() {
  const commits = listRecentCommits();
  let totalFlips = 0;
  const flipCommits = [];

  for (const sha of commits) {
    const flips = countPublishFlips(sha);
    if (flips > 0) {
      totalFlips += flips;
      const subject = execSync(
        `git show ${sha} --pretty=format:%s --no-patch`,
        { encoding: 'utf8' },
      ).trim();
      flipCommits.push({ sha: sha.slice(0, 7), flips, subject });
    }
  }

  console.log(`[check:zenn-pace] 過去 24h で published: false → true 切替: ${totalFlips} 件`);
  for (const c of flipCommits) {
    console.log(`  ${c.sha} (${c.flips}件) ${c.subject}`);
  }

  if (totalFlips >= FAIL_THRESHOLD) {
    console.error('');
    console.error(
      `[check:zenn-pace] FAIL: ${totalFlips} 件 ≥ ${FAIL_THRESHOLD} 件で Zenn rate-limit に hit する可能性が高い`,
    );
    console.error('  対処: 24h あけてから次の publish 系 PR を release/zenn に merge する');
    console.error('  詳細: memory/reference_zenn_rate_limit_spec.md');
    process.exit(1);
  }

  if (totalFlips >= WARN_THRESHOLD) {
    console.warn('');
    console.warn(
      `[check:zenn-pace] WARN: ${totalFlips} 件で安全マージン (${WARN_THRESHOLD}) 超過。今後の publish は慎重に分散する`,
    );
    console.warn('  詳細: memory/feedback_zenn_publish_rate_pacing.md');
  } else {
    console.log('[check:zenn-pace] OK: pace は安全圏内');
  }
}

main();
