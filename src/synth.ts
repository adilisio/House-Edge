// Shared Web Audio building blocks: noise bursts and decaying tones. Each
// scene's audio class extends this and adds its own sounds.

export class Synth {
  protected ctx: AudioContext;
  protected master: GainNode;
  protected noise: AudioBuffer;
  protected timers: number[] = [];

  constructor() {
    this.ctx = new AudioContext();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.connect(this.ctx.destination);
    this.master = this.gain(0.9, comp);
    this.noise = this.makeNoise(2);
  }

  async resume(): Promise<void> {
    await this.ctx.resume();
  }

  stop(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    void this.ctx.close();
  }

  protected later(fn: () => void, ms: number): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  /** Looped noise through a lowpass: room tone. */
  protected rumble(freq: number, level: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = freq;
    src.connect(lp).connect(this.gain(level, this.master));
    src.start();
  }

  protected burst(
    t: number,
    dur: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    gain: number,
    dest: AudioNode = this.master,
  ): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.gain(0, dest);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  protected tone(t: number, type: OscillatorType, freq: number, dur: number, gain: number): void {
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

  protected gain(value: number, dest: AudioNode): GainNode {
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
