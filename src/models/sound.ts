export interface ToneSpec {
  waveform: OscillatorType;
  frequency: number;
  frequencyEnd?: number;
  durationMs: number;
  volume?: number;
  attackMs?: number;
  releaseMs?: number;
  delayMs?: number;
  detuneCents?: number;
  detuneJitterCents?: number;
}

export interface NoiseSpec {
  durationMs: number;
  volume?: number;
  attackMs?: number;
  releaseMs?: number;
  delayMs?: number;
  playbackRate?: number;
  filterType?: BiquadFilterType;
  filterFrequency?: number;
  filterFrequencyEnd?: number;
  q?: number;
}

export interface SoundDefinition {
  tones: readonly ToneSpec[];
  noiseBursts?: readonly NoiseSpec[];
  sample?: {
    src: string;
    volume?: number;
    playbackRate?: number;
  };
}

export interface MusicConfig {
  src: string | null;
  volume: number;
  loop: boolean;
  fadeMs: number;
}

export interface SoundConfig {
  enabled: boolean;
  masterVolume: number;
  clickSound: SoundDefinition;
  defaultModifierSound: SoundDefinition;
  modifierSoundMap: Record<string, SoundDefinition>;
  music: MusicConfig;
}

export type SoundConfigUpdate = Partial<Omit<SoundConfig, 'music'>> & {
  music?: Partial<MusicConfig>;
};

export const RECOMMENDED_BACKGROUND_MUSIC_SRC = '/music/background-loop.mp3';

export const DEFAULT_CLICK_SOUND: SoundDefinition = {
  tones: [
    {
      waveform: 'triangle',
      frequency: 780,
      frequencyEnd: 520,
      durationMs: 78,
      volume: 0.16,
      attackMs: 2,
      releaseMs: 48,
      detuneJitterCents: 22,
    },
    {
      waveform: 'sine',
      frequency: 1240,
      frequencyEnd: 880,
      durationMs: 52,
      delayMs: 8,
      volume: 0.09,
      attackMs: 2,
      releaseMs: 34,
      detuneJitterCents: 18,
    },
  ],
  noiseBursts: [
    {
      durationMs: 30,
      delayMs: 2,
      volume: 0.035,
      attackMs: 1,
      releaseMs: 18,
      filterType: 'highpass',
      filterFrequency: 1800,
      filterFrequencyEnd: 2600,
    },
  ],
};

export const DEFAULT_MODIFIER_SOUND: SoundDefinition = {
  tones: [
    {
      waveform: 'sawtooth',
      frequency: 360,
      frequencyEnd: 920,
      durationMs: 148,
      volume: 0.13,
      attackMs: 4,
      releaseMs: 92,
      detuneJitterCents: 12,
    },
    {
      waveform: 'square',
      frequency: 680,
      frequencyEnd: 1180,
      durationMs: 114,
      delayMs: 28,
      volume: 0.1,
      attackMs: 3,
      releaseMs: 78,
    },
    {
      waveform: 'triangle',
      frequency: 940,
      frequencyEnd: 1320,
      durationMs: 86,
      delayMs: 54,
      volume: 0.08,
      attackMs: 2,
      releaseMs: 58,
    },
  ],
  noiseBursts: [
    {
      durationMs: 44,
      delayMs: 14,
      volume: 0.03,
      attackMs: 2,
      releaseMs: 32,
      filterType: 'bandpass',
      filterFrequency: 1400,
      filterFrequencyEnd: 2600,
      q: 1.6,
    },
  ],
};

export const DEFAULT_EXPLOSION_SOUND: SoundDefinition = {
  tones: [
    {
      waveform: 'sawtooth',
      frequency: 92,
      frequencyEnd: 38,
      durationMs: 240,
      volume: 0.2,
      attackMs: 2,
      releaseMs: 180,
      detuneJitterCents: 10,
    },
    {
      waveform: 'triangle',
      frequency: 210,
      frequencyEnd: 74,
      durationMs: 180,
      delayMs: 18,
      volume: 0.14,
      attackMs: 2,
      releaseMs: 120,
    },
  ],
  noiseBursts: [
    {
      durationMs: 120,
      volume: 0.085,
      attackMs: 1,
      releaseMs: 90,
      filterType: 'lowpass',
      filterFrequency: 900,
      filterFrequencyEnd: 260,
      q: 0.7,
    },
    {
      durationMs: 70,
      delayMs: 24,
      volume: 0.05,
      attackMs: 1,
      releaseMs: 52,
      filterType: 'bandpass',
      filterFrequency: 1800,
      filterFrequencyEnd: 1100,
      q: 1.3,
    },
  ],
};

export const DEFAULT_MODIFIER_SOUND_MAP: Record<string, SoundDefinition> = {
  'Mass Spawn!': {
    tones: [
      {
        waveform: 'sawtooth',
        frequency: 110,
        frequencyEnd: 220,
        durationMs: 220,
        volume: 0.18,
        attackMs: 4,
        releaseMs: 170,
      },
      {
        waveform: 'triangle',
        frequency: 420,
        frequencyEnd: 980,
        durationMs: 150,
        delayMs: 28,
        volume: 0.13,
        attackMs: 4,
        releaseMs: 106,
      },
      {
        waveform: 'square',
        frequency: 880,
        frequencyEnd: 1320,
        durationMs: 96,
        delayMs: 62,
        volume: 0.09,
        attackMs: 3,
        releaseMs: 60,
      },
    ],
    noiseBursts: [
      {
        durationMs: 80,
        volume: 0.055,
        attackMs: 2,
        releaseMs: 60,
        filterType: 'lowpass',
        filterFrequency: 480,
        filterFrequencyEnd: 920,
        q: 0.8,
      },
      {
        durationMs: 52,
        delayMs: 30,
        volume: 0.04,
        attackMs: 1,
        releaseMs: 34,
        filterType: 'bandpass',
        filterFrequency: 1700,
        filterFrequencyEnd: 2600,
        q: 1.4,
      },
    ],
  },
  'Scatter Run!': {
    tones: [
      {
        waveform: 'square',
        frequency: 540,
        frequencyEnd: 410,
        durationMs: 70,
        volume: 0.09,
        attackMs: 2,
        releaseMs: 42,
        detuneJitterCents: 28,
      },
      {
        waveform: 'square',
        frequency: 860,
        frequencyEnd: 620,
        durationMs: 62,
        delayMs: 18,
        volume: 0.075,
        attackMs: 2,
        releaseMs: 36,
        detuneJitterCents: 36,
      },
      {
        waveform: 'triangle',
        frequency: 1180,
        frequencyEnd: 790,
        durationMs: 54,
        delayMs: 42,
        volume: 0.07,
        attackMs: 1,
        releaseMs: 28,
      },
    ],
    noiseBursts: [
      {
        durationMs: 46,
        volume: 0.03,
        attackMs: 1,
        releaseMs: 32,
        filterType: 'bandpass',
        filterFrequency: 2100,
        filterFrequencyEnd: 3200,
        q: 2.2,
      },
    ],
  },
  'Love Burst!': {
    tones: [
      {
        waveform: 'sine',
        frequency: 440,
        frequencyEnd: 660,
        durationMs: 160,
        volume: 0.09,
        attackMs: 8,
        releaseMs: 120,
      },
      {
        waveform: 'triangle',
        frequency: 554,
        frequencyEnd: 830,
        durationMs: 180,
        delayMs: 32,
        volume: 0.08,
        attackMs: 8,
        releaseMs: 132,
      },
      {
        waveform: 'sine',
        frequency: 659,
        frequencyEnd: 988,
        durationMs: 210,
        delayMs: 62,
        volume: 0.075,
        attackMs: 10,
        releaseMs: 150,
      },
    ],
    noiseBursts: [
      {
        durationMs: 34,
        delayMs: 56,
        volume: 0.018,
        attackMs: 3,
        releaseMs: 18,
        filterType: 'highpass',
        filterFrequency: 2600,
        filterFrequencyEnd: 3400,
      },
    ],
  },
  'Style Spread!': {
    tones: [
      {
        waveform: 'sine',
        frequency: 520,
        frequencyEnd: 980,
        durationMs: 140,
        volume: 0.11,
        attackMs: 5,
        releaseMs: 102,
      },
      {
        waveform: 'triangle',
        frequency: 920,
        frequencyEnd: 760,
        durationMs: 120,
        delayMs: 22,
        volume: 0.09,
        attackMs: 3,
        releaseMs: 84,
      },
      {
        waveform: 'sine',
        frequency: 1320,
        frequencyEnd: 1680,
        durationMs: 104,
        delayMs: 44,
        volume: 0.06,
        attackMs: 2,
        releaseMs: 68,
      },
    ],
    noiseBursts: [
      {
        durationMs: 40,
        delayMs: 16,
        volume: 0.022,
        attackMs: 1,
        releaseMs: 24,
        filterType: 'highpass',
        filterFrequency: 3200,
        filterFrequencyEnd: 4200,
      },
    ],
  },
  'Tetromino Drop!': {
    tones: [
      {
        waveform: 'square',
        frequency: 392,
        frequencyEnd: 247,
        durationMs: 110,
        volume: 0.12,
        attackMs: 3,
        releaseMs: 76,
      },
      {
        waveform: 'triangle',
        frequency: 196,
        frequencyEnd: 131,
        durationMs: 180,
        delayMs: 34,
        volume: 0.14,
        attackMs: 2,
        releaseMs: 128,
      },
      {
        waveform: 'square',
        frequency: 784,
        frequencyEnd: 784,
        durationMs: 58,
        delayMs: 120,
        volume: 0.08,
        attackMs: 1,
        releaseMs: 30,
      },
    ],
    noiseBursts: [
      {
        durationMs: 28,
        delayMs: 116,
        volume: 0.026,
        attackMs: 1,
        releaseMs: 18,
        filterType: 'bandpass',
        filterFrequency: 1400,
        filterFrequencyEnd: 1900,
        q: 2.4,
      },
    ],
  },
  'Blast Zone!': {
    tones: [
      {
        waveform: 'square',
        frequency: 330,
        frequencyEnd: 180,
        durationMs: 110,
        volume: 0.1,
        attackMs: 3,
        releaseMs: 74,
      },
      {
        waveform: 'triangle',
        frequency: 210,
        frequencyEnd: 96,
        durationMs: 170,
        delayMs: 26,
        volume: 0.12,
        attackMs: 2,
        releaseMs: 126,
      },
    ],
    noiseBursts: [
      {
        durationMs: 58,
        delayMs: 16,
        volume: 0.04,
        attackMs: 1,
        releaseMs: 42,
        filterType: 'bandpass',
        filterFrequency: 1500,
        filterFrequencyEnd: 800,
        q: 1.5,
      },
    ],
  },
};

export const DEFAULT_MUSIC_CONFIG: MusicConfig = {
  src: null,
  volume: 0.32,
  loop: true,
  fadeMs: 650,
};

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  masterVolume: 0.5,
  clickSound: DEFAULT_CLICK_SOUND,
  defaultModifierSound: DEFAULT_MODIFIER_SOUND,
  modifierSoundMap: DEFAULT_MODIFIER_SOUND_MAP,
  music: DEFAULT_MUSIC_CONFIG,
};
