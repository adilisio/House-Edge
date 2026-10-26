import "./style.css";
import { drawCovers } from "./story/art/panel";
import { ENDINGS, endingsFound, loadSave } from "./story/saves";

drawCovers();

// Point the big button at the first act not yet played to its end, and tick
// off the acts that have been.

const links = [...document.querySelectorAll<HTMLAnchorElement>("#acts a")];
const next = document.querySelector<HTMLAnchorElement>("#next-act")!;

let pointed = false;
for (const [i, link] of links.entries()) {
  const save = loadSave(link.dataset.save!);
  if (save?.done) link.textContent = `✓ ${link.textContent}`;
  if (pointed || save?.done) continue;
  pointed = true;
  next.href = link.getAttribute("href")!;
  const name = link.textContent!.split(":")[0].toLowerCase();
  if (save) next.textContent = `Continue ${name}`;
  else if (i > 0) next.textContent = `Play ${name}`;
}

const found = endingsFound().length;
if (!pointed) {
  next.href = "act3.html";
  next.textContent = found < Object.keys(ENDINGS).length ? "Find another ending" : "Play heist night again";
}
if (found) {
  document.querySelector("#progress")!.textContent = `Endings found: ${found} of ${Object.keys(ENDINGS).length}.`;
}
