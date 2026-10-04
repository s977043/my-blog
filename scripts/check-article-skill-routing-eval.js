#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const FIXTURE = '.claude/evals/article-skill-routing.json'
const COMMAND = '.claude/commands/eval-article-skill-routing.md'

function skillNameFromPath(p) {
  const m = String(p).match(/\.claude\/skills\/([^/]+)\/SKILL\.md$/)
  return m ? m[1] : null
}

function frontMatterValue(markdown, key) {
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null
  const line = match[1].split(/\r?\n/).find((row) => row.startsWith(`${key}:`))
  if (!line) return null
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
}

function validateCandidateFiles(data, files) {
  const errors = []
  for (const file of data.candidateSkills || []) {
    const expectedName = skillNameFromPath(file)
    if (!(file in files)) {
      errors.push(`missing candidate skill file: ${file}`)
      continue
    }
    const actualName = frontMatterValue(files[file], 'name')
    const description = frontMatterValue(files[file], 'description')
    if (actualName !== expectedName) {
      errors.push(`${file}: frontmatter name must be ${expectedName}, found ${actualName || '(missing)'}`)
    }
    if (!description) errors.push(`${file}: frontmatter description is required for semantic routing`)
  }
  return errors
}

function validate(data, command) {
  const errors = []
  if (!data || data.version !== 1) errors.push('fixture version must be 1')
  if (!Array.isArray(data.candidateSkills) || data.candidateSkills.length < 3) {
    errors.push('candidateSkills must contain at least 3 skills')
  }
  if (!Array.isArray(data.cases) || data.cases.length < 10) {
    errors.push('cases must contain at least 10 fixtures')
  }
  if (errors.length) return errors

  const names = data.candidateSkills.map(skillNameFromPath)
  if (names.some((name) => !name)) errors.push('candidateSkills must point to .claude/skills/<name>/SKILL.md')
  if (new Set(names).size !== names.length) errors.push('candidateSkills must be unique')

  const ids = new Set()
  const prompts = new Set()
  const positiveCounts = new Map(names.map((name) => [name, 0]))
  let negativeCount = 0

  for (const item of data.cases) {
    if (!item || typeof item !== 'object') {
      errors.push('every case must be an object')
      continue
    }
    if (!item.id || ids.has(item.id)) errors.push(`case id must be unique and non-empty: ${item.id || '(empty)'}`)
    ids.add(item.id)
    if (!item.userPrompt || typeof item.userPrompt !== 'string') errors.push(`${item.id}: userPrompt is required`)
    if (prompts.has(item.userPrompt)) errors.push(`${item.id}: duplicate userPrompt`)
    prompts.add(item.userPrompt)
    const forbiddenSkills = Array.isArray(item.forbiddenSkills) ? item.forbiddenSkills : []
    if (!Array.isArray(item.forbiddenSkills)) errors.push(`${item.id}: forbiddenSkills must be an array`)
    if (!Object.prototype.hasOwnProperty.call(item, 'expectedSkill')) {
      errors.push(`${item.id}: expectedSkill must be present (skill name or null)`)
    }

    if (item.expectedSkill == null) {
      negativeCount += 1
    } else if (!names.includes(item.expectedSkill)) {
      errors.push(`${item.id}: unknown expectedSkill ${item.expectedSkill}`)
    } else {
      positiveCounts.set(item.expectedSkill, positiveCounts.get(item.expectedSkill) + 1)
      if (forbiddenSkills.includes(item.expectedSkill)) {
        errors.push(`${item.id}: expectedSkill must not be forbidden`)
      }
    }

    for (const forbidden of forbiddenSkills) {
      if (!names.includes(forbidden)) errors.push(`${item.id}: unknown forbidden skill ${forbidden}`)
    }
  }

  for (const [name, count] of positiveCounts) {
    if (count < 3) errors.push(`${name}: expected at least 3 positive routing cases, found ${count}`)
  }
  if (negativeCount < 3) errors.push(`expected at least 3 negative routing cases, found ${negativeCount}`)

  for (const token of [
    FIXTURE,
    'frontmatter',
    'fresh reviewer',
    'expectedSkillをReviewerへ見せない',
    'none',
    'UNVERIFIED',
  ]) {
    if (!String(command).includes(token)) errors.push(`routing eval command missing token: ${token}`)
  }

  return errors
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'))
}

function selfTest() {
  const base = {
    version: 1,
    candidateSkills: [
      '.claude/skills/a/SKILL.md',
      '.claude/skills/b/SKILL.md',
      '.claude/skills/c/SKILL.md',
    ],
    cases: [
      ...['a', 'b', 'c'].flatMap((name) => [1, 2, 3].map((n) => ({
        id: `${name}-${n}`,
        userPrompt: `${name} prompt ${n}`,
        expectedSkill: name,
        forbiddenSkills: [],
      }))),
      ...[1, 2, 3].map((n) => ({
        id: `negative-${n}`,
        userPrompt: `negative prompt ${n}`,
        expectedSkill: null,
        forbiddenSkills: ['a', 'b', 'c'],
      })),
    ],
  }
  const command = `${FIXTURE} frontmatter fresh reviewer expectedSkillをReviewerへ見せない none UNVERIFIED`
  const candidateFiles = Object.fromEntries(
    base.candidateSkills.map((file) => {
      const name = skillNameFromPath(file)
      return [file, `---\nname: ${name}\ndescription: route ${name}\n---\n`]
    })
  )

  const valid = [...validate(base, command), ...validateCandidateFiles(base, candidateFiles)]
  if (valid.length) throw new Error(`valid fixture failed: ${valid.join('; ')}`)

  const tooFew = JSON.parse(JSON.stringify(base))
  tooFew.cases = tooFew.cases.filter((item) => item.id !== 'a-3')
  if (!validate(tooFew, command).some((e) => e.includes('a: expected at least 3'))) {
    throw new Error('positive-case minimum was not enforced')
  }

  const leak = validate(base, command.replace('expectedSkillをReviewerへ見せない', ''))
  if (!leak.some((e) => e.includes('expectedSkillをReviewerへ見せない'))) {
    throw new Error('answer-leak guard was not enforced')
  }

  const invalidExpected = JSON.parse(JSON.stringify(base))
  invalidExpected.cases[0].expectedSkill = 'unknown'
  if (!validate(invalidExpected, command).some((e) => e.includes('unknown expectedSkill'))) {
    throw new Error('unknown expectedSkill was not rejected')
  }

  const malformedForbidden = JSON.parse(JSON.stringify(base))
  malformedForbidden.cases[0].forbiddenSkills = 'not-an-array'
  if (!validate(malformedForbidden, command).some((e) => e.includes('forbiddenSkills must be an array'))) {
    throw new Error('malformed forbiddenSkills was not rejected safely')
  }

  const missingDescription = { ...candidateFiles, [base.candidateSkills[0]]: '---\nname: a\n---\n' }
  if (!validateCandidateFiles(base, missingDescription).some((e) => e.includes('frontmatter description is required'))) {
    throw new Error('missing candidate description was not rejected')
  }

  console.log('[test:article-skill-routing-eval] PASS')
}

function main() {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }
  const fixture = readJson(FIXTURE)
  const command = fs.readFileSync(path.join(ROOT, COMMAND), 'utf8')
  const candidateFiles = {}
  for (const file of fixture.candidateSkills || []) {
    const absolute = path.join(ROOT, file)
    if (fs.existsSync(absolute)) candidateFiles[file] = fs.readFileSync(absolute, 'utf8')
  }
  const errors = [...validate(fixture, command), ...validateCandidateFiles(fixture, candidateFiles)]
  if (errors.length) {
    console.error('[check:article-skill-routing-eval] FAIL')
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('[check:article-skill-routing-eval] PASS')
}

if (require.main === module) main()
module.exports = { skillNameFromPath, frontMatterValue, validateCandidateFiles, validate }
