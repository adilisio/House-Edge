import { Story } from "inkjs";
import { describe, expect, it } from "vitest";
import act1 from "./act1.ink";
import act2 from "./act2.ink";
import { finishedFlags } from "./saves";

/** Play a story with the first choice every time, stopping after `steps` choices if given. */
function play(json: string, steps = Infinity, setup?: (s: Story) => void): Story {
  const story = new Story(json);
  setup?.(story);
  for (let n = 0; n < 1000; n++) {
    while (story.canContinue) story.Continue();
    if (!story.currentChoices.length || n >= steps) break;
    story.ChooseChoiceIndex(0);
  }
  return story;
}

describe("saves", () => {
  it("carries flags from an act played to the end", () => {
    const story = play(act1);
    const flags = finishedFlags(act1, story.state.ToJson(), ["leaked", "theo_rescue"]);
    expect(flags).toEqual({ leaked: "date", theo_rescue: "bluff" });
  });

  it("carries nothing from an act abandoned halfway", () => {
    // Two choices in, Kessler hasn't stopped Sam yet, so nothing has leaked.
    const story = play(act1, 2);
    expect(story.variablesState.$("leaked")).toBe("");
    expect(finishedFlags(act1, story.state.ToJson(), ["leaked"])).toBeNull();
  });

  it("lets a finished act two speak for act one's flags too", () => {
    const story = play(act2, Infinity, (s) => s.variablesState.$("leaked", "crew"));
    const flags = finishedFlags(act2, story.state.ToJson(), ["leaked", "theo_safe"]);
    expect(flags).toEqual({ leaked: "crew", theo_safe: false });
  });

  it("ignores a broken save", () => {
    expect(finishedFlags(act1, "not json", ["leaked"])).toBeNull();
  });
});
