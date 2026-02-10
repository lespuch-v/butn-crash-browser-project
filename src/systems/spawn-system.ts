import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Entity } from '@ecs/entity';
import type { Grid } from '@grid/grid';
import { createDefaultRenderable } from '@ecs/components/renderable';
import { createDefaultInteractive } from '@ecs/components/interactive';
import { createDefaultSpecies } from '@ecs/components/species';
import { createAnimation, AnimationType } from '@ecs/components/animation';
import { randomStyle, type ButtonStyle } from '@models/button-style';
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
  }

  private handleClick = (payload: { col: number; row: number; entityId: number | null }): void => {
    const { col, row, entityId } = payload;

    if (entityId === null) return; // clicked empty space

    const entity = this.entities.get(entityId);
    if (!entity?.interactive?.clickable) return;

    this.clickCount++;

    // Pick a direction and find a free cell
    const direction = randomDirection();
    const target = this.grid.findFreeInDirection(col, row, direction);

    if (target) {
      const style = randomStyle();
      this.spawnButton(target.col, target.row, style);
    }

    // Emit clicked event
    this.bus.emit('button:clicked', {
      entityId,
      col,
      row,
      direction,
    });

    // Spawn particles at clicked button
    if (entity.position) {
      const cx = entity.position.x + this.grid.cellSize / 2;
      const cy = entity.position.y + this.grid.cellSize / 2;
      this.bus.emit('effect:particles', {
        x: cx,
        y: cy,
        color: entity.renderable?.style.fillColor ?? '#ffffff',
        count: 8,
      });
    }
  };

  /** Spawn a button at a specific grid cell */
  spawnButton(col: number, row: number, style?: ButtonStyle): Entity {
    const resolvedStyle = style ?? randomStyle();
    const entity = this.entities.create();
    const pixel = this.grid.cellToPixel(col, row);

    // Attach components
    entity.position = { x: pixel.x, y: pixel.y };
    entity.gridCell = { col, row };
    entity.renderable = createDefaultRenderable(resolvedStyle);
    entity.interactive = createDefaultInteractive();
    entity.species = createDefaultSpecies();
    entity.animation = createAnimation(AnimationType.SpawnPop, SPAWN_ANIM_DURATION_MS);

    // Start at scale 0 for spawn animation
    entity.renderable.scale = 0;

    // Register in grid
    this.grid.set(col, row, entity.id);

    this.bus.emit('button:spawned', { entityId: entity.id, col, row });

    return entity;
  }

  /** Spawn multiple buttons at specific cells */
  spawnMultiple(cells: { col: number; row: number }[], style?: ButtonStyle): Entity[] {
    return cells
      .filter((c) => this.grid.isFree(c.col, c.row))
      .map((c) => this.spawnButton(c.col, c.row, style));
  }
}
