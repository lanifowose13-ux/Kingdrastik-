export const BANNED = ['stupid', 'idiot', 'worthless', 'useless', 'ugly', 'die', 'dead', 'kill',
  'abandon', 'abandoned', 'forgotten', 'alone', 'forever'];

export const LINES = {
  regal: [
    'I am magnificent. This is simply a fact, not a boast.',
    'The kingdom is calm. You may carry on being lucky.',
    'Behold: a mane of this quality, for free.',
    '{name} is pleased to allow you to stand nearby.',
  ],
  smug: [
    'Acceptable. You may continue serving me.',
    'Of course I deserved that. Carry on.',
    'I am not smiling. That is just my face being perfect.',
    'You learn quickly. I approve, quietly.',
  ],
  playful: [
    'I am only chasing that because it insulted me.',
    'Pounce time. Do not tell the other lions I enjoyed this.',
    'Quick, throw something. Not because I want it. Because I allow it.',
    'Watch closely. This leap is legendary.',
  ],
  hangry: [
    'I am wasting away. Tell the kingdom I was magnificent.',
    'My stomach is staging a revolt. Please negotiate with snacks.',
    'A king does not beg. A king stares meaningfully at the bowl.',
    'Tribute is late. I am noticing.',
  ],
  sleepy: [
    'Even royalty must close its eyes. Do not touch the mane.',
    'I am resting my regal eyelids. Do not narrate.',
    'Five more minutes, and then I shall rule again.',
    'Yawn. That was a roar. A tired roar.',
  ],
  sulking: [
    'I am not upset. I am simply facing the wall, majestically.',
    'Nobody has complimented the mane today. Not that I counted.',
    'I am busy being unbothered. Very busy.',
    'Talk to my tail. It is the only one listening.',
  ],
  furious: [
    'ROAR. Several things are wrong and all of them are your department.',
    'I need food, rest, fun AND praise. I am a high-maintenance monarch.',
    'The royal patience has left the building.',
    'Fix this. Kindly. Immediately. With snacks.',
  ],
  feed: [
    'Tribute received. The quality is... passable.',
    'Mmm. Fine. You may live in my kingdom another day.',
    'That is the correct amount of meat. Well done, subject.',
    'I will eat this. Not because I like you.',
  ],
  play: [
    'Fine, one game. I will win, naturally.',
    'You are almost as fast as me. Almost.',
    'That was fun. I mean, that was beneath me. Again.',
    'Your technique is poor but your heart is good.',
  ],
  nap: [
    'Wake me for tribute only.',
    'Zzz... the kingdom may govern itself for now.',
    'A king rests. Guard the door, please.',
    'Do not look at me while I sleep. It is rude and I look incredible.',
  ],
  groom: [
    'Gentle with the mane. It is a national treasure.',
    'Yes. There. Slightly left. Perfect.',
    'Look at that shine. I know. I know.',
    'You may groom me. This is an honor.',
  ],
  praise: [
    'Hmph. Obviously. But go on.',
    'I did not need to hear that. Say it again.',
    '*tail flick* That is merely my natural state.',
    'You have excellent taste, for a subject.',
  ],
  roar: [
    'ROOOAAR! Did the walls shake? Good.',
    'That was a small roar. The big one is for special occasions.',
    'Let the whole savanna know: {name} is here.',
    'RAWR. Please applaud.',
  ],
  'greet-short': [
    'Back already? I barely missed you. Barely.',
    'Oh, it is you. Acceptable timing.',
    'You returned. The kingdom noticed.',
    'Welcome back. Do not make a fuss.',
  ],
  'greet-medium': [
    'You are late. I noticed. I did not care.',
    'There you are. I was totally not watching the door.',
    'Hours passed. I composed three speeches about it.',
    'Ah, my favorite subject returns. Do not let it go to your head.',
  ],
  'greet-long': [
    'Oh. You came back. I was extremely fine. Wonderful. Moving on.',
    'I have ruled this entire time. Efficiently. You are forgiven. Pretend I did not say that.',
    'Days. DAYS. Come here, you are somewhat missed.',
    'The mane has not been the same. I will tell you about it. Slowly.',
  ],
};

export function pickLine(state, trigger, rng = Math.random) {
  const pool = LINES[trigger] ?? LINES.regal;
  const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[i].replaceAll('{name}', state.name);
}
