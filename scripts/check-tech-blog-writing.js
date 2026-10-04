#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const PATHS = {
  skill: '.claude/skills/tech-blog-writing/SKILL.md',
  editorial: '.claude/skills/tech-blog-writing/references/editorial-principles.md',
  idea: '.claude/skills/tech-blog-writing/references/idea-mode.md',
  existing: '.claude/skills/tech-blog-writing/references/existing-article-mode.md',
  output: '.claude/skills/tech-blog-writing/references/output-contract.md',
  command: '.claude/commands/check-tech-blog.md',
  lifecycle: 'docs/article-lifecycle-contract.md',
  seedReadme: 'article_seeds/README.md',
  seedPlaceholderCheck: 'scripts/check-article-seed-placeholders.js',
  articlePlanCheck: 'scripts/check-article-plan.js',
}

const PLAN_TEMPLATE_TEXTS = [
  '実体験なら誰が何を観測したか',
  '外部事実なら確認した内容と参照先',
  '未確認の見立て。Observed / Verified の代わりにしない',
]

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
  const editorial = files[PATHS.editorial]
  const idea = files[PATHS.idea]
  const existing = files[PATHS.existing]
  const output = files[PATHS.output]
  const command = files[PATHS.command]
  const lifecycle = files[PATHS.lifecycle]
  const seedReadme = files[PATHS.seedReadme]
  const seedPlaceholderCheck = files[PATHS.seedPlaceholderCheck]
  const articlePlanCheck = files[PATHS.articlePlanCheck]

  requireTokens(errors, 'skill', skill, [
    'references/editorial-principles.md',
    'references/idea-mode.md',
    'references/existing-article-mode.md',
    'references/output-contract.md',
    'Lifecycle上の責務',
    'Draft Article Plan',
    '単発の翻訳・誤字修正・タイトル案だけの依頼には使わない',
    '公開、マージ',
  ])

  for (const forbidden of [
    '#### A-1. Experience Recordを抽出する',
    '#### B-1. 中心主張を抽出する',
    '## 出力形式',
  ]) {
    if (skill.includes(forbidden)) errors.push(`SKILL.md must keep detail in references, found: ${forbidden}`)
  }

  requireTokens(errors, 'editorial principles', editorial, [
    'AIは編集者であり、経験の生成者ではない',
    '1記事1主張',
    '主張と根拠',
    '適用範囲',
    'Research方針',
    'Observed',
    'Verified',
    'Hypothesis',
  ])

  requireTokens(errors, 'idea mode', idea, [
    '### Mode A: 記事ネタを確認する',
    '#### A-1. Experience Recordを抽出する',
    '#### A-2. ネタ判定を行う',
    '#### A-3. 媒体と記事タイプを提案する',
    '#### A-4. Draft Article Planを作る',
    '#### A-5. Draft Article PlanをSeedへ残し、Draftへ引き渡す',
    '## Draft Article Plan: note/example-slug',
    '### Evidence Boundary',
    '### Outline',
    'AUTHOR_INPUT_REQUIRED',
    'NEEDS_INPUT',
    'マーカーを独断で削除しない',
    'write-enabled + 対応Seedがある',
    'review-only（`/check-tech-blog`）',
    'marker保存だけを目的にSeedを新規作成しない',
  ])

  for (const token of PLAN_TEMPLATE_TEXTS) {
    if (!idea.includes(token)) errors.push(`idea mode missing Article Plan template text: ${token}`)
    if (!articlePlanCheck.includes(token)) errors.push(`article-plan checker missing template exclusion: ${token}`)
  }
  if (!articlePlanCheck.includes('tech-blog-writing references/idea-mode.md A-5')) {
    errors.push('article-plan checker must point template provenance to references/idea-mode.md A-5')
  }

  requireTokens(errors, 'existing article mode', existing, [
    '### Mode B: 既存記事を確認する',
    'Reader Gate',
    'Experience Gate',
    'Evidence Gate',
    'Scope Gate',
    'Subtraction Gate',
    'Channel Gate',
    '/humanize-review',
    '/review-article',
    '/review-note-article',
  ])

  requireTokens(errors, 'output contract', output, [
    '### 記事ネタモード',
    '# Tech Blog Idea Check',
    'READY | NEEDS_INPUT | PARK',
    '### 既存記事モード',
    '# Tech Blog Check',
    'PASS | NEEDS_REVISION | BLOCKED',
    '既存の AUTHOR_INPUT_REQUIRED',
    '追加提案する AUTHOR_INPUT_REQUIRED',
    'Draft Article Plan / Draftへ進めない',
  ])

  requireTokens(errors, 'lifecycle contract', lifecycle, [
    'Author Input Gate（Human）',
    'AUTHOR_INPUT_REQUIRED',
    'PROMOTED` で止めて `PLANNED` へ遷移させず',
    'AIは中心主張を縮小する案を提案してよい',
  ])

  requireTokens(errors, 'seed readme', seedReadme, [
    'write-enabled',
    'review-only',
    'marker保存だけを目的にSeedを作らない',
    '同じ不足を表すmarkerを機械的に重複追加しない',
    'Author Input Gateを解消できたSeedだけ',
    '`PLANNED` へ進め',
  ])

  requireTokens(errors, 'seed placeholder checker', seedPlaceholderCheck, [
    'duplicate AUTHOR_INPUT_REQUIRED',
    'maskFencedBlocks',
    'fenced examples must be ignored',
  ])

  requireTokens(errors, 'command', command, [
    PATHS.skill,
    PATHS.editorial,
    PATHS.idea,
    PATHS.existing,
    PATHS.output,
    '実在する許可パスなら既存記事モード',
    '長文本文は生成しない',
    '記事本文、Seed metadata、レビュー成果物、設定ファイルを変更していない',
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
  const base = {}
  for (const file of Object.values(PATHS)) base[file] = ''

  base[PATHS.skill] = [
    'references/editorial-principles.md',
    'references/idea-mode.md',
    'references/existing-article-mode.md',
    'references/output-contract.md',
    'Lifecycle上の責務 Draft Article Plan',
    '単発の翻訳・誤字修正・タイトル案だけの依頼には使わない',
    '公開、マージ',
  ].join(' ')
  base[PATHS.editorial] = 'AIは編集者であり、経験の生成者ではない 1記事1主張 主張と根拠 適用範囲 Research方針 Observed Verified Hypothesis'
  base[PATHS.idea] = [
    '### Mode A: 記事ネタを確認する',
    '#### A-1. Experience Recordを抽出する',
    '#### A-2. ネタ判定を行う',
    '#### A-3. 媒体と記事タイプを提案する',
    '#### A-4. Draft Article Planを作る',
    '#### A-5. Draft Article PlanをSeedへ残し、Draftへ引き渡す',
    '## Draft Article Plan: note/example-slug',
    '### Evidence Boundary',
    '### Outline',
    'AUTHOR_INPUT_REQUIRED',
    'NEEDS_INPUT',
    'マーカーを独断で削除しない',
    'write-enabled + 対応Seedがある',
    'review-only（`/check-tech-blog`）',
    'marker保存だけを目的にSeedを新規作成しない',
    ...PLAN_TEMPLATE_TEXTS,
  ].join('\n')
  base[PATHS.existing] = '### Mode B: 既存記事を確認する Reader Gate Experience Gate Evidence Gate Scope Gate Subtraction Gate Channel Gate /humanize-review /review-article /review-note-article'
  base[PATHS.output] = '### 記事ネタモード # Tech Blog Idea Check READY | NEEDS_INPUT | PARK 既存の AUTHOR_INPUT_REQUIRED 追加提案する AUTHOR_INPUT_REQUIRED Draft Article Plan / Draftへ進めない ### 既存記事モード # Tech Blog Check PASS | NEEDS_REVISION | BLOCKED'
  base[PATHS.lifecycle] = 'Author Input Gate（Human） AUTHOR_INPUT_REQUIRED PROMOTED` で止めて `PLANNED` へ遷移させず AIは中心主張を縮小する案を提案してよい'
  base[PATHS.seedReadme] = 'write-enabled review-only marker保存だけを目的にSeedを作らない 同じ不足を表すmarkerを機械的に重複追加しない Author Input Gateを解消できたSeedだけ `PLANNED` へ進め'
  base[PATHS.seedPlaceholderCheck] = 'duplicate AUTHOR_INPUT_REQUIRED maskFencedBlocks fenced examples must be ignored'
  base[PATHS.command] = `${PATHS.skill} ${PATHS.editorial} ${PATHS.idea} ${PATHS.existing} ${PATHS.output} 実在する許可パスなら既存記事モード 長文本文は生成しない 記事本文、Seed metadata、レビュー成果物、設定ファイルを変更していない`
  base[PATHS.articlePlanCheck] = `tech-blog-writing references/idea-mode.md A-5 ${PLAN_TEMPLATE_TEXTS.join(' ')}`

  const valid = validate(base)
  if (valid.length) throw new Error(`valid fixture failed: ${valid.join('; ')}`)

  const inlined = { ...base, [PATHS.skill]: `${base[PATHS.skill]}\n#### A-1. Experience Recordを抽出する` }
  if (!validate(inlined).some((e) => e.includes('must keep detail in references'))) {
    throw new Error('inlined workflow detail was not rejected')
  }

  const missingModeRef = { ...base, [PATHS.command]: base[PATHS.command].replace(PATHS.idea, '') }
  if (!validate(missingModeRef).some((e) => e.includes(PATHS.idea))) {
    throw new Error('missing idea-mode command reference was not rejected')
  }

  const driftedTemplate = { ...base, [PATHS.idea]: base[PATHS.idea].replace(PLAN_TEMPLATE_TEXTS[0], 'changed') }
  if (!validate(driftedTemplate).some((e) => e.includes('template text'))) {
    throw new Error('Article Plan template drift was not rejected')
  }

  console.log('[test:tech-blog-writing-contract] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }
  const errors = validate(readRepoFiles())
  if (errors.length) {
    console.error('[check:tech-blog-writing-contract] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:tech-blog-writing-contract] PASS')
}

if (require.main === module) main()
module.exports = { PLAN_TEMPLATE_TEXTS, validate }
