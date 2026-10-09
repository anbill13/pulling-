import { CONFIG } from './config';

export type RetroTrackId = 'battle' | 'arcade' | 'boss';

/**
 * Authentic 8-Bit Retro Chiptune Web Audio Synthesizer Engine.
 * Emulates classic NES / Game Boy sound chips:
 * - Square Wave Channels (Pulse 1 for Lead, Pulse 2 for fast Arpeggios)
 * - Triangle Wave Channel (Unfiltered stepped Bass)
 * - White Noise Channel (ADSR shaped 8-bit Noise Drums)
 * Zero external audio files. 100% procedural retro chiptune synthesis.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private isMuted: boolean = false;

  // Master Gain & Busses
  private masterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Scheduler state
  private schedulerTimer: number | null = null;
  private nextBeatTime: number = 0;
  private beatIndex: number = 0;

  // Adaptive Music Parameters
  private currentPhase: 'lobby' | 'intro' | 'round' | 'ended' = 'lobby';
  private currentRopeV: number = 0; // -100 to 100
  private isTension: boolean = false;
  private isRedLight: boolean = false;
  private isAmberAlert: boolean = false;
  private currentTrack: RetroTrackId = 'battle';

  // Ducking state
  private duckTimer: number | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction
  }

  /**
   * Unlock AudioContext on user interaction
   */
  public async unlock(): Promise<boolean> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('[Audio] Web Audio API not supported');
        return false;
      }
      this.ctx = new AudioCtxClass();
      this.initBusses();
      this.generateNoiseBuffer();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isUnlocked = true;
    this.startScheduler();
    return true;
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked && !!this.ctx && this.ctx.state === 'running';
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : CONFIG.masterVolume;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.08);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setTrack(track: RetroTrackId): void {
    this.currentTrack = track;
  }

  public getCurrentTrack(): RetroTrackId {
    return this.currentTrack;
  }

  private initBusses(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Master Dynamics Compressor for punchy retro 8-bit sound
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-15, now);
    this.compressor.knee.setValueAtTime(8, now);
    this.compressor.ratio.setValueAtTime(5, now);
    this.compressor.attack.setValueAtTime(0.003, now);
    this.compressor.release.setValueAtTime(0.1, now);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : CONFIG.masterVolume, now);

    // Dedicated Busses
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.setValueAtTime(CONFIG.musicEnabled ? 0.75 : 0, now);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.setValueAtTime(CONFIG.sfxEnabled ? 1.0 : 0, now);

    this.musicBus.connect(this.compressor);
    this.sfxBus.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  /**
   * Generates a stepped, quantised 8-bit white noise buffer for retro percussion
   */
  private generateNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Quantised 8-bit stepped noise (emulating NES LFSR noise generator)
      const val = Math.random() * 2 - 1;
      data[i] = Math.round(val * 8) / 8;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Applies temporary ducking on the music bus during announcements
   */
  public triggerDucking(): void {
    if (!this.ctx || !this.musicBus || !CONFIG.musicEnabled) return;
    const now = this.ctx.currentTime;
    const currentVol = 0.75;
    const duckedVol = currentVol * (1 - CONFIG.duckAmount);

    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now);
    this.musicBus.gain.linearRampToValueAtTime(duckedVol, now + 0.05);

    if (this.duckTimer) window.clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => {
      if (!this.ctx || !this.musicBus) return;
      const t = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, t);
      this.musicBus.gain.linearRampToValueAtTime(currentVol, t + 0.3);
    }, CONFIG.duckTime);
  }

  /**
   * Update the dynamic game state parameters that control procedural 8-bit music
   */
  public setGameState(params: {
    phase: 'lobby' | 'intro' | 'round' | 'ended';
    ropeV: number;
    isTension: boolean;
    isRedLight: boolean;
    isAmberAlert: boolean;
  }): void {
    this.currentPhase = params.phase;
    this.currentRopeV = params.ropeV;
    this.isTension = params.isTension;
    this.isRedLight = params.isRedLight;
    this.isAmberAlert = params.isAmberAlert;
  }

  /**
   * Main adaptive 8-bit chiptune beat sequencer loop
   */
  private startScheduler(): void {
    if (this.schedulerTimer) return;
    this.nextBeatTime = this.ctx ? this.ctx.currentTime + 0.05 : 0;
    this.beatIndex = 0;

    const scheduleAheadTime = 0.12; // 120 ms lookahead
    const intervalMs = 30;

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isUnlocked) return;
      const now = this.ctx.currentTime;

      while (this.nextBeatTime < now + scheduleAheadTime) {
        this.scheduleBeat(this.nextBeatTime, this.beatIndex);

        // Calculate dynamic retro BPM based on game phase and tension
        let currentBpm = 112; // Upbeat 8-bit tempo
        if (this.currentPhase === 'lobby') {
          currentBpm = 82; // Nostalgic 8-bit RPG tavern / title screen tempo
        } else if (this.isTension || this.currentTrack === 'boss') {
          currentBpm = 138; // Intense 8-bit boss battle speed
        } else if (this.currentPhase === 'round') {
          // As rope moves away from center (|v|), tempo speeds up
          const strain = Math.abs(this.currentRopeV) / CONFIG.ropeMax;
          currentBpm = 112 * (1 + strain * 0.18);
        }

        const beatDuration = 60 / currentBpm / 4; // 16th note grid
        this.nextBeatTime += beatDuration;
        this.beatIndex++;
      }
    }, intervalMs);
  }

  /**
   * Synthesize 8-bit instrument notes for each scheduled 16th note step
   */
  private scheduleBeat(time: number, stepIndex: number): void {
    if (!this.ctx || !CONFIG.musicEnabled) return;

    // During red light, play sparse retro warning beep
    if (this.isRedLight) {
      if (stepIndex % 16 === 0) {
        this.synth8bitPulse(time, 220, 0.08, 0.18); // Low square blip
      } else if (stepIndex % 16 === 8) {
        this.synth8bitPulse(time, 165, 0.08, 0.14);
      }
      return;
    }

    // 1. LOBBY SCREEN (Nostalgic 8-bit RPG preparation theme)
    if (this.currentPhase === 'lobby') {
      const step = stepIndex % 32;

      // Triangle Bass Channel (Warm retro walking bass)
      const lobbyBass = [
        130.81, 0, 130.81, 0, 164.81, 0, 196.0, 0, // C3, E3, G3
        146.83, 0, 146.83, 0, 174.61, 0, 220.0, 0, // D3, F3, A3
        164.81, 0, 164.81, 0, 196.0, 0, 246.94, 0, // E3, G3, B3
        174.61, 0, 196.0, 0, 130.81, 0, 0, 0,       // F3, G3, C3
      ];
      const bassFreq = lobbyBass[step];
      if (bassFreq > 0) {
        this.synth8bitTriangleBass(time, bassFreq, 0.22);
      }

      // Pulse 1 Channel (Sweet nostalgic lead melody)
      const lobbyMelody = [
        523.25, 0, 659.25, 0, 783.99, 0, 1046.5, 0,
        987.77, 0, 783.99, 0, 659.25, 0, 0, 0,
        587.33, 0, 698.46, 0, 880.0, 0, 783.99, 0,
        659.25, 0, 587.33, 0, 523.25, 0, 0, 0,
      ];
      const melFreq = lobbyMelody[step];
      if (melFreq > 0) {
        this.synth8bitPulse(time, melFreq, 0.18, 0.15);
      }

      // Pulse 2 Arp (Subtle retro arpeggios every 4th step)
      if (step % 4 === 2) {
        this.synth8bitFastArp(time, [659.25, 783.99, 1046.5], 0.08);
      }

      // Soft 8-bit Hi-hat on offbeats
      if (step % 8 === 4) {
        this.synth8bitNoiseHat(time, 0.03);
      }
      return;
    }

    if (this.currentPhase === 'intro') {
      return;
    }

    // 2. ACTIVE MATCH (Authentic 8-Bit Action Chiptune)
    if (this.currentPhase === 'round') {
      const step = stepIndex % 32;

      // TRACK 1: "BATTLE" (Classic Heroic 8-Bit Action in C Minor)
      if (this.currentTrack === 'battle') {
        // Triangle Bass: Punchy walking retro bassline
        const battleBass = [
          65.41, 0, 130.81, 65.41, 0, 77.78, 98.0, 0,
          65.41, 0, 130.81, 65.41, 0, 87.31, 98.0, 0,
          51.91, 0, 103.83, 51.91, 0, 58.27, 116.54, 58.27,
          65.41, 0, 98.0, 130.81, 155.56, 130.81, 98.0, 0,
        ];
        const bassNote = battleBass[step];
        if (bassNote > 0) {
          this.synth8bitTriangleBass(time, bassNote, 0.22);
        }

        // Pulse 1: Square Lead Melody
        const battleLead = [
          523.25, 0, 523.25, 0, 622.25, 0, 783.99, 0,
          698.46, 0, 622.25, 0, 587.33, 0, 523.25, 0,
          830.61, 0, 830.61, 0, 932.33, 0, 1046.5, 0,
          932.33, 0, 783.99, 0, 698.46, 0, 783.99, 0,
        ];
        const leadNote = battleLead[step];
        if (leadNote > 0 && (!this.isTension || step % 2 === 0)) {
          this.synth8bitPulse(time, leadNote, 0.16, 0.24);
        }

        // Pulse 2: Signature NES fast rolling arpeggio
        if (step % 2 === 1 || this.isTension) {
          let chord = [523.25, 622.25, 783.99]; // C minor
          if (step >= 16 && step < 24) chord = [415.3, 523.25, 622.25]; // Ab major
          if (step >= 24) chord = [466.16, 587.33, 698.46]; // Bb major

          const absV = Math.abs(this.currentRopeV);
          if (absV > 35 || this.isTension) {
            chord = chord.map((n) => n * 2);
          }
          this.synth8bitFastArp(time, chord, 0.09);
        }
      }

      // TRACK 2: "ARCADE" (Bouncy Retro Platformer Groove in F Major)
      else if (this.currentTrack === 'arcade') {
        const arcadeBass = [
          87.31, 0, 174.61, 0, 116.54, 0, 174.61, 0,
          98.0, 0, 196.0, 0, 130.81, 0, 196.0, 0,
          116.54, 0, 233.08, 0, 130.81, 0, 261.63, 0,
          87.31, 130.81, 174.61, 0, 116.54, 0, 87.31, 0,
        ];
        const bassNote = arcadeBass[step];
        if (bassNote > 0) {
          this.synth8bitTriangleBass(time, bassNote, 0.22);
        }

        const arcadeLead = [
          698.46, 0, 880.0, 0, 1046.5, 0, 880.0, 0,
          783.99, 0, 698.46, 0, 587.33, 0, 698.46, 0,
          932.33, 0, 880.0, 0, 783.99, 0, 1046.5, 0,
          880.0, 0, 698.46, 0, 587.33, 0, 0, 0,
        ];
        const leadNote = arcadeLead[step];
        if (leadNote > 0) {
          this.synth8bitPulse(time, leadNote, 0.15, 0.22);
        }

        if (step % 4 === 2) {
          this.synth8bitFastArp(time, [698.46, 880.0, 1046.5], 0.08);
        }
      }

      // TRACK 3: "BOSS" (High-Speed Urgent Chiptune Battle)
      else if (this.currentTrack === 'boss') {
        // Relentless driving double-bass
        const bossBass = [
          65.41, 130.81, 65.41, 130.81, 69.3, 138.59, 69.3, 138.59,
          73.42, 146.83, 73.42, 146.83, 77.78, 155.56, 77.78, 155.56,
          82.41, 164.81, 82.41, 164.81, 87.31, 174.61, 87.31, 174.61,
          98.0, 196.0, 92.5, 185.0, 87.31, 174.61, 65.41, 0,
        ];
        this.synth8bitTriangleBass(time, bossBass[step], 0.24);

        if (step % 4 === 0) {
          const bossLead = [1046.5, 987.77, 932.33, 880.0, 830.61, 783.99, 739.99, 698.46];
          this.synth8bitPulse(time, bossLead[(step / 4) % bossLead.length], 0.12, 0.26);
        }

        this.synth8bitFastArp(time, [523.25, 622.25, 783.99, 1046.5], 0.1);
      }

      // 8-BIT NOISE DRUMS (Unified for all active round tracks)
      // Kick: step 0, 8, 16, 24 (or double-time in tension / boss)
      if (step % 8 === 0 || (this.isTension && step % 4 === 0)) {
        this.synth8bitKick(time);
      }

      // Snare: step 4, 12, 20, 28
      if (step % 8 === 4) {
        this.synth8bitSnare(time);
      }

      // Hi-hat: on offbeat 16th notes
      if (step % 2 === 0 && step % 8 !== 4) {
        this.synth8bitNoiseHat(time, step % 4 === 2 ? 0.07 : 0.035);
      }
    }
  }

  // ==========================================
  // PROCEDURAL 8-BIT CHIPTUNE SYNTHESIZERS
  // ==========================================

  /**
   * 8-Bit Pulse / Square Wave Channel (NES Pulse 1 / 2)
   */
  private synth8bitPulse(time: number, freq: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    // Snappy retro staccato envelope: instantaneous attack, steep decay
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 8-Bit Fast Arpeggio (The iconic chiptune "rolling chord" sound)
   * Cycles rapidly through chord notes in 25ms increments.
   */
  private synth8bitFastArp(time: number, freqs: number[], volume: number): void {
    if (!this.ctx || !this.musicBus || freqs.length === 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const arpSpeed = 0.025; // 25ms per note
    const totalDuration = arpSpeed * freqs.length * 2;

    for (let i = 0; i < freqs.length * 2; i++) {
      const f = freqs[i % freqs.length];
      osc.frequency.setValueAtTime(f, time + i * arpSpeed);
    }

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + totalDuration);

    osc.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    osc.stop(time + totalDuration);
  }

  /**
   * 8-Bit Triangle Channel Bass (NES Triangle Wave)
   * Pure un-filtered triangle wave with crisp stepped timing.
   */
  private synth8bitTriangleBass(time: number, freq: number, volume: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const duration = 0.16;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * 8-Bit Retro Kick Drum
   * Downward pitch sweep using a fast square/triangle hybrid.
   */
  private synth8bitKick(time: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.musicBus);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  /**
   * 8-Bit Retro Snare Drum
   * Crisp white noise burst with bandpass filter.
   */
  private synth8bitSnare(time: number): void {
    if (!this.ctx || !this.noiseBuffer || !this.musicBus) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.setValueAtTime(1.5, time);

    const duration = 0.09;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    source.start(time);
    source.stop(time + duration);
  }

  /**
   * 8-Bit Retro Noise Hi-Hat
   * Ultra-short 20ms noise click.
   */
  private synth8bitNoiseHat(time: number, volume: number): void {
    if (!this.ctx || !this.noiseBuffer || !this.musicBus) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    const duration = 0.03;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);

    source.start(time);
    source.stop(time + duration);
  }

  // ==========================================
  // RETRO 8-BIT EVENT STINGERS & ARCADE SFX
  // ==========================================

  /**
   * Countdown tick (8-bit arcade blip)
   */
  public playCountdownTick(num: number): void {
    if (!this.ctx || !CONFIG.sfxEnabled || !this.sfxBus) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const freq = num === 1 ? 880 : 587.33; // High square chime
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxBus);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.warn('[Audio] playCountdownTick warning:', err);
    }
  }

  /**
   * "¡YA!" start sound: 8-bit powerup ascending riser + impact hit
   */
  public playStartImpact(): void {
    if (!this.ctx || !CONFIG.sfxEnabled || !this.sfxBus) return;
    try {
      const now = this.ctx.currentTime;
      this.triggerDucking();

      // Ascending 8-bit slide
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.3);

      // 8-bit triad hit
      [523.25, 659.25, 783.99].forEach((f, idx) => {
        if (!this.ctx || !this.sfxBus) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const startTime = now + 0.15 + idx * 0.04;
        const endTime = now + 0.45;
        o.type = 'square';
        o.frequency.setValueAtTime(f, startTime);
        g.gain.setValueAtTime(0.001, now);
        g.gain.setValueAtTime(0.2, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, endTime);
        o.connect(g);
        g.connect(this.sfxBus);
        o.start(startTime);
        o.stop(endTime);
      });
    } catch (err) {
      console.warn('[Audio] playStartImpact warning:', err);
    }
  }

  /**
   * Amber alert ("¡CUIDADO!"): 8-bit hazard warning blips
   */
  public playAmberAlert(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    [440, 554.37, 440].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.25, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.07);
    });
  }

  /**
   * Red light start: 8-bit freeze buzzer
   */
  public playRedLightStart(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxBus!);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Green light return: 8-bit unfreeze cheerful click
   */
  public playGreenLightReturn(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880.0, now + 0.06); // A5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxBus!);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Rose 🌹 gift: Classic 8-bit coin pickup blip (B5 -> E6)
   */
  public playRoseChime(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Classic 8-bit Mario style coin: 987.77 Hz (B5) for 50ms, then 1318.51 Hz (E6) for 200ms
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.05);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxBus!);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * First gift from user: 8-bit 1-UP / extra life bell arpeggio
   */
  public playFirstGiftBell(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    // Classic 8-bit 1-Up note sequence: E5, G5, E6, C6, D6, G6
    const notes = [659.25, 783.99, 1318.51, 1046.5, 1174.66, 1567.98];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      gain.gain.setValueAtTime(0.22, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.2);
    });
  }

  /**
   * Gift Combo stinger (8-bit arcade combo pitch progression)
   */
  public playComboStinger(comboLevel: number): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    const baseFreq = 440;
    const pitchMultiplier = Math.min(2.2, 1 + comboLevel * 0.02);
    const freq = baseFreq * pitchMultiplier;

    // Rapid 8-bit chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.25, now + 0.04);
    osc.frequency.setValueAtTime(freq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxBus!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Gift rain stinger: fast pentatonic 8-bit cascade
   */
  public playGiftRain(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    pentatonic.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.15);
    });
  }

  /**
   * Team Synchrony stinger: heavy retro arcade team hit
   */
  public playSynchronyImpact(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxBus!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Comeback ("¡REMONTADA!"): 8-bit hero revival ascending power sweep
   */
  public playComebackSweep(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.45); // C6

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxBus!);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Safe box surprise event: 8-bit treasure chest mystery arpeggio
   */
  public playSafeBoxArpeggio(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0.22, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  }

  /**
   * Golden Round (Ronda de Oro): 8-bit star power victory fanfare
   */
  public playGoldenRoundChord(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    // D Major 8-bit fanfare: D5, F#5, A5, D6
    const chord = [587.33, 739.99, 880.0, 1174.66];
    chord.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.05);

      gain.gain.setValueAtTime(0.24, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.8);
    });
  }

  /**
   * Round final 8-bit resolution fanfare
   */
  public playRoundEndResolution(result: 'win' | 'seriesWin' | 'tie'): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;
    this.triggerDucking();

    if (result === 'tie') {
      // 8-bit draw suspended chords
      [392.0, 440.0, 523.25].forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.sfxBus!);
        osc.start(now);
        osc.stop(now + 1.2);
      });
    } else {
      // Iconic 8-bit Stage Clear Fanfare: G4, C5, E5, G5, C6
      const fanfare =
        result === 'seriesWin'
          ? [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51]
          : [392.0, 523.25, 659.25, 783.99, 1046.5];

      fanfare.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.28, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxBus!);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.5);
      });
    }
  }

  /**
   * Losing platform collapse: 8-bit game over downward slide
   */
  public playPlatformCollapse(): void {
    if (!this.ctx || !CONFIG.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 1.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxBus!);

    osc.start(now);
    osc.stop(now + 1.2);
  }
}

export const audio = new AudioManager();
