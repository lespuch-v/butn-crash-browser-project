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
}

export interface SoundDefinition {
  tones: readonly ToneSpec[];
  sample?: {
    src: string;
    volume?: number;
    playbackRate?: number;
  };
}

export interface SoundConfig {
  enabled: boolean;
  masterVolume: number;
  clickSound: SoundDefinition;
  defaultModifierSound: SoundDefinition;
  modifierSoundMap: Record<string, SoundDefinition>;
}

export const DEFAULT_CLICK_SOUND: SoundDefinition = {
  tones: [
    {
      waveform: 'triangle',
      frequency: 720,
      frequencyEnd: 560,
      durationMs: 85,
      volume: 0.22,
      attackMs: 4,
      releaseMs: 65,
    },
  ],
};

export const DEFAULT_MODIFIER_SOUND: SoundDefinition = {
  tones: [
    {
      waveform: 'sawtooth',
      frequency: 520,
      frequencyEnd: 840,
      durationMs: 120,
      volume: 0.2,
      attackMs: 5,
      releaseMs: 90,
    },
    {
      waveform: 'square',
      frequency: 880,
      frequencyEnd: 660,
      durationMs: 100,
      delayMs: 36,
      volume: 0.12,
      attackMs: 3,
      releaseMs: 72,
    },
  ],
};

export const DEFAULT_MODIFIER_SOUND_MAP: Record<string, SoundDefinition> = {
  'Mass Spawn!': {
    sample: {
      src: '/sounds/8bit-explosion.mp3',
      volume: 0.65,
      playbackRate: 1,
    },
    tones: [
      {
        waveform: 'sawtooth',
        frequency: 260,
        frequencyEnd: 640,
        durationMs: 160,
        volume: 0.2,
        attackMs: 6,
        releaseMs: 120,
      },
      {
        waveform: 'triangle',
        frequency: 720,
        frequencyEnd: 1040,
        durationMs: 90,
        delayMs: 42,
        volume: 0.14,
        attackMs: 4,
        releaseMs: 70,
      },
    ],
  },
  'Style Spread!': {
    tones: [
      {
        waveform: 'sine',
        frequency: 460,
        frequencyEnd: 760,
        durationMs: 110,
        volume: 0.17,
        attackMs: 5,
        releaseMs: 84,
      },
      {
        waveform: 'triangle',
        frequency: 910,
        frequencyEnd: 700,
        durationMs: 95,
        delayMs: 32,
        volume: 0.13,
        attackMs: 3,
        releaseMs: 68,
      },
    ],
  },
};

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  masterVolume: 0.5,
  clickSound: DEFAULT_CLICK_SOUND,
  defaultModifierSound: DEFAULT_MODIFIER_SOUND,
  modifierSoundMap: DEFAULT_MODIFIER_SOUND_MAP,
};
