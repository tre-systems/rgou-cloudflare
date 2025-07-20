
class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        this.audioContext = new window.AudioContext();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
      }
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) return null;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  private async playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.1
  ) {
    if (!this.enabled) return;

    const ctx = await this.ensureAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private async playChord(
    frequencies: number[],
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.05
  ) {
    frequencies.forEach(freq => this.playTone(freq, duration, type, volume));
  }

  async diceRoll() {
    
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.playTone(200 + Math.random() * 100, 0.1, 'square', 0.05);
      }, i * 50);
    }
  }

  async pieceMove() {
    
    await this.playTone(523.25, 0.2, 'sine', 0.08); // C5
  }

  async pieceCapture() {
    
    await this.playTone(220, 0.3, 'sawtooth', 0.1); // A3
    setTimeout(() => this.playTone(174.61, 0.4, 'sawtooth', 0.08), 100); // F3
  }

  async rosetteLanding() {
    
    const frequencies = [523.25, 659.25, 783.99]; // C5-E5-G5 chord
    await this.playChord(frequencies, 0.5, 'sine', 0.06);
  }

  async pieceFinish() {
    if (!this.enabled) return;

    
    const melody = [523.25, 659.25, 783.99]; // C5-E5-G5 ascending
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sine', 0.12), i * 120);
    });

    
    setTimeout(() => {
      this.playChord([523.25, 659.25, 783.99], 0.8, 'sine', 0.08);
    }, 360);
  }

  async gameWin() {
    
    const melody = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.1), i * 200);
    });
  }

  async gameLoss() {
    
    const melody = [523.25, 493.88, 440, 392]; // C5-B4-A4-G4 descending
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.08), i * 150);
    });
  }

  async aiThinking() {
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(400 + i * 50, 0.1, 'sine', 0.03);
      }, i * 300);
    }
  }

  async buttonClick() {
    
    await this.playTone(800, 0.1, 'square', 0.05);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  get isEnabled() {
    return this.enabled;
  }
}

export const soundEffects = new SoundEffects();
