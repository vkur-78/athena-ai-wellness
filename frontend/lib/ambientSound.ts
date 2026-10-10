// Web Audio API pure synthesizer for Athena Living Replay
// Warm 432Hz harmonic drone and gentle crystalline chimes with zero external file dependencies.

class ReplayAmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private muted: boolean = false;
  private volume: number = 0.25;

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public async startAmbient(): Promise<void> {
    if (this.isPlaying || this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('[AmbientSynth] resume error:', e);
        return;
      }
    }

    try {
      const now = this.ctx.currentTime;

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(this.volume, now + 3.0); // 3s gentle fade in

      // Warm low-pass filter to remove harsh frequencies
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(520, now);
      this.filter.Q.setValueAtTime(1.2, now);

      // Root 432 Hz Warm Harmonic
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(216, now); // A3 (Warm sub-octave)

      // Fifth harmonic (E4 ~ 324 Hz)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(324, now);

      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.osc1.start(now);
      this.osc2.start(now);

      this.isPlaying = true;
    } catch (err) {
      console.warn('[AmbientSynth] startAmbient failed:', err);
    }
  }

  public stopAmbient(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.osc1?.disconnect();
          this.osc2?.disconnect();
          this.osc1 = null;
          this.osc2 = null;
        } catch (e) {
          // Handled
        }
        this.isPlaying = false;
      }, 1600);
    } catch (e) {
      this.isPlaying = false;
    }
  }

  public playChime(): void {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = 'sine';
      // Harmonic high bell (864 Hz - octave of 432Hz)
      chimeOsc.frequency.setValueAtTime(864, now);
      chimeOsc.frequency.exponentialRampToValueAtTime(432, now + 1.2);

      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(now);
      chimeOsc.stop(now + 1.8);
    } catch (e) {
      // Handled
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    if (this.muted !== muted) {
      this.toggleMute();
    }
  }
}

export const ambientSound = new ReplayAmbientSynthesizer();
