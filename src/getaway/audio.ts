// Getaway sounds, all synthesised: the engine, tyre squeal, a two-tone
// siren while a patrol can see you, and scanner static.

import { Synth } from "../synth";

export class GetawayAudio extends Synth {
  private engine: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private siren: OscillatorNode | null = null;

  async start(): Promise<void> {
    await this.resume();
    this.rumble(200, 0.07);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    lp.connect(this.gain(0.22, this.master));
    this.engine = this.ctx.createOscillator();
    this.engine.type = "sawtooth";
    this.engine.frequency.value = 48;
    this.engine.connect(lp);
    this.engine.start();

    this.sirenGain = this.gain(0, this.master);
    this.siren = this.ctx.createOscillator();
    this.siren.type = "triangle";
    this.siren.frequency.value = 700;
    this.siren.connect(this.sirenGain);
    this.siren.start();
    this.wail();
  }

  /** 0 = idling, 1 = full speed. */
  setEngine(level: number): void {
    this.engine?.frequency.setTargetAtTime(32 + level * 22, this.ctx.currentTime, 0.15);
  }

  setSiren(on: boolean): void {
    this.sirenGain?.gain.setTargetAtTime(on ? 0.06 : 0, this.ctx.currentTime, 0.2);
  }

  screech(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.45, "bandpass", 2400, 6, 0.35);
    this.tone(t, "sawtooth", 1250, 0.4, 0.04);
  }

  crash(): void {
    const t = this.ctx.currentTime;
    this.screech();
    this.burst(t + 0.25, 0.4, "lowpass", 600, 0.8, 0.7);
  }

  radio(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.25, "bandpass", 1800, 1.5, 0.25);
    this.tone(t + 0.25, "square", 1000, 0.08, 0.05);
  }

  /** Two-tone siren: alternate pitch every half second. */
  private wail(): void {
    if (this.siren) {
      const high = this.siren.frequency.value < 800;
      this.siren.frequency.setValueAtTime(high ? 960 : 720, this.ctx.currentTime);
    }
    this.later(() => this.wail(), 480);
  }
}
