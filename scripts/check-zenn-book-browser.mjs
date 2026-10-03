#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.ZENN_PREVIEW_URL || "http://127.0.0.1:8000";
const chromePath = process.env.CHROME_PATH;
const artifactDir = path.resolve("artifacts/zenn-book-browser");
const configPath = path.resolve("books/river-review-guide/config.yaml");

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

function routeFor(slug) {
  if (slug === "00_introduction") {
    return `${baseUrl}/books/river-review-guide/view/00_introduction`;
  }
  return `${baseUrl}/books/river-review-guide/view/${slug}`;
}

async function inspectPage(page, route, slug, viewportName) {
  const response = await page.goto(route, { waitUntil: "networkidle", timeout: 30_000 });
  if (!response || !response.ok()) {
    throw new Error(`${slug} [${viewportName}] HTTP ${response?.status() ?? "NO_RESPONSE"}`);
  }

  await page.waitForFunction(
    () => document.body && document.body.innerText.trim().length > 0,
    null,
    { timeout: 10_000 },
  );

  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);

    const brokenImages = [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute("src") || "");

    const wideElements = [...document.querySelectorAll("table, pre, code, svg")]
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

    const headings = [...document.querySelectorAll("h1, h2")]
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 8);

    return {
      viewportWidth,
      documentWidth,
      horizontalOverflow: documentWidth > viewportWidth + 2,
      brokenImages,
      wideElements,
      bodyTextLength: body?.innerText.trim().length || 0,
      title: document.title,
      headings,
    };
  });

  const failures = [];
  if (metrics.horizontalOverflow) {
    failures.push(`global horizontal overflow: ${metrics.documentWidth}px > ${metrics.viewportWidth}px`);
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

  return { slug, route, viewport: viewportName, metrics, failures };
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
    results: [],
  };

  try {
    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const mobilePage = await mobile.newPage();

    for (const slug of chapters) {
      const result = await inspectPage(mobilePage, routeFor(slug), slug, "mobile-390");
      report.results.push(result);
      if (result.failures.length) {
        console.error(
          `[check:zenn-book-browser] FAIL ${slug} mobile: ${result.failures.join(" | ")}`,
        );
      }
    }

    for (const slug of ["00_introduction", "21_generation-and-verification", "29_start-with-one-skill", "32_human-review-boundary", "a3_roadmap"]) {
      await mobilePage.goto(routeFor(slug), { waitUntil: "networkidle", timeout: 30_000 });
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

    for (const slug of ["00_introduction", "21_generation-and-verification", "29_start-with-one-skill", "32_human-review-boundary", "a3_roadmap"]) {
      const result = await inspectPage(desktopPage, routeFor(slug), slug, "desktop-1440");
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
    `[check:zenn-book-browser] OK: ${chapters.length} mobile routes + 5 desktop routes`,
  );
}

main().catch((error) => {
  console.error("[check:zenn-book-browser] ERROR");
  console.error(error?.stack || error);
  process.exit(1);
});
