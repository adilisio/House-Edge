import "./style.css";
import { VaultAudio } from "./audio";
import { Lock, defaultConfig, randomCombination, type LockEvent, type Outcome } from "./lock";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEG_PER_STEP = 3.6;

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const screens = { intro: $("#intro"), play: $("#play"), end: $("#end") };
const dial = $<SVGSVGElement>("#dial");
const bubble = $("#bubble");
const stallFill = $("#stall-fill");
const stallLabel = $("#stall-label");
const tumblersEl = $("#tumblers");
const assistBox = $<HTMLInputElement>("#assist");

// Leo's half of the conversation; the player only catches fragments.
const LEO_LINES = [
  "…so the dealer says, \"Sir, that's not a chip, that's a coaster.\"",
  "You ever been to Reno? Don't.",
  "No, no, the trick is you never split tens.",
  "My dad used to work this floor, you know.",
  "Is that a new watch? Let me see that.",
];
const LEO_URGENT_LINES = [
  "Wait, have I told you about my boat?",
  "One more story, I swear, it's a good one!",
  "Hey, hey, where are you going? Sit down!",
];
const GUARD_LINES = ["GUARD: Hang on. Did you hear that?", "GUARD: I'm going to check the back."];

const ENDINGS: Record<Outcome, { title: string; text: string }> = {
  clean: {
    title: "Clean",
    text: "The last tumbler drops and the door swings open. Leo is still telling the guard about his boat. Nobody saw a thing.",
  },
  partial: {
    title: "Cutting it close",
    text: "The door swings open as the guard starts back. You grab what you can carry in seconds and leave the rest behind.",
  },
  noticed: {
    title: "Seen",
    text: "You get the door open, but the guard saw light under the vault door. He'll remember that later tonight.",
  },
};

let lock: Lock;
let audio: VaultAudio | null = null;
let unwrapped = 0; // total dial travel in steps, not wrapped, for smooth display
let fraction = 0; // drag travel not yet turned into a whole step
let lastFrame = 0;
let nextLine = 0;
let lineIndex = 0;
let running = false;

// ---- Dial drawing -------------------------------------------------------

const rotor = document.createElementNS(SVG_NS, "g");
const flash = document.createElementNS(SVG_NS, "circle");

function el(name: string, attrs: Record<string, string | number>, parent: Element): SVGElement {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent.appendChild(node);
  return node;
}

function buildDial(): void {
  el("circle", { class: "rim", r: 104 }, dial);
  dial.appendChild(rotor);
  el("circle", { class: "face", r: 94 }, rotor);
  for (let n = 0; n < 100; n++) {
    const a = (n * DEG_PER_STEP * Math.PI) / 180;
    const major = n % 5 === 0;
    const r1 = 92;
    const r2 = major ? 80 : 86;
    el(
      "line",
      {
        class: major ? "tick major" : "tick",
        x1: Math.sin(a) * r1,
        y1: -Math.cos(a) * r1,
        x2: Math.sin(a) * r2,
        y2: -Math.cos(a) * r2,
      },
      rotor,
    );
    if (n % 10 === 0) {
      const t = el("text", { class: "num", x: Math.sin(a) * 70, y: -Math.cos(a) * 70 }, rotor);
      t.textContent = String(n);
    }
  }
  el("circle", { class: "knob", r: 40 }, rotor);
  el("rect", { class: "knob", x: -6, y: -40, width: 12, height: 22, rx: 3 }, rotor);
  flash.setAttribute("class", "flash");
  flash.setAttribute("r", "98");
  dial.appendChild(flash);
  el("path", { class: "marker", d: "M -8 -116 L 8 -116 L 0 -103 Z" }, dial);
}

function drawDial(): void {
  rotor.setAttribute("transform", `rotate(${-(unwrapped + fraction) * DEG_PER_STEP})`);
  dial.setAttribute("aria-valuenow", String(lock.position));
}

// ---- Turning ------------------------------------------------------------

function turnBy(steps: number): void {
  if (!running || steps === 0) return;
  unwrapped += steps;
  handle(lock.turn(steps));
  drawDial();
}

/** Drag and wheel input arrive as fractions of a step. */
function turnSmooth(delta: number): void {
  fraction += delta;
  const whole = Math.trunc(fraction);
  fraction -= whole;
  turnBy(whole);
  drawDial();
}

let dragAngle: number | null = null;

function pointerAngle(e: PointerEvent): number {
  const r = dial.getBoundingClientRect();
  const x = e.clientX - (r.left + r.width / 2);
  const y = e.clientY - (r.top + r.height / 2);
  return (Math.atan2(x, -y) * 180) / Math.PI;
}

dial.addEventListener("pointerdown", (e) => {
  dial.setPointerCapture(e.pointerId);
  dial.classList.add("dragging");
  dragAngle = pointerAngle(e);
});

dial.addEventListener("pointermove", (e) => {
  if (dragAngle === null) return;
  const a = pointerAngle(e);
  let d = a - dragAngle;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  dragAngle = a;
  // Turning the dial clockwise brings lower numbers under the marker.
  turnSmooth(-d / DEG_PER_STEP);
});

const endDrag = () => {
  dragAngle = null;
  dial.classList.remove("dragging");
};
dial.addEventListener("pointerup", endDrag);
dial.addEventListener("pointercancel", endDrag);

dial.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    turnBy(Math.sign(e.deltaY));
  },
  { passive: false },
);

window.addEventListener("keydown", (e) => {
  if (!running) return;
  const big = e.shiftKey ? 5 : 1;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") turnBy(big);
  else if (e.key === "ArrowLeft" || e.key === "ArrowDown") turnBy(-big);
  else if (e.key === " " || e.key === "Enter") {
    if (document.activeElement instanceof HTMLButtonElement) return;
    setNumber();
  } else return;
  e.preventDefault();
});

$("#nudge-up").addEventListener("click", () => turnBy(1));
$("#nudge-down").addEventListener("click", () => turnBy(-1));
$("#set").addEventListener("click", setNumber);

function setNumber(): void {
  if (running) handle(lock.set());
}

// ---- Events -------------------------------------------------------------

function handle(events: LockEvent[]): void {
  for (const ev of events) {
    switch (ev.kind) {
      case "tick":
        audio?.tick();
        break;
      case "click":
        audio?.click(ev.gain);
        if (assistBox.checked) showClick();
        break;
      case "set":
        if (ev.ok) {
          audio?.tumblerFall();
        } else {
          audio?.clunk();
          shake();
          if (lock.stallLeft > 0) say("LEO: Ha! Sorry, dropped my glass. Clumsy me!");
          else say(GUARD_LINES[0], true);
        }
        renderTumblers();
        break;
      case "open":
        audio?.vaultOpen();
        finish();
        break;
      case "guard-free":
        say(GUARD_LINES[1], true);
        break;
    }
  }
}

function showClick(): void {
  flash.classList.remove("on");
  void flash.getBoundingClientRect(); // restart the animation
  flash.classList.add("on");
  navigator.vibrate?.(12);
}

function shake(): void {
  dial.classList.remove("shake");
  void dial.getBoundingClientRect();
  dial.classList.add("shake");
  navigator.vibrate?.([40, 30, 40]);
}

function say(text: string, guard = false): void {
  bubble.textContent = text;
  bubble.classList.toggle("guard", guard);
  nextLine = lock.elapsed + 6;
}

function renderTumblers(): void {
  tumblersEl.replaceChildren(
    ...lock.config.tumblers.map((_, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (i < lock.stage ? " done" : i === lock.stage ? " current" : "");
      return pip;
    }),
  );
}

// ---- Loop ---------------------------------------------------------------

function frame(now: number): void {
  if (!running) return;
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  handle(lock.update(dt));
  if (!running) return;

  const { stallSeconds } = lock.config;
  const left = lock.stallLeft;
  const urgency = left < 20 ? Math.min(1, 1 - left / 20) : 0;
  const t = lock.elapsed;
  // Leo's voice swells and fades, masking the clicks at its peaks.
  const wave = 0.55 + 0.32 * Math.sin((t * 2 * Math.PI) / 9) + 0.13 * Math.sin((t * 2 * Math.PI) / 3.7);
  if (left > 0) {
    audio?.setChatter(Math.min(1, Math.max(0.1, wave + urgency * 0.2)), urgency);
    audio?.setFootsteps(0);
  } else {
    audio?.setChatter(0, 0);
    audio?.setFootsteps(Math.min(1, 0.25 + lock.overtime / 20));
  }

  const pct = Math.max(0, left / stallSeconds) * 100;
  stallFill.style.width = `${pct}%`;
  stallFill.classList.toggle("low", left < 20 && left > 0);
  stallFill.classList.toggle("out", left <= 0);
  stallLabel.textContent =
    left > 0 ? "Leo's keeping the guard busy" : `The guard is heading back · ${Math.ceil(lock.overtime)}s`;

  if (t >= nextLine && left > 0) {
    const lines = urgency > 0 ? LEO_URGENT_LINES : LEO_LINES;
    say("LEO: " + lines[lineIndex++ % lines.length]);
  }
  requestAnimationFrame(frame);
}

// ---- Flow ---------------------------------------------------------------

function show(name: keyof typeof screens): void {
  for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
}

async function begin(): Promise<void> {
  lock = new Lock(defaultConfig(randomCombination(4)));
  unwrapped = 0;
  fraction = 0;
  nextLine = 1.5;
  bubble.textContent = "";
  renderTumblers();
  drawDial();
  show("play");
  audio?.stop();
  audio = new VaultAudio();
  await audio.start();
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function finish(): void {
  running = false;
  const outcome = lock.outcome();
  const ending = ENDINGS[outcome];
  $("#end-title").textContent = ending.title;
  $("#end-text").textContent = ending.text;
  const wrong = lock.mistakes === 1 ? "1 wrong number" : `${lock.mistakes} wrong numbers`;
  $("#end-stats").textContent = `Time ${lock.elapsed.toFixed(1)}s · ${wrong}`;
  // Let the door finish opening before the audio stops.
  window.setTimeout(() => {
    if (!running) {
      audio?.stop();
      audio = null;
    }
  }, 2500);
  window.setTimeout(() => show("end"), 900);
}

buildDial();
$("#start").addEventListener("click", () => void begin());
$("#retry").addEventListener("click", () => void begin());
