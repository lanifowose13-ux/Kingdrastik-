# Lion Pet: Design

Working name: **Drastik** (a placeholder; the user can rename him).

## Intent and why
A Tamagotchi-style pet that lives inside Claude: a proud, sassy lion you feed, play with and raise from a cub to a king. The user wants a companion with real personality that needs care, in two homes that share one character:

1. **The lion** (character and rules).
2. **Home A:** a Claude artifact page (rich animation, buttons, saved state).
3. **Home B:** a Claude Code companion (terminal or status line, fed by your actual work).

Built in that order. The lion's rules are written once so both homes behave the same.

## Goals
- A character you'd miss. Sass is the product; the stats are scaffolding.
- Needs that decay over real time and that you meet with buttons (A) or by working (B).
- Visible growth: Cub, Teen, Adult, King, shaped by how consistently you care for him.
- Lines of dialogue that sound like him: Claude-written when available, a built-in fallback set when not.
- Works on a phone-width screen (A) and in a plain terminal (B).

## Non-goals (v1)
- Sound, multiplayer, monetization, accounts.
- Syncing one lion across A and B (see "Open for the user").
- Real-time ticking while the app is closed. Time passing is simulated on return.

## Anti-goals (a failure even if it works)
- The lion can **never die** or be lost permanently. Neglect makes him dramatic and sulky, never gone.
- No guilt-trip notifications, streak pressure, or nagging. He's sassy, not manipulative.
- Sass never turns genuinely cruel about the user. Roasting is affectionate, never about the user's real work quality, body, or worth.

## Personality (the voice rules)
Proud, vain, sassy; secretly devoted. He refers to himself as royalty, treats feeding as tribute, and treats you as his favourite subject.
- Happy: smug and magnanimous. "Acceptable. You may continue serving me."
- Hungry: theatrical. "I am *wasting away*. Tell my kingdom I was magnificent."
- Ignored: icy, then a sulk, then a thaw that he pretends never happened.
- Praised: pretends not to care, visibly pleased (tail flick).
- He grows more openly affectionate as Bond rises, but never drops the attitude.

## The rules (shared by both homes)
**Needs (0 to 100, decay with real time, floors at 10 so he's never "empty"):** Hunger, Energy, Fun, **Pride** (the sassy twist: needs praise, grooming and attention; low Pride = dramatic sulking).
**Bond (long-term, only goes up slowly, dips a little on long neglect):** drives growth and how affectionate his lines get.

**Moods (derived from needs, the top matching one wins):**
Regal (all healthy) · Smug (just praised or fed) · Playful (high Fun and Energy) · Hangry · Sleepy · Sulking (low Pride) · Furious (several needs low at once; the cartoonish roar).

**Actions:** Feed, Play, Nap, Groom (mane), Praise, Roar (let him roar; small Pride and Fun boost, tires him).
Each action has a cooldown so spamming doesn't beat care.

**Growth:** Cub, Teen, Adult, King. Advancement needs both elapsed days and enough Bond, so only consistent care reaches King. Each stage has its own sprite and a few new lines.

**Returning after time away:** compute decay since last visit, cap the damage, then he greets you in character ("You're late. I noticed. I did not care.").

## Constraints
- Home A is a single-page Claude artifact: self-contained HTML, mobile-first, state saved through the artifact runtime (not only browser storage), optional Ask-Claude for dialogue, with the canned set as fallback.
- Home B uses Claude Code's own extension points (status line, hooks, a mod or plugin). Pixel-art or text only. State in a local file.
- The shared rules (needs, decay, moods, growth) are plain logic with no UI, so both homes use the same code or the same documented formulas.
- Lives in a new folder (`lion-pet/`) in this repo, separate from Paper Trader.

## Approaches considered
1. **Artifact only.** Fastest, richest visuals. Rejected: doesn't deliver the "inside Claude Code" half the user asked for.
2. **Claude Code companion only.** Most literal. Rejected: terminal-only visuals undersell a character whose appeal is expression.
3. **Both homes, one shared lion.** *Chosen by the user (option C).* Cost: two builds, so staged: lion core, then A, then B.

## Decided by the user
- Tamagotchi-style care loop, with personality; a lion; proud and sassy.
- Both homes, built in the order: lion, Home A, Home B.

## My calls (change any of these)
- Name: Drastik (from the repo name).
- Four extra rules: Pride as a fourth need, never-dies, Bond-gated growth, per-action cooldowns.
- Sassy but never actually mean (the anti-goal above).
- Shared logic first, as a small standalone module, and Home A inlines it.

## Left to the builder
Exact numbers (decay rates, cooldown lengths, growth thresholds), sprite and animation craft, canned-line writing, file layout inside `lion-pet/`, how Home B's hooks map to events (suggested: tests pass or commit = Feed, long idle = Nap, failed build = Sulk, a thank-you message = Praise).

## Open for the user
- **One lion or two?** Home A and Home B live in different places, so syncing them is hard. v1 plan: two separate lions that share a character and rules. Say if you'd rather have one shared lion; that would need a small shared store and is a bigger build.
