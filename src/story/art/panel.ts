// Puts the art on the page: a place's backdrop and the cast's figures, for the
// story player and for the cover panels on the title screens.

import "./panel.css";
import { figureSvg, parseMoods, type Mood } from "./cast";
import { PLACES } from "./places";

/** The place to draw for a name the art may not have. */
export const placeOrDefault = (place: string) => (PLACES[place] ? place : "city-map");

export function drawBackdrop(el: HTMLElement, place: string): void {
  // The art is our own markup, never story text.
  el.innerHTML = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${PLACES[placeOrDefault(place)].svg}</svg>`;
}

export function drawCast(el: HTMLElement, names: string[], moods: Record<string, Mood> = {}): void {
  el.dataset.count = String(names.length);
  // Whoever is already in the panel stays put; only newcomers pop in.
  const shown = new Map([...el.querySelectorAll<HTMLElement>(":scope > .figure")].map((f) => [f.dataset.name, f]));
  el.replaceChildren(
    ...names.map((name) => {
      const kept = shown.get(name);
      if (kept) {
        kept.classList.add("settled");
        return kept;
      }
      const fig = document.createElement("div");
      fig.className = "figure";
      fig.dataset.name = name;
      fig.dataset.mood = moods[name] ?? "neutral";
      fig.innerHTML = `<svg viewBox="0 0 120 182" aria-hidden="true">${figureSvg(name, moods[name])}</svg>`;
      const label = document.createElement("div");
      label.className = "name";
      label.textContent = name;
      fig.append(label);
      return fig;
    }),
  );
  setMoods(el, moods);
}

/** Change the faces of the cast already drawn, without the figures popping in again. */
export function setMoods(el: HTMLElement, moods: Record<string, Mood>): void {
  for (const fig of el.querySelectorAll<HTMLElement>(".figure")) {
    const name = fig.dataset.name ?? "";
    const mood = moods[name] ?? "neutral";
    if (fig.dataset.mood === mood) continue;
    fig.dataset.mood = mood;
    fig.querySelector("svg")!.innerHTML = figureSvg(name, mood);
  }
}

/**
 * Fill a `<div class="comic cover" data-place="..." data-cast="A, B">` with
 * its picture; `data-moods="A happy"` sets faces the same way as the
 * story's mood tag.
 */
export function drawCover(cover: HTMLElement): void {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  const cast = document.createElement("div");
  cast.className = "cast";
  drawBackdrop(backdrop, cover.dataset.place ?? "");
  const names = (cover.dataset.cast ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  drawCast(cast, names, parseMoods(cover.dataset.moods ?? ""));
  cover.replaceChildren(backdrop, cast);
}

/** Draw every cover panel on the page. */
export function drawCovers(): void {
  for (const cover of document.querySelectorAll<HTMLElement>(".comic.cover")) drawCover(cover);
}
