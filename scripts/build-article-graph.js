#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const LIST_KEYS = new Set(["topics", "promoted_to", "article_type_candidates"]);
const EVIDENCE_STATUSES = new Set(["observed", "verified", "unverified"]);
const SEED_ID_RE = /^seed-\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function repoRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch (e) {
    const reason = typeof e.status === "number" ? "git rev-parse failed" : e.code || e.message;
    throw new Error(`article graph requires a git repository: ${reason}`);
  }
}

function unquote(value) {
  const v = value.trim();
  if (
    v.length >= 2 &&
    ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
  ) return v.slice(1, -1);
  return v;
}

function parseFrontmatter(content) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") return {};
  const end = lines.indexOf("---", 1);
  if (end === -1) return {};

  const out = {};
  for (let i = 1; i < end; i += 1) {
    const line = lines[i];
    if (!line || /^\s*#/.test(line)) continue;
    const m = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!m) continue;
    const key = m[1];
    const raw = (m[2] || "").trim();
    if (raw !== "") {
      out[key] = unquote(raw);
      continue;
    }
    const items = [];
    let j = i + 1;
    while (j < end) {
      const item = lines[j].match(/^\s+-\s+(.*)$/);
      if (!item) break;
      items.push(unquote(item[1]));
      j += 1;
    }
    if (items.length > 0 || LIST_KEYS.has(key)) {
      out[key] = items;
      i = j - 1;
    } else {
      out[key] = "";
    }
  }
  return out;
}

function collectSeedFiles(root) {
  const base = path.join(root, "article_seeds");
  const out = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
        continue;
      }
      if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
      if (ent.name === "README.md" || ent.name === "TEMPLATE.md") continue;
      out.push(full);
    }
  }
  if (!fs.existsSync(base)) throw new Error(`article_seeds not found: ${base}`);
  walk(base);
  return out.sort();
}

function legacyId(relativePath) {
  return `legacy:${relativePath.replace(/\\/g, "/").replace(/\.md$/, "")}`;
}

function validateOptedInSeed(meta, relativePath) {
  const errors = [];
  if (!SEED_ID_RE.test(meta.seed_id)) {
    errors.push(`${relativePath}: invalid seed_id "${meta.seed_id}"`);
  }
  if (!meta.source) errors.push(`${relativePath}: source is required when seed_id is present`);
  if (!EVIDENCE_STATUSES.has(meta.evidence_status)) {
    errors.push(`${relativePath}: evidence_status must be one of ${[...EVIDENCE_STATUSES].join(", ")}`);
  }
  if (
    meta.source &&
    meta.source !== "experience" &&
    !String(meta.source_url || "").trim() &&
    !String(meta.source_ref || "").trim()
  ) {
    errors.push(`${relativePath}: source_url or source_ref is required for non-experience sources`);
  }
  if (meta.source_url && !/^https?:\/\//.test(String(meta.source_url))) {
    errors.push(`${relativePath}: source_url must be http(s)`);
  }
  return errors;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [String(value)];
}

function readSeedRecord(root, file) {
  const meta = parseFrontmatter(fs.readFileSync(file, "utf8"));
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const optedIn = Boolean(meta.seed_id);
  const errors = optedIn ? validateOptedInSeed(meta, rel) : [];
  const warnings = optedIn
    ? []
    : [`${rel}: legacy seed (seed_id/evidence_status not required retroactively)`];

  return {
    id: optedIn ? meta.seed_id : legacyId(rel),
    path: rel,
    title: meta.title || path.basename(file, ".md"),
    date: meta.date || "",
    status: meta.status || "",
    topics: normalizeList(meta.topics),
    source: meta.source || "",
    source_url: meta.source_url || "",
    source_ref: meta.source_ref || "",
    evidence_status: meta.evidence_status || "",
    promoted_to: normalizeList(meta.promoted_to),
    article_type_candidates: normalizeList(meta.article_type_candidates),
    legacy: !optedIn,
    errors,
    warnings,
  };
}

function graphFromRecords(records) {
  const errors = [];
  const warnings = [];
  const seen = new Map();

  for (const r of records) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    if (seen.has(r.id)) {
      errors.push(`${r.path}: duplicate seed_id "${r.id}" (already used by ${seen.get(r.id)})`);
    } else {
      seen.set(r.id, r.path);
    }
  }

  const nodes = [...records]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(({ errors: _errors, warnings: _warnings, ...r }) => r);

  const edges = [];
  for (const r of nodes) {
    for (const target of r.promoted_to) {
      edges.push({ from: r.id, relation: "promoted_to", to: target });
    }
  }
  edges.sort((a, b) => `${a.from}\u0000${a.to}`.localeCompare(`${b.from}\u0000${b.to}`));

  return {
    schema_version: 1,
    generated_by: "scripts/build-article-graph.js",
    nodes,
    edges,
    warnings: warnings.sort(),
    errors: errors.sort(),
  };
}

function buildGraph(root) {
  return graphFromRecords(collectSeedFiles(root).map((file) => readSeedRecord(root, file)));
}

function graphForOutput(graph) {
  const { errors: _errors, ...rest } = graph;
  return rest;
}

function renderJson(graph) {
  return JSON.stringify(graphForOutput(graph), null, 2) + "\n";
}

function escCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function renderMarkdown(graph) {
  const explicit = graph.nodes.filter((n) => !n.legacy).length;
  const legacy = graph.nodes.length - explicit;
  const lines = [
    "# Article Graph",
    "",
    "> Generated by `npm run build:article-graph`. Do not edit this file directly.",
    "",
    "This is a read-only projection of `article_seeds/`. The source of truth remains each seed file and `docs/article-lifecycle-contract.md`.",
    "",
    "## Summary",
    "",
    `- Seeds: ${graph.nodes.length}`,
    `- Explicit provenance contract: ${explicit}`,
    `- Legacy seeds: ${legacy}`,
    `- Promotion edges: ${graph.edges.length}`,
    "",
    "## Seeds",
    "",
    "| ID | Date | Status | Source | Evidence | Types | Title | Path | Promotions |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | ---: |",
  ];

  for (const n of graph.nodes) {
    lines.push(
      `| \`${escCell(n.id)}\` | ${escCell(n.date)} | ${escCell(n.status)} | ${escCell(n.source)} | ${escCell(n.evidence_status || (n.legacy ? "legacy" : ""))} | ${escCell((n.article_type_candidates || []).join(", "))} | ${escCell(n.title)} | \`${escCell(n.path)}\` | ${n.promoted_to.length} |`
    );
  }

  lines.push("", "## Promotions", "");
  if (graph.edges.length === 0) lines.push("- None");
  else for (const e of graph.edges) lines.push(`- \`${e.from}\` → ${e.to}`);

  lines.push("", "## Warnings", "");
  if (graph.warnings.length === 0) lines.push("- None");
  else for (const w of graph.warnings) lines.push(`- ${w}`);
  lines.push("");
  return lines.join("\n");
}

function writeIfChanged(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const prev = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (prev === content) return false;
  fs.writeFileSync(file, content);
  return true;
}

function expectedOutputs(root) {
  const graph = buildGraph(root);
  if (graph.errors.length > 0) {
    throw new Error(`article graph validation failed:\n- ${graph.errors.join("\n- ")}`);
  }
  return { graph, json: renderJson(graph), markdown: renderMarkdown(graph) };
}

function selfTest(root) {
  const tests = [];
  const eq = (name, got, want) =>
    tests.push({ name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });

  const fm = parseFrontmatter([
    "---",
    "seed_id: seed-20260923-example",
    'title: "Example: seed"',
    "topics:",
    "  - a",
    "  - b",
    "promoted_to:",
    "source: experience",
    "evidence_status: observed",
    "---",
    "# body",
  ].join("\n"));
  eq("frontmatter scalar", fm.title, "Example: seed");
  eq("frontmatter list", fm.topics, ["a", "b"]);
  eq("empty list", fm.promoted_to, []);
  eq("legacy id", legacyId("article_seeds/example/foo.md"), "legacy:article_seeds/example/foo");

  eq(
    "opted-in seed requires evidence",
    validateOptedInSeed(
      { seed_id: "seed-20260923-example", source: "experience", evidence_status: "" },
      "x.md"
    ).length > 0,
    true
  );
  eq(
    "external source requires provenance pointer",
    validateOptedInSeed(
      { seed_id: "seed-20260923-example", source: "external", evidence_status: "verified" },
      "x.md"
    ).some((x) => x.includes("source_url or source_ref")),
    true
  );

  const base = {
    title: "x",
    date: "",
    status: "seed",
    topics: [],
    source: "experience",
    source_url: "",
    source_ref: "",
    evidence_status: "observed",
    promoted_to: [],
    legacy: false,
    errors: [],
    warnings: [],
  };
  const duplicate = graphFromRecords([
    { ...base, id: "seed-20260923-same", path: "a.md" },
    { ...base, id: "seed-20260923-same", path: "b.md" },
  ]);
  eq("duplicate IDs fail", duplicate.errors.length, 1);

  const actual = buildGraph(root);
  eq("repository graph has seeds", actual.nodes.length > 0, true);
  eq("legacy repository remains valid", actual.errors, []);

  const failed = tests.filter((t) => !t.ok);
  for (const t of tests) console.log(`  ${t.ok ? "ok  " : "FAIL"} ${t.name}`);
  if (failed.length > 0) {
    console.error(`\n[article-graph] self-test FAILED: ${failed.length}/${tests.length}`);
    process.exit(1);
  }
  console.log(`\n[article-graph] self-test OK: ${tests.length}/${tests.length}`);
}

function main() {
  const root = repoRoot();
  if (process.argv.includes("--self-test")) {
    selfTest(root);
    return;
  }

  const { json, markdown } = expectedOutputs(root);
  const jsonPath = path.join(root, "docs/article-graph.json");
  const mdPath = path.join(root, "docs/article-graph.md");

  if (process.argv.includes("--check")) {
    const mismatches = [];
    if (!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, "utf8") !== json) {
      mismatches.push("docs/article-graph.json");
    }
    if (!fs.existsSync(mdPath) || fs.readFileSync(mdPath, "utf8") !== markdown) {
      mismatches.push("docs/article-graph.md");
    }
    if (mismatches.length > 0) {
      console.error(`[article-graph] generated outputs are stale: ${mismatches.join(", ")}. Run npm run build:article-graph.`);
      process.exit(1);
    }
    console.log("[article-graph] generated outputs are up to date");
    return;
  }

  const changed = [];
  if (writeIfChanged(jsonPath, json)) changed.push("docs/article-graph.json");
  if (writeIfChanged(mdPath, markdown)) changed.push("docs/article-graph.md");
  console.log(changed.length > 0 ? `[article-graph] updated: ${changed.join(", ")}` : "[article-graph] no changes");
}

if (require.main === module) main();

module.exports = {
  parseFrontmatter,
  legacyId,
  validateOptedInSeed,
  graphFromRecords,
  buildGraph,
  renderJson,
  renderMarkdown,
};
