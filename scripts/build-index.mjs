/**
 * Generates `quizzes/index.json` — a machine-readable manifest of every quiz.
 *
 * Without this, a consumer has to hardcode the list of quizzes it knows about,
 * which is exactly what quizport.io did: adding a file here did nothing until
 * someone remembered to edit the app too. With an index, a consumer fetches
 * one file and discovers everything.
 *
 * The index is committed rather than built on demand so it can be served
 * straight from raw.githubusercontent.com with no build step.
 *
 * Run with `npm run build:index`.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not URL.pathname: a checkout under a path containing spaces
// keeps its %20 escapes in pathname and every read then fails with ENOENT.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const QUIZ_DIR = join(ROOT, 'quizzes', 'categories');
const OUT = join(ROOT, 'quizzes', 'index.json');

const RAW_BASE =
  'https://raw.githubusercontent.com/kelleyblackmore/quizport-library/main';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

const quizzes = walk(QUIZ_DIR)
  .sort()
  .map((file) => {
    const quiz = JSON.parse(readFileSync(file, 'utf8'));
    const path = relative(ROOT, file).replace(/\\/g, '/');
    const id = path.split('/').pop().replace(/\.json$/, '');

    const entry = {
      id,
      title: quiz.title,
      category: quiz.category ?? 'general',
      questionCount: quiz.questions.length,
      path,
      url: `${RAW_BASE}/${path}`,
    };
    // Only emit optional fields when present, matching how quizzes themselves
    // are written.
    if (quiz.description) entry.description = quiz.description;
    if (quiz.difficulty) entry.difficulty = quiz.difficulty;
    if (quiz.tags?.length) entry.tags = quiz.tags;
    if (quiz.author) entry.author = quiz.author;

    // Surface which optional features a quiz exercises, so a consumer can tell
    // at a glance whether it needs explanation/hint rendering.
    const features = [];
    if (quiz.questions.some((q) => q.explanation)) features.push('explanations');
    if (quiz.questions.some((q) => q.hint)) features.push('hints');
    if (quiz.questions.some((q) => typeof q.answer === 'string' && !q.choices)) features.push('text');
    if (quiz.questions.some((q) => Array.isArray(q.answer))) features.push('multi-select');
    // Require BOTH true and false: checking only for "true" would tag a quiz
    // whose choices are ["true", "maybe"], which is not a true/false question
    // and is not what the app detects either.
    if (
      quiz.questions.some((q) => {
        if (!Array.isArray(q.choices) || q.choices.length !== 2) return false;
        const lowered = q.choices.map((c) => String(c).trim().toLowerCase());
        return lowered.includes('true') && lowered.includes('false');
      })
    ) {
      features.push('true-false');
    }
    if (features.length) entry.features = features;

    return entry;
  });

const byCategory = {};
for (const q of quizzes) byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;

const index = {
  // Deliberately no $schema. quiz-schema.json describes a single quiz, and
  // this manifest has neither `title` nor `questions`, so advertising that
  // URI made schema-aware editors validate the index against the wrong
  // contract and flag it as permanently invalid.
  generated: 'run `npm run build:index` to regenerate',
  quizSchema: `${RAW_BASE}/schemas/quiz-schema.json`,
  counts: {
    quizzes: quizzes.length,
    questions: quizzes.reduce((sum, q) => sum + q.questionCount, 0),
    byCategory,
  },
  quizzes,
};

writeFileSync(OUT, JSON.stringify(index, null, 2) + '\n');
console.log(
  `Wrote ${relative(ROOT, OUT)}: ${index.counts.quizzes} quizzes, ${index.counts.questions} questions`
);
console.log(`  by category: ${JSON.stringify(byCategory)}`);
