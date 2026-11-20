import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, createLion, tick, act, mood, advanceStage, awayGreeting } from './lion.mjs';

const H = 3600000;
const T0 = 1_000_000_000_000;
const withNeeds = (s, n) => ({ ...s, needs: { ...s.needs, ...n } });

test('createLion defaults', () => {
  const s = createLion(T0);
  assert.equal(s.name, 'Drastik');
  assert.equal(s.stage, 'cub');
  assert.deepEqual(s.needs, { hunger: 80, energy: 80, fun: 80, pride: 80 });
  assert.equal(s.bond, 0);
  assert.equal(createLion(T0, 'Leo').name, 'Leo');
});

test('tick decays 2h', () => {
  const s = tick(createLion(T0), T0 + 2 * H);
  assert.equal(s.needs.hunger, 68);
});

test('tick with clock going backwards changes nothing', () => {
  const s = createLion(T0);
  assert.deepEqual(tick(s, T0 - 5 * H), s);
});

test('away decay is capped at 12h and never below the floor', () => {
  const s = tick(createLion(T0), T0 + 1000 * H);
  assert.deepEqual(s.needs, { hunger: 10, energy: 32, fun: 20, pride: 44 });
});

test('restWhileAway raises energy, still drops hunger', () => {
  const s = tick(createLion(T0), T0 + 3 * H, { restWhileAway: true });
  assert.ok(s.needs.energy > 80 - 1 || s.needs.energy === 100);
  assert.equal(s.needs.hunger, 62);
  const low = tick(withNeeds(createLion(T0), { energy: 20 }), T0 + 3 * H, { restWhileAway: true });
  assert.ok(low.needs.energy > 20);
});

test('feed adds 30 and sets cooldown, second feed blocked', () => {
  const s = withNeeds(createLion(T0), { hunger: 40 });
  const r = act(s, 'feed', T0);
  assert.equal(r.ok, true);
  assert.equal(r.state.needs.hunger, 70);
  assert.equal(r.state.cooldowns.feed, T0 + 600000);
  const r2 = act(r.state, 'feed', T0 + 1000);
  assert.equal(r2.ok, false);
  assert.equal(r2.reason, 'cooldown');
  assert.deepEqual(r2.state, r.state);
});

test('action effects and clamping', () => {
  const s = withNeeds(createLion(T0), { hunger: 50, energy: 50, fun: 50, pride: 50 });
  assert.equal(act(s, 'play', T0).state.needs.fun, 75);
  assert.equal(act(s, 'play', T0).state.needs.energy, 35);
  assert.equal(act(s, 'nap', T0).state.needs.energy, 90);
  assert.equal(act(s, 'nap', T0).state.needs.hunger, 45);
  assert.equal(act(s, 'groom', T0).state.needs.pride, 75);
  assert.equal(act(s, 'praise', T0).state.needs.pride, 80);
  const r = act(s, 'roar', T0).state.needs;
  assert.deepEqual([r.pride, r.fun, r.energy], [60, 60, 40]);
  assert.equal(act(createLion(T0), 'feed', T0).state.needs.hunger, 100);
  assert.equal(act(s, 'dance', T0).reason, 'unknown');
});

test('bond rises only when the target need was below 70', () => {
  const low = act(withNeeds(createLion(T0), { hunger: 40 }), 'feed', T0).state;
  assert.equal(low.bond, 2);
  assert.equal(act(createLion(T0), 'feed', T0).state.bond, 0);
});

test('mood priority', () => {
  const b = createLion(T0);
  assert.equal(mood(withNeeds(b, { hunger: 20, energy: 20, fun: 20 }), T0), 'furious');
  assert.equal(mood(withNeeds(b, { pride: 20 }), T0), 'sulking');
  assert.equal(mood(withNeeds(b, { hunger: 20 }), T0), 'hangry');
  assert.equal(mood(withNeeds(b, { energy: 20 }), T0), 'sleepy');
  const fed = act(withNeeds(b, { hunger: 50 }), 'feed', T0).state;
  assert.equal(mood(fed, T0 + 60000), 'smug');
  assert.equal(mood(withNeeds(b, { fun: 90, energy: 90 }), T0), 'playful');
  assert.equal(mood(withNeeds(b, { fun: 60, energy: 60 }), T0), 'regal');
});

const DAY = 24 * H;
test('stage advances one step per call and needs bond + days', () => {
  const s0 = createLion(T0);
  assert.equal(advanceStage({ ...s0, bond: 25 }, T0 + 3 * DAY).stage, 'teen');
  assert.equal(advanceStage({ ...s0, bond: 10 }, T0 + 3 * DAY).stage, 'cub');
  let s = { ...s0, bond: 200 };
  const now = T0 + 30 * DAY;
  s = advanceStage(s, now); assert.equal(s.stage, 'teen');
  s = advanceStage(s, now); assert.equal(s.stage, 'adult');
  s = advanceStage(s, now); assert.equal(s.stage, 'king');
  assert.equal(advanceStage({ ...s, bond: 0 }, now).stage, 'king');
});

test('awayGreeting boundaries', () => {
  assert.equal(awayGreeting(2 * H - 1), 'short');
  assert.equal(awayGreeting(2 * H), 'medium');
  assert.equal(awayGreeting(24 * H - 1), 'medium');
  assert.equal(awayGreeting(24 * H), 'long');
});

test('100 days away stays sane', () => {
  const s = tick({ ...createLion(T0), bond: 3 }, T0 + 100 * DAY);
  for (const v of Object.values(s.needs)) assert.ok(v >= 10);
  assert.ok(s.bond >= 0);
  assert.ok(['cub', 'teen', 'adult', 'king'].includes(s.stage));
});

test('CONFIG is frozen', () => assert.ok(Object.isFrozen(CONFIG)));
