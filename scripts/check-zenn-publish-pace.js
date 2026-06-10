#!/usr/bin/env node
// Check: Zenn の publish ペース（rate-limit 対策）を 2 モードで集計する。
//
// ■ 2 つの計測モード
//   1) diff モード（BASE_REF 設定時・推奨／CI の release/zenn 宛 PR 用）
//      `git diff <BASE_REF>...HEAD` で「この PR が BASE に新規に持ち込む published:false→true 差分」を数える。
//      実 deploy（release/zenn への merge）で公開される記事数を**日付非依存**で直接計測できる。
//   2) date モード（BASE_REF 未設定時・後方互換／`npm run check` 集約・ローカル確認用）
//      `git log --since=24h` で過去 24h の切替コミットを数える（参考値）。
//
// ■ なぜ diff モードが必要か（date モードの穴）
//   実 deploy=rate-limit 消費は release/zenn への merge だが、published フリップは main 上で
//   コミットされる。AGENTS.md §150/§169 は「フリップを溜めてから後日まとめて sync」を許容するため、
//   date モードだとフリップのコミット日付が 24h 窓外になり、同 deploy で複数記事が公開されても
//   0 件と誤判定して**見逃す**（false negative）。逆に過去 deploy 済みフリップが日付都合で 24h 窓に
//   残ると正当な単一公開を**誤ブロック**する（false positive）。diff モードは release/zenn を
//   base に取るため両方を解消する。詳細: AGENT_LEARNINGS.md 2026-06-08。
//
// ■ 使い方
//   - ローカル: `npm run check:zenn-pace`（date モード・参考表示）
//   - CI（release/zenn 宛 PR）: `BASE_REF=origin/release/zenn STRICT=1 npm run check:zenn-pace`
//   STRICT=1 のときのみ FAIL を fatal(exit 1) にする。
//   注: CI の shallow checkout では履歴/ base 解決が不足するため ci.yml で fetch-depth: 0 を指定。
//
// 閾値の根拠: 文書上の公式 rate-limit は「24h/5本」だが、実観測では release/zenn の
// publish:true 切替が 24h 以内 2 件目で deploy がブロックされた（実効 ~24h/1本）。
// → 安全マージンを実測に倒し WARN=1 / FAIL=2 とする。
// 詳細: AGENT_LEARNINGS.md 2026-05-22 / 2026-06-08、AGENTS.md §「Zenn 公開フロー」。

const { execSync } = require('child_process');

const WARN_THRESHOLD = 1; // これ以上の publish が同一 deploy/24h 内にあると次の公開は hit リスク（実測）
const FAIL_THRESHOLD = 2; // 24h 内 2 件目で deploy ブロックを実観測（実効 rate-limit）

const BASE_REF = process.env.BASE_REF; // 設定時は diff モード（BASE...HEAD の published 差分で実 deploy 数を計測）

// diff/show テキストから `-published: false` + `+published: true` ペアを 1 件として数える共通ロジック。
function countFlipsInDiffText(diff) {
  const lines = diff.split('\n');
  let flips = 0;
  let sawMinus = false;
  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) continue;
    if (line === '-published: false') sawMinus = true;
    else if (line === '+published: true' && sawMinus) {
      flips++;
      sawMinus = false;
    }
  }
  return flips;
}

// ── date モード（後方互換） ──
function listRecentCommits() {
  const out = execSync(
    'git log --since="24 hours ago" --pretty=format:%H -- articles/',
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean);
}

function collectDateMode() {
  const commits = listRecentCommits();
  let totalFlips = 0;
  const detail = [];
  for (const sha of commits) {
    const show = execSync(`git show ${sha} --unified=0 -- 'articles/*.md'`, { encoding: 'utf8' });
    const flips = countFlipsInDiffText(show);
    if (flips > 0) {
      totalFlips += flips;
      const subject = execSync(`git show ${sha} --pretty=format:%s --no-patch`, { encoding: 'utf8' }).trim();
      detail.push(`  ${sha.slice(0, 7)} (${flips}件) ${subject}`);
    }
  }
  return { totalFlips, detail, label: '過去 24h で published: false → true 切替（date モード・参考値）' };
}

// ── diff モード（BASE_REF 設定時・推奨） ──
function collectDiffMode(baseRef) {
  // BASE...HEAD = merge-base(baseRef, HEAD) から HEAD。= この PR が baseRef に新規に持ち込む純差分。
  const diff = execSync(
    `git diff ${baseRef}...HEAD --unified=0 -- 'articles/*.md'`,
    { encoding: 'utf8' },
  );
  const totalFlips = countFlipsInDiffText(diff);
  // どの記事が新規公開されるかの内訳（+published: true を含むファイル名を拾う）
  const detail = [];
  const nameDiff = execSync(
    `git diff ${baseRef}...HEAD --name-only -- 'articles/*.md'`,
    { encoding: 'utf8' },
  ).split('\n').filter(Boolean);
  for (const f of nameDiff) {
    const fileDiff = execSync(`git diff ${baseRef}...HEAD --unified=0 -- '${f}'`, { encoding: 'utf8' });
    if (countFlipsInDiffText(fileDiff) > 0) detail.push(`  + ${f}`);
  }
  return {
    totalFlips,
    detail,
    label: `diff(${baseRef}...HEAD) で新規 published: false → true（実 deploy で公開される記事数）`,
  };
}

function main() {
  const STRICT = process.env.STRICT === '1';
  let result;
  try {
    result = BASE_REF ? collectDiffMode(BASE_REF) : collectDateMode();
  } catch (e) {
    // base 解決失敗（shallow / base 未 fetch）等は誤検知を避けて skip（非ブロッキング）。
    console.warn(`[check:zenn-pace] skip: 計測に失敗（${e.message.split('\n')[0]}）`);
    console.warn('  CI では fetch-depth: 0 と base ブランチの fetch を確認すること。');
    return;
  }

  const { totalFlips, detail, label } = result;
  console.log(`[check:zenn-pace] ${label}: ${totalFlips} 件`);
  for (const line of detail) console.log(line);
  if (BASE_REF) console.log(`  (mode=diff, base=${BASE_REF})`);

  if (totalFlips >= FAIL_THRESHOLD) {
    const head = STRICT ? 'FAIL' : 'WARN(FAIL相当)';
    console.error('');
    console.error(
      `[check:zenn-pace] ${head}: ${totalFlips} 件 ≥ ${FAIL_THRESHOLD} 件で Zenn rate-limit に hit する可能性が高い`,
    );
    console.error('  対処: 公開を 1 記事に絞る／24h あけてから次の publish を release/zenn に merge する');
    console.error('  詳細: AGENT_LEARNINGS.md 2026-05-22 / 2026-06-08「Zenn publish pace」');
    if (STRICT) process.exit(1);
    return;
  }

  if (totalFlips >= WARN_THRESHOLD) {
    console.warn('');
    console.warn(
      `[check:zenn-pace] WARN: ${totalFlips} 件で安全マージン (${WARN_THRESHOLD}) 超過。今後の publish は慎重に分散する`,
    );
    console.warn('  （非ブロッキング。release/zenn 宛 PR で STRICT=1 のときのみ FAIL 閾値で fatal）');
  } else {
    console.log('[check:zenn-pace] OK: pace は安全圏内');
  }
}

main();
