const EYES = { regal: 'ò ᴥ ó', smug: '¬ ᴥ ¬', playful: '◕ ᴥ ◕', hangry: 'ಠ ᴥ ಠ', sleepy: '- ᴥ -', sulking: '╥ ᴥ ╥', furious: '>ᴥ<' };
const FRAME = { cub: ['(', ')'], teen: ['ᕦ(', ')ᕤ'], adult: ['=(', ')='], king: ['♛(', ')♛'] };
const TAIL = { sleepy: ' zZ', furious: ' !!', playful: ' ~', smug: ' ✧' };

export function sprite(stage, mood) {
  const [l, r] = FRAME[stage] ?? FRAME.cub;
  return `${l}${EYES[mood] ?? EYES.regal}${r}${TAIL[mood] ?? ''}`;
}
