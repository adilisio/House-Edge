import "../style.css";
import "./poker.css";
import { scouted, wireEndButton } from "../embed";
import { PokerAudio } from "./audio";
import { CHARACTERS } from "../story/art";
import { DEFAULT_TABLE, Table, type Move, type PokerOutcome, type TableEvent } from "./table";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const screens = { intro: $("#intro"), play: $("#play"), end: $("#end") };
const scene = $("#scene");
const roller = $<SVGSVGElement>("#roller");
const bubble = $("#bubble");
const watch = $("#watch");
const conFill = $("#con-fill");
const susFill = $("#sus-fill");
const starePad = $("#stare-pad");
const chip = $("#chip");
const moveButtons = [...document.querySelectorAll<HTMLButtonElement>("button.move")];

const STARE_SECONDS = 1.6;
const RING_RADIUS = 34; // px the chip can stray before it shows
const SHAKY_SHARE = 0.3; // share of the stare spent outside the ring that counts as a tell

const TALK_LINES = [
  "YOU: Funny, I had you down as a slots man.",
  "YOU: My grandmother bet like that. She lost too.",
  "YOU: Nice watch. Real, or did you win it here?",
  "YOU: Tell me, do you always sweat on the river?",
  "YOU: I've been to tables like this in Monaco. Bigger.",
];
const RAISE_LINES = ["ROLLER: Bold. I like bold.", "ROLLER: Now we're playing.", "ROLLER: Ha! Big spender."];
const SUSPICIOUS_LINES = ["ROLLER: What's your game, friend?", "ROLLER: Nobody bets like that on a hand like yours."];

const ENDINGS: Record<PokerOutcome, { title: string; text: string }> = {
  clean: {
    title: "Clean",
    text: "Vince finishes and drifts away from the side table. The high roller never once looked his way.",
  },
  spotted: {
    title: "Spotted",
    text: "Vince finishes, but the high roller got a good look at him. He'll know that face if he sees it again tonight.",
  },
  walked: {
    title: "Walked",
    text: "\"I don't like this table.\" The high roller cashes out and leaves before Vince is done. Vince gets only part of it.",
  },
};

let table: Table;
let audio: PokerAudio | null = null;
let running = false;
let lastFrame = 0;
let talkIndex = 0;
let raiseIndex = 0;
let bubbleUntil = 0;

interface Stare {
  elapsed: number;
  outside: number;
  phase: [number, number, number, number];
  /** Pointer stares follow the finger; keyboard stares follow the arrow keys. */
  pointer: { id: number; startX: number; startY: number; x: number; y: number } | null;
  keys: { x: number; y: number };
}
let stare: Stare | null = null;
const heldKeys = new Set<string>();

// ---- Drawing ------------------------------------------------------------

roller.innerHTML = `
  <rect class="felt" width="300" height="210"/>
  <path class="felt-line" d="M -10 196 Q 150 160 310 196"/>
  <path class="suit ink" d="M 30 214 Q 40 168 92 160 L 148 160 Q 200 168 210 214 Z"/>
  <path class="shirt ink" d="M 100 160 L 120 196 L 140 160 Z"/>
  <path class="chain" d="M 104 162 Q 120 190 136 162"/>
  <path class="ink" d="M 100 160 L 92 200 M 140 160 L 148 200" fill="none"/>
  <ellipse class="skin ink" cx="120" cy="100" rx="56" ry="64"/>
  <path class="hair ink" d="M 64 92 Q 60 34 120 32 Q 182 34 176 92 Q 168 56 120 54 Q 74 56 64 92 Z"/>
  <ellipse class="white ink" id="eye-l" cx="98" cy="94" rx="14" ry="10"/>
  <ellipse class="white ink" id="eye-r" cx="142" cy="94" rx="14" ry="10"/>
  <circle class="pupil" id="pupil-l" cx="98" cy="94" r="6"/>
  <circle class="pupil" id="pupil-r" cx="142" cy="94" r="6"/>
  <path class="ink" id="brow-l" d="M 84 76 L 112 74" fill="none" stroke-width="5"/>
  <path class="ink" id="brow-r" d="M 128 74 L 156 76" fill="none" stroke-width="5"/>
  <path class="ink" d="M 116 104 Q 120 118 126 112" fill="none"/>
  <path class="ink" id="mouth" d="M 102 134 Q 120 142 140 132" fill="none"/>
  <rect class="cigar ink" x="136" y="128" width="34" height="9" rx="3" transform="rotate(-12 136 132)"/>
  <ellipse class="gold ink" cx="56" cy="190" rx="20" ry="7"/>
  <ellipse class="gold ink" cx="56" cy="182" rx="20" ry="7"/>
  <ellipse class="gold ink" cx="56" cy="174" rx="20" ry="7"/>
  <rect class="inset ink" x="222" y="12" width="68" height="94"/>
  <svg x="224" y="14" width="64" height="76" viewBox="0 0 120 182" preserveAspectRatio="xMidYMax meet">${CHARACTERS.Vince.svg}</svg>
  <text class="label" x="256" y="102" text-anchor="middle">VINCE</text>
  <text class="freeze" id="freeze" x="256" y="27" text-anchor="middle" visibility="hidden">FREEZE!</text>
`;

const pupils = [$("#pupil-l"), $("#pupil-r")];
const eyes = [$("#eye-l"), $("#eye-r")];
const brows = [$("#brow-l"), $("#brow-r")];
const freeze = $("#freeze");

function render(): void {
  // His eyes slide right, toward Vince's table, as his gaze drifts.
  const gx = table.gaze * 9;
  pupils[0].setAttribute("cx", String(98 + gx));
  pupils[1].setAttribute("cx", String(142 + gx));
  // Suspicion narrows his eyes and pulls his brows down.
  const s = table.suspicion;
  for (const e of eyes) e.setAttribute("ry", String(10 - s * 5));
  brows[0].setAttribute("transform", `rotate(${s * 16} 98 75)`);
  brows[1].setAttribute("transform", `rotate(${-s * 16} 142 75)`);
  freeze.setAttribute("visibility", table.lookingAtVince ? "visible" : "hidden");
  scene.classList.toggle("drifting", table.isDrifting && !table.lookingAtVince);
  scene.classList.toggle("looking", table.lookingAtVince);
  watch.hidden = !table.lookingAtVince;
  conFill.style.width = `${table.progress * 100}%`;
  susFill.style.width = `${table.suspicion * 100}%`;
  const can = table.canMove();
  for (const b of moveButtons) b.disabled = !can && !(stare && b.dataset.move === "stare");
}

function say(text: string, seconds = 2.5): void {
  bubble.textContent = text;
  bubbleUntil = table.elapsed + seconds;
}

// ---- Moves --------------------------------------------------------------

function play(move: Move): void {
  if (!running || !table.canMove()) return;
  if (move === "stare") return; // stares start from a press, see beginStare
  handle(table.play(move));
}

function beginStare(pointer: Stare["pointer"]): void {
  if (!running || !table.canMove()) return;
  table.play("stare");
  const r = () => Math.random() * Math.PI * 2;
  stare = { elapsed: 0, outside: 0, phase: [r(), r(), r(), r()], pointer, keys: { x: 0, y: 0 } };
  starePad.hidden = false;
  moveButtons.find((b) => b.dataset.move === "stare")?.classList.add("active");
  audio?.setHeartbeat(true);
  say("YOU: ...", STARE_SECONDS);
}

function endStare(released: boolean): void {
  if (!stare) return;
  const steady = !released && stare.outside / STARE_SECONDS < SHAKY_SHARE;
  stare = null;
  starePad.hidden = true;
  moveButtons.find((b) => b.dataset.move === "stare")?.classList.remove("active");
  audio?.setHeartbeat(false);
  handle(table.endStare(steady));
  if (steady) say("ROLLER: ...Alright. Alright.");
}

/** The tremor pulls the chip around; your correction pulls it back. */
function updateStare(dt: number): void {
  if (!stare) return;
  stare.elapsed += dt;
  const t = stare.elapsed;
  const [a, b, c, d] = stare.phase;
  const amp = RING_RADIUS * 1.5 * Math.min(1, t / 0.9);
  const tx = amp * (0.65 * Math.sin(t * 4.1 + a) + 0.35 * Math.sin(t * 7.3 + b));
  const ty = amp * (0.65 * Math.sin(t * 3.6 + c) + 0.35 * Math.sin(t * 6.7 + d));
  const speed = 140 * dt;
  if (heldKeys.has("ArrowLeft")) stare.keys.x -= speed;
  if (heldKeys.has("ArrowRight")) stare.keys.x += speed;
  if (heldKeys.has("ArrowUp")) stare.keys.y -= speed;
  if (heldKeys.has("ArrowDown")) stare.keys.y += speed;
  const p = stare.pointer;
  const cx = p ? p.x - p.startX : stare.keys.x;
  const cy = p ? p.y - p.startY : stare.keys.y;
  const x = tx + cx;
  const y = ty + cy;
  const out = Math.hypot(x, y) > RING_RADIUS;
  if (out) stare.outside += dt;
  chip.style.transform = `translate(${x}px, ${y}px)`;
  chip.classList.toggle("out", out);
  if (t >= STARE_SECONDS) endStare(false);
}

for (const b of moveButtons) {
  const move = b.dataset.move as Move;
  if (move === "stare") {
    b.addEventListener("pointerdown", (e) => {
      b.setPointerCapture(e.pointerId);
      beginStare({ id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY });
    });
    b.addEventListener("pointermove", (e) => {
      if (stare?.pointer?.id === e.pointerId) {
        stare.pointer.x = e.clientX;
        stare.pointer.y = e.clientY;
      }
    });
    const release = (e: PointerEvent) => {
      if (stare?.pointer?.id === e.pointerId) endStare(true);
    };
    b.addEventListener("pointerup", release);
    b.addEventListener("pointercancel", release);
  } else {
    b.addEventListener("click", () => play(move));
  }
}

const KEY_MOVES: Record<string, Move> = { "1": "raise", "2": "talk", "3": "stare", "4": "check" };

window.addEventListener("keydown", (e) => {
  if (!running) return;
  if (e.key.startsWith("Arrow")) {
    heldKeys.add(e.key);
    e.preventDefault();
    return;
  }
  const move = KEY_MOVES[e.key];
  if (!move || e.repeat) return;
  if (move === "stare") beginStare(null);
  else play(move);
});
window.addEventListener("keyup", (e) => heldKeys.delete(e.key));

// ---- Events -------------------------------------------------------------

function handle(events: TableEvent[]): void {
  for (const ev of events) {
    switch (ev.kind) {
      case "drift-start":
        // The tell Sam learned while scouting.
        if (scouted) say("He twists the ring on his little finger...", 1.5);
        break;
      case "looking-at-vince":
        audio?.sting();
        say("ROLLER: Hey... what's that fella doing over there?");
        break;
      case "move":
        if (ev.move === "raise") {
          audio?.chips(6);
          say(table.suspicion > 0.6 ? pick(SUSPICIOUS_LINES) : RAISE_LINES[raiseIndex++ % RAISE_LINES.length]);
        } else if (ev.move === "talk") {
          audio?.chips(1);
          say(TALK_LINES[talkIndex++ % TALK_LINES.length]);
        } else if (ev.move === "check") {
          audio?.knock();
          say("YOU: Check.");
        }
        if (ev.repeated && ev.move !== "stare") say("ROLLER: Again? You're a one-trick pony, huh.");
        break;
      case "tell":
        audio?.tell();
        say("ROLLER: Your hand's shaking, friend.");
        break;
      case "done":
        finish(ev.outcome);
        break;
    }
  }
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// ---- Loop and flow ------------------------------------------------------

function frame(now: number): void {
  if (!running) return;
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  updateStare(dt);
  if (running) handle(table.update(dt));
  if (!running) return;
  if (table.elapsed > bubbleUntil) bubble.textContent = "";
  render();
  requestAnimationFrame(frame);
}

function show(name: keyof typeof screens): void {
  for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
}

async function begin(): Promise<void> {
  // Scouted in act two: Sam knows his ring tell, so his drift gives more warning.
  table = new Table(scouted ? { ...DEFAULT_TABLE, driftSeconds: [1.9, 1.3] } : DEFAULT_TABLE);
  stare = null;
  starePad.hidden = true;
  bubble.textContent = "";
  bubbleUntil = 0;
  render();
  show("play");
  audio?.stop();
  audio = new PokerAudio();
  await audio.start();
  say("ROLLER: Sit down, sit down. Let's see what you've got.");
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function finish(outcome: PokerOutcome): void {
  running = false;
  stare = null;
  starePad.hidden = true;
  render();
  const ending = ENDINGS[outcome];
  $("#end-title").textContent = ending.title;
  $("#end-text").textContent = ending.text;
  $("#end-stats").textContent =
    `Time ${table.elapsed.toFixed(1)}s · he watched Vince for ${table.exposure.toFixed(1)}s · ` +
    `con ${Math.round(table.progress * 100)}% done`;
  window.setTimeout(() => {
    if (!running) {
      audio?.stop();
      audio = null;
    }
  }, 1500);
  window.setTimeout(() => show("end"), 900);
}

$("#start").addEventListener("click", () => void begin());
wireEndButton($<HTMLButtonElement>("#retry"), "poker", () => table.finished ?? table.outcome(), () => void begin());
