/**
 * High-Octane Synthesized Audio & Music Engine using standard Web Audio API.
 * Includes procedural synthwave/cyberpunk adrenaline background music and arcade SFX.
 * Zero external audio files, zero CORS latency, 100% reliable offline performance.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private sfxVolume: number = 0.6;
  private musicVolume: number = 0.45;

  // Master BGM Nodes
  private bgmGainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Sequencer State
  private isBgmPlaying: boolean = false;
  private bgmTimerId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private bpm: number = 138;
  private currentIntensity: number = 1; // 1 to 6
  private isSlowMo: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master Compressor to prevent clipping
        this.compressorNode = this.ctx.createDynamicsCompressor();
        this.compressorNode.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressorNode.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressorNode.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.compressorNode.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressorNode.release.setValueAtTime(0.15, this.ctx.currentTime);
        this.compressorNode.connect(this.ctx.destination);

        // BGM Gain node
        this.bgmGainNode = this.ctx.createGain();
        this.bgmGainNode.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
        this.bgmGainNode.connect(this.compressorNode);

        // Pre-create 1-second white noise buffer for drums
        const bufferSize = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // --- Configuration ---
  public setEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.bgmGainNode && this.ctx) {
      this.bgmGainNode.gain.setValueAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime);
    }
    if (enabled && !this.isBgmPlaying) {
      this.startBgm();
    } else if (!enabled && this.isBgmPlaying) {
      this.stopBgm();
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGainNode && this.ctx && this.musicEnabled) {
      this.bgmGainNode.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public setMusicIntensity(level: number, speedMultiplier: number, slowMo: boolean = false) {
    this.currentIntensity = level;
    this.isSlowMo = slowMo;
    // Dynamically scale BPM with game speed (134 BPM -> 146 BPM)
    const targetBpm = slowMo ? 90 : Math.min(148, 134 + (speedMultiplier - 1.0) * 10);
    this.bpm = targetBpm;
  }

  // =========================================================================
  // PROCEDURAL ADRENALINE BGM ENGINE (Web Audio Clock Sequencer)
  // =========================================================================

  public startBgm() {
    this.initCtx();
    if (!this.ctx || this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    if (this.bgmGainNode) {
      this.bgmGainNode.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
    }

    // High frequency scheduler loop
    const scheduler = () => {
      if (!this.isBgmPlaying || !this.ctx) return;

      const scheduleAheadTime = 0.12; // 120ms lookahead
      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleStep(this.currentStep, this.nextStepTime);
        const stepTime = 60 / this.bpm / 4; // 16th note duration
        this.nextStepTime += stepTime;
        this.currentStep = (this.currentStep + 1) % 64; // 4-bar phrase (64 steps)
      }
    };

    this.bgmTimerId = window.setInterval(scheduler, 25);
  }

  public pauseBgm() {
    this.stopBgm();
  }

  public resumeBgm() {
    if (this.musicEnabled) {
      this.startBgm();
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimerId !== null) {
      clearInterval(this.bgmTimerId);
      this.bgmTimerId = null;
    }
  }

  /**
   * Schedules a single 16th-note step across all synthesizer drum and instrument tracks.
   */
  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.bgmGainNode || !this.musicEnabled) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Chord progression in D Minor (Dm -> Bb -> F -> C/Am)
    // Root frequencies: D2 (73.42Hz), Bb1 (58.27Hz), F2 (87.31Hz), C2 (65.41Hz)
    const roots = [73.42, 58.27, 87.31, 65.41];
    const currentRoot = roots[bar];

    // --- 1. KICK DRUM (Four-on-the-floor driving beat on steps 0, 4, 8, 12) ---
    if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
      this.playSynthKick(time);
    }

    // --- 2. SNARE / CLAP (Beats 4 and 12, with ghost notes on higher intensity) ---
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSynthSnare(time);
    } else if (this.currentIntensity >= 4 && (stepInBar === 14 || stepInBar === 15) && bar === 3) {
      // Fast fill at the end of phrase
      this.playSynthSnare(time, 0.4);
    }

    // --- 3. HI-HAT (Ticking driving rhythm on every 8th note or 16th note) ---
    if (this.currentIntensity >= 2 || stepInBar % 2 === 0) {
      const isAccent = stepInBar % 4 === 2;
      this.playSynthHiHat(time, isAccent ? 0.45 : 0.22);
    }

    // --- 4. DRIVING CYBER BASS (Rolling 16th-note bassline) ---
    // Octave and rhythmic variation
    const bassOctave = (stepInBar % 2 === 1) ? 2 : 1;
    const bassFreq = currentRoot * bassOctave;
    this.playSynthBass(time, bassFreq, stepInBar);

    // --- 5. ADRENALINE SYNTH ARPEGGIO (Lead Pentatonic Motif when level >= 2) ---
    if (this.currentIntensity >= 2) {
      this.playSynthArp(time, stepInBar, bar);
    }
  }

  // --- Drum Synthesizers ---
  private playSynthKick(time: number) {
    if (!this.ctx || !this.bgmGainNode) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.bgmGainNode);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  private playSynthSnare(time: number, volScale: number = 1.0) {
    if (!this.ctx || !this.bgmGainNode || !this.noiseBuffer) return;

    // White noise burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45 * volScale, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.bgmGainNode);

    noise.start(time);
    noise.stop(time + 0.15);

    // Punch body
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(190, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(80, time + 0.06);

    bodyGain.gain.setValueAtTime(0.35 * volScale, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.bgmGainNode);

    bodyOsc.start(time);
    bodyOsc.stop(time + 0.08);
  }

  private playSynthHiHat(time: number, vol: number) {
    if (!this.ctx || !this.bgmGainNode || !this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  // --- Instrument Synthesizers ---
  private playSynthBass(time: number, freq: number, stepInBar: number) {
    if (!this.ctx || !this.bgmGainNode) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Resonant lowpass filter with punch envelope
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.5, time);

    // Cutoff opens wider at higher intensity
    const baseCutoff = 480 + this.currentIntensity * 120;
    filter.frequency.setValueAtTime(baseCutoff * 2.2, time);
    filter.frequency.exponentialRampToValueAtTime(baseCutoff, time + 0.08);

    const dur = 60 / this.bpm / 4 * 0.9;
    gain.gain.setValueAtTime(0.36, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);

    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  private playSynthArp(time: number, stepInBar: number, bar: number) {
    if (!this.ctx || !this.bgmGainNode) return;

    // D-Minor Pentatonic scale notes across octaves 4 and 5
    // D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, F5: 698.46
    const pentatonic = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46];

    // Driving arpeggio sequence pattern
    const arpPattern = [0, 2, 4, 3, 1, 3, 5, 4, 2, 4, 6, 5, 3, 5, 4, 2];
    const noteIdx = (arpPattern[stepInBar] + bar) % pentatonic.length;
    const freq = pentatonic[noteIdx];

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800 + this.currentIntensity * 300, time);

    const dur = 60 / this.bpm / 4 * 0.75;
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGainNode);

    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  // =========================================================================
  // ARCADE SFX ENGINE
  // =========================================================================

  public playButton() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playDash() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playNearMiss() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant double chime: 660Hz -> 990Hz
    [660, 990].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + delay + 0.1);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  public playPickup(type: string = 'generic') {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = type === 'SHIELD' ? 523.25 : type === 'SLOW_MO' ? 392.00 : 783.99;

    [0, 4, 7, 12].forEach((semitone, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteDelay = idx * 0.04;
      const freq = baseFreq * Math.pow(2, semitone / 12);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + noteDelay);

      gain.gain.setValueAtTime(this.sfxVolume * 0.22, now + noteDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + noteDelay);
      osc.stop(now + noteDelay + 0.16);
    });
  }

  public playShieldBreak() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.28);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  public playLevelUp() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.24);
    });
  }

  public playStormAlert() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.14].forEach((delay) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now + delay);
      osc.frequency.exponentialRampToValueAtTime(440, now + delay + 0.1);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.13);
    });
  }

  public playGameOver() {
    // Fade out / stop BGM smoothly
    this.stopBgm();

    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.62);
  }
}

export const sounds = new SoundSystem();
