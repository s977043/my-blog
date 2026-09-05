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
  ])
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
  const workflow = [
    "{ title: 'Snapshot' }",
    "phase('Snapshot') phase('Extract') phase(`Loop${config.number}-Improve`) phase('FinalVerify')",
    'check-note-thesis-snapshot.js capture check-note-thesis-snapshot.js verify',
    "snapshotOk initialSnapshot expectedSnapshot sameExecutionContext ABORT: article snapshot changed aborted: 'article-snapshot-changed'",
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
module.exports = { validate, requireTokens }
