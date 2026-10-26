import "../style.css";
import "./cameras.css";
import { scouted, wireEndButton } from "../embed";
import { CameraAudio } from "./audio";
import { CAMERAS, CameraLoop, MOTH_SECONDS, type LoopEvent, type LoopOutcome } from "./loop";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const screens = { intro: $("#intro"), play: $("#play"), end: $("#end") };
const liveCtx = $<HTMLCanvasElement>("#live").getContext("2d")!;
const recCtx = $<HTMLCanvasElement>("#rec").getContext("2d")!;
const bubble = $("#bubble");
const camsEl = $("#cams");
const crewLabel = $("#crew-label");
const windowFill = $("#window-fill");
const loopBtn = $<HTMLButtonElement>("#loop");
const goBtn = $<HTMLButtonElement>("#go");

const W = 240;
const H = 180;
const FAN_DEG_PER_SECOND = 90;
const LAMP_PERIOD = 1.3;
const GLITCH_SECONDS = 0.7;
// The monitors are their own little world: a green CRT in any page theme.
const CRT = { bg: "#13201b", line: "#8fc4a8", dim: "#4d7363", lamp: "#eaffc4", crew: "#030806" };

const THEO_INTROS = [
  "THEO: Watch the fans. When they line up, hit Loop.",
  "THEO: This one has a flickery light. The fans AND the light have to match.",
  "THEO: Moths. Of course. Don't cut while one's on screen.",
];

const ENDINGS: Record<LoopOutcome, { title: string; text: string }> = {
  clean: {
    title: "Clean",
    text: "Three corridors, three invisible cuts. In the security room, the guard watches empty hallways and yawns.",
  },
  glitched: {
    title: "Glitched",
    text: "The crew made it, but the footage jumped. If the guard reviews the tapes later, he'll know something happened.",
  },
  seen: {
    title: "Seen",
    text: "The crew made it through, but the loop ran out with them in shot. Their faces are on tape now.",
  },
};

let loop: CameraLoop;
let audio: CameraAudio | null = null;
let running = false;
let lastFrame = 0;
let glitchLeft = 0;
let bubbleUntil = 0;

// ---- Drawing ------------------------------------------------------------

interface Feed {
  fanAngle: number;
  lampOn: boolean;
  /** 0..1 through the moth's flight, or null. */
  moth: number | null;
  /** 0..1 across the corridor, or null when the crew isn't in shot. */
  crew: number | null;
  glitch: number;
  stamp: string | null;
  label: string;
}

function drawFeed(ctx: CanvasRenderingContext2D, f: Feed): void {
  ctx.save();
  ctx.fillStyle = CRT.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = CRT.line;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Corridor in one-point perspective.
  const back = { x: 82, y: 58, w: 76, h: 66 };
  ctx.strokeRect(back.x, back.y, back.w, back.h);
  for (const [x1, y1, x2, y2] of [
    [0, 0, back.x, back.y],
    [W, 0, back.x + back.w, back.y],
    [0, H, back.x, back.y + back.h],
    [W, H, back.x + back.w, back.y + back.h],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.strokeStyle = CRT.dim;
  for (const t of [0.35, 0.6, 0.8]) {
    const y = back.y + back.h + (H - back.y - back.h) * t;
    const inset = back.x * (1 - t);
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(W - inset, y);
    ctx.stroke();
  }
  ctx.strokeRect(108, 82, 24, 42); // door at the far end

  // Wall lamp.
  ctx.fillStyle = f.lampOn ? CRT.lamp : CRT.dim;
  ctx.beginPath();
  ctx.arc(30, 74, 9, 0, Math.PI * 2);
  ctx.fill();
  if (f.lampOn) {
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(30, 74, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Ceiling fan, seen from below at an angle.
  ctx.strokeStyle = CRT.line;
  ctx.lineWidth = 10;
  for (let i = 0; i < 3; i++) {
    const a = ((f.fanAngle + i * 120) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(120, 34);
    ctx.lineTo(120 + Math.cos(a) * 62, 34 + Math.sin(a) * 62 * 0.42);
    ctx.stroke();
  }
  ctx.fillStyle = CRT.line;
  ctx.beginPath();
  ctx.arc(120, 34, 8, 0, Math.PI * 2);
  ctx.fill();

  if (f.moth !== null) {
    const x = 70 + f.moth * 110;
    const y = 64 + Math.sin(f.moth * 22) * 9;
    ctx.fillStyle = CRT.lamp;
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2.5, Math.sin(f.moth * 40), 0, Math.PI * 2);
    ctx.fill();
  }

  if (f.crew !== null) {
    ctx.fillStyle = CRT.crew;
    for (let i = 0; i < 3; i++) {
      const x = -30 + f.crew * (W + 60) - i * 26;
      ctx.beginPath();
      ctx.arc(x, 112, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 9, 121, 18, 34);
    }
  }

  // Scanlines.
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  ctx.fillStyle = CRT.line;
  ctx.font = "bold 11px ui-monospace, Menlo, monospace";
  ctx.fillText(f.label, 8, H - 8);

  if (f.stamp) {
    ctx.font = "26px Bangers, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = CRT.crew;
    ctx.strokeText(f.stamp, W / 2, H - 30);
    ctx.fillStyle = f.stamp === "ON TAPE" ? "#ff5a66" : "#f2b705";
    ctx.fillText(f.stamp, W / 2, H - 30);
  }
  ctx.restore();

  // A bad splice tears the picture sideways for a moment.
  if (f.glitch > 0) {
    for (let i = 0; i < 6; i++) {
      const y = Math.floor(Math.random() * H);
      const h = 6 + Math.floor(Math.random() * 18);
      const dx = (Math.random() - 0.5) * 50 * f.glitch;
      ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
    }
  }
}

function frac(x: number): number {
  return x - Math.floor(x);
}

function render(): void {
  const s = loop.spec;
  const recAngle = loop.clock * FAN_DEG_PER_SECOND;
  const recLamp = frac(loop.clock / LAMP_PERIOD);
  const flicker = loop.flickerOffset;
  const lampOn = (phase: number) => s.flickerBeat === null || phase > 0.12;
  const cam = Math.min(loop.camera, loop.cameras.length - 1) + 1;
  const stamp = new Date((4 * 3600 + 12 * 60 + loop.elapsed) * 1000).toISOString().slice(11, 19);
  const rec: Feed = {
    fanAngle: recAngle,
    lampOn: lampOn(recLamp),
    moth: null,
    crew: null,
    glitch: 0,
    stamp: null,
    label: `CAM ${cam}  LOOP`,
  };
  drawFeed(recCtx, rec);

  const looped = (loop.phase === "looped" || loop.phase === "crossing") && loop.windowLeft > 0;
  const onTape = loop.phase === "crossing" && loop.windowLeft <= 0;
  if (looped) {
    drawFeed(liveCtx, { ...rec, glitch: glitchLeft / GLITCH_SECONDS, stamp: "LOOPED", label: `CAM ${cam}  ${stamp}` });
  } else {
    const crewProgress = onTape ? 1 - Math.max(0, loop.crossLeft) / s.crossing : null;
    drawFeed(liveCtx, {
      fanAngle: recAngle + 120 * loop.fanOffset,
      lampOn: lampOn(frac(recLamp + (flicker ?? 0))),
      moth: loop.mothVisible && loop.mothAt !== null ? (loop.clock - loop.mothAt) / MOTH_SECONDS : null,
      crew: crewProgress,
      glitch: 0,
      stamp: onTape ? "ON TAPE" : null,
      label: `CAM ${cam}  ${stamp}`,
    });
  }

  if (loop.phase === "looped" || loop.phase === "crossing") {
    windowFill.style.width = `${(Math.max(0, loop.windowLeft) / s.window) * 100}%`;
    const short = loop.phase === "crossing" && loop.crossLeft > loop.windowLeft;
    windowFill.classList.toggle("out", short || loop.windowLeft <= 0);
    windowFill.classList.toggle("low", !short && loop.windowLeft < s.crossing);
  } else {
    windowFill.style.width = "0%";
  }

  if (loop.phase === "crossing") crewLabel.textContent = loop.windowLeft > 0 ? "Crew crossing" : "Crew crossing, on tape!";
  else if (!loop.crewReady) crewLabel.textContent = `Crew heading to the next door · ${Math.ceil(loop.approachLeft)}s`;
  else if (loop.phase === "looped") crewLabel.textContent = "Loop running · send them!";
  else crewLabel.textContent = "Crew at the door";

  loopBtn.disabled = loop.phase !== "match";
  goBtn.disabled = !(loop.phase === "looped" && loop.crewReady);
}

function renderCams(): void {
  camsEl.replaceChildren(
    ...loop.cameras.map((_, i) => {
      const pip = document.createElement("div");
      pip.className = "pip" + (i < loop.camera ? " done" : i === loop.camera ? " current" : "");
      return pip;
    }),
  );
}

function say(text: string, seconds = 3): void {
  bubble.textContent = text;
  bubbleUntil = loop.elapsed + seconds;
}

// ---- Events -------------------------------------------------------------

function handle(events: LoopEvent[]): void {
  for (const ev of events) {
    switch (ev.kind) {
      case "splice":
        audio?.relay();
        if (ev.clean) {
          say("THEO: Clean cut. Nobody'll know.");
        } else {
          glitchLeft = GLITCH_SECONDS;
          audio?.staticBurst();
          say(ev.moth ? "THEO: The moth just vanished on his screen!" : "THEO: Ooh, that jumped. Hope he wasn't looking.");
        }
        break;
      case "go":
        audio?.setWalking(true);
        break;
      case "loop-ended":
        if (ev.crewInShot) {
          audio?.sting();
          say("THEO: Loop's gone, they're on camera! Keep moving!");
        } else {
          say("THEO: Loop ran out. Cut in again, and send them this time.");
        }
        break;
      case "through":
        audio?.setWalking(false);
        audio?.through();
        renderCams();
        if (loop.phase !== "done") say(THEO_INTROS[loop.camera], 4);
        break;
      case "done":
        finish(ev.outcome);
        break;
    }
  }
}

function splice(): void {
  if (running) handle(loop.splice());
}

function go(): void {
  if (running) handle(loop.go());
}

loopBtn.addEventListener("click", splice);
goBtn.addEventListener("click", go);
window.addEventListener("keydown", (e) => {
  if (!running || e.repeat) return;
  if (document.activeElement instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return;
  if (e.key === " " || e.key === "l") splice();
  else if (e.key === "Enter" || e.key === "g") go();
  else return;
  e.preventDefault();
});

// ---- Loop and flow ------------------------------------------------------

function frame(now: number): void {
  if (!running) return;
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  glitchLeft = Math.max(0, glitchLeft - dt);
  handle(loop.update(dt));
  if (!running) return;
  if (loop.elapsed > bubbleUntil) bubble.textContent = "";
  render();
  requestAnimationFrame(frame);
}

function show(name: keyof typeof screens): void {
  for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
}

async function begin(): Promise<void> {
  // Scouted in act two: Sam has practised with Theo, so every match is looser.
  loop = new CameraLoop(scouted ? CAMERAS.map((c) => ({ ...c, tolerance: c.tolerance + 0.15 })) : CAMERAS);
  glitchLeft = 0;
  bubbleUntil = 0;
  renderCams();
  render();
  show("play");
  audio?.stop();
  audio = new CameraAudio();
  await audio.start();
  say(THEO_INTROS[0], 4);
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function finish(outcome: LoopOutcome): void {
  running = false;
  render();
  const ending = ENDINGS[outcome];
  $("#end-title").textContent = ending.title;
  $("#end-text").textContent = ending.text;
  const glitches = loop.glitches === 1 ? "1 jump" : `${loop.glitches} jumps`;
  $("#end-stats").textContent = `Time ${loop.elapsed.toFixed(1)}s · ${glitches} · on tape at ${loop.seen} of 3 cameras`;
  window.setTimeout(() => {
    if (!running) {
      audio?.stop();
      audio = null;
    }
  }, 1500);
  window.setTimeout(() => show("end"), 900);
}

$("#start").addEventListener("click", () => void begin());
wireEndButton($<HTMLButtonElement>("#retry"), "cameras", () => loop.outcome(), () => void begin());
