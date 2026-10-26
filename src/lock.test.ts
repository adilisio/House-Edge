import { describe, expect, it } from "vitest";
import { Lock, circularDistance, defaultConfig, randomCombination } from "./lock";

const make = (targets = [10, 40, 75, 20]) => new Lock(defaultConfig(targets));

describe("Lock", () => {
  it("ticks on every step and clicks only at the current target", () => {
    const lock = make();
    const events = lock.turn(12);
    expect(events.filter((e) => e.kind === "tick")).toHaveLength(12);
    expect(events.filter((e) => e.kind === "click")).toEqual([{ kind: "click", gain: 0.55 }]);
    // Passing a later tumbler's number does nothing yet.
    expect(lock.turn(30).some((e) => e.kind === "click")).toBe(false);
  });

  it("wraps around the dial in both directions", () => {
    const lock = make();
    lock.turn(-1);
    expect(lock.position).toBe(99);
    lock.turn(2);
    expect(lock.position).toBe(1);
  });

  it("advances on a correct set, within tolerance", () => {
    const lock = make();
    lock.turn(11); // first tumbler allows ±1
    expect(lock.set()).toEqual([{ kind: "set", ok: true, stage: 1 }]);
    expect(lock.stage).toBe(1);
  });

  it("costs time but keeps progress on a wrong set", () => {
    const lock = make();
    lock.turn(5);
    const events = lock.set();
    expect(events[0]).toEqual({ kind: "set", ok: false, penalty: 7 });
    expect(lock.stage).toBe(0);
    expect(lock.mistakes).toBe(1);
    expect(lock.stallLeft).toBe(68);
  });

  it("needs the exact number on the later tumblers", () => {
    const lock = make([10, 40, 75, 20]);
    lock.turn(10);
    lock.set();
    lock.turn(30);
    lock.set();
    lock.turn(34); // 74, one short of 75
    expect(lock.set()[0]).toMatchObject({ ok: false });
    lock.turn(1);
    expect(lock.set()[0]).toMatchObject({ ok: true });
  });

  it("opens after the last tumbler and stops reacting", () => {
    const lock = make([10, 40, 75, 20]);
    for (const steps of [10, 30, 35, 45]) {
      lock.turn(steps);
      lock.set();
    }
    expect(lock.open).toBe(true);
    expect(lock.turn(5)).toEqual([]);
    expect(lock.update(100)).toEqual([]);
  });

  it("emits guard-free once when Leo's time runs out", () => {
    const lock = make();
    expect(lock.update(74)).toEqual([]);
    expect(lock.update(2)).toEqual([{ kind: "guard-free" }]);
    expect(lock.update(2)).toEqual([]);
  });

  it("grades the outcome by overtime instead of failing", () => {
    const lock = make();
    expect(lock.outcome()).toBe("clean");
    lock.update(80);
    expect(lock.outcome()).toBe("partial");
    lock.update(20);
    expect(lock.outcome()).toBe("noticed");
  });
});

describe("randomCombination", () => {
  it("keeps numbers distinct, off zero and well apart", () => {
    for (let run = 0; run < 200; run++) {
      const combo = randomCombination(4);
      expect(new Set(combo).size).toBe(4);
      let prev = 0;
      for (const n of combo) {
        expect(circularDistance(n, prev, 100)).toBeGreaterThanOrEqual(15);
        prev = n;
      }
    }
  });
});
