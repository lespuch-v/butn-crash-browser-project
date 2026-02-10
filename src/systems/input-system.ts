import type { CanvasManager } from '@core/canvas-manager';
import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';

/**
 * Converts raw mouse/touch input into game events.
 * Does grid-based hit detection for O(1) lookups.
 */
export class InputSystem {
  private lastHoveredEntity: number | null = null;

  constructor(
    private canvas: CanvasManager,
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {
    this.canvas.canvas.addEventListener('click', this.handleClick);
    this.canvas.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleClick = (e: MouseEvent): void => {
    const { col, row } = this.getGridCoords(e);
    const entityId = this.grid.get(col, row);

    this.bus.emit('input:click', { col, row, entityId });
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const { col, row } = this.getGridCoords(e);
    const entityId = this.grid.get(col, row);

    // Clear previous hover
    if (this.lastHoveredEntity !== null && this.lastHoveredEntity !== entityId) {
      const prevEntity = this.entities.get(this.lastHoveredEntity);
      if (prevEntity?.interactive) {
        prevEntity.interactive.hovered = false;
      }
    }

    // Set new hover
    if (entityId !== null) {
      const entity = this.entities.get(entityId);
      if (entity?.interactive) {
        entity.interactive.hovered = true;
      }
    }

    this.lastHoveredEntity = entityId;
    this.bus.emit('input:hover', { col, row, entityId });
  };

  private handleMouseLeave = (): void => {
    if (this.lastHoveredEntity !== null) {
      const entity = this.entities.get(this.lastHoveredEntity);
      if (entity?.interactive) {
        entity.interactive.hovered = false;
      }
      this.lastHoveredEntity = null;
    }
    this.bus.emit('input:hover:exit', {});
  };

  private getGridCoords(e: MouseEvent): { col: number; row: number } {
    const rect = this.canvas.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return this.grid.pixelToCell(x, y);
  }

  /** Update cursor style based on hover state */
  update(): void {
    this.canvas.canvas.style.cursor = this.lastHoveredEntity !== null ? 'pointer' : 'default';
  }

  destroy(): void {
    this.canvas.canvas.removeEventListener('click', this.handleClick);
    this.canvas.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }
}
