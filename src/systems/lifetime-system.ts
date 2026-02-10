import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';

/**
 * Tracks entity lifetimes and destroys expired ones.
 */
export class LifetimeSystem {
  constructor(
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {}

  update(dt: number): void {
    const mortal = this.entities.query('lifetime');

    for (const entity of mortal) {
      const lifetime = entity.lifetime!;
      lifetime.elapsed += dt;

      if (lifetime.elapsed >= lifetime.ttl) {
        // Remove from grid if it has a grid cell (span-aware)
        if (entity.gridCell) {
          const gc = entity.gridCell;
          this.grid.removeSpan(gc.col, gc.row, gc.colSpan, gc.rowSpan);
          this.bus.emit('button:destroyed', {
            entityId: entity.id,
            col: gc.col,
            row: gc.row,
          });
        }

        this.entities.destroy(entity.id);
      }
    }
  }
}
