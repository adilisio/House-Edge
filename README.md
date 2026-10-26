# House Edge

A story-driven heist game for the browser. This repo currently holds three
prototypes of heist-night hands-on moments: cracking Crane's vault by ear
(`index.html`), keeping a high roller's eyes off Vince (`poker.html`), and
splicing Theo's camera loops (`cameras.html`).

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

## Camera loop prototype

Each of three corridors shows a live feed beside Theo's recording. Their ceiling
fans spin at slightly different speeds, so the blades drift in and out of line;
press **Loop** when they match. On cameras 2 and 3 the wall light's flicker has to
match too, and on camera 3 a moth in shot spoils the cut. Then press **Go** to send
the crew, who must clear the corridor before the loop runs out (8, 6.5 and 5
seconds). From camera 2 on, the crew needs a few seconds to reach the door, so
splicing too early wastes the loop.

The scene ends **clean**, **glitched** (a bad match made the footage jump), or
**seen** (the loop ran out with the crew in shot). Keys: Space to loop, Enter to go.

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # rule tests for all three scenes
npm run build      # typecheck and build to dist/
```

- `src/lock.ts`, `src/audio.ts`, `src/main.ts`: vault rules and tuning, sounds,
  and screen
- `src/poker/table.ts`, `src/poker/audio.ts`, `src/poker/main.ts`: poker rules
  and tuning, sounds, and screen
- `src/cameras/loop.ts`, `src/cameras/audio.ts`, `src/cameras/main.ts`: camera
  loop rules and tuning, sounds, and screen
- `src/synth.ts`: shared Web Audio helpers
- `src/style.css`: shared comic-book styling
