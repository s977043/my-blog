#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PATHS = {
  skill: '.claude/skills/article-humanizer-ja/SKILL.md',
  command: '.claude/commands/humanize-review.md',
  workflow: '.claude/workflows/article-review-improve-loop.js',
  languageScript: 'scripts/check-article-language-density.js',
  package: 'package.json',
}

function extractAllowedTools(skill) {
  const frontMatter = String(skill).match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontMatter) return []
  const lines = frontMatter[1].split(/\r?\n/)
  const start = lines.findIndex((line) => /^allowed-tools:\s*$/.test(line))
  if (start < 0) return []
  const tools = []
  for (let i = start + 1; i < lines.length; i++) {
    const match = lines[i].match(/^\s+-\s+(.+?)\s*$/)
    if (!match) break
    tools.push(match[1])
  }
  return tools
}

function extractPatternIds(markdown) {
  const ids = []
  for (const line of String(markdown).split(/\r?\n/)) {
    const match = line.match(/^\|\s*([FST]\d{2})\s*\|/)
    if (match) ids.push(match[1])
  }
  return ids
}

function validate(files) {
  const errors = []
  for (const file of Object.values(PATHS)) {
    if (!(file in files)) errors.push(`missing file: ${file}`)
  }
  if (errors.length) return errors

  const skill = files[PATHS.skill]
  const allowedTools = extractAllowedTools(skill)
  for (const tool of ['Edit', 'Write', 'Bash', 'AskUserQuestion']) {
    if (allowedTools.includes(tool)) errors.push(`review-only skill must not allow ${tool}`)
  }
  for (const tool of ['Read', 'Grep', 'Glob']) {
    if (!allowedTools.includes(tool)) errors.push(`allowed-tools must include ${tool}`)
  }
  if (!skill.includes('review-only')) errors.push('SKILL.md must state review-only')

  const patternIds = extractPatternIds(skill)
  if (patternIds.length < 23) errors.push(`expected at least 23 patterns, found ${patternIds.length}`)
  const duplicates = patternIds.filter((id, index) => patternIds.indexOf(id) !== index)
  if (duplicates.length) errors.push(`duplicate pattern IDs: ${[...new Set(duplicates)].join(', ')}`)
  for (const id of ['S15', 'S16', 'S17']) {
    if (!patternIds.includes(id)) errors.push(`SKILL.md missing language-density pattern: ${id}`)
  }

  for (const token of ['Front Matter', 'code', 'URL', '引用', '数値', 'バージョン', '筆者の実体験']) {
    if (!skill.includes(token)) errors.push(`SKILL.md missing protected content: ${token}`)
  }
  if (!skill.includes('4cc01cdd5aff4102888e9396c3ba16da99828f78')) {
    errors.push('SKILL.md must pin the reviewed upstream commit')
  }
  if (!skill.includes('MIT License')) errors.push('SKILL.md must include MIT attribution')

  const command = files[PATHS.command]
  if (!command.includes('.claude/skills/article-humanizer-ja/SKILL.md')) {
    errors.push('humanize-review command must reference the local skill')
  }
  if (!command.includes('記事本文は変更しない')) {
    errors.push('humanize-review command must explicitly prohibit article edits')
  }

  const workflow = files[PATHS.workflow]
  const humanizePhase = workflow.indexOf("{ title: 'Humanize' }")
  const verifyPhase = workflow.indexOf("{ title: 'Verify' }")
  if (humanizePhase < 0) errors.push('workflow missing Humanize phase')
  if (verifyPhase < 0) errors.push('workflow missing Verify phase')
  if (humanizePhase >= 0 && verifyPhase >= 0 && humanizePhase > verifyPhase) {
    errors.push('Humanize phase must run before Verify')
  }
  for (const token of ['HUMANIZE_SCHEMA', 'humanizePrompt', 'review-only', 'workflowVerified', "phase('Humanize')", "phase('Verify')", '.claude/skills/article-humanizer-ja/SKILL.md']) {
    if (!workflow.includes(token)) errors.push(`workflow missing contract token: ${token}`)
  }

  const languageScript = files[PATHS.languageScript]
  for (const token of ['analyzeMarkdown', 'WARN only', '--self-test']) {
    if (!languageScript.includes(token)) errors.push(`language-density script missing contract token: ${token}`)
  }

  let pkg
  try {
    pkg = JSON.parse(files[PATHS.package])
  } catch (error) {
    errors.push(`package.json parse failed: ${error.message}`)
    return errors
  }

  const expectedScripts = {
    'check:article-humanizer-contract': 'node scripts/check-article-humanizer.js',
    'check:article-language-density': 'node scripts/check-article-language-density.js',
    'check:article-humanizer': 'npm run check:article-humanizer-contract && npm run check:article-language-density',
    'test:article-humanizer-contract': 'node scripts/check-article-humanizer.js --self-test',
    'test:article-language-density': 'node scripts/check-article-language-density.js --self-test',
    'test:article-humanizer': 'npm run test:article-humanizer-contract && npm run test:article-language-density',
  }
  for (const [name, expected] of Object.entries(expectedScripts)) {
    if (pkg.scripts?.[name] !== expected) errors.push(`package.json script ${name} must be: ${expected}`)
  }

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
  const base = {}
  for (const file of Object.values(PATHS)) base[file] = ''
  const patternRows = [
    ...Array.from({ length: 5 }, (_, i) => `| F${String(i + 1).padStart(2, '0')} | x | x | low |`),
    ...Array.from({ length: 17 }, (_, i) => `| S${String(i + 1).padStart(2, '0')} | x | x | low |`),
    '| T01 | x | x | low |',
  ].join('\n')
  base[PATHS.skill] = `---\nallowed-tools:\n  - Read\n  - Grep\n  - Glob\n---\nreview-only Front Matter code URL 引用 数値 バージョン 筆者の実体験 4cc01cdd5aff4102888e9396c3ba16da99828f78 MIT License\n${patternRows}`
  base[PATHS.command] = '.claude/skills/article-humanizer-ja/SKILL.md 記事本文は変更しない'
  base[PATHS.workflow] = "{ title: 'Humanize' } { title: 'Verify' } HUMANIZE_SCHEMA humanizePrompt review-only workflowVerified phase('Humanize') phase('Verify') .claude/skills/article-humanizer-ja/SKILL.md"
  base[PATHS.languageScript] = 'analyzeMarkdown WARN only --self-test'
  base[PATHS.package] = JSON.stringify({ scripts: {
    'check:article-humanizer-contract': 'node scripts/check-article-humanizer.js',
    'check:article-language-density': 'node scripts/check-article-language-density.js',
    'check:article-humanizer': 'npm run check:article-humanizer-contract && npm run check:article-language-density',
    'test:article-humanizer-contract': 'node scripts/check-article-humanizer.js --self-test',
    'test:article-language-density': 'node scripts/check-article-language-density.js --self-test',
    'test:article-humanizer': 'npm run test:article-humanizer-contract && npm run test:article-language-density',
  } })

  const validErrors = validate(base)
  if (validErrors.length) throw new Error(`valid fixture failed: ${validErrors.join('; ')}`)

  const withEdit = { ...base, [PATHS.skill]: base[PATHS.skill].replace('  - Glob', '  - Glob\n  - Edit') }
  if (!validate(withEdit).some((error) => error.includes('must not allow Edit'))) {
    throw new Error('forbidden tool fixture was not rejected')
  }

  const duplicate = { ...base, [PATHS.skill]: `${base[PATHS.skill]}\n| S15 | duplicate | x | low |` }
  if (!validate(duplicate).some((error) => error.includes('duplicate pattern IDs'))) {
    throw new Error('duplicate pattern fixture was not rejected')
  }

  const missingLanguagePattern = { ...base, [PATHS.skill]: base[PATHS.skill].replace('| S17 | x | x | low |', '') }
  if (!validate(missingLanguagePattern).some((error) => error.includes('missing language-density pattern'))) {
    throw new Error('missing language-density pattern fixture was not rejected')
  }

  const wrongOrder = { ...base, [PATHS.workflow]: base[PATHS.workflow].replace("{ title: 'Humanize' } { title: 'Verify' }", "{ title: 'Verify' } { title: 'Humanize' }") }
  if (!validate(wrongOrder).some((error) => error.includes('must run before Verify'))) {
    throw new Error('phase-order fixture was not rejected')
  }

  console.log('[test:article-humanizer-contract] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const errors = validate(readRepoFiles())
  if (errors.length) {
    console.error('[check:article-humanizer-contract] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:article-humanizer-contract] PASS')
}

if (require.main === module) main()
module.exports = { extractAllowedTools, extractPatternIds, validate }
