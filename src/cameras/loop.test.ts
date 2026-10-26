import { describe, expect, it } from "vitest";
import { CAMERAS, CameraLoop, type CameraSpec } from "./loop";

// rand() = 0.5 starts every camera half a beat from a match (offset 0.5) and
// keeps moths away for 4 seconds.
const make = (cameras: CameraSpec[] = CAMERAS) => new CameraLoop(cameras, () => 0.5);

function run(loop: CameraLoop, seconds: number) {
  const events = [];
  for (let t = 0; t < seconds - 1e-9; t += 0.05) events.push(...loop.update(0.05));
  return events;
}

/** Advance to the next moment when every cue matches. */
function toMatch(loop: CameraLoop) {
  for (let i = 0; i < 400 && loop.matchError() > 0.03; i++) loop.update(0.01);
}

describe("CameraLoop", () => {
  it("lines the fans up once per beat", () => {
    const loop = make();
    expect(loop.matchError()).toBeCloseTo(1.5); // half of a 3s beat
    run(loop, 1.5);
    expect(loop.matchError()).toBeLessThan(0.05);
  });

  it("needs the flicker to match too on later cameras", () => {
    const loop = make([CAMERAS[1]]);
    // Fan matches every 3s, but the flicker only on every other one.
    run(loop, 1.5);
    expect(loop.fanOffset).toBeCloseTo(0, 1);
    expect(loop.matchError()).toBeGreaterThan(2);
    run(loop, 3);
    expect(loop.matchError()).toBeLessThan(0.1);
  });

  it("makes a clean splice at a match and a glitch away from one", () => {
    const good = make();
    toMatch(good);
    expect(good.splice()).toEqual([expect.objectContaining({ kind: "splice", clean: true })]);
    const bad = make();
    expect(bad.splice()[0]).toMatchObject({ clean: false });
    expect(bad.glitches).toBe(1);
  });

  it("gets the crew through when they go inside the window", () => {
    const loop = make([CAMERAS[0]]);
    toMatch(loop);
    loop.splice();
    expect(loop.go()).toEqual([{ kind: "go" }]);
    const events = run(loop, 3.1);
    expect(events.map((e) => e.kind)).toEqual(["through", "done"]);
    expect(loop.outcome()).toBe("clean");
  });

  it("puts the crew on tape when the loop runs out mid-crossing, but they still get through", () => {
    const loop = make([CAMERAS[0]]);
    toMatch(loop);
    loop.splice();
    run(loop, 6);
    loop.go();
    const events = run(loop, 3.1);
    expect(events.map((e) => e.kind)).toEqual(["loop-ended", "through", "done"]);
    expect(events[0]).toEqual({ kind: "loop-ended", crewInShot: true });
    expect(loop.outcome()).toBe("seen");
  });

  it("lets you splice again if the loop runs out before anyone went", () => {
    const loop = make();
    toMatch(loop);
    loop.splice();
    const events = run(loop, 8.1);
    expect(events).toContainEqual({ kind: "loop-ended", crewInShot: false });
    expect(loop.phase).toBe("match");
    expect(loop.seen).toBe(0);
  });

  it("holds the crew until they reach the door", () => {
    const loop = make([CAMERAS[1]]);
    expect(loop.crewReady).toBe(false);
    loop.splice();
    expect(loop.go()).toEqual([]);
    expect(run(loop, 3.05)).toContainEqual({ kind: "arrived" });
    expect(loop.go()).toEqual([{ kind: "go" }]);
  });

  it("counts a moth in shot as a glitch", () => {
    const loop = make([CAMERAS[2]]);
    run(loop, 4.05); // first moth at 2 + 0.5 * 4 = 4s
    expect(loop.mothVisible).toBe(true);
    expect(loop.splice()[0]).toMatchObject({ moth: true, clean: false });
  });

  it("moves through all three cameras and grades the worst result", () => {
    const loop = make();
    let last;
    for (let cam = 0; cam < 3; cam++) {
      run(loop, loop.approachLeft + 0.05);
      toMatch(loop);
      if (loop.mothVisible) run(loop, 1.3), toMatch(loop);
      loop.splice();
      loop.go();
      last = run(loop, loop.spec.crossing + 0.1);
    }
    expect(last?.at(-1)).toEqual({ kind: "done", outcome: loop.outcome() });
    expect(loop.phase).toBe("done");
  });
});
