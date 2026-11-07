/* ==========================================================================
   ZothPen — Hermetic Alchemical Sound Synthesizer
   Inspired by Pythagorean 432 Hz Tuning, Sacred Acoustics & Uncommon Web
   Zero external audio files. 100% pure procedural WebAudio synthesis.
   Generates Tibetan singing bowl harmonics, Hermetic Caduceus binaural pulses,
   alchemical transmutation drones, mechanical terminal clicks, and celestial bells.
   ========================================================================== */
(function (global) {
'use strict';

// Pythagorean 432 Hz Alchemical Scale Frequencies
const A432 = {
  A1: 54,     // Root Sub-bass
  A2: 108,    // Sacred Alchemical Ground
  A3: 216,    // Lower Hermetic Octave
  C4: 256.87, // Scientific Verdi Tuning
  D4: 288,    // Sacred Ratio 4:3
  E4: 324,    // Golden Ratio Harmonics
  F4: 345.6,  // Sub-dominant
  G4: 384,    // Perfect Fifth
  A4: 432,    // Sovereign Fundamental
  B4: 486,    // Major Seventh
  C5: 513.74, // High Octave Transmutation
  D5: 576,    // High Caduceus Tone
  E5: 648,    // High Astral Tier
  A5: 864     // Double Octave Celestial
};

class HermeticSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      this.enabled = localStorage.getItem('zothpen.audio') !== '0';
    } catch (e) {
      this.enabled = true;
    }
    this._initOnInteraction = this._initOnInteraction.bind(this);
    window.addEventListener('pointerdown', this._initOnInteraction, { once: true, passive: true });
    window.addEventListener('keydown', this._initOnInteraction, { once: true, passive: true });
  }

  _initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
  }

  _initOnInteraction() {
    this._initContext();
  }

  setEnabled(on) {
    this.enabled = !!on;
    try {
      localStorage.setItem('zothpen.audio', this.enabled ? '1' : '0');
    } catch (e) {}
  }

  /**
   * 1. Tactile Mechanical Relay Keystroke (Terminal Typing & Navigation)
   * High-definition typewriter latch + 864 Hz micro-ping
   */
  tick(freq = 864) {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Noise burst (tactile mechanical click)
      const bufferSize = this.ctx.sampleRate * 0.005; // 5ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2400, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.025, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 2. Micro Pythagorean harmonic sine
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.012);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.014);
    } catch (e) {}
  }

  playClick() { this.tick(864); }
  playKeystroke() { this.tick(1296); }

  /**
   * 2. Hermetic Blip (Window Minimize / Dismiss / Secondary Action)
   */
  blip(freq = 432) {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.045);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  playBlip() { this.blip(432); }

  /**
   * 3. Celestial Hermetic Chirp (Mascot Interaction / GhostByte Voice)
   * Two intertwined 432 Hz frequency hops with frequency modulation
   */
  chirp() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [432, 576, 864];
      notes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = now + idx * 0.035;
        osc.frequency.setValueAtTime(f, start);
        osc.frequency.exponentialRampToValueAtTime(f * 1.33, start + 0.03);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch (e) {}
  }

  playChirp() { this.chirp(); }

  /**
   * 4. Hermetic Caduceus Bell (Task Done / Agent Engage)
   * Twin intertwined frequencies (432 Hz and 436.32 Hz) creating a 4.32 Hz sacred binaural pulse
   */
  bell(fund = A432.A4) {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const beatFreq = 4.32; // 4.32 Hz Theta Sacred Wave

      // Left branch of Caduceus
      const oscL = this.ctx.createOscillator();
      const gainL = this.ctx.createGain();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(fund, now);
      gainL.gain.setValueAtTime(0.06, now);
      gainL.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      oscL.connect(gainL);
      gainL.connect(this.ctx.destination);
      oscL.start(now);
      oscL.stop(now + 1.25);

      // Right branch of Caduceus (detuned by golden beat)
      const oscR = this.ctx.createOscillator();
      const gainR = this.ctx.createGain();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(fund + beatFreq, now);
      gainR.gain.setValueAtTime(0.05, now);
      gainR.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      oscR.connect(gainR);
      gainR.connect(this.ctx.destination);
      oscR.start(now);
      oscR.stop(now + 1.25);

      // High Golden Ratio Overtone (fund * 1.618033)
      const oscOvertone = this.ctx.createOscillator();
      const gainOver = this.ctx.createGain();
      oscOvertone.type = 'sine';
      oscOvertone.frequency.setValueAtTime(fund * 1.618034, now);
      gainOver.gain.setValueAtTime(0.03, now);
      gainOver.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      oscOvertone.connect(gainOver);
      gainOver.connect(this.ctx.destination);
      oscOvertone.start(now);
      oscOvertone.stop(now + 0.85);
    } catch (e) {}
  }

  playBell() { this.bell(A432.A4); }

  /**
   * 5. Tibetan Singing Bowl Chime (Pythagorean 432 Hz Harmonic Triad)
   */
  chime() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Pythagorean Major Triad: A4 (432 Hz), C#5 (540 Hz), E5 (648 Hz), A5 (864 Hz)
      const chord = [A432.A4, A432.A4 * 1.25, A432.E5, A432.A5];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.05;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 1.45);
      });
    } catch (e) {}
  }

  playChime() { this.chime(); }
  playHermeticBowl() { this.chime(); }

  /**
   * 6. Alchemical Transmutation Fanfare (Level Up / Azoth Transmutation)
   * 7-fold Harmonic Ascendance mapped to the 7 alchemical metals & planets
   */
  fanfare() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 7 Planets / 7 Alchemical Steps: Lead -> Tin -> Iron -> Copper -> Mercury -> Silver -> Gold
      const alchemicalScale = [
        A432.A3, // 216 Hz (Saturn / Lead)
        A432.D4, // 288 Hz (Jupiter / Tin)
        A432.E4, // 324 Hz (Mars / Iron)
        A432.G4, // 384 Hz (Venus / Copper)
        A432.A4, // 432 Hz (Mercury / Quicksilver)
        A432.C5, // 513.7 Hz (Moon / Silver)
        A432.A5  // 864 Hz (Sun / Gold)
      ];

      alchemicalScale.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === alchemicalScale.length - 1 ? 'triangle' : 'sine';
        const t = now + i * 0.06;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.15);
      });
    } catch (e) {}
  }

  playFanfare() { this.fanfare(); }
  levelUp() { this.fanfare(); }
  right() { this.bell(A432.E5); }
  wrong() { this.blip(A432.A2); }
  xp() { this.chime(); }
  cmd() { this.tick(1296); }

  /**
   * 7. Gravitational Matrix Warp Shockwave
   * Deep sub-bass sweep (108 Hz -> 432 Hz) with low-pass resonance
   */
  warp() {
    if (!this.enabled) return;
    this._initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(A432.A1, now);
      osc.frequency.exponentialRampToValueAtTime(A432.A2, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(480, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(60, now + 0.45);
      filter.Q.value = 6;

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  playWarp() { this.warp(); }
}

const instance = new HermeticSynthesizer();
global.ZO_SOUND = instance;
global.ZOSynth = instance;

})(window);
