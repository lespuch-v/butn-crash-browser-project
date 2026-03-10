import { CELL_SIZE } from '../constants';
import { ALL_DIRECTIONS, Direction, DIRECTION_VECTORS } from '@models/direction';
import type { GridCellOffset } from '@ecs/components/grid-cell';

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

  private rectCells(colSpan: number, rowSpan: number): GridCellOffset[] {
    const cells: GridCellOffset[] = [];
    for (let dc = 0; dc < colSpan; dc++) {
      for (let dr = 0; dr < rowSpan; dr++) {
        cells.push({ col: dc, row: dr });
      }
    }
    return cells;
  }

  occupiedCellsFor(colSpan: number, rowSpan: number, occupiedCells?: GridCellOffset[]): GridCellOffset[] {
    return occupiedCells ?? this.rectCells(colSpan, rowSpan);
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
    this.setShape(col, row, colSpan, rowSpan, entityId);
  }

  /** Place an entity across an arbitrary shape inside its bounding box. */
  setShape(
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    entityId: number,
    occupiedCells?: GridCellOffset[],
  ): void {
    for (const cell of this.occupiedCellsFor(colSpan, rowSpan, occupiedCells)) {
      this.cells.set(this.key(col + cell.col, row + cell.row), entityId);
    }
  }

  /** Remove an entity from all its spanned cells */
  removeSpan(col: number, row: number, colSpan: number, rowSpan: number): void {
    this.removeShape(col, row, colSpan, rowSpan);
  }

  /** Remove an entity from all occupied cells in an arbitrary shape. */
  removeShape(
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    occupiedCells?: GridCellOffset[],
  ): void {
    for (const cell of this.occupiedCellsFor(colSpan, rowSpan, occupiedCells)) {
      this.cells.delete(this.key(col + cell.col, row + cell.row));
    }
  }

  /** Check if all cells in a span are free */
  isSpanFree(col: number, row: number, colSpan: number, rowSpan: number): boolean {
    return this.isShapeFree(col, row, colSpan, rowSpan);
  }

  /** Check if all cells in an arbitrary shape are free. */
  isShapeFree(
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    occupiedCells?: GridCellOffset[],
  ): boolean {
    for (const cell of this.occupiedCellsFor(colSpan, rowSpan, occupiedCells)) {
      if (this.isOccupied(col + cell.col, row + cell.row)) return false;
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
    return this.findFreeShapeInDirection(startCol, startRow, direction, colSpan, rowSpan, undefined, maxSteps);
  }

  /** Find first free arbitrary shape walking in a direction. */
  findFreeShapeInDirection(
    startCol: number,
    startRow: number,
    direction: Direction,
    colSpan: number,
    rowSpan: number,
    occupiedCells?: GridCellOffset[],
    maxSteps: number = 50,
  ): { col: number; row: number } | null {
    const vec = DIRECTION_VECTORS[direction];
    let col = startCol + vec.x;
    let row = startRow + vec.y;

    for (let i = 0; i < maxSteps; i++) {
      if (this.isShapeFree(col, row, colSpan, rowSpan, occupiedCells)) {
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
    return this.freeNeighborsAroundShape(col, row, colSpan, rowSpan);
  }

  /** Get one free neighboring cell per direction around an arbitrary shape. */
  freeNeighborsAroundShape(
    col: number,
    row: number,
    colSpan: number,
    rowSpan: number,
    occupiedCells?: GridCellOffset[],
  ): { col: number; row: number; direction: Direction }[] {
    const result: { col: number; row: number; direction: Direction }[] = [];
    const occupied = this.occupiedCellsFor(colSpan, rowSpan, occupiedCells);
    const occupiedSet = new Set(occupied.map((cell) => this.key(cell.col, cell.row)));

    const candidates = new Map<Direction, { col: number; row: number; score: number }>();
    for (const cell of occupied) {
      const neighborChecks: { direction: Direction; col: number; row: number; score: number }[] = [
        { direction: Direction.Up, col: col + cell.col, row: row + cell.row - 1, score: cell.row * 100 + cell.col },
        { direction: Direction.Down, col: col + cell.col, row: row + cell.row + 1, score: (rowSpan - cell.row) * 100 + cell.col },
        { direction: Direction.Left, col: col + cell.col - 1, row: row + cell.row, score: cell.col * 100 + cell.row },
        { direction: Direction.Right, col: col + cell.col + 1, row: row + cell.row, score: (colSpan - cell.col) * 100 + cell.row },
      ];

      for (const candidate of neighborChecks) {
        const localCol = candidate.col - col;
        const localRow = candidate.row - row;
        if (occupiedSet.has(this.key(localCol, localRow))) continue;
        if (!this.isFree(candidate.col, candidate.row)) continue;

        const existing = candidates.get(candidate.direction);
        if (!existing || candidate.score < existing.score) {
          candidates.set(candidate.direction, candidate);
        }
      }
    }

    for (const direction of [Direction.Up, Direction.Down, Direction.Left, Direction.Right]) {
      const candidate = candidates.get(direction);
      if (candidate) {
        result.push({ col: candidate.col, row: candidate.row, direction });
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
