import act1 from "./act1.ink";
import act2 from "./act2.ink";
import act3 from "./act3.ink";
import { drawCover } from "./art/panel";
import { runAct } from "./player";
import { savedFlags } from "./carry";
import { ENDINGS, SAVE_KEYS, endingsFound, recordEnding } from "./saves";

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** Flags act three reads from the earlier acts' saves. */
const FROM_ACT1 = ["leaked", "theo_rescue", "leo_open", "dee_wary", "vince_helped"];
const FROM_ACT2 = ["theo_safe", "vince_handled", "dee_won", "scout_poker", "scout_cameras", "scout_vault", "scout_getaway"];

// Act two holds act one's flags too (copied in, or picked on its title screen),
// so a finished act two speaks for both. Otherwise act one's own save fills in
// what it can and the title screen sets up the rest.
const fromAct2 = savedFlags(act2, SAVE_KEYS.act2, [...FROM_ACT1, ...FROM_ACT2]);
const fromAct1 = fromAct2 ? null : savedFlags(act1, SAVE_KEYS.act1, FROM_ACT1);
$("#carry").textContent = fromAct2
  ? "Carrying over your choices from acts one and two in this browser."
  : "No finished act two in this browser, so set up how it left things:";
$("#setup").hidden = fromAct2 !== null;
$("#leak-pick").hidden = fromAct1 !== null;

/** The last picture of each ending. */
const ENDING_COVERS: Record<string, { place: string; cast: string }> = {
  cleared: { place: "casino-floor", cast: "Sam, Leo, Theo, Dee" },
  caught: { place: "street-night", cast: "Sam, Dee" },
  betrayed: { place: "gallery", cast: "Vince" },
  theo: { place: "rooftop", cast: "Sam, Theo" },
};

function showEndings(): void {
  const found = endingsFound();
  $("#found").textContent = `Endings found: ${found.length} of ${Object.keys(ENDINGS).length}`;
  $("#endings").replaceChildren(
    ...Object.entries(ENDINGS).map(([key, name]) => {
      const li = document.createElement("li");
      li.textContent = found.includes(key) ? `✓ ${name}` : "? ? ?";
      return li;
    }),
  );
}

runAct({
  json: act3,
  saveKey: SAVE_KEYS.act3,
  scenes: { poker: "poker.html", cameras: "cameras.html", vault: "vault.html", getaway: "getaway.html" },
  scouted: (story, scene) => story.variablesState.$(`scout_${scene}`) === true,
  prepare(story) {
    const set = (flags: Record<string, unknown> | null) => {
      for (const [name, value] of Object.entries(flags ?? {})) {
        if (value !== null && value !== undefined) story.variablesState.$(name, value as string | boolean);
      }
    };
    if (fromAct2) return set(fromAct2);
    // No act two: use the title screen's set-up instead.
    if (fromAct1) set(fromAct1);
    else story.variablesState.$("leaked", $<HTMLSelectElement>("#leak").value);
    for (const box of document.querySelectorAll<HTMLInputElement>("#setup input[type=checkbox]")) {
      story.variablesState.$(box.name, box.checked);
    }
  },
  onEnd(story) {
    const ending = story.variablesState.$("ending") as string;
    recordEnding(ending);
    $("#ending").textContent = ENDINGS[ending] ?? "The end";
    const cover = $("#ending-cover");
    Object.assign(cover.dataset, ENDING_COVERS[ending] ?? ENDING_COVERS.cleared);
    drawCover(cover);
    showEndings();
  },
});
