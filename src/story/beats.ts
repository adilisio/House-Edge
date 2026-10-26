// Turns Ink output (a line plus its tags) into comic beats the player can draw.
// The conventions are documented at the top of act1.ink.

import { parseMoods, type Mood } from "./art/cast";

export type Beat =
  | { kind: "speech"; speaker: string; text: string }
  | { kind: "caption"; text: string }
  | { kind: "card"; text: string };

export interface Staging {
  /** Set when this line moves the panel somewhere new. */
  panel?: string;
  /** Set when this line changes who is in the panel. */
  cast?: string[];
  freeze: boolean;
  /** Set when this line hands over to a hands-on scene. */
  minigame?: string;
  /** Faces this line changes, by character. */
  moods?: Record<string, Mood>;
}

const SPEECH = /^([A-Z][A-Z .'-]*):\s+(.+)$/;

export function parseLine(line: string, tags: string[]): { beat: Beat; staging: Staging } {
  const text = line.trim();
  const staging: Staging = { freeze: false };
  let card = false;
  for (const tag of tags) {
    const [key, ...rest] = tag.split(":");
    const value = rest.join(":").trim();
    switch (key.trim()) {
      case "panel":
        staging.panel = value;
        break;
      case "cast":
        staging.cast = value.split(",").map((n) => n.trim()).filter(Boolean);
        break;
      case "freeze":
        staging.freeze = true;
        break;
      case "card":
        card = true;
        break;
      case "minigame":
        staging.minigame = value;
        break;
      case "mood":
        staging.moods = { ...staging.moods, ...parseMoods(value) };
        break;
    }
  }
  if (card) return { beat: { kind: "card", text }, staging };
  const m = SPEECH.exec(text);
  const beat: Beat = m ? { kind: "speech", speaker: titleCase(m[1]), text: m[2] } : { kind: "caption", text };
  return { beat, staging };
}

function titleCase(name: string): string {
  return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
