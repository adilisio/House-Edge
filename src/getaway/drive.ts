// Pure getaway logic: no DOM, no audio. Dee drives a grid of streets toward
// the garage; you call the turn at each junction while patrol cars and
// roadblocks close in.

export type Dir = 0 | 1 | 2 | 3; // north, east, south, west
export type Turn = "left" | "straight" | "right";

export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export interface Point {
  x: number;
  y: number;
}

/** A street between two adjacent junctions, named by its west or north end. */
export interface Edge {
  x: number;
  y: number;
  horizontal: boolean;
}

export interface DriveConfig {
  cols: number;
  rows: number;
  start: Point;
  startDir: Dir;
  garage: Point;
  /** Blocks per second. */
  speed: number;
  copSpeed: number;
  copStarts: { at: Point; dir: Dir }[];
  /** How far a patrol car sees along its street, in blocks. */
  sightBlocks: number;
  /** Fraction of a block before a junction after which a call makes Dee brake hard. */
  lateFrom: number;
  brakeSeconds: number;
  brakeHeat: number;
  /** Heat per second while a patrol car can see you. */
  seenHeatPerSecond: number;
  coolPerSecond: number;
  roadblockHeat: number;
  roadblockSeconds: number;
  /** When roadblocks go up, and how much warning the scanner gives. */
  roadblockTimes: number[];
  roadblockWarning: number;
  /** Seconds seen before the police have a look at the car. */
  madeSeconds: number;
}

export const DEFAULT_DRIVE: DriveConfig = {
  cols: 7,
  rows: 9,
  start: { x: 0, y: 8 },
  startDir: 0,
  garage: { x: 6, y: 0 },
  speed: 0.5,
  copSpeed: 0.38,
  copStarts: [
    { at: { x: 3, y: 2 }, dir: 3 },
    { at: { x: 6, y: 5 }, dir: 2 },
    { at: { x: 1, y: 3 }, dir: 1 },
  ],
  sightBlocks: 2.5,
  lateFrom: 0.8,
  brakeSeconds: 0.6,
  brakeHeat: 0.08,
  seenHeatPerSecond: 0.45,
  coolPerSecond: 0.04,
  roadblockHeat: 0.3,
  roadblockSeconds: 1.5,
  roadblockTimes: [10, 22],
  roadblockWarning: 3,
  madeSeconds: 0.4,
};

/** clean: nobody saw the car. made: the plates are known. chased: you ditched the car. */
export type DriveOutcome = "clean" | "made" | "chased";

export type DriveEvent =
  | { kind: "turned"; dir: Dir; late: boolean }
  | { kind: "forced"; dir: Dir }
  | { kind: "roadblock-warning"; edge: Edge }
  | { kind: "roadblock-live"; edge: Edge }
  | { kind: "hit-roadblock" }
  | { kind: "spotted" }
  | { kind: "lost-them" }
  | { kind: "done"; outcome: DriveOutcome };

interface Mover {
  from: Point;
  dir: Dir;
  /** 0..1 along the current block. */
  s: number;
}

export interface Roadblock {
  edge: Edge;
  liveAt: number;
}

export function turnDir(dir: Dir, turn: Turn): Dir {
  const delta = turn === "left" ? 3 : turn === "right" ? 1 : 0;
  return ((dir + delta) % 4) as Dir;
}

export function edgeOf(from: Point, dir: Dir): Edge {
  const to = { x: from.x + DX[dir], y: from.y + DY[dir] };
  return { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y), horizontal: dir === 1 || dir === 3 };
}

export function sameEdge(a: Edge, b: Edge): boolean {
  return a.x === b.x && a.y === b.y && a.horizontal === b.horizontal;
}

/** Did time pass the moment `at` during this frame? */
function crossed(before: number, now: number, at: number): boolean {
  return before <= at && now > at;
}

export function position(m: Mover): Point {
  return { x: m.from.x + DX[m.dir] * m.s, y: m.from.y + DY[m.dir] * m.s };
}

export class Getaway {
  readonly config: DriveConfig;
  car: Mover;
  cops: Mover[];
  roadblocks: Roadblock[] = [];
  /** The call for the next junction, if any, and whether it came late. */
  call: Turn | null = null;
  callLate = false;
  heat = 0;
  seenTime = 0;
  elapsed = 0;
  stall = 0;
  seen = false;
  finished: DriveOutcome | null = null;
  private blockIndex = 0;
  private rand: () => number;

  constructor(config: DriveConfig = DEFAULT_DRIVE, rand: () => number = Math.random) {
    this.config = config;
    this.rand = rand;
    this.car = { from: { ...config.start }, dir: config.startDir, s: 0 };
    this.cops = config.copStarts.map((c) => ({ from: { ...c.at }, dir: c.dir, s: 0 }));
  }

  /** The junction Dee is driving toward. */
  get nextJunction(): Point {
    return { x: this.car.from.x + DX[this.car.dir], y: this.car.from.y + DY[this.car.dir] };
  }

  /** The direction Dee will take at the next junction, as things stand. */
  plannedDir(): Dir {
    return this.resolve(this.nextJunction, this.car.dir, this.call ?? "straight").dir;
  }

  onGrid(p: Point): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.config.cols && p.y < this.config.rows;
  }

  isBlocked(edge: Edge): boolean {
    return this.roadblocks.some((r) => this.elapsed >= r.liveAt && sameEdge(r.edge, edge));
  }

  /** Call the turn for the next junction. A late call still counts but costs. */
  callTurn(turn: Turn): void {
    if (this.finished) return;
    this.call = turn;
    this.callLate = this.car.s >= this.config.lateFrom;
  }

  update(dt: number): DriveEvent[] {
    if (this.finished) return [];
    const c = this.config;
    const events: DriveEvent[] = [];
    this.elapsed += dt;

    for (const t of c.roadblockTimes) {
      if (crossed(this.elapsed - dt, this.elapsed, t - c.roadblockWarning)) {
        const edge = this.pickRoadblock();
        if (edge) {
          this.roadblocks.push({ edge, liveAt: t });
          events.push({ kind: "roadblock-warning", edge });
        }
      }
    }
    for (const r of this.roadblocks) {
      if (crossed(this.elapsed - dt, this.elapsed, r.liveAt)) events.push({ kind: "roadblock-live", edge: r.edge });
    }

    for (const cop of this.cops) this.moveCop(cop, dt);

    if (this.stall > 0) this.stall -= dt;
    else events.push(...this.moveCar(dt));
    if (this.finished) return events;

    const inSight = this.cops.some((cop) => this.sees(cop));
    if (inSight) {
      if (!this.seen) events.push({ kind: "spotted" });
      this.seenTime += dt;
      this.heat += c.seenHeatPerSecond * dt;
    } else {
      if (this.seen) events.push({ kind: "lost-them" });
      this.heat = Math.max(0, this.heat - c.coolPerSecond * dt);
    }
    this.seen = inSight;
    return events.concat(this.checkHeat());
  }

  outcome(): DriveOutcome {
    if (this.heat >= 1) return "chased";
    return this.seenTime >= this.config.madeSeconds ? "made" : "clean";
  }

  /** Can a patrol car see along its street to the getaway car? */
  sees(cop: Mover): boolean {
    const p = position(this.car);
    const q = position(cop);
    const along = cop.dir === 1 || cop.dir === 3 ? "x" : "y";
    const across = along === "x" ? "y" : "x";
    if (Math.abs(p[across] - q[across]) > 0.15) return false;
    const ahead = (p[along] - q[along]) * (along === "x" ? DX[cop.dir] : DY[cop.dir]);
    return ahead >= -0.3 && ahead <= this.config.sightBlocks;
  }

  private moveCar(dt: number): DriveEvent[] {
    const c = this.config;
    const events: DriveEvent[] = [];
    this.car.s += c.speed * dt;
    if (this.car.s < 1) return events;

    // At a junction.
    const at = this.nextJunction;
    this.car.from = at;
    this.car.s = 0;
    if (at.x === c.garage.x && at.y === c.garage.y) {
      this.finished = this.outcome();
      return [{ kind: "done", outcome: this.finished }];
    }
    const wanted = this.call ?? "straight";
    const { dir, forced } = this.resolve(at, this.car.dir, wanted);
    const late = this.call !== null && this.callLate && dir !== this.car.dir;
    if (late) {
      this.stall = c.brakeSeconds;
      this.heat += c.brakeHeat;
    }
    this.call = null;
    this.callLate = false;

    if (this.isBlocked(edgeOf(at, dir))) {
      // Straight into the roadblock: they see you, and Dee spins it around.
      const back = ((dir + 2) % 4) as Dir;
      this.car.dir = this.onGrid({ x: at.x + DX[back], y: at.y + DY[back] }) ? back : this.car.dir;
      this.stall = c.roadblockSeconds;
      this.heat += c.roadblockHeat;
      this.seenTime += c.madeSeconds;
      events.push({ kind: "hit-roadblock" });
      return events.concat(this.checkHeat());
    }
    this.car.dir = dir;
    events.push(forced ? { kind: "forced", dir } : { kind: "turned", dir, late });
    return events.concat(this.checkHeat());
  }

  /** Where Dee goes at a junction: your call if the street exists, else her pick. */
  private resolve(at: Point, dir: Dir, turn: Turn): { dir: Dir; forced: boolean } {
    const wanted = turnDir(dir, turn);
    if (this.onGrid({ x: at.x + DX[wanted], y: at.y + DY[wanted] })) return { dir: wanted, forced: false };
    for (const t of ["straight", "right", "left"] as Turn[]) {
      const d = turnDir(dir, t);
      if (this.onGrid({ x: at.x + DX[d], y: at.y + DY[d] })) return { dir: d, forced: true };
    }
    return { dir: ((dir + 2) % 4) as Dir, forced: true };
  }

  private moveCop(cop: Mover, dt: number): void {
    cop.s += this.config.copSpeed * dt;
    if (cop.s < 1) return;
    cop.from = { x: cop.from.x + DX[cop.dir], y: cop.from.y + DY[cop.dir] };
    cop.s = 0;
    // Patrols wander: any street but straight back, never off the map.
    const options = (["straight", "left", "right"] as Turn[])
      .map((t) => turnDir(cop.dir, t))
      .filter((d) => this.onGrid({ x: cop.from.x + DX[d], y: cop.from.y + DY[d] }));
    cop.dir = options.length ? options[Math.floor(this.rand() * options.length)] : (((cop.dir + 2) % 4) as Dir);
  }

  /** Block a street two or three junctions ahead, on the way to the garage. */
  private pickRoadblock(): Edge | null {
    const g = this.config.garage;
    let p = this.nextJunction;
    const steps = 1 + Math.floor(this.rand() * 2);
    for (let i = 0; i < steps; i++) {
      const dir = this.towardGarage(p);
      if (dir === null) return null;
      p = { x: p.x + DX[dir], y: p.y + DY[dir] };
    }
    if (p.x === g.x && p.y === g.y) return null;
    const dir = this.towardGarage(p);
    if (dir === null) return null;
    this.blockIndex++;
    return edgeOf(p, dir);
  }

  private towardGarage(p: Point): Dir | null {
    const g = this.config.garage;
    const dx = g.x - p.x;
    const dy = g.y - p.y;
    if (dx === 0 && dy === 0) return null;
    const horizontalFirst = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && this.blockIndex % 2 === 0);
    if (horizontalFirst && dx !== 0) return dx > 0 ? 1 : 3;
    if (dy !== 0) return dy > 0 ? 2 : 0;
    return dx > 0 ? 1 : 3;
  }

  private checkHeat(): DriveEvent[] {
    if (this.heat < 1 || this.finished) return [];
    this.heat = 1;
    this.finished = "chased";
    return [{ kind: "done", outcome: "chased" }];
  }
}
