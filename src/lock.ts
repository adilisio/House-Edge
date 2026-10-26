// Pure vault-lock logic: no DOM, no audio. The UI feeds it dial steps and
// time, and turns the events it returns into sound and visuals.

export interface TumblerSpec {
  target: number;
  /** Loudness of the click when the dial passes the target, 0..1. */
  clickGain: number;
  /** How many numbers either side of the target still count when setting. */
  tolerance: number;
}

export interface LockConfig {
  positions: number;
  tumblers: TumblerSpec[];
  /** How long Leo can keep the guard busy. */
  stallSeconds: number;
  /** Time a wrong number costs Leo. */
  wrongPenaltySeconds: number;
  /** Overtime after which the guard has noticed something, not just delayed you. */
  partialWindowSeconds: number;
}

export type LockEvent =
  | { kind: "tick"; position: number }
  | { kind: "click"; gain: number }
  | { kind: "set"; ok: true; stage: number }
  | { kind: "set"; ok: false; penalty: number }
  | { kind: "open" }
  | { kind: "guard-free" };

/** clean: in and out unseen. partial: you grab only part. noticed: trouble later. */
export type Outcome = "clean" | "partial" | "noticed";

export const CLICK_GAINS = [0.55, 0.36, 0.23, 0.14];
export const TOLERANCES = [1, 1, 0, 0];

export function defaultConfig(targets: number[]): LockConfig {
  return {
    positions: 100,
    tumblers: targets.map((target, i) => ({
      target,
      clickGain: CLICK_GAINS[i] ?? CLICK_GAINS[CLICK_GAINS.length - 1],
      tolerance: TOLERANCES[i] ?? 0,
    })),
    stallSeconds: 75,
    wrongPenaltySeconds: 7,
    partialWindowSeconds: 20,
  };
}

export function circularDistance(a: number, b: number, positions: number): number {
  const d = Math.abs(a - b) % positions;
  return Math.min(d, positions - d);
}

/**
 * Picks a combination that never starts at the dial's rest position and keeps
 * consecutive numbers well apart, so each one takes a real turn to find.
 */
export function randomCombination(
  count: number,
  positions = 100,
  minGap = 15,
  rand: () => number = Math.random,
): number[] {
  const result: number[] = [];
  let prev = 0;
  while (result.length < count) {
    const n = Math.floor(rand() * positions);
    if (circularDistance(n, prev, positions) < minGap) continue;
    if (result.includes(n)) continue;
    result.push(n);
    prev = n;
  }
  return result;
}

export class Lock {
  readonly config: LockConfig;
  position = 0;
  stage = 0;
  stallLeft: number;
  elapsed = 0;
  mistakes = 0;

  constructor(config: LockConfig) {
    this.config = config;
    this.stallLeft = config.stallSeconds;
  }

  get open(): boolean {
    return this.stage >= this.config.tumblers.length;
  }

  get current(): TumblerSpec | undefined {
    return this.config.tumblers[this.stage];
  }

  get overtime(): number {
    return Math.max(0, -this.stallLeft);
  }

  /** Turn the dial by whole steps; positive = up the numbers. */
  turn(steps: number): LockEvent[] {
    const events: LockEvent[] = [];
    if (this.open) return events;
    const dir = Math.sign(steps);
    const { positions } = this.config;
    for (let i = 0; i < Math.abs(steps); i++) {
      this.position = (this.position + dir + positions) % positions;
      events.push({ kind: "tick", position: this.position });
      const t = this.current;
      if (t && this.position === t.target) events.push({ kind: "click", gain: t.clickGain });
    }
    return events;
  }

  /** Try to set the current number at the dial's position. */
  set(): LockEvent[] {
    const t = this.current;
    if (!t) return [];
    if (circularDistance(this.position, t.target, this.config.positions) <= t.tolerance) {
      this.stage++;
      const events: LockEvent[] = [{ kind: "set", ok: true, stage: this.stage }];
      if (this.open) events.push({ kind: "open" });
      return events;
    }
    this.mistakes++;
    const penalty = this.config.wrongPenaltySeconds;
    return [{ kind: "set", ok: false, penalty }, ...this.drain(penalty)];
  }

  /** Advance time. Running out never fails the job; it only costs later. */
  update(dt: number): LockEvent[] {
    if (this.open) return [];
    this.elapsed += dt;
    return this.drain(dt);
  }

  outcome(): Outcome {
    if (this.stallLeft >= 0) return "clean";
    if (this.overtime <= this.config.partialWindowSeconds) return "partial";
    return "noticed";
  }

  private drain(seconds: number): LockEvent[] {
    const before = this.stallLeft;
    this.stallLeft -= seconds;
    return before >= 0 && this.stallLeft < 0 ? [{ kind: "guard-free" }] : [];
  }
}
