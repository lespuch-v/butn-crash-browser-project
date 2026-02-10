import { CELL_SIZE } from '../constants';
import { ALL_DIRECTIONS, Direction, DIRECTION_VECTORS } from '@models/direction';

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

  // ── Span operations ─────────────────────────

  /** Place an entity across multiple cells. Anchor is top-left. */
  setSpan(col: number, row: number, colSpan: number, rowSpan: number, entityId: number): void {
    for (let dc = 0; dc < colSpan; dc++) {
      for (let dr = 0; dr < rowSpan; dr++) {
        this.cells.set(this.key(col + dc, row + dr), entityId);
      }
    }
  }

  /** Remove an entity from all its spanned cells */
  removeSpan(col: number, row: number, colSpan: number, rowSpan: number): void {
    for (let dc = 0; dc < colSpan; dc++) {
      for (let dr = 0; dr < rowSpan; dr++) {
        this.cells.delete(this.key(col + dc, row + dr));
      }
    }
  }

  /** Check if all cells in a span are free */
  isSpanFree(col: number, row: number, colSpan: number, rowSpan: number): boolean {
    for (let dc = 0; dc < colSpan; dc++) {
      for (let dr = 0; dr < rowSpan; dr++) {
        if (this.isOccupied(col + dc, row + dr)) return false;
      }
    }
    return true;
  }

  /** Center pixel position of a multi-cell span */
  spanCenter(col: number, row: number, colSpan: number, rowSpan: number): { x: number; y: number } {
    return {
      x: col * this.cellSize + (colSpan * this.cellSize) / 2,
      y: row * this.cellSize + (rowSpan * this.cellSize) / 2,
    };
  }

  /** Find first free span-sized region walking in a direction */
  findFreeSpanInDirection(
    startCol: number,
    startRow: number,
    direction: Direction,
    colSpan: number,
    rowSpan: number,
    maxSteps: number = 50,
  ): { col: number; row: number } | null {
    const vec = DIRECTION_VECTORS[direction];
    let col = startCol + vec.x;
    let row = startRow + vec.y;

    for (let i = 0; i < maxSteps; i++) {
      if (this.isSpanFree(col, row, colSpan, rowSpan)) {
        return { col, row };
      }
      col += vec.x;
      row += vec.y;
    }
    return null;
  }

  /** Get free cells adjacent to an entity's full bounding box (for spawn previews) */
  freeNeighborsAroundSpan(
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
  ): { col: number; row: number; direction: Direction }[] {
    const result: { col: number; row: number; direction: Direction }[] = [];

    // Top edge: row - 1, across all columns of the span
    for (let dc = 0; dc < colSpan; dc++) {
      const c = col + dc;
      const r = row - 1;
      if (this.isFree(c, r)) {
        result.push({ col: c, row: r, direction: Direction.Up });
        break;
      }
    }

    // Bottom edge: row + rowSpan, across all columns
    for (let dc = 0; dc < colSpan; dc++) {
      const c = col + dc;
      const r = row + rowSpan;
      if (this.isFree(c, r)) {
        result.push({ col: c, row: r, direction: Direction.Down });
        break;
      }
    }

    // Left edge: col - 1, across all rows of the span
    for (let dr = 0; dr < rowSpan; dr++) {
      const c = col - 1;
      const r = row + dr;
      if (this.isFree(c, r)) {
        result.push({ col: c, row: r, direction: Direction.Left });
        break;
      }
    }

    // Right edge: col + colSpan, across all rows
    for (let dr = 0; dr < rowSpan; dr++) {
      const c = col + colSpan;
      const r = row + dr;
      if (this.isFree(c, r)) {
        result.push({ col: c, row: r, direction: Direction.Right });
        break;
      }
    }

    return result;
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
