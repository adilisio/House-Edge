// Story sounds, all synthesised like the hands-on scenes': a bed of room tone
// for each place with the odd sound that belongs there, crossfaded as the
// panel moves, and stings for title cards, freeze-frames and choices.

import { Synth } from "../synth";

type Event =
  | "bass"
  | "buzz"
  | "car"
  | "chatter"
  | "chime"
  | "chips"
  | "clink"
  | "crackle"
  | "crickets"
  | "drip"
  | "gust"
  | "horn"
  | "siren"
  | "tick";

interface Ambience {
  /** Room tone: noise under a lowpass, as [cutoff Hz, level]. */
  room: [number, number];
  /** A steady low note under it: a fridge, an engine, the lights. */
  hum?: [number, number];
  /** Sounds that come and go, with the average gap between them in ms. */
  events?: [Event, number][];
}

const AMBIENCE: Record<string, Ambience> = {
  "casino-exterior": { room: [500, 0.05], events: [["car", 4000], ["horn", 11000]] },
  "casino-floor": { room: [900, 0.06], events: [["chime", 2600], ["chatter", 1400], ["chips", 3200]] },
  "city-map": { room: [300, 0.03] },
  "lucky-strike": { room: [700, 0.05], hum: [120, 0.02], events: [["chatter", 2400], ["chips", 4500], ["buzz", 3500]] },
  alley: { room: [250, 0.05], events: [["drip", 1600], ["car", 8000]] },
  "city-street": { room: [800, 0.06], events: [["car", 2200], ["horn", 6000]] },
  diner: { room: [600, 0.05], hum: [60, 0.03], events: [["clink", 3000], ["chatter", 3500]] },
  gallery: { room: [400, 0.025], events: [["clink", 9000]] },
  "street-night": { room: [300, 0.04], events: [["crickets", 1400], ["car", 9000]] },
  "crane-window": { room: [300, 0.03], events: [["tick", 1000], ["crackle", 700]] },
  hideout: { room: [350, 0.04], hum: [100, 0.02], events: [["drip", 5000], ["clink", 7000]] },
  "office-hall": { room: [300, 0.03], events: [["tick", 1000]] },
  rooftop: { room: [450, 0.06], events: [["gust", 5000], ["siren", 14000]] },
  bar: { room: [600, 0.05], events: [["bass", 640], ["clink", 2600], ["chatter", 2200]] },
  "dee-car": { room: [200, 0.06], hum: [45, 0.05], events: [["car", 5000]] },
  "high-limit": { room: [500, 0.035], events: [["chips", 2400], ["clink", 5500]] },
  corridor: { room: [400, 0.03], hum: [120, 0.025] },
  "vault-floor": { room: [200, 0.05], hum: [55, 0.03] },
};

/** The places' sounds overall, measured against the hands-on scenes: about as loud as the poker room. */
const BED_LEVEL = 1.8;

/** A walking line for the Blue Lantern's bass player: A minor, more or less. */
const BASS = [55, 65.4, 73.4, 82.4, 98, 82.4, 73.4, 65.4];

export class StoryAudio extends Synth {
  private bed: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private place = "";
  /** Bumped on every change of place, so a fading bed's events stop. */
  private epoch = 0;
  private paused = false;
  private bassStep = 0;
  private tickStep = 0;

  async start(): Promise<void> {
    await this.resume();
  }

  /** Crossfade to a place's room tone and sounds. */
  setPlace(place: string): void {
    if (place === this.place) return;
    this.place = place;
    this.fadeOut();
    const epoch = this.epoch;
    const amb = AMBIENCE[place] ?? AMBIENCE["city-map"];
    const t = this.ctx.currentTime;
    const bed = this.gain(0, this.master);
    bed.gain.setTargetAtTime(BED_LEVEL, t, 0.4);
    this.bed = bed;

    const room = this.ctx.createBufferSource();
    room.buffer = this.noise;
    room.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = amb.room[0];
    room.connect(lp).connect(this.gain(amb.room[1], bed));
    room.start(t, Math.random() * 1.5);
    this.sources.push(room);

    if (amb.hum) {
      const [freq, level] = amb.hum;
      const hum = this.ctx.createOscillator();
      hum.type = "sawtooth";
      hum.frequency.value = freq;
      const hlp = this.ctx.createBiquadFilter();
      hlp.type = "lowpass";
      hlp.frequency.value = freq * 3;
      hum.connect(hlp).connect(this.gain(level, bed));
      hum.start(t);
      this.sources.push(hum);
    }

    for (const [event, gap] of amb.events ?? []) this.schedule(event, gap, epoch, bed);
  }

  /** Fade the place out: the end screen is quiet. */
  silence(): void {
    this.place = "";
    this.fadeOut();
  }

  /** Hold everything while a hands-on scene plays its own sound, or the page is hidden. */
  pause(on: boolean): void {
    this.paused = on;
    this.master.gain.setTargetAtTime(on ? 0 : 0.9, this.ctx.currentTime, 0.15);
  }

  /** A title card: a brassy two-hit stab. */
  card(): void {
    const t = this.ctx.currentTime;
    for (const f of [110, 138.6, 164.8]) this.tone(t, "sawtooth", f, 0.25, 0.035);
    for (const f of [103.8, 130.8, 155.6]) this.tone(t + 0.28, "sawtooth", f, 1.1, 0.04);
    this.burst(t, 0.3, "lowpass", 180, 1, 0.5);
    this.burst(t + 0.28, 0.6, "lowpass", 160, 1, 0.6);
  }

  /** A freeze-frame: a camera shutter and a thump. */
  freeze(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.03, "highpass", 4000, 1, 0.4);
    this.burst(t + 0.05, 0.06, "bandpass", 1300, 2, 0.25);
    this.tone(t, "sine", 70, 0.35, 0.3);
  }

  /** A choice made: a chip set down on felt. */
  choice(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.03, "bandpass", 2800, 4, 0.25);
    this.tone(t, "sine", 3200, 0.04, 0.04);
  }

  private fadeOut(): void {
    this.epoch++;
    if (!this.bed) return;
    const t = this.ctx.currentTime;
    const old = this.bed;
    old.gain.setTargetAtTime(0, t, 0.3);
    for (const s of this.sources) s.stop(t + 1.5);
    this.later(() => old.disconnect(), 1600);
    this.bed = null;
    this.sources = [];
  }

  /** Play an event now and then, until the place changes. */
  private schedule(event: Event, gap: number, epoch: number, bed: GainNode): void {
    this.later(() => {
      if (epoch !== this.epoch) return;
      if (!this.paused) this.play(event, bed);
      this.schedule(event, gap, epoch, bed);
    }, gap * (0.5 + Math.random()));
  }

  private play(event: Event, bed: GainNode): void {
    const t = this.ctx.currentTime;
    const r = Math.random;
    switch (event) {
      case "bass": {
        const f = BASS[this.bassStep++ % BASS.length];
        this.tone(t, "triangle", f, 0.45, 0.12, bed);
        break;
      }
      case "buzz":
        // The neon sign stutters.
        this.tone(t, "sawtooth", 120, 0.12, 0.03, bed);
        this.tone(t + 0.16, "sawtooth", 120, 0.06, 0.02, bed);
        break;
      case "car":
        this.swell(t, 300, 1200, 1.6, 0.09, bed);
        break;
      case "chatter":
        // A murmur: a few vowel-ish blips at talking pitch.
        for (let i = 0, at = t; i < 3 + Math.floor(r() * 4); i++, at += 0.08 + r() * 0.1) {
          this.burst(at, 0.09, "bandpass", 350 + r() * 600, 5, 0.05, bed);
        }
        break;
      case "chime":
        this.tone(t, "sine", 1568, 0.4, 0.02, bed);
        this.tone(t + 0.12, "sine", 2093, 0.6, 0.02, bed);
        break;
      case "chips":
        for (let i = 0; i < 3; i++) this.burst(t + i * 0.05, 0.03, "bandpass", 2600 + r() * 900, 4, 0.08, bed);
        break;
      case "clink":
        this.tone(t, "sine", 2600, 0.3, 0.02, bed);
        this.tone(t, "sine", 3900, 0.2, 0.012, bed);
        break;
      case "crackle":
        for (let i = 0, at = t; i < 2 + Math.floor(r() * 4); i++, at += 0.03 + r() * 0.12) {
          this.burst(at, 0.015, "highpass", 2000, 1, 0.06 + r() * 0.08, bed);
        }
        break;
      case "crickets":
        for (let i = 0; i < 4; i++) this.tone(t + i * 0.06, "sine", 4400, 0.03, 0.008, bed);
        break;
      case "drip":
        this.tone(t, "sine", 1400, 0.08, 0.04, bed);
        this.tone(t + 0.03, "sine", 2100, 0.05, 0.02, bed);
        break;
      case "gust":
        this.swell(t, 300, 800, 2.6, 0.12, bed);
        break;
      case "horn":
        this.tone(t, "square", 392, 0.3, 0.008, bed);
        this.tone(t, "square", 494, 0.3, 0.008, bed);
        break;
      case "siren":
        for (let i = 0; i < 4; i++) this.tone(t + i * 0.5, "triangle", i % 2 ? 850 : 650, 0.5, 0.008, bed);
        break;
      case "tick":
        this.burst(t, 0.02, "highpass", this.tickStep++ % 2 ? 3000 : 2400, 1, 0.08, bed);
        break;
    }
  }

  /** Noise that rises and falls, sweeping its filter: a passing car, a gust. */
  private swell(t: number, from: number, peak: number, dur: number, gain: number, dest: AudioNode): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(from, t);
    f.frequency.linearRampToValueAtTime(peak, t + dur / 2);
    f.frequency.linearRampToValueAtTime(from, t + dur);
    const g = this.gain(0, dest);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur / 2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

export const PLACES_WITH_SOUND = Object.keys(AMBIENCE);
