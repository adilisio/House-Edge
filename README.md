# House Edge

A story-driven heist game for the browser. This repo currently holds two
prototypes of heist-night hands-on moments: cracking Crane's vault by ear
(`index.html`) and keeping a high roller's eyes off Vince (`poker.html`).

## Vault prototype

Turn the dial and listen for the faint click at each number, then press **Set**.
There are four numbers, and each click is quieter than the last, with Leo's chatter
from the bar fading in and out over it. A wrong number makes a loud clunk and
costs Leo time with the guard. Running out of time never ends the attempt: it
changes how the job ends (clean, cutting it close, or seen).

Controls: drag or scroll the dial, ← → to nudge (Shift for 5), Space or the Set
button to set. "Show clicks on screen too" adds a visual flash and vibration for
players who can't rely on sound.

All sound is synthesised with Web Audio, so there are no asset files yet.

## Poker table prototype

Winning the hand doesn't matter. Vince is working his con at the next table, and
his progress bar only fills while the high roller is looking at you. When the high
roller's eyes drift toward Vince, pull him back:

- **Raise:** a big pull, but a lot of suspicion.
- **Table talk:** a lighter pull, a little suspicion.
- **Stare him down:** press and hold, and keep the chip in the ring against a
  tremor. If your hand shakes, he sees it as a tell.
- **Check:** suspicion cools, but nothing stops his gaze drifting.

Repeating a move adds extra suspicion. The scene ends **clean** (he never got a
look at Vince), **spotted** (he looked long enough to remember Vince), or
**walked** (suspicion maxed out and he left before Vince finished).

Keys: 1–4 for the moves, arrow keys to steady the chip during a stare.

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # vault and poker rule tests
npm run build      # typecheck and build to dist/
```

- `src/lock.ts`, `src/audio.ts`, `src/main.ts`: vault rules and tuning, sounds,
  and screen
- `src/poker/table.ts`, `src/poker/audio.ts`, `src/poker/main.ts`: poker rules
  and tuning, sounds, and screen
- `src/synth.ts`: shared Web Audio helpers
- `src/style.css`: shared comic-book styling
