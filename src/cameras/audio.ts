// Camera-room sounds, all synthesised: monitor hum, the relay click of a
// splice, static on a glitch, and the crew's footsteps.

import { Synth } from "../synth";

export class CameraAudio extends Synth {
  private walking = false;

  async start(): Promise<void> {
    await this.resume();
    this.rumble(160, 0.08);
    const hum = this.ctx.createOscillator();
    hum.frequency.value = 60;
    hum.connect(this.gain(0.025, this.master));
    hum.start();
    this.scheduleStep();
  }

  relay(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.03, "bandpass", 2200, 3, 0.5);
    this.burst(t + 0.05, 0.04, "lowpass", 800, 1, 0.4);
  }

  staticBurst(): void {
    const t = this.ctx.currentTime;
    this.burst(t, 0.5, "highpass", 1500, 0.5, 0.45);
  }

  sting(): void {
    const t = this.ctx.currentTime;
    this.tone(t, "square", 440, 0.18, 0.12);
    this.tone(t + 0.2, "square", 440, 0.18, 0.12);
  }

  through(): void {
    const t = this.ctx.currentTime;
    this.tone(t, "sine", 660, 0.15, 0.12);
    this.tone(t + 0.1, "sine", 990, 0.2, 0.1);
  }

  setWalking(on: boolean): void {
    this.walking = on;
  }

  private scheduleStep(): void {
    if (this.walking) this.burst(this.ctx.currentTime, 0.08, "lowpass", 350, 1, 0.35);
    this.later(() => this.scheduleStep(), 330);
  }
}
