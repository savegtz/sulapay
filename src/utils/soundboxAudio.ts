/**
 * FacePay Soundbox TZ - Audio Synthesis Engine
 * Provides authentic merchant payment chimes & Swahili/English voice announcements.
 */

class SoundboxEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.9;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Play the iconic merchant Soundbox multi-frequency chime
   */
  public async playPaymentChime(): Promise<void> {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume * 0.35, now);
      masterGain.connect(ctx.destination);

      // Chime notes: E5 (659Hz), A5 (880Hz), E6 (1318Hz)
      const notes = [
        { freq: 659.25, start: 0.0, duration: 0.14 },
        { freq: 880.00, start: 0.12, duration: 0.16 },
        { freq: 1318.51, start: 0.26, duration: 0.38 }
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Warm sine wave with subtle harmonics
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        noteGain.gain.setValueAtTime(0, now + start);
        noteGain.gain.linearRampToValueAtTime(0.7, now + start + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + start);
        osc.stop(now + start + duration);
      });
    } catch (e) {
      console.warn('Soundbox audio chime could not play:', e);
    }
  }

  /**
   * Announce payment via synthesized Swahili voice
   * e.g., "M-Pesa! Umepokea Shilingi Elfu Kumi na Tano kutoka kwa Juma Mkwawa kupitia FacePay TIPS!"
   */
  public async announcePayment(params: {
    amount: number;
    merchantName?: string;
    payerName?: string;
    rail?: string;
    language?: 'sw' | 'en';
  }): Promise<void> {
    if (this.isMuted) return;

    // 1. First play the crisp chime
    await this.playPaymentChime();

    // 2. Format spoken text
    const lang = params.language || 'sw';
    const railName = (params.rail || 'M_PESA').replace(/_/g, ' ');
    const formattedAmount = params.amount.toLocaleString();

    let text = '';
    if (lang === 'sw') {
      text = `${railName}! Umepokea shilingi ${formattedAmount} kutoka kwa ${params.payerName || 'Mteja'} kupitia FacePay TIPS!`;
    } else {
      text = `${railName}! You have received ${formattedAmount} Tanzanian Shillings from ${params.payerName || 'Customer'} via FacePay TIPS!`;
    }

    // 3. Use Web Speech API if supported
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Stop any pending speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.volume;
        utterance.rate = 0.95; // Clear and intelligible rate for shop speaker
        utterance.pitch = 1.05;

        // Try to find a Swahili voice or fallback
        const voices = window.speechSynthesis.getVoices();
        if (lang === 'sw') {
          const swVoice = voices.find(v => v.lang.startsWith('sw') || v.name.toLowerCase().includes('swahili'));
          if (swVoice) {
            utterance.voice = swVoice;
          } else {
            // Pick a neutral, friendly African or English voice
            const fallbackVoice = voices.find(v => v.lang.includes('en-ZA') || v.lang.includes('en-KE') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (fallbackVoice) utterance.voice = fallbackVoice;
          }
        } else {
          const enVoice = voices.find(v => v.lang.includes('en'));
          if (enVoice) utterance.voice = enVoice;
        }

        // Delay speech slightly to let the chime ring out cleanly
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 320);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
  }
}

export const soundbox = new SoundboxEngine();
