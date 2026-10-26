// The comic player shared by every act: draws the panel, captions and
// speech bubbles, offers choices, and saves progress in the browser. Each
// act's page supplies its story and what happens at the start and the end.

import "../style.css";
import "./story.css";
import { Story } from "inkjs";
import { PLACES } from "./art";
import { drawBackdrop, drawCast, drawCovers, placeOrDefault } from "./art/panel";
import type { SceneResult } from "../embed";
import { parseLine, type Beat } from "./beats";
import { loadSave, writeSave, type Save } from "./saves";

export interface ActOptions {
  /** Compiled Ink JSON for this act. */
  json: string;
  saveKey: string;
  /** Called on a fresh start, before the first line: copy flags in here. */
  prepare?: (story: Story) => void;
  /** Called when the act's story ends, before the end screen shows. */
  onEnd?: (story: Story) => void;
  /** Pages for the hands-on scenes this act can hand over to, by scene name. */
  scenes?: Record<string, string>;
  /** Whether the player scouted a scene in act two, which makes it easier. */
  scouted?: (story: Story, scene: string) => boolean;
}

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const screens = { title: $("#title"), play: $("#play"), end: $("#end") };
const comic = $("#comic");
const backdropEl = $("#backdrop");
const placeEl = $("#place");
const castEl = $("#cast");
const cardEl = $("#card-text");
const beatsEl = $("#beats");
const choicesEl = $("#choices");
const nextBtn = $<HTMLButtonElement>("#next");
const continueBtn = $<HTMLButtonElement>("#continue");

/** Beats kept on screen under the panel; older ones scroll away. */
const MAX_BEATS = 3;

interface View {
  panel: string;
  cast: string[];
  beats: Beat[];
  frozen: boolean;
  card: string | null;
  /** A hands-on scene waiting to be played before the story goes on. */
  pending?: string | null;
}

let act: ActOptions;
let story: Story;
let view: View;

// ---- Saving -------------------------------------------------------------

function save(done = false): void {
  writeSave(act.saveKey, { state: story.state.ToJson(), view, done });
}

// ---- Drawing ------------------------------------------------------------

/** What's drawn now, so a line that keeps the scene doesn't redraw it. */
let drawn = { panel: "", cast: "" };

function render(): void {
  const panel = placeOrDefault(view.panel);
  if (panel !== drawn.panel) {
    drawBackdrop(backdropEl, panel);
    placeEl.textContent = PLACES[panel].label;
  }
  comic.classList.toggle("frozen", view.frozen);

  const cast = view.cast.join(",");
  if (cast !== drawn.cast) drawCast(castEl, view.cast);
  drawn = { panel, cast };

  cardEl.hidden = view.card === null;
  cardEl.textContent = view.card ?? "";

  beatsEl.replaceChildren(
    ...view.beats.map((beat, i) => {
      const el = document.createElement("div");
      const old = i < view.beats.length - 1 ? " old" : "";
      if (beat.kind === "speech") {
        el.className = `beat speech${beat.speaker === "Sam" ? " sam" : ""}${old}`;
        const who = document.createElement("span");
        who.className = "speaker";
        who.textContent = beat.speaker;
        el.append(who, document.createTextNode(beat.text));
      } else {
        el.className = `beat narration${old}`;
        el.textContent = beat.text;
      }
      return el;
    }),
  );
}

function showChoices(): void {
  choicesEl.replaceChildren(
    ...story.currentChoices.map((choice) => {
      const b = document.createElement("button");
      b.textContent = choice.text;
      b.addEventListener("click", () => {
        story.ChooseChoiceIndex(choice.index);
        choicesEl.replaceChildren();
        step();
      });
      return b;
    }),
  );
  nextBtn.hidden = true;
  (choicesEl.firstElementChild as HTMLElement | null)?.focus();
}

// ---- Story flow ---------------------------------------------------------

/** Show the next line, or the choices, or the end. */
function step(): void {
  if (story.canContinue) {
    const line = story.Continue() ?? "";
    const { beat, staging } = parseLine(line, story.currentTags ?? []);
    if (!line.trim()) return step();
    view.frozen = false;
    if (staging.panel && staging.panel !== view.panel) {
      view.panel = staging.panel;
      view.beats = [];
    }
    if (staging.cast) view.cast = staging.cast;
    if (beat.kind === "card") {
      view.card = beat.text;
      view.beats = [];
    } else {
      view.card = null;
      view.beats = [...view.beats, beat].slice(-MAX_BEATS);
    }
    view.frozen = staging.freeze;
    view.pending = staging.minigame ?? null;
    render();
    save();
    nextBtn.hidden = false;
    nextBtn.textContent = view.pending ? "Play" : "Next";
    if (view.pending) return;
    // Stop at a choice straight away, so there's no empty "Next" first.
    if (!story.canContinue && story.currentChoices.length) showChoices();
    return;
  }
  if (story.currentChoices.length) return showChoices();
  finish();
}

function finish(): void {
  save(true);
  act.onEnd?.(story);
  show("end");
}

function next(): void {
  if (screens.play.hidden || nextBtn.hidden || overlay) return;
  if (view.pending) openScene(view.pending);
  else step();
}

// ---- Hands-on scenes ----------------------------------------------------
// The scene runs full screen in an iframe and posts its outcome back.

let overlay: HTMLDivElement | null = null;

function openScene(scene: string): void {
  const page = act.scenes?.[scene];
  if (!page) throw new Error(`No page for scene "${scene}"`);
  const scouted = act.scouted?.(story, scene) ? "1" : "0";
  overlay = document.createElement("div");
  overlay.className = "scene-overlay";
  const frame = document.createElement("iframe");
  frame.src = `${page}?embed=1&scouted=${scouted}`;
  frame.title = scene;
  overlay.append(frame);
  document.body.append(overlay);
  frame.focus();
}

window.addEventListener("message", (e: MessageEvent<SceneResult>) => {
  if (e.origin !== location.origin || e.data?.type !== "house-edge-result") return;
  if (!overlay || e.data.scene !== view.pending) return;
  story.variablesState.$(`${e.data.scene}_result`, e.data.outcome);
  overlay.remove();
  overlay = null;
  view.pending = null;
  nextBtn.textContent = "Next";
  step();
});

nextBtn.addEventListener("click", next);
comic.addEventListener("click", next);
window.addEventListener("keydown", (e) => {
  if ((e.key === " " || e.key === "Enter") && !(document.activeElement instanceof HTMLButtonElement)) {
    e.preventDefault();
    next();
  }
});

function show(name: keyof typeof screens): void {
  for (const [k, s] of Object.entries(screens)) s.hidden = k !== name;
}

function start(saved: Save | null): void {
  story = new Story(act.json);
  view = { panel: "casino-exterior", cast: [], beats: [], frozen: false, card: null };
  if (saved) {
    story.state.LoadJson(saved.state);
    view = saved.view as View;
  } else {
    act.prepare?.(story);
  }
  show("play");
  render();
  if (saved) {
    // Pick up exactly where the save left off.
    nextBtn.textContent = view.pending ? "Play" : "Next";
    if (view.pending) nextBtn.hidden = false;
    else if (!story.canContinue && story.currentChoices.length) showChoices();
    else if (!story.canContinue) finish();
    else nextBtn.hidden = false;
  } else {
    step();
  }
}

/** Wire up the page's title and end screens for one act. */
export function runAct(options: ActOptions): void {
  act = options;
  drawCovers();
  continueBtn.hidden = !loadSave(act.saveKey);
  continueBtn.addEventListener("click", () => start(loadSave(act.saveKey)));
  $("#new").addEventListener("click", () => start(null));
  $("#again").addEventListener("click", () => start(null));
}
