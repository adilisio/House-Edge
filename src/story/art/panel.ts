// Puts the art on the page: a place's backdrop and the cast's figures, for the
// story player and for the cover panels on the title screens.

import "./panel.css";
import { CHARACTERS } from "./cast";
import { PLACES } from "./places";

/** The place to draw for a name the art may not have. */
export const placeOrDefault = (place: string) => (PLACES[place] ? place : "city-map");

export function drawBackdrop(el: HTMLElement, place: string): void {
  // The art is our own markup, never story text.
  el.innerHTML = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${PLACES[placeOrDefault(place)].svg}</svg>`;
}

export function drawCast(el: HTMLElement, names: string[]): void {
  el.dataset.count = String(names.length);
  el.replaceChildren(
    ...names.map((name) => {
      const fig = document.createElement("div");
      fig.className = "figure";
      fig.innerHTML = `<svg viewBox="0 0 120 182" aria-hidden="true">${CHARACTERS[name]?.svg ?? ""}</svg>`;
      const label = document.createElement("div");
      label.className = "name";
      label.textContent = name;
      fig.append(label);
      return fig;
    }),
  );
}

/** Fill a `<div class="comic cover" data-place="..." data-cast="A, B">` with its picture. */
export function drawCover(cover: HTMLElement): void {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  const cast = document.createElement("div");
  cast.className = "cast";
  drawBackdrop(backdrop, cover.dataset.place ?? "");
  drawCast(cast, (cover.dataset.cast ?? "").split(",").map((n) => n.trim()).filter(Boolean));
  cover.replaceChildren(backdrop, cast);
}

/** Draw every cover panel on the page. */
export function drawCovers(): void {
  for (const cover of document.querySelectorAll<HTMLElement>(".comic.cover")) drawCover(cover);
}
