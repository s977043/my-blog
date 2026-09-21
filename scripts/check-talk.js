#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const QUALITY_AXES = ['Focus', 'Flow', 'Hierarchy', 'Legibility', 'Truthfulness', 'Speakability'];
const REVIEW_STATUSES = ['READY', 'NEEDS_CHANGES', 'UNVERIFIED'];
const CHECK_STATUSES = ['PASS', 'FAIL', 'UNVERIFIED'];

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractBulletField(content, name) {
  const escaped = escapeRegExp(name);
  const match = content.match(new RegExp('^-\\s*' + escaped + ':\\s*(.*?)\\s*$', 'mi'));
  return match ? match[1].trim() : '';
}

function extractSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const target = '## ' + heading.toLowerCase();
  const start = lines.findIndex((line) => line.trim().toLowerCase() === target);
  if (start < 0) return '';

  const result = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) break;
    result.push(lines[i]);
  }
  return result.join('\n');
}

function extractSectionBulletField(content, heading, name) {
  return extractBulletField(extractSection(content, heading), name);
}

function extractCoreThesis(content) {
  const section = extractSection(content, 'Core Thesis');
  const match = section.match(/^>\s*(.+?)\s*$/m);
  return match ? match[1].trim() : '';
}

function extractListItems(section) {
  const items = [];
  const re = /^\s*(?:[-*+] |\d+\.\s+)(.*?)\s*$/gm;
  let match;
  while ((match = re.exec(section)) !== null) {
    const value = match[1].trim();
    if (value && value !== '-') items.push(value);
  }
  return items;
}

function stripFrontMatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function extractFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return match ? match[1] : '';
}

function parseSlides(content) {
  return stripFrontMatter(content)
    .split(/\r?\n---\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSlideMetadata(slide) {
  const metadata = {};
  const comments = slide.match(/<!--[\s\S]*?-->/g) || [];

  for (const comment of comments) {
    const body = comment.replace(/^<!--|-->$/g, '');
    for (const line of body.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
      if (match && metadata[match[1]] == null) metadata[match[1]] = match[2].trim();
    }
  }

  return metadata;
}

function parseTimeSeconds(raw) {
  if (!raw) return null;
  const value = raw.trim();

  if (/^\d+:[0-5]\d$/.test(value)) {
    const [minutes, seconds] = value.split(':').map(Number);
    const total = minutes * 60 + seconds;
    return total > 0 ? total : null;
  }

  if (/^\d+(?:\.\d+)?m$/.test(value)) {
    const total = Math.round(parseFloat(value) * 60);
    return total > 0 ? total : null;
  }

  if (/^\d+s$/.test(value)) {
    const total = parseInt(value, 10);
    return total > 0 ? total : null;
  }

  if (/^\d+$/.test(value)) {
    const total = parseInt(value, 10);
    return total > 0 ? total : null;
  }

  return null;
}

function countVisibleBullets(slide) {
  const visible = slide
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '');

  return (visible.match(/^\s*[-*+]\s+\S+/gm) || []).length;
}

function countCodeLines(slide) {
  const blocks = slide.match(/```[^\n]*\r?\n[\s\S]*?```/g) || [];
  return blocks.reduce((total, block) => {
    const lines = block.split(/\r?\n/).slice(1, -1);
    return total + lines.filter((line) => line.trim()).length;
  }, 0);
}

function parseMachineConstraints(design, errors) {
  const section = extractSection(design, 'Machine Constraints');
  const match = section.match(/```json\s*([\s\S]*?)```/i);

  if (!match) {
    errors.push('design.md: Machine Constraints must contain a fenced json object');
    return null;
  }

  let constraints;
  try {
    constraints = JSON.parse(match[1]);
  } catch (error) {
    errors.push('design.md: Machine Constraints JSON is invalid: ' + error.message);
    return null;
  }

  const required = {
    aspectRatio: 'string',
    maxColumns: 'number',
    maxBullets: 'number',
    maxCodeLines: 'number',
    minFigureFontPt: 'number',
    requireAttentionTarget: 'boolean',
    requireRenderVerification: 'boolean',
    requireRehearsalVerification: 'boolean',
  };

  for (const [key, type] of Object.entries(required)) {
    if (typeof constraints[key] !== type) {
      errors.push('design.md: Machine Constraints.' + key + ' must be ' + type);
    }
  }

  for (const key of ['maxColumns', 'maxBullets', 'maxCodeLines', 'minFigureFontPt']) {
    if (typeof constraints[key] === 'number' && constraints[key] <= 0) {
      errors.push('design.md: Machine Constraints.' + key + ' must be positive');
    }
  }

  return constraints;
}

function parseNoteSlides(notes) {
  const map = new Map();
  const lines = notes.split(/\r?\n/);
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^###\s+Slide\s+(\d+)\s*$/i);
    if (heading) {
      current = Number.parseInt(heading[1], 10);
      if (!map.has(current)) map.set(current, {});
      continue;
    }

    if (/^##\s+/.test(line)) {
      current = null;
      continue;
    }

    if (current == null) continue;

    const field = line.match(/^-\s*([A-Za-z_][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (field) map.get(current)[field[1]] = field[2].trim();
  }

  return map;
}

function normalize(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function compareSnapshot(file, content, contract, errors) {
  const audience = extractBulletField(content, 'audience');
  const durationRaw = extractBulletField(content, 'duration_minutes');
  const thesis = extractBulletField(content, 'core_thesis');

  if (!audience) errors.push(file + ': contract snapshot audience is empty');
  else if (normalize(audience) !== normalize(contract.audience)) {
    errors.push(file + ': audience drift from brief.md');
  }

  if (!durationRaw) {
    errors.push(file + ': contract snapshot duration_minutes is empty');
  } else {
    const duration = Number.parseFloat(durationRaw);
    if (!Number.isFinite(duration) || duration !== contract.duration) {
      errors.push(file + ': duration_minutes drift from brief.md');
    }
  }

  if (!thesis) errors.push(file + ': contract snapshot core_thesis is empty');
  else if (normalize(thesis) !== normalize(contract.thesis)) {
    errors.push(file + ': core_thesis drift from brief.md');
  }
}

function hasUnverifiedEvidence(brief) {
  return brief.split(/\r?\n/).some((line) => {
    if (!/^\s*\|/.test(line)) return false;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    return cells.length >= 4 && cells[cells.length - 1].toLowerCase() === 'unverified';
  });
}

function parseQualityAxes(review, errors) {
  const section = extractSection(review, 'Quality Axes');
  if (!section) {
    errors.push('review.md: Quality Axes section is missing');
    return {};
  }

  const statuses = {};
  for (const axis of QUALITY_AXES) {
    const re = new RegExp('^\\|\\s*' + escapeRegExp(axis) + '\\s*\\|\\s*([^|]+)\\|', 'mi');
    const match = section.match(re);
    const status = match ? match[1].trim() : '';
    if (!CHECK_STATUSES.includes(status)) {
      errors.push('review.md: Quality Axis ' + axis + ' must be PASS, FAIL, or UNVERIFIED');
    }
    statuses[axis] = status;
  }
  return statuses;
}

function hasBlockingFinding(review) {
  const section = extractSection(review, 'Persona Findings');
  return section.split(/\r?\n/).some((line) => {
    if (!/^\s*\|/.test(line)) return false;
    const cells = line.split('|').map((cell) => cell.trim());
    const priority = cells[3] || '';
    return priority === 'must' || priority === 'high';
  });
}

function validateTalk(dir) {
  const errors = [];
  const warnings = [];
  const required = ['brief.md', 'story.md', 'design.md', 'deck.md', 'speaker-notes.md', 'review.md'];

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { errors: ['talk directory not found: ' + dir], warnings };
  }

  for (const file of required) {
    if (!fs.existsSync(path.join(dir, file))) errors.push('missing required file: ' + file);
  }
  if (errors.length) return { errors, warnings };

  const brief = fs.readFileSync(path.join(dir, 'brief.md'), 'utf8');
  const story = fs.readFileSync(path.join(dir, 'story.md'), 'utf8');
  const design = fs.readFileSync(path.join(dir, 'design.md'), 'utf8');
  const deck = fs.readFileSync(path.join(dir, 'deck.md'), 'utf8');
  const notes = fs.readFileSync(path.join(dir, 'speaker-notes.md'), 'utf8');
  const review = fs.readFileSync(path.join(dir, 'review.md'), 'utf8');

  const audience = extractBulletField(brief, 'audience');
  const durationRaw = extractBulletField(brief, 'duration_minutes');
  const duration = Number.parseFloat(durationRaw);
  const thesis = extractCoreThesis(brief);
  const contract = { audience, duration, thesis };

  if (!audience) errors.push('brief.md: audience is empty');
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.push('brief.md: duration_minutes must be a positive number');
  }
  if (!thesis) errors.push('brief.md: Core Thesis is empty');

  const takeaways = extractListItems(extractSection(brief, 'Takeaways'));
  if (takeaways.length < 1 || takeaways.length > 3) {
    errors.push('brief.md: Takeaways must contain 1 to 3 non-empty items');
  }

  const provisional = /\bprovisional\b/i.test(brief);
  if (provisional) {
    warnings.push('brief.md: provisional constraint remains; final verdict must not be READY');
  }

  if (!/##\s+Narrative Arc/i.test(story)) errors.push('story.md: Narrative Arc section is missing');
  if (!/##\s+Cut List/i.test(story)) errors.push('story.md: Cut List section is missing');

  if (audience && Number.isFinite(duration) && thesis) {
    compareSnapshot('story.md', story, contract, errors);
    compareSnapshot('design.md', design, contract, errors);
    compareSnapshot('speaker-notes.md', notes, contract, errors);
    compareSnapshot('review.md', review, contract, errors);
  }

  const designSystem = extractSectionBulletField(design, 'Base', 'design_system');
  if (designSystem !== 'talks/DESIGN.md') {
    errors.push('design.md: Base design_system must be talks/DESIGN.md');
  }

  const constraints = parseMachineConstraints(design, errors);

  const frontMatter = extractFrontMatter(deck);
  const deckSize = extractBulletField(frontMatter.replace(/^/gm, '- '), 'size') ||
    ((frontMatter.match(/^size:\s*(.*?)\s*$/mi) || [])[1] || '').trim();

  if (constraints && constraints.aspectRatio && deckSize !== constraints.aspectRatio) {
    errors.push('deck.md: size ' + (deckSize || '<missing>') + ' does not match design aspectRatio ' + constraints.aspectRatio);
  }

  const slides = parseSlides(deck);
  let totalSeconds = 0;
  const slideTimes = [];

  if (!slides.length) {
    errors.push('deck.md: no slides found');
  } else {
    slides.forEach((slide, index) => {
      const n = index + 1;
      const metadata = parseSlideMetadata(slide);

      if (!metadata.message) errors.push('deck.md: slide ' + n + ' has no message metadata');
      if (constraints && constraints.requireAttentionTarget && !metadata.attention) {
        errors.push('deck.md: slide ' + n + ' has no attention metadata');
      }
      if (!metadata.layout) errors.push('deck.md: slide ' + n + ' has no layout metadata');

      const columns = Number.parseInt(metadata.columns, 10);
      if (!metadata.columns || !/^\\d+$/.test(metadata.columns)) {
        errors.push('deck.md: slide ' + n + ' has invalid or missing columns metadata');
      } else if (constraints && (columns < 1 || columns > constraints.maxColumns)) {
        errors.push('deck.md: slide ' + n + ' uses ' + columns + ' columns; maxColumns is ' + constraints.maxColumns);
      }

      if (!metadata.time) {
        errors.push('deck.md: slide ' + n + ' has no time budget');
        slideTimes.push(null);
      } else {
        const seconds = parseTimeSeconds(metadata.time);
        if (seconds == null) {
          errors.push('deck.md: slide ' + n + ' has invalid time format "' + metadata.time + '"');
          slideTimes.push(null);
        } else {
          totalSeconds += seconds;
          slideTimes.push(seconds);
        }
      }

      if (constraints) {
        const bulletCount = countVisibleBullets(slide);
        if (bulletCount > constraints.maxBullets) {
          errors.push('deck.md: slide ' + n + ' has ' + bulletCount + ' bullets; maxBullets is ' + constraints.maxBullets);
        }

        const codeLines = countCodeLines(slide);
        if (codeLines > constraints.maxCodeLines) {
          errors.push('deck.md: slide ' + n + ' has ' + codeLines + ' code lines; maxCodeLines is ' + constraints.maxCodeLines);
        }
      }
    });

    if (Number.isFinite(duration) && duration > 0) {
      const limit = duration * 60;
      const plannedMinutes = Math.round(totalSeconds / 60 * 10) / 10;
      if (totalSeconds > limit) {
        errors.push('deck.md: planned slide time ' + plannedMinutes + 'm exceeds talk duration ' + duration + 'm');
      } else if (totalSeconds > limit * 0.9) {
        warnings.push('deck.md: planned slide time uses more than 90% of talk duration; keep transition/buffer time');
      }
    }
  }

  const noteSlides = parseNoteSlides(notes);
  if (slides.length && noteSlides.size !== slides.length) {
    errors.push('speaker-notes.md: Slide note count ' + noteSlides.size + ' does not match deck slide count ' + slides.length);
  }

  slides.forEach((slide, index) => {
    const n = index + 1;
    const note = noteSlides.get(n);
    if (!note) {
      errors.push('speaker-notes.md: missing Slide ' + n + ' notes');
      return;
    }

    if (!note.target_time) {
      errors.push('speaker-notes.md: Slide ' + n + ' target_time is empty');
    } else {
      const noteSeconds = parseTimeSeconds(note.target_time);
      if (noteSeconds == null) {
        errors.push('speaker-notes.md: Slide ' + n + ' target_time is invalid');
      } else if (slideTimes[index] != null && noteSeconds !== slideTimes[index]) {
        errors.push('speaker-notes.md: Slide ' + n + ' target_time does not match deck time');
      }
    }

    if (!note.say) errors.push('speaker-notes.md: Slide ' + n + ' say is empty');

    const layout = (parseSlideMetadata(slide).layout || '').toLowerCase();
    if (/(diagram|architecture|model|screenshot|demo|comparison)/.test(layout) && !note.describe_visual) {
      errors.push('speaker-notes.md: Slide ' + n + ' visual layout requires describe_visual');
    }
  });

  const verdict = extractSectionBulletField(review, 'Verdict', 'status');
  const sourceVerification = extractSectionBulletField(review, 'Verdict', 'source_verification');
  const renderVerification = extractSectionBulletField(review, 'Verdict', 'render_verification');
  const rehearsalVerification = extractSectionBulletField(review, 'Verdict', 'rehearsal_verification');

  if (!REVIEW_STATUSES.includes(verdict)) {
    errors.push('review.md: status must be READY, NEEDS_CHANGES, or UNVERIFIED');
  }
  if (!['PASS', 'FAIL'].includes(sourceVerification)) {
    errors.push('review.md: source_verification must be PASS or FAIL');
  }
  if (!CHECK_STATUSES.includes(renderVerification)) {
    errors.push('review.md: render_verification must be PASS, FAIL, or UNVERIFIED');
  }
  if (!CHECK_STATUSES.includes(rehearsalVerification)) {
    errors.push('review.md: rehearsal_verification must be PASS, FAIL, or UNVERIFIED');
  }

  const axisStatuses = parseQualityAxes(review, errors);
  const unverifiedClaims = extractListItems(extractSection(review, 'Unverified Claims'));
  const unverifiedEvidence = hasUnverifiedEvidence(brief);

  const renderSectionStatus = extractSectionBulletField(review, 'Render Verification', 'status');
  const renderArtifact = extractSectionBulletField(review, 'Render Verification', 'artifact');
  if (renderSectionStatus && renderVerification && renderSectionStatus !== renderVerification) {
    errors.push('review.md: Render Verification status disagrees with Verdict.render_verification');
  }
  if (renderVerification === 'PASS' && !renderArtifact) {
    errors.push('review.md: render_verification PASS requires a rendered artifact reference');
  }

  const rehearsalSectionStatus = extractSectionBulletField(review, 'Rehearsal Verification', 'status');
  const rehearsalRuns = Number.parseInt(extractSectionBulletField(review, 'Rehearsal Verification', 'run_count'), 10);
  const measuredMinutes = Number.parseFloat(extractSectionBulletField(review, 'Rehearsal Verification', 'measured_minutes'));

  if (rehearsalSectionStatus && rehearsalVerification && rehearsalSectionStatus !== rehearsalVerification) {
    errors.push('review.md: Rehearsal Verification status disagrees with Verdict.rehearsal_verification');
  }

  if (rehearsalVerification === 'PASS') {
    if (!Number.isFinite(rehearsalRuns) || rehearsalRuns < 1) {
      errors.push('review.md: rehearsal_verification PASS requires run_count >= 1');
    }
    if (!Number.isFinite(measuredMinutes) || measuredMinutes <= 0) {
      errors.push('review.md: rehearsal_verification PASS requires measured_minutes');
    }
    if (Number.isFinite(duration) && measuredMinutes > duration) {
      errors.push('review.md: measured rehearsal time exceeds talk duration');
    }

    const notesRehearsalStatus = extractSectionBulletField(notes, 'Rehearsal', 'status');
    if (notesRehearsalStatus !== 'PASS') {
      errors.push('speaker-notes.md: Rehearsal status must be PASS when review rehearsal_verification is PASS');
    }
  }

  if (/^-\s*(?:core_thesis_changed|audience_changed|duration_changed|takeaways_changed):\s*true\s*$/mi.test(review) && verdict === 'READY') {
    errors.push('review.md: READY cannot have Contract Drift flags set to true');
  }

  if (verdict === 'READY') {
    if (provisional) errors.push('review.md: READY is invalid while brief.md contains provisional constraints');
    if (unverifiedEvidence) errors.push('review.md: READY is invalid while brief.md contains unverified evidence');
    if (unverifiedClaims.length) errors.push('review.md: READY is invalid while Unverified Claims remain');
    if (hasBlockingFinding(review)) errors.push('review.md: READY is invalid while must/high findings remain');
    if (sourceVerification !== 'PASS') errors.push('review.md: READY requires source_verification PASS');

    for (const axis of QUALITY_AXES) {
      if (axisStatuses[axis] !== 'PASS') {
        errors.push('review.md: READY requires Quality Axis ' + axis + ' PASS');
      }
    }

    if (constraints && constraints.requireRenderVerification && renderVerification !== 'PASS') {
      errors.push('review.md: READY requires render_verification PASS');
    }

    if (constraints && constraints.requireRehearsalVerification && rehearsalVerification !== 'PASS') {
      errors.push('review.md: READY requires rehearsal_verification PASS');
    }
  }

  if (constraints && constraints.minFigureFontPt) {
    warnings.push('design.md: minFigureFontPt=' + constraints.minFigureFontPt + ' requires rendered-artifact verification');
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
    ? '# Talk Brief\n\n## Metadata\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n\n## Core Thesis\n\n> 品質保証を生成後に閉じる\n\n## Takeaways\n\n1. verifierを持つ\n\n## Evidence\n\n| claim | type | source / evidence | status |\n|---|---|---|---|\n| 事実 | official_fact | source | verified |\n'
    : '# Talk Brief\n\n- audience:\n- duration_minutes:\n\n## Core Thesis\n\n> \n\n## Takeaways\n\n1. \n');

  fs.writeFileSync(path.join(dir, 'story.md'),
    '# Story\n\n## Contract Snapshot\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n- core_thesis: 品質保証を生成後に閉じる\n\n## Narrative Arc\n\n| section | purpose |\n|---|---|\n| Hook | start |\n\n## Cut List\n\n1. demo\n');

  fs.writeFileSync(path.join(dir, 'design.md'),
    '# Talk Visual Contract\n\n## Contract Snapshot\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n- core_thesis: 品質保証を生成後に閉じる\n\n## Base\n\n- design_system: talks/DESIGN.md\n\n## Machine Constraints\n\n```json\n{"aspectRatio":"16:9","maxColumns":2,"maxBullets":5,"maxCodeLines":12,"minFigureFontPt":16,"requireAttentionTarget":true,"requireRenderVerification":true,"requireRehearsalVerification":true}\n```\n');

  fs.writeFileSync(path.join(dir, 'deck.md'), valid
    ? '---\nmarp: true\nsize: 16:9\n---\n\n# Title\n\n<!--\nmessage: 品質保証を閉じる\nattention: タイトル\nlayout: hook\ntime: 1:00\n-->\n\n---\n\n# End\n\n<!--\nmessage: verifierを持ち帰る\nattention: Takeaway\nlayout: takeaway\ntime: 1:00\n-->\n'
    : '---\nmarp: true\nsize: 16:9\n---\n\n# Title\n\nmessage: visible text must not count\ntime: 1:99\n');

  fs.writeFileSync(path.join(dir, 'speaker-notes.md'), valid
    ? '# Speaker Notes\n\n## Talk Contract\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n- core_thesis: 品質保証を生成後に閉じる\n\n## Notes\n\n### Slide 1\n\n- target_time: 1:00\n- say: 導入\n- transition: 次へ\n- describe_visual: \n- do_not_say: \n\n### Slide 2\n\n- target_time: 1:00\n- say: 結論\n- transition: 終了\n- describe_visual: \n- do_not_say: \n\n## Rehearsal\n\n- status: PASS\n- run_count: 1\n- measured_minutes: 2\n'
    : '# Speaker Notes\n\n## Talk Contract\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n- core_thesis: 品質保証を生成後に閉じる\n\n## Notes\n\n### Slide 1\n\n- target_time: 1:00\n- say:\n');

  fs.writeFileSync(path.join(dir, 'review.md'),
    '# Talk Review\n\n## Contract\n\n- audience: AIをチーム導入するエンジニア\n- duration_minutes: 10\n- core_thesis: 品質保証を生成後に閉じる\n\n## Verdict\n\n- status: READY\n- source_verification: PASS\n- render_verification: PASS\n- rehearsal_verification: PASS\n\n## Persona Findings\n\n| id | persona | priority | location | finding | suggestion |\n|---|---|---|---|---|---|\n\n## Quality Axes\n\n| axis | status | notes |\n|---|---|---|\n| Focus | PASS | |\n| Flow | PASS | |\n| Hierarchy | PASS | |\n| Legibility | PASS | |\n| Truthfulness | PASS | |\n| Speakability | PASS | |\n\n## Contract Drift\n\n- core_thesis_changed: false\n- audience_changed: false\n- duration_changed: false\n- takeaways_changed: false\n\n## Render Verification\n\n- status: PASS\n- artifact: deck.pdf\n\n## Rehearsal Verification\n\n- status: PASS\n- run_count: 1\n- measured_minutes: 2\n\n## Unverified Claims\n\n- \n');
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-talk-'));
  const validDir = path.join(root, 'valid');
  const invalidDir = path.join(root, 'invalid');

  writeFixture(validDir, true);
  writeFixture(invalidDir, false);

  const valid = validateTalk(validDir);
  const invalid = validateTalk(invalidDir);

  if (valid.errors.length) {
    throw new Error('valid fixture should pass: ' + valid.errors.join('; '));
  }
  if (!invalid.errors.length) {
    throw new Error('invalid fixture should fail');
  }

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
