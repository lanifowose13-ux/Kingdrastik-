import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'dist', 'lion-pet.html');

test('build produces a self-contained page', () => {
  execFileSync('node', [path.join(here, 'build.mjs')]);
  const html = fs.readFileSync(out, 'utf8');
  assert.ok(!html.includes('/*CORE*/'));
  assert.ok(!/^\s*import\s/m.test(html));
  assert.ok(!/^\s*export\s/m.test(html));
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!/<link[^>]+stylesheet/.test(html) || /fonts\.googleapis\.com/.test(html));
  for (const w of ['Feed', 'Play', 'Nap', 'Groom', 'Praise', 'Roar']) assert.ok(html.includes(w), w);
  assert.ok(html.includes('function tick('));
});
