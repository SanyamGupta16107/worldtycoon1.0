class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : 0.04, this.ctx.currentTime, 0.1);
    }
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  public playDiceRoll() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Simulate 5 rapid rhythmic rattle clicks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320 + Math.random() * 240, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.06);
        } catch {}
      }, i * 70);
    }
  }

  public playMoveStep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {}
  }

  public playCashRegister() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.28);
        } catch {}
      }, idx * 60);
    });
  }

  public playRentPayment() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [440, 370, 311.13];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.22);
        } catch {}
      }, idx * 70);
    });
  }

  public playUpgrade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.32);
        } catch {}
      }, idx * 75);
    });
  }

  public playEventNotification() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [350, 700, 1050];
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.22);
        } catch {}
      }, idx * 80);
    });
  }

  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 150 },
      { f: 659.25, d: 150 },
      { f: 783.99, d: 150 },
      { f: 1046.50, d: 450 },
    ];

    let delay = 0;
    melody.forEach(note => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (note.d / 1000));
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + (note.d / 1000) + 0.05);
        } catch {}
      }, delay);
      delay += note.d;
    });
  }

  public startAmbientTrack() {
    if (typeof window === 'undefined') return;
    if (this.ambientOscs.length > 0) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMusicMuted ? 0 : 0.035, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      const chord = [73.42, 110.00, 146.83];
      this.ambientOscs = chord.map(freq => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
        osc.connect(this.ambientGain!);
        osc.start();
        return osc;
      });
    } catch {}
  }

  public playStockMarketSiren() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-tech emergency trading floor siren klaxon (2 rising and falling sweeps)
      for (let i = 0; i < 3; i++) {
        const sweepStart = now + i * 0.35;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, sweepStart);
        osc.frequency.linearRampToValueAtTime(880, sweepStart + 0.18);
        osc.frequency.linearRampToValueAtTime(440, sweepStart + 0.32);

        gain.gain.setValueAtTime(0.001, sweepStart);
        gain.gain.linearRampToValueAtTime(0.12, sweepStart + 0.05);
        gain.gain.linearRampToValueAtTime(0.1, sweepStart + 0.25);
        gain.gain.linearRampToValueAtTime(0.001, sweepStart + 0.34);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(sweepStart);
        osc.stop(sweepStart + 0.35);
      }
    } catch {}
  }

  public stopAmbientTrack() {
    this.ambientOscs.forEach(o => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    this.ambientOscs = [];
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {}
      this.ambientGain = null;
    }
  }
}

export const audio = new ProceduralAudioEngine();
