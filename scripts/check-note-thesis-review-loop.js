#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const WORKFLOW = '.claude/workflows/note-thesis-review-loop.js'
const SNAPSHOT = 'scripts/check-note-thesis-snapshot.js'

function requireTokens(errors, label, text, tokens) {
  for (const token of tokens) {
    if (!String(text).includes(token)) errors.push(`${label} missing token: ${token}`)
  }
}

// ループ数は args.loops で 3（既定）または 5 を選べる。fork を作らせないための引数化なので、
// 「Loop4 / Loop5 が既存ループと同じ Snapshot Guard を通ること」を構造で保証する:
//   1. meta.phases に 5 ループ分の phase が宣言されていること（純リテラル制約のため常に5個）
//   2. LOOP_CONFIGS に number 1..5 が定義されていること
//   3. ループ本体が ACTIVE_LOOP_CONFIGS を回す1箇所しかないこと
//   4. どのループも phase 名をハードコードしないこと（= ガード付き共通本体を必ず通る）
const DECLARED_LOOPS = [1, 2, 3, 4, 5]
const LOOP_PHASE_KINDS = ['Review', 'Improve', 'Recheck']

function validateLoopContract(errors, workflow) {
  for (const number of DECLARED_LOOPS) {
    if (!workflow.includes(`number: ${number},`)) {
      errors.push(`workflow must declare LOOP_CONFIGS entry number: ${number}`)
    }
    for (const kind of LOOP_PHASE_KINDS) {
      if (!workflow.includes(`{ title: 'Loop${number}-${kind}' }`)) {
        errors.push(`workflow must declare meta phase Loop${number}-${kind}`)
      }
    }
    if (workflow.includes(`phase('Loop${number}-`)) {
      errors.push(`workflow must not hardcode phase('Loop${number}-...'): every loop must run through the shared guarded body`)
    }
  }

  const bodies = workflow.match(/for \(const config of ACTIVE_LOOP_CONFIGS\)/g) || []
  if (bodies.length !== 1) {
    errors.push('workflow must run every loop through exactly one shared body: for (const config of ACTIVE_LOOP_CONFIGS)')
  }
}

function validate(workflow, snapshot) {
  const errors = []
  requireTokens(errors, 'workflow', workflow, [
    "{ title: 'Snapshot' }",
    "phase('Snapshot')",
    'check-note-thesis-snapshot.js capture',
    'check-note-thesis-snapshot.js verify',
    'snapshotOk',
    'initialSnapshot',
    'expectedSnapshot',
    'sameExecutionContext',
    'ABORT: article snapshot changed',
    "aborted: 'article-snapshot-changed'",
    'ALLOWED_LOOP_COUNTS',
    'args.loops',
    'ACTIVE_LOOP_CONFIGS',
    'NOTE_STYLE_RULES',
  ])
  validateLoopContract(errors, workflow)
  requireTokens(errors, 'snapshot helper', snapshot, [
    'captureSnapshot',
    'compareSnapshot',
    'articleSha256',
    'git([\'branch\', \'--show-current\']',
    'git([\'rev-parse\', \'HEAD\']',
    'ABORT: article snapshot changed',
    '--self-test',
  ])

  for (const forbidden of ['git checkout', 'git switch', 'git commit', 'git push', 'gh pr']) {
    if (workflow.includes(forbidden)) errors.push(`workflow must not perform git write operation: ${forbidden}`)
  }

  const snapshotPhase = workflow.indexOf("phase('Snapshot')")
  const extractPhase = workflow.indexOf("phase('Extract')")
  const improvePhase = workflow.indexOf("phase(`Loop${config.number}-Improve`)")
  const finalPhase = workflow.indexOf("phase('FinalVerify')")
  if (!(snapshotPhase >= 0 && extractPhase > snapshotPhase && improvePhase > extractPhase && finalPhase > improvePhase)) {
    errors.push('workflow phase order must be Snapshot -> Extract -> Improve -> FinalVerify')
  }

  return errors
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8')
}

function selfTest() {
  const loopFixture = DECLARED_LOOPS.flatMap((number) => [
    `number: ${number},`,
    ...LOOP_PHASE_KINDS.map((kind) => `{ title: 'Loop${number}-${kind}' }`),
  ]).join(' ')
  const workflow = [
    "{ title: 'Snapshot' }",
    "phase('Snapshot') phase('Extract') phase(`Loop${config.number}-Improve`) phase('FinalVerify')",
    'check-note-thesis-snapshot.js capture check-note-thesis-snapshot.js verify',
    "snapshotOk initialSnapshot expectedSnapshot sameExecutionContext ABORT: article snapshot changed aborted: 'article-snapshot-changed'",
    'ALLOWED_LOOP_COUNTS args.loops NOTE_STYLE_RULES',
    loopFixture,
    'for (const config of ACTIVE_LOOP_CONFIGS) {',
  ].join('\n')
  const snapshot = [
    "captureSnapshot compareSnapshot articleSha256 git(['branch', '--show-current'] git(['rev-parse', 'HEAD']",
    'ABORT: article snapshot changed --self-test',
  ].join('\n')

  const valid = validate(workflow, snapshot)
  if (valid.length) throw new Error(`valid fixture failed: ${valid.join('; ')}`)

  const noVerify = validate(workflow.replace('check-note-thesis-snapshot.js verify', ''), snapshot)
  if (!noVerify.some((item) => item.includes('verify'))) throw new Error('missing verify was not rejected')

  const writeGit = validate(`${workflow}\ngit checkout main`, snapshot)
  if (!writeGit.some((item) => item.includes('git checkout'))) throw new Error('git write operation was not rejected')

  const noLoop5 = validate(workflow.replace("{ title: 'Loop5-Recheck' }", ''), snapshot)
  if (!noLoop5.some((item) => item.includes('Loop5-Recheck'))) throw new Error('missing Loop5 phase was not rejected')

  const noLoop4Config = validate(workflow.replace('number: 4,', ''), snapshot)
  if (!noLoop4Config.some((item) => item.includes('number: 4'))) throw new Error('missing Loop4 config was not rejected')

  const hardcodedPhase = validate(`${workflow}\nphase('Loop4-Review')`, snapshot)
  if (!hardcodedPhase.some((item) => item.includes('hardcode'))) {
    throw new Error('hardcoded Loop4 phase (bypassing the shared guarded body) was not rejected')
  }

  const forkedBody = validate(`${workflow}\nfor (const config of ACTIVE_LOOP_CONFIGS) {`, snapshot)
  if (!forkedBody.some((item) => item.includes('exactly one shared body'))) {
    throw new Error('duplicated loop body was not rejected')
  }

  const noLoopsArg = validate(workflow.replace('args.loops', ''), snapshot)
  if (!noLoopsArg.some((item) => item.includes('args.loops'))) throw new Error('missing args.loops was not rejected')

  console.log('[test:note-thesis-review-loop] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }
  const errors = validate(read(WORKFLOW), read(SNAPSHOT))
  if (errors.length) {
    console.error('[check:note-thesis-review-loop] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:note-thesis-review-loop] PASS')
}

if (require.main === module) main()
module.exports = { validate, validateLoopContract, requireTokens }
