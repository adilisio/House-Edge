// Pure poker-table logic: no DOM, no audio. The goal is not to win the hand
// but to keep the high roller looking at you while Vince works his con.

export type Move = "raise" | "talk" | "stare" | "check";

export interface MoveSpec {
  /** How far the move pulls his gaze back toward you (0 = none, 1 = fully). */
  pull: number;
  /** Suspicion added (negative cools it). */
  suspicion: number;
}

export interface TableConfig {
  moves: Record<Move, MoveSpec>;
  /** Extra suspicion when a move repeats the previous one, as a multiplier. */
  repeatPenalty: number;
  /** Suspicion added on top of the stare's own when your hand shakes. */
  shakyStareSuspicion: number;
  cooldownSeconds: number;
  /** Seconds of a full calm, uninterrupted con. */
  conSeconds: number;
  /** Seconds he can spend looking at Vince before he'll remember him. */
  spotSeconds: number;
  /** How long one look at Vince lasts before he turns back on his own. */
  glanceSeconds: number;
  suspicionCoolPerSecond: number;
  /** Calm spell before his eyes start to drift, shrinking as the con goes on. */
  calmSeconds: [min: number, max: number];
  /** Seconds a drift takes to reach Vince, early and late in the con. */
  driftSeconds: [early: number, late: number];
}

export const DEFAULT_TABLE: TableConfig = {
  moves: {
    raise: { pull: 1, suspicion: 0.2 },
    talk: { pull: 0.6, suspicion: 0.07 },
    stare: { pull: 1, suspicion: 0 },
    check: { pull: 0, suspicion: -0.15 },
  },
  repeatPenalty: 1.6,
  shakyStareSuspicion: 0.18,
  cooldownSeconds: 0.7,
  conSeconds: 40,
  spotSeconds: 2.5,
  glanceSeconds: 2,
  suspicionCoolPerSecond: 0.012,
  calmSeconds: [1.5, 4],
  driftSeconds: [1.5, 0.9],
};

/** clean: never got a look at Vince. spotted: he'll remember him. walked: left early. */
export type PokerOutcome = "clean" | "spotted" | "walked";

export type TableEvent =
  | { kind: "drift-start" }
  | { kind: "looking-at-vince" }
  | { kind: "move"; move: Move; repeated: boolean }
  | { kind: "tell" }
  | { kind: "done"; outcome: PokerOutcome };

export class Table {
  readonly config: TableConfig;
  /** 0 = looking at you, 1 = looking at Vince. */
  gaze = 0;
  suspicion = 0;
  /** Vince's con, 0..1. */
  progress = 0;
  /** Total seconds he has spent looking at Vince. */
  exposure = 0;
  elapsed = 0;
  cooldown = 0;
  staring = false;
  finished: PokerOutcome | null = null;
  private calmLeft: number;
  private drifting = false;
  private lookLeft = 0;
  private lastMove: Move | null = null;
  private rand: () => number;

  constructor(config: TableConfig = DEFAULT_TABLE, rand: () => number = Math.random) {
    this.config = config;
    this.rand = rand;
    this.calmLeft = this.nextCalm();
  }

  get isDrifting(): boolean {
    return this.drifting;
  }

  get lookingAtVince(): boolean {
    return this.gaze >= 1;
  }

  canMove(): boolean {
    return !this.finished && !this.staring && this.cooldown <= 0;
  }

  /** Play a move. A stare only begins here; finish it with endStare(). */
  play(move: Move): TableEvent[] {
    if (!this.canMove()) return [];
    if (move === "stare") {
      this.staring = true;
      return [];
    }
    return this.apply(move, 0);
  }

  /** Finish a stare: a shaky hand is a tell. */
  endStare(steady: boolean): TableEvent[] {
    if (!this.staring) return [];
    this.staring = false;
    const events = this.apply("stare", steady ? 0 : this.config.shakyStareSuspicion);
    if (!steady) events.splice(1, 0, { kind: "tell" });
    return events.concat(this.checkEnd());
  }

  update(dt: number): TableEvent[] {
    if (this.finished) return [];
    const c = this.config;
    const events: TableEvent[] = [];
    this.elapsed += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.suspicion = Math.max(0, this.suspicion - c.suspicionCoolPerSecond * dt);

    if (this.staring) {
      // Locked in a stare, he can't look anywhere else.
      this.gaze = Math.max(0, this.gaze - dt * 2);
    } else if (this.drifting) {
      const wasLooking = this.lookingAtVince;
      this.gaze = Math.min(1, this.gaze + dt / this.driftSeconds());
      if (!wasLooking && this.lookingAtVince) {
        this.lookLeft = c.glanceSeconds;
        events.push({ kind: "looking-at-vince" });
      }
    } else {
      this.calmLeft -= dt;
      if (this.calmLeft <= 0) {
        this.drifting = true;
        events.push({ kind: "drift-start" });
      }
    }

    if (this.lookingAtVince) {
      this.exposure += dt;
      this.lookLeft -= dt;
      // Left alone, he turns back to the table, but he has had his look.
      if (this.lookLeft <= 0) this.settle();
    } else {
      this.progress = Math.min(1, this.progress + dt / c.conSeconds);
    }

    return events.concat(this.checkEnd());
  }

  outcome(): PokerOutcome {
    if (this.suspicion >= 1) return "walked";
    return this.exposure >= this.config.spotSeconds ? "spotted" : "clean";
  }

  private apply(move: Move, extraSuspicion: number): TableEvent[] {
    const spec = this.config.moves[move];
    const repeated = move === this.lastMove && move !== "check";
    const added = spec.suspicion > 0 && repeated ? spec.suspicion * this.config.repeatPenalty : spec.suspicion;
    this.suspicion = Math.min(1, Math.max(0, this.suspicion + added + extraSuspicion));
    this.gaze = Math.max(0, this.gaze - spec.pull);
    if (this.gaze < 0.2 && spec.pull > 0) this.settle();
    this.lastMove = move;
    this.cooldown = this.config.cooldownSeconds;
    return [{ kind: "move", move, repeated }, ...this.checkEnd()];
  }

  private settle(): void {
    this.gaze = Math.min(this.gaze, 0);
    this.drifting = false;
    this.calmLeft = this.nextCalm();
  }

  private checkEnd(): TableEvent[] {
    if (this.finished) return [];
    if (this.suspicion >= 1 || this.progress >= 1) {
      this.finished = this.outcome();
      return [{ kind: "done", outcome: this.finished }];
    }
    return [];
  }

  private nextCalm(): number {
    const [min, max] = this.config.calmSeconds;
    // He gets restless as the night goes on.
    const scale = 1 - this.progress * 0.5;
    return (min + this.rand() * (max - min)) * scale;
  }

  private driftSeconds(): number {
    const [early, late] = this.config.driftSeconds;
    return early + (late - early) * this.progress;
  }
}
