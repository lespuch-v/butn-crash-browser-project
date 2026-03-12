import { createSpecies } from '@ecs/components/species';
import { getButtonShader, randomButtonShader } from '@models/button-shader';
import { SpeciesType } from '@models/species';
import type { Modifier, ModifierContext } from './modifier';

export const ShaderInfusionModifier: Modifier = {
  name: 'Shader Shift!',
  icon: '✨',
  shader: 'nebula-plasma',
  weight: 1.25,

  execute(ctx: ModifierContext): void {
    const { clickedEntity, effects, grid } = ctx;
    if (!clickedEntity.renderable || !clickedEntity.gridCell) return;

    const selectedShader = randomButtonShader();
    clickedEntity.renderable.shader = selectedShader;
    clickedEntity.species = createSpecies(SpeciesType.Shadered);

    const shaderMeta = getButtonShader(selectedShader);
    const center = grid.spanCenter(
      clickedEntity.gridCell.col,
      clickedEntity.gridCell.row,
      clickedEntity.gridCell.colSpan,
      clickedEntity.gridCell.rowSpan,
    );

    effects.emit(center.x, center.y, shaderMeta.accentColor, 18);
  },
};
