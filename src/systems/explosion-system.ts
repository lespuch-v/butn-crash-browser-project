import type { EventBus } from '@core/event-bus';
import type { Entity } from '@ecs/entity';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';

const MAX_JITTER_PX = 4;
const BASE_PULSE_SCALE = 0.02;
const MAX_PULSE_SCALE = 0.1;

export class ExplosionSystem {
  private detonatingIds = new Set<number>();

  constructor(
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {}

  update(dt: number): void {
    const explosives = this.entities.query('explosive', 'gridCell', 'position');

    for (const entity of explosives) {
      const explosive = entity.explosive;
      if (!explosive || explosive.detonated) continue;

      explosive.elapsedMs += dt;
      this.applyFuseMotion(entity);

      if (explosive.elapsedMs >= explosive.fuseMs) {
        this.detonate(entity.id);
      }
    }
  }

  private applyFuseMotion(entity: Entity): void {
    const explosive = entity.explosive;
    const gridCell = entity.gridCell;
    const position = entity.position;
    if (!explosive || !gridCell || !position) return;

    const base = this.grid.cellToPixel(gridCell.col, gridCell.row);
    const progress = Math.min(explosive.elapsedMs / explosive.fuseMs, 1);
    const intensity = progress * progress;
    const jitter = MAX_JITTER_PX * intensity;

    position.x = base.x + Math.sin((explosive.elapsedMs / 65) + entity.id * 0.91) * jitter;
    position.y = base.y + Math.cos((explosive.elapsedMs / 53) + entity.id * 1.17) * jitter;

    if (!entity.renderable || entity.animation) return;

    const pulse = 0.5 + Math.sin((explosive.elapsedMs / 120) + entity.id * 0.7) * 0.5;
    entity.renderable.scale = 1 + (BASE_PULSE_SCALE + MAX_PULSE_SCALE * intensity) * pulse;
    entity.renderable.rotation = Math.sin((explosive.elapsedMs / 90) + entity.id) * 0.04 * intensity;
    entity.renderable.opacity = 0.8 + 0.2 * pulse;
  }

  private detonate(entityId: number): void {
    if (this.detonatingIds.has(entityId)) return;

    const entity = this.entities.get(entityId);
    const explosive = entity?.explosive;
    const gridCell = entity?.gridCell;
    if (!entity?.active || !explosive || !gridCell) return;

    this.detonatingIds.add(entityId);
    explosive.detonated = true;

    const affectedIds = new Set<number>();
    for (let dc = -explosive.blastRadius; dc <= explosive.blastRadius; dc++) {
      for (let dr = -explosive.blastRadius; dr <= explosive.blastRadius; dr++) {
        const targetId = this.grid.get(gridCell.col + dc, gridCell.row + dr);
        if (targetId !== null) {
          affectedIds.add(targetId);
        }
      }
    }

    this.bus.emit('effect:explosion', {
      col: gridCell.col,
      row: gridCell.row,
      radius: explosive.blastRadius,
    });

    this.destroyEntity(entity);

    for (const targetId of affectedIds) {
      if (targetId === entityId) continue;

      const target = this.entities.get(targetId);
      if (!target?.active) continue;

      if (target.explosive && !target.explosive.detonated) {
        this.detonate(target.id);
        continue;
      }

      this.destroyEntity(target);
    }

    this.detonatingIds.delete(entityId);
  }

  private destroyEntity(entity: Entity): void {
    if (!entity.active) return;

    if (entity.gridCell) {
      const { col, row, colSpan, rowSpan, occupiedCells } = entity.gridCell;
      this.grid.removeShape(col, row, colSpan, rowSpan, occupiedCells);
      this.bus.emit('button:destroyed', {
        entityId: entity.id,
        col,
        row,
      });

      const center = this.grid.spanCenter(col, row, colSpan, rowSpan);
      this.bus.emit('effect:particles', {
        x: center.x,
        y: center.y,
        color: entity.renderable?.style.fillColor ?? '#ffb347',
        count: entity.explosive ? 18 : 10,
      });
    }

    this.entities.destroy(entity.id);
  }
}
