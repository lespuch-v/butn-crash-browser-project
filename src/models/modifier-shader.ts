export const MODIFIER_SHADER_PRESETS = [
  'prismatic-hologram',
  'energy-core-pulse',
  'liquid-chrome',
  'nebula-plasma',
  'glitch-reactor',
  'retro-crt-beam',
] as const;

export type ModifierShaderPreset = (typeof MODIFIER_SHADER_PRESETS)[number];

export const DEFAULT_MODIFIER_SHADER: ModifierShaderPreset = 'prismatic-hologram';
const MODIFIER_SHADER_CLASS_PREFIX = 'shader-';

export const MODIFIER_SHADER_CLASSES = MODIFIER_SHADER_PRESETS.map(
  (preset) => `${MODIFIER_SHADER_CLASS_PREFIX}${preset}`,
);

export function toModifierShaderClass(shader: ModifierShaderPreset): string {
  return `${MODIFIER_SHADER_CLASS_PREFIX}${shader}`;
}

/**
 * Deterministic fallback so every modifier name maps to one of the six presets.
 */
export function shaderFromModifierName(modifierName: string): ModifierShaderPreset {
  let hash = 0;
  for (let i = 0; i < modifierName.length; i++) {
    hash = (hash * 31 + modifierName.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % MODIFIER_SHADER_PRESETS.length;
  return MODIFIER_SHADER_PRESETS[index];
}
