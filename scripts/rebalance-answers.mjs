/**
 * Spreads correct answers across the available choice positions.
 *
 * Why this matters: several quizzes had their correct answer parked at the
 * same index almost every time — english-vocabulary was at index 1 for all
 * 10 questions. A quiz like that can be scored 10/10 by always picking the
 * second option without reading anything, which makes it worthless as
 * practice.
 *
 * Safety: this only ever PERMUTES a question's own choices and remaps the
 * answer index to follow. After each rewrite it asserts that
 *   - the new choice list is an exact permutation of the old one, and
 *   - choices[answer] resolves to the identical string as before
 * so no question's meaning or correct answer can change. It refuses to write
 * anything if either assertion fails.
 *
 * Usage: node scripts/rebalance-answers.mjs [--apply]
 * Without --apply it reports what it would do and changes nothing.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const QUIZ_DIR = join(ROOT, 'quizzes', 'categories');
const APPLY = process.argv.includes('--apply');

/** Above this share of answers on one index, a quiz is considered gameable. */
const THRESHOLD = 0.5;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (e.endsWith('.json')) out.push(full);
  }
  return out;
}

const distribution = (questions) => {
  const counts = {};
  for (const q of questions) {
    if (Number.isInteger(q.answer)) counts[q.answer] = (counts[q.answer] ?? 0) + 1;
  }
  return counts;
};

const topShare = (questions) => {
  const counts = distribution(questions);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return total ? Math.max(...Object.values(counts)) / total : 0;
};

let changed = 0;

for (const file of walk(QUIZ_DIR).sort()) {
  const quiz = JSON.parse(readFileSync(file, 'utf8'));
  const name = basename(file, '.json');

  // Only questions with an index answer and a real choice list can be moved.
  const movable = quiz.questions.filter(
    (q) => Number.isInteger(q.answer) && Array.isArray(q.choices) && q.choices.length >= 2
  );
  if (movable.length < 4) continue;

  const before = topShare(movable);
  if (before <= THRESHOLD) continue;

  // Deal target positions round-robin so the spread is even by construction
  // rather than left to chance.
  let slot = 0;
  for (const q of quiz.questions) {
    if (!Number.isInteger(q.answer) || !Array.isArray(q.choices)) continue;
    // True/false must keep its natural order, or the app stops detecting it.
    const lowered = q.choices.map((c) => String(c).toLowerCase());
    if (lowered.length === 2 && lowered.includes('true') && lowered.includes('false')) continue;

    const correctText = q.choices[q.answer];
    const target = slot % q.choices.length;
    slot += 1;
    if (target === q.answer) continue;

    const rest = q.choices.filter((_, i) => i !== q.answer);
    const next = [...rest.slice(0, target), correctText, ...rest.slice(target)];

    // Assertions: permutation preserved, and the correct text is unchanged.
    const sortedOld = [...q.choices].sort();
    const sortedNew = [...next].sort();
    if (JSON.stringify(sortedOld) !== JSON.stringify(sortedNew)) {
      throw new Error(`${name}: choices were not a permutation — refusing to write`);
    }
    if (next[target] !== correctText) {
      throw new Error(`${name}: correct answer text drifted — refusing to write`);
    }

    q.choices = next;
    q.answer = target;
  }

  const after = topShare(quiz.questions.filter((q) => Number.isInteger(q.answer)));
  console.log(
    `${name.padEnd(24)} ${(before * 100).toFixed(0)}% -> ${(after * 100).toFixed(0)}%  ${JSON.stringify(distribution(quiz.questions))}`
  );

  if (APPLY) {
    writeFileSync(file, JSON.stringify(quiz, null, 2) + '\n');
    changed += 1;
  }
}

console.log(
  APPLY ? `\nRewrote ${changed} quiz(zes).` : '\nDry run — pass --apply to write these changes.'
);
