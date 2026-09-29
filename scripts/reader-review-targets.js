#!/usr/bin/env node
// 読者 e2e レビュー（`/reader-review`）の対象選定・本文取得・巡回記録。
//
// ■ 何をするか
//   1. リポジトリから「公開中の記事」を媒体横断で列挙する
//      - Zenn 記事: `articles/*.md` の `published: true` → https://zenn.dev/minewo/articles/<slug>
//      - Zenn Book: `books/<slug>/config.yaml` の `published: true` → https://zenn.dev/minewo/books/<slug>
//      - Qiita: `Qiita/public/*.md` のうち `id` があり `private: true` でないもの → https://qiita.com/s977043/items/<id>
//      - note: `articles_note/published/*.md`（`公開状態: publish`）→ https://note.com/mine_unilabo/n/<key>
//      - izanami: `articles_izanami/*.md` のうち `izanami_url` があるもの
//   2. 巡回状態 `docs/reader-review/rotation.json`（URL ごとの最終レビュー日）を読み、
//      全媒体を通して「未レビュー → 最終レビュー日が古い順」に N 本選ぶ。同じ順位（未レビュー同士・
//      同日同士）の中では媒体（zenn / qiita / note / izanami）を交互に並べ、1 回の中で媒体が混ざるように
//      する。媒体ごとの本数に比例して回るので、全記事がほぼ均等な間隔で一巡する
//   3. `--fetch` で選んだ記事の公開本文を取得する（ブラウザ不要。下記「本文の取得方法」）
//   4. `--record` でレビューした URL の最終レビュー日を rotation.json に書く
//
// ■ 本文の取得方法（2026-09-29 に各媒体 1 本ずつ実測して決めた）
//   - Zenn 記事: https://zenn.dev/api/articles/<slug> の `article.body_html`
//   - Zenn Book: https://zenn.dev/api/books/<slug> の `book.chapters[].id` →
//     https://zenn.dev/api/chapters/<id> の `chapter.body_html` を章順に連結
//     （`/api/books/<slug>/chapters/<slug>` は 404。viewer ページの HTML は本文を含まない）
//   - Qiita: https://qiita.com/api/v2/items/<id> の `body`（Markdown）。無認証 60 req/h
//   - note: https://note.com/api/v3/notes/<key> の `data.body`（HTML。非公式 API）
//   - izanami: 公開ページ HTML の `markdown-post` クラスの div（サーバーレンダリング済み）
//   取得に失敗した、または抽出本文が短すぎる（MIN_LIVE_CHARS 未満）場合は、リポジトリの原稿で代用し、
//   `origin: "repo"` と理由を manifest に残す。レポートにはその旨を書く（公開版と差がありうるため）。
//
// ■ 使い方
//   node scripts/reader-review-targets.js                  # 既定 5 本を選んで表示
//   node scripts/reader-review-targets.js --count 6 --json
//   node scripts/reader-review-targets.js --list           # 公開記事の件数（媒体別）と一覧
//   node scripts/reader-review-targets.js --fetch --out <dir> [--url <url> ...]
//        # 選定分（または --url 指定分）の本文を <dir> に書き、<dir>/manifest.json を出す
//   node scripts/reader-review-targets.js --record --date 2026-09-29 --report reviews/reader/2026-09-29.md <url> ...
//   node scripts/reader-review-targets.js --self-test

const fs = require("fs");
const os = require("os");
const path = require("path");

const LABEL = "[reader-review]";
const ROTATION_PATH = "docs/reader-review/rotation.json";
const DEFAULT_COUNT = 5;
const MIN_LIVE_CHARS = 200;
const MEDIA = ["zenn", "qiita", "note", "izanami"];
const USER_AGENT = "Mozilla/5.0 (compatible; my-blog-reader-review)";

// ---- 純関数（self-test 対象） ----

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    fm[kv[1]] = v;
  }
  return fm;
}

function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function readIfExists(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function listFiles(dir, re) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && re.test(d.name))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

function listDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

function collectTargets(root) {
  const out = [];

  for (const f of listFiles(path.join(root, "articles"), /\.md$/)) {
    const md = fs.readFileSync(path.join(root, "articles", f), "utf8");
    const fm = parseFrontmatter(md);
    if (fm.published !== "true") continue;
    const slug = f.replace(/\.md$/, "");
    out.push({
      medium: "zenn",
      kind: "zenn-article",
      key: slug,
      title: fm.title || slug,
      url: `https://zenn.dev/minewo/articles/${slug}`,
      source: `articles/${f}`,
    });
  }

  for (const slug of listDirs(path.join(root, "books"))) {
    const cfg = readIfExists(path.join(root, "books", slug, "config.yaml"));
    if (!cfg) continue;
    const fm = parseFrontmatter(`---\n${cfg}\n---`);
    if (fm.published !== "true") continue;
    out.push({
      medium: "zenn",
      kind: "zenn-book",
      key: slug,
      title: fm.title || slug,
      url: `https://zenn.dev/minewo/books/${slug}`,
      source: `books/${slug}/`,
    });
  }

  for (const f of listFiles(path.join(root, "Qiita", "public"), /\.md$/)) {
    const fm = parseFrontmatter(
      fs.readFileSync(path.join(root, "Qiita", "public", f), "utf8"),
    );
    if (!/^[0-9a-f]{20}$/.test(fm.id || "")) continue;
    if (fm.private === "true") continue;
    out.push({
      medium: "qiita",
      kind: "qiita",
      key: fm.id,
      title: fm.title || f,
      url: `https://qiita.com/s977043/items/${fm.id}`,
      source: `Qiita/public/${f}`,
    });
  }

  const noteDir = path.join(root, "articles_note", "published");
  for (const f of listFiles(noteDir, /^n[0-9a-f]+\.md$/)) {
    const md = fs.readFileSync(path.join(noteDir, f), "utf8");
    if (!/^> 公開状態:\s*publish\b/m.test(md)) continue;
    const key = f.replace(/\.md$/, "");
    const h1 = md.match(/^# (.+)$/m);
    out.push({
      medium: "note",
      kind: "note",
      key,
      title: h1 ? h1[1].trim() : key,
      url: `https://note.com/mine_unilabo/n/${key}`,
      source: `articles_note/published/${f}`,
    });
  }

  for (const f of listFiles(path.join(root, "articles_izanami"), /\.md$/)) {
    if (f === "README.md") continue;
    const fm = parseFrontmatter(
      fs.readFileSync(path.join(root, "articles_izanami", f), "utf8"),
    );
    if (!/^https:\/\/izanami\.dev\//.test(fm.izanami_url || "")) continue;
    out.push({
      medium: "izanami",
      kind: "izanami",
      key: f.replace(/\.md$/, ""),
      title: fm.title || f,
      url: fm.izanami_url,
      source: `articles_izanami/${f}`,
    });
  }

  return out;
}

function validateRotation(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj))
    throw new Error("rotation: top-level must be an object");
  if (obj.version !== 1) throw new Error("rotation: version must be 1");
  if (!obj.reviewed || typeof obj.reviewed !== "object" || Array.isArray(obj.reviewed))
    throw new Error("rotation: `reviewed` must be an object keyed by URL");
  for (const [url, v] of Object.entries(obj.reviewed)) {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v.last_reviewed || ""))
      throw new Error(`rotation: ${url} needs last_reviewed as YYYY-MM-DD`);
  }
  return obj;
}

function emptyRotation() {
  return { version: 1, reviewed: {} };
}

function lastReviewed(t, rotation) {
  const r = rotation.reviewed[t.url];
  return r ? r.last_reviewed : "";
}

// 全媒体を通して、未レビュー（""）→ 最終レビュー日が古い順に並べる。
// 同じ最終レビュー日のグループ内では媒体を交互に並べる（媒体内は URL 順で決定的にする）。
function selectTargets(targets, rotation, count) {
  const groups = new Map();
  for (const t of targets) {
    const d = lastReviewed(t, rotation);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d).push(t);
  }
  const ordered = [];
  for (const d of [...groups.keys()].sort()) {
    const queues = new Map(MEDIA.map((m) => [m, []]));
    for (const t of groups.get(d)) {
      if (!queues.has(t.medium)) queues.set(t.medium, []);
      queues.get(t.medium).push(t);
    }
    for (const q of queues.values()) q.sort((a, b) => (a.url < b.url ? -1 : 1));
    while ([...queues.values()].some((q) => q.length)) {
      for (const q of queues.values()) if (q.length) ordered.push(q.shift());
    }
  }
  return ordered.slice(0, count).map((t) => ({
    ...t,
    last_reviewed: lastReviewed(t, rotation) || null,
  }));
}

function recordReviews(rotation, urls, date, report) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || ""))
    throw new Error("--record needs --date YYYY-MM-DD");
  const next = { version: 1, reviewed: { ...rotation.reviewed } };
  for (const u of urls) {
    next.reviewed[u] = report ? { last_reviewed: date, report } : { last_reviewed: date };
  }
  const sorted = {};
  for (const k of Object.keys(next.reviewed).sort()) sorted[k] = next.reviewed[k];
  next.reviewed = sorted;
  return next;
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "");
}

// レビュー用に構造（見出し・段落・リスト・コード・リンク先・画像 alt）を残したテキストへ落とす。
function htmlToText(html) {
  let s = html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<span class="msg-symbol">[\s\S]*?<\/span>/gi, "");
  const pres = [];
  s = s.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => {
    const code = decodeEntities(stripTags(inner));
    pres.push(`\n\n\`\`\`\n${code.replace(/\n+$/, "")}\n\`\`\`\n\n`);
    return `\u0000PRE${pres.length - 1}\u0000`;
  });
  // HTML ソース上の改行は空白扱い。和文どうしの間の改行は詰める（英単語は空白で区切る）
  s = s
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/([^\x00-\x7F])\n(?=[^\x00-\x7F])/g, "$1")
    .replace(/\s+/g, " ");
  s = s
    .replace(
      /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
      (_, n, inner) => `\n\n${"#".repeat(Number(n))} ${stripTags(inner).trim()}\n\n`,
    )
    .replace(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
      const text = stripTags(inner).trim();
      return /^(https?:\/\/|\/)/.test(href) && text && text !== href ? `[${text}](${href})` : text;
    })
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, inner) => `**${inner.trim()}**`)
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => `\`${inner}\``)
    .replace(/<img\b[^>]*?alt="([^"]*)"[^>]*>/gi, (_, alt) => `[画像: ${alt || "alt なし"}]`)
    .replace(/<img\b[^>]*>/gi, "[画像: alt なし]")
    .replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
      let n = 0;
      return `${inner.replace(/<li\b[^>]*>/gi, () => `\n${++n}. `)}\n\n`;
    })
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<tr\b[^>]*>/gi, "\n| ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol|table|blockquote|figure|section|aside|details|summary)>/gi, "\n\n")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<[^>]+>/g, "");
  s = decodeEntities(s)
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\u0000PRE(\d+)\u0000/g, (_, i) => pres[Number(i)])
    .replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

// 開始タグの位置から、対応する </div> までを返す（div の入れ子を数える）。
function extractBalancedDiv(html, startIdx) {
  const re = /<div\b[^>]*>|<\/div>/gi;
  re.lastIndex = startIdx;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return html.slice(startIdx, re.lastIndex);
  }
  return null;
}

function extractIzanamiBody(html) {
  const m = html.match(/<div\b[^>]*class="[^"]*\bmarkdown-post\b[^"]*"[^>]*>/);
  if (!m) return null;
  return extractBalancedDiv(html, m.index);
}

function charCount(text) {
  return Array.from(text.replace(/\s/g, "")).length;
}

// 取得結果の本文以外を target に足す。target.source（リポジトリのパス）を上書きしない。
function manifestEntry(t, body, file) {
  const { text, ...meta } = body;
  return { ...meta, ...t, file };
}

// ---- 本文取得 ----

async function fetchWith(fetchImpl, url, kind) {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": USER_AGENT, Accept: kind === "json" ? "application/json" : "text/html" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return kind === "json" ? res.json() : res.text();
}

async function fetchLive(t, fetchImpl) {
  const get = (u, k) => fetchWith(fetchImpl, u, k);
  switch (t.kind) {
    case "zenn-article": {
      const j = await get(`https://zenn.dev/api/articles/${t.key}`, "json");
      return { method: "zenn api/articles body_html", text: htmlToText(j.article.body_html || "") };
    }
    case "zenn-book": {
      const j = await get(`https://zenn.dev/api/books/${t.key}`, "json");
      const parts = [];
      for (const ch of j.book.chapters || []) {
        const c = await get(`https://zenn.dev/api/chapters/${ch.id}`, "json");
        parts.push(`# 第${ch.position}章 ${ch.title}\n\n${htmlToText(c.chapter.body_html || "")}`);
      }
      return { method: "zenn api/books + api/chapters body_html", text: parts.join("\n\n") };
    }
    case "qiita": {
      const j = await get(`https://qiita.com/api/v2/items/${t.key}`, "json");
      return { method: "qiita api/v2/items body (markdown)", text: (j.body || "").trim() };
    }
    case "note": {
      const j = await get(`https://note.com/api/v3/notes/${t.key}`, "json");
      return { method: "note api/v3/notes data.body", text: htmlToText((j.data && j.data.body) || "") };
    }
    case "izanami": {
      const h = await get(t.url, "html");
      const body = extractIzanamiBody(h);
      return { method: "izanami page html .markdown-post", text: body ? htmlToText(body) : "" };
    }
    default:
      throw new Error(`unknown kind ${t.kind}`);
  }
}

function repoText(t, root) {
  if (t.kind === "zenn-book") {
    const dir = path.join(root, "books", t.key);
    const cfg = fs.readFileSync(path.join(dir, "config.yaml"), "utf8");
    const chapters = [...cfg.matchAll(/^\s+-\s+(\S+)\s*$/gm)].map((m) => m[1]);
    return chapters
      .map((c, i) => {
        const md = readIfExists(path.join(dir, `${c}.md`)) || "";
        const title = parseFrontmatter(md).title || c;
        return `# 第${i + 1}章 ${title}\n\n${stripFrontmatter(md).trim()}`;
      })
      .join("\n\n");
  }
  return stripFrontmatter(fs.readFileSync(path.join(root, t.source), "utf8")).trim();
}

async function fetchBody(t, { root, fetchImpl }) {
  let reason;
  try {
    const live = await fetchLive(t, fetchImpl);
    const chars = charCount(live.text);
    if (chars >= MIN_LIVE_CHARS) return { origin: "live", method: live.method, chars, text: live.text };
    reason = `live 本文が短すぎる（${chars} 文字 < ${MIN_LIVE_CHARS}）`;
  } catch (e) {
    reason = `live 取得失敗: ${e.message}`;
  }
  const text = repoText(t, root);
  return { origin: "repo", method: `リポジトリ原稿 ${t.source}`, reason, chars: charCount(text), text };
}

// ---- CLI ----

function parseArgs(argv) {
  const a = { count: DEFAULT_COUNT, urls: [], positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) throw new Error(`${x} needs a value`);
      return argv[++i];
    };
    if (x === "--count") {
      a.count = Number(val());
      if (!Number.isInteger(a.count) || a.count < 1) throw new Error("--count must be a positive integer");
    } else if (x === "--json") a.json = true;
    else if (x === "--list") a.list = true;
    else if (x === "--fetch") a.fetch = true;
    else if (x === "--record") a.record = true;
    else if (x === "--out") a.out = val();
    else if (x === "--url") a.urls.push(val());
    else if (x === "--date") a.date = val();
    else if (x === "--report") a.report = val();
    else if (x === "--root") a.root = val();
    else if (x === "--rotation") a.rotation = val();
    else if (x.startsWith("--")) throw new Error(`unknown option ${x}`);
    else a.positional.push(x);
  }
  return a;
}

function loadRotation(p) {
  const raw = readIfExists(p);
  if (raw === null) return emptyRotation();
  return validateRotation(JSON.parse(raw));
}

function countByKind(targets) {
  const c = {};
  for (const t of targets) c[t.kind] = (c[t.kind] || 0) + 1;
  return c;
}

async function main(argv) {
  const a = parseArgs(argv);
  const root = path.resolve(a.root || process.cwd());
  const rotationPath = path.resolve(root, a.rotation || ROTATION_PATH);
  const rotation = loadRotation(rotationPath);
  const targets = collectTargets(root);

  if (a.record) {
    const known = new Set(targets.map((t) => t.url));
    if (!a.positional.length) throw new Error("--record needs at least one URL");
    for (const u of a.positional)
      if (!known.has(u)) throw new Error(`not a known published URL: ${u}`);
    const next = recordReviews(rotation, a.positional, a.date, a.report);
    fs.mkdirSync(path.dirname(rotationPath), { recursive: true });
    fs.writeFileSync(rotationPath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`${LABEL} recorded ${a.positional.length} URL(s) as ${a.date} in ${path.relative(root, rotationPath)}`);
    return 0;
  }

  if (a.list) {
    const byKind = countByKind(targets);
    const reviewed = targets.filter((t) => rotation.reviewed[t.url]).length;
    if (a.json) {
      console.log(JSON.stringify({ total: targets.length, byKind, reviewed, targets }, null, 2));
    } else {
      console.log(`${LABEL} published targets: ${targets.length} (${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(", ")}), reviewed at least once: ${reviewed}`);
      for (const t of targets) {
        const r = rotation.reviewed[t.url];
        console.log(`  ${t.kind.padEnd(12)} ${(r ? r.last_reviewed : "-").padEnd(10)} ${t.url}  ${t.title}`);
      }
    }
    return 0;
  }

  let picked;
  if (a.urls.length) {
    picked = a.urls.map((u) => {
      const t = targets.find((x) => x.url === u);
      if (!t) throw new Error(`not a known published URL: ${u}`);
      return { ...t, last_reviewed: rotation.reviewed[u] ? rotation.reviewed[u].last_reviewed : null };
    });
  } else {
    picked = selectTargets(targets, rotation, a.count);
  }

  if (!a.fetch) {
    if (a.json) console.log(JSON.stringify(picked, null, 2));
    else {
      console.log(`${LABEL} selected ${picked.length} of ${targets.length} published targets`);
      for (const t of picked)
        console.log(`  ${t.medium.padEnd(8)} last=${t.last_reviewed || "never"}  ${t.url}  ${t.title}  (${t.source})`);
    }
    return 0;
  }

  const outDir = path.resolve(a.out || fs.mkdtempSync(path.join(os.tmpdir(), "reader-review-")));
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];
  for (const [i, t] of picked.entries()) {
    const b = await fetchBody(t, { root, fetchImpl: fetch });
    const file = `${String(i + 1).padStart(2, "0")}-${t.medium}-${t.key}.md`;
    const header = [
      `<!-- reader-review body: ${t.url} -->`,
      `title: ${t.title}`,
      `url: ${t.url}`,
      `origin: ${b.origin} (${b.method})${b.reason ? ` / ${b.reason}` : ""}`,
      `chars: ${b.chars}`,
      "",
      "",
    ].join("\n");
    fs.writeFileSync(path.join(outDir, file), header + b.text + "\n");
    manifest.push(manifestEntry(t, b, file));
    console.log(`${LABEL} ${t.medium.padEnd(8)} ${b.origin.padEnd(4)} ${String(b.chars).padStart(6)} chars  ${t.url}${b.reason ? `  (${b.reason})` : ""}`);
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${LABEL} wrote ${manifest.length} body file(s) + manifest.json to ${outDir}`);
  return 0;
}

// ---- self-test ----

async function selfTest() {
  const t = [];
  const eq = (name, got, want) =>
    t.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });
  const throws = (name, fn, re) => {
    try {
      fn();
      t.push({ name, ok: false, got: "no error", want: String(re) });
    } catch (e) {
      t.push({ name, ok: re.test(e.message), got: e.message, want: String(re) });
    }
  };
  const FX = path.join(__dirname, "fixtures", "reader-review-targets");

  // 1) 列挙: 公開中のものだけを拾う
  const targets = collectTargets(FX);
  eq(
    "fixture の公開記事だけを列挙する（未公開・private・id なし・URL なし・README を除外）",
    targets.map((x) => `${x.kind}:${x.key}`),
    [
      "zenn-article:alpha",
      "zenn-article:gamma",
      "zenn-book:guide",
      "qiita:0123456789abcdef0123",
      "note:n0000000000aa",
      "izanami:post-one",
    ],
  );
  eq(
    "URL を媒体ごとの公開 URL 形式で組み立てる",
    targets.map((x) => x.url),
    [
      "https://zenn.dev/minewo/articles/alpha",
      "https://zenn.dev/minewo/articles/gamma",
      "https://zenn.dev/minewo/books/guide",
      "https://qiita.com/s977043/items/0123456789abcdef0123",
      "https://note.com/mine_unilabo/n/n0000000000aa",
      "https://izanami.dev/post/11111111-2222-3333-4444-555555555555",
    ],
  );
  eq("note のタイトルは本文の H1 から取る", targets.find((x) => x.kind === "note").title, "note の記事タイトル");
  eq("クオート付き title を外す", targets.find((x) => x.key === "alpha").title, "Alpha: コロン入り");

  // 2) 選定: 全媒体を通して未レビュー → 古い順。同順位では媒体を交互に並べる
  const empty = emptyRotation();
  eq(
    "未レビューのみなら媒体を交互に並べる（zenn → qiita → note → izanami → zenn …）",
    selectTargets(targets, empty, 6).map((x) => `${x.medium}:${x.key}`),
    [
      "zenn:alpha",
      "qiita:0123456789abcdef0123",
      "note:n0000000000aa",
      "izanami:post-one",
      "zenn:gamma",
      "zenn:guide",
    ],
  );
  eq(
    "未レビュー多数でも 4 本なら 4 媒体が混ざる",
    selectTargets(targets, empty, 4).map((x) => x.medium),
    ["zenn", "qiita", "note", "izanami"],
  );
  const rot = {
    version: 1,
    reviewed: {
      "https://zenn.dev/minewo/articles/alpha": { last_reviewed: "2026-09-01" },
      "https://zenn.dev/minewo/articles/gamma": { last_reviewed: "2026-08-01" },
      "https://qiita.com/s977043/items/0123456789abcdef0123": { last_reviewed: "2026-07-01" },
      "https://note.com/mine_unilabo/n/n0000000000aa": { last_reviewed: "2026-09-10" },
      "https://izanami.dev/post/11111111-2222-3333-4444-555555555555": { last_reviewed: "2026-09-20" },
    },
  };
  eq(
    "未レビューが残っていれば媒体に関係なく先に選び、続けて古い順",
    selectTargets(targets, rot, 4).map((x) => x.key),
    ["guide", "0123456789abcdef0123", "gamma", "alpha"],
  );
  eq(
    "媒体の割り当てはしない（古い 2 本が同じ Zenn でも両方選ぶ）",
    selectTargets(
      targets,
      recordReviews(recordReviews(rot, ["https://zenn.dev/minewo/books/guide"], "2026-06-01"), [
        "https://qiita.com/s977043/items/0123456789abcdef0123",
      ], "2026-09-25"),
      2,
    ).map((x) => x.key),
    ["guide", "gamma"],
  );
  const sameDay = recordReviews(empty, targets.map((x) => x.url), "2026-09-01");
  eq(
    "全件が同日レビュー済みなら、その中でも媒体を交互に並べる",
    selectTargets(targets, sameDay, 4).map((x) => x.medium),
    ["zenn", "qiita", "note", "izanami"],
  );
  eq(
    "新しくレビューした記事は後ろに回る",
    selectTargets(targets, recordReviews(sameDay, ["https://zenn.dev/minewo/articles/alpha"], "2026-09-29"), 99)
      .map((x) => x.key)
      .pop(),
    "alpha",
  );
  eq("count が総数を超えたら全件", selectTargets(targets, empty, 99).length, targets.length);
  eq(
    "選定結果に last_reviewed を載せる（未レビューは null）",
    selectTargets(targets, rot, 2).map((x) => x.last_reviewed),
    [null, "2026-07-01"],
  );
  eq("既定の本数は 5", parseArgs([]).count, 5);

  // 3) rotation の検証と記録
  throws("version 違いは拒否", () => validateRotation({ version: 2, reviewed: {} }), /version/);
  throws("日付形式違いは拒否", () => validateRotation({ version: 1, reviewed: { u: { last_reviewed: "9/1" } } }), /YYYY-MM-DD/);
  throws("reviewed が配列なら拒否", () => validateRotation({ version: 1, reviewed: [] }), /reviewed/);
  const rec = recordReviews(rot, ["https://zenn.dev/minewo/articles/alpha"], "2026-09-29", "reviews/reader/2026-09-29.md");
  eq("記録は対象 URL だけを更新し他を残す", Object.keys(rec.reviewed).length, 5);
  eq(
    "記録にレポートのパスを残す",
    rec.reviewed["https://zenn.dev/minewo/articles/alpha"],
    { last_reviewed: "2026-09-29", report: "reviews/reader/2026-09-29.md" },
  );
  eq("元の rotation は変更しない", rot.reviewed["https://zenn.dev/minewo/articles/alpha"].last_reviewed, "2026-09-01");
  throws("日付なしの記録は拒否", () => recordReviews(rot, ["x"], undefined), /--date/);

  // 4) HTML → テキスト
  eq(
    "見出し・段落・リスト・画像 alt・実体参照を残す",
    htmlToText('<h2 id="a">見出し</h2><p>本文&amp;続き</p><ul><li>一</li><li>二</li></ul><img src="x.png" alt="図1">'),
    "## 見出し\n\n本文&続き\n\n- 一\n- 二\n\n[画像: 図1]",
  );
  eq(
    "pre はコードブロックとして残し、中のタグは外す",
    htmlToText('<pre><code class="lang-js"><span>a</span> &lt; b\n</code></pre>'),
    "```\na < b\n```",
  );
  eq("script / style は落とす", htmlToText("<p>a</p><script>x()</script><style>.b{}</style>"), "a");
  eq(
    "Zenn の見出し（アンカー + 改行入り）を 1 行にする",
    htmlToText('<h2 id="x">\n<a class="header-anchor-link" href="#x" aria-hidden="true"></a> はじめに</h2>'),
    "## はじめに",
  );
  eq(
    "外部リンクは先を残し、ページ内リンクは文字だけにする",
    htmlToText('<p><a href="https://example.com/a">例</a>と<a href="#b">内部</a></p>'),
    "[例](https://example.com/a)と内部",
  );
  eq(
    "番号付きリストは番号を残す（本文が「1と2」と番号で参照するため）",
    htmlToText("<ol><li>一</li><li>二</li></ol><ul><li>点</li></ul>"),
    "1. 一\n2. 二\n\n- 点",
  );
  eq(
    "表の行は | 区切りで 1 行にする",
    htmlToText("<table><tr><th>軸</th><th>例</th></tr><tr><td>A</td><td>B</td></tr></table>"),
    "| 軸 | 例 |\n| A | B |",
  );
  eq(
    "強調とインラインコードを Markdown 記法で残す",
    htmlToText("<p><strong>要点</strong>は<code>npm run check</code>です</p>"),
    "**要点**は`npm run check`です",
  );
  eq(
    "和文間のソース改行は詰め、英単語間は空白にする",
    htmlToText("<p>日本語の\n文章 and\nEnglish</p>"),
    "日本語の文章 and English",
  );
  eq(
    "pre 内の改行と実体参照は崩さない",
    htmlToText("<pre><code>a\n  &amp;lt;b\n</code></pre>"),
    "```\na\n  &lt;b\n```",
  );

  // 5) izanami 本文抽出（入れ子 div）
  const izn =
    '<div class="nav">メニュー</div><div class="max-w-[100%] overflow-hidden markdown-post"><p>本文</p><div class="x"><p>入れ子</p></div></div><div class="footer">フッター</div>';
  eq("markdown-post の div を入れ子込みで取り出す", htmlToText(extractIzanamiBody(izn)), "本文\n\n入れ子");
  eq("markdown-post が無ければ null", extractIzanamiBody("<div>x</div>"), null);

  // 6) 本文取得のフォールバック（ネットワークを使わない）
  const zennAlpha = targets.find((x) => x.key === "alpha");
  const failing = async () => {
    throw new Error("network down");
  };
  const fb = await fetchBody(zennAlpha, { root: FX, fetchImpl: failing });
  eq("取得失敗ならリポジトリ原稿で代用し理由を残す", [fb.origin, /network down/.test(fb.reason)], ["repo", true]);
  const longHtml = `<p>${"あ".repeat(MIN_LIVE_CHARS + 10)}</p>`;
  const okFetch = async () => ({ ok: true, json: async () => ({ article: { body_html: longHtml } }) });
  const live = await fetchBody(zennAlpha, { root: FX, fetchImpl: okFetch });
  eq("十分な長さが取れたら live", [live.origin, live.chars], ["live", MIN_LIVE_CHARS + 10]);
  const shortFetch = async () => ({ ok: true, json: async () => ({ article: { body_html: "<p>短い</p>" } }) });
  const short = await fetchBody(zennAlpha, { root: FX, fetchImpl: shortFetch });
  eq("短すぎる live 本文は repo に倒す", [short.origin, /短すぎる/.test(short.reason)], ["repo", true]);
  const notFound = async () => ({ ok: false, status: 404 });
  eq("HTTP エラーは repo に倒す", (await fetchBody(zennAlpha, { root: FX, fetchImpl: notFound })).origin, "repo");
  const book = targets.find((x) => x.kind === "zenn-book");
  eq(
    "Book の repo 代用は config の章順で連結する",
    (await fetchBody(book, { root: FX, fetchImpl: failing })).text.match(/^# 第\d章 .+$/gm),
    ["# 第1章 はじめに", "# 第2章 おわりに"],
  );

  // 7) 引数
  throws("--count 0 は拒否", () => parseArgs(["--count", "0"]), /positive integer/);
  throws("未知のオプションは拒否", () => parseArgs(["--nope"]), /unknown option/);
  eq("--url は複数指定できる", parseArgs(["--url", "a", "--url", "b"]).urls, ["a", "b"]);

  // 8) manifest
  const entry = manifestEntry(zennAlpha, { ...fb, source: "取得結果の source" }, "01-zenn-alpha.md");
  eq(
    "manifest は target の source（リポジトリのパス）を保ち、本文を含めない",
    [entry.source, entry.origin, "text" in entry],
    ["articles/alpha.md", "repo", false],
  );

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`${x.ok ? "PASS" : "FAIL"}: ${x.name}`);
  if (failed.length) {
    for (const x of failed)
      console.error(`  ${x.name}\n    got:  ${JSON.stringify(x.got)}\n    want: ${JSON.stringify(x.want)}`);
    console.error(`\n${LABEL} self-test FAILED: ${failed.length}/${t.length}`);
    process.exit(1);
  }
  console.log(`\n${LABEL} self-test OK: ${t.length}/${t.length}`);
}

if (require.main === module) {
  if (process.argv.includes("--self-test")) {
    selfTest().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  } else {
    main(process.argv.slice(2))
      .then((code) => process.exit(code))
      .catch((e) => {
        console.error(`${LABEL} ${e.message}`);
        process.exit(1);
      });
  }
}
