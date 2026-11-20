import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCli } from './cli.mjs';
import { sprite } from './sprites.mjs';

const T0 = 1_700_000_000_000;
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lion-')), 'state.json');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

test('event feed creates state and raises hunger', () => {
  const p = tmp();
  fs.writeFileSync(p, '');
  const r = runCli(['event', 'feed'], '', T0, p);
  assert.equal(r.code, 0);
  assert.ok(read(p).needs.hunger >= 80);
  assert.equal(read(p).lastAction.name, 'feed');
});

for (const [label, content] of [['missing', null], ['empty', ''], ['corrupt', '{nope']]) {
  test(`${label} state file gives a fresh lion`, () => {
    const p = tmp();
    if (content !== null) fs.writeFileSync(p, content);
    const r = runCli(['status'], '', T0, p);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes('Drastik'));
  });
}

test('garbage or empty stdin exits 0 silently', () => {
  for (const input of ['', 'not json', '{"prompt": 5}', '[]']) {
    const r = runCli(['event', 'praise'], input, T0, tmp());
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
  }
});

test('praise only counts for thankful prompts', () => {
  const p = tmp();
  runCli(['event', 'praise'], '{"prompt":"fix the bug"}', T0, p);
  assert.ok(!fs.existsSync(p) || read(p).lastAction === null);
  runCli(['event', 'praise'], '{"prompt":"thanks, nice work"}', T0, p);
  assert.equal(read(p).lastAction.name, 'praise');
});

test('sulk lowers pride but not below the floor', () => {
  const p = tmp();
  runCli(['event', 'sulk'], '', T0, p);
  assert.equal(read(p).needs.pride, 72);
  for (let i = 0; i < 20; i++) runCli(['event', 'sulk'], '', T0, p);
  assert.equal(read(p).needs.pride, 10);
});

test('status is one line; idle over 30 minutes rests the lion', () => {
  const p = tmp();
  runCli(['event', 'sulk'], '', T0, p);
  const r = runCli(['status'], '', T0 + 3 * 3600000, p);
  assert.equal(r.stdout.trim().split('\n').length, 1);
  assert.ok(read(p).needs.energy >= 80);
});

test('unknown subcommand exits 0 silently', () => {
  const r = runCli(['wat'], '', T0, tmp());
  assert.deepEqual(r, { stdout: '', code: 0 });
});

test('sprites fit a status line for every stage and mood', () => {
  for (const st of ['cub', 'teen', 'adult', 'king'])
    for (const m of ['regal', 'smug', 'playful', 'hangry', 'sleepy', 'sulking', 'furious']) {
      const s = sprite(st, m);
      assert.ok(s.length > 0 && s.length <= 40 && !s.includes('\n'), `${st}/${m}`);
    }
});
