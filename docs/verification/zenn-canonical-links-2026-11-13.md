# Zenn canonical article links: repair and verification

## Scope and plan

Base: `45c682028aa1b3a74236e820349a01e06bab9b01` (main, 2026-11-13).
Repair the missing-author URL pattern in Zenn article Markdown, including already
published articles and the links introduced by #1036, queued in release PR #1038.
Do not alter article claims, frontmatter, publication flags, titles, or slugs.
Correct the guidance and existing link checker so the same pattern cannot pass again.

Completion criteria: all affected Markdown link destinations use the canonical
`https://zenn.dev/minewo/articles/<slug>` route; content otherwise unchanged;
regression tests reject missing-author routes even when a local article exists;
existing checks and independent review are recorded honestly.

PlanGate and River Review Plugin were not available in this task's tool/skill catalog
or the checkout. This is an explicit manual plan and independent agent review, not a
claim that either Plugin executed. No CLI substitute was represented as Plugin use.

## Release boundary

This change targets main only. Existing article changes require the warning banner
and author review under AGENTS.md. No automatic merge or release is authorized by
this patch. After main approval/merge, update the existing release sync rather than
publishing its old HEAD; preserve all publication flags and run the release pace check.
A passing local existence check is not proof of live publication or HTTP reachability.

## Verification loops

1. Requirements: inventoried the same defect across 31 Zenn article files; 69 link
   destinations repaired. Main and release flow checked; no new article publication.
2. Behavior: regression tests cover canonical and authorless URLs, fragments, queries,
   trailing slashes, missing local articles, unrelated authors/domains, and images.
3. Design/security: bounded local existence checks retained; no network calls added
   to CI, credentials, dependency changes, or automatic publishing.
4. Regression/integration: see PR test results for aggregate checks and independent
   review. The article diff must be exactly the destination prefix substitution.
5. Completion: review final diff and latest main/PR state before PR creation. A Draft
   PR is not completion of release; live application requires a separate approved sync.

## Results

- Exact-diff invariant passed across all 31 article files (69 destinations); no
  frontmatter, claims, labels, or publication flags changed.
- Canonical article URLs in articles/: 41 unique URLs checked with HTTP GET,
  all returned 200 on 2026-11-13. This confirms destinations, not deployed source links.
- Focused regression test and 123-file internal-link check passed.
- Independent reviewer found the new test missing from CI. Added it to the existing
  self-test step, reran tests, and obtained a clean second review.
- Aggregate check initially failed for Qiita's default cache write location and a
  pre-existing stale article graph. XDG_CACHE_HOME relocated the disposable Qiita
  cache; that check passed. Graph generation changes seed counts from 26/18 to 27/19
  on this base; this unrelated generated-file drift is not changed here.
- Local runtime: Node 24.22.1. Hosted CI and publication are pending.
