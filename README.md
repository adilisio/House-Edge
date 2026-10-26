# House Edge

A story-driven heist game for the browser. This repo currently holds the first
prototype: cracking Crane's vault by ear.

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

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # lock logic tests
npm run build      # typecheck and build to dist/
```

- `src/lock.ts`: pure lock rules and tuning (click loudness, tolerance, timings)
- `src/audio.ts`: synthesised ticks, clicks, chatter and footsteps
- `src/main.ts`: dial drawing, input and screens
