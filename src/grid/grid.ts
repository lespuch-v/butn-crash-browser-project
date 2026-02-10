import type { Entity } from '@ecs/entity';
import { CELL_SIZE } from '../constants';
import { ALL_DIRECTIONS, DIRECTION_VECTORS, type Direction } from '@models/direction';

/**
 * Logical grid backed by a Map for O(1) lookups.
 * Grid coordinates are (col, row) where col=x, row=y.
 * Pixel conversion: x = col * cellSize, y = row * cellSize
 */
export class Grid {
  private cells: Map<string, number> = new Map(); // "col_row" → entityId
  public cellSize: number;

  constructor(cellSize: number = CELL_SIZE) {
    this.cellSize = cellSize;
  }

  // ── Key helpers ──────────────────────────────

  private key(col: number, row: number): string {
    return `${col}_${row}`;
  }

  // ── Cell operations ──────────────────────────

  /** Place an entity at a grid cell */
  set(col: number, row: number, entityId: number): void {
    this.cells.set(this.key(col, row), entityId);
  }

  /** Get entity ID at a grid cell */
  get(col: number, row: number): number | null {
    return this.cells.get(this.key(col, row)) ?? null;
  }

  /** Remove entity from a grid cell */
  remove(col: number, row: number): void {
    this.cells.delete(this.key(col, row));
  }

  /** Check if a cell is occupied */
  isOccupied(col: number, row: number): boolean {
    return this.cells.has(this.key(col, row));
  }

  /** Check if a cell is free */
  isFree(col: number, row: number): boolean {
    return !this.isOccupied(col, row);
  }

  // ── Coordinate conversion ────────────────────

  /** Grid cell → pixel position (top-left corner of cell) */
  cellToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.cellSize,
      y: row * this.cellSize,
    };
  }

  /** Pixel position → grid cell */
  pixelToCell(x: number, y: number): { col: number; row: number } {
    return {
      col: Math.floor(x / this.cellSize),
      row: Math.floor(y / this.cellSize),
    };
  }

  /** Center pixel position of a cell */
  cellCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2,
    };
  }

  // ── Neighbor queries ─────────────────────────

  /** Get the cell in a given direction */
  neighbor(col: number, row: number, direction: Direction): { col: number; row: number } {
    const vec = DIRECTION_VECTORS[direction];
    return {
      col: col + vec.x,
      row: row + vec.y,
    };
  }

  /** Get all free neighboring cells */
  freeNeighbors(col: number, row: number): { col: number; row: number; direction: Direction }[] {
    const result: { col: number; row: number; direction: Direction }[] = [];
    for (const dir of ALL_DIRECTIONS) {
      const n = this.neighbor(col, row, dir);
      if (this.isFree(n.col, n.row)) {
        result.push({ ...n, direction: dir });
      }
    }
    return result;
  }

  /** Find the first free cell in a direction (walks outward) */
  findFreeInDirection(
    startCol: number,
    startRow: number,
    direction: Direction,
    maxSteps: number = 50,
  ): { col: number; row: number } | null {
    const vec = DIRECTION_VECTORS[direction];
    let col = startCol + vec.x;
    let row = startRow + vec.y;

    for (let i = 0; i < maxSteps; i++) {
      if (this.isFree(col, row)) {
        return { col, row };
      }
      col += vec.x;
      row += vec.y;
    }
    return null;
  }

  // ── Bulk operations ──────────────────────────

  /** Get all occupied cells as [col, row, entityId] */
  entries(): [number, number, number][] {
    const result: [number, number, number][] = [];
    for (const [key, entityId] of this.cells) {
      const [col, row] = key.split('_').map(Number);
      result.push([col, row, entityId]);
    }
    return result;
  }

  /** Number of occupied cells */
  get size(): number {
    return this.cells.size;
  }

  /** Clear all cells */
  clear(): void {
    this.cells.clear();
  }
}
