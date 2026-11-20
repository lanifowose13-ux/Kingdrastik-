import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLion, tick, act, mood, CONFIG } from '../core/lion.mjs';
import { sprite } from './sprites.mjs';

const IDLE_REST_MS = 30 * 60000;
const PRAISE = /thank|nice|good job|well done/i;

function load(statePath, now) {
  try {
    const s = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (s && typeof s.name === 'string' && s.needs && typeof s.lastTick === 'number') return s;
  } catch {}
  return createLion(now);
}

function save(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  const tmp = `${statePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, statePath);
}

const bar = (v) => '▮'.repeat(Math.round(v / 25)) + '▯'.repeat(4 - Math.round(v / 25));

function promptOf(stdin) {
  try {
    const j = JSON.parse(stdin);
    return j && typeof j.prompt === 'string' ? j.prompt : '';
  } catch { return ''; }
}

export function runCli(argv, stdin, now, statePath) {
  try {
    const [cmd, arg] = argv;
    if (cmd === 'status') {
      let s = load(statePath, now);
      s = tick(s, now, { restWhileAway: now - s.lastTick > IDLE_REST_MS });
      save(statePath, s);
      const n = s.needs;
      return { stdout: `${sprite(s.stage, mood(s, now))} ${s.name} H${bar(n.hunger)} E${bar(n.energy)} F${bar(n.fun)} P${bar(n.pride)}\n`, code: 0 };
    }
    if (cmd === 'event') {
      if (arg === 'praise' && !PRAISE.test(promptOf(stdin))) return { stdout: '', code: 0 };
      let s = tick(load(statePath, now), now);
      if (arg === 'sulk') {
        s = { ...s, needs: { ...s.needs, pride: Math.max(CONFIG.floor, s.needs.pride - 8) } };
      } else if (['feed', 'praise', 'nap'].includes(arg)) {
        s = act(s, arg, now).state;
      } else return { stdout: '', code: 0 };
      save(statePath, s);
    }
    return { stdout: '', code: 0 };
  } catch {
    return { stdout: '', code: 0 };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const statePath = process.env.LION_STATE || path.join(os.homedir(), '.claude', 'lion-pet', 'state.json');
  let stdin = '';
  try { if (!process.stdin.isTTY) stdin = fs.readFileSync(0, 'utf8'); } catch {}
  const r = runCli(process.argv.slice(2), stdin, Date.now(), statePath);
  if (r.stdout) process.stdout.write(r.stdout);
  process.exit(0);
}
