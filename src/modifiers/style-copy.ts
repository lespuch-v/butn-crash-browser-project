import type { Modifier, ModifierContext } from './modifier';

const SPREAD_RADIUS = 3; // Chebyshev distance in grid cells (7x7 area)

/**
 * 🎨 STYLE SPREAD — Nearby buttons adopt the clicked button's style!
 * Only affects buttons within a 3-cell radius, creating local color zones.
 * Preserves target button dimensions to avoid span/size mismatches.
 */
export const StyleCopyModifier: Modifier = {
    name: 'Style Spread!',
    icon: '🎨',
    weight: 1,

    execute(ctx: ModifierContext): void {
        const { clickedEntity, entities, effects, grid, col, row } = ctx;
        const sourceStyle = clickedEntity.renderable?.style;
        if (!sourceStyle) return;

        let affected = 0;
        const processed = new Set<number>();

        // Only affect buttons within SPREAD_RADIUS cells
        for (let dc = -SPREAD_RADIUS; dc <= SPREAD_RADIUS; dc++) {
            for (let dr = -SPREAD_RADIUS; dr <= SPREAD_RADIUS; dr++) {
                if (dc === 0 && dr === 0) continue;

                const entityId = grid.get(col + dc, row + dr);
                if (entityId === null) continue;
                if (entityId === clickedEntity.id) continue;
                if (processed.has(entityId)) continue;
                processed.add(entityId);

                const entity = entities.get(entityId);
                if (!entity?.renderable) continue;

                // Copy style but preserve target's dimensions
                const targetWidth = entity.renderable.style.width;
                const targetHeight = entity.renderable.style.height;
                entity.renderable.style = {
                    ...sourceStyle,
                    width: targetWidth,
                    height: targetHeight,
                    content: sourceStyle.content ? { ...sourceStyle.content } : sourceStyle.content,
                };
                affected++;

                // Sparkle at the entity's span center
                if (entity.position && entity.gridCell) {
                    const center = grid.spanCenter(
                        entity.gridCell.col, entity.gridCell.row,
                        entity.gridCell.colSpan, entity.gridCell.rowSpan,
                    );
                    effects.emit(center.x, center.y, sourceStyle.fillColor, 4);
                }
            }
        }

        // Bigger effect on source
        const center = grid.cellCenter(col, row);
        effects.emit(center.x, center.y, sourceStyle.fillColor, affected > 0 ? 20 : 10);
    },
};
