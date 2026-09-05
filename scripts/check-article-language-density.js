#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DEFAULT_TARGETS = [
  'articles',
  'articles_note/new',
  'articles_note/published',
  'Qiita/public',
]

const MIN_JAPANESE_CHARS = 20
const MIN_ENGLISH_TOKENS = 6
const MIN_UNIQUE_ENGLISH_TERMS = 4

function stripProtectedContent(markdown) {
  const lines = String(markdown).split(/\r?\n/)
  const out = []
  let inFence = false
  let inFrontMatter = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (i === 0 && /^---\s*$/.test(line)) {
      inFrontMatter = true
      out.push('')
      continue
    }
    if (inFrontMatter) {
      if (/^---\s*$/.test(line)) inFrontMatter = false
      out.push('')
      continue
    }

    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      out.push('')
      continue
    }
    if (inFence) {
      out.push('')
      continue
    }

    if (/^\s*!\[[^\]]*\]\(/.test(line)) {
      out.push('')
      continue
    }
    if (/^\s*\|/.test(line)) {
      out.push('')
      continue
    }

    const cleaned = line
      .replace(/`[^`]*`/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    out.push(cleaned)
  }

  return out.join('\n')
}

function splitParagraphs(markdown) {
  const stripped = stripProtectedContent(markdown)
  const lines = stripped.split(/\r?\n/)
  const paragraphs = []
  let current = []
  let startLine = null

  const flush = () => {
    if (!current.length) return
    paragraphs.push({
      startLine,
      endLine: startLine + current.length - 1,
      text: current.join(' ').trim(),
    })
    current = []
    startLine = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) {
      flush()
      continue
    }
    if (startLine == null) startLine = i + 1
    current.push(line)
  }
  flush()
  return paragraphs
}

function analyzeParagraph(paragraph) {
  const japaneseChars = (paragraph.text.match(/[ぁ-んァ-ヶ一-龠々〆ヵヶ]/g) || []).length
  const englishTokens = paragraph.text.match(/\b[A-Za-z][A-Za-z0-9.+#/-]*\b/g) || []
  const uniqueTerms = [...new Set(englishTokens.map((token) => token.toLowerCase()))]

  if (
    japaneseChars < MIN_JAPANESE_CHARS ||
    englishTokens.length < MIN_ENGLISH_TOKENS ||
    uniqueTerms.length < MIN_UNIQUE_ENGLISH_TERMS
  ) {
    return null
  }

  return {
    startLine: paragraph.startLine,
    endLine: paragraph.endLine,
    englishTokenCount: englishTokens.length,
    uniqueEnglishTermCount: uniqueTerms.length,
    terms: englishTokens.slice(0, 12),
    excerpt: paragraph.text.slice(0, 180),
  }
}

function analyzeMarkdown(markdown) {
  return splitParagraphs(markdown)
    .map(analyzeParagraph)
    .filter(Boolean)
}

function collectMarkdownFiles(target) {
  const absolute = path.resolve(ROOT, target)
  if (!fs.existsSync(absolute)) return []
  const stat = fs.statSync(absolute)
  if (stat.isFile()) return absolute.endsWith('.md') ? [absolute] : []

  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(absolute, entry.name)
      if (entry.isDirectory()) return collectMarkdownFiles(path.relative(ROOT, child))
      return entry.isFile() && entry.name.endsWith('.md') ? [child] : []
    })
}

function run(targets) {
  const files = [...new Set(targets.flatMap(collectMarkdownFiles))]
  let warningCount = 0

  for (const file of files) {
    const markdown = fs.readFileSync(file, 'utf8')
    const warnings = analyzeMarkdown(markdown)
    if (!warnings.length) continue

    const relative = path.relative(ROOT, file)
    for (const warning of warnings) {
      warningCount += 1
      console.warn(`[check:article-language-density] WARN ${relative}`)
      console.warn(`  L${warning.startLine}-L${warning.endLine}: English terms are densely clustered`)
      console.warn(`  terms(${warning.englishTokenCount}/${warning.uniqueEnglishTermCount} unique): ${warning.terms.join(' / ')}`)
      console.warn(`  ${warning.excerpt}`)
    }
  }

  if (warningCount === 0) {
    console.log('[check:article-language-density] OK: no dense English-term clusters detected')
  } else {
    console.warn(`[check:article-language-density] WARN only: ${warningCount} cluster(s) detected`)
  }

  return warningCount
}

function selfTest() {
  const dense = [
    '普段のProduct DevelopmentではAgentへIntentとSpecを渡し、DiscoveryとDeliveryの両方でExperimentを回しています。',
    'この段落は日本語本文の中で英語の概念名が短い範囲に集中しており、読者が表記を切り替えながら読む必要があります。',
  ].join('\n')
  if (analyzeMarkdown(dense).length !== 1) {
    throw new Error('dense English-term fixture was not detected')
  }

  const natural = '普段のプロダクト開発ではAIエージェントを使っています。DiscoveryとDeliveryは記事の中心概念として残します。'
  if (analyzeMarkdown(natural).length !== 0) {
    throw new Error('natural Japanese fixture was falsely detected')
  }

  const protectedCode = [
    '```text',
    'Product Development Agent Intent Spec Discovery Delivery Experiment Evidence Decision',
    '```',
    '',
    '本文は日本語で説明します。',
  ].join('\n')
  if (analyzeMarkdown(protectedCode).length !== 0) {
    throw new Error('fenced code fixture was detected')
  }

  console.log('[test:article-language-density] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }

  const args = process.argv.slice(2).filter((arg) => arg !== '--self-test')
  const targets = args.length ? args : DEFAULT_TARGETS
  run(targets)
}

if (require.main === module) main()
module.exports = {
  stripProtectedContent,
  splitParagraphs,
  analyzeParagraph,
  analyzeMarkdown,
  collectMarkdownFiles,
  run,
}
