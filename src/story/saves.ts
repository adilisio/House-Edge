// Browser saves, read across acts: each act carries the flags of the one before
// it, the front page shows how far the story has got, and act three keeps the
// endings found. Storage can be missing or blocked; the game works without it.

import { Story } from "inkjs";

export interface Save {
  state: string;
  view: unknown;
  /** Set once the act has been played to its end screen. */
  done?: boolean;
}

export const SAVE_KEYS = { act1: "house-edge-act1", act2: "house-edge-act2", act3: "house-edge-act3" } as const;
const ENDINGS_KEY = "house-edge-endings";

/** The four endings, in the order the end screen lists them. */
export const ENDINGS: Record<string, string> = {
  cleared: "Name cleared",
  caught: "Caught",
  betrayed: "Betrayed",
  theo: "Protecting Theo",
};

export function loadSave(saveKey: string): Save | null {
  try {
    const raw = localStorage.getItem(saveKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSave(saveKey: string, save: Save): void {
  try {
    localStorage.setItem(saveKey, JSON.stringify(save));
  } catch {
    // Not saved this time.
  }
}

/**
 * The named flags from a saved story, but only if it was played to the end:
 * an act abandoned halfway hasn't made its choices yet.
 */
export function finishedFlags(json: string, state: string, names: readonly string[]): Record<string, unknown> | null {
  try {
    const story = new Story(json);
    story.state.LoadJson(state);
    if (story.canContinue || story.currentChoices.length) return null;
    return Object.fromEntries(names.map((name) => [name, story.variablesState.$(name)]));
  } catch {
    return null;
  }
}

/** finishedFlags for this browser's save of an act. */
export function savedFlags(json: string, saveKey: string, names: readonly string[]): Record<string, unknown> | null {
  const save = loadSave(saveKey);
  return save ? finishedFlags(json, save.state, names) : null;
}

/** Endings reached in this browser, in any order. */
export function endingsFound(): string[] {
  try {
    const found = JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? "[]");
    return Array.isArray(found) ? found.filter((e) => e in ENDINGS) : [];
  } catch {
    return [];
  }
}

export function recordEnding(ending: string): void {
  if (!(ending in ENDINGS)) return;
  const found = new Set(endingsFound()).add(ending);
  try {
    localStorage.setItem(ENDINGS_KEY, JSON.stringify([...found]));
  } catch {
    // Not recorded this time.
  }
}
