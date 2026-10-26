import { Story } from "inkjs";
import { describe, expect, it } from "vitest";
import act1 from "./act1.ink";
import { parseLine } from "./beats";
import { stagingChecker } from "./staging-check";

/** Play act one to the end, picking choices with `pick`. */
function playthrough(pick: (count: number) => number): Story {
  const story = new Story(act1);
  for (let guard = 0; guard < 500; guard++) {
    while (story.canContinue) story.Continue();
    if (!story.currentChoices.length) break;
    story.ChooseChoiceIndex(pick(story.currentChoices.length));
  }
  return story;
}

describe("act one", () => {
  it("reaches the end with the whole crew, whatever the choices", () => {
    for (let run = 0; run < 40; run++) {
      const story = playthrough((n) => Math.floor(Math.random() * n));
      expect(story.canContinue).toBe(false);
      expect(story.currentChoices).toHaveLength(0);
      expect(story.variablesState.$("recruited")).toBe(4);
      expect(["date", "vault", "crew"]).toContain(story.variablesState.$("leaked"));
    }
  });

  it("stops Sam for the cop exactly once, after two recruits", () => {
    const story = new Story(act1);
    let recruitedAtStop: number | null = null;
    let stops = 0;
    for (let guard = 0; guard < 500; guard++) {
      while (story.canContinue) {
        const line = story.Continue() ?? "";
        if (line.startsWith("KESSLER: Sam Hale.")) {
          stops++;
          recruitedAtStop = story.variablesState.$("recruited") as number;
        }
      }
      if (!story.currentChoices.length) break;
      story.ChooseChoiceIndex(0);
    }
    expect(stops).toBe(1);
    expect(recruitedAtStop).toBe(2);
  });

  it("offers every remaining recruit at the hub, and never one already recruited", () => {
    const RECRUITS = [
      "The kid who counts cards",
      "The dealer at Crane's blackjack tables",
      "The driver everyone talks about",
      "Vince, an old friend",
    ];
    const story = new Story(act1);
    const texts = () => story.currentChoices.map((c) => c.text);
    while (story.canContinue) story.Continue();
    expect(texts()).toEqual(RECRUITS);
    story.ChooseChoiceIndex(0); // Theo
    for (let guard = 0; guard < 50; guard++) {
      while (story.canContinue) story.Continue();
      if (texts().some((t) => RECRUITS.includes(t))) break;
      story.ChooseChoiceIndex(0);
    }
    expect(texts()).toEqual(RECRUITS.slice(1));
  });

  it("only uses panels, cast, speakers and moods the player knows how to draw", () => {
    for (let run = 0; run < 20; run++) {
      const story = new Story(act1);
      const check = stagingChecker();
      for (let guard = 0; guard < 500; guard++) {
        while (story.canContinue) check(story.Continue() ?? "", story.currentTags ?? []);
        if (!story.currentChoices.length) break;
        story.ChooseChoiceIndex(Math.floor(Math.random() * story.currentChoices.length));
      }
    }
  });
});

describe("parseLine", () => {
  it("reads speech, captions, cards and staging tags", () => {
    expect(parseLine("DEE: Get in. Now.", [])).toEqual({
      beat: { kind: "speech", speaker: "Dee", text: "Get in. Now." },
      staging: { freeze: false },
    });
    expect(parseLine("Three weeks earlier", ["card"]).beat).toEqual({ kind: "card", text: "Three weeks earlier" });
    expect(parseLine("Rain.", ["panel: alley", "cast: Sam, Theo", "freeze"]).staging).toEqual({
      panel: "alley",
      cast: ["Sam", "Theo"],
      freeze: true,
    });
    expect(parseLine("Under the glass: a chip.", []).beat.kind).toBe("caption");
  });

  it("reads faces from mood tags, names of any length first", () => {
    expect(parseLine("Huh.", ["mood: Theo worried, High Roller angry"]).staging.moods).toEqual({
      Theo: "worried",
      "High Roller": "angry",
    });
    // An entry without a known mood is left out.
    expect(parseLine("Huh.", ["mood: Sam furious, Dee happy"]).staging.moods).toEqual({ Dee: "happy" });
  });
});
