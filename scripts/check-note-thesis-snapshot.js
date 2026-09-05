#!/usr/bin/env node

const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function normalizeArticle(article) {
  const normalized = String(article || '').replace(/\\/g, '/').replace(/^\.\//, '')
  if (!/^articles_note\/(new|drafts|published)\/[\w-]+\.md$/i.test(normalized)) {
    throw new Error(`invalid article path: ${article}`)
  }
  return normalized
}

function sha256File(file) {
  const hash = crypto.createHash('sha256')
  hash.update(fs.readFileSync(file))
  return hash.digest('hex')
}

function captureSnapshot(article, cwd = process.cwd()) {
  const articlePath = normalizeArticle(article)
  const repoRoot = git(['rev-parse', '--show-toplevel'], cwd)
  const absoluteArticle = path.join(repoRoot, articlePath)
  if (!fs.existsSync(absoluteArticle)) throw new Error(`article not found: ${articlePath}`)

  const branch = git(['branch', '--show-current'], repoRoot) || 'DETACHED'
  const headSha = git(['rev-parse', 'HEAD'], repoRoot)
  const articleSha256 = sha256File(absoluteArticle)

  return { branch, headSha, articlePath, articleSha256 }
}

function compareSnapshot(actual, expected) {
  const mismatches = []
  for (const key of ['branch', 'headSha', 'articlePath', 'articleSha256']) {
    if (actual[key] !== expected[key]) {
      mismatches.push({ key, expected: expected[key], actual: actual[key] })
    }
  }
  return mismatches
}

function readOption(args, name) {
  const index = args.indexOf(name)
  if (index < 0 || index + 1 >= args.length) return null
  return args[index + 1]
}

function expectedFromArgs(article, args) {
  return {
    branch: readOption(args, '--branch'),
    headSha: readOption(args, '--head'),
    articlePath: normalizeArticle(article),
    articleSha256: readOption(args, '--sha256'),
  }
}

function assertExpected(expected) {
  for (const key of ['branch', 'headSha', 'articleSha256']) {
    if (!expected[key]) throw new Error(`missing expected snapshot option: ${key}`)
  }
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'note-thesis-snapshot-'))
  try {
    git(['init', '-q', '-b', 'main'], root)
    git(['config', 'user.email', 'snapshot@example.invalid'], root)
    git(['config', 'user.name', 'snapshot-test'], root)
    const articleDir = path.join(root, 'articles_note', 'new')
    fs.mkdirSync(articleDir, { recursive: true })
    const article = 'articles_note/new/example.md'
    fs.writeFileSync(path.join(root, article), '# Example\n\nfirst\n')
    git(['add', article], root)
    git(['commit', '-q', '-m', 'init'], root)

    const initial = captureSnapshot(article, root)
    if (compareSnapshot(captureSnapshot(article, root), initial).length !== 0) {
      throw new Error('unchanged snapshot should verify')
    }

    fs.appendFileSync(path.join(root, article), '\nchanged\n')
    const changed = captureSnapshot(article, root)
    if (!compareSnapshot(changed, initial).some((item) => item.key === 'articleSha256')) {
      throw new Error('article change was not detected')
    }

    fs.writeFileSync(path.join(root, article), '# Example\n\nfirst\n')
    git(['checkout', '-q', '-b', 'other'], root)
    const otherBranch = captureSnapshot(article, root)
    if (!compareSnapshot(otherBranch, initial).some((item) => item.key === 'branch')) {
      throw new Error('branch change was not detected')
    }

    console.log('[test:note-thesis-snapshot] PASS')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--self-test')) {
    selfTest()
    return
  }

  const command = args[0]
  const article = args[1]
  if (!command || !article || !['capture', 'verify'].includes(command)) {
    console.error('usage: check-note-thesis-snapshot.js capture <article> | verify <article> --branch <branch> --head <sha> --sha256 <sha256>')
    process.exit(1)
  }

  try {
    const actual = captureSnapshot(article)
    if (command === 'capture') {
      console.log(JSON.stringify({ ok: true, ...actual }))
      return
    }

    const expected = expectedFromArgs(article, args)
    assertExpected(expected)
    const mismatches = compareSnapshot(actual, expected)
    if (mismatches.length > 0) {
      console.error(`ABORT: article snapshot changed ${JSON.stringify({ actual, expected, mismatches })}`)
      process.exit(2)
    }
    console.log(JSON.stringify({ ok: true, ...actual }))
  } catch (error) {
    console.error(`[check-note-thesis-snapshot] ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) main()
module.exports = { normalizeArticle, sha256File, captureSnapshot, compareSnapshot }
