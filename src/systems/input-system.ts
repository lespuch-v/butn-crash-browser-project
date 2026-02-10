import type { CanvasManager } from '@core/canvas-manager';
import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';
import type { SpawnPreviewState } from './spawn-preview';

/**
 * Converts raw mouse/touch input into game events.
 * Does grid-based hit detection for O(1) lookups.
 * Manages spawn preview state on hover.
 */
export class InputSystem {
  private lastHoveredEntity: number | null = null;

  // Right-click pan state
  private isPanning: boolean = false;
  private panLastX: number = 0;
  private panLastY: number = 0;

  constructor(
    private canvas: CanvasManager,
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
    private previewState: SpawnPreviewState,
  ) {
    this.canvas.canvas.addEventListener('click', this.handleClick);
    this.canvas.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleClick = (e: MouseEvent): void => {
    const { col, row } = this.getGridCoords(e);

    // Check if clicking a spawn preview "+" cell
    const hit = this.previewState.getAt(col, row);
    if (hit && this.previewState.sourceEntityId !== null) {
      this.bus.emit('preview:click', {
        col,
        row,
        direction: hit.preview.direction,
        sourceEntityId: this.previewState.sourceEntityId,
      });
      this.previewState.clear();
      return;
    }

    // Otherwise, normal click
    const entityId = this.grid.get(col, row);
    this.bus.emit('input:click', { col, row, entityId });
  };

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button === 2) {
      this.isPanning = true;
      this.panLastX = e.clientX;
      this.panLastY = e.clientY;
    }
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (e.button === 2) {
      this.isPanning = false;
    }
  };

  private handleContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private handleMouseMove = (e: MouseEvent): void => {
    // Handle panning
    if (this.isPanning) {
      const dx = e.clientX - this.panLastX;
      const dy = e.clientY - this.panLastY;
      this.panLastX = e.clientX;
      this.panLastY = e.clientY;
      this.canvas.panBy(-dx, -dy);
      return;
    }

    const { col, row } = this.getGridCoords(e);
    const entityId = this.grid.get(col, row);

    // Check if hovering a preview cell
    const previewHit = this.previewState.getAt(col, row);
    if (previewHit) {
      this.previewState.hoveredIndex = previewHit.index;
      // Clear entity hover while over a preview
      if (this.lastHoveredEntity !== null) {
        const prevEntity = this.entities.get(this.lastHoveredEntity);
        if (prevEntity?.interactive) {
          prevEntity.interactive.hovered = false;
        }
      }
      return;
    }

    // Not hovering a preview — clear preview hover
    this.previewState.hoveredIndex = null;

    // Clear previous entity hover
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

      // Update spawn previews if hovering a new button (span-aware)
      if (entityId !== this.previewState.sourceEntityId && entity?.gridCell) {
        const gc = entity.gridCell;
        const freeNeighbors = this.grid.freeNeighborsAroundSpan(
          gc.col, gc.row, gc.colSpan, gc.rowSpan,
        );
        this.previewState.update(
          freeNeighbors.map((n) => ({ col: n.col, row: n.row, direction: n.direction })),
          entityId,
        );
      }
    } else {
      // Hovering empty space — clear previews
      this.previewState.clear();
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
    this.previewState.clear();
    this.bus.emit('input:hover:exit', {});
  };

  private getGridCoords(e: MouseEvent): { col: number; row: number } {
    const rect = this.canvas.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = this.canvas.screenToWorld(screenX, screenY);
    return this.grid.pixelToCell(world.x, world.y);
  }

  /** Update cursor style based on hover/pan state */
  update(): void {
    if (this.isPanning) {
      this.canvas.canvas.style.cursor = 'grabbing';
    } else if (this.previewState.hoveredIndex !== null) {
      this.canvas.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.canvas.style.cursor = this.lastHoveredEntity !== null ? 'pointer' : 'default';
    }
  }

  destroy(): void {
    this.canvas.canvas.removeEventListener('click', this.handleClick);
    this.canvas.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }
}
