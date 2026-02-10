import type { Modifier, ModifierContext } from './modifier';

/**
 * 🎨 STYLE COPY — All buttons adopt the clicked button's style!
 */
export const StyleCopyModifier: Modifier = {
  name: 'Style Copy!',
  icon: '🎨',
  weight: 2,

  execute(ctx: ModifierContext): void {
    const { clickedEntity, entities, effects, grid, col, row } = ctx;
    const sourceStyle = clickedEntity.renderable?.style;
    if (!sourceStyle) return;

    // Copy style to ALL buttons
    const allButtons = entities.query('renderable', 'gridCell');
    for (const entity of allButtons) {
      if (entity.id === clickedEntity.id) continue;
      entity.renderable!.style = { ...sourceStyle };

      // Small sparkle on each converted button
      if (entity.position) {
        const cx = entity.position.x + grid.cellSize / 2;
        const cy = entity.position.y + grid.cellSize / 2;
        effects.emit(cx, cy, sourceStyle.fillColor, 4);
      }
    }

    // Bigger effect on source
    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, sourceStyle.fillColor, 20);
  },
};
