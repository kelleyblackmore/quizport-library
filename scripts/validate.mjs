/**
 * Validates every quiz in the library.
 *
 * Two independent checks, because they catch different things:
 *   1. the published JSON Schema  -- is the file shaped the way we document it?
 *   2. structural/content rules   -- is it actually usable and correct?
 *
 * Run with `npm run validate` (or `node scripts/validate.mjs`).
 * Exits non-zero on any error so CI can gate on it.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not URL.pathname: a checkout under a path containing spaces
// keeps its %20 escapes in pathname and every read then fails with ENOENT.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const QUIZ_DIR = join(ROOT, 'quizzes', 'categories');
const SCHEMA_PATH = join(ROOT, 'schemas', 'quiz-schema.json');

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

const errors = [];
const warnings = [];
const stats = { files: 0, questions: 0, explanations: 0, hints: 0, byCategory: {}, byDifficulty: {} };

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

/** Minimal JSON Schema check covering the subset this schema actually uses. */
function checkAgainstSchema(quiz, where) {
  const p = schema.properties;

  for (const key of schema.required ?? []) {
    if (quiz[key] === undefined) errors.push(`${where}: missing required "${key}"`);
  }
  // Check the TYPE before the constraint. Guarding with `typeof === 'string'`
  // silently skipped validation for a numeric or null title, so a document
  // violating the schema passed and build:index published the bad value.
  if (quiz.title !== undefined) {
    if (typeof quiz.title !== 'string') {
      errors.push(`${where}: title must be a string (got ${typeof quiz.title})`);
    } else {
      const { minLength = 0, maxLength = Infinity } = p.title;
      if (quiz.title.length < minLength || quiz.title.length > maxLength) {
        errors.push(`${where}: title length ${quiz.title.length} outside ${minLength}-${maxLength}`);
      }
    }
  }
  if (quiz.description !== undefined) {
    if (typeof quiz.description !== 'string') {
      errors.push(`${where}: description must be a string (got ${typeof quiz.description})`);
    } else if (quiz.description.length > p.description.maxLength) {
      errors.push(`${where}: description exceeds ${p.description.maxLength} chars`);
    }
  }
  if (quiz.difficulty !== undefined && !p.difficulty.enum.includes(quiz.difficulty)) {
    errors.push(`${where}: difficulty "${quiz.difficulty}" not in ${p.difficulty.enum.join('|')}`);
  }
  if (quiz.category !== undefined && !p.category.enum.includes(quiz.category)) {
    errors.push(`${where}: category "${quiz.category}" not in ${p.category.enum.join('|')}`);
  }
  if (quiz.tags !== undefined) {
    if (!Array.isArray(quiz.tags)) errors.push(`${where}: tags must be an array`);
    else if (new Set(quiz.tags).size !== quiz.tags.length) errors.push(`${where}: tags contain duplicates`);
  }
  if (!Array.isArray(quiz.questions) || quiz.questions.length < 1) {
    errors.push(`${where}: questions must be a non-empty array`);
    return;
  }

  quiz.questions.forEach((q, i) => {
    const at = `${where} q${i + 1}`;
    if (typeof q.question !== 'string' || !q.question.trim()) {
      errors.push(`${at}: missing question text`);
    }
    if (q.answer === undefined) {
      errors.push(`${at}: missing answer`);
      return;
    }
    // Two answer forms: an index, or an array of indices for multi-select.
    // Typed answers were removed -- every question must be answerable by
    // clicking, which is what keeps these quizzes quick to take.
    const isIndex = Number.isInteger(q.answer) && q.answer >= 0;
    const isMulti = Array.isArray(q.answer);

    if (typeof q.answer === 'string') {
      errors.push(
        `${at}: typed answers are no longer supported. Give this question a "choices" array and set "answer" to the index of the correct one.`
      );
    } else if (isMulti) {
      if (q.answer.length === 0) {
        errors.push(`${at}: multi-select answer array is empty`);
      }
      if (!q.answer.every((n) => Number.isInteger(n) && n >= 0)) {
        errors.push(`${at}: every multi-select answer must be a non-negative integer`);
      }
      if (new Set(q.answer).size !== q.answer.length) {
        errors.push(`${at}: multi-select answer contains duplicate indices`);
      }
    } else if (!isIndex) {
      errors.push(
        `${at}: answer must be a non-negative integer or an array of indices (got ${JSON.stringify(q.answer)})`
      );
    }

    if (q.choices !== undefined) {
      if (!Array.isArray(q.choices) || q.choices.length < 2) {
        errors.push(`${at}: choices must be an array of at least 2`);
      } else {
        // Range-check every index, single or multi.
        const indices = isMulti ? q.answer : isIndex ? [q.answer] : [];
        for (const i of indices) {
          if (Number.isInteger(i) && i >= q.choices.length) {
            errors.push(`${at}: answer index ${i} is out of range for ${q.choices.length} choices`);
          }
        }
      }
    } else {
      // `choices` is required now -- there is no answer form without it.
      errors.push(`${at}: missing required "choices"`);
    }
  });
}

/** Rules the schema cannot express but the library holds itself to. */
function checkContent(quiz, where, filePath) {
  quiz.questions.forEach((q, i) => {
    const at = `${where} q${i + 1}`;
    stats.questions += 1;

    // Type-check before calling .trim(): a quiz with `explanation: 123` would
    // otherwise throw here and abort the run instead of reporting the problem
    // alongside everything else.
    if (q.explanation !== undefined && typeof q.explanation !== 'string') {
      errors.push(`${at}: explanation must be a string (got ${typeof q.explanation})`);
    } else if (typeof q.explanation === 'string' && q.explanation.trim()) {
      stats.explanations += 1;
    } else {
      errors.push(`${at}: no explanation. Every question in this library must explain its answer.`);
    }

    if (q.hint !== undefined && typeof q.hint !== 'string') {
      errors.push(`${at}: hint must be a string (got ${typeof q.hint})`);
    } else if (typeof q.hint === 'string' && q.hint.trim()) {
      stats.hints += 1;
    }

    if (Array.isArray(q.choices)) {
      const trimmed = q.choices.map((c) => String(c).trim());
      if (trimmed.some((c) => !c)) errors.push(`${at}: has an empty choice`);
      const lowered = trimmed.map((c) => c.toLowerCase());
      if (new Set(lowered).size !== lowered.length) {
        errors.push(`${at}: duplicate choices — the correct answer may be ambiguous`);
      }
      // A true/false question must use exactly True/False so the app detects it.
      if (lowered.length === 2 && lowered.includes('true') !== lowered.includes('false')) {
        warnings.push(`${at}: two choices but only one of True/False`);
      }
    }

    if (typeof q.explanation === 'string' && q.explanation.length > 500) {
      warnings.push(`${at}: explanation is ${q.explanation.length} chars; consider tightening`);
    }
  });

  // Answer positions must be spread out. A quiz whose correct answer sits at
  // the same index every time can be scored perfectly without reading it --
  // english-vocabulary was at index 1 for all 10 questions before this check
  // existed. Only meaningful once there are enough index-answered questions.
  const indexed = quiz.questions.filter(
    (q) => Number.isInteger(q.answer) && Array.isArray(q.choices) && q.choices.length >= 3
  );
  if (indexed.length >= 6) {
    const counts = {};
    for (const q of indexed) counts[q.answer] = (counts[q.answer] ?? 0) + 1;
    const share = Math.max(...Object.values(counts)) / indexed.length;
    if (share > 0.6) {
      errors.push(
        `${where}: ${Math.round(share * 100)}% of correct answers sit at one index ` +
          `(${JSON.stringify(counts)}) — the quiz is guessable. Run ` +
          `\`node scripts/rebalance-answers.mjs --apply\`.`
      );
    } else if (share > 0.5) {
      warnings.push(
        `${where}: ${Math.round(share * 100)}% of correct answers share an index ${JSON.stringify(counts)}`
      );
    }
  }

  // The directory a quiz lives in must match its declared category, or the
  // app's category filter and the folder layout disagree.
  const folder = relative(QUIZ_DIR, filePath).split(/[\\/]/)[0];
  if (quiz.category && folder && quiz.category !== folder) {
    errors.push(`${where}: category "${quiz.category}" but the file sits in /${folder}`);
  }

  stats.byCategory[quiz.category ?? '(none)'] = (stats.byCategory[quiz.category ?? '(none)'] ?? 0) + 1;
  stats.byDifficulty[quiz.difficulty ?? '(none)'] = (stats.byDifficulty[quiz.difficulty ?? '(none)'] ?? 0) + 1;
}

const files = walk(QUIZ_DIR).sort();
const seenTitles = new Map();

for (const file of files) {
  const where = relative(ROOT, file).replace(/\\/g, '/');
  stats.files += 1;

  let quiz;
  try {
    quiz = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${where}: invalid JSON — ${e.message}`);
    continue;
  }

  checkAgainstSchema(quiz, where);
  if (Array.isArray(quiz.questions)) checkContent(quiz, where, file);

  // Titles are how the app dedupes saved quizzes, so collisions silently
  // overwrite one another in a user's library.
  if (quiz.title) {
    if (seenTitles.has(quiz.title)) {
      errors.push(`${where}: duplicate title "${quiz.title}" (also in ${seenTitles.get(quiz.title)})`);
    } else seenTitles.set(quiz.title, where);
  }
}

console.log(`Checked ${stats.files} quizzes, ${stats.questions} questions`);
console.log(`  explanations: ${stats.explanations}/${stats.questions}`);
console.log(`  hints:        ${stats.hints}/${stats.questions}`);
console.log(`  by category:  ${JSON.stringify(stats.byCategory)}`);
console.log(`  by difficulty:${JSON.stringify(stats.byDifficulty)}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}

console.log('\nAll quizzes valid.');
