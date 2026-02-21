import type { EventBus } from '@core/event-bus';
import {
  DEFAULT_SOUND_CONFIG,
  type SoundConfig,
  type SoundDefinition,
  type ToneSpec,
} from '@models/sound';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Event-driven audio system.
 * Subscribes to gameplay events and plays procedural sounds via Web Audio.
 */
export class SoundSystem {
  private config: SoundConfig;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private unsubscribers: Array<() => void> = [];
  private audioPool = new Map<string, HTMLAudioElement>();

  constructor(
    private bus: EventBus,
    initialConfig: SoundConfig = DEFAULT_SOUND_CONFIG,
  ) {
    this.config = {
      ...initialConfig,
      modifierSoundMap: { ...initialConfig.modifierSoundMap },
    };

    this.unsubscribers.push(this.bus.on('button:clicked', () => this.playClick()));
    this.unsubscribers.push(this.bus.on('modifier:triggered', ({ name }) => this.playModifier(name)));
  }

  private ensureAudioGraph(): { ctx: AudioContext; master: GainNode } | null {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null;
    }

    if (!this.audioCtx) {
      this.audioCtx = new window.AudioContext();
    }

    if (!this.masterGain) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = clamp01(this.config.masterVolume);
      this.masterGain.connect(this.audioCtx.destination);
    }

    return { ctx: this.audioCtx, master: this.masterGain };
  }

  private primeAudio(ctx: AudioContext): void {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  private playTone(tone: ToneSpec): void {
    if (!this.config.enabled) return;

    const graph = this.ensureAudioGraph();
    if (!graph) return;

    const { ctx, master } = graph;
    this.primeAudio(ctx);

    const start = ctx.currentTime + (tone.delayMs ?? 0) / 1000;
    const duration = Math.max(0.01, tone.durationMs / 1000);
    const attack = Math.max(0.001, (tone.attackMs ?? 4) / 1000);
    const release = Math.max(0.001, (tone.releaseMs ?? tone.durationMs * 0.8) / 1000);
    const end = start + duration;

    const osc = ctx.createOscillator();
    osc.type = tone.waveform;
    osc.frequency.setValueAtTime(Math.max(1, tone.frequency), start);

    if (typeof tone.frequencyEnd === 'number') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, tone.frequencyEnd), end);
    }

    if (typeof tone.detuneCents === 'number') {
      osc.detune.value = tone.detuneCents;
    }

    const gain = ctx.createGain();
    const peak = clamp01(tone.volume ?? 0.16);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, peak), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + release);

    osc.connect(gain);
    gain.connect(master);

    osc.start(start);
    osc.stop(end + 0.02);
  }

  play(sound: SoundDefinition): void {
    this.playSample(sound);

    for (const tone of sound.tones) {
      this.playTone(tone);
    }
  }

  private playSample(sound: SoundDefinition): void {
    if (!this.config.enabled) return;
    if (!sound.sample) return;

    const { src, volume, playbackRate } = sound.sample;

    let audio = this.audioPool.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      this.audioPool.set(src, audio);
    }

    const instance = audio.cloneNode(true) as HTMLAudioElement;
    instance.volume = clamp01((volume ?? 1) * this.config.masterVolume);
    instance.playbackRate = playbackRate ?? 1;
    void instance.play();
  }

  playClick(): void {
    this.play(this.config.clickSound);
  }

  playModifier(name: string): void {
    const exact = this.config.modifierSoundMap[name];
    if (exact) {
      this.play(exact);
      return;
    }

    const normalizedTarget = normalizeName(name);
    const fuzzyMatch = Object.entries(this.config.modifierSoundMap)
      .find(([modifierName]) => normalizeName(modifierName) === normalizedTarget)?.[1];

    const sound = fuzzyMatch ?? this.config.defaultModifierSound;
    this.play(sound);
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  setMasterVolume(volume: number): void {
    const clamped = clamp01(volume);
    this.config.masterVolume = clamped;
    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }
  }

  configure(config: Partial<SoundConfig>): void {
    if (typeof config.enabled === 'boolean') {
      this.config.enabled = config.enabled;
    }
    if (typeof config.masterVolume === 'number') {
      this.setMasterVolume(config.masterVolume);
    }
    if (config.clickSound) {
      this.config.clickSound = config.clickSound;
    }
    if (config.defaultModifierSound) {
      this.config.defaultModifierSound = config.defaultModifierSound;
    }
    if (config.modifierSoundMap) {
      this.config.modifierSoundMap = {
        ...this.config.modifierSoundMap,
        ...config.modifierSoundMap,
      };
    }
  }

  registerModifierSound(modifierName: string, sound: SoundDefinition): void {
    this.config.modifierSoundMap[modifierName] = sound;
  }

  getConfig(): SoundConfig {
    return {
      ...this.config,
      modifierSoundMap: { ...this.config.modifierSoundMap },
    };
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    if (this.audioCtx) {
      void this.audioCtx.close();
    }

    this.audioCtx = null;
    this.masterGain = null;
  }
}
