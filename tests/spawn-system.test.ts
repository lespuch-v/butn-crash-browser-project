import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '@core/event-bus';
import { EntityManager } from '@ecs/entity-manager';
import { Grid } from '@grid/grid';
import { BUTTON_SHADER_PRESETS, type ButtonShaderPreset } from '@models/button-shader';
import type { ButtonStyle } from '@models/button-style';
import { SpeciesType } from '@models/species';
import { SpawnSystem } from '@systems/spawn-system';

function testStyle(): ButtonStyle {
  return {
    fillColor: '#2563eb',
    borderColor: '#1d4ed8',
    borderWidth: 2,
    borderRadius: 12,
    shadowBlur: 10,
    shadowColor: 'rgba(37, 99, 235, 0.35)',
    icon: 'Test',
    hoverFillColor: '#1e40af',
    shape: 'pill',
    width: 56,
    height: 40,
    content: {
      text: 'Test',
      fontSize: 0.35,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      rotation: 0,
    },
  };
}

function createSystem(): SpawnSystem {
  return new SpawnSystem(new EventBus(), new EntityManager(), new Grid(64));
}

describe('SpawnSystem shader variants', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('marks a spawned button as shadered when the chance roll hits', () => {
    const system = createSystem();
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const entity = system.spawnButton(0, 0, testStyle());

    expect(entity?.species?.type).toBe(SpeciesType.Shadered);
    expect(entity?.renderable?.shader).toBe(BUTTON_SHADER_PRESETS[0]);
  });

  it('keeps a spawned button normal when the shader roll misses', () => {
    const system = createSystem();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const entity = system.spawnButton(0, 0, testStyle());

    expect(entity?.species?.type).toBe(SpeciesType.Normal);
    expect(entity?.renderable?.shader).toBeUndefined();
  });

  it('lets callers disable shader rolls for specific spawns', () => {
    const system = createSystem();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const entity = system.spawnButton(0, 0, testStyle(), {
      allowShaderVariant: false,
    });

    expect(entity?.species?.type).toBe(SpeciesType.Normal);
    expect(entity?.renderable?.shader).toBeUndefined();
  });

  it('accepts an explicit shader preset override', () => {
    const system = createSystem();
    const forcedShader: ButtonShaderPreset = BUTTON_SHADER_PRESETS[2];

    const entity = system.spawnButton(0, 0, testStyle(), {
      shaderPreset: forcedShader,
    });

    expect(entity?.species?.type).toBe(SpeciesType.Shadered);
    expect(entity?.renderable?.shader).toBe(forcedShader);
  });
});
