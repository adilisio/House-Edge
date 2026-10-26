// Reads one act's choices out of its save, for the next act to carry on
// with. Kept apart from saves.ts so the front page doesn't load Ink.

import { Story } from "inkjs";
import { loadSave } from "./saves";

/**
 * The named flags from a saved story, but only if it was played to the end:
 * an act abandoned halfway hasn't made its choices yet. A save marked done
 * counts even when the script has changed since, which can leave its
 * position meaningless; variables are kept by name, so they still read.
 */
export function finishedFlags(json: string, state: string, names: readonly string[], done = false): Record<string, unknown> | null {
  try {
    const story = new Story(json);
    story.state.LoadJson(state);
    if (!done && (story.canContinue || story.currentChoices.length)) return null;
    return Object.fromEntries(names.map((name) => [name, story.variablesState.$(name)]));
  } catch {
    return null;
  }
}

/** finishedFlags for this browser's save of an act. */
export function savedFlags(json: string, saveKey: string, names: readonly string[]): Record<string, unknown> | null {
  const save = loadSave(saveKey);
  return save ? finishedFlags(json, save.state, names, save.done) : null;
}
