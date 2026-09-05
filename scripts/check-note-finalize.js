#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PATHS = {
  domainSkill: '.claude/skills/article-domain-review/SKILL.md',
  domainAgent: '.claude/agents/article-domain-reviewer.md',
  visualSkill: '.claude/skills/article-visual-review/SKILL.md',
  visualAgent: '.claude/agents/article-visual-reviewer.md',
  workflow: '.claude/workflows/note-finalize.js',
  command: '.claude/commands/finalize-note-article.md',
  languageScript: 'scripts/check-article-language-density.js',
  package: 'package.json',
}

// Workflow スクリプトの「実体パース」検査。
//
// 背景: `.claude/workflows/note-finalize.js` の LanguageReview prompt に未エスケープの
// バッククォートが混入し、外側のテンプレートリテラルを途中で閉じてしまって Workflow
// ランタイムが "Script parse error" で起動できない状態になっていた。
// `node --check` は .js を CJS として見るため exit 0 で通り、この壊れ方を検出できない。
// Workflow ランタイムは top-level の `export` / `await` / `return` をすべて許すため、
// ESM としてのパース（return が Illegal）でも CJS としてのパース（export が Unexpected）
// でも再現しない。`export ` を落として AsyncFunction 本体としてパースするのが、
// 4本の既存 workflow すべてが通り、かつ上記の壊れ方だけを落とす最小の近似になる。
const WORKFLOW_DIR = '.claude/workflows'
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

function workflowParseError(source) {
  const body = String(source).replace(/^export\s+(?=(?:const|let|var|function|async|class)\b)/gm, '')
  try {
    new AsyncFunction(body)
    return null
  } catch (error) {
    return error.message
  }
}

function checkWorkflowScripts() {
  const errors = []
  const dir = path.join(ROOT, WORKFLOW_DIR)
  if (!fs.existsSync(dir)) return errors
  for (const entry of fs.readdirSync(dir).sort()) {
    if (!entry.endsWith('.js')) continue
    const message = workflowParseError(fs.readFileSync(path.join(dir, entry), 'utf8'))
    if (message) errors.push(`${WORKFLOW_DIR}/${entry} is not parseable by the Workflow runtime: ${message}`)
  }
  return errors
}

function frontMatter(markdown) {
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? match[1] : ''
}

function agentTools(markdown) {
  const fm = frontMatter(markdown)
  const line = fm.split(/\r?\n/).find((entry) => /^tools:\s*/.test(entry)) || ''
  return line
    .replace(/^tools:\s*/, '')
    .split(',')
    .map((tool) => tool.trim())
    .filter(Boolean)
}

function requireTokens(errors, label, text, tokens) {
  for (const token of tokens) {
    if (!String(text).includes(token)) errors.push(`${label} missing contract token: ${token}`)
  }
}

function validate(files) {
  const errors = []
  for (const [label, file] of Object.entries(PATHS)) {
    if (!(file in files)) errors.push(`missing file (${label}): ${file}`)
  }
  if (errors.length) return errors

  requireTokens(errors, 'domain skill', files[PATHS.domainSkill], [
    'official_fact',
    'team_practice',
    'author_interpretation',
    'unverified',
    '最大3',
    '一次情報',
    '実在する外部専門家',
  ])

  requireTokens(errors, 'domain agent', files[PATHS.domainAgent], [
    '.claude/skills/article-domain-review/SKILL.md',
    'selectedReviewers',
    'WebFetch',
    '実在する外部専門家',
  ])

  requireTokens(errors, 'visual skill', files[PATHS.visualSkill], [
    'KEEP',
    'UPDATE',
    'REMOVE',
    'ADD',
    'UNVERIFIED',
    'semantic_consistency',
    'terminology_consistency',
    'missing_visual',
  ])

  requireTokens(errors, 'visual agent', files[PATHS.visualAgent], [
    '.claude/skills/article-visual-review/SKILL.md',
    'UNVERIFIED',
    '画像本体',
  ])

  for (const [label, file] of [
    ['domain agent', PATHS.domainAgent],
    ['visual agent', PATHS.visualAgent],
  ]) {
    const tools = agentTools(files[file])
    for (const forbidden of ['Edit', 'Write', 'Bash']) {
      if (tools.includes(forbidden)) errors.push(`${label} must be review-only; forbidden tool: ${forbidden}`)
    }
  }

  const workflow = files[PATHS.workflow]
  requireTokens(errors, 'workflow', workflow, [
    "name: 'note-finalize'",
    "{ title: 'Extract' }",
    "{ title: 'DomainReview' }",
    "{ title: 'LanguageReview' }",
    "{ title: 'VisualReview' }",
    "{ title: 'EditorialReview' }",
    "{ title: 'FinalGate' }",
    'Terminology Contract',
    'READY',
    'NEEDS_CHANGES',
    'UNVERIFIED',
    'review-only',
    'requiresThesisLoop',
    'drafts-readonly-mirror',
    'primarySourceAccess',
    "enum: ['available', 'partial', 'unavailable']",
    'custom Agent定義をRead',
    'findings:',
    'claims:',
    'images:',
    'addCandidates:',
  ])

  const phaseOrder = ['Extract', 'DomainReview', 'LanguageReview', 'VisualReview', 'EditorialReview', 'FinalGate']
  let lastIndex = -1
  for (const phase of phaseOrder) {
    const index = workflow.indexOf(`phase('${phase}')`)
    if (index < 0) errors.push(`workflow missing phase() call: ${phase}`)
    if (index >= 0 && index < lastIndex) errors.push(`workflow phase order invalid at: ${phase}`)
    if (index >= 0) lastIndex = index
  }

  const command = files[PATHS.command]
  requireTokens(errors, 'command', command, [
    'npm run check:article-language-density',
    'note-finalize',
    'READY',
    'NEEDS_CHANGES',
    'UNVERIFIED',
    'drafts',
    '自動マージしない',
  ])

  const languageScript = files[PATHS.languageScript]
  requireTokens(errors, 'language density script', languageScript, [
    'WARN only',
    'analyzeMarkdown',
    '--self-test',
  ])

  let pkg
  try {
    pkg = JSON.parse(files[PATHS.package])
  } catch (error) {
    errors.push(`package.json parse failed: ${error.message}`)
    return errors
  }
  if (pkg.scripts?.['check:note-finalize'] !== 'node scripts/check-note-finalize.js') {
    errors.push('package.json missing check:note-finalize script')
  }
  if (pkg.scripts?.['test:note-finalize'] !== 'node scripts/check-note-finalize.js --self-test') {
    errors.push('package.json missing test:note-finalize script')
  }
  if (!String(pkg.scripts?.check || '').includes('check:article-humanizer-contract')) {
    errors.push('global check must include check:article-humanizer-contract')
  }
  if (String(pkg.scripts?.check || '').includes('check:article-language-density')) {
    errors.push('global check must not scan all historical articles with WARN-only language density')
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

  base[PATHS.domainSkill] = 'official_fact team_practice author_interpretation unverified 最大3 一次情報 実在する外部専門家'
  base[PATHS.domainAgent] = `---\ntools: Read, Grep, Glob, WebFetch\n---\n.claude/skills/article-domain-review/SKILL.md selectedReviewers WebFetch 実在する外部専門家`
  base[PATHS.visualSkill] = 'KEEP UPDATE REMOVE ADD UNVERIFIED semantic_consistency terminology_consistency missing_visual'
  base[PATHS.visualAgent] = `---\ntools: Read, Grep, Glob\n---\n.claude/skills/article-visual-review/SKILL.md UNVERIFIED 画像本体`
  base[PATHS.workflow] = [
    "name: 'note-finalize'",
    "{ title: 'Extract' } { title: 'DomainReview' } { title: 'LanguageReview' } { title: 'VisualReview' } { title: 'EditorialReview' } { title: 'FinalGate' }",
    "phase('Extract') phase('DomainReview') phase('LanguageReview') phase('VisualReview') phase('EditorialReview') phase('FinalGate')",
    "enum: ['available', 'partial', 'unavailable']",
    'Terminology Contract READY NEEDS_CHANGES UNVERIFIED review-only requiresThesisLoop drafts-readonly-mirror primarySourceAccess custom Agent定義をRead findings: claims: images: addCandidates:',
  ].join('\n')
  base[PATHS.command] = 'npm run check:article-language-density note-finalize READY NEEDS_CHANGES UNVERIFIED drafts 自動マージしない'
  base[PATHS.languageScript] = 'WARN only analyzeMarkdown --self-test'
  base[PATHS.package] = JSON.stringify({ scripts: {
    'check:note-finalize': 'node scripts/check-note-finalize.js',
    'test:note-finalize': 'node scripts/check-note-finalize.js --self-test',
    'check:article-humanizer-contract': 'node scripts/check-article-humanizer.js',
    check: 'npm run check:article-humanizer-contract && npm run check:note-finalize',
  } })

  const validErrors = validate(base)
  if (validErrors.length) throw new Error(`valid fixture failed: ${validErrors.join('; ')}`)

  const writableAgent = { ...base, [PATHS.visualAgent]: base[PATHS.visualAgent].replace('Read, Grep, Glob', 'Read, Grep, Glob, Edit') }
  if (!validate(writableAgent).some((error) => error.includes('forbidden tool: Edit'))) {
    throw new Error('writable visual agent fixture was not rejected')
  }

  const missingUnverified = { ...base, [PATHS.visualSkill]: base[PATHS.visualSkill].replace('UNVERIFIED ', '') }
  if (!validate(missingUnverified).some((error) => error.includes('UNVERIFIED'))) {
    throw new Error('visual UNVERIFIED contract fixture was not rejected')
  }

  const wrongOrder = { ...base, [PATHS.workflow]: base[PATHS.workflow].replace("phase('LanguageReview') phase('VisualReview')", "phase('VisualReview') phase('LanguageReview')") }
  if (!validate(wrongOrder).some((error) => error.includes('phase order invalid'))) {
    throw new Error('workflow phase-order fixture was not rejected')
  }

  const noisyGlobalCheck = {
    ...base,
    [PATHS.package]: JSON.stringify({ scripts: {
      'check:note-finalize': 'node scripts/check-note-finalize.js',
      'test:note-finalize': 'node scripts/check-note-finalize.js --self-test',
      'check:article-humanizer-contract': 'node scripts/check-article-humanizer.js',
      'check:article-language-density': 'node scripts/check-article-language-density.js',
      check: 'npm run check:article-humanizer-contract && npm run check:article-language-density',
    } }),
  }
  if (!validate(noisyGlobalCheck).some((error) => error.includes('must not scan all historical articles'))) {
    throw new Error('noisy global language-density fixture was not rejected')
  }

  // Workflow 実体パース検査。壊れ方は「テンプレートリテラル内の未エスケープバッククォート」。
  const goodWorkflow = [
    "export const meta = { name: 'w' }",
    'const A = args.a',
    'const prompt = `line',
    '\\`npm run x -- ${A}\\` は説明',
    'end`',
    'await log(prompt)',
    'return { ok: true }',
  ].join('\n')
  if (workflowParseError(goodWorkflow) !== null) {
    throw new Error(`valid workflow fixture was rejected: ${workflowParseError(goodWorkflow)}`)
  }
  const brokenWorkflow = goodWorkflow.replace('\\`npm run x -- ${A}\\`', '`npm run x -- ${A}`')
  if (workflowParseError(brokenWorkflow) === null) {
    throw new Error('unescaped-backtick workflow fixture was not rejected')
  }

  console.log('[test:note-finalize] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const errors = [...validate(readRepoFiles()), ...checkWorkflowScripts()]
  if (errors.length) {
    console.error('[check:note-finalize] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:note-finalize] PASS')
}

if (require.main === module) main()
module.exports = { frontMatter, agentTools, requireTokens, validate, workflowParseError, checkWorkflowScripts }
