// Test helper shared by the acts' playthrough tests: checks that every line's
// staging is something the player can draw. Follows the cast from line to
// line, as the player does, so a mood tag can be checked against who is
// actually in the panel.

import { expect } from "vitest";
import { CHARACTERS, PLACES, parseMoods } from "./art";
import { parseLine } from "./beats";

export function stagingChecker() {
  let cast: string[] = [];
  return (line: string, tags: string[]) => {
    const parsed = parseLine(line, tags);
    const { beat, staging } = parsed;
    if (staging.panel) expect(PLACES, staging.panel).toHaveProperty([staging.panel]);
    for (const name of staging.cast ?? []) expect(CHARACTERS, name).toHaveProperty([name]);
    if (beat.kind === "speech") expect(CHARACTERS, beat.speaker).toHaveProperty([beat.speaker]);
    cast = staging.cast ?? cast;
    for (const tag of tags) {
      const [key, ...rest] = tag.split(":");
      if (key.trim() !== "mood") continue;
      const value = rest.join(":");
      const entries = value.split(",").filter((e) => e.trim());
      // Every entry names a character and ends in a known mood...
      expect(Object.keys(parseMoods(value)), `mood: ${value}`).toHaveLength(entries.length);
      // ...who is in the panel to show it.
      for (const name of Object.keys(parseMoods(value))) expect(cast, `mood for ${name} in: ${line}`).toContain(name);
    }
    return parsed;
  };
}
