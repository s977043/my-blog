#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PATHS = {
  skill: '.claude/skills/zenn-book-writing/SKILL.md',
  bookContract: '.claude/skills/zenn-book-writing/references/book-contract.md',
  reviewLoop: '.claude/skills/zenn-book-writing/references/review-loop.md',
  publishGate: '.claude/skills/zenn-book-writing/references/publish-gate.md',
  templateConfig: 'templates/zenn-book/config.yaml',
  templateReadme: 'templates/zenn-book/README.md',
  templatePlan: 'templates/zenn-book/BOOK_PLAN.md',
  templatePublish: 'templates/zenn-book/PUBLISH_CHECKLIST.md',
  generator: 'scripts/create-zenn-book.js',
  structureCheck: 'scripts/check-zenn-book-structure.js',
  browserCheck: 'scripts/check-zenn-book-browser.mjs',
  routing: '.claude/evals/article-skill-routing.json',
  packageJson: 'package.json',
  ciWorkflow: '.github/workflows/ci.yml',
}

function requireTokens(errors, label, text, tokens) {
  for (const token of tokens) {
    if (!String(text).includes(token)) errors.push(`${label} missing token: ${token}`)
  }
}

function validate(files) {
  const errors = []
  for (const file of Object.values(PATHS)) {
    if (!(file in files)) errors.push(`missing file: ${file}`)
  }
  if (errors.length) return errors

  const skill = files[PATHS.skill]
  const bookContract = files[PATHS.bookContract]
  const reviewLoop = files[PATHS.reviewLoop]
  const publishGate = files[PATHS.publishGate]
  const templateConfig = files[PATHS.templateConfig]
  const templateReadme = files[PATHS.templateReadme]
  const templatePlan = files[PATHS.templatePlan]
  const templatePublish = files[PATHS.templatePublish]
  const generator = files[PATHS.generator]
  const structureCheck = files[PATHS.structureCheck]
  const browserCheck = files[PATHS.browserCheck]
  const ciWorkflow = files[PATHS.ciWorkflow]

  requireTokens(errors, 'skill', skill, [
    'references/book-contract.md',
    'references/review-loop.md',
    'references/publish-gate.md',
    '単発記事なら',
    'tech-blog-writing',
    'published: true',
    'userの当該PRへの明示指示なしにmergeしない',
  ])

  requireTokens(errors, 'book contract', bookContract, [
    'Reader Problem',
    'Reader Transformation',
    'Central Claim',
    'Existing Content Boundary',
    'Evidence Boundary',
    'Source Baseline',
    'Chapter Responsibility Map',
  ])

  requireTokens(errors, 'review loop', reviewLoop, [
    'Reader Journey',
    'Evidence / Claim',
    'Responsibility / De-dup',
    'Book-wide Review',
    'Skeptical practitioner',
  ])

  requireTokens(errors, 'publish gate', publishGate, [
    'npm run check:zenn-books',
    'npm run list:books',
    'npm run check',
    'UNVERIFIED',
    'published: false',
    'cover image',
    'Book → Zenn article link',
  ])

  requireTokens(errors, 'template config', templateConfig, [
    'published: false',
    'part1_topic',
    '00_introduction',
    '99_afterword',
  ])

  requireTokens(errors, 'template README', templateReadme, [
    'BOOK_PLAN.md',
    'SOURCE_MAP.md',
    'PUBLISH_CHECKLIST.md',
    '--dry-run',
    'cover.png',
    'repository相対パス',
  ])

  requireTokens(errors, 'template plan', templatePlan, [
    'Reader Problem',
    'Reader Transformation',
    'Central Claim',
    'Evidence Boundary',
    'Source Baseline',
    'Chapter Responsibility Map',
    'Definition of Done',
  ])

  requireTokens(errors, 'template publish checklist', templatePublish, [
    'npm run check:zenn-books',
    'npm run list:books',
    'npm run check',
    'published: false',
    'cover image',
    'repositoryファイル相対パス',
  ])

  requireTokens(errors, 'generator', generator, [
    'dry-run',
    'target already exists',
    'published must default to false',
    'unresolved token in',
  ])

  requireTokens(errors, 'structure checker', structureCheck, [
    '--all',
    'modernH1ByBookPlan',
    'validateBooksRoot',
    'checkPlaceholders',
  ])

  requireTokens(errors, 'browser checker', browserCheck, [
    '--book',
    'selectRepresentativeChapters',
    'mobile-390',
    'desktop-1440',
    'artifacts',
    'zenn-book-browser',
    '--self-test',
  ])

  let routing
  try {
    routing = JSON.parse(files[PATHS.routing])
  } catch (error) {
    errors.push(`routing JSON invalid: ${error.message}`)
  }
  if (routing) {
    if (!routing.candidateSkills?.includes(PATHS.skill)) {
      errors.push('routing candidateSkills missing zenn-book-writing')
    }
    const positives = (routing.cases || []).filter((item) => item.expectedSkill === 'zenn-book-writing')
    if (positives.length < 3) {
      errors.push(`zenn-book-writing requires at least 3 routing cases, found ${positives.length}`)
    }
  }

  let pkg
  try {
    pkg = JSON.parse(files[PATHS.packageJson])
  } catch (error) {
    errors.push(`package.json invalid: ${error.message}`)
  }
  if (pkg) {
    for (const script of [
      'new:zenn-book',
      'test:zenn-book-template',
      'check:zenn-books',
      'check:zenn-book-writing-contract',
      'test:zenn-book-writing-contract',
      'check:zenn-book-browser',
      'check:river-review-book-browser',
      'test:zenn-book-browser',
    ]) {
      if (!pkg.scripts?.[script]) errors.push(`package scripts missing: ${script}`)
    }
    if (!String(pkg.scripts?.check || '').includes('check:zenn-book-writing-contract')) {
      errors.push('aggregate check missing check:zenn-book-writing-contract')
    }
  }

  requireTokens(errors, 'CI workflow', ciWorkflow, [
    'npm run test:zenn-book-structure',
    'npm run test:zenn-book-template',
    'npm run test:zenn-book-writing-contract',
    'npm run test:zenn-book-browser',
    'npm run check:river-review-book-browser',
    'npm run check',
  ])

  return errors
}

function readRepoFiles() {
  const files = {}
  for (const file of Object.values(PATHS)) {
    const absolute = path.join(ROOT, file)
    if (fs.existsSync(absolute)) files[file] = fs.readFileSync(absolute, 'utf8')
  }
  return files
}

function selfTest() {
  const base = readRepoFiles()
  const valid = validate(base)
  if (valid.length) throw new Error(`valid repository fixture failed: ${valid.join('; ')}`)

  const missingRef = {
    ...base,
    [PATHS.skill]: base[PATHS.skill].replaceAll('references/book-contract.md', ''),
  }
  if (!validate(missingRef).some((e) => e.includes('references/book-contract.md'))) {
    throw new Error('missing skill reference was not rejected')
  }

  const unsafePublish = {
    ...base,
    [PATHS.templateConfig]: base[PATHS.templateConfig].replace('published: false', 'published: true'),
  }
  if (!validate(unsafePublish).some((e) => e.includes('template config missing token: published: false'))) {
    throw new Error('unsafe published default was not rejected')
  }

  const routing = JSON.parse(base[PATHS.routing])
  routing.cases = routing.cases.filter((item) => item.expectedSkill !== 'zenn-book-writing').slice(0)
  const missingRouting = { ...base, [PATHS.routing]: JSON.stringify(routing) }
  if (!validate(missingRouting).some((e) => e.includes('requires at least 3 routing cases'))) {
    throw new Error('missing routing cases were not rejected')
  }

  const pkg = JSON.parse(base[PATHS.packageJson])
  delete pkg.scripts['check:zenn-books']
  const missingScript = { ...base, [PATHS.packageJson]: JSON.stringify(pkg) }
  if (!validate(missingScript).some((e) => e.includes('package scripts missing: check:zenn-books'))) {
    throw new Error('missing package script was not rejected')
  }

  const missingCiWiring = {
    ...base,
    [PATHS.ciWorkflow]: base[PATHS.ciWorkflow].replace('npm run test:zenn-book-writing-contract', ''),
  }
  if (!validate(missingCiWiring).some((e) => e.includes('CI workflow missing token'))) {
    throw new Error('missing CI self-test wiring was not rejected')
  }

  const missingBrowserScript = {
    ...base,
    [PATHS.packageJson]: base[PATHS.packageJson].replace('"check:zenn-book-browser"', '"removed:zenn-book-browser"'),
  }
  if (!validate(missingBrowserScript).some((e) => e.includes('package scripts missing: check:zenn-book-browser'))) {
    throw new Error('missing browser script was not rejected')
  }

  const missingBrowserCi = {
    ...base,
    [PATHS.ciWorkflow]: base[PATHS.ciWorkflow].replace('npm run test:zenn-book-browser', ''),
  }
  if (!validate(missingBrowserCi).some((e) => e.includes('CI workflow missing token'))) {
    throw new Error('missing browser CI wiring was not rejected')
  }

  console.log('[test:zenn-book-writing-contract] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const errors = validate(readRepoFiles())
  if (errors.length) {
    console.error('[check:zenn-book-writing-contract] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }

  console.log('[check:zenn-book-writing-contract] PASS')
}

if (require.main === module) main()
module.exports = { PATHS, validate }
