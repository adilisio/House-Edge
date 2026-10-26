import "../style.css";
import "./getaway.css";
import { scouted, wireEndButton } from "../embed";
import { drawCovers } from "../story/art/panel";
import { GetawayAudio } from "./audio";
import {
  DEFAULT_DRIVE,
  DX,
  DY,
  Getaway,
  position,
  type Dir,
  type DriveEvent,
  type DriveOutcome,
  type Edge,
  type Point,
  type Turn,
} from "./drive";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

drawCovers();

const screens = { intro: $("#intro"), play: $("#play"), end: $("#end") };
const canvas = $<HTMLCanvasElement>("#map");
const ctx = canvas.getContext("2d")!;
const bubble = $("#bubble");
const heatFill = $("#heat-fill");
const heatLabel = $("#heat-label");
const turnButtons = [...document.querySelectorAll<HTMLButtonElement>("button.turn")];

const BLOCK = 40;
const MARGIN = 18;
const ROAD = 15; // street width
// The map is its own comic-panel world, the same in any page theme.
const MAP = {
  road: "#3d4152",
  ink: "#111",
  blocks: ["#e0c9a6", "#c7b3d9", "#a9c9b4", "#e6b8a2"],
  garage: "#f2b705",
  car: "#e63946",
  cop: "#2f6fdf",
  sight: "rgba(255, 226, 92, 0.42)",
  plan: "#f2b705",
  planDefault: "#fdf6e3",
};

const ENDINGS: Record<DriveOutcome, { title: string; text: string }> = {
  clean: {
    title: "Clean",
    text: "Dee pulls into the garage and kills the lights. Sirens pass a street away and fade. Nobody saw the car.",
  },
  made: {
    title: "Made",
    text: "You make the garage, but the police got a look at the car. The plates are burned, so the car can't be used again.",
  },
  chased: {
    title: "Chased",
    text: "With sirens on every side, Dee dumps the car in an alley and you run the last blocks on foot. Whatever was in the boot stays behind.",
  },
};

let game: Getaway;
let audio: GetawayAudio | null = null;
let running = false;
let lastFrame = 0;
let bubbleUntil = 0;
let blink = 0;

// ---- Drawing ------------------------------------------------------------

const px = (p: Point) => ({ x: MARGIN + p.x * BLOCK, y: MARGIN + p.y * BLOCK });

function sizeCanvas(): void {
  const { cols, rows } = game.config;
  const w = MARGIN * 2 + (cols - 1) * BLOCK;
  const h = MARGIN * 2 + (rows - 1) * BLOCK;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.aspectRatio = `${w} / ${h}`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function edgeRect(e: Edge): { x: number; y: number; w: number; h: number } {
  const a = px(e);
  return e.horizontal
    ? { x: a.x, y: a.y - ROAD / 2, w: BLOCK, h: ROAD }
    : { x: a.x - ROAD / 2, y: a.y, w: ROAD, h: BLOCK };
}

function arrow(from: { x: number; y: number }, dir: Dir, len: number, color: string, dashed: boolean): void {
  const to = { x: from.x + DX[dir] * len, y: from.y + DY[dir] * len };
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash(dashed ? [4, 4] : []);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const a = Math.atan2(DY[dir], DX[dir]);
  ctx.beginPath();
  ctx.moveTo(to.x + Math.cos(a) * 6, to.y + Math.sin(a) * 6);
  ctx.lineTo(to.x + Math.cos(a + 2.4) * 8, to.y + Math.sin(a + 2.4) * 8);
  ctx.lineTo(to.x + Math.cos(a - 2.4) * 8, to.y + Math.sin(a - 2.4) * 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function vehicle(p: Point, dir: Dir, color: string, lights: boolean): void {
  const c = px(p);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate((dir * Math.PI) / 2);
  ctx.fillStyle = color;
  ctx.strokeStyle = MAP.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(-6, -10, 12, 20);
  ctx.strokeRect(-6, -10, 12, 20);
  ctx.fillStyle = MAP.ink;
  ctx.fillRect(-4, -6, 8, 5); // windscreen, at the front
  if (lights) {
    ctx.fillStyle = blink % 0.5 < 0.25 ? "#ff3b3b" : "#3bb2ff";
    ctx.fillRect(-5, 1, 10, 3);
  }
  ctx.restore();
}

function render(): void {
  const { cols, rows, garage, sightBlocks } = game.config;
  const w = MARGIN * 2 + (cols - 1) * BLOCK;
  const h = MARGIN * 2 + (rows - 1) * BLOCK;
  ctx.fillStyle = MAP.road;
  ctx.fillRect(0, 0, w, h);

  // City blocks between the streets.
  ctx.strokeStyle = MAP.ink;
  ctx.lineWidth = 2;
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = px({ x, y });
      ctx.fillStyle = MAP.blocks[(x * 3 + y * 5) % MAP.blocks.length];
      ctx.fillRect(a.x + ROAD / 2, a.y + ROAD / 2, BLOCK - ROAD, BLOCK - ROAD);
      ctx.strokeRect(a.x + ROAD / 2, a.y + ROAD / 2, BLOCK - ROAD, BLOCK - ROAD);
    }
  }

  // Garage.
  const g = px(garage);
  ctx.fillStyle = MAP.garage;
  ctx.fillRect(g.x - 12, g.y - 12, 24, 24);
  ctx.strokeRect(g.x - 12, g.y - 12, 24, 24);
  ctx.fillStyle = MAP.ink;
  ctx.font = "18px Bangers, Impact, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G", g.x, g.y + 1);

  // Roadblocks: dashed while the scanner warns, striped once they're up.
  for (const r of game.roadblocks) {
    const rect = edgeRect(r.edge);
    if (game.elapsed < r.liveAt) {
      if (blink % 0.6 < 0.4) {
        ctx.save();
        ctx.strokeStyle = MAP.garage;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
        ctx.restore();
      }
    } else {
      const n = 5;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i % 2 ? "#fff" : MAP.car;
        if (r.edge.horizontal) ctx.fillRect(rect.x + (rect.w / n) * i, rect.y, rect.w / n, rect.h);
        else ctx.fillRect(rect.x, rect.y + (rect.h / n) * i, rect.w, rect.h / n);
      }
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
  }

  // Patrol sight lines, then the patrols.
  for (const cop of game.cops) {
    const c = px(position(cop));
    const len = sightBlocks * BLOCK;
    ctx.fillStyle = MAP.sight;
    if (DX[cop.dir] !== 0) {
      const x0 = DX[cop.dir] > 0 ? c.x : c.x - len;
      ctx.fillRect(x0, c.y - ROAD / 2, len, ROAD);
    } else {
      const y0 = DY[cop.dir] > 0 ? c.y : c.y - len;
      ctx.fillRect(c.x - ROAD / 2, y0, ROAD, len);
    }
  }
  for (const cop of game.cops) vehicle(position(cop), cop.dir, MAP.cop, true);

  // Dee's next junction and the way she'll go there.
  if (!game.finished) {
    const j = px(game.nextJunction);
    ctx.strokeStyle = game.call ? MAP.plan : MAP.planDefault;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(j.x, j.y, 11, 0, Math.PI * 2);
    ctx.stroke();
    arrow(j, game.plannedDir(), 22, game.call ? MAP.plan : MAP.planDefault, !game.call);
  }

  vehicle(position(game.car), game.car.dir, MAP.car, false);

  const heat = game.heat;
  heatFill.style.width = `${heat * 100}%`;
  heatLabel.textContent = game.seen ? "Heat · they can see you!" : "Heat";
  for (const b of turnButtons) b.classList.toggle("called", b.dataset.turn === game.call);
}

function say(text: string, seconds = 2.5): void {
  bubble.textContent = text;
  bubbleUntil = game.elapsed + seconds;
}

// ---- Input --------------------------------------------------------------

function call(turn: Turn): void {
  if (running) game.callTurn(turn);
}

for (const b of turnButtons) b.addEventListener("click", () => call(b.dataset.turn as Turn));

const KEYS: Record<string, Turn> = {
  ArrowLeft: "left",
  a: "left",
  ArrowUp: "straight",
  w: "straight",
  ArrowRight: "right",
  d: "right",
};
window.addEventListener("keydown", (e) => {
  const turn = KEYS[e.key];
  if (!running || !turn) return;
  e.preventDefault();
  call(turn);
});

// ---- Events -------------------------------------------------------------

function handle(events: DriveEvent[]): void {
  for (const ev of events) {
    switch (ev.kind) {
      case "turned":
        if (ev.late) {
          audio?.screech();
          say("DEE: Earlier! I need it earlier!");
        }
        break;
      case "forced":
        say("DEE: Can't go that way. Taking the other road.");
        break;
      case "roadblock-warning":
        audio?.radio();
        say("SCANNER: All units, roadblock going up ahead of the suspect.", 3);
        break;
      case "hit-roadblock":
        audio?.crash();
        say("DEE: Roadblock! Hang on!");
        break;
      case "spotted":
        say("SCANNER: I have eyes on the vehicle!");
        break;
      case "lost-them":
        say("DEE: I think we lost them.");
        break;
      case "done":
        finish(ev.outcome);
        break;
    }
  }
}

// ---- Loop and flow ------------------------------------------------------

function frame(now: number): void {
  if (!running) return;
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  blink += dt;
  handle(game.update(dt));
  if (!running) return;
  audio?.setEngine(game.stall > 0 ? 0 : 1);
  audio?.setSiren(game.seen);
  if (game.elapsed > bubbleUntil) bubble.textContent = "";
  render();
  requestAnimationFrame(frame);
}

function show(name: keyof typeof screens): void {
  for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
}

async function begin(): Promise<void> {
  // Scouted in act two: Sam drove the route, so the scanner's warnings come twice as early.
  game = new Getaway(scouted ? { ...DEFAULT_DRIVE, roadblockWarning: DEFAULT_DRIVE.roadblockWarning * 2 } : DEFAULT_DRIVE);
  bubbleUntil = 0;
  sizeCanvas();
  render();
  show("play");
  audio?.stop();
  audio = new GetawayAudio();
  await audio.start();
  say("DEE: Talk to me. Where am I going?", 3);
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function finish(outcome: DriveOutcome): void {
  running = false;
  render();
  audio?.setSiren(false);
  const ending = ENDINGS[outcome];
  $("#end-title").textContent = ending.title;
  $("#end-text").textContent = ending.text;
  $("#end-stats").textContent = `Time ${game.elapsed.toFixed(1)}s · seen for ${game.seenTime.toFixed(1)}s`;
  window.setTimeout(() => {
    if (!running) {
      audio?.stop();
      audio = null;
    }
  }, 1500);
  window.setTimeout(() => show("end"), 900);
}

$("#start").addEventListener("click", () => void begin());
wireEndButton($<HTMLButtonElement>("#retry"), "getaway", () => game.finished ?? game.outcome(), () => void begin());
