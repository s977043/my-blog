#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.ZENN_PREVIEW_URL || "http://127.0.0.1:8000";
const chromePath = process.env.CHROME_PATH;
const artifactDir = path.resolve("artifacts/zenn-book-browser");
const configPath = path.resolve("books/river-review-guide/config.yaml");
const bookSlug = "river-review-guide";

if (!chromePath) {
  console.error("[check:zenn-book-browser] CHROME_PATH is required");
  process.exit(1);
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

async function loadPreviewStyles(browser) {
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
  if (!metrics.headings.length) {
    failures.push("no rendered h1/h2 headings");
  }

  return { slug, viewport: viewportName, metrics, failures };
}

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const config = fs.readFileSync(configPath, "utf8");
  const chapters = parseChapters(config);
  if (!chapters.length) throw new Error("No chapters found in config.yaml");

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    chapters: chapters.length,
    renderer: "zenn-preview-api + preview stylesheets",
    results: [],
  };

  try {
    const stylesheetHrefs = await loadPreviewStyles(browser);
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
        console.error(
          `[check:zenn-book-browser] FAIL ${slug} mobile: ${result.failures.join(" | ")}`,
        );
      }
    }

    const representative = [
      "00_introduction",
      "06_review-the-development-flow",
      "13_human-judgment",
      "21_generation-and-verification",
      "29_start-with-one-skill",
      "32_human-review-boundary",
      "a3_roadmap",
    ];

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
    console.error(`[check:zenn-book-browser] FAILED: ${failures.length} issue(s)`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log(
    `[check:zenn-book-browser] OK: book top + ${chapters.length} mobile rendered chapters + 7 desktop chapters`,
  );
}

main().catch((error) => {
  console.error("[check:zenn-book-browser] ERROR");
  console.error(error?.stack || error);
  process.exit(1);
});
