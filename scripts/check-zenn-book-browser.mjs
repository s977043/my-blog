#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const LABEL = "[check:zenn-book-browser]";

function parseArgs(argv) {
  const args = {
    book: process.env.ZENN_BOOK_SLUG || "river-review-guide",
    artifactDir: process.env.ZENN_BOOK_ARTIFACT_DIR || "",
    representativeCount: Number(process.env.ZENN_BOOK_REPRESENTATIVE_COUNT || 7),
    selfTest: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--self-test") {
      args.selfTest = true;
      continue;
    }
    if (token === "--book" || token === "--artifact-dir" || token === "--representative-count") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${token} requires a value`);
      }
      if (token === "--book") args.book = value;
      if (token === "--artifact-dir") args.artifactDir = value;
      if (token === "--representative-count") args.representativeCount = Number(value);
      i += 1;
      continue;
    }
    throw new Error(`unknown argument: ${token}`);
  }

  validateBookSlug(args.book);
  if (!Number.isInteger(args.representativeCount) || args.representativeCount < 1) {
    throw new Error("--representative-count must be a positive integer");
  }

  return args;
}

function validateBookSlug(slug) {
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(String(slug))) {
    throw new Error(`invalid book slug: ${slug}`);
  }
}

function parseChapters(config) {
  const chapters = [];
  let inChapters = false;

  for (const line of String(config).split(/\r?\n/)) {
    if (/^chapters:\s*$/.test(line)) {
      inChapters = true;
      continue;
    }
    if (!inChapters) continue;

    const match = line.match(/^\s{2}-\s+([A-Za-z0-9_-]+)\s*$/);
    if (match) {
      chapters.push(match[1]);
      continue;
    }

    if (/^\S/.test(line)) break;
  }

  return chapters;
}

function selectRepresentativeChapters(chapters, maxCount = 7) {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  if (chapters.length <= maxCount) return [...chapters];
  if (maxCount === 1) return [chapters[0]];

  const selected = [];
  const seen = new Set();
  for (let i = 0; i < maxCount; i += 1) {
    const index = Math.round((i * (chapters.length - 1)) / (maxCount - 1));
    const slug = chapters[index];
    if (!seen.has(slug)) {
      seen.add(slug);
      selected.push(slug);
    }
  }

  if (!seen.has(chapters.at(-1))) selected.push(chapters.at(-1));
  return selected.slice(0, maxCount);
}

function findBodyHtml(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (typeof value.bodyHtml === "string") return value.bodyHtml;

  for (const child of Object.values(value)) {
    const found = findBodyHtml(child, seen);
    if (found) return found;
  }

  return null;
}

function selfTest() {
  const sampleConfig = [
    'title: "Sample"',
    'summary: "Summary"',
    'chapters:',
    '  - 00_intro',
    '  - part1_topic',
    '  - 01_body',
    'published: false',
  ].join("\n");

  const parsed = parseChapters(sampleConfig);
  if (JSON.stringify(parsed) !== JSON.stringify(["00_intro", "part1_topic", "01_body"])) {
    throw new Error(`parseChapters failed: ${JSON.stringify(parsed)}`);
  }

  const ten = Array.from({ length: 10 }, (_, index) => `chapter-${index}`);
  const representative = selectRepresentativeChapters(ten, 4);
  if (
    representative.length !== 4 ||
    representative[0] !== "chapter-0" ||
    representative.at(-1) !== "chapter-9"
  ) {
    throw new Error(`representative selection failed: ${JSON.stringify(representative)}`);
  }

  const short = selectRepresentativeChapters(["a", "b", "c"], 7);
  if (JSON.stringify(short) !== JSON.stringify(["a", "b", "c"])) {
    throw new Error(`short representative selection failed: ${JSON.stringify(short)}`);
  }

  let invalidSlugRejected = false;
  try {
    validateBookSlug("../bad");
  } catch {
    invalidSlugRejected = true;
  }
  if (!invalidSlugRejected) throw new Error("invalid book slug was not rejected");

  const parsedArgs = parseArgs([
    "--book",
    "sample-book",
    "--artifact-dir",
    "tmp/evidence",
    "--representative-count",
    "5",
  ]);
  if (
    parsedArgs.book !== "sample-book" ||
    parsedArgs.artifactDir !== "tmp/evidence" ||
    parsedArgs.representativeCount !== 5
  ) {
    throw new Error(`argument parsing failed: ${JSON.stringify(parsedArgs)}`);
  }

  console.log(`${LABEL} self-test PASS`);
}

async function loadChromium() {
  try {
    const mod = await import("playwright-core");
    return mod.chromium;
  } catch (error) {
    throw new Error(
      `playwright-core is required for browser verification: ${error?.message || error}`,
    );
  }
}

async function runBrowserCheck(options) {
  const baseUrl = process.env.ZENN_PREVIEW_URL || "http://127.0.0.1:8000";
  const chromePath = process.env.CHROME_PATH;
  if (!chromePath) throw new Error("CHROME_PATH is required");

  const bookSlug = options.book;
  const configPath = path.resolve("books", bookSlug, "config.yaml");
  const artifactDir = path.resolve(
    options.artifactDir || path.join("artifacts", "zenn-book-browser", bookSlug),
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(`config.yaml not found for book: ${bookSlug}`);
  }

  const config = fs.readFileSync(configPath, "utf8");
  const chapters = parseChapters(config);
  if (!chapters.length) throw new Error("No chapters found in config.yaml");
  const representative = selectRepresentativeChapters(
    chapters,
    options.representativeCount,
  );

  fs.mkdirSync(artifactDir, { recursive: true });

  async function fetchBookMeta() {
    const apiUrl = `${baseUrl}/api/books/${bookSlug}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`book meta: preview API HTTP ${response.status} at ${apiUrl}`);
    }

    const payload = await response.json();
    const book = payload?.book;
    if (!book) throw new Error("book meta not found in preview API payload");
    if (!book.title || !book.summary) {
      throw new Error(`book meta missing title/summary: ${JSON.stringify(book)}`);
    }
    if (!Array.isArray(book.topics) || book.topics.length === 0) {
      throw new Error(`book meta topics missing: ${JSON.stringify(book.topics)}`);
    }

    return { apiUrl, book };
  }

  async function fetchRenderedChapter(slug) {
    const apiUrl = `${baseUrl}/api/books/${bookSlug}/chapters/${slug}.md`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`${slug}: preview API HTTP ${response.status} at ${apiUrl}`);
    }

    const payload = await response.json();
    const bodyHtml = findBodyHtml(payload);
    if (!bodyHtml) {
      throw new Error(
        `${slug}: bodyHtml not found in preview API payload keys=${Object.keys(payload).join(",")}`,
      );
    }

    return { apiUrl, bodyHtml };
  }

  const chromium = await loadChromium();
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  async function loadPreviewStyles() {
    const page = await browser.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll('link[rel="stylesheet"]')]
          .map((link) => link.href)
          .filter(Boolean),
      );
      return [...new Set(hrefs)];
    } finally {
      await page.close();
    }
  }

  function standaloneHtml(bodyHtml, stylesheetHrefs) {
    const links = stylesheetHrefs
      .map((href) => `<link rel="stylesheet" href="${href}">`)
      .join("\n");

    return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${baseUrl}/">
${links}
<style>
html, body { margin: 0; padding: 0; background: #fff; }
.preview-shell { box-sizing: border-box; width: 100%; max-width: 780px; margin: 0 auto; padding: 24px 16px 80px; }
@media (min-width: 768px) { .preview-shell { padding-left: 32px; padding-right: 32px; } }
</style>
</head>
<body>
<main class="preview-shell">
<article class="znc">${bodyHtml}</article>
</main>
</body>
</html>`;
  }

  async function inspectRenderedPage(page, html, slug, viewportName) {
    await page.setContent(html, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForFunction(
      () => document.querySelector(".znc")?.innerText.trim().length > 0,
      null,
      { timeout: 10_000 },
    );

    const metrics = await page.evaluate(() => {
      const root = document.querySelector(".preview-shell");
      const article = document.querySelector(".znc");
      const viewportWidth = window.innerWidth;

      const brokenImages = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute("src") || "");

      const wideElements = [...article.querySelectorAll("table, pre, code, svg")]
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const parentStyle = el.parentElement ? getComputedStyle(el.parentElement) : null;
          const locallyScrollable =
            ["auto", "scroll"].includes(style.overflowX) ||
            ["auto", "scroll"].includes(parentStyle?.overflowX || "");

          return {
            tag: el.tagName.toLowerCase(),
            width: Math.round(rect.width),
            right: Math.round(rect.right),
            locallyScrollable,
            text: (el.textContent || "").trim().slice(0, 80),
          };
        })
        .filter((item) => item.right > viewportWidth + 2 && !item.locallyScrollable);

      const headings = [...article.querySelectorAll("h1, h2")]
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 8);

      return {
        viewportWidth,
        shellClientWidth: root.clientWidth,
        shellScrollWidth: root.scrollWidth,
        articleClientWidth: article.clientWidth,
        articleScrollWidth: article.scrollWidth,
        contentOverflow:
          root.scrollWidth > root.clientWidth + 2 ||
          article.scrollWidth > article.clientWidth + 2,
        brokenImages,
        wideElements,
        bodyTextLength: article.innerText.trim().length,
        headings,
      };
    });

    const failures = [];
    if (metrics.contentOverflow) {
      failures.push(
        `content overflow shell=${metrics.shellScrollWidth}/${metrics.shellClientWidth} article=${metrics.articleScrollWidth}/${metrics.articleClientWidth}`,
      );
    }
    if (metrics.brokenImages.length) {
      failures.push(`broken images: ${metrics.brokenImages.join(", ")}`);
    }
    if (metrics.wideElements.length) {
      failures.push(`uncontained wide elements: ${JSON.stringify(metrics.wideElements)}`);
    }
    if (metrics.bodyTextLength < 100) {
      failures.push(`body text too short: ${metrics.bodyTextLength}`);
    }
    if (!metrics.headings.length) failures.push("no rendered h1/h2 headings");

    return { slug, viewport: viewportName, metrics, failures };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    bookSlug,
    configPath: path.relative(process.cwd(), configPath),
    artifactDir: path.relative(process.cwd(), artifactDir),
    chapters: chapters.length,
    representative,
    renderer: "zenn-preview-api + preview stylesheets",
    results: [],
  };

  try {
    const stylesheetHrefs = await loadPreviewStyles();
    report.stylesheetHrefs = stylesheetHrefs;

    const { apiUrl: bookApiUrl, book } = await fetchBookMeta();
    report.book = {
      apiUrl: bookApiUrl,
      title: book.title,
      summary: book.summary,
      topics: book.topics,
    };

    const bookUi = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    const bookUiPage = await bookUi.newPage();
    const bookUiResponse = await bookUiPage.goto(`${baseUrl}/books/${bookSlug}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    if (!bookUiResponse || !bookUiResponse.ok()) {
      throw new Error(`book top HTTP ${bookUiResponse?.status() ?? "NO_RESPONSE"}`);
    }

    await bookUiPage.getByText(book.title, { exact: false }).first().waitFor({ timeout: 10_000 });
    const bookTopText = await bookUiPage.locator("body").innerText();
    if (!bookTopText.includes(book.summary)) {
      throw new Error("book top does not render configured summary");
    }
    for (const topic of book.topics) {
      if (!bookTopText.includes(topic)) {
        throw new Error(`book top does not render topic: ${topic}`);
      }
    }

    const includedChapterItems = await bookUiPage
      .locator(".book-show__chapters")
      .first()
      .locator("a")
      .count();
    const excludedChapterItems = await bookUiPage
      .locator(".book-show__excluded-chapters .book-show__chapters a")
      .count();

    if (includedChapterItems !== chapters.length) {
      throw new Error(
        `book top included chapter count mismatch: UI=${includedChapterItems} config=${chapters.length}`,
      );
    }
    report.book.chapterCount = includedChapterItems;
    report.book.excludedMarkdownCount = excludedChapterItems;

    const validationErrors = await bookUiPage.locator(".book-header__validation-errors").count();
    if (validationErrors !== 0) {
      const validationText = await bookUiPage
        .locator(".book-header__validation-errors")
        .innerText();
      throw new Error(`book top validation error: ${validationText}`);
    }

    const coverCount = await bookUiPage.locator(".book-header__cover-img").count();
    if (coverCount > 0) {
      const cover = await bookUiPage
        .locator(".book-header__cover-img")
        .first()
        .evaluate((img) => ({
          src: img.getAttribute("src") || "",
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        }));
      if (!cover.complete || cover.naturalWidth === 0 || cover.naturalHeight === 0) {
        throw new Error(`book cover failed to load: ${JSON.stringify(cover)}`);
      }
      report.book.cover = cover;
    } else {
      report.book.cover = null;
    }

    await bookUiPage.screenshot({
      path: path.join(artifactDir, "desktop-book-top.png"),
      fullPage: true,
    });
    await bookUi.close();

    const rendered = new Map();
    for (const slug of chapters) {
      rendered.set(slug, await fetchRenderedChapter(slug));
    }

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const mobilePage = await mobile.newPage();

    for (const slug of chapters) {
      const { bodyHtml, apiUrl } = rendered.get(slug);
      const html = standaloneHtml(bodyHtml, stylesheetHrefs);
      const result = await inspectRenderedPage(mobilePage, html, slug, "mobile-390");
      result.apiUrl = apiUrl;
      report.results.push(result);

      if (result.failures.length) {
        console.error(`${LABEL} FAIL ${slug} mobile: ${result.failures.join(" | ")}`);
      }
    }

    for (const slug of representative) {
      const { bodyHtml } = rendered.get(slug);
      await mobilePage.setContent(standaloneHtml(bodyHtml, stylesheetHrefs), {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      await mobilePage.screenshot({
        path: path.join(artifactDir, `mobile-${slug}.png`),
        fullPage: true,
      });
    }
    await mobile.close();

    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktop.newPage();

    for (const slug of representative) {
      const { bodyHtml } = rendered.get(slug);
      const html = standaloneHtml(bodyHtml, stylesheetHrefs);
      const result = await inspectRenderedPage(desktopPage, html, slug, "desktop-1440");
      report.results.push(result);
      await desktopPage.screenshot({
        path: path.join(artifactDir, `desktop-${slug}.png`),
        fullPage: true,
      });
    }
    await desktop.close();
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(artifactDir, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );

  const failures = report.results.flatMap((result) =>
    result.failures.map((failure) => `${result.slug} [${result.viewport}]: ${failure}`),
  );

  if (failures.length) {
    console.error(`${LABEL} FAILED: ${failures.length} issue(s)`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(
    `${LABEL} OK: ${bookSlug} / book top + ${chapters.length} mobile chapters + ${representative.length} desktop representative chapters`,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) {
    selfTest();
    return;
  }
  await runBrowserCheck(options);
}

main().catch((error) => {
  console.error(`${LABEL} ERROR`);
  console.error(error?.stack || error);
  process.exit(1);
});

export { parseArgs, parseChapters, selectRepresentativeChapters, validateBookSlug };
