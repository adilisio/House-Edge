// Pure camera-loop logic: no DOM, no audio. Each camera shows a live feed and
// Theo's recording. Their fans (and on later cameras, lights) drift in and out
// of step; you splice the loop in when they match, then send the crew through
// before the loop runs out.

export interface CameraSpec {
  /** Seconds between moments when the fans line up. */
  fanBeat: number;
  /** Seconds between moments when the flickers line up; null = no flicker cue. */
  flickerBeat: number | null;
  /** How far off (seconds from a perfect match) a splice can be and stay invisible. */
  tolerance: number;
  /** Seconds the loop holds once spliced. */
  window: number;
  /** Seconds the crew needs to cross the corridor. */
  crossing: number;
  /** Seconds the crew takes to reach this camera's door. */
  approach: number;
  moths: boolean;
}

export const CAMERAS: CameraSpec[] = [
  { fanBeat: 3, flickerBeat: null, tolerance: 0.5, window: 8, crossing: 3, approach: 0, moths: false },
  { fanBeat: 3, flickerBeat: 6, tolerance: 0.35, window: 6.5, crossing: 3.5, approach: 3, moths: false },
  { fanBeat: 2.4, flickerBeat: 4.8, tolerance: 0.25, window: 5, crossing: 4, approach: 3.5, moths: true },
];

export const MOTH_SECONDS = 1.2;

/** clean: invisible cuts, nobody on tape. glitched: a jump in the footage. seen: the crew on tape. */
export type LoopOutcome = "clean" | "glitched" | "seen";

export type Phase = "match" | "looped" | "crossing" | "done";

export type LoopEvent =
  | { kind: "splice"; clean: boolean; error: number; moth: boolean }
  | { kind: "go" }
  | { kind: "arrived" }
  | { kind: "loop-ended"; crewInShot: boolean }
  | { kind: "through"; camera: number }
  | { kind: "done"; outcome: LoopOutcome };

/** Distance from 0 of a 0..1 phase, as a 0..0.5 fraction of a cycle. */
const cycleDistance = (p: number) => Math.min(p, 1 - p);
const frac = (x: number) => x - Math.floor(x);

export class CameraLoop {
  readonly cameras: CameraSpec[];
  camera = 0;
  phase: Phase = "match";
  /** Seconds since this camera came up; drives both feeds. */
  clock = 0;
  elapsed = 0;
  windowLeft = 0;
  crossLeft = 0;
  approachLeft: number;
  glitches = 0;
  seen = 0;
  /** Start time of the current moth on the live feed, if any. */
  mothAt: number | null = null;
  private nextMoth = 0;
  private offset: number;
  private rand: () => number;

  constructor(cameras: CameraSpec[] = CAMERAS, rand: () => number = Math.random) {
    this.cameras = cameras;
    this.rand = rand;
    this.offset = this.newOffset();
    this.approachLeft = cameras[0].approach;
    this.scheduleMoth();
  }

  get spec(): CameraSpec {
    return this.cameras[Math.min(this.camera, this.cameras.length - 1)];
  }

  get crewReady(): boolean {
    return this.approachLeft <= 0;
  }

  /** Live fan phase relative to the recording, 0..1 of a blade step. */
  get fanOffset(): number {
    return frac(this.clock / this.spec.fanBeat + this.offset);
  }

  /** Live flicker phase relative to the recording; null when this camera has none. */
  get flickerOffset(): number | null {
    const beat = this.spec.flickerBeat;
    // Half the fan's rate, so every other fan match is a full match.
    return beat === null ? null : frac(this.clock / beat + this.offset / 2);
  }

  get mothVisible(): boolean {
    return this.mothAt !== null && this.clock - this.mothAt < MOTH_SECONDS;
  }

  /** Seconds from a perfect match on the worst cue. */
  matchError(): number {
    const s = this.spec;
    let err = cycleDistance(this.fanOffset) * s.fanBeat;
    const flicker = this.flickerOffset;
    if (flicker !== null && s.flickerBeat !== null) {
      err = Math.max(err, cycleDistance(flicker) * s.flickerBeat);
    }
    return err;
  }

  /** Cut the recording into the live feed. */
  splice(): LoopEvent[] {
    if (this.phase !== "match") return [];
    const error = this.matchError();
    const moth = this.mothVisible;
    const clean = error <= this.spec.tolerance && !moth;
    if (!clean) this.glitches++;
    this.phase = "looped";
    this.windowLeft = this.spec.window;
    return [{ kind: "splice", clean, error, moth }];
  }

  /** Send the crew through. Only once the loop is up and they're at the door. */
  go(): LoopEvent[] {
    if (this.phase !== "looped" || !this.crewReady) return [];
    this.phase = "crossing";
    this.crossLeft = this.spec.crossing;
    return [{ kind: "go" }];
  }

  update(dt: number): LoopEvent[] {
    if (this.phase === "done") return [];
    const events: LoopEvent[] = [];
    this.elapsed += dt;
    this.clock += dt;

    if (this.approachLeft > 0) {
      this.approachLeft -= dt;
      if (this.approachLeft <= 0) events.push({ kind: "arrived" });
    }

    if (this.spec.moths && this.clock >= this.nextMoth) {
      this.mothAt = this.clock;
      this.scheduleMoth();
    }

    if (this.phase === "looped" || this.phase === "crossing") {
      const hadLoop = this.windowLeft > 0;
      this.windowLeft -= dt;
      if (this.phase === "crossing") this.crossLeft -= dt;

      if (this.phase === "crossing" && this.crossLeft <= 0) {
        events.push(...this.through());
      } else if (hadLoop && this.windowLeft <= 0) {
        const crewInShot = this.phase === "crossing";
        events.push({ kind: "loop-ended", crewInShot });
        // In shot, they're on tape but keep going. Otherwise nobody went: splice again.
        if (crewInShot) this.seen++;
        else this.phase = "match";
      }
    }
    return events;
  }

  outcome(): LoopOutcome {
    if (this.seen > 0) return "seen";
    return this.glitches > 0 ? "glitched" : "clean";
  }

  private through(): LoopEvent[] {
    const events: LoopEvent[] = [{ kind: "through", camera: this.camera }];
    this.camera++;
    if (this.camera >= this.cameras.length) {
      this.phase = "done";
      events.push({ kind: "done", outcome: this.outcome() });
      return events;
    }
    this.phase = "match";
    this.clock = 0;
    this.offset = this.newOffset();
    this.approachLeft = this.spec.approach;
    this.mothAt = null;
    this.scheduleMoth();
    return events;
  }

  /** Start each camera away from a match so the first one takes a moment. */
  private newOffset(): number {
    return 0.25 + this.rand() * 0.5;
  }

  private scheduleMoth(): void {
    this.nextMoth = this.clock + 2 + this.rand() * 4;
  }
}
