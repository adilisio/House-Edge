import { describe, expect, it } from "vitest";
import { DEFAULT_DRIVE, Getaway, edgeOf, turnDir, type DriveConfig } from "./drive";

// No patrols or roadblocks unless a test adds them.
const quiet: DriveConfig = { ...DEFAULT_DRIVE, copStarts: [], roadblockTimes: [] };
const make = (overrides: Partial<DriveConfig> = {}) => new Getaway({ ...quiet, ...overrides }, () => 0);

function run(g: Getaway, seconds: number) {
  const events = [];
  for (let t = 0; t < seconds - 1e-9 && !g.finished; t += 0.05) events.push(...g.update(0.05));
  return events;
}

describe("turns", () => {
  it("are relative to Dee's heading", () => {
    expect(turnDir(0, "left")).toBe(3);
    expect(turnDir(2, "left")).toBe(1); // heading south, her left is east
    expect(turnDir(3, "right")).toBe(0);
  });
});

describe("Getaway", () => {
  it("drives straight with no call and takes the call at the next junction", () => {
    const g = make();
    expect(run(g, 2)).toEqual([{ kind: "turned", dir: 0, late: false }]);
    g.callTurn("right");
    expect(g.plannedDir()).toBe(1);
    expect(run(g, 2)).toEqual([{ kind: "turned", dir: 1, late: false }]);
    expect(g.car.from).toEqual({ x: 0, y: 6 });
  });

  it("brakes hard on a late call", () => {
    const g = make();
    run(g, 1.7); // 85% of the way to the junction
    g.callTurn("right");
    const events = run(g, 0.4);
    expect(events).toEqual([{ kind: "turned", dir: 1, late: true }]);
    expect(g.stall).toBeGreaterThan(0);
    expect(g.heat).toBeCloseTo(DEFAULT_DRIVE.brakeHeat, 1);
  });

  it("picks a street herself at the edge of the map", () => {
    const g = make({ start: { x: 0, y: 1 } });
    g.callTurn("left"); // west is off the map, and so is straight on
    expect(run(g, 2.05)).toEqual([{ kind: "forced", dir: 1 }]);
  });

  it("reaches the garage clean when nobody sees the car", () => {
    const g = make();
    // North to the top, then east along it.
    let events = run(g, 15.9);
    g.callTurn("right");
    events = events.concat(run(g, 20));
    expect(events.at(-1)).toEqual({ kind: "done", outcome: "clean" });
  });

  it("is seen by a patrol car looking down its street, and gets the car made", () => {
    // A parked-looking patrol two blocks north, facing south toward Dee.
    const g = make({ copStarts: [{ at: { x: 0, y: 5 }, dir: 2 }], copSpeed: 0 });
    const events = run(g, 2);
    expect(events).toContainEqual({ kind: "spotted" });
    expect(g.heat).toBeGreaterThan(0.3);
    expect(g.outcome()).toBe("made");
  });

  it("can't see round corners", () => {
    const g = make({ copStarts: [{ at: { x: 2, y: 6 }, dir: 1 }], copSpeed: 0 });
    run(g, 1);
    expect(g.seen).toBe(false);
  });

  it("ditches the car when heat maxes out", () => {
    const g = make({ copStarts: [{ at: { x: 0, y: 5 }, dir: 2 }], copSpeed: 0 });
    const events = run(g, 10);
    expect(events.at(-1)).toEqual({ kind: "done", outcome: "chased" });
  });

  it("warns before a roadblock goes up ahead, then turns Dee round if she hits it", () => {
    const g = make({ roadblockTimes: [3], roadblockWarning: 3 });
    const events = run(g, 0.05);
    const warning = events.find((e) => e.kind === "roadblock-warning");
    expect(warning).toBeDefined();
    // Force the block onto her route: the street north out of the next junction.
    g.roadblocks = [{ edge: edgeOf({ x: 0, y: 7 }, 0), liveAt: 0 }];
    const hit = run(g, 2.1);
    expect(hit).toContainEqual({ kind: "hit-roadblock" });
    expect(g.car.dir).toBe(2);
    expect(g.heat).toBeCloseTo(DEFAULT_DRIVE.roadblockHeat, 1);
  });

  it("places roadblocks ahead of the car, not under it", () => {
    for (let i = 0; i < 50; i++) {
      const g = new Getaway({ ...quiet, roadblockTimes: [3] }, Math.random);
      const ev = g.update(0.05).find((e) => e.kind === "roadblock-warning");
      if (!ev || ev.kind !== "roadblock-warning") continue;
      expect(ev.edge).not.toEqual(edgeOf(g.car.from, g.car.dir));
    }
  });
});
