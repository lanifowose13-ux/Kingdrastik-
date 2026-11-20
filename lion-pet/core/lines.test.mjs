import test from 'node:test';
import assert from 'node:assert/strict';
import { LINES, BANNED, pickLine } from './lines.mjs';
import { createLion } from './lion.mjs';

const triggers = ['regal','smug','playful','hangry','sleepy','sulking','furious',
  'feed','play','nap','groom','praise','roar','greet-short','greet-medium','greet-long'];

test('every trigger has at least 4 lines', () => {
  for (const t of triggers) assert.ok((LINES[t] ?? []).length >= 4, t);
});
test('pickLine fills the name and is deterministic with rng', () => {
  const s = createLion(0, 'Leo');
  const a = pickLine(s, 'regal', () => 0);
  assert.equal(a, LINES.regal[0].replaceAll('{name}', 'Leo'));
  assert.ok(!a.includes('{name}'));
});
test('unknown trigger falls back to regal', () => {
  assert.ok(LINES.regal.map((l) => l.replaceAll('{name}', 'Drastik')).includes(pickLine(createLion(0), 'zzz', () => 0)));
});
test('voice guard: no cruel or guilt words', () => {
  for (const [t, ls] of Object.entries(LINES)) for (const l of ls) {
    for (const w of BANNED) assert.ok(!new RegExp(`\\b${w}\\b`, 'i').test(l), `${t}: "${l}" has ${w}`);
  }
});
