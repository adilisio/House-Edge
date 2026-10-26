// Lets a hands-on scene run inside a story page. The story opens the scene in
// an iframe as `<scene>.html?embed=1&scouted=1`; when the scene ends, its
// "Continue" button reports the outcome back to the story.

const params = new URLSearchParams(location.search);

export const embedded = params.get("embed") === "1" && window.parent !== window;
// Inside the story, the scene's own way back to the menu would strand the
// player in the frame, so it goes.
if (embedded) for (const link of document.querySelectorAll<HTMLElement>(".menu-link")) link.hidden = true;

/** The player scouted this moment in act two, so it plays a little easier. */
export const scouted = params.get("scouted") === "1";

export interface SceneResult {
  type: "house-edge-result";
  scene: string;
  outcome: string;
}

/**
 * Wire the end screen's replay button. Standalone it replays the scene;
 * embedded it becomes "Continue" and hands the outcome to the story.
 */
export function wireEndButton(button: HTMLButtonElement, scene: string, outcome: () => string, replay: () => void): void {
  if (embedded) button.textContent = "Continue";
  button.addEventListener("click", () => {
    if (!embedded) return replay();
    const result: SceneResult = { type: "house-edge-result", scene, outcome: outcome() };
    window.parent.postMessage(result, location.origin);
  });
}
