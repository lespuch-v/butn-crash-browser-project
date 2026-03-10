import type { EventBus } from '@core/event-bus';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';
import { Direction } from '@models/direction';

const DEFAULT_EVASION_DURATION_MS = 7000;
const DEFAULT_EVASION_RADIUS = 3;
const RELOCATION_INTERVAL_MS = 90;
const SHAKE_AMPLITUDE_PX = 1.75;
const EvasionDirectionPriority: Direction[] = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
];

export class EvasionSystem {
  private remainingMs: number = 0;
  private radius: number = DEFAULT_EVASION_RADIUS;
  private lastCursorCol: number | null = null;
  private lastCursorRow: number | null = null;
  private relocationCooldownMs: number = 0;
  private elapsedMs: number = 0;

  constructor(
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {
    this.bus.on('modifier:evasion:start', ({ durationMs, radius }) => {
      this.activate(durationMs, radius);
    });
    this.bus.on('input:hover', ({ col, row }) => {
      if (!this.isActive()) return;
      if (this.lastCursorCol === col && this.lastCursorRow === row) return;
      this.lastCursorCol = col;
      this.lastCursorRow = row;
      this.evadeFrom(col, row);
    });
    this.bus.on('input:hover:exit', () => {
      this.lastCursorCol = null;
      this.lastCursorRow = null;
    });
    this.bus.on('button:spawned', ({ entityId }) => {
      if (!this.isActive()) return;
      const entity = this.entities.get(entityId);
      if (entity?.interactive) {
        entity.interactive.clickable = false;
      }
    });
    this.bus.on('game:reset', () => {
      this.deactivate();
    });
  }

  update(dt: number): void {
    if (!this.isActive()) return;

    this.elapsedMs += dt;
    this.remainingMs -= dt;
    this.relocationCooldownMs -= dt;

    this.applyShake();

    if (
      this.lastCursorCol !== null
      && this.lastCursorRow !== null
      && this.relocationCooldownMs <= 0
    ) {
      this.evadeFrom(this.lastCursorCol, this.lastCursorRow);
      this.relocationCooldownMs = RELOCATION_INTERVAL_MS;
    }

    if (this.remainingMs <= 0) {
      this.deactivate();
    }
  }

  private activate(durationMs: number = DEFAULT_EVASION_DURATION_MS, radius: number = DEFAULT_EVASION_RADIUS): void {
    this.remainingMs = Math.max(this.remainingMs, durationMs);
    this.radius = radius;
    this.relocationCooldownMs = 0;
    this.setClickable(false);
  }

  private deactivate(): void {
    if (this.remainingMs <= 0 && !this.isActive()) {
      this.lastCursorCol = null;
      this.lastCursorRow = null;
    }

    this.remainingMs = 0;
    this.radius = DEFAULT_EVASION_RADIUS;
    this.relocationCooldownMs = 0;
    this.elapsedMs = 0;
    this.lastCursorCol = null;
    this.lastCursorRow = null;
    this.setClickable(true);
    this.resetPositions();
  }

  private isActive(): boolean {
    return this.remainingMs > 0;
  }

  private setClickable(clickable: boolean): void {
    const interactiveEntities = this.entities.query('interactive');
    for (const entity of interactiveEntities) {
      if (!entity.interactive) continue;
      entity.interactive.clickable = clickable;
      if (!clickable) {
        entity.interactive.hovered = false;
      }
    }
  }

  private evadeFrom(cursorCol: number, cursorRow: number): void {
    const evasiveEntities = this.entities.query('gridCell', 'position', 'interactive');

    for (const entity of evasiveEntities) {
      const gc = entity.gridCell!;
      const centerCol = gc.col + (gc.colSpan - 1) / 2;
      const centerRow = gc.row + (gc.rowSpan - 1) / 2;
      const dx = centerCol - cursorCol;
      const dy = centerRow - cursorRow;

      if (Math.max(Math.abs(dx), Math.abs(dy)) > this.radius) continue;

      const directions = this.prioritizeDirections(dx, dy);
      for (const direction of directions) {
        const target = this.grid.findFreeShapeInDirection(
          gc.col,
          gc.row,
          direction,
          gc.colSpan,
          gc.rowSpan,
          gc.occupiedCells,
          5,
        );

        if (!target) continue;

        this.grid.removeShape(gc.col, gc.row, gc.colSpan, gc.rowSpan, gc.occupiedCells);
        this.grid.setShape(target.col, target.row, gc.colSpan, gc.rowSpan, entity.id, gc.occupiedCells);
        gc.col = target.col;
        gc.row = target.row;
        entity.position = this.grid.cellToPixel(target.col, target.row);
        break;
      }
    }
  }

  private prioritizeDirections(dx: number, dy: number): Direction[] {
    const horizontal = dx >= 0 ? Direction.Right : Direction.Left;
    const vertical = dy >= 0 ? Direction.Down : Direction.Up;

    if (Math.abs(dx) > Math.abs(dy)) {
      return [
        horizontal,
        vertical,
        this.opposite(vertical),
        this.opposite(horizontal),
      ];
    }

    if (Math.abs(dy) > Math.abs(dx)) {
      return [
        vertical,
        horizontal,
        this.opposite(horizontal),
        this.opposite(vertical),
      ];
    }

    return dx === 0 && dy === 0
      ? this.shuffleDirections([...EvasionDirectionPriority])
      : this.shuffleDirections([horizontal, vertical, this.opposite(horizontal), this.opposite(vertical)]);
  }

  private applyShake(): void {
    const evasiveEntities = this.entities.query('gridCell', 'position', 'interactive');

    for (const entity of evasiveEntities) {
      const gc = entity.gridCell;
      const position = entity.position;
      if (!gc || !position) continue;

      const base = this.grid.cellToPixel(gc.col, gc.row);
      const phase = entity.id * 0.91;
      const x = Math.sin((this.elapsedMs / 54) + phase) * SHAKE_AMPLITUDE_PX;
      const y = Math.cos((this.elapsedMs / 62) + phase * 1.3) * SHAKE_AMPLITUDE_PX;
      position.x = base.x + x;
      position.y = base.y + y;
    }
  }

  private resetPositions(): void {
    const evasiveEntities = this.entities.query('gridCell', 'position');

    for (const entity of evasiveEntities) {
      const gc = entity.gridCell;
      if (!gc || !entity.position) continue;
      entity.position = this.grid.cellToPixel(gc.col, gc.row);
    }
  }

  private shuffleDirections(directions: Direction[]): Direction[] {
    const copy = [...directions];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private opposite(direction: Direction): Direction {
    switch (direction) {
      case Direction.Up:
        return Direction.Down;
      case Direction.Down:
        return Direction.Up;
      case Direction.Left:
        return Direction.Right;
      case Direction.Right:
        return Direction.Left;
    }
  }
}
