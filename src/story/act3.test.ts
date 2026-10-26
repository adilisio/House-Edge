import { Story } from "inkjs";
import { describe, expect, it } from "vitest";
import act3 from "./act3.ink";
import { CHARACTERS, PLACES } from "./art";
import { parseLine } from "./beats";

interface Setup {
  theo_safe?: boolean;
  vince_handled?: boolean;
  dee_won?: boolean;
  leaked?: string;
  /** Outcome each hands-on scene reports. */
  results?: Partial<Record<"poker" | "cameras" | "vault" | "getaway", string>>;
  /** At Crane's offer: go after Theo (true) or stick to the plan (false). */
  saveTheo?: boolean;
}

const OUTCOMES = {
  poker: ["clean", "spotted", "walked"],
  cameras: ["clean", "glitched", "seen"],
  vault: ["clean", "partial", "noticed"],
  getaway: ["clean", "made", "chased"],
} as const;

/** Play act three through, standing in for the player and the hands-on scenes. */
function play(setup: Setup = {}) {
  const story = new Story(act3);
  for (const k of ["theo_safe", "vince_handled", "dee_won", "leaked"] as const) {
    if (setup[k] !== undefined) story.variablesState.$(k, setup[k]!);
  }
  const lines: string[] = [];
  const scenes: string[] = [];
  for (let guard = 0; guard < 1000; guard++) {
    while (story.canContinue) {
      const line = story.Continue() ?? "";
      lines.push(line.trim());
      const { staging } = parseLine(line, story.currentTags ?? []);
      if (staging.minigame) {
        const scene = staging.minigame as keyof typeof OUTCOMES;
        scenes.push(scene);
        story.variablesState.$(`${scene}_result`, setup.results?.[scene] ?? "clean");
      }
    }
    const choices = story.currentChoices;
    if (!choices.length) break;
    const want = setup.saveTheo ? "Go after Theo" : "Stick to the plan";
    story.ChooseChoiceIndex(Math.max(0, choices.findIndex((c) => c.text === want)));
  }
  return { story, lines, scenes, ending: story.variablesState.$("ending") };
}

describe("act three", () => {
  it("plays the four hands-on scenes once each, in heist-night order", () => {
    for (const saveTheo of [true, false]) {
      for (const pass of [true, false]) {
        const { scenes } = play({ theo_safe: pass, vince_handled: pass, dee_won: pass, saveTheo });
        expect(scenes).toEqual(["poker", "cameras", "vault", "getaway"]);
      }
    }
  });

  // The first failed check decides the ending; choosing Theo is check 1 failing.
  it.each([
    [{ theo_safe: true, vince_handled: true, dee_won: true }, "cleared"],
    [{ theo_safe: true, vince_handled: true, dee_won: false }, "caught"],
    [{ theo_safe: true, vince_handled: false, dee_won: true }, "betrayed"],
    [{ theo_safe: true, vince_handled: false, dee_won: false }, "betrayed"],
    [{ theo_safe: false, vince_handled: true, dee_won: true, saveTheo: true }, "theo"],
    [{ theo_safe: false, vince_handled: false, dee_won: false, saveTheo: true }, "theo"],
    [{ theo_safe: false, vince_handled: true, dee_won: true, saveTheo: false }, "cleared"],
    [{ theo_safe: false, vince_handled: false, dee_won: true, saveTheo: false }, "betrayed"],
  ] as [Setup, string][])("%o ends %s", (setup, ending) => {
    const run = play(setup);
    expect(run.ending).toBe(ending);
    expect(run.story.canContinue).toBe(false);
    expect(run.lines.at(-1)).toBe("The end");
  });

  it("only offers Crane's deal for Theo when his debt is unpaid", () => {
    expect(play({ theo_safe: true }).lines).not.toContain("CRANE: Sam. I have your hacker. Bring me what you took from my vault, and he walks.");
    expect(play({ theo_safe: false }).lines).toContain("CRANE: Sam. I have your hacker. Bring me what you took from my vault, and he walks.");
  });

  it.each([
    ["date", "the date of the gala"],
    ["vault", "come to see Crane's vault"],
    ["crew", "about your crew"],
  ])("replays the %s leak in the reveal", (leaked, words) => {
    expect(play({ leaked }).lines.some((l) => l.includes(words))).toBe(true);
  });

  it("adds an epilogue line for each costly hands-on result, and none for clean ones", () => {
    const clean = play().lines;
    const costly = play({ results: { poker: "spotted", cameras: "glitched", vault: "noticed", getaway: "chased" } }).lines;
    expect(costly.length - clean.length).toBe(4);
    expect(costly.some((l) => l.includes("book of mugshots"))).toBe(true);
    expect(costly.some((l) => l.includes("three seconds that jump"))).toBe(true);
  });

  it("only uses panels, cast and speakers the player knows how to draw", () => {
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
    for (let run = 0; run < 40; run++) {
      const story = new Story(act3);
      for (const k of ["theo_safe", "vince_handled", "dee_won"]) story.variablesState.$(k, Math.random() < 0.5);
      story.variablesState.$("leaked", pick(["date", "vault", "crew"]));
      for (let guard = 0; guard < 1000; guard++) {
        while (story.canContinue) {
          const { beat, staging } = parseLine(story.Continue() ?? "", story.currentTags ?? []);
          if (staging.panel) expect(PLACES, staging.panel).toHaveProperty([staging.panel]);
          for (const name of staging.cast ?? []) expect(CHARACTERS, name).toHaveProperty([name]);
          if (beat.kind === "speech") expect(CHARACTERS, beat.speaker).toHaveProperty([beat.speaker]);
          if (staging.minigame) {
            const scene = staging.minigame as keyof typeof OUTCOMES;
            story.variablesState.$(`${scene}_result`, pick(OUTCOMES[scene]));
          }
        }
        if (!story.currentChoices.length) break;
        story.ChooseChoiceIndex(Math.floor(Math.random() * story.currentChoices.length));
      }
      expect(["cleared", "caught", "betrayed", "theo"]).toContain(story.variablesState.$("ending"));
    }
  });
});
