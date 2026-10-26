// All sound is synthesised with Web Audio, so the prototype needs no assets.
// The tumbler click is deliberately close to the dial's tick: lower and
// woodier rather than much louder, so you have to listen for it.

export class VaultAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private noise: AudioBuffer;
  private chatterBus: GainNode;
  private stepsBus: GainNode;
  private timers: number[] = [];
  private chatterUrgency = 0;
  private stepsLevel = 0;

  constructor() {
    this.ctx = new AudioContext();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.connect(this.ctx.destination);
    this.master = this.gain(0.9, comp);
    this.noise = this.makeNoise(2);
    // Leo is across the room, so his voice is muffled.
    const muffle = this.ctx.createBiquadFilter();
    muffle.type = "lowpass";
    muffle.frequency.value = 1400;
    muffle.connect(this.master);
    this.chatterBus = this.gain(0, muffle);
    this.stepsBus = this.gain(0, this.master);
  }

  async start(): Promise<void> {
    await this.ctx.resume();
    this.startAmbience();
    this.scheduleSyllable();
    this.scheduleStep();
  }

  stop(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    void this.ctx.close();
  }

  /** 0..1, how loud Leo's chatter is right now. */
  setChatter(level: number, urgency: number): void {
    this.chatterUrgency = urgency;
    this.chatterBus.gain.setTargetAtTime(level * 0.5, this.ctx.currentTime, 0.4);
  }

  /** 0..1, how close the guard's footsteps are. */
  setFootsteps(level: number): void {
    this.stepsLevel = level;
    this.stepsBus.gain.setTargetAtTime(level, this.ctx.currentTime, 0.5);
  }

  tick(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.012, "bandpass", 4200, 1.2, 0.05 * (0.85 + Math.random() * 0.3));
  }

  click(gain: number): void {
    const t = this.ctx.currentTime + 0.004;
    this.burst(t, 0.02, "bandpass", 1700, 3, gain * 0.5);
    this.ping(t, 1180, 0.05, gain * 0.35);
    this.ping(t, 2650, 0.03, gain * 0.15);
  }

  clunk(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.3, "lowpass", 500, 0.8, 0.9);
    this.tone(t, "square", 68, 0.28, 0.35);
    this.tone(t + 0.05, "square", 52, 0.25, 0.25);
  }

  tumblerFall(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.03, "bandpass", 1500, 2, 0.5);
    this.burst(t + 0.07, 0.05, "lowpass", 900, 1, 0.6);
    this.tone(t + 0.07, "sine", 140, 0.12, 0.4);
  }

  vaultOpen(): void {
    const t = this.ctx.currentTime;
    [0, 0.18, 0.36].forEach((d) => {
      this.burst(t + d, 0.08, "lowpass", 700, 1, 0.7);
      this.tone(t + d, "sine", 90, 0.15, 0.4);
    });
    this.burst(t + 0.7, 1.4, "lowpass", 300, 0.7, 0.5);
  }

  private startAmbience(): void {
    // Casino-floor rumble: looped, heavily filtered noise.
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    src.connect(lp).connect(this.gain(0.12, this.master));
    src.start();
    const chime = () => {
      const t = this.ctx.currentTime;
      const base = [523, 659, 784, 1047][Math.floor(Math.random() * 4)];
      [0, 0.09, 0.18].forEach((d, i) => this.ping(t + d, base * [1, 1.25, 1.5][i], 0.4, 0.012));
      this.timers.push(window.setTimeout(chime, 3000 + Math.random() * 6000));
    };
    this.timers.push(window.setTimeout(chime, 2000));
  }

  /** A babble syllable: a buzzy voice through two moving formants. */
  private scheduleSyllable(): void {
    const urgent = this.chatterUrgency;
    const t = this.ctx.currentTime;
    const len = (0.09 + Math.random() * 0.14) * (1 - urgent * 0.35);
    const pitch = 105 + Math.random() * 35 + urgent * 30;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.linearRampToValueAtTime(pitch * (0.9 + Math.random() * 0.25), t + len);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5, t + len * 0.25);
    env.gain.linearRampToValueAtTime(0, t + len);
    for (const [lo, hi] of [[300, 850], [900, 2300]]) {
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 6;
      f.frequency.value = lo + Math.random() * (hi - lo);
      osc.connect(f).connect(env);
    }
    env.connect(this.chatterBus);
    osc.start(t);
    osc.stop(t + len + 0.02);
    // Words run together, with a pause between phrases.
    const pause = Math.random() < 0.12 ? 0.4 + Math.random() * 0.8 : 0.02;
    this.timers.push(window.setTimeout(() => this.scheduleSyllable(), (len + pause) * 1000));
  }

  private scheduleStep(): void {
    if (this.stepsLevel > 0.01) {
      const t = this.ctx.currentTime;
      const g = this.gain(0, this.stepsBus);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 220;
      src.connect(lp).connect(g);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      src.start(t, Math.random());
      src.stop(t + 0.2);
    }
    this.timers.push(window.setTimeout(() => this.scheduleStep(), 560));
  }

  private burst(
    t: number,
    dur: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    gain: number,
  ): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.gain(0, this.master);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  private ping(t: number, freq: number, dur: number, gain: number): void {
    this.tone(t, "sine", freq, dur, gain);
  }

  private tone(t: number, type: OscillatorType, freq: number, dur: number, gain: number): void {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.gain(0, this.master);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private gain(value: number, dest: AudioNode): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = value;
    g.connect(dest);
    return g;
  }

  private makeNoise(seconds: number): AudioBuffer {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
}
