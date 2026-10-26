# House Edge

A story-driven heist game for the browser, in three acts of about 45 minutes in
all. The front page (`index.html`) starts the story at act one (`act1.html`, the
free demo), then sends you on to `act2.html` and `act3.html`. Each act's end
screen links to the next one, and each act carries the choices from the one
before through the browser save. The front page ticks off finished acts, points
its big button at the next one, and counts the endings you've found.

It also links the four heist-night hands-on scenes, each playable on its own:
keeping a high roller's eyes off Vince (`poker.html`), splicing Theo's camera
loops (`cameras.html`), cracking Crane's vault by ear (`vault.html`), and
navigating Dee's getaway (`getaway.html`).

## Act one

The free demo, written in [Ink](https://www.inklestudios.com/ink/) in
`src/story/act1.ink` and compiled at build time by a small plugin in
`vite.config.ts`. It opens on the mid-heist flash-forward, then cuts to three weeks
earlier: Sam Hale recruits Theo, Leo, Dee and Vince in any order, is stopped by
Detective Kessler after the second recruit, and ends on Crane's welcome from his
office window. The choices set flags for act two (see the top of `act1.ink`).

Lines are shown as comic beats: `NAME: text` is a speech bubble and anything else a
caption, while tags set the panel's place and cast, title cards and freeze-frames.
`# mood: Theo worried, Sam happy` changes faces: every character can look neutral,
happy, angry, worried, shocked or sad, and a face holds until it's changed or the
panel moves somewhere new. The playthrough tests reject a mood for anyone who isn't
in the panel.

The art is flat comic-style vector drawn in code, with no image files: a backdrop
for each of the 18 places (`src/story/art/places.ts`) and a waist-up figure for
each of the 11 characters (`src/story/art/cast.ts`), sharing the helpers in
`src/story/art/kit.ts`. Ink only names places and people, so any piece can be
redrawn without touching the story. `src/story/art/panel.ts` puts it on the page,
for the player and for the cover panels on the title and end screens (and on the
hands-on scenes' intros when they're played on their own).

The story has synthesised sound too (`src/story/audio.ts`): room tone and the odd
sound that belongs to each place, crossfaded as the panel moves, and stings for
title cards, freeze-frames and choices. It goes quiet while a hands-on scene plays,
and the Sound switch under the panel is remembered.

Progress saves in the browser after every line, with a Continue button on the
title screen. Each save records which version of the script it was made with. If
the story has changed since, a half-played act starts over (the title screen
says so), while finished acts still pass their choices on.

## Act two

`src/story/act2.ink`: three days to the gala. Each day opens with one of Crane's
moves, the consequences of Sam's leak, and the third depends on what Sam told
Kessler. Then the player spends the day's slots, seven in all: each crew secret
(Theo, Vince, Dee) takes a clue scene and a response scene, and four scouting
scenes compete for the same time. Leo's office scene is fixed on the evening of
day one. The responses set heist night's three checks (`theo_safe`,
`vince_handled`, `dee_won`), which the end screen sums up before handing over to
heist night.

Act two reads act one's flags from this browser's act one save, but only if act
one was played to the end. Without one, its title screen asks what Sam told
Kessler. All three acts share the comic player in `src/story/player.ts`.

## Act three

`src/story/act3.ink`: heist night, in the running order from the design doc. The
four hands-on scenes play inside the story. A line tagged `# minigame: <scene>`
shows a **Play** button that opens the scene full screen in an iframe
(`<scene>.html?embed=1&scouted=0|1`). When the scene ends, its **Continue**
button posts the outcome back (`src/embed.ts`), and the story reads it from
`<scene>_result`. Scouting in act two makes each scene a little easier.

The three checks from act two pick one of four endings: Name cleared, Caught,
Betrayed or Protecting Theo. The first failed check decides, and the scenes after
it still play, except that going after Theo means Crane burns the ledger before
Vince can run with it. Then come the reveal, which replays the four clues, and an
epilogue with a line for each costly hands-on result. The end screen lists the
endings found so far in this browser.

Act three reads every earlier flag from a finished act two save, since act two
holds act one's choices too. Without one, the title screen lets you set the
checks and scouting by hand (and what Sam told Kessler, unless act one is
finished).

## Vault prototype

Turn the dial and listen for the faint click at each number, then press **Set**.
There are four numbers, and each click is quieter than the last, with Leo's chatter
with the guard fading in and out over it. A wrong number makes a loud clunk and
costs Leo time with the guard. Running out of time never ends the attempt: it
changes how the job ends (clean, cutting it close, or seen).

Controls: drag or scroll the dial, ← → to nudge (Shift for 5), Space or the Set
button to set. "Show clicks on screen too" adds a visual flash and vibration for
players who can't rely on sound.

All sound is synthesised with Web Audio, so there are no asset files yet.

## Poker table prototype

Winning the hand doesn't matter. Vince is working his con at the side table
behind the high roller, and his progress bar only fills while the high roller is
looking at you. When the high roller's eyes drift toward Vince, pull him back:

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

## Getaway prototype

Dee drives a grid of city streets toward the garage in the top corner. You call
each turn before she reaches the junction: **Left**, **Straight** or **Right**,
from her seat rather than the map. The next junction and the way she'll go are
marked on the map. A call made in the last fifth of a block makes her brake
hard, which costs time and adds heat.

Patrol cars see straight along their street (the yellow band), and roadblocks
go up ahead of you after a few seconds' warning on the scanner. Being seen
raises heat, which cools slowly out of sight. The scene ends **clean**, **made**
(the police got a look at the car), or **chased** (heat maxed out and you ditched
the car). Whether Dee turns on you isn't part of the drive: in act three it
plays out in the garage afterwards.
Keys: ← ↑ → for the calls.

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # rule tests for the four scenes, plus story playthroughs
npm run build      # typecheck and build to dist/
```

- `src/lock.ts`, `src/audio.ts`, `src/main.ts`: vault rules and tuning, sounds,
  and screen
- `src/poker/table.ts`, `src/poker/audio.ts`, `src/poker/main.ts`: poker rules
  and tuning, sounds, and screen
- `src/cameras/loop.ts`, `src/cameras/audio.ts`, `src/cameras/main.ts`: camera
  loop rules and tuning, sounds, and screen
- `src/getaway/drive.ts`, `src/getaway/audio.ts`, `src/getaway/main.ts`:
  getaway rules and tuning, sounds, and map screen
- `src/story/act1.ink`, `src/story/act2.ink`, `src/story/act3.ink`: the
  scripts; `src/story/beats.ts` turns Ink lines into comic beats;
  `src/story/art/` holds the art and `src/story/audio.ts` the sound;
  `src/story/player.ts` is the comic player,
  started by `act1-main.ts`, `act2-main.ts` and `act3-main.ts`;
  `src/story/saves.ts` stores saves and the endings found, and
  `src/story/carry.ts` reads one act's choices for the next
- `src/menu.ts`: the front page's progress
- `src/embed.ts`: runs a hands-on scene inside a story page and reports back
- `src/synth.ts`: shared Web Audio helpers
- `src/style.css`: shared comic-book styling

The build uses relative paths, so `dist/` works from any static host or
subfolder.

### Deploying

`.github/workflows/deploy.yml` runs the tests and the build on every pull
request, and on every push to `Main` it also publishes `dist/` to GitHub Pages,
at https://adilisio.github.io/House-Edge/. It needs Pages turned on once: in
the repo's **Settings → Pages**, set **Source** to **GitHub Actions**. A deploy
can also be started by hand from the Actions tab.
