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
    zenn: { articles: zenn.length, total_likes: zennLikes, avg_likes: round1(zennLikes / Math.max(1, zenn.length)) },
    qiita: { articles: qiita.length, total_likes: qiitaLikes, total_stocks: qiitaStocks },
    note: { articles: note.length, total_likes: noteLikes + noteAnon, breakdown: `${noteLikes}+${noteAnon}` },
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
  lines.push('| 媒体 | 記事数 | 反応合計 |');
  lines.push('| --- | --- | --- |');
  lines.push(`| Zenn | ${summary.zenn.articles} | likes ${summary.zenn.total_likes} (avg ${summary.zenn.avg_likes}) |`);
  lines.push(`| Qiita | ${summary.qiita.articles} | LGTM ${summary.qiita.total_likes} / ストック ${summary.qiita.total_stocks} |`);
  lines.push(`| note | ${summary.note.articles} | スキ ${summary.note.total_likes} (${summary.note.breakdown}) |`);
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
  const payload = {
    fetched_at: new Date().toISOString(),
    summary: summarize(zenn, qiita, note),
    zenn,
    qiita,
    note,
  };
  if (pretty) {
    process.stdout.write(renderMarkdown(payload));
    process.stdout.write('\n');
  } else {
    process.stdout.write(JSON.stringify(payload, null, 2));
    process.stdout.write('\n');
  }
}

main().catch((e) => {
  console.error('[fetch-channel-metrics] error:', e.message);
  process.exit(1);
});
