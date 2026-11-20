import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import { createLion, tick, act, mood } from './lion.mjs'
import { pickLine } from './lines.mjs'

const PANE = 'drastik'
// Shared with the status line and hooks (they set LION_STATE to this file).
const STATE = '.claude/lion-pet-state.json'
const ACTIONS = [['feed', 'Feed'], ['play', 'Play'], ['groom', 'Groom'], ['praise', 'Praise'], ['nap', 'Nap'], ['roar', 'Roar']] as const
const MOOD_LIGHT: Record<string, string> = {
  regal: '#ffe3a3', smug: '#ffd166', playful: '#a8f0ff', hangry: '#ffb27a',
  sleepy: '#9fb4ff', sulking: '#c9b8ff', furious: '#ff5a4a',
}
const SAYS: Record<string, string> = {
  regal: 'She is surveying her kingdom.', smug: 'She is insufferably pleased with herself.',
  playful: 'She wants to pounce on something.', hangry: 'She is hungry, and dramatic about it.',
  sleepy: 'She is fighting a yawn.', sulking: 'She is sulking, magnificently.', furious: 'She is roaring at everything.',
}

const rev = atom({ plugin: 'drastik', key: 'rev' } as const, 0)
const line = atom({ plugin: 'drastik', key: 'line' } as const, '')

type Raster = { columns: number; rows: number; fps: number; frames: string[] }
let raster: Raster | null = null
let webp = ''
let frameNo = 0

async function loadLion($: any, now: number) {
  try {
    const s = JSON.parse(await $.fs.read(STATE))
    if (s && s.needs && typeof s.lastTick === 'number' && typeof s.name === 'string') return tick(s, now)
  } catch {}
  return createLion(now)
}

function bar(v: number) {
  const n = Math.round(v / 10)
  return '█'.repeat(n) + '░'.repeat(10 - n)
}

function svg(m: string) {
  const light = MOOD_LIGHT[m] ?? MOOD_LIGHT.regal
  const fast = m === 'furious' ? 1.2 : m === 'playful' ? 2 : m === 'sleepy' ? 6 : 4
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400" width="400" height="400">
<defs>
<radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="halo" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="${light}" stop-opacity=".28"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
<linearGradient id="sweep" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="${light}" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<image id="lion" width="400" height="367" href="data:image/webp;base64,${webp}" xlink:href="data:image/webp;base64,${webp}"/>
<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" style="mask-type:alpha"><use href="#lion" xlink:href="#lion" y="20"/></mask>
</defs>
<circle cx="200" cy="210" r="200" fill="url(#halo)"/>
<ellipse cx="200" cy="384" rx="170" ry="14" fill="url(#sh)"><animate attributeName="rx" values="170;160;170" dur="${fast}s" repeatCount="indefinite"/></ellipse>
<g>
<animateTransform attributeName="transform" type="matrix" values="1 0 0 1 0 0;1 0 -0.03 1.018 11.5 -7;1 0 0 1 0 0;1 0 0.03 1.018 -11.5 -7;1 0 0 1 0 0" dur="${fast * 2}s" repeatCount="indefinite"/>
<use href="#lion" xlink:href="#lion" y="20"/>
<g mask="url(#m)"><rect x="-160" y="0" width="160" height="400" fill="url(#sweep)" style="mix-blend-mode:screen"><animate attributeName="x" values="-160;400" dur="${fast}s" repeatCount="indefinite"/></rect></g>
</g>
</svg>`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'lion', description: 'Open Drastik the lion in a pane' })
    try { raster = JSON.parse(await $.fs.read(`${$.plugin.root}/assets/raster.json`)) } catch { raster = null }
    try { webp = (await $.fs.read(`${$.plugin.root}/assets/lion.webp.b64`)).trim() } catch { webp = '' }
    if (raster) {
      $.clock.every(Math.round(1000 / raster.fps), () => {
        if (!raster) return
        frameNo = (frameNo + 1) % raster.frames.length
        void $.ui.blit({ requestId: PANE, key: 'lion', cells: raster.frames[frameNo] ?? '' }).catch(() => {})
      })
    }
    $.clock.every(30000, () => { void update($, rev, n => (n ?? 0) + 1) })
    void $.ui.open({ id: PANE, title: 'Drastik' })
    return next(e)
  })

  on('command.run', { command: 'lion' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Drastik' })
    return { text: 'Drastik is in her pane.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as any
    const { Box, Text, Button } = ui
    await read($, rev)
    const said = await read($, line)
    const now = await $.clock.now()
    const lion = await loadLion($, now)
    const m = mood(lion, now)

    const doAction = (a: string) => async () => {
      const t = await $.clock.now()
      const r = act(await loadLion($, t), a, t)
      if (r.ok) {
        try { await $.fs.write(STATE, JSON.stringify(r.state)) } catch {}
        await update($, line, () => pickLine(r.state, a))
      } else {
        await update($, line, () => (r.reason === 'cooldown' ? 'Patience. Royalty does not rush.' : ''))
      }
      await update($, rev, n => (n ?? 0) + 1)
    }

    const art = e.surface === 'terminal'
      ? (raster
        ? <ui.Raster key="lion" columns={raster.columns} rows={raster.rows} cells={raster.frames[frameNo]} />
        : <Text dimColor>(lion art missing: run tools/build_assets.py)</Text>)
      : (ui.Svg && webp
        ? <ui.Svg source={svg(m)} alt={`Drastik, a sculpted lion, ${m}`} width={320} height={320} />
        : <Text dimColor>Drastik the lion</Text>)

    return (
      <Box flexDirection="column" gap={1}>
        {art}
        <Text bold>{lion.name} · {lion.stage} · {m}</Text>
        <Text dimColor>{SAYS[m]}</Text>
        <Text>“{said || pickLine(lion, m, () => 0)}”</Text>
        <Box flexDirection="column">
          <Text>Hunger {bar(lion.needs.hunger)}</Text>
          <Text>Energy {bar(lion.needs.energy)}</Text>
          <Text>Fun    {bar(lion.needs.fun)}</Text>
          <Text>Pride  {bar(lion.needs.pride)}</Text>
          <Text dimColor>Bond {lion.bond}/200</Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          {ACTIONS.map(([a, label]) => {
            const left = Math.max(0, (lion.cooldowns[a] ?? 0) - now)
            return <Button key={`b-${a}`} label={left > 0 ? `${label} ${Math.ceil(left / 60000)}m` : label} dimColor={left > 0} onPress={doAction(a)} />
          })}
        </Box>
      </Box>
    )
  })
}
