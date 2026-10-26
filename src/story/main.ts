import "../style.css";
import "./story.css";
import { Story } from "inkjs";
import act1 from "./act1.ink";
import { CHARACTERS, PLACES } from "./art";
import { parseLine, type Beat } from "./beats";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

const screens = { title: $("#title"), play: $("#play"), end: $("#end") };
const comic = $("#comic");
const placeEl = $("#place");
const castEl = $("#cast");
const cardEl = $("#card-text");
const beatsEl = $("#beats");
const choicesEl = $("#choices");
const nextBtn = $<HTMLButtonElement>("#next");
const continueBtn = $<HTMLButtonElement>("#continue");

const SAVE_KEY = "house-edge-act1";
/** Beats kept on screen under the panel; older ones scroll away. */
const MAX_BEATS = 3;

interface View {
  panel: string;
  cast: string[];
  beats: Beat[];
  frozen: boolean;
  card: string | null;
}

let story: Story;
let view: View;

// ---- Saving -------------------------------------------------------------
// Browser storage can be missing or blocked; the game works without it.

function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state: story.state.ToJson(), view }));
  } catch {
    // Not saved this time.
  }
}

function load(): { state: string; view: View } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---- Drawing ------------------------------------------------------------

function render(): void {
  const place = PLACES[view.panel] ?? PLACES["city-map"];
  comic.style.background = `linear-gradient(${place.sky} 0 62%, ${place.ground} 62% 100%)`;
  placeEl.textContent = place.label;
  comic.classList.toggle("frozen", view.frozen);

  castEl.replaceChildren(
    ...view.cast.map((name) => {
      const c = CHARACTERS[name];
      const fig = document.createElement("div");
      fig.className = "figure";
      const head = document.createElement("div");
      head.className = "head";
      head.style.background = c?.head ?? "#999";
      const body = document.createElement("div");
      body.className = "body";
      body.style.background = c?.color ?? "#666";
      const label = document.createElement("div");
      label.className = "name";
      label.textContent = name;
      fig.append(head, body, label);
      return fig;
    }),
  );

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
    render();
    save();
    nextBtn.hidden = false;
    // Stop at a choice straight away, so there's no empty "Next" first.
    if (!story.canContinue && story.currentChoices.length) showChoices();
    return;
  }
  if (story.currentChoices.length) return showChoices();
  show("end");
}

function next(): void {
  if (!screens.play.hidden && !nextBtn.hidden) step();
}

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

function start(saved: { state: string; view: View } | null): void {
  story = new Story(act1);
  view = { panel: "casino-exterior", cast: [], beats: [], frozen: false, card: null };
  if (saved) {
    story.state.LoadJson(saved.state);
    view = saved.view;
  }
  show("play");
  render();
  if (saved) {
    // Pick up exactly where the save left off.
    if (!story.canContinue && story.currentChoices.length) showChoices();
    else if (!story.canContinue) show("end");
    else nextBtn.hidden = false;
  } else {
    step();
  }
}

continueBtn.hidden = !load();
continueBtn.addEventListener("click", () => start(load()));
$("#new").addEventListener("click", () => start(null));
$("#again").addEventListener("click", () => start(null));
