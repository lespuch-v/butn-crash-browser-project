import { describe, expect, it, vi } from 'vitest';
import { createDefaultRenderable } from '@ecs/components/renderable';
import { createSpecies } from '@ecs/components/species';
import type { Entity } from '@ecs/entity';
import { Grid } from '@grid/grid';
import { BUTTON_SHADER_PRESETS } from '@models/button-shader';
import { retroInitialStyle } from '@models/button-style';
import { SpeciesType } from '@models/species';
import { ShaderInfusionModifier } from '@modifiers/shader-infusion';

describe('ShaderInfusionModifier', () => {
  it('assigns a random exported shader to the clicked button', () => {
    const grid = new Grid(64);
    const effects = { emit: vi.fn() };
    const clickedEntity: Entity = {
      id: 1,
      active: true,
      position: { x: 0, y: 0 },
      gridCell: { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
      renderable: createDefaultRenderable(retroInitialStyle()),
      species: createSpecies(),
    };

    vi.spyOn(Math, 'random').mockReturnValue(0);

    ShaderInfusionModifier.execute({
      clickedEntity,
      col: 0,
      row: 0,
      direction: 'right' as never,
      entities: {} as never,
      grid,
      bus: {} as never,
      spawner: {} as never,
      effects: effects as never,
    });

    expect(clickedEntity.renderable?.shader).toBe(BUTTON_SHADER_PRESETS[0]);
    expect(clickedEntity.species?.type).toBe(SpeciesType.Shadered);
    expect(effects.emit).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});
