#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SEEDS_DIR = path.join(ROOT, 'article_seeds')

const GENERIC_TODO_PATTERNS = [
  /^\s*>\s*TODO:\s*(.*)$/gim,
  /<!--\s*TODO:\s*([\s\S]*?)-->/gi,
]
const AUTHOR_INPUT_PATTERN = /<!--\s*AUTHOR_INPUT_REQUIRED:\s*([\s\S]*?)-->/gi

function walkMarkdown(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMarkdown(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length
}

function maskFencedBlocks(text) {
  let inFence = false
  return String(text)
    .split(/\r?\n/)
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inFence = !inFence
        return ''
      }
      return inFence ? '' : line
    })
    .join('\n')
}

function normalizeAuthorInput(detail) {
  return String(detail || '').trim().replace(/\s+/g, ' ')
}

function validateText(text, label = '<fixture>') {
  const errors = []
  const visible = maskFencedBlocks(text)

  for (const pattern of GENERIC_TODO_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(visible))) {
      errors.push(`${label}:${lineNumber(visible, match.index)} generic TODO in article_seeds; use AUTHOR_INPUT_REQUIRED for author-only evidence or a concrete experiment checkbox for future work`)
    }
  }

  const seenAuthorInputs = new Map()
  AUTHOR_INPUT_PATTERN.lastIndex = 0
  let match
  while ((match = AUTHOR_INPUT_PATTERN.exec(visible))) {
    const detail = normalizeAuthorInput(match[1])
    const line = lineNumber(visible, match.index)
    if (!detail) {
      errors.push(`${label}:${line} AUTHOR_INPUT_REQUIRED must describe the missing first-party evidence`)
      continue
    }
    if (seenAuthorInputs.has(detail)) {
      errors.push(`${label}:${line} duplicate AUTHOR_INPUT_REQUIRED; same evidence request already appears at line ${seenAuthorInputs.get(detail)}`)
      continue
    }
    seenAuthorInputs.set(detail, line)
  }

  return errors
}

function validateRepo() {
  const errors = []
  for (const file of walkMarkdown(SEEDS_DIR)) {
    const rel = path.relative(ROOT, file)
    errors.push(...validateText(fs.readFileSync(file, 'utf8'), rel))
  }
  return errors
}

function selfTest() {
  const valid = [
    '<!-- AUTHOR_INPUT_REQUIRED: 実際に置き場所に迷った改善を1件。AIは推測で補完しない。 -->',
    '- [ ] 次の計測で判断待ち時間を観測する',
  ].join('\n')
  if (validateText(valid).length) throw new Error('valid author-input marker was rejected')

  const quoteTodo = validateText('> TODO: 実際の数字を追記する')
  if (!quoteTodo.some((e) => e.includes('generic TODO'))) {
    throw new Error('blockquote TODO was not rejected')
  }

  const commentTodo = validateText('<!-- TODO: 実際の会話を追記する -->')
  if (!commentTodo.some((e) => e.includes('generic TODO'))) {
    throw new Error('comment TODO was not rejected')
  }

  const emptyQuoteTodo = validateText('> TODO:')
  if (!emptyQuoteTodo.some((e) => e.includes('generic TODO'))) {
    throw new Error('empty blockquote TODO was not rejected')
  }

  const empty = validateText('<!-- AUTHOR_INPUT_REQUIRED:   -->')
  if (!empty.some((e) => e.includes('must describe'))) {
    throw new Error('empty AUTHOR_INPUT_REQUIRED was not rejected')
  }

  const duplicate = validateText([
    '<!-- AUTHOR_INPUT_REQUIRED: 実際の失敗例を1件 -->',
    '<!-- AUTHOR_INPUT_REQUIRED:   実際の失敗例を1件   -->',
  ].join('\n'))
  if (!duplicate.some((e) => e.includes('duplicate AUTHOR_INPUT_REQUIRED'))) {
    throw new Error('duplicate AUTHOR_INPUT_REQUIRED was not rejected')
  }

  const fencedExamples = validateText([
    '```md',
    '> TODO: example only',
    '<!-- AUTHOR_INPUT_REQUIRED: example only -->',
    '```',
  ].join('\n'))
  if (fencedExamples.length) {
    throw new Error(`fenced examples must be ignored: ${fencedExamples.join('; ')}`)
  }

  console.log('[test:article-seed-placeholders] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const errors = validateRepo()
  if (errors.length) {
    console.error('[check:article-seed-placeholders] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:article-seed-placeholders] PASS')
}

if (require.main === module) main()
module.exports = { validateText }
