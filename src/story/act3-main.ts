import { Story } from "inkjs";
import act1 from "./act1.ink";
import act2 from "./act2.ink";
import act3 from "./act3.ink";
import { loadSave, runAct } from "./player";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Flags act three reads from the earlier acts' saves. */
const FROM_ACT1 = ["leaked", "theo_rescue", "leo_open", "dee_wary", "vince_helped"];
const FROM_ACT2 = ["theo_safe", "vince_handled", "dee_won", "scout_poker", "scout_cameras", "scout_vault", "scout_getaway"];

const ENDINGS: Record<string, string> = {
  cleared: "Name cleared",
  caught: "Caught",
  betrayed: "Betrayed",
  theo: "Protecting Theo",
};

function flagsFrom(json: string, saveKey: string, names: string[]): Record<string, unknown> | null {
  const save = loadSave(saveKey);
  if (!save) return null;
  try {
    const story = new Story(json);
    story.state.LoadJson(save.state);
    return Object.fromEntries(names.map((name) => [name, story.variablesState.$(name)]));
  } catch {
    return null;
  }
}

const fromAct1 = flagsFrom(act1, "house-edge-act1", FROM_ACT1);
const fromAct2 = flagsFrom(act2, "house-edge-act2", FROM_ACT2);
$("#carry").textContent = fromAct2
  ? "Carrying over your choices from acts one and two in this browser."
  : "No act two save in this browser, so set up how act two left things:";
$("#setup").hidden = fromAct2 !== null;

runAct({
  json: act3,
  saveKey: "house-edge-act3",
  scenes: { poker: "poker.html", cameras: "cameras.html", vault: "vault.html", getaway: "getaway.html" },
  scouted: (story, scene) => story.variablesState.$(`scout_${scene}`) === true,
  prepare(story) {
    const set = (flags: Record<string, unknown> | null) => {
      for (const [name, value] of Object.entries(flags ?? {})) {
        if (value !== null && value !== undefined) story.variablesState.$(name, value as string | boolean);
      }
    };
    set(fromAct1);
    if (fromAct2) return set(fromAct2);
    // No save: use the title screen's set-up instead.
    story.variablesState.$("leaked", $<HTMLSelectElement>("#leak").value);
    for (const box of document.querySelectorAll<HTMLInputElement>("#setup input[type=checkbox]")) {
      story.variablesState.$(box.name, box.checked);
    }
  },
  onEnd(story) {
    $("#ending").textContent = ENDINGS[story.variablesState.$("ending") as string] ?? "The end";
  },
});
