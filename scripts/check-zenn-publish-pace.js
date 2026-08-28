#!/usr/bin/env node
// Check: Zenn の publish ペース（rate-limit 対策）を 3 つの観点で集計する。
//
// ■ 観点
//   A) 件数モード（従来）: 「この deploy / 過去 24h で何本 publish するか」
//      1) diff モード（BASE_REF 設定時・推奨／CI の release/zenn 宛 PR 用）
//         `git diff <BASE_REF>...HEAD` で「この PR が BASE に新規に持ち込む published:false→true 差分」を数える。
//         実 deploy（release/zenn への merge）で公開される記事数を**日付非依存**で直接計測できる。
//      2) date モード（BASE_REF 未設定時・後方互換／`npm run check` 集約・ローカル確認用）
//         `git log --since=24h` で過去 24h の切替コミットを数える（参考値）。
//   B) 間隔モード（本ファイル後半・2026-08-28 追加）: 「前回公開から何時間経ったか」
//      release/zenn 上の直近 publish コミットの committer date と現在時刻の**実経過時間**を測る。
//
// ■ なぜ diff モードが必要か（date モードの穴 その1・件数側）
//   実 deploy=rate-limit 消費は release/zenn への merge だが、published フリップは main 上で
//   コミットされる。AGENTS.md §150/§169 は「フリップを溜めてから後日まとめて sync」を許容するため、
//   date モードだとフリップのコミット日付が 24h 窓外になり、同 deploy で複数記事が公開されても
//   0 件と誤判定して**見逃す**（false negative）。逆に過去 deploy 済みフリップが日付都合で 24h 窓に
//   残ると正当な単一公開を**誤ブロック**する（false positive）。diff モードは release/zenn を
//   base に取るため両方を解消する。詳細: AGENT_LEARNINGS.md 2026-06-08。
//
// ■ なぜ間隔モードが必要か（date モードの穴 その2・時間側）
//   2026-08-28 08:58 JST の deploy で新規公開が rate-limit で弾かれた（HTTP 403 / API 未出現）。
//   前回公開は 2026-08-27 14:45 JST で、実経過は **18 時間**しかなく
//   `docs/publish-operating-policy.md` の「前回の release/zenn 公開から 24 時間以上あけてマージ」に
//   違反していた。にもかかわらず date モードは「過去 24h で 0 件・OK」と報告した。
//   date モードは日付/コミット時刻の窓で数えるだけで、前回 deploy が窓の外に落ちれば 0 件になる。
//   件数の集計だけでは 24 時間ルールを検証できない。
//   → 「前回 deploy 時刻」を release/zenn の履歴から直接取り、実経過時間で判定する。
//
// ■ 使い方
//   - ローカル: `npm run check:zenn-pace`（date モード + 間隔モード）
//   - CI（release/zenn 宛 PR）: `BASE_REF=origin/release/zenn STRICT=1 npm run check:zenn-pace`
//   - self-test: `npm run test:zenn-pace`（= `node scripts/check-zenn-publish-pace.js --self-test`）
//   STRICT=1 のときのみ FAIL を fatal(exit 1) にする。
//   注: CI の shallow checkout では履歴/ base 解決が不足するため ci.yml で fetch-depth: 0 を指定。
//
// 閾値の根拠（件数側）: 文書上の公式 rate-limit は「24h/5本」だが、実観測では release/zenn の
// publish:true 切替が 24h 以内 2 件目で deploy がブロックされた（実効 ~24h/1本）。
// → 安全マージンを実測に倒し WARN=1 / FAIL=2 とする。
// 詳細: AGENT_LEARNINGS.md 2026-05-22 / 2026-06-08、AGENTS.md §「Zenn 公開フロー」。
// 閾値の根拠（間隔側）: `docs/publish-operating-policy.md` §Rate-limit 遵守 が数値の正本。
// 同ドキュメントから実行時に読み取り、このファイルには数値を二重定義しない（下記 readMinIntervalHours）。

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WARN_THRESHOLD = 1; // これ以上の publish が同一 deploy/24h 内にあると次の公開は hit リスク（実測）
const FAIL_THRESHOLD = 2; // 24h 内 2 件目で deploy ブロックを実観測（実効 rate-limit）

const BASE_REF = process.env.BASE_REF; // 設定時は diff モード（BASE...HEAD の published 差分で実 deploy 数を計測）

// 間隔モードが「前回公開」を探しに行くブランチ。実 deploy は release/zenn への merge で起きるため、
// main ではなく release/zenn の履歴を見る。origin 側を優先（ローカル ref は古いことがある）。
const RELEASE_REFS = ['origin/release/zenn', 'release/zenn'];
const RELEASE_LOG_LIMIT = 80; // 直近この件数まで遡って publish コミットを探す（履歴全走査を避ける）

function repoRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

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

// ── 間隔モード（前回公開からの実経過時間） ──

// 閾値の正本は docs/publish-operating-policy.md。数値をここに書かず、実行時に読み取る。
// 対象行: 「| Zenn PR 間隔 | 前回の release/zenn 公開から **24 時間以上**あけてマージ |」
// 読めない／書式が変わって拾えない場合は null を返し、呼び出し側で「判定不能」として扱う
// （既定値でフォールバックすると、正本が変わったのに古い数値で OK を出す事故になる）。
function parseMinIntervalHours(policyMd) {
  const m = policyMd.match(/前回の\s*release\/zenn\s*公開から\s*\*{0,2}(\d+)\s*時間以上/);
  if (!m) return null;
  const h = Number(m[1]);
  return Number.isFinite(h) && h > 0 ? h : null;
}

function readMinIntervalHours() {
  try {
    const p = path.join(repoRoot(), 'docs/publish-operating-policy.md');
    return parseMinIntervalHours(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// release/zenn 上で「published: false → true を含む直近のコミット」を返す。
// そのコミットが release/zenn に載った時刻 ≒ Zenn deploy 発火時刻 = 前回公開時刻。
// 見つからない／ref を解決できない場合は null（＝判定不能。OK にはしない）。
//
// 取得元に git 履歴を選んだ理由:
//   - オフラインで決定的に取れる（Zenn API はネットワーク依存で、失敗時に「取れなかった」ことを
//     OK と取り違える余地が残る。今回の事故は「見ていないのに OK」が本質なので依存を増やさない）
//   - 実 deploy の発火点＝release/zenn への merge そのものの時刻を測れる
//     （publish-queue.md の Done 行は日付までしかなく 18h/24h の判定ができない）
function findLastPublishOnRelease() {
  let ref = null;
  for (const r of RELEASE_REFS) {
    try {
      execSync(`git rev-parse --verify --quiet ${r}^{commit}`, { stdio: ['ignore', 'ignore', 'ignore'] });
      ref = r;
      break;
    } catch {
      /* 次の候補へ */
    }
  }
  if (!ref) return null;

  const log = execSync(
    `git log ${ref} -n ${RELEASE_LOG_LIMIT} --pretty=format:%H%x09%cI%x09%s -- 'articles/*.md'`,
    { encoding: 'utf8' },
  );
  for (const line of log.split('\n').filter(Boolean)) {
    const [sha, iso, ...rest] = line.split('\t');
    const show = execSync(`git show ${sha} --unified=0 -- 'articles/*.md'`, { encoding: 'utf8' });
    if (countFlipsInDiffText(show) > 0) {
      return { ref, sha, at: new Date(iso), subject: rest.join('\t') };
    }
  }
  return null;
}

// 純関数: 前回公開時刻・現在時刻・閾値・この deploy の新規公開本数から severity を決める。
// 時刻は必ず引数で注入する（実時刻に依存するテストを書かないため）。
//
// severity:
//   'unknown' … 前回公開時刻 or 閾値の正本が取れない。**OK とは言わない**（今回の事故は
//               「見ていないのに OK と出た」ことが本質。判定不能は判定不能として出す）
//   'fail'    … 明確に危険。minHours の半分未満（＝ danger 帯）、または
//               「必要間隔未満なのにこの deploy で新規公開がある」＝ policy 違反の実行そのもの
//   'warn'    … minHours 未満（新規公開を伴わない update deploy 等）
//   'ok'      … minHours 以上経過
function evaluateInterval({ lastPublishAt, now, minHours, pendingPublishCount = 0 }) {
  if (!minHours || !lastPublishAt || Number.isNaN(new Date(lastPublishAt).getTime())) {
    return { severity: 'unknown', elapsedHours: null, minHours: minHours || null };
  }
  const elapsedHours = (new Date(now).getTime() - new Date(lastPublishAt).getTime()) / 3600000;
  // danger 帯 = 正本閾値の半分。独立した数値を置くと正本が変わったときに追随しないため、
  // minHours から導出する（24h 正本なら 12h 未満が danger）。
  const dangerHours = minHours / 2;
  if (elapsedHours >= minHours) return { severity: 'ok', elapsedHours, minHours };
  if (elapsedHours < dangerHours) return { severity: 'fail', elapsedHours, minHours, dangerHours };
  if (pendingPublishCount > 0) return { severity: 'fail', elapsedHours, minHours, dangerHours };
  return { severity: 'warn', elapsedHours, minHours, dangerHours };
}

function formatHours(h) {
  if (h === null || h === undefined) return '不明';
  return `${h.toFixed(1)}h`;
}

function formatAt(d) {
  if (!d) return '不明';
  // ローカルタイムゾーン（JST 運用）で読めるように整形する。
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 間隔モードを実行して出力する。返り値 true = fatal 相当（STRICT 時に exit 1）。
function runIntervalCheck({ pendingPublishCount, strict, now = new Date() }) {
  const minHours = readMinIntervalHours();
  let last = null;
  let lookupError = null;
  try {
    last = findLastPublishOnRelease();
  } catch (e) {
    lookupError = e.message.split('\n')[0];
  }

  const verdict = evaluateInterval({
    lastPublishAt: last ? last.at : null,
    now,
    minHours,
    pendingPublishCount,
  });

  // 何を根拠に判定したかを必ず出す（今回の事故は根拠が出力から読めなかったことも一因）。
  console.log('');
  console.log(
    `[check:zenn-pace] 前回公開: ${formatAt(last && last.at)}` +
      (last ? ` (${last.sha.slice(0, 7)} on ${last.ref})` : '') +
      ` / 経過: ${formatHours(verdict.elapsedHours)}` +
      ` / 必要間隔: ${minHours ? `${minHours}h` : '不明'}` +
      ' (正本: docs/publish-operating-policy.md §Rate-limit 遵守)',
  );
  if (last) console.log(`  前回公開コミット: ${last.subject}`);

  if (verdict.severity === 'unknown') {
    console.warn(
      '[check:zenn-pace] UNKNOWN: 24h 間隔を検証できなかった（OK ではない）。' +
        `${lookupError ? ` 取得エラー: ${lookupError}.` : ''}` +
        `${minHours ? '' : ' 閾値の正本 docs/publish-operating-policy.md を読めなかった。'}` +
        `${last ? '' : ' release/zenn 上に publish コミットを見つけられなかった（未 fetch / shallow の可能性）。'}`,
    );
    console.warn('  対処: `git fetch origin release/zenn`（CI は fetch-depth: 0）後に再実行し、経過時間を目視で確認する');
    return strict; // STRICT（release/zenn 宛 PR の CI）では検証不能をブロック扱いにする
  }

  if (verdict.severity === 'fail') {
    console.error(
      `[check:zenn-pace] ${strict ? 'FAIL' : 'WARN(FAIL相当)'}: 前回公開から ${formatHours(verdict.elapsedHours)} しか経っていない` +
        `（必要 ${verdict.minHours}h${pendingPublishCount > 0 ? ` / この deploy で新規公開 ${pendingPublishCount} 件` : ''}）`,
    );
    console.error(
      `  次に安全に merge できる目安: ${formatAt(new Date(last.at.getTime() + verdict.minHours * 3600000))} 以降`,
    );
    console.error('  実績: 2026-08-28 08:58 の deploy は前回公開 18h 後で rate-limit に hit した');
    return true;
  }

  if (verdict.severity === 'warn') {
    console.warn(
      `[check:zenn-pace] WARN: 前回公開から ${formatHours(verdict.elapsedHours)} で必要間隔 ${verdict.minHours}h 未満。` +
        'この状態で新規 publish を merge すると rate-limit に hit しうる',
    );
    console.warn(
      `  次に安全に merge できる目安: ${formatAt(new Date(last.at.getTime() + verdict.minHours * 3600000))} 以降`,
    );
    return false;
  }

  console.log(`[check:zenn-pace] OK: 前回公開から ${formatHours(verdict.elapsedHours)} 経過（必要 ${verdict.minHours}h 以上）`);
  return false;
}

function main() {
  const STRICT = process.env.STRICT === '1';
  let result;
  let countFatal = false;
  try {
    result = BASE_REF ? collectDiffMode(BASE_REF) : collectDateMode();
  } catch (e) {
    // base 解決失敗（shallow / base 未 fetch）等は誤検知を避けて skip（非ブロッキング）。
    console.warn(`[check:zenn-pace] skip: 件数の計測に失敗（${e.message.split('\n')[0]}）`);
    console.warn('  CI では fetch-depth: 0 と base ブランチの fetch を確認すること。');
    result = null;
  }

  let pendingPublishCount = 0;
  if (result) {
    const { totalFlips, detail, label } = result;
    pendingPublishCount = totalFlips;
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
      countFatal = true;
    } else if (totalFlips >= WARN_THRESHOLD) {
      console.warn('');
      console.warn(
        `[check:zenn-pace] WARN: ${totalFlips} 件で安全マージン (${WARN_THRESHOLD}) 超過。今後の publish は慎重に分散する`,
      );
      console.warn('  （非ブロッキング。release/zenn 宛 PR で STRICT=1 のときのみ FAIL 閾値で fatal）');
    } else {
      console.log('[check:zenn-pace] OK: 件数 pace は安全圏内');
    }
  }

  // 件数が閾値内でも 24 時間ルール違反は起こりうる（2026-08-28 の事故）。件数判定とは独立に必ず走らせる。
  const intervalFatal = runIntervalCheck({ pendingPublishCount, strict: STRICT, now: new Date() });

  if (STRICT && (countFatal || intervalFatal)) process.exit(1);
}

// ---- self-test ----

function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  // --- 既存ロジックの回帰（flip カウント） ---
  eq(
    'flip を 1 件と数える',
    countFlipsInDiffText(['--- a/articles/x.md', '+++ b/articles/x.md', '-published: false', '+published: true'].join('\n')),
    1,
  );
  eq('published: true だけなら 0 件', countFlipsInDiffText('+published: true'), 0);

  // --- 閾値の正本読み取り ---
  const policyFixture = '| Zenn PR 間隔 | 前回の release/zenn 公開から **24 時間以上**あけてマージ |';
  eq('正本から必要間隔を読む', parseMinIntervalHours(policyFixture), 24);
  eq('正本の数値変更に追随する', parseMinIntervalHours(policyFixture.replace('24 時間', '36 時間')), 36);
  eq('書式が拾えなければ null（既定値で誤魔化さない）', parseMinIntervalHours('間隔についての記述なし'), null);
  // 実ファイルからも読めること（正本の書式が変わったらここで落ちる）
  eq('実ファイルから必要間隔を読める', typeof readMinIntervalHours(), 'number');

  // --- 間隔判定（時刻は引数で注入。実時刻に依存しない） ---
  const MIN = 24;
  const at = (s) => new Date(s);

  // 今回の事故の再現: 前回公開 2026-08-27 14:45 JST / 実行 2026-08-28 08:58 JST = 18.2h
  const incident = evaluateInterval({
    lastPublishAt: at('2026-08-27T14:45:09+09:00'),
    now: at('2026-08-28T08:58:28+09:00'),
    minHours: MIN,
    pendingPublishCount: 1,
  });
  eq('事故再現: 18h で新規公開ありは FAIL', incident.severity, 'fail');
  eq('事故再現: 経過時間を 18h 台と算出', Math.floor(incident.elapsedHours), 18);
  // 新規公開を伴わない update deploy でも 24h 未満なら WARN 以上を出す（見逃さない）
  eq(
    '事故再現: 新規公開なしでも WARN',
    evaluateInterval({
      lastPublishAt: at('2026-08-27T14:45:09+09:00'),
      now: at('2026-08-28T08:58:28+09:00'),
      minHours: MIN,
      pendingPublishCount: 0,
    }).severity,
    'warn',
  );

  // 境界。>= を > に変える／閾値を弄る変異がここで死ぬ。
  eq(
    '24h ちょうどは OK',
    evaluateInterval({ lastPublishAt: at('2026-08-27T00:00:00+09:00'), now: at('2026-08-28T00:00:00+09:00'), minHours: MIN, pendingPublishCount: 1 }).severity,
    'ok',
  );
  eq(
    '24h の 1 分手前は FAIL（新規公開あり）',
    evaluateInterval({ lastPublishAt: at('2026-08-27T00:00:00+09:00'), now: at('2026-08-27T23:59:00+09:00'), minHours: MIN, pendingPublishCount: 1 }).severity,
    'fail',
  );
  eq(
    '24h の 1 分手前は WARN（新規公開なし）',
    evaluateInterval({ lastPublishAt: at('2026-08-27T00:00:00+09:00'), now: at('2026-08-27T23:59:00+09:00'), minHours: MIN, pendingPublishCount: 0 }).severity,
    'warn',
  );
  eq(
    'danger 帯（12h 未満）は新規公開なしでも FAIL',
    evaluateInterval({ lastPublishAt: at('2026-08-27T00:00:00+09:00'), now: at('2026-08-27T11:00:00+09:00'), minHours: MIN, pendingPublishCount: 0 }).severity,
    'fail',
  );
  eq(
    'danger 帯の境界ちょうど（12h）は WARN',
    evaluateInterval({ lastPublishAt: at('2026-08-27T00:00:00+09:00'), now: at('2026-08-27T12:00:00+09:00'), minHours: MIN, pendingPublishCount: 0 }).severity,
    'warn',
  );
  eq(
    '十分あいていれば OK',
    evaluateInterval({ lastPublishAt: at('2026-08-20T00:00:00+09:00'), now: at('2026-08-28T00:00:00+09:00'), minHours: MIN, pendingPublishCount: 1 }).severity,
    'ok',
  );

  // 判定不能は OK にしない（事故の本質: 見ていないのに OK と出た）
  eq(
    '前回公開が取れなければ unknown',
    evaluateInterval({ lastPublishAt: null, now: at('2026-08-28T08:58:00+09:00'), minHours: MIN }).severity,
    'unknown',
  );
  eq(
    '閾値が取れなければ unknown',
    evaluateInterval({ lastPublishAt: at('2026-08-27T14:45:00+09:00'), now: at('2026-08-28T08:58:00+09:00'), minHours: null }).severity,
    'unknown',
  );
  eq(
    '不正な日付は unknown',
    evaluateInterval({ lastPublishAt: new Date('not-a-date'), now: at('2026-08-28T08:58:00+09:00'), minHours: MIN }).severity,
    'unknown',
  );

  // --- git 実挙動（純関数だけだと ref 解決や log 書式の欠陥を検出できない） ---
  const last = findLastPublishOnRelease();
  eq('release/zenn 上の直近 publish を取得できる（未 fetch 環境では null 可）', last === null || last.at instanceof Date, true);
  if (last) {
    eq('取得した publish 時刻が妥当', !Number.isNaN(last.at.getTime()), true);
  } else {
    console.log('  note: release/zenn が未 fetch のため実挙動テストは skip（`git fetch origin release/zenn`）');
  }

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? 'ok  ' : 'FAIL'} ${x.name}`);
  if (failed.length) {
    console.error(`\n[check:zenn-pace] self-test FAILED: ${failed.length}/${t.length}`);
    for (const f of failed) console.error(`  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`);
    process.exit(1);
  }
  console.log(`\n[check:zenn-pace] self-test OK: ${t.length}/${t.length}`);
}

if (require.main !== module) {
  // ライブラリとして読み込まれたときは何も実行しない
} else if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  main();
}

module.exports = { countFlipsInDiffText, parseMinIntervalHours, evaluateInterval };
