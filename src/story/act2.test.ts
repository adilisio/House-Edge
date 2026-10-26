import { Story } from "inkjs";
import { describe, expect, it } from "vitest";
import act2 from "./act2.ink";
import { stagingChecker } from "./staging-check";

type Chooser = (texts: string[]) => number;

/** Play act two to the end, returning the story and every line shown. */
function play(choose: Chooser, setup?: (s: Story) => void) {
  const story = new Story(act2);
  setup?.(story);
  const lines: string[] = [];
  for (let guard = 0; guard < 1000; guard++) {
    while (story.canContinue) lines.push((story.Continue() ?? "").trim());
    if (!story.currentChoices.length) break;
    story.ChooseChoiceIndex(choose(story.currentChoices.map((c) => c.text)));
  }
  return { story, lines };
}

const random: Chooser = (texts) => Math.floor(Math.random() * texts.length);

/** Pick the first choice containing any of these words, else the first. */
const prefer =
  (...wanted: string[]): Chooser =>
  (texts) => {
    for (const w of wanted) {
      const i = texts.findIndex((t) => t.includes(w));
      if (i >= 0) return i;
    }
    return 0;
  };

const v = (s: Story, name: string) => s.variablesState.$(name);

describe("act two", () => {
  it("always ends after exactly seven slots", () => {
    for (let run = 0; run < 60; run++) {
      const { story } = play(random);
      expect(story.canContinue).toBe(false);
      expect(story.currentChoices).toHaveLength(0);
      expect(v(story, "slots_used")).toBe(7);
    }
  });

  it("plays Leo's office scene once, on the evening of day one", () => {
    const { lines } = play(random);
    const leo = lines.filter((l) => l.startsWith("That night, you wait in the staff corridor"));
    expect(leo).toHaveLength(1);
    const at = lines.indexOf(leo[0]);
    expect(at).toBeGreaterThan(lines.indexOf("Day one"));
    expect(at).toBeLessThan(lines.indexOf("Day two"));
  });

  it("only offers a response scene after its clue scene", () => {
    const story = new Story(act2);
    while (story.canContinue) story.Continue();
    while (!story.currentChoices.some((c) => c.text === "Check on Theo")) {
      story.ChooseChoiceIndex(0);
      while (story.canContinue) story.Continue();
    }
    const texts = story.currentChoices.map((c) => c.text);
    expect(texts).not.toContain("Deal with Theo's debt");
    expect(texts).not.toContain("Deal with Vince's passports");
    expect(texts).not.toContain("Find out who Dee really is");
  });

  it("can win all three checks, with one slot to spare", () => {
    const { story } = play(
      prefer(
        "Check on Theo",
        "Help him: pay the debt",
        "Deal with Theo's debt",
        "Have a drink with Vince",
        "Keep quiet and plan around him",
        "Deal with Vince's passports",
        "Go over the route with Dee",
        "Confront her with the truth",
        "Find out who Dee really is",
        "Scout: watch the high roller play",
      ),
    );
    expect(v(story, "theo_safe")).toBe(true);
    expect(v(story, "vince_handled")).toBe(true);
    expect(v(story, "dee_won")).toBe(true);
    expect(v(story, "scout_poker")).toBe(true);
  });

  // The response table in the design doc.
  const RESPONSES: [string, string, string, boolean][] = [
    ["Theo", "Confront him about the debt", "theo_safe", false],
    ["Theo", "Help him: pay the debt", "theo_safe", true],
    ["Theo", "Keep quiet and use it", "theo_safe", false],
    ["Vince", "Confront him about the passports", "vince_handled", false],
    ["Vince", "Help him: offer a bigger cut", "vince_handled", false],
    ["Vince", "Keep quiet and plan around him", "vince_handled", true],
    ["Dee", "Confront her with the truth about Crane", "dee_won", true],
    ["Dee", "Help her case without saying a word", "dee_won", true],
    ["Dee", "Use her cover to feed the police false information", "dee_won", false],
  ];
  const SCENES: Record<string, [string, string]> = {
    Theo: ["Check on Theo", "Deal with Theo's debt"],
    Vince: ["Have a drink with Vince", "Deal with Vince's passports"],
    Dee: ["Go over the route with Dee", "Find out who Dee really is"],
  };
  it.each(RESPONSES)("%s: %s sets %s to %s", (who, response, check, expected) => {
    const { story } = play(prefer(response, ...SCENES[who]));
    expect(v(story, check)).toBe(expected);
  });

  it("counts a secret never dealt with as a fail", () => {
    const { story } = play(prefer("Scout:", "Check on Theo", "Have a drink with Vince", "Go over the route"));
    expect(v(story, "theo_safe")).toBe(false);
    expect(v(story, "vince_handled")).toBe(false);
    expect(v(story, "dee_won")).toBe(false);
  });

  it.each([
    ["date", "forty extra staff"],
    ["vault", "new combination"],
    ["crew", "paid his brother a visit"],
  ])("makes Crane's day-three move follow the leak: %s", (leaked, words) => {
    const { lines } = play(random, (s) => s.variablesState.$("leaked", leaked));
    expect(lines.some((l) => l.includes(words))).toBe(true);
  });

  it("only uses panels, cast, speakers and moods the player knows how to draw", () => {
    for (let run = 0; run < 30; run++) {
      const story = new Story(act2);
      const check = stagingChecker();
      for (let guard = 0; guard < 1000; guard++) {
        while (story.canContinue) check(story.Continue() ?? "", story.currentTags ?? []);
        if (!story.currentChoices.length) break;
        story.ChooseChoiceIndex(Math.floor(Math.random() * story.currentChoices.length));
      }
    }
  });
});
