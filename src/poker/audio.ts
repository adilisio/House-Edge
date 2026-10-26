// Poker-table sounds, all synthesised: chips on felt, a knuckle tap, a
// heartbeat while you hold a stare, and a sting when he looks at Vince.

import { Synth } from "../synth";

export class PokerAudio extends Synth {
  private heartbeat = false;

  async start(): Promise<void> {
    await this.resume();
    this.rumble(280, 0.1);
    this.scheduleBeat();
  }

  chips(count: number): void {
    const t = this.ctx.currentTime;
    for (let i = 0; i < count; i++) {
      const at = t + i * (0.045 + Math.random() * 0.03);
      this.burst(at, 0.03, "bandpass", 2600 + Math.random() * 900, 4, 0.35);
      this.tone(at, "sine", 3100 + Math.random() * 600, 0.04, 0.05);
    }
  }

  knock(): void {
    const t = this.ctx.currentTime;
    [0, 0.14].forEach((d) => this.burst(t + d, 0.06, "lowpass", 400, 1, 0.6));
  }

  sting(): void {
    const t = this.ctx.currentTime;
    this.tone(t, "sawtooth", 98, 0.5, 0.12);
    this.tone(t, "sawtooth", 104, 0.5, 0.1);
  }

  tell(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.15, "bandpass", 900, 2, 0.4);
  }

  setHeartbeat(on: boolean): void {
    this.heartbeat = on;
  }

  private scheduleBeat(): void {
    if (this.heartbeat) {
      const t = this.ctx.currentTime;
      this.tone(t, "sine", 55, 0.12, 0.5);
      this.tone(t + 0.16, "sine", 50, 0.12, 0.35);
    }
    this.later(() => this.scheduleBeat(), 620);
  }
}
