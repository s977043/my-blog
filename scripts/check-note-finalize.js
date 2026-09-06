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

// 図の棚卸し（Issue #622）。Visual Gate に「記事のどこに fenced block と画像参照があるか」を
// deterministic に渡すための inventory。図か否かの分類はここでは行わない。
// コードブロックにはコマンド例も入るため、機械側で図を推定すると誤検知するので、
// 分類は Visual Gate に返させ、Workflow 側は「全 index を分類したか」の会計だけを検査する。
function figureInventory(markdown) {
  const lines = String(markdown).split(/\r?\n/)
  const blocks = []
  const inBlock = new Set()
  let open = null
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (!match) {
      if (open) inBlock.add(i)
      continue
    }
    const fence = match[1][0]
    if (!open) {
      open = { fence, length: match[1].length, startLine: i + 1, info: match[2].trim() }
      inBlock.add(i)
      continue
    }
    if (fence === open.fence && match[1].length >= open.length && match[2].trim() === '') {
      inBlock.add(i)
      blocks.push({
        index: blocks.length,
        startLine: open.startLine,
        endLine: i + 1,
        info: open.info,
        lines: i + 1 - open.startLine - 1,
      })
      open = null
      continue
    }
    inBlock.add(i)
  }
  let imageRefCount = 0
  for (let i = 0; i < lines.length; i += 1) {
    if (inBlock.has(i)) continue
    imageRefCount += (lines[i].match(/!\[[^\]]*\]\(/g) || []).length
  }
  return {
    fencedBlockCount: blocks.length,
    imageRefCount,
    unterminatedFence: open ? open.startLine : null,
    blocks,
  }
}

const RECONCILE_BEGIN = '// --- BEGIN reconcileVisual'
const RECONCILE_END = '// --- END reconcileVisual ---'

// workflow の実体から reconcileVisual を切り出して評価する。fixture のコピーではなく
// 本番コードそのものを self-test にかけるため（AGENT_LEARNINGS 2026-07-03: ガード初版バグ）。
function loadReconcileVisual(workflowSource) {
  const start = workflowSource.indexOf(RECONCILE_BEGIN)
  const end = workflowSource.indexOf(RECONCILE_END)
  if (start < 0 || end < 0 || end < start) return null
  const body = workflowSource.slice(start, end + RECONCILE_END.length)
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\nreturn reconcileVisual`)()
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
    // Issue #622: Visual Gate が「検査できなかった」を passed=true に丸めないための契約
    'reconcileVisual',
    '--figure-inventory',
    'blockClassification',
    'visual-inspection-gap',
    'visual-self-contradiction',
    'visualReconciliation',
    "required: ['applicable', 'images', 'addCandidates', 'scan', 'passed', 'unverified', 'summary']",
  ])

  if (!/if \(visual\.unverified \|\| visualReconciliation\.unverified\)/.test(workflow)) {
    errors.push('workflow must feed reconcileVisual result into the unverified list')
  }
  if (loadReconcileVisual(workflow) === null) {
    errors.push('workflow missing extractable reconcileVisual block')
  }

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
    'Terminology Contract READY NEEDS_CHANGES UNVERIFIED review-only requiresThesisLoop drafts-readonly-mirror primarySourceAccess custom Agent定義をRead findings: claims: images: addCandidates: --figure-inventory blockClassification visual-inspection-gap visual-self-contradiction',
    "required: ['applicable', 'images', 'addCandidates', 'scan', 'passed', 'unverified', 'summary']",
    'if (visual.unverified || visualReconciliation.unverified) {}',
    fs.readFileSync(path.join(ROOT, PATHS.workflow), 'utf8').slice(
      fs.readFileSync(path.join(ROOT, PATHS.workflow), 'utf8').indexOf(RECONCILE_BEGIN),
      fs.readFileSync(path.join(ROOT, PATHS.workflow), 'utf8').indexOf(RECONCILE_END) + RECONCILE_END.length
    ),
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

  // --- Issue #622: Visual Gate の unverified 判定 ---
  const workflowSource = fs.readFileSync(path.join(ROOT, PATHS.workflow), 'utf8')
  const reconcileVisual = loadReconcileVisual(workflowSource)
  if (!reconcileVisual) throw new Error('reconcileVisual could not be extracted from the workflow')

  const scanOf = (fenced, figures, imageRefs) => ({
    fencedBlockCount: fenced,
    imageRefCount: imageRefs,
    blockClassification: Array.from({ length: fenced }, (_, index) => ({ index, isFigure: index < figures })),
  })
  const expectReasons = (label, result, predicate) => {
    if (!predicate(result)) throw new Error(`${label}: unexpected ${JSON.stringify(result)}`)
  }

  // 3図を認識して1件ずつ判定した run は unverified にしない（誤検知しない）
  expectReasons(
    'healthy visual run',
    reconcileVisual({
      images: [
        { status: 'KEEP' },
        { status: 'UPDATE' },
        { status: 'KEEP' },
      ],
      addCandidates: [],
      summary: '図3点を確認した。',
      scan: scanOf(9, 3, 0),
    }),
    (r) => r.unverified === false && r.reasons.length === 0
  )

  // fenced block はあるが全部コマンド例 → images 0 は正しいので unverified にしない
  expectReasons(
    'command-only code blocks',
    reconcileVisual({
      images: [],
      addCandidates: [],
      summary: 'コードブロックはコマンド例のみで図は無い。',
      scan: scanOf(5, 0, 0),
    }),
    (r) => r.unverified === false
  )

  // Issue #622 の再現: 図が3点あるのに images が空
  expectReasons(
    'issue-622 blind visual run',
    reconcileVisual({
      images: [],
      addCandidates: [],
      summary: 'ASCII図3点を確認した。',
      scan: scanOf(9, 3, 0),
    }),
    (r) => r.unverified === true && r.reasons.some((x) => x.startsWith('visual-inspection-gap'))
  )

  // scan を返さない旧形式の結果は「検査できなかった」扱い
  expectReasons(
    'legacy result without scan',
    reconcileVisual({ images: [], addCandidates: [], summary: 'x' }),
    (r) => r.unverified === true && r.reasons.includes('visual-scan-missing')
  )

  // 全 block を分類しなかった run
  expectReasons(
    'incomplete block accounting',
    reconcileVisual({
      images: [],
      addCandidates: [],
      summary: 'x',
      scan: { fencedBlockCount: 9, imageRefCount: 0, blockClassification: [{ index: 0, isFigure: false }] },
    }),
    (r) => r.unverified === true && r.reasons.some((x) => x.startsWith('visual-block-accounting-incomplete'))
  )

  // images[].status = UNVERIFIED を READY へ丸めない
  expectReasons(
    'image status UNVERIFIED',
    reconcileVisual({
      images: [{ status: 'UNVERIFIED' }],
      addCandidates: [],
      summary: 'x',
      scan: scanOf(1, 1, 0),
    }),
    (r) => r.unverified === true && r.reasons.includes('visual-image-unverified')
  )

  // 自己矛盾: images は空なのに addCandidates が既存図の枚数に言及している
  expectReasons(
    'self contradiction',
    reconcileVisual({
      images: [],
      addCandidates: [{ location: 'L1', reason: '既存の3つのASCII図はいずれもフローで、層構造の図は無い。', concept: 'c' }],
      summary: 'x',
      scan: scanOf(0, 0, 0),
    }),
    (r) => r.reasons.includes('visual-self-contradiction')
  )

  // 「既存の図は無い」は矛盾に数えない（個数表現が無い）
  expectReasons(
    'absence phrasing is not a contradiction',
    reconcileVisual({
      images: [],
      addCandidates: [{ location: 'L1', reason: '既存の図は無いので1点追加したい。', concept: 'c' }],
      summary: '図は存在しない。',
      scan: scanOf(0, 0, 0),
    }),
    (r) => r.unverified === false
  )

  // --- figureInventory ---
  const sample = [
    '# t',
    '```text',
    'A --> B',
    '```',
    '文中の ![alt](img/a.png) 画像',
    '```bash',
    'npm run check',
    '```',
    '~~~',
    '![not-a-ref](x.png)',
    '~~~',
  ].join('\n')
  const inventory = figureInventory(sample)
  if (inventory.fencedBlockCount !== 3) throw new Error(`fencedBlockCount=${inventory.fencedBlockCount}`)
  if (inventory.imageRefCount !== 1) throw new Error(`imageRefCount=${inventory.imageRefCount}`)
  if (inventory.blocks[0].info !== 'text' || inventory.blocks[0].startLine !== 2) {
    throw new Error(`block0=${JSON.stringify(inventory.blocks[0])}`)
  }
  if (inventory.unterminatedFence !== null) throw new Error('unexpected unterminated fence')
  const unterminated = figureInventory('```text\nA --> B\n')
  if (unterminated.unterminatedFence !== 1) throw new Error('unterminated fence not reported')

  console.log('[test:note-finalize] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const inventoryFlag = process.argv.indexOf('--figure-inventory')
  if (inventoryFlag >= 0) {
    const target = process.argv[inventoryFlag + 1]
    if (!target) {
      console.error('[check:note-finalize] --figure-inventory <article.md> が必要です')
      process.exit(1)
    }
    const absolute = path.isAbsolute(target) ? target : path.join(ROOT, target)
    if (!fs.existsSync(absolute)) {
      console.error(`[check:note-finalize] file not found: ${target}`)
      process.exit(1)
    }
    const inventory = figureInventory(fs.readFileSync(absolute, 'utf8'))
    console.log(JSON.stringify({ article: target, ...inventory }, null, 2))
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
module.exports = { frontMatter, agentTools, requireTokens, validate, workflowParseError, checkWorkflowScripts, figureInventory, loadReconcileVisual }
