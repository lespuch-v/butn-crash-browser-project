import type { EventBus } from '@core/event-bus';
import {
  DEFAULT_SOUND_CONFIG,
  type NoiseSpec,
  type SoundConfig,
  type SoundConfigUpdate,
  type SoundDefinition,
  type ToneSpec,
} from '@models/sound';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getAudioContextCtor(): typeof AudioContext | null {
  const audioContext = (globalThis as typeof globalThis & {
    AudioContext?: typeof AudioContext;
  }).AudioContext;

  return audioContext ?? null;
}

function getTimestamp(): number {
  return Date.now();
}

/**
 * Event-driven audio system.
 * Subscribes to gameplay events and plays procedural sounds via Web Audio.
 */
export class SoundSystem {
  private config: SoundConfig;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private unsubscribers: Array<() => void> = [];
  private audioPool = new Map<string, HTMLAudioElement>();
  private activeSampleInstances = new Set<HTMLAudioElement>();
  private musicAudio: HTMLAudioElement | null = null;
  private musicFadeTimer: ReturnType<typeof setInterval> | null = null;
  private musicFadeMode: 'in' | 'out' | null = null;
  private musicSrc: string | null = null;

  constructor(
    private bus: EventBus,
    initialConfig: SoundConfig = DEFAULT_SOUND_CONFIG,
  ) {
    this.config = {
      ...initialConfig,
      modifierSoundMap: { ...initialConfig.modifierSoundMap },
      music: { ...initialConfig.music },
    };

    this.unsubscribers.push(this.bus.on('button:clicked', () => this.playClick()));
    this.unsubscribers.push(this.bus.on('modifier:triggered', ({ name }) => this.playModifier(name)));
  }

  private ensureAudioGraph(): { ctx: AudioContext; master: GainNode } | null {
    const AudioContextCtor = getAudioContextCtor();
    if (!AudioContextCtor) {
      return null;
    }

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextCtor();
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

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const durationSeconds = 1;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * durationSeconds, ctx.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index++) {
      channel[index] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  private applyEnvelope(
    gain: GainNode,
    start: number,
    end: number,
    peak: number,
    attackSeconds: number,
    releaseSeconds: number,
  ): void {
    const releaseStart = Math.max(start + attackSeconds, end - releaseSeconds);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, peak), start + attackSeconds);
    gain.gain.setValueAtTime(Math.max(0.0001, peak), releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
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

    if (typeof tone.detuneJitterCents === 'number') {
      const jitter = (Math.random() * 2 - 1) * tone.detuneJitterCents;
      osc.detune.value += jitter;
    }

    const gain = ctx.createGain();
    this.applyEnvelope(gain, start, end, clamp01(tone.volume ?? 0.16), attack, release);

    osc.connect(gain);
    gain.connect(master);

    osc.start(start);
    osc.stop(end + 0.02);
  }

  private playNoiseBurst(noise: NoiseSpec): void {
    if (!this.config.enabled) return;

    const graph = this.ensureAudioGraph();
    if (!graph) return;

    const { ctx, master } = graph;
    this.primeAudio(ctx);

    const start = ctx.currentTime + (noise.delayMs ?? 0) / 1000;
    const duration = Math.max(0.01, noise.durationMs / 1000);
    const attack = Math.max(0.001, (noise.attackMs ?? 2) / 1000);
    const release = Math.max(0.001, (noise.releaseMs ?? noise.durationMs * 0.8) / 1000);
    const end = start + duration;

    const source = ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(ctx);
    source.playbackRate.value = noise.playbackRate ?? 1;

    const gain = ctx.createGain();
    this.applyEnvelope(gain, start, end, clamp01(noise.volume ?? 0.04), attack, release);

    if (noise.filterType) {
      const filter = ctx.createBiquadFilter();
      filter.type = noise.filterType;
      filter.frequency.setValueAtTime(Math.max(10, noise.filterFrequency ?? 1200), start);
      filter.Q.value = noise.q ?? 1;

      if (typeof noise.filterFrequencyEnd === 'number') {
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(10, noise.filterFrequencyEnd),
          end,
        );
      }

      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(master);

    source.start(start, Math.random() * 0.2);
    source.stop(end + 0.02);
  }

  play(sound: SoundDefinition): void {
    this.playSample(sound);

    for (const tone of sound.tones) {
      this.playTone(tone);
    }

    for (const noise of sound.noiseBursts ?? []) {
      this.playNoiseBurst(noise);
    }
  }

  private createAudioElement(src: string): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') {
      return null;
    }

    return new Audio(src);
  }

  private playSample(sound: SoundDefinition): void {
    if (!this.config.enabled) return;
    if (!sound.sample) return;

    const { src, volume, playbackRate } = sound.sample;
    let audio: HTMLAudioElement | null = this.audioPool.get(src) ?? null;

    if (!audio) {
      audio = this.createAudioElement(src);
      if (!audio) return;

      audio.preload = 'auto';
      this.audioPool.set(src, audio);
    }

    const instance = audio.cloneNode(true) as HTMLAudioElement;
    instance.volume = clamp01((volume ?? 1) * this.config.masterVolume);
    instance.playbackRate = playbackRate ?? 1;
    this.activeSampleInstances.add(instance);

    const cleanup = (): void => {
      this.activeSampleInstances.delete(instance);
      instance.removeEventListener('ended', cleanup);
      instance.removeEventListener('error', cleanup);
      instance.removeEventListener('pause', cleanup);
    };

    instance.addEventListener('ended', cleanup);
    instance.addEventListener('error', cleanup);
    instance.addEventListener('pause', cleanup);

    const playPromise = instance.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      void playPromise.catch(() => cleanup());
    }
  }

  private stopAllSamples(): void {
    for (const sample of [...this.activeSampleInstances]) {
      sample.pause();
      sample.currentTime = 0;
      this.activeSampleInstances.delete(sample);
    }
  }

  private suspendProceduralAudio(): void {
    if (!this.audioCtx || this.audioCtx.state !== 'running') {
      return;
    }

    void this.audioCtx.suspend();
  }

  private getMusicTargetVolume(): number {
    return clamp01(this.config.masterVolume * this.config.music.volume);
  }

  private clearMusicFade(): void {
    if (this.musicFadeTimer !== null) {
      clearInterval(this.musicFadeTimer);
      this.musicFadeTimer = null;
    }

    this.musicFadeMode = null;
  }

  private fadeMusicTo(targetVolume: number, onComplete?: () => void): void {
    const audio = this.musicAudio;
    if (!audio) {
      onComplete?.();
      return;
    }

    this.clearMusicFade();

    const durationMs = Math.max(0, this.config.music.fadeMs);
    const startVolume = audio.volume;
    const clampedTarget = clamp01(targetVolume);

    if (durationMs === 0 || Math.abs(startVolume - clampedTarget) < 0.001) {
      audio.volume = clampedTarget;
      onComplete?.();
      return;
    }

    this.musicFadeMode = clampedTarget > startVolume ? 'in' : 'out';
    const startAt = getTimestamp();

    this.musicFadeTimer = setInterval(() => {
      if (!this.musicAudio || this.musicAudio !== audio) {
        this.clearMusicFade();
        return;
      }

      const elapsed = getTimestamp() - startAt;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = clamp01(startVolume + (clampedTarget - startVolume) * progress);

      if (progress >= 1) {
        this.clearMusicFade();
        onComplete?.();
      }
    }, 16);
  }

  private disposeMusicAudio(): void {
    this.clearMusicFade();

    if (!this.musicAudio) {
      this.musicSrc = null;
      return;
    }

    this.musicAudio.pause();
    this.musicAudio.currentTime = 0;
    this.musicAudio.removeAttribute('src');
    this.musicAudio.load();
    this.musicAudio = null;
    this.musicSrc = null;
  }

  private syncMusicSettings(): void {
    if (!this.musicAudio) return;

    this.musicAudio.loop = this.config.music.loop;

    if (this.config.enabled && this.musicFadeMode !== 'out') {
      this.musicAudio.volume = this.getMusicTargetVolume();
    }
  }

  private ensureMusicAudio(): HTMLAudioElement | null {
    const src = this.config.music.src;
    if (!src) {
      this.disposeMusicAudio();
      return null;
    }

    if (this.musicAudio && this.musicSrc === src) {
      this.syncMusicSettings();
      return this.musicAudio;
    }

    this.disposeMusicAudio();

    const audio = this.createAudioElement(src);
    if (!audio) {
      return null;
    }

    audio.preload = 'auto';
    audio.loop = this.config.music.loop;
    audio.volume = 0;
    this.musicAudio = audio;
    this.musicSrc = src;
    return audio;
  }

  private startOrResumeMusic(): void {
    const audio = this.ensureMusicAudio();
    if (!audio) return;

    audio.loop = this.config.music.loop;

    if (audio.paused) {
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        void playPromise.catch(() => undefined);
      }
    }

    this.fadeMusicTo(this.getMusicTargetVolume());
  }

  private fadeOutAndPauseMusic(): void {
    const audio = this.musicAudio;
    if (!audio) return;

    if (audio.paused) {
      audio.volume = 0;
      return;
    }

    this.fadeMusicTo(0, () => {
      if (!this.musicAudio || this.musicAudio !== audio) {
        return;
      }

      audio.pause();
      audio.volume = 0;
    });
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

    if (!enabled) {
      this.stopAllSamples();
      this.suspendProceduralAudio();
      this.fadeOutAndPauseMusic();
      return;
    }

    this.startOrResumeMusic();
  }

  setMasterVolume(volume: number): void {
    const clamped = clamp01(volume);
    this.config.masterVolume = clamped;

    if (this.masterGain) {
      this.masterGain.gain.value = clamped;
    }

    if (this.musicAudio && this.config.enabled) {
      if (this.musicFadeMode === 'in') {
        this.fadeMusicTo(this.getMusicTargetVolume());
      } else if (this.musicFadeMode !== 'out') {
        this.musicAudio.volume = this.getMusicTargetVolume();
      }
    }
  }

  setBackgroundMusic(src: string | null): void {
    this.configure({
      music: {
        src,
      },
    });
  }

  setMusicVolume(volume: number): void {
    this.configure({
      music: {
        volume: clamp01(volume),
      },
    });
  }

  configure(config: SoundConfigUpdate): void {
    const previousEnabled = this.config.enabled;
    const previousMusicSrc = this.config.music.src;

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

    if (typeof config.masterVolume === 'number') {
      this.config.masterVolume = clamp01(config.masterVolume);
      if (this.masterGain) {
        this.masterGain.gain.value = this.config.masterVolume;
      }
    }

    if (config.music) {
      this.config.music = {
        ...this.config.music,
        ...config.music,
        volume: config.music.volume === undefined
          ? this.config.music.volume
          : clamp01(config.music.volume),
        fadeMs: config.music.fadeMs === undefined
          ? this.config.music.fadeMs
          : Math.max(0, config.music.fadeMs),
      };
    }

    const musicSourceChanged = previousMusicSrc !== this.config.music.src;
    if (musicSourceChanged) {
      this.ensureMusicAudio();
    } else {
      this.syncMusicSettings();
    }

    if (typeof config.enabled === 'boolean') {
      this.setEnabled(config.enabled);
      return;
    }

    if (this.config.enabled) {
      this.startOrResumeMusic();
    } else if (previousEnabled) {
      this.fadeOutAndPauseMusic();
    }
  }

  registerModifierSound(modifierName: string, sound: SoundDefinition): void {
    this.config.modifierSoundMap[modifierName] = sound;
  }

  getConfig(): SoundConfig {
    return {
      ...this.config,
      modifierSoundMap: { ...this.config.modifierSoundMap },
      music: { ...this.config.music },
    };
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }

    this.unsubscribers = [];
    this.stopAllSamples();
    this.disposeMusicAudio();

    if (this.audioCtx) {
      void this.audioCtx.close();
    }

    this.audioCtx = null;
    this.masterGain = null;
    this.noiseBuffer = null;
  }
}
