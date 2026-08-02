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

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
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
    if (quiz.questions.some((q) => Array.isArray(q.choices) && q.choices.length === 2
      && q.choices.map((c) => String(c).toLowerCase()).includes('true'))) features.push('true-false');
    if (features.length) entry.features = features;

    return entry;
  });

const byCategory = {};
for (const q of quizzes) byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;

const index = {
  $schema: `${RAW_BASE}/schemas/quiz-schema.json`,
  generated: 'run `npm run build:index` to regenerate',
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
