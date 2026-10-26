import { describe, expect, it } from "vitest";
import { DEFAULT_TABLE, Table } from "./table";

// rand() = 0 makes every calm spell the minimum length.
const make = () => new Table(DEFAULT_TABLE, () => 0);

/** Run time forward in small steps, collecting events. */
function run(table: Table, seconds: number) {
  const events = [];
  for (let t = 0; t < seconds; t += 0.05) events.push(...table.update(0.05));
  return events;
}

describe("Table", () => {
  it("starts drifting after a calm spell, then looks at Vince", () => {
    const table = make();
    const events = run(table, 1.5 + 1.5 + 0.2);
    expect(events.map((e) => e.kind)).toEqual(["drift-start", "looking-at-vince"]);
    expect(table.lookingAtVince).toBe(true);
  });

  it("pauses the con and builds exposure while he looks at Vince", () => {
    const table = make();
    run(table, 4);
    const progress = table.progress;
    run(table, 1);
    expect(table.progress).toBeCloseTo(progress);
    expect(table.exposure).toBeGreaterThan(1);
  });

  it("pulls his gaze back with a raise and restarts the calm", () => {
    const table = make();
    run(table, 2.5);
    expect(table.isDrifting).toBe(true);
    table.play("raise");
    expect(table.gaze).toBe(0);
    expect(table.isDrifting).toBe(false);
    expect(table.suspicion).toBeCloseTo(0.2);
  });

  it("makes a repeated move more suspicious", () => {
    const table = make();
    table.play("raise");
    run(table, 1);
    const events = table.play("raise");
    expect(events[0]).toMatchObject({ kind: "move", repeated: true });
    expect(table.suspicion).toBeGreaterThan(0.2 + 0.2 * 1.6 - 0.05);
  });

  it("enforces a cooldown between moves", () => {
    const table = make();
    table.play("talk");
    expect(table.play("talk")).toEqual([]);
  });

  it("cools suspicion with a check without pulling his gaze", () => {
    const table = make();
    table.play("raise");
    run(table, 2);
    const gaze = table.gaze;
    table.play("check");
    expect(table.suspicion).toBeLessThan(0.1);
    expect(table.gaze).toBe(gaze);
  });

  it("only costs suspicion on a stare when your hand shakes", () => {
    const steady = make();
    steady.play("stare");
    expect(steady.staring).toBe(true);
    expect(steady.play("talk")).toEqual([]);
    steady.endStare(true);
    expect(steady.suspicion).toBe(0);

    const shaky = make();
    shaky.play("stare");
    const events = shaky.endStare(false);
    expect(events.map((e) => e.kind)).toEqual(["move", "tell"]);
    expect(shaky.suspicion).toBeCloseTo(0.18);
  });

  it("ends clean when the con finishes unseen", () => {
    const table = make();
    let stareNext = false;
    for (let t = 0; t < 60 && !table.finished; t += 0.05) {
      table.update(0.05);
      if (!table.isDrifting || !table.canMove()) continue;
      // Alternate moves so none counts as a repeat.
      if (stareNext) {
        table.play("stare");
        table.endStare(true);
      } else {
        table.play("talk");
      }
      stareNext = !stareNext;
    }
    expect(table.finished).toBe("clean");
  });

  it("turns back on his own after a glance, so doing nothing ends spotted", () => {
    const table = make();
    run(table, 1.5 + 1.5 + 2.2);
    expect(table.lookingAtVince).toBe(false);
    expect(table.exposure).toBeCloseTo(2, 0);
    run(table, 120);
    expect(table.finished).toBe("spotted");
  });

  it("ends walked when suspicion maxes out", () => {
    const table = make();
    const events = [];
    for (let i = 0; i < 10 && !table.finished; i++) {
      events.push(...table.play("raise"));
      run(table, 0.8);
    }
    expect(table.finished).toBe("walked");
    expect(events.at(-1)).toEqual({ kind: "done", outcome: "walked" });
  });
});
