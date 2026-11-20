const H = 3600000;
const DAY = 24 * H;

export const CONFIG = Object.freeze({
  decayPerHour: Object.freeze({ hunger: 6, energy: 4, fun: 5, pride: 3 }),
  restGainPerHour: 8,
  floor: 10,
  awayCapHours: 12,
  smugMs: 10 * 60000,
  cooldownsMs: Object.freeze({ feed: 600000, play: 300000, nap: 1200000, groom: 600000, praise: 300000, roar: 180000 }),
  effects: Object.freeze({
    feed: { hunger: 30 },
    play: { fun: 25, energy: -15 },
    nap: { energy: 40, hunger: -5 },
    groom: { pride: 25 },
    praise: { pride: 30 },
    roar: { pride: 10, fun: 10, energy: -10 },
  }),
  bondTarget: Object.freeze({ feed: 'hunger', play: 'fun', nap: 'energy', groom: 'pride', praise: 'pride', roar: 'pride' }),
  stages: Object.freeze([
    { name: 'cub', minDays: 0, minBond: 0 },
    { name: 'teen', minDays: 2, minBond: 20 },
    { name: 'adult', minDays: 7, minBond: 60 },
    { name: 'king', minDays: 21, minBond: 120 },
  ]),
});

const clamp = (v) => Math.max(CONFIG.floor, Math.min(100, v));

export function createLion(now, name = 'Drastik') {
  return {
    name, stage: 'cub',
    needs: { hunger: 80, energy: 80, fun: 80, pride: 80 },
    bond: 0, bornAt: now, lastTick: now, cooldowns: {}, lastAction: null,
  };
}

export function advanceStage(state, now) {
  const i = CONFIG.stages.findIndex((s) => s.name === state.stage);
  const next = CONFIG.stages[i + 1];
  if (!next) return state;
  const days = (now - state.bornAt) / DAY;
  return days >= next.minDays && state.bond >= next.minBond ? { ...state, stage: next.name } : state;
}

export function awayGreeting(awayMs) {
  return awayMs < 2 * H ? 'short' : awayMs < DAY ? 'medium' : 'long';
}

export function tick(state, now, opts = {}) {
  const elapsed = now - state.lastTick;
  if (!(elapsed > 0)) return state;
  const hours = Math.min(elapsed / H, CONFIG.awayCapHours);
  const needs = {};
  for (const k of Object.keys(state.needs)) {
    let v = state.needs[k] - CONFIG.decayPerHour[k] * hours;
    if (k === 'energy' && opts.restWhileAway) v = state.needs[k] + CONFIG.restGainPerHour * hours;
    needs[k] = clamp(v);
  }
  const dip = elapsed >= DAY ? Math.min(5, Math.floor(elapsed / DAY)) : 0;
  const next = { ...state, needs, lastTick: now, bond: Math.max(0, state.bond - dip) };
  return advanceStage(next, now);
}

export function act(state, action, now) {
  const fx = CONFIG.effects[action];
  if (!fx) return { state, ok: false, reason: 'unknown' };
  if ((state.cooldowns[action] ?? 0) > now) return { state, ok: false, reason: 'cooldown' };
  const needs = { ...state.needs };
  for (const [k, d] of Object.entries(fx)) needs[k] = clamp(needs[k] + d);
  const gain = state.needs[CONFIG.bondTarget[action]] < 70 ? 2 : 0;
  const next = {
    ...state, needs,
    bond: Math.min(200, state.bond + gain),
    cooldowns: { ...state.cooldowns, [action]: now + CONFIG.cooldownsMs[action] },
    lastAction: { name: action, at: now },
  };
  return { state: advanceStage(next, now), ok: true };
}

export function mood(state, now) {
  const n = state.needs;
  const low = Object.values(n).filter((v) => v < 30).length;
  if (low >= 3) return 'furious';
  if (n.pride < 30) return 'sulking';
  if (n.hunger < 30) return 'hangry';
  if (n.energy < 30) return 'sleepy';
  const la = state.lastAction;
  if (la && (la.name === 'feed' || la.name === 'praise') && now - la.at <= CONFIG.smugMs) return 'smug';
  if (n.fun > 70 && n.energy > 60) return 'playful';
  return 'regal';
}
