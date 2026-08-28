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
// ■ 設計原則: 「見ていないのに OK を返す」経路を作らない
//   本スクリプトが塞ごうとしている事故（後述）の本質は false negative なので、
//   入力が取れなかった場合は必ず「不明（unknown）」として扱い、安全側へ倒す。
//   具体的には以下をすべて unknown / fail 側に寄せている:
//     - 件数計測に失敗した       → pendingPublishCount = null（0 とみなさない。M-1）
//     - 閾値の正本が読めない     → minHours = null → unknown
//     - 前回公開が見つからない   → unknown
//     - ref が古い（未 fetch）   → unknown（H-1）
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
//   環境変数 `ZENN_PACE_NO_FETCH=1` で自動 fetch を抑止できる（オフライン／hermetic テスト用）。
//   注: CI の shallow checkout では履歴/ base 解決が不足するため ci.yml で fetch-depth: 0 を指定。
//
// 閾値の根拠（件数側）: 文書上の公式 rate-limit は「24h/5本」だが、実観測では release/zenn の
// publish:true 切替が 24h 以内 2 件目で deploy がブロックされた（実効 ~24h/1本）。
// → 安全マージンを実測に倒し WARN=1 / FAIL=2 とする。
// 詳細: AGENT_LEARNINGS.md 2026-05-22 / 2026-06-08、AGENTS.md §「Zenn 公開フロー」。
// 閾値の根拠（間隔側）: `docs/publish-operating-policy.md` §Rate-limit 遵守 が数値の正本。
// 同ドキュメントから実行時に読み取り、このファイルには数値を二重定義しない（下記 readMinIntervalHours）。

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

const WARN_THRESHOLD = 1; // これ以上の publish が同一 deploy/24h 内にあると次の公開は hit リスク（実測）
const FAIL_THRESHOLD = 2; // 24h 内 2 件目で deploy ブロックを実観測（実効 rate-limit）

const BASE_REF = process.env.BASE_REF; // 設定時は diff モード（BASE...HEAD の published 差分で実 deploy 数を計測）

// 間隔モードが「前回公開」を探しに行くブランチ。実 deploy は release/zenn への merge で起きるため、
// main ではなく release/zenn の履歴を見る。origin 側を優先（ローカル ref は古いことがある）。
const RELEASE_REMOTE = 'origin';
const RELEASE_BRANCH = 'release/zenn';
const RELEASE_REFS = [`${RELEASE_REMOTE}/${RELEASE_BRANCH}`, RELEASE_BRANCH];
const RELEASE_LOG_LIMIT = 80; // 直近この件数まで遡って publish コミットを探す（履歴全走査を避ける）
// origin/... を見るときに要求する「最後に fetch してからの最大許容経過時間」。
// これを超えていると ref が古く、直近の deploy を見落として「経過 30h・OK」と誤答しうる（H-1）。
const FETCH_MAX_AGE_HOURS = 1;

function repoRoot() {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
}

// ── published フリップ判定 ──
//
// 「published: false → true」は間隔判定の**唯一の入力**なので、表記ゆれで取りこぼすと
// 「前回公開を見つけられず OK/unknown」に化ける。完全一致ではなく正規化して比較する（D-3）。
//   許容: `published:  true` / 末尾空白・CR / `published: "true"` / `published: 'true'`
//   非許容: `published: true-ish` のような別トークン（前方一致に緩めると誤検出するため値は完全一致）
// 戻り値: 'true' | 'false' | null（published 行でない）
function parsePublishedValue(rawLine) {
  const m = /^([+-])published\s*:\s*(.*)$/.exec(rawLine.replace(/\r$/, ''));
  if (!m) return null;
  const value = m[2].trim().replace(/^["']|["']$/g, '').trim();
  if (value !== 'true' && value !== 'false') return null;
  return { sign: m[1], value };
}

// diff/show テキストから `-published: false` + `+published: true` ペアを 1 件として数える共通ロジック。
function countFlipsInDiffText(diff) {
  const lines = diff.split('\n');
  let flips = 0;
  let sawMinus = false;
  for (const line of lines) {
    if (line.startsWith('---') || line.startsWith('+++')) continue;
    const parsed = parsePublishedValue(line);
    if (!parsed) continue;
    if (parsed.sign === '-' && parsed.value === 'false') sawMinus = true;
    else if (parsed.sign === '+' && parsed.value === 'true' && sawMinus) {
      flips++;
      sawMinus = false; // 1 つの `-false` が複数の `+true` を吸わないようにリセットする
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
//
// マッチが複数ある場合（正本に旧運用の記述が残っている等）は**最も厳しい値（最大時間）**を採る（D-1）。
// 非 global の regex で最初のマッチだけを見ると、上に残った古い小さい値（例: 旧運用の 12 時間）を
// 拾って本来より短い間隔を OK にしてしまう。
function parseMinIntervalHours(policyMd) {
  const re = /前回の\s*release\/zenn\s*公開から\s*\*{0,2}(\d+)\s*時間以上/g;
  const values = [];
  for (const m of policyMd.matchAll(re)) {
    const h = Number(m[1]);
    if (Number.isFinite(h) && h > 0) values.push(h);
  }
  if (!values.length) return null;
  return Math.max(...values);
}

// 正本から拾えた候補が複数あるか（出力で注意喚起するため）。
function listMinIntervalCandidates(policyMd) {
  const re = /前回の\s*release\/zenn\s*公開から\s*\*{0,2}(\d+)\s*時間以上/g;
  return [...policyMd.matchAll(re)].map((m) => Number(m[1])).filter((h) => Number.isFinite(h) && h > 0);
}

function readPolicyMd() {
  try {
    return fs.readFileSync(path.join(repoRoot(), 'docs/publish-operating-policy.md'), 'utf8');
  } catch {
    return null;
  }
}

function readMinIntervalHours() {
  const md = readPolicyMd();
  return md === null ? null : parseMinIntervalHours(md);
}

// ── ref の鮮度（H-1） ──
//
// 一度も fetch せずに `origin/release/zenn` を読むと、ローカルの ref が古いだけで
// 直近の deploy を見落とし「経過 30h・OK」と誤答する。CI は明示的に fetch しているが、
// **人間がローカルで `npm run check:zenn-pace` を叩いて merge 判断する経路**（CLAUDE.md の手順）が
// 塞がれていなかった。ここで自分から fetch し、できなければ ref の鮮度を検査して unknown に倒す。
function gitDir() {
  return execSync('git rev-parse --absolute-git-dir', { encoding: 'utf8' }).trim();
}

// 注意: FETCH_HEAD の mtime は「何かを fetch した時刻」であって
// 「release/zenn を fetch した時刻」ではない（他ブランチの fetch でも更新される）。
// あくまで **自分の fetch が失敗したときのフォールバック**の近似指標として使う。
// 通常経路では上の ensureFreshReleaseRef が release/zenn を直接 fetch するので、この近似には依存しない。
function fetchHeadAgeHours() {
  try {
    const st = fs.statSync(path.join(gitDir(), 'FETCH_HEAD'));
    return (Date.now() - st.mtimeMs) / 3600000;
  } catch {
    return null; // 一度も fetch していない
  }
}

// 純関数: 最終 fetch からの経過時間から「ref が古い（信用できない）か」を決める。
// null（一度も fetch していない）は最も危険なので stale 扱い。
function isFetchStale(ageHours) {
  return ageHours === null || ageHours === undefined || ageHours > FETCH_MAX_AGE_HOURS;
}

// 戻り値: { fetched, ageHours, stale, note }
function ensureFreshReleaseRef({ refIsRemote }) {
  // ローカル専用 ref（origin を持たない hermetic テスト等）は fetch 対象がないので鮮度検査もしない。
  if (!refIsRemote) return { fetched: false, ageHours: null, stale: false, note: 'local-ref' };

  if (process.env.ZENN_PACE_NO_FETCH !== '1') {
    try {
      execFileSync('git', ['fetch', '--quiet', RELEASE_REMOTE, RELEASE_BRANCH], {
        stdio: ['ignore', 'ignore', 'pipe'],
        timeout: 30000,
      });
      return { fetched: true, ageHours: 0, stale: false, note: null };
    } catch (e) {
      // オフライン等。fetch できなかった事実は隠さず、下の鮮度検査に委ねる。
      const age = fetchHeadAgeHours();
      return {
        fetched: false,
        ageHours: age,
        stale: isFetchStale(age),
        note: `fetch 失敗: ${String((e && e.message) || e).split('\n')[0]}`,
      };
    }
  }

  const age = fetchHeadAgeHours();
  return {
    fetched: false,
    ageHours: age,
    stale: isFetchStale(age),
    note: 'ZENN_PACE_NO_FETCH=1',
  };
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
//
// なぜ --first-parent + `show -m --first-parent` なのか（M-3・squash 運用への暗黙依存の除去）:
//   素の `git log <ref> -- 'articles/*.md'` は history simplification により、第一親と
//   TREESAME な merge commit を落とす。さらに `git show <merge>` は combined diff なので
//   片親由来の変更に対して**空**を返す。結果、merge commit で publish が載ると flip を検出できず
//   「2 時間前に公開しているのに 40.0h 経過・OK」になる。
//   現状このリポジトリは squash 運用なので発火しないが、`scripts/sync-release-zenn.sh` は内部で
//   `git merge -X theirs origin/main` を作っており、その PR が squash 以外でマージされた瞬間に成立する
//   （release/zenn には実際に merge commit が 29 件ある）。
//   → `--no-merges` で「除外」する案は採らなかった。除外すると merge で載った publish が
//     永久に見えなくなり、まさに false negative（見ていないのに OK）を作るため。
//   → 代わりに release/zenn の**第一親チェーン**を歩く。第一親 = release/zenn 本流なので、
//     各コミットの committer date は「release/zenn に載った時刻」＝ deploy 発火時刻そのもの。
//     merge の中身は `git show -m --first-parent`（第一親に対する差分）で読めるため、
//     squash でも merge でも同じロジックで flip を検出できる。
function resolveReleaseRef() {
  for (const r of RELEASE_REFS) {
    try {
      execSync(`git rev-parse --verify --quiet ${r}^{commit}`, { stdio: ['ignore', 'ignore', 'ignore'] });
      return { ref: r, refIsRemote: r.startsWith(`${RELEASE_REMOTE}/`) };
    } catch {
      /* 次の候補へ */
    }
  }
  return null;
}

function findLastPublishOnRelease() {
  const resolved = resolveReleaseRef();
  if (!resolved) return null;
  const { ref, refIsRemote } = resolved;

  const log = execSync(
    `git log ${ref} --first-parent -n ${RELEASE_LOG_LIMIT} --pretty=format:%H%x09%cI%x09%s -- 'articles/*.md'`,
    { encoding: 'utf8' },
  );
  for (const line of log.split('\n').filter(Boolean)) {
    const [sha, iso, ...rest] = line.split('\t');
    const show = execSync(`git show -m --first-parent ${sha} --unified=0 -- 'articles/*.md'`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (countFlipsInDiffText(show) > 0) {
      return { ref, refIsRemote, sha, at: new Date(iso), subject: rest.join('\t') };
    }
  }
  return null;
}

// 純関数: 前回公開時刻・現在時刻・閾値・この deploy の新規公開本数から severity を決める。
// 時刻は必ず引数で注入する（実時刻に依存するテストを書かないため）。
//
// pendingPublishCount:
//   number … この deploy で新規公開される記事数
//   null   … **計測できなかった（不明）**。0 とみなしてはいけない（M-1）。
//            件数計測に失敗すると 0 扱いになり、「新規公開があるのに 18h」という事故そのものの
//            構成が WARN(exit 0) に化けていた。不明なら安全側＝新規公開ありとして扱う。
//
// severity:
//   'unknown' … 前回公開時刻 or 閾値の正本が取れない / ref が古い。**OK とは言わない**（今回の事故は
//               「見ていないのに OK と出た」ことが本質。判定不能は判定不能として出す）
//   'fail'    … 明確に危険。minHours の半分未満（＝ danger 帯）、または
//               「必要間隔未満なのにこの deploy で新規公開がある（or 件数が不明）」＝ policy 違反の実行そのもの
//   'warn'    … minHours 未満（新規公開を伴わない update deploy 等）
//   'ok'      … minHours 以上経過
function evaluateInterval({ lastPublishAt, now, minHours, pendingPublishCount = 0, refStale = false }) {
  if (!minHours || !lastPublishAt || Number.isNaN(new Date(lastPublishAt).getTime())) {
    return { severity: 'unknown', elapsedHours: null, minHours: minHours || null, reason: 'no-data' };
  }
  const elapsedHours = (new Date(now).getTime() - new Date(lastPublishAt).getTime()) / 3600000;
  // danger 帯 = 正本閾値の半分。独立した数値を置くと正本が変わったときに追随しないため、
  // minHours から導出する（24h 正本なら 12h 未満が danger）。
  const dangerHours = minHours / 2;
  const countUnknown = pendingPublishCount === null;

  if (elapsedHours < dangerHours) {
    return { severity: 'fail', elapsedHours, minHours, dangerHours, countUnknown };
  }
  if (elapsedHours < minHours) {
    // 12〜24h 帯。新規公開があるなら policy 違反の実行そのもの。
    // 件数が「不明」なときも fail に倒す（見ていないのに WARN=exit 0 で通してしまうため）。
    if (countUnknown || pendingPublishCount > 0) {
      return { severity: 'fail', elapsedHours, minHours, dangerHours, countUnknown };
    }
    return { severity: 'warn', elapsedHours, minHours, dangerHours, countUnknown };
  }
  // ここから ok 帯だが、ref が古いと「見えていないだけ」の可能性がある → unknown に倒す（H-1）。
  if (refStale) {
    return { severity: 'unknown', elapsedHours, minHours, dangerHours, countUnknown, reason: 'stale-ref' };
  }
  return { severity: 'ok', elapsedHours, minHours, dangerHours, countUnknown };
}

function formatHours(h) {
  if (h === null || h === undefined) return '不明';
  return `${h.toFixed(1)}h`;
}

// D-2: TZ 表記なしのローカル整形は、CI(UTC) のログを JST と読み違えると
// 「真に安全な時刻より 9 時間早く merge する」誤読を生む。必ずオフセットを添える。
function formatAt(d) {
  if (!d) return '不明';
  const p = (n) => String(n).padStart(2, '0');
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  const tz = `${sign}${p(Math.floor(abs / 60))}:${p(abs % 60)}`;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} ${tz}`;
}

// 間隔モードを実行して出力する。返り値 true = fatal 相当（STRICT 時に exit 1）。
function runIntervalCheck({ pendingPublishCount, strict, now = new Date() }) {
  const policyMd = readPolicyMd();
  const minHours = policyMd === null ? null : parseMinIntervalHours(policyMd);
  const candidates = policyMd === null ? [] : listMinIntervalCandidates(policyMd);

  // 先に ref を解決し、origin 追跡なら鮮度を確保（可能なら fetch、無理なら古さを検査）する。
  // 履歴を読むのは fetch のあと（古い ref を読んでから読み直す二度手間を避ける）。
  let lookupError = null;
  let freshness = { fetched: false, ageHours: null, stale: false, note: 'no-ref' };
  try {
    const resolved = resolveReleaseRef();
    if (resolved) freshness = ensureFreshReleaseRef({ refIsRemote: resolved.refIsRemote });
  } catch (e) {
    lookupError = e.message.split('\n')[0];
  }

  let last = null;
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
    refStale: freshness.stale,
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
  if (candidates.length > 1) {
    console.warn(
      `[check:zenn-pace] 注意: 正本から必要間隔の記述を ${candidates.length} 件検出 (${candidates.join('h, ')}h)。` +
        `最も厳しい ${minHours}h を採用した。正本の古い記述を整理すること`,
    );
  }
  if (verdict.countUnknown) {
    console.warn('[check:zenn-pace] 注意: この deploy の新規公開件数が不明。安全側（新規公開ありとみなす）で判定した');
  }
  if (freshness.stale) {
    console.warn(
      `[check:zenn-pace] 注意: ${RELEASE_REMOTE}/${RELEASE_BRANCH} の鮮度を確保できなかった` +
        `（最終 fetch: ${freshness.ageHours === null ? '記録なし' : `${freshness.ageHours.toFixed(1)}h 前`}` +
        `${freshness.note ? ` / ${freshness.note}` : ''}）`,
    );
  }

  if (verdict.severity === 'unknown') {
    console.warn(
      '[check:zenn-pace] UNKNOWN: 24h 間隔を検証できなかった（OK ではない）。' +
        `${lookupError ? ` 取得エラー: ${lookupError}.` : ''}` +
        `${minHours ? '' : ' 閾値の正本 docs/publish-operating-policy.md を読めなかった。'}` +
        `${last ? '' : ' release/zenn 上に publish コミットを見つけられなかった（未 fetch / shallow の可能性）。'}` +
        `${verdict.reason === 'stale-ref' ? ' ref が古く、直近の deploy を見落としている可能性がある。' : ''}`,
    );
    console.warn('  対処: `git fetch origin release/zenn`（CI は fetch-depth: 0）後に再実行し、経過時間を目視で確認する');
    return strict; // STRICT（release/zenn 宛 PR の CI）では検証不能をブロック扱いにする
  }

  if (verdict.severity === 'fail') {
    console.error(
      `[check:zenn-pace] ${strict ? 'FAIL' : 'WARN(FAIL相当)'}: 前回公開から ${formatHours(verdict.elapsedHours)} しか経っていない` +
        `（必要 ${verdict.minHours}h` +
        `${verdict.countUnknown ? ' / この deploy の新規公開件数は不明（安全側判定）' : ''}` +
        `${pendingPublishCount > 0 ? ` / この deploy で新規公開 ${pendingPublishCount} 件` : ''}）`,
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
    // base 解決失敗（shallow / base 未 fetch）等では件数を **確定できない**。
    // かつては「skip」として 0 件扱いで先へ進んでいたが、それだと間隔モードの 12〜24h 帯で
    // 「新規公開あり(fail)」が「新規公開なし(warn=exit 0)」に化ける（M-1）。→ null=不明で渡す。
    console.warn(`[check:zenn-pace] skip: 件数の計測に失敗（${e.message.split('\n')[0]}）`);
    console.warn('  CI では fetch-depth: 0 と base ブランチの fetch を確認すること。');
    console.warn('  件数は「不明」として扱い、間隔判定は安全側に倒す。');
    result = null;
  }

  let pendingPublishCount = null; // null = 不明。0 と区別する。
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

// ── hermetic な git fixture（H-2） ──
//
// 純関数テストだけだと「間隔チェックを呼ばない」「unknown が STRICT でブロックしない」
// 「findLastPublishOnRelease が常に null を返す」「RELEASE_LOG_LIMIT を 1 にする」といった
// 配線・git 実挙動の変異を 1 つも殺せない（変異注入で実測）。
// GIT_COMMITTER_DATE を固定した一時リポジトリを作り、**main() の exit code と標準出力**を検査する。
// ネットワークは使わない（ZENN_PACE_NO_FETCH=1）。
const SCRIPT_PATH = path.resolve(__filename);

function git(cwd, args, extraEnv = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// hoursAgo 前の固定時刻でコミットする（author/committer 両方）。
function commitAt(cwd, message, hoursAgo) {
  const iso = new Date(Date.now() - hoursAgo * 3600000).toISOString();
  git(cwd, ['add', '-A']);
  git(cwd, ['commit', '-q', '-m', message], { GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso });
  return git(cwd, ['rev-parse', 'HEAD']).trim();
}

const POLICY_LINE = '| Zenn PR 間隔 | 前回の release/zenn 公開から **24 時間以上**あけてマージ |\n';

function makeFixtureRepo() {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'zenn-pace-fixture-'));
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'test']);
  git(dir, ['config', 'commit.gpgsign', 'false']);
  fs.mkdirSync(path.join(dir, 'docs'));
  fs.mkdirSync(path.join(dir, 'articles'));
  fs.writeFileSync(path.join(dir, 'docs/publish-operating-policy.md'), `# policy\n\n${POLICY_LINE}`);
  return dir;
}

function writeArticle(dir, slug, published, body = 'body') {
  fs.writeFileSync(
    path.join(dir, 'articles', `${slug}.md`),
    `---\ntitle: "${slug}"\npublished: ${published}\n---\n\n${body}\n`,
  );
}

// main() を子プロセスで実行し exit code と出力を返す。
function runMain(cwd, env = {}) {
  const res = require('child_process').spawnSync(process.execPath, [SCRIPT_PATH], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ZENN_PACE_NO_FETCH: '1', BASE_REF: '', STRICT: '', ...env },
  });
  return { code: res.status, out: `${res.stdout || ''}${res.stderr || ''}` };
}

function rmrf(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

function hermeticCases(eq) {
  // ── fixture A: 18h 前に publish（＝事故と同じ構成） ──
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'a', 'false');
      commitAt(dir, 'seed', 48);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      writeArticle(dir, 'a', 'true');
      commitAt(dir, 'publish a', 18);

      // 件数を計測できるケース: date モードで flip 1 件が見え、18h → FAIL → exit 1
      const ok = runMain(dir, { STRICT: '1' });
      eq('[git] 18h + 新規公開1件 は STRICT で exit 1', ok.code, 1);
      eq('[git] 18h の経過時間を出力する', /経過: 18\.\dh/.test(ok.out), true);

      // M-1 の回帰: 件数計測に失敗しても exit 1 のまま（かつては exit 0 に化けた）
      const broken = runMain(dir, { STRICT: '1', BASE_REF: 'refs/heads/does-not-exist' });
      eq('[git] M-1: 件数計測に失敗しても 18h は exit 1', broken.code, 1);
      eq('[git] M-1: 件数不明を明示する', /新規公開件数が不明/.test(broken.out), true);

      // 非 STRICT では従来どおり非ブロッキング（後方互換）
      eq('[git] 非 STRICT は exit 0（後方互換）', runMain(dir).code, 0);
    } finally {
      rmrf(dir);
    }
  }

  // ── fixture B: 40h 前に publish、その後 2h 前に publish を伴わない記事更新 ──
  //   ・「常に null を返す」変異を殺す（OK 出力と経過時間を検査するため）
  //   ・RELEASE_LOG_LIMIT=1 変異を殺す（最新の article commit は flip ではない）
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'b', 'false');
      commitAt(dir, 'seed', 96);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      writeArticle(dir, 'b', 'true');
      commitAt(dir, 'publish b', 40);
      writeArticle(dir, 'b', 'true', 'updated body');
      commitAt(dir, 'update b (no flip)', 2);

      const r = runMain(dir, { STRICT: '1' });
      eq('[git] 40h 経過は STRICT でも exit 0', r.code, 0);
      eq('[git] 40h 経過を OK として出力する', /OK: 前回公開から 40\.0h 経過/.test(r.out), true);
      eq('[git] flip でない直近コミットに引きずられない', /publish b/.test(r.out), true);
    } finally {
      rmrf(dir);
    }
  }

  // ── fixture C: merge commit で publish が載るケース（M-3） ──
  //   sync-release-zenn.sh 相当（release/zenn に main を merge）。squash 以外でマージされた瞬間に成立する。
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'c', 'false');
      writeArticle(dir, 'd', 'false');
      commitAt(dir, 'seed', 96);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      // release/zenn 側に 40h 前の publish（旧実装はこれを「前回公開」と誤答した）
      writeArticle(dir, 'c', 'true');
      commitAt(dir, 'publish c', 40);
      // main 側で別記事を publish フリップ → 2h 前に release/zenn へ merge commit で取り込む
      git(dir, ['switch', '-q', 'main']);
      writeArticle(dir, 'd', 'true');
      commitAt(dir, 'publish d on main', 6);
      git(dir, ['switch', '-q', 'release/zenn']);
      const iso = new Date(Date.now() - 2 * 3600000).toISOString();
      git(dir, ['merge', '--no-ff', '-q', '-m', 'chore(release/zenn): sync from main', 'main'], {
        GIT_AUTHOR_DATE: iso,
        GIT_COMMITTER_DATE: iso,
      });

      const r = runMain(dir, { STRICT: '1' });
      eq('[git] M-3: merge commit 経由の publish を検出する', /経過: 2\.0h/.test(r.out), true);
      eq('[git] M-3: 40h 前の旧 publish を「前回公開」と誤答しない', /40\.0h/.test(r.out), false);
      eq('[git] M-3: merge 経由 2h 前は STRICT で exit 1', r.code, 1);
    } finally {
      rmrf(dir);
    }
  }

  // ── fixture F: merge が「第二親（main）と TREESAME」になる形（M-3 の本丸） ──
  //   sync-release-zenn.sh の `git merge -X theirs origin/main` はまさにこの形を作る。
  //   素の `git log <ref> -- path` は TREESAME な親（= main 側）だけを辿るので merge commit が
  //   履歴から消え、**main 上の古いフリップ時刻**を「前回公開」として返してしまう。
  //   ここでは実 deploy は 2h 前なのに main 側のフリップは 30h 前 → 旧実装は「30h 経過・OK」と答える。
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'h', 'false');
      writeArticle(dir, 'i', 'false');
      commitAt(dir, 'seed', 120);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      writeArticle(dir, 'h', 'true'); // release/zenn 側だけ先に h を公開 → 両ブランチが分岐
      commitAt(dir, 'publish h', 60);
      git(dir, ['switch', '-q', 'main']);
      writeArticle(dir, 'h', 'true');
      writeArticle(dir, 'i', 'true');
      commitAt(dir, 'publish h and i on main', 30);
      git(dir, ['switch', '-q', 'release/zenn']);
      const iso = new Date(Date.now() - 2 * 3600000).toISOString();
      git(dir, ['merge', '--no-ff', '-q', '-X', 'theirs', '-m', 'chore(release/zenn): sync from main', 'main'], {
        GIT_AUTHOR_DATE: iso,
        GIT_COMMITTER_DATE: iso,
      });

      const r = runMain(dir, { STRICT: '1' });
      eq('[git] M-3: TREESAME merge でも deploy 時刻(2h 前)を採る', /経過: 2\.0h/.test(r.out), true);
      eq('[git] M-3: main 上の 30h 前フリップを「前回公開」と誤答しない', /30\.0h/.test(r.out), false);
      eq('[git] M-3: TREESAME merge 経由 2h 前は STRICT で exit 1', r.code, 1);
    } finally {
      rmrf(dir);
    }
  }

  // ── fixture D: release/zenn 上に publish が 1 件もない → unknown ──
  //   「unknown が STRICT でブロックしなくなる」変異を殺す。
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'e', 'false');
      commitAt(dir, 'seed', 48);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      writeArticle(dir, 'e', 'false', 'edited');
      commitAt(dir, 'edit only', 5);

      const strict = runMain(dir, { STRICT: '1' });
      eq('[git] publish 履歴なしは UNKNOWN', /UNKNOWN/.test(strict.out), true);
      eq('[git] UNKNOWN は STRICT で exit 1', strict.code, 1);
      eq('[git] UNKNOWN は非 STRICT では exit 0', runMain(dir).code, 0);
    } finally {
      rmrf(dir);
    }
  }

  // ── fixture E: 24h 内に 2 件公開 → 件数側の FAIL_THRESHOLD が効く ──
  {
    const dir = makeFixtureRepo();
    try {
      writeArticle(dir, 'f', 'false');
      writeArticle(dir, 'g', 'false');
      commitAt(dir, 'seed', 96);
      git(dir, ['switch', '-q', '-c', 'release/zenn']);
      writeArticle(dir, 'f', 'true');
      commitAt(dir, 'publish f', 20);
      writeArticle(dir, 'g', 'true');
      commitAt(dir, 'publish g', 3);

      const r = runMain(dir, { STRICT: '1' });
      eq('[git] 24h 内 2 件は件数 FAIL を出す', /2 件 ≥ 2 件/.test(r.out), true);
      eq('[git] 24h 内 2 件は STRICT で exit 1', r.code, 1);
    } finally {
      rmrf(dir);
    }
  }
}

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
  // sawMinus のリセットを消す変異を殺す（1 つの -false が複数の +true を吸ってはいけない）
  eq(
    '1 つの -false が複数の +true を吸わない',
    countFlipsInDiffText(['-published: false', '+published: true', '+published: true'].join('\n')),
    1,
  );
  // D-3: 表記ゆれを取りこぼさない（間隔判定の唯一の入力なので取りこぼし = 見逃し）
  eq('余分な空白を許容', countFlipsInDiffText(['-published:  false ', '+published:  true '].join('\n')), 1);
  eq('CR 終端を許容', countFlipsInDiffText(['-published: false\r', '+published: true\r'].join('\n')), 1);
  eq('クォート付きを許容', countFlipsInDiffText(["-published: 'false'", '+published: "true"'].join('\n')), 1);
  // 逆に前方一致まで緩めない（`true` と別トークンを混同しない）
  eq('別トークンは flip にしない', countFlipsInDiffText(['-published: false', '+published: true-ish'].join('\n')), 0);
  eq('published を含む別キーは無視', countFlipsInDiffText(['-republished: false', '+republished: true'].join('\n')), 0);

  // --- 閾値の正本読み取り ---
  const policyFixture = '| Zenn PR 間隔 | 前回の release/zenn 公開から **24 時間以上**あけてマージ |';
  eq('正本から必要間隔を読む', parseMinIntervalHours(policyFixture), 24);
  eq('正本の数値変更に追随する', parseMinIntervalHours(policyFixture.replace('24 時間', '36 時間')), 36);
  eq('書式が拾えなければ null（既定値で誤魔化さない）', parseMinIntervalHours('間隔についての記述なし'), null);
  // D-1: 複数マッチなら最も厳しい値。古い記述が先頭に残っても小さい値に負けない。
  eq(
    '複数マッチは最も厳しい値を採る',
    parseMinIntervalHours(
      `旧運用: 前回の release/zenn 公開から 12 時間以上あけてマージ\n${policyFixture}`,
    ),
    24,
  );
  eq(
    '複数マッチを列挙できる',
    listMinIntervalCandidates(`旧運用: 前回の release/zenn 公開から 12 時間以上\n${policyFixture}`),
    [12, 24],
  );
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
  // M-1: 件数不明は 0 扱いにしない（12〜24h 帯で fail に倒す）
  eq(
    'M-1: 件数不明(null)は 18h 帯で FAIL',
    evaluateInterval({
      lastPublishAt: at('2026-08-27T14:45:09+09:00'),
      now: at('2026-08-28T08:58:28+09:00'),
      minHours: MIN,
      pendingPublishCount: null,
    }).severity,
    'fail',
  );
  eq(
    'M-1: 件数不明はフラグで可視化する',
    evaluateInterval({
      lastPublishAt: at('2026-08-27T14:45:09+09:00'),
      now: at('2026-08-28T08:58:28+09:00'),
      minHours: MIN,
      pendingPublishCount: null,
    }).countUnknown,
    true,
  );
  eq(
    'M-1: 件数不明でも 24h 以上経過していれば OK（過剰ブロックしない）',
    evaluateInterval({
      lastPublishAt: at('2026-08-20T00:00:00+09:00'),
      now: at('2026-08-28T00:00:00+09:00'),
      minHours: MIN,
      pendingPublishCount: null,
    }).severity,
    'ok',
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

  // H-1: ref が古いときは OK と言わない
  eq(
    'H-1: ref が古ければ OK 帯でも unknown',
    evaluateInterval({ lastPublishAt: at('2026-08-20T00:00:00+09:00'), now: at('2026-08-28T00:00:00+09:00'), minHours: MIN, pendingPublishCount: 0, refStale: true }).severity,
    'unknown',
  );
  eq(
    'H-1: ref が古くても見えている違反は FAIL のまま',
    evaluateInterval({ lastPublishAt: at('2026-08-27T14:45:00+09:00'), now: at('2026-08-28T08:58:00+09:00'), minHours: MIN, pendingPublishCount: 1, refStale: true }).severity,
    'fail',
  );

  // H-1: 鮮度判定そのもの（一度も fetch していない = 最も危険なので stale）
  eq('H-1: 一度も fetch していなければ stale', isFetchStale(null), true);
  eq('H-1: 直近の fetch は fresh', isFetchStale(0.1), false);
  eq(`H-1: ${FETCH_MAX_AGE_HOURS}h 超の fetch は stale`, isFetchStale(FETCH_MAX_AGE_HOURS + 0.1), true);
  eq(`H-1: ${FETCH_MAX_AGE_HOURS}h ちょうどは fresh`, isFetchStale(FETCH_MAX_AGE_HOURS), false);

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

  // D-2: 時刻表示に TZ オフセットが付く（CI(UTC) のログを JST と誤読させない）
  eq('時刻表示に TZ オフセットが付く', /[+-]\d{2}:\d{2}$/.test(formatAt(new Date())), true);

  // --- git 実挙動（純関数だけだと ref 解決や log 書式や配線の欠陥を検出できない） ---
  const last = findLastPublishOnRelease();
  eq('release/zenn 上の直近 publish を取得できる（未 fetch 環境では null 可）', last === null || last.at instanceof Date, true);
  if (last) {
    eq('取得した publish 時刻が妥当', !Number.isNaN(last.at.getTime()), true);
  } else {
    console.log('  note: release/zenn が未 fetch のため実挙動テストは skip（`git fetch origin release/zenn`）');
  }

  // --- hermetic な git fixture（exit code まで検査する） ---
  hermeticCases(eq);

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

module.exports = {
  countFlipsInDiffText,
  parseMinIntervalHours,
  listMinIntervalCandidates,
  isFetchStale,
  evaluateInterval,
  formatAt,
};
