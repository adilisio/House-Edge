// Browser saves, read across acts: each act carries the flags of the one before
// it, the front page shows how far the story has got, and act three keeps the
// endings found. Storage can be missing or blocked; the game works without it.

export interface Save {
  state: string;
  view: unknown;
  /** Set once the act has been played to its end screen. */
  done?: boolean;
  /** storyVersion() of the script the save was made with. */
  version?: string;
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

/**
 * A short fingerprint of a compiled story. A save made with a different
 * version can't be resumed safely: Ink would pick up at a stale position.
 */
export function storyVersion(json: string): string {
  let hash = 0x811c9dc5; // FNV-1a
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

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
