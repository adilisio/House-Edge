import { Story } from "inkjs";
import act1 from "./act1.ink";
import act2 from "./act2.ink";
import { loadSave, runAct } from "./player";

/** Act one's choices that act two reads. */
const CARRIED = ["leaked", "theo_rescue", "leo_open", "dee_wary", "vince_helped"] as const;

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Act one's flags from this browser's save, if there is one. */
function actOneFlags(): Record<string, unknown> | null {
  const save = loadSave("house-edge-act1");
  if (!save) return null;
  try {
    const story = new Story(act1);
    story.state.LoadJson(save.state);
    return Object.fromEntries(CARRIED.map((name) => [name, story.variablesState.$(name)]));
  } catch {
    return null;
  }
}

const carried = actOneFlags();
$("#carry").textContent = carried
  ? "Carrying over your act one choices from this browser."
  : "No act one save in this browser, so act two starts from default choices.";
$("#leak-pick").hidden = carried !== null;

function item(label: string, good: boolean, detail: string): HTMLLIElement {
  const li = document.createElement("li");
  li.textContent = `${good ? "✓" : "✗"} ${label}: ${detail}`;
  return li;
}

runAct({
  json: act2,
  saveKey: "house-edge-act2",
  prepare(story) {
    if (carried) {
      for (const [name, value] of Object.entries(carried)) {
        if (value !== null && value !== undefined) story.variablesState.$(name, value as string | boolean);
      }
    } else {
      story.variablesState.$("leaked", $<HTMLSelectElement>("#leak").value);
    }
  },
  onEnd(story) {
    const v = (name: string) => story.variablesState.$(name);
    const scouted = (["poker", "cameras", "vault", "getaway"] as const).filter((s) => v(`scout_${s}`));
    $("#summary").replaceChildren(
      item("Theo", v("theo_safe") === true, v("theo_safe") ? "debt paid, safe" : "Crane has a lever on him"),
      item("Vince", v("vince_handled") === true, v("vince_handled") ? "planned around" : "still plans to run"),
      item("Dee", v("dee_won") === true, v("dee_won") ? "on your side" : "still a cop on the job"),
      item("Scouting", scouted.length > 0, scouted.length ? scouted.join(", ") : "none"),
    );
  },
});
