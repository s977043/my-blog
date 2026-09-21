#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  return {
    selfTest: argv.includes('--self-test'),
    target: argv.find((arg) => !arg.startsWith('--')) || null,
  };
}

function resolveTargets(target) {
  if (target) {
    const p = target.startsWith('talks/') ? target : path.join('talks', target);
    return [p];
  }

  if (!fs.existsSync('talks')) return [];
  return fs.readdirSync('talks', { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => path.join('talks', entry.name));
}

function extractBulletField(content, name) {
  const escaped = name.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp('^-\\s*' + escaped + ':\\s*(.*?)\\s*$', 'mi'));
  return match ? match[1].trim() : '';
}

function extractCoreThesis(content) {
  const match = content.match(/##\s+Core Thesis\s*\r?\n+(?:\s*\r?\n)*>\s*(.+)/i);
  return match ? match[1].trim() : '';
}

function stripFrontMatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function parseSlides(content) {
  return stripFrontMatter(content)
    .split(/\r?\n---\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTimeSeconds(raw) {
  if (!raw) return null;
  const value = raw.trim();
  if (/^\d+:\d{2}$/.test(value)) {
    const parts = value.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }
  if (/^\d+(?:\.\d+)?m$/.test(value)) return Math.round(parseFloat(value) * 60);
  if (/^\d+s$/.test(value)) return parseInt(value, 10);
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  return null;
}

function validateTalk(dir) {
  const errors = [];
  const warnings = [];
  const required = ['brief.md', 'story.md', 'deck.md', 'speaker-notes.md', 'review.md'];

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { errors: ['talk directory not found: ' + dir], warnings };
  }

  for (const file of required) {
    if (!fs.existsSync(path.join(dir, file))) errors.push('missing required file: ' + file);
  }
  if (errors.length) return { errors, warnings };

  const brief = fs.readFileSync(path.join(dir, 'brief.md'), 'utf8');
  const story = fs.readFileSync(path.join(dir, 'story.md'), 'utf8');
  const deck = fs.readFileSync(path.join(dir, 'deck.md'), 'utf8');
  const notes = fs.readFileSync(path.join(dir, 'speaker-notes.md'), 'utf8');
  const review = fs.readFileSync(path.join(dir, 'review.md'), 'utf8');

  const audience = extractBulletField(brief, 'audience');
  const durationRaw = extractBulletField(brief, 'duration_minutes');
  const duration = Number.parseFloat(durationRaw);
  const thesis = extractCoreThesis(brief);

  if (!audience) errors.push('brief.md: audience is empty');
  if (!Number.isFinite(duration) || duration <= 0) errors.push('brief.md: duration_minutes must be a positive number');
  if (!thesis) errors.push('brief.md: Core Thesis is empty');
  if (!/##\s+Takeaways/i.test(brief)) errors.push('brief.md: Takeaways section is missing');
  if (/provisional/i.test(brief)) warnings.push('brief.md: provisional constraint remains; final verdict should be UNVERIFIED until confirmed');

  if (!/##\s+Narrative Arc/i.test(story)) errors.push('story.md: Narrative Arc section is missing');
  if (!/##\s+Cut List/i.test(story)) errors.push('story.md: Cut List section is missing');
  if (!/##\s+Notes/i.test(notes)) errors.push('speaker-notes.md: Notes section is missing');

  const slides = parseSlides(deck);
  if (!slides.length) {
    errors.push('deck.md: no slides found');
  } else {
    let totalSeconds = 0;
    slides.forEach((slide, index) => {
      const n = index + 1;
      const messageMatch = slide.match(/\bmessage:\s*(.*?)\s*(?:\r?\n|$)/i);
      const timeMatch = slide.match(/\btime:\s*(.*?)\s*(?:\r?\n|$)/i);
      const message = messageMatch ? messageMatch[1].trim() : '';
      const timeRaw = timeMatch ? timeMatch[1].trim() : '';

      if (!message) errors.push('deck.md: slide ' + n + ' has no message');
      if (!timeRaw) {
        errors.push('deck.md: slide ' + n + ' has no time budget');
      } else {
        const seconds = parseTimeSeconds(timeRaw);
        if (seconds == null) errors.push('deck.md: slide ' + n + ' has invalid time format "' + timeRaw + '"');
        else totalSeconds += seconds;
      }
    });

    if (Number.isFinite(duration) && duration > 0) {
      const limit = duration * 60;
      const plannedMinutes = Math.round(totalSeconds / 60 * 10) / 10;
      if (totalSeconds > limit) {
        errors.push('deck.md: planned slide time ' + plannedMinutes + 'm exceeds talk duration ' + duration + 'm');
      } else if (totalSeconds > limit * 0.9) {
        warnings.push('deck.md: planned slide time uses more than 90% of the talk duration; keep transition/buffer time');
      }
    }
  }

  const verdict = extractBulletField(review, 'status');
  if (!['READY', 'NEEDS_CHANGES', 'UNVERIFIED'].includes(verdict)) {
    errors.push('review.md: status must be READY, NEEDS_CHANGES, or UNVERIFIED');
  }

  return { errors, warnings };
}

function report(dir, result) {
  console.log('[check:talk] ' + dir);
  for (const warning of result.warnings) console.warn('  WARN: ' + warning);
  for (const error of result.errors) console.error('  ERROR: ' + error);
  if (!result.errors.length) console.log('  PASS');
}

function writeFixture(dir, valid) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'brief.md'), valid
    ? '# Talk Brief\n\n## Metadata\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n\n## Core Thesis\n\n> 品質保証を生成後に閉じる\n\n## Takeaways\n\n1. verifierを持つ\n'
    : '# Talk Brief\n\n- audience:\n- duration_minutes:\n\n## Core Thesis\n\n> \n');
  fs.writeFileSync(path.join(dir, 'story.md'), '# Story\n\n## Narrative Arc\n\n| section | purpose |\n|---|---|\n| Hook | start |\n\n## Cut List\n\n1. demo\n');
  fs.writeFileSync(path.join(dir, 'deck.md'), valid
    ? '---\nmarp: true\n---\n\n# Title\n\n<!--\nmessage: 品質保証を閉じる\ntime: 1:00\n-->\n\n---\n\n# End\n\n<!--\nmessage: verifierを持ち帰る\ntime: 1:00\n-->\n'
    : '---\nmarp: true\n---\n\n# Title\n');
  fs.writeFileSync(path.join(dir, 'speaker-notes.md'), '# Speaker Notes\n\n## Notes\n\n### Slide 1\n');
  fs.writeFileSync(path.join(dir, 'review.md'), '# Review\n\n## Verdict\n\n- status: READY\n');
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-talk-'));
  const validDir = path.join(root, 'valid');
  const invalidDir = path.join(root, 'invalid');
  writeFixture(validDir, true);
  writeFixture(invalidDir, false);

  const valid = validateTalk(validDir);
  const invalid = validateTalk(invalidDir);

  if (valid.errors.length) throw new Error('valid fixture should pass: ' + valid.errors.join('; '));
  if (!invalid.errors.length) throw new Error('invalid fixture should fail');

  console.log('[test:talk] PASS');
}

const args = parseArgs(process.argv.slice(2));
if (args.selfTest) {
  selfTest();
  process.exit(0);
}

const targets = resolveTargets(args.target);
if (!targets.length) {
  console.log('[check:talk] no talk directories found');
  process.exit(0);
}

let failed = false;
for (const dir of targets) {
  const result = validateTalk(dir);
  report(dir, result);
  if (result.errors.length) failed = true;
}

if (failed) process.exitCode = 1;
