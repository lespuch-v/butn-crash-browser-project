import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@core/event-bus';
import { SoundSystem } from '@systems/sound-system';
import {
  DEFAULT_SOUND_CONFIG,
  type SoundConfig,
  type SoundDefinition,
} from '@models/sound';

class FakeAudio {
  static instances: FakeAudio[] = [];

  src: string;
  preload = '';
  volume = 1;
  playbackRate = 1;
  loop = false;
  currentTime = 0;
  paused = true;

  readonly play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });

  readonly pause = vi.fn(() => {
    this.paused = true;
    this.dispatch('pause');
  });

  readonly load = vi.fn();
  readonly removeAttribute = vi.fn();
  readonly cloneNode = vi.fn(() => new FakeAudio(this.src) as unknown as HTMLAudioElement);

  private listeners = new Map<string, Set<() => void>>();

  constructor(src = '') {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  addEventListener(eventName: string, listener: () => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)?.add(listener);
  }

  removeEventListener(eventName: string, listener: () => void): void {
    this.listeners.get(eventName)?.delete(listener);
  }

  private dispatch(eventName: string): void {
    for (const listener of [...(this.listeners.get(eventName) ?? [])]) {
      listener();
    }
  }
}

function createConfig(
  overrides: Partial<Omit<SoundConfig, 'music' | 'modifierSoundMap'>> & {
    music?: Partial<SoundConfig['music']>;
    modifierSoundMap?: Record<string, SoundDefinition>;
  } = {},
): SoundConfig {
  const base: SoundConfig = {
    ...DEFAULT_SOUND_CONFIG,
    modifierSoundMap: { ...DEFAULT_SOUND_CONFIG.modifierSoundMap },
    music: { ...DEFAULT_SOUND_CONFIG.music },
  };

  return {
    ...base,
    ...overrides,
    modifierSoundMap: overrides.modifierSoundMap
      ? { ...base.modifierSoundMap, ...overrides.modifierSoundMap }
      : base.modifierSoundMap,
    music: overrides.music
      ? { ...base.music, ...overrides.music }
      : base.music,
  };
}

describe('SoundSystem', () => {
  const originalAudio = (globalThis as typeof globalThis & { Audio?: typeof Audio }).Audio;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeAudio.instances = [];
    (globalThis as typeof globalThis & { Audio?: typeof Audio }).Audio =
      FakeAudio as unknown as typeof Audio;
  });

  afterEach(() => {
    vi.useRealTimers();

    if (originalAudio) {
      (globalThis as typeof globalThis & { Audio?: typeof Audio }).Audio = originalAudio;
    } else {
      delete (globalThis as typeof globalThis & { Audio?: typeof Audio }).Audio;
    }
  });

  it('keeps exact and fuzzy modifier sound lookup working', () => {
    const bus = new EventBus();
    const sound = { tones: [] } satisfies SoundDefinition;
    const system = new SoundSystem(bus, createConfig({
      modifierSoundMap: {
        'Arc Burst!': sound,
      },
    }));
    const playSpy = vi.spyOn(system, 'play');

    system.playModifier('Arc Burst!');
    system.playModifier('arc burst');

    expect(playSpy).toHaveBeenNthCalledWith(1, sound);
    expect(playSpy).toHaveBeenNthCalledWith(2, sound);
  });

  it('does not throw when enabling audio without a music source', () => {
    const bus = new EventBus();
    const system = new SoundSystem(bus, createConfig({
      enabled: false,
      music: {
        src: null,
      },
    }));

    expect(() => system.setEnabled(true)).not.toThrow();
  });

  it('starts music playback when audio is enabled and music is configured', () => {
    const bus = new EventBus();
    const system = new SoundSystem(bus, createConfig({
      enabled: false,
      music: {
        src: '/music/background-loop.mp3',
        fadeMs: 100,
        volume: 0.4,
      },
      masterVolume: 0.5,
    }));

    system.setEnabled(true);

    const music = FakeAudio.instances[0];
    expect(music).toBeDefined();
    expect(music.play).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(112);
    expect(music.volume).toBeCloseTo(0.2, 2);
  });

  it('fades music out and pauses it when audio is disabled', () => {
    const bus = new EventBus();
    const system = new SoundSystem(bus, createConfig({
      enabled: false,
      music: {
        src: '/music/background-loop.mp3',
        fadeMs: 120,
      },
    }));

    system.setEnabled(true);
    const music = FakeAudio.instances[0];
    vi.advanceTimersByTime(128);

    system.setEnabled(false);
    expect(music.pause).not.toHaveBeenCalled();

    vi.advanceTimersByTime(112);
    expect(music.pause).not.toHaveBeenCalled();

    vi.advanceTimersByTime(16);
    expect(music.pause).toHaveBeenCalledTimes(1);
    expect(music.volume).toBeCloseTo(0, 3);
  });

  it('updates effective music volume when master volume changes', () => {
    const bus = new EventBus();
    const system = new SoundSystem(bus, createConfig({
      enabled: false,
      masterVolume: 0.4,
      music: {
        src: '/music/background-loop.mp3',
        volume: 0.4,
        fadeMs: 80,
      },
    }));

    system.setEnabled(true);
    const music = FakeAudio.instances[0];
    vi.advanceTimersByTime(96);
    expect(music.volume).toBeCloseTo(0.16, 2);

    system.setMasterVolume(0.25);
    expect(music.volume).toBeCloseTo(0.1, 2);
  });

  it('replaces the active music element cleanly when the source changes', () => {
    const bus = new EventBus();
    const system = new SoundSystem(bus, createConfig({
      enabled: false,
      music: {
        src: '/music/one.mp3',
        fadeMs: 50,
      },
    }));

    system.setEnabled(true);
    const firstMusic = FakeAudio.instances[0];
    vi.advanceTimersByTime(50);

    system.setBackgroundMusic('/music/two.mp3');

    const secondMusic = FakeAudio.instances[1];
    expect(firstMusic.pause).toHaveBeenCalledTimes(1);
    expect(secondMusic).toBeDefined();
    expect(secondMusic.src).toBe('/music/two.mp3');
    expect(secondMusic.play).toHaveBeenCalledTimes(1);
  });
});
