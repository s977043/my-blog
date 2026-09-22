#!/usr/bin/env node
// scripts/fetch-channel-metrics.mjs
//
// Zenn / Qiita / note の公開 API を統一インターフェースで叩き、
// `docs/channel-metrics/YYYY-MM-DD.md` のスナップショット作成に使う JSON を出力する。
//
// 使い方:
//   node scripts/fetch-channel-metrics.mjs                # 全媒体・標準出力に JSON
//   node scripts/fetch-channel-metrics.mjs --channel zenn # 単一媒体のみ
//   node scripts/fetch-channel-metrics.mjs --pretty       # 人間可読 Markdown サマリ
//   node scripts/fetch-channel-metrics.mjs --self-test    # Seed URL join の hermetic self-test
//
// 取得しない: GA4（管理画面側のため要手動取得）→ Markdown スナップショットで併記する想定。
//
// 認証: 全て公開 API、認証不要。
//
// 環境変数（既定値あり）:
//   ZENN_USERNAME=minewo
//   QIITA_USERNAME=s977043
//   NOTE_USERNAME=mine_unilabo
//
// 設計: `docs/publish-operating-policy.md` の「メトリクス再計測サイクル」で月次想定。
// 個別ワンライナーで都度書き起こす運用を本スクリプトに置き換える。
// Article lifecycle: docs/article-graph.json の promoted_to URL と公開記事URLを join し、seed_ids を付与する。

import { readFileSync } from 'node:fs';

const ARTICLE_GRAPH_URL = new URL('../docs/article-graph.json', import.meta.url);

const ZENN_USERNAME = process.env.ZENN_USERNAME || 'minewo';
const QIITA_USERNAME = process.env.QIITA_USERNAME || 's977043';
const NOTE_USERNAME = process.env.NOTE_USERNAME || 'mine_unilabo';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const wantedChannel = value('--channel'); // 'zenn'|'qiita'|'note'|undefined(all)
const pretty = flag('--pretty');

function normalizePromotionUrl(raw) {
  if (!raw || !/^https?:\/\//i.test(String(raw))) return null;
  try {
    const u = new URL(String(raw));
    u.search = '';
    u.hash = '';
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
    return u.toString();
  } catch {
    return null;
  }
}

function promotionIndexFromGraph(graph) {
  const tmp = new Map();
  for (const edge of graph?.edges || []) {
    if (edge?.relation !== 'promoted_to') continue;
    const url = normalizePromotionUrl(edge.to);
    if (!url || !edge.from) continue;
    if (!tmp.has(url)) tmp.set(url, new Set());
    tmp.get(url).add(edge.from);
  }
  return new Map([...tmp.entries()].map(([url, ids]) => [url, [...ids].sort()]));
}

function loadPromotionIndex() {
  const graph = JSON.parse(readFileSync(ARTICLE_GRAPH_URL, 'utf8'));
  return promotionIndexFromGraph(graph);
}

function attachSeedIds(items, getUrl, index) {
  return items.map((item) => {
    const url = normalizePromotionUrl(getUrl(item));
    return { ...item, seed_ids: url ? (index.get(url) || []) : [] };
  });
}

function linkSeedIds(zenn, qiita, note, index, zennUsername = ZENN_USERNAME) {
  return {
    zenn: attachSeedIds(zenn, (a) => `https://zenn.dev/${zennUsername}/articles/${a.slug}`, index),
    qiita: attachSeedIds(qiita, (a) => a.url, index),
    note: attachSeedIds(note, (a) => a.note_url, index),
  };
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'fetch-channel-metrics.mjs' } });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
}

async function fetchZenn() {
  const data = await fetchJson(
    `https://zenn.dev/api/articles?username=${ZENN_USERNAME}&order=daily&count=100`,
  );
  return (data.articles || []).map((a) => ({
    slug: a.slug,
    title: a.title,
    liked_count: a.liked_count ?? 0,
    published_at: (a.published_at || '').slice(0, 10),
    body_letters_count: a.body_letters_count ?? null,
  }));
}

async function fetchQiita() {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const items = await fetchJson(
      `https://qiita.com/api/v2/users/${QIITA_USERNAME}/items?per_page=100&page=${page}`,
    );
    if (!Array.isArray(items) || items.length === 0) break;
    for (const it of items) {
      out.push({
        id: it.id,
        title: it.title,
        likes_count: it.likes_count ?? 0,
        stocks_count: it.stocks_count ?? 0,
        comments_count: it.comments_count ?? 0,
        created_at: (it.created_at || '').slice(0, 10),
        url: it.url,
      });
    }
    if (items.length < 100) break;
  }
  return out;
}

async function fetchNote() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const d = await fetchJson(
      `https://note.com/api/v2/creators/${NOTE_USERNAME}/contents?kind=note&page=${page}`,
    );
    const contents = d?.data?.contents || [];
    for (const c of contents) {
      if (c.status !== 'published') continue;
      out.push({
        key: c.key,
        title: c.name,
        like_count: c.likeCount ?? 0,
        anonymous_like_count: c.anonymousLikeCount ?? 0,
        comment_count: c.commentCount ?? 0,
        publish_at: (c.publishAt || '').slice(0, 10),
        note_url: c.noteUrl,
      });
    }
    if (d?.data?.isLastPage) break;
  }
  return out;
}

function summarize(zenn, qiita, note) {
  const zennLikes = zenn.reduce((s, a) => s + a.liked_count, 0);
  const qiitaLikes = qiita.reduce((s, a) => s + a.likes_count, 0);
  const qiitaStocks = qiita.reduce((s, a) => s + a.stocks_count, 0);
  const noteLikes = note.reduce((s, a) => s + a.like_count, 0);
  const noteAnon = note.reduce((s, a) => s + a.anonymous_like_count, 0);
  return {
    zenn: { articles: zenn.length, linked_articles: zenn.filter((a) => a.seed_ids?.length).length, total_likes: zennLikes, avg_likes: round1(zennLikes / Math.max(1, zenn.length)) },
    qiita: { articles: qiita.length, linked_articles: qiita.filter((a) => a.seed_ids?.length).length, total_likes: qiitaLikes, total_stocks: qiitaStocks },
    note: { articles: note.length, linked_articles: note.filter((a) => a.seed_ids?.length).length, total_likes: noteLikes + noteAnon, breakdown: `${noteLikes}+${noteAnon}` },
  };
}
const round1 = (n) => Math.round(n * 10) / 10;

function topN(arr, key, n = 10) {
  return [...arr].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0)).slice(0, n);
}

function renderMarkdown(payload) {
  const { fetched_at, summary, zenn, qiita, note } = payload;
  const lines = [];
  lines.push(`# Channel metrics fetch — ${fetched_at.slice(0, 10)}`);
  lines.push('');
  lines.push('| 媒体 | 記事数 | Seed連携 | 反応合計 |');
  lines.push('| --- | --- | --- | --- |');
  lines.push(`| Zenn | ${summary.zenn.articles} | ${summary.zenn.linked_articles} | likes ${summary.zenn.total_likes} (avg ${summary.zenn.avg_likes}) |`);
  lines.push(`| Qiita | ${summary.qiita.articles} | ${summary.qiita.linked_articles} | LGTM ${summary.qiita.total_likes} / ストック ${summary.qiita.total_stocks} |`);
  lines.push(`| note | ${summary.note.articles} | ${summary.note.linked_articles} | スキ ${summary.note.total_likes} (${summary.note.breakdown}) |`);
  lines.push('');
  lines.push('## Zenn TOP10 (likes)');
  for (const a of topN(zenn, 'liked_count')) {
    lines.push(`- ${a.liked_count} | ${a.published_at} | ${a.slug} | ${a.title}`);
  }
  lines.push('');
  lines.push('## Qiita TOP10 (stocks; LGTM 無視は publish-operating-policy 準拠)');
  for (const a of topN(qiita, 'stocks_count')) {
    lines.push(`- stock ${a.stocks_count} / LGTM ${a.likes_count} | ${a.created_at} | ${a.title}`);
  }
  lines.push('');
  lines.push('## note TOP10 (スキ合計)');
  const noteRanked = [...note]
    .map((a) => ({ ...a, total: a.like_count + a.anonymous_like_count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  for (const a of noteRanked) {
    lines.push(`- ${a.total} (${a.like_count}+${a.anonymous_like_count}) | ${a.publish_at} | ${a.title}`);
  }
  lines.push('');
  lines.push('## Article lifecycle links');
  const linked = [
    ...zenn.map((a) => ({ channel: 'zenn', title: a.title, seed_ids: a.seed_ids })),
    ...qiita.map((a) => ({ channel: 'qiita', title: a.title, seed_ids: a.seed_ids })),
    ...note.map((a) => ({ channel: 'note', title: a.title, seed_ids: a.seed_ids })),
  ].filter((a) => a.seed_ids?.length);
  if (linked.length === 0) lines.push('- 連携済み記事なし');
  else for (const a of linked) lines.push(`- ${a.channel} | ${a.seed_ids.join(', ')} | ${a.title}`);
  lines.push('');
  lines.push('## 次のステップ');
  lines.push('- GA4 から PV / UU / エンゲ秒を手動で取得し、`docs/channel-metrics/YYYY-MM-DD.md` を新規作成して併記する');
  lines.push('- `docs/content-channel-strategy.md` の Data-driven section から新スナップショットへ参照リンクを差し替える');
  return lines.join('\n');
}

async function main() {
  const want = (ch) => !wantedChannel || wantedChannel === ch;
  const [zenn, qiita, note] = await Promise.all([
    want('zenn') ? fetchZenn() : [],
    want('qiita') ? fetchQiita() : [],
    want('note') ? fetchNote() : [],
  ]);
  const promotionIndex = loadPromotionIndex();
  const linked = linkSeedIds(zenn, qiita, note, promotionIndex);
  const payload = {
    fetched_at: new Date().toISOString(),
    summary: summarize(linked.zenn, linked.qiita, linked.note),
    zenn: linked.zenn,
    qiita: linked.qiita,
    note: linked.note,
  };
  if (pretty) {
    process.stdout.write(renderMarkdown(payload));
    process.stdout.write('\n');
  } else {
    process.stdout.write(JSON.stringify(payload, null, 2));
    process.stdout.write('\n');
  }
}

function selfTest() {
  const tests = [];
  const eq = (name, got, want) => tests.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  eq(
    'URL query/hash/trailing slash を正規化',
    normalizePromotionUrl('https://note.com/mine/n/abc/?sub_rt=share#x'),
    'https://note.com/mine/n/abc',
  );
  eq('非URLは対象外', normalizePromotionUrl('articles/foo.md'), null);

  const index = promotionIndexFromGraph({
    edges: [
      { from: 'seed-b', relation: 'promoted_to', to: 'https://note.com/mine/n/abc?x=1' },
      { from: 'seed-a', relation: 'promoted_to', to: 'https://note.com/mine/n/abc' },
      { from: 'seed-local', relation: 'promoted_to', to: 'articles/foo.md' },
    ],
  });
  eq('同一URLのseed IDsを一意・sort', index.get('https://note.com/mine/n/abc'), ['seed-a', 'seed-b']);

  const linked = linkSeedIds(
    [{ slug: 'z1', title: 'Z', liked_count: 1 }],
    [{ url: 'https://qiita.com/u/items/q1?from=x', title: 'Q', likes_count: 1, stocks_count: 2 }],
    [{ note_url: 'https://note.com/mine/n/abc?sub_rt=share', title: 'N', like_count: 2, anonymous_like_count: 1 }],
    new Map([
      ['https://zenn.dev/minewo/articles/z1', ['seed-z']],
      ['https://qiita.com/u/items/q1', ['seed-q']],
      ['https://note.com/mine/n/abc', ['seed-n']],
    ]),
  );
  eq('Zenn URLを構築してjoin', linked.zenn[0].seed_ids, ['seed-z']);
  eq('Qiita query差分を吸収してjoin', linked.qiita[0].seed_ids, ['seed-q']);
  eq('note query差分を吸収してjoin', linked.note[0].seed_ids, ['seed-n']);
  const unlinked = attachSeedIds([{ url: 'https://example.com/no-match' }], (a) => a.url, index);
  eq('未連携記事は空配列', unlinked[0].seed_ids, []);

  const sum = summarize(linked.zenn, linked.qiita, linked.note);
  eq('linked_articlesを集計', [sum.zenn.linked_articles, sum.qiita.linked_articles, sum.note.linked_articles], [1, 1, 1]);
  const rendered = renderMarkdown({
    fetched_at: '2026-09-23T00:00:00.000Z',
    summary: sum,
    zenn: linked.zenn,
    qiita: linked.qiita,
    note: linked.note,
  });
  eq('MarkdownにSeed linkを表示', rendered.includes('seed-n | N'), true);

  const failed = tests.filter((t) => !t.ok);
  for (const t of tests) console.log(`  ${t.ok ? 'ok  ' : 'FAIL'} ${t.name}`);
  if (failed.length) {
    console.error(`\n[fetch-channel-metrics] self-test FAILED: ${failed.length}/${tests.length}`);
    for (const f of failed) console.error(`  - ${f.name}: got=${JSON.stringify(f.got)} want=${JSON.stringify(f.want)}`);
    process.exit(1);
  }
  console.log(`\n[fetch-channel-metrics] self-test OK: ${tests.length}/${tests.length}`);
}

if (flag('--self-test')) {
  selfTest();
} else {
  main().catch((e) => {
    console.error('[fetch-channel-metrics] error:', e.message);
    process.exit(1);
  });
}

export { normalizePromotionUrl, promotionIndexFromGraph, attachSeedIds, linkSeedIds, summarize };
