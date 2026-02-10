import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Entity } from '@ecs/entity';
import type { Grid } from '@grid/grid';
import { createDefaultRenderable } from '@ecs/components/renderable';
import { createDefaultInteractive } from '@ecs/components/interactive';
import { createDefaultSpecies } from '@ecs/components/species';
import { createAnimation, AnimationType } from '@ecs/components/animation';
import { randomStyle, computeSpan, type ButtonStyle } from '@models/button-style';
import { randomDirection, type Direction } from '@models/direction';
import { SPAWN_ANIM_DURATION_MS } from '../constants';

/**
 * Handles spawning button entities onto the grid.
 */
export class SpawnSystem {
  public clickCount: number = 0;

  constructor(
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {
    this.bus.on('input:click', this.handleClick);
    this.bus.on('preview:click', this.handlePreviewClick);
  }

  private handleClick = (payload: { col: number; row: number; entityId: number | null }): void => {
    const { entityId } = payload;

    if (entityId === null) return; // clicked empty space

    const entity = this.entities.get(entityId);
    if (!entity?.interactive?.clickable) return;

    this.clickCount++;

    // Use the entity's anchor cell for direction-finding
    const anchor = entity.gridCell!;
    const direction = randomDirection();
    const style = randomStyle();
    const { colSpan, rowSpan } = computeSpan(style.width, style.height);

    const target = this.grid.findFreeSpanInDirection(
      anchor.col, anchor.row, direction, colSpan, rowSpan,
    );

    if (target) {
      this.spawnButton(target.col, target.row, style);
    }

    // Emit clicked event
    this.bus.emit('button:clicked', {
      entityId,
      col: anchor.col,
      row: anchor.row,
      direction,
    });

    // Spawn particles at the center of the clicked entity's span
    if (entity.position && entity.gridCell) {
      const center = this.grid.spanCenter(
        entity.gridCell.col, entity.gridCell.row,
        entity.gridCell.colSpan, entity.gridCell.rowSpan,
      );
      this.bus.emit('effect:particles', {
        x: center.x,
        y: center.y,
        color: entity.renderable?.style.fillColor ?? '#ffffff',
        count: 8,
      });
    }
  };

  private handlePreviewClick = (payload: {
    col: number;
    row: number;
    direction: Direction;
    sourceEntityId: number;
  }): void => {
    const { col, row, direction, sourceEntityId } = payload;

    const sourceEntity = this.entities.get(sourceEntityId);
    if (!sourceEntity) return;

    this.clickCount++;
    const style = randomStyle();
    const { colSpan, rowSpan } = computeSpan(style.width, style.height);

    // Try to place at the preview cell as the anchor
    let spawnCol = col;
    let spawnRow = row;

    if (!this.grid.isSpanFree(spawnCol, spawnRow, colSpan, rowSpan)) {
      // Fallback: find a free span near the preview cell in the same direction
      const fallback = this.grid.findFreeSpanInDirection(
        sourceEntity.gridCell!.col, sourceEntity.gridCell!.row,
        direction, colSpan, rowSpan,
      );
      if (!fallback) return;
      spawnCol = fallback.col;
      spawnRow = fallback.row;
    }

    this.spawnButton(spawnCol, spawnRow, style);

    this.bus.emit('button:clicked', {
      entityId: sourceEntityId,
      col: sourceEntity.gridCell?.col ?? col,
      row: sourceEntity.gridCell?.row ?? row,
      direction,
    });

    // Particles at source button span center
    if (sourceEntity.position && sourceEntity.gridCell) {
      const center = this.grid.spanCenter(
        sourceEntity.gridCell.col, sourceEntity.gridCell.row,
        sourceEntity.gridCell.colSpan, sourceEntity.gridCell.rowSpan,
      );
      this.bus.emit('effect:particles', {
        x: center.x,
        y: center.y,
        color: sourceEntity.renderable?.style.fillColor ?? '#ffffff',
        count: 8,
      });
    }
  };

  /** Spawn a button at a specific grid cell (anchor = top-left of span) */
  spawnButton(col: number, row: number, style?: ButtonStyle): Entity | null {
    const resolvedStyle = style ?? randomStyle();
    const { colSpan, rowSpan } = computeSpan(resolvedStyle.width, resolvedStyle.height);

    // Validate that the full span is free
    if (!this.grid.isSpanFree(col, row, colSpan, rowSpan)) {
      // Fallback: clamp dimensions to fit a single cell
      if (colSpan > 1 || rowSpan > 1) {
        if (!this.grid.isFree(col, row)) return null;
        resolvedStyle.width = Math.min(resolvedStyle.width, 56);
        resolvedStyle.height = Math.min(resolvedStyle.height, 56);
        return this.spawnButton(col, row, resolvedStyle);
      }
      return null;
    }

    const entity = this.entities.create();
    const pixel = this.grid.cellToPixel(col, row);

    // Attach components
    entity.position = { x: pixel.x, y: pixel.y };
    entity.gridCell = { col, row, colSpan, rowSpan };
    entity.renderable = createDefaultRenderable(resolvedStyle);
    entity.interactive = createDefaultInteractive();
    entity.species = createDefaultSpecies();
    entity.animation = createAnimation(AnimationType.SpawnPop, SPAWN_ANIM_DURATION_MS);

    // Start at scale 0 for spawn animation
    entity.renderable.scale = 0;

    // Register in grid across all cells of the span
    this.grid.setSpan(col, row, colSpan, rowSpan, entity.id);

    this.bus.emit('button:spawned', { entityId: entity.id, col, row });

    return entity;
  }

  /** Spawn multiple buttons at specific cells (span-aware, random style per button) */
  spawnMultiple(cells: { col: number; row: number }[], style?: ButtonStyle): Entity[] {
    const results: Entity[] = [];
    for (const c of cells) {
      const s = style ? { ...style, content: style.content ? { ...style.content } : style.content } : randomStyle();
      const entity = this.spawnButton(c.col, c.row, s);
      if (entity) results.push(entity);
    }
    return results;
  }
}
